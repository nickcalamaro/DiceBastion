import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { createHmac } from 'crypto'
import { calculateNextOccurrence } from './utils/recurring.js'
import { getEventReminderEmail } from './email-templates/event-reminder.js'
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
  } else if (origin && (allowed.includes(origin) || (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')))) {
    // Allow configured origins OR any localhost/127.0.0.1 origin for development
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

// ============================================================================
// GOOGLE INDEXING API - JWT Auth + URL Notification
// ============================================================================

/**
 * In-memory cache for the Google OAuth2 access token.
 * Tokens are valid for ~3600 s; we refresh 5 min early.
 */
let _googleTokenCache = { token: null, expiresAt: 0 }

/**
 * Base64url-encode a string or ArrayBuffer (no padding).
 */
function b64url(input) {
  const bytes = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : new Uint8Array(input)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Import a PEM-encoded RSA private key for RS256 signing (Web Crypto).
 */
async function importPrivateKey(pem) {
  const stripped = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binaryDer = Uint8Array.from(atob(stripped), c => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

/**
 * Build and sign a Google-style JWT (RS256).
 * @returns {string} Compact JWS  (header.payload.signature)
 */
async function buildJWT(clientEmail, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }
  const unsigned = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload))
  const key = await importPrivateKey(privateKeyPem)
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
  return unsigned + '.' + b64url(sig)
}

/**
 * Exchange a signed JWT for a short-lived OAuth2 access token.
 * Caches the token in memory until 5 min before expiry.
 */
async function getGoogleAccessToken(env) {
  if (_googleTokenCache.token && Date.now() < _googleTokenCache.expiresAt) {
    return _googleTokenCache.token
  }

  const sa = JSON.parse(env.GOOGLE_SA_KEY)
  const jwt = await buildJWT(sa.client_email, sa.private_key)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Google token exchange failed (${res.status}): ${txt}`)
  }

  const data = await res.json()
  _googleTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000  // refresh 5 min early
  }
  return data.access_token
}

/**
 * Notify Google Indexing API about a URL change.
 * @param {Object} env  - Worker env (needs GOOGLE_SA_KEY secret)
 * @param {string} url  - The fully-qualified page URL
 * @param {string} type - 'URL_UPDATED' | 'URL_DELETED'
 * @returns {{ ok: boolean, status: number, body: any }}
 */
async function notifyGoogleIndexing(env, url, type = 'URL_UPDATED') {
  try {
    const token = await getGoogleAccessToken(env)
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ url, type })
    })
    const body = await res.json()
    console.log(`Google Indexing [${type}] ${url} → ${res.status}`, JSON.stringify(body))
    return { ok: res.ok, status: res.status, body }
  } catch (err) {
    console.error('Google Indexing error:', err)
    return { ok: false, status: 0, body: { error: err.message } }
  }
}

/**
 * Fire-and-forget: notify Google about a URL without blocking the caller.
 * Safe to call from any endpoint – swallows all errors.
 */
function notifyGoogleIndexingAsync(ctx, env, url, type = 'URL_UPDATED') {
  ctx.waitUntil(
    notifyGoogleIndexing(env, url, type).catch(err =>
      console.error('Async Google Indexing failed:', err)
    )
  )
}

// Rate limiting storage (in-memory for this worker instance)
const checkoutRateLimits = new Map()
const membershipCheckoutRateLimits = new Map()
const eventCheckoutRateLimits = new Map()
const donationCheckoutRateLimits = new Map()

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

/**
 * Check if a webhook has already been processed to prevent duplicates
 * @param {Object} db - Database connection
 * @param {string} webhookId - Webhook identifier
 * @param {string} entityType - Type of entity (membership, ticket, etc)
 * @param {number} entityId - Entity ID
 * @returns {boolean} True if duplicate, false if new
 */
async function checkAndMarkWebhookProcessed(db, webhookId, entityType, entityId) {
  try {
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

// ============================================================================
// STOCK MANAGEMENT - Inventory Reservation System
// ============================================================================

/**
 * Reserve stock for a pending order
 * @param {Object} db - Database connection
 * @param {number} productId - Product ID to reserve
 * @param {number} quantity - Quantity to reserve
 * @returns {boolean} True if reservation successful
 */
async function reserveStock(db, productId, quantity) {
  try {
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

/**
 * Release a stock reservation (e.g., when checkout expires)
 */
async function releaseStockReservation(db, productId, orderId) {
  try {
    await db.prepare(
      'UPDATE stock_reservations SET status = "released" WHERE product_id = ? AND order_id = ? AND status = "reserved"'
    ).bind(productId, orderId).run()
  } catch (error) {
    console.error('Stock release error:', error)
  }
}

/**
 * Commit a stock reservation to actual inventory reduction
 */
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

/**
 * Cleanup expired stock reservations (called by cron job)
 * @returns {number} Number of reservations cleaned up
 */
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

/**
 * Extract image key from R2 URL
 * @param {string} url - Full R2 URL
 * @returns {string|null} Image key or null
 */
function extractImageKey(url) {
  if (!url) return null
  // Extract the key from a URL like "https://pub-xxx.r2.dev/images/filename.jpg"
  const match = url.match(/\/images\/(.+)$/)
  return match ? `images/${match[1]}` : null
}

// ============================================================================
// DATABASE HELPERS - Schema & Migration Utilities
// ============================================================================

/**
 * Get cached schema information for database queries
 * @returns {Object} Schema configuration with table and column names
 */
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

/**
 * One-time migration: copy payment data from memberships/tickets to transactions table
 * @param {Object} db - Database connection
 */
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

// ============================================================================
// USER & IDENTITY MANAGEMENT
// ============================================================================

/**
 * Find user by email (case-insensitive)
 * @param {Object} db - Database connection
 * @param {string} email - User email
 * @returns {Object|null} User object or null if not found
 */
async function findIdentityByEmail(db, email){
  const s = await getSchema(db)
  // Use case-insensitive email lookup
  const row = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE LOWER(email) = LOWER(?)`).bind(email).first()
  if (!row) return null
  if (typeof row.id === 'undefined') row.id = row[s.idColumn]
  return row
}

/**
 * Get existing user or create new one
 * @param {Object} db - Database connection
 * @param {string} email - User email
 * @param {string} name - User name
 * @returns {Object} User object
 */
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

/**
 * Get user's active membership
 * @param {Object} db - Database connection  
 * @param {number} identityId - User ID
 * @returns {Object|null} Active membership or null
 */
async function getActiveMembership(db, identityId) {
  const now = new Date().toISOString()
  return await db.prepare(`SELECT * FROM memberships WHERE user_id = ? AND status = "active" AND end_date >= ? ORDER BY end_date DESC LIMIT 1`).bind(identityId, now).first()
}

/**
 * Fetch pricing and details for a membership plan
 * @param {Object} db - Database connection
 * @param {string} planCode - Plan code (monthly, quarterly, annual)
 * @returns {Object|null} Service details or null
 */
async function getServiceForPlan(db, planCode) {
  return await db.prepare('SELECT * FROM services WHERE code = ? AND active = 1 LIMIT 1').bind(planCode).first()
}

// ============================================================================
// SHARED PAYMENT CONFIRMATION HELPERS
// ============================================================================

/**
 * Check if a SumUp checkout is paid/completed.
 * For SETUP_RECURRING_PAYMENT checkouts, the top-level status may stay 'PENDING'
 * while the actual transaction status is inside the transactions[] array.
 */
function isCheckoutPaid(payment) {
  if (!payment) return false
  // Standard check: top-level status
  if (payment.status === 'PAID' || payment.status === 'SUCCESSFUL') return true
  // For tokenization checkouts, check transactions array for a successful entry
  if (payment.transactions && Array.isArray(payment.transactions)) {
    const hasSuccessfulTx = payment.transactions.some(
      t => t.status === 'SUCCESSFUL' || t.status === 'PAID'
    )
    if (hasSuccessfulTx) {
      console.log('[isCheckoutPaid] Top-level status is', payment.status, 'but found successful transaction in transactions[]')
      return true
    }
  }
  return false
}

/**
 * Activate a membership: compute dates, update DB, optionally save payment instrument
 * and charge the real amount (tokenization flow).
 * Returns { endDate, instrumentId, actualPaymentId } on success.
 */
async function activateMembership(db, env, { membershipId, membership, paymentId, checkoutId, transaction }) {
  const svc = await getServiceForPlan(db, membership.plan)
  if (!svc) throw new Error('plan_not_configured')
  
  const identityId = membership.user_id
  const memberActive = await getActiveMembership(db, identityId)
  const baseStart = memberActive ? new Date(memberActive.end_date) : new Date()
  const months = Number(svc.months || 0)
  const end = addMonths(baseStart, months)
  
  let instrumentId = null
  let actualPaymentId = paymentId
  if (membership.auto_renew === 1) {
    instrumentId = await savePaymentInstrument(db, identityId, checkoutId || paymentId, env)
    if (instrumentId) console.log('[activateMembership] Saved payment instrument:', instrumentId)
    
    // After tokenization, charge the real amount using the saved instrument.
    // The SETUP_RECURRING_PAYMENT checkout authorized and instantly reimbursed the amount —
    // this is the actual charge that collects payment.
    if (instrumentId && transaction) {
      const chargeAmount = transaction.amount
      const chargeCurrency = transaction.currency || 'GBP'
      const chargeOrderRef = `${transaction.order_ref}-charge`
      const chargeDesc = `Dice Bastion ${membership.plan} membership payment`
      
      console.log(`[activateMembership] Charging real amount £${chargeAmount} via instrument ${instrumentId}`)
      try {
        const chargeResult = await chargePaymentInstrument(
          env, identityId, instrumentId, chargeAmount, chargeCurrency, chargeOrderRef, chargeDesc
        )
        if (chargeResult && chargeResult.id) {
          actualPaymentId = chargeResult.id
          console.log('[activateMembership] Real charge successful:', actualPaymentId)
          
          // Record the actual charge as a separate transaction
          await db.prepare(`
            INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref,
                                      payment_id, amount, currency, payment_status, created_at)
            VALUES ('membership_charge', ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?)
          `).bind(
            membershipId, identityId, transaction.email, transaction.name,
            chargeOrderRef, actualPaymentId, chargeAmount, chargeCurrency, toIso(new Date())
          ).run()
        } else {
          console.error('[activateMembership] Charge returned no id — membership still activates but payment may be refunded')
        }
      } catch (chargeError) {
        console.error('[activateMembership] Error charging saved instrument:', chargeError)
        // Continue with activation — the setup payment was successful even if actual charge failed
      }
    }
  }
  
  await db.prepare(
    'UPDATE memberships SET status = "active", start_date = ?, end_date = ?, payment_id = ?, payment_instrument_id = ? WHERE id = ?'
  ).bind(toIso(baseStart), toIso(end), actualPaymentId, instrumentId, membershipId).run()
  
  return { startDate: toIso(baseStart), endDate: toIso(end), instrumentId, actualPaymentId }
}

/**
 * Activate a ticket and increment event ticket count.
 * Also updates the related transaction row.
 */
async function activateTicket(db, { ticketId, eventId, transactionId, paymentId }) {
  await db.batch([
    db.prepare('UPDATE tickets SET status = "active" WHERE id = ?').bind(ticketId),
    db.prepare('UPDATE transactions SET payment_status = "PAID", payment_id = ?, updated_at = ? WHERE id = ?')
      .bind(paymentId, toIso(new Date()), transactionId),
    db.prepare('UPDATE events SET tickets_sold = tickets_sold + 1 WHERE event_id = ? AND (capacity IS NULL OR tickets_sold < capacity)')
      .bind(eventId)
  ])
}

/**
 * Send membership welcome + event ticket emails for a bundle purchase.
 * Returns true if both sent successfully.
 */
async function sendBundleEmails(env, db, { membership, membershipId, endDate, ticket, event, transaction, user }) {
  if (!user) return false
  try {
    // Membership welcome email
    const updatedMembership = { ...membership, end_date: endDate }
    const membershipEmailContent = getWelcomeEmail(updatedMembership, user, membership.auto_renew === 1)
    await sendEmail(env, {
      to: user.email,
      ...membershipEmailContent,
      emailType: 'membership_welcome',
      relatedId: membershipId,
      relatedType: 'membership',
      metadata: { plan: membership.plan, auto_renew: membership.auto_renew }
    })
    
    // Event ticket confirmation email
    const eventForEmail = { ...event }
    if (event.is_recurring === 1) {
      const nextOccurrence = calculateNextOccurrence(event, new Date())
      if (nextOccurrence) eventForEmail.event_datetime = nextOccurrence.toISOString()
    }
    const ticketEmailContent = getTicketConfirmationEmail(eventForEmail, user, transaction)
    await sendEmail(env, {
      to: user.email,
      ...ticketEmailContent,
      emailType: 'event_ticket_confirmation',
      relatedId: ticket.id,
      relatedType: 'ticket',
      metadata: { event_id: event.event_id, event_name: event.event_name }
    })
    
    console.log('[sendBundleEmails] Both emails sent to:', user.email)
    return true
  } catch (err) {
    console.error('[sendBundleEmails] Failed:', err)
    return false
  }
}

/**
 * Send admin notification for a bundle purchase.
 */
async function sendBundleAdminNotification(env, { membership, membershipId, event, ticket, transaction, user }) {
  try {
    const adminEmailContent = getAdminNotificationEmail('bundle_purchase', {
      membershipPlan: membership.plan,
      eventName: event.event_name,
      customerName: user?.name || 'Customer',
      customerEmail: user?.email || transaction.email,
      amount: transaction.amount,
      autoRenew: membership.auto_renew === 1,
      membershipId,
      ticketId: ticket.id,
      orderRef: transaction.order_ref
    })
    await sendEmail(env, {
      to: 'admin@dicebastion.com',
      ...adminEmailContent,
      emailType: 'admin_bundle_notification',
      relatedId: membershipId,
      relatedType: 'membership',
      metadata: { ticket_id: ticket.id, event_id: event.event_id }
    })
  } catch (err) {
    console.error('[sendBundleAdminNotification] Failed:', err)
  }
}

/**
 * Resolve the bundle records (transaction, membership, ticket, event) from an orderRef.
 * Returns null on error, otherwise { transaction, membership, ticket, event, identityId, membershipId, eventId }.
 */
async function resolveBundleRecords(db, orderRef) {
  const transaction = await db.prepare(
    'SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "event_membership_bundle"'
  ).bind(orderRef).first()
  if (!transaction) return null
  
  const membershipId = transaction.reference_id
  const identityId = transaction.user_id
  
  const membership = await db.prepare('SELECT * FROM memberships WHERE id = ?').bind(membershipId).first()
  if (!membership) return null
  
  // Extract event_id from order_ref (format: BUNDLE-{eventId}-{uuid})
  const orderParts = orderRef.split('-')
  const eventId = orderParts[1] ? parseInt(orderParts[1]) : null
  if (!eventId) return null
  
  const ticket = await db.prepare(
    'SELECT * FROM tickets WHERE event_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(eventId, identityId).first()
  if (!ticket) return null
  
  const event = await db.prepare('SELECT * FROM events WHERE event_id = ?').bind(eventId).first()
  if (!event) return null
  
  return { transaction, membership, ticket, event, identityId, membershipId, eventId }
}

/**
 * Full bundle confirmation: activate membership + ticket, send emails, send admin notification.
 * Returns { ok, endDate, emailSent, user } or throws.
 */
async function confirmBundlePurchase(db, env, { bundle, paymentId, checkoutId }) {
  const { transaction, membership, ticket, event, identityId, membershipId, eventId } = bundle
  
  // Activate membership (pass transaction for charge-after-tokenization)
  const { endDate, instrumentId, actualPaymentId } = await activateMembership(db, env, {
    membershipId,
    membership,
    paymentId,
    checkoutId: checkoutId || paymentId,
    transaction: {
      amount: transaction.amount,
      currency: transaction.currency || 'GBP',
      order_ref: transaction.order_ref,
      email: transaction.email,
      name: transaction.name
    }
  })
  
  // Activate ticket + update transaction + increment tickets_sold
  // Use actualPaymentId so the ticket references the real charge, not the £0.01 tokenization
  await activateTicket(db, {
    ticketId: ticket.id,
    eventId,
    transactionId: transaction.id,
    paymentId: actualPaymentId || paymentId
  })
  
  console.log(`[confirmBundlePurchase] Activated membership ${membershipId} and ticket ${ticket.id} for user ${identityId}`)
  
  // Get user for emails
  const user = await db.prepare('SELECT * FROM users WHERE user_id = ?').bind(identityId).first()
  
  // Send customer emails
  const emailSent = await sendBundleEmails(env, db, {
    membership, membershipId, endDate,
    ticket, event, transaction, user
  })
  
  // Send admin notification
  await sendBundleAdminNotification(env, { membership, membershipId, event, ticket, transaction, user })
  
  // User needs account setup if they don't have a password yet (created via checkout, not registration)
  const needsAccountSetup = !user?.password_hash
  
  return { ok: true, endDate, emailSent, user, instrumentId, needsAccountSetup }
}

// ============================================================================
// PAYMENT INSTRUMENT MANAGEMENT
// ============================================================================

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

/**
 * Update payment instrument card details from checkout transaction
 * @param {Object} db - Database connection
 * @param {string} instrumentId - Payment instrument ID
 * @param {Object} checkout - Checkout response from payment provider
 * @returns {boolean} True if updated successfully
 */
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

/**
 * Get user's active payment instrument
 * @param {Object} db - Database connection
 * @param {number} userId - User ID
 * @returns {Object|null} Payment instrument or null
 */
async function getActivePaymentInstrument(db, userId) {
  return await db.prepare('SELECT * FROM payment_instruments WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1')
    .bind(userId).first()
}

/**
 * Process automatic renewal for a membership
 * @param {Object} db - Database connection
 * @param {Object} membership - Membership record
 * @param {Object} env - Environment variables
 * @returns {Object} {success, error, newEndDate, paymentId, attempts}
 */
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

  // ── Step 1: Attempt the charge ──────────────────────────────────────────
  // Keep charge in its own try/catch so that post-success DB/email errors
  // can never accidentally trigger a "Payment failed" email.
  let payment
  try {
    payment = await chargePaymentInstrument(
      env,
      userId,
      instrument.instrument_id,
      amount,
      currency,
      orderRef,
      `Renewal: Dice Bastion ${membership.plan} membership`
    )
  } catch (e) {
    // Charge itself failed – handle as a genuine payment failure
    return await handleRenewalFailure(db, env, membership, instrument, amount, currency, e)
  }

  // Charge returned but status is not paid — use isCheckoutPaid() to also
  // inspect the transactions[] array for SumUp recurring-charge responses
  // that carry top-level PENDING but a successful transaction inside.
  if (!payment || !isCheckoutPaid(payment)) {
    const statusErr = new Error(`Payment not successful: ${payment?.status || 'UNKNOWN'}`)
    return await handleRenewalFailure(db, env, membership, instrument, amount, currency, statusErr)
  }

  // ── Step 2: Payment succeeded – extend membership & notify ─────────────
  // Errors here are logged but must NEVER send a failure email because the
  // money has already been collected.
  const months = Number(svc.months || 0)
  const currentEnd = new Date(membership.end_date)
  const newEnd = addMonths(currentEnd, months)

  try {
    // Update membership
    await db.prepare(`
      UPDATE memberships 
      SET end_date = ?, 
          renewal_failed_at = NULL, 
          renewal_attempts = 0,
          renewal_warning_sent = 0
      WHERE id = ?
    `).bind(toIso(newEnd), membership.id).run()
  } catch (e) {
    console.error(`[renewal] CRITICAL – payment ${payment.id} succeeded but membership ${membership.id} update failed:`, e)
  }

  try {
    // Create transaction record for renewal
    const user = await db.prepare('SELECT email, name FROM users WHERE user_id = ?').bind(userId).first()
    await db.prepare(`
      INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref,
                                payment_id, amount, currency, payment_status)
      VALUES ('renewal', ?, ?, ?, ?, ?, ?, ?, ?, 'PAID')
    `).bind(membership.id, userId, user?.email, user?.name, orderRef, payment.id, String(amount), currency).run()
  } catch (e) {
    console.error(`[renewal] Failed to insert transaction record for payment ${payment.id}:`, e)
  }

  try {
    // Log renewal attempt
    await db.prepare('INSERT INTO renewal_log (membership_id, attempt_date, status, payment_id, amount, currency) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(membership.id, toIso(new Date()), 'success', payment.id, String(amount), currency).run()
  } catch (e) {
    console.error(`[renewal] Failed to insert renewal_log for payment ${payment.id}:`, e)
  }

  // Send renewal success email
  try {
    const user = await db.prepare('SELECT email, name FROM users WHERE user_id = ?').bind(userId).first()
    if (user) {
      // Merge the actual charged amount into the membership object so the email
      // always shows the correct price even if the stored column was null.
      const membershipForEmail = { ...membership, amount: String(amount) }
      const emailContent = getRenewalSuccessEmail(membershipForEmail, user, toIso(newEnd))
      await sendEmail(env, { 
        to: user.email, 
        ...emailContent,
        emailType: 'membership_renewal_success',
        relatedId: membership.id,
        relatedType: 'membership',
        metadata: { plan: membership.plan, new_end_date: toIso(newEnd) }
      })
    }
  } catch (e) {
    console.error(`[renewal] Failed to send success email for payment ${payment.id}:`, e)
  }

  return { success: true, newEndDate: toIso(newEnd), paymentId: payment.id }
}

/**
 * Handle a genuine renewal charge failure
 * Only called when the charge itself fails or returns a non-paid status.
 */
async function handleRenewalFailure(db, env, membership, instrument, amount, currency, error) {
  const userId = membership.user_id
  const currentAttempts = (membership.renewal_attempts || 0) + 1
  const errorMessage = String(error.message || error)

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

// ============================================================================
// SECURITY & VALIDATION
// ============================================================================

/**
 * Detect if request is from local development environment
 * @param {Object} c - Hono context
 * @returns {boolean} True if local development
 */
function isLocalDevelopment(c) {
  const origin = c.req.header('Origin') || ''
  const referer = c.req.header('Referer') || ''
  
  // Check if request is coming from localhost frontend
  return origin.includes('localhost') || 
         origin.includes('127.0.0.1') ||
         referer.includes('localhost') || 
         referer.includes('127.0.0.1') ||
         c.env.ENVIRONMENT === 'development' ||
         c.env.ENVIRONMENT === 'local'
}

/**
 * Verify Cloudflare Turnstile captcha token
 * @param {Object} env - Environment variables
 * @param {string} token - Turnstile token
 * @param {string} ip - Client IP address
 * @param {boolean} debug - Enable debug logging
 * @param {Object} context - Request context for local dev detection
 * @returns {boolean} True if verification successful
 */
async function verifyTurnstile(env, token, ip, debug, context = null){
  if (!env.TURNSTILE_SECRET) { if (debug) console.log('turnstile: secret missing -> bypass'); return true }
  
  // Auto-bypass for local development
  if (context && isLocalDevelopment(context)) {
    if (debug) console.log('turnstile: local development detected -> bypass')
    return true
  }
  
  if (!token) { if (debug) console.log('turnstile: missing token'); return false }
  
  // Auto-bypass for localhost/127.0.0.1 (local development)
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    if (debug) console.log('turnstile: localhost detected -> bypass')
    return true
  }
  
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

// Validation regex patterns
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EVT_UUID_RE = /^EVT-\d+-[0-9a-f\-]{36}$/i

/**
 * Clamp string to maximum length
 * @param {string} v - String to clamp
 * @param {number} max - Maximum length
 * @returns {string} Clamped string
 */
function clampStr(v, max){ return (v||'').substring(0, max) }

// ============================================================================
// EMAIL SYSTEM - MailerSend Integration & Templates
// ============================================================================

/**
 * Log sent email to history database for tracking
 * @param {Object} db - Database connection
 * @param {Object} emailData - Email metadata
 * @returns {Object} {success, error}
 */
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

/**
 * Send email via MailerSend API
 * @param {Object} env - Environment variables
 * @param {Object} params - Email parameters
 * @returns {Object} {success, error, skipped}
 */
async function sendEmail(env, { to, subject, html, text, attachments = null, emailType = 'transactional', relatedId = null, relatedType = null, metadata = null, replyTo = null }) {
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

    // Reply-To makes the email look like it comes from a real person
    if (replyTo) {
      body.reply_to = typeof replyTo === 'string' ? { email: replyTo } : replyTo
    }
    
    // Add attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      body.attachments = attachments
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
    
    // Consume the response body to prevent stalled response warning
    await res.text()
    
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

/**
 * Strip Quill editor artefacts that must not reach email clients.
 * Called by wrapNewsletterHtml before the body is embedded in the template.
 */
function cleanNewsletterBody(html) {
  return html
    // data-card blobs are large redundant attribute copies Quill adds to BlockEmbeds
    .replace(/ data-card="[^"]*"/g, '')
    // contenteditable is a browser-only attribute
    .replace(/ contenteditable="[^"]*"/g, '')
    // Replace the Quill event-card class with full inline styles for email clients
    .replace(/class="nl-event-card-embed"/g,
      'style="margin:24px 0;background:#f8f9ff;border:1px solid #dde0fa;border-radius:12px;overflow:hidden;display:block;"')
    // Strip Quill formatting classes (ql-align, ql-indent, etc.) — no stylesheet in email
    .replace(/ class="ql-[^"]*"/g, '')
    // Quill inserts <p><br></p> for every blank line the user types.
    .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, '');
}

/**
 * Wrap newsletter body HTML in a full email template
 */
function wrapNewsletterHtml(bodyHtml, subject, unsubscribeUrl = null) {
  const cleaned = cleanNewsletterBody(bodyHtml);
  const pReset = 'p{margin:0 0 14px 0;padding:0;}'
    + 'h1{font-size:26px;font-weight:800;color:#111827;margin:0 0 16px 0;line-height:1.25;}'
    + 'h2{font-size:20px;font-weight:700;color:#111827;margin:0 0 12px 0;line-height:1.3;}'
    + 'h3{font-size:17px;font-weight:700;color:#111827;margin:0 0 10px 0;line-height:1.35;}'
    + 'ul,ol{margin:0 0 14px 0;padding-left:1.5em;}li{margin:0 0 5px 0;}'
    + 'a{color:#4f46e5;}hr{border:none;border-top:1px solid #e5e7eb;margin:24px 0;}';
  return '<!DOCTYPE html><html lang="en"><head>'
    + '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>' + subject + '</title>'
    + '<style>' + pReset + '</style>'
    + '</head>'
    + '<body style="margin:0;padding:0;background:#f0f0f8;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Arial,sans-serif;color:#1a1a1a;">'
    + '<div style="max-width:680px;margin:0 auto;padding:24px 16px;">'
    + '<div style="background:#ffffff;border-radius:16px;border:1px solid #dde0fa;overflow:hidden;">'
    + '<div style="background-color:#2d1f8a;background-image:url(https://dicebastion.com/img/clubfull.png?v=2);background-size:cover;background-position:center 40%;">'
    + '<div style="background:linear-gradient(155deg,rgba(6,8,40,0.55) 0%,rgba(79,70,229,0.88) 100%);padding:36px 32px 32px 32px;">'
    + '<div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:12px;">Dice Bastion</div>'
    + '<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;letter-spacing:-0.02em;max-width:480px;">' + subject.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>'
    + '</div></div>'
    + '<div style="padding:32px;line-height:1.75;font-size:16px;color:#1a1a1a;">' + cleaned + '</div>'
    + '<div style="padding:20px 32px;background:#f8f8fc;border-top:1px solid #ebebf5;font-size:12px;color:#9ca3af;line-height:1.6;">'
    + '<p style="margin:0 0 6px 0;">You\'re receiving this as a Dice Bastion member who signed up for updates.</p>'
    + (unsubscribeUrl
        ? '<p style="margin:0;"><a href="' + unsubscribeUrl + '" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a> &middot; <a href="https://dicebastion.com/account" style="color:#9ca3af;text-decoration:underline;">Manage preferences</a></p>'
        : '<p style="margin:0;"><a href="https://dicebastion.com/account" style="color:#9ca3af;text-decoration:underline;">Manage email preferences</a></p>')
    + '</div>'
    + '</div>'
    + '</div></body></html>';
}

/**
 * Convert HTML email body to a clean plain-text alternative.
 * Runs regex-only (no DOM) so it works inside a Cloudflare Worker.
 */
function htmlToPlainText(html) {
  let t = html;
  // Headings
  t = t.replace(/<h1[^>]*>([\.\s\S]*?)<\/h1>/gi, (_, s) => '\n\n' + _stripTags(s).toUpperCase() + '\n');
  t = t.replace(/<h2[^>]*>([\.\s\S]*?)<\/h2>/gi, (_, s) => '\n\n' + _stripTags(s).toUpperCase() + '\n');
  t = t.replace(/<h3[^>]*>([\.\s\S]*?)<\/h3>/gi, (_, s) => '\n\n' + _stripTags(s).toUpperCase() + '\n');
  // Links: preserve both label and URL
  t = t.replace(/<a[^>]+href="([^"]*)"[^>]*>([\.\s\S]*?)<\/a>/gi, (_, url, label) => {
    const l = _stripTags(label).trim();
    return (url && url !== l && !url.startsWith('#')) ? l + ' (' + url + ')' : l;
  });
  // Block elements
  t = t.replace(/<\/p>/gi, '\n\n');
  t = t.replace(/<p[^>]*>/gi, '');
  t = t.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<li[^>]*>([\.\s\S]*?)<\/li>/gi, (_, s) => '\n- ' + _stripTags(s).trim());
  t = t.replace(/<\/?[uod]l[^>]*>/gi, '\n');
  t = t.replace(/<hr[^>]*>/gi, '\n\n---\n\n');
  // Strip all remaining tags
  t = _stripTags(t);
  // Decode common HTML entities
  t = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  return t.replace(/\n{3,}/g, '\n\n').trim();
}

