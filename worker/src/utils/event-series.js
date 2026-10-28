import { calculateNextOccurrence } from './recurring.js'

const DEFAULT_HORIZON_WEEKS = 12

export async function ensureEventSeriesSchema(db) {
  if (!db) return
  try {
    await db.prepare('ALTER TABLE events ADD COLUMN series_id INTEGER REFERENCES events(event_id)').run()
  } catch (_) { /* exists */ }
  try {
    await db.prepare('ALTER TABLE events ADD COLUMN occurrence_key TEXT').run()
  } catch (_) { /* exists */ }
  try {
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_events_series_id ON events(series_id)').run()
  } catch (_) { /* exists */ }
  try {
    await db.prepare(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_events_series_occurrence ON events(series_id, occurrence_key)
      WHERE series_id IS NOT NULL AND occurrence_key IS NOT NULL AND TRIM(occurrence_key) != ''
    `).run()
  } catch (_) { /* exists */ }
}

export function isSeriesTemplate(event) {
  if (!event) return false
  return Number(event.is_recurring) === 1 && (event.series_id == null || event.series_id === '')
}

export function isSeriesSession(event) {
  if (!event) return false
  return event.series_id != null && event.series_id !== ''
}

export function isLegacyVirtualRecurring(event) {
  return isSeriesTemplate(event)
}

/** True if this row has been materialized into session instances. */
export async function seriesHasSessions(db, templateId) {
  const row = await db.prepare(
    'SELECT 1 AS ok FROM events WHERE series_id = ? LIMIT 1'
  ).bind(templateId).first()
  return !!row
}

export function listOccurrencesInRange(seriesEvent, fromDate, toDate, maxCount = 200) {
  const from = new Date(fromDate)
  const to = new Date(toDate)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return []

  const occurrences = []
  let cursor = new Date(from)
  cursor.setUTCHours(0, 0, 0, 0)

  for (let i = 0; i < maxCount; i++) {
    const occ = calculateNextOccurrence(seriesEvent, cursor)
    if (!occ) break
    if (occ > to) break
    if (seriesEvent.recurrence_end_date) {
      const end = new Date(seriesEvent.recurrence_end_date)
      end.setUTCHours(23, 59, 59, 999)
      if (occ > end) break
    }
    if (occ >= from) {
      const key = occ.toISOString()
      if (!occurrences.some(o => o.toISOString() === key)) {
        occurrences.push(new Date(occ))
      }
    }
    const nextCursor = new Date(occ)
    nextCursor.setUTCDate(nextCursor.getUTCDate() + 1)
    nextCursor.setUTCHours(0, 0, 0, 0)
    if (nextCursor.getTime() <= cursor.getTime()) {
      nextCursor.setUTCDate(nextCursor.getUTCDate() + 1)
    }
    cursor = nextCursor
  }

  return occurrences
}

function horizonEndDate(template, now, horizonWeeks) {
  const end = new Date(now)
  end.setUTCDate(end.getUTCDate() + horizonWeeks * 7)
  if (template.recurrence_end_date) {
    const seriesEnd = new Date(template.recurrence_end_date)
    seriesEnd.setUTCHours(23, 59, 59, 999)
    if (seriesEnd < end) return seriesEnd
  }
  return end
}

const SESSION_COPY_FIELDS = [
  'event_name', 'organiser', 'description', 'full_description', 'seo_description', 'seo_organizer',
  'seo_image', 'location', 'membership_price', 'non_membership_price', 'capacity',
  'image_url', 'image_url_card', 'image_url_hero', 'requires_purchase', 'end_time'
]

export async function materializeSeriesSessions(db, templateId, options = {}) {
  await ensureEventSeriesSchema(db)
  const horizonWeeks = options.horizonWeeks ?? DEFAULT_HORIZON_WEEKS
  const now = options.now ? new Date(options.now) : new Date()

  const template = await db.prepare('SELECT * FROM events WHERE event_id = ?').bind(templateId).first()
  if (!template || !isSeriesTemplate(template)) {
    return { created: 0, skipped: 0, error: 'not_a_series_template' }
  }

  const rangeEnd = horizonEndDate(template, now, horizonWeeks)
  const occurrences = listOccurrencesInRange(template, now, rangeEnd)
  let created = 0
  let skipped = 0

  for (const occ of occurrences) {
    if (occ < now) continue
    if (template.recurrence_end_date) {
      const end = new Date(template.recurrence_end_date)
      end.setUTCHours(23, 59, 59, 999)
      if (occ > end) continue
    }
    const occurrenceKey = occ.toISOString()
    const existing = await db.prepare(
      'SELECT event_id FROM events WHERE series_id = ? AND occurrence_key = ?'
    ).bind(templateId, occurrenceKey).first()
    if (existing) {
      skipped++
      continue
    }

    const isoDatetime = occ.toISOString().replace(/\.\d{3}Z$/, 'Z')
    await db.prepare(`
      INSERT INTO events (
        event_name, slug, organiser, description, full_description, seo_description, seo_organizer, seo_image,
        event_datetime, location, membership_price, non_membership_price, capacity, tickets_sold,
        image_url, image_url_card, image_url_hero, requires_purchase, is_active, is_recurring,
        recurrence_pattern, recurrence_end_date, end_time, series_id, occurrence_key
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 1, 0, NULL, NULL, ?, ?, ?, ?)
    `).bind(
      template.event_name,
      template.organiser || null,
      template.description || null,
      template.full_description || null,
      template.seo_description || null,
      template.seo_organizer || null,
      template.seo_image || null,
      isoDatetime,
      template.location || null,
      template.membership_price ?? 0,
      template.non_membership_price ?? 0,
      template.capacity ?? null,
      template.image_url || null,
      template.image_url_card || null,
      template.image_url_hero || null,
      template.requires_purchase ?? 1,
      template.end_time || null,
      templateId,
      occurrenceKey
    ).run()
    created++
  }

  return { created, skipped }
}

export async function syncFutureSessionsFromTemplate(db, templateId, now = new Date()) {
  await ensureEventSeriesSchema(db)
  const template = await db.prepare('SELECT * FROM events WHERE event_id = ?').bind(templateId).first()
  if (!template || !isSeriesTemplate(template)) return { updated: 0 }

  const nowIso = now.toISOString()
  const sessions = await db.prepare(`
    SELECT event_id FROM events
    WHERE series_id = ? AND is_active = 1 AND event_datetime >= ?
  `).bind(templateId, nowIso).all()

  let updated = 0
  for (const row of sessions.results || []) {
    await db.prepare(`
      UPDATE events SET
        event_name = ?,
        organiser = ?,
        description = ?,
        full_description = ?,
        seo_description = ?,
        seo_organizer = ?,
        seo_image = ?,
        location = ?,
        membership_price = ?,
        non_membership_price = ?,
        capacity = ?,
        image_url = ?,
        image_url_card = ?,
        image_url_hero = ?,
        requires_purchase = ?,
        end_time = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE event_id = ?
    `).bind(
      template.event_name,
      template.organiser || null,
      template.description || null,
      template.full_description || null,
      template.seo_description || null,
      template.seo_organizer || null,
      template.seo_image || null,
      template.location || null,
      template.membership_price ?? 0,
      template.non_membership_price ?? 0,
      template.capacity ?? null,
      template.image_url || null,
      template.image_url_card || null,
      template.image_url_hero || null,
      template.requires_purchase ?? 1,
      template.end_time || null,
      row.event_id
    ).run()
    updated++
  }
  return { updated }
}

export async function getNextSessionForSeries(db, templateId, now = new Date()) {
  await ensureEventSeriesSchema(db)
  const nowIso = now.toISOString()
  return db.prepare(`
    SELECT * FROM events
    WHERE series_id = ? AND is_active = 1 AND event_datetime >= ?
    ORDER BY event_datetime ASC
    LIMIT 1
  `).bind(templateId, nowIso).first()
}

export function mergeTemplateWithSession(template, session) {
  if (!template || !session) return null
  return {
    id: session.event_id,
    event_id: session.event_id,
    session_event_id: session.event_id,
    series_id: template.event_id,
    series_template_id: template.event_id,
    title: template.event_name,
    event_name: template.event_name,
    slug: template.slug,
    organiser: template.organiser,
    description: template.description,
    full_description: template.full_description,
    seo_description: template.seo_description,
    seo_organizer: template.seo_organizer,
    seo_image: template.seo_image,
    event_datetime: session.event_datetime,
    location: template.location,
    membership_price: session.membership_price ?? template.membership_price,
    non_membership_price: session.non_membership_price ?? template.non_membership_price,
    capacity: session.capacity ?? template.capacity,
    tickets_sold: session.tickets_sold ?? 0,
    image_url: template.image_url,
    image_url_card: template.image_url_card,
    image_url_hero: template.image_url_hero,
    requires_purchase: session.requires_purchase ?? template.requires_purchase,
    is_recurring: 0,
    is_series: 1,
    recurrence_pattern: template.recurrence_pattern,
    recurrence_end_date: template.recurrence_end_date,
    end_time: session.end_time ?? template.end_time,
    occurrence_key: session.occurrence_key
  }
}

export async function resolvePublicEventBySlug(db, slug, now = new Date()) {
  await ensureEventSeriesSchema(db)
  const template = await db.prepare(`
    SELECT * FROM events
    WHERE slug = ? AND is_active = 1 AND is_recurring = 1 AND (series_id IS NULL OR series_id = '')
  `).bind(slug).first()

  if (template) {
    const hasSessions = await seriesHasSessions(db, template.event_id)
    if (hasSessions) {
      const session = await getNextSessionForSeries(db, template.event_id, now)
      if (!session) return { error: 'event_ended' }
      return { event: mergeTemplateWithSession(template, session), template, session }
    }
    return { event: template, template, session: null, legacyVirtual: true }
  }

  const oneOff = await db.prepare(`
    SELECT * FROM events
    WHERE slug = ? AND is_active = 1 AND (series_id IS NULL OR series_id = '') AND is_recurring = 0
  `).bind(slug).first()
  if (!oneOff) return { error: 'not_found' }
  return {
    event: {
      ...oneOff,
      id: oneOff.event_id,
      title: oneOff.event_name,
      session_event_id: oneOff.event_id
    },
    template: null,
    session: oneOff,
    legacyVirtual: false
  }
}

function mapSessionRowToPublic(row) {
  return {
    id: row.session_id,
    event_id: row.session_id,
    session_event_id: row.session_id,
    series_id: row.series_id,
    series_template_id: row.series_id,
    title: row.title,
    slug: row.slug,
    organiser: row.organiser,
    description: row.description,
    full_description: row.full_description,
    seo_description: row.seo_description,
    seo_organizer: row.seo_organizer,
    seo_image: row.seo_image,
    event_datetime: row.event_datetime,
    location: row.location,
    membership_price: row.membership_price,
    non_membership_price: row.non_membership_price,
    capacity: row.capacity,
    tickets_sold: row.tickets_sold,
    image_url: row.image_url,
    image_url_card: row.image_url_card,
    image_url_hero: row.image_url_hero,
    requires_purchase: row.requires_purchase,
    is_recurring: 0,
    is_series: 1,
    end_time: row.end_time
  }
}

export async function fetchPublicUpcomingEvents(db, now = new Date()) {
  await ensureEventSeriesSchema(db)
  const nowIso = now.toISOString()

  const { results: sessions } = await db.prepare(`
    SELECT
      s.event_id AS session_id,
      s.series_id,
      s.event_datetime,
      s.tickets_sold,
      s.capacity,
      s.membership_price,
      s.non_membership_price,
      s.requires_purchase,
      s.end_time,
      t.event_name AS title,
      t.slug,
      t.organiser,
      t.description,
      t.full_description,
      t.seo_description,
      t.seo_organizer,
      t.seo_image,
      t.location,
      t.image_url,
      t.image_url_card,
      t.image_url_hero
    FROM events s
    INNER JOIN events t ON t.event_id = s.series_id
    WHERE s.is_active = 1
      AND t.is_active = 1
      AND s.event_datetime >= ?
    ORDER BY s.event_datetime ASC
  `).bind(nowIso).all()

  const { results: oneOffs } = await db.prepare(`
    SELECT
      event_id AS session_id,
      event_id AS id,
      event_name AS title,
      slug,
      organiser,
      description,
      full_description,
      seo_description,
      seo_organizer,
      seo_image,
      event_datetime,
      location,
      membership_price,
      non_membership_price,
      capacity,
      tickets_sold,
      image_url,
      image_url_card,
      image_url_hero,
      requires_purchase,
      end_time
    FROM events
    WHERE is_active = 1
      AND is_recurring = 0
      AND (series_id IS NULL OR series_id = '')
      AND event_datetime >= ?
    ORDER BY event_datetime ASC
  `).bind(nowIso).all()

  const sessionEvents = (sessions || []).map(mapSessionRowToPublic)
  const oneOffEvents = (oneOffs || []).map(row => ({
    ...row,
    id: row.session_id,
    session_event_id: row.session_id,
    is_recurring: 0,
    is_series: 0
  }))

  const { results: legacyTemplates } = await db.prepare(`
    SELECT
      event_id as id,
      event_name as title,
      slug,
      organiser,
      description,
      full_description,
      seo_description,
      seo_organizer,
      seo_image,
      event_datetime,
      location,
      membership_price,
      non_membership_price,
      capacity,
      tickets_sold,
      image_url,
      image_url_card,
      image_url_hero,
      requires_purchase,
      is_recurring,
      recurrence_pattern,
      recurrence_end_date,
      end_time
    FROM events
    WHERE is_active = 1
      AND is_recurring = 1
      AND (series_id IS NULL OR series_id = '')
      AND event_id NOT IN (SELECT DISTINCT series_id FROM events WHERE series_id IS NOT NULL)
  `).all()

  return {
    materialized: [...sessionEvents, ...oneOffEvents].sort(
      (a, b) => new Date(a.event_datetime) - new Date(b.event_datetime)
    ),
    legacyTemplates: legacyTemplates || []
  }
}

export async function materializeAllActiveSeries(db, options = {}) {
  await ensureEventSeriesSchema(db)
  const { results } = await db.prepare(`
    SELECT event_id FROM events
    WHERE is_active = 1 AND is_recurring = 1 AND (series_id IS NULL OR series_id = '')
  `).all()

  let totalCreated = 0
  let totalSkipped = 0
  for (const row of results || []) {
    const r = await materializeSeriesSessions(db, row.event_id, options)
    totalCreated += r.created || 0
    totalSkipped += r.skipped || 0
  }
  return { series: (results || []).length, created: totalCreated, skipped: totalSkipped }
}

export async function migrateLegacyRecurringSeries(db, options = {}) {
  return materializeAllActiveSeries(db, options)
}

export async function assertBookableEventRow(db, event) {
  if (!event) return { ok: false, error: 'event_not_found' }
  if (isSeriesTemplate(event)) {
    const hasSessions = await seriesHasSessions(db, event.event_id)
    if (hasSessions) {
      return {
        ok: false,
        error: 'series_template_not_bookable',
        message: 'Book the upcoming session for this recurring event, not the series template.'
      }
    }
    return { ok: true }
  }
  return { ok: true }
}

export async function listSeriesSessions(db, templateId, { limit = 50 } = {}) {
  await ensureEventSeriesSchema(db)
  const { results } = await db.prepare(`
    SELECT
      event_id AS id,
      event_datetime,
      tickets_sold,
      capacity,
      is_active,
      occurrence_key,
      created_at
    FROM events
    WHERE series_id = ?
    ORDER BY event_datetime DESC
    LIMIT ?
  `).bind(templateId, limit).all()
  return results || []
}

export function previewOccurrenceDates(seriesEvent, count = 8, fromDate = new Date()) {
  const end = new Date(fromDate)
  end.setUTCDate(end.getUTCDate() + DEFAULT_HORIZON_WEEKS * 7)
  return listOccurrencesInRange(seriesEvent, fromDate, end, count).slice(0, count)
}
