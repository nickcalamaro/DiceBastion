# Webhook Payment Instrument Fix

## Problem

When testing the £1 auto-renewal payment flow:
- ✅ Payment succeeded (card was charged)
- ❌ Payment was immediately reverted
- ❌ Test page showed: "Payment succeeded but verification failed: Payment verification failed"
- ❌ Payment instrument (card token) was **NOT saved** to database

### Root Cause

The webhook handler (`/webhooks/sumup`) was missing the critical step of saving the payment instrument token after a successful payment.

**What should happen:**
1. User completes payment with `auto_renew: true` ✅
2. SumUp processes payment with `purpose: SETUP_RECURRING_PAYMENT` ✅
3. SumUp sends webhook to worker ✅
4. Worker activates membership ✅
5. **Worker saves payment instrument token** ❌ **MISSING**

**What was happening:**
- Checkout created with `purpose: SETUP_RECURRING_PAYMENT` and `customer_id` ✅
- Payment completed successfully ✅
- Webhook received and membership activated ✅
- But `savePaymentInstrument()` was **never called** ❌
- Result: No token saved → Auto-renewal would fail → Payment reverted

## The Fix

### Code Changes

**File:** `worker/src/index.js`  
**Location:** Webhook handler `/webhooks/sumup` (around line 2087)

**Before:**
```javascript
await c.env.DB.prepare('UPDATE memberships SET status = "active", start_date = ?, end_date = ?, payment_id = ? WHERE id = ?')
  .bind(toIso(start), toIso(end), paymentId, pending.id).run()

// Send welcome email (critical - works even if user closed browser)
const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(identityId).first()
```

**After:**
```javascript
await c.env.DB.prepare('UPDATE memberships SET status = "active", start_date = ?, end_date = ?, payment_id = ? WHERE id = ?')
  .bind(toIso(start), toIso(end), paymentId, pending.id).run()

// Save payment instrument if auto-renewal is enabled
if (pending.auto_renew === 1) {
  console.log('Auto-renewal enabled, attempting to save payment instrument for checkout:', paymentId)
  const instrumentId = await savePaymentInstrument(c.env.DB, identityId, paymentId, c.env)
  if (instrumentId) {
    console.log('Payment instrument saved successfully:', instrumentId)
    // Store instrument ID in membership record for reference
    await c.env.DB.prepare('UPDATE memberships SET payment_instrument_id = ? WHERE id = ?')
      .bind(instrumentId, pending.id).run()
  } else {
    console.warn('Failed to save payment instrument, but membership activation will continue')
  }
}

// Send welcome email (critical - works even if user closed browser)
const user = await c.env.DB.prepare('SELECT * FROM users WHERE user_id = ?').bind(identityId).first()
```

### What This Does

1. **Checks if auto-renewal is enabled** (`pending.auto_renew === 1`)
2. **Calls `savePaymentInstrument()`** with:
   - Database connection
   - User ID
   - Checkout/Payment ID
   - Environment (for SumUp API calls)
3. **Fetches the checkout** from SumUp API
4. **Extracts `payment_instrument`** from checkout response
5. **Saves token to database** in `payment_instruments` table:
   - `instrument_id` (the token for recurring charges)
   - `card_type`, `last_4`, `expiry_month`, `expiry_year`
   - `is_active = 1`
6. **Updates membership record** with `payment_instrument_id` for reference
7. **Logs everything** for debugging

### Error Handling

- If tokenization fails, membership is still activated (payment was successful)
- Logs warning: `"Failed to save payment instrument, but membership activation will continue"`
- User can manually update payment method later if needed

## Testing Steps

### 1. Fresh £1 Test Payment
```bash
# Start test server
.\serve-test-page.ps1

# Open in browser
http://localhost:8000/test-auto-renewal-purchase.html

# Fill in form:
- Email: your-email+test@gmail.com
- Name: Test User
- Plan: Monthly (auto-selected)
- Custom Amount: £1.00
- Auto-renewal: ✅ CHECKED
- Privacy consent: ✅ CHECKED

# Click "Purchase Membership"
# Complete payment with test card
```

### 2. Expected Results

**Logs to watch for:**
```
✅ Using custom test amount: £1 for plan: monthly
✅ Creating new SumUp customer: USER-{id}
✅ Using SumUp customer ID for auto-renewal: USER-{id}
✅ Checkout created with purpose=SETUP_RECURRING_PAYMENT
✅ Webhook received
✅ Auto-renewal enabled, attempting to save payment instrument for checkout: {checkout_id}
✅ Found payment_instrument: {token details}
✅ Successfully saved payment instrument: {instrument_id}
✅ Payment instrument saved successfully: {instrument_id}
```

**Database:**
```sql
-- Check membership was created with auto-renewal
SELECT id, user_id, plan, auto_renew, status, payment_instrument_id 
FROM memberships 
WHERE user_id = {your_user_id}
ORDER BY id DESC LIMIT 1;

-- Check payment instrument was saved
SELECT id, user_id, instrument_id, card_type, last_4, is_active
FROM payment_instruments
WHERE user_id = {your_user_id}
ORDER BY id DESC LIMIT 1;
```

### 3. Test Instant Renewal

After successful £1 payment:
```javascript
// Click "Test Instant Renewal" button on test page
// This calls: POST /test/renew-user with { userId, amount: 1.00 }
```

**Expected:**
- ✅ £1 charge using saved token
- ✅ Membership end_date extended by 1 month
- ✅ New transaction record created with `type: 'renewal'`
- ✅ Renewal log entry: `status: 'success'`

## Related Files

- ✅ `worker/src/index.js` - Webhook handler updated
- ✅ `worker/wrangler.toml` - Already has CORS and test bypass configured
- ✅ `test-auto-renewal-purchase.html` - Test page ready
- ✅ Database schema - `payment_instruments` table exists

## Previous Fixes Applied

1. ✅ Fixed `customerId` scope error (variable declared outside try block)
2. ✅ Added Turnstile bypass for testing (`ALLOW_TEST_BYPASS = "true"`)
3. ✅ Fixed CORS for `http://localhost:8000`
4. ✅ Fixed database constraint (use valid plan with custom amount)
5. ✅ **NEW:** Added payment instrument saving in webhook handler

## Deployment

```bash
cd worker
npx wrangler deploy
```

**Status:** ✅ Deployed

## Next Steps

1. **Test the full flow** with a fresh £1 payment
2. **Verify token is saved** in database
3. **Test instant renewal** (another £1 charge)
4. **Check logs** for any errors

Total cost when working: **£2.00** (£1 initial + £1 renewal test)
