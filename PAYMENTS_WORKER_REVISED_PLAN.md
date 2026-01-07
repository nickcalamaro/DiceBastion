# Payment Worker Refactoring - Revised Approach

## ❌ Previous Approach (Manual Creation)
- Manually created directory structure
- Created package.json, wrangler.toml manually
- **Problem**: Not using wrangler's built-in scaffolding

## ✅ Correct Approach (Using Wrangler)

### Step 1: Create Worker with Wrangler
```powershell
cd c:\Users\nickc\Desktop\Dev\DiceBastion
npx wrangler init payments-worker
```

This will:
- Create proper project structure
- Setup package.json correctly
- Generate wrangler.toml
- Install dependencies

---

## Existing Functionality to Preserve

### 📊 Current Endpoints Analysis

Based on database schema and endpoint grep, here's what the main worker currently handles:

#### 🔐 Authentication & Sessions
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /admin/login` - Admin login
- `POST /admin/logout` - Admin logout
- `GET /admin/verify` - Verify admin session

**Tables Used**: `users`, `user_sessions`, `email_preferences`

#### 🎫 Memberships
- `POST /membership/checkout` - Create membership purchase
- `GET /membership/confirm` - Confirm membership payment
- `GET /membership/status` - Check membership status
- `GET /membership/plans` - List available plans
- `POST /membership/auto-renewal/toggle` - Enable/disable auto-renewal
- `POST /membership/payment-method/remove` - Remove saved card
- `POST /membership/retry-renewal` - Manual renewal retry

**Tables Used**: `memberships`, `payment_instruments`, `renewal_log`, `transactions`, `services`

#### 🎟️ Events
- `GET /events` - List all events
- `GET /events/:slug` - Get event details
- `POST /events/:id/checkout` - Create event ticket purchase
- `GET /events/confirm` - Confirm event ticket payment
- `POST /admin/events` - Create event (admin)
- `PUT /admin/events/:id` - Update event (admin)
- `DELETE /admin/events/:id` - Delete event (admin)
- `GET /admin/cron-logs` - View cron job logs

**Tables Used**: `events`, `tickets`, `transactions`, `cron_job_log`

#### 🛒 Shop (Currently Implemented)
- Shop endpoints for products, orders, cart

**Tables Used**: `products`, `orders`, `order_items`, `cart_items`

#### 🔔 Webhooks & Payments
- `POST /webhooks/sumup` - SumUp payment webhooks

#### 🧪 Debug
- `GET /_debug/ping` - Health check
- `GET /_debug/event-confirm/:orderRef` - Debug event confirmation

---

## What Should Move to Payments Worker

### ✅ Payment Processing Only

Move ONLY the SumUp integration and payment processing:

1. **SumUp Integration Functions**
   - `sumupToken()` - OAuth
   - `getOrCreateSumUpCustomer()` - Customer management
   - `createCheckout()` - Create checkout sessions
   - `fetchPayment()` - Get payment details

2. **Payment Instrument Functions**
   - `savePaymentInstrument()` - Token storage
   - `chargePaymentInstrument()` - Recurring charges
   - `getActivePaymentInstrument()` - Get saved cards

3. **Webhook Handler**
   - `POST /webhooks/sumup` - Process SumUp webhooks
   - `verifySumUpWebhookSignature()` - Security
   - `checkAndMarkWebhookProcessed()` - Deduplication

### ⛔ What Should STAY in Main Worker

Keep ALL business logic in main worker:

1. **Membership Logic**
   - Membership activation
   - Plan selection
   - Status checks
   - Renewal scheduling

2. **Event Logic**
   - Event creation/editing (admin)
   - Ticket creation
   - Event listing
   - Capacity management

3. **Shop Logic**
   - Product management
   - Cart management
   - Order processing
   - Inventory management

4. **User Management**
   - Authentication
   - Session management
   - Email preferences
   - Admin access control

5. **Database Operations**
   - All DB writes for memberships, events, tickets, orders
   - User management
   - Transaction recording

---

## Revised Architecture

```
┌─────────────────────────────────────────┐
│      Main Worker (Business Logic)       │
│  - Memberships, Events, Shop, Users     │
│  - Admin endpoints                       │
│  - Authentication                        │
└────────────┬────────────────────────────┘
             │
             │ calls for payment operations
             ▼
┌─────────────────────────────────────────┐
│    Payments Worker (Payment Only)       │
│  - SumUp OAuth & API                     │
│  - Checkout creation                     │
│  - Payment confirmation                  │
│  - Token storage                         │
│  - Webhooks                              │
└─────────────────────────────────────────┘
             │
             │ calls
             ▼
       ┌──────────┐
       │  SumUp   │
       └──────────┘
