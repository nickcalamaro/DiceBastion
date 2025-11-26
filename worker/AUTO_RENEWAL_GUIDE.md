# Auto-Renewal Implementation Guide

## Overview

This implementation adds automatic membership renewal using SumUp's `payment_instruments` scope. Members who purchase a membership will automatically have their payment method saved (with consent) and their membership will auto-renew before expiration.

## Key Features

1. **Automatic Payment Instrument Saving**: When a member completes their first purchase, their payment method is securely saved via SumUp
2. **Daily Cron Job**: Checks for memberships expiring in the next 7 days and processes renewals
3. **Retry Logic**: Failed renewals are retried up to 3 times
4. **User Control**: Members can view their saved payment method and toggle auto-renewal on/off
5. **Audit Trail**: All renewal attempts are logged in the `renewal_log` table

## Database Schema Changes

### New Columns in `memberships` Table
- `auto_renewal_enabled` (INTEGER): 1 if auto-renewal is enabled, 0 if disabled (default: 1)
- `payment_instrument_id` (TEXT): SumUp payment instrument token
- `renewal_failed_at` (TEXT): Timestamp of last failed renewal attempt
- `renewal_attempts` (INTEGER): Counter for failed renewal attempts (max 3)

### New Tables

#### `payment_instruments`
```sql
CREATE TABLE payment_instruments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  instrument_id TEXT NOT NULL,
  card_type TEXT,
  last_4 TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  UNIQUE(user_id, instrument_id)
)
```

#### `renewal_log`
```sql
CREATE TABLE renewal_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membership_id INTEGER NOT NULL,
  attempt_date TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_id TEXT,
  error_message TEXT,
  amount TEXT,
  currency TEXT
)
```

## New API Endpoints

### 1. Get Auto-Renewal Status
**GET** `/membership/auto-renewal?email=user@example.com`

Response:
```json
{
  "enabled": true,
  "hasPaymentMethod": true,
  "paymentMethod": {
    "cardType": "VISA",
    "last4": "4242",
    "expiryMonth": 12,
    "expiryYear": 2025
  },
  "membershipEndDate": "2025-12-31T00:00:00.000Z",
  "plan": "annual"
}
```

### 2. Toggle Auto-Renewal
**POST** `/membership/auto-renewal/toggle`

Request body:
```json
{
  "email": "user@example.com",
  "enabled": false
}
```

Response:
```json
{
  "ok": true,
  "enabled": false
}
```

### 3. Remove Payment Method
**POST** `/membership/payment-method/remove`

Request body:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "ok": true
}
```

## Configuration

### Required SumUp OAuth Scopes
Update your SumUp OAuth application to include:
- `payments` (existing)
- `payment_instruments` (new)

### Cron Schedule
The renewal job runs daily at 2:00 AM UTC. You can adjust this in `wrangler.toml`:
```toml
[triggers]
crons = ["0 2 * * *"]  # Format: minute hour day month day-of-week
```

## How It Works

### Initial Purchase Flow
1. User purchases membership
2. Payment is processed via SumUp
3. On successful payment confirmation, the payment instrument is saved
4. Membership is activated with `auto_renewal_enabled = 1`

### Renewal Flow
1. Daily cron job identifies memberships expiring within 7 days
2. For each membership with auto-renewal enabled:
   - Retrieves saved payment instrument
   - Creates a new checkout with the saved instrument
   - On success: Extends membership end date
   - On failure: Logs error, increments retry counter
3. After 3 failed attempts, automatic retry stops (manual intervention required)

### Renewal Window
- Renewals are attempted for memberships expiring in the next 7 days
- This provides a grace period for failed payments
- Users receive their full membership period even if renewal happens early

## Frontend Integration Examples

### Display Auto-Renewal Status
```javascript
async function checkAutoRenewal(email) {
  const response = await fetch(
    `${API_BASE}/membership/auto-renewal?email=${encodeURIComponent(email)}`
  );
  const data = await response.json();
  
  if (data.enabled && data.hasPaymentMethod) {
    console.log(`Auto-renewal enabled. Card: ${data.paymentMethod.cardType} ****${data.paymentMethod.last4}`);
  }
}
```

### Toggle Auto-Renewal
```javascript
async function toggleAutoRenewal(email, enabled) {
  const response = await fetch(`${API_BASE}/membership/auto-renewal/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, enabled })
  });
  
  const data = await response.json();
  return data.ok;
}
```

### Remove Payment Method
```javascript
async function removePaymentMethod(email) {
  const response = await fetch(`${API_BASE}/membership/payment-method/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const data = await response.json();
  return data.ok;
}
```

## Testing

### Local Testing

1. **Test payment instrument saving**:
   - Complete a membership purchase locally
   - Check `payment_instruments` table for saved card

2. **Test renewal processing**:
   - Manually trigger the cron job:
     ```bash
     wrangler dev --test-scheduled
     ```
   - Or use the Cloudflare dashboard to trigger scheduled events

3. **Test API endpoints**:
   ```bash
   # Check status
   curl "http://localhost:8787/membership/auto-renewal?email=test@example.com"
   
   # Toggle renewal
   curl -X POST http://localhost:8787/membership/auto-renewal/toggle \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","enabled":false}'
   ```

### Production Testing

1. Create a test membership with a short expiration (e.g., 1 day)
2. Wait for the cron job to run or manually trigger it
3. Verify renewal in the `renewal_log` table
4. Check that the membership `end_date` was extended

## Monitoring & Logging

### Check Renewal Logs
```sql
SELECT 
  rl.*, 
  m.plan, 
  u.email
FROM renewal_log rl
JOIN memberships m ON rl.membership_id = m.id
JOIN users u ON m.user_id = u.id
ORDER BY rl.attempt_date DESC
LIMIT 50;
```

### Check Failed Renewals
```sql
SELECT 
  m.*, 
  u.email
FROM memberships m
JOIN users u ON m.user_id = u.id
WHERE m.status = 'active'
  AND m.auto_renewal_enabled = 1
  AND m.renewal_attempts >= 3
  AND m.end_date < datetime('now', '+7 days');
```

## Security Considerations

1. **PCI Compliance**: Payment instruments are stored by SumUp, not in your database. Only tokens are stored.
2. **User Consent**: Payment instrument saving requires user consent (via privacy policy acceptance).
3. **Data Access**: Implement proper authentication before allowing users to view/modify auto-renewal settings.
4. **API Rate Limiting**: Consider adding rate limiting to auto-renewal endpoints.

## Troubleshooting

### Renewals Not Processing
1. Check cron trigger is configured: `wrangler tail --format=pretty`
2. Verify SumUp OAuth has `payment_instruments` scope
3. Check `renewal_log` for error messages

### Payment Instrument Not Saved
1. Ensure checkout was completed successfully
2. Verify payment includes `payment_instrument` in response
3. Check SumUp API credentials have correct scope

### Failed Renewals
Common reasons:
- Expired card
- Insufficient funds
- Card reported lost/stolen
- Payment instrument token expired

## Next Steps

1. **Email Notifications**: Add email sending for:
   - Successful renewals
   - Failed renewal attempts
   - Card expiring soon warnings

2. **Grace Period**: Add a grace period after expiration before deactivating membership

3. **Proactive Card Update**: Notify users before their card expires

4. **Admin Dashboard**: Build an admin interface to:
   - View renewal statistics
   - Manually process failed renewals
   - Manage problematic accounts

## Support

For issues or questions:
1. Check the `renewal_log` table for detailed error messages
2. Review Cloudflare Workers logs
3. Verify SumUp API status: https://status.sumup.com
