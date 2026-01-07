# SumUp Tokenization & Recurring Payments Analysis

## Date: January 7, 2026

## Overview
Analysis of our current payment instrument handling vs. SumUp's documented tokenization and recurring payment flow.

**SumUp Documentation**: https://developer.sumup.com/online-payments/guides/tokenization-with-payment-sdk

---

## Current Implementation Review

### ✅ What We're Doing Right

#### 1. **Checkout Creation with Tokenization**
```javascript
// In createCheckout() - Line 619-648
if (savePaymentInstrument && customerId) {
  body.purpose = 'SETUP_RECURRING_PAYMENT'
  body.customer_id = customerId
}
```
✅ **CORRECT**: Using `purpose: 'SETUP_RECURRING_PAYMENT'` per SumUp docs
✅ **CORRECT**: Including `customer_id` in the checkout request

#### 2. **Requesting Proper OAuth Scopes**
```javascript
// Line 620
const { access_token } = await sumupToken(env, savePaymentInstrument ? 
  'payments payment_instruments' : 'payments')
```
✅ **CORRECT**: Requesting `payment_instruments` scope when tokenization is needed

#### 3. **Saving Payment Instruments**
```javascript
// In savePaymentInstrument() - Line 659-718
// 1. Fetches checkout details after payment
// 2. Extracts payment_instrument from response
// 3. Stores token in database with card details
// 4. Deactivates old instruments (one active per user)
```
✅ **CORRECT**: Extracting token from `checkout.payment_instrument`
✅ **CORRECT**: Storing instrument securely in database
✅ **GOOD PRACTICE**: Only one active instrument per user

