/**
 * Staff actions for trade-in lists: quote, reject, and issue store credit.
 * Amounts are integer pence. Credit uses the same ledger key as the SQL recipe
 * in content/admin/docs/store-credit.md (`buyback_credit:<case id>`).
 */

import { appendStoreCreditLedger } from './store-credit.js'
import { BUYBACK_CONDITIONS, BUYBACK_GAMES, BUYBACK_LANGUAGES } from './buyback-cards.js'

export const BUYBACK_MAX_CREDIT_PENCE = 2_000_000
const OFFER_STATUSES = new Set(['submitted', 'under_review', 'quoted'])

const conditionLabel = new Map(BUYBACK_CONDITIONS.map(c => [c.code, c.label]))
const languageLabel = new Map(BUYBACK_LANGUAGES.map(c => [c.code, c.label]))
const gameLabel = new Map(BUYBACK_GAMES.map(c => [c.code, c.label]))

export function formatBuybackPounds(pence) {
  const n = Math.trunc(Number(pence) || 0)
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  return `${sign}£${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

/** Accepts "12", "12.5" or "12.50". Returns integer pence, or null. */
export function parseBuybackPounds(input) {
  const s = String(input ?? '').trim().replace(/£/g, '').replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const [whole, frac = ''] = s.split('.')
  const pence = Number(whole) * 100 + Number((frac + '00').slice(0, 2))
  if (!Number.isInteger(pence) || pence <= 0 || pence > BUYBACK_MAX_CREDIT_PENCE) return null
  return pence
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function greetingName(name) {
  const n = String(name || '').trim()
  if (!n) return 'there'
  return n.split(/\s+/)[0]
}

export function buybackOfferCopy({ name, amountPence, caseId }) {
  const who = escapeHtml(greetingName(name))
  const money = escapeHtml(formatBuybackPounds(amountPence))
  const text = [
    `Hi ${greetingName(name)},`,
    '',
    'Thanks for sending your list.',
    '',
    `We can offer ${formatBuybackPounds(amountPence)} in store credit for these cards. Reply to this email if you would like to go ahead, and we will arrange a time for you to bring them in. We check each card when you arrive. The credit is added to your account once we have the cards.`,
    '',
    'Dice Bastion'
  ].join('\n')
  return {
    headerTitle: 'Offer for your cards',
    subject: `Offer for your card list (#${caseId})`,
    text,
    htmlInner: `<p>Hi ${who},</p>
<p>Thanks for sending your list.</p>
<p>We can offer <strong>${money}</strong> in store credit for these cards. Reply to this email if you would like to go ahead, and we will arrange a time for you to bring them in. We check each card when you arrive. The credit is added to your account once we have the cards.</p>
<p>Dice Bastion</p>`
  }
}

export function buybackRejectCopy({ name, message }) {
  const who = escapeHtml(greetingName(name))
  const safe = escapeHtml(message).replace(/\n/g, '<br>')
  const text = [
    `Hi ${greetingName(name)},`,
    '',
    'Thanks for sending your list.',
    '',
    message,
    '',
    'Reply to this email if you want to talk it through.',
    '',
    'Dice Bastion'
  ].join('\n')
  return {
    headerTitle: 'About your card list',
    subject: 'About your card list',
    text,
    htmlInner: `<p>Hi ${who},</p>
<p>Thanks for sending your list.</p>
<p>${safe}</p>
<p>Reply to this email if you want to talk it through.</p>
<p>Dice Bastion</p>`
  }
}

export function buybackCreditCopy({ name, amountPence }) {
  const who = escapeHtml(greetingName(name))
  const money = escapeHtml(formatBuybackPounds(amountPence))
  const text = [
    `Hi ${greetingName(name)},`,
    '',
    `We have added ${formatBuybackPounds(amountPence)} of store credit to your account for the cards you brought in. You can spend it in the online shop or on event tickets. It cannot be used for memberships.`,
    '',
    'Dice Bastion'
  ].join('\n')
  return {
    headerTitle: 'Store credit added',
    subject: 'Store credit added to your account',
    text,
    htmlInner: `<p>Hi ${who},</p>
<p>We have added <strong>${money}</strong> of store credit to your account for the cards you brought in. You can spend it in the online shop or on event tickets. It cannot be used for memberships.</p>
<p>Dice Bastion</p>`
  }
}

function normaliseMessage(message) {
  const text = String(message ?? '').replace(/\r\n/g, '\n').trim()
  if (text.length < 10 || text.length > 2000) return null
  return text
}

