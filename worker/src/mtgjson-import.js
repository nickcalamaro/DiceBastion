/**
 * Pure helpers for the weekly MTGJSON catalog import.
 * The GitHub Action owns the download. The Worker only reads the resulting rows.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Sets released inside this window may still change spoiler names and scans. */
export const RECENT_SET_DAYS = 21

const LANG = {
  English: 'en',
  German: 'de',
  French: 'fr',
  Italian: 'it',
  Spanish: 'es',
  Portuguese: 'pt',
  Japanese: 'ja',
  Korean: 'ko',
  Russian: 'ru',
  'Chinese Simplified': 'zhs',
  'Chinese Traditional': 'zht',
  Phyrexian: 'ph',
  Hebrew: 'he',
  Latin: 'la',
  Arabic: 'ar',
  Greek: 'grc',
  'Ancient Greek': 'grc',
  Sanskrit: 'sa'
}

const SKIP_LAYOUTS = new Set(['token', 'double_faced_token', 'emblem'])
const SKIP_SET_TYPES = new Set(['token', 'memorabilia'])

const PRINTING_COLS = [
  'scryfall_id',
  'oracle_id',
  'name',
  'name_key',
  'printed_name',
  'lang',
  'set_code',
  'set_name',
  'collector_number',
  'released_at',
  'image_url'
]

export function nameKey(name) {
  return String(name || '').toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Exclusive end of a text prefix, so an index can answer "starts with" without a scan. */
export function prefixEnd(prefix) {
  const chars = [...String(prefix || '')]
  for (let i = chars.length - 1; i >= 0; i--) {
    const code = chars[i].codePointAt(0)
    if (code < 0x10ffff) {
      chars[i] = String.fromCodePoint(code + 1)
      return chars.slice(0, i + 1).join('')
    }
  }
  return null
}

export function nameWords(key) {
  return [...new Set(String(key || '').split(' ').filter(word => word.length >= 2))]
}

/** One search row per card name, keeping the newest printing. */
export function namesFromRows(rows) {
  const byName = new Map()
  for (const row of rows || []) {
    if (!row?.name_key) continue
    const prev = byName.get(row.name_key)
    if (!prev || String(row.released_at || '') >= String(prev.released_at || '')) byName.set(row.name_key, row)
  }
  return [...byName.values()]
}

export function wordRows(names) {
  const out = []
  const seen = new Set()
  for (const row of names || []) {
    for (const word of nameWords(row.name_key)) {
      const key = `${word}\0${row.name_key}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ word, name_key: row.name_key })
    }
  }
  return out
}

export function sqlText(value) {
  if (value == null || value === '') return 'NULL'
  return `'${String(value).replace(/'/g, "''").replace(/[\0\r\n]/g, ' ')}'`
}

/**
 * Which set files to download this week.
 * knownByCode is keyed by set code. allowUpdate is true only for previews and the last 21 days.
 *
 * @param {object[]} sets SetList rows
 * @param {Record<string, { total_set_size?: number }>} knownByCode
 * @param {string} todayIso YYYY-MM-DD
 */
export function setsToSync(sets, knownByCode, todayIso) {
  const today = String(todayIso || '').slice(0, 10)
  const out = []
  for (const set of sets || []) {
    if (!set || set.isOnlineOnly) continue
    if (SKIP_SET_TYPES.has(String(set.type || ''))) continue
    const code = String(set.code || '').toUpperCase()
    if (!/^[A-Z0-9]{2,8}$/.test(code)) continue
    const known = knownByCode?.[code]
    const recent = set.isPartialPreview === true || daysSinceRelease(set.releaseDate, today) <= RECENT_SET_DAYS
    const size = Number(set.totalSetSize) || 0
    const grown = !!(known && size > Number(known.total_set_size || 0))
    if (!known || grown || recent) {
      out.push({
        code,
        name: set.name || code,
        releaseDate: set.releaseDate || null,
        totalSetSize: size,
        allowUpdate: recent
      })
    }
  }
  return out
}

function daysSinceRelease(release, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(release || '')) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return 9999
  const a = Date.parse(`${release}T00:00:00Z`)
  const b = Date.parse(`${today}T00:00:00Z`)
  return Math.round((b - a) / 86400000)
}

/**
 * One catalog row from an MTGJSON set card, or null when it is not a paper printing we can show.
 * Does not expand foreignData, so a language reprint of the same printing is not a second row.
 */
