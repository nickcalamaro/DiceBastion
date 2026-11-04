/**
 * Card database proxies for buyback smart-search.
 * Magic names and printings come from the local catalog. Riftbound still uses Scrydex.
 * Never return prices to the client.
 */

import { nameKey } from './mtgjson-import.js'

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

function catalogUpdating() {
  const err = new Error('catalog_updating')
  err.status = 503
  return err
}

async function assertCatalog(env) {
  let row
  try {
    row = await env.DB.prepare('SELECT print_count FROM mtg_catalog WHERE id = 1').first()
  } catch (e) {
    if (/no such table/i.test(String(e?.message || e))) throw catalogUpdating()
    throw e
  }
  if (!row || Number(row.print_count) <= 0) throw catalogUpdating()
}

function mapPrinting(row) {
  const printed = row.printed_name && row.printed_name !== row.name ? String(row.printed_name) : null
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    printed_name: printed,
    lang: row.lang ? String(row.lang) : null,
    set_code: row.set_code ? String(row.set_code) : null,
    set_name: row.set_name ? String(row.set_name) : null,
    collector_number: row.collector_number != null ? String(row.collector_number) : null,
    image_url: row.image_url || null
  }
}

async function searchMtgCatalog(env, query) {
  await assertCatalog(env)
  const q = nameKey(query).replace(/[%_\\]/g, '')
  if (q.length < 2) return []
  const { results } = await env.DB.prepare(`
    SELECT p.scryfall_id AS id, p.name, p.printed_name, p.lang, p.set_code, p.set_name,
           p.collector_number, p.image_url, p.name_key
    FROM mtg_printings p
    JOIN (
      SELECT name_key, MAX(released_at) AS released_at
      FROM mtg_printings
      WHERE name_key LIKE ?1 OR instr(name_key, ?2) > 0
      GROUP BY name_key
    ) m ON m.name_key = p.name_key
       AND ((m.released_at = p.released_at) OR (m.released_at IS NULL AND p.released_at IS NULL))
    ORDER BY
      CASE WHEN p.name_key = ?3 THEN 0 WHEN p.name_key LIKE ?1 THEN 1 ELSE 2 END,
      length(p.name_key),
      p.name
    LIMIT 24
  `).bind(`${q}%`, ` ${q}`, q).all()

  const seen = new Set()
  const out = []
  for (const row of results || []) {
    if (seen.has(row.name_key)) continue
    seen.add(row.name_key)
    out.push(mapPrinting(row))
    if (out.length === 8) break
  }
  return out
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
 * All printings of one MTG card, loaded after the customer picks a name.
 * Newest first. Does not include every language reprint of the same printing.
 *
 * @param {object} env
 * @param {'mtg'|'riftbound'} game
 * @param {string} cardId Scryfall card UUID from search results
 */
export async function listBuybackPrints(env, game, cardId) {
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

  await assertCatalog(env)
  const { results } = await env.DB.prepare(`
    SELECT scryfall_id AS id, name, printed_name, lang, set_code, set_name, collector_number, image_url
    FROM mtg_printings
    WHERE oracle_id = (SELECT oracle_id FROM mtg_printings WHERE scryfall_id = ?1)
    ORDER BY released_at DESC, set_code, collector_number
  `).bind(id).all()
  if (!results?.length) {
    const err = new Error('card_not_found')
    err.status = 404
    throw err
  }
  return results.map(mapPrinting)
}

export function buybackCardFailure(error, fallback) {
  if (error?.message === 'catalog_updating') {
    return {
      status: 503,
      body: {
        error: 'catalog_updating',
        message: 'The card list is updating. Please try again shortly.'
      }
    }
  }
  const status = error?.status || 500
  const message = error?.message === 'prints_mtg_only'
    ? 'Versions are available for Magic: The Gathering cards.'
    : undefined
  return {
    status: status >= 400 && status < 600 ? status : 500,
    body: { error: error?.message || fallback, message }
  }
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
  if (g === 'mtg') results = await searchMtgCatalog(env, query)
  else results = await searchScrydex(env, query)

  cacheSet(cacheKey, results)
  return results
}
