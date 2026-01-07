# Payments Worker Refactoring Plan

## Current State Analysis

### Payment Endpoints in Main Worker (index.js)

#### 🎫 **Membership Payments**
1. `POST /membership/checkout` (line 1864)
   - Creates SumUp checkout for membership purchase
   - Handles auto-renewal setup (tokenization)
   - Supports custom amounts for testing
   - Rate limited (3 req/min)
   - **Uses**: `createCheckout()`, `getOrCreateSumUpCustomer()`

2. `GET /membership/confirm` (line ~2050)
   - Confirms payment via orderRef
   - Saves payment instrument token
   - Activates membership
   - **Uses**: `fetchPayment()`, `savePaymentInstrument()`, `chargePaymentInstrument()`

3. `POST /membership/auto-renewal/toggle` (line 2955)
   - Enable/disable auto-renewal
   - Requires session auth

4. `POST /membership/payment-method/remove` (line 2978)
   - Remove saved payment method
   - Deactivates payment instrument

5. `POST /membership/retry-renewal` (line 3001)
   - Manual renewal retry
   - Charges saved instrument

#### 🎟️ **Event Ticket Payments**
1. `POST /events/:id/checkout` (line 2748)
   - Creates checkout for event ticket
   - Rate limited (5 req/min)
   - **Uses**: `createCheckout()`

2. `GET /events/:id/confirm` (line ~2850)
   - Confirms ticket payment
   - Creates ticket record
   - **Uses**: `fetchPayment()`

#### 🛒 **Shop Payments** (if implemented)
- Not found in current grep results
- May need to check for shop endpoints

#### 🔔 **Webhooks**
1. `POST /webhooks/sumup` (line 2224)
   - Handles SumUp payment webhooks
   - Signature verification
   - Duplicate prevention
   - Updates payment status

---

## Payment Helper Functions

### Core SumUp Integration
Located in `index.js` around lines 600-900:

1. `sumupToken(env, scopes)` - Get OAuth token
2. `getOrCreateSumUpCustomer(env, user)` - Customer management
3. `createCheckout(env, {...})` - Create checkout session
4. `fetchPayment(env, paymentId)` - Get payment details
5. `savePaymentInstrument(db, userId, checkoutId, env)` - Token storage
6. `chargePaymentInstrument(env, userId, instrumentId, ...)` - Recurring charge
7. `getActivePaymentInstrument(db, userId)` - Get saved card

### Supporting Functions
8. `processMembershipRenewal(db, membership, env)` - Renewal logic
9. `verifySumUpWebhookSignature(payload, signature, secret)` - Security
10. `checkAndMarkWebhookProcessed(db, webhookId, ...)` - Deduplication

---

## Proposed Architecture

### New Structure
```
DiceBastion/
├── wrangler.toml (main worker)
├── worker/ (main membership/events worker)
│   └── src/
│       └── index.js (NO payment logic)
│
└── payments-worker/ (NEW!)
    ├── wrangler.toml
    ├── package.json
    ├── .dev.vars
    │
    └── src/
        ├── index.js (main router ~200 lines)
        │
        ├── config/
        │   └── constants.js
        │
        ├── middleware/
        │   ├── cors.js
        │   ├── auth.js (session validation)
        │   └── rate-limit.js
        │
        ├── integrations/
        │   ├── sumup.js (OAuth, API calls)
        │   └── database.js (D1 queries)
        │
        ├── services/
        │   ├── checkout.js (create checkout)
        │   ├── confirmation.js (confirm payments)
        │   ├── instruments.js (tokenization)
        │   ├── renewals.js (recurring charges)
        │   └── webhooks.js (webhook handling)
        │
        ├── routes/
        │   ├── membership.js
        │   ├── events.js
        │   ├── shop.js (future)
        │   └── webhooks.js
        │
        └── utils/
            ├── validation.js
            └── helpers.js
```

---

## Payments Worker API Design

### Unified Payment Endpoints

#### 1. Create Checkout
```
POST /checkout
Body: {
  type: 'membership' | 'event' | 'shop',
  referenceId: number,
  email: string,
  name: string,
  amount: number,
  currency: string,
  description: string,
  savePaymentInstrument?: boolean,
  metadata?: object
}
Response: {
  checkoutId: string,
  orderRef: string,
  customerId?: string
}
```

#### 2. Confirm Payment
```
GET /confirm/:orderRef
Response: {
  ok: boolean,
  status: string,
  paymentId: string,
  amount: number,
  currency: string,
  cardLast4?: string,
  metadata: object
}
```

#### 3. Manage Payment Instruments
```
GET /instruments/:userId
POST /instruments/:userId/charge
DELETE /instruments/:userId/:instrumentId
```

#### 4. Webhooks
```
POST /webhooks/sumup
```

---

## Migration Strategy

### Phase 1: Create Payments Worker Scaffolding ✅
1. Create `/payments-worker/` directory
2. Setup `wrangler.toml` with D1 binding
3. Create `package.json`
4. Setup basic Hono app structure

### Phase 2: Extract Core Functions 🔄
1. Copy SumUp integration functions
2. Copy payment instrument functions
3. Copy webhook handlers
4. Create unified service layer

### Phase 3: Create Unified Endpoints 🔄
1. Implement `POST /checkout` (handles all types)
2. Implement `GET /confirm/:orderRef`
3. Implement instrument management
4. Implement webhooks

