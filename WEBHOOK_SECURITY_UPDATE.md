# Payments Worker - Webhook Security Update

## Issue Identified

**SumUp does NOT provide webhook signature verification** ❌

The original implementation included `SUMUP_WEBHOOK_SECRET` for HMAC SHA256 signature verification, but this is not a feature SumUp provides.

## Changes Made

### 1. Removed Webhook Secret
- ✅ Removed `SUMUP_WEBHOOK_SECRET` from environment bindings
- ✅ Removed `verifySumUpWebhookSignature()` function (HMAC verification)
- ✅ Added `verifySumUpWebhook()` function (basic payload validation)
- ✅ Removed `createHmac` import from `node:crypto`

### 2. Alternative Security Approach

Since SumUp doesn't provide signature verification, we use **payment verification via API**:

```typescript
/**
 * Webhook Security Strategy:
 * 
 * 1. Basic Validation: Check required fields exist (id, checkout_reference)
 * 2. Payment Verification: Fetch payment from SumUp API to verify it's real
 * 3. Reference Matching: Verify checkout_reference matches our order
 * 4. Rate Limiting: Limit webhook endpoint requests
 * 5. Idempotency: Track processed webhooks to prevent duplicates
 */
```

**How it works:**
1. Webhook arrives → Basic validation (has `id` and `checkout_reference`?)
2. Main worker fetches payment from SumUp API: `GET /v0.1/checkouts/{id}`
3. Verify the payment actually exists in SumUp (not spoofed)
4. Verify `checkout_reference` matches our order
5. Check if webhook already processed (idempotency)
6. Process payment if all checks pass

This is **more secure** than trusting a webhook signature alone, because we're verifying the payment directly with SumUp.

### 3. Updated Environment Variables

**Before:**
```env
SUMUP_CLIENT_ID=...
SUMUP_CLIENT_SECRET=...
SUMUP_MERCHANT_CODE=...
SUMUP_WEBHOOK_SECRET=...  ← REMOVED
SUMUP_REFRESH_TOKEN=...   ← Added
INTERNAL_SECRET=...
```

**After:**
```env
SUMUP_CLIENT_ID=...
SUMUP_CLIENT_SECRET=...
SUMUP_MERCHANT_CODE=...
SUMUP_REFRESH_TOKEN=...   ← NEW (optional)
INTERNAL_SECRET=...
```

### 4. OAuth Flow Improvement

Added support for **refresh_token** grant type:

```typescript
// If refresh token is available, use it (more secure)
if (env.SUMUP_REFRESH_TOKEN) {
  params.set('grant_type', 'refresh_token')
  params.set('refresh_token', env.SUMUP_REFRESH_TOKEN)
} else {
  // Fallback to client_credentials
  params.set('grant_type', 'client_credentials')
}
```

**Why this matters:**
- Some SumUp accounts require OAuth authorization_code flow
- Refresh tokens are more secure than client_credentials
- They don't expire as quickly
- They're required for certain SumUp account types

## Deployment Impact

### Secrets to Set

**Required:**
```powershell
wrangler secret put SUMUP_CLIENT_ID
wrangler secret put SUMUP_CLIENT_SECRET
wrangler secret put SUMUP_MERCHANT_CODE
wrangler secret put INTERNAL_SECRET
```

**Optional** (only if your SumUp account needs it):
```powershell
wrangler secret put SUMUP_REFRESH_TOKEN
```

**❌ DO NOT SET** (removed):
```powershell
# wrangler secret put SUMUP_WEBHOOK_SECRET  ← Not needed!
```

### Migration from Old Worker

If you already have `SUMUP_WEBHOOK_SECRET` set:
1. It will be ignored (not in Bindings type)
2. You can delete it: `wrangler secret delete SUMUP_WEBHOOK_SECRET`
3. Or leave it (harmless, just unused)

## Security Comparison

### ❌ Old Approach (Webhook Signature)
```
Webhook → Verify HMAC signature → Process
          ↑ SumUp doesn't provide this!
```

**Problems:**
- SumUp doesn't provide signatures
- No way to verify webhook authenticity
- Vulnerable to spoofed webhooks

### ✅ New Approach (API Verification)
```
Webhook → Basic validation → Fetch from SumUp API → Verify real → Process
                              ↑ Direct verification with SumUp
```

**Advantages:**
- Verifies payment actually exists in SumUp
- Cannot be spoofed (attacker can't fake SumUp API)
- More secure than signature alone
- Works with SumUp's actual capabilities

## Testing

### Test Webhook Reception

```powershell
# Send test webhook to your worker
curl -X POST https://dicebastion-payments.XXXX.workers.dev/internal/verify-webhook `
  -H "Content-Type: application/json" `
  -H "X-Internal-Secret: YOUR_SECRET" `
  -d '{
    "id": "prc_test123",
    "checkout_reference": "ORDER-123",
    "status": "PAID",
    "amount": 10.00,
    "currency": "GBP"
  }'
```

**Expected response:**
```json
{
  "valid": true
}
```

### Test Invalid Webhook

```powershell
# Missing required fields
curl -X POST https://dicebastion-payments.XXXX.workers.dev/internal/verify-webhook `
  -H "Content-Type: application/json" `
  -H "X-Internal-Secret: YOUR_SECRET" `
  -d '{
    "status": "PAID"
  }'
```

**Expected response:**
```json
{
  "valid": false
}
```

## Documentation Updates

Updated files:
- ✅ `payments-worker/src/index.ts` - Removed webhook secret, added refresh token
- ✅ `payments-worker/.dev.vars.example` - Updated secrets list
- ✅ `PAYMENTS_WORKER_QUICK_DEPLOY.md` - Updated deployment steps
- ✅ `SUMUP_OAUTH_FLOWS.md` - Added OAuth flow documentation
- ⏳ `README.md` - Needs update

## Summary

| Change | Before | After |
|--------|--------|-------|
| Webhook verification | HMAC SHA256 signature | Basic validation + API verification |
| `SUMUP_WEBHOOK_SECRET` | Required | Removed |
| `SUMUP_REFRESH_TOKEN` | Not supported | Optional (recommended) |
| OAuth grant types | `client_credentials` only | `refresh_token` + `client_credentials` |
| Security level | ⚠️ Attempted (but SumUp doesn't support) | ✅ Verified via SumUp API |

## Next Steps

1. ✅ Deploy payments worker (no webhook secret needed)
2. ✅ Set required secrets only
3. ⏳ Test webhook processing
4. ⏳ Update main worker to use new payments worker
5. ⏳ Remove old webhook verification code from main worker
