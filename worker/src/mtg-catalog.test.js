import { env } from 'cloudflare:test'
import { beforeAll, describe, expect, test } from 'vitest'
import { listBuybackPrints, searchBuybackCards } from './buyback-cards.js'
import {
  mapSetCard,
  printingInsertSql,
  rowsFromSet,
  setsToSync,
  thumbFromScryfall
} from './mtgjson-import.js'

const ORACLE = '00000000-0000-4000-8000-000000000001'
const OLD_ID = '00000000-0000-4000-8000-000000000010'
const NEW_ID = '00000000-0000-4000-8000-000000000011'
const STRIKE_ORACLE = '00000000-0000-4000-8000-000000000002'
const STRIKE_ID = '00000000-0000-4000-8000-000000000020'

async function setup() {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS mtg_printings (
      scryfall_id TEXT PRIMARY KEY,
      oracle_id TEXT NOT NULL,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL,
      printed_name TEXT,
      lang TEXT,
      set_code TEXT,
      set_name TEXT,
      collector_number TEXT,
      released_at TEXT,
      image_url TEXT
    )
  `).run()
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS mtg_catalog (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      print_count INTEGER NOT NULL DEFAULT 0,
      seeded_at TEXT,
      updated_at TEXT
    )
  `).run()
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS mtg_names (
      name_key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      scryfall_id TEXT NOT NULL,
      printed_name TEXT,
      lang TEXT,
      set_code TEXT,
      set_name TEXT,
      collector_number TEXT,
      released_at TEXT,
      image_url TEXT
    )
  `).run()
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS mtg_name_words (
      word TEXT NOT NULL,
      name_key TEXT NOT NULL,
      PRIMARY KEY (word, name_key)
    )
  `).run()
  await env.DB.prepare('DELETE FROM mtg_printings').run()
  await env.DB.prepare('DELETE FROM mtg_names').run()
  await env.DB.prepare('DELETE FROM mtg_name_words').run()
  await env.DB.prepare('DELETE FROM mtg_catalog').run()
}

beforeAll(setup)

describe('MTGJSON import rules', () => {
  const today = '2026-11-04'

  test('downloads a new set, a grown set, and a recent set, and leaves a stable set', () => {
    const known = {
      LEA: { total_set_size: 295 },
      MH2: { total_set_size: 300 },
      OLD: { total_set_size: 100 }
    }
    const picked = setsToSync([
      { code: 'LEA', name: 'Limited Edition Alpha', releaseDate: '1993-08-05', totalSetSize: 295, type: 'core' },
      { code: 'MH2', name: 'Modern Horizons 2', releaseDate: '2021-06-18', totalSetSize: 303, type: 'expansion' },
      { code: 'BLB', name: 'Bloomburrow', releaseDate: '2026-10-20', totalSetSize: 280, type: 'expansion' },
      { code: 'SPG', name: 'Special Guests', releaseDate: '2026-12-01', totalSetSize: 10, isPartialPreview: true },
      { code: 'TLEA', name: 'Tokens', releaseDate: '1993-08-05', totalSetSize: 12, type: 'token' },
      { code: 'ANA', name: 'Arena', releaseDate: '2018-07-14', totalSetSize: 40, isOnlineOnly: true, type: 'expansion' }
    ], known, today)

    const byCode = Object.fromEntries(picked.map(set => [set.code, set]))
    expect(byCode.LEA).toBeUndefined()
    expect(byCode.MH2.allowUpdate).toBe(false)
    expect(byCode.BLB.allowUpdate).toBe(true)
    expect(byCode.SPG.allowUpdate).toBe(true)
    expect(byCode.TLEA).toBeUndefined()
    expect(byCode.ANA).toBeUndefined()
  })

  test('keeps one paper printing and the printed name, and skips tokens, online cards, and extra languages', () => {
    const set = {
      code: 'FBB',
      name: 'Foreign Black Border',
      releaseDate: '1994-04-01',
      cards: [
        {
          name: 'Lightning Bolt',
          printedName: 'Éclair',
          language: 'French',
          number: '161',
          layout: 'normal',
          availability: ['paper'],
          identifiers: { scryfallId: NEW_ID, scryfallOracleId: ORACLE },
          foreignData: [{ language: 'German', name: 'Blitz' }]
        },
        {
          name: 'Soldier',
          language: 'English',
          number: '1',
          layout: 'token',
          availability: ['paper'],
          identifiers: { scryfallId: '00000000-0000-4000-8000-000000000099', scryfallOracleId: ORACLE }
        },
        {
          name: 'Arena Bolt',
          language: 'English',
          number: '2',
          layout: 'normal',
          availability: ['arena'],
          identifiers: { scryfallId: '00000000-0000-4000-8000-000000000098', scryfallOracleId: ORACLE }
        }
      ]
    }
    const rows = rowsFromSet(set)
    expect(rows).toHaveLength(1)
    expect(rows[0].printed_name).toBe('Éclair')
    expect(rows[0].lang).toBe('fr')
    expect(rows[0].name_key).toBe('lightning bolt')
    expect(mapSetCard(set, set.cards[1])).toBeNull()
  })

  test('stores a Scryfall thumb and rejects any other image address', () => {
    expect(thumbFromScryfall({
      image_uris: { thumb: 'https://cards.scryfall.io/thumb/front/a/b/card.webp' }
    })).toBe('https://cards.scryfall.io/thumb/front/a/b/card.webp')
    expect(thumbFromScryfall({
      card_faces: [{ image_uris: { thumb: 'https://cards.scryfall.io/thumb/front/c/d/face.webp' } }]
    })).toMatch(/face\.webp$/)
    expect(thumbFromScryfall({ image_uris: { small: 'https://cards.scryfall.io/small/front/a/b/card.jpg' } })).toBeNull()
    expect(thumbFromScryfall({ image_uris: { thumb: 'http://cards.scryfall.io/thumb.webp' } })).toBeNull()
    expect(thumbFromScryfall({ image_uris: { thumb: 'https://example.com/card.webp' } })).toBeNull()
  })

  test('inserts new rows without rewriting old ones, and escapes quotes', () => {
    const row = {
      scryfall_id: OLD_ID,
      oracle_id: ORACLE,
      name: "Urza's Saga",
      name_key: "urza's saga",
      printed_name: null,
      lang: 'en',
      set_code: 'mh2',
      set_name: 'Modern Horizons 2',
      collector_number: '259',
      released_at: '2021-06-18',
      image_url: null
    }
    expect(printingInsertSql([row], 'ignore')).toContain('INSERT OR IGNORE')
    expect(printingInsertSql([row], 'ignore')).toContain("Urza''s Saga")
    expect(printingInsertSql([row], 'upsert')).toContain('ON CONFLICT(scryfall_id) DO UPDATE')
    expect(printingInsertSql([row], 'upsert')).toContain('COALESCE(excluded.image_url, mtg_printings.image_url)')
  })
})

