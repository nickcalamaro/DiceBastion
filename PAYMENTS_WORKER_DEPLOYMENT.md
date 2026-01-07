# Payments Worker - Deployment Guide

## Pre-Deployment Checklist

### 1. Create Local Environment File
```bash
cd c:\Users\nickc\Desktop\Dev\DiceBastion\payments-worker
copy .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your actual values:
```env
SUMUP_CLIENT_ID=your_actual_client_id
SUMUP_CLIENT_SECRET=your_actual_secret
SUMUP_MERCHANT_CODE=your_actual_merchant_code
SUMUP_WEBHOOK_SECRET=your_actual_webhook_secret
INTERNAL_SECRET=generate_random_secret_32_chars_min
CURRENCY=GBP
```

### 2. Test Locally
```bash
npm run dev
```

Open browser to `http://localhost:8787/health`
Expected response:
```json
{
  "status": "ok",
  "service": "payments-worker"
}
```

## Deployment Steps

### Step 1: Login to Cloudflare
```bash
wrangler login
```

### Step 2: Set Production Secrets
```bash
cd c:\Users\nickc\Desktop\Dev\DiceBastion\payments-worker

# Set each secret (will prompt for value)
wrangler secret put SUMUP_CLIENT_ID
wrangler secret put SUMUP_CLIENT_SECRET
wrangler secret put SUMUP_MERCHANT_CODE
wrangler secret put SUMUP_WEBHOOK_SECRET
wrangler secret put INTERNAL_SECRET
```

**Important**: The `INTERNAL_SECRET` should be:
- At least 32 characters
- Randomly generated
- The SAME value in both workers
- Never committed to git

Generate a random secret:
```powershell
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Step 3: Deploy Worker
```bash
npm run deploy
```

Expected output:
```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded payments-worker (X.XX sec)
Published payments-worker (X.XX sec)
  https://dicebastion-payments.XXXX.workers.dev
Current Deployment ID: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

### Step 4: Test Production Deployment
```bash
# Health check
curl https://dicebastion-payments.XXXX.workers.dev/health

# Test internal endpoint (should fail without secret)
curl https://dicebastion-payments.XXXX.workers.dev/internal/checkout
# Expected: {"error":"Unauthorized"}

# Test with secret (replace YOUR_SECRET)
curl -X POST https://dicebastion-payments.XXXX.workers.dev/internal/checkout \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: YOUR_SECRET" \
  -d '{"amount":1,"currency":"GBP","orderRef":"TEST-1","description":"Test"}'
```

### Step 5: Configure Custom Domain (Optional)
```bash
# Add custom domain in Cloudflare dashboard
# Or via wrangler:
wrangler publish --route payments.dicebastion.com/*
```

## Update Main Worker

Now update the main worker to use this payments worker instead of direct SumUp calls.

### Step 6: Add INTERNAL_SECRET to Main Worker
```bash
cd c:\Users\nickc\Desktop\Dev\DiceBastion

# Set the same secret in main worker
wrangler secret put INTERNAL_SECRET
```

### Step 7: Add PAYMENTS_WORKER_URL to Main Worker
In `wrangler.toml` (main worker):
```toml
[vars]
PAYMENTS_WORKER_URL = "https://dicebastion-payments.XXXX.workers.dev"
```

Or as a secret if you prefer:
```bash
wrangler secret put PAYMENTS_WORKER_URL
```

## Verification

After both workers are deployed:

### 1. Check Payments Worker
```bash
curl https://dicebastion-payments.XXXX.workers.dev/health
```

### 2. Test Membership Purchase
1. Go to https://dicebastion.com/memberships
2. Click "Join Now"
3. Complete payment
4. Check logs:
   - Main worker should call payments worker
   - Payments worker should call SumUp
   - Membership should activate

### 3. Check Cloudflare Dashboard
- Workers & Pages → dicebastion-payments
- Check metrics:
  - Requests
  - Success rate
  - CPU time
  - Errors

### 4. Monitor Logs
```bash
# Watch live logs
wrangler tail dicebastion-payments

# In another terminal
wrangler tail dicebastion-memberships
```

## Rollback Plan

If something goes wrong:

### Option 1: Rollback Deployment
```bash
cd c:\Users\nickc\Desktop\Dev\DiceBastion\payments-worker
wrangler rollback
```

### Option 2: Disable Payments Worker
In main worker, add fallback to direct SumUp calls if payments worker fails.

## Monitoring

### Key Metrics to Watch
1. **Request Rate**: Should match membership/event purchases
2. **Error Rate**: Should be < 1%
3. **Response Time**: Should be < 500ms
4. **Database Queries**: Monitor D1 usage

### Alerts to Set Up
- High error rate (> 5%)
- No requests in 24 hours (might indicate broken integration)
- Slow response time (> 1 second)

## Cost Estimate

**Cloudflare Workers Free Tier**:
- 100,000 requests/day
- Dice Bastion estimate: ~100-500 requests/day
- **Cost**: $0/month (well within free tier)

**D1 Database**:
- Shared with main worker
- Payments worker only accesses 2 tables
- Additional cost: Minimal

## Security Checklist

- [x] Secrets stored in Cloudflare (not in code)
- [x] Internal endpoints protected with `X-Internal-Secret`
- [x] Webhook signature verification implemented
- [x] CORS configured
- [x] No sensitive data in logs
- [x] Database access limited to required tables

## Troubleshooting

### "Unauthorized" errors
**Problem**: Main worker can't call payments worker
**Solution**: Ensure `INTERNAL_SECRET` is identical in both workers

### "Failed to fetch payment"
**Problem**: Invalid SumUp credentials
**Solution**: Verify secrets are set correctly

### "Customer not found"
**Problem**: Customer doesn't exist in SumUp
**Solution**: Payments worker auto-creates customers, check logs

### Database errors
**Problem**: Missing table or binding
**Solution**: Ensure D1 database binding is correct in `wrangler.jsonc`

## Support

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **Hono Docs**: https://hono.dev/
- **SumUp API**: https://developer.sumup.com/

## Next Steps

After successful deployment:
1. ✅ Deploy payments worker
2. ⏳ Update main worker to call payments worker
3. ⏳ Test membership purchases
4. ⏳ Test event tickets
5. ⏳ Test auto-renewal
6. ⏳ Test webhooks
7. ⏳ Remove old payment code from main worker
8. ⏳ Update documentation
