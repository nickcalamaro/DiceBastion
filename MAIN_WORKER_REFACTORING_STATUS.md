# Main Worker Refactoring - In Progress

## Goal
Refactor the main worker to use the payments worker for all SumUp integration instead of calling SumUp APIs directly.

## Changes Made ✅

### 1. Created Payments Client Module
**File**: `worker/src/payments-client.js`
- Wrapper functions to call payments worker internal API
- Functions: `createCheckout`, `getOrCreateSumUpCustomer`, `fetchPayment`, `savePaymentInstrument`, `chargePaymentInstrument`, `verifyWebhook`
- All functions use `X-Internal-Secret` header for authentication

### 2. Updated Imports
**File**: `worker/src/index.js`
- Added imports from `./payments-client.js`
- Imports all payment functions that will replace direct SumUp calls

### 3. Updated Environment Configuration
**File**: `wrangler.toml`
- Added `PAYMENTS_WORKER_URL` to vars
- Updated secrets documentation to note which secrets are no longer needed
- Kept `SUMUP_MERCHANT_CODE` in vars (still needed for context)

### 4. Removed Old Payment Functions
- Removed `sumupToken()` - OAuth now handled by payments worker
- Removed `getOrCreateSumUpCustomer()` - Now imported from payments-client
- Removed `createCheckout()` - Now imported from payments-client  
- Removed `fetchPayment()` - Now imported from payments-client
- Removed `savePaymentInstrument()` - Now imported from payments-client
- Partially removed `chargePaymentInstrument()` - Now imported from payments-client
- Removed `verifySumUpWebhookSignature()` - Replaced with `verifyWebhook()` from payments-client

### 5. Updated Webhook Handler
**File**: `worker/src/index.js` - `/webhooks/sumup` endpoint
- Removed signature verification (SumUp doesn't provide it)
- Now calls `verifyWebhook()` from payments-client
- Validates payload structure via payments worker

## Changes Needed ⏳

### 1. Fix Syntax Errors
The file currently has syntax errors from incomplete edits. Need to:
- Complete removal of old `chargePaymentInstrument` function
- Clean up `/membership/confirm` endpoint code that tried to fetch payment instruments directly

### 2. Set INTERNAL_SECRET
```powershell
cd c:\Users\nickc\Desktop\Dev\DiceBastion
wrangler secret put INTERNAL_SECRET
# Use the SAME value as in payments worker!
```

### 3. Test All Payment Flows
After deployment, test:
- [ ] Membership checkout
- [ ] Membership confirmation with auto-renewal
- [ ] Event ticket purchase
- [ ] Auto-renewal cron job
- [ ] Webhooks
- [ ] Manual renewal retry

## Files Modified
- `worker/src/index.js` - Main worker code (IN PROGRESS - has errors)
- `worker/src/payments-client.js` - NEW - Payments worker client
- `wrangler.toml` - Configuration updated

## Deployment Steps

1. **Fix syntax errors** in `worker/src/index.js`
2. **Set INTERNAL_SECRET** in main worker
3. **Deploy main worker**: `wrangler deploy`
4. **Test** all payment flows
5. **Monitor** logs for both workers

## Rollback Plan

If issues occur:
1. Revert `worker/src/index.js` to previous version
2. Re-deploy main worker
3. Payments still work via old direct SumUp integration

## Next Steps

1. Complete the refactoring (fix remaining code)
2. Deploy and test
3. Once stable, remove old SumUp secrets from main worker:
   - `SUMUP_CLIENT_ID` (can delete)
   - `SUMUP_CLIENT_SECRET` (can delete)
