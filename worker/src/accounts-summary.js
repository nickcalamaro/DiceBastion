/**
 * Figures and PDF lines for the accounts summary. Club takings and personal money stay out.
 */

import { buildTextPdf, pushWrapped } from './text-pdf.js'

export function formatGbp(pence) {
  const n = (Number(pence) || 0) / 100
  const sign = n < 0 ? '-' : ''
  return `${sign}£${Math.abs(n).toFixed(2)}`
}

/** Board games, TCG sealed product, or neither. Accessories and sleeves are neither. */
export function classifyProductCategory(category) {
  const text = String(category || '').toLowerCase()
  if (!text) return 'other'
  if (text.includes('accessor') || text.includes('sleeve')) return 'other'
  if (text.includes('card game') || text.includes('riftbound')) return 'tcg'
  if (text.includes('board game')) return 'game'
  return 'other'
}

/**
 * @param {{ name: string, date?: string, tickets?: number, people?: number, profit_pence?: number }[]} events
 */
export function summariseEvents(events) {
  const list = (events || []).map(event => ({
    name: event.name || 'Event',
    date: event.date || '',
    tickets: Number(event.tickets) || 0,
    people: Number(event.people) || 0,
    profit_pence: Number(event.profit_pence) || 0
  }))
  const count = list.length
  const attendees = list.reduce((sum, event) => sum + event.tickets, 0)
  const averageAttendance = count ? attendees / count : 0
  const averageProfitPence = count
    ? Math.round(list.reduce((sum, event) => sum + event.profit_pence, 0) / count)
    : 0
  const best = list
    .filter(event => event.profit_pence > 0)
    .sort((a, b) => b.profit_pence - a.profit_pence || b.tickets - a.tickets || a.name.localeCompare(b.name))[0] || null
  const low = averageAttendance > 0 ? list.filter(event => event.tickets < averageAttendance / 2) : []
  return { count, attendees, averageAttendance, averageProfitPence, best, low, list }
}

function countText(n, one, many) {
  return `${n} ${n === 1 ? one : many}`
}

