import { Hono } from 'hono'
import bcrypt from 'bcryptjs'

// Replace generic cors with strict configurable CORS + debug logging
const app = new Hono()
app.use('*', async (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGIN || '').split(',').map(s=>s.trim()).filter(Boolean)
  const origin = c.req.header('Origin')
  const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
  const allowOrigin = (origin && allowed.includes(origin)) ? origin : ''
  if (allowOrigin) c.res.headers.set('Access-Control-Allow-Origin', allowOrigin)
  c.res.headers.set('Vary','Origin')
  c.res.headers.set('Access-Control-Allow-Headers','Content-Type, Idempotency-Key, X-Session-Token, X-Admin-Key')
  c.res.headers.set('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS')
  if (debugMode) {
    try { console.log('CORS', { origin, allowOrigin, allowed }) } catch {}
    c.res.headers.set('X-Debug-Origin', origin || '')
    c.res.headers.set('X-Debug-Allow', allowOrigin || '')
  }
  if (c.req.method === 'OPTIONS') return new Response('', { headers: c.res.headers })
  await next()
})

// Helpers
const addMonths = (date, months) => {
  const d = new Date(date)
  const day = d.getUTCDate()
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months + 1, 0))
  const clampedDay = Math.min(day, target.getUTCDate())
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, clampedDay, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()))
}

const toIso = (d) => new Date(d).toISOString()

// --- Schema compatibility helpers (users/user_id vs members/member_id) ---
let __schemaCache
async function getSchema(db){
  if (__schemaCache) return __schemaCache
  // Detect memberships FK column (prefer user_id if present, else member_id)
  const mcols = await db.prepare('PRAGMA table_info(memberships)').all().catch(()=>({ results: [] }))
  const mnames = new Set((mcols?.results||[]).map(c => String(c.name||'').toLowerCase()))
  const fkColumn = mnames.has('user_id') ? 'user_id' : (mnames.has('member_id') ? 'member_id' : 'user_id')
  // Identity is consolidated to users
  const identityTable = 'users'
  // Detect id column in users (user_id vs id)
  let idColumn = 'user_id'
  try {
    const ic = await db.prepare('PRAGMA table_info(users)').all().catch(()=>({ results: [] }))
    const inames = new Set((ic?.results||[]).map(r => String(r.name||'').toLowerCase()))
    if (inames.has('user_id')) idColumn = 'user_id'
    else if (inames.has('id')) idColumn = 'id'
    else {
      const pk = (ic?.results||[]).find(r => r.pk === 1)
      if (pk && pk.name) idColumn = String(pk.name)
    }
  } catch {}
  __schemaCache = { fkColumn, identityTable, idColumn }
  return __schemaCache
}

async function ensureSchema(db, fkColumn){
  // memberships columns only (assume tickets already has user_id from migrations)
  try {
    const mc = await db.prepare('PRAGMA table_info(memberships)').all().catch(()=>({ results: [] }))
    const mnames = new Set((mc?.results||[]).map(r => String(r.name||'').toLowerCase()))
    const alter = []
    if (!mnames.has('amount')) alter.push('ALTER TABLE memberships ADD COLUMN amount TEXT')
    if (!mnames.has('currency')) alter.push('ALTER TABLE memberships ADD COLUMN currency TEXT')
    if (!mnames.has('consent_at')) alter.push('ALTER TABLE memberships ADD COLUMN consent_at TEXT')
    if (!mnames.has('idempotency_key')) alter.push('ALTER TABLE memberships ADD COLUMN idempotency_key TEXT')
    if (!mnames.has('payment_status')) alter.push('ALTER TABLE memberships ADD COLUMN payment_status TEXT')
    if (!mnames.has('payment_instrument_id')) alter.push('ALTER TABLE memberships ADD COLUMN payment_instrument_id TEXT')
    if (!mnames.has('renewal_failed_at')) alter.push('ALTER TABLE memberships ADD COLUMN renewal_failed_at TEXT')
    if (!mnames.has('renewal_attempts')) alter.push('ALTER TABLE memberships ADD COLUMN renewal_attempts INTEGER DEFAULT 0')
    if (!mnames.has('renewal_warning_sent')) alter.push('ALTER TABLE memberships ADD COLUMN renewal_warning_sent INTEGER DEFAULT 0')
    for (const sql of alter) { await db.prepare(sql).run().catch(()=>{}) }
  } catch {}
  // tickets columns (post consolidation, expect user_id)
  try {
    const tc = await db.prepare('PRAGMA table_info(tickets)').all().catch(()=>({ results: [] }))
    const tnames = new Set((tc?.results||[]).map(r => String(r.name||'').toLowerCase()))
    const talter = []
    if (!tnames.has('amount')) talter.push('ALTER TABLE tickets ADD COLUMN amount TEXT')
    if (!tnames.has('currency')) talter.push('ALTER TABLE tickets ADD COLUMN currency TEXT')
    if (!tnames.has('consent_at')) talter.push('ALTER TABLE tickets ADD COLUMN consent_at TEXT')
    if (!tnames.has('idempotency_key')) talter.push('ALTER TABLE tickets ADD COLUMN idempotency_key TEXT')
    if (!tnames.has('payment_status')) talter.push('ALTER TABLE tickets ADD COLUMN payment_status TEXT')
    if (!tnames.has('created_at')) talter.push('ALTER TABLE tickets ADD COLUMN created_at TEXT')
    for (const sql of talter) { await db.prepare(sql).run().catch(()=>{}) }
  } catch {}
  // Create payment_instruments table if not exists
  try {
    await db.prepare(`
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
    `).run().catch(()=>{})
  } catch {}
  // Create renewal_log table for tracking renewal attempts
  try {
    await db.prepare(`
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
    `).run().catch(()=>{})
  } catch {}
  // Create transactions table for all payment records
  try {
    await db.prepare(`
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
    `).run().catch(()=>{})
  } catch {}
  
  // Create products table for shop items
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        currency TEXT DEFAULT 'GBP',
        stock_quantity INTEGER DEFAULT 0,
        image_url TEXT,
        category TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      )
    `).run().catch(()=>{})
  } catch {}
  
  // Create orders table for shop purchases
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        shipping INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        currency TEXT DEFAULT 'GBP',
        checkout_id TEXT,
        payment_id TEXT,
        payment_status TEXT,
        shipping_address TEXT,
        billing_address TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        completed_at TEXT
      )
    `).run().catch(()=>{})
  } catch {}
  
  // Create order_items table for items in each order
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        subtotal INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `).run().catch(()=>{})
  } catch {}
  
  // Create cart_items table for temporary shopping carts
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        UNIQUE(session_id, product_id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `).run().catch(()=>{})
  } catch {}
}

// One-time migration: copy payment data from memberships/tickets to transactions
async function migrateToTransactions(db) {
  try {
    // Check if migration already ran
    const check = await db.prepare('SELECT COUNT(*) as count FROM transactions').first()
    if (check && check.count > 0) {
      console.log('Transactions table already has data, skipping migration')
      return
    }
    
    console.log('Starting migration to transactions table...')
    
    // Migrate memberships
    const memberships = await db.prepare(`
      SELECT id, user_id, email, name, order_ref, checkout_id, payment_id, amount, currency, 
             payment_status, idempotency_key, consent_at, created_at
      FROM memberships
      WHERE order_ref IS NOT NULL OR checkout_id IS NOT NULL
    `).all()
    
    for (const m of (memberships.results || [])) {
      await db.prepare(`
        INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref, 
                                  checkout_id, payment_id, amount, currency, payment_status, 
                                  idempotency_key, consent_at, created_at)
        VALUES ('membership', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        m.id, m.user_id, m.email, m.name, m.order_ref, m.checkout_id, m.payment_id,
        m.amount, m.currency, m.payment_status, m.idempotency_key, m.consent_at,
        m.created_at || toIso(new Date())
      ).run().catch(e => console.error('Failed to migrate membership', m.id, e))
    }
    
    // Migrate tickets
    const tickets = await db.prepare(`
      SELECT id, user_id, order_ref, checkout_id, payment_id, amount, currency,
             payment_status, idempotency_key, consent_at, created_at
      FROM tickets
      WHERE order_ref IS NOT NULL OR checkout_id IS NOT NULL
    `).all()
    
    for (const t of (tickets.results || [])) {
      // Get email/name from user if available
      let email = null, name = null
      if (t.user_id) {
        const user = await db.prepare('SELECT email, name FROM users WHERE user_id = ?').bind(t.user_id).first()
        email = user?.email
        name = user?.name
      }
      
      await db.prepare(`
        INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref,
                                  checkout_id, payment_id, amount, currency, payment_status,
                                  idempotency_key, consent_at, created_at)
        VALUES ('ticket', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        t.id, t.user_id, email, name, t.order_ref, t.checkout_id, t.payment_id,
        t.amount, t.currency, t.payment_status, t.idempotency_key, t.consent_at,
        t.created_at || toIso(new Date())
      ).run().catch(e => console.error('Failed to migrate ticket', t.id, e))
    }
    
    console.log(`Migrated ${memberships.results?.length || 0} memberships and ${tickets.results?.length || 0} tickets to transactions`)
  } catch (e) {
    console.error('Migration to transactions failed:', e)
  }
}

async function findIdentityByEmail(db, email){
  const s = await getSchema(db)
  const row = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE email = ?`).bind(email).first()
  if (!row) return null
  if (typeof row.id === 'undefined') row.id = row[s.idColumn]
  return row
}

async function getOrCreateIdentity(db, email, name){
  const s = await getSchema(db)
  let existing = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE email = ?`).bind(email).first()
  if (existing){ if (typeof existing.id === 'undefined') existing.id = existing[s.idColumn]; return existing }
  await db.prepare(`INSERT INTO ${s.identityTable} (email, name) VALUES (?, ?)`).bind(email, name || null).run()
  existing = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE email = ?`).bind(email).first()
  if (existing && typeof existing.id === 'undefined') existing.id = existing[s.idColumn]
  return existing
}

async function getActiveMembership(db, identityId) {
  const now = new Date().toISOString()
  // Detect available FK columns on memberships
  const mc = await db.prepare('PRAGMA table_info(memberships)').all().catch(()=>({ results: [] }))
  const mnames = new Set((mc?.results||[]).map(r => String(r.name||'').toLowerCase()))
  let where = '', binds = []
  if (mnames.has('user_id') && mnames.has('member_id')) {
    where = '(user_id = ? OR member_id = ?)'
    binds = [identityId, identityId, now]
  } else if (mnames.has('user_id')) {
    where = 'user_id = ?'
    binds = [identityId, now]
  } else {
    where = 'member_id = ?'
    binds = [identityId, now]
  }
  return await db.prepare(`SELECT * FROM memberships WHERE ${where} AND status = "active" AND end_date >= ? ORDER BY end_date DESC LIMIT 1`).bind(...binds).first()
}

// Fetch pricing/details for a plan from the services table
async function getServiceForPlan(db, planCode) {
  return await db.prepare('SELECT * FROM services WHERE code = ? AND active = 1 LIMIT 1').bind(planCode).first()
}

// Obtain SumUp OAuth token to verify payments server-side
async function sumupToken(env, scopes = 'payments') {
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SUMUP_CLIENT_ID, client_secret: env.SUMUP_CLIENT_SECRET, scope: scopes })
  const res = await fetch('https://api.sumup.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!res.ok) { const txt = await res.text().catch(()=>{}); throw new Error(`Failed to get SumUp token (${res.status}): ${txt}`) }
  const json = await res.json(); 
  const granted = (json.scope||'').split(/\s+/).filter(Boolean)
  const required = scopes.split(/\s+/).filter(Boolean)
  const missing = required.filter(s => !granted.includes(s))
  if (missing.length > 0) { throw new Error(`SumUp OAuth token missing required scopes: ${missing.join(', ')} (granted: [${granted.join(', ')}])`) }
  return json
}

// Create or get SumUp customer for a user
async function getOrCreateSumUpCustomer(env, user) {
  console.log('getOrCreateSumUpCustomer called with user:', JSON.stringify(user))
  const { access_token } = await sumupToken(env, 'payments payment_instruments')
  const userId = user.user_id || user.id
  console.log('Resolved userId:', userId, 'from user.user_id:', user.user_id, 'or user.id:', user.id)
  const customerId = `USER-${userId}`
  console.log('Customer ID to use:', customerId)
  
  // Try to get existing customer first
  const getRes = await fetch(`https://api.sumup.com/v0.1/customers/${customerId}`, {
    headers: { 
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (getRes.ok) {
    const customer = await getRes.json()
    console.log('Found existing SumUp customer:', customerId)
    return customer.customer_id
  }
  
  // Customer doesn't exist, create new one
  console.log('Creating new SumUp customer:', customerId)
  const createRes = await fetch('https://api.sumup.com/v0.1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customer_id: customerId,
      personal_details: {
        email: user.email,
        first_name: user.name ? user.name.split(' ')[0] : 'Customer',
        last_name: user.name ? user.name.split(' ').slice(1).join(' ') || 'Member' : 'Member'
      }
    })
  })
  
  if (!createRes.ok) {
    const txt = await createRes.text()
    console.error('Failed to create SumUp customer:', createRes.status, txt)
    throw new Error(`Failed to create SumUp customer (${createRes.status}): ${txt}`)
  }
  
  const customer = await createRes.json()
  console.log('Created SumUp customer - Full response:', JSON.stringify(customer))
  console.log('Returning customer_id:', customer.customer_id)
  return customer.customer_id
}

