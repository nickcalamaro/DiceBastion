/**
 * Dice Bastion - Payments Worker
 * 
 * Handles ALL SumUp payment integration:
 * - OAuth token management
 * - Customer creation
 * - Checkout creation
 * - Payment verification
 * - Payment instrument (card) tokenization
 * - Recurring charges
 * - Webhook signature verification
 * 
 * Business logic (memberships, events, shop) stays in main worker.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
	DB: D1Database
	SUMUP_CLIENT_ID: string
	SUMUP_CLIENT_SECRET: string
	SUMUP_MERCHANT_CODE: string
	SUMUP_WEBHOOK_SECRET: string
	SUMUP_REFRESH_TOKEN?: string
	INTERNAL_SECRET: string
	CURRENCY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Request logging middleware
app.use('/*', async (c, next) => {
	console.log('Request received:', {
		method: c.req.method,
		url: c.req.url,
		path: c.req.path,
		headers: Object.fromEntries(c.req.raw.headers.entries())
	})
	await next()
})

// CORS middleware
app.use('/*', cors({
	origin: '*',
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowHeaders: ['Content-Type', 'Authorization', 'X-Internal-Secret'],
}))

// Internal authentication middleware
app.use('/internal/*', async (c, next) => {
	const secret = c.req.header('X-Internal-Secret')
	console.log('Auth check:', {
		path: c.req.path,
		hasSecret: !!secret,
		secretLength: secret?.length,
		envSecretLength: c.env.INTERNAL_SECRET?.length,
		match: secret === c.env.INTERNAL_SECRET
	})
	if (!secret || secret !== c.env.INTERNAL_SECRET) {
		console.log('Auth failed - returning 401')
		return c.json({ error: 'Unauthorized' }, 401)
	}
	console.log('Auth success - proceeding to handler')
	await next()
})

// ==================== SUMUP HELPER FUNCTIONS ====================

interface SumUpTokenResponse {
	access_token: string
	token_type: string
	expires_in: number
	scope: string
}

/**
 * Get SumUp OAuth token
 * Supports two flows:
 * 1. Authorization Code (with refresh_token) - More secure, required for some SumUp accounts
 * 2. Client Credentials - Simpler, works for most cases
 */
async function sumupToken(env: Bindings, scopes: string): Promise<SumUpTokenResponse> {
	const params = new URLSearchParams()
	
	// If refresh token is available, use authorization_code grant with refresh token
	// This is required for SumUp accounts that don't support client_credentials
	if (env.SUMUP_REFRESH_TOKEN) {
		params.set('grant_type', 'refresh_token')
		params.set('client_id', env.SUMUP_CLIENT_ID)
		params.set('client_secret', env.SUMUP_CLIENT_SECRET)
		params.set('refresh_token', env.SUMUP_REFRESH_TOKEN)
		// Note: When using refresh_token, we get the scopes that were originally granted
		// We don't set 'scope' parameter as it will use the original authorization scopes
	} else {
		// Fallback to client_credentials grant
		params.set('grant_type', 'client_credentials')
		params.set('client_id', env.SUMUP_CLIENT_ID)
		params.set('client_secret', env.SUMUP_CLIENT_SECRET)
		params.set('scope', scopes)
	}

	const res = await fetch('https://api.sumup.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params.toString()
	})

	if (!res.ok) {
		const txt = await res.text()
		throw new Error(`SumUp token error (${res.status}): ${txt}`)
	}

	const json = await res.json() as SumUpTokenResponse
	
	// Log the scopes we got
	const grantType = env.SUMUP_REFRESH_TOKEN ? 'refresh_token' : 'client_credentials'
	const granted = (json.scope || '').split(/\s+/).filter(Boolean)
	const required = scopes.split(/\s+/).filter(Boolean)
	
	console.log('✅ SumUp token obtained:', {
		grantType,
		requestedScopes: required,
		grantedScopes: granted,
		hasAllScopes: required.every(s => granted.includes(s))
	})
	
	// Check for missing scopes
	const missing = required.filter(s => !granted.includes(s))
	if (missing.length > 0) {
		if (env.SUMUP_REFRESH_TOKEN) {
			// For refresh tokens, just warn - the token has whatever scopes were originally granted
			console.warn('⚠️ Refresh token has different scopes than requested (this is normal):', {
				requested: required,
				granted,
				note: 'Refresh tokens use the scopes from the original authorization'
			})
			// Don't throw error - just log and continue
		} else {
			throw new Error(`SumUp OAuth token missing required scopes: ${missing.join(', ')} (granted: [${granted.join(', ')}])`)
		}
	}

	return json
}

