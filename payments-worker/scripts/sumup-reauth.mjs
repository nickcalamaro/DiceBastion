#!/usr/bin/env node
/**
 * SumUp OAuth re-authorization helper.
 *
 * Mints a fresh SUMUP_REFRESH_TOKEN with the scopes this worker needs, including
 * `transactions.history` (so transaction-level decline reasons can be read via
 * GET /v0.1/me/transactions and the auth-gated /internal/transaction endpoint).
 *
 * IMPORTANT: the token MUST be minted from the OAuth client that has the restricted
 * `payments` and `payment_instruments` scopes approved (i.e. DiceBastionClient),
 * because the worker needs all three scopes in ONE token. A different client that
 * lacks those restricted scopes will break checkouts/charges.
 *
 * Two modes, chosen automatically from the redirect URI:
 *   - localhost redirect  -> the script captures the code automatically.
 *   - any other redirect  -> the script prints the auth URL; you approve in the
 *                            browser, then paste back the redirected URL (or just
 *                            the ?code= value) and it finishes the exchange.
 *
 * Usage (PowerShell):
 *   # Option A (auto-capture): temporarily set the client's redirect URI to
 *   #   http://localhost:8976/callback
 *   $env:SUMUP_CLIENT_ID="..."; $env:SUMUP_CLIENT_SECRET="..."; node scripts/sumup-reauth.mjs
 *
 *   # Option B (manual paste): keep the client's redirect URI as your real site
 *   $env:SUMUP_CLIENT_ID="..."; $env:SUMUP_CLIENT_SECRET="..."; `
 *     $env:SUMUP_REDIRECT_URI="http://dicebastion.com/"; node scripts/sumup-reauth.mjs
 *
 * After it prints the refresh token:
 *   npx wrangler secret put SUMUP_REFRESH_TOKEN   # paste the token
 *   npx wrangler deploy
 */

import http from 'node:http'
import crypto from 'node:crypto'
import readline from 'node:readline'

const AUTHORIZE_URL = 'https://api.sumup.com/authorize'
const TOKEN_URL = 'https://api.sumup.com/token'
const SCOPES = ['payments', 'payment_instruments', 'transactions.history']
const DEFAULT_LOCAL_PORT = 8976

function arg(name) {
	const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
	return hit ? hit.split('=').slice(1).join('=') : undefined
}

const CLIENT_ID = arg('client-id') || process.env.SUMUP_CLIENT_ID
const CLIENT_SECRET = arg('client-secret') || process.env.SUMUP_CLIENT_SECRET
const REDIRECT_URI =
	arg('redirect-uri') || process.env.SUMUP_REDIRECT_URI || `http://localhost:${DEFAULT_LOCAL_PORT}/callback`

if (!CLIENT_ID || !CLIENT_SECRET) {
	console.error('\nMissing credentials. Provide SUMUP_CLIENT_ID and SUMUP_CLIENT_SECRET')
	console.error('(use the DiceBastionClient credentials — the client with payments + payment_instruments approved).\n')
	process.exit(1)
}

const state = crypto.randomBytes(16).toString('hex')
const authUrl =
	`${AUTHORIZE_URL}?` +
	new URLSearchParams({
		response_type: 'code',
		client_id: CLIENT_ID,
		redirect_uri: REDIRECT_URI,
		scope: SCOPES.join(' '),
		state
	}).toString()

async function exchangeCode(code) {
	const res = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
			code,
			redirect_uri: REDIRECT_URI
		}).toString()
	})
	const txt = await res.text()
	if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${txt}`)
	return JSON.parse(txt)
}

function printSuccess(json) {
	console.log('\n================  SUCCESS  ================')
	console.log('Granted scopes :', json.scope)
	console.log('Refresh token  :', json.refresh_token)
	console.log('==========================================\n')
	if (!String(json.scope || '').includes('transactions.history')) {
		console.warn('⚠️  WARNING: transactions.history is NOT in the granted scopes.')
		console.warn('   Enable it on this OAuth client in the SumUp dashboard, then re-run.\n')
	}
	console.log('Next steps:')
	console.log('  1) npx wrangler secret put SUMUP_REFRESH_TOKEN   (paste the token above)')
	console.log('  2) npx wrangler deploy\n')
}

const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(REDIRECT_URI)

console.log('\nRedirect URI:', REDIRECT_URI)
console.log('Requested scopes:', SCOPES.join(' '))
console.log('\nOpen this URL in your browser and approve access:\n')
console.log(authUrl)

if (isLocal) {
	const port = Number(new URL(REDIRECT_URI).port) || DEFAULT_LOCAL_PORT
	console.log(`\n(Auto-capture mode) Waiting for the redirect to ${REDIRECT_URI} ...\n`)

	const server = http.createServer(async (req, res) => {
		const url = new URL(req.url, `http://localhost:${port}`)
		if (url.pathname !== new URL(REDIRECT_URI).pathname) {
			res.writeHead(404)
			res.end('Not found')
			return
		}
		const code = url.searchParams.get('code')
		const returnedState = url.searchParams.get('state')
		const error = url.searchParams.get('error')

		if (error || returnedState !== state || !code) {
			res.writeHead(400, { 'Content-Type': 'text/plain' })
			res.end('Authorization failed or state mismatch — see terminal.')
			console.error('\nFailed:', error || (returnedState !== state ? 'state mismatch' : 'no code'))
			server.close()
			process.exit(1)
		}
		try {
			const json = await exchangeCode(code)
			res.writeHead(200, { 'Content-Type': 'text/html' })
			res.end('<h2>Success.</h2><p>Return to the terminal; you can close this tab.</p>')
			printSuccess(json)
			server.close()
			process.exit(0)
		} catch (e) {
			res.writeHead(500, { 'Content-Type': 'text/plain' })
			res.end(String(e?.message || e))
			console.error('\nToken exchange error:', e?.message || e)
			server.close()
			process.exit(1)
		}
	})
	server.listen(port)
} else {
	console.log('\n(Manual mode) After approving, your browser is redirected to your site with')
	console.log('?code=...&state=... in the address bar. Paste that FULL redirected URL')
	console.log('(or just the code) below.\n')

	const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
	rl.question('Pasted URL or code: ', async (answer) => {
		rl.close()
		let code = answer.trim()
		let returnedState = null
		try {
			const u = new URL(answer.trim())
			code = u.searchParams.get('code') || code
			returnedState = u.searchParams.get('state')
		} catch {
			/* not a URL — treat input as the raw code */
		}
		if (returnedState && returnedState !== state) {
			console.error('\nState mismatch — aborting (re-run and use the latest URL).')
			process.exit(1)
		}
		if (!code) {
			console.error('\nNo authorization code found in input.')
			process.exit(1)
		}
		try {
			const json = await exchangeCode(code)
			printSuccess(json)
			process.exit(0)
		} catch (e) {
			console.error('\nToken exchange error:', e?.message || e)
			process.exit(1)
		}
	})
}