describe('catalog search', () => {
  test('uses the catalog for names and printings, and says when it is empty', async () => {
    await expect(searchBuybackCards(env, 'mtg', 'bolt')).rejects.toMatchObject({
      message: 'catalog_updating',
      status: 503
    })

    await env.DB.prepare(`
      INSERT INTO mtg_printings
        (scryfall_id, oracle_id, name, name_key, printed_name, lang, set_code, set_name, collector_number, released_at, image_url)
      VALUES
        (?, ?, 'Lightning Bolt', 'lightning bolt', NULL, 'en', 'lea', 'Limited Edition Alpha', '161', '1993-08-05', 'https://cards.scryfall.io/thumb/old.webp'),
        (?, ?, 'Lightning Bolt', 'lightning bolt', 'Éclair', 'fr', 'fbb', 'Foreign Black Border', '161', '2024-02-01', 'https://cards.scryfall.io/thumb/new.webp'),
        (?, ?, 'Lightning Strike', 'lightning strike', NULL, 'en', 'm14', 'Magic 2014', '146', '2013-07-19', 'https://cards.scryfall.io/thumb/strike.webp')
    `).bind(OLD_ID, ORACLE, NEW_ID, ORACLE, STRIKE_ID, STRIKE_ORACLE).run()
    await env.DB.prepare(
      'INSERT INTO mtg_catalog (id, print_count, seeded_at, updated_at) VALUES (1, 3, ?, ?)'
    ).bind('2026-11-04T00:00:00Z', '2026-11-04T00:00:00Z').run()
    await env.DB.prepare(`
      INSERT INTO mtg_names
        (name_key, name, scryfall_id, printed_name, lang, set_code, set_name, collector_number, released_at, image_url)
      VALUES
        ('lightning bolt', 'Lightning Bolt', ?, 'Éclair', 'fr', 'fbb', 'Foreign Black Border', '161', '2024-02-01', 'https://cards.scryfall.io/thumb/new.webp'),
        ('lightning strike', 'Lightning Strike', ?, NULL, 'en', 'm14', 'Magic 2014', '146', '2013-07-19', 'https://cards.scryfall.io/thumb/strike.webp')
    `).bind(NEW_ID, STRIKE_ID).run()
    await env.DB.prepare(`
      INSERT INTO mtg_name_words (word, name_key) VALUES
        ('lightning', 'lightning bolt'),
        ('bolt', 'lightning bolt'),
        ('lightning', 'lightning strike'),
        ('strike', 'lightning strike')
    `).run()

    const names = (await searchBuybackCards(env, 'mtg', 'bolt')).map(card => card.name)
    expect(names).toEqual(['Lightning Bolt'])

    const lights = (await searchBuybackCards(env, 'mtg', 'light')).map(card => card.name)
    expect(lights).toEqual(['Lightning Bolt', 'Lightning Strike'])

    const prints = await listBuybackPrints(env, 'mtg', OLD_ID)
    expect(prints.map(card => card.id)).toEqual([NEW_ID, OLD_ID])
    expect(prints[0].printed_name).toBe('Éclair')
    expect(prints[0].lang).toBe('fr')
    expect(prints[0].image_url).toBe('https://cards.scryfall.io/thumb/new.webp')
    expect(prints[1].printed_name).toBeNull()

    await expect(listBuybackPrints(env, 'mtg', '00000000-0000-4000-8000-000000000077')).rejects.toMatchObject({
      message: 'card_not_found',
      status: 404
    })
    await expect(listBuybackPrints(env, 'riftbound', NEW_ID)).rejects.toMatchObject({
      message: 'prints_mtg_only',
      status: 400
    })
  })
})
