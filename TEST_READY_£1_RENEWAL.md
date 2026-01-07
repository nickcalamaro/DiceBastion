# £1 Auto-Renewal Test - Ready to Go!

## ✅ What's Updated

### Backend Changes
1. **Custom Test Amount Support** - Worker now accepts `plan: 'test'` with custom `amount`
2. **Enhanced Response** - Checkout endpoint now returns:
   - `membershipId` - For renewal testing
   - `userId` - For database queries
   - `customerId` - SumUp customer ID
   - `amount` & `currency` - Confirmation

### Frontend Test Page
1. **£1 Payment** - Changed from £5 to £1 for testing
2. **Instant Renewal Button** - Test recurring payment immediately after first charge
3. **Real-time Logs** - See every step of the process
4. **Privacy Consent** - Added required field

---

## 🧪 How to Test (Simple Steps)

### Step 1: Open Test Page (Already Open!)
The test page should be open in your browser at:
```
file:///c:/Users/nickc/Desktop/Dev/DiceBastion/test-auto-renewal-purchase.html
```

### Step 2: Fill in the Form
1. **Worker URL**: `https://dicebastion-memberships.ncalamaro.workers.dev`
2. **Email**: Your test email
3. **Name**: Your name
4. **✅ Enable auto-renewal**: Keep CHECKED (critical!)
5. **✅ Accept terms**: Check it
6. **✅ Privacy consent**: Check it

### Step 3: Make £1 Payment
1. Click "Initialize Payment Widget"
2. Enter your real card details in the SumUp widget
3. Complete payment (you'll be charged £1.00)
4. Watch the logs - they'll show if tokenization succeeded

### Step 4: Test Instant Renewal (30 seconds later!)
Once payment succeeds:
1. **Renewal section appears** automatically
2. **Enter your Admin Key** (from your `.env` or Cloudflare dashboard)
3. **Click "Test Renewal Now"**
4. Your card will be charged another £1.00 using the saved token
5. **Success = Tokenization Works!** 🎉

---

## 🔍 What You're Testing

### First Payment (£1.00)
- ✅ Creates membership with `plan: 'test'`
- ✅ Creates SumUp customer (`USER-{userId}`)
- ✅ Creates checkout with `purpose: SETUP_RECURRING_PAYMENT`
- ✅ **Saves payment token** to `payment_instruments` table
- ✅ Links token to membership

### Instant Renewal (Another £1.00)
- ✅ Fetches saved payment instrument
- ✅ Uses token to charge card **without user input**
- ✅ Extends membership
- ✅ Logs renewal in `renewal_log` table
- ✅ Creates transaction record

---

## 📊 Database Verification

After first payment, check D1:

```sql
-- Find your test membership
SELECT * FROM memberships 
WHERE email = 'your-test-email@example.com' 
ORDER BY created_at DESC LIMIT 1;

-- Should show:
-- plan: 'test'
-- auto_renew: 1
-- payment_instrument_id: 'tok_...'
```

```sql
-- Check payment instrument (tokenization)
SELECT * FROM payment_instruments 
WHERE user_id = [YOUR_USER_ID]  -- from above query
AND is_active = 1;

-- Should show:
-- instrument_id: 'tok_...' (THE TOKEN!)
-- card_type: 'VISA' or 'MASTERCARD'
-- last_4: last 4 digits
-- is_active: 1
```

After manual renewal:

```sql
-- Check renewal happened
SELECT * FROM renewal_log 
WHERE membership_id = [YOUR_MEMBERSHIP_ID]
ORDER BY attempt_date DESC;

-- Should show:
-- status: 'success'
-- payment_id: 'pay_...'
-- amount: '1.00'
```

---

## ✅ Success Criteria

### Phase 1: Initial Payment
- [ ] Payment widget loads
- [ ] £1.00 payment succeeds
- [ ] Logs show "TOKENIZATION SUCCESSFUL"
- [ ] Database has `payment_instruments` record with token
- [ ] Renewal section appears on page

### Phase 2: Instant Renewal
- [ ] Enter Admin Key
- [ ] Click "Test Renewal Now"
- [ ] Card charged £1.00 using saved token
- [ ] No card entry required (proves tokenization works!)
- [ ] Page shows success message
- [ ] Database shows renewal in `renewal_log`

### Phase 3: Verification
- [ ] Total charged: £2.00 (£1 + £1 renewal)
- [ ] Two transactions in database
- [ ] Membership end_date extended
- [ ] Payment instrument still active

---

## 🎯 Expected Flow

```
1. User fills form with auto-renewal ✅
   ↓
2. Creates checkout (£1, test plan, customerId)
   ↓
3. SumUp widget - user enters card
   ↓
4. Payment succeeds (£1.00 charged)
   ↓
5. Webhook: Saves payment token to database
   ↓
6. Page shows "Renewal Test" button
   ↓
7. User clicks "Test Renewal Now"
   ↓
8. API charges saved token (£1.00)
   ↓
9. NO CARD ENTRY - uses saved token!
   ↓
10. Success! Recurring payments work! 🎉
```

---

## 🔧 Troubleshooting

### "Turnstile Failed"
**Fix**: The test page uses `turnstileToken: 'test-bypass'`. Make sure your Cloudflare Turnstile is in test mode or disable verification for testing.

**Or** add real Turnstile widget to the page.

### "Unknown Plan: test"
**Fix**: The worker now accepts `plan: 'test'` with custom `amount`. Make sure you deployed the latest version.

### "Customer Not Found" on Renewal
**Fix**: The worker now auto-creates customers. Check Cloudflare logs for errors.

### Token Not Saved
**Checklist**:
1. Auto-renewal was checked ✅
2. Checkout had `purpose: SETUP_RECURRING_PAYMENT`
3. `customerId` was provided
4. Webhook was called after payment
5. Check worker logs for errors in `savePaymentInstrument()`

---

## 📝 Next Steps After Success

Once both payments work:

1. ✅ **Verified**: Tokenization works
2. ✅ **Verified**: Recurring payments work
3. ✅ **Next**: Test automated cron job renewals
4. ✅ **Next**: Test with real monthly memberships (£5)
5. 🚀 **Go Live** with confidence!

---

## 💡 Quick Tips

- **Total Cost**: £2.00 for complete test (initial + renewal)
- **Refundable**: You can refund both £1 charges from SumUp dashboard if needed
- **Safe**: Using test mode, real payments but low amounts
- **Fast**: Entire test takes ~2 minutes
- **Complete**: Tests the full auto-renewal flow end-to-end

---

## 🚀 Ready to Test!

The test page is open. Just:
1. Fill in your details
2. Enter your card
3. Test the renewal
4. Celebrate working tokenization! 🎉

Good luck! The logs will guide you through every step.
