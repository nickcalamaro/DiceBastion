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

function cacheGet(key) {
  const hit = searchCache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    searchCache.delete(key)
    return null
  }
  return hit.data
}

function cacheSet(key, data) {
  if (searchCache.size > 200) {
    const first = searchCache.keys().next().value
    searchCache.delete(first)
  }
  searchCache.set(key, { at: Date.now(), data })
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
  const autoRes = await fetch(autoUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': SCRYFALL_UA
    }
  })
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
    const searchRes = await fetch(searchUrl, {
      headers: { Accept: 'application/json', 'User-Agent': SCRYFALL_UA }
    })
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
      const namedRes = await fetch(namedUrl, {
        headers: { Accept: 'application/json', 'User-Agent': SCRYFALL_UA }
      })
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
