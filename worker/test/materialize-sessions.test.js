import { describe, it, expect, beforeAll } from 'vitest'
import { env } from 'cloudflare:test'
import { ensureEventSeriesSchema, materializeSeriesSessions } from '../src/utils/event-series.js'

async function ensureEventsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS events (
      event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      description TEXT,
      event_datetime TEXT NOT NULL,
      location TEXT,
      membership_price REAL NOT NULL DEFAULT 0,
      non_membership_price REAL NOT NULL DEFAULT 0,
      capacity INTEGER,
      tickets_sold INTEGER DEFAULT 0,
      image_url TEXT,
      image_url_card TEXT,
      image_url_hero TEXT,
      slug TEXT,
      full_description TEXT,
      requires_purchase INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      is_recurring INTEGER DEFAULT 0,
      recurrence_pattern TEXT,
      recurrence_end_date TEXT,
      organiser TEXT,
      seo_description TEXT,
      seo_organizer TEXT,
      seo_image TEXT,
      end_time TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run()
}

describe('materializeSeriesSessions', () => {
  beforeAll(async () => {
    await ensureEventsTable(env.DB)
    await ensureEventSeriesSchema(env.DB)
  })

  it('creates session rows for a weekly series template', async () => {
    const pattern = JSON.stringify({ type: 'weekly', day: 4, time: '18:00' })
    const ins = await env.DB.prepare(`
      INSERT INTO events (
        event_name, slug, event_datetime, is_recurring, recurrence_pattern,
        membership_price, non_membership_price, requires_purchase, is_active
      ) VALUES (?, ?, ?, 1, ?, 0, 0, 0, 1)
    `).bind('Test Series', 'test-weekly-series', '2025-01-01T18:00:00', pattern).run()

    const templateId = ins.meta.last_row_id
    const result = await materializeSeriesSessions(env.DB, templateId, { horizonWeeks: 4 })
    expect(result.error).toBeUndefined()
    expect(result.created).toBeGreaterThan(0)

    const sessions = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM events WHERE series_id = ?'
    ).bind(templateId).first()
    expect(Number(sessions.n)).toBeGreaterThan(0)
  })
})
