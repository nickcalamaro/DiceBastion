/**
 * Card database proxies for buyback smart-search.
 * Never return prices to the client.
 */

const SCRYFALL_UA = 'DiceBastionBuyback/1.0 (https://dicebastion.com; contact@dicebastion.com)'

export const BUYBACK_CONDITIONS = [
  { code: 'MT', label: 'Mint (MT)' },
  { code: 'NM', label: 'Near Mint (NM)' },
  { code: 'EX', label: 'Excellent (EX)' },
  { code: 'GD', label: 'Good (GD)' },
  { code: 'LP', label: 'Light Played (LP)' },
  { code: 'PL', label: 'Played (PL)' },
  { code: 'PO', label: 'Poor (PO)' }
]

export const BUYBACK_LANGUAGES = [
  { code: 'EN', label: 'English' },
  { code: 'DE', label: 'German' },
  { code: 'FR', label: 'French' },
  { code: 'IT', label: 'Italian' },
  { code: 'ES', label: 'Spanish' },
  { code: 'PT', label: 'Portuguese' },
  { code: 'JA', label: 'Japanese' },
  { code: 'KO', label: 'Korean' },
  { code: 'RU', label: 'Russian' },
  { code: 'ZH', label: 'Chinese' }
]

export const BUYBACK_GAMES = [
  { code: 'mtg', label: 'Magic: The Gathering', searchReady: true },
  { code: 'riftbound', label: 'Riftbound', searchReady: null } // readiness depends on env keys
]

/** @type {Map<string, { at: number, data: object }>} */
const searchCache = new Map()
const CACHE_TTL_MS = 60_000

const PRINTS_CACHE_TTL_MS = 10 * 60 * 1000
const MAX_PRINT_PAGES = 4

function cacheGet(key) {
  const hit = searchCache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > (hit.ttl || CACHE_TTL_MS)) {
    searchCache.delete(key)
    return null
  }
  return hit.data
}

function cacheSet(key, data, ttl) {
  if (searchCache.size > 200) {
    const first = searchCache.keys().next().value
    searchCache.delete(first)
  }
  searchCache.set(key, { at: Date.now(), data, ttl: ttl || CACHE_TTL_MS })
}

function scryfallHeaders() {
  return {
    Accept: 'application/json',
    'User-Agent': SCRYFALL_UA
  }
}

function assertScryfallUrl(url) {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'api.scryfall.com') {
    const err = new Error('scryfall_bad_url')
    err.status = 502
    throw err
  }
  return parsed.toString()
}

/**
 * @param {object} env
 * @returns {boolean}
 */
export function isRiftboundSearchConfigured(env) {
  return !!(env?.SCRYDEX_API_KEY && env?.SCRYDEX_TEAM_ID)
}

/**
 * @param {object} env
 */
export function listBuybackMeta(env) {
  return {
    conditions: BUYBACK_CONDITIONS,
    languages: BUYBACK_LANGUAGES,
    games: BUYBACK_GAMES.map(g => ({
      ...g,
      searchReady: g.code === 'riftbound' ? isRiftboundSearchConfigured(env) : true
    }))
  }
}

function stripPrices(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(stripPrices)
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (/price/i.test(k)) continue
    out[k] = stripPrices(v)
  }
  return out
}

/**
 * Normalize to client card shape (no prices).
 */
function normalizeCard({ id, name, setCode, setName, collectorNumber, imageUrl }) {
  return {
    id: String(id || ''),
    name: String(name || ''),
    set_code: setCode ? String(setCode) : null,
    set_name: setName ? String(setName) : null,
    collector_number: collectorNumber != null ? String(collectorNumber) : null,
    image_url: imageUrl || null
  }
}

async function searchScryfall(q) {
  const query = String(q || '').trim()
  if (query.length < 2) return []

  // Autocomplete for typeahead names
  const autoUrl = `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`
  const autoRes = await fetch(autoUrl, { headers: scryfallHeaders() })
  if (autoRes.status === 429) {
    const err = new Error('scryfall_rate_limited')
    err.status = 429
    throw err
  }
  if (!autoRes.ok) {
    const err = new Error('scryfall_autocomplete_failed')
    err.status = 502
    throw err
  }
  const autoJson = await autoRes.json()
  const names = (autoJson?.data || []).slice(0, 8)
  if (!names.length) {
    // Fallback: fuzzy search
    const searchUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=name`
    const searchRes = await fetch(searchUrl, { headers: scryfallHeaders() })
    if (searchRes.status === 404) return []
    if (searchRes.status === 429) {
      const err = new Error('scryfall_rate_limited')
      err.status = 429
      throw err
    }
    if (!searchRes.ok) return []
    const searchJson = await searchRes.json()
    return (searchJson.data || []).slice(0, 12).map(card =>
      normalizeCard({
        id: card.id,
        name: card.name,
        setCode: card.set,
        setName: card.set_name,
        collectorNumber: card.collector_number,
        imageUrl: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || null
      })
    )
  }

  // Resolve each autocomplete name to a print (named + fuzzy)
  const results = []
  for (const name of names) {
    const namedUrl = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
    try {
      const namedRes = await fetch(namedUrl, { headers: scryfallHeaders() })
      if (namedRes.status === 429) {
        const err = new Error('scryfall_rate_limited')
        err.status = 429
        throw err
      }
      if (!namedRes.ok) continue
      const card = await namedRes.json()
      results.push(
        normalizeCard({
          id: card.id,
          name: card.name,
          setCode: card.set,
          setName: card.set_name,
          collectorNumber: card.collector_number,
          imageUrl: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || null
        })
      )
    } catch (e) {
      if (e.status === 429) throw e
    }
    // Soft pace under Scryfall named limit (2/s)
    await new Promise(r => setTimeout(r, 120))
  }
  return results
}

async function searchScrydex(env, q) {
  const query = String(q || '').trim()
  if (query.length < 2) return []
  if (!isRiftboundSearchConfigured(env)) {
    const err = new Error('riftbound_not_configured')
    err.status = 503
    throw err
  }

  const url = `https://api.scrydex.com/riftbound/v1/cards?q=${encodeURIComponent(`name:${query}*`)}&page_size=12&select=id,name,number,printed_number,images,expansion`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Api-Key': env.SCRYDEX_API_KEY,
      'X-Team-ID': env.SCRYDEX_TEAM_ID
    }
  })
  if (res.status === 429) {
    const err = new Error('scrydex_rate_limited')
    err.status = 429
    throw err
  }
  if (!res.ok) {
    const err = new Error('scrydex_search_failed')
    err.status = 502
    throw err
  }
  const json = stripPrices(await res.json())
  const rows = json?.data || []
  return rows.map(card =>
    normalizeCard({
      id: card.id,
      name: card.name,
      setCode: card.expansion?.code || card.expansion?.id || null,
      setName: card.expansion?.name || null,
      collectorNumber: card.printed_number || card.number || null,
      imageUrl: card.images?.[0]?.small || card.images?.[0]?.medium || null
    })
  )
}

