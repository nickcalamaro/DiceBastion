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

export class BarcodeCatalogError extends Error {
  constructor(source) {
    super('catalog_unauthorized')
    this.source = source
  }
}

/** Turns a BoardGameGeek thing description into plain text. */
export function descriptionFromBggXml(xml) {
  const match = String(xml || '').match(/<description>([\s\S]*?)<\/description>/i)
  if (!match) return ''
  return match[1]
    .replace(/&amp;/g, '&')
    .replace(/&#10;|&#13;/g, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 6000)
}

async function fetchBggDescription(gameId, token) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${encodeURIComponent(gameId)}&type=boardgame,boardgameexpansion`
  const headers = {
    Accept: 'application/xml',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'DiceBastion-Admin/1.0'
  }
  let res = await fetch(url, { headers })
  if (res.status === 202) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    res = await fetch(url, { headers })
  }
  if (!res.ok) return ''
  return descriptionFromBggXml(await res.text())
}

function bestBggMatch(body) {
  const matches = Array.isArray(body?.bgg_info) ? body.bgg_info : []
  if (!matches.length) return null
  if (body.bgg_info_status === 'verified') return matches[0]
  const ranked = [...matches].sort((a, b) => (Number(b.confidence) || 0) - (Number(a.confidence) || 0))
  return (Number(ranked[0].confidence) || 0) >= 80 ? ranked[0] : null
}

// The public test host expects this placeholder. A real account key is not required.
const GAMEUPC_TEST_KEY = 'test_test_test_test_test'

/**
 * Board-game barcode catalog (GameUPC test API).
 * BGG_API_TOKEN, when set, adds the description and summary from BoardGameGeek.
 */
async function lookupGameUpc(gtin, env) {
  const res = await fetch(`https://api.gameupc.com/test/upc/${encodeURIComponent(gtin)}`, {
    headers: {
      Accept: 'application/json',
      'x-api-key': GAMEUPC_TEST_KEY,
      'User-Agent': 'DiceBastion-Admin/1.0'
    }
  })
  if (res.status === 401 || res.status === 403) throw new BarcodeCatalogError('GameUPC')
  if (res.status === 404) return { product: null }
  if (res.status === 429) throw new BarcodeQuotaError('GameUPC', null)
  if (!res.ok) throw new Error(`gameupc_${res.status}`)

  const body = await res.json().catch(() => ({}))
  const name = cleanText(body.name)
  if (!name || body.status === 'not_found') return { product: null }

  const match = bestBggMatch(body)
  const description = match?.id && env.BGG_API_TOKEN
    ? await fetchBggDescription(match.id, env.BGG_API_TOKEN)
    : ''
  const image = cleanText(match?.image_url) || cleanText(match?.thumbnail_url)

  return {
    product: {
      name: cleanText(match?.name) || name,
      brand: '',
      summary: summarise(description),
      descriptionHtml: description ? plainTextToHtml(description) : '',
      imageUrls: /^https?:\/\//i.test(image) ? [image] : [],
      categoryHints: ['Board games'],
      priceHint: null,
      source: 'GameUPC'
    }
  }
}

/** EAN-Data accepts 8, 12 or 13 digits. A GTIN-14 with a leading zero is the EAN-13. */
function eandataCode(gtin) {
  if (gtin.length === 14 && gtin.startsWith('0')) return gtin.slice(1)
  return gtin
}

/**
 * General retail catalog (packs, decks, and anything else with a barcode).
 * Used when EANDATA_KEYCODE is set. https://eandata.com/feed/
 */
