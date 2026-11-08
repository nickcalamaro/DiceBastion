/**
 * Date-range accounts pack: statements, import lines, expenses, events, and receipt files.
 */

import { buildBalanceSheet, buildPnl, dayBefore, ensureLedgerSchema, purchasesInPeriod, stockAtCost } from './shop-ledger.js'
import { buildAccountsPdf, collectPeriodActivity } from './accounts-summary.js'
import { unzipStore, zipStore } from './zip-store.js'

const RECEIPT_BUDGET = 24 * 1024 * 1024

const EXPENSE_LABELS = {
  event_costs: 'Event costs',
  postage: 'Postage and delivery',
  packaging: 'Packaging',
  supplies: 'Supplies',
  software: 'Software and subscriptions',
  other: 'Other'
}

function csvCell(value) {
  return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"'
}

function csv(rows) {
  return rows.map(row => row.map(csvCell).join(',')).join('\n') + '\n'
}

function pounds(pence) {
  return ((Number(pence) || 0) / 100).toFixed(2)
}

function encode(text) {
  return new TextEncoder().encode(text)
}

function receiptFilename(prefix, id, key) {
  const ext = String(key || '').split('.').pop()
  const safeExt = /^[a-z0-9]{2,5}$/i.test(ext) ? ext.toLowerCase() : 'bin'
  return `${prefix}-${id}.${safeExt}`
}

function pnlCsv(pnl) {
  const rows = [
    ['Profit and loss', `${pnl.from} to ${pnl.to}`],
    ['Books start date', pnl.books_start_date || ''],
    [],
    ['Line', 'GBP'],
    ['Product sales', pounds(pnl.revenue.product_sales_pence)],
    ['Shipping charged', pounds(pnl.revenue.shipping_pence)],
    ['Event tickets', pounds(pnl.revenue.event_tickets_pence)],
    ['Total revenue', pounds(pnl.revenue.total_pence)],
    ['Cost of goods sold', pounds(-pnl.cost_of_goods_sold_pence)],
    ['Gross profit', pounds(pnl.gross_profit_pence)]
  ]
  rows.push(['SumUp fees', pounds(-pnl.expenses.sumup_fees_pence)])
  rows.push(['Stock written off', pounds(-pnl.expenses.stock_write_offs_pence)])
  for (const category of pnl.expenses.by_category) {
    rows.push([EXPENSE_LABELS[category.category] || category.category, pounds(-category.amount_pence)])
  }
  rows.push(['Supplier bill costs not in stock', pounds(-pnl.expenses.supplier_bill_extras_pence)])
  rows.push(['Cards bought for store credit', pounds(-(pnl.expenses.card_buyback_credit_pence || 0))])
  rows.push(['Store credit adjustments', pounds(-(pnl.expenses.store_credit_adjustments_pence || 0))])
  rows.push(['Total expenses', pounds(-pnl.expenses.total_pence)])
  rows.push(['Net profit', pounds(pnl.net_profit_pence)])
  const excluded = pnl.excluded_untracked || { lines: 0, pence: 0 }
  rows.push([])
  rows.push(['Excluded sales of stock with no recorded cost', pounds(excluded.pence)])
  rows.push(['Excluded lines', excluded.lines || 0])
  rows.push([])
  rows.push(['Product', 'Units', 'Revenue GBP', 'Cost GBP', 'Gross profit GBP'])
  for (const product of pnl.products) {
    rows.push([product.name, product.units, pounds(product.revenue_pence), pounds(product.cogs_pence), pounds(product.gross_profit_pence)])
  }
  return csv(rows)
}

function balanceCsv(sheet) {
  const rows = [
    ['Balance sheet', sheet.as_of],
    [],
    ['Line', 'GBP'],
    ['Stock at cost', pounds(sheet.assets.stock_at_cost_pence)],
    ['Bank and SumUp', pounds(sheet.assets.bank_and_sumup_pence)],
    ['Cash', pounds(sheet.assets.cash_pence)],
    ['Total assets', pounds(sheet.assets.total_pence)],
    ['Unpaid supplier bills', pounds(sheet.liabilities.unpaid_supplier_bills_pence)],
    ['Unpaid expenses', pounds(sheet.liabilities.unpaid_expenses_pence)],
    ['Store credit owed', pounds(sheet.liabilities.store_credit_owed_pence)],
    ['Total liabilities', pounds(sheet.liabilities.total_pence)],
    ['Net assets', pounds(sheet.net_assets_pence)]
  ]
  return csv(rows)
}

