/**
 * Fill the Magic trade-in catalog from MTGJSON.
 *
 * seed   — once. Downloads AllPrintings and Scryfall Default Cards, then upserts every paper printing.
 * weekly — SetList only. Downloads a set file when it is new, larger, still in preview, or released in the last 21 days.
 *
 * Run from worker/: node scripts/mtgjson-sync.mjs
 * Requires CLOUDFLARE_API_TOKEN with D1 edit. Optional CLOUDFLARE_ACCOUNT_ID when the token sees more than one account.
 */

import { createHash } from 'crypto'
import { createReadStream, createWriteStream, mkdtempSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createInterface } from 'readline'
import { createGunzip, gunzip } from 'zlib'
import { promisify } from 'util'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import {
  printingInsertSql,
  rowsFromSet,
  setsToSync,
  setUpsertSql,
  sqlText,
  thumbFromScryfall
} from '../src/mtgjson-import.js'

const gunzipBuffer = promisify(gunzip)
const UA = 'DiceBastionBuyback/1.0 (https://dicebastion.com; contact@dicebastion.com)'
const BATCH = 40
const DATABASE_ID = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8')
  .match(/database_id\s*=\s*"([^"]+)"/)?.[1]

const SKIP_SET = new Set(['token', 'memorabilia'])

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function chunks(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

function sqlStatements(text) {
  return text
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' } })
  if (!res.ok) throw new Error(`Download failed (${res.status}) ${url}`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
}

function sha256(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    createReadStream(file)
      .on('data', chunk => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex')))
      .on('error', reject)
  })
}

async function accountId(token) {
  if (process.env.CLOUDFLARE_ACCOUNT_ID) return process.env.CLOUDFLARE_ACCOUNT_ID.trim()
  const res = await fetch('https://api.cloudflare.com/client/v4/accounts', {
    headers: { Authorization: `Bearer ${token}` }
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    throw new Error('Cloudflare account lookup failed. The API token needs Account read and D1 edit.')
  }
  const accounts = json.result || []
  if (accounts.length !== 1) {
    throw new Error('This token can see more than one Cloudflare account. Set the CLOUDFLARE_ACCOUNT_ID secret to the Dice Bastion account.')
  }
  return accounts[0].id
}

async function d1(account, token, sql) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${DATABASE_ID}/query`
  let last = ''
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql })
    })
    const json = await res.json().catch(() => ({}))
    if (res.status === 429 || res.status >= 500) {
      last = JSON.stringify(json.errors || res.status)
      await sleep(400 * (attempt + 1))
      continue
    }
    if (!res.ok || json.success === false) {
      throw new Error(`D1 query failed: ${JSON.stringify(json.errors || json).slice(0, 600)}`)
    }
    return json.result?.[0]?.results || []
  }
  throw new Error(`D1 kept failing: ${last}`)
}

async function ensureSchema(account, token) {
  const migration = readFileSync(new URL('../migrations/0018_mtg_printings.sql', import.meta.url), 'utf8')
  for (const statement of sqlStatements(migration)) {
    await d1(account, token, statement)
  }
}

async function writeRows(account, token, rows, mode) {
  let done = 0
  for (const batch of chunks(rows, BATCH)) {
    const sql = printingInsertSql(batch, mode)
    if (sql) await d1(account, token, sql)
    done += batch.length
    if (done % 2000 === 0 || done === rows.length) console.log(`[mtg] wrote ${done} of ${rows.length} (${mode})`)
  }
}

async function writeCatalog(account, token, markSeeded) {
  const rows = await d1(account, token, 'SELECT COUNT(*) AS n FROM mtg_printings')
  const n = Number(rows[0]?.n || 0)
  const now = new Date().toISOString()
  const seeded = markSeeded ? sqlText(now) : 'NULL'
  await d1(account, token, `INSERT INTO mtg_catalog (id, print_count, seeded_at, updated_at)
VALUES (1, ${n}, ${seeded}, ${sqlText(now)})
ON CONFLICT(id) DO UPDATE SET
  print_count = ${n},
  seeded_at = COALESCE(mtg_catalog.seeded_at, excluded.seeded_at),
  updated_at = excluded.updated_at`)
  console.log(`[mtg] catalog has ${n} printings`)
  return n
}

function paperSets(data) {
  const rows = []
  const sets = []
  for (const set of Object.values(data || {})) {
    if (!set || set.isOnlineOnly || SKIP_SET.has(String(set.type || ''))) continue
    const setRows = rowsFromSet(set)
    if (!setRows.length) continue
    rows.push(...setRows)
    sets.push({
      code: String(set.code || '').toUpperCase(),
      name: set.name || set.code,
      releaseDate: set.releaseDate || null,
      totalSetSize: Number(set.totalSetSize) || setRows.length
    })
  }
  return { rows, sets }
}

async function applyDefaultCards(file, byId) {
  let matched = 0
  const rl = createInterface({
    input: createReadStream(file).pipe(createGunzip()),
    crlfDelay: Infinity
  })
  for await (const line of rl) {
    if (!line) continue
    let card
    try { card = JSON.parse(line) } catch { continue }
    const row = byId.get(String(card.id || '').toLowerCase())
    if (!row) continue
    const thumb = thumbFromScryfall(card)
    if (!thumb) continue
    row.image_url = thumb
    matched++
  }
  return matched
}

async function seed(account, token, dir) {
  console.log('[mtg] downloading AllPrintings.json.gz')
  const gz = join(dir, 'AllPrintings.json.gz')
  const sumFile = join(dir, 'AllPrintings.json.gz.sha256')
  await download('https://mtgjson.com/api/v5/AllPrintings.json.gz', gz)
  await download('https://mtgjson.com/api/v5/AllPrintings.json.gz.sha256', sumFile)
  const expected = readFileSync(sumFile, 'utf8').trim().split(/\s+/)[0].toLowerCase()
  const actual = await sha256(gz)
  if (actual !== expected) throw new Error('AllPrintings hash did not match. Nothing was written.')

  console.log('[mtg] reading printings')
  const parsed = JSON.parse((await gunzipBuffer(readFileSync(gz))).toString('utf8'))
  const { rows, sets } = paperSets(parsed.data)
  console.log(`[mtg] ${rows.length} paper printings in ${sets.length} sets`)

  const byId = new Map()
  for (const row of rows) byId.set(row.scryfall_id, row)
  const unique = [...byId.values()]
  let thumbsOk = false
  try {
    console.log('[mtg] downloading Scryfall default card list for thumbnail addresses')
    const bulkRes = await fetch('https://api.scryfall.com/bulk-data', {
      headers: { Accept: 'application/json', 'User-Agent': UA }
    })
    if (bulkRes.status === 429) throw new Error('scryfall_rate_limited')
    if (!bulkRes.ok) throw new Error(`bulk-data ${bulkRes.status}`)
    const bulk = await bulkRes.json()
    const item = (bulk.data || []).find(entry => entry.type === 'default_cards')
    const uri = item?.jsonl_download_uri || item?.download_uri
    if (!uri) throw new Error('Scryfall default_cards file was missing')
    const cardsPath = join(dir, 'default-cards.jsonl.gz')
    await download(uri, cardsPath)
    const matched = await applyDefaultCards(cardsPath, byId)
    console.log(`[mtg] matched ${matched} thumbnail addresses`)
    thumbsOk = matched > 0
  } catch (error) {
    console.error('[mtg] thumbnail list failed. Card rows will still be saved.', error.message || error)
  }

  await writeRows(account, token, unique, 'upsert')
  const now = new Date().toISOString()
  for (const batch of chunks(sets, 40)) {
    const sql = setUpsertSql(batch, now)
    if (sql) await d1(account, token, sql)
  }
  await writeCatalog(account, token, true)
  if (!thumbsOk) {
    throw new Error('Catalog rows are saved, but thumbnail addresses were not. Run seed again to fill them.')
  }
}

async function fetchThumb(id) {
  const res = await fetch(`https://api.scryfall.com/cards/${id}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA }
  })
  if (res.status === 429) return { stop: true }
  if (!res.ok) return { url: null }
  const card = await res.json()
  return { url: thumbFromScryfall(card) }
}

