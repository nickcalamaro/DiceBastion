import { expect, test, describe, beforeAll } from 'vitest'
import { env, SELF } from 'cloudflare:test'

const ADMIN_TOKEN = 'test-admin-session-token'
const FUTURE = '2999-01-01T00:00:00.000Z'

async function makeRequest(path, options = {}) {
  const url = new URL(path, 'http://test')
  return SELF.fetch(new Request(url, options))
}

function adminJsonOptions(body) {
  return {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': ADMIN_TOKEN
    },
    body: JSON.stringify(body)
  }
}

async function setupTestDatabase() {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    )
  `).run()
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL
    )
  `).run()
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT,
      image_url TEXT,
      category TEXT,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    )
  `).run()
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      featured INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      keywords TEXT,
      seo_title TEXT,
      seo_description TEXT,
      seo_image TEXT,
      intro TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )
  `).run()

  await env.DB.prepare(
    'INSERT INTO users (email, name, is_admin, is_active) VALUES (?, ?, 1, 1)'
  ).bind('admin@test.com', 'Admin').run()
  const user = await env.DB.prepare('SELECT user_id FROM users WHERE email = ?').bind('admin@test.com').first()
  await env.DB.prepare(
    'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)'
  ).bind(user.user_id, ADMIN_TOKEN, FUTURE).run()

  await env.DB.prepare(
    `INSERT INTO products (name, slug, image_url, category, stock_quantity, is_active)
     VALUES ('Catan', 'catan', 'https://img.test/catan.jpg', 'Board Games', 5, 1)`
  ).run()
  await env.DB.prepare(
    `INSERT INTO products (name, slug, image_url, category, stock_quantity, is_active)
     VALUES ('Hidden Draft Box', 'hidden-draft-box', NULL, 'MTG', 0, 0)`
  ).run()
  await env.DB.prepare(
    `INSERT INTO products (name, slug, image_url, category, stock_quantity, is_active)
     VALUES ('Settlers of Catan', 'settlers', 'https://img.test/settlers.jpg', 'Board Games', 0, 1)`
  ).run()
  await env.DB.prepare(
    `INSERT INTO product_categories (name, seo_image) VALUES ('Board Games', 'https://img.test/board-games.jpg')`
  ).run()
  await env.DB.prepare(
    `INSERT INTO product_categories (name, seo_image) VALUES ('MTG', NULL)`
  ).run()
}

beforeAll(setupTestDatabase)

