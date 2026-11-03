import { env } from 'cloudflare:test'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  buildBuybackListPdf,
  buybackAcceptStaffCopy,
  buybackOfferCopy,
  buybackRejectCopy,
  getBuybackCaseDetail,
  issueBuybackCredit,
  parseBuybackPounds,
  prepareBuybackAccept,
  prepareBuybackOffer,
  prepareBuybackReject,
  saveBuybackAccept,
  saveBuybackOffer,
  saveBuybackReject
} from './buyback-admin.js'
import { getStoreCreditBalance } from './store-credit.js'

async function setup() {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      store_credit_pence INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT
    )
  `).run()
  try { await env.DB.prepare('ALTER TABLE users ADD COLUMN name TEXT').run() } catch (_) {}
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS store_credit_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      delta_pence INTEGER NOT NULL,
      balance_after_pence INTEGER NOT NULL,
      entry_type TEXT NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      idempotency_key TEXT NOT NULL UNIQUE,
      note TEXT,
      created_by TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )
  `).run()
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS buyback_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      tos_accepted_at TEXT NOT NULL,
      customer_notes TEXT,
      agreed_value_pence INTEGER,
      staff_comments TEXT,
      quoted_at TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run()
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS buyback_case_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      game_system TEXT NOT NULL,
      card_name TEXT NOT NULL,
      set_code TEXT,
      set_name TEXT,
      collector_number TEXT,
      condition TEXT,
      language TEXT,
      notes TEXT
    )
  `).run()
}

async function makeCase(email, status = 'submitted') {
  const now = '2026-11-03T12:00:00.000Z'
  await env.DB.prepare(
    'INSERT INTO users (email, name, store_credit_pence) VALUES (?, ?, 0)'
  ).bind(email, 'Nick Calamaro').run()
  const user = await env.DB.prepare('SELECT user_id FROM users WHERE email = ?').bind(email).first()
  const inserted = await env.DB.prepare(`
    INSERT INTO buyback_cases (user_id, status, tos_accepted_at, customer_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(user.user_id, status, now, 'Please check the foil.', now, now).run()
  const caseId = inserted.meta.last_row_id
  await env.DB.prepare(`
    INSERT INTO buyback_case_items (
      case_id, game_system, card_name, set_code, set_name, collector_number, condition, language, notes
    ) VALUES (?, 'mtg', 'Lightning Bolt', 'lea', 'Limited Edition Alpha', '161', 'NM', 'EN', 'signed')
  `).bind(caseId).run()
  return caseId
}

