# Auto-Renewal API Testing Quick Reference

## Test Environment

**Worker URL:** `https://dicebastion-memberships.ncalamaro.workers.dev`
**Frontend:** `https://dicebastion.com`

---

## Endpoints for Testing

### 1. Create Membership with Auto-Renewal

**Endpoint:** `POST /api/membership-checkout`

**Request:**
```json
{
  "email": "test@example.com",
  "name": "Test User",
  "plan": "monthly",
  "autoRenew": true,
  "consent": true,
  "consentDate": "2026-01-07T12:00:00Z"
}
```

**Response:**
```json
{
  "checkoutId": "co_123456789",
  "orderRef": "MEMBER-123-uuid",
  "amount": 5.00,
  "currency": "GBP",
  "customerId": "USER-123",
  "membershipId": 123
}
```

**What Happens:**
- ✅ User created/found in database
- ✅ Membership record created with `auto_renew = 1`
- ✅ SumUp customer created (if auto-renew enabled)
- ✅ Checkout created with `purpose: SETUP_RECURRING_PAYMENT`
- ✅ Returns checkout ID for SumUp widget

---

### 2. Webhook Handler (Auto-called by SumUp)

**Endpoint:** `POST /api/membership-webhook`

**Called automatically by SumUp when payment completes**

**What Happens:**
- ✅ Verifies payment status
- ✅ Activates membership
- ✅ Saves payment instrument (if auto-renew enabled)
- ✅ Creates transaction record
- ✅ Sends welcome email

---

### 3. Manual Renewal (Force Renewal Now)

**Endpoint:** `POST /api/admin/force-renewal`

**Headers:**
```
X-Admin-Key: YOUR_ADMIN_KEY
Content-Type: application/json
```

**Request:**
```json
{
  "membershipId": 123
}
```

**Response (Success):**
```json
{
  "success": true,
  "membershipId": 123,
  "newEndDate": "2026-02-07T12:00:00Z",
  "paymentId": "pay_xyz",
  "message": "Membership renewed successfully"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "no_instrument",
  "attempts": 1,
  "token_error": false
}
```

**What Happens:**
- ✅ Fetches saved payment instrument
- ✅ Charges card using SumUp token
- ✅ Extends membership end_date
- ✅ Logs renewal attempt
- ✅ Creates transaction record
- ✅ Sends renewal success/failure email

---

### 4. Test Renewal (Dry Run - No Charge)

**Endpoint:** `POST /api/test-renewal`

**Headers:**
```
X-Admin-Key: YOUR_ADMIN_KEY
Content-Type: application/json
```

**Request:**
```json
{
  "membershipId": 123,
  "dryRun": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dry run - would renew membership",
  "membership": { /* membership data */ },
  "instrument": { /* payment instrument data */ },
  "wouldCharge": {
    "amount": 5.00,
    "currency": "GBP"
  }
}
```

---

### 5. Get User Membership Details

**Endpoint:** `GET /api/membership-status`

**Headers:**
```
X-Session-Token: user_session_token
```

**Response:**
```json
{
  "membership": {
    "id": 123,
    "plan": "monthly",
    "status": "active",
    "startDate": "2026-01-07T12:00:00Z",
    "endDate": "2026-02-07T12:00:00Z",
    "autoRenew": true,
    "paymentInstrumentId": "tok_123"
  },
  "paymentInstrument": {
    "cardType": "VISA",
    "last4": "1234",
    "expiryMonth": 12,
    "expiryYear": 2027
  }
}
```

---

### 6. Disable Auto-Renewal

**Endpoint:** `POST /api/membership-auto-renew`

**Headers:**
```
X-Session-Token: user_session_token
Content-Type: application/json
```

**Request:**
```json
{
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "autoRenew": false
}
```

---

## cURL Examples

### Create Membership with Auto-Renewal
```bash
curl -X POST https://dicebastion-memberships.ncalamaro.workers.dev/membership/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "plan": "monthly",
    "autoRenew": true,
    "consent": true,
    "consentDate": "2026-01-07T12:00:00Z"
  }'
```