async function createCheckout(env, { amount, currency, orderRef, title, description, savePaymentInstrument = false, customerId = null }) {
  const { access_token } = await sumupToken(env, savePaymentInstrument ? 'payments payment_instruments' : 'payments')
  const body = { 
    amount: Number(amount), 
    currency, 
    checkout_reference: orderRef, 
    merchant_code: env.SUMUP_MERCHANT_CODE, 
    description: description || title
  }
  
  // Add return_url if RETURN_URL is configured (for hosted checkout, not needed for widget)
  if (env.RETURN_URL) {
    try {
      const returnUrl = new URL(env.RETURN_URL)
      returnUrl.searchParams.set('orderRef', orderRef)
      body.return_url = returnUrl.toString()
    } catch (e) {
      console.warn('Invalid RETURN_URL, skipping return_url in checkout:', e.message)
    }
  }
  // Request card tokenization using SumUp's recurring payment flow
  if (savePaymentInstrument && customerId) {
    body.purpose = 'SETUP_RECURRING_PAYMENT'
    body.customer_id = customerId
  }
  const res = await fetch('https://api.sumup.com/v0.1/checkouts', { method: 'POST', headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) { const txt = await res.text(); throw new Error(`Create checkout failed: ${txt}`) }
  const json = await res.json()
  if (!json || !json.id) throw new Error('missing_checkout_id')
  return json
}

async function fetchPayment(env, paymentId) {
  const { access_token } = await sumupToken(env, 'payments')
  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${paymentId}`, { headers: { Authorization: `Bearer ${access_token}` } })
  if (!res.ok) throw new Error('Failed to fetch payment')
  return res.json()
}

// Save payment instrument from a successful payment
async function savePaymentInstrument(db, userId, checkoutId, env) {
  try {
    const { access_token } = await sumupToken(env, 'payments payment_instruments')
    
    // Get the checkout details
    const checkoutRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    })
    if (!checkoutRes.ok) {
      console.error('Failed to fetch checkout:', checkoutRes.status, await checkoutRes.text())
      return null
    }
    const checkout = await checkoutRes.json()
    console.log('Checkout response for tokenization:', JSON.stringify(checkout))
    
    // With purpose=SETUP_RECURRING_PAYMENT, the payment_instrument should be in the response
    if (checkout.payment_instrument) {
      const instrument = checkout.payment_instrument
      console.log('Found payment_instrument:', JSON.stringify(instrument))
      
      const now = toIso(new Date())
      const instrumentId = instrument.token || instrument.id
      
      if (!instrumentId) {
        console.error('Payment instrument missing token/id')
        return null
      }
      
      // Deactivate old instruments
      await db.prepare('UPDATE payment_instruments SET is_active = 0 WHERE user_id = ?').bind(userId).run()
      
      // Save new instrument
      await db.prepare(`
        INSERT INTO payment_instruments (user_id, instrument_id, card_type, last_4, expiry_month, expiry_year, created_at, updated_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(user_id, instrument_id) DO UPDATE SET is_active = 1, updated_at = ?
      `).bind(
        userId,
        instrumentId,
        instrument.type || instrument.card_type || null,
        instrument.last_4_digits || instrument.last_4 || null,
        instrument.expiry_month || null,
        instrument.expiry_year || null,
        now,
        now,
        now
      ).run()
      
      console.log('Successfully saved payment instrument:', instrumentId)
      return instrumentId
    }
    
    console.warn('No payment_instrument found in checkout response')
    console.warn('Ensure purpose=SETUP_RECURRING_PAYMENT and customer_id were set in checkout creation')
    return null
  } catch (e) {
    console.error('Failed to save payment instrument:', e)
    return null
  }
}

// Charge a saved payment instrument
async function chargePaymentInstrument(env, userId, instrumentId, amount, currency, orderRef, description) {
  try {
    const { access_token } = await sumupToken(env, 'payments payment_instruments')
    
    // Verify customer exists in SumUp Customer API
    const customerId = `USER-${userId}`
    const customerCheckRes = await fetch(`https://api.sumup.com/v0.1/customers/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!customerCheckRes.ok) {
      console.error(`Customer ${customerId} not found in SumUp Customer API`)
      throw new Error(`Customer ${customerId} does not exist. Cannot process recurring payment.`)
    }
    
    // Create checkout
    const checkoutBody = {
      amount: Number(amount),
      currency,
      checkout_reference: orderRef,
      merchant_code: env.SUMUP_MERCHANT_CODE,
      description
    }
    
    const checkoutRes = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutBody)
    })
    
    if (!checkoutRes.ok) {
      const txt = await checkoutRes.text()
      throw new Error(`Checkout creation failed: ${txt}`)
    }
    
    const checkout = await checkoutRes.json()
    console.log('Created checkout for renewal:', checkout.id)
    
    // Process payment with the saved token
    // Per SumUp documentation: Both token and customer_id fields are required for recurring payments
    // The customer_id must match the customer that was used during SETUP_RECURRING_PAYMENT
    const paymentBody = {
      payment_type: 'card',
      token: instrumentId,
      customer_id: customerId
    }
    
    const paymentRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkout.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentBody)
    })
    
    if (!paymentRes.ok) {
      const txt = await paymentRes.text()
      throw new Error(`Payment processing failed: ${txt}`)
    }
    
    const payment = await paymentRes.json()
    console.log('Processed recurring payment:', payment.id, payment.status)
    return payment
  } catch (e) {
    console.error('Charge payment instrument error:', e)
    throw e
  }
}

// Get active payment instrument for user
async function getActivePaymentInstrument(db, userId) {
  return await db.prepare('SELECT * FROM payment_instruments WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1')
    .bind(userId).first()
}

