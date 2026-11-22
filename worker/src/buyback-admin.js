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

const TRADE_IN_MAX_ROWS = 400
const TRADE_IN_MAX_CHARS = 1_000_000
const CONDITION_FROM_FILE = {
  mint: 'MT',
  near_mint: 'NM',
  excellent: 'EX',
  good: 'GD',
  light_played: 'LP',
  lightly_played: 'LP',
  played: 'PL',
  moderately_played: 'PL',
  heavily_played: 'PO',
  poor: 'PO',
  damaged: 'PO'
}
const languageCodes = new Set(BUYBACK_LANGUAGES.map(row => row.code))

/** Whole percent from 30 to 150. */
export function parseTradeInRate(input) {
  const s = String(input ?? '').trim().replace(/%$/, '')
  if (!/^\d+$/.test(s)) return null
  const n = Number(s)
  if (n < 30 || n > 150) return null
  return n
}

/** Starting pounds for one euro on a staff trade-in. Staff can type a different rate. */
export const DEFAULT_POUNDS_PER_EURO = 0.85

/**
 * Pounds for one unit of a non-GBP file currency. GBP files always use 1.
 * A blank rate on a euro file uses 0.85. Accepts up to 4 decimal places, from 0.01 to 10.
 */
export function parseGbpPerUnit(input, currency) {
  const code = String(currency || 'GBP').toUpperCase()
  if (code === 'GBP') return 1
  const s = String(input ?? '').trim()
  if (!s) return code === 'EUR' ? DEFAULT_POUNDS_PER_EURO : null
  if (!/^\d+(\.\d{1,4})?$/.test(s)) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0.01 || n > 10) return null
  return n
}

function parseCsvTable(text) {
  const src = String(text || '').replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        cell += ch
      }
      continue
    }
    if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (ch !== '\r') {
      cell += ch
    }
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter(cols => cols.some(value => String(value).trim()))
}

function headerMap(headers) {
  const map = new Map()
  headers.forEach((header, index) => {
    map.set(String(header || '').trim().toLowerCase(), index)
  })
  return map
}

function csvCell(row, map, name) {
  const index = map.get(name)
  if (index == null) return ''
  return String(row[index] ?? '').trim()
}

function parseMajorPrice(value) {
  let s = String(value ?? '').trim().replace(/[£€$\s]/g, '')
  if (!s) return null
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '')
  else if (s.includes(',')) s = s.replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0 || n > 100000) return null
  return n
}