### Force Renewal (WILL CHARGE CARD!)
```bash
curl -X POST https://dicebastion-memberships.ncalamaro.workers.dev/admin/force-renewal \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "membershipId": 123
  }'
```

### Test Renewal (Dry Run - Safe)
```bash
curl -X POST https://dicebastion-memberships.ncalamaro.workers.dev/test/renewal \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "membershipId": 123,
    "dryRun": true
  }'
```

---

## Database Queries for Verification

### Check Membership Created
```sql
SELECT * FROM memberships 
WHERE email = 'test@example.com' 
ORDER BY created_at DESC 
LIMIT 1;
```

### Check Payment Instrument Saved
```sql
SELECT pi.* 
FROM payment_instruments pi
JOIN memberships m ON pi.user_id = m.user_id
WHERE m.email = 'test@example.com'
  AND pi.is_active = 1;
```

### Check Renewal Log
```sql
SELECT rl.*, m.email, m.plan
FROM renewal_log rl
JOIN memberships m ON rl.membership_id = m.id
WHERE m.email = 'test@example.com'
ORDER BY rl.attempt_date DESC;
```

### Check Transactions
```sql
SELECT * FROM transactions
WHERE email = 'test@example.com'
ORDER BY created_at DESC;
```

---

## Expected Flow

### Initial Purchase with Auto-Renewal

1. **Frontend:** User fills form, checks "Enable auto-renewal"
2. **API Call:** `POST /api/membership-checkout`
   - Creates user (if new)
   - Creates SumUp customer (`USER-{id}`)
   - Creates membership with `auto_renew = 1`
   - Creates checkout with `purpose: SETUP_RECURRING_PAYMENT`
3. **SumUp Widget:** User enters card details
4. **Payment:** SumUp processes payment
5. **Webhook:** `POST /api/membership-webhook`
   - Verifies payment
   - Activates membership
   - Calls `savePaymentInstrument()`
   - Saves token to `payment_instruments` table
   - Links instrument to membership
6. **Email:** Welcome email sent
7. **Database:** All records created

### Automatic Renewal (Cron Job)

1. **Cron Job:** Runs daily at configured time
2. **Query:** Find memberships expiring in 3 days with `auto_renew = 1`
3. **For Each:**
   - Check for active payment instrument
   - Call `processMembershipRenewal()`
   - Charge card using saved token
   - Extend membership if successful
   - Send email notification
   - Log result

### Manual Renewal Test

1. **API Call:** `POST /api/admin/force-renewal`
2. **Process:** Same as cron but for single membership
3. **Verify:** Check database for extended `end_date`

---

## Success Indicators

✅ **After Initial Purchase:**
- Membership record exists with `auto_renew = 1`
- Payment instrument saved with `is_active = 1`
- `payment_instrument_id` in membership matches saved instrument
- Transaction record created
- Welcome email received

✅ **After Manual Renewal:**
- `end_date` extended by plan duration
- New transaction created with `type = 'renewal'`
- Renewal log entry with `status = 'success'`
- Renewal success email received

✅ **After Cron Run:**
- Cron job log shows `status = 'completed'`
- Multiple memberships renewed (if applicable)
- No error messages in logs

---

## Troubleshooting

### Token Not Saved
**Check:**
- `purpose: SETUP_RECURRING_PAYMENT` in checkout creation
- `customerId` was provided
- `savePaymentInstrument` flag was true
- Webhook was called (check logs)

### Renewal Fails
**Check:**
- Payment instrument exists and `is_active = 1`
- Token hasn't expired (30 days)
- Customer exists in SumUp
- Sufficient funds on card

### Customer Not Found
**Solution:**
- `chargePaymentInstrument` now auto-creates customers
- Check Cloudflare logs for customer creation
- Verify user exists in database

---

## Next Steps

1. ✅ Open `test-auto-renewal-purchase.html` in browser
2. ✅ Fill in test details
3. ✅ Complete payment with your card
4. ✅ Verify token saved in database
5. ✅ Test manual renewal endpoint
6. ✅ Monitor cron job execution
7. 🚀 Go live!