// Process renewal for a single membership
async function processMembershipRenewal(db, membership, env) {
  const s = await getSchema(db)
  const userId = (typeof membership.user_id !== 'undefined' && membership.user_id !== null) ? membership.user_id : membership.member_id
  
  // Get payment instrument
  const instrument = await getActivePaymentInstrument(db, userId)
  if (!instrument) {
    await db.prepare('UPDATE memberships SET renewal_failed_at = ?, renewal_attempts = renewal_attempts + 1 WHERE id = ?')
      .bind(toIso(new Date()), membership.id).run()
    await db.prepare('INSERT INTO renewal_log (membership_id, attempt_date, status, error_message) VALUES (?, ?, ?, ?)')
      .bind(membership.id, toIso(new Date()), 'failed', 'No active payment instrument').run()
    return { success: false, error: 'no_instrument' }
  }
  
  // Get service details
  const svc = await getServiceForPlan(db, membership.plan)
  if (!svc) {
    return { success: false, error: 'plan_not_found' }
  }
  
  const amount = Number(svc.amount)
  const currency = svc.currency || env.CURRENCY || 'GBP'
  const orderRef = `RENEWAL-${membership.id}-${crypto.randomUUID()}`
  
  try {
    // Charge the payment instrument
    const payment = await chargePaymentInstrument(
      env,
      userId,
      instrument.instrument_id,
      amount,
      currency,
      orderRef,
      `Renewal: Dice Bastion ${membership.plan} membership`
    )
    
    // If successful, extend membership
    if (payment && (payment.status === 'PAID' || payment.status === 'SUCCESSFUL')) {
      const months = Number(svc.months || 0)
      const currentEnd = new Date(membership.end_date)
      const newEnd = addMonths(currentEnd, months)
      
      // Update membership
      await db.prepare(`
        UPDATE memberships 
        SET end_date = ?, 
            renewal_failed_at = NULL, 
            renewal_attempts = 0,
            renewal_warning_sent = 0
        WHERE id = ?
      `).bind(toIso(newEnd), membership.id).run()
      
      // Create transaction record for renewal
      const user = await db.prepare('SELECT email, name FROM users WHERE user_id = ?').bind(userId).first()
      await db.prepare(`
        INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref,
                                  payment_id, amount, currency, payment_status)
        VALUES ('renewal', ?, ?, ?, ?, ?, ?, ?, ?, 'PAID')
      `).bind(membership.id, userId, user?.email, user?.name, orderRef, payment.id, String(amount), currency).run()
      
      // Log renewal attempt
      await db.prepare('INSERT INTO renewal_log (membership_id, attempt_date, status, payment_id, amount, currency) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(membership.id, toIso(new Date()), 'success', payment.id, String(amount), currency).run()
      
      // Send renewal success email
      if (user) {
        const emailContent = getRenewalSuccessEmail(membership, user, toIso(newEnd))
        await sendEmail(env, { to: user.email, ...emailContent }).catch(err => {
          console.error('Renewal success email error:', err)
        })
      }
      
      return { success: true, newEndDate: toIso(newEnd), paymentId: payment.id }
    } else {
      throw new Error(`Payment not successful: ${payment?.status || 'UNKNOWN'}`)
    }
  } catch (e) {
    const currentAttempts = (membership.renewal_attempts || 0) + 1
    
    await db.prepare('UPDATE memberships SET renewal_failed_at = ?, renewal_attempts = ? WHERE id = ?')
      .bind(toIso(new Date()), currentAttempts, membership.id).run()
    await db.prepare('INSERT INTO renewal_log (membership_id, attempt_date, status, error_message, amount, currency) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(membership.id, toIso(new Date()), 'failed', String(e.message || e), String(amount), currency).run()
    
    // Get user for email notification
    const user = await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first()
    
    // If this is the 3rd failure, disable auto-renewal and send final notice
    if (currentAttempts >= 3 && user) {
      await db.prepare('UPDATE memberships SET auto_renew = 0 WHERE id = ?').bind(membership.id).run()
      
      const emailContent = getRenewalFailedFinalEmail(membership, user)
      await sendEmail(env, { to: user.email, ...emailContent }).catch(err => {
        console.error('Renewal final failure email error:', err)
      })
    } else if (user) {
      // Send regular failure notification (attempts 1 or 2)
      const emailContent = getRenewalFailedEmail(membership, user, currentAttempts)
      await sendEmail(env, { to: user.email, ...emailContent }).catch(err => {
        console.error('Renewal failed email error:', err)
      })
    }
    
    return { success: false, error: String(e.message || e), attempts: currentAttempts }
  }
}

// Turnstile verification with optional debug logging
async function verifyTurnstile(env, token, ip, debug){
  if (!env.TURNSTILE_SECRET) { if (debug) console.log('turnstile: secret missing -> bypass'); return true }
  if (!token) { if (debug) console.log('turnstile: missing token'); return false }
  const form = new URLSearchParams(); form.set('secret', env.TURNSTILE_SECRET); form.set('response', token); if (ip) form.set('remoteip', ip)
  let res, j = {};
  try {
    res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method:'POST', body: form })
    j = await res.json().catch(()=>({}))
  } catch (e) {
    if (debug) console.log('turnstile: siteverify fetch error', String(e))
    return false
  }
  if (debug) console.log('turnstile: siteverify', { status: res?.status, success: j?.['success'], errors: j?.['error-codes'], hostname: j?.hostname })
  return !!j.success
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EVT_UUID_RE = /^EVT-\d+-[0-9a-f\-]{36}$/i

function clampStr(v, max){ return (v||'').substring(0, max) }

// MailerSend email helper
async function sendEmail(env, { to, subject, html, text }) {
  if (!env.MAILERSEND_API_KEY) {
    console.warn('MAILERSEND_API_KEY not configured, skipping email')
    return { skipped: true }
  }
  
  try {
    const body = {
      from: { email: env.MAILERSEND_FROM_EMAIL || 'noreply@dicebastion.com', name: env.MAILERSEND_FROM_NAME || 'Dice Bastion' },
      to: [{ email: to }],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    }
    
    const res = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.MAILERSEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    if (!res.ok) {
      const txt = await res.text()
      console.error('MailerSend error:', txt)
      return { success: false, error: txt }
    }
    
    return { success: true }
  } catch (e) {
    console.error('Email send error:', e)
    return { success: false, error: String(e) }
  }
}

// Generate email templates
function getRenewalSuccessEmail(membership, user, newEndDate) {
  const planNames = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' }
  const planName = planNames[membership.plan] || membership.plan
  
  return {
    subject: `Your Dice Bastion ${planName} Membership Has Been Renewed`,
    html: `
      <h2>Membership Renewed Successfully</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>Great news! Your <strong>${planName} Membership</strong> has been automatically renewed.</p>
      <ul>
        <li><strong>Plan:</strong> ${planName}</li>
        <li><strong>Amount:</strong> £${membership.amount}</li>
        <li><strong>New End Date:</strong> ${new Date(newEndDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
      </ul>
      <p>Your membership will continue uninterrupted. If you wish to cancel auto-renewal, you can do so from your <a href="https://dicebastion.com/account">account page</a>.</p>
      <p>Thank you for being a valued member!</p>
      <p>— The Dice Bastion Team</p>
    `
  }
}

function getUpcomingRenewalEmail(membership, user, daysUntil) {
  const planNames = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' }
  const planName = planNames[membership.plan] || membership.plan
  const renewalDate = new Date(membership.end_date).toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  return {
    subject: `Dice Bastion: Your ${planName} Membership Renews in ${daysUntil} Days`,
    html: `
      <h2>Your Membership Renews Soon</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>This is a friendly reminder that your <strong>${planName} Membership</strong> will automatically renew on <strong>${renewalDate}</strong>.</p>
      <p><strong>Your membership details:</strong></p>
      <ul>
        <li>Plan: ${planName}</li>
        <li>Renewal Date: ${renewalDate}</li>
        <li>Payment Method: Card ending in ${membership.payment_instrument_last_4 || '••••'}</li>
      </ul>
      <p>Your card will be charged automatically, and your membership will continue uninterrupted.</p>
      <p><strong>Need to make changes?</strong></p>
      <ul>
        <li>Update your payment method at <a href="https://dicebastion.com/memberships">dicebastion.com/memberships</a></li>
        <li>Cancel auto-renewal if you don't wish to continue</li>
      </ul>
      <p>Thank you for being part of the Dice Bastion community!</p>
      <p>— The Dice Bastion Team</p>
    `,
    text: `Hi ${user.name || 'there'},\n\nYour ${planName} Membership will automatically renew on ${renewalDate}.\n\nYour card will be charged automatically. If you need to update your payment method or cancel auto-renewal, visit dicebastion.com/memberships.\n\nThank you!\n— The Dice Bastion Team`
  }
}

function getRenewalFailedEmail(membership, user, attemptNumber = 1) {
  const planNames = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' }
  const planName = planNames[membership.plan] || membership.plan
  const attemptsRemaining = 3 - attemptNumber
  
  return {
    subject: `Action Required: Dice Bastion Membership Renewal Failed (Attempt ${attemptNumber}/3)`,
    html: `
      <h2>Membership Renewal Payment Failed</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>We attempted to automatically renew your <strong>${planName} Membership</strong>, but the payment was unsuccessful.</p>
      <p><strong>Important:</strong> Your membership expires on <strong>${new Date(membership.end_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
      ${attemptsRemaining > 0 ? `
        <p>We will automatically retry ${attemptsRemaining} more time${attemptsRemaining > 1 ? 's' : ''} before your expiration date. However, to ensure uninterrupted access, please update your payment method now.</p>
      ` : ''}
      <p><strong>What to do next:</strong></p>
      <ul>
        <li><strong>Recommended:</strong> Update your payment method at <a href="https://dicebastion.com/memberships">dicebastion.com/memberships</a></li>
        <li>Or purchase a new membership at <a href="https://dicebastion.com/memberships">dicebastion.com/memberships</a></li>
        <li>Contact us if you need help: support@dicebastion.com</li>
      </ul>
      <p><strong>Common reasons for payment failure:</strong></p>
      <ul>
        <li>Card expired or was replaced</li>
        <li>Insufficient funds</li>
        <li>Card was reported lost/stolen</li>
        <li>Bank declined the charge</li>
      </ul>
      <p>Thank you for your understanding!</p>
      <p>— The Dice Bastion Team</p>
    `,
    text: `Hi ${user.name || 'there'},\n\nWe attempted to renew your ${planName} Membership, but the payment failed (attempt ${attemptNumber}/3).\n\nYour membership expires on ${new Date(membership.end_date).toLocaleDateString('en-GB')}.\n\nPlease update your payment method at dicebastion.com/memberships to avoid interruption.\n\n— The Dice Bastion Team`
  }
}

function getRenewalFailedFinalEmail(membership, user) {
  const planNames = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' }
  const planName = planNames[membership.plan] || membership.plan
  
  return {
    subject: `Urgent: Dice Bastion Membership Auto-Renewal Disabled`,
    html: `
      <h2>Auto-Renewal Disabled - Action Required</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>After 3 unsuccessful attempts to charge your payment method, we've <strong>disabled auto-renewal</strong> for your ${planName} Membership.</p>
      <p><strong>Your membership will expire on ${new Date(membership.end_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> and will not automatically renew.</p>
      <div style="background: #fff3cd; border-left: 4px solid #856404; padding: 16px; margin: 20px 0;">
        <strong>⚠️ To continue your membership:</strong>
        <p style="margin: 8px 0 0 0;">You'll need to purchase a new membership after your current one expires.</p>
      </div>
      <p><strong>What to do now:</strong></p>
      <ul>
        <li><strong>Option 1:</strong> Purchase a new membership at <a href="https://dicebastion.com/memberships">dicebastion.com/memberships</a> (you can do this now or when your current membership expires)</li>
        <li><strong>Option 2:</strong> Update your payment method and contact us to re-enable auto-renewal</li>
        <li><strong>Need help?</strong> Email us at support@dicebastion.com</li>
      </ul>
      <p>We'd love to keep you as a member! If you're experiencing payment issues, please reach out and we'll help resolve them.</p>
      <p>— The Dice Bastion Team</p>
    `,
    text: `Hi ${user.name || 'there'},\n\nAfter 3 unsuccessful payment attempts, we've disabled auto-renewal for your ${planName} Membership.\n\nYour membership expires on ${new Date(membership.end_date).toLocaleDateString('en-GB')} and will NOT automatically renew.\n\nTo continue your membership, purchase a new one at dicebastion.com/memberships or contact us to re-enable auto-renewal.\n\n— The Dice Bastion Team`
  }
}

function getTicketConfirmationEmail(event, user, transaction) {
  const eventDate = new Date(event.event_date).toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const eventTime = event.event_time || 'TBC'
  const amount = transaction.amount || '0.00'
  const currency = transaction.currency || 'GBP'
  const sym = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'
  
  return {
    subject: `Ticket Confirmed: ${event.event_name}`,
    html: `
      <h2>Your Ticket is Confirmed!</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>Thank you for purchasing a ticket to <strong>${event.event_name}</strong>!</p>
      
      <h3>Event Details:</h3>
      <ul>
        <li><strong>Event:</strong> ${event.event_name}</li>
        <li><strong>Date:</strong> ${eventDate}</li>
        <li><strong>Time:</strong> ${eventTime}</li>
        <li><strong>Location:</strong> ${event.location || 'Dice Bastion'}</li>
        ${event.description ? `<li><strong>Description:</strong> ${event.description}</li>` : ''}
      </ul>
      
      <h3>Payment Details:</h3>
      <ul>
        <li><strong>Amount Paid:</strong> ${sym}${amount}</li>
        <li><strong>Order Reference:</strong> ${transaction.order_ref}</li>
      </ul>
      
      <p>Please bring this email or show your order reference at the event check-in.</p>
      
      ${event.additional_info ? `<p><strong>Important Information:</strong><br>${event.additional_info}</p>` : ''}
      
      <p>Looking forward to seeing you there!</p>
      <p>— The Dice Bastion Team</p>
    `,
    text: `
Your Ticket is Confirmed!

Hi ${user.name || 'there'},

Thank you for purchasing a ticket to ${event.event_name}!

EVENT DETAILS:
- Event: ${event.event_name}
- Date: ${eventDate}
- Time: ${eventTime}
- Location: ${event.location || 'Dice Bastion'}
${event.description ? `- Description: ${event.description}` : ''}

PAYMENT DETAILS:
- Amount Paid: ${sym}${amount}
- Order Reference: ${transaction.order_ref}

Please bring this email or show your order reference at the event check-in.

${event.additional_info ? `Important Information: ${event.additional_info}` : ''}

Looking forward to seeing you there!

— The Dice Bastion Team
    `
  }
}

function getWelcomeEmail(membership, user, autoRenew) {
  const planNames = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' }
  const planName = planNames[membership.plan] || membership.plan
  
  return {
    subject: `Welcome to Dice Bastion ${planName} Membership!`,
    html: `
      <h2>Welcome to Dice Bastion!</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>Thank you for becoming a <strong>${planName} Member</strong>!</p>
      <ul>
        <li><strong>Plan:</strong> ${planName}</li>
        <li><strong>Valid Until:</strong> ${new Date(membership.end_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
        <li><strong>Auto-Renewal:</strong> ${autoRenew ? 'Enabled ✓' : 'Disabled'}</li>
      </ul>
      ${autoRenew ? '<p>Your membership will automatically renew before expiration. You can manage this at any time from your <a href="https://dicebastion.com/account">account page</a>.</p>' : '<p>Remember to renew your membership before it expires to continue enjoying member benefits!</p>'}
      <p><strong>Member Benefits:</strong></p>
      <ul>
        <li>Discounted event tickets</li>
        <li>Priority booking for tournaments</li>
        <li>Exclusive member events</li>
        <li>And much more!</li>
      </ul>
      <p>See you at the club!</p>
      <p>— The Dice Bastion Team</p>
    `
  }
}

// Membership checkout with idempotency + Turnstile
app.post('/membership/checkout', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP')
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    const idem = c.req.header('Idempotency-Key')?.trim()
    const { email, name, plan, privacyConsent, turnstileToken, autoRenew } = await c.req.json()
    if (!email || !plan) return c.json({ error: 'missing_fields' }, 400)
    if (!EMAIL_RE.test(email) || email.length > 320) return c.json({ error:'invalid_email' },400)
    if (!privacyConsent) return c.json({ error: 'privacy_consent_required' }, 400)
    if (name && name.length > 200) return c.json({ error:'name_too_long' },400)
    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode)
    if (!tsOk) return c.json({ error:'turnstile_failed' },403)

    const ident = await getOrCreateIdentity(c.env.DB, email, clampStr(name,200))
    const svc = await getServiceForPlan(c.env.DB, plan)
    if (!svc) return c.json({ error: 'unknown_plan' }, 400)
    const amount = Number(svc.amount)
    if (!Number.isFinite(amount) || amount <= 0) return c.json({ error:'invalid_amount' },400)
    const currency = svc.currency || c.env.CURRENCY || 'GBP'
    const s = await getSchema(c.env.DB)

    // Ensure schema is up to date
    await ensureSchema(c.env.DB, s.fkColumn)
    await migrateToTransactions(c.env.DB)

    // Idempotency check in transactions table
    const order_ref = crypto.randomUUID()
    if (idem){
      const existing = await c.env.DB.prepare(`
        SELECT t.*, m.id as membership_id FROM transactions t
        JOIN memberships m ON m.id = t.reference_id
        WHERE t.transaction_type = 'membership' AND t.user_id = ? AND t.idempotency_key = ?
        ORDER BY t.id DESC LIMIT 1
      `).bind(ident.id, idem).first()
      if (existing && existing.checkout_id){
        return c.json({ orderRef: existing.order_ref, checkoutId: existing.checkout_id, reused: true })
      }
    }

    const autoRenewValue = autoRenew ? 1 : 0
    
    // Insert minimal membership record (business logic only)
    const mc = await c.env.DB.prepare('PRAGMA table_info(memberships)').all().catch(()=>({ results: [] }))
    const mnames = new Set((mc?.results||[]).map(r => String(r.name||'').toLowerCase()))
    const cols = ['plan','status','auto_renew']
    const vals = [plan,'pending', autoRenewValue]
    if (mnames.has('user_id')) { cols.unshift('user_id'); vals.unshift(ident.id) }
    if (mnames.has('member_id')) { cols.unshift('member_id'); vals.unshift(ident.id) }
    const placeholders = cols.map(()=>'?').join(',')
    const mResult = await c.env.DB.prepare(`INSERT INTO memberships (${cols.join(',')}) VALUES (${placeholders}) RETURNING id`).bind(...vals).first()
    const membershipId = mResult?.id || (await c.env.DB.prepare('SELECT last_insert_rowid() as id').first()).id

    let checkout
    try {
      // Create or get SumUp customer if auto-renewal enabled
      let customerId = null
      if (autoRenewValue === 1) {
        customerId = await getOrCreateSumUpCustomer(c.env, ident)
        console.log('Using SumUp customer ID for auto-renewal:', customerId)
      }
      
      checkout = await createCheckout(c.env, { 
        amount, 
        currency, 
        orderRef: order_ref, 
        title: `Dice Bastion ${plan} membership`, 
        description: `Membership for ${plan}`,
        savePaymentInstrument: autoRenewValue === 1,
        customerId
      })
    } catch (err) {
      console.error('sumup checkout error', err)
      return c.json({ error: 'sumup_checkout_failed', message: String(err?.message || err) }, 502)
    }
    if (!checkout.id) {
      console.error('membership checkout missing id', checkout)
      return c.json({ error: 'sumup_missing_id' }, 502)
    }
    
    // Store payment details in transactions table
    await c.env.DB.prepare(`
      INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref, 
                                checkout_id, amount, currency, payment_status, idempotency_key, consent_at)
      VALUES ('membership', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(membershipId, ident.id, email, clampStr(name,200), order_ref, checkout.id, 
            String(amount), currency, idem || null, toIso(new Date())).run()
    
    return c.json({ orderRef: order_ref, checkoutId: checkout.id })
  } catch (e) {
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    console.error('membership checkout error', e)
    return c.json(debugMode ? { error: 'internal_error', detail: String(e), stack: String(e?.stack||'') } : { error: 'internal_error' }, 500)
  }
})

app.get('/membership/status', async (c) => {
  const email = c.req.query('email')
  if (!email) return c.json({ error: 'email required' }, 400)
  const ident = await findIdentityByEmail(c.env.DB, email)
  if (!ident) return c.json({ active: false })
  const active = await getActiveMembership(c.env.DB, ident.id)
  if (!active) return c.json({ active: false })
  return c.json({ active: true, plan: active.plan, endDate: active.end_date })
})

// Expose active plans/prices for frontend labeling
app.get('/membership/plans', async (c) => {
  const rows = await c.env.DB.prepare('SELECT code, name, description, amount, currency, months FROM services WHERE active = 1 ORDER BY id').all()
  return c.json({ plans: rows.results || [] })
})

app.get('/membership/confirm', async (c) => {
  const orderRef = c.req.query('orderRef')
  if (!orderRef || !UUID_RE.test(orderRef)) return c.json({ ok:false, error:'invalid_orderRef' },400)
  
  // Get transaction record
  const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "membership"').bind(orderRef).first()
  if (!transaction) return c.json({ ok:false, error:'order_not_found' },404)
  
  // Get membership record
  const pending = await c.env.DB.prepare('SELECT * FROM memberships WHERE id = ?').bind(transaction.reference_id).first()
  if (!pending) return c.json({ ok:false, error:'membership_not_found' },404)
  if (pending.status === 'active') {
    // Get card details if auto-renewal is enabled
    let cardLast4 = null
    if (pending.auto_renew === 1 && pending.payment_instrument_id) {
      const instrument = await c.env.DB.prepare('SELECT last_4 FROM payment_instruments WHERE instrument_id = ?')
        .bind(pending.payment_instrument_id).first()
      cardLast4 = instrument?.last_4 || null
    }
    return c.json({ 
      ok: true, 
      status: 'already_active',
      plan: pending.plan,
      endDate: pending.end_date,
      amount: transaction.amount,
      currency: transaction.currency || 'GBP',
      autoRenew: pending.auto_renew === 1,
      cardLast4
    })
  }
  
  // Verify payment with SumUp
  let payment; 
  try { payment = await fetchPayment(c.env, transaction.checkout_id) } 
  catch { return c.json({ ok:false, error:'verify_failed' },400) }
  
  const paid = payment && (payment.status === 'PAID' || payment.status === 'SUCCESSFUL')
  if (!paid) return c.json({ ok:false, status: payment?.status || 'PENDING' })
  
  // Verify amount/currency
  if (payment.amount != Number(transaction.amount) || (transaction.currency && payment.currency !== transaction.currency)) {
    return c.json({ ok:false, error:'payment_mismatch' },400)
  }
  
  const s = await getSchema(c.env.DB)
  const identityId = (typeof pending.user_id !== 'undefined' && pending.user_id !== null) ? pending.user_id : pending.member_id
  const activeExisting = await getActiveMembership(c.env.DB, identityId)
  const svc = await getServiceForPlan(c.env.DB, pending.plan)
  if (!svc) return c.json({ ok:false, error:'plan_not_configured' },400)
  const months = Number(svc.months || 0)
  const baseStart = activeExisting ? new Date(activeExisting.end_date) : new Date()
  const end = addMonths(baseStart, months)
  
  // Save payment instrument for auto-renewal ONLY if auto_renew is enabled
  let instrumentId = null
  if (pending.auto_renew === 1) {
    instrumentId = await savePaymentInstrument(c.env.DB, identityId, transaction.checkout_id, c.env)
  }
  
  // Update membership status
  await c.env.DB.prepare(`
    UPDATE memberships 
    SET status = "active", 
        start_date = ?, 
        end_date = ?, 
        payment_instrument_id = ?
    WHERE id = ?
  `).bind(toIso(baseStart), toIso(end), instrumentId, pending.id).run()
  
  // Update transaction status
  await c.env.DB.prepare(`
    UPDATE transactions 
    SET payment_status = "PAID",
        payment_id = ?,
        updated_at = ?
    WHERE id = ?
  `).bind(payment.id, toIso(new Date()), transaction.id).run()
  
  // Get user details and send welcome email
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(identityId).first()
  if (user) {
    const updatedMembership = { ...pending, end_date: toIso(end) }
    const emailContent = getWelcomeEmail(updatedMembership, user, pending.auto_renew === 1)
    await sendEmail(c.env, { to: user.email, ...emailContent })
  }
  
  // Get payment instrument details for display
  let cardLast4 = null
  if (instrumentId) {
    const instrument = await c.env.DB.prepare('SELECT last_4 FROM payment_instruments WHERE instrument_id = ? AND user_id = ?')
      .bind(instrumentId, identityId).first()
    cardLast4 = instrument?.last_4 || null
  }
  
  return c.json({ 
    ok: true, 
    status: 'active',
    plan: pending.plan,
    endDate: toIso(end),
    amount: transaction.amount,
    currency: transaction.currency || 'GBP',
    autoRenew: pending.auto_renew === 1,
    cardLast4
  })
})

app.post('/webhooks/sumup', async (c) => {
  const payload = await c.req.json()
  const { id: paymentId, checkout_reference: orderRef, currency } = payload
  if (!paymentId || !orderRef) return c.json({ ok: false }, 400)

  let payment
  try { payment = await fetchPayment(c.env, paymentId) } catch (e) { return c.json({ ok: false, error: 'verify_failed' }, 400) }
  if (!payment || payment.status !== 'PAID') return c.json({ ok: true })

  const pending = await c.env.DB.prepare('SELECT * FROM memberships WHERE order_ref = ?').bind(orderRef).first()
  if (!pending) return c.json({ ok: false, error: 'order_not_found' }, 404)

  const svc = await getServiceForPlan(c.env.DB, pending.plan)
  if (!svc) return c.json({ ok: false, error: 'plan_not_configured' }, 400)
  if (currency && svc.currency && currency !== svc.currency) return c.json({ ok: false, error: 'currency_mismatch' }, 400)

  const now = new Date()
  const s = await getSchema(c.env.DB)
  const identityId = (typeof pending.user_id !== 'undefined' && pending.user_id !== null) ? pending.user_id : pending.member_id
  const memberActive = await getActiveMembership(c.env.DB, identityId)
  const baseStart = memberActive ? new Date(memberActive.end_date) : now
  const months = Number(svc.months || 0)
  const start = baseStart
  const end = addMonths(baseStart, months)

  await c.env.DB.prepare('UPDATE memberships SET status = "active", start_date = ?, end_date = ?, payment_id = ? WHERE id = ?').bind(toIso(start), toIso(end), paymentId, pending.id).run()
  
  // Send welcome email (critical - works even if user closed browser)
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(identityId).first()
  if (user) {
    const updatedMembership = { ...pending, end_date: toIso(end) }
    const emailContent = getWelcomeEmail(updatedMembership, user, pending.auto_renew === 1)
    await sendEmail(c.env, { to: user.email, ...emailContent }).catch(err => {
      console.error('Webhook email failed:', err)
      // Don't fail webhook if email fails
    })
  }
  
  return c.json({ ok: true })
})

// Get event basic info
app.get('/events/:id', async c => {
  const id = c.req.param('id')
  if (!id || isNaN(Number(id))) return c.json({ error:'invalid_event_id' },400)
  const ev = await c.env.DB.prepare('SELECT event_id,event_name,description,event_datetime,location,membership_price,non_membership_price,capacity,tickets_sold,category,image_url FROM events WHERE event_id = ?').bind(Number(id)).first()
  if (!ev) return c.json({ error:'not_found' },404)
  return c.json({ event: ev })
})

// Create ticket checkout with idempotency + Turnstile
app.post('/events/:id/checkout', async c => {
  try {
    const id = c.req.param('id')
    if (!id || isNaN(Number(id))) return c.json({ error:'invalid_event_id' },400)
    const evId = Number(id)
    const ip = c.req.header('CF-Connecting-IP')
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    const idem = c.req.header('Idempotency-Key')?.trim()
    const { email, name, privacyConsent, turnstileToken } = await c.req.json()
    if (!email) return c.json({ error:'email_required' },400)
    if (!EMAIL_RE.test(email)) return c.json({ error:'invalid_email' },400)
    if (!privacyConsent) return c.json({ error:'privacy_consent_required' },400)
    if (name && name.length > 200) return c.json({ error:'name_too_long' },400)
    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode)
    if (!tsOk) return c.json({ error:'turnstile_failed' },403)

    const ev = await c.env.DB.prepare('SELECT * FROM events WHERE event_id = ?').bind(evId).first()
    if (!ev) return c.json({ error:'event_not_found' },404)
    if (ev.capacity && ev.tickets_sold >= ev.capacity) return c.json({ error:'sold_out' },409)

    const ident = await getOrCreateIdentity(c.env.DB, email, clampStr(name,200))
    if (!ident || typeof ident.id === 'undefined' || ident.id === null) {
      console.error('identity missing id', ident)
      return c.json({ error:'identity_error' },500)
    }
    const isActive = !!(await getActiveMembership(c.env.DB, ident.id))
    const amount = Number(isActive ? ev.membership_price : ev.non_membership_price)
    if (!Number.isFinite(amount) || amount <= 0) return c.json({ error:'invalid_amount' },400)
    const currency = c.env.CURRENCY || 'GBP'

    const s = await getSchema(c.env.DB)
    await ensureSchema(c.env.DB, s.fkColumn)
    await migrateToTransactions(c.env.DB)

    const order_ref = `EVT-${evId}-${crypto.randomUUID()}`
    
    // Idempotency check in transactions table
    if (idem){
      const existing = await c.env.DB.prepare(`
        SELECT t.*, ti.id as ticket_id FROM transactions t
        JOIN tickets ti ON ti.id = t.reference_id
        WHERE t.transaction_type = 'ticket' AND t.user_id = ? AND t.idempotency_key = ?
        ORDER BY t.id DESC LIMIT 1
      `).bind(ident.id, idem).first()
      if (existing && existing.checkout_id){
        return c.json({ orderRef: existing.order_ref, checkoutId: existing.checkout_id, reused: true })
      }
    }

    // Insert minimal ticket record (business logic only)
    const tinfo = await c.env.DB.prepare('PRAGMA table_info(tickets)').all().catch(()=>({ results: [] }))
    const tnames = new Set((tinfo?.results||[]).map(r => String(r.name||'').toLowerCase()))
    const hasUser = tnames.has('user_id')
    const hasMember = tnames.has('member_id')
    
    const colParts = ['event_id', 'status']
    const bindVals = [evId, 'pending']
    if (hasUser) { colParts.push('user_id'); bindVals.push(ident.id) }
    if (hasMember) { colParts.push('member_id'); bindVals.push(ident.id) }
    if (tnames.has('created_at')) { colParts.push('created_at'); bindVals.push(toIso(new Date())) }
    
    const placeholders = colParts.map(()=>'?').join(',')
    const ticketResult = await c.env.DB.prepare(`INSERT INTO tickets (${colParts.join(',')}) VALUES (${placeholders}) RETURNING id`).bind(...bindVals).first()
    const ticketId = ticketResult?.id || (await c.env.DB.prepare('SELECT last_insert_rowid() as id').first()).id

    let checkout
    try {
      checkout = await createCheckout(c.env, { amount, currency, orderRef: order_ref, title: ev.event_name, description: `Ticket for ${ev.event_name}` })
    } catch (e) {
      console.error('SumUp checkout failed for event', evId, e)
      return c.json({ error:'sumup_checkout_failed', message:String(e?.message||e) },502)
    }
    if (!checkout.id) {
      console.error('event checkout missing id', checkout)
      return c.json({ error: 'sumup_missing_id' }, 502)
    }
    
    // Store payment details in transactions table
    await c.env.DB.prepare(`
      INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref,
                                checkout_id, amount, currency, payment_status, idempotency_key, consent_at)
      VALUES ('ticket', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(ticketId, ident.id, email, clampStr(name,200), order_ref, checkout.id,
            String(amount), currency, idem || null, toIso(new Date())).run()
    
    return c.json({ orderRef: order_ref, checkoutId: checkout.id })
  } catch (e) {
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    console.error('events checkout error', e)
    return c.json(debugMode ? { error:'internal_error', detail: String(e), stack: String(e?.stack||'') } : { error:'internal_error' },500)
  }
})

