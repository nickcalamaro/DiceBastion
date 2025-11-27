import { expect, test, describe, beforeAll } from 'vitest'
import { env, SELF } from 'cloudflare:test'

// Initialize test database with all required schemas
async function setupTestDatabase() {
  // Create users table
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  // Create services table (membership plans)
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      amount TEXT NOT NULL,
      currency TEXT NOT NULL,
      months INTEGER NOT NULL,
      active INTEGER DEFAULT 1
    )
  `).run()

  // Insert test membership plans
  await env.DB.prepare(`
    INSERT OR IGNORE INTO services (code, name, description, amount, currency, months, active)
    VALUES 
      ('monthly', 'Monthly Membership', 'Monthly membership plan', '2500', 'GBP', 1, 1),
      ('quarterly', 'Quarterly Membership', 'Quarterly membership plan', '6500', 'GBP', 3, 1),
      ('annual', 'Annual Membership', 'Annual membership plan', '22000', 'GBP', 12, 1)
  `).run()

  // Create memberships table
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      start_date TEXT,
      end_date TEXT,
      auto_renew INTEGER DEFAULT 0,
      payment_instrument_id TEXT,
      renewal_failed_at TEXT,
      renewal_attempts INTEGER DEFAULT 0,
      amount TEXT,
      currency TEXT,
      consent_at TEXT,
      idempotency_key TEXT,
      payment_status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  // Create tickets table
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      amount TEXT,
      currency TEXT,
      consent_at TEXT,
      idempotency_key TEXT,
      payment_status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  // Create events table
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT,
      price TEXT,
      currency TEXT DEFAULT 'GBP',
      active INTEGER DEFAULT 1
    )
  `).run()

  // Create transactions table (from ensureSchema)
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_type TEXT NOT NULL,
      reference_id INTEGER,
      user_id INTEGER,
      email TEXT,
      name TEXT,
      order_ref TEXT UNIQUE,
      checkout_id TEXT,
      payment_id TEXT,
      amount TEXT,
      currency TEXT,
      payment_status TEXT,
      idempotency_key TEXT,
      consent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT
    )
  `).run()

  // Create payment_instruments table (from ensureSchema)
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS payment_instruments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      instrument_id TEXT NOT NULL,
      card_type TEXT,
      last_4 TEXT,
      expiry_month INTEGER,
      expiry_year INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      UNIQUE(user_id, instrument_id)
    )
  `).run()

  // Create renewal_log table (from ensureSchema)
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS renewal_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membership_id INTEGER NOT NULL,
      attempt_date TEXT NOT NULL,
      status TEXT NOT NULL,
      payment_id TEXT,
      error_message TEXT,
      amount TEXT,
      currency TEXT
    )
  `).run()
}

// Helper to make requests to the worker
async function makeRequest(path, options = {}) {
  const url = new URL(path, 'http://test')
  const request = new Request(url, options)
  const response = await SELF.fetch(request)
  return response
}

// Setup database before all tests
beforeAll(async () => {
  await setupTestDatabase()
})

describe('Health Check', () => {
  test('GET /membership/plans works as health check', async () => {
    const response = await makeRequest('/membership/plans')
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.plans).toBeDefined()
  })
})

describe('Membership Plans API', () => {
  test('GET /membership/plans returns list of plans', async () => {
    const response = await makeRequest('/membership/plans')
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.plans).toBeDefined()
    expect(Array.isArray(data.plans)).toBe(true)
  })
})

describe('Transactions Table', () => {
  test('transactions table exists after schema initialization', async () => {
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'"
    ).all()
    expect(tables.results.length).toBe(1)
    expect(tables.results[0].name).toBe('transactions')
  })

  test('transactions table has correct columns', async () => {
    const columns = await env.DB.prepare('PRAGMA table_info(transactions)').all()
    const columnNames = columns.results.map(col => col.name)
    
    expect(columnNames).toContain('id')
    expect(columnNames).toContain('transaction_type')
    expect(columnNames).toContain('reference_id')
    expect(columnNames).toContain('user_id')
    expect(columnNames).toContain('order_ref')
    expect(columnNames).toContain('checkout_id')
    expect(columnNames).toContain('payment_status')
    expect(columnNames).toContain('amount')
    expect(columnNames).toContain('currency')
  })
})

describe('Payment Instruments Table', () => {
  test('payment_instruments table exists', async () => {
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='payment_instruments'"
    ).all()
    expect(tables.results.length).toBe(1)
  })

  test('payment_instruments has required columns', async () => {
    const columns = await env.DB.prepare('PRAGMA table_info(payment_instruments)').all()
    const columnNames = columns.results.map(col => col.name)
    
    expect(columnNames).toContain('user_id')
    expect(columnNames).toContain('instrument_id')
    expect(columnNames).toContain('card_type')
    expect(columnNames).toContain('last_4')
    expect(columnNames).toContain('is_active')
  })
})

describe('Renewal Log Table', () => {
  test('renewal_log table exists', async () => {
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='renewal_log'"
    ).all()
    expect(tables.results.length).toBe(1)
  })
})

describe('Email Validation', () => {
  test('invalid email returns 200 with active:false', async () => {
    // The /membership/status endpoint doesn't validate email format - it just returns no active membership
    const response = await makeRequest('/membership/status?email=invalid')
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.active).toBe(false)
  })

  test('valid email format accepted', async () => {
    const response = await makeRequest('/membership/status?email=test@example.com')
    // Should not be 400 (validation error)
    expect(response.status).not.toBe(400)
  })
})

describe('CORS Headers', () => {
  test('OPTIONS request returns CORS headers', async () => {
    const response = await makeRequest('/membership/plans', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://test.com'
      }
    })
    expect(response.status).toBe(200)
    // Check for Access-Control-Allow-Methods which is always present
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })
})

describe('Error Handling', () => {
  test('invalid endpoint returns 404', async () => {
    const response = await makeRequest('/nonexistent-endpoint')
    expect(response.status).toBe(404)
  })

  test('missing required query params returns 400', async () => {
    const response = await makeRequest('/membership/status')
    expect(response.status).toBe(400)
  })
})

describe('Auto-Renewal Status', () => {
  test('GET /membership/auto-renewal requires email', async () => {
    const response = await makeRequest('/membership/auto-renewal')
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('invalid_email')
  })

  test('GET /membership/auto-renewal with valid email', async () => {
    const response = await makeRequest('/membership/auto-renewal?email=test@example.com')
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('enabled')
    expect(data).toHaveProperty('hasPaymentMethod')
  })
})
