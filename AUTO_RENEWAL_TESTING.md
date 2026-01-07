# Auto-Renewal Testing Guide 🧪

Quick guide for testing the complete auto-renewal system.

---

## 🎯 Test User ID 23 (Grace Period Recovery)

### Current State
- **User ID:** 23
- **End Date:** 2025-12-27 (10 days ago)
- **Auto-Renew:** Enabled
- **Current Date:** 2026-01-06

### Test Steps

**1. Verify Current State**
```sql
SELECT 
  id,
  user_id,
  plan,
  end_date,
  auto_renew,
  status,
  renewal_attempts,
  renewal_failed_at
FROM memberships
WHERE user_id = 23;
```

**2. Check Payment Instrument**
```sql
SELECT 
  user_id,
  instrument_id,
  card_type,
  last_4,
  is_active
FROM payment_instruments
WHERE user_id = 23;
```

**Expected:** Should have an active payment instrument.

**3. Manually Trigger Renewal (via test endpoint)**
```bash
curl "https://dicebastion-memberships.ncalamaro.workers.dev/test/renew-user?email=USER23_EMAIL"
```

Replace `USER23_EMAIL` with actual email from:
```sql
SELECT email FROM users WHERE user_id = 23;
```

**4. Verify Renewal Results**
```sql
-- Check if end_date was extended
SELECT 
  id,
  end_date,  -- Should now be ~2026-01-27
  renewal_attempts,  -- Should be 0 on success
  status
FROM memberships
WHERE user_id = 23;

-- Check renewal log
SELECT *
FROM renewal_log
WHERE membership_id = (SELECT id FROM memberships WHERE user_id = 23)
ORDER BY attempt_date DESC
LIMIT 1;

-- Check transaction record
SELECT *
FROM transactions
WHERE transaction_type = 'renewal'
  AND user_id = 23
ORDER BY created_at DESC
LIMIT 1;

-- Check email sent
SELECT *
FROM email_history
WHERE recipient_email = (SELECT email FROM users WHERE user_id = 23)
  AND email_type = 'membership_renewal_success'
ORDER BY sent_at DESC
LIMIT 1;
```

---

## 📧 Test Warning Emails

### Setup
```sql
-- Create or update a membership expiring in 7 days
UPDATE memberships
SET end_date = DATE('now', '+7 days'),
    renewal_warning_sent = 0,
    auto_renew = 1,
    status = 'active'
WHERE user_id = YOUR_TEST_USER_ID;
```

### Trigger Cron
Wait for next cron run at 2:00 AM UTC, or manually trigger in Cloudflare dashboard.

### Verify
```sql
-- Check if warning was sent
SELECT *
FROM email_history
WHERE recipient_email = 'test@example.com'
  AND email_type = 'membership_renewal_reminder'
ORDER BY sent_at DESC
LIMIT 1;

-- Check flag was set
SELECT renewal_warning_sent
FROM memberships
WHERE user_id = YOUR_TEST_USER_ID;
-- Should be 1
```

---

## ❌ Test Failed Renewal

### Setup
```sql
-- Deactivate payment instrument to force failure
UPDATE payment_instruments
SET is_active = 0
WHERE user_id = YOUR_TEST_USER_ID;

-- Set membership to expire today
UPDATE memberships
SET end_date = DATE('now'),
    auto_renew = 1,
    status = 'active',
    renewal_attempts = 0
WHERE user_id = YOUR_TEST_USER_ID;
```

### Trigger Renewal
```bash
curl "https://dicebastion-memberships.ncalamaro.workers.dev/test/renew-user?email=TEST_EMAIL"
```

### Verify Failure
```sql
-- Check renewal attempts incremented
SELECT renewal_attempts, renewal_failed_at
FROM memberships
WHERE user_id = YOUR_TEST_USER_ID;
-- Should be 1

-- Check renewal log
SELECT status, error_message
FROM renewal_log
WHERE membership_id = (SELECT id FROM memberships WHERE user_id = YOUR_TEST_USER_ID)
ORDER BY attempt_date DESC
LIMIT 1;
-- Status should be 'failed'
-- Error should be 'No active payment instrument'

-- Check failure email sent
SELECT *
FROM email_history
WHERE recipient_email = 'test@example.com'
  AND email_type = 'membership_renewal_failed'
ORDER BY sent_at DESC
LIMIT 1;
```