async function loadCase(db, caseId) {
  const id = Number(caseId)
  if (!Number.isInteger(id) || id <= 0) return null
  return db.prepare(`
    SELECT c.id, c.user_id, c.status, c.customer_notes, c.agreed_value_pence,
           c.staff_comments, c.quoted_at, c.resolved_at, c.created_at, c.updated_at,
           u.email AS user_email, u.name AS user_name
    FROM buyback_cases c
    JOIN users u ON u.user_id = c.user_id
    WHERE c.id = ?
  `).bind(id).first()
}

async function loadItems(db, caseId) {
  const { results } = await db.prepare(`
    SELECT id, game_system, card_name, set_code, set_name, collector_number,
           condition, language, notes
    FROM buyback_case_items
    WHERE case_id = ?
    ORDER BY id
  `).bind(caseId).all()
  return results || []
}

export async function listBuybackCases(db, { status } = {}) {
  const params = []
  let where = ''
  if (status === 'open') {
    where = `WHERE c.status IN ('submitted', 'under_review')`
  } else if (status && ['quoted', 'accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
    where = 'WHERE c.status = ?'
    params.push(status)
  }
  const { results } = await db.prepare(`
    SELECT c.id, c.status, c.agreed_value_pence, c.created_at, c.quoted_at, c.resolved_at,
           u.email AS user_email, u.name AS user_name,
           (SELECT COUNT(*) FROM buyback_case_items i WHERE i.case_id = c.id) AS item_count
    FROM buyback_cases c
    JOIN users u ON u.user_id = c.user_id
    ${where}
    ORDER BY c.created_at DESC
    LIMIT 100
  `).bind(...params).all()
  return results || []
}

export async function getBuybackCaseDetail(db, caseId) {
  const row = await loadCase(db, caseId)
  if (!row) return null
  const items = await loadItems(db, row.id)
  return { case: row, items }
}

export async function prepareBuybackOffer(db, { caseId, amountPence }) {
  const row = await loadCase(db, caseId)
  if (!row) return { ok: false, error: 'not_found' }
  if (!OFFER_STATUSES.has(row.status)) return { ok: false, error: 'case_closed' }
  const amount = Math.trunc(Number(amountPence))
  if (!Number.isInteger(amount) || amount <= 0 || amount > BUYBACK_MAX_CREDIT_PENCE) {
    return { ok: false, error: 'invalid_amount' }
  }
  return {
    ok: true,
    case: row,
    amountPence: amount,
    copy: buybackOfferCopy({ name: row.user_name, amountPence: amount, caseId: row.id })
  }
}

export async function saveBuybackOffer(db, { caseId, amountPence, nowIso }) {
  const now = nowIso || new Date().toISOString()
  const amount = Math.trunc(Number(amountPence))
  const upd = await db.prepare(`
    UPDATE buyback_cases
    SET status = 'quoted',
        agreed_value_pence = ?,
        quoted_at = ?,
        updated_at = ?
    WHERE id = ? AND status IN ('submitted', 'under_review', 'quoted')
  `).bind(amount, now, now, Number(caseId)).run()
  if (!Number(upd.meta?.changes ?? 0)) return { ok: false, error: 'case_changed' }
  const row = await loadCase(db, caseId)
  return { ok: true, case: row }
}

export async function prepareBuybackReject(db, { caseId, message }) {
  const row = await loadCase(db, caseId)
  if (!row) return { ok: false, error: 'not_found' }
  if (row.status === 'completed') return { ok: false, error: 'already_completed' }
  if (row.status === 'rejected') return { ok: false, error: 'already_rejected' }
  const text = normaliseMessage(message)
  if (!text) return { ok: false, error: 'invalid_message' }
  return {
    ok: true,
    case: row,
    message: text,
    copy: buybackRejectCopy({ name: row.user_name, message: text })
  }
}

export function buybackAcceptStaffCopy({ name, email, amountPence, caseId }) {
  const who = String(name || '').trim() || 'A customer'
  const money = formatBuybackPounds(amountPence)
  const text = [
    `${who} (${email}) has agreed to ${money} for trade-in list #${caseId}.`,
    '',
    'Add the store credit from Admin, Trade-ins, once the cards are in. You can change the amount if you agreed a different price by email.',
    '',
    'Dice Bastion'
  ].join('\n')
  return {
    headerTitle: 'Trade-in offer accepted',
    subject: `Trade-in #${caseId} accepted`,
    text,
    htmlInner: `<p>${escapeHtml(who)} (${escapeHtml(email)}) has agreed to <strong>${escapeHtml(money)}</strong> for trade-in list #${escapeHtml(caseId)}.</p>
<p>Add the store credit from Admin, Trade-ins, once the cards are in. You can change the amount if you agreed a different price by email.</p>
<p>Dice Bastion</p>`
  }
}

export async function prepareBuybackAccept(db, { caseId, userId }) {
  const row = await loadCase(db, caseId)
  const uid = Number(userId)
  if (!row || Number(row.user_id) !== uid) return { ok: false, error: 'not_found' }
  if (row.status === 'accepted') return { ok: false, error: 'already_accepted' }
  if (row.status !== 'quoted' || !(Number(row.agreed_value_pence) > 0)) {
    return { ok: false, error: 'no_offer' }
  }
  return {
    ok: true,
    case: row,
    copy: buybackAcceptStaffCopy({
      name: row.user_name,
      email: row.user_email,
      amountPence: row.agreed_value_pence,
      caseId: row.id
    })
  }
}

export async function saveBuybackAccept(db, { caseId, userId, nowIso }) {
  const now = nowIso || new Date().toISOString()
  const upd = await db.prepare(`
    UPDATE buyback_cases
    SET status = 'accepted', updated_at = ?
    WHERE id = ? AND user_id = ? AND status = 'quoted'
  `).bind(now, Number(caseId), Number(userId)).run()
  if (!Number(upd.meta?.changes ?? 0)) return { ok: false, error: 'case_changed' }
  const row = await loadCase(db, caseId)
  return { ok: true, case: row }
}

export async function saveBuybackReject(db, { caseId, message, nowIso }) {
  const now = nowIso || new Date().toISOString()
  const text = normaliseMessage(message)
  if (!text) return { ok: false, error: 'invalid_message' }
  const upd = await db.prepare(`
    UPDATE buyback_cases
    SET status = 'rejected',
        staff_comments = ?,
        resolved_at = ?,
        updated_at = ?
    WHERE id = ? AND status NOT IN ('completed', 'rejected')
  `).bind(text, now, now, Number(caseId)).run()
  if (!Number(upd.meta?.changes ?? 0)) return { ok: false, error: 'case_changed' }
  const row = await loadCase(db, caseId)
  return { ok: true, case: row }
}

/**
 * Adds store credit for a quoted list. Repeating the same case reuses the ledger
 * row and does not add the amount twice. The amount may differ from the emailed offer.
 */
export async function issueBuybackCredit(db, { caseId, amountPence, createdBy, nowIso }) {
  const row = await loadCase(db, caseId)
  if (!row) return { ok: false, error: 'not_found' }
  if (row.status === 'completed') return { ok: true, already: true, case: row }
  if (row.status !== 'quoted' && row.status !== 'accepted') return { ok: false, error: 'offer_required' }
  const amount = Math.trunc(Number(amountPence))
  if (!Number.isInteger(amount) || amount <= 0 || amount > BUYBACK_MAX_CREDIT_PENCE) {
    return { ok: false, error: 'invalid_amount' }
  }
  const now = nowIso || new Date().toISOString()
  const credit = await appendStoreCreditLedger(db, {
    userId: row.user_id,
    deltaPence: amount,
    entryType: 'buyback_credit',
    referenceType: 'buyback_case',
    referenceId: String(row.id),
    idempotencyKey: `buyback_credit:${row.id}`,
    note: `Buyback case #${row.id}`,
    createdBy: createdBy || 'admin',
    nowIso: now
  })
  if (!credit.ok) return { ok: false, error: credit.error || 'credit_failed' }

  const applied = credit.reused
    ? Math.max(0, Math.trunc(Number(credit.entry?.delta_pence) || amount))
    : amount
  await db.prepare(`
    UPDATE buyback_cases
    SET status = 'completed',
        agreed_value_pence = ?,
        resolved_at = COALESCE(resolved_at, ?),
        updated_at = ?
    WHERE id = ? AND status != 'completed'
  `).bind(applied, now, now, row.id).run()

  const updated = await loadCase(db, row.id)
  return {
    ok: true,
    already: !!credit.reused,
    case: updated,
    balanceAfter: credit.balanceAfter,
    copy: buybackCreditCopy({ name: row.user_name, amountPence: applied })
  }
}

function pdfEscape(value) {
  return String(value ?? '')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function wrapPdf(text, width) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  if (!words.length) return ['']
  const lines = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > width && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

function pushWrapped(items, text, { size = 11, gap = 15, width = 90 } = {}) {
  for (const line of wrapPdf(text, width)) {
    items.push({ text: line, size, gap })
  }
}

export function buybackPdfLines(detail) {
  const row = detail.case
  const items = []
  items.push({ text: 'Dice Bastion trade-in', size: 16, gap: 22 })
  pushWrapped(items, `Case ${row.id}`, { size: 12, gap: 18 })
  pushWrapped(items, `Customer: ${row.user_name || ''}`)
  pushWrapped(items, `Email: ${row.user_email || ''}`)
  pushWrapped(items, `Submitted: ${String(row.created_at || '').slice(0, 10)}`)
  const offer = row.agreed_value_pence != null ? ` Offer ${formatBuybackPounds(row.agreed_value_pence)}.` : ''
  pushWrapped(items, `Status: ${row.status}.${offer}`, { gap: 18 })
  if (row.customer_notes) {
    pushWrapped(items, `Customer notes: ${row.customer_notes}`, { gap: 18 })
  }
  items.push({ text: 'Cards', size: 12, gap: 18 })
  const cards = detail.items || []
  if (!cards.length) {
    pushWrapped(items, 'No cards on this list.')
  }
  cards.forEach((card, index) => {
    const printing = [
      card.set_name,
      card.set_code ? String(card.set_code).toUpperCase() : '',
      card.collector_number ? `#${card.collector_number}` : ''
    ].filter(Boolean).join(' ')
    const game = gameLabel.get(card.game_system) || card.game_system
    const condition = conditionLabel.get(card.condition) || card.condition
    const language = languageLabel.get(card.language) || card.language
    pushWrapped(items, `${index + 1}. ${card.card_name}`, { size: 11, gap: 14 })
    pushWrapped(items, `${game}${printing ? `, ${printing}` : ''}`)
    pushWrapped(items, `${condition}, ${language}`, { gap: card.notes ? 14 : 16 })
    if (card.notes) pushWrapped(items, `Notes: ${card.notes}`, { gap: 16 })
  })
  return items
}

function paginatePdf(items) {
  const pages = []
  let page = []
  let y = 800
  for (const item of items) {
    const h = item.gap || 15
    if (page.length && y - h < 56) {
      pages.push(page)
      page = []
      y = 800
    }
    page.push(item)
    y -= h
  }
  if (page.length) pages.push(page)
  if (!pages.length) pages.push([{ text: 'Dice Bastion trade-in', size: 16, gap: 22 }])
  return pages.map((page, index) => ([
    { text: `Page ${index + 1} of ${pages.length}`, size: 9, gap: 16 },
    ...page
  ]))
}

function pageStream(lines) {
  const parts = ['BT', '/F1 11 Tf', '48 800 Td']
  lines.forEach((line, index) => {
    const size = line.size || 11
    if (index > 0) parts.push(`0 -${line.gap || 15} Td`)
    parts.push(`/F1 ${size} Tf`)
    parts.push(`(${pdfEscape(line.text)}) Tj`)
  })
  parts.push('ET')
  return parts.join('\n')
}

export function buildBuybackListPdf(detail) {
  const pages = paginatePdf(buybackPdfLines(detail)).map(pageStream)
  const enc = new TextEncoder()
  const chunks = []
  let offset = 0
  const push = (s) => {
    const b = enc.encode(s)
    chunks.push(b)
    offset += b.length
  }
  push('%PDF-1.4\n')
  const n = pages.length
  const offsets = [0]
  const objects = []
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  const pageIds = pages.map((_, i) => 4 + i * 2)
  objects[2] = `<< /Type /Pages /Count ${n} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  pages.forEach((stream, i) => {
    const pageId = 4 + i * 2
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${pageId + 1} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`
    objects[pageId + 1] = { stream }
  })
  const maxId = 3 + n * 2
  for (let id = 1; id <= maxId; id++) {
    offsets[id] = offset
    const obj = objects[id]
    if (obj && obj.stream != null) {
      const len = enc.encode(obj.stream).length
      push(`${id} 0 obj\n<< /Length ${len} >>\nstream\n${obj.stream}\nendstream\nendobj\n`)
    } else {
      push(`${id} 0 obj\n${obj}\nendobj\n`)
    }
  }
  const xref = offset
  let table = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`
  for (let id = 1; id <= maxId; id++) {
    table += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  }
  push(table)
  push(`trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)
  const total = chunks.reduce((sum, c) => sum + c.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const c of chunks) {
    out.set(c, pos)
    pos += c.length
  }
  return out
}
