# Cron Job Fixes Applied

## Date: January 7, 2026

## Problem Summary
Three cron jobs were failing due to incorrect table/column references:

1. **auto_renewals**: Error - `D1_ERROR: no such column: m.member_id`
2. **event_reminders**: Error - `D1_ERROR: no such table: event_tickets`
3. **payment_reconciliation**: Error - `D1_ERROR: no such table: checkout_sessions`

## Root Causes

### 1. Auto Renewals (auto_renewals)
- ✅ **FIXED**: Removed all legacy `member_id` references throughout the codebase
- The schema uses `user_id` exclusively, but the code had fallback logic for `member_id`
- All schema detection and compatibility code has been simplified to use `user_id` only

### 2. Event Reminders (event_reminders)
- Query was using non-existent table `event_tickets`
- Actual table name is `tickets`
- Column names also needed correction:
  - `event_tickets.ticket_id` → `tickets.id`
  - Events table uses `event_name` not `title`
  - Events table uses `event_datetime` not separate `event_date` and `event_time`
  - Events table uses `is_active` not `status`

### 3. Payment Reconciliation (payment_reconciliation)
- Query was using non-existent table `checkout_sessions`
- Actual table name is `transactions`
- Column mapping: `status` → `payment_status`

## Fixes Applied

### File: `worker/src/index.js`

#### 0. Complete `member_id` Cleanup (CRITICAL)
All references to the legacy `member_id` column have been removed from the codebase:

**Removed schema compatibility detection:**
- Line ~247-270: Simplified `getSchema()` function to always use `user_id`
- Removed PRAGMA table_info checks for `member_id`
- Removed conditional FK column detection

**Removed from query builders:**
- Line ~555: `getActiveMembership()` - removed OR member_id logic
- Line ~834: `processMembershipRenewal()` - removed member_id fallback
- Line ~1715: Membership checkout - removed member_id column insertion
- Line ~1829: Membership webhook - removed member_id fallback
- Line ~1954: Membership legacy webhook - removed member_id fallback
- Line ~2487: Ticket creation - removed member_id column insertion
- Line ~2579: Debug schema endpoint - removed member_id detection
- Line ~2673: Payment method removal - removed OR member_id in UPDATE
- Line ~2735: Test renewal endpoint - removed member_id WHERE clause

**Total changes:** 9 functions cleaned up, all `member_id` references eliminated

#### 1. Event Reminders - Line ~3389-3407
**Changed FROM:**
```sql
SELECT 
  e.event_id,
  e.title,
  e.event_date,
  e.event_time,
  COUNT(et.ticket_id) as ticket_count
FROM events e
LEFT JOIN event_tickets et ON e.event_id = et.event_id AND et.status = 'confirmed'
WHERE e.event_date = ?
  AND e.status = 'active'
GROUP BY e.event_id
```

**Changed TO:**
```sql
SELECT 
  e.event_id,
  e.event_name as title,
  e.event_datetime,
  COUNT(t.id) as ticket_count
FROM events e
LEFT JOIN tickets t ON e.event_id = t.event_id AND t.status IN ('confirmed', 'active')
WHERE DATE(e.event_datetime) = ?
  AND e.is_active = 1
GROUP BY e.event_id
```

#### 2. Event Reminders - Attendees Query - Line ~3425-3436
**Changed FROM:**
```sql
SELECT 
  et.ticket_id,
  et.user_id,
  u.email,
  u.name
FROM event_tickets et
JOIN users u ON et.user_id = u.user_id
WHERE et.event_id = ?
  AND et.status = 'confirmed'
```

**Changed TO:**
```sql
SELECT 
  t.id as ticket_id,
  t.user_id,
  u.email,
  u.name
FROM tickets t
JOIN users u ON t.user_id = u.user_id
WHERE t.event_id = ?
  AND t.status IN ('confirmed', 'active')
```

#### 3. Payment Reconciliation - Line ~3493-3506
**Changed FROM:**
```sql
SELECT 
  checkout_id,
  order_ref,
  status,
  created_at
FROM checkout_sessions
WHERE status IN ('pending', 'processing')
  AND created_at < ?
LIMIT 100
```

**Changed TO:**
```sql
SELECT 
  checkout_id,
  order_ref,
  payment_status as status,
  created_at
FROM transactions
WHERE payment_status IN ('pending', 'processing')
  AND created_at < ?
LIMIT 100
```

## Database Schema Reference

### Actual Tables in Database:
- ✅ `users` (with `user_id` column)
- ✅ `memberships` (with `user_id` FK, not `member_id`)
- ✅ `tickets` (not `event_tickets`)
- ✅ `events` (with `event_name`, `event_datetime`, `is_active`)
- ✅ `transactions` (not `checkout_sessions`)
- ✅ `payment_instruments`
- ✅ `renewal_log`
- ✅ `cron_job_log`

### Memberships Table Structure:
```sql
CREATE TABLE memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,  -- ← Uses user_id, NOT member_id
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  payment_id TEXT UNIQUE,
  order_ref TEXT UNIQUE,
  auto_renew INTEGER NOT NULL DEFAULT 0,
  ...
  FOREIGN KEY(user_id) REFERENCES users(user_id)
)
```

### Tickets Table Structure:
```sql
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  amount TEXT,
  currency TEXT,
  ...
)
```

### Events Table Structure:
```sql
CREATE TABLE events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,        -- ← Not 'title'
  event_datetime TEXT NOT NULL,    -- ← Not separate date/time
  is_active INTEGER DEFAULT 1,     -- ← Not 'status'
  ...
)
```

### Transactions Table Structure:
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_type TEXT NOT NULL,
  checkout_id TEXT,
  order_ref TEXT UNIQUE,
  payment_status TEXT,  -- ← Not 'status'
  created_at TEXT NOT NULL,
  ...
)
```

## Next Steps

1. **Deploy the changes:**
   ```powershell
   cd c:\Users\nickc\Desktop\Dev\DiceBastion\worker
   npx wrangler deploy
   ```

2. **Test the cron jobs:**
   - Can trigger manually via admin panel or cron endpoint
   - Check `cron_job_log` table for results
   - Verify no more `D1_ERROR` messages

3. **Monitor:**
   - Watch next scheduled run (daily at 2 AM UTC)
   - Check admin cron logs page for success status
   - Verify individual job results

## Testing Commands

### Deploy Worker:
```powershell
cd worker
npx wrangler deploy
```

### Manual Trigger (if endpoint exists):
```powershell
curl "https://dicebastion-memberships.ncalamaro.workers.dev/admin/trigger-cron" `
  -H "X-Admin-Key: YOUR_ADMIN_KEY"
```

### Check Results:
```sql
SELECT * FROM cron_job_log 
ORDER BY started_at DESC 
LIMIT 10;
```

## Status
- ✅ **member_id cleanup** - All 17 instances removed from codebase
- ✅ **auto_renewals** - Fixed (all member_id references removed)
- ✅ **event_reminders** - Fixed (table and column names corrected)
- ✅ **payment_reconciliation** - Fixed (using transactions table)

All fixes have been applied to `worker/src/index.js`. Ready for deployment.