---

## 💀 Test Expiration After Grace Period

### Setup
```sql
-- Set membership beyond grace period with 3 failed attempts
UPDATE memberships
SET end_date = DATE('now', '-35 days'),
    auto_renew = 1,
    status = 'active',
    renewal_attempts = 3
WHERE user_id = YOUR_TEST_USER_ID;
```

### Trigger Cron
Wait for cron or manually trigger.

### Verify Expiration
```sql
SELECT status
FROM memberships
WHERE user_id = YOUR_TEST_USER_ID;
-- Should be 'expired'
```

---

## 🔍 Check Cron Logs

### View Recent Runs
```sql
SELECT 
  log_id,
  job_name,
  started_at,
  completed_at,
  status,
  records_processed,
  records_succeeded,
  records_failed,
  details
FROM cron_job_log
WHERE job_name = 'auto_renewals'
ORDER BY started_at DESC
LIMIT 5;
```

### Parse Details JSON
```sql
SELECT 
  json_extract(details, '$.warnings_sent') as warnings_sent,
  json_extract(details, '$.expired_count') as expired_count,
  json_extract(details, '$.errors') as errors
FROM cron_job_log
WHERE job_name = 'auto_renewals'
ORDER BY started_at DESC
LIMIT 1;
```

---

## 🌐 Admin Dashboard Testing

1. Navigate to: https://dicebastion.com/admin
2. Click **Cron Jobs** tab
3. View summary cards showing:
   - Total runs
   - Success rate
   - Recent errors
4. Filter by `auto_renewals` job
5. Click on a log to see details

---

## 🧹 Cleanup After Testing

```sql
-- Re-enable payment instrument
UPDATE payment_instruments
SET is_active = 1
WHERE user_id = YOUR_TEST_USER_ID;

-- Reset membership to normal state
UPDATE memberships
SET end_date = DATE('now', '+30 days'),
    renewal_attempts = 0,
    renewal_failed_at = NULL,
    renewal_warning_sent = 0,
    auto_renew = 1,
    status = 'active'
WHERE user_id = YOUR_TEST_USER_ID;
```

---

## 📊 Success Criteria

### ✅ Warning Emails
- [ ] Email sent 7 days before expiration
- [ ] Email contains correct renewal date
- [ ] Email shows payment method (last 4 digits)
- [ ] `renewal_warning_sent` flag set to 1

### ✅ Successful Renewal
- [ ] Payment charged via SumUp
- [ ] `end_date` extended by plan duration
- [ ] Transaction record created
- [ ] Success email sent
- [ ] `renewal_attempts` reset to 0
- [ ] `renewal_warning_sent` reset to 0

### ✅ Failed Renewal
- [ ] `renewal_attempts` incremented
- [ ] `renewal_failed_at` timestamp updated
- [ ] Failure email sent with attempt number
- [ ] Renewal logged in `renewal_log` table
- [ ] After 3rd failure: `auto_renew` set to 0
- [ ] Final failure email sent

### ✅ Grace Period
- [ ] Memberships up to 30 days past due are processed
- [ ] Successful renewals extend from original `end_date`
- [ ] Failed renewals continue retry logic

### ✅ Expiration
- [ ] Memberships > 30 days past due marked 'expired'
- [ ] Only affects non-renewing or 3x-failed memberships
- [ ] Active renewals NOT expired during grace period

### ✅ Logging
- [ ] All activities logged to `cron_job_log`
- [ ] Details include warnings_sent, expired_count
- [ ] Errors captured with membership_id and details
- [ ] Admin UI displays logs correctly

---

## 🚀 Quick Test Command

```bash
# Test the complete flow for a specific user
curl -X GET "https://dicebastion-memberships.ncalamaro.workers.dev/test/renew-user?email=your_test_email@example.com"
```

Response should indicate success/failure and show renewal details.

---

**Pro Tip:** Use a test email service (like Mailinator or temp-mail.org) to verify email delivery without cluttering your inbox.

**Next Steps:** Once testing is complete, monitor the first few real cron runs at 2:00 AM UTC to ensure production stability.
