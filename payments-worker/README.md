# Dice Bastion - Payments Worker

**Purpose**: Dedicated worker that handles ONLY SumUp payment integration.

## What This Worker Does

✅ **Payment Integration (SumUp API)**
- OAuth token management
- Customer creation/management
- Checkout creation
- Payment verification
- Card tokenization (payment instruments)
- Recurring charge processing
- Webhook signature verification

❌ **What It Does NOT Do**
- Business logic (memberships, events, shop)
- User authentication
- Email sending
- Database schema management
- Cron jobs

## Architecture

```
┌─────────────────────┐
│   Main Worker       │
│  (Business Logic)   │
│                     │
│  - Memberships      │
│  - Events           │
│  - Shop             │
│  - User Auth        │
│  - Email System     │
└──────────┬──────────┘
           │
           │ Internal API Call
           │ (X-Internal-Secret header)
           ▼
┌─────────────────────┐
│  Payments Worker    │
│  (SumUp Only)       │
│                     │
│  - Create Checkout  │
│  - Fetch Payment    │
│  - Save Card Token  │
│  - Charge Token     │
│  - Verify Webhook   │
└──────────┬──────────┘
           │
           │ HTTPS
           ▼
┌─────────────────────┐
│    SumUp API        │
│  (Payment Provider) │
└─────────────────────┘
```

## API Endpoints

### Public
- `GET /health` - Health check

### Internal (Requires `X-Internal-Secret` header)
- `POST /internal/checkout` - Create SumUp checkout
- `POST /internal/customer` - Get/create SumUp customer
- `GET /internal/payment/:checkoutId` - Fetch payment details
- `POST /internal/payment-instrument` - Save payment instrument (tokenization)
- `POST /internal/charge` - Charge a saved card
- `POST /internal/verify-webhook` - Verify webhook signature

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Environment Variables

Create `.dev.vars` file (copy from `.dev.vars.example`):

```bash
SUMUP_CLIENT_ID=...
SUMUP_CLIENT_SECRET=...
SUMUP_MERCHANT_CODE=...
SUMUP_WEBHOOK_SECRET=...
INTERNAL_SECRET=...
CURRENCY=GBP
```

### SumUp OAuth Flows

This worker supports **two OAuth flows**:

#### 1. Client Credentials (Default)
Most SumUp accounts work with this simpler flow:
- No refresh token needed
- Just set `SUMUP_CLIENT_ID` and `SUMUP_CLIENT_SECRET`
- Worker automatically requests scoped tokens

#### 2. Authorization Code + Refresh Token (Advanced)
Some SumUp accounts require the authorization flow:
- Set `SUMUP_REFRESH_TOKEN` in addition to client credentials
- Worker will use `refresh_token` grant type instead of `client_credentials`
- More secure, required for certain SumUp account types

**To get a refresh token:**
1. Go to SumUp Developer Dashboard
2. Create an OAuth application
3. Complete authorization code flow
4. Save the refresh token as `SUMUP_REFRESH_TOKEN` secret

If you're unsure which flow you need, try without `SUMUP_REFRESH_TOKEN` first.

## Database

Shared D1 database with main worker:
- `payment_instruments` table (read/write)
- `users` table (read-only for customer creation)

## Security

- **Internal Authentication**: All `/internal/*` endpoints require `X-Internal-Secret` header
- **Webhook Verification**: HMAC SHA256 signature validation
- **No Public Endpoints**: Only health check is public

## Deployment

```bash
# Set secrets
wrangler secret put SUMUP_CLIENT_ID
wrangler secret put SUMUP_CLIENT_SECRET
wrangler secret put SUMUP_MERCHANT_CODE
wrangler secret put SUMUP_WEBHOOK_SECRET
wrangler secret put INTERNAL_SECRET

# Deploy
npm run deploy
```

## Main Worker Integration

The main worker calls this worker's internal API:

```javascript
// Example: Create checkout
const response = await fetch('https://dicebastion-payments.workers.dev/internal/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Secret': env.INTERNAL_SECRET
  },
  body: JSON.stringify({
    amount: 10.00,
    currency: 'GBP',
    orderRef: 'ORD-123',
    description: 'Membership',
    savePaymentInstrument: true,
    customerId: 'USER-456'
  })
})
```
