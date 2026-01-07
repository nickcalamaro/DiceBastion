# Auto-Renewal Testing Guide - Live Card Test

## Overview
This guide will walk you through testing the complete auto-renewal flow with a real payment card, including:
1. Card tokenization during checkout
2. Manual renewal endpoint testing
3. Verifying payment instrument storage
4. Testing renewal cron job

---

## Prerequisites

- ✅ Worker deployed to Cloudflare Workers
- ✅ Test card that you can make payments with
- ✅ Access to Cloudflare dashboard for logs
- ✅ Admin access to check database records

---

## Step 1: Create Test Membership with Auto-Renewal

### Using the Frontend (Recommended)

1. **Go to Memberships Page**
   ```
   https://dicebastion.com/memberships
   ```

2. **Select a Plan** (recommend Monthly for quick testing - £5)
   - Click "Get Started" on Monthly plan

3. **Fill Out Form**
   - Email: Use your test email
   - Name: Your name
   - ✅ **Check "Enable auto-renewal"** (CRITICAL - this triggers tokenization)
   - ✅ Accept terms and conditions

4. **Complete Payment with SumUp Widget**
   - Use your real test card
   - Complete payment successfully
   - **Wait for success confirmation**

5. **Verify Success**
   - You should see: "Payment successful! Redirecting..."
   - Check email for welcome/confirmation

---

## Step 2: Verify Tokenization Happened

### Check Database Records

Run these queries in your D1 database (Cloudflare dashboard):

```sql
-- 1. Find your membership record
SELECT * FROM memberships 
WHERE email = 'your-test-email@example.com' 
ORDER BY created_at DESC 
LIMIT 1;

-- Note the user_id from the result

-- 2. Check if payment instrument was saved
SELECT * FROM payment_instruments 
WHERE user_id = [YOUR_USER_ID] 
AND is_active = 1;

-- You should see:
-- - instrument_id (the token)
-- - card_type
-- - last_4
-- - expiry_month/year
-- - is_active = 1

-- 3. Verify membership details
SELECT 
    id,
    user_id,
    plan,
    status,
    auto_renew,
    start_date,
    end_date,
    payment_instrument_id,
    amount,
    currency
FROM memberships
WHERE user_id = [YOUR_USER_ID];

-- Check:
-- - auto_renew = 1
-- - payment_instrument_id matches the instrument_id from step 2
-- - status = 'active'
```

### Expected Database State

**memberships table:**
```
id: [auto-generated]
user_id: [your user_id]
plan: 'monthly'
status: 'active'
auto_renew: 1
start_date: '2026-01-07T...'
end_date: '2026-02-07T...'
payment_instrument_id: 'tok_...' (SumUp token)
amount: '5.00'
currency: 'GBP'
```

**payment_instruments table:**
```
id: [auto-generated]
user_id: [your user_id]
instrument_id: 'tok_...'
card_type: 'VISA' or 'MASTERCARD'
last_4: '1234'
expiry_month: 12
expiry_year: 2027
is_active: 1
created_at: '2026-01-07T...'
```

---

## Step 3: Test Manual Renewal Endpoint

### Option A: Using Test Endpoint (Safer for Testing)

```bash
# Test renewal without actually charging
curl -X POST https://your-worker.workers.dev/api/test-renewal \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "membershipId": [YOUR_MEMBERSHIP_ID],
    "dryRun": true
  }'
```

### Option B: Force Immediate Renewal (Will Charge Card!)

**⚠️ WARNING: This will charge your card again!**

```bash
# This will actually charge your card for another month
curl -X POST https://your-worker.workers.dev/api/admin/force-renewal \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "membershipId": [YOUR_MEMBERSHIP_ID]
  }'
```

Expected response:
```json
{
  "success": true,
  "membershipId": 123,
  "newEndDate": "2026-03-07T...",
  "paymentId": "pay_...",
  "message": "Membership renewed successfully"
}
```

### Verify Renewal in Database

```sql
-- Check updated membership
SELECT * FROM memberships WHERE id = [YOUR_MEMBERSHIP_ID];
-- end_date should be extended by 1 month
-- renewal_failed_at should be NULL
-- renewal_attempts should be 0

-- Check renewal log
SELECT * FROM renewal_log 
WHERE membership_id = [YOUR_MEMBERSHIP_ID] 
ORDER BY attempt_date DESC;
-- Should show 'success' status with payment_id

-- Check transactions
SELECT * FROM transactions 
WHERE reference_id = [YOUR_MEMBERSHIP_ID] 
AND transaction_type = 'renewal'
ORDER BY created_at DESC;
```

---

## Step 4: Test Cron Job (Manual Trigger)

### Using Wrangler

```bash
cd c:\Users\nickc\Desktop\Dev\DiceBastion\worker

# Trigger the auto_renewals cron job
npx wrangler dev --test-scheduled --schedule-name="auto_renewals"
```

### Check Cron Job Logs

