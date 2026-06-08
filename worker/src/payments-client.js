/**
 * Payments Worker API Client
 * 
 * This module provides functions to call the payments worker's internal API
 * instead of directly integrating with SumUp.
 */

/**
 * Build an Error that preserves the payments worker's HTTP status and parsed body.
 * Callers use `.status` to tell a genuine gateway decline (402 "Payment not
 * successful") apart from a system/transport error (5xx, network, token/customer/
 * checkout creation failures) where no charge ever reached the card.
 */
function paymentsWorkerError(message, status, body) {
	const err = new Error(message)
	err.status = status
	if (body !== undefined) err.body = body
	err.isPaymentsWorkerError = true
	return err
}

/**
 * Call payments worker internal API
 */
async function callPaymentsWorker(env, endpoint, options = {}) {
	// Use service binding if available (preferred for worker-to-worker calls)
	if (env.PAYMENTS) {
		console.log('Using service binding for payments worker:', {
			endpoint,
			method: options.method || 'GET'
		})
		
		const request = new Request(`https://payments${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				'X-Internal-Secret': env.INTERNAL_SECRET,
				...options.headers
			}
		})
		
		const response = await env.PAYMENTS.fetch(request)
		
		if (!response.ok) {
			const errorText = await response.text()
			let errorMessage = `Payments worker error: ${response.status}`
			let errorBody
			try {
				errorBody = JSON.parse(errorText)
				errorMessage = errorBody.error || errorMessage
			} catch (e) {
				if (errorText) errorMessage += ` - ${errorText}`
			}
			console.error('Payments worker request failed (service binding):', {
				endpoint,
				status: response.status,
				statusText: response.statusText,
				error: errorMessage
			})
			throw paymentsWorkerError(errorMessage, response.status, errorBody)
		}
		
		return response.json()
	}
	
	// Fallback to HTTP if service binding not available
	const url = `${env.PAYMENTS_WORKER_URL}${endpoint}`
	const headers = {
		'Content-Type': 'application/json',
		'X-Internal-Secret': env.INTERNAL_SECRET,
		...options.headers
	}

	console.log('Calling payments worker via HTTP:', {
		url,
		method: options.method || 'GET',
		hasSecret: !!env.INTERNAL_SECRET,
		secretLength: env.INTERNAL_SECRET?.length
	})

	const response = await fetch(url, {
		...options,
		headers
	})
	if (!response.ok) {
		const errorText = await response.text()
		let errorMessage = `Payments worker error: ${response.status}`
		let errorBody
		try {
			errorBody = JSON.parse(errorText)
			errorMessage = errorBody.error || errorMessage
		} catch (e) {
			// Not JSON, use raw text
			if (errorText) errorMessage += ` - ${errorText}`
		}
		console.error('Payments worker request failed:', {
			url,
			status: response.status,
			statusText: response.statusText,
			error: errorMessage,
			hasSecret: !!env.INTERNAL_SECRET,
			hasWorkerUrl: !!env.PAYMENTS_WORKER_URL
		})
		throw paymentsWorkerError(errorMessage, response.status, errorBody)
	}

	return response.json()
}

/**
 * Create SumUp checkout via payments worker
 */
export async function createCheckout(env, { amount, currency, orderRef, title, description, savePaymentInstrument = false, customerId = null, isFreeTrialSetup = false, redirectUrl = null }) {
	return callPaymentsWorker(env, '/internal/checkout', {
		method: 'POST',
		body: JSON.stringify({
			amount,
			currency,
			orderRef,
			description: description || title,
			savePaymentInstrument,
			customerId,
			isFreeTrialSetup,
			redirectUrl
		})
	})
}

/**
 * Get or create SumUp customer via payments worker
 */
export async function getOrCreateSumUpCustomer(env, user) {
	const result = await callPaymentsWorker(env, '/internal/customer', {
		method: 'POST',
		body: JSON.stringify({
			user_id: user.user_id || user.id,
			email: user.email,
			name: user.name
		})
	})
	return result.customer_id
}

/**
 * Fetch payment details via payments worker
 */
export async function fetchPayment(env, checkoutId) {
	return callPaymentsWorker(env, `/internal/payment/${checkoutId}`, {
		method: 'GET'
	})
}

/**
 * Save payment instrument via payments worker
 */
export async function savePaymentInstrument(db, userId, checkoutId, env) {
	const result = await callPaymentsWorker(env, '/internal/payment-instrument', {
		method: 'POST',
		body: JSON.stringify({
			userId,
			checkoutId
		})
	})
	return result.instrument_id
}

/**
 * Charge a saved payment instrument via payments worker
 */
export async function chargePaymentInstrument(env, userId, instrumentId, amount, currency, orderRef, description) {
	return callPaymentsWorker(env, '/internal/charge', {
		method: 'POST',
		body: JSON.stringify({
			userId,
			instrumentId,
			amount,
			currency,
			orderRef,
			description
		})
	})
}

/**
 * Verify webhook payload via payments worker
 */
export async function verifyWebhook(env, payload) {
	const result = await callPaymentsWorker(env, '/internal/verify-webhook', {
		method: 'POST',
		body: JSON.stringify(payload)
	})
	return result.valid
}