// Confirm ticket purchase with payment verification + capacity race guard
app.get('/events/confirm', async c => {
  const orderRef = c.req.query('orderRef')
  if (!orderRef || !EVT_UUID_RE.test(orderRef)) return c.json({ ok:false, error:'invalid_orderRef' },400)
  
  // Get transaction record
  const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "ticket"').bind(orderRef).first()
  if (!transaction) return c.json({ ok:false, error:'order_not_found' },404)
  
  // Get ticket record
  const ticket = await c.env.DB.prepare('SELECT * FROM tickets WHERE id = ?').bind(transaction.reference_id).first()
  if (!ticket) return c.json({ ok:false, error:'ticket_not_found' },404)
  if (ticket.status === 'active') {
    const ev = await c.env.DB.prepare('SELECT event_name, event_datetime FROM events WHERE event_id = ?').bind(ticket.event_id).first()
    return c.json({ 
      ok: true, 
      status: 'already_active',
      eventName: ev?.event_name,
      eventDate: ev?.event_datetime,
      ticketCount: 1,
      amount: transaction.amount,
      currency: transaction.currency || 'GBP'
    })
  }
  
  // Verify payment with SumUp
  let payment
  try { payment = await fetchPayment(c.env, transaction.checkout_id) } 
  catch { return c.json({ ok:false, error:'verify_failed' },400) }
  
  const paid = payment && (payment.status === 'PAID' || payment.status === 'SUCCESSFUL')
  if (!paid) return c.json({ ok:false, status: payment?.status || 'PENDING' })
  
  // Verify amount/currency
  if (payment.amount != Number(transaction.amount) || (transaction.currency && payment.currency !== transaction.currency)) {
    return c.json({ ok:false, error:'payment_mismatch' },400)
  }

  // Get event details
  const ev = await c.env.DB.prepare('SELECT * FROM events WHERE event_id = ?').bind(ticket.event_id).first()
  if (!ev) return c.json({ ok:false, error:'event_not_found' },404)
  
  // Capacity check
  if (ev.capacity && ev.tickets_sold >= ev.capacity) return c.json({ ok:false, error:'sold_out' },409)
  
  // Update ticket and transaction status
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE tickets SET status = "active" WHERE id = ?').bind(ticket.id),
    c.env.DB.prepare('UPDATE transactions SET payment_status = "PAID", payment_id = ?, updated_at = ? WHERE id = ?')
      .bind(payment.id, toIso(new Date()), transaction.id),
    // Increment if not exceeded capacity
    c.env.DB.prepare('UPDATE events SET tickets_sold = tickets_sold + 1 WHERE event_id = ? AND (capacity IS NULL OR tickets_sold < capacity)')
      .bind(ticket.event_id)
  ])
  
  // Send confirmation email
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(transaction.user_id).first()
  if (user) {
    const emailContent = getTicketConfirmationEmail(ev, user, transaction)
    await sendEmail(c.env, { to: user.email, ...emailContent })
  }
  
  return c.json({ 
    ok: true, 
    status: 'active',
    eventName: ev.event_name,
    eventDate: ev.event_datetime,
    ticketCount: 1,
    amount: transaction.amount,
    currency: transaction.currency || 'GBP'
  })
})

