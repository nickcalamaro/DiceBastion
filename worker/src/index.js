import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { createHmac } from 'crypto'
import { calculateNextOccurrence } from './utils/recurring.js'
import { getEventReminderEmail, shouldSendEventReminder } from './email-templates/event-reminder.js'
import {
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  getUserEmailPreferences,
  updateUserEmailPreferences,
  validateEmailPreferencesSession,
  checkEmailVerificationRateLimit,
  generateVerificationLink
} from './auth-utils.js'
import {
  createCheckout,
  getOrCreateSumUpCustomer,
  fetchPayment,
  savePaymentInstrument,
  chargePaymentInstrument,
  verifyWebhook
} from './payments-client.js'

// Replace generic cors with strict configurable CORS + debug logging
const app = new Hono()
app.use('*', async (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGIN || '').split(',').map(s=>s.trim()).filter(Boolean)
  const origin = c.req.header('Origin')
  const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
  
  // Allow 'null' origin for local file testing (file:// protocol)
  let allowOrigin = ''
  if (origin === 'null' && c.env.ALLOW_LOCAL_TESTING === 'true') {
    allowOrigin = '*'  // Allow any origin for local testing
  } else if (origin && allowed.includes(origin)) {
    allowOrigin = origin
  }
  
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

// Rate limiting storage (in-memory for this worker instance)
const checkoutRateLimits = new Map()
const membershipCheckoutRateLimits = new Map()
const eventCheckoutRateLimits = new Map()

// Rate limiting helper function
function checkRateLimit(ip, rateLimitMap, limit, windowMinutes) {
  const now = Date.now()
  const windowMs = windowMinutes * 60 * 1000
  
  if (rateLimitMap.has(ip)) {
    const [timestamp, count] = rateLimitMap.get(ip)
    
    // Reset count if outside the time window
    if (now - timestamp > windowMs) {
      rateLimitMap.set(ip, [now, 1])
      return true
    }
    
    // Check if limit exceeded
    if (count >= limit) {
      return false
    }
    
    // Increment count
    rateLimitMap.set(ip, [timestamp, count + 1])
    return true
  }
  
  // First request from this IP
  rateLimitMap.set(ip, [now, 1])
  return true
}

// ==================== WEBHOOK VERIFICATION MOVED TO PAYMENTS WORKER ====================
// verifySumUpWebhookSignature() has been removed - webhooks are now verified via
// the payments worker's /internal/verify-webhook endpoint
// ==================== END ====================

// Webhook duplicate prevention helper
async function checkAndMarkWebhookProcessed(db, webhookId, entityType, entityId) {
  try {
    // Create webhook_logs table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        webhook_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        payload TEXT,
        UNIQUE(webhook_id, entity_type, entity_id)
      )
    `).run().catch(() => {})
    
    // Check if this webhook has already been processed
    const existing = await db.prepare(
      'SELECT * FROM webhook_logs WHERE webhook_id = ? AND entity_type = ? AND entity_id = ?'
    ).bind(webhookId, entityType, entityId).first()
    
    if (existing) {
      console.log(`Duplicate webhook detected (ID: ${webhookId}, Type: ${entityType}, Entity: ${entityId})`)
      return true // Already processed
    }
    
    // Mark this webhook as processed
    await db.prepare(
      'INSERT INTO webhook_logs (webhook_id, entity_type, entity_id, payload) VALUES (?, ?, ?, ?)'
    ).bind(webhookId, entityType, entityId, JSON.stringify({ webhookId, entityType, entityId })).run()
    
    return false // Not a duplicate
  } catch (error) {
    console.error('Error checking webhook duplicate:', error)
    return false // Continue processing if there's an error
  }
}

// Stock reservation helper functions
async function reserveStock(db, productId, quantity) {
  try {
    // Create stock_reservations table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS stock_reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        order_id INTEGER,
        checkout_id TEXT,
        status TEXT NOT NULL DEFAULT 'reserved',
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        expires_at TEXT NOT NULL,
        UNIQUE(product_id, order_id)
      )
    `).run().catch(() => {})
    
    // Check available stock
    const product = await db.prepare('SELECT stock_quantity FROM products WHERE id = ?').bind(productId).first()
    if (!product) {
      throw new Error('Product not found')
    }
    
    // Check if there's enough stock available (considering existing reservations)
    const existingReservations = await db.prepare(
      'SELECT SUM(quantity) as reserved FROM stock_reservations WHERE product_id = ? AND status = "reserved"'
    ).bind(productId).first()
    
    const reservedQuantity = existingReservations?.reserved || 0
    const availableStock = product.stock_quantity - reservedQuantity
    
    if (availableStock < quantity) {
      throw new Error(`Insufficient available stock: ${availableStock} available, ${quantity} requested`)
    }
    
    // Reserve the stock
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString() // 1 hour reservation
    await db.prepare(
      'INSERT INTO stock_reservations (product_id, quantity, status, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(productId, quantity, 'reserved', expiresAt).run()
    
    return true
  } catch (error) {
    console.error('Stock reservation error:', error)
    throw error
  }
}

async function releaseStockReservation(db, productId, orderId) {
  try {
    await db.prepare(
      'UPDATE stock_reservations SET status = "released" WHERE product_id = ? AND order_id = ? AND status = "reserved"'
    ).bind(productId, orderId).run()
  } catch (error) {
    console.error('Stock release error:', error)
    // Don't throw to avoid breaking the flow
  }
}

async function commitStockReservation(db, productId, orderId) {
  try {
    // Update reservation status
    await db.prepare(
      'UPDATE stock_reservations SET status = "committed" WHERE product_id = ? AND order_id = ? AND status = "reserved"'
    ).bind(productId, orderId).run()
    
    // Reduce actual stock
    const reservation = await db.prepare(
      'SELECT quantity FROM stock_reservations WHERE product_id = ? AND order_id = ? AND status = "committed"'
    ).bind(productId, orderId).first()
    
    if (reservation) {
      await db.prepare(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?'
      ).bind(reservation.quantity, productId).run()
    }
  } catch (error) {
    console.error('Stock commitment error:', error)
    throw error
  }
}

// Cleanup expired stock reservations (should be called periodically)
async function cleanupExpiredStockReservations(db) {
  try {
    const now = new Date().toISOString()
    const expiredReservations = await db.prepare(
      'SELECT * FROM stock_reservations WHERE status = "reserved" AND expires_at < ?'
    ).bind(now).all()
    
    for (const reservation of expiredReservations.results || []) {
      await db.prepare(
        'UPDATE stock_reservations SET status = "expired" WHERE id = ?'
      ).bind(reservation.id).run()
    }
    
    return expiredReservations.results?.length || 0
  } catch (error) {
    console.error('Stock reservation cleanup error:', error)
    return 0
  }
}

// --- Schema compatibility helpers ---
let __schemaCache
async function getSchema(db){
  if (__schemaCache) return __schemaCache
  // Current schema uses user_id for all foreign keys
  const fkColumn = 'user_id'
  const identityTable = 'users'
  const idColumn = 'user_id'
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
  
  // Create email_history table for tracking sent emails
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS email_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_type TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT,
        subject TEXT NOT NULL,
        template_used TEXT NOT NULL,
        related_id INTEGER,
        related_type TEXT,
        sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        status TEXT DEFAULT 'sent',
        error_message TEXT,
        metadata TEXT
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
  // Use case-insensitive email lookup
  const row = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE LOWER(email) = LOWER(?)`).bind(email).first()
  if (!row) return null
  if (typeof row.id === 'undefined') row.id = row[s.idColumn]
  return row
}

async function getOrCreateIdentity(db, email, name){
  const s = await getSchema(db)
  // Normalize email to lowercase for case-insensitive comparison
  const normalizedEmail = email?.toLowerCase()
  
  let existing = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE LOWER(email) = LOWER(?)`).bind(email).first()
  if (existing){ 
    if (typeof existing.id === 'undefined') existing.id = existing[s.idColumn]; 
    return existing 
  }
  
  // Store the original email but use normalized version for lookups
  await db.prepare(`INSERT INTO ${s.identityTable} (email, name) VALUES (?, ?)`).bind(email, name || null).run()
  existing = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE LOWER(email) = LOWER(?)`).bind(email).first()
  if (existing && typeof existing.id === 'undefined') existing.id = existing[s.idColumn]
  return existing
}

async function getActiveMembership(db, identityId) {
  const now = new Date().toISOString()
  return await db.prepare(`SELECT * FROM memberships WHERE user_id = ? AND status = "active" AND end_date >= ? ORDER BY end_date DESC LIMIT 1`).bind(identityId, now).first()
}

// Fetch pricing/details for a plan from the services table
async function getServiceForPlan(db, planCode) {
  return await db.prepare('SELECT * FROM services WHERE code = ? AND active = 1 LIMIT 1').bind(planCode).first()
}

// ==================== PAYMENT FUNCTIONS MOVED TO PAYMENTS WORKER ====================
// The following functions have been moved to payments-worker and are now called via
// the payments-client.js module:
// - sumupToken() → Removed, handled by payments worker
// - getOrCreateSumUpCustomer() → Now imported from payments-client.js
// - createCheckout() → Now imported from payments-client.js
// - fetchPayment() → Now imported from payments-client.js
// - savePaymentInstrument() → Now imported from payments-client.js
// - chargePaymentInstrument() → Now imported from payments-client.js
// ==================== END MOVED FUNCTIONS ====================

// Update payment instrument card details from checkout transaction
// Note: This function is kept for backwards compatibility but card details
// are now primarily handled by the payments worker
async function updatePaymentInstrumentCardDetails(db, instrumentId, checkout) {
  try {
    // Extract card details from the transaction
    if (checkout.card && checkout.card.last_4_digits) {
      // Card details directly in checkout
      const card = checkout.card
      await db.prepare(`
        UPDATE payment_instruments 
        SET card_type = COALESCE(?, card_type),
            last_4 = COALESCE(?, last_4),
            expiry_month = COALESCE(?, expiry_month),
            expiry_year = COALESCE(?, expiry_year),
            updated_at = ?
        WHERE instrument_id = ?
      `).bind(
        card.type || null,
        card.last_4_digits || null,
        card.expiry_month || null,
        card.expiry_year || null,
        toIso(new Date()),
        instrumentId
      ).run()
      console.log('Updated card details from checkout:', { type: card.type, last4: card.last_4_digits })
      return true
    } else if (checkout.transactions && checkout.transactions.length > 0) {
      // Try to get card details from transaction
      const txn = checkout.transactions[0]
      if (txn.card) {
        await db.prepare(`
          UPDATE payment_instruments 
          SET card_type = COALESCE(?, card_type),
              last_4 = COALESCE(?, last_4),
              updated_at = ?
          WHERE instrument_id = ?
        `).bind(
          txn.card.type || null,
          txn.card.last_4_digits || null,
          toIso(new Date()),
          instrumentId
        ).run()
        console.log('Updated card details from transaction:', { type: txn.card?.type, last4: txn.card?.last_4_digits })
        return true
      }
    }
    console.warn('No card details found in checkout response')
    return false
  } catch (e) {
    console.error('Failed to update card details:', e)
    return false
  }
}

// ==================== REMOVED: chargePaymentInstrument ====================
// This function has been moved to the payments worker and is now imported
// from payments-client.js
// ==================== END ====================

// Get active payment instrument for user
async function getActivePaymentInstrument(db, userId) {
  return await db.prepare('SELECT * FROM payment_instruments WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1')
    .bind(userId).first()
}

// Process renewal for a single membership
async function processMembershipRenewal(db, membership, env) {
  const s = await getSchema(db)
  const userId = membership.user_id
  
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
    // Charge the payment instrument via payments worker
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
        await sendEmail(env, { 
          to: user.email, 
          ...emailContent,
          emailType: 'membership_renewal_success',
          relatedId: membership.id,
          relatedType: 'membership',
          metadata: { plan: membership.plan, new_end_date: toIso(newEnd) }
        }).catch(err => {
          console.error('Renewal success email error:', err)
        })
      }
      
      return { success: true, newEndDate: toIso(newEnd), paymentId: payment.id }
    } else {
      throw new Error(`Payment not successful: ${payment?.status || 'UNKNOWN'}`)
    }
  } catch (e) {
    const currentAttempts = (membership.renewal_attempts || 0) + 1
    const errorMessage = String(e.message || e)
    
    // Check if error is due to invalid/expired token
    const isTokenError = errorMessage.toLowerCase().includes('invalid') || 
                         errorMessage.toLowerCase().includes('expired') ||
                         errorMessage.toLowerCase().includes('token') ||
                         errorMessage.toLowerCase().includes('card')
    
    // Log the error
    await db.prepare('UPDATE memberships SET renewal_failed_at = ?, renewal_attempts = ? WHERE id = ?')
      .bind(toIso(new Date()), currentAttempts, membership.id).run()
    await db.prepare('INSERT INTO renewal_log (membership_id, attempt_date, status, error_message, amount, currency) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(membership.id, toIso(new Date()), 'failed', errorMessage, String(amount), currency).run()
    
    // If token error, deactivate the instrument
    if (isTokenError) {
      console.log(`Deactivating expired/invalid payment instrument ${instrument.instrument_id} for user ${userId}`)
      await db.prepare('UPDATE payment_instruments SET is_active = 0 WHERE instrument_id = ?')
        .bind(instrument.instrument_id).run()
      
      // Disable auto-renewal since payment method is invalid
      await db.prepare('UPDATE memberships SET auto_renew = 0 WHERE id = ?')
        .bind(membership.id).run()
    }
    
    // Get user for email notification
    const user = await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first()
    
    // If token error or 3rd failure, send final notice
    if ((isTokenError || currentAttempts >= 3) && user) {
      // Ensure auto-renew is disabled
      await db.prepare('UPDATE memberships SET auto_renew = 0 WHERE id = ?').bind(membership.id).run()
      
      const emailContent = isTokenError 
        ? getExpiredPaymentMethodEmail(membership, user)
        : getRenewalFailedFinalEmail(membership, user)
        
      await sendEmail(env, { 
        to: user.email, 
        ...emailContent,
        emailType: isTokenError ? 'payment_method_expired' : 'membership_renewal_final_failed',
        relatedId: membership.id,
        relatedType: 'membership',
        metadata: { plan: membership.plan, attempts: currentAttempts, token_error: isTokenError }
      }).catch(err => {
        console.error('Renewal failure email error:', err)
      })
    } else if (user) {
      // Send regular failure notification (attempts 1 or 2)
      const emailContent = getRenewalFailedEmail(membership, user, currentAttempts)
      await sendEmail(env, { 
        to: user.email, 
        ...emailContent,
        emailType: 'membership_renewal_failed',
        relatedId: membership.id,
        relatedType: 'membership',
        metadata: { plan: membership.plan, attempt_number: currentAttempts }
      }).catch(err => {
        console.error('Renewal failed email error:', err)
      })
    }
    
    return { success: false, error: errorMessage, attempts: currentAttempts, token_error: isTokenError }
  }
}

// Turnstile verification with optional debug logging
async function verifyTurnstile(env, token, ip, debug){
  if (!env.TURNSTILE_SECRET) { if (debug) console.log('turnstile: secret missing -> bypass'); return true }
  if (!token) { if (debug) console.log('turnstile: missing token'); return false }
  
  // Allow test bypass for local development
  if (token === 'test-bypass' && env.ALLOW_TEST_BYPASS === 'true') {
    if (debug) console.log('turnstile: test-bypass token accepted')
    return true
  }
  
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

// Log email to history database
async function logEmailHistory(db, emailData) {
  try {
    await db.prepare(`
      INSERT INTO email_history (
        email_type, recipient_email, recipient_name, subject, template_used,
        related_id, related_type, status, error_message, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      emailData.email_type,
      emailData.recipient_email,
      emailData.recipient_name || null,
      emailData.subject,
      emailData.template_used,
      emailData.related_id || null,
      emailData.related_type || null,
      emailData.status || 'sent',
      emailData.error_message || null,
      emailData.metadata ? JSON.stringify(emailData.metadata) : null
    ).run()
    
    return { success: true }
  } catch (e) {
    console.error('Email history logging error:', e)
    return { success: false, error: String(e) }
  }
}