async function lookupEandata(gtin, env) {
  const key = env.EANDATA_KEYCODE
  if (!key) return { product: null, skipped: true }
  const code = eandataCode(gtin)
  if (![8, 12, 13].includes(code.length)) return { product: null }

  const res = await fetch(`https://eandata.com/feed/v3/find/${encodeURIComponent(code)}/`, {
    headers: {
      Accept: 'application/json',
      'x-api-key': key,
      'User-Agent': 'DiceBastion-Admin/1.0'
    }
  })
  const body = await res.json().catch(() => ({}))
  const statusCode = String(body?.status?.code || res.status)
  const message = cleanText(body?.status?.message)
  if (statusCode === '404' || statusCode === '500') return { product: null }
  if (statusCode === '401' || statusCode === '403') throw new BarcodeCatalogError('EAN-Data')
  if (statusCode === '429' || /limit|quota/i.test(message)) throw new BarcodeQuotaError('EAN-Data', null)
  if (statusCode !== '200') throw new Error(`eandata_${statusCode}`)

  const attrs = body?.product?.attributes || {}
  const name = cleanText(attrs.product)
  const description = cleanText(attrs.long_desc) || cleanText(attrs.description) || cleanText(attrs.features)
  const category = cleanText(attrs.category_text_long || attrs.category_text)
  const image = cleanText(body?.product?.image)
  const imageUrls = /^https?:\/\//i.test(image) ? [image] : []
  if (!name && !description && !category && !imageUrls.length) return { product: null }

  return {
    product: {
      name,
      brand: cleanText(attrs.brand) || cleanText(body?.company?.name),
      summary: summarise(description),
      descriptionHtml: description ? plainTextToHtml(description) : '',
      imageUrls,
      categoryHints: category ? [category] : [],
      priceHint: null,
      source: 'EAN-Data'
    }
  }
}

function mergeProducts(primary, extra) {
  if (!primary) return extra
  if (!extra) return primary
  const sameSource = primary.source === extra.source
  return {
    name: primary.name || extra.name,
    brand: primary.brand || extra.brand,
    summary: primary.summary || extra.summary,
    descriptionHtml: primary.descriptionHtml || extra.descriptionHtml,
    imageUrls: primary.imageUrls?.length ? primary.imageUrls : (extra.imageUrls || []),
    categoryHints: primary.categoryHints?.length ? primary.categoryHints : (extra.categoryHints || []),
    priceHint: primary.priceHint || extra.priceHint,
    source: sameSource ? primary.source : `${primary.source}, ${extra.source}`
  }
}

function providersFor(env) {
  const providers = [{ id: 'gameupc', label: 'GameUPC', lookup: lookupGameUpc }]
  if (env?.EANDATA_KEYCODE) {
    providers.push({ id: 'eandata', label: 'EAN-Data', lookup: lookupEandata })
  }
  return providers
}

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
  let catalogError = null
  let merged = null
  let anyFresh = false
  const eandataConfigured = !!env?.EANDATA_KEYCODE

  for (const provider of providersFor(env)) {
    const cached = await readCache(provider.id, gtin)
    if (cached) {
      checked.push(provider.label)
      if (cached.product) merged = mergeProducts(merged, cached.product)
      continue
    }

    try {
      const result = await provider.lookup(gtin, env)
      if (result.skipped) continue
      anyFresh = true
      checked.push(provider.label)
      if (result.quotaRemaining != null) quotaRemaining = result.quotaRemaining
      const retryForDescription = provider.id === 'gameupc'
        && result.product
        && !result.product.summary
        && !result.product.descriptionHtml
      const ttl = !result.product || retryForDescription ? NOT_FOUND_TTL_SECONDS : FOUND_TTL_SECONDS
      await writeCache(provider.id, gtin, { product: result.product }, ttl, ctx)
      if (result.product) merged = mergeProducts(merged, result.product)
    } catch (e) {
      if (e instanceof BarcodeQuotaError) {
        quotaError = e
        continue
      }
      if (e instanceof BarcodeCatalogError) {
        catalogError = e.source
        continue
      }
      console.error(`Barcode lookup via ${provider.label} failed:`, e)
    }
  }

  if (merged) {
    return {
      product: merged,
      cached: !anyFresh,
      quotaRemaining,
      checked,
      gameupcConfigured: true,
      eandataConfigured
    }
  }
  if (quotaError && checked.length === 0 && !catalogError) throw quotaError
  return {
    product: null,
    cached: false,
    quotaRemaining,
    checked,
    gameupcConfigured: true,
    eandataConfigured,
    catalogError
  }
}