function attendanceText(value) {
  if (!Number.isFinite(value)) return '0'
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function noteLines(items, text) {
  pushWrapped(items, 'Notes:', { gap: 14 })
  const body = String(text || '').trim()
  if (!body) {
    items.push({ text: ' ', size: 11, gap: 18 })
    return
  }
  for (const paragraph of body.split(/\n+/)) {
    pushWrapped(items, paragraph, { gap: 14 })
  }
  items.push({ text: ' ', size: 11, gap: 8 })
}

export function cleanSummaryNote(value) {
  const text = String(value || '').replace(/\r/g, '').trim()
  return text ? text.slice(0, 2000) : ''
}

/**
 * Sales units and event attendance for the selected dates.
 * Money for each event comes from the profit and loss, which already respects the books start date.
 */
export async function collectPeriodActivity(db, from, to, booksStart, pnlEvents) {
  const start = from > booksStart ? from : booksStart
  const empty = { games: 0, tcgPacks: 0, untrackedUnits: 0, events: summariseEvents([]), people: 0 }
  if (!start || start > to) return empty

  const { results: saleRows } = await db.prepare(`
    SELECT p.category AS category, oi.quantity AS quantity,
           EXISTS (
             SELECT 1 FROM stock_movements sm
             WHERE sm.order_item_id = oi.id AND sm.movement_type = 'sale'
           ) AS tracked
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN products p ON p.id = oi.product_id
    WHERE UPPER(COALESCE(o.payment_status, '')) = 'PAID'
      AND NOT ((o.name = 'Walk-in' OR lower(o.email) = 'walk-in') AND IFNULL(o.sale_channel, '') != 'pos')
      AND strftime('%Y-%m-%d', COALESCE(o.completed_at, o.created_at)) >= ?
      AND strftime('%Y-%m-%d', COALESCE(o.completed_at, o.created_at)) <= ?
  `).bind(start, to).all()

  let games = 0
  let tcgPacks = 0
  let untrackedUnits = 0
  for (const row of saleRows || []) {
    const quantity = Number(row.quantity) || 0
    if (!Number(row.tracked)) untrackedUnits += quantity
    const kind = classifyProductCategory(row.category)
    if (kind === 'game') games += quantity
    else if (kind === 'tcg') tcgPacks += quantity
  }

  const { results: eventRows } = await db.prepare(`
    SELECT event_id, event_name, event_datetime
    FROM events
    WHERE event_datetime IS NOT NULL
      AND substr(event_datetime, 1, 10) >= ?
      AND substr(event_datetime, 1, 10) <= ?
    ORDER BY event_datetime, event_id
  `).bind(from, to).all()

  const { results: ticketRows } = await db.prepare(`
    SELECT t.event_id, t.user_id
    FROM tickets t
    JOIN events e ON e.event_id = t.event_id
    WHERE t.status = 'active'
      AND substr(e.event_datetime, 1, 10) >= ?
      AND substr(e.event_datetime, 1, 10) <= ?
  `).bind(from, to).all()

  const byEvent = new Map()
  for (const event of eventRows || []) {
    byEvent.set(Number(event.event_id), { tickets: 0, people: new Set() })
  }
  const people = new Set()
  for (const ticket of ticketRows || []) {
    const bucket = byEvent.get(Number(ticket.event_id))
    if (!bucket) continue
    bucket.tickets += 1
    if (ticket.user_id != null) {
      bucket.people.add(Number(ticket.user_id))
      people.add(Number(ticket.user_id))
    }
  }
  const profitById = new Map((pnlEvents || []).map(event => [Number(event.event_id), event]))
  const rows = (eventRows || []).map(event => {
    const bucket = byEvent.get(Number(event.event_id))
    const profit = profitById.get(Number(event.event_id))
    return {
      name: event.event_name || `Event ${event.event_id}`,
      date: String(event.event_datetime || '').slice(0, 10),
      tickets: bucket ? bucket.tickets : 0,
      people: bucket ? bucket.people.size : 0,
      profit_pence: Number(profit?.profit_pence) || 0
    }
  })
  return {
    games,
    tcgPacks,
    untrackedUnits,
    events: summariseEvents(rows),
    people: people.size
  }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const EXPENSE_LABELS = {
  event_costs: 'Event costs',
  postage: 'Postage and delivery',
  packaging: 'Packaging',
  supplies: 'Supplies',
  software: 'Software and subscriptions',
  other: 'Other'
}

function longDate(iso) {
  const [year, month, day] = String(iso || '').split('-')
  const name = MONTHS[Number(month) - 1]
  if (!name || !day) return String(iso || '')
  return `${Number(day)} ${name} ${year}`
}

/** Accountant column: 1,234.56 or (1,234.56). */
export function formatStatementAmount(pence) {
  const value = Number(pence) || 0
  const negative = value < 0
  const abs = Math.abs(value)
  const pounds = Math.floor(abs / 100)
  const pennies = String(abs % 100).padStart(2, '0')
  const grouped = String(pounds).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const body = `${grouped}.${pennies}`
  return negative ? `(${body})` : body
}

function heading(items, text, size, gap) {
  items.push({ text, size, bold: true, gap: gap || 20 })
}

function line(items, text, opts) {
  const o = opts || {}
  items.push({ text, size: o.size || 10, bold: !!o.bold, gap: o.gap || 14, indent: o.indent || 0 })
}

function amountRow(items, label, pence, opts) {
  const o = opts || {}
  items.push({
    text: label,
    label,
    amount: formatStatementAmount(pence),
    size: o.size || 10,
    bold: !!o.bold,
    gap: o.gap || 14,
    indent: o.indent || 0,
    rule: !!o.rule
  })
}

function blank(items, gap) {
  items.push({ text: ' ', size: 8, gap: gap || 8 })
}

function expenseRows(pnl) {
  const rows = []
  const eventGoods = Number(pnl.expenses.event_goods_pence) || 0
  const otherWriteOff = (Number(pnl.expenses.stock_write_offs_pence) || 0) - eventGoods
  if (eventGoods) rows.push(['Goods for events', eventGoods])
  if (otherWriteOff) rows.push(['Stock written off', otherWriteOff])
  rows.push(['Card processing fees', pnl.expenses.sumup_fees_pence])
  for (const category of pnl.expenses.by_category || []) {
    rows.push([EXPENSE_LABELS[category.category] || category.category, category.amount_pence])
  }
  if (pnl.expenses.supplier_bill_extras_pence) rows.push(['Carriage and other invoice costs', pnl.expenses.supplier_bill_extras_pence])
  if (pnl.expenses.card_buyback_credit_pence) rows.push(['Cards bought for store credit', pnl.expenses.card_buyback_credit_pence])
  if (pnl.expenses.store_credit_adjustments_pence) rows.push(['Store credit adjustments', pnl.expenses.store_credit_adjustments_pence])
  return rows.filter(([, amount]) => Number(amount))
}

function profitAndLossPage(items, model) {
  const pnl = model.pnl
  const stock = model.stock || { opening_pence: 0, closing_pence: 0, amount_pence: 0, invoices: [], paid_from_owner_pence: 0 }
  const excluded = pnl.excluded_untracked || { lines: 0, pence: 0 }
  heading(items, 'Dice Bastion', 16, 18)
  line(items, 'Profit and loss account', { size: 13, bold: true, gap: 16 })
  line(items, `For the period ${longDate(pnl.from)} to ${longDate(pnl.to)}`, { gap: 12 })
  line(items, 'Shop goods and event tickets. Memberships, donations and drinks are not part of these accounts.', { gap: 16 })
  items.push({ text: '£', label: '', amount: '£', bold: true, size: 10, gap: 16 })

  heading(items, 'Turnover', 12, 16)
  amountRow(items, 'Sales of goods', pnl.revenue.product_sales_pence, { indent: 12 })
  amountRow(items, 'Carriage charged to customers', pnl.revenue.shipping_pence, { indent: 12 })
  amountRow(items, 'Event ticket income', pnl.revenue.event_tickets_pence, { indent: 12 })
  amountRow(items, 'Turnover', pnl.revenue.total_pence, { bold: true, rule: true, gap: 18 })

  heading(items, 'Cost of sales', 12, 16)
  amountRow(items, 'Opening stock', stock.opening_pence, { indent: 12 })
  amountRow(items, 'Purchases of goods', stock.amount_pence, { indent: 12 })
  for (const invoice of stock.invoices || []) {
    amountRow(items, `${longDate(invoice.date)}  ${invoice.supplier}`, invoice.amount_pence, { indent: 24, size: 9, gap: 12 })
  }
  amountRow(items, 'Closing stock', -stock.closing_pence, { indent: 12 })
  const eventGoods = Number(pnl.expenses.event_goods_pence) || 0
  const otherWriteOff = (Number(pnl.expenses.stock_write_offs_pence) || 0) - eventGoods
  if (eventGoods) amountRow(items, 'Goods for events, charged in expenses', -eventGoods, { indent: 12 })
  if (otherWriteOff) amountRow(items, 'Other stock written off, charged in expenses', -otherWriteOff, { indent: 12 })
  const bridge = (Number(stock.opening_pence) || 0) + (Number(stock.amount_pence) || 0) - (Number(stock.closing_pence) || 0) - eventGoods - otherWriteOff
  const other = (Number(pnl.cost_of_goods_sold_pence) || 0) - bridge
  if (other) amountRow(items, 'Other stock movements', other, { indent: 12 })
  amountRow(items, 'Cost of goods sold', pnl.cost_of_goods_sold_pence, { bold: true, rule: true })
  amountRow(items, 'Gross profit', pnl.gross_profit_pence, { bold: true, gap: 18 })

  heading(items, 'Expenses', 12, 16)
  const expenses = expenseRows(pnl)
  if (!expenses.length) line(items, 'None in this period.', { indent: 12 })
  for (const [label, amount] of expenses) amountRow(items, label, -amount, { indent: 12 })
  amountRow(items, 'Expenses', -pnl.expenses.total_pence, { bold: true, rule: true, gap: 18 })
  amountRow(items, 'Profit for the period', pnl.net_profit_pence, { bold: true, rule: true, size: 12, gap: 18 })
  if (excluded.lines) {
    line(items, `Sales of stock with no recorded cost, ${formatStatementAmount(excluded.pence)} across ${countText(excluded.lines, 'line', 'lines')}, are left out of turnover and profit.`, { size: 9, gap: 14 })
  }
}

function balanceSheetPage(items, model) {
  const sheet = model.sheet
  const assets = sheet.assets || {}
  const liabilities = sheet.liabilities || {}
  items.push({ pageBreak: true, text: '' })
  heading(items, 'Dice Bastion', 16, 18)
  line(items, 'Balance sheet', { size: 13, bold: true, gap: 16 })
  line(items, `As at ${longDate(sheet.as_of)}`, { gap: 18 })

  heading(items, 'Assets', 12, 16)
  amountRow(items, 'Stock', assets.stock_at_cost_pence, { indent: 12 })
  amountRow(items, 'Bank and SumUp', assets.bank_and_sumup_pence, { indent: 12 })
  amountRow(items, 'Cash', assets.cash_pence, { indent: 12 })
  amountRow(items, 'Total assets', assets.total_pence, { bold: true, rule: true, gap: 18 })

  heading(items, 'Amounts owed', 12, 16)
  amountRow(items, 'Unpaid supplier bills', liabilities.unpaid_supplier_bills_pence, { indent: 12 })
  amountRow(items, 'Unpaid expenses', liabilities.unpaid_expenses_pence, { indent: 12 })
  amountRow(items, 'Store credit', liabilities.store_credit_owed_pence, { indent: 12 })
  amountRow(items, 'Total owed', liabilities.total_pence, { bold: true, rule: true })
  amountRow(items, 'Net assets', sheet.net_assets_pence, { bold: true, size: 12, gap: 18 })
  line(items, 'Net assets is what the business holds less what it owes.', { size: 9, gap: 14 })
}

function internalPage(items, model) {
  const pnl = model.pnl
  const sheet = model.sheet
  const activity = model.activity
  const notes = model.notes || {}
  const excluded = pnl.excluded_untracked || { lines: 0, pence: 0 }
  const events = activity.events
  items.push({ pageBreak: true, text: '' })
  heading(items, 'Internal breakdown', 16, 16)
  line(items, `${longDate(pnl.from)} to ${longDate(pnl.to)}`, { gap: 12 })
  line(items, 'Working notes for the period. The profit and loss account and balance sheet are the statements for the accountant.', { size: 9, gap: 18 })

  heading(items, 'Finances', 13, 18)
  const costs = (Number(pnl.cost_of_goods_sold_pence) || 0) + (Number(pnl.expenses.total_pence) || 0)
  amountRow(items, 'Revenue', pnl.revenue.total_pence, { indent: 12 })
  amountRow(items, 'Costs', costs, { indent: 12 })
  amountRow(items, 'Profit', pnl.net_profit_pence, { indent: 12, bold: true, rule: true })
  amountRow(items, 'Reinvestment', model.reinvestment_pence, { indent: 12 })
  line(items, 'Reinvestment is the cost of stock imported in this period.', { size: 9, indent: 12, gap: 13 })
  const held = sheet.liabilities.store_credit_customer_balances_pence
  amountRow(items, 'TCG store credit held', held == null ? sheet.liabilities.store_credit_owed_pence : held, { indent: 12 })
  amountRow(items, 'Card buybacks issued in the period', pnl.expenses.card_buyback_credit_pence || 0, { indent: 12 })
  const finalBalance = (Number(sheet.assets.bank_and_sumup_pence) || 0) + (Number(sheet.assets.cash_pence) || 0)
  amountRow(items, 'Final balance', finalBalance, { indent: 12, bold: true, rule: true })
  line(items, 'Final balance is bank and cash. A bill is a business cost whichever account paid it.', { size: 9, indent: 12, gap: 13 })
  line(items, 'Memberships, donations and drinks stay in Club accounts. Personal money is reconciled at the bank.', { size: 9, indent: 12, gap: 14 })
  noteLines(items, notes.finances)

  heading(items, 'Events', 13, 18)
  amountRow(items, 'Events run', events.count, { indent: 12 })
  items[items.length - 1].amount = String(events.count)
  if (!events.list.length) line(items, 'No events in these dates.', { indent: 12 })
  for (const event of events.list) {
    amountRow(items, `${longDate(event.date)}  ${event.name}`, event.profit_pence, { indent: 12, size: 9, gap: 12 })
    line(items, `${countText(event.tickets, 'ticket', 'tickets')}, ${countText(event.people, 'account', 'accounts')}`, { size: 9, indent: 24, gap: 13 })
  }
  blank(items, 6)
  line(items, `Total attendees: ${countText(events.attendees, 'ticket', 'tickets')}, ${countText(activity.people, 'individual account', 'individual accounts')}.`, { indent: 12 })
  line(items, `Average attendance: ${attendanceText(events.averageAttendance)}.`, { indent: 12 })
  line(items, `Average profit per event: ${formatGbp(events.averageProfitPence)}.`, { indent: 12 })
  line(items, events.best
    ? `Most successful event: ${events.best.name} (${formatGbp(events.best.profit_pence)}).`
    : 'Most successful event: none made a profit.', { indent: 12 })
  line(items, events.low.length
    ? `Unsuccessful events: ${events.low.map(event => `${event.name} (${countText(event.tickets, 'ticket', 'tickets')})`).join('; ')}.`
    : 'Unsuccessful events: none.', { indent: 12, gap: 13 })
  line(items, 'An event is listed as unsuccessful when its attendance is under half the average.', { size: 9, indent: 12, gap: 14 })
  noteLines(items, notes.events)

  heading(items, 'Sales', 13, 18)
  amountRow(items, 'Games sold', activity.games, { indent: 12 })
  items[items.length - 1].amount = String(activity.games)
  amountRow(items, 'TCG packs sold', activity.tcgPacks, { indent: 12 })
  items[items.length - 1].amount = String(activity.tcgPacks)
  amountRow(items, 'Revenue', pnl.revenue.product_sales_pence, { indent: 12, bold: true, rule: true })
  line(items, 'Sales revenue is product sales with a recorded cost. Tickets are in Finances.', { size: 9, indent: 12, gap: 13 })
  line(items, `Games and TCG packs include ${activity.untrackedUnits} units of older stock with no recorded cost. Those sales are excluded from revenue: ${formatGbp(excluded.pence)}.`, { size: 9, indent: 12, gap: 14 })
  noteLines(items, notes.sales)

  heading(items, 'Receipts', 13, 18)
  const receipts = model.receipts || []
  if (!receipts.length) line(items, 'No stock imports or expenses in these dates.', { indent: 12 })
  for (const row of receipts) {
    amountRow(items, `${longDate(row.date)}  ${row.label}`, row.amount_pence, { indent: 12, size: 9, gap: 12 })
    line(items, row.file ? `Receipt file ${row.file}` : 'No receipt file', { size: 9, indent: 24, gap: 13 })
  }
}

export function accountsPdfLines(model) {
  const items = []
  profitAndLossPage(items, model)
  balanceSheetPage(items, model)
  internalPage(items, model)
  return items
}

export function buildAccountsPdf(model) {
  return buildTextPdf(accountsPdfLines(model))
}