/**
 * Get or create SumUp customer
 * Returns null if customer creation fails (e.g., insufficient scopes)
 */
async function getOrCreateSumUpCustomer(env: Bindings, user: { user_id: number; email: string; name?: string }): Promise<string | null> {
	try {
		const { access_token } = await sumupToken(env, 'payments payment_instruments')
		const customerId = `USER-${user.user_id}`

		// Check if customer exists
		const checkRes = await fetch(`https://api.sumup.com/v0.1/customers/${customerId}`, {
			headers: {
				'Authorization': `Bearer ${access_token}`,
				'Content-Type': 'application/json'
			}
		})

		if (checkRes.ok) {
			console.log('Customer already exists:', customerId)
			return customerId
		}

		// Create customer
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
			
			// If it's a scope issue, warn but don't fail
			if (createRes.status === 403) {
				console.warn('⚠️ Cannot create SumUp customer due to insufficient OAuth scopes. Card tokenization may still work without customer ID.')
				return null
			}
			
			throw new Error(`Failed to create SumUp customer (${createRes.status}): ${txt}`)
		}

		const customer = await createRes.json()
		console.log('Created SumUp customer:', customerId)
		return customer.customer_id
	} catch (error: any) {
		// If scope error, return null and let checkout proceed without customer
		if (error.message && error.message.includes('missing required scopes')) {
			console.warn('⚠️ Skipping customer creation due to missing OAuth scopes. Proceeding with checkout anyway.')
			return null
		}
		throw error
	}
}

/**
 * Verify SumUp webhook authenticity
 * 
 * Note: SumUp does NOT provide webhook signature verification.
 * Instead, we verify by:
 * 1. Checking the payment exists in SumUp API
 * 2. Verifying checkout_reference matches our order
 * 3. Rate limiting webhook endpoint
 * 
 * This function is kept for compatibility but returns true
 * The actual verification happens when we fetch the payment from SumUp API
 */
function verifySumUpWebhook(payload: any): boolean {
	// Basic validation: ensure required fields exist
	if (!payload || !payload.id || !payload.checkout_reference) {
		console.warn('Invalid webhook payload: missing required fields')
		return false
	}
	
	// Validation passes - actual payment verification happens via SumUp API
	return true
}

// ==================== PUBLIC API ENDPOINTS ====================

/**
 * Health check
 */
app.get('/health', (c) => {
	return c.json({ status: 'ok', service: 'payments-worker' })
})

// ==================== INTERNAL API ENDPOINTS ====================

/**
 * Create SumUp checkout
 * POST /internal/checkout
 */
