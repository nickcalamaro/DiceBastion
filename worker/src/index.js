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
  // Detect memberships FK column
  const cols = await db.prepare("PRAGMA table_info(memberships)").all().catch(() => ({ results: [] }))
  const names = new Set((cols?.results || []).map(c => (c.name || c.Name || '').toLowerCase()))
  const fkColumn = names.has('user_id') ? 'user_id' : 'member_id'
  // Detect identity table
  const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().catch(() => ({ results: [] }))
  const tableSet = new Set((tables?.results || []).map(r => String(r.name || '').toLowerCase()))
  let identityTable = fkColumn === 'user_id' ? 'users' : 'members'
  if (!tableSet.has(identityTable)) {
    // Fallback if mismatch
    identityTable = tableSet.has('users') ? 'users' : 'members'
  }
  __schemaCache = { fkColumn, identityTable }
  return __schemaCache
}

async function ensureSchema(db, fkColumn){
  // memberships columns
  try {
    const mc = await db.prepare('PRAGMA table_info(memberships)').all().catch(()=>({ results: [] }))
    const mnames = new Set((mc?.results||[]).map(r => String(r.name||'').toLowerCase()))
    const alter = []
    if (!mnames.has('amount')) alter.push('ALTER TABLE memberships ADD COLUMN amount TEXT')
    if (!mnames.has('currency')) alter.push('ALTER TABLE memberships ADD COLUMN currency TEXT')
    if (!mnames.has('consent_at')) alter.push('ALTER TABLE memberships ADD COLUMN consent_at TEXT')
    if (!mnames.has('idempotency_key')) alter.push('ALTER TABLE memberships ADD COLUMN idempotency_key TEXT')
    if (!mnames.has('payment_status')) alter.push('ALTER TABLE memberships ADD COLUMN payment_status TEXT')
    for (const sql of alter) { await db.prepare(sql).run().catch(()=>{}) }
  } catch {}

  // tickets table and columns
  try {
    // Create with full schema if missing
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        ${fkColumn} INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT "pending",
        order_ref TEXT UNIQUE,
        checkout_id TEXT,
        payment_id TEXT,
        amount TEXT,
        currency TEXT,
        consent_at TEXT,
        idempotency_key TEXT,
        payment_status TEXT,
        created_at TEXT
      )`
    ).run()
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
}

async function findIdentityByEmail(db, email){
  const s = await getSchema(db)
  return await db.prepare(`SELECT * FROM ${s.identityTable} WHERE email = ?`).bind(email).first()
}

async function getOrCreateIdentity(db, email, name){
  const s = await getSchema(db)
  const existing = await db.prepare(`SELECT * FROM ${s.identityTable} WHERE email = ?`).bind(email).first()
  if (existing) return existing
  await db.prepare(`INSERT INTO ${s.identityTable} (email, name) VALUES (?, ?)`).bind(email, name || null).run()
  return await db.prepare(`SELECT * FROM ${s.identityTable} WHERE email = ?`).bind(email).first()
}

async function getActiveMembership(db, identityId) {
  const now = new Date().toISOString()
  const s = await getSchema(db)
  return await db.prepare(`SELECT * FROM memberships WHERE ${s.fkColumn} = ? AND status = "active" AND end_date >= ? ORDER BY end_date DESC LIMIT 1`).bind(identityId, now).first()
}

// Fetch pricing/details for a plan from the services table
async function getServiceForPlan(db, planCode) {
  return await db.prepare('SELECT * FROM services WHERE code = ? AND active = 1 LIMIT 1').bind(planCode).first()
}

// Obtain SumUp OAuth token to verify payments server-side
async function sumupToken(env) {
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: env.SUMUP_CLIENT_ID_BACKUP, client_secret: env.SUMUP_CLIENT_SECRET_BACKUP, scope: 'payments' })
  const res = await fetch('https://api.sumup.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!res.ok) { const txt = await res.text().catch(()=>''); throw new Error(`Failed to get SumUp token (${res.status}): ${txt}`) }
  const json = await res.json(); const granted = (json.scope||'').split(/\s+/).filter(Boolean); if (!granted.includes('payments')) { throw new Error(`SumUp OAuth token missing required scope "payments" (granted: [${granted.join(', ')}])`) }
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
  const { access_token } = await sumupToken(env)
  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${paymentId}`, { headers: { Authorization: `Bearer ${access_token}` } })
  if (!res.ok) throw new Error('Failed to fetch payment')
  return res.json()
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
  if (debug) console.log('turnstile: siteverify', { status: res?.status, success: j?.success, errors: j?.['error-codes'], hostname: j?.hostname })
  return !!j.success
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EVT_UUID_RE = /^EVT-\d+-[0-9a-f\-]{36}$/i

function clampStr(v, max){ return (v||'').substring(0, max) }