function _stripTags(html) {
  return (html || '').replace(/<[^>]+>/g, '');
}

/**
 * Add UTM tracking parameters to URL
 * @param {string} url - Base URL
 * @param {string} source - UTM source
 * @param {string} medium - UTM medium  
 * @param {string} campaign - UTM campaign (optional)
 * @returns {string} URL with UTM parameters
 */
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

/**
 * Handle email preferences opt-in for new users
 * @param {Object} db - Database connection
 * @param {number} userId - User ID
 * @param {boolean} marketingConsent - Whether user consented to marketing emails
 */
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

// ============================================================================
// EMAIL TEMPLATE HELPERS - Shared Components
// ============================================================================

// Shared constants
const PLAN_NAMES = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' }

/**
 * Format price with currency symbol
 * @param {string|number} amount - Price amount
 * @param {string} currency - Currency code (GBP, EUR, USD)
 * @returns {string} Formatted price
 */
function formatPrice(amount, currency = 'GBP') {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount)
  const symbols = { GBP: '£', EUR: '€', USD: '$' }
  if (amount == null || isNaN(num)) return `${symbols[currency] || currency}?.??`
  return `${symbols[currency] || currency}${num.toFixed(2)}`
}

/**
 * Format date in British format
 * @param {Date|string} date - Date to format
 * @param {boolean} includeDay - Include day of week
 * @returns {string} Formatted date
 */
function formatDate(date, includeDay = false) {
  const d = typeof date === 'string' ? new Date(date) : date
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  if (includeDay) options.weekday = 'long'
  return d.toLocaleDateString('en-GB', options)
}

/**
 * Base email template with consistent styling
 * @param {Object} params - Template parameters
 * @returns {string} Complete HTML email
 */
function createEmailTemplate({ headerTitle, headerColor = '#5374a5', headerGradient = null, content, footerText = null }) {
  const gradient = headerGradient || `linear-gradient(135deg, #b2c6df 0%, ${headerColor} 100%)`
  const footer = footerText || 'This is an automated email from Dice Bastion.<br>If you need help, contact us at admin@dicebastion.com'
  
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
          background: ${gradient};
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
          background: ${headerColor};
          color: white !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .highlight {
          background: #e0f2fe;
          border-left: 4px solid #0284c7;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .alert {
          background: #fee2e2;
          border-left: 4px solid #dc2626;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .success {
          background: #d1fae5;
          border-left: 4px solid #10b981;
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
        <h1 style="margin: 0;">${headerTitle}</h1>
      </div>
      <div class="content">
        ${content}
        <div class="footer">
          <p>${footer}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate admin notification email
function getAdminNotificationEmail(purchaseType, details) {
  // Format price - amounts are stored as strings in pounds (e.g., "30.00")
  const formatPrice = (amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return `£${num.toFixed(2)}`
  }

  // Format plan code (e.g. 'monthly') to display name (e.g. 'Monthly Membership')
  const formatPlanName = (plan) => {
    if (!plan) return 'Membership'
    return plan.charAt(0).toUpperCase() + plan.slice(1) + ' Membership'
  }
  
  let subject, htmlContent, textContent
  
  switch (purchaseType) {
    case 'membership':
      subject = `📈 New Membership Purchase: ${formatPlanName(details.plan)}`
      htmlContent = `
        <h2>New Membership Purchase</h2>
        <p><strong>Plan:</strong> ${formatPlanName(details.plan)}</p>
        <p><strong>Customer:</strong> ${details.customerName} (${details.customerEmail})</p>
        <p><strong>Amount:</strong> ${formatPrice(details.amount)}</p>
        <p><strong>Auto-Renewal:</strong> ${details.autoRenew ? 'Yes' : 'No'}</p>
        <p><strong>Purchase Date:</strong> ${new Date().toLocaleString('en-GB')}</p>
        <p><strong>Membership ID:</strong> ${details.membershipId}</p>
        <p><strong>Order Reference:</strong> ${details.orderRef}</p>
      `
      textContent = `
New Membership Purchase

Plan: ${formatPlanName(details.plan)}
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
    
    case 'event_registration':
      subject = `📝 New Event Registration: ${details.eventName}`
      htmlContent = `
        <h2>New Event Registration</h2>
        <p><strong>Event:</strong> ${details.eventName}</p>
        <p><strong>Attendee:</strong> ${details.customerName} (${details.customerEmail})</p>
        <p><strong>Event Type:</strong> Free Event</p>
        <p><strong>Event Date:</strong> ${new Date(details.eventDate).toLocaleString('en-GB')}</p>
        <p><strong>Registration Date:</strong> ${new Date().toLocaleString('en-GB')}</p>
        <p><strong>Ticket ID:</strong> ${details.ticketId}</p>
      `
      textContent = `
New Event Registration

Event: ${details.eventName}
Attendee: ${details.customerName} (${details.customerEmail})
Event Type: Free Event
Event Date: ${new Date(details.eventDate).toLocaleString('en-GB')}
Registration Date: ${new Date().toLocaleString('en-GB')}
Ticket ID: ${details.ticketId}
      `.trim()
      break
    
    case 'bundle_purchase':
      subject = `🎁 New Bundle Purchase: ${formatPlanName(details.membershipPlan)} + ${details.eventName}`
      htmlContent = `
        <h2>New Membership + Event Bundle Purchase</h2>
        <p><strong>Membership Plan:</strong> ${formatPlanName(details.membershipPlan)}</p>
        <p><strong>Event:</strong> ${details.eventName}</p>
        <p><strong>Customer:</strong> ${details.customerName} (${details.customerEmail})</p>
        <p><strong>Total Amount:</strong> ${formatPrice(details.amount)}</p>
        <p><strong>Auto-Renewal:</strong> ${details.autoRenew ? 'Yes' : 'No'}</p>
        <p><strong>Purchase Date:</strong> ${new Date().toLocaleString('en-GB')}</p>
        <p><strong>Membership ID:</strong> ${details.membershipId}</p>
        <p><strong>Ticket ID:</strong> ${details.ticketId}</p>
        <p><strong>Order Reference:</strong> ${details.orderRef}</p>
      `
      textContent = `
New Membership + Event Bundle Purchase

Membership Plan: ${formatPlanName(details.membershipPlan)}
Event: ${details.eventName}
Customer: ${details.customerName} (${details.customerEmail})
Total Amount: ${formatPrice(details.amount)}
Auto-Renewal: ${details.autoRenew ? 'Yes' : 'No'}
Purchase Date: ${new Date().toLocaleString('en-GB')}
Membership ID: ${details.membershipId}
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

// ============================================================================
// EMAIL TEMPLATES - Using Shared Components
// ============================================================================

function getRenewalSuccessEmail(membership, user, newEndDate) {
  const planName = PLAN_NAMES[membership.plan] || membership.plan
  const content = `
    <p>Hi ${user.name || 'there'},</p>
    <p>Great news! Your <strong>${planName} Membership</strong> has been automatically renewed.</p>
    <ul>
      <li><strong>Plan:</strong> ${planName}</li>
      <li><strong>Amount:</strong> ${formatPrice(membership.amount)}</li>
      <li><strong>New End Date:</strong> ${formatDate(newEndDate)}</li>
    </ul>
    <p>Your membership will continue uninterrupted. If you wish to cancel auto-renewal, you can do so from your <a href="${addUtmParams('https://dicebastion.com/account', 'email', 'transactional', 'membership_renewal')}">account page</a>.</p>
    <p>Thank you for being a valued member!</p>
    <p>— The Dice Bastion Team</p>
  `
  
  return {
    subject: `Your Dice Bastion ${planName} Membership Has Been Renewed`,
    html: createEmailTemplate({ headerTitle: 'Membership Renewed! 🎉', content, headerColor: '#10b981', headerGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' })
  }
}

function getUpcomingRenewalEmail(membership, user, daysUntil) {
  const planName = PLAN_NAMES[membership.plan] || membership.plan
  const content = `
    <p>Hi ${user.name || 'there'},</p>
    <p>This is a friendly reminder that your <strong>${planName} Membership</strong> will automatically renew on <strong>${formatDate(membership.end_date)}</strong>.</p>
    <p><strong>Your membership details:</strong></p>
    <ul>
      <li>Plan: ${planName}</li>
      <li>Renewal Date: ${formatDate(membership.end_date)}</li>
      <li>Payment Method: Card ending in ${membership.payment_instrument_last_4 || '••••'}</li>
    </ul>
    <p>Your card will be charged automatically, and your membership will continue uninterrupted.</p>
    <p><strong>Need to make changes?</strong></p>
    <ul>
      <li>Update your payment method at <a href="${addUtmParams('https://dicebastion.com/memberships', 'email', 'transactional', 'renewal_reminder')}">dicebastion.com/memberships</a></li>
      <li><a href="${addUtmParams('https://dicebastion.com/account', 'email', 'transactional', 'renewal_reminder')}">Manage your membership</a> from your account page</li>
    </ul>
    <p>Thank you for being part of the Dice Bastion community!</p>
    <p>— The Dice Bastion Team</p>
  `
  
  return {
    subject: `Dice Bastion: Your ${planName} Membership Renews in ${daysUntil} Days`,
    html: createEmailTemplate({ headerTitle: 'Upcoming Renewal', content }),
    text: `Hi ${user.name || 'there'},\n\nYour ${planName} Membership will automatically renew on ${formatDate(membership.end_date)}.\n\nYour card will be charged automatically. To manage your membership, visit dicebastion.com/account.\n\nThank you!\n— The Dice Bastion Team`
  }
}

function getMembershipExpiryWarningEmail(membership, user, daysUntil) {
  const planName = PLAN_NAMES[membership.plan] || membership.plan
  const urgency = daysUntil <= 1 ? 'today' : `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
  const content = `
    <p>Hi ${user.name || 'there'},</p>
    <p>This is a friendly heads-up that your <strong>${planName} Membership</strong> expires <strong>${urgency}</strong> on <strong>${formatDate(membership.end_date)}</strong>.</p>
    <div class="warning">
      <strong>⚠️ Your membership is not set to auto-renew.</strong>
      <p style="margin: 8px 0 0 0;">Once it expires you'll lose member benefits unless you renew.</p>
    </div>
    <p><strong>To keep your membership going:</strong></p>
    <ul>
      <li>Renew now at <a href="${addUtmParams('https://dicebastion.com/memberships', 'email', 'transactional', 'expiry_warning')}">dicebastion.com/memberships</a></li>
      <li>You can also opt into auto-renewal during checkout so this never happens again</li>
      <li><a href="${addUtmParams('https://dicebastion.com/account', 'email', 'transactional', 'expiry_warning')}">Manage your membership</a> from your account page</li>
    </ul>
    <p>Questions? Reach us at <a href="mailto:support@dicebastion.com">support@dicebastion.com</a></p>
    <p>— The Dice Bastion Team</p>
  `
  return {
    subject: `Reminder: Your Dice Bastion ${planName} Membership Expires ${urgency}`,
    html: createEmailTemplate({ headerTitle: '⏰ Membership Expiring Soon', content, headerColor: '#f59e0b', headerGradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }),
    text: `Hi ${user.name || 'there'},\n\nYour ${planName} Membership expires ${urgency} on ${formatDate(membership.end_date)}.\n\nRenew at dicebastion.com/memberships to keep your access.\n\n— The Dice Bastion Team`
  }
}

function getRenewalFailedEmail(membership, user, attemptNumber = 1) {
  const planName = PLAN_NAMES[membership.plan] || membership.plan
  const attemptsRemaining = 3 - attemptNumber
  const content = `
    <p>Hi ${user.name || 'there'},</p>
    <p>We attempted to automatically renew your <strong>${planName} Membership</strong>, but the payment was unsuccessful.</p>
    <div class="warning">
      <strong>⚠️ Important:</strong> Your membership expires on <strong>${formatDate(membership.end_date)}</strong>.
    </div>
    ${attemptsRemaining > 0 ? `
      <p>We will automatically retry ${attemptsRemaining} more time${attemptsRemaining > 1 ? 's' : ''} before your expiration date. However, to ensure uninterrupted access, please update your payment method now.</p>
    ` : ''}
    <p><strong>What to do next:</strong></p>
    <ul>
      <li><strong>Recommended:</strong> <a href="${addUtmParams('https://dicebastion.com/account', 'email', 'transactional', 'payment_failed')}">Visit your account page</a> to retry the payment or update your card details</li>
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
  `
  
  return {
    subject: `Action Required: Dice Bastion Membership Renewal Failed (Attempt ${attemptNumber}/3)`,
    html: createEmailTemplate({ headerTitle: '⚠️ Payment Failed', content, headerColor: '#f59e0b', headerGradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }),
    text: `Hi ${user.name || 'there'},\n\nWe attempted to renew your ${planName} Membership, but the payment failed (attempt ${attemptNumber}/3).\n\nYour membership expires on ${formatDate(membership.end_date)}.\n\nPlease update your payment method at dicebastion.com/memberships to avoid interruption.\n\n— The Dice Bastion Team`
  }
}

function getRenewalFailedFinalEmail(membership, user) {
  const planName = PLAN_NAMES[membership.plan] || membership.plan
  const content = `
    <p>Hi ${user.name || 'there'},</p>
    <p>After 3 unsuccessful attempts to charge your payment method, we've <strong>disabled auto-renewal</strong> for your ${planName} Membership.</p>
    <div class="alert">
      <strong>⚠️ Your membership expires on ${formatDate(membership.end_date)}</strong>
      <p style="margin: 8px 0 0 0;">It will not automatically renew.</p>
    </div>
    <p><strong>What to do now:</strong></p>
    <ul>
      <li><strong>Option 1:</strong> <a href="${addUtmParams('https://dicebastion.com/account', 'email', 'transactional', 'auto_renewal_disabled')}">Update your card and re-enable auto-renewal</a> from your account page</li>
      <li><strong>Option 2:</strong> Purchase a new membership at <a href="${addUtmParams('https://dicebastion.com/memberships', 'email', 'transactional', 'auto_renewal_disabled')}">dicebastion.com/memberships</a></li>
      <li><strong>Need help?</strong> Email us at <a href="mailto:support@dicebastion.com">support@dicebastion.com</a></li>
    </ul>
    <p>We'd love to keep you as a member! If you're experiencing payment issues, please reach out and we'll help resolve them.</p>
    <p>— The Dice Bastion Team</p>
  `
  
  return {
    subject: `Urgent: Dice Bastion Membership Auto-Renewal Disabled`,
    html: createEmailTemplate({ headerTitle: '⚠️ Auto-Renewal Disabled', content, headerColor: '#dc2626', headerGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }),
    text: `Hi ${user.name || 'there'},\n\nAfter 3 unsuccessful payment attempts, we've disabled auto-renewal for your ${planName} Membership.\n\nYour membership expires on ${formatDate(membership.end_date)} and will NOT automatically renew.\n\nTo continue your membership, purchase a new one at dicebastion.com/memberships or contact us to re-enable auto-renewal.\n\n— The Dice Bastion Team`
  }
}

function getExpiredPaymentMethodEmail(membership, user) {
  const planName = PLAN_NAMES[membership.plan] || membership.plan
  const content = `
    <p>Hi ${user.name || 'there'},</p>
    <p>We attempted to renew your ${planName} Membership, but <strong>your saved payment method is no longer valid</strong>.</p>
    <p>This could happen if your card:</p>
    <ul>
      <li>Has expired</li>
      <li>Was cancelled or replaced by your bank</li>
      <li>Has insufficient funds</li>
    </ul>
    <div class="warning">
      <strong>⚠️ Auto-renewal has been disabled</strong>
      <p style="margin: 8px 0 0 0;">Your membership will expire on <strong>${formatDate(membership.end_date)}</strong> unless you take action.</p>
    </div>
    <p><strong>To continue your membership:</strong></p>
    <ol>
      <li><a href="${addUtmParams('https://dicebastion.com/account', 'email', 'transactional', 'payment_method_expired')}">Go to your account page</a> to update your card and re-enable auto-renewal</li>
      <li>Or purchase a new membership at <a href="${addUtmParams('https://dicebastion.com/memberships', 'email', 'transactional', 'payment_method_expired')}">dicebastion.com/memberships</a></li>
    </ol>
    <p><strong>Need help?</strong> Contact us at <a href="mailto:support@dicebastion.com">support@dicebastion.com</a></p>
    <p>We'd love to keep you as a member!</p>
    <p>— The Dice Bastion Team</p>
  `
  
  return {
    subject: `Action Required: Update Your Payment Method - Dice Bastion`,
    html: createEmailTemplate({ headerTitle: '💳 Update Payment Method', content }),
    text: `Hi ${user.name || 'there'},\n\nWe couldn't renew your ${planName} Membership because your saved payment method is no longer valid.\n\nAuto-renewal has been disabled. Your membership expires on ${formatDate(membership.end_date)}.\n\nTo continue: Visit dicebastion.com/memberships and purchase a new membership with your updated payment details.\n\nNeed help? Email support@dicebastion.com\n\n— The Dice Bastion Team`
  }
}

function getPasswordResetEmail(userName, resetLink) {
  const content = `
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
  `
  
  return createEmailTemplate({ headerTitle: '🔑 Reset Your Password', content })
}

// Account creation invitation email (sent after event purchase/registration)
function getAccountCreationInviteEmail(userName, userEmail, setupLink) {
  const content = `
    <p>Hi ${userName},</p>
    <p>Thanks for registering for our event! We'd love to make your experience even better by creating a Dice Bastion account for you.</p>
    <div class="highlight">
      <strong>✨ With a Dice Bastion account, you can:</strong>
      <ul style="margin: 10px 0;">
        <li>View all your event registrations in one place</li>
        <li>Access exclusive member benefits and discounts</li>
        <li>Manage your profile and preferences</li>
        <li>Get early access to new events</li>
      </ul>
    </div>
    <p><strong>Create your account in seconds:</strong></p>
    <p>Just click the button below and choose a password for your account (${userEmail}).</p>
    <div style="text-align: center;">
      <a href="${setupLink}" class="button">Create My Account</a>
    </div>
    <p class="link-text">Or copy and paste this link into your browser:<br>${setupLink}</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      <strong>Not interested?</strong> No worries! You can still attend the event. This is completely optional.
    </p>
  `
  
  return createEmailTemplate({ headerTitle: '🎉 One More Step!', content })
}

// New account welcome email (sent after account creation)
function getNewAccountWelcomeEmail(userName) {
  const content = `
    <p>Hi ${userName},</p>
    <p><strong>Your account has been created successfully!</strong></p>
    <p>We're excited to have you as part of our gaming community. Your account gives you access to exclusive benefits and makes managing your events a breeze.</p>
    <div class="highlight">
      <strong>What's Next?</strong>
      <ul style="margin: 10px 0;">
        <li><strong>Explore Events:</strong> Browse upcoming gaming sessions and tournaments</li>
        <li><strong>Join as a Member:</strong> Get exclusive discounts and early access</li>
        <li><strong>Connect:</strong> Meet fellow gamers and join our community</li>
      </ul>
    </div>
    <p><strong>Quick Links:</strong></p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="${addUtmParams('https://dicebastion.com/account', 'email', 'welcome', 'new_account')}" class="button">My Account</a>
      <a href="${addUtmParams('https://dicebastion.com/events', 'email', 'welcome', 'new_account')}" class="button">Browse Events</a>
      <a href="${addUtmParams('https://dicebastion.com/memberships', 'email', 'welcome', 'new_account')}" class="button">View Memberships</a>
    </div>
    <div class="highlight">
      <strong>💎 Consider Becoming a Member!</strong>
      <p style="margin: 10px 0;">
        Our memberships offer incredible value with discounts on events, priority booking, and exclusive perks. 
        Check out our <a href="${addUtmParams('https://dicebastion.com/memberships', 'email', 'welcome', 'new_account')}">membership options</a> to save on future events!
      </p>
    </div>
    <p>If you have any questions or need help getting started, don't hesitate to reach out to us at <a href="mailto:admin@dicebastion.com">admin@dicebastion.com</a>.</p>
    <p>Welcome to the adventure!</p>
    <p><strong>— The Dice Bastion Team</strong></p>
  `
  
  return createEmailTemplate({ 
    headerTitle: '🎉 Welcome to Dice Bastion!', 
    content
  })
}

// Generate .ics calendar file content with Gibraltar timezone (Europe/Gibraltar)
function generateIcsCalendar(event) {
  const eventDateTime = new Date(event.event_datetime)
  
  // Format datetime for ICS with timezone (YYYYMMDDTHHMMSS)
  // Gibraltar uses Europe/Gibraltar timezone (CET/CEST)
  const formatIcsDateWithTz = (date) => {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const seconds = String(date.getUTCSeconds()).padStart(2, '0')
    return `${year}${month}${day}T${hours}${minutes}${seconds}`
  }
  
  // Assume event is 2 hours long if no end time specified
  const endDateTime = new Date(eventDateTime.getTime() + (2 * 60 * 60 * 1000))
  
  const location = event.location || 'Gibraltar Warhammer Club, Gibraltar'
  const description = event.description ? event.description.replace(/\n/g, '\\n').replace(/,/g, '\\,') : `Join us for ${event.event_name}`
  
  // Include timezone information in the calendar
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Dice Bastion//Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VTIMEZONE
TZID:Europe/Gibraltar
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
TZNAME:CEST
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
TZNAME:CET
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:event-${event.event_id}@dicebastion.com
DTSTAMP:${formatIcsDateWithTz(new Date())}Z
DTSTART;TZID=Europe/Gibraltar:${formatIcsDateWithTz(eventDateTime)}
DTEND;TZID=Europe/Gibraltar:${formatIcsDateWithTz(endDateTime)}
SUMMARY:${event.event_name}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`
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
  const isFree = !transaction.order_ref || amount === '0.00'
  
  // Generate calendar attachment
  const icsContent = generateIcsCalendar(event)
  const icsBase64 = btoa(icsContent)
  
  if (isFree) {
    // Free event registration email
    const content = `
      <p>Hi ${user.name || 'there'},</p>
      <p>Thank you for registering for <strong>${event.event_name}</strong>!</p>
      
      <h3>Event Details:</h3>
      <ul>
        <li><strong>Event:</strong> ${event.event_name}</li>
        <li><strong>Date:</strong> ${eventDate}</li>
        <li><strong>Time:</strong> ${eventTime}</li>
        <li><strong>Location:</strong> ${event.location ? event.location : '<a href="https://www.google.com/maps/place/Gibraltar+Warhammer+Club/data=!4m2!3m1!1s0x0:0x6942154652d2cbe?sa=X&ved=1t:2428&ictx=111">Gibraltar Warhammer Club</a>'}</li>
        ${event.description ? `<li><strong>Description:</strong> ${event.description}</li>` : ''}
      </ul>
      
      ${event.additional_info ? `<div class="highlight"><strong>📌 Important Information:</strong><p style="margin: 8px 0 0 0;">${event.additional_info}</p></div>` : ''}
      
      <p>We've attached a calendar invite for your convenience. See you there!</p>
      <p>— The Dice Bastion Team</p>
    `
    
    return {
      subject: `Registration Confirmed: ${event.event_name}`,
      html: createEmailTemplate({ 
        headerTitle: `You're Registered! 🎉`, 
        content,
        headerColor: '#10b981',
        headerGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      }),
      text: `You're Registered!

Hi ${user.name || 'there'},

Thank you for registering for ${event.event_name}!

EVENT DETAILS:
- Event: ${event.event_name}
- Date: ${eventDate}
- Time: ${eventTime}
- Location: ${event.location || 'Gibraltar Warhammer Club'}
${event.description ? `- Description: ${event.description}` : ''}

${event.additional_info ? `Important Information: ${event.additional_info}` : ''}

See you there!

— The Dice Bastion Team`,
      attachments: [{
        filename: `${event.event_name.replace(/[^a-z0-9]/gi, '_')}.ics`,
        content: icsBase64,
        encoding: 'base64',
        contentType: 'text/calendar'
      }]
    }
  }
  
  // Paid event ticket confirmation email
  const content = `
    <p>Hi ${user.name || 'there'},</p>
    <p>Thank you for purchasing a ticket to <strong>${event.event_name}</strong>!</p>
    
    <h3>Event Details:</h3>
    <ul>
      <li><strong>Event:</strong> ${event.event_name}</li>
      <li><strong>Date:</strong> ${eventDate}</li>
      <li><strong>Time:</strong> ${eventTime}</li>
      <li><strong>Location:</strong> ${event.location ? event.location : '<a href="https://www.google.com/maps/place/Gibraltar+Warhammer+Club/data=!4m2!3m1!1s0x0:0x6942154652d2cbe?sa=X&ved=1t:2428&ictx=111">Gibraltar Warhammer Club</a>'}</li>
      ${event.description ? `<li><strong>Description:</strong> ${event.description}</li>` : ''}
    </ul>
    
    <h3>Payment Details:</h3>
    <ul>
      <li><strong>Amount Paid:</strong> ${formatPrice(amount, currency)}</li>
      <li><strong>Order Reference:</strong> ${transaction.order_ref}</li>
    </ul>
    
    <div class="success">
      <strong>✓ Payment Confirmed</strong>
      <p style="margin: 8px 0 0 0;">Please bring this email or show your order reference at the event check-in.</p>
    </div>
    
    ${event.additional_info ? `<div class="highlight"><strong>📌 Important Information:</strong><p style="margin: 8px 0 0 0;">${event.additional_info}</p></div>` : ''}
    
    <p>We've attached a calendar invite for your convenience. Looking forward to seeing you there!</p>
    <p>— The Dice Bastion Team</p>
  `
  
  return {
    subject: `Ticket Confirmed: ${event.event_name}`,
    html: createEmailTemplate({ 
      headerTitle: 'Ticket Confirmed! 🎟️', 
      content,
      headerColor: '#10b981',
      headerGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    }),
    text: `Your Ticket is Confirmed!

Hi ${user.name || 'there'},

Thank you for purchasing a ticket to ${event.event_name}!

EVENT DETAILS:
- Event: ${event.event_name}
- Date: ${eventDate}
- Time: ${eventTime}
- Location: ${event.location || 'Gibraltar Warhammer Club'}
${event.description ? `- Description: ${event.description}` : ''}

PAYMENT DETAILS:
- Amount Paid: ${formatPrice(amount, currency)}
- Order Reference: ${transaction.order_ref}

Please bring this email or show your order reference at the event check-in.

${event.additional_info ? `Important Information: ${event.additional_info}` : ''}

Looking forward to seeing you there!

— The Dice Bastion Team`,
    attachments: [{
      filename: `${event.event_name.replace(/[^a-z0-9]/gi, '_')}.ics`,
      content: icsBase64,
      encoding: 'base64',
      contentType: 'text/calendar'
    }]
  }
}

function getWelcomeEmail(membership, user, autoRenew) {
  const planName = PLAN_NAMES[membership.plan] || membership.plan
  const content = `
    <p>Hi ${user.name || 'there'},</p>
    <p>Thank you for becoming a <strong>${planName} Member</strong>!</p>
    <ul>
      <li><strong>Plan:</strong> ${planName}</li>
      <li><strong>Valid Until:</strong> ${formatDate(membership.end_date)}</li>
      <li><strong>Auto-Renewal:</strong> ${autoRenew ? 'Enabled ✓' : 'Disabled'}</li>
    </ul>
    ${autoRenew ? '<p>Your membership will automatically renew before expiration. You can manage this at any time from your <a href="' + addUtmParams('https://dicebastion.com/account', 'email', 'transactional', 'welcome') + '">account page</a>.</p>' : '<p>Remember to renew your membership before it expires to continue enjoying member benefits!</p>'}
    <div class="success">
      <strong>🎲 Member Benefits:</strong>
      <ul style="margin: 10px 0;">
        <li>Discounted event tickets</li>
        <li>Priority booking for tournaments</li>
        <li>Exclusive member events</li>
        <li>And much more!</li>
      </ul>
    </div>
    <p>See you at the club!</p>
    <p>— The Dice Bastion Team</p>
  `
  
  return {
    subject: `Welcome to Dice Bastion ${planName} Membership!`,
    html: createEmailTemplate({ 
      headerTitle: `Welcome to ${planName} Membership! 🎉`, 
      content,
      headerColor: '#10b981',
      headerGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    })
  }
}

// ============================================================================
// GENERAL USER LOGIN/LOGOUT ENDPOINTS (for all users)
// ============================================================================

// Public registration endpoint - creates new users or completes setup for users without passwords
app.post('/register', async c => {
  try {
    console.log('[User Register] Request received')
    const { email, name, password } = await c.req.json()
    console.log('[User Register] Email:', email, '| Name:', name)
    
    if (!email || !name || !password) {
      console.log('[User Register] Missing required fields')
      return c.json({ error: 'email_name_and_password_required' }, 400)
    }
    
    if (password.length < 8) {
      console.log('[User Register] Password too short')
      return c.json({ error: 'password_too_short', message: 'Password must be at least 8 characters' }, 400)
    }
    
    // Check if user already exists
    console.log('[User Register] Checking if user exists...')
    const existingUser = await c.env.DB.prepare(`
      SELECT user_id, email, name, password_hash, is_active
      FROM users
      WHERE LOWER(email) = LOWER(?)
    `).bind(email).first()
    
    const now = new Date().toISOString()
    let userId

    if (existingUser) {
      if (existingUser.password_hash) {
        // Full account already exists — user must log in or reset password
        console.log('[User Register] User already exists with password')
        return c.json({ 
          error: 'user_already_exists', 
          message: 'An account with this email already exists. Please login instead.' 
        }, 409)
      }

      // Stub account created by a checkout (no password) — complete the registration
      console.log('[User Register] Completing stub account for user', existingUser.user_id)
      const passwordHash = await bcrypt.hash(password, 10)
      await c.env.DB.prepare(`
        UPDATE users SET password_hash = ?, name = ?, is_active = 1, updated_at = ? WHERE user_id = ?
      `).bind(passwordHash, name, now, existingUser.user_id).run()
      userId = existingUser.user_id
    } else {
      // Brand new user
      console.log('[User Register] Creating new user')
      const passwordHash = await bcrypt.hash(password, 10)
      const result = await c.env.DB.prepare(`
        INSERT INTO users (email, name, password_hash, is_admin, is_active, created_at, updated_at)
        VALUES (?, ?, ?, 0, 1, ?, ?)
      `).bind(email, name, passwordHash, now, now).run()
      userId = result.meta.last_row_id
    }
    
    // Create session for auto-login
    const sessionToken = crypto.randomUUID()
    const sessionNow = new Date()
    const expiresAt = new Date(sessionNow.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_token, created_at, expires_at, last_activity)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      userId,
      sessionToken,
      toIso(sessionNow),
      toIso(expiresAt),
      toIso(sessionNow)
    ).run()
    
    console.log('[User Register] New user created, session created')
    return c.json({
      success: true,
      session_token: sessionToken,
      user: {
        id: userId,
        email: email,
        name: name,
        is_admin: false
      }
    })
  } catch (error) {
    console.error('[User Register] ERROR:', error)
    console.error('[User Register] Stack:', error.stack)
    return c.json({ error: 'internal_error', message: error.message }, 500)
  }
})

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
      
      // Store the reset token in password_reset_tokens table
      await c.env.DB.prepare(`
        INSERT INTO password_reset_tokens (user_id, token, expires_at, used, created_at)
        VALUES (?, ?, ?, 0, ?)
      `).bind(user.user_id, resetToken, expiresAt.toISOString(), new Date().toISOString()).run()
      
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

