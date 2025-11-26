import { Hono } from 'hono'

// Replace generic cors with strict configurable CORS + debug logging
const app = new Hono()
app.use('*', async (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGIN || '').split(',').map(s=>s.trim()).filter(Boolean)
  const origin = c.req.header('Origin')
  const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
  const allowOrigin = (origin && allowed.includes(origin)) ? origin : ''
  if (allowOrigin) c.res.headers.set('Access-Control-Allow-Origin', allowOrigin)
  c.res.headers.set('Vary','Origin')
  c.res.headers.set('Access-Control-Allow-Headers','Content-Type, Idempotency-Key')
  c.res.headers.set('Access-Control-Allow-Methods','GET,POST,OPTIONS')
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
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SUMUP_CLIENT_ID_BACKUP, client_secret: env.SUMUP_CLIENT_SECRET_BACKUP, scope: scopes })
  const res = await fetch('https://api.sumup.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!res.ok) { const txt = await res.text().catch(()=>{}); throw new Error(`Failed to get SumUp token (${res.status}): ${txt}`) }
  const json = await res.json(); 
  const granted = (json.scope||'').split(/\s+/).filter(Boolean)
  const required = scopes.split(/\s+/).filter(Boolean)
  const missing = required.filter(s => !granted.includes(s))
  if (missing.length > 0) { throw new Error(`SumUp OAuth token missing required scopes: ${missing.join(', ')} (granted: [${granted.join(', ')}])`) }
  return json
}

async function createCheckout(env, { amount, currency, orderRef, title, description }) {
  const { access_token } = await sumupToken(env)
  const returnUrl = new URL(env.RETURN_URL)
  returnUrl.searchParams.set('orderRef', orderRef)
  const body = { amount: Number(amount), currency, checkout_reference: orderRef, merchant_code: env.SUMUP_MERCHANT_CODE, description: description || title, return_url: returnUrl.toString() }
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
    const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    })
    if (!res.ok) return null
    const payment = await res.json()
    
    // Extract payment instrument details from payment
    if (payment.payment_instrument && payment.payment_instrument.token) {
      const instrument = payment.payment_instrument
      const now = toIso(new Date())
      
      // Deactivate old instruments for this user
      await db.prepare('UPDATE payment_instruments SET is_active = 0 WHERE user_id = ?').bind(userId).run()
      
      // Insert new instrument
      await db.prepare(`
        INSERT INTO payment_instruments (user_id, instrument_id, card_type, last_4, expiry_month, expiry_year, created_at, updated_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(user_id, instrument_id) DO UPDATE SET is_active = 1, updated_at = ?
      `).bind(
        userId,
        instrument.token,
        instrument.card_type || null,
        instrument.last_4_digits || null,
        instrument.expiry_month || null,
        instrument.expiry_year || null,
        now,
        now,
        now
      ).run()
      
      return instrument.token
    }
  } catch (e) {
    console.error('Failed to save payment instrument:', e)
  }
  return null
}