describe('buyback admin', () => {
  beforeAll(setup)

  test('parses pounds and refuses blank or huge amounts', () => {
    expect(parseBuybackPounds('12.50')).toBe(1250)
    expect(parseBuybackPounds('£12')).toBe(1200)
    expect(parseBuybackPounds('0')).toBeNull()
    expect(parseBuybackPounds('12.345')).toBeNull()
    expect(parseBuybackPounds('20001')).toBeNull()
  })

  test('offer and rejection copy stays plain', () => {
    const offer = buybackOfferCopy({ name: 'Nick Calamaro', amountPence: 2450, caseId: 4 })
    const reject = buybackRejectCopy({ name: 'Nick', message: 'We cannot take this list because the cards are heavily played.' })
    for (const copy of [offer, reject]) {
      expect(copy.text).not.toMatch(/[—–]/)
      expect(copy.subject).not.toMatch(/!/)
      expect(copy.htmlInner).not.toMatch(/[—–]/)
    }
    expect(offer.text).toContain('£24.50')
    expect(offer.text).toContain('Hi Nick,')
    expect(reject.text).toContain('heavily played')
  })

  test('quote, revised amount, and a single credit issue', async () => {
    const caseId = await makeCase('offer@example.com')
    const prepared = await prepareBuybackOffer(env.DB, { caseId, amountPence: 1500 })
    expect(prepared.ok).toBe(true)
    const saved = await saveBuybackOffer(env.DB, { caseId, amountPence: 1500, nowIso: '2026-11-03T13:00:00.000Z' })
    expect(saved.case.status).toBe('quoted')
    expect(saved.case.agreed_value_pence).toBe(1500)

    const issued = await issueBuybackCredit(env.DB, {
      caseId,
      amountPence: 1800,
      createdBy: 'admin@dicebastion.com',
      nowIso: '2026-11-03T14:00:00.000Z'
    })
    expect(issued.ok).toBe(true)
    expect(issued.already).toBe(false)
    expect(issued.case.status).toBe('completed')
    expect(issued.case.agreed_value_pence).toBe(1800)
    expect(await getStoreCreditBalance(env.DB, saved.case.user_id)).toBe(1800)

    const again = await issueBuybackCredit(env.DB, { caseId, amountPence: 9999, createdBy: 'admin' })
    expect(again.already).toBe(true)
    expect(await getStoreCreditBalance(env.DB, saved.case.user_id)).toBe(1800)
  })

  test('credit is refused before an offer, and a rejection is stored once', async () => {
    const caseId = await makeCase('reject@example.com')
    const early = await issueBuybackCredit(env.DB, { caseId, amountPence: 500, createdBy: 'admin' })
    expect(early.ok).toBe(false)
    expect(early.error).toBe('offer_required')

    const prepared = await prepareBuybackReject(env.DB, {
      caseId,
      message: 'These are bulk commons, which we are not buying at the moment.'
    })
    expect(prepared.ok).toBe(true)
    const saved = await saveBuybackReject(env.DB, {
      caseId,
      message: prepared.message,
      nowIso: '2026-11-03T15:00:00.000Z'
    })
    expect(saved.case.status).toBe('rejected')
    expect(saved.case.staff_comments).toContain('bulk commons')
    const second = await prepareBuybackReject(env.DB, { caseId, message: 'Sending this again would be a second email.' })
    expect(second.error).toBe('already_rejected')
  })

  test('pdf lists the card and the customer', async () => {
    const caseId = await makeCase('pdf@example.com')
    const detail = await getBuybackCaseDetail(env.DB, caseId)
    const pdf = new TextDecoder().decode(buildBuybackListPdf(detail))
    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf).toContain('Lightning Bolt')
    expect(pdf).toContain('Nick Calamaro')
    expect(pdf).toContain('Limited Edition Alpha')
    expect(pdf).toContain('%%EOF')
  })

  test('a customer can agree to a quote, and credit can still be issued', async () => {
    const caseId = await makeCase('accept@example.com')
    await saveBuybackOffer(env.DB, { caseId, amountPence: 2400, nowIso: '2026-11-03T13:00:00.000Z' })
    const row = await env.DB.prepare('SELECT user_id FROM buyback_cases WHERE id = ?').bind(caseId).first()
    const early = await prepareBuybackAccept(env.DB, { caseId, userId: row.user_id })
    expect(early.ok).toBe(true)
    const copy = buybackAcceptStaffCopy({ name: 'Nick Calamaro', email: 'accept@example.com', amountPence: 2400, caseId })
    expect(copy.text).toContain('£24.00')
    expect(copy.text).not.toMatch(/[—–]/)
    expect(copy.subject).toBe(`Trade-in #${caseId} accepted`)
    const saved = await saveBuybackAccept(env.DB, { caseId, userId: row.user_id, nowIso: '2026-11-03T16:00:00.000Z' })
    expect(saved.case.status).toBe('accepted')
    const second = await prepareBuybackAccept(env.DB, { caseId, userId: row.user_id })
    expect(second.error).toBe('already_accepted')
    const issued = await issueBuybackCredit(env.DB, { caseId, amountPence: 2000, createdBy: 'admin' })
    expect(issued.ok).toBe(true)
    expect(issued.case.status).toBe('completed')
    expect(issued.case.agreed_value_pence).toBe(2000)
  })
})