// MailerSend email helper
async function sendEmail(env, { to, subject, html, text, emailType = 'transactional', relatedId = null, relatedType = null, metadata = null }) {
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
      
      // Log failed email attempt
      await logEmailHistory(env.DB, {
        email_type: emailType,
        recipient_email: to,
        subject: subject,
        template_used: emailType,
        related_id: relatedId,
        related_type: relatedType,
        status: 'failed',
        error_message: txt,
        metadata: metadata
      })
      
      return { success: false, error: txt }
    }
    
    // Log successful email
    await logEmailHistory(env.DB, {
      email_type: emailType,
      recipient_email: to,
      subject: subject,
      template_used: emailType,
      related_id: relatedId,
      related_type: relatedType,
      status: 'sent',
      metadata: metadata
    })
    
    return { success: true }
  } catch (e) {
    console.error('Email send error:', e)
    
    // Log failed email attempt
    await logEmailHistory(env.DB, {
      email_type: emailType,
      recipient_email: to,
      subject: subject,
      template_used: emailType,
      related_id: relatedId,
      related_type: relatedType,
      status: 'failed',
      error_message: String(e),
      metadata: metadata
    })
    
    return { success: false, error: String(e) }
  }
}

// UTM Parameter Helper
function addUtmParams(url, source = 'email', medium = 'transactional', campaign = null) {
  try {
    const baseUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    baseUrl.searchParams.set('utm_source', source)
    baseUrl.searchParams.set('utm_medium', medium)
    if (campaign) baseUrl.searchParams.set('utm_campaign', campaign)
    return baseUrl.toString()
  } catch (e) {
    console.error('UTM parameter error:', e)
    return url
  }
}

// Handle email preferences opt-in (only if user explicitly consents)
async function handleEmailPreferencesOptIn(db, userId, marketingConsent) {
  if (!marketingConsent) return
  
  const now = toIso(new Date())
  // Check if user already has preferences
  const existingPrefs = await db.prepare(`
    SELECT * FROM email_preferences WHERE user_id = ?
  `).bind(userId).first()
  
  // Only create/update if no existing consent or explicitly opting in
  if (!existingPrefs || !existingPrefs.consent_given) {
    await db.prepare(`
      INSERT OR REPLACE INTO email_preferences 
      (user_id, essential_emails, marketing_emails, consent_given, consent_date, last_updated)
      VALUES (?, 1, 1, 1, ?, ?)
    `).bind(userId, now, now).run()
  }
}

// Generate admin notification email
function getAdminNotificationEmail(purchaseType, details) {
  const formatPrice = (pence) => `£${(pence / 100).toFixed(2)}`
  
  let subject, htmlContent, textContent
  
  switch (purchaseType) {
    case 'membership':
      subject = `📈 New Membership Purchase: ${details.plan} Plan`
      htmlContent = `
        <h2>New Membership Purchase</h2>
        <p><strong>Plan:</strong> ${details.plan}</p>
        <p><strong>Customer:</strong> ${details.customerName} (${details.customerEmail})</p>
        <p><strong>Amount:</strong> ${formatPrice(details.amount)}</p>
        <p><strong>Auto-Renewal:</strong> ${details.autoRenew ? 'Yes' : 'No'}</p>
        <p><strong>Purchase Date:</strong> ${new Date().toLocaleString('en-GB')}</p>
        <p><strong>Membership ID:</strong> ${details.membershipId}</p>
        <p><strong>Order Reference:</strong> ${details.orderRef}</p>
      `
      textContent = `
New Membership Purchase

Plan: ${details.plan}
Customer: ${details.customerName} (${details.customerEmail})
Amount: ${formatPrice(details.amount)}
Auto-Renewal: ${details.autoRenew ? 'Yes' : 'No'}
Purchase Date: ${new Date().toLocaleString('en-GB')}
Membership ID: ${details.membershipId}
Order Reference: ${details.orderRef}
      `.trim()
      break
    
    case 'shop_order':
      subject = `🛒 New Shop Order: ${details.orderNumber}`
      const itemsHtml = details.items.map(item => 
        `<li>${item.product_name} x ${item.quantity} - ${formatPrice(item.subtotal)}</li>`
      ).join('')
      
      htmlContent = `
        <h2>New Shop Order</h2>
        <p><strong>Order Number:</strong> ${details.orderNumber}</p>
        <p><strong>Customer:</strong> ${details.customerName} (${details.customerEmail})</p>
        <p><strong>Total Amount:</strong> ${formatPrice(details.total)}</p>
        <p><strong>Delivery Method:</strong> ${details.deliveryMethod}</p>
        <p><strong>Purchase Date:</strong> ${new Date().toLocaleString('en-GB')}</p>
        <p><strong>Items Ordered:</strong></p>
        <ul>${itemsHtml}</ul>
      `
      textContent = `
New Shop Order

Order Number: ${details.orderNumber}
Customer: ${details.customerName} (${details.customerEmail})
Total Amount: ${formatPrice(details.total)}
Delivery Method: ${details.deliveryMethod}
Purchase Date: ${new Date().toLocaleString('en-GB')}

Items Ordered:
${details.items.map(item => `• ${item.product_name} x ${item.quantity} - ${formatPrice(item.subtotal)}`).join('\n')}
      `.trim()
      break
    
    case 'event_ticket':
      subject = `🎟️ New Event Ticket Purchase: ${details.eventName}`
      htmlContent = `
        <h2>New Event Ticket Purchase</h2>
        <p><strong>Event:</strong> ${details.eventName}</p>
        <p><strong>Customer:</strong> ${details.customerName} (${details.customerEmail})</p>
        <p><strong>Amount:</strong> ${formatPrice(details.amount)}</p>
        <p><strong>Event Date:</strong> ${new Date(details.eventDate).toLocaleString('en-GB')}</p>
        <p><strong>Purchase Date:</strong> ${new Date().toLocaleString('en-GB')}</p>
        <p><strong>Ticket ID:</strong> ${details.ticketId}</p>
        <p><strong>Order Reference:</strong> ${details.orderRef}</p>
      `
      textContent = `
New Event Ticket Purchase

Event: ${details.eventName}
Customer: ${details.customerName} (${details.customerEmail})
Amount: ${formatPrice(details.amount)}
Event Date: ${new Date(details.eventDate).toLocaleString('en-GB')}
Purchase Date: ${new Date().toLocaleString('en-GB')}
Ticket ID: ${details.ticketId}
Order Reference: ${details.orderRef}
      `.trim()
      break
    
    default:
      subject = `💰 New Purchase Notification`
      htmlContent = `
        <h2>New Purchase Notification</h2>
        <p><strong>Type:</strong> ${purchaseType}</p>
        <p><strong>Customer:</strong> ${details.customerName} (${details.customerEmail})</p>
        <p><strong>Amount:</strong> ${formatPrice(details.amount)}</p>
        <p><strong>Purchase Date:</strong> ${new Date().toLocaleString('en-GB')}</p>
      `
      textContent = `
New Purchase Notification

Type: ${purchaseType}
Customer: ${details.customerName} (${details.customerEmail})
Amount: ${formatPrice(details.amount)}
Purchase Date: ${new Date().toLocaleString('en-GB')}
      `.trim()
  }
  
  return {
    subject: `🔔 ADMIN ALERT: ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: #dc2626; color: white; padding: 1rem; text-align: center; }
          .content { padding: 1rem; }
          .footer { margin-top: 1rem; padding: 1rem; background: #f3f4f6; text-align: center; font-size: 0.9rem; color: #666; }
          .alert-badge { display: inline-block; background: #dc2626; color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔔 DICE BASTION ADMIN ALERT</h1>
          <div class="alert-badge">NEW PURCHASE</div>
        </div>
        <div class="content">
          ${htmlContent}
          <p style="margin-top: 1.5rem; font-size: 0.9rem; color: #666;">
            This is an automated notification from Dice Bastion. 
            Please do not reply to this email.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Dice Bastion Gibraltar | Admin Dashboard: <a href="https://dicebastion.com/admin">dicebastion.com/admin</a></p>
        </div>
      </body>
      </html>
    `,
    text: `ADMIN ALERT: ${textContent}\n\nThis is an automated notification from Dice Bastion.`
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
      <p>Your membership will continue uninterrupted. If you wish to cancel auto-renewal, you can do so from your <a href="${addUtmParams('https://dicebastion.com/account', 'email', 'transactional', 'membership_renewal')}">account page</a>.</p>
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
        <li>Update your payment method at <a href="${addUtmParams('https://dicebastion.com/memberships', 'email', 'transactional', 'renewal_reminder')}">dicebastion.com/memberships</a></li>
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
        <li><strong>Recommended:</strong> Update your payment method at <a href="${addUtmParams('https://dicebastion.com/memberships', 'email', 'transactional', 'payment_failed')}">dicebastion.com/memberships</a></li>
        <li>Or purchase a new membership at <a href="${addUtmParams('https://dicebastion.com/memberships', 'email', 'transactional', 'payment_failed')}">dicebastion.com/memberships</a></li>
        <li>Contact us if you need help: <a href="mailto:support@dicebastion.com">support@dicebastion.com</a></li>
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
        <li><strong>Option 1:</strong> Purchase a new membership at <a href="${addUtmParams('https://dicebastion.com/memberships', 'email', 'transactional', 'auto_renewal_disabled')}">dicebastion.com/memberships</a> (you can do this now or when your current membership expires)</li>
        <li><strong>Option 2:</strong> Update your payment method and contact us to re-enable auto-renewal</li>
        <li><strong>Need help?</strong> Email us at <a href="mailto:support@dicebastion.com">support@dicebastion.com</a></li>
      </ul>
      <p>We'd love to keep you as a member! If you're experiencing payment issues, please reach out and we'll help resolve them.</p>
      <p>— The Dice Bastion Team</p>
    `,
    text: `Hi ${user.name || 'there'},\n\nAfter 3 unsuccessful payment attempts, we've disabled auto-renewal for your ${planName} Membership.\n\nYour membership expires on ${new Date(membership.end_date).toLocaleDateString('en-GB')} and will NOT automatically renew.\n\nTo continue your membership, purchase a new one at dicebastion.com/memberships or contact us to re-enable auto-renewal.\n\n— The Dice Bastion Team`
  }
}