// Optional tiny debug endpoint
app.get('/_debug/ping', c => {
  const origin = c.req.header('Origin') || ''
  const allowed = (c.env.ALLOWED_ORIGIN || '').split(',').map(s=>s.trim()).filter(Boolean)
  const allow = allowed.includes(origin) ? origin : (allowed[0] || '')
  return c.json({ ok:true, origin, allow, allowed })
})

// Debug schema inspector
app.get('/_debug/schema', async c => {
  try {
    const s = await getSchema(c.env.DB)
    const memberships = await c.env.DB.prepare('PRAGMA table_info(memberships)').all().catch(()=>({ results: [] }))
    const tickets = await c.env.DB.prepare('PRAGMA table_info(tickets)').all().catch(()=>({ results: [] }))
    const tables = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().catch(()=>({ results: [] }))
    const tnames = new Set((tickets?.results||[]).map(r => String(r.name||'').toLowerCase()))
    const ticketFkCol = tnames.has(s.fkColumn) ? s.fkColumn : (tnames.has('member_id') ? 'member_id' : (tnames.has('user_id') ? 'user_id' : null))
    return c.json({ ok:true, schema: s, ticketFkCol, tables: tables.results||[], memberships: memberships.results||[], tickets: tickets.results||[] })
  } catch (e) {
    return c.json({ ok:false, error: String(e) }, 500)
  }
})

// Debug SumUp OAuth scopes
app.get('/_debug/sumup-scopes', async c => {
  try {
    // Test with payment_instruments scope
    const result = await sumupToken(c.env, 'payments payment_instruments')
    return c.json({ 
      ok: true, 
      requestedScopes: 'payments payment_instruments',
      grantedScopes: result.scope,
      scopesArray: (result.scope || '').split(/\s+/).filter(Boolean),
      hasPaymentInstruments: (result.scope || '').includes('payment_instruments'),
      fullResponse: result
    })
  } catch (e) {
    return c.json({ 
      ok: false, 
      error: String(e.message || e),
      stack: String(e.stack || '')
    }, 500)
  }
})

// === Auto-Renewal Management Endpoints ===

// Get auto-renewal status for a user
app.get('/membership/auto-renewal', async (c) => {
  const email = c.req.query('email')
  if (!email || !EMAIL_RE.test(email)) return c.json({ error: 'invalid_email' }, 400)
  
  const ident = await findIdentityByEmail(c.env.DB, email)
  if (!ident) return c.json({ enabled: false, hasPaymentMethod: false })
  
  const membership = await getActiveMembership(c.env.DB, ident.id)
  if (!membership) return c.json({ enabled: false, hasPaymentMethod: false })
  
  const instrument = await getActivePaymentInstrument(c.env.DB, ident.id)
  
  return c.json({
    enabled: membership.auto_renew === 1,
    hasPaymentMethod: !!instrument,
    paymentMethod: instrument ? {
      cardType: instrument.card_type,
      last4: instrument.last_4,
      expiryMonth: instrument.expiry_month,
      expiryYear: instrument.expiry_year
    } : null,
    membershipEndDate: membership.end_date,
    plan: membership.plan
  })
})

