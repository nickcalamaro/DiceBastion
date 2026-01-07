# SumUp Webhook Configuration Guide

## Problem

When testing auto-renewal payments:
- ✅ Payment succeeds
- ❌ Membership activates (record created in DB)
- ❌ Payment instrument (card token) is NOT saved
- ❌ No transaction record created

### Root Cause

**The SumUp webhook is not configured**, so SumUp never sends the payment completion notification to your worker.

**What should happen:**
1. User completes payment ✅
2. SumUp processes payment ✅
3. **SumUp sends webhook to `/webhooks/sumup`** ❌ NOT HAPPENING
4. Worker activates membership
5. Worker saves payment instrument token
6. Worker creates transaction record

**What is actually happening:**
1. User completes payment ✅
2. SumUp processes payment ✅
3. **No webhook sent** ❌
4. Test page calls fake endpoint `/api/membership-webhook`
5. Nothing happens (endpoint doesn't exist)

## Solution: Configure SumUp Webhook

### Step 1: Log into SumUp Dashboard

1. Go to: https://me.sumup.com/
2. Log in with your merchant account
3. Navigate to: **Settings** → **Developers** → **API Keys**

### Step 2: Configure Webhook URL

1. Find the **Webhooks** section
2. Click **Add Webhook** or **Configure Webhook**
3. Enter your webhook URL:
   ```
   https://dicebastion-memberships.ncalamaro.workers.dev/webhooks/sumup
   ```

4. Select events to subscribe to:
   - ✅ **Checkout completed** (CHECKOUT_COMPLETE or similar)
   - ✅ **Payment successful** (PAYMENT_PAID or similar)
   
5. Save the webhook configuration

### Step 3: Get Webhook Secret

SumUp will provide a **webhook secret** for signature verification.

1. Copy the webhook secret
2. Add it to your worker secrets:

```bash
cd worker
npx wrangler secret put SUMUP_WEBHOOK_SECRET
# Paste the secret when prompted
```

### Step 4: Test the Webhook

#### Option A: Use SumUp's Test Tool

Most payment providers have a "Test Webhook" button in the dashboard:
1. Find "Test Webhook" or "Send Test Event"
2. Click to send a test notification
3. Check your worker logs for:
   ```
   POST /webhooks/sumup
   Auto-renewal enabled, attempting to save payment instrument...
   ```

#### Option B: Make a Real £1 Payment

1. Open: http://localhost:8000/test-auto-renewal-purchase.html
2. Fill in the form with auto-renewal enabled
3. Complete the £1 payment
4. Watch the logs for:
   ```
   POST /webhooks/sumup
   Auto-renewal enabled, attempting to save payment instrument for checkout: xxx
   Found payment_instrument: {...}
   Successfully saved payment instrument: xxx
   ```

## Verification

### Check Worker Logs

After configuring the webhook and making a payment:

```bash
cd worker
npx wrangler tail
```

**Expected logs:**
```
POST /webhooks/sumup - Ok
  (log) Auto-renewal enabled, attempting to save payment instrument for checkout: prc_xxx
  (log) Checkout response for tokenization: {...}
  (log) Found payment_instrument: {"token":"xxx","type":"CARD",...}
  (log) Successfully saved payment instrument: xxx
  (log) Payment instrument saved successfully: xxx
```

### Check Database

#### 1. Verify Membership Activated

```sql
SELECT id, user_id, plan, status, auto_renew, payment_instrument_id, end_date
FROM memberships
WHERE user_id = YOUR_USER_ID
ORDER BY id DESC LIMIT 1;
```

**Expected:**
- `status = 'active'`
- `auto_renew = 1` (if enabled)
- `payment_instrument_id` is NOT NULL (if auto-renewal enabled)
- `end_date` is 1 month from now

#### 2. Verify Payment Instrument Saved

```sql
SELECT id, user_id, instrument_id, card_type, last_4, is_active
FROM payment_instruments
WHERE user_id = YOUR_USER_ID
ORDER BY id DESC LIMIT 1;
```

**Expected:**
- Row exists
- `is_active = 1`
- `instrument_id` starts with `tok_` or similar
- `card_type` = 'VISA', 'MASTERCARD', etc.
- `last_4` = last 4 digits of test card

#### 3. Verify Transaction Created

```sql
SELECT id, transaction_type, user_id, order_ref, payment_id, amount, payment_status
FROM transactions
WHERE user_id = YOUR_USER_ID
ORDER BY id DESC LIMIT 1;
```

**Expected:**
- `transaction_type = 'membership'`
- `payment_status = 'PAID'` or similar
- `amount = '1.00'` (for test)
- `payment_id` is NOT NULL

## Troubleshooting

### Issue: Webhook not being called

**Check 1:** Verify webhook URL in SumUp dashboard
- Should be: `https://dicebastion-memberships.ncalamaro.workers.dev/webhooks/sumup`
- NOT: `/api/membership-webhook`

**Check 2:** Check SumUp webhook delivery logs
- Most providers show webhook delivery attempts in dashboard
- Look for failed deliveries or errors

**Check 3:** Test webhook endpoint manually
```bash
curl -X POST https://dicebastion-memberships.ncalamaro.workers.dev/webhooks/sumup \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-payment-id",
    "checkout_reference": "TEST-ORDER-REF",
    "status": "PAID",
    "currency": "GBP",
    "amount": 1.00
  }'
```

### Issue: Webhook called but no logs

**Check:** SUMUP_WEBHOOK_SECRET is set
```bash
cd worker
npx wrangler secret list
```

Should show:
```
SUMUP_WEBHOOK_SECRET
```

If missing, add it:
```bash
npx wrangler secret put SUMUP_WEBHOOK_SECRET
```

### Issue: Payment instrument not saved

**Check logs for:**
```
No payment_instrument found in checkout response
Ensure purpose=SETUP_RECURRING_PAYMENT and customer_id were set
```

**If you see this:**
- Checkout was created WITHOUT `purpose: SETUP_RECURRING_PAYMENT`
- OR without `customer_id`
- This should NOT happen if auto_renew was enabled

**Check the initial checkout creation logs:**
```
Using SumUp customer ID for auto-renewal: USER-xxx
```

This confirms the customer_id and purpose were set correctly.

## Summary

| Step | Status | Action |
|------|--------|--------|
| 1. Configure webhook URL in SumUp | ❌ TODO | Add https://dicebastion-memberships.ncalamaro.workers.dev/webhooks/sumup |
| 2. Get webhook secret | ❌ TODO | Copy from SumUp dashboard |
| 3. Add secret to worker | ❌ TODO | `wrangler secret put SUMUP_WEBHOOK_SECRET` |
| 4. Test with £1 payment | ⏳ PENDING | Use test page after webhook configured |
| 5. Verify logs | ⏳ PENDING | Check for webhook processing logs |
| 6. Verify database | ⏳ PENDING | Check payment_instruments table |

## Next Steps

1. **Configure the webhook in SumUp dashboard** (most important!)
2. **Add webhook secret to worker**
3. **Make another £1 test payment**
4. **Check logs** to confirm webhook was received
5. **Check database** to confirm token was saved

Total test cost: **£1.00** (if previous payment was refunded)

If previous payment was NOT refunded and you want to verify it:
- Check your SumUp dashboard transactions
- If payment is there, it should have triggered a webhook
- If no webhook was sent, it's because webhook wasn't configured

## Important Notes

- The test page was calling `/api/membership-webhook` (wrong endpoint)
- The real webhook endpoint is `/webhooks/sumup`
- The worker code is correct and ready
- Just need to configure webhook in SumUp dashboard