### Phase 4: Update Main Worker 🔄
1. Replace payment calls with fetch to payments worker
2. Keep business logic (membership activation, ticket creation)
3. Remove duplicate SumUp code

### Phase 5: Test & Deploy ✅
1. Test membership purchases
2. Test event tickets
3. Test auto-renewal
4. Test webhooks
5. Deploy both workers

---

## Benefits

### 1. **Separation of Concerns**
- Main worker: Business logic (memberships, events, users)
- Payments worker: Payment processing only

### 2. **Code Reuse**
- Single checkout endpoint for all payment types
- DRY: No duplicate SumUp integration code

### 3. **Security**
- Payment secrets isolated in payments worker
- Easier to audit payment code

### 4. **Scalability**
- Can scale payments worker independently
- Rate limiting specific to payments

### 5. **Maintainability**
- Smaller, focused codebase
- Easier to test payment logic
- Clear API boundaries

---

## Example: Before & After

### Before (Main Worker)
```javascript
// Duplicate checkout logic in 3 places
app.post('/membership/checkout', async (c) => {
  // 100+ lines of SumUp integration
  const checkout = await createCheckout(...)
  // Save to DB
})

app.post('/events/:id/checkout', async (c) => {
  // 100+ lines of SAME SumUp integration
  const checkout = await createCheckout(...)
  // Save to DB
})
```

### After (Main Worker)
```javascript
app.post('/membership/checkout', async (c) => {
  // Call payments worker
  const payment = await fetch(`${PAYMENTS_WORKER_URL}/checkout`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'membership',
      referenceId: membership.id,
      ...
    })
  })
  // Save orderRef to DB
})
```

### After (Payments Worker)
```javascript
app.post('/checkout', async (c) => {
  const { type, referenceId, ...details } = await c.req.json()
  
  // Single unified checkout logic
  const checkout = await checkoutService.create(details)
  
  return c.json({ checkoutId: checkout.id, orderRef: checkout.checkout_reference })
})
```

---

## Database Strategy

### Option A: Shared D1 Database (Recommended)
- Both workers use same D1 database
- Add binding in payments worker wrangler.toml
- No data duplication
- **Pro**: Simple, consistent data
- **Con**: Workers coupled by DB schema

### Option B: Separate Tables
- Payments worker has own tables in same DB
- Main worker has `payment_references` table
- **Pro**: Clear boundaries
- **Con**: More complex queries

### Option C: Service-to-Service Calls
- Payments worker doesn't touch main DB
- Main worker calls payments worker for all payment data
- **Pro**: True microservice
- **Con**: More network calls, latency

**Recommendation**: Option A (Shared DB) for simplicity

---

## Security Considerations

### 1. Worker-to-Worker Authentication
Add shared secret for internal calls:

```javascript
// payments-worker/src/middleware/auth.js
export async function requireInternalAuth(c, next) {
  const secret = c.req.header('X-Internal-Secret')
  if (secret !== c.env.INTERNAL_SECRET) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  await next()
}
```

### 2. CORS Configuration
- Payments worker: Only accept from main worker domain
- Public endpoints: `/webhooks/sumup` (from SumUp)

### 3. Rate Limiting
- Per-IP rate limiting on all public endpoints
- No rate limiting on internal endpoints (already rate-limited by main worker)

---

## Deployment Configuration

### Payments Worker wrangler.toml
```toml
name = "dicebastion-payments"
main = "src/index.js"
compatibility_date = "2024-10-23"
compatibility_flags = ["nodejs_compat"]

# Shared D1 Database
[[d1_databases]]
binding = "DB"
database_name = "dicebastion"
database_id = "9abc9bae-236a-4237-aa88-78cf161ba9d1"

[vars]
ALLOWED_ORIGIN = "https://dicebastion-memberships.ncalamaro.workers.dev"
CURRENCY = "GBP"

# Secrets (same as main worker)
# - SUMUP_CLIENT_ID
# - SUMUP_CLIENT_SECRET
# - INTERNAL_SECRET (new!)
```

---

## Testing Strategy

### 1. Unit Tests
- Test SumUp integration functions
- Test checkout service
- Test instrument management

### 2. Integration Tests
- Test main worker → payments worker flow
- Test webhook processing

### 3. End-to-End Tests
- Complete membership purchase
- Complete event ticket purchase
- Auto-renewal flow
- Webhook delivery

---

## Rollout Plan

### Week 1: Setup & Core Functions
- Create payments worker structure
- Extract SumUp integration
- Test basic checkout

### Week 2: Unified Endpoints
- Implement unified checkout API
- Implement confirmation endpoint
- Test with memberships

### Week 3: Integration
- Update main worker to call payments worker
- Test event tickets
- Test auto-renewal

### Week 4: Production
- Deploy to production
- Monitor logs
- Performance tuning

---

## Questions to Answer

1. **Worker URL**: Should payments worker have custom domain or use `.workers.dev`?
2. **Error Handling**: How should main worker handle payments worker downtime?
3. **Caching**: Should we cache SumUp OAuth tokens?
4. **Logging**: Shared logging service or separate?

---

## Next Steps

**Ready to proceed?**

1. ✅ Create payments-worker directory structure
2. ✅ Setup wrangler.toml and package.json
3. ✅ Extract SumUp integration functions
4. ✅ Create unified checkout endpoint
5. ⏳ Test & iterate

**Estimated Time**: 3-4 hours (done incrementally)

---

**Status**: 📋 Plan Ready | ⏳ Awaiting Approval to Proceed