```sql
SELECT * FROM cron_job_log 
WHERE job_name = 'auto_renewals' 
ORDER BY started_at DESC 
LIMIT 5;

-- Successful run should show:
-- status: 'completed'
-- records_processed: [number of renewals attempted]
-- records_affected: [number of successful renewals]
-- error_message: NULL
```

---

## Step 5: Test Renewal Failure Scenarios

### Test Expired Card Handling

1. **Manually Expire the Payment Instrument**
   ```sql
   -- Set instrument to expired
   UPDATE payment_instruments 
   SET is_active = 0 
   WHERE user_id = [YOUR_USER_ID];
   ```

2. **Attempt Renewal**
   ```bash
   curl -X POST https://your-worker.workers.dev/api/admin/force-renewal \
     -H "Content-Type: application/json" \
     -H "X-Admin-Key: YOUR_ADMIN_KEY" \
     -d '{"membershipId": [YOUR_MEMBERSHIP_ID]}'
   ```

3. **Expected Result**
   - Response: `{"success": false, "error": "no_instrument"}`
   - Database: `renewal_failed_at` updated, `renewal_attempts` incremented
   - Email: Should receive renewal failed email

---

## Step 6: End-to-End Renewal Test

### Modify Membership to Expire Soon

```sql
-- Set end_date to 2 days from now
UPDATE memberships 
SET end_date = datetime('now', '+2 days')
WHERE id = [YOUR_MEMBERSHIP_ID];
```

### Wait for Cron or Trigger Manually

The cron job runs daily and will:
1. Find memberships expiring in the next 3 days
2. Check if they have `auto_renew = 1`
3. Verify active payment instrument exists
4. Attempt to charge the card
5. Extend membership or log failure

---

## Verification Checklist

After testing, verify:

- [ ] **Payment instrument saved correctly**
  - `instrument_id` populated
  - `is_active = 1`
  - Card details (type, last_4, expiry) saved

- [ ] **Membership configured for auto-renewal**
  - `auto_renew = 1`
  - `payment_instrument_id` matches saved instrument

- [ ] **Manual renewal works**
  - Card charged successfully
  - `end_date` extended by correct period
  - Transaction logged in `transactions` table
  - Renewal logged in `renewal_log` table

- [ ] **Cron job processes renewals**
  - Cron job runs without errors
  - Memberships renewed automatically
  - Logs show successful processing

- [ ] **Email notifications sent**
  - Welcome email (initial purchase)
  - Renewal success email
  - Renewal failure email (if testing failures)

- [ ] **SumUp customer created**
  - Customer exists in SumUp with ID `USER-[user_id]`
  - Customer has email and name

---

## Troubleshooting

### Token Not Saved

**Check:**
1. Was `savePaymentInstrument: true` passed to checkout?
2. Was `customerId` provided?
3. Was `purpose: 'SETUP_RECURRING_PAYMENT'` set?
4. Check Cloudflare logs for errors in `savePaymentInstrument()` function

### Renewal Fails with "Customer not found"

**Fix:**
```sql
-- Check if customer exists in SumUp
-- The chargePaymentInstrument function now auto-creates customers
```

### Card Charge Fails

**Common reasons:**
- Token expired (SumUp tokens expire after 30 days of inactivity)
- Customer ID mismatch
- Insufficient funds
- Card blocked by bank

**Debug:**
Check Cloudflare logs for exact error from SumUp API

---

## Success Criteria

✅ **Complete Success Looks Like:**

1. Initial checkout with auto-renewal enabled
2. Payment successful
3. Database shows:
   - Active membership with `auto_renew = 1`
   - Active payment instrument with token
   - Transaction record
4. Manual renewal charges card and extends membership
5. Cron job can process renewals automatically
6. Emails sent at each step

---

## Database Quick Reference

```sql
-- Find your test user
SELECT * FROM users WHERE email = 'your-email@example.com';

-- Find all memberships for user
SELECT * FROM memberships WHERE user_id = [ID] ORDER BY created_at DESC;

-- Find all payment instruments
SELECT * FROM payment_instruments WHERE user_id = [ID];

-- Find all transactions for user
SELECT * FROM transactions WHERE user_id = [ID] ORDER BY created_at DESC;

-- Find all renewal attempts
SELECT r.*, m.plan, m.status 
FROM renewal_log r 
JOIN memberships m ON r.membership_id = m.id 
WHERE m.user_id = [ID] 
ORDER BY r.attempt_date DESC;

-- Check recent cron runs
SELECT * FROM cron_job_log 
WHERE job_name = 'auto_renewals' 
ORDER BY started_at DESC 
LIMIT 10;
```

---

## Next Steps After Successful Test

1. ✅ Verify tokenization works end-to-end
2. ✅ Confirm renewal charges work
3. ✅ Test failure scenarios
4. ✅ Monitor first automated cron run
5. ✅ Check email deliverability
6. 🚀 **Go live with confidence!**