describe('Shop featured cards API', () => {
  test('public GET /shop-featured returns empty cards before anything is saved', async () => {
    const res = await makeRequest('/shop-featured')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards).toEqual([])
  })

  test('admin PUT /admin/shop-featured requires auth', async () => {
    const res = await makeRequest('/admin/shop-featured', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards: [] })
    })
    expect(res.status).toBe(401)
  })

  test('admin GET /admin/shop-featured requires auth', async () => {
    const res = await makeRequest('/admin/shop-featured')
    expect(res.status).toBe(401)
  })

  test('admin PUT rejects invalid kind and unknown refs', async () => {
    const badKind = await makeRequest('/admin/shop-featured', adminJsonOptions({
      cards: [{ kind: 'cms', ref: '1' }]
    }))
    expect(badKind.status).toBe(400)
    expect((await badKind.json()).error).toBe('invalid_kind')

    const missingProduct = await makeRequest('/admin/shop-featured', adminJsonOptions({
      cards: [{ kind: 'product', ref: '9999' }]
    }))
    expect(missingProduct.status).toBe(400)
    expect((await missingProduct.json()).error).toBe('product_not_found')

    const missingCategory = await makeRequest('/admin/shop-featured', adminJsonOptions({
      cards: [{ kind: 'category', ref: 'No Such Category' }]
    }))
    expect(missingCategory.status).toBe(400)
    expect((await missingCategory.json()).error).toBe('category_not_found')
  })

  test('admin PUT saves cards and public GET resolves product + category defaults', async () => {
    const product = await env.DB.prepare(`SELECT id FROM products WHERE slug = 'catan'`).first()
    const save = await makeRequest('/admin/shop-featured', adminJsonOptions({
      cards: [
        { kind: 'product', ref: String(product.id) },
        { kind: 'category', ref: 'board games' },
        { kind: 'product', ref: '' },
        { kind: '', ref: '' }
      ]
    }))
    expect(save.status).toBe(200)
    const saved = await save.json()
    expect(saved.success).toBe(true)
    expect(saved.cards).toHaveLength(2)
    expect(saved.cards[0]).toMatchObject({ slot: 0, kind: 'product', ref: String(product.id) })
    expect(saved.cards[1]).toMatchObject({ slot: 1, kind: 'category', ref: 'Board Games' })

    const res = await makeRequest('/shop-featured')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cards).toHaveLength(2)

    const [productCard, categoryCard] = data.cards
    expect(productCard).toMatchObject({
      slot: 0,
      kind: 'product',
      product_id: product.id,
      slug: 'catan',
      name: 'Catan',
      image_url: 'https://img.test/catan.jpg',
      href: '/products/catan'
    })
    expect(categoryCard).toMatchObject({
      slot: 1,
      kind: 'category',
      category: 'Board Games',
      name: 'Board Games',
      image_url: 'https://img.test/board-games.jpg',
      href: '/products/category/board-games'
    })
  })

  test('custom name and image override the defaults', async () => {
    const product = await env.DB.prepare(`SELECT id FROM products WHERE slug = 'catan'`).first()
    const save = await makeRequest('/admin/shop-featured', adminJsonOptions({
      cards: [
        {
          kind: 'product',
          ref: String(product.id),
          custom_name: 'Our favourite game',
          image_url: 'https://img.test/custom.jpg'
        }
      ]
    }))
    expect(save.status).toBe(200)

    const res = await makeRequest('/shop-featured')
    const data = await res.json()
    expect(data.cards).toHaveLength(1)
    expect(data.cards[0].name).toBe('Our favourite game')
    expect(data.cards[0].image_url).toBe('https://img.test/custom.jpg')
    expect(data.cards[0].href).toBe('/products/catan')
  })

  test('category card without featured image falls back to first listed product image', async () => {
    const save = await makeRequest('/admin/shop-featured', adminJsonOptions({
      cards: [{ kind: 'category', ref: 'MTG' }]
    }))
    expect(save.status).toBe(200)

    const res = await makeRequest('/shop-featured')
    const data = await res.json()
    expect(data.cards).toHaveLength(1)
    expect(data.cards[0].kind).toBe('category')
    expect(data.cards[0].category).toBe('Mtg')
    // Only the inactive MTG product exists, so no product image is available
    expect(data.cards[0].image_url).toBe('')
    expect(data.cards[0].href).toBe('/products/category/mtg')
  })

  test('inactive products are skipped by the public endpoint', async () => {
    const hidden = await env.DB.prepare(`SELECT id FROM products WHERE slug = 'hidden-draft-box'`).first()
    const save = await makeRequest('/admin/shop-featured', adminJsonOptions({
      cards: [{ kind: 'product', ref: String(hidden.id) }]
    }))
    expect(save.status).toBe(200)

    const res = await makeRequest('/shop-featured')
    const data = await res.json()
    expect(data.cards).toEqual([])
  })

  test('admin PUT replaces the previous set of cards', async () => {
    const product = await env.DB.prepare(`SELECT id FROM products WHERE slug = 'settlers'`).first()
    const save = await makeRequest('/admin/shop-featured', adminJsonOptions({
      cards: [{ kind: 'product', ref: String(product.id) }]
    }))
    expect(save.status).toBe(200)

    const adminRes = await makeRequest('/admin/shop-featured', {
      headers: { 'X-Session-Token': ADMIN_TOKEN }
    })
    expect(adminRes.status).toBe(200)
    const adminData = await adminRes.json()
    expect(adminData.cards).toHaveLength(1)
    expect(adminData.cards[0]).toMatchObject({ slot: 0, kind: 'product', ref: String(product.id) })

    const publicRes = await makeRequest('/shop-featured')
    const publicData = await publicRes.json()
    expect(publicData.cards).toHaveLength(1)
    expect(publicData.cards[0].name).toBe('Settlers of Catan')
    expect(publicData.cards[0].image_url).toBe('https://img.test/settlers.jpg')
  })
})
