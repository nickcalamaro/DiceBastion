import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()
app.use('*', cors({ origin: '*' }))

// Helpers
const addMonths = (date, months) => {
  const d = new Date(date)
  const day = d.getUTCDate()
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months + 1, 0)) // end of target month
  const clampedDay = Math.min(day, target.getUTCDate())
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, clampedDay, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()))
}

const toIso = (d) => new Date(d).toISOString()

async function getOrCreateMember(db, email, name) {
  const found = await db.prepare('SELECT * FROM members WHERE email = ?').bind(email).first()
  if (found) return found
  await db.prepare('INSERT INTO members (email, name) VALUES (?, ?)').bind(email, name || null).run()
  return await db.prepare('SELECT * FROM members WHERE email = ?').bind(email).first()
}

async function getActiveMembership(db, memberId) {
  const now = new Date().toISOString()
  return await db.prepare('SELECT * FROM memberships WHERE member_id = ? AND status = "active" AND end_date >= ? ORDER BY end_date DESC LIMIT 1').bind(memberId, now).first()
}

// Fetch pricing/details for a plan from the services table
async function getServiceForPlan(db, planCode) {
  return await db
    .prepare('SELECT * FROM services WHERE code = ? AND active = 1 LIMIT 1')
    .bind(planCode)
    .first()
}

// Obtain SumUp OAuth token to verify payments server-side
async function sumupToken(env) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    // client_id: env.SUMUP_CLIENT_ID,
    // client_secret: env.SUMUP_CLIENT_SECRET,
    client_id: env.SUMUP_CLIENT_ID_BACKUP,
    client_secret: env.SUMUP_CLIENT_SECRET_BACKUP,
    scope: 'payments'
  })
  const res = await fetch('https://api.sumup.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Failed to get SumUp token (${res.status}): ${txt}`)
  }
  const json = await res.json()
  const granted = (json.scope || '').split(/\s+/).filter(Boolean)
  if (!granted.includes('payments')) {
    throw new Error(`SumUp OAuth token missing required scope "payments" (granted: [${granted.join(', ')}]). Ensure your OAuth app is enabled for Merchant API and the 'payments' scope, then update SUMUP_CLIENT_ID/SECRET.`)
  }
  return json
}

async function createCheckout(env, { amount, currency, orderRef, title, description }) {
  const { access_token } = await sumupToken(env)
  const returnUrl = new URL(env.RETURN_URL)
  returnUrl.searchParams.set('orderRef', orderRef)
  const body = {
    amount: Number(amount),
    currency,
    checkout_reference: orderRef,
    merchant_code: env.SUMUP_MERCHANT_CODE,
    description: description || title,
    return_url: returnUrl.toString(),
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
    throw new Error(`Create checkout failed: ${txt}`)
  }
  return res.json()
}

async function fetchPayment(env, paymentId) {
  const { access_token } = await sumupToken(env)
  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${paymentId}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch payment')
  return res.json()
}

// Create checkout and pending membership
app.post('/membership/checkout', async (c) => {
  try {
    const { email, name, plan } = await c.req.json()
    if (!email || !plan) return c.json({ error: 'email and plan required' }, 400)
    // Removed hardcoded plan whitelist; rely on services table
    if (!c.env.SUMUP_MERCHANT_CODE) return c.json({ error: 'missing_merchant_code' }, 500)

    const member = await getOrCreateMember(c.env.DB, email, name)
    const svc = await getServiceForPlan(c.env.DB, plan)
    if (!svc) return c.json({ error: 'plan_not_configured', plan }, 400)

    const order_ref = crypto.randomUUID()
    await c.env.DB.prepare(
      'INSERT INTO memberships (member_id, plan, status, order_ref) VALUES (?, ?, "pending", ?)'
    ).bind(member.id, plan, order_ref).run()

    let checkout
    try {
      checkout = await createCheckout(c.env, {
        amount: svc.amount,
        currency: svc.currency || c.env.CURRENCY || 'GBP',
        orderRef: order_ref,
        title: svc.name || `Dice Bastion ${plan}`,
        description: svc.description || `Purchase: ${svc.name || plan}`
      })
    } catch (err) {
      console.error('SumUp createCheckout failed:', err?.message || err)
      return c.json({ error: 'sumup_checkout_failed', message: String(err?.message || err) }, 502)
    }

    await c.env.DB.prepare('UPDATE memberships SET checkout_id = ? WHERE order_ref = ?')
      .bind(checkout.id, order_ref)
      .run()

    let checkoutUrl = checkout.checkout_url
    if (!checkoutUrl) {
      try {
        const fresh = await fetchPayment(c.env, checkout.id)
        checkoutUrl = fresh.checkout_url || fresh.redirect_url || null
      } catch (e) {}
    }
    if (!checkoutUrl) checkoutUrl = `https://checkout.sumup.com/${checkout.id}`

    return c.json({ orderRef: order_ref, checkoutId: checkout.id, checkoutUrl })
  } catch (e) {
    console.error('checkout endpoint error:', e)
    return c.json({ error: 'internal_error' }, 500)
  }
})