async function fillMissingThumbs(account, token, extraIds) {
  const missing = await d1(account, token, 'SELECT scryfall_id FROM mtg_printings WHERE image_url IS NULL LIMIT 400')
  const ids = [...new Set([
    ...(extraIds || []),
    ...missing.map(row => String(row.scryfall_id || '').toLowerCase())
  ].filter(Boolean))]
  if (!ids.length) return
  console.log(`[mtg] looking up ${ids.length} thumbnail addresses`)
  let filled = 0
  for (const id of ids) {
    await sleep(120)
    const got = await fetchThumb(id)
    if (got.stop) {
      console.log('[mtg] Scryfall rate limited image lookups. Rows are saved. The next run retries.')
      break
    }
    if (!got.url) continue
    await d1(account, token, `UPDATE mtg_printings SET image_url = ${sqlText(got.url)} WHERE scryfall_id = ${sqlText(id)}`)
    filled++
  }
  console.log(`[mtg] filled ${filled} thumbnail addresses`)
}

async function weekly(account, token, dir) {
  const catalog = await d1(account, token, 'SELECT print_count FROM mtg_catalog WHERE id = 1')
  if (!catalog.length || Number(catalog[0].print_count) <= 0) {
    throw new Error('The catalog is empty. Run this workflow manually and choose seed.')
  }

  console.log('[mtg] downloading SetList.json')
  const setListPath = join(dir, 'SetList.json')
  await download('https://mtgjson.com/api/v5/SetList.json', setListPath)
  const setList = JSON.parse(readFileSync(setListPath, 'utf8'))
  const knownRows = await d1(account, token, 'SELECT code, total_set_size FROM mtg_sets')
  const known = {}
  for (const row of knownRows) known[row.code] = { total_set_size: row.total_set_size }
  const today = new Date().toISOString().slice(0, 10)
  const todo = setsToSync(setList.data || [], known, today)
  console.log(`[mtg] sets to fetch: ${todo.map(set => set.code).join(', ') || 'none'}`)

  const refreshIds = []
  for (const set of todo) {
    const file = join(dir, `${set.code}.json.gz`)
    try {
      await download(`https://mtgjson.com/api/v5/${set.code}.json.gz`, file)
      const parsed = JSON.parse((await gunzipBuffer(readFileSync(file))).toString('utf8'))
      const setData = parsed.data || {}
      const rows = rowsFromSet({ ...setData, code: setData.code || set.code, name: setData.name || set.name })
      console.log(`[mtg] ${set.code}: ${rows.length} printings (${set.allowUpdate ? 'update' : 'add'})`)
      await writeRows(account, token, rows, set.allowUpdate ? 'upsert' : 'ignore')
      const now = new Date().toISOString()
      const sql = setUpsertSql([{
        code: set.code,
        name: setData.name || set.name,
        releaseDate: setData.releaseDate || set.releaseDate,
        totalSetSize: Number(setData.totalSetSize) || set.totalSetSize
      }], now)
      if (sql) await d1(account, token, sql)
      if (set.allowUpdate) refreshIds.push(...rows.map(row => row.scryfall_id))
    } catch (error) {
      console.error(`[mtg] ${set.code} failed and will be retried next run.`, error.message || error)
    }
  }
  await fillMissingThumbs(account, token, refreshIds)
  await writeCatalog(account, token, false)
}

async function main() {
  const token = process.env.CLOUDFLARE_API_TOKEN
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is not set.')
  if (!DATABASE_ID) throw new Error('database_id is missing from wrangler.toml')
  const mode = (process.env.MTG_SYNC_MODE || 'weekly').toLowerCase()
  if (mode !== 'seed' && mode !== 'weekly') throw new Error('MTG_SYNC_MODE must be seed or weekly.')

  const account = await accountId(token)
  await ensureSchema(account, token)
  const dir = mkdtempSync(join(tmpdir(), 'mtgjson-'))
  try {
    if (mode === 'seed') await seed(account, token, dir)
    else await weekly(account, token, dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

main().catch(error => {
  console.error('[mtg]', error.message || error)
  process.exit(1)
})
