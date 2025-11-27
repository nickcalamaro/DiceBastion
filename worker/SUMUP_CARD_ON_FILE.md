# SumUp Card-on-File Configuration Issue

## Current Status: ⚠️ BLOCKED

Auto-renewal functionality is **ready but cannot function** because SumUp's card-on-file feature is not returning payment instrument tokens.

## What We've Verified ✅

1. **OAuth Scope Granted**: `payment_instruments` scope is successfully approved
   - Debug endpoint confirms: `hasPaymentInstruments: true`
   - Token includes both `payments` and `payment_instruments` scopes

2. **Code Implementation Complete**:
   - Checkout requests include `save_payment_instrument: true`
   - OAuth token requests `payment_instruments` scope
   - Payment instrument storage logic implemented
   - Auto-renewal cron job ready
   - Email notifications configured

3. **API Endpoints Called**:
   - ✅ Checkout creation with `save_payment_instrument: true` - works
   - ❌ `/v0.1/me/payment-instruments` - returns 404 "Resource not found"
   - ❌ Checkout response missing `payment_instrument` field
   - ❌ Transaction data missing `card` or `payment_instrument` field

## The Problem ❌

Despite having the OAuth scope approved and sending the correct parameters, SumUp is **not tokenizing cards**:

### Expected Behavior:
```json
{
  "payment_instrument": {
    "token": "tok_abc123...",
    "card_type": "VISA",
    "last_4_digits": "4242",
    "expiry_month": 12,
    "expiry_year": 2025
  }
}
```

### Actual Behavior:
```json
{
  "transactions": [{
    "amount": 1,
    "status": "SUCCESSFUL",
    "transaction_code": "TAAAYN9P99K"
    // NO payment_instrument or card field
  }]
}
```

## Root Cause Analysis

**SumUp's card-on-file feature requires additional merchant account configuration** beyond OAuth scope approval. Having the `payment_instruments` scope allows API access, but the feature itself must be enabled on the merchant account.

This is similar to how Stripe requires:
- Enabling "Payment Methods" feature
- Accepting updated terms of service
- Merchant account approval for recurring billing

## Required Action 🔧

**Contact SumUp Support** with the following information:

### Support Request Template:

```
Subject: Enable Card-on-File / Saved Payment Instruments for Merchant Account

Hello SumUp Support,

I need to enable the "Saved Payment Instruments" / "Card-on-File" feature 
for auto-renewal functionality on my merchant account.

Merchant Details:
- Merchant Code: MUZHYEAH
- Merchant Name: Gibraltar Warhammer Club
- Email: ncalamaro@gmail.com

Current Status:
- OAuth scope "payment_instruments" has been approved
- API integration is complete and tested
- Checkouts include "save_payment_instrument: true" parameter
- BUT: No payment instrument tokens are being returned

Issues Encountered:
1. GET /v0.1/me/payment-instruments returns 404 "Resource not found"
2. Checkout responses do not include "payment_instrument" field
3. Transaction data does not include card tokenization info

Questions:
1. Does my merchant account have "Card-on-File" / "Recurring Payments" enabled?
2. Are there additional requirements or terms I need to accept?
3. Is there a merchant dashboard setting I need to enable?
4. Are there any compliance or verification steps needed for this feature?

Use Case:
We need to automatically renew monthly/quarterly/annual memberships by 
charging saved cards before expiration (with customer consent).

Please advise on the steps needed to enable this feature.

Thank you!
```

### SumUp Support Channels:
- **Email**: support@sumup.com
- **Developer Support**: developers@sumup.com
- **Phone**: Check your SumUp merchant dashboard for regional support number
- **Dashboard**: https://me.sumup.com/

## Workaround Options (If SumUp Can't Enable Feature)

### Option 1: Email-Based Renewal (Recommended)
Send renewal reminder emails with a payment link:

```javascript
// Send 7 days before expiration
const emailContent = {
  subject: 'Your Dice Bastion Membership is Expiring Soon',
  html: `
    <p>Your ${plan} membership expires on ${endDate}.</p>
    <p><a href="https://dicebastion.com/memberships/renew?id=${membershipId}">
      Click here to renew your membership
    </a></p>
  `
}
```

### Option 2: Manual Payment Method Update
Create a dedicated flow where users can update their payment method:
- User logs into account
- Clicks "Update Payment Method"
- Completes a test £0.01 authorization
- Card is saved for future renewals

### Option 3: Switch to Stripe
Stripe has mature support for:
- Payment Methods API (card-on-file)
- Subscriptions with automatic billing
- Strong Customer Authentication (SCA) compliance
- Extensive card network support

## Technical Notes

### Tested API Approaches:
1. ✅ Requesting `payment_instruments` scope in OAuth - works
2. ✅ Setting `save_payment_instrument: true` in checkout - accepted but ignored
3. ❌ Fetching from `/v0.1/me/payment-instruments` - 404 error
4. ❌ Extracting from checkout response - field not present
5. ❌ Extracting from transaction endpoint - 404 error
6. ❌ Extracting from checkout.transactions array - no card data

### Current Database State:
- `payment_instruments` table: **0 rows** (empty)
- `renewal_log` table: **0 rows** (empty)
- Auto-renewal cron job: **ready but will fail** (no saved cards to charge)

### What Happens Now:
1. Users can enable auto-renewal ✅
2. System saves `auto_renew = 1` in database ✅
3. Cron job will attempt to process renewals ⏰
4. Renewals will **fail** with error: "No active payment instrument" ❌
5. Users receive "Renewal Failed" email ✅

## Timeline

- **Code Implementation**: ✅ Complete
- **Testing Infrastructure**: ✅ Complete (14 tests passing)
- **OAuth Scope Approval**: ✅ Complete
- **Card Tokenization**: ❌ **BLOCKED - Waiting on SumUp**
- **Auto-Renewal Production Ready**: ⏳ Pending SumUp support resolution

## Related Files

- `worker/src/index.js` - Lines 298-403: `savePaymentInstrument()` function
- `worker/src/index.js` - Lines 405-486: Auto-renewal processing logic
- `worker/test/index.test.js` - Automated test suite (all passing)
- `AUTO_RENEWAL_IMPLEMENTATION.md` - Full technical documentation

## Update Log

- **2025-11-26 23:53**: Confirmed OAuth scope is granted
- **2025-11-26 23:53**: Confirmed SumUp API not returning payment instruments
- **2025-11-26 23:53**: Root cause identified: Merchant account feature not enabled
- **2025-11-26 23:53**: Created this documentation for SumUp support request
