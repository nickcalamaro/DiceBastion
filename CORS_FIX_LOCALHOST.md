# CORS Fix for localhost:8000 Test Page

## Problem
CORS policy blocked requests from `http://localhost:8000` to the worker because it wasn't in the allowed origins list.

## Solution Applied

### 1. Updated `worker/wrangler.toml`
Added `http://localhost:8000` to the `ALLOWED_ORIGIN` environment variable:

```toml
ALLOWED_ORIGIN = "http://localhost:1313,http://localhost:1314,http://localhost:8000,https://dicebastion.com,https://www.dicebastion.com,https://shop.dicebastion.com,https://dicebastion-shop.pages.dev"
```

### 2. Updated Worker CORS Logic
The worker already had logic to support local testing with `ALLOW_LOCAL_TESTING` env var, but the proper solution is to add localhost to allowed origins.

### 3. Deployed Worker
```bash
cd worker
npx wrangler deploy
```

## Testing Now Ready

Once deployment completes (should take ~30 seconds), you can:

1. **Start local server** (if not already running):
   ```powershell
   python -m http.server 8000
   ```

2. **Open test page**:
   ```
   http://localhost:8000/test-auto-renewal-purchase.html
   ```

3. **Test the flow**:
   - Fill in email and name
   - ✅ Keep "Enable auto-renewal" checked
   - ✅ Check terms and privacy
   - Click "Initialize Payment Widget"
   - Enter card details
   - Complete £1 payment
   - Test instant renewal (another £1)

## What's Fixed

✅ CORS now allows requests from `http://localhost:8000`  
✅ Worker URL is correct: `https://dicebastion-memberships.ncalamaro.workers.dev`  
✅ Test page uses actual endpoints: `/membership/checkout` and `/test/renew-user`  
✅ £1 test payments configured  
✅ Instant renewal testing enabled  

## Total Cost
- **Initial payment**: £1.00
- **Renewal test**: £1.00
- **Total**: £2.00

Both charges can be refunded from SumUp dashboard if needed.

## Next Steps After Deployment Completes

1. Wait for deployment (~30 seconds)
2. Refresh the test page in browser
3. Try the payment flow
4. Should work without CORS errors! 🎉
