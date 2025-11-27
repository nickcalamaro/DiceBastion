# Next Steps - Deploying and Testing the Fix

## What We Fixed

1. **Added `customer_id` to recurring payment requests** in `chargePaymentInstrument()` function
2. **Added customer verification** before attempting recurring payments
3. **Updated comments** to reflect SumUp documentation requirements

## Current Status

### ✅ Code Fixed
- `worker/src/index.js` updated with correct implementation
- Customer verification added
- Documentation updated (SUMUP_RECURRING_PAYMENTS_RESOLUTION.md)

### ⚠️  Not Yet Tested
- The fix hasn't been deployed to production
- USER-21 was created WITHOUT the Customer API resource (auto-renewal may have been disabled)
- Need fresh test with new customer after deployment

## Deployment Steps

### 1. Deploy Updated Worker
```powershell
cd C:\Users\nickc\Dev\DiceBastion\worker
wrangler deploy
```

### 2. Test with Fresh Customer

**Option A: Using Test Script**
```powershell
.\test-complete-flow.ps1
```
This will guide you through:
- Creating Customer API resource
- Setting up recurring payment with SETUP_RECURRING_PAYMENT
- Testing auto-renewal with saved token + customer_id

**Option B: Real Membership Purchase**
1. Go to Dice Bastion membership page
2. Select a plan
3. ✅ **ENABLE auto-renewal checkbox** (critical!)
4. Complete purchase with real card
5. Check logs to verify:
   - `getOrCreateSumUpCustomer called with user` appears
   - `Created SumUp customer` or `Found existing SumUp customer` appears
   - Token saved successfully
6. Manually trigger auto-renewal (or wait for scheduled run)

## Expected Behavior After Fix

### Initial Purchase (with auto-renewal enabled)
```
Logs should show:
1. getOrCreateSumUpCustomer called with user: {...}
2. Resolved userId: 21
3. Customer ID to use: USER-21
4. Creating new SumUp customer: USER-21 (if new)
   OR Found existing SumUp customer: USER-21 (if exists)
5. Using SumUp customer ID for auto-renewal: USER-21
6. Checkout response with:
   - customer_id: USER-21
   - purpose: SETUP_RECURRING_PAYMENT
   - payment_instrument.token: <token>
   - mandate.status: active
7. Successfully saved payment instrument: <token>
```

### Auto-Renewal Attempt
```
Logs should show:
1. Processing auto-renewal for USER-21
2. Found active payment instrument: <token>
3. Created checkout for renewal: <checkout_id>
4. Payment body includes:
   - payment_type: card
   - token: <token>
   - customer_id: USER-21  ← THIS WAS MISSING BEFORE!
5. Either:
   ✅ Processed recurring payment: <transaction_id>, status: PAID (no 3DS)
   ⚠️  Requires 3DS authentication (still needs user action)
```

## Troubleshooting

### If Customer API Returns 404
**Problem**: Customer doesn't exist in Customer API
**Solution**: Check logs - if `getOrCreateSumUpCustomer()` wasn't called, auto-renewal was disabled during purchase

### If Token is Invalid
**Problem**: `{"message":"Validation error","error_code":"INVALID","param":"token"}`
**Cause**: Token belongs to different customer than the one specified
**Solution**: Token and customer_id must match - token saved with customer_id "USER-X" can ONLY be used with customer_id "USER-X"

### If Still Requires 3DS
**Problem**: Recurring payment works but requires 3DS authentication
**Status**: This may be expected behavior from SumUp
**Investigation**: Contact SumUp support to confirm if MIT (Merchant Initiated Transactions) are supported for your merchant account

## Manual Verification Commands

### Check if Customer Exists
```powershell
$accessToken = (Invoke-RestMethod -Uri "https://api.sumup.com/token" -Method POST -Body @{
    grant_type = "client_credentials"
    client_id = "cc_classic_XfyKJcVmWxZjHeIukGgH1Wn957m3W"
    client_secret = "cc_sk_classic_k7Gc5lTdycVXkHidFnPFq7QQFeNF2AmPSvb0badY93yFWEtZUp"
    scope = "payments payment_instruments"
} -ContentType "application/x-www-form-urlencoded").access_token

Invoke-RestMethod -Uri "https://api.sumup.com/v0.1/customers/USER-21" `
    -Headers @{ "Authorization" = "Bearer $accessToken" }
```

### Check Checkout Details
```powershell
Invoke-RestMethod -Uri "https://api.sumup.com/v0.1/checkouts/<checkout_id>" `
    -Headers @{ "Authorization" = "Bearer $accessToken" }
```

### Check Database for Payment Instruments
```sql
SELECT * FROM payment_instruments WHERE user_id = 21 AND is_active = 1;
```

## Success Criteria

The fix is working correctly when:

1. ✅ Customer API resource created during initial purchase (with auto-renewal enabled)
2. ✅ Token saved and linked to customer_id
3. ✅ Auto-renewal includes BOTH token AND customer_id in payment request
4. ✅ No "Customer not found" errors
5. ✅ No "Invalid token" errors
6. ⏳ Ideally: No 3DS required for recurring payments (may need SumUp support confirmation)

## Files Changed

- `worker/src/index.js` - Fixed `chargePaymentInstrument()` function
- `worker/SUMUP_RECURRING_PAYMENTS_RESOLUTION.md` - Complete analysis document
- `worker/test-complete-flow.ps1` - Test script for verification

## Contact SumUp Support (if 3DS still required)

**Subject**: Merchant Initiated Transactions (MIT) for Recurring Payments

**Message**:
```
Hello,

We've implemented recurring payments using your SETUP_RECURRING_PAYMENT flow:
- Initial checkout with purpose: SETUP_RECURRING_PAYMENT
- Token saved with active recurrent mandate
- Customer created in Customer API
- Subsequent payments use both token + customer_id

However, recurring payments still require 3DS authentication. According to PSD2 regulations, MIT (Merchant Initiated Transactions) for recurring payments should be exempt from SCA.

Questions:
1. Is MIT supported for our merchant account (code: MUZHYEAH)?
2. Are there additional steps needed to enable frictionless recurring payments?
3. Do we need to be explicitly whitelisted for MIT exemptions?

Our implementation follows your documentation exactly. Please advise on how to achieve frictionless auto-renewal payments.

Thank you!
```

## Conclusion

The core issue has been identified and fixed. The code now properly:
1. Creates Customer API resources
2. Links tokens to customers
3. Includes both token + customer_id in recurring payments

Next step: **Deploy and test with fresh customer purchase**
