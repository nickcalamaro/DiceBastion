import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { addImportLine, createImportSession, removeImportLine } from './shop-ledger.js'

async function setup() {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT, slug TEXT UNIQUE, stock_quantity INTEGER DEFAULT 0, cost_tracked INTEGER DEFAULT 0,
      catalog_status TEXT, is_active INTEGER DEFAULT 1, ean TEXT, price INTEGER,
      image_url TEXT, category TEXT, description TEXT, summary TEXT, full_description TEXT,
      currency TEXT DEFAULT 'GBP', created_at TEXT, updated_at TEXT
    )
  `).run()
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      order_number TEXT, email TEXT, name TEXT, payment_status TEXT, sale_channel TEXT,
      completed_at TEXT, created_at TEXT, total INTEGER, shipping INTEGER DEFAULT 0
    )
  `).run()
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY,
      order_id INTEGER, product_id INTEGER, product_name TEXT,
      quantity INTEGER, unit_price INTEGER, subtotal INTEGER
    )
  `).run()
  await env.DB.prepare('DELETE FROM order_items').run()
  await env.DB.prepare('DELETE FROM orders').run()
  await env.DB.prepare('DELETE FROM products').run()
}

describe('linking an existing shop product to a receipt', () => {
  it('costs sales from the receipt date and leaves the shop stock count unchanged', async () => {
    await setup()
    await env.DB.prepare(`
      INSERT INTO products (id, name, slug, stock_quantity, cost_tracked, catalog_status, is_active, price)
      VALUES (1567, 'Existing game', 'existing-game', 6, 0, 'listed', 1, 2000)
    `).run()
    await env.DB.prepare(`
      INSERT INTO orders (id, order_number, email, name, payment_status, sale_channel, completed_at, created_at, total)
      VALUES
        (1, 'OLD', 'a@example.com', 'Ada', 'PAID', 'online', '2026-01-15T12:00:00.000Z', '2026-01-15T12:00:00.000Z', 2000),
        (2, 'NEW', 'b@example.com', 'Grace', 'PAID', 'online', '2026-06-02T12:00:00.000Z', '2026-06-02T12:00:00.000Z', 8000)
    `).run()
    await env.DB.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, subtotal)
      VALUES
        (1, 1, 1567, 'Existing game', 1, 2000, 2000),
        (2, 2, 1567, 'Existing game', 4, 2000, 8000)
    `).run()

    const session = await createImportSession(env.DB, {
      supplier: 'Distributor',
      received_date: '2026-05-01',
      reference: 'INV-1567',
      receipt_key: 'receipts/existing-game.pdf',
      paid_from: 'bank',
      paid_date: '2026-05-01'
    })
    expect(session.error).toBeUndefined()

    const added = await addImportLine(env.DB, session.id, {
      product_id: 1567,
      quantity: 10,
      unit_cost_pence: 250,
      entry_method: 'manual'
    })
    expect(added.error).toBeUndefined()
    expect(added.opens_existing_stock).toBe(true)
    expect(added.created_product).toBe(false)
    expect(added.backfilled_units).toBe(4)
    expect(added.backfilled_cost_pence).toBe(1000)

    const product = await env.DB.prepare('SELECT stock_quantity, cost_tracked FROM products WHERE id = 1567').first()
    expect(product.stock_quantity).toBe(6)
    expect(product.cost_tracked).toBe(1)

    const lot = await env.DB.prepare('SELECT quantity_received, quantity_remaining, unit_cost_pence, received_date FROM stock_lots WHERE id = ?')
      .bind(added.lot_id).first()
    expect(lot.quantity_received).toBe(10)
    expect(lot.quantity_remaining).toBe(6)
    expect(lot.unit_cost_pence).toBe(250)
    expect(lot.received_date).toBe('2026-05-01')

    const bill = await env.DB.prepare('SELECT total_pence, bill_date FROM supplier_bills WHERE id = ?')
      .bind(session.supplier_bill_id).first()
    expect(bill.total_pence).toBe(2500)
    expect(bill.bill_date).toBe('2026-05-01')

    const oldSale = await env.DB.prepare('SELECT COUNT(*) AS c FROM stock_movements WHERE order_item_id = 1').first()
    expect(oldSale.c).toBe(0)
    const newSale = await env.DB.prepare(`
      SELECT quantity, unit_cost_pence, substr(occurred_at, 1, 10) AS sold_on
      FROM stock_movements WHERE order_item_id = 2 AND movement_type = 'sale'
    `).first()
    expect(newSale.quantity).toBe(4)
    expect(newSale.unit_cost_pence).toBe(250)
    expect(newSale.sold_on).toBe('2026-06-02')

    const removed = await removeImportLine(env.DB, session.id, added.line_id)
    expect(removed.error).toBeUndefined()
    const after = await env.DB.prepare('SELECT stock_quantity, cost_tracked FROM products WHERE id = 1567').first()
    expect(after.stock_quantity).toBe(6)
    expect(after.cost_tracked).toBe(0)
    const moves = await env.DB.prepare('SELECT COUNT(*) AS c FROM stock_movements WHERE product_id = 1567').first()
    expect(moves.c).toBe(0)
  })
})