function readme(from, to, omitted) {
  const lines = [
    `Dice Bastion shop and events accounts, ${from} to ${to}.`,
    '',
    'Profit and loss counts product sales only where a cost was recorded through a stock import.',
    'Sales of older stock with no cost are listed as excluded. They are not income and not profit.',
    'Ticket sales and event costs on or after the books start date are included.',
    'Each import line names the receipt file in the receipts folder.',
    'Each expense names its receipt file when one was saved.',
    'accounts.pdf is the profit and loss account, the balance sheet, and an internal breakdown.',
    'Invoices are a business cost whichever account paid them. Goods bought for events and written off are included in expenses.'
  ]
  if (omitted.length) {
    lines.push('', 'Some receipt files were not included in this zip. Download each one from the finance page.')
    lines.push(...omitted)
  }
  return lines.join('\n') + '\n'
}

/**
 * @param {object} db
 * @param {{ get: Function } | null} bucket
 * @param {string} from
 * @param {string} to
 * @param {{ finances?: string, events?: string, sales?: string }} [notes]
 */
export async function buildAccountsPack(db, bucket, from, to, notes) {
  await ensureLedgerSchema(db)
  const pnl = await buildPnl(db, from, to)
  const sheet = await buildBalanceSheet(db, to)

  const { results: importRows } = await db.prepare(`
    SELECT s.id AS session_id, s.supplier, s.received_date, s.reference, s.receipt_key,
           s.invoice_currency, s.settlement_amount_pence,
           COALESCE(p.name, l.name) AS item_name, l.ean, l.quantity, l.unit_cost_pence, l.unit_foreign_minor
    FROM stock_import_sessions s
    JOIN stock_import_lines l ON l.session_id = s.id
    LEFT JOIN products p ON p.id = l.product_id
    WHERE s.received_date >= ? AND s.received_date <= ?
    ORDER BY s.received_date, s.id, l.id
  `).bind(from, to).all()

  const { results: expenseRows } = await db.prepare(`
    SELECT be.id, be.expense_date, be.category, be.description, be.amount_pence, be.receipt_key,
           e.event_name
    FROM business_expenses be
    LEFT JOIN events e ON e.event_id = be.event_id
    WHERE be.expense_date >= ? AND be.expense_date <= ?
    ORDER BY be.expense_date, be.id
  `).bind(from, to).all()

  const importFileBySession = new Map()
  for (const row of importRows || []) {
    if (row.receipt_key && !importFileBySession.has(row.session_id)) {
      importFileBySession.set(row.session_id, receiptFilename('import', row.session_id, row.receipt_key))
    }
  }
  const expenseFileById = new Map()
  for (const row of expenseRows || []) {
    if (row.receipt_key) expenseFileById.set(row.id, receiptFilename('expense', row.id, row.receipt_key))
  }

  const importCsv = csv([
    ['Session', 'Date', 'Supplier', 'Reference', 'Item', 'EAN', 'Quantity', 'Unit cost GBP', 'Invoice currency', 'Unit cost in invoice currency', 'GBP settlement for the invoice', 'Receipt file'],
    ...(importRows || []).map(row => [
      row.session_id,
      row.received_date,
      row.supplier,
      row.reference || '',
      row.item_name || '',
      row.ean || '',
      row.quantity,
      pounds(row.unit_cost_pence),
      row.invoice_currency || 'GBP',
      row.unit_foreign_minor != null ? (Number(row.unit_foreign_minor) / 100).toFixed(2) : '',
      row.settlement_amount_pence != null ? pounds(row.settlement_amount_pence) : '',
      importFileBySession.get(row.session_id) || ''
    ])
  ])

  const expenseCsv = csv([
    ['Date', 'Category', 'Description', 'Event', 'Amount GBP', 'Receipt file'],
    ...(expenseRows || []).map(row => [
      row.expense_date,
      EXPENSE_LABELS[row.category] || row.category,
      row.description || '',
      row.event_name || '',
      pounds(row.amount_pence),
      expenseFileById.get(row.id) || ''
    ])
  ])

  const eventCsv = csv([
    ['Event', 'Date', 'Tickets', 'Revenue GBP', 'SumUp fees GBP', 'Linked costs GBP', 'Profit GBP'],
    ...(pnl.events || []).map(event => [
      event.name,
      String(event.event_datetime || '').slice(0, 10),
      event.tickets,
      pounds(event.revenue_pence),
      pounds(event.fee_pence),
      pounds(event.cost_pence),
      pounds(event.profit_pence)
    ])
  ])

  const files = [
    { name: 'readme.txt', data: encode('') },
    { name: 'accounts.pdf', data: new Uint8Array() },
    { name: 'profit-and-loss.csv', data: encode(pnlCsv(pnl)) },
    { name: 'balance-sheet.csv', data: encode(balanceCsv(sheet)) },
    { name: 'stock-imports.csv', data: encode(importCsv) },
    { name: 'expenses.csv', data: encode(expenseCsv) },
    { name: 'events.csv', data: encode(eventCsv) }
  ]

  const wanted = []
  for (const [id, filename] of importFileBySession) {
    const row = (importRows || []).find(item => item.session_id === id)
    wanted.push({ key: row.receipt_key, filename })
  }
  for (const [id, filename] of expenseFileById) {
    const row = (expenseRows || []).find(item => item.id === id)
    wanted.push({ key: row.receipt_key, filename })
  }

  const omitted = []
  let used = 0
  for (const item of wanted) {
    if (!bucket || typeof bucket.get !== 'function') {
      omitted.push(item.filename)
      continue
    }
    const object = await bucket.get(item.key)
    if (!object) {
      omitted.push(`${item.filename} (file missing from storage)`)
      continue
    }
    const bytes = new Uint8Array(await object.arrayBuffer())
    if (used + bytes.length > RECEIPT_BUDGET) {
      omitted.push(`${item.filename} (left out so the pack stays a manageable size)`)
      continue
    }
    used += bytes.length
    files.push({ name: `receipts/${item.filename}`, data: bytes })
  }

  files[0].data = encode(readme(from, to, omitted))
  const activity = await collectPeriodActivity(db, pnl.from, pnl.to, pnl.books_start_date, pnl.events)
  const periodFrom = pnl.from > pnl.books_start_date ? pnl.from : pnl.books_start_date
  const [opening, closing, purchases] = await Promise.all([
    stockAtCost(db, dayBefore(periodFrom)),
    stockAtCost(db, pnl.to),
    purchasesInPeriod(db, periodFrom, pnl.to)
  ])
  const receiptRows = receiptRegister(sessionTotals(importRows), expenseRows, importFileBySession, expenseFileById)
  files[1].data = buildAccountsPdf({
    pnl,
    sheet,
    activity,
    notes: notes || {},
    reinvestment_pence: receiptRows.reinvestment_pence,
    receipts: receiptRows.rows,
    stock: {
      opening_pence: opening,
      closing_pence: closing,
      amount_pence: purchases.amount_pence,
      paid_from_owner_pence: purchases.paid_from_owner_pence,
      invoices: purchases.invoices
    }
  })
  return zipStore(files)
}

