/**
 * Barcode (GTIN) product lookup for the admin product form.
 * Providers are tried in order; each returns a normalised product or null when not found.
 */

const FOUND_TTL_SECONDS = 30 * 24 * 60 * 60
const NOT_FOUND_TTL_SECONDS = 24 * 60 * 60
const CACHE_ORIGIN = 'https://barcode-lookup.cache'
const SUMMARY_MAX = 160

export class BarcodeQuotaError extends Error {
  constructor(source, resetAt) {
    super('quota_exceeded')
    this.source = source
    this.resetAt = resetAt
  }
}

/** Returns the GTIN digits when length and check digit are valid, otherwise null. */
export function validateGtin(raw) {
  const digits = String(raw == null ? '' : raw).replace(/\D/g, '')
  if (![8, 12, 13, 14].includes(digits.length)) return null
  let sum = 0
  for (let i = digits.length - 2, weight = 3; i >= 0; i--, weight = weight === 3 ? 1 : 3) {
    sum += Number(digits[i]) * weight
  }
  const check = (10 - (sum % 10)) % 10
  return check === Number(digits[digits.length - 1]) ? digits : null
}

function cleanText(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim()
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function summarise(text) {
  const clean = cleanText(text)
  if (!clean) return ''
  const sentence = clean.match(/^.+?[.!?](\s|$)/)
  const first = sentence ? sentence[0].trim() : clean
  if (first.length <= SUMMARY_MAX) return first
  return clean.slice(0, SUMMARY_MAX - 3).replace(/\s+\S*$/, '') + '...'
}

function plainTextToHtml(text) {
  const paragraphs = String(text || '')
    .split(/\n{2,}|\r\n\r\n/)
    .map(cleanText)
    .filter(Boolean)
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')
}

function toAmount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null
}

function parseResetHeader(res) {
  const reset = Number(res.headers.get('X-RateLimit-Reset'))
  return Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000).toISOString() : null
}

function parseRemainingHeader(res) {
  const remaining = res.headers.get('X-RateLimit-Remaining')
  if (remaining == null || remaining === '') return null
  const n = Number(remaining)
  return Number.isFinite(n) ? n : null
}

async function lookupUpcitemdb(gtin, env) {
  const key = env.UPCITEMDB_API_KEY
  const url = key
    ? `https://api.upcitemdb.com/prod/v1/lookup?upc=${gtin}`
    : `https://api.upcitemdb.com/prod/trial/lookup?upc=${gtin}`
  const headers = { Accept: 'application/json', 'User-Agent': 'DiceBastion-Admin/1.0' }
  if (key) {
    headers.user_key = key
    headers.key_type = '3scale'
  }

  const res = await fetch(url, { headers })
  const quotaRemaining = parseRemainingHeader(res)
  const body = await res.json().catch(() => ({}))

  if (res.status === 429 || body.code === 'TOO_FAST' || body.code === 'EXCEED_LIMIT') {
    throw new BarcodeQuotaError('UPCitemdb', parseResetHeader(res))
  }
  if (res.status === 400 || body.code === 'INVALID_UPC') {
    return { product: null, quotaRemaining }
  }
  if (!res.ok) {
    throw new Error(`upcitemdb_${res.status}`)
  }

  const item = Array.isArray(body.items) ? body.items[0] : null
  if (!item) return { product: null, quotaRemaining }

  const offers = Array.isArray(item.offers) ? item.offers : []
  const low = toAmount(item.lowest_recorded_price)
  const high = toAmount(item.highest_recorded_price)
  const currency = cleanText(item.currency) || cleanText(offers[0]?.currency) || 'USD'
  const categoryHints = cleanText(item.category)
    .split('>')
    .map(cleanText)
    .filter(Boolean)
    .slice(-2)
    .reverse()

  return {
    quotaRemaining,
    product: {
      name: cleanText(item.title),
      brand: cleanText(item.brand),
      summary: summarise(item.description),
      descriptionHtml: plainTextToHtml(item.description),
      imageUrls: (Array.isArray(item.images) ? item.images : [])
        .map(cleanText)
        .filter((u) => /^https?:\/\//i.test(u)),
      categoryHints,
      priceHint: low || high ? { low, high, currency } : null,
      source: 'UPCitemdb'
    }
  }
}

const PROVIDERS = [
  { id: 'upcitemdb', label: 'UPCitemdb', lookup: lookupUpcitemdb }
]

function cacheRequest(providerId, gtin) {
  return new Request(`${CACHE_ORIGIN}/${providerId}/${gtin}`)
}

async function readCache(providerId, gtin) {
  try {
    const hit = await caches.default.match(cacheRequest(providerId, gtin))
    return hit ? await hit.json() : null
  } catch {
    return null
  }
}

async function writeCache(providerId, gtin, value, ttl, ctx) {
  try {
    const res = new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${ttl}` }
    })
    const put = caches.default.put(cacheRequest(providerId, gtin), res)
    if (ctx?.waitUntil) ctx.waitUntil(put)
    else await put
  } catch {}
}

/**
 * Looks up a GTIN across providers.
 * Returns { product, cached, quotaRemaining, checked[] }; product is null when no provider knows the code.
 * Throws BarcodeQuotaError when every provider that had no cached answer is out of quota.
 */
export async function lookupBarcode(gtin, env, ctx) {
  const checked = []
  let quotaRemaining = null
  let quotaError = null

  for (const provider of PROVIDERS) {
    const cached = await readCache(provider.id, gtin)
    if (cached) {
      checked.push(provider.label)
      if (cached.product) return { product: cached.product, cached: true, quotaRemaining: null, checked }
      continue
    }

    try {
      const result = await provider.lookup(gtin, env)
      checked.push(provider.label)
      if (result.quotaRemaining != null) quotaRemaining = result.quotaRemaining
      const ttl = result.product ? FOUND_TTL_SECONDS : NOT_FOUND_TTL_SECONDS
      await writeCache(provider.id, gtin, { product: result.product }, ttl, ctx)
      if (result.product) return { product: result.product, cached: false, quotaRemaining, checked }
    } catch (e) {
      if (e instanceof BarcodeQuotaError) {
        quotaError = e
        continue
      }
      console.error(`Barcode lookup via ${provider.label} failed:`, e)
    }
  }

  if (quotaError && checked.length === 0) throw quotaError
  return { product: null, cached: false, quotaRemaining, checked }
}