// ============================================================================
// ACCOUNT SETUP AFTER EVENT REGISTRATION (for users without passwords)
// ============================================================================

// Check if user needs account setup (called after event registration/purchase)
app.get('/account-setup/check', async c => {
  try {
    const email = c.req.query('email')
    
    if (!email) {
      return c.json({ error: 'email_required' }, 400)
    }
    
    // Find user by email
    const user = await c.env.DB.prepare(`
      SELECT user_id, email, name
      FROM users
      WHERE email = ? AND is_active = 1
    `).bind(email).first()
    
    if (!user) {
      return c.json({ needsSetup: false, reason: 'user_not_found' })
    }
    
    // All users now have passwords - no setup needed via this flow
    return c.json({ 
      needsSetup: false,
      email: user.email,
      name: user.name
    })
  } catch (error) {
    console.error('[Account Setup Check] ERROR:', error)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Request account setup (generates token and sends email)
app.post('/account-setup/request', async c => {
  try {
    const { email, source } = await c.req.json()
    
    if (!email) {
      return c.json({ error: 'email_required' }, 400)
    }
    
    // This endpoint is deprecated - all users must register with passwords
    // Always return success for security (don't reveal if user exists)
    console.log('[Account Setup Request] Endpoint deprecated - users must register with passwords')
    
    return c.json({ success: true })
  } catch (error) {
    console.error('[Account Setup Request] ERROR:', error)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Complete account setup (set password)
app.post('/account-setup/complete', async c => {
  try {
    // This endpoint is deprecated - all users must register with passwords
    console.log('[Account Setup Complete] Endpoint deprecated - users should use password reset if needed')
    return c.json({ error: 'endpoint_deprecated', message: 'Please use the password reset flow' }, 410)
  } catch (error) {
    console.error('[Account Setup Complete] ERROR:', error)
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

    // Get active payment instrument so the account page can show saved card info
    const paymentInstrument = membership ? await c.env.DB.prepare(`
      SELECT instrument_id, last_4, card_type, created_at FROM payment_instruments
      WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1
    `).bind(userId).first() : null
    
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
      payment_instrument: paymentInstrument || null,
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

// Change password
app.post('/account/change-password', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    
    if (!sessionToken) {
      return c.json({ error: 'no_session_token' }, 401)
    }
    
    // Get session and user
    const session = await c.env.DB.prepare(`
      SELECT us.user_id, u.email, u.password_hash
      FROM user_sessions us
      JOIN users u ON us.user_id = u.user_id
      WHERE us.session_token = ? AND us.expires_at > datetime('now')
    `).bind(sessionToken).first()
    
    if (!session) {
      return c.json({ error: 'invalid_session' }, 401)
    }
    
    const { currentPassword, newPassword } = await c.req.json()
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    if (newPassword.length < 8) {
      return c.json({ error: 'New password must be at least 8 characters long' }, 400)
    }
    
    // Verify current password
    const currentPasswordMatch = await bcrypt.compare(currentPassword, session.password_hash)
    if (!currentPasswordMatch) {
      return c.json({ error: 'Current password is incorrect' }, 400)
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    const now = new Date().toISOString()
    
    // Update password
    await c.env.DB.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = ?
      WHERE user_id = ?
    `).bind(newPasswordHash, now, session.user_id).run()
    
    console.log('[Password Change] Password updated for user:', session.email)
    
    return c.json({ 
      success: true, 
      message: 'Password updated successfully!' 
    })
  } catch (error) {
    console.error('[Password Change] ERROR:', error)
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
        }        const checkout = await checkoutResponse.json()
        
        // No need to store payment_setups record - the webhook will handle saving 
        // the payment instrument when payment completes
        
        // Return checkout details for frontend to open payment popup
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
    
    // Check if a payment instrument was saved for this user
    // The webhook should have already saved it after payment completed
    const instrument = await c.env.DB.prepare(`
      SELECT * FROM payment_instruments 
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC LIMIT 1
    `).bind(session.user_id).first()
    
    if (instrument) {
      // Payment instrument exists - enable auto-renewal
      const membership = await c.env.DB.prepare(`
        SELECT * FROM memberships 
        WHERE user_id = ? AND status = 'active'
        ORDER BY end_date DESC LIMIT 1
      `).bind(session.user_id).first()
      
      if (membership) {
        // Always reset failure state and link new instrument — covers both
        // fresh enable-auto-renewal and replace-card-after-failure flows.
        await c.env.DB.prepare(`
          UPDATE memberships 
          SET auto_renew = 1, renewal_attempts = 0, renewal_failed_at = NULL, payment_instrument_id = ?
          WHERE id = ?
        `).bind(instrument.instrument_id, membership.id).run()
      }
      
      return c.json({
        success: true,
        status: 'completed',
        card_last_4: instrument.last_4,
        card_type: instrument.card_type
      })
    }
    
    // No payment instrument found yet - payment might still be pending
    return c.json({ success: false, status: 'pending' })
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

// User-initiated retry of a failed renewal charge
app.post('/account/retry-renewal', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    if (!sessionToken) return c.json({ error: 'no_session_token' }, 401)

    const session = await c.env.DB.prepare(`
      SELECT us.user_id FROM user_sessions us
      WHERE us.session_token = ? AND us.expires_at > datetime('now')
    `).bind(sessionToken).first()
    if (!session) return c.json({ error: 'invalid_session' }, 401)

    const membership = await c.env.DB.prepare(`
      SELECT * FROM memberships WHERE user_id = ? AND status = 'active'
      ORDER BY end_date DESC LIMIT 1
    `).bind(session.user_id).first()
    if (!membership) return c.json({ error: 'no_active_membership', message: 'No active membership found.' }, 404)

    if (!membership.renewal_failed_at) {
      return c.json({ error: 'no_failed_renewal', message: 'No failed renewal to retry.' }, 400)
    }
    if (membership.renewal_attempts >= 3) {
      return c.json({ error: 'max_attempts_reached', message: 'Maximum retry attempts reached. Please update your card details.' }, 400)
    }

    const instrument = await getActivePaymentInstrument(c.env.DB, session.user_id)
    if (!instrument) {
      return c.json({ error: 'no_payment_method', message: 'No saved payment method found. Please add a card first.' }, 400)
    }

    console.log(`[Account Retry] User ${session.user_id} retrying renewal for membership ${membership.id}`)
    const result = await processMembershipRenewal(c.env.DB, membership, c.env)

    if (result.success) {
      return c.json({ success: true, message: 'Payment successful! Your membership has been renewed.', new_end_date: result.newEndDate })
    } else {
      return c.json({ success: false, message: 'Payment failed. Please update your card details and try again.', error: result.error }, 402)
    }
  } catch (error) {
    console.error('[Account Retry Renewal] ERROR:', error)
    return c.json({ error: 'internal_error', message: 'An error occurred. Please try again.' }, 500)
  }
})

// User-initiated card replacement — creates a £0 tokenization checkout
app.post('/account/update-payment-method', async c => {
  try {
    const sessionToken = c.req.header('X-Session-Token')
    if (!sessionToken) return c.json({ error: 'no_session_token' }, 401)

    const session = await c.env.DB.prepare(`
      SELECT us.user_id, u.email, u.name FROM user_sessions us
      JOIN users u ON us.user_id = u.user_id
      WHERE us.session_token = ? AND us.expires_at > datetime('now')
    `).bind(sessionToken).first()
    if (!session) return c.json({ error: 'invalid_session' }, 401)

    const membership = await c.env.DB.prepare(`
      SELECT * FROM memberships WHERE user_id = ? AND status = 'active'
      ORDER BY end_date DESC LIMIT 1
    `).bind(session.user_id).first()
    if (!membership) return c.json({ error: 'no_active_membership' }, 404)

    const orderRef = `CARD-UPDATE-${session.user_id}-${Date.now()}`
    const customerId = `USER-${session.user_id}`

    // Ensure SumUp customer exists
    const customerResponse = await c.env.PAYMENTS.fetch('https://payments/internal/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': c.env.INTERNAL_SECRET },
      body: JSON.stringify({ user_id: session.user_id, email: session.email, name: session.name })
    })
    if (!customerResponse.ok) throw new Error('Failed to create customer')

    // £0 tokenization checkout — saves card without charging
    const checkoutResponse = await c.env.PAYMENTS.fetch('https://payments/internal/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': c.env.INTERNAL_SECRET },
      body: JSON.stringify({
        amount: 0,
        currency: 'GBP',
        orderRef,
        description: 'Update saved payment method',
        savePaymentInstrument: true,
        customerId
      })
    })
    if (!checkoutResponse.ok) throw new Error('Failed to create checkout')

    const checkout = await checkoutResponse.json()
    return c.json({ success: true, checkout_id: checkout.id, order_ref: orderRef })
  } catch (error) {
    console.error('[Update Payment Method] ERROR:', error)
    return c.json({ error: 'internal_error', message: error.message }, 500)
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
    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode, c)
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
    }    // Auto-renewal is always enabled — users get a 7-day reminder email before renewal
    const autoRenewValue = 1
    
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
      
      // For auto-renewal: use SETUP_RECURRING_PAYMENT checkout with the real amount.
      // SumUp auths the amount and instantly reimburses it (auth hold released).
      // The real membership charge is made after card tokenization using the saved instrument.
      checkout = await createCheckout(c.env, { 
        amount, 
        currency, 
        orderRef: order_ref, 
        title: `Dice Bastion ${plan} membership`, 
        description: autoRenewValue === 1 ? `Card setup for ${plan} membership` : `Membership for ${plan}`,
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

// Check if an email has an active membership
app.get('/membership/check', async (c) => {
  const email = c.req.query('email')
  if (!email || !EMAIL_RE.test(email)) {
    return c.json({ hasActiveMembership: false })
  }
  
  try {
    const user = await c.env.DB.prepare('SELECT user_id FROM users WHERE email = ?').bind(email).first()
    if (!user) {
      return c.json({ hasActiveMembership: false })
    }
    
    const membership = await getActiveMembership(c.env.DB, user.user_id)
    return c.json({ hasActiveMembership: membership !== null })
  } catch (e) {
    console.error('[membership/check] Error:', e)
    return c.json({ hasActiveMembership: false })
  }
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
    // Get user details for account setup check
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(pending.user_id).first()
    
    // Get card details if auto-renewal is enabled
    let cardLast4 = null
    if (pending.auto_renew === 1 && pending.payment_instrument_id) {
      const instrument = await c.env.DB.prepare('SELECT last_4 FROM payment_instruments WHERE instrument_id = ?')
        .bind(pending.payment_instrument_id).first()
      cardLast4 = instrument?.last_4 || null
    }
    
    // All users now have passwords from registration
    
    return c.json({ 
      ok: true, 
      status: 'already_active',
      plan: pending.plan,
      endDate: pending.end_date,
      amount: transaction.amount,
      currency: transaction.currency || 'GBP',
      autoRenew: pending.auto_renew === 1,
      cardLast4,
      userEmail: user?.email || transaction.email
    })
  }
  
  // Verify payment with SumUp
  let payment; 
  try { payment = await fetchPayment(c.env, transaction.checkout_id) } 
  catch { return c.json({ ok:false, error:'verify_failed' },400) }
  
  if (!isCheckoutPaid(payment)) {
    const currentStatus = payment?.status || 'PENDING'
    const txStatuses = payment?.transactions?.map(t => t.status) || []
    const hasFailed = txStatuses.includes('FAILED') || currentStatus === 'FAILED'
    const hasDeclined = txStatuses.includes('DECLINED') || currentStatus === 'DECLINED'
    console.log('[membership/confirm] Payment not yet paid, status:', currentStatus, 'txStatuses:', txStatuses)
    
    return c.json({ 
      ok: false, 
      status: hasFailed ? 'FAILED' : hasDeclined ? 'DECLINED' : currentStatus,
      message: hasFailed ? 'Payment failed. Please check your card details and try again.' :
               hasDeclined ? 'Your card was declined. Please use a different payment method.' :
               'Payment is still processing.'
    })
  }
  
  // For tokenization checkouts (SETUP_RECURRING_PAYMENT), the payment amount is a minimal auth (0.01)
  // The real amount will be charged separately using the saved payment instrument
  const isTokenizationCheckout = payment.purpose === 'SETUP_RECURRING_PAYMENT'
  
  // Verify amount/currency (skip for tokenization - real charge happens after card is saved)
  if (!isTokenizationCheckout) {
    if (payment.amount != Number(transaction.amount) || (transaction.currency && payment.currency !== transaction.currency)) {
      return c.json({ ok:false, error:'payment_mismatch' },400)
    }
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
  
  // Get user details and send welcome email (don't block if email fails)
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(identityId).first()
  let emailSent = false
  if (user) {
    try {
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
      emailSent = true
      console.log('[membership/confirm] Welcome email sent successfully to:', user.email)
    } catch (emailError) {
      console.error('[membership/confirm] Failed to send welcome email:', emailError)
      // Don't fail the transaction - payment succeeded and membership is active
    }
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
    console.log('[membership/confirm] Admin notification sent successfully')
  } catch (adminEmailError) {
    console.error('[membership/confirm] Failed to send admin notification:', adminEmailError)
    // Don't fail the main transaction if admin email fails
  }
  
  // Get payment instrument details for display
  let cardLast4 = null
  if (instrumentId) {
    const instrument = await c.env.DB.prepare('SELECT last_4 FROM payment_instruments WHERE instrument_id = ? AND user_id = ?')
      .bind(instrumentId, identityId).first()
    cardLast4 = instrument?.last_4 || null
  }
  
  // All users now have passwords from registration
  
  return c.json({ 
    ok: true, 
    status: 'active',
    plan: pending.plan,
    endDate: toIso(end),
    amount: transaction.amount,
    currency: transaction.currency || 'GBP',
    autoRenew: pending.auto_renew === 1,
    cardLast4,
    userEmail: user?.email || transaction.email,
    emailSent,  // Let frontend know if welcome email was sent
    needsAccountSetup: !user?.password_hash
  })
})

// ============================================================================
// SPONSORED MEMBERSHIPS
// ============================================================================

/**
 * Ensure the sponsored_memberships table exists (lazy migration).
 */
async function migrateSponsoredMemberships(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS sponsored_memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchased_by_email TEXT NOT NULL,
      purchased_by_name  TEXT,
      purchased_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      order_ref TEXT UNIQUE NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','available','claimed','refunded')),
      claimed_by_user_id INTEGER,
      claimed_at TEXT,
      FOREIGN KEY (claimed_by_user_id) REFERENCES users(user_id)
    )
  `).run()
}

/**
 * GET /membership/sponsor/pool
 * Returns the number of available sponsored memberships.
 */
app.get('/membership/sponsor/pool', async (c) => {
  try {
    await migrateSponsoredMemberships(c.env.DB)
    const row = await c.env.DB.prepare(
      `SELECT COUNT(*) as available FROM sponsored_memberships WHERE status = 'available'`
    ).first()
    return c.json({ available: Number(row?.available || 0) })
  } catch (e) {
    console.error('[sponsor/pool] Error:', e)
    return c.json({ available: 0 })
  }
})

/**
 * POST /membership/sponsor/checkout
 * Purchase a sponsorship — creates a SumUp checkout at the annual plan price.
 * Does NOT create a membership for the buyer; instead creates a sponsored_membership record.
 */
const sponsorCheckoutRateLimits = new Map()

app.post('/membership/sponsor/checkout', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP')
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    if (!checkRateLimit(ip, sponsorCheckoutRateLimits, 3, 1)) {
      return c.json({ error: 'rate_limit_exceeded', message: 'Too many requests. Please try again in a minute.' }, 429)
    }

    const idem = c.req.header('Idempotency-Key')?.trim()
    const { email, name, privacyConsent, turnstileToken } = await c.req.json()
    if (!email) return c.json({ error: 'missing_fields' }, 400)
    if (!EMAIL_RE.test(email) || email.length > 320) return c.json({ error: 'invalid_email' }, 400)
    if (!privacyConsent) return c.json({ error: 'privacy_consent_required' }, 400)

    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode, c)
    if (!tsOk) return c.json({ error: 'turnstile_failed' }, 403)

    await migrateSponsoredMemberships(c.env.DB)

    // Use the quarterly plan price
    const svc = await getServiceForPlan(c.env.DB, 'quarterly')
    if (!svc) return c.json({ error: 'plan_not_configured' }, 400)
    const amount = Number(svc.amount)
    const currency = svc.currency || 'GBP'

    const order_ref = crypto.randomUUID()

    // Idempotency check
    if (idem) {
      const existing = await c.env.DB.prepare(
        `SELECT t.order_ref, t.checkout_id FROM transactions t
         JOIN sponsored_memberships sm ON sm.id = t.reference_id
         WHERE t.transaction_type = 'sponsorship' AND t.email = ? AND t.idempotency_key = ?
         ORDER BY t.id DESC LIMIT 1`
      ).bind(email, idem).first()
      if (existing?.checkout_id) {
        return c.json({ orderRef: existing.order_ref, checkoutId: existing.checkout_id, reused: true })
      }
    }

    let checkout
    try {
      checkout = await createCheckout(c.env, {
        amount,
        currency,
        orderRef: order_ref,
        title: 'Dice Bastion – Sponsor a Membership',
        description: 'Quarterly sponsored membership for a community member',
        savePaymentInstrument: false
      })
    } catch (err) {
      console.error('[sponsor/checkout] SumUp error:', err)
      return c.json({ error: 'sumup_checkout_failed', message: String(err?.message || err) }, 502)
    }
    if (!checkout.id) return c.json({ error: 'sumup_missing_id' }, 502)

    // Create pending sponsored_membership record
    const smResult = await c.env.DB.prepare(
      `INSERT INTO sponsored_memberships (purchased_by_email, purchased_by_name, order_ref, amount_paid, status)
       VALUES (?, ?, ?, ?, 'pending') RETURNING id`
    ).bind(email, name || null, order_ref, amount).first()
    const smId = smResult?.id

    // Create transaction record
    await c.env.DB.prepare(
      `INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref,
                                 checkout_id, amount, currency, payment_status, idempotency_key, consent_at)
       VALUES ('sponsorship', ?, NULL, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(smId, email, name || null, order_ref, checkout.id,
           String(amount), currency, idem || null, toIso(new Date())).run()

    return c.json({ orderRef: order_ref, checkoutId: checkout.id })
  } catch (e) {
    console.error('[sponsor/checkout] Error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

/**
 * GET /membership/sponsor/confirm?orderRef=...
 * Polled by the frontend after SumUp reports success.
 * Verifies payment and marks the sponsored_membership as 'available'.
 */
app.get('/membership/sponsor/confirm', async (c) => {
  const orderRef = c.req.query('orderRef')
  if (!orderRef || !UUID_RE.test(orderRef)) return c.json({ ok: false, error: 'invalid_orderRef' }, 400)

  try {
    await migrateSponsoredMemberships(c.env.DB)

    const transaction = await c.env.DB.prepare(
      `SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = 'sponsorship'`
    ).bind(orderRef).first()
    if (!transaction) return c.json({ ok: false, error: 'order_not_found' }, 404)

    const sm = await c.env.DB.prepare(
      `SELECT * FROM sponsored_memberships WHERE id = ?`
    ).bind(transaction.reference_id).first()
    if (!sm) return c.json({ ok: false, error: 'sponsorship_not_found' }, 404)

    // Already confirmed
    if (sm.status === 'available') {
      return c.json({ ok: true, status: 'active', message: 'Sponsorship already active' })
    }

    // Verify payment
    let payment
    try { payment = await fetchPayment(c.env, transaction.checkout_id) }
    catch { return c.json({ ok: false, error: 'verify_failed' }, 400) }

    if (!isCheckoutPaid(payment)) {
      const currentStatus = payment?.status || 'PENDING'
      const txStatuses = payment?.transactions?.map(t => t.status) || []
      const hasFailed = txStatuses.includes('FAILED') || currentStatus === 'FAILED'
      const hasDeclined = txStatuses.includes('DECLINED') || currentStatus === 'DECLINED'
      return c.json({
        ok: false,
        status: hasFailed ? 'FAILED' : hasDeclined ? 'DECLINED' : currentStatus,
        message: hasFailed ? 'Payment failed. Please try again.' :
                 hasDeclined ? 'Your card was declined.' : 'Payment is still processing.'
      })
    }

    // Mark sponsorship as available (in the pool)
    await c.env.DB.prepare(
      `UPDATE sponsored_memberships SET status = 'available' WHERE id = ?`
    ).bind(sm.id).run()

    // Update transaction status
    await c.env.DB.prepare(
      `UPDATE transactions SET payment_status = 'PAID', payment_id = ?, updated_at = ? WHERE id = ?`
    ).bind(payment.id, toIso(new Date()), transaction.id).run()

    return c.json({ ok: true, status: 'active', message: 'Thank you! Your sponsorship has been added to the pool.' })
  } catch (e) {
    console.error('[sponsor/confirm] Error:', e)
    return c.json({ ok: false, error: 'internal_error' }, 500)
  }
})

/**
 * POST /membership/sponsor/claim
 * Allows a user without a membership to claim one from the sponsored pool.
 */
app.post('/membership/sponsor/claim', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP')
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    const { email, name, privacyConsent, turnstileToken } = await c.req.json()

    if (!email) return c.json({ error: 'email_required' }, 400)
    if (!EMAIL_RE.test(email) || email.length > 320) return c.json({ error: 'invalid_email' }, 400)
    if (!privacyConsent) return c.json({ error: 'privacy_consent_required' }, 400)

    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode, c)
    if (!tsOk) return c.json({ error: 'turnstile_failed' }, 403)

    await migrateSponsoredMemberships(c.env.DB)

    // Check user doesn't already have an active membership
    const ident = await getOrCreateIdentity(c.env.DB, email, name || null)
    const activeMembership = await getActiveMembership(c.env.DB, ident.id)
    if (activeMembership) {
      return c.json({ error: 'already_member', message: 'You already have an active membership.' }, 409)
    }

    // Check pool availability
    const poolRow = await c.env.DB.prepare(
      `SELECT id FROM sponsored_memberships WHERE status = 'available' ORDER BY id ASC LIMIT 1`
    ).first()
    if (!poolRow) {
      return c.json({ error: 'none_available', message: 'No sponsored memberships are currently available. Please check back later.' }, 409)
    }

    // Get quarterly plan details for membership duration
    const svc = await getServiceForPlan(c.env.DB, 'quarterly')
    if (!svc) return c.json({ error: 'plan_not_configured' }, 400)
    const months = Number(svc.months || 3)

    // Calculate membership dates
    const now = new Date()
    const end = addMonths(now, months)
    const order_ref = crypto.randomUUID()

    // Create membership record for the claimant
    const mResult = await c.env.DB.prepare(
      `INSERT INTO memberships (user_id, plan, status, start_date, end_date, auto_renew, order_ref)
       VALUES (?, 'quarterly', 'active', ?, ?, 0, ?) RETURNING id`
    ).bind(ident.id, toIso(now), toIso(end), order_ref).first()
    const membershipId = mResult?.id

    // Claim the sponsorship record
    await c.env.DB.prepare(
      `UPDATE sponsored_memberships
       SET status = 'claimed', claimed_by_user_id = ?, claimed_at = ?
       WHERE id = ?`
    ).bind(ident.id, toIso(now), poolRow.id).run()

    // Send welcome email (best-effort)
    try {
      const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(ident.id).first()
      if (user) {
        const updatedMembership = { plan: 'quarterly', end_date: toIso(end), auto_renew: 0 }
        const emailContent = getWelcomeEmail(updatedMembership, user, false)
        await sendEmail(c.env, {
          to: user.email,
          ...emailContent,
          emailType: 'membership_welcome',
          relatedId: membershipId,
          relatedType: 'membership',
          metadata: { plan: 'quarterly', sponsored: true }
        })
      }
    } catch (emailError) {
      console.error('[sponsor/claim] Failed to send welcome email:', emailError)
    }

    return c.json({
      ok: true,
      message: 'Your sponsored membership has been activated.',
      endDate: toIso(end),
      orderRef: order_ref
    })
  } catch (e) {
    console.error('[sponsor/claim] Error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// ============================================================================
// END SPONSORED MEMBERSHIPS
// ============================================================================

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

  // Detect if this is a bundle purchase (BUNDLE-{eventId}-{uuid})
  const isBundle = orderRef.startsWith('BUNDLE-')

  // Check for duplicate webhook processing
  const webhookId = `${paymentId}-${orderRef}`
  const entityType = isBundle ? 'bundle' : 'membership'
  const isDuplicate = await checkAndMarkWebhookProcessed(c.env.DB, webhookId, entityType, orderRef)
  if (isDuplicate) {
    console.log(`Duplicate ${entityType} webhook received, skipping processing`)
    return c.json({ ok: true, status: 'already_processed' })
  }

  let payment
  try { payment = await fetchPayment(c.env, paymentId) } catch (e) { return c.json({ ok: false, error: 'verify_failed' }, 400) }
  if (!isCheckoutPaid(payment)) return c.json({ ok: true })

  // ==================== BUNDLE PURCHASE WEBHOOK ====================
  if (isBundle) {
    console.log('[webhook-bundle] Processing bundle order:', orderRef)

    const bundle = await resolveBundleRecords(c.env.DB, orderRef)
    if (!bundle) {
      console.error('[webhook-bundle] Could not resolve bundle records for:', orderRef)
      return c.json({ ok: false, error: 'bundle_records_not_found' }, 404)
    }

    // If already fully activated, skip
    if (bundle.membership.status === 'active' && bundle.ticket.status === 'active') {
      console.log('[webhook-bundle] Already active, skipping')
      return c.json({ ok: true, status: 'already_active' })
    }

    try {
      await confirmBundlePurchase(c.env.DB, c.env, { bundle, paymentId, checkoutId: bundle.transaction.checkout_id })
      console.log('[webhook-bundle] Bundle confirmed for order:', orderRef)
    } catch (err) {
      console.error('[webhook-bundle] Failed to confirm bundle:', err)
      return c.json({ ok: false, error: err.message }, 400)
    }

    return c.json({ ok: true })
  }

  // ==================== REGULAR MEMBERSHIP WEBHOOK ====================
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
  // Get the transaction record to find the real payment amount
  const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE order_ref = ? AND transaction_type = "membership"').bind(orderRef).first()
  
  let actualPaymentId = paymentId
  let instrumentId = null
  
  // Save payment instrument and charge actual amount if auto-renewal is enabled
  if (pending.auto_renew === 1) {
    console.log('[webhook] Auto-renewal enabled, saving payment instrument for checkout:', paymentId)
    instrumentId = await savePaymentInstrument(c.env.DB, identityId, paymentId, c.env)
    if (instrumentId) {
      console.log('[webhook] Payment instrument saved successfully:', instrumentId)
      
      // If tokenization checkout, charge the real amount with the saved instrument
      if (payment.purpose === 'SETUP_RECURRING_PAYMENT' && transaction) {
        console.log('[webhook] Tokenization detected - charging saved instrument for actual membership payment')
        try {
          const chargeResult = await chargePaymentInstrument(
            c.env,
            identityId,
            instrumentId,
            transaction.amount,
            transaction.currency || 'GBP',
            `${orderRef}-charge`,
            `Dice Bastion ${pending.plan} membership payment`
          )
          
          if (chargeResult && chargeResult.id) {
            actualPaymentId = chargeResult.id
            console.log('[webhook] Successfully charged saved instrument:', actualPaymentId)
            
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
              `${orderRef}-charge`,
              actualPaymentId,
              transaction.amount,
              transaction.currency || 'GBP',
              toIso(new Date())
            ).run()
          } else {
            console.error('[webhook] Failed to charge saved instrument - tokenization succeeded but real payment failed')
          }
        } catch (chargeError) {
          console.error('[webhook] Error charging saved instrument:', chargeError)
        }
      }
    } else {
      console.warn('[webhook] Failed to save payment instrument, but membership activation will continue')
    }
  }
  
  // Activate membership with correct payment ID and instrument
  await c.env.DB.prepare('UPDATE memberships SET status = "active", start_date = ?, end_date = ?, payment_id = ?, payment_instrument_id = ? WHERE id = ?')
    .bind(toIso(start), toIso(end), actualPaymentId, instrumentId, pending.id).run()
  
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
      amount: transaction ? transaction.amount : payment.amount,
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
      metadata: { plan: pending.plan, amount: transaction ? transaction.amount : payment.amount }
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

/**
 * Generate an indexable SEO landing page for a shared event link.
 * Contains OG / Twitter / Schema.org metadata for rich previews,
 * plus a lightweight visible page so Google can index it (no redirect).
 * Real users click through or get taken to the full events page via JS.
 */
function generateEventSeoPage(event) {
  const e = s => (s || '').replace(/[<>"]/g, '');
  const site = 'https://dicebastion.com';
  const title = e(event.title || event.event_name || 'Event');
  const slug = event.slug || '';
  const dt = event.event_datetime || '';
  const endTime = event.end_time || '';  // HH:MM format
  const loc = e(event.location || 'Gibraltar Warhammer Club');
  const img = event.seo_image || event.image_url || `${site}/img/default-event.jpg`;
  const raw = event.seo_description || event.description || '';
  const desc = e(raw.length > 160 ? raw.substring(0, 157) + '...' : raw);
  const fullDesc = e(raw);
  const url = `${site}/events/${slug}`;
  const eventsPage = `${site}/events?open=${encodeURIComponent(slug)}`;
  const priceNum = (Number(event.non_membership_price) || 0) / 100;
  const priceDisplay = priceNum.toFixed(2);
  const isFree = priceNum === 0;
  const organiserName = e(event.seo_organizer || event.organiser || 'Dice Bastion');

  // Gibraltar timezone: CET (UTC+1) in winter, CEST (UTC+2) in summer
  // DST runs from last Sunday of March to last Sunday of October
  let tzOffset = '+01:00';
  let startDateISO = dt;
  let endDateISO = '';
  if (dt) {
    try {
      const d = new Date(dt);
      const year = d.getUTCFullYear();
      // Last Sunday of March
      const marchLast = new Date(Date.UTC(year, 2, 31));
      marchLast.setUTCDate(31 - marchLast.getUTCDay());
      // Last Sunday of October
      const octLast = new Date(Date.UTC(year, 9, 31));
      octLast.setUTCDate(31 - octLast.getUTCDay());
      const isCEST = d >= marchLast && d < octLast;
      tzOffset = isCEST ? '+02:00' : '+01:00';
      // Append offset if the stored datetime doesn't already have one
      if (!dt.includes('+') && !dt.includes('Z')) {
        startDateISO = dt + tzOffset;
      }
      // Compute endDate from event date + end_time, or default to +4 hours
      if (endTime) {
        const datePart = dt.split('T')[0];
        endDateISO = `${datePart}T${endTime}:00${tzOffset}`;
      } else {
        // Default: 4 hours after start
        const endD = new Date(d.getTime() + 4 * 60 * 60 * 1000);
        const pad = n => String(n).padStart(2, '0');
        endDateISO = `${endD.getUTCFullYear()}-${pad(endD.getUTCMonth()+1)}-${pad(endD.getUTCDate())}T${pad(endD.getUTCHours())}:${pad(endD.getUTCMinutes())}:00${tzOffset}`;
      }
    } catch {}
  }

  // Format the date nicely for display
  let dateStr = '';
  let timeStr = '';
  if (dt) {
    try {
      const d = new Date(dt);
      dateStr = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
      timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    } catch {}
  }

  // Build Google-compliant Event structured data (JSON-LD)
  // https://developers.google.com/search/docs/appearance/structured-data/event
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    'name': title,
    'description': fullDesc || desc,
    'startDate': startDateISO,
    'eventStatus': 'https://schema.org/EventScheduled',
    'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
    'location': {
      '@type': 'Place',
      'name': loc,
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'Unit 23a Casemates Vaults',
        'addressLocality': 'Gibraltar',
        'postalCode': 'GX11 1AA',
        'addressCountry': 'GI'
      }
    },
    'image': [img],
    'url': url,
    'offers': {
      '@type': 'Offer',
      'url': eventsPage,
      'price': priceNum,
      'priceCurrency': 'GBP',
      'availability': 'https://schema.org/InStock',
      'validFrom': event.created_at || new Date().toISOString()
    },
    'organizer': {
      '@type': 'Organization',
      'name': organiserName,
      'url': site
    }
  };

  // Add endDate if end_time is provided (Google strongly recommends this)
  if (endDateISO) {
    schema.endDate = endDateISO;
  }

  // Format end time for display
  let endTimeStr = '';
  if (endTime) {
    try {
      const [h, m] = endTime.split(':');
      endTimeStr = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    } catch {}
  }

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} | Dice Bastion</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="event"><meta property="og:url" content="${url}">
<meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}"><meta property="og:site_name" content="Dice Bastion">
<meta property="event:start_time" content="${dt}"><meta property="event:location" content="${loc}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${img}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<link rel="canonical" href="${url}">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#1a1a2e;color:#e0e0e0;min-height:100vh;display:flex;flex-direction:column;align-items:center}
.header{width:100%;padding:1rem 1.5rem;background:#16162a;text-align:center;border-bottom:1px solid #2a2a4a}
.header a{color:#e0e0e0;text-decoration:none;font-size:1.1rem;font-weight:600}
.card{max-width:640px;width:100%;margin:2rem auto;background:#16162a;border-radius:16px;overflow:hidden;border:1px solid #2a2a4a}
.card img{width:100%;height:auto;display:block;max-height:360px;object-fit:cover}
.card-body{padding:1.5rem}
h1{font-size:1.5rem;margin-bottom:.75rem;color:#fff}
.desc{color:#b0b0c0;line-height:1.6;margin-bottom:1.25rem}
.meta{display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem}
.meta-item{display:flex;flex-direction:column;gap:.15rem}
.meta-label{font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#808090}
.meta-value{font-size:.95rem;color:#e0e0e0}
.badge{display:inline-block;padding:.2rem .6rem;border-radius:6px;font-size:.8rem;font-weight:600}
.badge-free{background:#064e3b;color:#6ee7b7}
.badge-paid{background:#4a2c0a;color:#fbbf24}
.cta{display:inline-block;padding:.75rem 2rem;background:#7c3aed;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:1rem;transition:background .2s}
.cta:hover{background:#6d28d9}
.footer{margin-top:auto;padding:1.5rem;text-align:center;font-size:.85rem;color:#606070}
.footer a{color:#a78bfa;text-decoration:none}
</style>
</head><body>
<div class="header"><a href="${site}">Dice Bastion</a></div>
<div class="card">
${img ? `<img src="${img}" alt="${title}">` : ''}
<div class="card-body">
<h1>${title}</h1>
${fullDesc ? `<p class="desc">${fullDesc}</p>` : ''}
<div class="meta">
${dateStr ? `<div class="meta-item"><span class="meta-label">Date</span><span class="meta-value">${dateStr}</span></div>` : ''}
${timeStr ? `<div class="meta-item"><span class="meta-label">Time</span><span class="meta-value">${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ''}</span></div>` : ''}
${loc ? `<div class="meta-item"><span class="meta-label">Location</span><span class="meta-value">${loc}</span></div>` : ''}
<div class="meta-item"><span class="meta-label">Price</span><span class="meta-value">${isFree ? '<span class="badge badge-free">Free</span>' : `<span class="badge badge-paid">£${priceDisplay}</span>`}</span></div>
</div>
<a class="cta" href="${eventsPage}">View Event &amp; Register</a>
</div>
</div>
<div class="footer"><a href="${site}/events/">← All Events</a></div>
</body></html>`;
}

// Get all active events (public endpoint)
app.get('/events', async c => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        event_id as id,
        event_name as title,
        slug,
        organiser,
        description,
        full_description,
        seo_description,
        seo_organizer,
        seo_image,
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
        recurrence_end_date,
        end_time
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
    if (!orderRef) return c.json({ ok:false, error:'invalid_orderRef' },400)
    
    // Check if this is a bundle purchase (BUNDLE-{eventId}-{uuid})
    const isBundle = orderRef.startsWith('BUNDLE-')
    
    if (isBundle) {
      // Handle membership + event bundle confirmation
      const bundle = await resolveBundleRecords(c.env.DB, orderRef)
      if (!bundle) return c.json({ ok:false, error:'bundle_records_not_found' },404)

      const { transaction, membership, ticket, event, membershipId } = bundle

      // If already activated, return success with details for the thank-you page
      if (membership.status === 'active' && ticket.status === 'active') {
        return c.json({ 
          ok: true, 
          status: 'already_active',
          isBundle: true,
          membershipPlan: membership.plan,
          membershipEndDate: membership.end_date,
          eventName: event.event_name,
          eventDate: event.event_datetime,
          amount: transaction.amount,
          currency: transaction.currency || 'GBP'
        })
      }

      // Verify payment
      let payment
      try { 
        payment = await fetchPayment(c.env, transaction.checkout_id)
      } catch (err) { 
        return c.json({ ok:false, error:'verify_failed' },400) 
      }

      if (!isCheckoutPaid(payment)) {
        const currentStatus = payment?.status || 'PENDING'
        // Check if any transaction has a terminal failure state
        const txStatuses = payment?.transactions?.map(t => t.status) || []
        const hasFailed = txStatuses.includes('FAILED') || currentStatus === 'FAILED'
        const hasDeclined = txStatuses.includes('DECLINED') || currentStatus === 'DECLINED'
        return c.json({ 
          ok: false, 
          status: hasFailed ? 'FAILED' : hasDeclined ? 'DECLINED' : currentStatus,
          message: hasFailed ? 'Payment failed. Please try again.' :
                   hasDeclined ? 'Your card was declined. Please use a different payment method.' :
                   'Payment is still processing.'
        })
      }

      // Activate membership + ticket, send emails, admin notification
      try {
        const result = await confirmBundlePurchase(c.env.DB, c.env, {
          bundle, paymentId: payment.id, checkoutId: transaction.checkout_id
        })

        return c.json({ 
          ok: true, 
          status: 'active',
          isBundle: true,
          membershipPlan: membership.plan,
          membershipEndDate: result.endDate,
          autoRenew: membership.auto_renew === 1,
          eventName: event.event_name,
          eventDate: event.event_datetime,
          amount: transaction.amount,
          currency: transaction.currency || 'GBP',
          userEmail: result.user?.email || transaction.email,
          emailSent: result.emailSent,
          needsAccountSetup: result.needsAccountSetup
        })
      } catch (err) {
        console.error('[events/confirm] Bundle confirmation failed:', err)
        return c.json({ ok:false, error: err.message },400)
      }
    }
    
    // Check if this is a free event registration (REG-{eventId}-{ticketId}) or paid ticket (EVT-{eventId}-{uuid})
    const isRegistration = orderRef.startsWith('REG-')
    
    if (isRegistration) {
      // Handle free event registration confirmation
      // Format: REG-{eventId}-{ticketId}
      const parts = orderRef.split('-')
      if (parts.length !== 3) return c.json({ ok:false, error:'invalid_orderRef' },400)
      
      const ticketId = parseInt(parts[2], 10)
      if (isNaN(ticketId)) return c.json({ ok:false, error:'invalid_orderRef' },400)
      
      // Get ticket record
      const ticket = await c.env.DB.prepare('SELECT * FROM tickets WHERE id = ?').bind(ticketId).first()
      if (!ticket) {
        console.log('[events/confirm] Registration ticket not found for id:', ticketId)
        return c.json({ ok:false, error:'ticket_not_found' },404)
      }
      
      console.log('[events/confirm] Registration ticket found:', { id: ticket.id, status: ticket.status, event_id: ticket.event_id })
      
      // Get event details
      const ev = await c.env.DB.prepare('SELECT event_name, event_datetime, is_recurring, recurrence_pattern FROM events WHERE event_id = ?').bind(ticket.event_id).first()
      if (!ev) return c.json({ ok:false, error:'event_not_found' },404)
      
      // For recurring events, calculate and return the next occurrence date
      let displayDate = ev.event_datetime
      if (ev.is_recurring === 1) {
        const nextOccurrence = calculateNextOccurrence(ev, new Date())
        if (nextOccurrence) {
          displayDate = nextOccurrence.toISOString()
        }
      }
      
      return c.json({ 
        ok: true, 
        status: 'active',
        eventName: ev.event_name,
        eventDate: displayDate,
        ticketCount: 1,
        amount: '0.00',
        currency: 'GBP',
        isFree: true
      })
    }
    
    // Handle paid ticket confirmation
    if (!EVT_UUID_RE.test(orderRef)) return c.json({ ok:false, error:'invalid_orderRef' },400)
  
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
      const currentStatus = payment?.status || 'PENDING'
      console.log('[events/confirm] Payment not yet paid, status:', currentStatus)
      
      // Return specific status for frontend to handle appropriately
      // FAILED/DECLINED should stop polling and show error
      return c.json({ 
        ok: false, 
        status: currentStatus,
        message: currentStatus === 'FAILED' ? 'Payment failed. Please check your card details and try again.' :
                 currentStatus === 'DECLINED' ? 'Your card was declined. Please use a different payment method.' :
                 'Payment is still processing.'
      })
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
    
    // Send confirmation email (don't block success if email fails)
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(transaction.user_id).first()
    let emailSent = false
    if (user) {
      try {
        // For recurring events, calculate next occurrence for calendar invite
        const eventForEmail = { ...ev }
        if (ev.is_recurring === 1) {
          const nextOccurrence = calculateNextOccurrence(ev, new Date())
          if (nextOccurrence) {
            eventForEmail.event_datetime = nextOccurrence.toISOString()
          }
        }
        
        const emailContent = getTicketConfirmationEmail(eventForEmail, user, transaction)
        await sendEmail(c.env, { 
          to: user.email, 
          ...emailContent,
          emailType: 'event_ticket_confirmation',
          relatedId: ticket.id,
          relatedType: 'ticket',
          metadata: { event_id: ev.id, event_name: ev.event_name }
        })
        emailSent = true
        console.log('[events/confirm] Confirmation email sent successfully to:', user.email)
      } catch (emailError) {
        console.error('[events/confirm] Failed to send confirmation email:', emailError)
        // Don't fail the transaction - payment succeeded and ticket is active
      }
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
      console.log('[events/confirm] Admin notification sent successfully')
    } catch (adminEmailError) {
      console.error('[events/confirm] Failed to send admin notification:', adminEmailError)
      // Don't fail the main transaction if admin email fails
    }
    
    // All users now have passwords from registration
    
    // For recurring events, calculate and return the next occurrence date
    let displayDate = ev.event_datetime
    if (ev.is_recurring === 1) {
      const nextOccurrence = calculateNextOccurrence(ev, new Date())
      if (nextOccurrence) {
        displayDate = nextOccurrence.toISOString()
      }
    }
    
    return c.json({ 
      ok: true, 
      status: 'active',
      eventName: ev.event_name,
      eventDate: displayDate,
      ticketCount: 1,
      amount: transaction.amount,
      currency: transaction.currency || 'GBP',
      userEmail: user?.email || transaction.email,
      emailSent,  // Let frontend know if confirmation email was sent
      needsAccountSetup: !user?.password_hash
    })
  } catch (error) {
    console.error('[events/confirm] EXCEPTION:', error)
    return c.json({ ok: false, error: 'internal_error', message: error.message, stack: error.stack }, 500)
  }
})

// Dynamic sitemap for event URLs (so Google can discover them)
app.get('/events/sitemap.xml', async c => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT slug, event_datetime, updated_at, created_at, is_recurring
      FROM events
      WHERE is_active = 1
        AND (event_datetime >= datetime('now') OR is_recurring = 1)
      ORDER BY event_datetime ASC
    `).all()

    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const urls = (results || []).map(e => {
      const loc = `https://dicebastion.com/events/${e.slug}`
      // Pick the best lastmod: updated_at > created_at > event_datetime > today
      let lastmod
      if (e.updated_at) {
        lastmod = new Date(e.updated_at).toISOString().split('T')[0]
      } else if (e.created_at) {
        lastmod = new Date(e.created_at).toISOString().split('T')[0]
      } else if (e.event_datetime) {
        lastmod = new Date(e.event_datetime).toISOString().split('T')[0]
      } else {
        lastmod = today
      }
      // For recurring events or any event with a stale lastmod (>30 days old),
      // use today so Google doesn't deprioritize crawling
      const lastmodDate = new Date(lastmod)
      if (e.is_recurring || lastmodDate < thirtyDaysAgo) {
        lastmod = today
      }
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    }).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      }
    })
  } catch (err) {
    console.error('Sitemap error:', err)
    return new Response('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    })
  }
})

// Get single event by slug (public endpoint)
// Serves SEO HTML for browsers (crawlers, shared links), JSON for API calls
app.get('/events/:slug', async c => {
  try {
    const slug = c.req.param('slug')
    
    // Static files (index.html, index.json, etc.) aren't event slugs
    if (!slug || slug.includes('.')) {
      return c.json({ error: 'not_found' }, 404)
    }
    
    const event = await c.env.DB.prepare(`
      SELECT 
        event_id as id,
        event_name as title,
        slug,
        organiser,
        description,
        full_description,
        seo_description,
        seo_organizer,
        seo_image,
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
        recurrence_end_date,
        end_time,
        created_at
      FROM events 
      WHERE slug = ? AND is_active = 1
    `).bind(slug).first()

    if (!event) {
      // Unknown slug → redirect to events listing
      return Response.redirect('https://dicebastion.com/events/', 302)
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

    // Public domain (dicebastion.com) → dynamic rendering
    // Bots get the full SEO page with JSON-LD schema.
    // Real browsers get an instant 302 redirect to the events listing
    // which auto-opens the event modal — no flash, no delay.
    const host = c.req.header('Host') || ''
    if (host.includes('dicebastion.com')) {
      const ua = (c.req.header('User-Agent') || '').toLowerCase()
      const isBot = /googlebot|google-inspectiontool|google-structured-data-testing-tool|google-read-aloud|storebot-google|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|gptbot|chatgpt|anthropic|claude|crawler|spider|bot\/|crawl/.test(ua)

      if (isBot) {
        // Serve full SEO page with Event schema for indexing
        const html = generateEventSeoPage(event)
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=600',
          }
        })
      }

      // Human browser → instant 302 to events page with modal auto-open
      const modalUrl = `https://dicebastion.com/events/?open=${encodeURIComponent(event.slug)}`
      return Response.redirect(modalUrl, 302)
    }

    // Workers.dev domain → serve HTML or JSON based on Accept header
    const accept = c.req.header('Accept') || ''
    if (accept.includes('text/html') && !accept.includes('application/json')) {
      const html = generateEventSeoPage(event)
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=600',
        }
      })
    }
    
    return c.json(event)
  } catch (err) {
    console.error('Error fetching event:', err)
    return c.json({ error: 'failed_to_fetch_event' }, 500)
  }
})

