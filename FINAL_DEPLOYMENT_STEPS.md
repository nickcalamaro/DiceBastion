# Final Deployment Steps - Quick Reference

## Current Status
✅ Payments worker deployed and working
✅ Main worker code refactored (syntax errors fixed)
⏳ Main worker deployment pending

## Required Actions (in order)

### Step 1: Set INTERNAL_SECRET
```powershell
cd c:\Users\nickc\Desktop\Dev\DiceBastion
npx wrangler secret put INTERNAL_SECRET
```

**⚠️ IMPORTANT**: Use the **exact same value** that you used for the payments worker!

To check what value you used in the payments worker:
```powershell
cd c:\Users\nickc\Desktop\Dev\DiceBastion\payments-worker
npx wrangler secret list
# This will show that INTERNAL_SECRET exists
# If you forgot the value, you'll need to set it again in both workers
```

### Step 2: Deploy Main Worker
```powershell
cd c:\Users\nickc\Desktop\Dev\DiceBastion
npx wrangler deploy
```

Expected output:
```
✨ Compiled Worker successfully
🌎 Uploading...
✨ Success! Uploaded 1 file (X KB)
Published dicebastion-memberships (X.XX sec)
  https://dicebastion-memberships.ncalamaro.workers.dev
```

### Step 3: Test Basic Functionality

#### Test 1: Health Check
Open in browser:
- Main worker: https://dicebastion-memberships.ncalamaro.workers.dev/health
- Payments worker: https://dicebastion-payments.ncalamaro.workers.dev/health

Both should return `{"status":"ok"}`

#### Test 2: Membership Plans (Public Endpoint)
```powershell
curl https://dicebastion-memberships.ncalamaro.workers.dev/membership/plans
```

Should return list of active membership plans.

#### Test 3: Create Test Membership Checkout
Use the test page: `test-auto-renewal.html`

1. Open the page in browser
2. Fill in test details
3. Choose a plan
4. Click "Purchase Membership"
5. Verify checkout is created
6. Complete payment in SumUp
7. Return to confirmation page
8. Verify membership is activated

### Step 4: Monitor Logs

In a separate terminal, watch for errors:
```powershell
cd c:\Users\nickc\Desktop\Dev\DiceBastion
npx wrangler tail
```

This will show live logs from the main worker.

### Step 5: Test All Critical Flows

Use the testing checklist in `REFACTORING_COMPLETE.md` section "Testing Checklist"

## Quick Troubleshooting

### If deployment fails with "secret not found"
```powershell
# Set the INTERNAL_SECRET
npx wrangler secret put INTERNAL_SECRET
# Enter the same value as payments worker
```

### If you get 500 errors on payment endpoints
Check that both workers have the same `INTERNAL_SECRET`:
```powershell
# In main worker directory
npx wrangler secret list

# In payments worker directory
cd payments-worker
npx wrangler secret list
```

Both should show `INTERNAL_SECRET` in the list.

### If payments worker returns 401 Unauthorized
The `INTERNAL_SECRET` values don't match between workers. Reset them:
```powershell
# In main worker
npx wrangler secret put INTERNAL_SECRET

# In payments worker
cd payments-worker
npx wrangler secret put INTERNAL_SECRET
# Use the SAME value!
```

### If you get "PAYMENTS_WORKER_URL not configured"
Check `wrangler.toml` has:
```toml
PAYMENTS_WORKER_URL = "https://dicebastion-payments.ncalamaro.workers.dev"
```

## After Successful Testing

### Clean up legacy secrets
```powershell
cd c:\Users\nickc\Desktop\Dev\DiceBastion

# Remove old SumUp secrets from main worker
npx wrangler secret delete SUMUP_CLIENT_ID
npx wrangler secret delete SUMUP_CLIENT_SECRET

# Verify they're gone
npx wrangler secret list
```

You should only see:
- `INTERNAL_SECRET`
- `MAILERSEND_API_KEY`
- `ADMIN_KEY`
- (Any other non-payment secrets)

## Rollback If Needed

If something goes wrong and you need to rollback:

```powershell
# 1. Checkout previous version
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>

# 2. Deploy old version
npx wrangler deploy

# 3. Restore SumUp secrets
npx wrangler secret put SUMUP_CLIENT_ID
npx wrangler secret put SUMUP_CLIENT_SECRET

# 4. Return to current version when ready
git checkout main
```

## Success Indicators

✅ Both workers return 200 on /health
✅ Membership checkout creates payment
✅ Payment confirmation activates membership
✅ Auto-renewal saves card token
✅ Webhooks process successfully
✅ No errors in wrangler tail logs
✅ Admin pages load correctly

## Expected Timeline

- **Step 1**: 1 minute (set secret)
- **Step 2**: 1 minute (deploy)
- **Step 3**: 2 minutes (basic tests)
- **Step 4**: 5-10 minutes (detailed testing)
- **Step 5**: 5 minutes (cleanup)

**Total**: ~15 minutes

## Need Help?

Check these files:
- `REFACTORING_COMPLETE.md` - Full summary
- `PAYMENTS_WORKER_DEPLOYMENT.md` - Detailed deployment guide
- `WEBHOOK_SECURITY_UPDATE.md` - Webhook changes
- `AUTO_RENEWAL_TESTING_GUIDE.md` - Testing guide

---

**Ready to deploy? Run Step 1 above! 🚀**