function getExpiredPaymentMethodEmail(membership, user) {
  const planNames = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' }
  const planName = planNames[membership.plan] || membership.plan
  
  return {
    subject: `Action Required: Update Your Payment Method - Dice Bastion`,
    html: `
      <h2>Payment Method Update Required</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>We attempted to renew your ${planName} Membership, but <strong>your saved payment method is no longer valid</strong>.</p>
      <p>This could happen if your card:</p>
      <ul>
        <li>Has expired</li>
        <li>Was cancelled or replaced by your bank</li>
        <li>Has insufficient funds</li>
      </ul>
      <div style="background: #fff3cd; border-left: 4px solid #856404; padding: 16px; margin: 20px 0;">
        <strong>⚠️ Auto-renewal has been disabled</strong>
        <p style="margin: 8px 0 0 0;">Your membership will expire on <strong>${new Date(membership.end_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> unless you take action.</p>
      </div>
      <p><strong>To continue your membership:</strong></p>
      <ol>
        <li>Visit <a href="${addUtmParams('https://dicebastion.com/memberships', 'email', 'transactional', 'payment_method_expired')}">dicebastion.com/memberships</a></li>
        <li>Purchase a new membership with your updated payment details</li>
        <li>Enable auto-renewal during checkout to save your new payment method</li>
      </ol>
      <p><strong>Need help?</strong> Contact us at <a href="mailto:support@dicebastion.com">support@dicebastion.com</a></p>
      <p>We'd love to keep you as a member!</p>
      <p>— The Dice Bastion Team</p>
    `,
    text: `Hi ${user.name || 'there'},\n\nWe couldn't renew your ${planName} Membership because your saved payment method is no longer valid.\n\nAuto-renewal has been disabled. Your membership expires on ${new Date(membership.end_date).toLocaleDateString('en-GB')}.\n\nTo continue: Visit dicebastion.com/memberships and purchase a new membership with your updated payment details.\n\nNeed help? Email support@dicebastion.com\n\n— The Dice Bastion Team`
  }
}

function getPasswordResetEmail(userName, resetLink) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #b2c6df 0%, #5374a5 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #5374a5;
          color: white !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .link-text {
          word-break: break-all;
          color: #6b7280;
          font-size: 12px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">Reset Your Password</h1>
      </div>
      <div class="content">
        <p>Hi ${userName},</p>
        
        <p>We received a request to reset your password for your Dice Bastion account.</p>
        
        <p>Click the button below to choose a new password:</p>
        
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">Reset Password</a>
        </div>
        
        <p class="link-text">Or copy and paste this link into your browser:<br>${resetLink}</p>
        
        <div class="warning">
          <strong>⏰ This link will expire in 1 hour</strong> for security reasons.
        </div>
        
        <p><strong>Didn't request a password reset?</strong><br>
        If you didn't request this, you can safely ignore this email. Your password will not be changed.</p>
        
        <div class="footer">
          <p>This is an automated email from Dice Bastion.<br>
          If you need help, contact us at admin@dicebastion.com</p>
        </div>
      </div>
    </body>
    </html>
  `
}

function getTicketConfirmationEmail(event, user, transaction) {
  const eventDateTime = new Date(event.event_datetime)
  const eventDate = eventDateTime.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const eventTime = eventDateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
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
        <li><strong>Location:</strong> ${event.location ? event.location : '<a href="https://www.google.com/maps/place/Gibraltar+Warhammer+Club/data=!4m2!3m1!1s0x0:0x6942154652d2cbe?sa=X&ved=1t:2428&ictx=111" style="text-decoration: underline;">Gibraltar Warhammer Club</a>'}</li>
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
- Location: ${event.location ? event.location : '<a href="https://www.google.com/maps/place/Gibraltar+Warhammer+Club/data=!4m2!3m1!1s0x0:0x6942154652d2cbe?sa=X&ved=1t:2428&ictx=111" style="text-decoration: underline;">Gibraltar Warhammer Club</a>'}</li>
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
      ${autoRenew ? '<p>Your membership will automatically renew before expiration. You can manage this at any time from your <a href="' + addUtmParams('https://dicebastion.com/account', 'email', 'transactional', 'welcome') + '">account page</a>.</p>' : '<p>Remember to renew your membership before it expires to continue enjoying member benefits!</p>'}
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

// ============================================================================
// GENERAL USER LOGIN/LOGOUT ENDPOINTS (for all users)
// ============================================================================

// General login endpoint - works for both admin and non-admin users
app.post('/login', async c => {
  try {
    console.log('[User Login] Request received')
    const { email, password } = await c.req.json()
    console.log('[User Login] Email:', email)
    
    if (!email || !password) {
      console.log('[User Login] Missing email or password')
      return c.json({ error: 'email_and_password_required' }, 400)
    }
    
    // Find user by email (any active user, not just admins)
    console.log('[User Login] Querying database for user...')
    const user = await c.env.DB.prepare(`
      SELECT user_id, email, password_hash, name, is_admin, is_active
      FROM users
      WHERE email = ? AND is_active = 1
    `).bind(email).first()
    
    if (!user) {
      console.log('[User Login] User not found or inactive')
      return c.json({ error: 'invalid_credentials' }, 401)
    }
    
    console.log('[User Login] User found:', user.email, '| Admin:', user.is_admin === 1)
    
    // Verify password
    console.log('[User Login] Verifying password...')
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      console.log('[User Login] Password mismatch')
      return c.json({ error: 'invalid_credentials' }, 401)
    }
    
    console.log('[User Login] Password verified')
    
    // Create session token
    const sessionToken = crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    console.log('[User Login] Creating user_sessions table if needed...')
    // Create user_sessions table if it doesn't exist
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        last_activity TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `).run().catch(err => {
      console.log('[User Login] Table creation error (might already exist):', err.message)
    })
    
    console.log('[User Login] Storing session...')
    // Store session
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_token, created_at, expires_at, last_activity)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      user.user_id,
      sessionToken,
      toIso(now),
      toIso(expiresAt),
      toIso(now)
    ).run()
    
    console.log('[User Login] Success! Session created for', user.email)
    return c.json({
      success: true,
      session_token: sessionToken,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin === 1
      }
    })
  } catch (error) {
    console.error('[User Login] ERROR:', error)
    console.error('[User Login] Stack:', error.stack)
    return c.json({ error: 'internal_error', message: error.message }, 500)
  }
})

// Password reset request endpoint
app.post('/password-reset/request', async c => {
  try {
    console.log('[Password Reset] Request received')
    const { email } = await c.req.json()
    
    if (!email) {
      return c.json({ error: 'email_required' }, 400)
    }
    
    console.log('[Password Reset] Email:', email)
      // Find user by email
    const user = await c.env.DB.prepare(`
      SELECT user_id, email, name
      FROM users
      WHERE email = ? AND is_active = 1
    `).bind(email).first()
    
    // Always return success for security (don't reveal if user exists)
    // But only send email if user actually exists
    if (user) {
      console.log('[Password Reset] User found, generating reset token')
      
      // Generate a secure reset token
      const resetToken = crypto.randomUUID() + '-' + crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry
      
      // Ensure users table has reset columns
      try {
        await c.env.DB.prepare(`
          ALTER TABLE users ADD COLUMN reset_token TEXT;
        `).run()
      } catch (e) {
        // Column might already exist
      }
      
      try {
        await c.env.DB.prepare(`
          ALTER TABLE users ADD COLUMN reset_token_expires TEXT;
        `).run()
      } catch (e) {
        // Column might already exist
      }
      
      // Store the reset token in users table
      await c.env.DB.prepare(`
        UPDATE users 
        SET reset_token = ?, reset_token_expires = ?, updated_at = ?
        WHERE user_id = ?
      `).bind(resetToken, expiresAt.toISOString(), new Date().toISOString(), user.user_id).run()
      
      // Generate reset link
      const resetLink = `https://dicebastion.com/reset-password?token=${resetToken}`
      
      // Send password reset email
      const emailHtml = getPasswordResetEmail(user.name || user.email, resetLink)
      
      await sendEmail(c.env, {
        to: user.email,
        subject: 'Reset Your Dice Bastion Password',
        html: emailHtml,
        emailType: 'password_reset',
        relatedId: user.user_id,
        relatedType: 'user'
      })
      
      console.log('[Password Reset] Reset email sent to', user.email)
    } else {
      console.log('[Password Reset] User not found, but returning success for security')
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('[Password Reset] ERROR:', error)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Password reset confirmation endpoint
app.post('/password-reset/confirm', async c => {
  try {
    console.log('[Password Reset Confirm] Request received')
    const { token, newPassword } = await c.req.json()
    
    if (!token || !newPassword) {
      return c.json({ error: 'token_and_password_required' }, 400)
    }
    
    if (newPassword.length < 8) {
      return c.json({ error: 'password_too_short' }, 400)
    }
    
    console.log('[Password Reset Confirm] Validating token')
    
    // Find valid reset token
    const resetRecord = await c.env.DB.prepare(`
      SELECT prt.id, prt.user_id, prt.expires_at, prt.used, u.email
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.user_id
      WHERE prt.token = ? AND prt.used = 0
    `).bind(token).first()
    
    if (!resetRecord) {
      console.log('[Password Reset Confirm] Invalid or already used token')
      return c.json({ error: 'invalid_token' }, 404)
    }
    
    // Check if token has expired
    const expiresAt = new Date(resetRecord.expires_at)
    if (expiresAt < new Date()) {
      console.log('[Password Reset Confirm] Token has expired')
      return c.json({ error: 'token_expired' }, 400)
    }
    
    console.log('[Password Reset Confirm] Token valid, hashing new password')
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10)
    
    // Update user's password
    await c.env.DB.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = ?
      WHERE user_id = ?
    `).bind(passwordHash, new Date().toISOString(), resetRecord.user_id).run()
    
    // Mark token as used
    await c.env.DB.prepare(`
      UPDATE password_reset_tokens
      SET used = 1
      WHERE id = ?
    `).bind(resetRecord.id).run()
    
    // Invalidate all existing sessions for this user (for security)
    await c.env.DB.prepare(`
      DELETE FROM user_sessions WHERE user_id = ?
    `).bind(resetRecord.user_id).run()
    
    console.log('[Password Reset Confirm] Password reset successful for', resetRecord.email)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('[Password Reset Confirm] ERROR:', error)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// General logout endpoint - works for all users
app.post('/logout', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ error: 'no_session_token' }, 400)
    }
    
    // Delete the session
    await c.env.DB.prepare(`
      DELETE FROM user_sessions WHERE session_token = ?
    `).bind(sessionToken).run()
    
    console.log('[Logout] Session invalidated')
    return c.json({ success: true })
  } catch (error) {
    console.error('[Logout] ERROR:', error)
    return c.json({ error: 'internal_error' }, 500)  }
})

// Get user account information
app.get('/account/info', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ error: 'no_session_token' }, 401)
    }
    
    // Get session and user
    const session = await c.env.DB.prepare(`
      SELECT us.*, u.user_id, u.email, u.name, u.is_admin, u.created_at as user_created_at
      FROM user_sessions us
      JOIN users u ON us.user_id = u.user_id
      WHERE us.session_token = ? AND us.expires_at > datetime('now')
    `).bind(sessionToken).first()
    
    if (!session) {
      return c.json({ error: 'invalid_session' }, 401)
    }
      const userId = session.user_id
    
    // Get active membership (based on status column, not date)
    const membership = await c.env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE user_id = ? AND status = 'active'
      ORDER BY end_date DESC LIMIT 1
    `).bind(userId).first()
    
    // Get all memberships history
    const membershipsHistory = await c.env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE user_id = ? 
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(userId).all()
    
    // Get event tickets
    const tickets = await c.env.DB.prepare(`
      SELECT t.*, e.event_name, e.event_datetime, e.location, e.slug
      FROM tickets t
      JOIN events e ON t.event_id = e.event_id
      WHERE t.user_id = ?
      ORDER BY e.event_datetime DESC
      LIMIT 20
    `).bind(userId).all()
    
    // Get shop orders
    const orders = await c.env.DB.prepare(`
      SELECT * FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(userId).all()
    
    // Get email preferences
    let emailPrefs = await c.env.DB.prepare(`
      SELECT * FROM email_preferences WHERE user_id = ?
    `).bind(userId).first()
    
    // If no preferences exist, create default ones
    if (!emailPrefs) {
      emailPrefs = {
        essential_emails: 1,
        marketing_emails: 0,
        consent_given: 0
      }
    }
    
    return c.json({
      success: true,
      user: {
        id: session.user_id,
        email: session.email,
        name: session.name,
        is_admin: session.is_admin === 1,
        member_since: session.user_created_at
      },
      membership: membership || null,
      memberships_history: membershipsHistory.results || [],
      tickets: tickets.results || [],
      orders: orders.results || [],
      email_preferences: emailPrefs
    })
  } catch (error) {
    console.error('[Account Info] ERROR:', error)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Update email preferences
app.post('/account/email-preferences', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ error: 'no_session_token' }, 401)
    }
    
    // Get session
    const session = await c.env.DB.prepare(`
      SELECT user_id FROM user_sessions 
      WHERE session_token = ? AND expires_at > datetime('now')
    `).bind(sessionToken).first()
    
    if (!session) {
      return c.json({ error: 'invalid_session' }, 401)
    }
    
    const { marketing_emails } = await c.req.json()
    const now = new Date().toISOString()
    
    // Upsert email preferences
    await c.env.DB.prepare(`
      INSERT INTO email_preferences (user_id, marketing_emails, consent_given, consent_date, last_updated)
      VALUES (?, ?, 1, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        marketing_emails = excluded.marketing_emails,
        consent_given = 1,
        consent_date = COALESCE(consent_date, excluded.consent_date),
        last_updated = excluded.last_updated
    `).bind(session.user_id, marketing_emails ? 1 : 0, now, now).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('[Email Preferences] ERROR:', error)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Enable auto-renewal for user's active membership
app.post('/account/enable-auto-renewal', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ error: 'no_session_token' }, 401)
    }
    
    // Get session
    const session = await c.env.DB.prepare(`
      SELECT us.user_id, u.email, u.name 
      FROM user_sessions us
      JOIN users u ON us.user_id = u.user_id
      WHERE us.session_token = ? AND us.expires_at > datetime('now')
    `).bind(sessionToken).first()
    
    if (!session) {
      return c.json({ error: 'invalid_session' }, 401)
    }
    
    // Get active membership (check status column only, not date)
    const membership = await c.env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE user_id = ? AND status = 'active'
      ORDER BY end_date DESC LIMIT 1
    `).bind(session.user_id).first()
    
    if (!membership) {
      return c.json({ error: 'no_active_membership' }, 404)
    }
    
    if (membership.auto_renew === 1) {
      return c.json({ error: 'auto_renewal_already_enabled' }, 400)
    }
      // Check if user has a saved payment method
    const paymentInstrument = await c.env.DB.prepare(`
      SELECT * FROM payment_instruments      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC LIMIT 1
    `).bind(session.user_id).first()
    
    if (!paymentInstrument) {
      // Create a card tokenization checkout (no charge, just saves the card)
      const orderRef = `AUTO-RENEWAL-SETUP-${session.user_id}-${Date.now()}`
      const customerId = `USER-${session.user_id}`
        try {
        // First, ensure the customer exists in SumUp
        const customerResponse = await c.env.PAYMENTS.fetch('https://payments/internal/customer', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Internal-Secret': c.env.INTERNAL_SECRET
          },
          body: JSON.stringify({
            user_id: session.user_id,
            email: session.email,
            name: session.name
          })
        })
        
        if (!customerResponse.ok) {
          const error = await customerResponse.text()
          console.error('[Enable Auto-Renewal] Customer creation failed:', error)
          throw new Error('Failed to create customer')
        }
        
        // Now create the checkout for card tokenization
        // Use service binding instead of HTTP URL for better performance and reliability
        const checkoutResponse = await c.env.PAYMENTS.fetch('https://payments/internal/checkout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Internal-Secret': c.env.INTERNAL_SECRET
          },
          body: JSON.stringify({
            amount: 0, // No charge for card tokenization
            currency: 'GBP',
            orderRef,
            description: 'Setup payment method for auto-renewal',
            savePaymentInstrument: true,
            customerId
          })
        })
        
        if (!checkoutResponse.ok) {
          const error = await checkoutResponse.text()
          console.error('[Enable Auto-Renewal] Checkout creation failed - Status:', checkoutResponse.status)
          console.error('[Enable Auto-Renewal] Checkout creation failed - Response:', error)
          throw new Error('Failed to create checkout')
        }
        
        const checkout = await checkoutResponse.json()
        
        // Store the setup intent
        const now = new Date().toISOString()
        await c.env.DB.prepare(`
          INSERT INTO payment_setups (user_id, checkout_id, order_ref, status, created_at)
          VALUES (?, ?, ?, 'pending', ?)
        `).bind(session.user_id, checkout.id, orderRef, now).run()
        
        return c.json({
          success: false,
          requires_payment_setup: true,
          checkout_id: checkout.id,
          order_ref: orderRef,
          message: 'Please add a payment method to enable auto-renewal'
        })
      } catch (error) {
        console.error('[Enable Auto-Renewal] Checkout error:', error)
        throw error
      }
    }
    
    // User has a payment method - enable auto-renewal
    await c.env.DB.prepare(`
      UPDATE memberships 
      SET auto_renew = 1, renewal_attempts = 0, payment_instrument_id = ?
      WHERE id = ?
    `).bind(paymentInstrument.instrument_id, membership.id).run()
    
    console.log(`[Auto-Renewal] Enabled for user ${session.user_id}, membership ${membership.id}`)
    
    const endDate = new Date(membership.end_date)
    const formattedEndDate = endDate.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    return c.json({ 
      success: true,
      message: `Auto-renewal enabled successfully. Your card ending in ${paymentInstrument.last_4} will not be charged until ${formattedEndDate}.`,
      end_date: membership.end_date,
      card_last_4: paymentInstrument.last_4
    })
  } catch (error) {
    console.error('[Enable Auto-Renewal] ERROR:', error)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Setup payment method for auto-renewal
app.post('/account/setup-payment-method', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ error: 'no_session_token' }, 401)
    }
    
    // Get session
    const session = await c.env.DB.prepare(`
      SELECT us.user_id, u.email, u.name 
      FROM user_sessions us
      JOIN users u ON us.user_id = u.user_id
      WHERE us.session_token = ? AND us.expires_at > datetime('now')
    `).bind(sessionToken).first()
    
    if (!session) {
      return c.json({ error: 'invalid_session' }, 401)
    }
      // Get active membership (check status column only, not date)
    const membership = await c.env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE user_id = ? AND status = 'active'
      ORDER BY end_date DESC LIMIT 1
    `).bind(session.user_id).first()
    
    if (!membership) {
      return c.json({ error: 'no_active_membership' }, 404)
    }
    
    // Create a verification checkout for £0.01 to save the card
    const orderRef = `CARD-SETUP-${session.user_id}-${Date.now()}`
    const customerId = `USER-${session.user_id}`
    
    try {
      const checkoutResponse = await fetch(`${c.env.PAYMENTS_WORKER_URL}/internal/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 0.01, // £0.01 verification charge
          currency: 'GBP',
          orderRef,
          description: 'Payment method setup for auto-renewal',
          savePaymentInstrument: true,
          customerId
        })
      })
      
      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.text()
        console.error('Checkout creation failed:', error)
        throw new Error('Failed to create checkout')
      }
      
      const checkout = await checkoutResponse.json()
      
      // Store the setup intent
      await c.env.DB.prepare(`
        INSERT INTO payment_setups (user_id, checkout_id, order_ref, status, created_at)
        VALUES (?, ?, ?, 'pending', ?)
      `).bind(session.user_id, checkout.id, orderRef, now).run()
      
      return c.json({
        success: true,
        checkout_id: checkout.id,
        order_ref: orderRef
      })
    } catch (error) {
      console.error('[Setup Payment Method] Checkout error:', error)
      throw error
    }
  } catch (error) {
    console.error('[Setup Payment Method] ERROR:', error)
    return c.json({ error: 'internal_error', message: error.message }, 500)
  }
})

