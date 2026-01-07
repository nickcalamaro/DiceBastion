# Auto-Renewal Workflow Explanation

**User:** user_id 23  
**Membership:** Expired on 2025-12-27  
**Current Date:** 2026-01-06  
**Status:** auto_renew = 1, has payment_instrument

---

## 🚨 Current Situation: MISSED RENEWAL

### Problem
User 23's membership expired on **2025-12-27**, but today is **2026-01-06** (10 days later).

The current cron job logic **ONLY processes renewals on the exact expiration date**:

```javascript
WHERE m.end_date = ?  // Uses TODAY's date (2026-01-06)
  AND m.auto_renew = 1
  AND m.status = 'active'
```

**This query will NOT find user 23's membership** because:
- `end_date` = 2025-12-27
- `today` = 2026-01-06
- They don't match!

### What Actually Happened
1. **2025-12-27 at 2 AM UTC** - Cron job should have run
2. Either:
   - Cron wasn't set up yet (likely)
   - Database migration wasn't applied
   - Worker wasn't deployed
   - Cron job failed silently
3. **2025-12-28 onwards** - Renewal window missed
4. **2026-01-06** - User's membership is now expired and won't auto-renew

---

## 📋 Current Auto-Renewal Workflow (As Implemented)

### Schedule
- **Runs:** Daily at 2:00 AM UTC
- **Cron Expression:** `0 2 * * *`

### Step-by-Step Process

#### 1. **Cron Trigger** (2:00 AM UTC)
```javascript
handleScheduled(event, env, ctx)
  └─> processAutoRenewals(env)
```

#### 2. **Find Expiring Memberships**
```sql
SELECT 
  m.membership_id,
  m.user_id,
  m.plan,
  m.order_ref,
  u.email,
  u.name
FROM memberships m
JOIN users u ON m.user_id = u.user_id
WHERE m.end_date = '2026-01-06'  -- TODAY's date
  AND m.auto_renew = 1
  AND m.status = 'active'
```

**For User 23:**
- ❌ **Will NOT be found** because `end_date` = 2025-12-27 (in the past)

#### 3. **Process Each Renewal** (Currently Placeholder)
```javascript
for (const membership of expiringMemberships.results) {
  try {
    // TODO: Implement actual Stripe charge for renewal
    console.log(`[CRON] Would renew membership ${membership.membership_id}`)
    
    // Future implementation:
    // 1. Get stored payment method from Stripe
    // 2. Create new payment intent with stored payment method
    // 3. Update membership end_date on successful charge
    // 4. Send renewal confirmation email
    
    succeeded++
  } catch (err) {
    failed++
    errors.push({ membership_id, email, error: err.message })
  }
}
```

**Current Status:** ⚠️ **NOT IMPLEMENTED**
- Just logs "would renew"
- Doesn't charge payment
- Doesn't update membership
- Doesn't send emails

#### 4. **Log Results**
```javascript
await logCronJob(env.DB, 'auto_renewals', status, {
  records_processed: 1,
  records_succeeded: 1,
  records_failed: 0
})
```

---

## ✅ What SHOULD Happen (Future Implementation)

### For User 23 on 2025-12-27 at 2 AM UTC:

#### Step 1: Detect Expiring Membership
```sql
-- Find membership expiring TODAY
SELECT * FROM memberships 
WHERE user_id = 23 
  AND end_date = '2025-12-27'
  AND auto_renew = 1
  AND status = 'active'
```

#### Step 2: Get Payment Instrument
```sql
SELECT * FROM payment_instruments 
WHERE user_id = 23 
  AND is_active = 1
ORDER BY created_at DESC 
LIMIT 1
```

**Expected:**
```json
{
  "id": 123,
  "user_id": 23,
  "sumup_token": "enc_xyz...",
  "card_type": "VISA",
  "last_4": "4242",
  "expiry_month": "12",
  "expiry_year": "2027",
  "is_active": 1
}
```

#### Step 3: Get Service Plan Details
```sql
SELECT * FROM services 
WHERE code = 'monthly'  -- User's plan
  AND active = 1
```

**Expected:**
```json
{
  "code": "monthly",
  "name": "Monthly Membership",
  "amount": 10.00,
  "currency": "GBP",
  "months": 1
}
```

#### Step 4: Charge Payment Method
```javascript
// Decrypt stored payment token
const paymentToken = decrypt(instrument.sumup_token)

// Create SumUp payment with stored card
const payment = await fetch('https://api.sumup.com/v0.1/checkouts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${sumupToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    checkout_reference: `RENEWAL-${membership.id}-${Date.now()}`,
    amount: 10.00,
    currency: 'GBP',
    description: 'Monthly Membership Renewal',
    payment_type: 'card',
    card: {
      token: paymentToken
    }
  })
})
```

**Possible Outcomes:**

##### ✅ Success
```json
{
  "id": "abc123",
  "status": "PAID",
  "amount": 10.00,
  "currency": "GBP"
}
```

**Actions:**
1. Update membership:
   ```sql
   UPDATE memberships 
   SET end_date = '2026-01-27',  -- Add 1 month
       status = 'active',
       last_renewal_date = '2025-12-27',
       renewal_attempts = 0,
       renewal_failed_at = NULL
   WHERE id = [membership_id]
   ```

2. Create transaction record:
   ```sql
   INSERT INTO transactions (
     transaction_type, reference_id, user_id, 
     amount, currency, payment_status, payment_id
   ) VALUES (
     'renewal', [membership_id], 23,
     10.00, 'GBP', 'PAID', 'abc123'
   )
   ```

