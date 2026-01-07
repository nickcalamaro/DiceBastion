# Database Constraint Fix - Test Plan Issue

## Problem
```
D1_ERROR: CHECK constraint failed: plan IN ('monthly','quarterly','annual')
```

The database has a CHECK constraint on the `memberships` table that only allows these three plan values:
- `'monthly'`
- `'quarterly'`
- `'annual'`

We were trying to use `plan: 'test'` which violated this constraint.

## Solution

### 1. Updated Test Page
Changed from:
```javascript
plan: 'test',
amount: '1.00'
```

To:
```javascript
plan: 'monthly',  // Use valid plan
amount: '1.00'    // Override with £1 for testing
```

### 2. Updated Worker Logic
Modified the amount override logic to work with ANY valid plan, not just 'test':

```javascript
// Allow custom amount override for testing (works with any valid plan)
if (customAmount) {
  amount = Number(customAmount)
  currency = 'GBP'
  console.log(`Using custom test amount: £${amount} for plan: ${plan}`)
} else {
  // Normal flow - use service pricing
  if (!svc) return c.json({ error: 'unknown_plan' }, 400)
  amount = Number(svc.amount)
  currency = svc.currency || c.env.CURRENCY || 'GBP'
}
```

## How It Works Now

1. **Test Page sends:**
   - `plan: 'monthly'` (valid plan, passes CHECK constraint)
   - `amount: '1.00'` (custom test amount)

2. **Worker processes:**
   - Validates plan is valid (`'monthly'` ✅)
   - Sees custom amount provided
   - Uses £1.00 instead of normal monthly price (£5.00)
   - Creates membership with `plan: 'monthly'` in database ✅

3. **Database accepts:**
   - Plan value is valid, constraint passes ✅
   - Membership created with £1 charge

## Benefits

- ✅ Passes database CHECK constraint
- ✅ Still charges only £1 for testing
- ✅ Creates valid membership record
- ✅ Works with tokenization/auto-renewal
- ✅ Can test renewals at £1 each

## Testing

Refresh the page at `http://localhost:8000/test-auto-renewal-purchase.html` and try again!

The form will now:
1. Create a monthly membership
2. Charge £1 (instead of £5)
3. Save payment token
4. Allow instant renewal test (another £1)

Total test cost: £2.00
