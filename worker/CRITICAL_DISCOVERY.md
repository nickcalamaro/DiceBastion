# 🚨 CRITICAL DISCOVERY: SumUp API Credentials & Token Binding

## Date: November 27, 2025

## Problem Summary
USER-22 auto-renewal test revealed that customers created with PRIMARY credentials cannot use tokens created with BACKUP credentials, and vice versa.

## Test Evidence

### Test 1: Token created with BACKUP credentials
- **Purchase logs** show USER-22 customer creation with worker (BACKUP creds)
- **Token**: `1d1274c0-bf75-44c8-81f6-d919454caa31`
- **Checkout** shows `customer_id: "USER-22"` and active mandate
- **Problem**: GET `/v0.1/customers/USER-22` with PRIMARY creds → 404 NOT FOUND

### Test 2: Customer created with PRIMARY credentials  
- **Manually created** USER-22 using PRIMARY credentials → SUCCESS
- **Verified**: GET `/v0.1/customers/USER-22` with PRIMARY creds → 200 OK
- **Attempted payment** with USER-22 token (from BACKUP creds) → `"Invalid token"`

### Test 3: Test customers
- USER-TEST-999 created with PRIMARY creds → EXISTS and persists ✅
- USER-22 created with BACKUP creds (worker) → DOES NOT EXIST when queried with PRIMARY creds ❌

## Root Cause: API Credential Isolation

**SumUp isolates resources by API credentials:**

1. **Tokens** are bound to the specific API application (client_id/secret pair) that created them
2. **Customers** created via Customer API are scoped to the API application
3. **Checkout customer_id** is just a reference label, NOT a Customer API resource
4. Resources from one API application CANNOT be accessed/used by another

## Current Worker Configuration

```javascript
// worker/src/index.js line 259
async function sumupToken(env, scopes = 'payments') {
  const body = new URLSearchParams({ 
    grant_type: 'client_credentials', 
    client_id: env.SUMUP_CLIENT_ID_BACKUP,      // ← USING BACKUP
    client_secret: env.SUMUP_CLIENT_SECRET_BACKUP, // ← USING BACKUP
    scope: scopes 
  })
  // ...
}
```

## The Fix

### Option 1: Use PRIMARY Credentials (Recommended)
Replace BACKUP credentials with PRIMARY throughout the worker:

```javascript
async function sumupToken(env, scopes = 'payments') {
  const body = new URLSearchParams({ 
    grant_type: 'client_credentials', 
    client_id: env.SUMUP_CLIENT_ID,        // ← Use primary
    client_secret: env.SUMUP_CLIENT_SECRET, // ← Use primary
    scope: scopes 
  })
  // ...
}
```

**Update wrangler.toml or Cloudflare dashboard:**
- Ensure `SUMUP_CLIENT_ID` and `SUMUP_CLIENT_SECRET` are set to PRIMARY credentials
- Can remove BACKUP credentials if no longer needed

### Option 2: Verify BACKUP Credentials
If BACKUP credentials must be used:
1. Verify they belong to the same SumUp merchant account
2. Test creating customers with BACKUP creds directly
3. Ensure tokens and customers persist when using same credential set

## Impact on Auto-Renewal

**Current state:**
- ✅ Code structure is CORRECT (customer_id added to payment body)
- ✅ Token saving works
- ✅ Mandate creation works
- ❌ Customer API resource creation is scoped to wrong credentials
- ❌ Recurring payments fail because token + customer belong to different API applications

**After fix:**
- Customer created during purchase will exist in Customer API
- Token and customer will belong to same API application
- Recurring payments should work (still requires 3DS testing with SumUp support)

## Test Results Summary

| Customer | Created With | Exists in Customer API? | Token | Works with PRIMARY? |
|----------|--------------|-------------------------|-------|---------------------|
| USER-20 | Worker (BACKUP) | ❌ NO | d5dae9b7... | ❌ NO |
| USER-21 | Worker (BACKUP) | ❌ NO | 660eb844... | ❌ NO |
| USER-22 | Worker (BACKUP) | ❌ NO (initially) | 1d1274c0... | ❌ NO |
| USER-22 | Manual (PRIMARY) | ✅ YES | N/A | ✅ YES (customer only) |
| USER-TEST-999 | Manual (PRIMARY) | ✅ YES | N/A | ✅ YES |

## Next Steps

1. **Update worker credentials** to use PRIMARY instead of BACKUP
2. **Redeploy worker** with updated configuration
3. **Test fresh purchase** with auto-renewal enabled
4. **Verify**:
   - Customer exists in Customer API after purchase
   - Token is valid for that customer
   - Auto-renewal attempts work (may still require 3DS)
5. **Contact SumUp support** about MIT (Merchant Initiated Transactions) to bypass 3DS

## Files to Update

- `worker/wrangler.toml` or Cloudflare Dashboard: Update environment variables
- `worker/src/index.js`: Already correct (just needs right credentials in env)
- Test with: Fresh membership purchase at https://dicebastion.com/memberships

## Key Learnings

1. **Two separate customer systems**:
   - Checkout `customer_id` = reference label
   - Customer API = actual resource with persistence

2. **Three-way binding**:
   - Token ↔ customer_id ↔ API credentials
   - All three must align for recurring payments to work

3. **API credential isolation**:
   - Resources don't cross API application boundaries
   - Can't mix PRIMARY and BACKUP credentials
   - Each API app has its own isolated resource space

4. **"Success" isn't always success**:
   - SumUp returns 200 OK even when resource isn't created/accessible
   - Must verify with GET request using same credentials
   - Silent failures when using wrong credential set

---

**Status**: Ready to deploy with PRIMARY credentials  
**Confidence**: High - root cause identified and fix is straightforward  
**Risk**: Low - only requires credential swap, code is already correct