// Create free event registration (no payment required)
app.post('/events/:id/register', async c => {
  try {
    const id = c.req.param('id')
    if (!id || isNaN(Number(id))) return c.json({ error:'invalid_event_id' },400)
    const evId = Number(id)
    const ip = c.req.header('CF-Connecting-IP')
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    
    // Rate limiting: 5 requests per minute per IP
    if (!checkRateLimit(ip, eventCheckoutRateLimits, 5, 1)) {
      return c.json({ error: 'rate_limit_exceeded', message: 'Too many registration requests. Please try again in a minute.' }, 429)
    }
    
    const { email, name, turnstileToken } = await c.req.json()
    if (!email) return c.json({ error:'email_required' },400)
    if (!EMAIL_RE.test(email)) return c.json({ error:'invalid_email' },400)
    if (!name || name.trim().length === 0) return c.json({ error:'name_required' },400)
    if (name && name.length > 200) return c.json({ error:'name_too_long' },400)

    // Turnstile verification (optional – donate page skips it)
    if (turnstileToken) {
      const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode, c)
      if (!tsOk) return c.json({ error:'turnstile_failed' },403)
    }

    const ev = await c.env.DB.prepare('SELECT * FROM events WHERE event_id = ?').bind(evId).first()
    if (!ev) return c.json({ error:'event_not_found' },404)
    
    // Get or create identity to check membership status
    const ident = await getOrCreateIdentity(c.env.DB, email, clampStr(name,200))
    if (!ident || typeof ident.id === 'undefined' || ident.id === null) {
      console.error('identity missing id', ident)
      return c.json({ error:'identity_error' },500)
    }
    
    // Check user's membership status and calculate applicable price
    const isActive = !!(await getActiveMembership(c.env.DB, ident.id))
    const memberPrice = Number(ev.membership_price || 0)
    const nonMemberPrice = Number(ev.non_membership_price || 0)
    const applicablePrice = isActive ? memberPrice : nonMemberPrice
    
    // Only allow free registration if user's applicable price is 0
    if (applicablePrice > 0) {
      return c.json({ error:'event_requires_payment', message: `This event costs £${applicablePrice.toFixed(2)} for you. Please use the checkout flow.` },400)
    }
    
    if (ev.capacity && ev.tickets_sold >= ev.capacity) {
      return c.json({ error:'event_full' },409)
    }

    const s = await getSchema(c.env.DB)
    await migrateToTransactions(c.env.DB)
    
    // Multiple registrations are now allowed - duplicate check removed// Create ticket record with status 'active' (no payment needed)
    const colParts = ['event_id', 'user_id', 'status', 'created_at']
    const bindVals = [evId, ident.id, 'active', toIso(new Date())]
    
    const placeholders = colParts.map(()=>'?').join(',')
    const ticketResult = await c.env.DB.prepare(
      `INSERT INTO tickets (${colParts.join(',')}) VALUES (${placeholders}) RETURNING id`
    ).bind(...bindVals).first()
    const ticketId = ticketResult?.id || (await c.env.DB.prepare('SELECT last_insert_rowid() as id').first()).id

    console.log('[FREE EVENT REGISTRATION] Ticket created with ID:', ticketId)

    // Increment tickets_sold count
    await c.env.DB.prepare(
      'UPDATE events SET tickets_sold = tickets_sold + 1 WHERE event_id = ? AND (capacity IS NULL OR tickets_sold < capacity)'
    ).bind(evId).run()
    
    // Send confirmation email
    // For recurring events, calculate next occurrence for calendar invite
    const eventForEmail = { ...ev }
    if (ev.is_recurring === 1) {
      const nextOccurrence = calculateNextOccurrence(ev, new Date())
      if (nextOccurrence) {
        eventForEmail.event_datetime = nextOccurrence.toISOString()
      }
    }
    
    const emailContent = getTicketConfirmationEmail(eventForEmail, ident, { 
      email, 
      name: ident.name || name,
      amount: '0.00',
      currency: 'GBP',
      order_ref: null  // No order ref for free registrations
    })
    
    console.log('[FREE EVENT REGISTRATION] Sending email to:', email)
    
    await sendEmail(c.env, {
      to: email, 
      ...emailContent,
      emailType: 'event_registration_confirmation',
      relatedId: ticketId,
      relatedType: 'ticket',
      metadata: { event_id: evId, event_name: ev.event_name }
    })
      // Send admin notification
    try {
      const adminEmailContent = getAdminNotificationEmail('event_registration', {
        eventName: ev.event_name,
        customerName: ident.name || 'Customer',
        customerEmail: email,
        eventDate: ev.event_datetime,
        ticketId: ticketId,
        isFree: true
      })
      
      console.log('[FREE EVENT REGISTRATION] Sending admin notification')
      
      await sendEmail(c.env, { 
        to: 'admin@dicebastion.com',
        ...adminEmailContent,
        emailType: 'admin_event_notification',
        relatedId: ticketId,
        relatedType: 'ticket',
        metadata: { event_id: evId, event_name: ev.event_name }
      })
    } catch (adminEmailError) {
      console.error('Failed to send admin notification for event registration:', adminEmailError)
      // Don't fail the main registration if admin email fails
    }
      console.log('[FREE EVENT REGISTRATION] Registration complete, returning ticketId:', ticketId)
    
    // All users now have passwords from registration
    
    return c.json({ 
      success: true,
      registered: true,
      eventName: ev.event_name,
      eventDate: ev.event_datetime,
      ticketId: ticketId,
      userEmail: email,
      needsAccountSetup: !ident.password_hash
    })
  } catch (e) {
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    console.error('event registration error', e)
    return c.json(debugMode ? { error:'internal_error', detail: String(e), stack: String(e?.stack||'') } : { error:'internal_error' },500)
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

// Get single event by ID (admin only)
app.get('/admin/events/:id', requireAdmin, async c => {
  try {
    const id = c.req.param('id')
    
    const event = await c.env.DB.prepare(`
      SELECT 
        event_id as id,
        event_name as title,
        slug,
        organiser,
        description,
        full_description,
        seo_description,
        seo_organizer,
        seo_image,
        event_datetime,
        location,
        membership_price,
        non_membership_price,
        capacity,
        tickets_sold,
        image_url,
        requires_purchase,
        is_active,
        is_recurring,
        recurrence_pattern,
        recurrence_end_date,
        end_time
      FROM events 
      WHERE event_id = ?
    `).bind(id).first()
    
    if (!event) {
      return c.json({ error: 'event_not_found' }, 404)
    }
    
    return c.json(event)
  } catch (err) {
    console.error('Error fetching event:', err)
    return c.json({ error: 'failed_to_fetch_event' }, 500)
  }
})

// Create new event (admin only)
app.post('/admin/events', requireAdmin, async c => {
  try {
    const { title, slug, organiser, description, full_description, seo_description, seo_organizer, seo_image, event_date, time, end_time, membership_price, non_membership_price, max_attendees, location, image_url, requires_purchase, is_active, is_recurring, recurrence_pattern, recurrence_end_date } = await c.req.json()
    
    if (!title || !slug || !event_date) {
      return c.json({ error: 'missing_required_fields' }, 400)
    }
    
    // Combine date and time
    const datetime = time ? `${event_date}T${time}:00` : `${event_date}T00:00:00`
    
    const result = await c.env.DB.prepare(`
      INSERT INTO events (event_name, slug, organiser, description, full_description, seo_description, seo_organizer, seo_image, event_datetime, location, membership_price, non_membership_price, capacity, tickets_sold, image_url, requires_purchase, is_active, is_recurring, recurrence_pattern, recurrence_end_date, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      slug,
      organiser || null,
      description || null,
      full_description || null,
      seo_description || null,
      seo_organizer || null,
      seo_image || null,
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
      end_time || null
    ).run()

    // Notify Google Indexing API (fire-and-forget)
    if (c.env.GOOGLE_SA_KEY && slug) {
      notifyGoogleIndexingAsync(c.executionCtx, c.env, `https://dicebastion.com/events/${encodeURIComponent(slug)}`)
    }

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
    const { title, slug, organiser, description, full_description, seo_description, seo_organizer, seo_image, event_date, time, end_time, membership_price, non_membership_price, max_attendees, location, image_url, requires_purchase, is_active, is_recurring, recurrence_pattern, recurrence_end_date } = await c.req.json()
    
    if (!title || !slug || !event_date) {
      return c.json({ error: 'missing_required_fields' }, 400)
    }
    
    // Combine date and time
    const datetime = time ? `${event_date}T${time}:00` : `${event_date}T00:00:00`
    
    await c.env.DB.prepare(`
      UPDATE events 
      SET event_name = ?, slug = ?, organiser = ?, description = ?, full_description = ?, seo_description = ?, seo_organizer = ?, seo_image = ?, event_datetime = ?, location = ?, membership_price = ?, non_membership_price = ?, capacity = ?, image_url = ?, requires_purchase = ?, is_active = ?, is_recurring = ?, recurrence_pattern = ?, recurrence_end_date = ?, end_time = ?
      WHERE event_id = ?
    `).bind(
      title,
      slug,
      organiser || null,
      description || null,
      full_description || null,
      seo_description || null,
      seo_organizer || null,
      seo_image || null,
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
      end_time || null,
      id
    ).run()

    // Notify Google Indexing API (fire-and-forget)
    if (c.env.GOOGLE_SA_KEY && slug) {
      notifyGoogleIndexingAsync(c.executionCtx, c.env, `https://dicebastion.com/events/${encodeURIComponent(slug)}`)
    }

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
    const force = c.req.query('force') === 'true'
    
    // Check if event exists
    const event = await c.env.DB.prepare('SELECT event_id, event_name, slug, tickets_sold FROM events WHERE event_id = ?').bind(id).first()
    if (!event) {
      return c.json({ error: 'not_found' }, 404)
    }
    
    // Check if event has tickets sold (only count active/confirmed tickets)
    const ticketHolders = await c.env.DB.prepare(`
      SELECT DISTINCT u.user_id, u.name, u.email, COUNT(*) as ticket_count
      FROM tickets t
      JOIN users u ON t.user_id = u.user_id
      WHERE t.event_id = ? AND t.status = 'active'
      GROUP BY u.user_id, u.name, u.email
    `).bind(id).all()
    
    const confirmedTicketCount = ticketHolders.results?.reduce((sum, holder) => sum + holder.ticket_count, 0) || 0
    
    if (confirmedTicketCount > 0 && !force) {
      return c.json({ 
        error: 'has_tickets',
        event_name: event.event_name,
        tickets_sold: confirmedTicketCount,
        ticket_holders: ticketHolders.results || []
      }, 400)
    }
    
    // Force delete: remove all tickets (including pending ones), then the event
    if (force) {
      await c.env.DB.prepare('DELETE FROM tickets WHERE event_id = ?').bind(id).run()
    }
    
    await c.env.DB.prepare('DELETE FROM events WHERE event_id = ?').bind(id).run()

    return c.json({ success: true })
  } catch (e) {
    console.error('Delete event error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Get event registrations (admin only)
app.get('/admin/events/:id/registrations', requireAdmin, async c => {
  try {
    const id = c.req.param('id')
    if (!id || isNaN(Number(id))) return c.json({ error:'invalid_event_id' },400)
    const evId = Number(id)
    
    // Get event details
    const event = await c.env.DB.prepare('SELECT * FROM events WHERE event_id = ?').bind(evId).first()
    if (!event) {
      return c.json({ error: 'event_not_found' }, 404)
    }
    
    // Get all tickets/registrations for this event
    const registrations = await c.env.DB.prepare(`
      SELECT 
        t.id,
        t.user_id,
        t.status,
        tr.amount,
        tr.currency,
        tr.payment_status,
        t.created_at,
        u.email,
        u.name,
        tr.order_ref,
        tr.payment_id
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.user_id
      LEFT JOIN transactions tr ON tr.reference_id = t.id AND tr.transaction_type = 'ticket'
      WHERE t.event_id = ?
      ORDER BY t.created_at DESC
    `).bind(evId).all()
    
    return c.json({ 
      success: true,
      event: {
        id: event.event_id,
        name: event.event_name,
        date: event.event_datetime,
        capacity: event.capacity,
        tickets_sold: event.tickets_sold,
        requires_purchase: event.requires_purchase
      },
      registrations: registrations.results || []
    })
  } catch (e) {
    console.error('Get event registrations error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Get all event registrations summary (admin only)
app.get('/admin/registrations', requireAdmin, async c => {
  try {
    // Get all events with registration counts
    const events = await c.env.DB.prepare(`
      SELECT 
        e.event_id,
        e.event_name,
        e.event_datetime,
        e.capacity,
        e.tickets_sold,
        e.requires_purchase,
        e.is_active,
        e.is_recurring,
        e.recurrence_pattern,
        COUNT(t.id) as total_registrations,
        SUM(CASE WHEN t.status = 'active' THEN 1 ELSE 0 END) as confirmed_registrations,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_registrations
      FROM events e
      LEFT JOIN tickets t ON e.event_id = t.event_id
      WHERE (e.event_datetime >= datetime('now', '-7 days') OR e.is_recurring = 1)
        AND e.is_active = 1
      GROUP BY e.event_id
      ORDER BY e.event_datetime ASC
    `).all()
    
    // For recurring events, calculate the next occurrence
    const processedEvents = (events.results || []).map(event => {
      if (event.is_recurring === 1) {
        const nextOccurrence = calculateNextOccurrence(event, new Date())
        if (nextOccurrence) {
          return {
            ...event,
            event_datetime: nextOccurrence.toISOString()
          }
        }
      }
      return event
    })
    
    return c.json({ 
      success: true,
      events: processedEvents
    })
  } catch (e) {
    console.error('Get registrations summary error:', e)
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
    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode, c)
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
    if (!Number.isFinite(amount)) return c.json({ error:'invalid_amount' },400)
    if (amount <= 0) return c.json({ error:'invalid_amount' },400)
    const currency = c.env.CURRENCY || 'GBP'

    const s = await getSchema(c.env.DB)
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

// Create ticket + membership bundle checkout
app.post('/events/:id/checkout-with-membership', async c => {
  try {
    const id = c.req.param('id')
    if (!id || isNaN(Number(id))) return c.json({ error:'invalid_event_id' },400)
    const evId = Number(id)
    const ip = c.req.header('CF-Connecting-IP')
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    
    // Rate limiting
    if (!checkRateLimit(ip, eventCheckoutRateLimits, 5, 1)) {
      return c.json({ error: 'rate_limit_exceeded', message: 'Too many checkout requests. Please try again in a minute.' }, 429)
    }
    
    const idem = c.req.header('Idempotency-Key')?.trim()
    const { email, name, privacyConsent, marketingConsent, turnstileToken, membershipPlan, autoRenew } = await c.req.json()
    if (!email) return c.json({ error:'email_required' },400)
    if (!EMAIL_RE.test(email)) return c.json({ error:'invalid_email' },400)
    if (!privacyConsent) return c.json({ error:'privacy_consent_required' },400)
    if (!membershipPlan) return c.json({ error:'membership_plan_required' },400)
    if (name && name.length > 200) return c.json({ error:'name_too_long' },400)
    const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode, c)
    if (!tsOk) return c.json({ error:'turnstile_failed' },403)

    const ev = await c.env.DB.prepare('SELECT * FROM events WHERE event_id = ?').bind(evId).first()
    if (!ev) return c.json({ error:'event_not_found' },404)
    if (ev.capacity && ev.tickets_sold >= ev.capacity) return c.json({ error:'sold_out' },409)

    // Get the membership service/plan
    const svc = await getServiceForPlan(c.env.DB, membershipPlan)
    if (!svc || svc.active !== 1) return c.json({ error:'invalid_membership_plan' },400)

    const ident = await getOrCreateIdentity(c.env.DB, email, clampStr(name,200))
    if (!ident || typeof ident.id === 'undefined' || ident.id === null) {
      console.error('identity missing id', ident)
      return c.json({ error:'identity_error' },500)
    }

    // Calculate combined price: membership + member event price
    const membershipAmount = Number(svc.amount || 0)
    const eventAmount = Number(ev.membership_price || 0) // Always use member price for bundle
    const totalAmount = membershipAmount + eventAmount
    
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) return c.json({ error:'invalid_amount' },400)
    const currency = c.env.CURRENCY || 'GBP'

    const s = await getSchema(c.env.DB)
    await migrateToTransactions(c.env.DB)

    const order_ref = `BUNDLE-${evId}-${crypto.randomUUID()}`
    
    // Idempotency check
    if (idem){
      const existing = await c.env.DB.prepare(`
        SELECT * FROM transactions
        WHERE transaction_type = 'event_membership_bundle' AND user_id = ? AND idempotency_key = ?
        ORDER BY id DESC LIMIT 1
      `).bind(ident.id, idem).first()
      if (existing && existing.checkout_id){
        return c.json({ orderRef: existing.order_ref, checkoutId: existing.checkout_id, reused: true })
      }
    }

    // Auto-renewal is always enabled — users get a 7-day reminder email before renewal
    const autoRenewValue = 1
    
    // Create pending membership record
    const membershipResult = await c.env.DB.prepare(`
      INSERT INTO memberships (user_id, plan, status, auto_renew, order_ref)
      VALUES (?, ?, 'pending', ?, ?) RETURNING id
    `).bind(ident.id, membershipPlan, autoRenewValue, order_ref).first()
    const membershipId = membershipResult?.id || (await c.env.DB.prepare('SELECT last_insert_rowid() as id').first()).id

    // Create pending ticket record
    const ticketResult = await c.env.DB.prepare(`
      INSERT INTO tickets (event_id, user_id, status, created_at)
      VALUES (?, ?, 'pending', ?) RETURNING id
    `).bind(evId, ident.id, toIso(new Date())).first()
    const ticketId = ticketResult?.id || (await c.env.DB.prepare('SELECT last_insert_rowid() as id').first()).id

    let checkout
    let customerId = null
    try {
      // Create or get SumUp customer for card tokenization (auto-renewal is always enabled)
      customerId = await getOrCreateSumUpCustomer(c.env, ident)
      console.log('[Bundle Checkout] Using SumUp customer ID:', customerId)

      // Use tokenization checkout — SumUp auths the real amount and instantly reimburses it.
      // The real bundle amount is charged separately after the card is saved.
      checkout = await createCheckout(c.env, { 
        amount: totalAmount, 
        currency, 
        orderRef: order_ref, 
        title: `${membershipPlan} Membership + ${ev.event_name}`,
        description: `Card setup for ${membershipPlan} membership + ${ev.event_name} bundle`,
        savePaymentInstrument: true,
        customerId
      })
    } catch (e) {
      console.error('SumUp checkout failed for bundle', e)
      return c.json({ error:'sumup_checkout_failed', message:String(e?.message||e) },502)
    }
    if (!checkout.id) {
      console.error('bundle checkout missing id', checkout)
      return c.json({ error: 'sumup_missing_id' }, 502)
    }
    
    // Store transaction with both membership and ticket IDs
    // Note: We use reference_id for membership_id, and store ticket_id in the order_ref prefix (BUNDLE-{eventId}-{uuid})
    // The ticket can be looked up via event_id + user_id when needed
    await c.env.DB.prepare(`
      INSERT INTO transactions (transaction_type, reference_id, user_id, email, name, order_ref,
                                checkout_id, amount, currency, payment_status, idempotency_key)
      VALUES ('event_membership_bundle', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      membershipId, // Primary reference is membership
      ident.id, 
      email, 
      clampStr(name,200), 
      order_ref, 
      checkout.id,
      String(totalAmount), 
      currency, 
      idem || null
    ).run()
    
    // Also store the ticket_id association for easy lookup during confirmation
    // We'll look it up using: event_id + user_id + status='pending' when processing the bundle confirmation
    console.log(`[Bundle Checkout] Linked: membership_id=${membershipId}, ticket_id=${ticketId}, event_id=${evId}`)
    
    // Handle email preferences opt-in
    await handleEmailPreferencesOptIn(c.env.DB, ident.id, marketingConsent)
    
    console.log(`[Bundle Checkout] Created for user ${ident.id}: membership ${membershipId}, ticket ${ticketId}, total £${totalAmount}`)
    
    return c.json({ 
      orderRef: order_ref, 
      checkoutId: checkout.id,
      membershipId,
      ticketId,
      totalAmount,
      currency
    })
  } catch (e) {
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    console.error('bundle checkout error', e)
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
app.post('/membership/retry-renewal', requireAdmin, async (c) => {
  try {
    const { email } = await c.req.json()
    if (!email || !EMAIL_RE.test(email)) return c.json({ error: 'invalid_email' }, 400)
    
    const ident = await findIdentityByEmail(c.env.DB, email)
    if (!ident) return c.json({ error: 'user_not_found' }, 404)
    
    // Find membership with failed renewal
    const membership = await getActiveMembership(c.env.DB, ident.id)
    if (!membership) return c.json({ error: 'no_active_membership' }, 404)
    
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
app.get('/test/renew-user', requireAdmin, async (c) => {
  const email = c.req.query('email')
  if (!email) return c.json({ error: 'email required' }, 400)
  
  try {    
    
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
app.get('/test/event-reminders', requireAdmin, async (c) => {
  try {
    console.log('Manually triggering event reminders cron job...')
    await processEventReminders(c.env)
    
    return c.json({ 
      success: true,
      message: 'Event reminders processed. Check logs for details.'
    })
  } catch (e) {
    console.error('Manual event reminders error:', e)
    return c.json({ error: String(e), stack: String(e.stack || '') }, 500)
  }
})

// Test endpoint to manually trigger auto-renewals
app.get('/test/auto-renewals', requireAdmin, async (c) => {
  try {
    console.log('Manually triggering auto-renewals cron job...')
    await processAutoRenewals(c.env)
    
    return c.json({ 
      success: true,
      message: 'Auto-renewals processed. Check logs for details.'
    })
  } catch (e) {
    console.error('Manual auto-renewals error:', e)
    return c.json({ error: String(e), stack: String(e.stack || '') }, 500)
  }
})

// Test endpoint to manually trigger delayed account setup emails
app.get('/test/delayed-emails', requireAdmin, async (c) => {
  try {
    console.log('Manually triggering delayed account setup emails cron job...')
    await processDelayedAccountSetupEmails(c.env)
    
    return c.json({ 
      success: true,
      message: 'Delayed account setup emails processed. Check logs for details.'
    })
  } catch (e) {
    console.error('Manual delayed emails error:', e)
    return c.json({ error: String(e), stack: String(e.stack || '') }, 500)
  }
})


// ============================================================================
// PRODUCT & SHOP API ENDPOINTS
// ============================================================================

// ---------- Product SEO Page Generator ----------
// Produces a rich HTML landing page with Product JSON-LD for Google Shopping,
// Open Graph tags for social sharing, and BreadcrumbList for SERP breadcrumbs.
// https://developers.google.com/search/docs/appearance/structured-data/product
function generateProductSeoPage(product, allCategories) {
  const e = s => (s || '').replace(/[<>"&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;','&':'&amp;'}[c]));
  const stripHtml = s => (s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const shop = 'https://shop.dicebastion.com';
  const name = e(product.name || 'Product');
  const slug = product.slug || '';
  const img = product.image_url || `${shop}/img/og-image.png`;
  const rawDesc = product.full_description || product.summary || product.description || '';
  const plainDesc = stripHtml(rawDesc);
  const desc = e(plainDesc.length > 160 ? plainDesc.substring(0, 157) + '...' : plainDesc);
  const fullDescHtml = rawDesc;  // Keep HTML for visual display
  const url = `${shop}/products/${slug}`;
  const priceNum = (Number(product.price) || 0) / 100;
  const priceDisplay = priceNum.toFixed(2);
  const inStock = (product.stock_quantity || 0) > 0;
  const isPreorder = product.release_date && new Date(product.release_date) > new Date();
  const categories = (product.category || '').split(',').map(c => c.trim()).filter(Boolean);
  const primaryCategory = categories[0] || 'Tabletop Gaming';

  // Google Product structured data (JSON-LD)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name || 'Product',
    'description': plainDesc || desc,
    'image': img,
    'url': url,
    'sku': slug,
    'brand': { '@type': 'Brand', 'name': 'Dice Bastion' },
    'category': primaryCategory,
    'offers': {
      '@type': 'Offer',
      'url': url,
      'priceCurrency': product.currency || 'GBP',
      'price': priceNum,
      'availability': isPreorder
        ? 'https://schema.org/PreOrder'
        : inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      'seller': {
        '@type': 'Organization',
        'name': 'Dice Bastion',
        'url': shop
      },
      'shippingDetails': {
        '@type': 'OfferShippingDetails',
        'shippingDestination': {
          '@type': 'DefinedRegion',
          'addressCountry': 'GI'
        },
        'deliveryTime': {
          '@type': 'ShippingDeliveryTime',
          'handlingTime': { '@type': 'QuantitativeValue', 'minValue': 0, 'maxValue': 1, 'unitCode': 'DAY' },
          'transitTime': { '@type': 'QuantitativeValue', 'minValue': 0, 'maxValue': 1, 'unitCode': 'DAY' }
        },
        'shippingRate': { '@type': 'MonetaryAmount', 'value': '0', 'currency': 'GBP' }
      },
      'hasMerchantReturnPolicy': {
        '@type': 'MerchantReturnPolicy',
        'applicableCountry': 'GI',
        'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
        'merchantReturnDays': 14,
        'returnMethod': 'https://schema.org/ReturnInStore'
      }
    }
  };

  if (isPreorder && product.release_date) {
    schema.offers.availabilityStarts = product.release_date;
  }

  // BreadcrumbList for SERP breadcrumbs
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Shop', 'item': shop },
      ...(categories[0] ? [{ '@type': 'ListItem', 'position': 2, 'name': categories[0], 'item': `${shop}/products/category/${encodeURIComponent(categories[0])}` }] : []),
      { '@type': 'ListItem', 'position': categories[0] ? 3 : 2, 'name': product.name || 'Product' }
    ]
  };

  // Format release date for pre-orders
  let releaseDateStr = '';
  if (isPreorder && product.release_date) {
    try {
      releaseDateStr = new Date(product.release_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {}
  }

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${name} | Dice Bastion Shop</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="product"><meta property="og:url" content="${url}">
<meta property="og:title" content="${name}"><meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}"><meta property="og:site_name" content="Dice Bastion Shop">
<meta property="product:price:amount" content="${priceDisplay}"><meta property="product:price:currency" content="${product.currency || 'GBP'}">
<meta property="product:availability" content="${inStock ? 'in stock' : 'out of stock'}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${name}">
<meta name="twitter:description" content="${desc}"><meta name="twitter:image" content="${img}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>
<link rel="canonical" href="${url}">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#1a1a2e;color:#e0e0e0;min-height:100vh;display:flex;flex-direction:column;align-items:center}
.header{width:100%;padding:1rem 1.5rem;background:#16162a;text-align:center;border-bottom:1px solid #2a2a4a}
.header a{color:#e0e0e0;text-decoration:none;font-size:1.1rem;font-weight:600}
.breadcrumb{max-width:640px;width:100%;margin:1rem auto 0;padding:0 1rem;font-size:.8rem;color:#808090}
.breadcrumb a{color:#a78bfa;text-decoration:none}
.breadcrumb a:hover{text-decoration:underline}
.card{max-width:640px;width:100%;margin:1rem auto 2rem;background:#16162a;border-radius:16px;overflow:hidden;border:1px solid #2a2a4a}
.card img{width:100%;height:auto;display:block;max-height:400px;object-fit:cover}
.card-body{padding:1.5rem}
h1{font-size:1.5rem;margin-bottom:.75rem;color:#fff}
.desc{color:#b0b0c0;line-height:1.6;margin-bottom:1.25rem}
.meta{display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem}
.meta-item{display:flex;flex-direction:column;gap:.15rem}
.meta-label{font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#808090}
.meta-value{font-size:.95rem;color:#e0e0e0}
.price{font-size:1.75rem;font-weight:700;color:#a78bfa;margin-bottom:1rem}
.badge{display:inline-block;padding:.2rem .6rem;border-radius:6px;font-size:.8rem;font-weight:600}
.badge-stock{background:#064e3b;color:#6ee7b7}
.badge-out{background:#4a1c1c;color:#f87171}
.badge-preorder{background:#4a2c0a;color:#fbbf24}
.categories{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.25rem}
.cat-tag{padding:.25rem .75rem;background:#2a2a4a;border-radius:6px;font-size:.8rem;color:#c0c0d0;text-decoration:none}
.cat-tag:hover{background:#3a3a5a}
.cta{display:inline-block;padding:.75rem 2rem;background:#7c3aed;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:1rem;transition:background .2s}
.cta:hover{background:#6d28d9}
.cta-disabled{background:#4a4a5a;cursor:not-allowed}
.footer{margin-top:auto;padding:1.5rem;text-align:center;font-size:.85rem;color:#606070}
.footer a{color:#a78bfa;text-decoration:none}
</style>
</head><body>
<div class="header"><a href="${shop}">Dice Bastion Shop</a></div>
<div class="breadcrumb">
<a href="${shop}">Shop</a>${categories[0] ? ` › <a href="${shop}/products/category/${encodeURIComponent(categories[0])}">${e(categories[0])}</a>` : ''} › ${name}
</div>
<div class="card">
${img ? `<img src="${img}" alt="${name}">` : ''}
<div class="card-body">
<h1>${name}</h1>
${categories.length > 0 ? `<div class="categories">${categories.map(c => `<a class="cat-tag" href="${shop}/products/category/${encodeURIComponent(c)}">${e(c)}</a>`).join('')}</div>` : ''}
<div class="price">£${priceDisplay}</div>
${fullDescHtml ? `<div class="desc">${fullDescHtml}</div>` : ''}
<div class="meta">
<div class="meta-item"><span class="meta-label">Availability</span><span class="meta-value">${isPreorder ? `<span class="badge badge-preorder">Pre-order · ${releaseDateStr}</span>` : inStock ? `<span class="badge badge-stock">${product.stock_quantity} in stock</span>` : '<span class="badge badge-out">Out of stock</span>'}</span></div>
<div class="meta-item"><span class="meta-label">Pickup</span><span class="meta-value">Gibraltar Warhammer Club</span></div>
</div>
<a class="${inStock || isPreorder ? 'cta' : 'cta cta-disabled'}" href="${shop}/?product=${slug}">${isPreorder ? 'Pre-order Now' : inStock ? 'View in Shop' : 'Out of Stock'}</a>
</div>
</div>
<div class="footer"><a href="${shop}">← Back to Shop</a></div>
</body></html>`;
}

// ---------- Product Category SEO Page ----------
function generateCategorySeoPage(categoryName, products) {
  const e = s => (s || '').replace(/[<>"&]/g, c => ({'<':'&lt;','>':'&gt;','"':'&quot;','&':'&amp;'}[c]));
  const shop = 'https://shop.dicebastion.com';
  const catDisplay = e(categoryName);
  const url = `${shop}/products/category/${encodeURIComponent(categoryName)}`;
  const desc = `Shop ${catDisplay} at Dice Bastion Gibraltar. Board games, miniatures, and gaming accessories.`;

  // CollectionPage + ItemList schema
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': `${categoryName} | Dice Bastion Shop`,
    'description': desc,
    'url': url,
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': products.length,
      'itemListElement': products.map((p, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'url': `${shop}/products/${p.slug}`,
        'name': p.name
      }))
    }
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Shop', 'item': shop },
      { '@type': 'ListItem', 'position': 2, 'name': categoryName }
    ]
  };

  const productCards = products.map(p => {
    const price = ((Number(p.price) || 0) / 100).toFixed(2);
    return `<a href="${shop}/products/${p.slug}" class="cat-product-card">
${p.image_url ? `<img src="${p.image_url}" alt="${e(p.name)}">` : '<div class="cat-product-img-placeholder"></div>'}
<div class="cat-product-info"><span class="cat-product-name">${e(p.name)}</span><span class="cat-product-price">£${price}</span></div></a>`;
  }).join('\n');

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${catDisplay} | Dice Bastion Shop</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website"><meta property="og:url" content="${url}">
<meta property="og:title" content="${catDisplay} | Dice Bastion Shop"><meta property="og:description" content="${desc}">
<meta property="og:site_name" content="Dice Bastion Shop">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${catDisplay} | Dice Bastion Shop">
<meta name="twitter:description" content="${desc}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbs)}</script>
<link rel="canonical" href="${url}">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#1a1a2e;color:#e0e0e0;min-height:100vh;display:flex;flex-direction:column;align-items:center}
.header{width:100%;padding:1rem 1.5rem;background:#16162a;text-align:center;border-bottom:1px solid #2a2a4a}
.header a{color:#e0e0e0;text-decoration:none;font-size:1.1rem;font-weight:600}
.breadcrumb{max-width:900px;width:100%;margin:1rem auto 0;padding:0 1rem;font-size:.8rem;color:#808090}
.breadcrumb a{color:#a78bfa;text-decoration:none}
.cat-heading{max-width:900px;width:100%;margin:1rem auto;padding:0 1rem}
.cat-heading h1{font-size:2rem;color:#fff}
.cat-heading p{color:#808090;margin-top:.25rem}
.cat-grid{max-width:900px;width:100%;margin:1rem auto 2rem;padding:0 1rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1.25rem}
.cat-product-card{background:#16162a;border:1px solid #2a2a4a;border-radius:12px;overflow:hidden;text-decoration:none;color:#e0e0e0;transition:transform .2s,border-color .2s}
.cat-product-card:hover{transform:translateY(-4px);border-color:#7c3aed}
.cat-product-card img{width:100%;height:180px;object-fit:cover;display:block}
.cat-product-img-placeholder{width:100%;height:180px;background:#2a2a4a}
.cat-product-info{padding:1rem;display:flex;flex-direction:column;gap:.25rem}
.cat-product-name{font-weight:600;font-size:.95rem}
.cat-product-price{color:#a78bfa;font-weight:700}
.footer{margin-top:auto;padding:1.5rem;text-align:center;font-size:.85rem;color:#606070}
.footer a{color:#a78bfa;text-decoration:none}
</style>
</head><body>
<div class="header"><a href="${shop}">Dice Bastion Shop</a></div>
<div class="breadcrumb"><a href="${shop}">Shop</a> › ${catDisplay}</div>
<div class="cat-heading"><h1>${catDisplay}</h1><p>${products.length} product${products.length !== 1 ? 's' : ''}</p></div>
<div class="cat-grid">${productCards}</div>
<div class="footer"><a href="${shop}">← Back to Shop</a></div>
</body></html>`;
}

// ---------- Product Sitemap ----------
app.get('/products/sitemap.xml', async c => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT slug, updated_at, category FROM products
      WHERE is_active = 1 AND slug IS NOT NULL
      ORDER BY updated_at DESC
    `).all()

    const shop = 'https://shop.dicebastion.com'

    // Collect unique categories
    const categories = new Set()
    ;(results || []).forEach(p => {
      if (p.category) p.category.split(',').map(c => c.trim()).filter(Boolean).forEach(c => categories.add(c))
    })

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${shop}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`

    // Product pages
    for (const p of (results || [])) {
      const lastmod = p.updated_at ? `<lastmod>${p.updated_at.split('T')[0]}</lastmod>` : ''
      xml += `\n<url><loc>${shop}/products/${encodeURIComponent(p.slug)}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.8</priority></url>`
    }

    // Category pages
    for (const cat of categories) {
      xml += `\n<url><loc>${shop}/products/category/${encodeURIComponent(cat)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`
    }

    xml += '\n</urlset>'

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      }
    })
  } catch (err) {
    console.error('Product sitemap error:', err)
    return new Response('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml' }
    })
  }
})

// ---------- Product SEO route (by slug) ----------
app.get('/products/:slug', async (c, next) => {
  try {
    const slug = c.req.param('slug')
    // Pure numeric IDs are handled by the JSON API route below
    if (!slug || slug.includes('.') || /^\d+$/.test(slug)) return next()

    const product = await c.env.DB.prepare(
      'SELECT * FROM products WHERE slug = ? AND is_active = 1'
    ).bind(slug).first()

    if (!product) {
      return Response.redirect('https://shop.dicebastion.com/', 302)
    }

    // Server-side dynamic rendering: bots get SEO page, humans get 302
    const host = c.req.header('Host') || ''
    if (host.includes('shop.dicebastion.com')) {
      const ua = (c.req.header('User-Agent') || '').toLowerCase()
      const isBot = /googlebot|google-inspectiontool|google-structured-data-testing-tool|google-read-aloud|storebot-google|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|gptbot|chatgpt|anthropic|claude|crawler|spider|bot\/|crawl/.test(ua)

      if (isBot) {
        const html = generateProductSeoPage(product)
        return new Response(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=600' }
        })
      }

      // Human → redirect to shop with product modal
      return Response.redirect(`https://shop.dicebastion.com/?product=${encodeURIComponent(product.slug)}`, 302)
    }

    // Workers.dev → serve based on Accept header
    const accept = c.req.header('Accept') || ''
    if (accept.includes('text/html') && !accept.includes('application/json')) {
      const html = generateProductSeoPage(product)
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    return c.json(product)
  } catch (err) {
    console.error('Product slug error:', err)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// ---------- Category SEO route ----------
app.get('/products/category/:name', async c => {
  try {
    const categoryName = decodeURIComponent(c.req.param('name'))

    const { results } = await c.env.DB.prepare(`
      SELECT id, name, slug, summary, price, currency, stock_quantity, image_url, category, release_date
      FROM products WHERE is_active = 1 AND COALESCE(show_in_shop, 1) = 1
      ORDER BY name ASC
    `).all()

    // Filter products that contain this category
    const catProducts = (results || []).filter(p =>
      p.category && p.category.split(',').map(c => c.trim()).includes(categoryName)
    )

    if (catProducts.length === 0) {
      return Response.redirect('https://shop.dicebastion.com/', 302)
    }

    // Bots get category page, humans get redirect to shop filtered by category
    const host = c.req.header('Host') || ''
    if (host.includes('shop.dicebastion.com')) {
      const ua = (c.req.header('User-Agent') || '').toLowerCase()
      const isBot = /googlebot|google-inspectiontool|google-structured-data-testing-tool|google-read-aloud|storebot-google|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|gptbot|chatgpt|anthropic|claude|crawler|spider|bot\/|crawl/.test(ua)

      if (isBot) {
        const html = generateCategorySeoPage(categoryName, catProducts)
        return new Response(html, {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=600, s-maxage=1800' }
        })
      }

      return Response.redirect(`https://shop.dicebastion.com/?category=${encodeURIComponent(categoryName)}`, 302)
    }

    // Workers.dev fallback
    const html = generateCategorySeoPage(categoryName, catProducts)
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (err) {
    console.error('Category page error:', err)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Get all active products (public), optionally filtered by category
app.get('/products', async (c) => {
  try {
    const category = c.req.query('category')
    let sql = `SELECT id, name, slug, description, summary, full_description, price, currency, stock_quantity, image_url, category, is_active, release_date, created_at
      FROM products WHERE is_active = 1`
    const binds = []
    if (category) { sql += ' AND category = ?'; binds.push(category) }
    else { sql += ' AND COALESCE(show_in_shop, 1) = 1' }
    sql += ' ORDER BY name ASC'
    const products = await c.env.DB.prepare(sql).bind(...binds).all()
    return c.json(products.results || [])
  } catch (e) {
    console.error('Get products error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Get single product by ID or slug (public)
app.get('/products/:id', async (c) => {
  try {
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

    // Notify Google Indexing API (fire-and-forget)
    if (c.env.GOOGLE_SA_KEY && slug) {
      notifyGoogleIndexingAsync(c.executionCtx, c.env, `https://shop.dicebastion.com/products/${encodeURIComponent(slug)}`)
    }
    
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

    // Notify Google Indexing API (fire-and-forget)
    // Resolve the slug: use the updated slug if provided, otherwise fetch from DB
    const productSlug = slug || (await c.env.DB.prepare('SELECT slug FROM products WHERE id = ?').bind(id).first())?.slug
    if (c.env.GOOGLE_SA_KEY && productSlug) {
      notifyGoogleIndexingAsync(c.executionCtx, c.env, `https://shop.dicebastion.com/products/${encodeURIComponent(productSlug)}`)
    }
    
    return c.json({ success: true })
  } catch (e) {
    console.error('Update product error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// Delete product (admin only - soft delete by setting is_active = 0)
app.delete('/admin/products/:id', requireAdmin, async (c) => {
  try {
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

// Upload image to R2 (admin only)
app.post('/admin/images', requireAdmin, async (c) => {
  try {
    const { image, filename } = await c.req.json()
    
    if (!image || !filename) {
      return c.json({ error: 'missing_image_or_filename' }, 400)
    }

    // Check if R2 bucket is configured
    if (!c.env.IMAGES) {
      console.error('R2 bucket not configured')
      return c.json({ error: 'storage_not_configured' }, 500)
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const key = `images/${timestamp}-${filename}`

    // Upload to R2
    await c.env.IMAGES.put(key, buffer, {
      httpMetadata: {
        contentType: 'image/jpeg',
      },
    })

    // Return public URL
    // For R2 public buckets, the URL format is typically:
    // - Custom domain: https://images.dicebastion.com/{key}
    // - R2.dev subdomain: https://{bucket}.{accountId}.r2.cloudflarestorage.com/{key}
    // You need to configure public access in Cloudflare dashboard and set R2_PUBLIC_URL
    
    let publicUrl
    if (c.env.R2_PUBLIC_URL) {
      // Use configured public URL
      publicUrl = `${c.env.R2_PUBLIC_URL}/${key}`
    } else {
      // Fallback: return a placeholder URL that indicates configuration needed
      publicUrl = `/r2-placeholder/${key}`
      console.warn('R2_PUBLIC_URL not configured. Set this environment variable to enable public image access.')
      console.log('Configure R2 public access at: https://dash.cloudflare.com/?to=/:account/r2/buckets/dicebastion-images/settings')
    }
    
    console.log('Image uploaded successfully:', key)
    console.log('Public URL:', publicUrl)
    
    return c.json({ 
      success: true, 
      url: publicUrl,
      key: key  // Return the key for debugging
    })
  } catch (e) {
    console.error('Image upload error:', e)
    return c.json({ error: 'upload_failed', details: e.message }, 500)
  }
})

// Get all orders (admin only)
app.get('/admin/orders', async (c) => {
  try {
    const adminKey = c.req.header('X-Admin-Key')
    if (adminKey !== c.env.ADMIN_KEY) {
      return c.json({ error: 'unauthorized' }, 401)
    }
    
    const orders = await c.env.DB.prepare(`
      SELECT * FROM orders 
      ORDER BY created_at DESC
    `).all()
    
    return c.json({ orders: orders.results || [] })
  } catch (e) {
    console.error('Get orders error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

// ============================================================================
// GOOGLE INDEXING API - Admin Endpoints
// ============================================================================

// Manually request Google indexing for a single URL
app.post('/admin/indexing/notify', requireAdmin, async (c) => {
  try {
    const { url, type } = await c.req.json()
    if (!url) return c.json({ error: 'url_required' }, 400)
    if (!c.env.GOOGLE_SA_KEY) return c.json({ error: 'google_sa_key_not_configured' }, 500)

    const result = await notifyGoogleIndexing(c.env, url, type || 'URL_UPDATED')
    return c.json(result, result.ok ? 200 : 502)
  } catch (e) {
    console.error('Admin indexing notify error:', e)
    return c.json({ error: e.message }, 500)
  }
})

// Batch notify – accepts an array of URLs
app.post('/admin/indexing/batch', requireAdmin, async (c) => {
  try {
    const { urls, type } = await c.req.json()
    if (!Array.isArray(urls) || urls.length === 0) return c.json({ error: 'urls_array_required' }, 400)
    if (urls.length > 100) return c.json({ error: 'max_100_urls_per_batch' }, 400)
    if (!c.env.GOOGLE_SA_KEY) return c.json({ error: 'google_sa_key_not_configured' }, 500)

    const results = await Promise.allSettled(
      urls.map(u => notifyGoogleIndexing(c.env, u, type || 'URL_UPDATED'))
    )

    const summary = results.map((r, i) => ({
      url: urls[i],
      ...(r.status === 'fulfilled' ? r.value : { ok: false, status: 0, body: { error: r.reason?.message } })
    }))

    return c.json({
      total: urls.length,
      succeeded: summary.filter(s => s.ok).length,
      failed: summary.filter(s => !s.ok).length,
      results: summary
    })
  } catch (e) {
    console.error('Admin batch indexing error:', e)
    return c.json({ error: e.message }, 500)
  }
})

// Check indexing status for a URL
app.get('/admin/indexing/status', requireAdmin, async (c) => {
  try {
    const url = c.req.query('url')
    if (!url) return c.json({ error: 'url_query_param_required' }, 400)
    if (!c.env.GOOGLE_SA_KEY) return c.json({ error: 'google_sa_key_not_configured' }, 500)

    const token = await getGoogleAccessToken(c.env)
    const res = await fetch(
      `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(url)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const body = await res.json()
    return c.json({ ok: res.ok, status: res.status, body }, res.ok ? 200 : 502)
  } catch (e) {
    console.error('Indexing status error:', e)
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================================
// ADMIN NEWSLETTER ENDPOINTS
// ============================================================================

/**
 * GET /admin/newsletter/recipients
 * Returns the count of users opted in to marketing emails
 */
app.get('/admin/newsletter/recipients', requireAdmin, async c => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM email_preferences ep
      JOIN users u ON ep.user_id = u.user_id
      WHERE ep.marketing_emails = 1 AND ep.consent_given = 1 AND u.is_active = 1
    `).first()
    return c.json({ count: result?.count ?? 0 })
  } catch (e) {
    console.error('[Newsletter] recipients error:', e)
    return c.json({ error: e.message }, 500)
  }
})

/**
 * GET /admin/newsletter/events
 * Returns active upcoming events for embedding in newsletters
 */
app.get('/admin/newsletter/events', requireAdmin, async c => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT event_id, event_name, description, event_datetime, location, image_url, slug
      FROM events
      WHERE is_active = 1 AND event_datetime >= datetime('now')
      ORDER BY event_datetime ASC
      LIMIT 10
    `).all()
    return c.json(results ?? [])
  } catch (e) {
    console.error('[Newsletter] events error:', e)
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================================
// SHARED: Newsletter campaign send logic (HTTP endpoint + cron scheduler)
// ============================================================================

/**
 * Fetches all opted-in recipients, sends per-recipient with unsubscribe token,
 * and optionally marks a newsletter_drafts record as 'sent'.
 */
async function sendNewsletterCampaign(env, subject, html, draftId = null) {
  const { results: recipients } = await env.DB.prepare(`
    SELECT u.email, u.name, ep.user_id
    FROM email_preferences ep
    JOIN users u ON ep.user_id = u.user_id
    WHERE ep.marketing_emails = 1 AND ep.consent_given = 1 AND u.is_active = 1
  `).all()

  if (!recipients || recipients.length === 0) {
    if (draftId) {
      await env.DB.prepare(`
        UPDATE newsletter_drafts
        SET status = 'sent', sent_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
            recipients_count = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        WHERE id = ?
      `).bind(draftId).run()
    }
    return { success: true, sent: 0, failed: 0, total: 0, message: 'No eligible recipients found.' }
  }

  const plainText = htmlToPlainText(html)
  const replyTo = env.MAILERSEND_REPLY_TO || env.MAILERSEND_FROM_EMAIL || 'hello@dicebastion.com'
  const tokenExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  let sent = 0
  let failed = 0
  const errors = []

  for (const r of recipients) {
    const token = crypto.randomUUID().replace(/-/g, '')
    try {
      await env.DB.prepare(
        'INSERT INTO newsletter_unsub_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
      ).bind(r.user_id, token, tokenExpiry).run()
    } catch (tokenErr) {
      console.error('[Newsletter] Failed to create unsub token for', r.email, tokenErr)
    }
    const unsubscribeUrl = `https://dicebastion.com/unsubscribe?token=${token}`
    const fullHtml = wrapNewsletterHtml(html, subject, unsubscribeUrl)
    const result = await sendEmail(env, {
      to: r.email,
      subject,
      html: fullHtml,
      text: plainText,
      replyTo,
      emailType: 'newsletter',
      metadata: JSON.stringify({ campaign: 'newsletter', draftId })
    })
    if (result.success || result.skipped) {
      sent++
    } else {
      failed++
      errors.push({ email: r.email, error: result.error })
    }
  }

  if (draftId) {
    await env.DB.prepare(`
      UPDATE newsletter_drafts
      SET status = 'sent', sent_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
          recipients_count = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?
    `).bind(sent, draftId).run()
  }

  console.log(`[Newsletter] Sent: ${sent}, Failed: ${failed}`)
  return { success: true, total: recipients.length, sent, failed, errors }
}

// ============================================================================
// ADMIN NEWSLETTER DRAFTS CRUD
// ============================================================================

/**
 * GET /admin/newsletters
 * Lists all newsletter drafts, scheduled newsletters, and recently sent (cap 50)
 */
app.get('/admin/newsletters', requireAdmin, async c => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, subject, status, scheduled_for, sent_at, recipients_count, created_at, updated_at
      FROM newsletter_drafts
      ORDER BY
        CASE status WHEN 'draft' THEN 0 WHEN 'scheduled' THEN 1 WHEN 'failed' THEN 2 ELSE 3 END,
        updated_at DESC
      LIMIT 50
    `).all()
    return c.json(results ?? [])
  } catch (e) {
    console.error('[Newsletter] list error:', e)
    return c.json({ error: e.message }, 500)
  }
})

/**
 * POST /admin/newsletters
 * Creates a new newsletter draft. Body: { subject, html }
 */
app.post('/admin/newsletters', requireAdmin, async c => {
  try {
    const { subject, html } = await c.req.json()
    const result = await c.env.DB.prepare(`
      INSERT INTO newsletter_drafts (subject, html) VALUES (?, ?)
    `).bind(subject ?? '', html ?? '').run()
    return c.json({ id: Number(result.lastInsertRowid), success: true }, 201)
  } catch (e) {
    console.error('[Newsletter] create error:', e)
    return c.json({ error: e.message }, 500)
  }
})

/**
 * GET /admin/newsletters/:id
 * Fetches a single newsletter draft including full HTML body
 */
app.get('/admin/newsletters/:id', requireAdmin, async c => {
  try {
    const id = c.req.param('id')
    const row = await c.env.DB.prepare(
      'SELECT * FROM newsletter_drafts WHERE id = ?'
    ).bind(id).first()
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json(row)
  } catch (e) {
    console.error('[Newsletter] get error:', e)
    return c.json({ error: e.message }, 500)
  }
})

/**
 * PUT /admin/newsletters/:id
 * Updates a draft. Accepts any combination of: { subject, html, status, scheduled_for }
 * Cannot edit a newsletter that has already been sent.
 */
app.put('/admin/newsletters/:id', requireAdmin, async c => {
  try {
    const id = c.req.param('id')
    const existing = await c.env.DB.prepare(
      'SELECT id, status FROM newsletter_drafts WHERE id = ?'
    ).bind(id).first()
    if (!existing) return c.json({ error: 'Not found' }, 404)
    if (existing.status === 'sent') return c.json({ error: 'Cannot edit a sent newsletter' }, 400)
    const body = await c.req.json()
    const setClauses = []
    const args = []
    if (body.subject !== undefined) { setClauses.push('subject = ?'); args.push(body.subject) }
    if (body.html !== undefined) { setClauses.push('html = ?'); args.push(body.html) }
    if (body.status !== undefined) { setClauses.push('status = ?'); args.push(body.status) }
    if (body.scheduled_for !== undefined) { setClauses.push('scheduled_for = ?'); args.push(body.scheduled_for) }
    if (setClauses.length === 0) return c.json({ error: 'No fields to update' }, 400)
    setClauses.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')")
    args.push(id)
    await c.env.DB.prepare(
      `UPDATE newsletter_drafts SET ${setClauses.join(', ')} WHERE id = ?`
    ).bind(...args).run()
    return c.json({ success: true })
  } catch (e) {
    console.error('[Newsletter] update error:', e)
    return c.json({ error: e.message }, 500)
  }
})

/**
 * DELETE /admin/newsletters/:id
 * Deletes a draft or scheduled newsletter. Cannot delete sent newsletters.
 */
app.delete('/admin/newsletters/:id', requireAdmin, async c => {
  try {
    const id = c.req.param('id')
    const existing = await c.env.DB.prepare(
      'SELECT id, status FROM newsletter_drafts WHERE id = ?'
    ).bind(id).first()
    if (!existing) return c.json({ error: 'Not found' }, 404)
    if (existing.status === 'sent') return c.json({ error: 'Cannot delete a sent newsletter' }, 400)
    await c.env.DB.prepare('DELETE FROM newsletter_drafts WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e) {
    console.error('[Newsletter] delete error:', e)
    return c.json({ error: e.message }, 500)
  }
})

/**
 * POST /admin/newsletters/:id/send
 * Sends a saved newsletter immediately to all opted-in recipients.
 * Marks the draft as 'sent' on success.
 */
app.post('/admin/newsletters/:id/send', requireAdmin, async c => {
  try {
    const id = c.req.param('id')
    const draft = await c.env.DB.prepare(
      'SELECT * FROM newsletter_drafts WHERE id = ?'
    ).bind(id).first()
    if (!draft) return c.json({ error: 'Not found' }, 404)
    if (draft.status === 'sent') return c.json({ error: 'This newsletter has already been sent' }, 400)
    if (!draft.subject?.trim() || !draft.html?.trim()) {
      return c.json({ error: 'Draft has no subject or body' }, 400)
    }
    const result = await sendNewsletterCampaign(c.env, draft.subject, draft.html, Number(id))
    return c.json(result)
  } catch (e) {
    console.error('[Newsletter] send-draft error:', e)
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================================
// PUBLIC: Newsletter unsubscribe via magic link (no login required)
// ============================================================================

/**
 * GET /unsubscribe?token=<token>
 * Public endpoint — no auth required.
 * Validates the single-use token, removes marketing consent, returns JSON.
 * The dicebastion.com/unsubscribe Hugo page calls this and renders the result.
 */
async function handleUnsubscribe(c) {
  const token = c.req.query('token')

  if (!token) {
    return c.json({ success: false, error: 'missing_token' }, 400)
  }

  try {
    const row = await c.env.DB.prepare(`
      SELECT t.id, t.user_id, t.used, t.expires_at
      FROM newsletter_unsub_tokens t
      WHERE t.token = ?
    `).bind(token).first()

    if (!row) {
      return c.json({ success: false, error: 'invalid_token' }, 404)
    }

    if (row.used) {
      // Idempotent — already unsubscribed
      return c.json({ success: true, already: true })
    }

    const now = new Date().toISOString()
    if (row.expires_at < now) {
      return c.json({ success: false, error: 'expired_token' }, 410)
    }

    // Remove marketing consent
    await c.env.DB.prepare(`
      UPDATE email_preferences
      SET marketing_emails = 0, consent_given = 0, last_updated = ?
      WHERE user_id = ?
    `).bind(now, row.user_id).run()

    // Mark token used (single-use)
    await c.env.DB.prepare(`
      UPDATE newsletter_unsub_tokens SET used = 1 WHERE id = ?
    `).bind(row.id).run()

    return c.json({ success: true })
  } catch (e) {
    console.error('[Unsubscribe] error:', e)
    return c.json({ success: false, error: 'server_error' }, 500)
  }
}
app.get('/unsubscribe', handleUnsubscribe)
app.get('/unsubscribe/', handleUnsubscribe)

/**
 * POST /admin/newsletter/send
 * Body: { subject: string, html: string }
 * Sends newsletter to all opted-in marketing recipients
 */
app.post('/admin/newsletter/send', requireAdmin, async c => {
  try {
    const { subject, html } = await c.req.json()
    if (!subject?.trim() || !html?.trim()) {
      return c.json({ error: 'subject and html are required' }, 400)
    }
    const result = await sendNewsletterCampaign(c.env, subject, html)
    return c.json(result)
  } catch (e) {
    console.error('[Newsletter] send error:', e)
    return c.json({ error: e.message }, 500)
  }
})

// ============================================================================
// CRON JOB: Scheduled newsletter dispatch
// ============================================================================

/**
 * Queries newsletter_drafts for any rows with status='scheduled' whose
 * scheduled_for timestamp is now or in the past, then sends each one.
 */
async function processScheduledNewsletters(env) {
  const jobName = 'scheduled_newsletters'
  const startedAt = new Date().toISOString()
  console.log(`[CRON] Starting ${jobName} at ${startedAt}`)

  let processed = 0
  let succeeded = 0
  let failed = 0

  try {
    const { results: due } = await env.DB.prepare(`
      SELECT * FROM newsletter_drafts
      WHERE status = 'scheduled'
        AND scheduled_for <= strftime('%Y-%m-%dT%H:%M:%fZ','now')
    `).all()

    if (!due || due.length === 0) {
      console.log('[CRON] No scheduled newsletters due')
      await logCronJob(env.DB, jobName, 'completed', {
        started_at: startedAt,
        records_processed: 0,
        records_succeeded: 0,
        records_failed: 0
      })
      return
    }

    for (const draft of due) {
      processed++
      try {
        await sendNewsletterCampaign(env, draft.subject, draft.html, draft.id)
        succeeded++
        console.log(`[CRON] Sent scheduled newsletter id=${draft.id}: "${draft.subject}"`)
      } catch (e) {
        failed++
        console.error(`[CRON] Failed to send newsletter id=${draft.id}:`, e)
        await env.DB.prepare(
          `UPDATE newsletter_drafts SET status = 'failed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`
        ).bind(draft.id).run().catch(() => {})
      }
    }

    await logCronJob(env.DB, jobName, failed > 0 ? 'partial' : 'completed', {
      started_at: startedAt,
      records_processed: processed,
      records_succeeded: succeeded,
      records_failed: failed
    })
  } catch (e) {
    console.error(`[CRON] ${jobName} error:`, e)
    await logCronJob(env.DB, jobName, 'failed', {
      started_at: startedAt,
      records_processed: processed,
      records_succeeded: succeeded,
      records_failed: failed,
      extra: { error: e.message }
    }).catch(() => {})
    throw e
  }
}

// ============================================================================
// CRON JOB: Daily SEO freshness – sitemap ping + re-index active events
// ============================================================================

/**
 * Ping Google & Bing with sitemap URLs so they know content has changed,
 * then batch-notify the Indexing API for any events updated in the last 48 h
 * (or all active events on Sundays for a weekly full sweep).
 */
async function processSeoFreshness(env) {
  const jobName = 'seo_freshness'
  const startedAt = new Date().toISOString()
  console.log(`[CRON] Starting ${jobName} at ${startedAt}`)

  let processed = 0
  let succeeded = 0
  let failed = 0

  try {
    // 1. Ping search-engine sitemap endpoints (lightweight GET)
    const sitemaps = [
      'https://dicebastion.com/sitemap.xml',
      'https://dicebastion.com/events/sitemap.xml'
    ]
    for (const sm of sitemaps) {
      try {
        const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sm)}`
        const res = await fetch(pingUrl)
        console.log(`[SEO] Pinged Google sitemap: ${sm} → ${res.status}`)
      } catch (e) {
        console.error(`[SEO] Sitemap ping failed for ${sm}:`, e)
      }
    }

    // 2. Batch re-index events via Google Indexing API
    if (!env.GOOGLE_SA_KEY) {
      console.log('[SEO] GOOGLE_SA_KEY not configured – skipping Indexing API')
      await logCronJob(env.DB, jobName, 'completed', {
        started_at: startedAt,
        records_processed: 0,
        records_succeeded: 0,
        records_failed: 0,
        extra: { note: 'sitemap pinged only, no SA key' }
      })
      return
    }

    // On Sundays (day 0) re-index ALL active events for a weekly sweep.
    // Other days only re-index events updated in the last 48 hours.
    const dayOfWeek = new Date().getUTCDay()
    let events
    if (dayOfWeek === 0) {
      const { results } = await env.DB.prepare(`
        SELECT slug FROM events
        WHERE is_active = 1
          AND (event_datetime >= datetime('now') OR is_recurring = 1)
      `).all()
      events = results || []
      console.log(`[SEO] Sunday full sweep: ${events.length} active events`)
    } else {
      const { results } = await env.DB.prepare(`
        SELECT slug FROM events
        WHERE is_active = 1
          AND (event_datetime >= datetime('now') OR is_recurring = 1)
          AND updated_at >= datetime('now', '-48 hours')
      `).all()
      events = results || []
      console.log(`[SEO] Daily delta: ${events.length} recently updated events`)
    }

    // Google Indexing API allows 200 requests/day – cap at 100 to leave room
    const batch = events.slice(0, 100)
    processed = batch.length

    for (const e of batch) {
      try {
        const url = `https://dicebastion.com/events/${e.slug}`
        const result = await notifyGoogleIndexing(env, url, 'URL_UPDATED')
        if (result.ok) {
          succeeded++
        } else {
          failed++
          console.error(`[SEO] Index notify failed for ${e.slug}:`, result.body)
        }
      } catch (err) {
        failed++
        console.error(`[SEO] Index notify error for ${e.slug}:`, err)
      }
    }

    console.log(`[SEO] Batch indexing done: ${succeeded}/${processed} succeeded`)

    await logCronJob(env.DB, jobName, failed === 0 ? 'completed' : 'partial', {
      started_at: startedAt,
      records_processed: processed,
      records_succeeded: succeeded,
      records_failed: failed,
      extra: { day: dayOfWeek === 0 ? 'sunday_sweep' : 'daily_delta' }
    })
  } catch (err) {
    console.error(`[CRON] ${jobName} FAILED:`, err)
    await logCronJob(env.DB, jobName, 'failed', {
      started_at: startedAt,
      records_processed: processed,
      records_succeeded: succeeded,
      records_failed: failed,
      error_message: err.message
    })
    throw err
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR CRON JOBS
// ============================================================================

/**
 * Log cron job execution to database
 */
async function logCronJob(db, jobName, status, details = {}) {
  try {
    const completedAt = status !== 'running' ? new Date().toISOString() : null
    
    await db.prepare(`
      INSERT INTO cron_job_log (
        job_name, started_at, completed_at, status,
        records_processed, records_succeeded, records_failed,
        error_message, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      jobName,
      details.started_at || new Date().toISOString(),
      completedAt,
      status,
      details.records_processed || 0,
      details.records_succeeded || 0,
      details.records_failed || 0,
      details.error_message || null,
      details.extra ? JSON.stringify(details.extra) : null
    ).run()
  } catch (err) {
    console.error(`[logCronJob] Failed to log ${jobName}:`, err)
  }
}

// ============================================================================
// CRON JOB: Auto-renewal processing
// ============================================================================

/**
 * Process auto-renewals and membership warnings
 * This function handles:
 * 1. Sending renewal warnings (3 days before)
 * 2. Processing renewals for expiring memberships
 * 3. Marking expired memberships
 */
async function processAutoRenewals(env) {
  const jobName = 'auto_renewals'
  const startedAt = new Date().toISOString()
  
  console.log(`[CRON] Starting ${jobName} at ${startedAt}`)
  
  let processed = 0
  let succeeded = 0
  let failed = 0
  let warningsSent = 0
  let expired = 0
  const errors = []
  
  try {
    const now = new Date()
    const today = toIso(now)
    
    // Calculate dates for warnings (3 days from now)
    const warningDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000))
    const warningDateStr = toIso(warningDate)
    
    // Grace period: allow renewals for memberships that expired in the last 3 days.
    // The cron runs once per day and will attempt up to 3 times, so the grace window
    // must be at least 3 days to match the renewal_attempts < 3 cap.
    const gracePeriodStart = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000))
    const gracePeriodStartStr = toIso(gracePeriodStart)
    
    // ========================================================================
    // STEP 1: Send renewal warnings (3 days before expiry)
    // ========================================================================
    console.log(`[CRON] Step 1: Checking for memberships needing renewal warnings...`)
    
    const warningMemberships = await env.DB.prepare(`
      SELECT 
        m.id,
        m.user_id,
        m.plan,
        m.end_date,
        u.email,
        u.name
      FROM memberships m
      JOIN users u ON m.user_id = u.user_id
      WHERE DATE(m.end_date) <= DATE(?)
        AND DATE(m.end_date) >= DATE(?)
        AND m.auto_renew = 1
        AND m.status = 'active'
        AND (m.renewal_warning_sent = 0 OR m.renewal_warning_sent IS NULL)
    `).bind(warningDateStr, today).all()
    
    console.log(`[CRON] Found ${warningMemberships.results?.length || 0} memberships needing warnings`)
    
    for (const membership of (warningMemberships.results || [])) {
      try {
        // Get payment instrument info for warning email
        const instrument = await getActivePaymentInstrument(env.DB, membership.user_id)
        const membershipWithInstrument = {
          ...membership,
          payment_instrument_last_4: instrument?.last_4 || null
        }
        
        const daysUntil = Math.max(1, Math.round((new Date(membership.end_date) - now) / (24 * 60 * 60 * 1000)))
        const emailContent = getUpcomingRenewalEmail(membershipWithInstrument, membership, daysUntil)
        await sendEmail(env, {
          to: membership.email,
          ...emailContent,
          emailType: 'membership_renewal_reminder',
          relatedId: membership.id,
          relatedType: 'membership',
          metadata: { plan: membership.plan, days_until_renewal: daysUntil }
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
    // STEP 1b: Send expiry warnings to non-auto-renewing members (3 days notice)
    // ========================================================================
    console.log(`[CRON] Step 1b: Checking for non-auto-renew memberships needing expiry warnings...`)

    const expiryWarningDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000))
    const expiryWarningDateStr = toIso(expiryWarningDate)

    const expiryWarningMemberships = await env.DB.prepare(`
      SELECT 
        m.id,
        m.user_id,
        m.plan,
        m.end_date,
        u.email,
        u.name
      FROM memberships m
      JOIN users u ON m.user_id = u.user_id
      WHERE DATE(m.end_date) <= DATE(?)
        AND DATE(m.end_date) >= DATE(?)
        AND m.auto_renew = 0
        AND m.status = 'active'
        AND (m.renewal_warning_sent = 0 OR m.renewal_warning_sent IS NULL)
    `).bind(expiryWarningDateStr, today).all()

    console.log(`[CRON] Found ${expiryWarningMemberships.results?.length || 0} non-auto-renew memberships needing expiry warnings`)

    for (const membership of (expiryWarningMemberships.results || [])) {
      try {
        const daysLeft = Math.max(0, Math.round((new Date(membership.end_date) - now) / (24 * 60 * 60 * 1000)))
        const emailContent = getMembershipExpiryWarningEmail(membership, membership, daysLeft)
        await sendEmail(env, {
          to: membership.email,
          ...emailContent,
          emailType: 'membership_expiry_warning',
          relatedId: membership.id,
          relatedType: 'membership',
          metadata: { plan: membership.plan, days_until_expiry: daysLeft }
        })

        await env.DB.prepare('UPDATE memberships SET renewal_warning_sent = 1 WHERE id = ?')
          .bind(membership.id).run()

        warningsSent++
        console.log(`[CRON] Expiry warning sent for non-auto-renew membership ${membership.id} (${membership.email})`)
      } catch (err) {
        console.error(`[CRON] Failed to send expiry warning for membership ${membership.id}:`, err)
        errors.push({
          membership_id: membership.id,
          email: membership.email,
          action: 'expiry_warning_email',
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
    
    // Then, expire memberships with auto-renewal that have exhausted all attempts
    // OR have been stuck past their grace period with any failed attempt.
    const expiredGracePeriodResult = await env.DB.prepare(`
      UPDATE memberships
      SET status = 'expired'
      WHERE end_date < ?
        AND status = 'active'
        AND auto_renew = 1
        AND (renewal_attempts >= 3 OR (renewal_failed_at IS NOT NULL AND renewal_attempts > 0))
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
            
            if (emailResult.skipped) {
              throw new Error('Email skipped - MAILERSEND_API_KEY not configured')
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
 * Process delayed account setup emails
 * Sends account setup invitation emails for tokens that were created
 * from the modal flow but the user never completed account setup.
 * Runs daily at 2 AM as part of the scheduled cron jobs.
 */
async function processDelayedAccountSetupEmails(env) {
  const jobName = 'delayed_account_setup_emails'
  const startedAt = new Date().toISOString()
  
  console.log(`[CRON] Starting ${jobName} at ${startedAt}`)
  
  let processed = 0
  let succeeded = 0
  let failed = 0
  const errors = []
  
  try {
    // Find tokens that:
    // 1. Haven't been used (used = 0) - user didn't complete account setup
    // 2. Email hasn't been sent yet (email_sent = 0)
    // 3. Haven't expired yet
    // 4. Source is 'modal' (only send delayed emails for modal flow)
    const now = new Date().toISOString()
    
    const pendingTokens = await env.DB.prepare(`
      SELECT prt.id, prt.token, prt.user_id, u.email, u.name
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.user_id
      WHERE prt.used = 0
        AND prt.email_sent = 0
        AND prt.expires_at > ?
        AND prt.source = 'modal'
    `).bind(now).all()
    
    processed = pendingTokens.results?.length || 0
    console.log(`[CRON] Found ${processed} account setup emails to send`)
    
    if (processed === 0) {
      await logCronJob(env.DB, jobName, 'completed', {
        started_at: startedAt,
        records_processed: 0,
        records_succeeded: 0,
        records_failed: 0
      })
      return
    }
    
    // Send email for each pending token
    for (const tokenRecord of pendingTokens.results) {
      try {
        const setupLink = `https://dicebastion.com/account-setup?token=${tokenRecord.token}`
        const emailHtml = getAccountCreationInviteEmail(tokenRecord.name || tokenRecord.email, tokenRecord.email, setupLink)
        
        await sendEmail(env, {
          to: tokenRecord.email,
          subject: '🎉 One More Step - Create Your Dice Bastion Account',
          html: emailHtml,
          emailType: 'account_setup_invite',
          relatedId: tokenRecord.user_id,
          relatedType: 'user'
        })
        
        // Mark email as sent
        await env.DB.prepare(`
          UPDATE password_reset_tokens
          SET email_sent = 1
          WHERE id = ?
        `).bind(tokenRecord.id).run()
        
        succeeded++
        console.log(`[CRON] ✓ Sent delayed account setup email to ${tokenRecord.email}`)
      } catch (err) {
        failed++
        errors.push({
          user_id: tokenRecord.user_id,
          email: tokenRecord.email,
          error: err.message
        })
        console.error(`[CRON] ✗ Failed to send delayed email to ${tokenRecord.email}:`, err)
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

// ==================== DONATION ENDPOINTS ====================

/**
 * Get donation totals and public messages for a campaign
 * GET /donations/wall?campaign=pokemon-day-2026
 */
app.get('/donations/wall', async c => {
  try {
    const campaign = c.req.query('campaign') || 'pokemon-day-2026'

    // Get total raised
    const totalResult = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) as total_raised,
             COUNT(*) as donation_count
      FROM donations
      WHERE campaign = ? AND payment_status = 'PAID'
    `).bind(campaign).first()

    // Get public messages (only where donor opted in)
    const messages = await c.env.DB.prepare(`
      SELECT
        CASE WHEN show_name = 1 THEN donor_name ELSE NULL END as name,
        CASE WHEN show_message = 1 THEN message ELSE NULL END as message,
        amount,
        currency,
        created_at
      FROM donations
      WHERE campaign = ? AND payment_status = 'PAID'
        AND (show_name = 1 OR show_message = 1)
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(campaign).all()

    return c.json({
      ok: true,
      campaign,
      total_raised: Number(totalResult?.total_raised || 0).toFixed(2),
      donation_count: totalResult?.donation_count || 0,
      messages: messages?.results || []
    })
  } catch (error) {
    console.error('[donations/wall] Error:', error)
    return c.json({ ok: false, error: 'internal_error' }, 500)
  }
})

/**
 * Create a donation checkout
 * POST /donations/checkout
 */
app.post('/donations/checkout', async c => {
  try {
    const ip = c.req.header('CF-Connecting-IP')
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())

    // Rate limiting: 5 requests per minute per IP
    if (!checkRateLimit(ip, donationCheckoutRateLimits, 5, 1)) {
      return c.json({ error: 'rate_limit_exceeded', message: 'Too many donation requests. Please try again in a minute.' }, 429)
    }

    const idem = c.req.header('Idempotency-Key')?.trim()
    const { amount, name, email, message, showName, showMessage, privacyConsent, turnstileToken } = await c.req.json()

    // Validate amount
    const donationAmount = Number(amount)
    if (!donationAmount || donationAmount < 1 || donationAmount > 10000) {
      return c.json({ error: 'invalid_amount', message: 'Please enter an amount between £1 and £10,000.' }, 400)
    }

    // Privacy consent required
    if (!privacyConsent) return c.json({ error: 'privacy_consent_required' }, 400)

    // Validate optional fields
    if (name && name.length > 200) return c.json({ error: 'name_too_long' }, 400)
    if (email && !EMAIL_RE.test(email)) return c.json({ error: 'invalid_email' }, 400)
    if (message && message.length > 500) return c.json({ error: 'message_too_long' }, 400)

    // Turnstile verification (optional – donate page skips it)
    if (turnstileToken) {
      const tsOk = await verifyTurnstile(c.env, turnstileToken, ip, debugMode, c)
      if (!tsOk) return c.json({ error: 'turnstile_failed' }, 403)
    }

    const currency = c.env.CURRENCY || 'GBP'
    const campaign = 'pokemon-day-2026'
    const order_ref = `DON-${campaign}-${crypto.randomUUID()}`

    // Idempotency check
    if (idem) {
      const existing = await c.env.DB.prepare(`
        SELECT * FROM donations WHERE order_ref LIKE 'DON-%' AND donor_email = ? AND payment_status = 'pending'
        ORDER BY id DESC LIMIT 1
      `).bind(email || '').first()
      if (existing && existing.checkout_id) {
        return c.json({ orderRef: existing.order_ref, checkoutId: existing.checkout_id, reused: true })
      }
    }

    // Create SumUp checkout
    let checkout
    try {
      checkout = await createCheckout(c.env, {
        amount: donationAmount,
        currency,
        orderRef: order_ref,
        title: 'Pokémon Day Fundraiser Donation',
        description: `Donation of £${donationAmount.toFixed(2)} for Pokémon Day Fundraiser`
      })
    } catch (e) {
      console.error('[donations/checkout] SumUp checkout failed:', e)
      return c.json({ error: 'sumup_checkout_failed', message: String(e?.message || e) }, 502)
    }

    if (!checkout.id) {
      console.error('[donations/checkout] Missing checkout ID:', checkout)
      return c.json({ error: 'sumup_missing_id' }, 502)
    }

    // Insert donation record
    await c.env.DB.prepare(`
      INSERT INTO donations (donor_name, donor_email, message, amount, currency, order_ref,
                             checkout_id, payment_status, show_name, show_message, campaign, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `).bind(
      clampStr(name, 200) || null,
      email || null,
      clampStr(message, 500) || null,
      String(donationAmount.toFixed(2)),
      currency,
      order_ref,
      checkout.id,
      showName ? 1 : 0,
      showMessage ? 1 : 0,
      campaign,
      toIso(new Date())
    ).run()

    // Also store in transactions table for unified tracking
    await c.env.DB.prepare(`
      INSERT INTO transactions (transaction_type, user_id, email, name, order_ref,
                                checkout_id, amount, currency, payment_status, idempotency_key, created_at)
      VALUES ('donation', NULL, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      email || null,
      clampStr(name, 200) || null,
      order_ref,
      checkout.id,
      String(donationAmount.toFixed(2)),
      currency,
      idem || null,
      toIso(new Date())
    ).run()

    return c.json({ orderRef: order_ref, checkoutId: checkout.id })
  } catch (e) {
    console.error('[donations/checkout] Error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

/**
 * Confirm a donation payment
 * GET /donations/confirm?orderRef=DON-...
 */
app.get('/donations/confirm', async c => {
  try {
    const orderRef = c.req.query('orderRef')
    if (!orderRef || !orderRef.startsWith('DON-')) {
      return c.json({ ok: false, error: 'invalid_orderRef' }, 400)
    }

    // Look up donation
    const donation = await c.env.DB.prepare('SELECT * FROM donations WHERE order_ref = ?').bind(orderRef).first()
    if (!donation) {
      return c.json({ ok: false, error: 'donation_not_found' }, 404)
    }

    // Already confirmed
    if (donation.payment_status === 'PAID') {
      return c.json({
        ok: true,
        status: 'already_active',
        amount: donation.amount,
        currency: donation.currency || 'GBP',
        donorName: donation.show_name ? donation.donor_name : null
      })
    }

    // Verify payment with SumUp
    let payment
    try {
      payment = await fetchPayment(c.env, donation.checkout_id)
      console.log('[donations/confirm] SumUp payment status:', payment?.status, 'checkout_id:', donation.checkout_id)
    } catch (err) {
      console.error('[donations/confirm] Failed to fetch payment:', err)
      return c.json({ ok: false, error: 'verify_failed' }, 400)
    }

    const paid = payment && (payment.status === 'PAID' || payment.status === 'SUCCESSFUL')
    if (!paid) {
      const currentStatus = payment?.status || 'PENDING'
      return c.json({
        ok: false,
        status: currentStatus,
        message: currentStatus === 'FAILED' ? 'Payment failed. Please try again.' :
                 currentStatus === 'DECLINED' ? 'Your card was declined. Please try a different payment method.' :
                 'Payment is still processing.'
      })
    }

    console.log('[donations/confirm] Payment verified as PAID')

    // Update donation and transaction records
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE donations SET payment_status = ?, payment_id = ?, updated_at = ? WHERE id = ?')
        .bind('PAID', payment.id, toIso(new Date()), donation.id),
      c.env.DB.prepare('UPDATE transactions SET payment_status = ?, payment_id = ?, updated_at = ? WHERE order_ref = ?')
        .bind('PAID', payment.id, toIso(new Date()), orderRef)
    ])

    // Send admin notification
    try {
      await sendEmail(c.env, {
        to: 'admin@dicebastion.com',
        subject: `💰 New Donation: £${donation.amount} - Pokémon Day Fundraiser`,
        html: `<h2>New Donation Received!</h2>
               <p><strong>Amount:</strong> £${donation.amount}</p>
               <p><strong>Donor:</strong> ${donation.donor_name || 'Anonymous'}</p>
               <p><strong>Email:</strong> ${donation.donor_email || 'Not provided'}</p>
               <p><strong>Message:</strong> ${donation.message || 'No message'}</p>
               <p><strong>Order Ref:</strong> ${orderRef}</p>`,
        text: `New Donation: £${donation.amount} from ${donation.donor_name || 'Anonymous'}`,
        emailType: 'admin_donation_notification',
        relatedId: donation.id,
        relatedType: 'donation'
      })
    } catch (emailError) {
      console.error('[donations/confirm] Failed to send admin notification:', emailError)
    }

    // Send thank-you email to the donor (only if they provided an email)
    if (donation.donor_email) {
      try {
        const donorDisplayName = donation.donor_name || 'there'
        await sendEmail(c.env, {
          to: donation.donor_email,
          subject: `Thank you for your donation to Dice Bastion`,
          html: `<h2>Thank you for your generosity, ${donorDisplayName}!</h2>
                 <p>We've received your donation of <strong>&pound;${donation.amount}</strong> to the Pokemon Day Fundraiser.</p>
                 <p>Your support means a lot to the Dice Bastion community and helps us keep running great events for everyone.</p>
                 <p><strong>Donation details:</strong></p>
                 <ul>
                   <li>Amount: &pound;${donation.amount}</li>
                   <li>Campaign: Pokemon Day Fundraiser</li>
                   <li>Reference: ${orderRef}</li>
                 </ul>
                 <p>If you have any questions, feel free to get in touch at <a href="mailto:admin@dicebastion.com">admin@dicebastion.com</a>.</p>
                 <p>Thanks again,<br>The Dice Bastion Team</p>`,
          text: `Thank you for your generosity, ${donorDisplayName}!\n\nWe've received your donation of £${donation.amount} to the Pokemon Day Fundraiser.\n\nYour support means a lot to the Dice Bastion community and helps us keep running great events for everyone.\n\nDonation details:\n- Amount: £${donation.amount}\n- Campaign: Pokemon Day Fundraiser\n- Reference: ${orderRef}\n\nIf you have any questions, feel free to get in touch at admin@dicebastion.com.\n\nThanks again,\nThe Dice Bastion Team`,
          emailType: 'donation_thank_you',
          relatedId: donation.id,
          relatedType: 'donation'
        })
      } catch (emailError) {
        console.error('[donations/confirm] Failed to send donor thank-you email:', emailError)
      }
    }

    return c.json({
      ok: true,
      status: 'active',
      amount: donation.amount,
      currency: donation.currency || 'GBP',
      donorName: donation.show_name ? donation.donor_name : null
    })
  } catch (error) {
    console.error('[donations/confirm] Error:', error)
    return c.json({ ok: false, error: 'internal_error' }, 500)
  }
})

// ==================== PRODUCT ORDERS ====================

app.post('/orders/checkout', async c => {
  try {
    const { email, name, items } = await c.req.json()
    if (!items?.length) return c.json({ error: 'invalid_request' }, 400)

    // Let the DB do the math — one query to validate items and compute the total
    const ids = items.map(i => parseInt(i.id)).filter(n => n > 0)
    if (!ids.length) return c.json({ error: 'no_items' }, 400)

    // Build a temp map of requested quantities (capped 1-10)
    const qtyMap = {}
    for (const { id, qty } of items) { qtyMap[parseInt(id)] = Math.min(10, Math.max(1, parseInt(qty) || 0)) }

    const { results: products } = await c.env.DB.prepare(
      `SELECT id, name, price, currency FROM products WHERE id IN (${ids.map(() => '?').join(',')}) AND is_active = 1`
    ).bind(...ids).all()
    if (!products.length) return c.json({ error: 'no_valid_items' }, 400)

    const currency = products[0].currency
    const orderNumber = `ORD-${crypto.randomUUID()}`
    const orderItems = products.map(p => ({ product_id: p.id, product_name: p.name, quantity: qtyMap[p.id], unit_price: p.price, subtotal: p.price * qtyMap[p.id] }))
    const total = orderItems.reduce((s, r) => s + r.subtotal, 0)
    const desc = orderItems.map(r => `${r.quantity}x ${r.product_name}`).join(', ')

    const checkout = await createCheckout(c.env, { amount: total / 100, currency, orderRef: orderNumber, description: desc })
    if (!checkout?.id) return c.json({ error: 'checkout_failed' }, 502)

    // Use defaults for email/name since orders table has NOT NULL constraints
    // (drinks orders don't collect customer info)
    const orderEmail = email || 'walk-in'
    const orderName = clampStr(name || '', 200) || 'Walk-in'

    const batch = [
      c.env.DB.prepare('INSERT INTO orders (order_number, email, name, subtotal, total, currency, checkout_id, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(orderNumber, orderEmail, orderName, total, total, currency, checkout.id, 'pending'),
      ...orderItems.map(r =>
        c.env.DB.prepare('INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES ((SELECT id FROM orders WHERE order_number = ?), ?, ?, ?, ?, ?)')
          .bind(orderNumber, r.product_id, r.product_name, r.quantity, r.unit_price, r.subtotal))
    ]
    await c.env.DB.batch(batch)

    return c.json({ orderNumber, checkoutId: checkout.id })
  } catch (e) {
    console.error('orders/checkout error', e)
    return c.json({ error: 'internal_error', message: String(e?.message || e) }, 500)
  }
})

app.get('/orders/confirm', async c => {
  const ref = c.req.query('orderRef')
  if (!ref) return c.json({ error: 'missing_ref' }, 400)

  const order = await c.env.DB.prepare('SELECT checkout_id, payment_status FROM orders WHERE order_number = ?').bind(ref).first()
  if (!order) return c.json({ error: 'not_found' }, 404)
  if (order.payment_status === 'PAID') return c.json({ ok: true, status: 'active' })

  const payment = await fetchPayment(c.env, order.checkout_id)
  if (payment?.status !== 'PAID' && payment?.status !== 'SUCCESSFUL') return c.json({ ok: false, status: payment?.status || 'PENDING' })

  await c.env.DB.prepare('UPDATE orders SET payment_status = ?, payment_id = ?, status = ?, updated_at = ? WHERE order_number = ?')
    .bind('PAID', payment.id, 'completed', toIso(new Date()), ref).run()

  return c.json({ ok: true, status: 'active' })
})

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
    scheduled_newsletters: null,
    auto_renewals: null,
    event_reminders: null,
    delayed_account_setup_emails: null,
    seo_freshness: null
  }
  
  // Run all cron jobs sequentially, catching errors individually
  try {
    await processScheduledNewsletters(env)
    jobResults.scheduled_newsletters = 'completed'
  } catch (e) {
    console.error('[CRON MASTER] Scheduled newsletters failed:', e)
    jobResults.scheduled_newsletters = 'failed'
  }

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
    await processDelayedAccountSetupEmails(env)
    jobResults.delayed_account_setup_emails = 'completed'
  } catch (e) {
    console.error('[CRON MASTER] Delayed account setup emails failed:', e)
    jobResults.delayed_account_setup_emails = 'failed'
    // Individual job already logged its own error
  }

  try {
    await processSeoFreshness(env)
    jobResults.seo_freshness = 'completed'
  } catch (e) {
    console.error('[CRON MASTER] SEO freshness failed:', e)
    jobResults.seo_freshness = 'failed'
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
      records_processed: 5,
      records_succeeded: Object.values(jobResults).filter(r => r === 'completed').length,
      records_failed: Object.values(jobResults).filter(r => r === 'failed').length,
      extra: jobResults
    })
  } catch (logErr) {
    console.error('[CRON MASTER] Failed to log master run:', logErr)
  }
}

export default {
  /**
   * Custom fetch handler to separate route-intercepted requests
   * from normal API requests (workers.dev domain).
   *
   * dicebastion.com/events/*         → Event SEO pages / origin pass-through
   * shop.dicebastion.com/products/*  → Product SEO pages / origin pass-through
   *
   * Calling fetch(request) OUTSIDE Hono guarantees Cloudflare sends to origin,
   * avoiding the recursion issue that happens with fetch(c.req.raw) inside Hono handlers.
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const host = request.headers.get('Host') || ''

    // ====== SHOP: shop.dicebastion.com/products/* ======
    if (host.includes('shop.dicebastion.com') && url.pathname.startsWith('/products')) {
      const trimmed = url.pathname.replace(/\/+$/, '')
      const parts = trimmed.split('/')  // ['', 'products', ...]

      // /products/sitemap.xml → Hono serves dynamic sitemap
      if (url.pathname === '/products/sitemap.xml') {
        return app.fetch(request, env, ctx)
      }

      // /products/category/:name → Hono serves category SEO page
      if (parts.length === 4 && parts[2] === 'category') {
        return app.fetch(request, env, ctx)
      }

      // /products/:slug → Hono serves product SEO page (or 302 for humans)
      const slug = parts.length === 3 ? parts[2] : null
      if (slug && !slug.includes('.')) {
        return app.fetch(request, env, ctx)
      }

      // Everything else → pass to Cloudflare Pages origin, inject crawlable links
      try {
        const [originRes, { results: activeProducts }] = await Promise.all([
          fetch(request),
          env.DB.prepare(`
            SELECT slug, name, category FROM products
            WHERE is_active = 1 AND slug IS NOT NULL AND COALESCE(show_in_shop, 1) = 1
            ORDER BY name ASC
          `).all()
        ])

        const ct = originRes.headers.get('content-type') || ''
        if (!ct.includes('text/html') || !activeProducts || activeProducts.length === 0) {
          return originRes
        }

        let html = await originRes.text()

        // Collect categories
        const categories = new Set()
        activeProducts.forEach(p => {
          if (p.category) p.category.split(',').map(c => c.trim()).filter(Boolean).forEach(c => categories.add(c))
        })

        const productLinks = activeProducts.map(p =>
          `<a href="/products/${encodeURIComponent(p.slug)}">${p.name}</a>`
        ).join('\n          ')

        const categoryLinks = [...categories].map(c =>
          `<a href="/products/category/${encodeURIComponent(c)}">${c}</a>`
        ).join('\n          ')

        const navBlock = `
      <nav aria-label="Products" style="padding:1.5rem 1rem;text-align:center;font-size:0.85rem;color:#888;border-top:1px solid rgba(128,128,128,0.2)">
        ${categoryLinks ? `<p style="margin-bottom:0.5rem;font-weight:600;color:#aaa">Categories</p>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.5rem 1.25rem;margin-bottom:1rem">${categoryLinks}</div>` : ''}
        <p style="margin-bottom:0.5rem;font-weight:600;color:#aaa">All Products</p>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.5rem 1.25rem">
          ${productLinks}
        </div>
      </nav>`

        html = html.replace('</body>', navBlock + '\n</body>')

        return new Response(html, {
          status: originRes.status,
          headers: originRes.headers
        })
      } catch (e) {
        return fetch(request)
      }
    }

    // ====== EVENTS: dicebastion.com/events/* ======
    if (host.includes('dicebastion.com') && !host.includes('shop.') && url.pathname.startsWith('/events')) {

      // Extract slug from /events/:slug (strip trailing slash first)
      const trimmed = url.pathname.replace(/\/+$/, '')   // /events/foo/ → /events/foo
      const parts = trimmed.split('/')                   // ['', 'events', 'foo']
      const slug = parts.length === 3 ? parts[2] : null  // 'foo' or null

      // sitemap.xml → let Hono serve the dynamic sitemap
      if (url.pathname === '/events/sitemap.xml') {
        return app.fetch(request, env, ctx)
      }

      // Valid event slug → let Hono serve SEO page (or JSON for API callers)
      if (slug && !slug.includes('.')) {
        return app.fetch(request, env, ctx)
      }

      // Everything else (/events/, /events/index.html, /events/page/2, etc.)
      // → fetch from origin, inject crawlable event links for SEO
      try {
        const [originRes, { results: activeEvents }] = await Promise.all([
          fetch(request),
          env.DB.prepare(`
            SELECT slug, event_name FROM events
            WHERE is_active = 1
              AND slug IS NOT NULL
              AND (event_datetime >= datetime('now') OR is_recurring = 1)
            ORDER BY event_datetime ASC
          `).all()
        ])

        // Only inject into HTML responses
        const ct = originRes.headers.get('content-type') || ''
        if (!ct.includes('text/html') || !activeEvents || activeEvents.length === 0) {
          return originRes
        }

        let html = await originRes.text()

        // Build a crawlable nav block (visible, unobtrusive footer nav)
        const links = activeEvents.map(e =>
          `<a href="/events/${encodeURIComponent(e.slug)}">${e.event_name}</a>`
        ).join('\n          ')

        const navBlock = `
      <nav aria-label="Upcoming events" style="padding:1.5rem 1rem;text-align:center;font-size:0.85rem;color:#888;border-top:1px solid rgba(128,128,128,0.2)">
        <p style="margin-bottom:0.5rem;font-weight:600;color:#aaa">Upcoming Events</p>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.5rem 1.25rem">
          ${links}
        </div>
      </nav>`

        // Inject before </body>
        html = html.replace('</body>', navBlock + '\n</body>')

        return new Response(html, {
          status: originRes.status,
          headers: originRes.headers
        })
      } catch (e) {
        // On any failure, fall through to origin without modification
        return fetch(request)
      }
    }

    // Non-route requests (workers.dev API calls, etc.) → normal Hono handling
    return app.fetch(request, env, ctx)
  },
  scheduled: handleScheduled
}