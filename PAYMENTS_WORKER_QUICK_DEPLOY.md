# Payments Worker - Quick Deployment Guide

## ⚡ Fast Deployment (Recommended Order)

### Step 1: Deploy Worker FIRST (creates it in Cloudflare)
```powershell
cd c:\Users\nickc\Desktop\Dev\DiceBastion\payments-worker
npm run deploy
```

**Expected output:**
```
✨ Success! Uploaded payments-worker
  https://dicebastion-payments.XXXX.workers.dev
```

### Step 2: THEN Add Secrets
```powershell
# Now the worker exists, so we can add secrets
wrangler secret put SUMUP_CLIENT_ID
wrangler secret put SUMUP_CLIENT_SECRET
wrangler secret put SUMUP_MERCHANT_CODE
wrangler secret put INTERNAL_SECRET

# OPTIONAL: Only if your SumUp account requires authorization_code flow
# wrangler secret put SUMUP_REFRESH_TOKEN
```

**For INTERNAL_SECRET**, generate a random 32+ character string:
```powershell
# PowerShell - generates random secret
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Save this secret - you'll need to add the SAME value to the main worker later!

### 🔐 About SUMUP_REFRESH_TOKEN (Optional)

**Do you need this?** Most SumUp accounts work fine without it.

**When you need it:**
- Your SumUp account requires OAuth authorization_code flow
- You've been given a refresh token by SumUp
- Client credentials flow returns authorization errors

**How to get it:**
1. Go to SumUp Developer Dashboard
2. Create OAuth application
3. Complete authorization code flow
4. Save the refresh token

**If unsure:** Skip this secret and try deploying without it first.

### Step 3: Verify Deployment
```powershell
# Get the worker URL from deployment output, then test:
curl https://dicebastion-payments.XXXX.workers.dev/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "payments-worker"
}
```

### Step 4: Copy Worker URL
From the deployment output, copy the worker URL:
```
https://dicebastion-payments.ncalamaro.workers.dev
```

You'll need this URL to configure the main worker.

## 🚨 If You Already Said "Yes" to Create Worker

If Wrangler already asked "Do you want to create a new Worker?" and you said yes:

1. **Just continue adding secrets** - The worker is being created
2. **Set all 5 secrets** when prompted
3. **Deploy again** to push the code:
   ```powershell
   npm run deploy
   ```

## 📋 What Each Secret Does

| Secret | Required | Description | Example |
|--------|----------|-------------|---------|
| `SUMUP_CLIENT_ID` | ✅ Yes | SumUp OAuth Client ID | `com_XXXX` |
| `SUMUP_CLIENT_SECRET` | ✅ Yes | SumUp OAuth Secret | `secret_XXXX` |
| `SUMUP_MERCHANT_CODE` | ✅ Yes | Your SumUp merchant code | `MXXXXXX` |
| `SUMUP_WEBHOOK_SECRET` | ✅ Yes | Webhook signature verification | Random string from SumUp dashboard |
| `SUMUP_REFRESH_TOKEN` | ⚠️ Maybe | OAuth refresh token (only for auth_code flow) | `refresh_XXXX` |
| `INTERNAL_SECRET` | ✅ Yes | Worker-to-worker auth | Random 32+ chars (MUST MATCH MAIN WORKER) |

## ⚠️ Important Notes

1. **INTERNAL_SECRET must be the same** in both workers (payments + main)
2. **Save the worker URL** - you'll need it for main worker config
3. **Don't commit `.dev.vars`** to git (already in .gitignore)
4. **Secrets are encrypted** - they won't show in Cloudflare dashboard

## 🧪 Testing After Deployment

### Test 1: Health Check (Public)
```powershell
curl https://YOUR-WORKER-URL/health
```
✅ Should return: `{"status":"ok","service":"payments-worker"}`

### Test 2: Protected Endpoint (Should Fail)
```powershell
curl https://YOUR-WORKER-URL/internal/checkout
```
✅ Should return: `{"error":"Unauthorized"}`

### Test 3: Protected Endpoint (With Secret)
```powershell
curl -X POST https://YOUR-WORKER-URL/internal/checkout `
  -H "Content-Type: application/json" `
  -H "X-Internal-Secret: YOUR_INTERNAL_SECRET" `
  -d '{"amount":1,"currency":"GBP","orderRef":"TEST","description":"Test"}'
```
✅ Should fail with SumUp error (expected - we haven't configured checkout properly)
❌ Should NOT return "Unauthorized"

## 🎯 Next Steps

After successful deployment:

1. ✅ Worker deployed
2. ✅ Secrets configured
3. ⏳ Update main worker to use payments worker
4. ⏳ Deploy main worker
5. ⏳ Test end-to-end payment flow

## 🔧 Troubleshooting

### "Worker not found"
**Solution**: Deploy first: `npm run deploy`

### "Unauthorized" when setting secrets
**Solution**: Run `wrangler login` first

### Deployment fails with TypeScript errors
**Solution**: Run `npm run cf-typegen` to regenerate types

### Can't remember INTERNAL_SECRET
**Solution**: Generate a new one and update both workers

## 📞 Support

- Cloudflare Dashboard: https://dash.cloudflare.com
- Worker Logs: `wrangler tail dicebastion-payments`
- Wrangler Docs: https://developers.cloudflare.com/workers/wrangler/