function scryfallImage(card) {
  return card?.image_uris?.small || card?.card_faces?.[0]?.image_uris?.small || null
}

function mapScryfallPrint(card) {
  const printed = card.printed_name && card.printed_name !== card.name
    ? String(card.printed_name)
    : null
  return {
    id: String(card.id || ''),
    name: String(card.name || ''),
    printed_name: printed,
    lang: card.lang ? String(card.lang) : null,
    set_code: card.set ? String(card.set) : null,
    set_name: card.set_name ? String(card.set_name) : null,
    collector_number: card.collector_number != null ? String(card.collector_number) : null,
    image_url: scryfallImage(card)
  }
}

async function fetchScryfallPrintPages(startUrl) {
  const prints = []
  let url = assertScryfallUrl(startUrl)
  for (let page = 0; page < MAX_PRINT_PAGES; page++) {
    if (page > 0) await new Promise(r => setTimeout(r, 100))
    const res = await fetch(url, { headers: scryfallHeaders() })
    if (res.status === 429) {
      const err = new Error('scryfall_rate_limited')
      err.status = 429
      throw err
    }
    if (res.status === 404) return prints
    if (!res.ok) {
      const err = new Error('scryfall_prints_failed')
      err.status = 502
      throw err
    }
    const json = await res.json()
    for (const card of json.data || []) prints.push(mapScryfallPrint(card))
    if (!json.has_more || !json.next_page) break
    url = assertScryfallUrl(json.next_page)
  }
  return prints
}

/**
 * All printings of one MTG card, loaded after the customer picks a name.
 * Uses Scryfall's oracle print list (the same table as the card page), newest first.
 * Does not include every language reprint of the same printing.
 *
 * @param {'mtg'|'riftbound'} game
 * @param {string} cardId Scryfall card UUID from search results
 */
export async function listBuybackPrints(game, cardId) {
  const g = String(game || '').toLowerCase()
  if (g !== 'mtg') {
    const err = new Error('prints_mtg_only')
    err.status = 400
    throw err
  }
  const id = String(cardId || '').trim().toLowerCase()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
    const err = new Error('invalid_card_id')
    err.status = 400
    throw err
  }

  const byCard = cacheGet(`prints:card:${id}`)
  if (byCard) return byCard

  const cardRes = await fetch(`https://api.scryfall.com/cards/${id}`, { headers: scryfallHeaders() })
  if (cardRes.status === 404) {
    const err = new Error('card_not_found')
    err.status = 404
    throw err
  }
  if (cardRes.status === 429) {
    const err = new Error('scryfall_rate_limited')
    err.status = 429
    throw err
  }
  if (!cardRes.ok) {
    const err = new Error('scryfall_prints_failed')
    err.status = 502
    throw err
  }
  const card = await cardRes.json()
  const oracleId = card.oracle_id ? String(card.oracle_id) : ''
  const cacheKey = oracleId ? `prints:${oracleId}` : ''
  const cached = cacheKey ? cacheGet(cacheKey) : null
  if (cached) {
    cacheSet(`prints:card:${id}`, cached, PRINTS_CACHE_TTL_MS)
    return cached
  }

  const searchUrl = card.prints_search_uri
  if (!searchUrl) {
    const err = new Error('scryfall_prints_failed')
    err.status = 502
    throw err
  }
  const prints = await fetchScryfallPrintPages(searchUrl)
  if (cacheKey) cacheSet(cacheKey, prints, PRINTS_CACHE_TTL_MS)
  cacheSet(`prints:card:${id}`, prints, PRINTS_CACHE_TTL_MS)
  return prints
}

/**
 * @param {object} env
 * @param {'mtg'|'riftbound'} game
 * @param {string} q
 */
export async function searchBuybackCards(env, game, q) {
  const g = String(game || '').toLowerCase()
  const query = String(q || '').trim().slice(0, 120)
  if (!['mtg', 'riftbound'].includes(g)) {
    const err = new Error('invalid_game')
    err.status = 400
    throw err
  }
  if (query.length < 2) return []

  const cacheKey = `${g}:${query.toLowerCase()}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  let results
  if (g === 'mtg') results = await searchScryfall(query)
  else results = await searchScrydex(env, query)

  cacheSet(cacheKey, results)
  return results
}