// Confirm payment method setup
app.get('/account/confirm-payment-setup', async c => {
  try {
    const orderRef = c.req.query('orderRef')
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ error: 'no_session_token' }, 401)
    }
    
    if (!orderRef) {
      return c.json({ error: 'order_ref_required' }, 400)
    }
    
    // Get session
    const session = await c.env.DB.prepare(`
      SELECT us.user_id FROM user_sessions us
      WHERE us.session_token = ? AND us.expires_at > datetime('now')
    `).bind(sessionToken).first()
    
    if (!session) {
      return c.json({ error: 'invalid_session' }, 401)
    }
    
    // Get the payment setup record
    const setup = await c.env.DB.prepare(`
      SELECT * FROM payment_setups 
      WHERE order_ref = ? AND user_id = ?
    `).bind(orderRef, session.user_id).first()
    
    if (!setup) {
      return c.json({ error: 'setup_not_found' }, 404)
    }
    
    if (setup.status === 'completed') {
      return c.json({ success: true, status: 'completed' })
    }
    
    // Verify the payment with SumUp
    const paymentResponse = await fetch(`${c.env.PAYMENTS_WORKER_URL}/internal/payment/${setup.checkout_id}`)
    
    if (!paymentResponse.ok) {
      return c.json({ error: 'payment_verification_failed' }, 500)
    }
    
    const payment = await paymentResponse.json()
    
    if (payment.status !== 'PAID' && payment.status !== 'SUCCESSFUL') {
      return c.json({ success: false, status: 'pending' })
    }
    
    // Save the payment instrument
    const instrumentResponse = await fetch(`${c.env.PAYMENTS_WORKER_URL}/internal/payment-instrument`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.user_id,
        checkoutId: setup.checkout_id
      })
    })
    
    if (!instrumentResponse.ok) {
      const error = await instrumentResponse.text()
      console.error('Failed to save payment instrument:', error)
      return c.json({ error: 'failed_to_save_instrument' }, 500)
    }
    
    const instrument = await instrumentResponse.json()
    
    // Mark setup as completed
    await c.env.DB.prepare(`
      UPDATE payment_setups 
      SET status = 'completed', completed_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), setup.id).run()
      // Get active membership and enable auto-renewal (check status column only, not date)
    const membership = await c.env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE user_id = ? AND status = 'active'
      ORDER BY end_date DESC LIMIT 1
    `).bind(session.user_id).first()
    
    if (membership) {
      await c.env.DB.prepare(`
        UPDATE memberships 
        SET auto_renew = 1, renewal_attempts = 0, payment_instrument_id = ?
        WHERE id = ?
      `).bind(instrument.instrument_id, membership.id).run()
    }
    
    return c.json({
      success: true,
      status: 'completed',
      card_last_4: instrument.last_4,
      card_type: instrument.card_type
    })
  } catch (error) {
    console.error('[Confirm Payment Setup] ERROR:', error)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Cancel auto-renewal (disable for user's active membership)
app.post('/account/cancel-auto-renewal', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ error: 'no_session_token' }, 401)
    }
    
    // Get session
    const session = await c.env.DB.prepare(`
      SELECT us.user_id, u.email, u.name 
      FROM user_sessions us
      JOIN users u ON us.user_id = u.user_id
      WHERE us.session_token = ? AND us.expires_at > datetime('now')
    `).bind(sessionToken).first()
    
    if (!session) {
      return c.json({ error: 'invalid_session' }, 401)
    }
    
    // Get active membership (check status column only, not date)
    const membership = await c.env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE user_id = ? AND status = 'active'
      ORDER BY end_date DESC LIMIT 1
    `).bind(session.user_id).first()
    
    if (!membership) {
      return c.json({ error: 'no_active_membership' }, 404)
    }
    
    if (membership.auto_renew === 0) {
      return c.json({ error: 'auto_renewal_not_enabled' }, 400)
    }
    
    // Disable auto-renewal
    await c.env.DB.prepare(`
      UPDATE memberships 
      SET auto_renew = 0 
      WHERE id = ?
    `).bind(membership.id).run()
    
    console.log(`[Auto-Renewal] Cancelled for user ${session.user_id}, membership ${membership.id}`)
    
    // Format the end date for the response
    const endDate = new Date(membership.end_date)
    const formattedEndDate = endDate.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    return c.json({ 
      success: true,
      message: `Auto-renewal cancelled. Your membership will remain active until ${formattedEndDate}.`,
      end_date: membership.end_date
    })
  } catch (error) {
    console.error('[Cancel Auto-Renewal] ERROR:', error)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// ============================================================================
// LEGACY ADMIN ENDPOINTS (kept for backward compatibility - redirect to universal endpoints)
// ============================================================================

// Admin login - legacy endpoint, redirects to universal /login
app.post('/admin/login', async c => {
  // Just call the universal login endpoint
  return app.fetch(new Request(new URL('/login', c.req.url), {
    method: 'POST',
    headers: c.req.raw.headers,
    body: c.req.raw.body
  }), c.env)
})

// Admin logout - legacy endpoint, redirects to universal /logout
app.post('/admin/logout', async c => {
  // Just call the universal logout endpoint
  return app.fetch(new Request(new URL('/logout', c.req.url), {
    method: 'POST',
    headers: c.req.raw.headers,
    body: c.req.raw.body
  }), c.env)
})

// Admin session verification endpoint
app.get('/admin/verify', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ error: 'no_session_token' }, 401)
    }
    
    const now = toIso(new Date())
    const session = await c.env.DB.prepare(`
      SELECT s.*, u.email, u.name, u.is_admin, u.is_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > ? AND u.is_active = 1 AND u.is_admin = 1
    `).bind(sessionToken, now).first()
    
    if (!session) {
      return c.json({ error: 'invalid_session' }, 401)
    }
    
    // Update last activity
    await c.env.DB.prepare(`
      UPDATE user_sessions SET last_activity = ? WHERE session_token = ?
    `).bind(now, sessionToken).run()
    
    return c.json({
      success: true,
      user: {
        id: session.user_id,
        email: session.email,
        name: session.name,
        is_admin: true
      }
    })
  } catch (error) {
    console.error('[Admin Verify] ERROR:', error)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// ============================================================================
// ADMIN EVENT MANAGEMENT ENDPOINTS
// ============================================================================

// Middleware: Require admin authentication (session-based or legacy admin key)
async function requireAdmin(c, next) {
  // Try session-based auth first
  const sessionToken = c.req.header('X-Session-Token')
  if (sessionToken) {
    const now = toIso(new Date())
    const session = await c.env.DB.prepare(`
      SELECT s.*, u.email, u.name, u.is_admin, u.is_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > ? AND u.is_active = 1 AND u.is_admin = 1
    `).bind(sessionToken, now).first()
    
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

// Membership checkout with idempotency + Turnstile
app.post('/membership/checkout', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP')
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
      // Rate limiting: 3 requests per minute per IP (more restrictive for memberships)
    if (!checkRateLimit(ip, membershipCheckoutRateLimits, 3, 1)) {
      return c.json({ error: 'rate_limit_exceeded', message: 'Too many membership checkout requests. Please try again in a minute.' }, 429)
    }
    
    const idem = c.req.header('Idempotency-Key')?.trim()
    const { email, name, plan, privacyConsent, marketingConsent, turnstileToken, autoRenew, amount: customAmount } = await c.req.json()
    if (!email || !plan) return c.json({ error: 'missing_fields' }, 400)
    if (!EMAIL_RE.test(email) || email.length > 320) return c.json({ error:'invalid_email' },400)
    if (!privacyConsent) return c.json({ error: 'privacy_consent_required' }, 400)
    if (name && name.length > 200) return c.json({ error:'name_too_long' },400)
    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode)
    if (!tsOk) return c.json({ error:'turnstile_failed' },403)
    
    const ident = await getOrCreateIdentity(c.env.DB, email, clampStr(name,200))
    const svc = await getServiceForPlan(c.env.DB, plan)
    
    // Allow custom amount override for testing (works with any valid plan)
    // This lets you test with £1 instead of the full plan price
    let amount, currency
    if (customAmount) {
      // Custom amount provided - use it (for testing purposes)
      amount = Number(customAmount)
      currency = 'GBP'
      if (!Number.isFinite(amount) || amount <= 0) return c.json({ error:'invalid_amount' },400)
      console.log(`Using custom test amount: £${amount} for plan: ${plan}`)
    } else {
      // Normal flow - use service pricing
      if (!svc) return c.json({ error: 'unknown_plan' }, 400)
      amount = Number(svc.amount)
      if (!Number.isFinite(amount) || amount <= 0) return c.json({ error:'invalid_amount' },400)
      currency = svc.currency || c.env.CURRENCY || 'GBP'
    }
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
    }    const autoRenewValue = autoRenew ? 1 : 0
    
    // Insert minimal membership record (business logic only)
    const cols = ['user_id', 'plan','status','auto_renew','order_ref']
    const vals = [ident.id, plan,'pending', autoRenewValue, order_ref]
    const placeholders = cols.map(()=>'?').join(',')
    const mResult = await c.env.DB.prepare(`INSERT INTO memberships (${cols.join(',')}) VALUES (${placeholders}) RETURNING id`).bind(...vals).first()
    const membershipId = mResult?.id || (await c.env.DB.prepare('SELECT last_insert_rowid() as id').first()).id

    let checkout
    let customerId = null
    try {
      // Create or get SumUp customer if auto-renewal enabled
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
    }    // Store payment details in transactions table
    console.log('Creating transaction record with order_ref:', order_ref, 'checkout_id:', checkout.id)
    await c.env.DB.prepare(`
      INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref, 
                                checkout_id, amount, currency, payment_status, idempotency_key, consent_at)
      VALUES ('membership', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(membershipId, ident.id, email, clampStr(name,200), order_ref, checkout.id, 
            String(amount), currency, idem || null, toIso(new Date())).run()
    console.log('Transaction record created successfully')
    
    // Handle email preferences opt-in
    await handleEmailPreferencesOptIn(c.env.DB, ident.id, marketingConsent)
    
    return c.json({ 
      orderRef: order_ref, 
      checkoutId: checkout.id,
      membershipId,
      userId: ident.id,
      amount,
      currency,
      customerId: customerId || null
    })
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
  console.log('=== /membership/confirm called with orderRef:', orderRef)
  if (!orderRef || !UUID_RE.test(orderRef)) return c.json({ ok:false, error:'invalid_orderRef' },400)
  
  // Get transaction record
  console.log('Querying transactions table for order_ref:', orderRef)
  const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "membership"').bind(orderRef).first()
  console.log('Transaction query result:', transaction ? 'FOUND' : 'NOT FOUND', transaction)
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
  const identityId = pending.user_id
  const activeExisting = await getActiveMembership(c.env.DB, identityId)
  const svc = await getServiceForPlan(c.env.DB, pending.plan)
  if (!svc) return c.json({ ok:false, error:'plan_not_configured' },400)
  const months = Number(svc.months || 0)
  const baseStart = activeExisting ? new Date(activeExisting.end_date) : new Date()
  const end = addMonths(baseStart, months)
    // Save payment instrument for auto-renewal ONLY if auto_renew is enabled
  let instrumentId = null
  let actualPaymentId = payment.id // Default to the setup payment
    if (pending.auto_renew === 1) {
    instrumentId = await savePaymentInstrument(c.env.DB, identityId, transaction.checkout_id, c.env)
    
    // If we used SETUP_RECURRING_PAYMENT, SumUp will refund the initial charge
    // We need to make an actual charge using the saved payment instrument
    if (instrumentId && payment.purpose === 'SETUP_RECURRING_PAYMENT') {
      console.log('Setup payment detected - charging saved instrument for actual membership payment')
      try {
        const chargeResult = await chargePaymentInstrument(
          c.env,
          identityId,
          instrumentId,
          transaction.amount,
          transaction.currency || 'GBP',
          `${transaction.order_ref}-charge`,
          `Dice Bastion ${pending.plan} membership payment`
        )
        
        if (chargeResult && chargeResult.id) {
          actualPaymentId = chargeResult.id
          console.log('Successfully charged saved instrument:', actualPaymentId)
          
          // Card details are already saved by the payments worker in savePaymentInstrument
          // No need to fetch them again here
          
          // Create a transaction record for the actual charge
          await c.env.DB.prepare(`
            INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref, 
                                      payment_id, amount, currency, payment_status, created_at)
            VALUES ('membership_charge', ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?)
          `).bind(
            pending.id,
            identityId,
            transaction.email,
            transaction.name,
            `${transaction.order_ref}-charge`,
            actualPaymentId,
            transaction.amount,
            transaction.currency || 'GBP',
            toIso(new Date())
          ).run()
        } else {
          console.error('Failed to charge saved instrument - membership will still activate but payment may be refunded')
        }
      } catch (chargeError) {
        console.error('Error charging saved instrument:', chargeError)
        // Continue with activation - the setup payment was successful even if actual charge failed
      }
    }
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
  `).bind(actualPaymentId, toIso(new Date()), transaction.id).run()
  
  // Get user details and send welcome email
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(identityId).first()
  if (user) {
    const updatedMembership = { ...pending, end_date: toIso(end) }
    const emailContent = getWelcomeEmail(updatedMembership, user, pending.auto_renew === 1)
    await sendEmail(c.env, { 
      to: user.email, 
      ...emailContent,
      emailType: 'membership_welcome',
      relatedId: pending.id,
      relatedType: 'membership',
      metadata: { plan: pending.plan, auto_renew: pending.auto_renew }
    })
  }
  // Send admin notification
  try {
    const adminEmailContent = getAdminNotificationEmail('membership', {
      plan: pending.plan,
      customerName: user?.name || 'Customer',
      customerEmail: user?.email || 'unknown@example.com',
      amount: transaction.amount,
      autoRenew: pending.auto_renew === 1,
      membershipId: pending.id,
      orderRef: transaction.order_ref
    })
    
    await sendEmail(c.env, { 
      to: 'admin@dicebastion.com',
      ...adminEmailContent,
      emailType: 'admin_membership_notification',
      relatedId: pending.id,
      relatedType: 'membership',
      metadata: { plan: pending.plan, amount: transaction.amount }
    })
  } catch (adminEmailError) {
    console.error('Failed to send admin notification for membership:', adminEmailError)
    // Don't fail the main transaction if admin email fails
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
  
  // Verify webhook via payments worker
  try {
    const isValid = await verifyWebhook(c.env, payload)
    if (!isValid) {
      console.warn('Invalid webhook payload')
      return c.json({ error: 'invalid_webhook' }, 401)
    }
  } catch (e) {
    console.error('Webhook verification error:', e)
    return c.json({ error: 'verification_failed' }, 500)
  }
  
  if (!paymentId || !orderRef) return c.json({ ok: false }, 400)

  // Check for duplicate webhook processing
  const webhookId = `${paymentId}-${orderRef}` // Create unique webhook ID
  const isDuplicate = await checkAndMarkWebhookProcessed(c.env.DB, webhookId, 'membership', orderRef)
  if (isDuplicate) {
    console.log('Duplicate membership webhook received, skipping processing')
    return c.json({ ok: true, status: 'already_processed' })
  }

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
  const identityId = pending.user_id
  const memberActive = await getActiveMembership(c.env.DB, identityId)
  const baseStart = memberActive ? new Date(memberActive.end_date) : now
  const months = Number(svc.months || 0)
  const start = baseStart
  const end = addMonths(baseStart, months)
  await c.env.DB.prepare('UPDATE memberships SET status = "active", start_date = ?, end_date = ?, payment_id = ? WHERE id = ?').bind(toIso(start), toIso(end), paymentId, pending.id).run()
  
  // Save payment instrument if auto-renewal is enabled
  if (pending.auto_renew === 1) {
    console.log('Auto-renewal enabled, attempting to save payment instrument for checkout:', paymentId)
    const instrumentId = await savePaymentInstrument(c.env.DB, identityId, paymentId, c.env)
    if (instrumentId) {
      console.log('Payment instrument saved successfully:', instrumentId)
      // Store instrument ID in membership record for reference
      await c.env.DB.prepare('UPDATE memberships SET payment_instrument_id = ? WHERE id = ?')
        .bind(instrumentId, pending.id).run()
    } else {
      console.warn('Failed to save payment instrument, but membership activation will continue')
    }
  }
  
  // Send welcome email (critical - works even if user closed browser)
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(identityId).first()
  if (user) {
    const updatedMembership = { ...pending, end_date: toIso(end) }
    const emailContent = getWelcomeEmail(updatedMembership, user, pending.auto_renew === 1)
    await sendEmail(c.env, { 
      to: user.email, 
      ...emailContent,
      emailType: 'membership_welcome',
      relatedId: pending.id,
      relatedType: 'membership',
      metadata: { plan: pending.plan, auto_renew: pending.auto_renew }
    }).catch(err => {
      console.error('Webhook email failed:', err)
      // Don't fail webhook if email fails
    })
  }
    // Send admin notification
  try {
    const adminEmailContent = getAdminNotificationEmail('membership', {
      plan: pending.plan,
      customerName: user?.name || 'Customer',
      customerEmail: user?.email || 'unknown@example.com',
      amount: payment.amount,
      autoRenew: pending.auto_renew === 1,
      membershipId: pending.id,
      orderRef: orderRef
    })
    
    await sendEmail(c.env, { 
      to: 'admin@dicebastion.com',
      ...adminEmailContent,
      emailType: 'admin_membership_notification',
      relatedId: pending.id,
      relatedType: 'membership',
      metadata: { plan: pending.plan, amount: payment.amount }
    }).catch(err => {
      console.error('Webhook admin email failed:', err)
      // Don't fail webhook if admin email fails
    })
  } catch (adminEmailError) {
    console.error('Failed to send admin notification for membership (webhook):', adminEmailError)
  }
  
  return c.json({ ok: true })
})

// ==================== TEMPORARY OAUTH CALLBACK ====================
// This endpoint is used to capture the OAuth authorization code from SumUp
// After getting the refresh token, you can remove this endpoint

app.get('/oauth/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')
  const errorDescription = c.req.query('error_description')

  if (error) {
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth Error</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .error { background: #fee; border: 2px solid #c00; border-radius: 8px; padding: 20px; }
          h1 { color: #c00; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>❌ OAuth Authorization Failed</h1>
          <p><strong>Error:</strong> ${error}</p>
          <p><strong>Description:</strong> ${errorDescription || 'No description provided'}</p>
          <p>Please check your SumUp app configuration and try again.</p>
        </div>
      </body>
      </html>
    `)
  }

  if (!code) {
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>OAuth - No Code</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .warning { background: #ffc; border: 2px solid #fc0; border-radius: 8px; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="warning">
          <h1>⚠️ No Authorization Code</h1>
          <p>No authorization code was received from SumUp.</p>
        </div>
      </body>
      </html>
    `)
  }

  // Success - show the code to the user
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Success</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .success { background: #efe; border: 2px solid #0c0; border-radius: 8px; padding: 20px; }
        h1 { color: #080; }
        .code-box { background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin: 15px 0; font-family: monospace; word-break: break-all; }
        .copy-btn { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .copy-btn:hover { background: #45a049; }
        ol { text-align: left; }
        li { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="success">
        <h1>✅ Authorization Successful!</h1>
        <p><strong>Authorization Code:</strong></p>
        <div class="code-box" id="code">${code}</div>
        <button class="copy-btn" onclick="copyCode()">📋 Copy Code</button>
        
        <h2>Next Steps:</h2>
        <ol>
          <li>Copy the authorization code above</li>
          <li>Run the PowerShell script: <code>.\get-sumup-token-manual.ps1</code></li>
          <li>When prompted, paste the authorization code</li>
          <li>The script will exchange it for a refresh token</li>
          <li>Update the SUMUP_REFRESH_TOKEN secret in Cloudflare</li>
        </ol>
        
        <p><strong>State:</strong> ${state || 'N/A'}</p>
      </div>
      
      <script>
        function copyCode() {
          const codeText = document.getElementById('code').textContent;
          navigator.clipboard.writeText(codeText).then(() => {
            alert('✅ Code copied to clipboard!');
          }).catch(err => {
            console.error('Failed to copy:', err);
            alert('❌ Failed to copy. Please select and copy manually.');
          });
        }
      </script>
    </body>
    </html>
  `)
})

