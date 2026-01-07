# Payments Worker Refactoring - Getting Started

## ✅ Phase 1: Setup Complete

### Created Files

```
payments-worker/
├── package.json ✅
├── wrangler.toml ✅
├── .dev.vars.example ✅
├── README.md ✅
└── src/
    └── (to be created)
```

### Configuration Summary

**Worker Name**: `dicebastion-payments`  
**Database**: Shared D1 (`dicebastion`) with main worker  
**URL**: Will be `https://dicebastion-payments.ncalamaro.workers.dev`

---

## 🎯 Next Steps

### Step 1: Review the Plan
See `PAYMENTS_WORKER_REFACTORING_PLAN.md` for complete architecture

### Step 2: Create Cloudflare Worker (If Needed)
If you need to create the worker in CloudFlare dashboard:
1. Go to Workers & Pages
2. Create new Worker
3. Name it `dicebastion-payments`
4. We'll deploy code via wrangler

**OR** just deploy with wrangler (it will create the worker automatically):
```powershell
cd payments-worker
npm install
npx wrangler deploy
```

### Step 3: Extract Payment Functions
I'll extract these from `worker/src/index.js`:

**SumUp Integration (~300 lines)**
- `sumupToken()`
- `getOrCreateSumUpCustomer()`
- `createCheckout()`
- `fetchPayment()`

**Payment Instruments (~400 lines)**
- `savePaymentInstrument()`
- `chargePaymentInstrument()`
- `getActivePaymentInstrument()`

**Renewals (~500 lines)**
- `processMembershipRenewal()`

**Webhooks (~200 lines)**
- `POST /webhooks/sumup` handler
- `verifySumUpWebhookSignature()`
- `checkAndMarkWebhookProcessed()`

**Total**: ~1,400 lines to extract and refactor

### Step 4: Create Unified API
New simplified endpoints:
- `POST /checkout` - Handles ALL payment types
- `GET /confirm/:orderRef` - Confirms ALL payment types
- `POST /instruments/:userId/charge` - Recurring charges
- `POST /webhooks/sumup` - Webhook processing

### Step 5: Update Main Worker
Replace payment logic with fetch calls to payments worker

---

## 🔐 Secrets Needed

### Copy from Main Worker
These secrets need to be set in payments worker (same values as main worker):

```powershell
cd payments-worker

# Copy SumUp credentials
wrangler secret put SUMUP_CLIENT_ID
wrangler secret put SUMUP_CLIENT_SECRET
wrangler secret put SUMUP_WEBHOOK_SECRET
```

### New Secrets
```powershell
# Generate a random secret for worker-to-worker auth
# Example: openssl rand -hex 32
wrangler secret put INTERNAL_SECRET
```

---

## 📋 Implementation Checklist

### Phase 1: Scaffolding ✅
- [x] Create payments-worker directory
- [x] Create package.json
- [x] Create wrangler.toml
- [x] Create README.md
- [x] Create .dev.vars.example

### Phase 2: Core Functions (Next)
- [ ] Extract SumUp integration functions
- [ ] Extract payment instrument functions
- [ ] Create unified checkout service
- [ ] Create confirmation service

### Phase 3: Endpoints
- [ ] Implement `POST /checkout`
- [ ] Implement `GET /confirm/:orderRef`
- [ ] Implement instrument management
- [ ] Implement webhooks

### Phase 4: Integration
- [ ] Update main worker to call payments worker
- [ ] Add internal authentication
- [ ] Test membership flow
- [ ] Test event flow
- [ ] Test auto-renewal

### Phase 5: Deployment
- [ ] Deploy payments worker
- [ ] Update main worker secrets
- [ ] Test production flow
- [ ] Monitor logs

---

## 🧪 Testing Strategy

### 1. Test Payments Worker Independently
```powershell
cd payments-worker
npm run dev
```

Then use Postman/curl to test endpoints directly

### 2. Test Integration
Deploy both workers and test end-to-end:
- Membership purchase
- Event ticket purchase
- Auto-renewal

### 3. Test Webhooks
Use SumUp webhook testing or ngrok to forward webhooks locally

---

## 📊 Benefits Recap

### Code Quality
- **Before**: 3,778 lines in one file
- **After**: Two focused workers (~1,500 lines each)

### Maintainability
- Clear separation of concerns
- Easier to test payment logic
- No duplicate SumUp integration code

### Security
- Payment secrets isolated
- Internal authentication between workers
- Better audit trail

### Scalability
- Can scale payments independently
- Rate limiting specific to payments
- Better performance monitoring

---

## ⚠️ Important Notes

### Database Strategy
**We're using Option A: Shared D1 Database**

Both workers access the same database:
- Main worker: Creates memberships, events, users
- Payments worker: Creates transactions, payment instruments

**Why**: Simplicity. No data sync needed.

### Error Handling
If payments worker is down, main worker should:
1. Return error to user
2. Log the failure
3. Retry logic (future enhancement)

### Backward Compatibility
We'll migrate gradually:
1. Deploy payments worker
2. Keep old code in main worker
3. Test new flow
4. Remove old code once confident

---

## 🚀 Ready to Proceed?

I can now start extracting and creating the actual payment logic.

**What would you like me to do next?**

A) Extract SumUp functions and create `src/integrations/sumup.js`
B) Create the main router first (`src/index.js`)
C) Set up the worker in Cloudflare dashboard first
D) Something else

Let me know and I'll proceed! 🎯

---

**Status**: 📁 Structure Created | ⏳ Ready for Code Extraction
