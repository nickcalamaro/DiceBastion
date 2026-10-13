/**
 * Shop and events accounts: FIFO stock batches, cost of goods sold, supplier bills,
 * expenses, owner money, and the P&L / balance sheet built from them.
 *
 * Only shop sales with a recorded cost (stock_movements rows) and event tickets count.
 * Drinks walk-ins stay in Club accounts. All amounts are integer pence.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const BUNDLE_MEMBERSHIP_PENCE = { monthly: 1000, quarterly: 2500, annual: 9000 }

export const EXPENSE_CATEGORIES = ['event_costs', 'postage', 'packaging', 'supplies', 'software', 'other']
export const PAID_FROM = ['bank', 'cash', 'owner']
export const OWNER_ACCOUNTS = ['bank', 'cash']

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS supplier_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier TEXT NOT NULL,
    bill_date TEXT NOT NULL,
    reference TEXT,
    total_pence INTEGER NOT NULL,
    paid_date TEXT,
    paid_from TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  `CREATE TABLE IF NOT EXISTS stock_lots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    received_date TEXT NOT NULL,
    supplier TEXT,
    quantity_received INTEGER NOT NULL,
    quantity_remaining INTEGER NOT NULL,
    unit_cost_pence INTEGER NOT NULL,
    supplier_bill_id INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  `CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    lot_id INTEGER,
    order_id INTEGER,
    order_item_id INTEGER,
    movement_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost_pence INTEGER NOT NULL DEFAULT 0,
    occurred_at TEXT NOT NULL,
    reason TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS business_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_date TEXT NOT NULL,
    category TEXT NOT NULL,
    event_id INTEGER,
    description TEXT,
    amount_pence INTEGER NOT NULL,
    paid_date TEXT,
    paid_from TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  `CREATE TABLE IF NOT EXISTS owner_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movement_date TEXT NOT NULL,
    type TEXT NOT NULL,
    account TEXT NOT NULL DEFAULT 'bank',
    amount_pence INTEGER NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  `CREATE TABLE IF NOT EXISTS finance_settings (key TEXT PRIMARY KEY, value TEXT)`,
  `CREATE TABLE IF NOT EXISTS stock_import_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier TEXT NOT NULL,
    received_date TEXT NOT NULL,
    reference TEXT,
    receipt_url TEXT,
    notes TEXT,
    paid_date TEXT,
    paid_from TEXT,
    supplier_bill_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  `CREATE TABLE IF NOT EXISTS stock_import_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    ean TEXT,
    name TEXT,
    quantity INTEGER NOT NULL,
    unit_cost_pence INTEGER NOT NULL,
    entry_method TEXT NOT NULL,
    lot_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`,
  'CREATE INDEX IF NOT EXISTS idx_stock_lots_product ON stock_lots (product_id, received_date, id)',
  'CREATE INDEX IF NOT EXISTS idx_stock_import_lines_session ON stock_import_lines (session_id)',
  'CREATE INDEX IF NOT EXISTS idx_stock_lots_bill ON stock_lots (supplier_bill_id)',
  'CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements (order_item_id)',
  'CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements (occurred_at)',
  'CREATE INDEX IF NOT EXISTS idx_supplier_bills_date ON supplier_bills (bill_date)',
  'CREATE INDEX IF NOT EXISTS idx_business_expenses_date ON business_expenses (expense_date)',
  'CREATE INDEX IF NOT EXISTS idx_owner_movements_date ON owner_movements (movement_date)'
]

let schemaReady = false

/** Creates ledger tables if missing (once per isolate) and seeds books_start_date. */
export async function ensureLedgerSchema(db) {
  if (schemaReady) return
  try {
    await db.prepare('ALTER TABLE products ADD COLUMN cost_tracked INTEGER DEFAULT 0').run()
  } catch (_) {
    // Column already exists
  }
  for (const sql of SCHEMA_STATEMENTS) {
    await db.prepare(sql).run()
  }
  await db.prepare(
    "INSERT OR IGNORE INTO finance_settings (key, value) VALUES ('books_start_date', ?)"
  ).bind(todayIso()).run()
  schemaReady = true
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function parseLedgerDate(value) {
  const s = String(value || '').trim()
  if (!ISO_DATE_RE.test(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return s
}

export function parsePence(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null
  return n
}

export async function getBooksStartDate(db) {
  const row = await db.prepare("SELECT value FROM finance_settings WHERE key = 'books_start_date'").first()
  return parseLedgerDate(row?.value) || todayIso()
}

// ---------------------------------------------------------------------------
// Stock batches and cost movements
// ---------------------------------------------------------------------------

/**
 * Takes `quantity` units out of the product's batches, oldest first, and records a
 * stock_movements row per batch used. Units with no batch left are recorded at zero cost
 * with reason 'no_cost_batch'. Returns the total cost in pence.
 */
export async function consumeFifo(db, {
  productId, quantity, movementType = 'sale', orderId = null, orderItemId = null, reason = null, occurredAt
}) {
  const when = occurredAt || new Date().toISOString()
  let remaining = Math.max(0, Number(quantity) || 0)
  let totalCost = 0

  for (let attempt = 0; remaining > 0 && attempt < 100; attempt++) {
    const lot = await db.prepare(`
      SELECT id, quantity_remaining, unit_cost_pence
      FROM stock_lots
      WHERE product_id = ? AND quantity_remaining > 0
      ORDER BY received_date ASC, id ASC
      LIMIT 1
    `).bind(productId).first()
    if (!lot) break

    const take = Math.min(remaining, Number(lot.quantity_remaining))
    const upd = await db.prepare(`
      UPDATE stock_lots SET quantity_remaining = quantity_remaining - ?
      WHERE id = ? AND quantity_remaining >= ?
    `).bind(take, lot.id, take).run()
    if (!Number(upd.meta?.changes ?? 0)) continue

    await db.prepare(`
      INSERT INTO stock_movements (product_id, lot_id, order_id, order_item_id, movement_type, quantity, unit_cost_pence, occurred_at, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(productId, lot.id, orderId, orderItemId, movementType, take, Number(lot.unit_cost_pence), when, reason).run()
    totalCost += take * Number(lot.unit_cost_pence)
    remaining -= take
  }

  if (remaining > 0) {
    await db.prepare(`
      INSERT INTO stock_movements (product_id, lot_id, order_id, order_item_id, movement_type, quantity, unit_cost_pence, occurred_at, reason)
      VALUES (?, NULL, ?, ?, ?, ?, 0, ?, 'no_cost_batch')
    `).bind(productId, orderId, orderItemId, movementType, remaining, when).run()
  }
  return totalCost
}

/** Records cost of goods sold for every tracked line on an order (skips lines already recorded). */
export async function recordOrderCosts(db, orderId, occurredAt) {
  await ensureLedgerSchema(db)
  const { results } = await db.prepare(`
    SELECT oi.id, oi.product_id, oi.quantity
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ? AND IFNULL(p.cost_tracked, 0) = 1
      AND NOT EXISTS (SELECT 1 FROM stock_movements sm WHERE sm.order_item_id = oi.id)
  `).bind(orderId).all()
  for (const item of results || []) {
    await consumeFifo(db, {
      productId: item.product_id,
      quantity: item.quantity,
      movementType: 'sale',
      orderId,
      orderItemId: item.id,
      occurredAt
    })
  }
}

/**
 * Adds a stock batch, increases product stock and marks the product cost-tracked.
 * Links to an existing bill, or creates one for quantity x unit cost.
 */
export async function receiveStock(db, input) {
  await ensureLedgerSchema(db)
  const productId = parseInt(input.product_id, 10)
  const quantity = parseInt(input.quantity, 10)
  const unitCost = parsePence(input.unit_cost_pence)
  const receivedDate = parseLedgerDate(input.received_date) || todayIso()
  const supplier = String(input.supplier || '').trim().slice(0, 200)
  const notes = input.notes ? String(input.notes).trim().slice(0, 1000) : null

  if (!productId || productId <= 0) return { error: 'invalid_product_id' }
  if (!quantity || quantity <= 0 || quantity > 100000) return { error: 'invalid_quantity' }
  if (unitCost == null) return { error: 'invalid_unit_cost' }

  const product = await db.prepare('SELECT id, name FROM products WHERE id = ?').bind(productId).first()
  if (!product) return { error: 'product_not_found' }

  let billId = input.supplier_bill_id != null && input.supplier_bill_id !== ''
    ? parseInt(input.supplier_bill_id, 10)
    : null
  if (billId) {
    const bill = await db.prepare('SELECT id FROM supplier_bills WHERE id = ?').bind(billId).first()
    if (!bill) return { error: 'bill_not_found' }
  } else {
    if (!supplier) return { error: 'missing_supplier' }
    const paid = !!input.paid
    const paidFrom = paid ? (PAID_FROM.includes(input.paid_from) ? input.paid_from : 'bank') : null
    const bill = await db.prepare(`
      INSERT INTO supplier_bills (supplier, bill_date, reference, total_pence, paid_date, paid_from, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
    `).bind(
      supplier,
      receivedDate,
      input.reference ? String(input.reference).trim().slice(0, 200) : null,
      quantity * unitCost,
      paid ? (parseLedgerDate(input.paid_date) || receivedDate) : null,
      paidFrom,
      `Stock: ${product.name}`
    ).first()
    billId = bill.id
  }

  const lot = await db.prepare(`
    INSERT INTO stock_lots (product_id, received_date, supplier, quantity_received, quantity_remaining, unit_cost_pence, supplier_bill_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
  `).bind(productId, receivedDate, supplier || null, quantity, quantity, unitCost, billId, notes).first()

  await db.prepare(`
    UPDATE products
    SET stock_quantity = IFNULL(stock_quantity, 0) + ?, cost_tracked = 1, updated_at = ?
    WHERE id = ?
  `).bind(quantity, new Date().toISOString(), productId).run()

  return { lot_id: lot.id, supplier_bill_id: billId }
}

/** Removes units from stock (damaged, lost, used as a prize) at FIFO cost. */
export async function writeOffStock(db, input) {
  await ensureLedgerSchema(db)
  const productId = parseInt(input.product_id, 10)
  const quantity = parseInt(input.quantity, 10)
  const reason = String(input.reason || '').trim().slice(0, 300) || 'Written off'
  if (!productId || productId <= 0) return { error: 'invalid_product_id' }
  if (!quantity || quantity <= 0) return { error: 'invalid_quantity' }

  const product = await db.prepare('SELECT id, cost_tracked FROM products WHERE id = ?').bind(productId).first()
  if (!product) return { error: 'product_not_found' }
  if (!Number(product.cost_tracked)) return { error: 'product_not_cost_tracked' }

  const upd = await db.prepare(`
    UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = ?
    WHERE id = ? AND stock_quantity >= ?
  `).bind(quantity, new Date().toISOString(), productId, quantity).run()
  if (!Number(upd.meta?.changes ?? 0)) return { error: 'insufficient_stock' }

  const occurredAt = parseLedgerDate(input.date)
    ? `${input.date}T12:00:00.000Z`
    : new Date().toISOString()
  const cost = await consumeFifo(db, { productId, quantity, movementType: 'write_off', reason, occurredAt })
  return { cost_pence: cost }
}

// ---------------------------------------------------------------------------
// Stock import sessions (one receipt, many stock lines)
// ---------------------------------------------------------------------------

const ENTRY_METHODS = ['barcode', 'manual']

function slugifyName(name) {
  const base = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  return base || 'product'
}

async function uniqueProductSlug(db, name) {
  const base = slugifyName(name)
  for (let i = 0; i < 40; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`
    const row = await db.prepare('SELECT id FROM products WHERE slug = ?').bind(slug).first()
    if (!row) return slug
  }
  return `${base}-${Date.now()}`
}

function cleanEan(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 14) return null
  return digits
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function safeDescriptionHtml(html) {
  const cleaned = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .trim()
  return cleaned ? cleaned.slice(0, 8000) : null
}

/** Stores catalog HTML as-is, and plain text typed in the import form as paragraphs. */
function toStoredDescription(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (/<\/?[a-z][^>]*>/i.test(raw)) return safeDescriptionHtml(raw)
  const html = raw.split(/\n{2,}/).map((part) => {
    const paragraph = part.trim()
    if (!paragraph) return ''
    return `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`
  }).filter(Boolean).join('')
  return html ? html.slice(0, 8000) : null
}

function copyFromInput(input) {
  const summary = input.summary ? String(input.summary).trim().slice(0, 500) : null
  return {
    summary: summary || null,
    fullDescription: toStoredDescription(input.description),
    image: cleanUrl(input.image_url),
    category: input.category ? String(input.category).trim().slice(0, 200) : null
  }
}

/** Writes the summary, description and selling price entered on the import form. */
async function applySubmittedCopy(db, productId, input) {
  const copy = copyFromInput(input)
  if (copy.image === undefined) copy.image = null
  const price = parsePence(input.price_pence)
  const row = await db.prepare('SELECT image_url, category FROM products WHERE id = ?').bind(productId).first()
  if (!row) return []

  const sets = []
  const binds = []
  const filled = []
  if (copy.summary) {
    sets.push('summary = ?', 'description = ?')
    binds.push(copy.summary, copy.summary)
    filled.push('summary')
  }
  if (copy.fullDescription) {
    sets.push('full_description = ?')
    binds.push(copy.fullDescription)
    filled.push('full_description')
  }
  if (price != null && price > 0) {
    sets.push('price = ?')
    binds.push(price)
    filled.push('price')
  }
  if (copy.image && !String(row.image_url || '').trim()) {
    sets.push('image_url = ?')
    binds.push(copy.image)
    filled.push('image')
  }
  if (copy.category && !String(row.category || '').trim()) {
    sets.push('category = ?')
    binds.push(copy.category)
    filled.push('category')
  }
  if (!sets.length) return []
  sets.push('updated_at = ?')
  binds.push(new Date().toISOString(), productId)
  await db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run()
  return filled
}

/** https URL or site path. null when blank, undefined when not a usable URL. */
function cleanUrl(value) {
  if (value == null || String(value).trim() === '') return null
  const s = String(value).trim().slice(0, 500)
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s
  return undefined
}

function paidFields(input, fallbackDate) {
  if (!input.paid_from) return { paidDate: null, paidFrom: null }
  if (!PAID_FROM.includes(input.paid_from)) return { error: 'invalid_paid_from' }
  if (input.paid_date && !parseLedgerDate(input.paid_date)) return { error: 'invalid_paid_date' }
  return { paidDate: parseLedgerDate(input.paid_date) || fallbackDate, paidFrom: input.paid_from }
}

/** Starts a receipt session and the supplier bill its stock lines add up to. */
export async function createImportSession(db, input) {
  await ensureLedgerSchema(db)
  const supplier = String(input.supplier || '').trim().slice(0, 200)
  if (!supplier) return { error: 'missing_supplier' }
  const receivedDate = parseLedgerDate(input.received_date) || todayIso()
  const reference = input.reference ? String(input.reference).trim().slice(0, 200) : null
  const notes = input.notes ? String(input.notes).trim().slice(0, 1000) : null
  const receiptUrl = cleanUrl(input.receipt_url)
  if (receiptUrl === undefined) return { error: 'invalid_receipt' }
  const paid = paidFields(input, receivedDate)
  if (paid.error) return paid

  const bill = await db.prepare(`
    INSERT INTO supplier_bills (supplier, bill_date, reference, total_pence, paid_date, paid_from, notes)
    VALUES (?, ?, ?, 0, ?, ?, ?) RETURNING id
  `).bind(supplier, receivedDate, reference, paid.paidDate, paid.paidFrom, notes || 'Stock import session').first()

  const session = await db.prepare(`
    INSERT INTO stock_import_sessions (supplier, received_date, reference, receipt_url, notes, paid_date, paid_from, supplier_bill_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
  `).bind(supplier, receivedDate, reference, receiptUrl, notes, paid.paidDate, paid.paidFrom, bill.id).first()

  return { id: session.id, supplier_bill_id: bill.id }
}

/** Updates the session, its supplier bill and the dates on stock already received in it. */
export async function updateImportSession(db, id, input) {
  await ensureLedgerSchema(db)
  const session = await db.prepare('SELECT * FROM stock_import_sessions WHERE id = ?').bind(id).first()
  if (!session) return { error: 'session_not_found' }

  const supplier = String(input.supplier != null ? input.supplier : session.supplier).trim().slice(0, 200)
  if (!supplier) return { error: 'missing_supplier' }
  const receivedDate = input.received_date != null ? parseLedgerDate(input.received_date) : session.received_date
  if (!receivedDate) return { error: 'invalid_date' }
  const reference = input.reference !== undefined
    ? (input.reference ? String(input.reference).trim().slice(0, 200) : null)
    : session.reference
  const notes = input.notes !== undefined
    ? (input.notes ? String(input.notes).trim().slice(0, 1000) : null)
    : session.notes
  let receiptUrl = session.receipt_url
  if (input.receipt_url !== undefined) {
    receiptUrl = cleanUrl(input.receipt_url)
    if (receiptUrl === undefined) return { error: 'invalid_receipt' }
  }
  const paid = (input.paid_from !== undefined || input.paid_date !== undefined)
    ? paidFields(input, receivedDate)
    : { paidDate: session.paid_date, paidFrom: session.paid_from }
  if (paid.error) return paid

  await db.prepare(`
    UPDATE stock_import_sessions
    SET supplier = ?, received_date = ?, reference = ?, notes = ?, receipt_url = ?, paid_date = ?, paid_from = ?
    WHERE id = ?
  `).bind(supplier, receivedDate, reference, notes, receiptUrl, paid.paidDate, paid.paidFrom, id).run()

  await db.prepare(`
    UPDATE supplier_bills
    SET supplier = ?, bill_date = ?, reference = ?, notes = ?, paid_date = ?, paid_from = ?
    WHERE id = ?
  `).bind(supplier, receivedDate, reference, notes || 'Stock import session', paid.paidDate, paid.paidFrom, session.supplier_bill_id).run()

  await db.prepare(`
    UPDATE stock_lots SET received_date = ?, supplier = ?
    WHERE id IN (SELECT lot_id FROM stock_import_lines WHERE session_id = ?)
  `).bind(receivedDate, supplier, id).run()

  return { success: true }
}

export async function listImportSessions(db) {
  await ensureLedgerSchema(db)
  const { results } = await db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM stock_import_lines l WHERE l.session_id = s.id) AS line_count,
      (SELECT COALESCE(SUM(l.quantity * l.unit_cost_pence), 0) FROM stock_import_lines l WHERE l.session_id = s.id) AS stock_pence
    FROM stock_import_sessions s
    ORDER BY s.received_date DESC, s.id DESC
    LIMIT 200
  `).all()
  return results || []
}

export async function getImportSession(db, id) {
  await ensureLedgerSchema(db)
  const session = await db.prepare('SELECT * FROM stock_import_sessions WHERE id = ?').bind(id).first()
  if (!session) return null
  const { results } = await db.prepare(`
    SELECT l.*, p.name AS product_name,
      lot.quantity_remaining,
      CASE WHEN lot.quantity_remaining = l.quantity
        AND NOT EXISTS (SELECT 1 FROM stock_movements sm WHERE sm.lot_id = l.lot_id)
      THEN 1 ELSE 0 END AS removable
    FROM stock_import_lines l
    LEFT JOIN products p ON p.id = l.product_id
    LEFT JOIN stock_lots lot ON lot.id = l.lot_id
    WHERE l.session_id = ?
    ORDER BY l.id ASC
  `).bind(id).all()
  return { session, lines: results || [] }
}

/**
 * Adds one stock line to a session, by barcode or by hand.
 * Uses an existing product when product_id or the barcode matches, otherwise creates one.
 * The line's cost is added to the session's supplier bill.
 */
export async function addImportLine(db, sessionId, input) {
  await ensureLedgerSchema(db)
  const session = await db.prepare('SELECT * FROM stock_import_sessions WHERE id = ?').bind(sessionId).first()
  if (!session) return { error: 'session_not_found' }

  const quantity = parseInt(input.quantity, 10)
  const unitCost = parsePence(input.unit_cost_pence)
  if (!quantity || quantity <= 0 || quantity > 100000) return { error: 'invalid_quantity' }
  if (unitCost == null) return { error: 'invalid_unit_cost' }
  const entryMethod = ENTRY_METHODS.includes(input.entry_method) ? input.entry_method : 'manual'
  const ean = cleanEan(input.ean)

  let created = false
  let product = null
  const productId = parseInt(input.product_id, 10)
  if (productId > 0) {
    product = await db.prepare('SELECT id, name, catalog_status FROM products WHERE id = ?').bind(productId).first()
    if (!product) return { error: 'product_not_found' }
  } else if (ean) {
    product = await db.prepare('SELECT id, name, catalog_status FROM products WHERE ean = ?').bind(ean).first()
  }

  let filledCopy = []
  if (!product) {
    const name = String(input.name || '').trim().slice(0, 200)
    const price = parsePence(input.price_pence)
    if (!name) return { error: 'missing_name' }
    if (price == null || price <= 0) return { error: 'missing_price' }
    const slug = await uniqueProductSlug(db, name)
    const now = new Date().toISOString()
    const copy = copyFromInput(input)
    if (copy.image === undefined) return { error: 'invalid_image' }
    try {
      const row = await db.prepare(`
        INSERT INTO products (name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, ean, catalog_status, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'GBP', 0, ?, ?, ?, 'listed', 1, ?, ?) RETURNING id
      `).bind(
        name,
        slug,
        copy.summary,
        copy.summary,
        copy.fullDescription,
        price,
        copy.image,
        copy.category,
        ean,
        now,
        now
      ).first()
      product = { id: row.id, name }
      created = true
      if (copy.summary) filledCopy.push('summary')
      if (copy.fullDescription) filledCopy.push('full_description')
    } catch (e) {
      const msg = String(e?.message || '')
      if (msg.includes('UNIQUE') && /ean/i.test(msg)) return { error: 'ean_already_exists' }
      if (msg.includes('UNIQUE')) return { error: 'slug_already_exists' }
      throw e
    }
  } else {
    if (product.catalog_status === 'archived') {
      await db.prepare(`
        UPDATE products SET is_active = 1, catalog_status = 'listed', updated_at = ? WHERE id = ?
      `).bind(new Date().toISOString(), product.id).run()
    }
    filledCopy = await applySubmittedCopy(db, product.id, input)
  }

  const received = await receiveStock(db, {
    product_id: product.id,
    quantity,
    unit_cost_pence: unitCost,
    supplier: session.supplier,
    received_date: session.received_date,
    supplier_bill_id: session.supplier_bill_id,
    notes: `Import session ${session.id}`
  })
  if (received.error) return received

  await db.prepare('UPDATE supplier_bills SET total_pence = total_pence + ? WHERE id = ?')
    .bind(quantity * unitCost, session.supplier_bill_id).run()

  const line = await db.prepare(`
    INSERT INTO stock_import_lines (session_id, product_id, ean, name, quantity, unit_cost_pence, entry_method, lot_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
  `).bind(session.id, product.id, ean, product.name, quantity, unitCost, entryMethod, received.lot_id).first()

  return {
    line_id: line.id,
    lot_id: received.lot_id,
    product_id: product.id,
    created_product: created,
    matched_existing: !created && !(productId > 0),
    filled_copy: filledCopy
  }
}

/** Removes a line and its stock batch when none of that batch has been sold or written off. */
export async function removeImportLine(db, sessionId, lineId) {
  await ensureLedgerSchema(db)
  const line = await db.prepare(`
    SELECT l.*, s.supplier_bill_id
    FROM stock_import_lines l
    JOIN stock_import_sessions s ON s.id = l.session_id
    WHERE l.id = ? AND l.session_id = ?
  `).bind(lineId, sessionId).first()
  if (!line) return { error: 'line_not_found' }

  const lot = await db.prepare('SELECT quantity_received, quantity_remaining FROM stock_lots WHERE id = ?').bind(line.lot_id).first()
  if (!lot || Number(lot.quantity_remaining) !== Number(lot.quantity_received)) return { error: 'line_already_used' }
  const moved = await db.prepare('SELECT COUNT(*) AS c FROM stock_movements WHERE lot_id = ?').bind(line.lot_id).first()
  if (Number(moved?.c) > 0) return { error: 'line_already_used' }

  const upd = await db.prepare(`
    UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ? AND stock_quantity >= ?
  `).bind(line.quantity, new Date().toISOString(), line.product_id, line.quantity).run()
  if (!Number(upd.meta?.changes ?? 0)) return { error: 'insufficient_stock' }

  const cost = Number(line.quantity) * Number(line.unit_cost_pence)
  await db.prepare('DELETE FROM stock_lots WHERE id = ?').bind(line.lot_id).run()
  await db.prepare(`
    UPDATE supplier_bills SET total_pence = CASE WHEN total_pence >= ? THEN total_pence - ? ELSE 0 END WHERE id = ?
  `).bind(cost, cost, line.supplier_bill_id).run()
  await db.prepare('DELETE FROM stock_import_lines WHERE id = ?').bind(line.id).run()
  return { success: true }
}

// ---------------------------------------------------------------------------
// SumUp fees (shared with Club accounts)
// ---------------------------------------------------------------------------

/**
 * Actual SumUp fees by transaction code (from synced payouts), plus the effective fee rate
 * on payouts matched to our own transactions, used to estimate fees with no payout match.
 */
export async function loadSumUpFeeContext(db, codes) {
  const feeByCode = new Map()
  const unique = [...new Set((codes || []).filter(Boolean).map(String))]
  try {
    for (let i = 0; i < unique.length; i += 90) {
      const batch = unique.slice(i, i + 90)
      const res = await db.prepare(`
        SELECT transaction_code, SUM(fee_pence) AS fee_pence
        FROM sumup_payouts
        WHERE transaction_code IN (${batch.map(() => '?').join(',')})
        GROUP BY transaction_code
      `).bind(...batch).all()
      for (const r of res.results || []) feeByCode.set(String(r.transaction_code), Number(r.fee_pence) || 0)
    }
  } catch (e) {
    console.warn('[sumup fees] payout fee lookup failed:', e.message)
  }

  let estimateRate = null
  try {
    const rateRow = await db.prepare(`
      SELECT COALESCE(SUM(p.fee_pence), 0) AS fee_pence,
             COALESCE(SUM(p.amount_pence + p.fee_pence), 0) AS gross_pence
      FROM sumup_payouts p
      JOIN transactions t ON t.sumup_transaction_code = p.transaction_code
    `).first()
    const feeP = Number(rateRow?.fee_pence) || 0
    const grossP = Number(rateRow?.gross_pence) || 0
    if (grossP > 0) estimateRate = feeP / grossP
  } catch (e) {
    console.warn('[sumup fees] fee rate query failed:', e.message)
  }

  return { feeByCode, estimateRate }
}

// ---------------------------------------------------------------------------
// Income: shop sales with recorded cost, and event tickets
// ---------------------------------------------------------------------------

function poundsToPence(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

function eventIdFromOrderRef(ref) {
  const m = String(ref || '').match(/^(?:EVT|BUNDLE)-(\d+)-/)
  return m ? Number(m[1]) : null
}

/** Account money lands in: SumUp and bank transfers are combined; cash is separate. */
function moneyAccount(paymentMethod) {
  return String(paymentMethod || '').toLowerCase() === 'cash' ? 'cash' : 'bank'
}

/**
 * Collects income between from and to (inclusive, YYYY-MM-DD), never earlier than booksStart.
 * Returns shop order rows (tracked share only), ticket rows, and untracked-line counts.
 */
async function collectIncome(db, from, to, booksStart) {
  const start = from > booksStart ? from : booksStart
  const empty = { shopOrders: [], tickets: [], untracked: { lines: 0, pence: 0 } }
  if (start > to) return empty

  const { results: itemRows } = await db.prepare(`
    SELECT o.id AS order_id, o.order_number, o.total, IFNULL(o.shipping, 0) AS shipping,
           o.payment_method, o.sale_channel,
           COALESCE(o.completed_at, o.created_at) AS sold_at,
           oi.id AS item_id, oi.product_id, oi.product_name, oi.quantity, oi.subtotal,
           EXISTS (SELECT 1 FROM stock_movements sm WHERE sm.order_item_id = oi.id AND sm.movement_type = 'sale') AS tracked
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE UPPER(COALESCE(o.payment_status, '')) = 'PAID'
      AND NOT ((o.name = 'Walk-in' OR lower(o.email) = 'walk-in') AND IFNULL(o.sale_channel, '') != 'pos')
      AND strftime('%Y-%m-%d', COALESCE(o.completed_at, o.created_at)) >= ?
      AND strftime('%Y-%m-%d', COALESCE(o.completed_at, o.created_at)) <= ?
    ORDER BY o.id, oi.id
  `).bind(start, to).all()

  const byOrder = new Map()
  for (const r of itemRows || []) {
    if (!byOrder.has(r.order_id)) byOrder.set(r.order_id, { order: r, items: [] })
    byOrder.get(r.order_id).items.push(r)
  }

  const shopOrders = []
  const untracked = { lines: 0, pence: 0 }
  for (const { order, items } of byOrder.values()) {
    const goodsTotal = Math.max(0, Number(order.total) - Number(order.shipping))
    const sumSub = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0)
    const lines = items.map(i => ({
      ...i,
      net_pence: sumSub > 0 ? Math.round((Number(i.subtotal) || 0) * goodsTotal / sumSub) : 0
    }))
    const tracked = lines.filter(l => Number(l.tracked))
    for (const l of lines) {
      if (!Number(l.tracked)) {
        untracked.lines += 1
        untracked.pence += l.net_pence
      }
    }
    if (!tracked.length) continue
    const goodsPence = tracked.reduce((s, l) => s + l.net_pence, 0)
    const shippingPence = Number(order.shipping) || 0
    shopOrders.push({
      order_id: order.order_id,
      order_number: order.order_number,
      sold_at: order.sold_at,
      payment_method: String(order.payment_method || 'sumup').toLowerCase(),
      sale_channel: order.sale_channel,
      goods_pence: goodsPence,
      shipping_pence: shippingPence,
      lines: tracked
    })
  }

  const { results: txRows } = await db.prepare(`
    SELECT tr.id, tr.transaction_type, tr.order_ref, tr.amount, tr.created_at, tr.sumup_transaction_code, m.plan
    FROM transactions tr
    LEFT JOIN memberships m ON tr.transaction_type = 'event_membership_bundle' AND m.order_ref = tr.order_ref
    WHERE tr.transaction_type IN ('ticket', 'event_membership_bundle')
      AND UPPER(COALESCE(tr.payment_status, '')) = 'PAID'
      AND strftime('%Y-%m-%d', tr.created_at) >= ?
      AND strftime('%Y-%m-%d', tr.created_at) <= ?
  `).bind(start, to).all()

  const tickets = []
  for (const t of txRows || []) {
    const charged = poundsToPence(t.amount)
    let ticketPence = charged
    if (t.transaction_type === 'event_membership_bundle') {
      ticketPence = Math.max(0, charged - (BUNDLE_MEMBERSHIP_PENCE[t.plan] ?? 0))
    }
    if (ticketPence <= 0) continue
    tickets.push({
      id: t.id,
      kind: t.transaction_type === 'ticket' ? 'ticket' : 'bundle',
      event_id: eventIdFromOrderRef(t.order_ref),
      sold_at: t.created_at,
      charged_pence: charged,
      ticket_pence: ticketPence,
      tx_code: t.sumup_transaction_code ? String(t.sumup_transaction_code) : null
    })
  }

  return { shopOrders, tickets, untracked }
}

/** Adds fee_pence and fee_basis to each income row. */
async function applyFees(db, income) {
  const codes = income.tickets.map(t => t.tx_code).filter(Boolean)
  const { feeByCode, estimateRate } = await loadSumUpFeeContext(db, codes)
  const basisCounts = { actual: 0, estimated: 0, unknown: 0 }

  for (const o of income.shopOrders) {
    if (o.payment_method !== 'sumup') {
      o.fee_pence = 0
      o.fee_basis = 'none'
      continue
    }
    if (estimateRate != null) {
      o.fee_pence = Math.round((o.goods_pence + o.shipping_pence) * estimateRate)
      o.fee_basis = 'estimated'
    } else {
      o.fee_pence = 0
      o.fee_basis = 'unknown'
    }
    basisCounts[o.fee_basis] += 1
  }

  for (const t of income.tickets) {
    if (t.tx_code && feeByCode.has(t.tx_code)) {
      const share = t.charged_pence > 0 ? t.ticket_pence / t.charged_pence : 1
      t.fee_pence = Math.round(feeByCode.get(t.tx_code) * share)
      t.fee_basis = 'actual'
    } else if (estimateRate != null) {
      t.fee_pence = Math.round(t.ticket_pence * estimateRate)
      t.fee_basis = 'estimated'
    } else {
      t.fee_pence = 0
      t.fee_basis = 'unknown'
    }
    basisCounts[t.fee_basis] += 1
  }

  return { estimateRate, basisCounts }
}

// ---------------------------------------------------------------------------
// Costs: cost of goods sold, write-offs, expenses, supplier bill costs not in stock
// ---------------------------------------------------------------------------

async function collectMovements(db, from, to) {
  const { results } = await db.prepare(`
    SELECT sm.product_id, sm.movement_type, sm.reason, sm.lot_id,
           SUM(sm.quantity) AS quantity, SUM(sm.quantity * sm.unit_cost_pence) AS cost_pence,
           p.name AS product_name
    FROM stock_movements sm
    LEFT JOIN products p ON p.id = sm.product_id
    WHERE substr(sm.occurred_at, 1, 10) >= ? AND substr(sm.occurred_at, 1, 10) <= ?
    GROUP BY sm.product_id, sm.movement_type, sm.lot_id IS NULL
  `).bind(from, to).all()
  return results || []
}

async function collectExpenses(db, from, to) {
  const { results } = await db.prepare(`
    SELECT be.id, be.expense_date, be.category, be.event_id, be.description, be.amount_pence,
           be.paid_date, be.paid_from, e.event_name
    FROM business_expenses be
    LEFT JOIN events e ON e.event_id = be.event_id
    WHERE be.expense_date >= ? AND be.expense_date <= ?
  `).bind(from, to).all()
  return results || []
}

/** Supplier bill amounts not matched by stock batches (delivery charges, bills without stock yet). */
async function collectBillExtras(db, from, to) {
  const { results } = await db.prepare(`
    SELECT b.id, b.supplier, b.bill_date, b.reference, b.total_pence,
           COALESCE((SELECT SUM(l.quantity_received * l.unit_cost_pence) FROM stock_lots l WHERE l.supplier_bill_id = b.id), 0) AS stock_pence
    FROM supplier_bills b
    WHERE b.bill_date >= ? AND b.bill_date <= ?
  `).bind(from, to).all()
  return (results || [])
    .map(b => ({ ...b, extra_pence: Number(b.total_pence) - Number(b.stock_pence) }))
    .filter(b => b.extra_pence !== 0)
}

async function eventNames(db, ids) {
  const unique = [...new Set(ids.filter(Boolean))]
  const map = new Map()
  for (let i = 0; i < unique.length; i += 90) {
    const batch = unique.slice(i, i + 90)
    const { results } = await db.prepare(
      `SELECT event_id, event_name, event_datetime FROM events WHERE event_id IN (${batch.map(() => '?').join(',')})`
    ).bind(...batch).all()
    for (const r of results || []) map.set(Number(r.event_id), r)
  }
  return map
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

/**
 * Profit and loss between from and to (inclusive). Income before the books start date is ignored;
 * ledger entries (batches, bills, expenses) are always included because they only exist from setup on.
 */
export async function buildPnl(db, from, to) {
  await ensureLedgerSchema(db)
  const booksStart = await getBooksStartDate(db)
  const income = await collectIncome(db, from, to, booksStart)
  const feeInfo = await applyFees(db, income)
  const movements = await collectMovements(db, from, to)
  const expenses = await collectExpenses(db, from, to)
  const billExtras = await collectBillExtras(db, from, to)

  // Per product: revenue from sale lines, cost from sale movements
  const products = new Map()
  const productRow = (id, name) => {
    if (!products.has(id)) products.set(id, { product_id: id, name: name || `Product ${id}`, units: 0, revenue_pence: 0, cogs_pence: 0, uncosted_units: 0 })
    return products.get(id)
  }
  for (const o of income.shopOrders) {
    for (const l of o.lines) {
      const row = productRow(l.product_id, l.product_name)
      row.units += Number(l.quantity) || 0
      row.revenue_pence += l.net_pence
    }
  }
  let cogsPence = 0
  let writeOffPence = 0
  let uncostedUnits = 0
  const writeOffs = new Map()
  for (const m of movements) {
    const cost = Number(m.cost_pence) || 0
    if (m.movement_type === 'sale') {
      const row = productRow(m.product_id, m.product_name)
      row.cogs_pence += cost
      if (m.lot_id == null) {
        row.uncosted_units += Number(m.quantity) || 0
        uncostedUnits += Number(m.quantity) || 0
      }
      cogsPence += cost
    } else if (m.movement_type === 'write_off') {
      writeOffPence += cost
      const prev = writeOffs.get(m.product_id) || { product_id: m.product_id, name: m.product_name, units: 0, cost_pence: 0 }
      prev.units += Number(m.quantity) || 0
      prev.cost_pence += cost
      writeOffs.set(m.product_id, prev)
    }
  }

  const productSalesPence = income.shopOrders.reduce((s, o) => s + o.goods_pence, 0)
  const shippingPence = income.shopOrders.reduce((s, o) => s + o.shipping_pence, 0)
  const ticketPence = income.tickets.reduce((s, t) => s + t.ticket_pence, 0)
  const shopFees = income.shopOrders.reduce((s, o) => s + (o.fee_pence || 0), 0)
  const ticketFees = income.tickets.reduce((s, t) => s + (t.fee_pence || 0), 0)

  // Per event: ticket revenue, fees and linked expenses
  const names = await eventNames(db, [
    ...income.tickets.map(t => t.event_id),
    ...expenses.map(e => e.event_id)
  ])
  const events = new Map()
  const eventRow = (id) => {
    const key = id || 0
    if (!events.has(key)) {
      const ev = names.get(Number(id))
      events.set(key, {
        event_id: id || null,
        name: ev?.event_name || (id ? `Event ${id}` : 'Unknown event'),
        event_datetime: ev?.event_datetime || null,
        tickets: 0,
        revenue_pence: 0,
        fee_pence: 0,
        cost_pence: 0
      })
    }
    return events.get(key)
  }
  for (const t of income.tickets) {
    const row = eventRow(t.event_id)
    row.tickets += 1
    row.revenue_pence += t.ticket_pence
    row.fee_pence += t.fee_pence || 0
  }

  const expenseByCategory = new Map()
  for (const e of expenses) {
    const amt = Number(e.amount_pence) || 0
    expenseByCategory.set(e.category, (expenseByCategory.get(e.category) || 0) + amt)
    if (e.event_id) eventRow(e.event_id).cost_pence += amt
  }
  const expensesPence = expenses.reduce((s, e) => s + (Number(e.amount_pence) || 0), 0)
  const billExtrasPence = billExtras.reduce((s, b) => s + b.extra_pence, 0)

  const revenuePence = productSalesPence + shippingPence + ticketPence
  const grossProfitPence = revenuePence - cogsPence
  const feesPence = shopFees + ticketFees
  const netProfitPence = grossProfitPence - feesPence - writeOffPence - expensesPence - billExtrasPence

  return {
    from,
    to,
    books_start_date: booksStart,
    revenue: {
      product_sales_pence: productSalesPence,
      shipping_pence: shippingPence,
      event_tickets_pence: ticketPence,
      total_pence: revenuePence
    },
    cost_of_goods_sold_pence: cogsPence,
    gross_profit_pence: grossProfitPence,
    gross_margin: revenuePence > 0 ? grossProfitPence / revenuePence : null,
    expenses: {
      sumup_fees_pence: feesPence,
      sumup_fees_shop_pence: shopFees,
      sumup_fees_events_pence: ticketFees,
      stock_write_offs_pence: writeOffPence,
      by_category: [...expenseByCategory.entries()].map(([category, amount_pence]) => ({ category, amount_pence })),
      supplier_bill_extras_pence: billExtrasPence,
      total_pence: feesPence + writeOffPence + expensesPence + billExtrasPence
    },
    net_profit_pence: netProfitPence,
    products: [...products.values()]
      .map(p => ({ ...p, gross_profit_pence: p.revenue_pence - p.cogs_pence }))
      .sort((a, b) => b.revenue_pence - a.revenue_pence),
    events: [...events.values()]
      .map(e => ({ ...e, profit_pence: e.revenue_pence - e.fee_pence - e.cost_pence }))
      .sort((a, b) => String(a.event_datetime || '').localeCompare(String(b.event_datetime || ''))),
    write_offs: [...writeOffs.values()],
    bill_extras: billExtras,
    expense_lines: expenses,
    fee_info: { estimate_rate: feeInfo.estimateRate, ...feeInfo.basisCounts },
    counts: {
      shop_orders: income.shopOrders.length,
      tickets: income.tickets.length,
      uncosted_units: uncostedUnits
    },
    excluded_untracked: income.untracked
  }
}

/**
 * Balance sheet as of a date. Cash is calculated from recorded activity, so compare it
 * with real bank, SumUp and cash balances. Balances by construction:
 * assets - liabilities = owner capital - drawings + retained profit.
 */
export async function buildBalanceSheet(db, asOf) {
  await ensureLedgerSchema(db)
  const booksStart = await getBooksStartDate(db)
  const epoch = '0000-01-01'

  const pnl = await buildPnl(db, epoch, asOf)

  // Money received, by account (SumUp and bank transfers combined as "bank")
  const income = await collectIncome(db, epoch, asOf, booksStart)
  await applyFees(db, income)
  const cash = { bank: 0, cash: 0 }
  for (const o of income.shopOrders) {
    cash[moneyAccount(o.payment_method)] += o.goods_pence + o.shipping_pence - (o.fee_pence || 0)
  }
  for (const t of income.tickets) {
    cash.bank += t.ticket_pence - (t.fee_pence || 0)
  }

  const paidOut = async (table, dateCol) => {
    const { results } = await db.prepare(`
      SELECT paid_from, SUM(${table === 'supplier_bills' ? 'total_pence' : 'amount_pence'}) AS pence
      FROM ${table}
      WHERE ${dateCol} <= ? AND paid_date IS NOT NULL AND paid_date <= ?
      GROUP BY paid_from
    `).bind(asOf, asOf).all()
    const out = { bank: 0, cash: 0, owner: 0 }
    for (const r of results || []) out[PAID_FROM.includes(r.paid_from) ? r.paid_from : 'bank'] += Number(r.pence) || 0
    return out
  }
  const unpaid = async (table, dateCol) => {
    const row = await db.prepare(`
      SELECT COALESCE(SUM(${table === 'supplier_bills' ? 'total_pence' : 'amount_pence'}), 0) AS pence
      FROM ${table}
      WHERE ${dateCol} <= ? AND (paid_date IS NULL OR paid_date > ?)
    `).bind(asOf, asOf).first()
    return Number(row?.pence) || 0
  }

  const billsPaid = await paidOut('supplier_bills', 'bill_date')
  const expensesPaid = await paidOut('business_expenses', 'expense_date')
  cash.bank -= billsPaid.bank + expensesPaid.bank
  cash.cash -= billsPaid.cash + expensesPaid.cash

  const { results: ownerRows } = await db.prepare(`
    SELECT type, account, SUM(amount_pence) AS pence
    FROM owner_movements
    WHERE movement_date <= ?
    GROUP BY type, account
  `).bind(asOf).all()
  let capitalIn = 0
  let drawings = 0
  for (const r of ownerRows || []) {
    const acct = OWNER_ACCOUNTS.includes(r.account) ? r.account : 'bank'
    const pence = Number(r.pence) || 0
    if (r.type === 'capital_in') {
      capitalIn += pence
      cash[acct] += pence
    } else if (r.type === 'drawing') {
      drawings += pence
      cash[acct] -= pence
    }
  }
  const paidPersonally = billsPaid.owner + expensesPaid.owner

  // Stock at cost: batches on bills dated up to asOf, less cost moved out up to asOf
  const lotsRow = await db.prepare(`
    SELECT COALESCE(SUM(l.quantity_received * l.unit_cost_pence), 0) AS pence
    FROM stock_lots l
    JOIN supplier_bills b ON b.id = l.supplier_bill_id
    WHERE b.bill_date <= ?
  `).bind(asOf).first()
  const movedRow = await db.prepare(`
    SELECT COALESCE(SUM(quantity * unit_cost_pence), 0) AS pence
    FROM stock_movements
    WHERE substr(occurred_at, 1, 10) <= ?
  `).bind(asOf).first()
  const stockPence = (Number(lotsRow?.pence) || 0) - (Number(movedRow?.pence) || 0)

  const billsUnpaid = await unpaid('supplier_bills', 'bill_date')
  const expensesUnpaid = await unpaid('business_expenses', 'expense_date')

  const assetsPence = stockPence + cash.bank + cash.cash
  const liabilitiesPence = billsUnpaid + expensesUnpaid
  const equityPence = capitalIn + paidPersonally - drawings + pnl.net_profit_pence

  return {
    as_of: asOf,
    books_start_date: booksStart,
    assets: {
      stock_at_cost_pence: stockPence,
      bank_and_sumup_pence: cash.bank,
      cash_pence: cash.cash,
      total_pence: assetsPence
    },
    liabilities: {
      unpaid_supplier_bills_pence: billsUnpaid,
      unpaid_expenses_pence: expensesUnpaid,
      total_pence: liabilitiesPence
    },
    net_assets_pence: assetsPence - liabilitiesPence,
    equity: {
      owner_capital_in_pence: capitalIn,
      paid_personally_pence: paidPersonally,
      drawings_pence: drawings,
      retained_profit_pence: pnl.net_profit_pence,
      total_pence: equityPence
    },
    balances: assetsPence - liabilitiesPence === equityPence,
    difference_pence: assetsPence - liabilitiesPence - equityPence
  }
}