3. Send confirmation email:
   ```javascript
   await sendEmail(env, {
     to: user.email,
     subject: '✅ Membership Renewed',
     html: getRenewalSuccessEmail(membership, user)
   })
   ```

##### ❌ Payment Failed
```json
{
  "error": "card_declined",
  "message": "Insufficient funds"
}
```

**Actions:**
1. Increment retry counter:
   ```sql
   UPDATE memberships 
   SET renewal_attempts = renewal_attempts + 1,
       renewal_failed_at = '2025-12-27T02:00:00Z'
   WHERE id = [membership_id]
   ```

2. Send failure email:
   ```javascript
   await sendEmail(env, {
     to: user.email,
     subject: '⚠️ Membership Renewal Failed',
     html: getRenewalFailedEmail(membership, user, attemptNumber)
   })
   ```

3. **Retry Logic:**
   - Attempt 1: Immediate (same day)
   - Attempt 2: Next day
   - Attempt 3: 2 days later
   - After 3 failures: Cancel auto-renewal, send final notice

##### ⚠️ Payment Method Expired
```json
{
  "error": "card_expired",
  "message": "Card has expired"
}
```

**Actions:**
1. Deactivate payment instrument:
   ```sql
   UPDATE payment_instruments 
   SET is_active = 0 
   WHERE id = [instrument_id]
   ```

2. Disable auto-renewal:
   ```sql
   UPDATE memberships 
   SET auto_renew = 0,
       payment_instrument_id = NULL
   WHERE id = [membership_id]
   ```

3. Send update request email:
   ```javascript
   await sendEmail(env, {
     to: user.email,
     subject: '🔐 Update Your Payment Method',
     html: getPaymentMethodExpiredEmail(membership, user)
   })
   ```

---

## 🔧 How to Handle Missed Renewals (User 23)

Since user 23's renewal was missed, here are the options:

### Option 1: Manual Renewal (Recommended)
Run a one-time script to process past-due renewals:

```sql
-- Find all memberships that should have been renewed
SELECT 
  m.membership_id,
  m.user_id,
  m.end_date,
  m.plan,
  u.email,
  JULIANDAY('now') - JULIANDAY(m.end_date) as days_expired
FROM memberships m
JOIN users u ON m.user_id = u.user_id
WHERE m.end_date < DATE('now')
  AND m.auto_renew = 1
  AND m.status = 'active';
```

Then manually trigger renewal:
```bash
curl "https://dicebastion-memberships.ncalamaro.workers.dev/membership/retry-renewal" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"user23@example.com"}'
```

### Option 2: Update Cron to Catch Past-Due Renewals

Modify the query to check for overdue memberships:

```sql
-- Current (only checks today)
WHERE m.end_date = ?

-- Better (checks past-due)
WHERE m.end_date <= ?  -- Today or earlier
  AND m.end_date >= DATE('now', '-7 days')  -- Within last week
  AND m.auto_renew = 1
  AND m.status = 'active'
```

This would process user 23's renewal on the next cron run.

### Option 3: Grace Period
Allow expired members to still renew:

```sql
WHERE (
  m.end_date = ?  -- Expiring today
  OR (
    m.end_date < ? -- Expired in past
    AND m.end_date >= DATE('now', '-30 days')  -- Within 30-day grace period
  )
)
AND m.auto_renew = 1
AND m.status = 'active'
```

---

## 📊 Current vs. Future State

### Current State (As of 2026-01-06)
| Feature | Status | Notes |
|---------|--------|-------|
| Cron Schedule | ✅ Active | Runs daily at 2 AM UTC |
| Database Table | ✅ Created | `cron_job_log` exists |
| Logging System | ✅ Working | Errors captured |
| Payment Processing | ❌ TODO | Just logs "would renew" |
| Email Notifications | ❌ TODO | Not implemented |
| Retry Logic | ❌ TODO | No retry on failure |
| Grace Period | ❌ TODO | Only checks exact date |

### Future State (Needs Implementation)
| Feature | Priority | Effort |
|---------|----------|--------|
| SumUp Card Charging | 🔴 Critical | High |
| Membership Extension | 🔴 Critical | Medium |
| Success Emails | 🟡 High | Low |
| Failure Emails | 🟡 High | Low |
| Retry Logic | 🟡 High | Medium |
| Payment Method Expiry Check | 🟢 Medium | Low |
| Grace Period | 🟢 Medium | Low |
| Admin Notifications | 🟢 Low | Low |

---

## 🎯 Next Steps for User 23

### Immediate Action
1. **Check current membership status:**
   ```sql
   SELECT * FROM memberships 
   WHERE user_id = 23 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

2. **Check payment instrument:**
   ```sql
   SELECT * FROM payment_instruments 
   WHERE user_id = 23 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

3. **Decide:**
   - If card is still valid → Manually process renewal
   - If card expired → Ask user to re-enter payment details
   - If grace period acceptable → Wait for next cron run

### Long-term Solution
Implement the complete auto-renewal workflow with:
1. SumUp payment processing
2. Membership date extension
3. Email notifications
4. Retry logic
5. Grace period handling

---

## 📝 Summary

**For User 23 (end_date: 2025-12-27):**

- ❌ **Renewal missed** because cron only checks exact date
- ⏰ **10 days overdue** (2026-01-06 - 2025-12-27)
- 💳 **Has payment method** but it was never charged
- 🔄 **Auto-renewal enabled** but ineffective for past dates

**Recommended Action:**
1. Modify cron query to include past-due memberships (7-30 day grace period)
2. Manually trigger renewal for user 23
3. Implement actual payment processing
4. Set up email notifications

**Status:** System is logging correctly but not processing payments yet. This is by design (TODO comments in code) and requires SumUp integration to complete.
