import { env } from 'cloudflare:test'
import { beforeAll, describe, expect, test } from 'vitest'
import {
  buildBuybackListPdf,
  buybackAcceptStaffCopy,
  buybackAccountSetupCopy,
  buybackListQuoteCopy,
  buybackOfferCopy,
  buybackRejectCopy,
  createStaffBuybackCase,
  getBuybackCaseDetail,
  issueBuybackCredit,
  parseBuybackPounds,
  parseTradeInRate,
  prepareBuybackAccept,
  prepareBuybackOffer,
  prepareBuybackReject,
  priceTradeInCsv,
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
    const withNote = buybackOfferCopy({ name: 'Nick', amountPence: 1000, caseId: 4, note: 'The Bolt is the card we are pricing.' })
    expect(withNote.text).toContain('The Bolt is the card we are pricing.')
    expect(withNote.htmlInner).toContain('The Bolt is the card we are pricing.')
    expect(reject.text).toContain('heavily played')
  })

  test('quote, revised amount, and a single credit issue', async () => {
    const caseId = await makeCase('offer@example.com')
    const prepared = await prepareBuybackOffer(env.DB, {
      caseId,
      amountPence: 1500,
      note: 'Near mint copies only.'
    })
    expect(prepared.ok).toBe(true)
    expect(prepared.copy.text).toContain('Near mint copies only.')
    const saved = await saveBuybackOffer(env.DB, {
      caseId,
      amountPence: 1500,
      note: prepared.note,
      nowIso: '2026-11-03T13:00:00.000Z'
    })
    expect(saved.case.status).toBe('quoted')
    expect(saved.case.agreed_value_pence).toBe(1500)
    expect(saved.case.staff_comments).toBe('Near mint copies only.')

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

  test('prices a ManaBox file and stores the quantity on the case', async () => {
    expect(parseTradeInRate('29')).toBeNull()
    expect(parseTradeInRate('151')).toBeNull()
    expect(parseTradeInRate('150')).toBe(150)

    const csv = [
      'Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,Purchase price,Misprint,Altered,Signed,Condition,Language,Proxy,Purchase price currency,Added',
      'Waste Not,WOT,Wilds of Eldraine: Enchanting Tales,38,normal,rare,1,85839,f5dd,4.98,false,false,false,near_mint,en,false,EUR,2026-11-22T12:55:09.503Z',
      '"Cloud, Midgar Mercenary",FIN,Final Fantasy,10,normal,mythic,1,105580,abc,22.34,false,false,false,near_mint,en,false,EUR,2026-11-22T12:55:09.504Z',
      '"Daredevil, Man Without Fear",MSH,Marvel Super Heroes,398,foil,rare,1,113330,def,22.67,false,false,false,near_mint,en,false,EUR,2026-11-22T12:55:09.507Z',
      'Idyllic Tutor,THB,Theros Beyond Death,24,normal,rare,2,47038,ghi,6.22,false,false,false,near_mint,en,false,EUR,2026-11-22T12:55:09.505Z'
    ].join('\n')

    expect(priceTradeInCsv(csv, { ratePercent: 20, gbpPerUnit: 1 }).error).toBe('invalid_rate')
    const priced = priceTradeInCsv(csv, { ratePercent: 30, gbpPerUnit: 1 })
    expect(priced.ok).toBe(true)
    expect(priced.currency).toBe('EUR')
    expect(priced.cardCount).toBe(5)
    const waste = priced.lines.find(line => line.card_name === 'Waste Not')
    const tutor = priced.lines.find(line => line.card_name === 'Idyllic Tutor')
    const daredevil = priced.lines.find(line => line.card_name === 'Daredevil, Man Without Fear')
    expect(waste.offer_pence).toBe(149)
    expect(tutor.quantity).toBe(2)
    expect(tutor.offer_pence).toBe(374)
    expect(daredevil.condition).toBe('NM')
    expect(daredevil.language).toBe('EN')
    expect(daredevil.notes).toBe('Foil')
    expect(priced.lines.some(line => line.card_name === 'Cloud, Midgar Mercenary')).toBe(true)

    const converted = priceTradeInCsv(csv, { ratePercent: '30', gbpPerUnit: '0.80' })
    expect(converted.lines.find(line => line.card_name === 'Waste Not').offer_pence).toBe(120)
    const defaultFx = priceTradeInCsv(csv, { ratePercent: 30 })
    expect(defaultFx.gbpPerUnit).toBe(0.85)
    expect(defaultFx.lines.find(line => line.card_name === 'Waste Not').offer_pence).toBe(127)
    expect(priceTradeInCsv(csv.replace(',EUR,', ',GBP,').replaceAll(',EUR,', ',GBP,'), { ratePercent: 30 }).currency).toBe('GBP')

    const copy = buybackListQuoteCopy({
      name: 'Alex Vallejo',
      amountPence: priced.totalPence,
      caseId: 8,
      ratePercent: 30,
      currency: 'EUR',
      gbpPerUnit: 1,
      lines: priced.lines,
      lineCount: priced.lineCount
    })
    expect(copy.text).toContain('Reply to this email with your thoughts')
    expect(copy.text).toContain('at 30% of the prices on the file')
    expect(copy.text).toContain('Idyllic Tutor | Theros Beyond Death THB #24 | NM | EN | 2 | 6.22 EUR | £3.74')
    expect(copy.text).toContain('Daredevil, Man Without Fear')
    expect(copy.text).toContain('Foil')
    expect(copy.draft).toContain('[card table]')
    expect(copy.htmlInner).toContain('<table')
    expect(copy.htmlInner).not.toContain('<ul>')
    expect(copy.htmlInner).toContain('Wilds of Eldraine: Enchanting Tales')
    expect(copy.subject).toBe('Offer for your card list (#8)')
    expect(copy.text).not.toMatch(/[—–]/)
    const edited = buybackListQuoteCopy({
      name: 'Alex Vallejo',
      amountPence: priced.totalPence,
      caseId: 8,
      ratePercent: 30,
      currency: 'EUR',
      gbpPerUnit: 1,
      lines: priced.lines,
      subject: 'Your trade-in offer',
      message: 'Hi Alex,\n\nHere is the price we can do.\n\n[card table]\n\nTell me what you think.\n\nDice Bastion'
    })
    expect(edited.ok).toBe(true)
    expect(edited.subject).toBe('Your trade-in offer')
    expect(edited.text).toContain('Here is the price we can do.')
    expect(edited.text).toContain('Waste Not |')
    expect(edited.htmlInner).toContain('<table')
    expect(buybackListQuoteCopy({ message: 'too short', lines: [] }).error).toBe('invalid_email_draft')
    const setup = buybackAccountSetupCopy({
      name: 'Alex',
      email: 'alex@example.com',
      setupLink: 'https://dicebastion.com/reset-password?token=abc'
    })
    expect(setup.text).toContain('choosing a password')
    expect(setup.text).toContain('https://dicebastion.com/reset-password?token=abc')
    expect(setup.htmlInner).not.toMatch(/[🎉✨]/)

    await env.DB.prepare(
      'INSERT INTO users (email, name, store_credit_pence) VALUES (?, ?, 0)'
    ).bind('alex-trade@example.com', 'Alex Vallejo').run()
    const user = await env.DB.prepare('SELECT user_id FROM users WHERE email = ?').bind('alex-trade@example.com').first()
    const created = await createStaffBuybackCase(env.DB, {
      userId: user.user_id,
      priced,
      nowIso: '2026-11-22T13:00:00.000Z'
    })
    expect(created.ok).toBe(true)
    const detail = await getBuybackCaseDetail(env.DB, created.caseId)
    expect(detail.case.customer_notes).toContain('Added by staff')
    expect(detail.items.find(item => item.card_name === 'Idyllic Tutor').quantity).toBe(2)
    expect(detail.items.find(item => item.card_name === 'Idyllic Tutor').line_quote_pence).toBe(374)

    await saveBuybackOffer(env.DB, {
      caseId: created.caseId,
      amountPence: priced.totalPence,
      note: 'Priced at 30% of the list prices.',
      nowIso: '2026-11-22T13:05:00.000Z'
    })
    const issued = await issueBuybackCredit(env.DB, {
      caseId: created.caseId,
      amountPence: 5000,
      createdBy: 'admin@dicebastion.com',
      nowIso: '2026-11-22T18:00:00.000Z'
    })
    expect(issued.ok).toBe(true)
    expect(issued.case.status).toBe('completed')
    expect(issued.case.agreed_value_pence).toBe(5000)
    expect(await getStoreCreditBalance(env.DB, user.user_id)).toBe(5000)
  })
})