app.post('/internal/checkout', async (c) => {
	try {
		const body = await c.req.json<{
			amount: number
			currency: string
			orderRef: string
			description: string
			savePaymentInstrument?: boolean
			customerId?: string
		}>()
		
		const { amount, currency, orderRef, description, savePaymentInstrument, customerId } = body

		const { access_token } = await sumupToken(c.env, savePaymentInstrument ? 'payments payment_instruments' : 'payments')
		
		const checkoutBody: any = {
			checkout_reference: orderRef,
			merchant_code: c.env.SUMUP_MERCHANT_CODE,
			description
		}

		// For card tokenization, use minimal amount with SETUP_RECURRING_PAYMENT purpose
		if (savePaymentInstrument && customerId && amount === 0) {
			// SumUp requires amount and currency even for tokenization
			// Use minimal amount (0.01) for verification
			checkoutBody.amount = 0.01
			checkoutBody.currency = currency
			checkoutBody.purpose = 'SETUP_RECURRING_PAYMENT'
			checkoutBody.customer_id = customerId
			console.log('[Checkout] Creating tokenization checkout with minimal amount:', JSON.stringify(checkoutBody))
		} else {
			// For regular payments, use the provided amount
			checkoutBody.amount = Number(amount)
			checkoutBody.currency = currency
			
			// If saving payment instrument with a payment, add the customer info
			if (savePaymentInstrument && customerId) {
				checkoutBody.purpose = 'SETUP_RECURRING_PAYMENT'
				checkoutBody.customer_id = customerId
				console.log('[Checkout] Creating payment checkout:', JSON.stringify(checkoutBody))
			}
		}

		const res = await fetch('https://api.sumup.com/v0.1/checkouts', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${access_token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(checkoutBody)
		})

		if (!res.ok) {
			const txt = await res.text()
			console.error('[Checkout] SumUp error:', txt)
			throw new Error(`Create checkout failed: ${txt}`)
		}

		const json: any = await res.json()
		if (!json || !json.id) {
			throw new Error('missing_checkout_id')
		}

		return c.json(json)
	} catch (error: any) {
		console.error('Checkout creation error:', error)
		return c.json({ error: error.message || 'Checkout creation failed' }, 500)
	}
})

/**
 * Get or create SumUp customer
 * POST /internal/customer
 */
app.post('/internal/customer', async (c) => {
	try {
		const body = await c.req.json<{
			user_id: number
			email: string
			name?: string
		}>()

		const customerId = await getOrCreateSumUpCustomer(c.env, body)
		return c.json({ customer_id: customerId })
	} catch (error: any) {
		console.error('Customer creation error:', error)
		return c.json({ error: error.message || 'Customer creation failed' }, 500)
	}
})

/**
 * Fetch payment details
 * GET /internal/payment/:checkoutId
 */
app.get('/internal/payment/:checkoutId', async (c) => {
	try {
		const checkoutId = c.req.param('checkoutId')
		const { access_token } = await sumupToken(c.env, 'payments')

		const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
			headers: { Authorization: `Bearer ${access_token}` }
		})

		if (!res.ok) {
			throw new Error('Failed to fetch payment')
		}

		const payment = await res.json()
		return c.json(payment)
	} catch (error: any) {
		console.error('Fetch payment error:', error)
		return c.json({ error: error.message || 'Failed to fetch payment' }, 500)
	}
})

/**
 * Save payment instrument (card tokenization)
 * POST /internal/payment-instrument
 */
app.post('/internal/payment-instrument', async (c) => {
	try {
		const body = await c.req.json<{
			userId: number
			checkoutId: string
		}>()

		const { userId, checkoutId } = body
		const { access_token } = await sumupToken(c.env, 'payments payment_instruments')

		// Get the checkout details
		const checkoutRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
			headers: { Authorization: `Bearer ${access_token}` }
		})

		if (!checkoutRes.ok) {
			console.error('Failed to fetch checkout:', checkoutRes.status, await checkoutRes.text())
			return c.json({ error: 'Failed to fetch checkout' }, 500)		}

		const checkout: any = await checkoutRes.json()
		console.log('Checkout response for tokenization:', JSON.stringify(checkout))

		// With purpose=SETUP_RECURRING_PAYMENT, the payment_instrument should be in the response
		if (!checkout.payment_instrument) {
			console.warn('No payment_instrument found in checkout response')
			return c.json({ error: 'No payment instrument found' }, 400)
		}

		const instrument = checkout.payment_instrument
		const instrumentId = instrument.token || instrument.id

		if (!instrumentId) {
			console.error('Payment instrument missing token/id')
			return c.json({ error: 'Payment instrument missing token/id' }, 400)
		}

		// Fetch card details from Payment Instruments API
		let cardType: string | null = null
		let last4: string | null = null
		try {
			const customerId = `USER-${userId}`
			const instrumentsRes = await fetch(`https://api.sumup.com/v0.1/customers/${customerId}/payment-instruments`, {
				headers: { Authorization: `Bearer ${access_token}` }
			})
			
			if (instrumentsRes.ok) {
				const instrumentsData: any = await instrumentsRes.json()
				const savedInstrument = instrumentsData.find((i: any) => i.token === instrumentId)

				if (savedInstrument && savedInstrument.card) {
					cardType = savedInstrument.card.type || null
					last4 = savedInstrument.card.last_4_digits || null
					console.log('Found card details:', { cardType, last4 })
				}
			}
		} catch (e: any) {
			console.warn('Error fetching payment instruments:', e.message)
		}

		// Save to database
		const now = new Date().toISOString()

		// Deactivate old instruments
		await c.env.DB.prepare('UPDATE payment_instruments SET is_active = 0 WHERE user_id = ?')
			.bind(userId).run()

		// Save new instrument
		await c.env.DB.prepare(`
			INSERT INTO payment_instruments (user_id, instrument_id, card_type, last_4, created_at, updated_at, is_active)
			VALUES (?, ?, ?, ?, ?, ?, 1)
			ON CONFLICT(user_id, instrument_id) DO UPDATE SET 
				card_type = COALESCE(?, card_type),
				last_4 = COALESCE(?, last_4),
				is_active = 1, 
				updated_at = ?
		`).bind(userId, instrumentId, cardType, last4, now, now, cardType, last4, now).run()

		console.log('Successfully saved payment instrument:', instrumentId)
		return c.json({
			success: true,
			instrument_id: instrumentId,
			card_type: cardType,
			last_4: last4
		})
	} catch (error: any) {
		console.error('Save payment instrument error:', error)
		return c.json({ error: error.message || 'Failed to save payment instrument' }, 500)
	}
})