#### 4. **Charging Saved Instruments**
```javascript
// In chargePaymentInstrument() - Line 721-798
const paymentBody = {
  payment_type: 'card',
  token: instrumentId,
  customer_id: customerId
}

await fetch(`https://api.sumup.com/v0.1/checkouts/${checkout.id}`, {
  method: 'PUT',
  body: JSON.stringify(paymentBody)
})
```
✅ **CORRECT**: Using token + customer_id for recurring payments
✅ **CORRECT**: PUT request to complete the checkout

---

## ⚠️ Potential Issues & Improvements

### 1. **Customer ID Format**
**Current:**
```javascript
const customerId = `USER-${userId}`  // e.g., "USER-123"
```

**Concern**: SumUp docs don't specify format restrictions, but we should verify:
- Are we creating these customers via SumUp's Customer API first?
- Or are we relying on implicit customer creation during checkout?

**Recommendation**: 
- ✅ Keep current format (it's fine)
- ⚠️ Ensure customer exists before charging (we do this - line 732)

### 2. **Error Handling for Missing Instruments**

**Current:**
```javascript
// In processMembershipRenewal() - Line 808
const instrument = await getActivePaymentInstrument(db, userId)
if (!instrument) {
  // Marks renewal as failed, logs error
  return { success: false, error: 'no_instrument' }
}
```

✅ **GOOD**: Proper error handling
✅ **GOOD**: Logs failure in renewal_log table

### 3. **Token Expiry Handling**

**Missing**: No logic to handle expired tokens

**SumUp Behavior**: Tokens can expire or become invalid if:
- Card expires
- Card is cancelled
- Customer disputes/chargebacks

**Recommendation**: Add token validation/refresh logic:
```javascript
// When charging fails, check if it's due to expired token
if (paymentError.code === 'INVALID_TOKEN' || paymentError.code === 'TOKEN_EXPIRED') {
  // Mark instrument as inactive
  await db.prepare('UPDATE payment_instruments SET is_active = 0 WHERE instrument_id = ?')
    .bind(instrumentId).run()
  
  // Send email asking user to update payment method
  // Update membership to stop auto-renewal
}
```

### 4. **Payment Instrument Retrieval**

**Current:**
```javascript
// Line 676-678
const instrumentId = instrument.token || instrument.id
```

**Concern**: What's the difference between `token` and `id`?

**SumUp Documentation**:
- `token` = The tokenized payment instrument identifier for recurring payments
- `id` = The payment instrument's database ID (internal to SumUp)

**Recommendation**: Prioritize `token` (which we do ✅)

### 5. **Customer API Integration**

**Current:**
```javascript
// Line 732-744
const customerCheckRes = await fetch(
  `https://api.sumup.com/v0.1/customers/${customerId}`, 
  { headers: { 'Authorization': `Bearer ${access_token}` }}
)
if (!customerCheckRes.ok) {
  throw new Error(`Customer ${customerId} does not exist`)
}
```

✅ **GOOD**: Verifying customer exists before charging
⚠️ **IMPROVEMENT NEEDED**: Should we create customers if they don't exist?

**Recommendation**: Add customer creation fallback:
```javascript
if (!customerCheckRes.ok) {
  // Attempt to create customer
  const createRes = await fetch('https://api.sumup.com/v0.1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customer_id: customerId,
      personal_details: {
        email: userEmail,
        first_name: userName?.split(' ')[0],
        last_name: userName?.split(' ').slice(1).join(' ')
      }
    })
  })
  
  if (!createRes.ok) {
    throw new Error(`Cannot create customer ${customerId}`)
  }
}
```

---

## 🔍 SumUp Documentation Comparison

### SumUp's Recommended Flow:

1. **Initial Setup (Tokenization)**
   ```
   a. Create checkout with purpose=SETUP_RECURRING_PAYMENT
   b. Include customer_id in checkout
   c. Complete payment via SDK
   d. Retrieve payment_instrument.token from checkout response
   e. Store token securely
   ```
   ✅ **WE DO THIS**

2. **Recurring Charges**
   ```
   a. Create new checkout (regular checkout, no purpose needed)
   b. PUT to checkout with { payment_type: 'card', token, customer_id }
   c. Payment is processed immediately (no 3DS)
   d. Check status
   ```
   ✅ **WE DO THIS**

3. **Token Management**
   ```
   - Tokens don't expire automatically
   - Can be invalidated by card expiry, disputes, etc.
   - Should handle INVALID_TOKEN errors gracefully
   ```
   ⚠️ **WE DON'T HANDLE EXPIRED TOKENS**

---

## 📋 Recommendations Summary

### Critical (Must Fix)
None - Current implementation follows SumUp documentation correctly

### High Priority (Should Add)
1. ⚠️ **Token Expiry Handling**: Detect and handle expired/invalid tokens
2. ⚠️ **Customer Creation Fallback**: Auto-create customers if they don't exist during renewal

### Medium Priority (Nice to Have)
3. **Token Refresh Flow**: Allow users to update their payment method
4. **Multi-Card Support**: Allow users to save multiple cards (currently only 1 active)
5. **Payment Method Management UI**: Frontend to view/manage saved cards

### Low Priority (Future)
6. **Webhook for Token Events**: Listen for SumUp webhooks about token invalidation
7. **Analytics**: Track token success/failure rates

---

## 🔧 Proposed Fixes

### Fix 1: Handle Expired Tokens in Auto-Renewal

**Location**: `processMembershipRenewal()` - Line ~830

**Current:**
```javascript
try {
  const payment = await chargePaymentInstrument(env, userId, instrument.instrument_id, ...)
  // ... success handling
} catch (e) {
  // Generic error handling
}
```

**Improved:**
```javascript
try {
  const payment = await chargePaymentInstrument(env, userId, instrument.instrument_id, ...)
  // ... success handling
} catch (e) {
  // Check if error is due to invalid/expired token
  const errorMessage = String(e.message || e).toLowerCase()
  const isTokenError = errorMessage.includes('invalid') || 
                       errorMessage.includes('expired') ||
                       errorMessage.includes('token')
  
  if (isTokenError) {
    // Deactivate the expired token
    await db.prepare('UPDATE payment_instruments SET is_active = 0 WHERE instrument_id = ?')
      .bind(instrument.instrument_id).run()
    
    // Disable auto-renewal (user needs to update payment method)
    await db.prepare('UPDATE memberships SET auto_renew = 0 WHERE id = ?')
      .bind(membership.id).run()
    
    // Send email to user about expired payment method
    const emailContent = getExpiredPaymentMethodEmail(membership, user)
    await sendEmail(env, { 
      to: user.email, 
      ...emailContent,
      emailType: 'payment_method_expired'
    })
  }
  
  // Continue with existing error handling
  await db.prepare('UPDATE memberships SET renewal_failed_at = ?, renewal_attempts = renewal_attempts + 1 WHERE id = ?')
    .bind(toIso(new Date()), membership.id).run()
  // ...
}
```

### Fix 2: Auto-Create Customers During Renewal

**Location**: `chargePaymentInstrument()` - Line ~732

**Current:**
```javascript
if (!customerCheckRes.ok) {
  console.error(`Customer ${customerId} not found`)
  throw new Error(`Customer ${customerId} does not exist`)
}
```

**Improved:**
```javascript
if (!customerCheckRes.ok) {
  console.log(`Customer ${customerId} not found, attempting to create...`)
  
  // Get user details for customer creation
  const user = await db.prepare('SELECT email, name FROM users WHERE user_id = ?')
    .bind(userId).first()
  
  if (!user) {
    throw new Error('User not found in database')
  }
  
  // Create customer in SumUp
  const createCustomerRes = await fetch('https://api.sumup.com/v0.1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customer_id: customerId,
      personal_details: {
        email: user.email,
        first_name: user.name?.split(' ')[0] || 'Customer',
        last_name: user.name?.split(' ').slice(1).join(' ') || ''
      }
    })
  })
  
  if (!createCustomerRes.ok) {
    const txt = await createCustomerRes.text()
    throw new Error(`Failed to create customer: ${txt}`)
  }
  
  console.log(`Successfully created customer ${customerId}`)
}
```

---

## ✅ Conclusion

**Overall Assessment**: ✅ **IMPLEMENTATION IS CORRECT**

Our current implementation follows SumUp's tokenization documentation properly:
- ✅ Correct use of `purpose: SETUP_RECURRING_PAYMENT`
- ✅ Proper token storage and retrieval
- ✅ Correct recurring payment flow with token + customer_id
- ✅ Appropriate OAuth scopes

**Minor Improvements Needed**:
1. Better error handling for expired/invalid tokens
2. Auto-create customers if missing during renewal
3. User-facing payment method management

**No Breaking Issues**: Current cron job failures are due to schema mismatches (member_id, wrong table names), NOT payment instrument handling.