// Membership checkout with idempotency + Turnstile
app.post('/membership/checkout', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP')
    const debugMode = ['1','true','yes'].includes(String(c.req.query('debug') || c.env.DEBUG || '').toLowerCase())
    const idem = c.req.header('Idempotency-Key')?.trim()
    const { email, name, plan, privacyConsent, turnstileToken } = await c.req.json()
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

    // Idempotency reuse
    if (idem){
      const existing = await c.env.DB.prepare(`SELECT * FROM memberships WHERE ${s.fkColumn} = ? AND plan = ? AND status = "pending" AND idempotency_key = ? ORDER BY id DESC LIMIT 1`).bind(ident.id, plan, idem).first()
      if (existing && existing.checkout_id){
        return c.json({ orderRef: existing.order_ref, checkoutId: existing.checkout_id, reused: true })
      }
    }

    const order_ref = crypto.randomUUID()
    await c.env.DB.prepare(`INSERT INTO memberships (${s.fkColumn}, plan, status, order_ref, amount, currency, consent_at, idempotency_key) VALUES (?, ?, "pending", ?, ?, ?, ?, ?)`)
      .bind(ident.id, plan, order_ref, String(amount), currency, toIso(new Date()), idem || null).run()

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
    console.error('membership checkout error', e)
    return c.json({ error: 'internal_error' }, 500)
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
  const identityId = pending[s.fkColumn]
  const activeExisting = await getActiveMembership(c.env.DB, identityId)
  const svc = await getServiceForPlan(c.env.DB, pending.plan)
  if (!svc) return c.json({ ok:false, error:'plan_not_configured' },400)
  const months = Number(svc.months || 0)
  const baseStart = activeExisting ? new Date(activeExisting.end_date) : new Date()
  const end = addMonths(baseStart, months)
  await c.env.DB.prepare('UPDATE memberships SET status = "active", start_date = ?, end_date = ?, payment_id = ?, payment_status = "PAID" WHERE id = ?')
    .bind(toIso(baseStart), toIso(end), pending.checkout_id, pending.id).run()
  return c.json({ ok:true, status:'active', endDate: toIso(end) })
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
  const identityId = pending[s.fkColumn]
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
  const ev = await c.env.DB.prepare('SELECT event_id,event_name,description,event_datetime,location,membership_price,non_membership_price,capacity,tickets_sold,category,image_url FROM events WHERE event_id = ?').bind(id).first()
  if (!ev) return c.json({ error:'not_found' },404)
  return c.json({ event: ev })
})

// Create ticket checkout with idempotency + Turnstile
app.post('/events/:id/checkout', async c => {
  try {
    const id = c.req.param('id')
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

    const ev = await c.env.DB.prepare('SELECT * FROM events WHERE event_id = ?').bind(id).first()
    if (!ev) return c.json({ error:'event_not_found' },404)
    if (ev.capacity && ev.tickets_sold >= ev.capacity) return c.json({ error:'sold_out' },409)

    const ident = await getOrCreateIdentity(c.env.DB, email, clampStr(name,200))
    const isActive = !!(await getActiveMembership(c.env.DB, ident.id))
    const amount = Number(isActive ? ev.membership_price : ev.non_membership_price)
    if (!Number.isFinite(amount) || amount <= 0) return c.json({ error:'invalid_amount' },400)
    const currency = c.env.CURRENCY || 'GBP'
    const s = await getSchema(c.env.DB)

    // Ensure columns/table exist
    await ensureSchema(c.env.DB, s.fkColumn)

    if (idem){
      const existing = await c.env.DB.prepare(`SELECT * FROM tickets WHERE event_id = ? AND ${s.fkColumn} = ? AND status = "pending" AND idempotency_key = ? ORDER BY id DESC LIMIT 1`).bind(id, ident.id, idem).first()
      if (existing && existing.checkout_id){
        return c.json({ orderRef: existing.order_ref, checkoutId: existing.checkout_id, reused: true })
      }
    }

    const order_ref = `EVT-${id}-${crypto.randomUUID()}`
    await c.env.DB.prepare(`INSERT INTO tickets (event_id,${s.fkColumn},status,order_ref,amount,currency,consent_at,idempotency_key,created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .bind(id, ident.id, 'pending', order_ref, String(amount), currency, toIso(new Date()), idem || null, toIso(new Date())).run()

    let checkout
    try {
      checkout = await createCheckout(c.env, { amount, currency, orderRef: order_ref, title: ev.event_name, description: `Ticket for ${ev.event_name}` })
    } catch (e) {
      console.error('SumUp checkout failed for event', id, e)
      return c.json({ error:'sumup_checkout_failed', message:String(e?.message||e) },502)
    }
    if (!checkout.id) {
      console.error('event checkout missing id', checkout)
      return c.json({ error: 'sumup_missing_id' }, 502)
    }
    await c.env.DB.prepare('UPDATE tickets SET checkout_id = ? WHERE order_ref = ?').bind(checkout.id, order_ref).run()
    return c.json({ orderRef: order_ref, checkoutId: checkout.id })
  } catch (e) {
    console.error('events checkout error', e)
    return c.json({ error:'internal_error' },500)
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

export default app