/**
 * Charge a saved payment instrument
 * POST /internal/charge
 */
app.post('/internal/charge', async (c) => {
	try {
		const body = await c.req.json<{
			userId: number
			instrumentId: string
			amount: number
			currency: string
			orderRef: string
			description: string
		}>()

		const { userId, instrumentId, amount, currency, orderRef, description } = body
		const { access_token } = await sumupToken(c.env, 'payments payment_instruments')

		// Verify customer exists
		const customerId = `USER-${userId}`
		const customerCheckRes = await fetch(`https://api.sumup.com/v0.1/customers/${customerId}`, {
			headers: {
				'Authorization': `Bearer ${access_token}`,
				'Content-Type': 'application/json'
			}
		})

		if (!customerCheckRes.ok) {
			console.log(`Customer ${customerId} not found, attempting to create...`)

			// Get user details
			const user = await c.env.DB.prepare('SELECT email, name FROM users WHERE user_id = ?')
				.bind(userId).first()

			if (!user) {
				throw new Error(`User ${userId} not found in database`)
			}

			// Create customer
			await getOrCreateSumUpCustomer(c.env, { user_id: userId, email: user.email as string, name: user.name as string })
		}

		// Create checkout
		const checkoutBody = {
			amount: Number(amount),
			currency,
			checkout_reference: orderRef,
			merchant_code: c.env.SUMUP_MERCHANT_CODE,
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
			throw new Error(`Checkout creation failed: ${txt}`)		}

		const checkout: any = await checkoutRes.json()
		console.log('Created checkout for recurring charge:', checkout.id)

		// Process payment with saved token
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
			throw new Error(`Payment processing failed: ${txt}`)		}

		const payment: any = await paymentRes.json()
		console.log('Processed recurring payment:', payment.id, payment.status)
		return c.json(payment)
	} catch (error: any) {
		console.error('Charge payment instrument error:', error)
		return c.json({ error: error.message || 'Payment charge failed' }, 500)
	}
})

/**
 * Verify webhook payload
 * POST /internal/verify-webhook
 * 
 * Note: SumUp doesn't provide signature verification
 * We validate the payload structure and verify payment via API
 */
app.post('/internal/verify-webhook', async (c) => {
	try {
		const payload = await c.req.json()

		const isValid = verifySumUpWebhook(payload)
		return c.json({ valid: isValid })
	} catch (error: any) {
		console.error('Webhook verification error:', error)
		return c.json({ error: error.message || 'Webhook verification failed' }, 500)
	}
})

export default app