function sessionTotals(importRows) {
  const sessions = new Map()
  for (const row of importRows || []) {
    if (!sessions.has(row.session_id)) {
      sessions.set(row.session_id, {
        id: row.session_id,
        date: row.received_date,
        label: row.supplier,
        receipt_key: row.receipt_key,
        amount_pence: 0
      })
    }
    const session = sessions.get(row.session_id)
    session.amount_pence += (Number(row.quantity) || 0) * (Number(row.unit_cost_pence) || 0)
  }
  return [...sessions.values()]
}

function receiptRegister(sessions, expenseRows, importFiles, expenseFiles) {
  const rows = []
  let reinvestment = 0
  for (const session of sessions) {
    reinvestment += session.amount_pence
    rows.push({
      date: session.date,
      label: session.label,
      amount_pence: session.amount_pence,
      file: importFiles.get(session.id) || ''
    })
  }
  for (const expense of expenseRows || []) {
    rows.push({
      date: expense.expense_date,
      label: expense.description || expense.category,
      amount_pence: Number(expense.amount_pence) || 0,
      file: expenseFiles.get(expense.id) || ''
    })
  }
  return { rows, reinvestment_pence: reinvestment }
}

/** Summary PDF on its own, without the receipt files. */
export async function buildAccountsSummaryPdf(db, from, to, notes) {
  const packed = await buildAccountsPack(db, null, from, to, notes)
  const pdf = unzipStore(packed).find(file => file.name === 'accounts.pdf')
  if (!pdf) throw new Error('summary_missing')
  return pdf.data
}