export function mapSetCard(set, card) {
  if (!card || SKIP_LAYOUTS.has(card.layout)) return null
  const availability = card.availability
  if (Array.isArray(availability) && availability.length && !availability.includes('paper')) return null
  const id = String(card.identifiers?.scryfallId || '').toLowerCase()
  const oracleId = String(card.identifiers?.scryfallOracleId || '').toLowerCase()
  if (!UUID.test(id) || !UUID.test(oracleId)) return null
  const name = String(card.name || '').trim()
  if (!name) return null
  const printed = card.printedName && card.printedName !== name ? String(card.printedName) : null
  const language = card.language || 'English'
  return {
    scryfall_id: id,
    oracle_id: oracleId,
    name,
    name_key: nameKey(name),
    printed_name: printed,
    lang: LANG[language] || null,
    set_code: String(card.setCode || set?.code || '').toLowerCase() || null,
    set_name: set?.name || null,
    collector_number: card.number != null ? String(card.number) : null,
    released_at: card.releaseDate || set?.releaseDate || null,
    image_url: null
  }
}

/** Official WebP thumb from a Scryfall card object. Anything else is dropped. */
export function thumbFromScryfall(card) {
  const uri = card?.image_uris?.thumb || card?.card_faces?.[0]?.image_uris?.thumb
  if (typeof uri !== 'string' || !uri) return null
  let parsed
  try {
    parsed = new URL(uri)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.scryfall.io')) return null
  return parsed.toString()
}

export function rowsFromSet(set) {
  const byId = new Map()
  for (const card of set?.cards || []) {
    const row = mapSetCard(set, card)
    if (row) byId.set(row.scryfall_id, row)
  }
  return [...byId.values()]
}

/**
 * @param {object[]} rows
 * @param {'ignore'|'upsert'} mode ignore inserts new ids only. upsert refreshes a recent set.
 */
export function printingInsertSql(rows, mode) {
  if (!rows?.length) return null
  const values = rows.map(row => `(${PRINTING_COLS.map(col => sqlText(row[col])).join(', ')})`).join(',\n')
  const head = mode === 'ignore' ? 'INSERT OR IGNORE' : 'INSERT'
  const insert = `${head} INTO mtg_printings (${PRINTING_COLS.join(', ')}) VALUES\n${values}`
  if (mode === 'ignore') return insert
  return `${insert}
ON CONFLICT(scryfall_id) DO UPDATE SET
  oracle_id = excluded.oracle_id,
  name = excluded.name,
  name_key = excluded.name_key,
  printed_name = excluded.printed_name,
  lang = excluded.lang,
  set_code = excluded.set_code,
  set_name = excluded.set_name,
  collector_number = excluded.collector_number,
  released_at = excluded.released_at,
  image_url = COALESCE(excluded.image_url, mtg_printings.image_url)`
}

const NAME_COLS = [
  'name_key',
  'name',
  'scryfall_id',
  'printed_name',
  'lang',
  'set_code',
  'set_name',
  'collector_number',
  'released_at',
  'image_url'
]

export function nameUpsertSql(rows) {
  if (!rows?.length) return null
  const values = rows.map(row => `(${NAME_COLS.map(col => sqlText(row[col])).join(', ')})`).join(',\n')
  return `INSERT INTO mtg_names (${NAME_COLS.join(', ')}) VALUES
${values}
ON CONFLICT(name_key) DO UPDATE SET
  name = excluded.name,
  scryfall_id = excluded.scryfall_id,
  printed_name = excluded.printed_name,
  lang = excluded.lang,
  set_code = excluded.set_code,
  set_name = excluded.set_name,
  collector_number = excluded.collector_number,
  released_at = excluded.released_at,
  image_url = COALESCE(excluded.image_url, mtg_names.image_url)
WHERE excluded.released_at >= mtg_names.released_at
   OR mtg_names.released_at IS NULL`
}

export function wordInsertSql(rows) {
  if (!rows?.length) return null
  const values = rows.map(row => `(${sqlText(row.word)}, ${sqlText(row.name_key)})`).join(',\n')
  return `INSERT OR IGNORE INTO mtg_name_words (word, name_key) VALUES
${values}`
}

export function setUpsertSql(sets, importedAt) {
  if (!sets?.length) return null
  const values = sets.map(set => `(${[
    sqlText(set.code),
    sqlText(set.name),
    sqlText(set.releaseDate || set.release_date || null),
    Number(set.totalSetSize ?? set.total_set_size) || 0,
    sqlText(importedAt)
  ].join(', ')})`).join(',\n')
  return `INSERT INTO mtg_sets (code, name, release_date, total_set_size, imported_at) VALUES
${values}
ON CONFLICT(code) DO UPDATE SET
  name = excluded.name,
  release_date = excluded.release_date,
  total_set_size = excluded.total_set_size,
  imported_at = excluded.imported_at`
}