app.get('/membership/status', async (c) => {
  const email = c.req.query('email')
  if (!email) return c.json({ error: 'email required' }, 400)
  const member = await c.env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(email).first()
  if (!member) return c.json({ active: false })
  const active = await getActiveMembership(c.env.DB, member.id)
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
  if (!orderRef) return c.json({ ok: false, error: 'missing_orderRef' }, 400)
  const pending = await c.env.DB.prepare('SELECT * FROM memberships WHERE order_ref = ?').bind(orderRef).first()
  if (!pending) return c.json({ ok: false, error: 'order_not_found' }, 404)
  if (pending.status === 'active') return c.json({ ok: true, status: 'already_active', endDate: pending.end_date })

  let payment
  try {
    payment = await fetchPayment(c.env, pending.checkout_id)
  } catch (e) {
    return c.json({ ok: false, error: 'verify_failed' }, 400)
  }

  if (!payment || (payment.status !== 'PAID' && payment.status !== 'SUCCESSFUL')) {
    return c.json({ ok: false, status: payment?.status || 'PENDING' })
  }

  const now = new Date()
  const memberActive = await getActiveMembership(c.env.DB, pending.member_id)
  const baseStart = memberActive ? new Date(memberActive.end_date) : now
  const svc = await getServiceForPlan(c.env.DB, pending.plan)
  if (!svc) return c.json({ ok: false, error: 'plan_not_configured' }, 400)
  const months = Number(svc.months || 0)
  const start = baseStart
  const end = addMonths(baseStart, months)

  await c.env.DB.prepare(
    'UPDATE memberships SET status = "active", start_date = ?, end_date = ?, payment_id = ? WHERE id = ?'
  ).bind(toIso(start), toIso(end), pending.checkout_id, pending.id).run()

  return c.json({ ok: true, status: 'active', endDate: toIso(end) })
})

app.post('/webhooks/sumup', async (c) => {
  const payload = await c.req.json()
  const { id: paymentId, status, amount, currency, checkout_reference: orderRef } = payload
  if (!paymentId || !orderRef) return c.json({ ok: false }, 400)

  // Verify with SumUp to avoid spoofing
  let payment
  try {
    payment = await fetchPayment(c.env, paymentId)
  } catch (e) {
    return c.json({ ok: false, error: 'verify_failed' }, 400)
  }

  if (!payment || payment.status !== 'PAID') return c.json({ ok: true }) // ignore non-paid

  const pending = await c.env.DB.prepare('SELECT * FROM memberships WHERE order_ref = ?').bind(orderRef).first()
  if (!pending) return c.json({ ok: false, error: 'order_not_found' }, 404)

  // Optional currency validation: prefer service currency
  const svc = await getServiceForPlan(c.env.DB, pending.plan)
  if (!svc) return c.json({ ok: false, error: 'plan_not_configured' }, 400)
  if (currency && svc.currency && currency !== svc.currency) return c.json({ ok: false, error: 'currency_mismatch' }, 400)

  const now = new Date()
  const memberActive = await getActiveMembership(c.env.DB, pending.member_id)
  const baseStart = memberActive ? new Date(memberActive.end_date) : now
  const months = Number(svc.months || 0)
  const start = baseStart
  const end = addMonths(baseStart, months)

  await c.env.DB.prepare(
    'UPDATE memberships SET status = "active", start_date = ?, end_date = ?, payment_id = ? WHERE id = ?'
  ).bind(toIso(start), toIso(end), paymentId, pending.id).run()

  return c.json({ ok: true })
})

export default app