// ==================== END TEMPORARY OAUTH CALLBACK ====================

// ============================================================================
// PUBLIC EVENT ENDPOINTS
// ============================================================================

// Get all active events (public endpoint)
app.get('/events', async c => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        event_id as id,
        event_name as title,
        slug,
        description,
        full_description,
        event_datetime,
        location,
        membership_price,
        non_membership_price,
        capacity,
        tickets_sold,
        image_url,
        requires_purchase,
        is_recurring,
        recurrence_pattern,
        recurrence_end_date
      FROM events 
      WHERE is_active = 1 
        AND (event_datetime >= datetime('now') OR is_recurring = 1)
      ORDER BY event_datetime ASC
    `).all()
    
    // Calculate next occurrence for recurring events
    const now = new Date()
    const processedEvents = (results || []).map(event => {
      if (event.is_recurring === 1) {
        const nextOccurrence = calculateNextOccurrence(event, now)
        if (!nextOccurrence) {
          // Recurring event has ended
          return null
        }
        return {
          ...event,
          event_datetime: nextOccurrence.toISOString(),
          next_occurrence: nextOccurrence.toISOString()
        }
      }
      return event
    }).filter(e => e !== null)
    
    // Re-sort by calculated event_datetime
    processedEvents.sort((a, b) => 
      new Date(a.event_datetime) - new Date(b.event_datetime)
    )
    
    return c.json(processedEvents)
  } catch (err) {
    console.error('Error fetching events:', err)
    return c.json({ error: 'failed_to_fetch_events' }, 500)  }
})

// Confirm ticket purchase - MUST come before /events/:slug route!
app.get('/events/confirm', async c => {
  try {
    const orderRef = c.req.query('orderRef')
    if (!orderRef || !EVT_UUID_RE.test(orderRef)) return c.json({ ok:false, error:'invalid_orderRef' },400)
  
    // Get transaction record
    const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "ticket"').bind(orderRef).first()
    if (!transaction) {
      console.log('[events/confirm] Transaction not found for orderRef:', orderRef)
      return c.json({ ok:false, error:'order_not_found' },404)
    }
    
    console.log('[events/confirm] Transaction found:', { 
      id: transaction.id, 
      checkout_id: transaction.checkout_id, 
      payment_status: transaction.payment_status,
      reference_id: transaction.reference_id 
    })
    
    // Get ticket record
    const ticket = await c.env.DB.prepare('SELECT * FROM tickets WHERE id = ?').bind(transaction.reference_id).first()
    if (!ticket) {
      console.log('[events/confirm] Ticket not found for reference_id:', transaction.reference_id)
      return c.json({ ok:false, error:'ticket_not_found' },404)
    }
    
    console.log('[events/confirm] Ticket found:', { id: ticket.id, status: ticket.status, event_id: ticket.event_id })
    
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
    try { 
      payment = await fetchPayment(c.env, transaction.checkout_id)
      console.log('[events/confirm] SumUp payment status:', payment?.status, 'checkout_id:', transaction.checkout_id)
    } 
    catch (err) { 
      console.error('[events/confirm] Failed to fetch payment from SumUp:', err)
      return c.json({ ok:false, error:'verify_failed' },400) 
    }
    
    const paid = payment && (payment.status === 'PAID' || payment.status === 'SUCCESSFUL')
    if (!paid) {
      console.log('[events/confirm] Payment not yet paid, status:', payment?.status || 'PENDING')
      return c.json({ ok:false, status: payment?.status || 'PENDING' })
    }
    
    console.log('[events/confirm] Payment verified as PAID')
    
    // Verify amount/currency
    if (payment.amount != Number(transaction.amount) || (transaction.currency && payment.currency !== transaction.currency)) {
      console.log('[events/confirm] Payment mismatch - payment:', payment.amount, payment.currency, 'transaction:', transaction.amount, transaction.currency)
      return c.json({ ok:false, error:'payment_mismatch' },400)
    }

    // Get event details
    console.log('[events/confirm] Looking up event with event_id:', ticket.event_id)
    const ev = await c.env.DB.prepare('SELECT * FROM events WHERE event_id = ?').bind(ticket.event_id).first()
    console.log('[events/confirm] Event lookup result:', ev ? `Found: ${ev.event_name}` : 'NOT FOUND')
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
      await sendEmail(c.env, { 
        to: user.email, 
        ...emailContent,
        emailType: 'event_ticket_confirmation',
        relatedId: ticket.id,
        relatedType: 'ticket',
        metadata: { event_id: ev.id, event_name: ev.event_name }
      })
    }
    
    // Send admin notification for event tickets
    try {
      const adminEmailContent = getAdminNotificationEmail('event_ticket', {
        eventName: ev.event_name,
        customerName: user?.name || 'Customer',
        customerEmail: user?.email || transaction.email,
        amount: transaction.amount,
        eventDate: ev.event_datetime,
        ticketId: ticket.id,
        orderRef: transaction.order_ref
      })
      
      await sendEmail(c.env, { 
        to: 'admin@dicebastion.com',
        ...adminEmailContent,
        emailType: 'admin_event_notification',
        relatedId: ticket.id,
        relatedType: 'ticket',
        metadata: { event_id: ev.id, event_name: ev.event_name }
      })
    } catch (adminEmailError) {
      console.error('Failed to send admin notification for event ticket:', adminEmailError)
      // Don't fail the main transaction if admin email fails
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
  } catch (error) {
    console.error('[events/confirm] EXCEPTION:', error)
    return c.json({ ok: false, error: 'internal_error', message: error.message, stack: error.stack }, 500)
  }
})

// Get single event by slug (public endpoint)
app.get('/events/:slug', async c => {
  try {
    const slug = c.req.param('slug')
    
    const event = await c.env.DB.prepare(`
      SELECT 
        event_id as id,
        event_name as title,
        slug,
        description,
        full_description,
        event_datetime,
        location,
        membership_price,
        non_membership_price,
        capacity,
        tickets_sold,
        image_url,
        requires_purchase,
        is_recurring,
        recurrence_pattern,
        recurrence_end_date
      FROM events 
      WHERE slug = ? AND is_active = 1
    `).bind(slug).first()
      if (!event) {
      return c.json({ error: 'event_not_found' }, 404)
    }
    
    // Calculate next occurrence for recurring events
    if (event.is_recurring === 1) {
      const nextOccurrence = calculateNextOccurrence(event, new Date())
      if (!nextOccurrence) {
        return c.json({ error: 'event_ended' }, 404)
      }
      event.event_datetime = nextOccurrence.toISOString()
      event.next_occurrence = nextOccurrence.toISOString()
    }
    
    return c.json(event)
  } catch (err) {
    console.error('Error fetching event:', err)
    return c.json({ error: 'failed_to_fetch_event' }, 500)
  }
})

// ============================================================================
// ADMIN MEMBERSHIP MANAGEMENT ENDPOINT
// ============================================================================

// Get memberships (admin only)
app.get('/admin/memberships', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ error: 'no_session_token' }, 401)
    }
    
    const now = toIso(new Date())
    const session = await c.env.DB.prepare(`
      SELECT s.*, u.is_admin, u.is_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > ? AND u.is_active = 1 AND u.is_admin = 1
    `).bind(sessionToken, now).first()
    
    if (!session) {
      return c.json({ error: 'unauthorized' }, 401)
    }
    
    // Get filter parameter
    const url = new URL(c.req.url)
    const filter = url.searchParams.get('filter') || 'all'
      // Build query based on filter
    let whereClause = ''
    const thirtyDaysFromNow = toIso(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000))
    
    if (filter === 'active') {
      whereClause = `WHERE m.status = 'active' AND m.end_date > '${now}'`
    } else if (filter === 'expiring') {
      whereClause = `WHERE m.status = 'active' AND m.end_date > '${now}' AND m.end_date <= '${thirtyDaysFromNow}'`
    } else if (filter === 'expired') {
      whereClause = `WHERE m.status = 'active' AND m.end_date <= '${now}'`
    } else {
      whereClause = `WHERE m.status IN ('active', 'pending')`
    }
    
    // Get memberships with user details
    const memberships = await c.env.DB.prepare(`
      SELECT 
        m.id,
        m.user_id,
        m.plan,
        m.status,
        m.start_date,
        m.end_date,
        m.auto_renew,
        m.amount,
        m.currency,
        m.order_ref,
        u.email,
        u.name
      FROM memberships m
      JOIN users u ON m.user_id = u.user_id
      ${whereClause}
      ORDER BY m.end_date ASC
    `).all()
    
    // Calculate stats
    const statsData = await c.env.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'active' AND end_date > ? THEN 1 END) as total_active,
        COUNT(CASE WHEN status = 'active' AND end_date > ? AND end_date <= ? THEN 1 END) as expiring_soon,
        COUNT(CASE WHEN auto_renew = 1 AND status = 'active' AND end_date > ? THEN 1 END) as auto_renew_count,
        SUM(CASE 
          WHEN status = 'active' AND end_date > ? THEN 
            CASE 
              WHEN plan = 'monthly' THEN 10.00
              WHEN plan = 'quarterly' THEN 8.33
              WHEN plan = 'annual' THEN 7.50
              ELSE 0 
            END
          ELSE 0 
        END) as monthly_revenue
      FROM memberships
    `).bind(now, now, thirtyDaysFromNow, now, now).first()
    
    const stats = {
      total_active: statsData.total_active || 0,
      expiring_soon: statsData.expiring_soon || 0,
      auto_renew_count: statsData.auto_renew_count || 0,
      monthly_revenue: statsData.monthly_revenue ? Math.round(statsData.monthly_revenue * 100) / 100 : 0
    }
    
    return c.json({
      success: true,
      memberships: memberships.results || [],
      stats
    })
    
  } catch (error) {
    console.error('Error fetching memberships:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)  }
})