```

---

## Payments Worker API (Simplified)

### Internal Endpoints (Called by Main Worker)

```javascript
// 1. Create SumUp checkout
POST /checkout
Headers: X-Internal-Secret
Body: {
  amount: number,
  currency: string,
  orderRef: string,
  description: string,
  email: string,
  name: string,
  savePaymentInstrument: boolean,
  customerId?: string
}
Response: { checkoutId, customerId }

// 2. Verify payment
GET /verify/:checkoutId
Headers: X-Internal-Secret
Response: { status, paymentId, amount, cardLast4?, ... }

// 3. Charge saved instrument
POST /charge
Headers: X-Internal-Secret
Body: {
  userId: number,
  instrumentId: string,
  amount: number,
  currency: string,
  orderRef: string,
  description: string
}
Response: { paymentId, status, ... }

// 4. Get payment instruments
GET /instruments/:userId
Headers: X-Internal-Secret
Response: [{ instrumentId, cardType, last4, ... }]
```

### Public Endpoints

```javascript
// Webhook from SumUp
POST /webhooks/sumup
Headers: X-Sumup-Signature
Body: { ... webhook payload ... }
```

---

## Database Access Strategy

### ✅ Recommended: Shared D1 Database

**Both workers access same database:**
- Main worker: Full access (reads & writes all tables)
- Payments worker: Limited access (only `payment_instruments` writes)

**Payments Worker DB Operations:**
- ✅ READ: `users` (for customer creation)
- ✅ WRITE: `payment_instruments` (save tokens)
- ❌ NO ACCESS: `memberships`, `events`, `tickets`, `orders`

**Main Worker Handles:**
- Creating transaction records
- Updating membership status
- Creating tickets
- All business logic DB operations

---

## Migration Strategy (Revised)

### Phase 1: Create Payments Worker with Wrangler ✅
```powershell
npx wrangler init payments-worker
cd payments-worker
npm install hono
```

### Phase 2: Extract ONLY SumUp Integration
1. Copy SumUp functions to payments worker
2. Create minimal API endpoints
3. **Keep everything else in main worker**

### Phase 3: Update Main Worker to Call Payments Worker
```javascript
// BEFORE (in main worker)
const checkout = await createCheckout(env, { ... })

// AFTER (in main worker)
const checkout = await fetch(`${env.PAYMENTS_WORKER_URL}/checkout`, {
  method: 'POST',
  headers: {
    'X-Internal-Secret': env.INTERNAL_SECRET,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ... })
}).then(r => r.json())

// Main worker still handles the business logic:
// - Create membership record
// - Update user
// - Send emails
// - etc.
```

### Phase 4: Test Each Flow
1. Membership purchase
2. Event ticket purchase
3. Shop order (if implemented)
4. Auto-renewal
5. Webhooks

---

## Database Schema Considerations

Based on `Database_Schema.md`:

### Tables Used by Payments
```sql
-- Payment instruments (managed by payments worker)
payment_instruments (
  id, user_id, instrument_id, card_type, last_4,
  expiry_month, expiry_year, created_at, updated_at, is_active
)

-- Users (read-only by payments worker for SumUp customer creation)
users (
  user_id, email, name, created_at, ...
)
```

### Tables Managed by Main Worker
```sql
-- Memberships
memberships (
  id, user_id, plan, status, start_date, end_date,
  payment_id, order_ref, auto_renew, payment_instrument_id,
  renewal_failed_at, renewal_attempts, ...
)

-- Renewal tracking
renewal_log (
  id, membership_id, attempt_date, status,
  payment_id, error_message, amount, currency
)

-- Events
events (
  event_id, event_name, description, event_datetime,
  location, membership_price, non_membership_price,
  capacity, tickets_sold, is_recurring, ...
)

-- Tickets
tickets (
  id, event_id, user_id, status,
  amount, currency, payment_status, ...
)

-- Shop
products (...), orders (...), order_items (...), cart_items (...)

-- All transactions (managed by main worker)
transactions (
  id, transaction_type, reference_id, user_id,
  email, name, order_ref, checkout_id, payment_id,
  amount, currency, payment_status, ...
)

-- Email tracking
email_history (...), email_preferences (...)

-- Cron jobs
cron_job_log (...)
```

---

## Benefits of This Approach

1. **Minimal Disruption**: Main worker keeps all business logic
2. **Clear Separation**: Payments worker is ONLY for SumUp integration
3. **Database Simplicity**: Shared database, no sync issues
4. **Easier Testing**: Can test payment worker independently
5. **Code Reuse**: No duplicate SumUp integration across endpoints

---

## Next Steps

1. ✅ Delete manually created `payments-worker/` directory
2. ✅ Use `wrangler init payments-worker` to create properly
3. ✅ Extract SumUp functions
4. ✅ Create minimal payment API
5. ✅ Update main worker to call payment API
6. ✅ Test thoroughly
7. ✅ Deploy both workers

---

**Ready to proceed with wrangler init?**

Say "yes" and I'll:
1. Remove the manual directory
2. Run `wrangler init payments-worker`
3. Create the proper structure