// Charge a saved payment instrument
async function chargePaymentInstrument(env, instrumentId, amount, currency, orderRef, description) {
  try {
    const { access_token } = await sumupToken(env, 'payments payment_instruments')
    const body = {
      payment_instrument: instrumentId,
      amount: Number(amount),
      currency,
      checkout_reference: orderRef,
      merchant_code: env.SUMUP_MERCHANT_CODE,
      description
    }
    
    const res = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Charge failed: ${txt}`)
    }
    
    return await res.json()
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
      
      await db.prepare(`
        UPDATE memberships 
        SET end_date = ?, 
            renewal_failed_at = NULL, 
            renewal_attempts = 0,
            payment_status = 'PAID'
        WHERE id = ?
      `).bind(toIso(newEnd), membership.id).run()
      
      await db.prepare('INSERT INTO renewal_log (membership_id, attempt_date, status, payment_id, amount, currency) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(membership.id, toIso(new Date()), 'success', payment.id, String(amount), currency).run()
      
      return { success: true, newEndDate: toIso(newEnd), paymentId: payment.id }
    } else {
      throw new Error(`Payment not successful: ${payment?.status || 'UNKNOWN'}`)
    }
  } catch (e) {
    await db.prepare('UPDATE memberships SET renewal_failed_at = ?, renewal_attempts = renewal_attempts + 1 WHERE id = ?')
      .bind(toIso(new Date()), membership.id).run()
    await db.prepare('INSERT INTO renewal_log (membership_id, attempt_date, status, error_message, amount, currency) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(membership.id, toIso(new Date()), 'failed', String(e.message || e), String(amount), currency).run()
    
    return { success: false, error: String(e.message || e) }
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

function getRenewalFailedEmail(membership, user) {
  const planNames = { monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' }
  const planName = planNames[membership.plan] || membership.plan
  
  return {
    subject: `Action Required: Dice Bastion Membership Renewal Failed`,
    html: `
      <h2>Membership Renewal Failed</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>We were unable to automatically renew your <strong>${planName} Membership</strong>.</p>
      <p>Your membership will expire on <strong>${new Date(membership.end_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
      <p><strong>What to do next:</strong></p>
      <ul>
        <li>Update your payment method at <a href="https://dicebastion.com/account">dicebastion.com/account</a></li>
        <li>Or purchase a new membership at <a href="https://dicebastion.com/memberships">dicebastion.com/memberships</a></li>
      </ul>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>— The Dice Bastion Team</p>
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

    // Ensure columns exist before using them
    await ensureSchema(c.env.DB, s.fkColumn)

    // Build dynamic FK condition for idempotency
    const mc = await c.env.DB.prepare('PRAGMA table_info(memberships)').all().catch(()=>({ results: [] }))
    const mnames = new Set((mc?.results||[]).map(r => String(r.name||'').toLowerCase()))
    let fkCond = '', fkBinds = []
    if (mnames.has('user_id') && mnames.has('member_id')) { fkCond = '(user_id = ? OR member_id = ?)'; fkBinds = [ident.id, ident.id] }
    else if (mnames.has('user_id')) { fkCond = 'user_id = ?'; fkBinds = [ident.id] }
    else { fkCond = 'member_id = ?'; fkBinds = [ident.id] }

    // Idempotency reuse
    if (idem){
      const existing = await c.env.DB.prepare(`SELECT * FROM memberships WHERE ${fkCond} AND plan = ? AND status = "pending" AND idempotency_key = ? ORDER BY id DESC LIMIT 1`).bind(...fkBinds, plan, idem).first()
      if (existing && existing.checkout_id){
        return c.json({ orderRef: existing.order_ref, checkoutId: existing.checkout_id, reused: true })
      }
    }

    const order_ref = crypto.randomUUID()
    const autoRenewValue = autoRenew ? 1 : 0
    // Insert setting both user_id and member_id when both exist to satisfy NOT NULL
    const cols = ['plan','status','order_ref','amount','currency','consent_at','idempotency_key','auto_renew']
    const vals = [plan,'pending',order_ref,String(amount),currency,toIso(new Date()), idem || null, autoRenewValue]
    if (mnames.has('user_id')) { cols.unshift('user_id'); vals.unshift(ident.id) }
    if (mnames.has('member_id')) { cols.unshift('member_id'); vals.unshift(ident.id) }
    const placeholders = cols.map(()=>'?').join(',')
    await c.env.DB.prepare(`INSERT INTO memberships (${cols.join(',')}) VALUES (${placeholders})`).bind(...vals).run()

    let checkout
    try {
      checkout = await createCheckout(c.env, { amount, currency, orderRef: order_ref, title: `Dice Bastion ${plan} membership`, description: `Membership for ${plan}` })
    } catch (err) {
      console.error('sumup checkout error', err)
      return c.json({ error: 'sumup_checkout_failed', message: String(err?.message || err) }, 502)
    }
    if (!checkout.id) {
      console.error('membership checkout missing id', checkout)
      return c.json({ error: 'sumup_missing_id' }, 502)
    }
    await c.env.DB.prepare('UPDATE memberships SET checkout_id = ? WHERE order_ref = ?').bind(checkout.id, order_ref).run()
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
  const pending = await c.env.DB.prepare('SELECT * FROM memberships WHERE order_ref = ?').bind(orderRef).first()
  if (!pending) return c.json({ ok:false, error:'order_not_found' },404)
  if (pending.status === 'active') return c.json({ ok:true, status:'already_active', endDate: pending.end_date })
  let payment; try { payment = await fetchPayment(c.env, pending.checkout_id) } catch { return c.json({ ok:false, error:'verify_failed' },400) }
  const paid = payment && (payment.status === 'PAID' || payment.status === 'SUCCESSFUL')
  if (!paid) return c.json({ ok:false, status: payment?.status || 'PENDING' })
  // Verify amount/currency
  if (payment.amount != Number(pending.amount) || (pending.currency && payment.currency !== pending.currency)) {
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
    instrumentId = await savePaymentInstrument(c.env.DB, identityId, pending.checkout_id, c.env)
  }
  
  await c.env.DB.prepare(`
    UPDATE memberships 
    SET status = "active", 
        start_date = ?, 
        end_date = ?, 
        payment_id = ?, 
        payment_status = "PAID",
        payment_instrument_id = ?
    WHERE id = ?
  `).bind(toIso(baseStart), toIso(end), pending.checkout_id, instrumentId, pending.id).run()
  
  // Get user details and send welcome email
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(identityId).first()
  if (user) {
    const updatedMembership = { ...pending, end_date: toIso(end) }
    const emailContent = getWelcomeEmail(updatedMembership, user, pending.auto_renew === 1)
    await sendEmail(c.env, { to: user.email, ...emailContent })
  }
  
  return c.json({ ok:true, status:'active', endDate: toIso(end), autoRenewalEnabled: !!instrumentId })
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
    // Detect actual FK column present in tickets table; prefer user_id
    const tinfo = await c.env.DB.prepare('PRAGMA table_info(tickets)').all().catch(()=>({ results: [] }))
    const tnames = new Set((tinfo?.results||[]).map(r => String(r.name||'').toLowerCase()))
    const hasUser = tnames.has('user_id')
    const hasMember = tnames.has('member_id')
    const ticketFkCol = hasUser ? 'user_id' : (hasMember ? 'member_id' : s.fkColumn)

    if (idem){
      const existing = await c.env.DB.prepare(`SELECT * FROM tickets WHERE event_id = ? AND ${ticketFkCol} = ? AND status = "pending" AND idempotency_key = ? ORDER BY id DESC LIMIT 1`).bind(evId, ident.id, idem).first()
      if (existing && existing.checkout_id){
        return c.json({ orderRef: existing.order_ref, checkoutId: existing.checkout_id, reused: true })
      }
    }

    const order_ref = `EVT-${evId}-${crypto.randomUUID()}`
    const nowIso = toIso(new Date())
    const colParts = ['event_id']
    const bindVals = [evId]
    if (hasUser) { colParts.push('user_id'); bindVals.push(ident.id) }
    if (hasMember) { colParts.push('member_id'); bindVals.push(ident.id) }
    colParts.push('status','order_ref','amount','currency','consent_at','idempotency_key','created_at')
    bindVals.push('pending', order_ref, String(amount), currency, nowIso, idem || null, nowIso)
    if (bindVals.some(v => typeof v === 'undefined')) { console.error('insert params contain undefined', bindVals); return c.json({ error:'invalid_params' },500) }
    const placeholders = colParts.map(()=>'?').join(',')
    await c.env.DB.prepare(`INSERT INTO tickets (${colParts.join(',')}) VALUES (${placeholders})`).bind(...bindVals).run()

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
    await c.env.DB.prepare('UPDATE tickets SET checkout_id = ? WHERE order_ref = ?').bind(checkout.id, order_ref).run()
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
  const ticket = await c.env.DB.prepare('SELECT * FROM tickets WHERE order_ref = ?').bind(orderRef).first()
  if (!ticket) return c.json({ ok:false, error:'ticket_not_found' },404)
  if (ticket.status === 'active') return c.json({ ok:true, status:'already_active' })
  let payment; try { payment = await fetchPayment(c.env, ticket.checkout_id) } catch { return c.json({ ok:false, error:'verify_failed' },400) }
  const paid = payment && (payment.status === 'PAID' || payment.status === 'SUCCESSFUL')
  if (!paid) return c.json({ ok:false, status: payment?.status || 'PENDING' })
  if (payment.amount != Number(ticket.amount) || (ticket.currency && payment.currency !== ticket.currency)) return c.json({ ok:false, error:'payment_mismatch' },400)

  // Capacity safe increment (only if still space)
  const ev = await c.env.DB.prepare('SELECT capacity,tickets_sold FROM events WHERE event_id = ?').bind(ticket.event_id).first()
  if (ev && ev.capacity && ev.tickets_sold >= ev.capacity) return c.json({ ok:false, error:'sold_out' },409)
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE tickets SET status = "active", payment_id = ?, payment_status = "PAID" WHERE id = ?').bind(ticket.checkout_id, ticket.id),
    // Increment if not exceeded capacity
    c.env.DB.prepare('UPDATE events SET tickets_sold = tickets_sold + 1 WHERE event_id = ? AND (capacity IS NULL OR tickets_sold < capacity)').bind(ticket.event_id)
  ])
  return c.json({ ok:true, status:'active' })
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

// Cron trigger for processing renewals (runs daily)
async function handleScheduled(event, env, ctx) {
  console.log('Starting membership renewal cron job')
  
  try {
    await ensureSchema(env.DB, 'user_id')
    
    // Find memberships expiring in the next 7 days that have auto-renewal enabled
    const sevenDaysFromNow = toIso(addMonths(new Date(), 0.23)) // ~7 days
    const now = toIso(new Date())
    
    const expiringMemberships = await env.DB.prepare(`
      SELECT * FROM memberships 
      WHERE status = 'active' 
        AND auto_renew = 1 
        AND end_date <= ? 
        AND end_date >= ?
        AND (renewal_attempts IS NULL OR renewal_attempts < 3)
      ORDER BY end_date ASC
    `).bind(sevenDaysFromNow, now).all()
    
    console.log(`Found ${expiringMemberships.results?.length || 0} memberships to renew`)
    
    const results = []
    for (const membership of (expiringMemberships.results || [])) {
      console.log(`Processing renewal for membership ${membership.id}`)
      const result = await processMembershipRenewal(env.DB, membership, env)
      results.push({ membershipId: membership.id, ...result })
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('Renewal cron job completed', { processed: results.length, successful: results.filter(r => r.success).length })
    
    return { success: true, processed: results.length, results }
  } catch (e) {
    console.error('Renewal cron job error:', e)
    return { success: false, error: String(e) }
  }
}

export default {
  fetch: app.fetch,
  scheduled: handleScheduled
}