// ============================================================================
// ADMIN CRON JOB LOGS ENDPOINT
// ============================================================================

// Get cron job logs (admin only)
app.get('/admin/cron-logs', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ error: 'no_session_token' }, 401)
    }
    
    const now = toIso(new Date())
    const session = await c.env.DB.prepare(`
      SELECT s.*, u.is_admin, u.is_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > ? AND u.is_active = 1 AND u.is_admin = 1
    `).bind(sessionToken, now).first()
    
    if (!session) {
      return c.json({ error: 'unauthorized' }, 401)
    }
    
    // Get query parameters
    const url = new URL(c.req.url)
    const jobName = url.searchParams.get('job_name') // Optional filter by job name
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    // Build query
    let query = `
      SELECT 
        log_id,
        job_name,
        started_at,
        completed_at,
        status,
        records_processed,
        records_succeeded,
        records_failed,
        error_message,
        details
      FROM cron_job_log
    `
    const params = []
    
    if (jobName) {
      query += ` WHERE job_name = ?`
      params.push(jobName)
    }
    
    query += ` ORDER BY started_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)
    
    const logs = await c.env.DB.prepare(query).bind(...params).all()
    
    // Get summary stats for each job type
    const summaryQuery = `
      SELECT 
        job_name,
        COUNT(*) as total_runs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial,
        MAX(started_at) as last_run,
        SUM(records_processed) as total_processed,
        SUM(records_succeeded) as total_succeeded,
        SUM(records_failed) as total_failed
      FROM cron_job_log
      WHERE started_at > datetime('now', '-7 days')
      GROUP BY job_name
    `
    const summary = await c.env.DB.prepare(summaryQuery).all()
    
    return c.json({
      success: true,
      logs: logs.results || [],
      summary: summary.results || [],
      pagination: {
        limit,
        offset,
        count: logs.results?.length || 0
      }
    })
  } catch (error) {
    console.error('[Cron Logs] ERROR:', error)
    return c.json({ error: 'internal_error', message: error.message }, 500)  }
})

// ============================================================================
// ADMIN EVENT MANAGEMENT ENDPOINTS
// ============================================================================

// Create new event (admin only)
app.post('/admin/events', requireAdmin, async c => {
  try {
    const { title, slug, description, full_description, event_date, time, membership_price, non_membership_price, max_attendees, location, image_url, requires_purchase, is_active, is_recurring, recurrence_pattern, recurrence_end_date } = await c.req.json()
    
    if (!title || !slug || !event_date) {
      return c.json({ error: 'missing_required_fields' }, 400)
    }
    
    // Combine date and time
    const datetime = time ? `${event_date}T${time}:00` : `${event_date}T00:00:00`
    
    const result = await c.env.DB.prepare(`
      INSERT INTO events (event_name, slug, description, full_description, event_datetime, location, membership_price, non_membership_price, capacity, tickets_sold, image_url, requires_purchase, is_active, is_recurring, recurrence_pattern, recurrence_end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      slug,
      description || null,
      full_description || null,
      datetime,
      location || null,
      membership_price || 0,
      non_membership_price || 0,
      max_attendees || null,
      image_url || null,
      requires_purchase !== undefined ? requires_purchase : 1,
      is_active !== undefined ? is_active : 1,
      is_recurring || 0,
      recurrence_pattern || null,
      recurrence_end_date || null
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e) {
    console.error('Create event error:', e)
    if (e.message && e.message.includes('UNIQUE constraint')) {
      return c.json({ error: 'slug_already_exists' }, 400)
    }
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Update event (admin only)
app.put('/admin/events/:id', requireAdmin, async c => {
  try {
    const id = c.req.param('id')
    const { title, slug, description, full_description, event_date, time, membership_price, non_membership_price, max_attendees, location, image_url, requires_purchase, is_active, is_recurring, recurrence_pattern, recurrence_end_date } = await c.req.json()
    
    if (!title || !slug || !event_date) {
      return c.json({ error: 'missing_required_fields' }, 400)
    }
    
    // Combine date and time
    const datetime = time ? `${event_date}T${time}:00` : `${event_date}T00:00:00`
    
    await c.env.DB.prepare(`
      UPDATE events 
      SET event_name = ?, slug = ?, description = ?, full_description = ?, event_datetime = ?, location = ?, membership_price = ?, non_membership_price = ?, capacity = ?, image_url = ?, requires_purchase = ?, is_active = ?, is_recurring = ?, recurrence_pattern = ?, recurrence_end_date = ?
      WHERE event_id = ?
    `).bind(
      title,
      slug,
      description || null,
      full_description || null,
      datetime,
      location || null,
      membership_price || 0,
      non_membership_price || 0,
      max_attendees || null,
      image_url || null,
      requires_purchase !== undefined ? requires_purchase : 1,
      is_active !== undefined ? is_active : 1,
      is_recurring || 0,
      recurrence_pattern || null,
      recurrence_end_date || null,
      id
    ).run()
    
    return c.json({ success: true })
  } catch (e) {
    console.error('Update event error:', e)
    if (e.message && e.message.includes('UNIQUE constraint')) {
      return c.json({ error: 'slug_already_exists' }, 400)
    }
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Delete event (admin only)
app.delete('/admin/events/:id', requireAdmin, async c => {
  try {
    const id = c.req.param('id')
    
    // Check if event has tickets sold
    const event = await c.env.DB.prepare('SELECT tickets_sold FROM events WHERE event_id = ?').bind(id).first()
    if (!event) {
      return c.json({ error: 'not_found' }, 404)
    }
    
    if (event.tickets_sold > 0) {
      return c.json({ error: 'cannot_delete_event_with_tickets' }, 400)
    }
    
    await c.env.DB.prepare('DELETE FROM events WHERE event_id = ?').bind(id).run()
    
    return c.json({ success: true })
  } catch (e) {
    console.error('Delete event error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Create ticket checkout with idempotency + Turnstile
app.post('/events/:id/checkout', async c => {
  try {
    const id = c.req.param('id')
    if (!id || isNaN(Number(id))) return c.json({ error:'invalid_event_id' },400)
    const evId = Number(id)
    const ip = c.req.header('CF-Connecting-IP')
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    
    // Rate limiting: 5 requests per minute per IP (same as shop checkout)
    if (!checkRateLimit(ip, eventCheckoutRateLimits, 5, 1)) {
      return c.json({ error: 'rate_limit_exceeded', message: 'Too many event checkout requests. Please try again in a minute.' }, 429)
    }
    
    const idem = c.req.header('Idempotency-Key')?.trim()
    const { email, name, privacyConsent, marketingConsent, turnstileToken } = await c.req.json()
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
    }    // Insert minimal ticket record (business logic only)
    const colParts = ['event_id', 'user_id', 'status', 'created_at']
    const bindVals = [evId, ident.id, 'pending', toIso(new Date())]
    
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
                                checkout_id, amount, currency, payment_status, idempotency_key)
      VALUES ('ticket', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(ticketId, ident.id, email, clampStr(name,200), order_ref, checkout.id,
            String(amount), currency, idem || null).run()
    
    // Handle email preferences opt-in
    await handleEmailPreferencesOptIn(c.env.DB, ident.id, marketingConsent)
    
    return c.json({ orderRef: order_ref, checkoutId: checkout.id })
  } catch (e) {
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    console.error('events checkout error', e)
    return c.json(debugMode ? { error:'internal_error', detail: String(e), stack: String(e?.stack||'') } : { error:'internal_error' },500)
  }
})

// Optional tiny debug endpoint
app.get('/_debug/ping', c => {
  const origin = c.req.header('Origin') || ''
  const allowed = (c.env.ALLOWED_ORIGIN || '').split(',').map(s=>s.trim()).filter(Boolean)
  const allow = allowed.includes(origin) ? origin : (allowed[0] || '')
  return c.json({ ok:true, origin, allow, allowed })
})

// Debug endpoint to test event/transaction lookup
app.get('/_debug/event-confirm/:orderRef', async c => {
  const orderRef = c.req.param('orderRef')
  
  const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "ticket"').bind(orderRef).first()
  if (!transaction) return c.json({ error: 'transaction_not_found' })
  
  const ticket = await c.env.DB.prepare('SELECT * FROM tickets WHERE id = ?').bind(transaction.reference_id).first()
  if (!ticket) return c.json({ error: 'ticket_not_found' })
  
  const event = await c.env.DB.prepare('SELECT * FROM events WHERE event_id = ?').bind(ticket.event_id).first()
  
  return c.json({
    transaction,
    ticket,
    event: event || null,
    event_found: !!event
  })
})

// Debug endpoint to check SumUp payment status
app.get('/_debug/sumup-payment/:checkoutId', async c => {
  const checkoutId = c.req.param('checkoutId')
  
  try {
    const payment = await fetchPayment(c.env, checkoutId)
    return c.json({
      checkout_id: checkoutId,
      payment_status: payment?.status,
      payment_amount: payment?.amount,
      payment_currency: payment?.currency,
      payment_full: payment
    })
  } catch (err) {
    return c.json({
      error: 'failed_to_fetch',
      message: err.message
    }, 500)
  }
})

// Debug schema inspector
app.get('/_debug/schema', async c => {
  try {
    const s = await getSchema(c.env.DB)
    const memberships = await c.env.DB.prepare('PRAGMA table_info(memberships)').all().catch(()=>({ results: [] }))
    const tickets = await c.env.DB.prepare('PRAGMA table_info(tickets)').all().catch(()=>({ results: [] }))
    const tables = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().catch(()=>({ results: [] }))
    const ticketFkCol = 'user_id'
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
    await c.env.DB.prepare('UPDATE memberships SET auto_renew = 0, payment_instrument_id = NULL WHERE user_id = ? AND status = "active"')
      .bind(ident.id).run()
    
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
  
  try {    await ensureSchema(c.env.DB, 'user_id')
    
    const ident = await findIdentityByEmail(c.env.DB, email)
    if (!ident) return c.json({ error: 'user_not_found' }, 404)
    
    // Find active membership with auto-renewal
    const membership = await c.env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE user_id = ?
        AND status = 'active' 
        AND auto_renew = 1
      LIMIT 1
    `).bind(ident.id).first()
    
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

// Test endpoint to manually trigger event reminders
app.get('/test/event-reminders', async (c) => {
  try {
    console.log('[TEST] Manually triggering event reminders...')
    
    // Call the processEventReminders function
    await processEventReminders(c.env)
    
    return c.json({ 
      success: true, 
      message: 'Event reminders processed. Check logs for details.',
      timestamp: new Date().toISOString()
    })
  } catch (e) {
    console.error('[TEST] Event reminder test error:', e)
    return c.json({ 
      success: false, 
      error: String(e.message || e), 
      stack: String(e.stack || '') 
    }, 500)
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
      SELECT id, name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, is_active, release_date, created_at
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
    
    const { name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, release_date } = await c.req.json()
    
    if (!name || !slug || price === undefined) {
      return c.json({ error: 'missing_required_fields' }, 400)
    }
    
    const now = toIso(new Date())
    const result = await c.env.DB.prepare(`
      INSERT INTO products (name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, release_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      release_date || null,
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
    const { name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, is_active, release_date } = await c.req.json()
    
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
    if (release_date !== undefined) { updates.push('release_date = ?'); binds.push(release_date) }
    
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
// SHOP CHECKOUT ENDPOINTS
// ============================================================================

// Test endpoint to verify email configuration
app.post('/test/email', async (c) => {
  try {
    const { email } = await c.req.json()
    if (!email || !EMAIL_RE.test(email)) {
      return c.json({ error: 'Invalid email address' }, 400)
    }
    
    const result = await sendEmail(c.env, {
      to: email,
      subject: '🧪 Test Email from Dice Bastion Worker',
      html: `
        <h1>Test Email Successful!</h1>
        <p>Hi there,</p>
        <p>This is a test email from your Dice Bastion Cloudflare Worker.</p>
        <p><strong>✅ Your email system is working correctly!</strong></p>
        <ul>
          <li>MailerSend API key is configured</li>
          <li>Email sending is functional</li>
          <li>DNS records are properly set up</li>
        </ul>
        <p>You can now process payments with confidence that confirmation emails will be sent.</p>
        <hr>
        <p style="color: #666; font-size: 0.9rem;">Sent at: ${new Date().toISOString()}</p>
      `,
      emailType: 'test',
      relatedType: 'test'
    })
    
  return c.json(result)
  } catch (e) {
    console.error('Test email error:', e)
    return c.json({ success: false, error: String(e) }, 500)
  }
})

// ============================================================================
// SCHEDULED HANDLER (CRON)
// ============================================================================

/**
 * Log a cron job activity to the database
 */
async function logCronJob(db, jobName, status, details = {}) {
  const now = new Date().toISOString()
  
  const logData = {
    job_name: jobName,
    started_at: details.started_at || now,
    completed_at: status !== 'running' ? now : null,
    status: status,
    records_processed: details.records_processed || 0,
    records_succeeded: details.records_succeeded || 0,
    records_failed: details.records_failed || 0,
    error_message: details.error_message || null,
    details: details.extra ? JSON.stringify(details.extra) : null
  }
  
  try {
    await db.prepare(`
      INSERT INTO cron_job_log (
        job_name, started_at, completed_at, status,
        records_processed, records_succeeded, records_failed,
        error_message, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logData.job_name,
      logData.started_at,
      logData.completed_at,
      logData.status,
      logData.records_processed,
      logData.records_succeeded,
      logData.records_failed,
      logData.error_message,
      logData.details
    ).run()
    
    console.log(`[CRON] Logged ${jobName}: ${status}`, details)
  } catch (e) {
    console.error(`[CRON] Failed to log ${jobName}:`, e)
  }
}

/**
 * Process membership auto-renewals
 * 1. Sends warning emails 7 days before renewal
 * 2. Processes renewals for memberships expiring today or past-due (grace period)
 * 3. Marks expired memberships after grace period ends
 */
async function processAutoRenewals(env) {
  const jobName = 'auto_renewals'
  const startedAt = new Date().toISOString()
  const today = new Date().toISOString().split('T')[0]
  
  // Calculate warning date (7 days from now)
  const warningDate = new Date()
  warningDate.setDate(warningDate.getDate() + 7)
  const warningDateStr = warningDate.toISOString().split('T')[0]
    // Calculate grace period start (1 day ago)
  const gracePeriodStart = new Date()
  gracePeriodStart.setDate(gracePeriodStart.getDate() - 1)
  const gracePeriodStartStr = gracePeriodStart.toISOString().split('T')[0]
  
  console.log(`[CRON] Starting ${jobName} at ${startedAt}`)
  console.log(`[CRON] Today: ${today}`)
  console.log(`[CRON] Warning date (7 days ahead): ${warningDateStr}`)
  console.log(`[CRON] Grace period start (1 day ago): ${gracePeriodStartStr}`)
  
  let processed = 0
  let succeeded = 0
  let failed = 0
  let warningsSent = 0
  let expired = 0
  const errors = []
  
  try {
    // ========================================================================
    // STEP 1: Send warning emails for memberships expiring in 7 days
    // ========================================================================
    console.log(`[CRON] Step 1: Checking for memberships needing warning emails...`)
      const warningMemberships = await env.DB.prepare(`
      SELECT 
        m.id,
        m.user_id,
        m.plan,
        m.end_date,
        m.renewal_warning_sent,
        u.email,
        u.name
      FROM memberships m
      JOIN users u ON m.user_id = u.user_id
      WHERE m.end_date = ?
        AND m.auto_renew = 1
        AND m.status = 'active'
        AND (m.renewal_warning_sent = 0 OR m.renewal_warning_sent IS NULL)
    `).bind(warningDateStr).all()
    
    console.log(`[CRON] Found ${warningMemberships.results?.length || 0} memberships needing warnings`)
    
    for (const membership of (warningMemberships.results || [])) {
      try {
        // Get payment instrument info for warning email
        const instrument = await getActivePaymentInstrument(env.DB, membership.user_id)
        const membershipWithInstrument = {
          ...membership,
          payment_instrument_last_4: instrument?.last_4 || null
        }
        
        const emailContent = getUpcomingRenewalEmail(membershipWithInstrument, membership, 7)
        await sendEmail(env, {
          to: membership.email,
          ...emailContent,
          emailType: 'membership_renewal_reminder',
          relatedId: membership.id,
          relatedType: 'membership',
          metadata: { plan: membership.plan, days_until_renewal: 7 }
        })
        
        // Mark warning as sent
        await env.DB.prepare('UPDATE memberships SET renewal_warning_sent = 1 WHERE id = ?')
          .bind(membership.id).run()
        
        warningsSent++
        console.log(`[CRON] Warning sent for membership ${membership.id} (${membership.email})`)
      } catch (err) {
        console.error(`[CRON] Failed to send warning for membership ${membership.id}:`, err)
        errors.push({
          membership_id: membership.id,
          email: membership.email,
          action: 'warning_email',
          error: err.message
        })
      }
    }
    
    // ========================================================================
    // STEP 2: Process renewals for memberships expiring today or past-due
    // ========================================================================
    console.log(`[CRON] Step 2: Checking for memberships to renew...`)
      const renewalMemberships = await env.DB.prepare(`
      SELECT 
        m.id,
        m.user_id,
        m.plan,
        m.end_date,
        m.renewal_attempts,
        m.amount,
        u.email,
        u.name
      FROM memberships m
      JOIN users u ON m.user_id = u.user_id
      WHERE m.end_date <= ?
        AND m.end_date >= ?
        AND m.auto_renew = 1
        AND m.status = 'active'
        AND (m.renewal_attempts < 3 OR m.renewal_attempts IS NULL)
    `).bind(today, gracePeriodStartStr).all()
    
    processed = renewalMemberships.results?.length || 0
    console.log(`[CRON] Found ${processed} memberships to renew (including grace period)`)
    
    // Process each renewal using the existing processMembershipRenewal function
    for (const membership of (renewalMemberships.results || [])) {
      try {
        console.log(`[CRON] Processing renewal for membership ${membership.id} (${membership.email})`)
        const result = await processMembershipRenewal(env.DB, membership, env)
        
        if (result.success) {
          succeeded++
          console.log(`[CRON] ✓ Successfully renewed membership ${membership.id}`)
        } else {
          failed++
          errors.push({
            membership_id: membership.id,
            email: membership.email,
            action: 'renewal',
            error: result.error,
            attempts: result.attempts
          })
          console.error(`[CRON] ✗ Failed to renew membership ${membership.id}: ${result.error}`)
        }
      } catch (err) {
        failed++
        errors.push({
          membership_id: membership.id,
          email: membership.email,
          action: 'renewal',
          error: err.message
        })
        console.error(`[CRON] ✗ Exception renewing membership ${membership.id}:`, err)
      }
    }
      // ========================================================================
    // STEP 3: Mark expired memberships
    // ========================================================================
    console.log(`[CRON] Step 3: Checking for expired memberships...`)
    
    // First, expire memberships without auto-renewal that have passed their end_date
    const expiredNoAutoRenewResult = await env.DB.prepare(`
      UPDATE memberships
      SET status = 'expired'
      WHERE end_date < ?
        AND status = 'active'
        AND auto_renew = 0
    `).bind(today).run()
    
    const expiredNoAutoRenew = expiredNoAutoRenewResult.meta?.changes || 0
    console.log(`[CRON] Marked ${expiredNoAutoRenew} non-auto-renewing memberships as expired`)
    
    // Then, expire memberships with auto-renewal that have exhausted grace period (1 day)
    const expiredGracePeriodResult = await env.DB.prepare(`
      UPDATE memberships
      SET status = 'expired'
      WHERE end_date < ?
        AND status = 'active'
        AND auto_renew = 1
        AND renewal_attempts >= 3
    `).bind(gracePeriodStartStr).run()
    
    const expiredGracePeriod = expiredGracePeriodResult.meta?.changes || 0
    console.log(`[CRON] Marked ${expiredGracePeriod} auto-renewal memberships as expired (grace period ended)`)
    
    expired = expiredNoAutoRenew + expiredGracePeriod
    console.log(`[CRON] Total memberships marked as expired: ${expired}`)
    
    // Log final results
    console.log(`[CRON] ${jobName} summary:`)
    console.log(`  - Warnings sent: ${warningsSent}`)
    console.log(`  - Renewals processed: ${processed}`)
    console.log(`  - Renewals succeeded: ${succeeded}`)
    console.log(`  - Renewals failed: ${failed}`)
    console.log(`  - Memberships expired: ${expired}`)
    
    try {
      await logCronJob(env.DB, jobName, failed > 0 ? 'partial' : 'completed', {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        extra: {
          warnings_sent: warningsSent,
          expired_count: expired,
          errors: errors.length > 0 ? errors : undefined
        }
      })
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log success:`, logErr)
    }
    
  } catch (err) {
    console.error(`[CRON] ${jobName} failed:`, err)
    try {
      await logCronJob(env.DB, jobName, 'failed', {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        error_message: err.message,
        extra: {
          warnings_sent: warningsSent,
          expired_count: expired,
          errors: errors.length > 0 ? errors : undefined
        }
      })
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log error:`, logErr)
    }
  }
}

/**
 * Process event reminders
 * Sends reminder emails for upcoming events
 */
async function processEventReminders(env) {
  const jobName = 'event_reminders'
  const startedAt = new Date().toISOString()
  
  console.log(`[CRON] Starting ${jobName} at ${startedAt}`)
  
  let processed = 0
  let succeeded = 0
  let failed = 0
  const errors = []
  
  try {    // Find events happening tomorrow (24-hour reminder)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]
    
    // Note: events table uses event_name, not title; also no event_time column
    const upcomingEvents = await env.DB.prepare(`
      SELECT 
        e.event_id,
        e.event_name as title,
        e.event_datetime,
        COUNT(t.id) as ticket_count
      FROM events e
      LEFT JOIN tickets t ON e.event_id = t.event_id AND t.status IN ('confirmed', 'active')
      WHERE DATE(e.event_datetime) = ?
        AND e.is_active = 1
      GROUP BY e.event_id
    `).bind(tomorrowDate).all()
    
    processed = upcomingEvents.results?.length || 0
    console.log(`[CRON] Found ${processed} events with reminders to send`)
    
    if (processed === 0) {
      await logCronJob(env.DB, jobName, 'completed', {
        started_at: startedAt,
        records_processed: 0,
        records_succeeded: 0,
        records_failed: 0
      })
      return
    }      // Process reminders for each event
    for (const event of upcomingEvents.results) {
      try {        // Get attendees for this event
        const attendees = await env.DB.prepare(`
          SELECT 
            t.id as ticket_id,
            t.user_id,
            t.status,
            u.email,
            u.name,
            tr.order_ref
          FROM tickets t
          JOIN users u ON t.user_id = u.user_id
          LEFT JOIN transactions tr ON tr.reference_id = t.id AND tr.transaction_type = 'ticket'
          WHERE t.event_id = ?
            AND t.status IN ('confirmed', 'active')
        `).bind(event.event_id).all()
        
        const attendeeCount = attendees.results?.length || 0
        console.log(`[CRON] Sending ${attendeeCount} reminders for event: ${event.title}`)
        
        if (attendeeCount === 0) {
          console.log(`[CRON] No attendees found for event ${event.event_id}`)
          succeeded++
          continue
        }
        
        // Get full event details
        const fullEvent = await env.DB.prepare(`
          SELECT * FROM events WHERE event_id = ?
        `).bind(event.event_id).first()
        
        if (!fullEvent) {
          throw new Error(`Event ${event.event_id} not found`)
        }
        
        // Check if we should send reminders (uses shouldSendEventReminder helper)
        if (!shouldSendEventReminder(fullEvent.event_datetime)) {
          console.log(`[CRON] Event ${event.event_id} is not within reminder window`)
          succeeded++
          continue
        }
        
        // Send reminder email to each attendee
        let emailsSent = 0
        let emailsFailed = 0
          for (const attendee of attendees.results) {
          try {
            console.log(`[CRON] Generating email for ${attendee.email}...`)
            const emailContent = getEventReminderEmail(fullEvent, attendee, attendee)
            console.log(`[CRON] Email content generated, subject: ${emailContent.subject}`)
            
            const emailResult = await sendEmail(env, {
              to: attendee.email,
              ...emailContent,
              emailType: 'event_reminder',
              relatedId: attendee.ticket_id,
              relatedType: 'ticket',
              metadata: { 
                event_id: event.event_id, 
                event_name: fullEvent.event_name,
                event_date: fullEvent.event_datetime
              }
            })
            
            console.log(`[CRON] Email send result:`, emailResult)
            
            if (emailResult.success === false) {
              throw new Error(emailResult.error || 'Email send failed')
            }
            
            emailsSent++
            console.log(`[CRON] ✓ Sent reminder to ${attendee.email} for event ${event.title}`)
          } catch (emailErr) {
            emailsFailed++
            console.error(`[CRON] ✗ Failed to send reminder to ${attendee.email}:`, emailErr.message || emailErr)
            console.error(`[CRON] Error stack:`, emailErr.stack)
          }
        }
        
        console.log(`[CRON] Event ${event.title}: ${emailsSent} sent, ${emailsFailed} failed`)
        
        if (emailsFailed === 0) {
          succeeded++
        } else if (emailsSent > 0) {
          // Partial success
          succeeded++
          failed++
          errors.push({
            event_id: event.event_id,
            title: event.title,
            error: `${emailsFailed} of ${attendeeCount} emails failed`
          })
        } else {
          // Total failure
          failed++
          errors.push({
            event_id: event.event_id,
            title: event.title,
            error: `All ${attendeeCount} emails failed`
          })
        }
      } catch (err) {
        failed++
        errors.push({
          event_id: event.event_id,
          title: event.title,
          error: err.message
        })
        console.error(`[CRON] Failed to process reminders for event ${event.event_id}:`, err)
      }
    }
    
    try {
      await logCronJob(env.DB, jobName, failed > 0 ? 'partial' : 'completed', {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        extra: { errors: errors.length > 0 ? errors : undefined }
      })
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log success:`, logErr)
    }
    
  } catch (err) {
    console.error(`[CRON] ${jobName} failed:`, err)
    try {
      await logCronJob(env.DB, jobName, 'failed', {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        error_message: err.message,
        extra: { errors: errors.length > 0 ? errors : undefined }
      })
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log error:`, logErr)
    }
  }
}

/**
 * Reconcile payment statuses
 * Checks for stuck/pending payments and syncs with Stripe
 */
async function processPaymentReconciliation(env) {
  const jobName = 'payment_reconciliation'
  const startedAt = new Date().toISOString()
  
  console.log(`[CRON] Starting ${jobName} at ${startedAt}`)
  
  let processed = 0
  let succeeded = 0
  let failed = 0
  const errors = []
  
  try {    // Find payments stuck in pending/processing for more than 1 hour
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)
    const cutoffTime = oneHourAgo.toISOString()
    
    // Use transactions table instead of checkout_sessions
    const stuckPayments = await env.DB.prepare(`
      SELECT 
        checkout_id,
        order_ref,
        payment_status as status,
        created_at
      FROM transactions
      WHERE payment_status IN ('pending', 'processing')
        AND created_at < ?
      LIMIT 100
    `).bind(cutoffTime).all()
    
    processed = stuckPayments.results?.length || 0
    console.log(`[CRON] Found ${processed} stuck payments to reconcile`)
    
    if (processed === 0) {
      await logCronJob(env.DB, jobName, 'completed', {
        started_at: startedAt,
        records_processed: 0,
        records_succeeded: 0,
        records_failed: 0
      })
      return
    }
    
    // Check each payment with Stripe
    for (const payment of stuckPayments.results) {
      try {        // TODO: Query Stripe/SumUp API to get actual payment status
        console.log(`[CRON] Would check payment status for order_ref: ${payment.order_ref}`)
        
        // Future implementation:
        // 1. Call payment provider API to get payment intent status
        // 2. Update transactions payment_status accordingly
        // 3. If failed, update memberships/tickets to 'cancelled'
        // 4. Send appropriate notification emails
          succeeded++
      } catch (err) {
        failed++
        errors.push({
          checkout_id: payment.checkout_id,
          order_ref: payment.order_ref,
          error: err.message
        })
        console.error(`[CRON] Failed to reconcile payment ${payment.order_ref}:`, err)
      }
    }
    
    try {
      await logCronJob(env.DB, jobName, failed > 0 ? 'partial' : 'completed', {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        extra: { errors: errors.length > 0 ? errors : undefined }
      })
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log success:`, logErr)
    }
    
  } catch (err) {
    console.error(`[CRON] ${jobName} failed:`, err)
    try {
      await logCronJob(env.DB, jobName, 'failed', {
        started_at: startedAt,
        records_processed: processed,
        records_succeeded: succeeded,
        records_failed: failed,
        error_message: err.message,
        extra: { errors: errors.length > 0 ? errors : undefined }
      })
    } catch (logErr) {
      console.error(`[CRON] ${jobName} - Failed to log error:`, logErr)
    }
  }
}

/**
 * Main scheduled handler - runs all cron jobs
 * Scheduled to run daily at 2 AM UTC
 */
async function handleScheduled(event, env, ctx) {
  const runStarted = new Date().toISOString()
  console.log('============================================')
  console.log('Scheduled cron triggered at:', runStarted)
  console.log('============================================')
  
  const jobResults = {
    auto_renewals: null,
    event_reminders: null,
    payment_reconciliation: null
  }
  
  // Run all cron jobs sequentially, catching errors individually
  try {
    await processAutoRenewals(env)
    jobResults.auto_renewals = 'completed'
  } catch (e) {
    console.error('[CRON MASTER] Auto renewals failed:', e)
    jobResults.auto_renewals = 'failed'
    // Individual job already logged its own error
  }
  
  try {
    await processEventReminders(env)
    jobResults.event_reminders = 'completed'
  } catch (e) {
    console.error('[CRON MASTER] Event reminders failed:', e)
    jobResults.event_reminders = 'failed'
    // Individual job already logged its own error
  }
  
  try {
    await processPaymentReconciliation(env)
    jobResults.payment_reconciliation = 'completed'
  } catch (e) {
    console.error('[CRON MASTER] Payment reconciliation failed:', e)
    jobResults.payment_reconciliation = 'failed'
    // Individual job already logged its own error
  }
  
  console.log('============================================')
  console.log('All cron jobs completed at:', new Date().toISOString())
  console.log('Job Results:', jobResults)
  console.log('============================================')
  
  // Log the master cron run
  const allSucceeded = Object.values(jobResults).every(r => r === 'completed')
  const someFailed = Object.values(jobResults).some(r => r === 'failed')
    try {
    await logCronJob(env.DB, 'cron_master', allSucceeded ? 'completed' : 'partial', {
      started_at: runStarted,
      records_processed: 3,
      records_succeeded: Object.values(jobResults).filter(r => r === 'completed').length,
      records_failed: Object.values(jobResults).filter(r => r === 'failed').length,
      extra: jobResults
    })
  } catch (logErr) {
    console.error('[CRON MASTER] Failed to log master run:', logErr)
  }
}

export default {
  fetch: app.fetch,
  scheduled: handleScheduled
}