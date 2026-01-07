# Deployment Checklist - Event Payment Flow Fixes

## ✅ Completed

### Code Changes
- [x] Fixed duplicate `API_BASE` declarations
- [x] Added `GET /events` endpoint to worker
- [x] Added `GET /events/:slug` endpoint to worker
- [x] Fixed route order (confirm before :slug)
- [x] Fixed frontend payment confirmation logic
- [x] Added proper widget cleanup (`unmount()`)
- [x] Created `unmountWidget()` helper function
- [x] Added `onBack` callback to widget
- [x] Refactored `closePurchaseModal()` to use helper

### Build & Deploy
- [x] Worker deployed to production (v: ba80f18a)
- [x] Hugo site built successfully (530ms, 27 pages)
- [x] No JavaScript errors in built files

### Testing
- [x] Events API returns data correctly
- [x] Payment confirmation endpoint works
- [x] Transaction status updated correctly
- [x] Ticket status updated correctly
- [x] Emails sent successfully
- [x] Frontend shows success message

## ⏳ Pending Production Deployment

### Hugo Site Deployment
The built site in `public/` folder needs to be deployed to production hosting.

**Files to deploy:**
```
public/
├── index.html
├── js/
│   └── eventPurchase.js  ← Contains all fixes
├── events/
│   └── *.html
└── ... (all other files)
```

**Deployment command** (adjust for your hosting):
```powershell
# Example for Netlify
netlify deploy --prod --dir=public

# Example for manual upload
# Copy entire public/ folder to production server
```

## 🧪 Post-Deployment Testing

### Test 1: Events Page Loads
- [ ] Visit `/events/` page
- [ ] Verify no JavaScript console errors
- [ ] Verify events list displays

### Test 2: Member Email - Correct Price
- [ ] Click "Buy Ticket" on any event
- [ ] Enter email: `admin@dicebastion.com` (known member)
- [ ] Click "Continue to Payment"
- [ ] Verify widget shows **£3** (member price)

### Test 3: Non-Member Email - Correct Price
- [ ] Close widget, reopen
- [ ] Enter email: `test@example.com` (non-member)
- [ ] Click "Continue to Payment"
- [ ] Verify widget shows **£6** (non-member price)

### Test 4: Email Change - Price Updates
- [ ] Close widget, reopen
- [ ] Enter email: `test@example.com` (non-member)
- [ ] Click "Continue to Payment" → widget shows £6
- [ ] Click back button in widget
- [ ] Change email to: `admin@dicebastion.com` (member)
- [ ] Click "Continue to Payment"
- [ ] Verify widget shows **£3** (should NOT show £6)

### Test 5: Validation Error Cleared
- [ ] Close widget, reopen
- [ ] Enter email, click "Continue to Payment"
- [ ] Enter invalid card number in widget
- [ ] See validation error
- [ ] Click back button
- [ ] Click "Continue to Payment" again
- [ ] Verify **NO** validation error shown (fresh widget)

### Test 6: Complete Payment Flow
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Verify success message shown
- [ ] Check email for confirmation
- [ ] Verify NO false "Payment failed" message

### Test 7: Widget Back Button
- [ ] Open ticket purchase
- [ ] Enter details, click "Continue to Payment"
- [ ] Click back button in SumUp widget
- [ ] Verify returns to details form
- [ ] Verify can edit email/name
- [ ] Click "Continue to Payment" again
- [ ] Verify widget loads correctly

## 🔍 Monitoring

### What to Watch
- Browser console for JavaScript errors
- Network tab for failed API calls
- Worker logs for backend errors
- Email delivery rates
- SumUp webhook responses

### Expected Behavior
- ✅ Events page loads without errors
- ✅ Widget shows correct price based on email
- ✅ Price updates when email changes
- ✅ No validation errors persist
- ✅ Back button works smoothly
- ✅ Payments confirm correctly
- ✅ Emails sent reliably

## 📝 Rollback Plan

If issues occur after deployment:

### Quick Rollback - Frontend Only
```powershell
# Revert public/js/eventPurchase.js to previous version
git checkout HEAD~1 -- static/js/eventPurchase.js
hugo
# Deploy public/ folder
```

### Full Rollback - Worker + Frontend
```powershell
# Frontend
git checkout HEAD~6  # Or specific commit before changes

# Worker
cd worker
wrangler rollback  # Rollback to previous deployment
```

## 🎯 Success Criteria

All of these should be TRUE after deployment:

1. **No JavaScript Errors**
   - Events page loads cleanly
   - No console errors

2. **Correct Pricing**
   - Member emails show £3
   - Non-member emails show £6
   - Price updates when email changes

3. **Clean Widget State**
   - No validation errors persist
   - Back button works
   - Fresh state on each mount

4. **Payment Confirmation**
   - Payments confirm correctly
   - No false "Payment failed" messages
   - Success message shown

5. **Email Delivery**
   - Customer confirmation sent
   - Admin notification sent

6. **Database Updates**
   - Ticket status = "active"
   - Transaction status = "PAID"

## 📞 Support Contacts

**If issues arise:**
- Check browser console first
- Check worker logs: `wrangler tail`
- Check database: Transaction and ticket status
- Check SumUp dashboard for payment status

## 🎉 Deployment Complete When...

- [ ] Hugo site deployed to production
- [ ] All 7 post-deployment tests pass
- [ ] No errors in browser console
- [ ] Test purchase completes successfully
- [ ] Emails received correctly
- [ ] Database records correct

---

**Current Status:** ✅ Code ready, awaiting production deployment

**Last Updated:** January 6, 2026
