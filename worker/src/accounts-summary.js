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

function moneyLine(items, label, pence) {
  pushWrapped(items, `${label}: ${formatGbp(pence)}`)
}

export function accountsPdfLines(model) {
  const pnl = model.pnl
  const sheet = model.sheet
  const activity = model.activity
  const notes = model.notes || {}
  const items = []
  items.push({ text: 'Dice Bastion accounts', size: 16, gap: 20 })
  pushWrapped(items, `${pnl.from} to ${pnl.to}`, { size: 12, gap: 18 })
  pushWrapped(items, 'Shop products and event tickets. Memberships, donations and drinks stay in Club accounts.', { gap: 20 })

  items.push({ text: 'Profit and loss', size: 14, gap: 18 })
  moneyLine(items, 'Product sales', pnl.revenue.product_sales_pence)
  moneyLine(items, 'Shipping charged', pnl.revenue.shipping_pence)
  moneyLine(items, 'Event tickets', pnl.revenue.event_tickets_pence)
  moneyLine(items, 'Total revenue', pnl.revenue.total_pence)
  moneyLine(items, 'Cost of goods sold', -pnl.cost_of_goods_sold_pence)
  moneyLine(items, 'Gross profit', pnl.gross_profit_pence)
  moneyLine(items, 'Expenses', -pnl.expenses.total_pence)
  moneyLine(items, 'Net profit', pnl.net_profit_pence)
  const excluded = pnl.excluded_untracked || { lines: 0, pence: 0 }
  pushWrapped(items, `Excluded sales of stock with no recorded cost: ${formatGbp(excluded.pence)} across ${countText(excluded.lines || 0, 'line', 'lines')}.`, { gap: 20 })

  items.push({ text: 'Balance sheet', size: 14, gap: 18 })
  pushWrapped(items, `As at ${sheet.as_of}`, { gap: 16 })
  moneyLine(items, 'Stock at cost', sheet.assets.stock_at_cost_pence)
  moneyLine(items, 'Bank and SumUp', sheet.assets.bank_and_sumup_pence)
  moneyLine(items, 'Cash', sheet.assets.cash_pence)
  moneyLine(items, 'Store credit owed', sheet.liabilities.store_credit_owed_pence)
  moneyLine(items, 'Unpaid supplier bills', sheet.liabilities.unpaid_supplier_bills_pence)
  moneyLine(items, 'Unpaid expenses', sheet.liabilities.unpaid_expenses_pence)
  moneyLine(items, 'Net assets', sheet.net_assets_pence)
  items.push({ text: ' ', size: 11, gap: 10 })

  items.push({ text: 'Internal breakdown', size: 14, gap: 18 })
  items.push({ text: 'Finances', size: 12, gap: 16 })
  const costs = (Number(pnl.cost_of_goods_sold_pence) || 0) + (Number(pnl.expenses.total_pence) || 0)
  moneyLine(items, 'Revenue', pnl.revenue.total_pence)
  moneyLine(items, 'Costs', costs)
  moneyLine(items, 'Profit', pnl.net_profit_pence)
  moneyLine(items, 'Reinvestment', model.reinvestment_pence)
  pushWrapped(items, 'Reinvestment is the cost of stock imported in this period.', { gap: 14 })
  const held = sheet.liabilities.store_credit_customer_balances_pence
  moneyLine(items, 'TCG store credit held', held == null ? sheet.liabilities.store_credit_owed_pence : held)
  moneyLine(items, 'Card buybacks issued in the period', pnl.expenses.card_buyback_credit_pence || 0)
  const finalBalance = (Number(sheet.assets.bank_and_sumup_pence) || 0) + (Number(sheet.assets.cash_pence) || 0)
  moneyLine(items, 'Final balance', finalBalance)
  pushWrapped(items, 'Final balance is bank and cash for shop and events.', { gap: 14 })
  pushWrapped(items, 'Memberships, donations and drinks stay in Club accounts. Personal money is reconciled at the bank and is not included here.', { gap: 16 })
  noteLines(items, notes.finances)

  items.push({ text: 'Events', size: 12, gap: 16 })
  const events = activity.events
  pushWrapped(items, `Events run: ${events.count}.`)
  if (!events.list.length) {
    pushWrapped(items, 'No events in these dates.')
  }
  for (const event of events.list) {
    pushWrapped(items, `${event.date} ${event.name}: ${countText(event.tickets, 'ticket', 'tickets')}, ${countText(event.people, 'account', 'accounts')}, profit ${formatGbp(event.profit_pence)}.`)
  }
  pushWrapped(items, `Total attendees: ${countText(events.attendees, 'ticket', 'tickets')}, ${countText(activity.people, 'individual account', 'individual accounts')}.`)
  pushWrapped(items, `Average attendance: ${attendanceText(events.averageAttendance)}.`)
  pushWrapped(items, `Average profit per event: ${formatGbp(events.averageProfitPence)}.`)
  pushWrapped(items, events.best
    ? `Most successful event: ${events.best.name} (${formatGbp(events.best.profit_pence)}).`
    : 'Most successful event: none made a profit.')
  pushWrapped(items, events.low.length
    ? `Unsuccessful events: ${events.low.map(event => `${event.name} (${countText(event.tickets, 'ticket', 'tickets')})`).join('; ')}.`
    : 'Unsuccessful events: none.')
  pushWrapped(items, 'An event is listed as unsuccessful when its attendance is under half the average.', { gap: 16 })
  noteLines(items, notes.events)

  items.push({ text: 'Sales', size: 12, gap: 16 })
  pushWrapped(items, `Games sold: ${activity.games}.`)
  pushWrapped(items, `TCG packs sold: ${activity.tcgPacks}.`)
  moneyLine(items, 'Revenue', pnl.revenue.product_sales_pence)
  pushWrapped(items, 'Sales revenue is product sales with a recorded cost. Tickets are in the finances section.', { gap: 14 })
  pushWrapped(items, `Games and TCG packs include units of older stock with no recorded cost (${activity.untrackedUnits} such units). Those sales are excluded from revenue: ${formatGbp(excluded.pence)}.`, { gap: 16 })
  noteLines(items, notes.sales)

  items.push({ text: 'Receipts', size: 12, gap: 16 })
  const receipts = model.receipts || []
  if (!receipts.length) pushWrapped(items, 'No stock imports or expenses in these dates.')
  for (const row of receipts) {
    const file = row.file ? ` File ${row.file}.` : ' No receipt file.'
    pushWrapped(items, `${row.date} ${row.label}: ${formatGbp(row.amount_pence)}.${file}`)
  }
  return items
}

export function buildAccountsPdf(model) {
  return buildTextPdf(accountsPdfLines(model))
}