// Toggle auto-renewal on/off
app.post('/membership/auto-renewal/toggle', async (c) => {
  try {
    const { email, enabled } = await c.req.json()
    if (!email || !EMAIL_RE.test(email)) return c.json({ error: 'invalid_email' }, 400)
    if (typeof enabled !== 'boolean') return c.json({ error: 'enabled must be boolean' }, 400)
    
    const ident = await findIdentityByEmail(c.env.DB, email)
    if (!ident) return c.json({ error: 'user_not_found' }, 404)
    
    const membership = await getActiveMembership(c.env.DB, ident.id)
    if (!membership) return c.json({ error: 'no_active_membership' }, 404)
    
    await c.env.DB.prepare('UPDATE memberships SET auto_renew = ? WHERE id = ?')
      .bind(enabled ? 1 : 0, membership.id).run()
    
    return c.json({ ok: true, enabled })
  } catch (e) {
    console.error('Toggle auto-renewal error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Remove saved payment method (disables auto-renewal)
app.post('/membership/payment-method/remove', async (c) => {
  try {
    const { email } = await c.req.json()
    if (!email || !EMAIL_RE.test(email)) return c.json({ error: 'invalid_email' }, 400)
    
    const ident = await findIdentityByEmail(c.env.DB, email)
    if (!ident) return c.json({ error: 'user_not_found' }, 404)
    
    // Deactivate all payment instruments
    await c.env.DB.prepare('UPDATE payment_instruments SET is_active = 0 WHERE user_id = ?')
      .bind(ident.id).run()
    
    // Disable auto-renewal for active memberships
    await c.env.DB.prepare('UPDATE memberships SET auto_renew = 0, payment_instrument_id = NULL WHERE (user_id = ? OR member_id = ?) AND status = "active"')
      .bind(ident.id, ident.id).run()
    
    return c.json({ ok: true })
  } catch (e) {
    console.error('Remove payment method error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Manually retry a failed renewal (useful after user updates payment method)
app.post('/membership/retry-renewal', async (c) => {
  try {
    const { email } = await c.req.json()
    if (!email || !EMAIL_RE.test(email)) return c.json({ error: 'invalid_email' }, 400)
    
    await ensureSchema(c.env.DB, 'user_id')
    
    const ident = await findIdentityByEmail(c.env.DB, email)
    if (!ident) return c.json({ error: 'user_not_found' }, 404)
    
    // Find membership with failed renewal
    const membership = await getActiveMembership(c.env.DB, ident.id)
    if (!membership) return c.json({ error: 'no_active_membership' }, 404)
    
    if (!membership.auto_renew) {
      return c.json({ error: 'auto_renew_disabled', message: 'Auto-renewal is not enabled for this membership' }, 400)
    }
    
    if (!membership.renewal_failed_at && membership.renewal_attempts === 0) {
      return c.json({ error: 'no_failed_renewal', message: 'No failed renewal attempts found' }, 400)
    }
    
    console.log(`Manual retry for membership ${membership.id}`)
    
    // Reset attempts and try renewal
    await c.env.DB.prepare('UPDATE memberships SET renewal_attempts = 0 WHERE id = ?').bind(membership.id).run()
    const result = await processMembershipRenewal(c.env.DB, membership, c.env)
    
    return c.json({ 
      ok: true, 
      success: result.success,
      message: result.success ? 'Renewal successful' : 'Renewal failed',
      details: result
    })
  } catch (e) {
    console.error('Manual renewal retry error:', e)
    return c.json({ error: 'internal_error', details: String(e) }, 500)
  }
})

// Test endpoint to manually trigger renewal for a specific user
app.get('/test/renew-user', async (c) => {
  const email = c.req.query('email')
  if (!email) return c.json({ error: 'email required' }, 400)
  
  try {
    await ensureSchema(c.env.DB, 'user_id')
    
    const ident = await findIdentityByEmail(c.env.DB, email)
    if (!ident) return c.json({ error: 'user_not_found' }, 404)
    
    // Check schema for correct column name
    const mc = await c.env.DB.prepare('PRAGMA table_info(memberships)').all()
    const mnames = new Set((mc?.results||[]).map(r => String(r.name||'').toLowerCase()))
    
    let where, binds
    if (mnames.has('user_id') && mnames.has('member_id')) {
      where = '(user_id = ? OR member_id = ?)'
      binds = [ident.id, ident.id]
    } else if (mnames.has('user_id')) {
      where = 'user_id = ?'
      binds = [ident.id]
    } else {
      where = 'member_id = ?'
      binds = [ident.id]
    }
    
    // Find active membership with auto-renewal
    const membership = await c.env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE ${where}
        AND status = 'active' 
        AND auto_renew = 1
      LIMIT 1
    `).bind(...binds).first()
    
    if (!membership) {
      return c.json({ error: 'no_auto_renew_membership' }, 404)
    }
    
    console.log('Manually triggering renewal for membership:', membership.id)
    const result = await processMembershipRenewal(c.env.DB, membership, c.env)
    
    return c.json({ 
      success: result.success, 
      membership_id: membership.id,
      result 
    })
  } catch (e) {
    console.error('Manual renewal test error:', e)
    return c.json({ error: String(e), stack: String(e.stack || '') }, 500)
  }
})

// ============================================================================
// PRODUCT & SHOP API ENDPOINTS
// ============================================================================

// Get all active products (public)
app.get('/products', async (c) => {
  try {
    await ensureSchema(c.env.DB, 'user_id')
    
    const products = await c.env.DB.prepare(`
      SELECT id, name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, is_active, created_at
      FROM products
      WHERE is_active = 1
      ORDER BY name ASC
    `).all()
    
    return c.json(products.results || [])
  } catch (e) {
    console.error('Get products error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Get single product by ID or slug (public)
app.get('/products/:id', async (c) => {
  try {
    await ensureSchema(c.env.DB, 'user_id')
    const id = c.req.param('id')
    
    // Try to find by ID first, then by slug
    let product
    if (/^\d+$/.test(id)) {
      product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').bind(id).first()
    }
    
    if (!product) {
      product = await c.env.DB.prepare('SELECT * FROM products WHERE slug = ? AND is_active = 1').bind(id).first()
    }
    
    if (!product) {
      return c.json({ error: 'product_not_found' }, 404)
    }
    
    return c.json(product)
  } catch (e) {
    console.error('Get product error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Create new product (admin only - TODO: add authentication)
app.post('/admin/products', requireAdmin, async (c) => {
  try {
    await ensureSchema(c.env.DB, 'user_id')
    
    const { name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category } = await c.req.json()
    
    if (!name || !slug || price === undefined) {
      return c.json({ error: 'missing_required_fields' }, 400)
    }
    
    const now = toIso(new Date())
    const result = await c.env.DB.prepare(`
      INSERT INTO products (name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name, 
      slug, 
      description || null,
      summary || null, 
      full_description || null,
      price, 
      currency || 'GBP', 
      stock_quantity || 0, 
      image_url || null, 
      category || null,
      now,
      now
    ).run()
    
    return c.json({ success: true, product_id: result.meta.last_row_id })
  } catch (e) {
    console.error('Create product error:', e)
    if (e.message?.includes('UNIQUE constraint')) {
      return c.json({ error: 'slug_already_exists' }, 400)
    }
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Update product (admin only)
app.put('/admin/products/:id', requireAdmin, async (c) => {
  try {
    await ensureSchema(c.env.DB, 'user_id')
    
    const id = c.req.param('id')
    const { name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, is_active } = await c.req.json()
    
    const updates = []
    const binds = []
    
    if (name !== undefined) { updates.push('name = ?'); binds.push(name) }
    if (slug !== undefined) { updates.push('slug = ?'); binds.push(slug) }
    if (description !== undefined) { updates.push('description = ?'); binds.push(description) }
    if (summary !== undefined) { updates.push('summary = ?'); binds.push(summary) }
    if (full_description !== undefined) { updates.push('full_description = ?'); binds.push(full_description) }
    if (price !== undefined) { updates.push('price = ?'); binds.push(price) }
    if (currency !== undefined) { updates.push('currency = ?'); binds.push(currency) }
    if (stock_quantity !== undefined) { updates.push('stock_quantity = ?'); binds.push(stock_quantity) }
    if (image_url !== undefined) { updates.push('image_url = ?'); binds.push(image_url) }
    if (category !== undefined) { updates.push('category = ?'); binds.push(category) }
    if (is_active !== undefined) { updates.push('is_active = ?'); binds.push(is_active ? 1 : 0) }
    
    // Handle image update - delete old image if new one provided and different
    if (image_url !== undefined) {
      // Get current product to find old image
      const currentProduct = await c.env.DB.prepare('SELECT image_url FROM products WHERE id = ?')
        .bind(id).first()
      
      if (currentProduct && currentProduct.image_url && currentProduct.image_url !== image_url) {
        const oldKey = extractImageKey(currentProduct.image_url)
        if (oldKey && c.env.IMAGES) {
          try {
            await c.env.IMAGES.delete(oldKey)
            console.log('Deleted old image:', oldKey)
          } catch (err) {
            console.error('Failed to delete old image:', err)
          }
        }
      }
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'no_fields_to_update' }, 400)
    }
    
    updates.push('updated_at = ?')
    binds.push(toIso(new Date()))
    binds.push(id)
    
    await c.env.DB.prepare(`
      UPDATE products SET ${updates.join(', ')} WHERE id = ?
    `).bind(...binds).run()
    
    return c.json({ success: true })
  } catch (e) {
    console.error('Update product error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Delete product (admin only - soft delete by setting is_active = 0)
app.delete('/admin/products/:id', requireAdmin, async (c) => {
  try {
    await ensureSchema(c.env.DB, 'user_id')
    
    const id = c.req.param('id')
    
    // Get product to find image
    const product = await c.env.DB.prepare('SELECT image_url FROM products WHERE id = ?')
      .bind(id).first()
    
    // Delete image from R2
    if (product && product.image_url) {
      const imageKey = extractImageKey(product.image_url)
      if (imageKey && c.env.IMAGES) {
        try {
          await c.env.IMAGES.delete(imageKey)
        } catch (err) {
          console.error('Failed to delete image:', err)
        }
      }
    }
    
    await c.env.DB.prepare('UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?')
      .bind(toIso(new Date()), id)
      .run()
    
    return c.json({ success: true })
  } catch (e) {
    console.error('Delete product error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Get all orders (admin only)
app.get('/admin/orders', async (c) => {
  try {
    await ensureSchema(c.env.DB, 'user_id')
    
    const adminKey = c.req.header('X-Admin-Key')
    if (adminKey !== c.env.ADMIN_KEY) {
      return c.json({ error: 'unauthorized' }, 401)
    }
    
    const orders = await c.env.DB.prepare(`
      SELECT * FROM orders 
      ORDER BY created_at DESC
      LIMIT 100
    `).all()
    
    return c.json(orders.results || [])
  } catch (e) {
    console.error('Get orders error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Get order details with items (admin only or order owner)
app.get('/orders/:orderNumber', async (c) => {
  try {
    await ensureSchema(c.env.DB, 'user_id')
    
    const orderNumber = c.req.param('orderNumber')
    const email = c.req.query('email')
    
    const order = await c.env.DB.prepare('SELECT * FROM orders WHERE order_number = ?')
      .bind(orderNumber)
      .first()
    
    if (!order) {
      return c.json({ error: 'order_not_found' }, 404)
    }
    
    // Check authorization (admin or order owner)
    const adminKey = c.req.header('X-Admin-Key')
    if (adminKey !== c.env.ADMIN_KEY && order.email !== email) {
      return c.json({ error: 'unauthorized' }, 401)
    }
    
    // Get order items
    const items = await c.env.DB.prepare('SELECT * FROM order_items WHERE order_id = ?')
      .bind(order.id)
      .all()
    
    return c.json({
      ...order,
      items: items.results || []
    })
  } catch (e) {
    console.error('Get order error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// ============================================================================
// SHOP CHECKOUT ENDPOINT
// ============================================================================

// Create order and SumUp checkout for shop purchases
app.post('/shop/checkout', async (c) => {
  try {
    await ensureSchema(c.env.DB, 'user_id')
    
    const { email, name, items, shipping_address, delivery_method, notes, consent_at } = await c.req.json()
    
    if (!email || !name || !items || items.length === 0 || !consent_at) {
      return c.json({ error: 'missing_required_fields' }, 400)
    }

    if (!delivery_method || !['collection', 'delivery'].includes(delivery_method)) {
      return c.json({ error: 'invalid_delivery_method' }, 400)
    }

    // Validate shipping address if delivery is selected
    if (delivery_method === 'delivery' && !shipping_address) {
      return c.json({ error: 'shipping_address_required_for_delivery' }, 400)
    }
    
    if (!EMAIL_RE.test(email)) {
      return c.json({ error: 'invalid_email' }, 400)
    }
    
    // Fetch product details and calculate total
    let subtotal = 0
    const orderItems = []
    
    for (const item of items) {
      const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1')
        .bind(item.product_id)
        .first()
      
      if (!product) {
        return c.json({ error: `product_not_found: ${item.product_id}` }, 400)
      }
      
      if (product.stock_quantity < item.quantity) {
        return c.json({ error: `insufficient_stock: ${product.name}` }, 400)
      }
      
      const itemSubtotal = product.price * item.quantity
      subtotal += itemSubtotal
      
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal: itemSubtotal
      })
    }
    
    // Calculate shipping: £4 for delivery, £0 for collection
    const shipping = delivery_method === 'delivery' ? 400 : 0 // £4.00 in pence
    const tax = 0 // No VAT in Gibraltar
    const total = subtotal + shipping + tax
    
    // Generate unique order number
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase()
    
    // Create order in database (without checkout_id initially)
    const now = toIso(new Date())
    const orderResult = await c.env.DB.prepare(`
      INSERT INTO orders (
        order_number, email, name, status, 
        subtotal, tax, shipping, total, currency,
        payment_status,
        shipping_address, billing_address, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderNumber, email, name, 'pending',
      subtotal, tax, shipping, total, 'GBP',
      'pending',
      shipping_address ? JSON.stringify(shipping_address) : null,
      shipping_address ? JSON.stringify(shipping_address) : null,
      notes || null,
      now, now
    ).run()
    
    const orderId = orderResult.meta.last_row_id
    
    // Insert order items
    for (const item of orderItems) {
      await c.env.DB.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        orderId,
        item.product_id,
        item.product_name,
        item.quantity,
        item.unit_price,
        item.subtotal
      ).run()
    }
    
    // Create SumUp checkout
    let checkout
    try {
      checkout = await createCheckout(c.env, {
        amount: total / 100, // Convert pence to pounds
        currency: 'GBP',
        orderRef: orderNumber,
        title: `Order ${orderNumber}`,
        description: `Shop order - ${orderItems.length} item(s)`
      })
    } catch (err) {
      console.error('SumUp checkout error:', err)
      return c.json({ error: 'sumup_checkout_failed', message: String(err?.message || err) }, 502)
    }
    
    if (!checkout.id) {
      console.error('SumUp checkout missing id', checkout)
      return c.json({ error: 'sumup_missing_id' }, 502)
    }
    
    // Update order with checkout_id
    await c.env.DB.prepare('UPDATE orders SET checkout_id = ? WHERE id = ?')
      .bind(checkout.id, orderId)
      .run()
    
    // Return checkoutId for widget (same pattern as membership checkout)
    return c.json({
      success: true,
      order_number: orderNumber,
      checkoutId: checkout.id
    })
    
  } catch (e) {
    console.error('Shop checkout error:', e)
    return c.json({ error: 'internal_error', details: String(e) }, 500)
  }
})

// Webhook endpoint for SumUp payment notifications
app.post('/webhooks/sumup/shop-payment', async (c) => {
  try {
    const payload = await c.req.json()
    console.log('SumUp shop payment webhook:', JSON.stringify(payload))
    
    // Extract checkout reference (order number)
    const checkoutReference = payload.checkout_reference || payload.id
    
    if (!checkoutReference) {
      return c.json({ error: 'missing_checkout_reference' }, 400)
    }
    
    // Find order by checkout reference
    const order = await c.env.DB.prepare(
      'SELECT * FROM orders WHERE order_number = ? OR checkout_id = ?'
    ).bind(checkoutReference, checkoutReference).first()
    
    if (!order) {
      console.error('Order not found for checkout reference:', checkoutReference)
      return c.json({ error: 'order_not_found' }, 404)
    }
    
    // Only process if payment is successful
    if (payload.status === 'PAID' || payload.status === 'paid') {
      await processShopOrderPayment(c.env.DB, order.id, payload.id, c.env)
    }
    
    return c.json({ success: true })
  } catch (e) {
    console.error('Shop payment webhook error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Manual payment confirmation endpoint (called from order confirmation page)
app.post('/shop/confirm-payment/:orderNumber', async (c) => {
  try {
    const orderNumber = c.req.param('orderNumber')
    
    // Find order
    const order = await c.env.DB.prepare(
      'SELECT * FROM orders WHERE order_number = ?'
    ).bind(orderNumber).first()
    
    if (!order) {
      return c.json({ error: 'order_not_found' }, 404)
    }
    
    // If already completed, return success
    if (order.status === 'completed') {
      return c.json({ success: true, status: 'completed', order })
    }
    
    // Check payment status with SumUp (using checkout_reference which is the order_number)
    try {
      const { access_token } = await sumupToken(c.env, 'payments')
      
      // Try to find the checkout by order number (checkout_reference)
      const checkoutsRes = await fetch(
        `https://api.sumup.com/v0.1/checkouts?checkout_reference=${orderNumber}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      
      if (checkoutsRes.ok) {
        const checkouts = await checkoutsRes.json()
        const checkout = checkouts.find(c => c.checkout_reference === orderNumber)
        
        if (checkout && (checkout.status === 'PAID' || checkout.status === 'paid')) {
          // Payment confirmed! Process the order
          await processShopOrderPayment(c.env.DB, order.id, checkout.id, c.env)
          
          // Fetch updated order
          const updatedOrder = await c.env.DB.prepare(
            'SELECT * FROM orders WHERE id = ?'
          ).bind(order.id).first()
          
          return c.json({ success: true, status: 'completed', order: updatedOrder })
        }
      }
    } catch (e) {
      console.error('Error checking payment status:', e)
    }
    
    // Payment not yet confirmed
    return c.json({ success: true, status: 'pending', order })
  } catch (e) {
    console.error('Confirm payment error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Helper function to process shop order payment and reduce stock
async function processShopOrderPayment(db, orderId, checkoutId, env) {
  const now = toIso(new Date())
  
  // Update order status
  await db.prepare(`
    UPDATE orders 
    SET status = 'completed', 
        payment_status = 'paid',
        checkout_id = ?,
        completed_at = ?,
        updated_at = ?
    WHERE id = ?
  `).bind(checkoutId, now, now, orderId).run()
  
  // Get order items
  const items = await db.prepare(
    'SELECT * FROM order_items WHERE order_id = ?'
  ).bind(orderId).all()
  
  // Reduce stock for each item
  for (const item of items.results || []) {
    await db.prepare(`
      UPDATE products 
      SET stock_quantity = CASE 
        WHEN stock_quantity >= ? THEN stock_quantity - ?
        ELSE 0
      END,
      updated_at = ?
      WHERE id = ?
    `).bind(item.quantity, item.quantity, now, item.product_id).run()
    
    console.log(`Reduced stock for product ${item.product_id} by ${item.quantity}`)
  }
  
  console.log(`Order ${orderId} completed, stock reduced`)
  
  // Get full order details with items for email
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first()
  
  if (order && order.email) {
    try {
      const emailContent = generateShopOrderEmail(order, items.results || [])
      await sendEmail(env, { to: order.email, ...emailContent })
      console.log(`Order confirmation email sent to ${order.email}`)
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError)
      // Don't fail the entire operation if email fails
    }
  }
}

// Generate shop order confirmation email with invoice
function generateShopOrderEmail(order, items) {
  const formatPrice = (pence) => `£${(pence / 100).toFixed(2)}`
  const orderDate = new Date(order.created_at).toLocaleDateString('en-GB', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  })
  
  const deliveryMethod = order.shipping_address ? 'Local Delivery' : 'Collection'
  const shippingCost = order.shipping || 0
  
  // Parse shipping address if available
  let shippingAddress = ''
  if (order.shipping_address) {
    try {
      const addr = typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address
      shippingAddress = `
        <p style="margin: 0.25rem 0; color: #4b5563;">
          ${addr.line1}<br>
          ${addr.line2 ? addr.line2 + '<br>' : ''}
          ${addr.city}, ${addr.postcode}<br>
          ${addr.country}
        </p>
      `
    } catch (e) {
      console.error('Error parsing shipping address:', e)
    }
  }
  
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">
        <strong style="color: #1f2937;">${item.product_name}</strong>
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563;">
        ${item.quantity}
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">
        ${formatPrice(item.unit_price)}
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937; font-weight: 600;">
        ${formatPrice(item.subtotal)}
      </td>
    </tr>
  `).join('')
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${order.order_number}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 2rem 1rem;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 2.5rem 2rem; text-align: center;">
              <h1 style="margin: 0 0 0.5rem; color: #ffffff; font-size: 1.75rem; font-weight: 700;">
                Order Confirmed!
              </h1>
              <p style="margin: 0; color: #dbeafe; font-size: 0.95rem;">
                Thank you for your purchase from Dice Bastion Shop
              </p>
            </td>
          </tr>
          
          <!-- Order Details -->
          <tr>
            <td style="padding: 2rem;">
              <p style="margin: 0 0 1.5rem; color: #4b5563; font-size: 1rem;">
                Hi <strong>${order.name}</strong>,
              </p>
              <p style="margin: 0 0 1.5rem; color: #4b5563; font-size: 1rem;">
                Your order has been confirmed and ${deliveryMethod === 'Collection' ? 'is being prepared for collection' : 'will be delivered soon'}. 
                Below is your order invoice for your records.
              </p>
              
              <!-- Invoice Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 2rem;">
                <tr>
                  <td style="padding: 1.5rem;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 1rem;">
                          <p style="margin: 0; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
                            Invoice
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="vertical-align: top;">
                          <p style="margin: 0 0 0.5rem; color: #9ca3af; font-size: 0.875rem;">Order Number</p>
                          <p style="margin: 0 0 1rem; color: #1f2937; font-size: 1.125rem; font-weight: 700; font-family: 'Courier New', monospace;">
                            ${order.order_number}
                          </p>
                          <p style="margin: 0 0 0.5rem; color: #9ca3af; font-size: 0.875rem;">Order Date</p>
                          <p style="margin: 0; color: #4b5563; font-weight: 600;">
                            ${orderDate}
                          </p>
                        </td>
                        <td width="50%" style="vertical-align: top; text-align: right;">
                          <p style="margin: 0 0 0.5rem; color: #9ca3af; font-size: 0.875rem;">Bill To</p>
                          <p style="margin: 0 0 0.25rem; color: #1f2937; font-weight: 600;">${order.name}</p>
                          <p style="margin: 0; color: #4b5563; font-size: 0.875rem;">${order.email}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Items Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 1.5rem;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 1rem; text-align: left; font-weight: 600; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">
                      Item
                    </th>
                    <th style="padding: 1rem; text-align: center; font-weight: 600; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">
                      Qty
                    </th>
                    <th style="padding: 1rem; text-align: right; font-weight: 600; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">
                      Price
                    </th>
                    <th style="padding: 1rem; text-align: right; font-weight: 600; color: #6b7280; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb;">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 2rem;">
                <tr>
                  <td width="60%"></td>
                  <td width="40%">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0.5rem 0; color: #4b5563;">Subtotal:</td>
                        <td style="padding: 0.5rem 0; text-align: right; color: #1f2937; font-weight: 600;">
                          ${formatPrice(order.subtotal)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0.5rem 0; color: #4b5563;">Shipping:</td>
                        <td style="padding: 0.5rem 0; text-align: right; color: #1f2937; font-weight: 600;">
                          ${shippingCost > 0 ? formatPrice(shippingCost) : 'FREE'}
                        </td>
                      </tr>
                      <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="padding: 1rem 0 0; color: #1f2937; font-size: 1.125rem; font-weight: 700;">
                          Total:
                        </td>
                        <td style="padding: 1rem 0 0; text-align: right; color: #2563eb; font-size: 1.25rem; font-weight: 700;">
                          ${formatPrice(order.total)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Delivery Information -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 6px; padding: 1.5rem; margin-bottom: 2rem;">
                <tr>
                  <td>
                    <p style="margin: 0 0 0.75rem; color: #1e40af; font-weight: 700; font-size: 1rem;">
                      ${deliveryMethod === 'Collection' ? '📦 Collection Information' : '🚚 Delivery Information'}
                    </p>
                    ${deliveryMethod === 'Collection' ? `
                      <p style="margin: 0 0 0.5rem; color: #1e3a8a; font-weight: 600;">
                        Gibraltar Warhammer Club
                      </p>
                      <p style="margin: 0 0 0.5rem; color: #3b82f6;">
                        <a href="https://maps.app.goo.gl/xRVr1Jq58ANZ9DLY6" style="color: #2563eb; text-decoration: none;">
                          View Location on Map →
                        </a>
                      </p>
                      <p style="margin: 0 0 0.5rem; color: #4b5563;">
                        <strong>Collection Hours:</strong><br>
                        Thursdays: 6pm - 10pm<br>
                        Saturdays: 2pm - 8pm
                      </p>
                      <p style="margin: 0.75rem 0 0; color: #6b7280; font-size: 0.875rem;">
                        We'll email you within 24 hours when your order is ready for collection.
                      </p>
                    ` : `
                      <p style="margin: 0 0 0.5rem; color: #1e3a8a; font-weight: 600;">
                        Delivery Address:
                      </p>
                      ${shippingAddress}
                      <p style="margin: 0.75rem 0 0; color: #6b7280; font-size: 0.875rem;">
                        Expected delivery: 2-3 business days
                      </p>
                    `}
                  </td>
                </tr>
              </table>
              
              ${order.notes ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1rem; margin-bottom: 2rem;">
                <tr>
                  <td>
                    <p style="margin: 0 0 0.5rem; color: #6b7280; font-size: 0.875rem; font-weight: 600;">
                      Order Notes:
                    </p>
                    <p style="margin: 0; color: #4b5563; font-size: 0.9rem;">
                      ${order.notes}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 0 0 1rem; color: #4b5563; font-size: 0.95rem;">
                If you have any questions about your order, please reply to this email or contact us at 
                <a href="mailto:support@dicebastion.com" style="color: #2563eb; text-decoration: none;">support@dicebastion.com</a>
              </p>
              
              <p style="margin: 0; color: #4b5563; font-size: 0.95rem;">
                Thank you for supporting your local gaming community!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 1.5rem 2rem; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 0.5rem; color: #6b7280; font-size: 0.875rem;">
                <strong>Dice Bastion Shop</strong>
              </p>
              <p style="margin: 0 0 1rem; color: #9ca3af; font-size: 0.8rem;">
                Gibraltar's Premier Gaming Store
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 0.75rem;">
                <a href="https://shop.dicebastion.com" style="color: #2563eb; text-decoration: none; margin: 0 0.5rem;">Shop</a> |
                <a href="https://dicebastion.com" style="color: #2563eb; text-decoration: none; margin: 0 0.5rem;">Main Site</a> |
                <a href="https://dicebastion.com/privacy-policy" style="color: #2563eb; text-decoration: none; margin: 0 0.5rem;">Privacy Policy</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
  
  const text = `
Order Confirmation - ${order.order_number}

Hi ${order.name},

Thank you for your order! Your order has been confirmed and ${deliveryMethod === 'Collection' ? 'is being prepared for collection' : 'will be delivered soon'}.

ORDER DETAILS
Order Number: ${order.order_number}
Order Date: ${orderDate}
Payment Status: Paid

ITEMS ORDERED
${items.map(item => `${item.product_name} x ${item.quantity} - ${formatPrice(item.subtotal)}`).join('\n')}

SUMMARY
Subtotal: ${formatPrice(order.subtotal)}
Shipping: ${shippingCost > 0 ? formatPrice(shippingCost) : 'FREE'}
Total: ${formatPrice(order.total)}

${deliveryMethod === 'Collection' ? `
COLLECTION INFORMATION
Location: Gibraltar Warhammer Club
View on map: https://maps.app.goo.gl/xRVr1Jq58ANZ9DLY6
Collection Hours:
- Thursdays: 6pm - 10pm
- Saturdays: 2pm - 8pm

We'll email you within 24 hours when your order is ready for collection.
` : `
DELIVERY INFORMATION
Your order will be delivered to the address provided within 2-3 business days.
`}

${order.notes ? `Order Notes: ${order.notes}\n` : ''}

If you have any questions, please contact us at support@dicebastion.com

Thank you for supporting your local gaming community!

Dice Bastion Shop
https://shop.dicebastion.com
  `.trim()
  
  return {
    subject: `Order Confirmation - ${order.order_number}`,
    html,
    text
  }
}

// Cron trigger for processing renewals and warnings (runs daily at 2 AM UTC)
async function handleScheduled(event, env, ctx) {
  console.log('Starting membership cron job: renewals + pre-renewal warnings')
  
  try {
    await ensureSchema(env.DB, 'user_id')
    
    const now = new Date()
    const sevenDaysFromNow = toIso(addMonths(now, 0.23)) // ~7 days
    const twoDaysFromNow = toIso(addMonths(now, 0.067)) // ~2 days
    const nowIso = toIso(now)
    
    // 1. Find memberships expiring in 7 days or less (ready for renewal)
    const expiringMemberships = await env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE status = 'active' 
        AND auto_renew = 1 
        AND end_date <= ? 
        AND end_date >= ?
        AND (renewal_attempts IS NULL OR renewal_attempts < 3)
      ORDER BY end_date ASC
    `).bind(sevenDaysFromNow, nowIso).all()
    
    console.log(`Found ${expiringMemberships.results?.length || 0} memberships to renew`)
    
    // 2. Find memberships expiring in ~2 days (send warning email)
    const upcomingRenewals = await env.DB.prepare(`
      SELECT m.*, u.user_id, u.email, u.name
      FROM memberships m
      JOIN users u ON (m.user_id = u.user_id OR m.member_id = u.user_id)
      WHERE m.status = 'active' 
        AND m.auto_renew = 1 
        AND m.end_date <= ?
        AND m.end_date > ?
        AND (m.renewal_warning_sent IS NULL OR m.renewal_warning_sent = 0)
      ORDER BY m.end_date ASC
    `).bind(twoDaysFromNow, nowIso).all()
    
    console.log(`Found ${upcomingRenewals.results?.length || 0} memberships needing pre-renewal warning`)
    
    const renewalResults = []
    const warningResults = []
    
    // Process renewals
    for (const membership of (expiringMemberships.results || [])) {
      console.log(`Processing renewal for membership ${membership.id}`)
      const result = await processMembershipRenewal(env.DB, membership, env)
      renewalResults.push({ membershipId: membership.id, ...result })
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Send pre-renewal warnings
    for (const row of (upcomingRenewals.results || [])) {
      try {
        const daysUntil = Math.ceil((new Date(row.end_date) - now) / (1000 * 60 * 60 * 24))
        console.log(`Sending pre-renewal warning for membership ${row.id} (${daysUntil} days until renewal)`)
        
        // Get payment instrument last 4 digits
        let last4 = null
        if (row.payment_instrument_id) {
          const instrument = await env.DB.prepare('SELECT last_4 FROM payment_instruments WHERE instrument_id = ?')
            .bind(row.payment_instrument_id).first()
          last4 = instrument?.last_4
        }
        
        const membership = { ...row, payment_instrument_last_4: last4 }
        const user = { user_id: row.user_id, email: row.email, name: row.name }
        const emailContent = getUpcomingRenewalEmail(membership, user, daysUntil)
        
        await sendEmail(env, { to: user.email, ...emailContent })
        
        // Mark warning as sent
        await env.DB.prepare('UPDATE memberships SET renewal_warning_sent = 1 WHERE id = ?')
          .bind(row.id).run()
        
        warningResults.push({ membershipId: row.id, success: true, daysUntil })
      } catch (e) {
        console.error(`Pre-renewal warning failed for membership ${row.id}:`, e)
        warningResults.push({ membershipId: row.id, success: false, error: String(e) })
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('Cron job completed', { 
      renewals: { processed: renewalResults.length, successful: renewalResults.filter(r => r.success).length },
      warnings: { sent: warningResults.length, successful: warningResults.filter(r => r.success).length }
    })
    
    return { 
      success: true, 
      renewals: renewalResults, 
      warnings: warningResults 
    }
  } catch (e) {
    console.error('Cron job error:', e)
    return { success: false, error: String(e) }
  }
}

// Debug endpoint
app.get('/debug/auth', (c) => {
  const adminKey = c.req.header('X-Admin-Key')
  const envKey = c.env.ADMIN_KEY
  return c.json({ 
    receivedKey: adminKey, 
    hasEnvKey: !!envKey,
    match: adminKey === envKey,
    envKeyLength: envKey?.length
  })
})

// ===== ADMIN AUTHENTICATION ENDPOINTS =====

// Helper: Generate secure session token
function generateSessionToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Helper: Verify admin session
async function verifyAdminSession(db, sessionToken) {
  if (!sessionToken) return null
  
  const now = toIso(new Date())
  const session = await db.prepare(`
    SELECT s.*, u.email, u.name, u.is_admin, u.is_active
    FROM user_sessions s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.session_token = ? AND s.expires_at > ? AND u.is_active = 1 AND u.is_admin = 1
  `).bind(sessionToken, now).first()
  
  return session
}

// Admin Login
app.post('/admin/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'email_and_password_required' }, 400)
    }
    
    // Find user
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).bind(email.toLowerCase()).first()
    
    if (!user) {
      return c.json({ error: 'invalid_credentials' }, 401)
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return c.json({ error: 'invalid_credentials' }, 401)
    }
    
    // Check admin role
    if (!user.is_admin) {
      return c.json({ error: 'insufficient_permissions' }, 403)
    }
    
    // Create session (expires in 7 days)
    const sessionToken = generateSessionToken()
    const expiresAt = toIso(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    const now = toIso(new Date())
    
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(user.user_id, sessionToken, expiresAt, now).run()
    
    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login_at = ? WHERE user_id = ?'
    ).bind(now, user.user_id).run()
    
    return c.json({
      success: true,
      session_token: sessionToken,
      expires_at: expiresAt,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name
      }
    })
  } catch (err) {
    console.error('Admin login error:', err)
    return c.json({ error: 'login_failed' }, 500)
  }
})

// Admin Logout
app.post('/admin/logout', async (c) => {
  const sessionToken = c.req.header('X-Session-Token')
  
  if (sessionToken) {
    await c.env.DB.prepare(
      'DELETE FROM user_sessions WHERE session_token = ?'
    ).bind(sessionToken).run()
  }
  
  return c.json({ success: true })
})

// Verify Admin Session
app.get('/admin/verify', async (c) => {
  const sessionToken = c.req.header('X-Session-Token')
  const session = await verifyAdminSession(c.env.DB, sessionToken)
  
  if (!session) {
    return c.json({ error: 'invalid_session' }, 401)
  }
  
  return c.json({
    valid: true,
    user: {
      id: session.user_id,
      email: session.email,
      name: session.name
    }
  })
})

// Middleware: Require admin session
async function requireAdminSession(c, next) {
  const sessionToken = c.req.header('X-Session-Token')
  const session = await verifyAdminSession(c.env.DB, sessionToken)
  
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  
  c.set('adminUser', { id: session.user_id, email: session.email, name: session.name })
  await next()
}

// Update existing admin endpoints to use session-based auth OR fallback to admin key
async function requireAdmin(c, next) {
  // Try session-based auth first
  const sessionToken = c.req.header('X-Session-Token')
  if (sessionToken) {
    const session = await verifyAdminSession(c.env.DB, sessionToken)
    if (session) {
      c.set('adminUser', { id: session.user_id, email: session.email, name: session.name })
      return await next()
    }
  }
  
  // Fallback to legacy admin key (for backward compatibility)
  const adminKey = c.req.header('X-Admin-Key')
  if (adminKey && adminKey === c.env.ADMIN_KEY) {
    c.set('adminUser', { legacy: true })
    return await next()
  }
  
  return c.json({ error: 'unauthorized' }, 401)
}

// ============================================================================
// Image Management (R2)
// ============================================================================

// Helper: Extract old image filename from URL
function extractImageKey(imageUrl) {
  if (!imageUrl || imageUrl.startsWith('data:')) return null
  try {
    const url = new URL(imageUrl)
    // Extract path after domain
    const path = url.pathname
    // Remove leading slash and 'images/' prefix if present
    return path.replace(/^\//, '').replace(/^images\//, '')
  } catch {
    return null
  }
}

// Upload image to R2
app.post('/admin/images', requireAdmin, async (c) => {
  try {
    const { image, filename } = await c.req.json()
    
    if (!image) {
      return c.json({ error: 'image_required' }, 400)
    }
    
    // Extract base64 data
    let base64Data = image
    if (image.startsWith('data:')) {
      base64Data = image.split(',')[1]
    }
    
    // Convert base64 to binary
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = filename ? filename.split('.').pop() : 'jpg'
    const key = `${timestamp}-${randomStr}.${ext}`
    
    // Upload to R2
    await c.env.IMAGES.put(key, bytes, {
      httpMetadata: {
        contentType: 'image/jpeg',
      },
    })
    
    // Return public URL
    const imageUrl = `https://pub-631ca6f207ca4661ac9cb2ba9371ba31.r2.dev/${key}`
    
    return c.json({ 
      success: true, 
      url: imageUrl,
      key: key
    })
  } catch (err) {
    console.error('Image upload error:', err)
    return c.json({ error: 'upload_failed' }, 500)
  }
})

// Delete image from R2
app.delete('/admin/images/:key', requireAdmin, async (c) => {
  try {
    const key = c.req.param('key')
    await c.env.IMAGES.delete(key)
    return c.json({ success: true })
  } catch (err) {
    console.error('Image delete error:', err)
    return c.json({ error: 'delete_failed' }, 500)
  }
})

export default {
  fetch: app.fetch,
  scheduled: handleScheduled
}
