import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { addImportLine, addPreInvoiceItems, createImportSession, preInvoiceItemProblem } from './shop-ledger.js'

// The in-memory D1 is reset between tests while the module-level schemaReady flag in
// shop-ledger.js is not, so each test recreates every table it touches.
async function setup() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT, slug TEXT UNIQUE, stock_quantity INTEGER DEFAULT 0, cost_tracked INTEGER DEFAULT 0,
      catalog_status TEXT, is_active INTEGER DEFAULT 1, ean TEXT, price INTEGER,
      image_url TEXT, category TEXT, description TEXT, summary TEXT, full_description TEXT,
      currency TEXT DEFAULT 'GBP', created_at TEXT, updated_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      order_number TEXT, email TEXT, name TEXT, payment_status TEXT, sale_channel TEXT,
      completed_at TEXT, created_at TEXT, total INTEGER, shipping INTEGER DEFAULT 0,
      pay_later INTEGER DEFAULT 0, delivered_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY,
      order_id INTEGER, product_id INTEGER, product_name TEXT,
      quantity INTEGER, unit_price INTEGER, subtotal INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS supplier_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier TEXT NOT NULL, bill_date TEXT NOT NULL, reference TEXT,
      total_pence INTEGER NOT NULL, paid_date TEXT, paid_from TEXT, notes TEXT,
      invoice_currency TEXT NOT NULL DEFAULT 'GBP', settlement_amount_pence INTEGER,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )`,
    `CREATE TABLE IF NOT EXISTS stock_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL, received_date TEXT NOT NULL, supplier TEXT,
      quantity_received INTEGER NOT NULL, quantity_remaining INTEGER NOT NULL,
      unit_cost_pence INTEGER NOT NULL, supplier_bill_id INTEGER, notes TEXT,
      unit_foreign_minor INTEGER,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )`,
    `CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL, lot_id INTEGER, order_id INTEGER, order_item_id INTEGER,
      movement_type TEXT NOT NULL, quantity INTEGER NOT NULL,
      unit_cost_pence INTEGER NOT NULL DEFAULT 0, occurred_at TEXT NOT NULL, reason TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS business_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_date TEXT NOT NULL, category TEXT NOT NULL, event_id INTEGER, description TEXT,
      amount_pence INTEGER NOT NULL, paid_date TEXT, paid_from TEXT,
      receipt_key TEXT, import_line_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )`,
    `CREATE TABLE IF NOT EXISTS finance_settings (key TEXT PRIMARY KEY, value TEXT)`,
    `CREATE TABLE IF NOT EXISTS stock_import_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier TEXT NOT NULL, received_date TEXT NOT NULL, reference TEXT,
      receipt_url TEXT, receipt_key TEXT, notes TEXT, paid_date TEXT, paid_from TEXT,
      supplier_bill_id INTEGER, invoice_currency TEXT NOT NULL DEFAULT 'GBP',
      settlement_amount_pence INTEGER, foreign_goods_total_minor INTEGER,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )`,
    `CREATE TABLE IF NOT EXISTS stock_import_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL, product_id INTEGER NOT NULL, ean TEXT, name TEXT,
      quantity INTEGER NOT NULL, unit_cost_pence INTEGER NOT NULL, entry_method TEXT NOT NULL,
      lot_id INTEGER, unit_foreign_minor INTEGER, bundle_name TEXT, bundle_ean TEXT,
      bundle_quantity INTEGER, opens_existing_stock INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )`
  ]
  for (const sql of statements) await env.DB.prepare(sql).run()
  for (const table of ['stock_import_lines', 'stock_import_sessions', 'business_expenses', 'stock_movements', 'stock_lots', 'supplier_bills', 'finance_settings', 'order_items', 'orders', 'products']) {
    await env.DB.prepare(`DELETE FROM ${table}`).run()
  }
}

async function productRow(id) {
  return env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()
}

describe('preInvoiceItemProblem', () => {
  it('flags a missing name, bad quantity and bad EAN', () => {
    expect(preInvoiceItemProblem({ quantity: 2, name: '  ' }).error).toBe('missing_name')
    expect(preInvoiceItemProblem({ quantity: 0, name: 'Dice' }).error).toBe('invalid_quantity')
    expect(preInvoiceItemProblem({ quantity: 1, name: 'Dice', ean: '123' }).error).toBe('invalid_ean')
    expect(preInvoiceItemProblem({ quantity: 1, name: 'Dice', image_url: 'data:image/jpeg;base64,xx' }).error).toBe('invalid_image')
    expect(preInvoiceItemProblem({ quantity: 3, name: 'Dice', ean: '5012345678900' })).toBe(null)
  })
})

describe('addPreInvoiceItems', () => {
  it('creates an unpriced hidden product with stock and no cost batch', async () => {
    await setup()
    const result = await addPreInvoiceItems(env.DB, {
      items: [{
        name: 'Riftbound Booster Box',
        ean: '5012345678900',
        quantity: 12,
        category: 'Board games',
        summary: 'A box of boosters',
        description: 'Rich text\n\ndetails',
        image_url: 'https://cdn.example.com/box.jpg'
      }]
    })
    expect(result.success).toBe(true)
    expect(result.lines).toHaveLength(1)
    const line = result.lines[0]
    expect(line.created).toBe(true)
    expect(line.stock_added).toBe(12)

    const p = await productRow(line.product_id)
    expect(p.name).toBe('Riftbound Booster Box')
    expect(p.ean).toBe('5012345678900')
    expect(p.price).toBe(0)
    expect(p.is_active).toBe(0)
    expect(p.catalog_status).toBe('archived')
    expect(p.cost_tracked).toBe(0)
    expect(p.stock_quantity).toBe(12)
    expect(p.category).toBe('Board games')
    expect(p.summary).toBe('A box of boosters')
    expect(p.image_url).toBe('https://cdn.example.com/box.jpg')
    expect(p.full_description).toContain('<p>Rich text')

    const lots = await env.DB.prepare('SELECT * FROM stock_lots WHERE product_id = ?').bind(line.product_id).all()
    expect(lots.results || []).toHaveLength(0)
  })

  it('links by EAN to an existing uncosted product and adds stock, updating copy', async () => {
    await setup()
    await env.DB.prepare(`
      INSERT INTO products (id, name, slug, stock_quantity, cost_tracked, catalog_status, is_active, ean, price, category)
      VALUES (900, 'Existing game', 'existing-game', 6, 0, 'listed', 1, '5012345678900', 2000, 'Card games')
    `).run()
    const result = await addPreInvoiceItems(env.DB, {
      items: [{ name: 'Existing game (restock)', ean: '5012345678900', quantity: 4, summary: 'New summary', category: 'Board games' }]
    })
    expect(result.success).toBe(true)
    expect(result.lines[0].matched_existing).toBe(true)
    expect(result.lines[0].stock_added).toBe(4)
    const p = await productRow(900)
    expect(p.stock_quantity).toBe(10)
    expect(p.summary).toBe('New summary')
    expect(p.category).toBe('Board games')
    expect(p.name).toBe('Existing game')
  })

  it('does not add stock to a cost-tracked product; the invoice line adds it', async () => {
    await setup()
    await env.DB.prepare(`
      INSERT INTO products (id, name, slug, stock_quantity, cost_tracked, catalog_status, is_active, ean, price)
      VALUES (901, 'Costed game', 'costed-game', 6, 1, 'listed', 1, '5012345678901', 2000)
    `).run()
    const result = await addPreInvoiceItems(env.DB, {
      items: [{ name: 'Costed game', ean: '5012345678901', quantity: 4 }]
    })
    expect(result.success).toBe(true)
    expect(result.lines[0].stock_added).toBe(0)
    expect(result.lines[0].cost_tracked).toBe(1)
    const p = await productRow(901)
    expect(p.stock_quantity).toBe(6)
  })

  it('rejects the whole batch when one item is invalid and saves nothing', async () => {
    await setup()
    const result = await addPreInvoiceItems(env.DB, {
      items: [
        { name: 'Good item', quantity: 2 },
        { name: '', quantity: 1 }
      ]
    })
    expect(result.error).toBe('missing_name')
    expect(result.line_index).toBe(1)
    const { results } = await env.DB.prepare('SELECT COUNT(*) AS c FROM products').all()
    expect(Number(results[0].c)).toBe(0)
  })

  it('links the cost back when the invoice arrives: stock is not counted twice', async () => {
    await setup()
    const created = await addPreInvoiceItems(env.DB, {
      items: [{ name: 'Riftbound Booster Box', ean: '5012345678900', quantity: 12, summary: 'A box of boosters' }]
    })
    const productId = created.lines[0].product_id

    const session = await createImportSession(env.DB, {
      supplier: 'Distributor',
      received_date: '2026-06-01',
      reference: 'INV-100',
      receipt_key: 'receipts/inv-100.pdf'
    })
    const added = await addImportLine(env.DB, session.id, {
      entry_method: 'manual',
      quantity: 12,
      unit_cost_pence: 1850,
      ean: '5012345678900',
      name: 'Riftbound Booster Box',
      price_pence: 2999,
      summary: 'A box of boosters'
    })
    expect(added.error).toBeUndefined()
    expect(added.matched_existing).toBe(true)
    expect(added.opens_existing_stock).toBe(true)

    const p = await productRow(productId)
    expect(p.stock_quantity).toBe(12)
    expect(p.cost_tracked).toBe(1)
    expect(p.is_active).toBe(1)
    expect(p.catalog_status).toBe('listed')
    expect(p.price).toBe(2999)

    const lot = await env.DB.prepare('SELECT * FROM stock_lots WHERE id = ?').bind(added.lot_id).first()
    expect(lot.quantity_remaining).toBe(12)
    expect(lot.unit_cost_pence).toBe(1850)
  })
})