function fileFlag(value) {
  const s = String(value ?? '').trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

function formatMajor(n) {
  return (Math.round(Number(n) * 100) / 100).toFixed(2)
}

export function formatTradeInFx(gbpPerUnit) {
  const s = Number(gbpPerUnit).toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
  return `£${s}`
}

/**
 * Prices a ManaBox card export. Each line is the purchase price times the rate,
 * converted into pence. The unit price is rounded, then multiplied by quantity.
 */
export function priceTradeInCsv(csvText, { ratePercent, gbpPerUnit } = {}) {
  const rate = parseTradeInRate(ratePercent)
  if (rate == null) return { ok: false, error: 'invalid_rate' }
  const text = String(csvText ?? '')
  if (text.length > TRADE_IN_MAX_CHARS) return { ok: false, error: 'csv_too_large' }
  const table = parseCsvTable(text)
  if (table.length < 2) return { ok: false, error: 'empty_csv' }
  const map = headerMap(table[0])
  if (!map.has('name') || !map.has('quantity') || !map.has('purchase price')) {
    return { ok: false, error: 'bad_csv' }
  }

  const lines = []
  let currency = ''
  for (const row of table.slice(1)) {
    const cardName = csvCell(row, map, 'name').slice(0, 180)
    if (!cardName) continue
    if (lines.length >= TRADE_IN_MAX_ROWS) return { ok: false, error: 'too_many_rows' }
    const rowCurrency = (csvCell(row, map, 'purchase price currency') || 'GBP').toUpperCase().slice(0, 8)
    if (!currency) currency = rowCurrency
    else if (currency !== rowCurrency) return { ok: false, error: 'mixed_currency' }

    const rawPrice = csvCell(row, map, 'purchase price')
    const price = parseMajorPrice(rawPrice)
    let quantity = Math.trunc(Number(csvCell(row, map, 'quantity')))
    if (!Number.isInteger(quantity) || quantity < 1) quantity = 1
    if (quantity > 250) quantity = 250

    const notes = []
    const foil = csvCell(row, map, 'foil').toLowerCase()
    if (foil && foil !== 'normal' && foil !== 'false' && foil !== '0') notes.push('Foil')
    if (fileFlag(csvCell(row, map, 'misprint'))) notes.push('Misprint')
    if (fileFlag(csvCell(row, map, 'altered'))) notes.push('Altered')
    if (fileFlag(csvCell(row, map, 'signed'))) notes.push('Signed')
    if (fileFlag(csvCell(row, map, 'proxy'))) notes.push('Proxy')
    if (price == null && rawPrice) notes.push('No list price')

    const conditionKey = csvCell(row, map, 'condition').toLowerCase().replace(/[\s-]+/g, '_')
    const langRaw = csvCell(row, map, 'language').toUpperCase().slice(0, 2)
    lines.push({
      card_name: cardName,
      set_code: csvCell(row, map, 'set code').slice(0, 12) || null,
      set_name: csvCell(row, map, 'set name').slice(0, 120) || null,
      collector_number: csvCell(row, map, 'collector number').slice(0, 20) || null,
      external_id: (csvCell(row, map, 'scryfall id') || csvCell(row, map, 'manabox id')).slice(0, 80) || null,
      condition: CONDITION_FROM_FILE[conditionKey] || 'NM',
      language: languageCodes.has(langRaw) ? langRaw : 'EN',
      notes: notes.join('. ').slice(0, 500) || null,
      quantity,
      list_price: formatMajor(price == null ? 0 : price),
      list_major: price == null ? 0 : price
    })
  }
  if (!lines.length) return { ok: false, error: 'empty_csv' }

  const fx = parseGbpPerUnit(gbpPerUnit, currency)
  if (fx == null) return { ok: false, error: 'invalid_fx' }

  let total = 0
  let cards = 0
  for (const line of lines) {
    const unit = Math.round(line.list_major * (rate / 100) * fx * 100)
    const linePence = unit * line.quantity
    if (!Number.isFinite(linePence) || linePence < 0 || linePence > BUYBACK_MAX_CREDIT_PENCE) {
      return { ok: false, error: 'total_too_high' }
    }
    line.offer_pence = linePence
    total += linePence
    cards += line.quantity
    delete line.list_major
  }
  if (total <= 0) return { ok: false, error: 'no_prices' }
  if (total > BUYBACK_MAX_CREDIT_PENCE) return { ok: false, error: 'total_too_high' }
  return {
    ok: true,
    currency,
    ratePercent: rate,
    gbpPerUnit: fx,
    totalPence: total,
    lineCount: lines.length,
    cardCount: cards,
    lines
  }
}

export function tradeInOfferNote(priced) {
  const rate = `Priced at ${priced.ratePercent}% of the list prices.`
  if (String(priced.currency || 'GBP').toUpperCase() === 'GBP') return rate
  return `${rate} File currency ${priced.currency}, ${formatTradeInFx(priced.gbpPerUnit)} per 1 ${priced.currency}.`
}

export function buybackListQuoteCopy({ name, amountPence, caseId, ratePercent, currency, gbpPerUnit, lines, lineCount }) {
  const who = greetingName(name)
  const shown = (lines || []).slice(0, 30)
  const extra = Math.max(0, Number(lineCount || shown.length) - shown.length)
  const rowText = shown.map(line => {
    const qty = Number(line.quantity) > 1 ? `${line.quantity} x ` : ''
    return `${qty}${line.card_name}: ${formatBuybackPounds(line.offer_pence)}`
  })
  if (extra) rowText.push(`And ${extra} more.`)
  const fxLine = String(currency || 'GBP').toUpperCase() === 'GBP'
    ? ''
    : `Prices on the file are in ${currency}. This offer uses ${formatTradeInFx(gbpPerUnit)} for each 1 ${currency}.`
  const text = [
    `Hi ${who},`,
    '',
    `Here is an offer for the cards on your list, at ${ratePercent}% of the prices on the file.`,
    ...(fxLine ? [fxLine] : []),
    '',
    `The total is ${formatBuybackPounds(amountPence)} in store credit.`,
    '',
    ...rowText,
    '',
    'Reply to this email with your thoughts. Once you are happy with the price, bring the cards in and we will check them. The credit is added to your account once we have the cards.',
    '',
    'Dice Bastion'
  ].join('\n')
  const htmlRows = shown.map(line => {
    const qty = Number(line.quantity) > 1 ? `${line.quantity} x ` : ''
    return `<li>${escapeHtml(qty + line.card_name)}: ${escapeHtml(formatBuybackPounds(line.offer_pence))}</li>`
  }).join('')
  return {
    headerTitle: 'Offer for your cards',
    subject: `Offer for your card list (#${caseId})`,
    text,
    htmlInner: `<p>Hi ${escapeHtml(who)},</p>
<p>Here is an offer for the cards on your list, at ${escapeHtml(ratePercent)}% of the prices on the file.</p>
${fxLine ? `<p>${escapeHtml(fxLine)}</p>` : ''}
<p>The total is <strong>${escapeHtml(formatBuybackPounds(amountPence))}</strong> in store credit.</p>
<ul>${htmlRows}${extra ? `<li>And ${extra} more.</li>` : ''}</ul>
<p>Reply to this email with your thoughts. Once you are happy with the price, bring the cards in and we will check them. The credit is added to your account once we have the cards.</p>
<p>Dice Bastion</p>`
  }
}

export function buybackAccountSetupCopy({ name, email, setupLink }) {
  const who = greetingName(name)
  const safeEmail = escapeHtml(email)
  const safeLink = escapeHtml(setupLink)
  const text = [
    `Hi ${who},`,
    '',
    `We added store credit for your cards. To see it and spend it, finish your Dice Bastion account for ${email} by choosing a password:`,
    '',
    setupLink,
    '',
    'The link works for 7 days. Store credit can be used in the online shop or on event tickets. It cannot be used for memberships.',
    '',
    'Dice Bastion'
  ].join('\n')
  return {
    headerTitle: 'Finish your account',
    subject: 'Finish your Dice Bastion account',
    text,
    htmlInner: `<p>Hi ${escapeHtml(who)},</p>
<p>We added store credit for your cards. To see it and spend it, finish your Dice Bastion account for ${safeEmail} by choosing a password.</p>
<p><a href="${safeLink}">Choose a password</a></p>
<p>Or copy this link into your browser:<br>${safeLink}</p>
<p>The link works for 7 days. Store credit can be used in the online shop or on event tickets. It cannot be used for memberships.</p>
<p>Dice Bastion</p>`
  }
}

export async function ensureBuybackItemColumns(db) {
  const alters = [
    'ALTER TABLE buyback_case_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1',
    'ALTER TABLE buyback_case_items ADD COLUMN line_quote_pence INTEGER',
    'ALTER TABLE buyback_case_items ADD COLUMN external_id TEXT'
  ]
  for (const sql of alters) {
    try { await db.prepare(sql).run() } catch (_) { /* column already present */ }
  }
}

export async function createStaffBuybackCase(db, { userId, priced, nowIso }) {
  const uid = Number(userId)
  if (!Number.isInteger(uid) || uid <= 0) return { ok: false, error: 'customer_not_found' }
  if (!priced?.ok || !(Number(priced.totalPence) > 0) || !Array.isArray(priced.lines) || !priced.lines.length) {
    return { ok: false, error: 'no_prices' }
  }
  await ensureBuybackItemColumns(db)
  const now = nowIso || new Date().toISOString()
  const inserted = await db.prepare(`
    INSERT INTO buyback_cases (
      user_id, status, tos_accepted_at, customer_notes, created_at, updated_at
    ) VALUES (?, 'submitted', ?, ?, ?, ?)
  `).bind(uid, now, 'Added by staff from a card file.', now, now).run()
  const caseId = inserted.meta.last_row_id
  const sql = `
    INSERT INTO buyback_case_items (
      case_id, game_system, external_id, card_name, set_code, set_name, collector_number,
      condition, language, notes, line_quote_pence, quantity
    ) VALUES (?, 'mtg', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  for (const line of priced.lines) {
    await db.prepare(sql).bind(
      caseId,
      line.external_id || null,
      line.card_name,
      line.set_code || null,
      line.set_name || null,
      line.collector_number || null,
      line.condition || 'NM',
      line.language || 'EN',
      line.notes || null,
      line.offer_pence,
      line.quantity
    ).run()
  }
  const row = await loadCase(db, caseId)
  return { ok: true, caseId, case: row }
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

function normaliseOfferNote(note) {
  const text = String(note ?? '').replace(/\r\n/g, '\n').trim()
  if (text.length > 2000) return null
  return text
}

export function buybackOfferCopy({ name, amountPence, caseId, note = '' }) {
  const who = escapeHtml(greetingName(name))
  const money = escapeHtml(formatBuybackPounds(amountPence))
  const extra = String(note || '').trim()
  const safeNote = escapeHtml(extra).replace(/\n/g, '<br>')
  const text = [
    `Hi ${greetingName(name)},`,
    '',
    'Thanks for sending your list.',
    '',
    `We can offer ${formatBuybackPounds(amountPence)} in store credit for these cards. Reply to this email if you would like to go ahead, and we will arrange a time for you to bring them in. We check each card when you arrive. The credit is added to your account once we have the cards.`,
    ...(extra ? ['', extra] : []),
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
${safeNote ? `<p>${safeNote}</p>` : ''}
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
  await ensureBuybackItemColumns(db)
  const { results } = await db.prepare(`
    SELECT id, game_system, card_name, set_code, set_name, collector_number,
           condition, language, notes, quantity, line_quote_pence
    FROM buyback_case_items
    WHERE case_id = ?
    ORDER BY id
  `).bind(caseId).all()
  return results || []
}

export async function listBuybackCases(db, { status } = {}) {
  await ensureBuybackItemColumns(db)
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
           (SELECT COALESCE(SUM(quantity), 0) FROM buyback_case_items i WHERE i.case_id = c.id) AS item_count
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

export async function prepareBuybackOffer(db, { caseId, amountPence, note = '' }) {
  const row = await loadCase(db, caseId)
  if (!row) return { ok: false, error: 'not_found' }
  if (!OFFER_STATUSES.has(row.status)) return { ok: false, error: 'case_closed' }
  const amount = Math.trunc(Number(amountPence))
  if (!Number.isInteger(amount) || amount <= 0 || amount > BUYBACK_MAX_CREDIT_PENCE) {
    return { ok: false, error: 'invalid_amount' }
  }
  const offerNote = normaliseOfferNote(note)
  if (offerNote === null) return { ok: false, error: 'invalid_note' }
  return {
    ok: true,
    case: row,
    amountPence: amount,
    note: offerNote,
    copy: buybackOfferCopy({ name: row.user_name, amountPence: amount, caseId: row.id, note: offerNote })
  }
}

export async function saveBuybackOffer(db, { caseId, amountPence, note = '', nowIso }) {
  const now = nowIso || new Date().toISOString()
  const amount = Math.trunc(Number(amountPence))
  const offerNote = normaliseOfferNote(note)
  if (offerNote === null) return { ok: false, error: 'invalid_note' }
  const upd = await db.prepare(`
    UPDATE buyback_cases
    SET status = 'quoted',
        agreed_value_pence = ?,
        staff_comments = ?,
        quoted_at = ?,
        updated_at = ?
    WHERE id = ? AND status IN ('submitted', 'under_review', 'quoted')
  `).bind(amount, offerNote || null, now, now, Number(caseId)).run()
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
    const qty = Number(card.quantity) > 0 ? `Qty ${card.quantity}` : ''
    const money = card.line_quote_pence != null ? formatBuybackPounds(card.line_quote_pence) : ''
    const priced = [qty, money].filter(Boolean).join(', ')
    pushWrapped(items, `${index + 1}. ${card.card_name}`, { size: 11, gap: 14 })
    pushWrapped(items, `${game}${printing ? `, ${printing}` : ''}`)
    pushWrapped(items, `${condition}, ${language}${priced ? `, ${priced}` : ''}`, { gap: card.notes ? 14 : 16 })
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
