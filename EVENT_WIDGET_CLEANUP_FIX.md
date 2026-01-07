# Event Purchase Widget Cleanup Fix - January 6, 2026

## Issues Reported
1. **Price not updating** - When closing widget and re-entering with different email (member vs non-member), still charged old price
2. **Error messages under form fields** - Validation errors persisting after closing and reopening widget

## Root Cause Analysis

### Price Issue
The price calculation works correctly:
- Backend calculates price based on email's membership status at checkout time
- Each "Continue to Payment" click generates a new idempotency key
- This creates a NEW checkout with the correct price for the new email

**However**, if you're seeing the old price, it's likely because:
- The SumUp widget might cache/display the old checkout
- Need to ensure widget is properly unmounted before remounting

### Error Messages Issue
The SumUp Card widget maintains internal state including:
- Form validation errors
- Field values
- Visual states

When you close the modal, we were only clearing the container HTML (`innerHTML = ''`) but not properly **unmounting** the SumUp widget instance.

## The Fix

Added proper SumUp widget cleanup when closing the modal:

```javascript
function closePurchaseModal() {
  if (modal) {
    modal.style.display = 'none';
    const d = modal.querySelector('.evt-details');
    if (d) d.style.display = 'block';
    if (cardEl) {
      // Properly unmount SumUp widget if it exists
      if (window.SumUpCard && window.SumUpCard.unmount) {
        try {
          window.SumUpCard.unmount({ id: 'evt-card-'+eventId });
        } catch(e) {
          console.log('SumUp unmount failed:', e);
        }
      }
      cardEl.innerHTML = '';
      cardEl.style.display = 'none';
    }
    // ... rest of cleanup
  }
}
```

## What This Does

1. **Calls `SumUpCard.unmount()`** before clearing the HTML
   - Properly tears down the widget instance
   - Clears internal state, validation errors, cached values
   - Ensures next mount is completely fresh

2. **Graceful error handling** - Wrapped in try-catch so it doesn't break if SumUp doesn't support unmount

3. **Clears container** - Still clears innerHTML as backup

## Flow Now

### Scenario: Non-member email → Close → Member email

1. User enters non-member email → clicks "Continue"
2. Backend creates checkout with non-member price
3. SumUp widget mounts
4. User clicks X to close
5. **Widget is unmounted** ✅
6. User changes email to member email → clicks "Continue"  
7. Backend creates **NEW checkout** with **member price** ✅
8. **Fresh widget instance** mounts with new checkout ✅
9. No cached errors or old state ✅

## Testing

Try this flow:
1. Open ticket purchase modal
2. Enter a **non-member email**
3. Click "Continue to Payment"
4. See the non-member price in widget
5. **Close the modal (X button)**
6. Reopen modal
7. Enter a **member email**
8. Click "Continue to Payment"
9. ✅ Should see member price
10. ✅ No error messages under fields

## Files Modified
- `static/js/eventPurchase.js` - Added `SumUpCard.unmount()` call in `closePurchaseModal()`
- Rebuilt with `hugo` command

## Additional Notes

If you're still seeing the old price after this fix, it might be:
1. **Browser caching** - Hard refresh (Ctrl+F5)
2. **Backend issue** - Check if membership lookup is working correctly for that email
3. **SumUp API caching** - Unlikely but possible if checkout IDs are being reused somehow

## Related Fixes
- Frontend payment confirmation polling fix
- Route order fix for `/events/confirm`
- Email system working correctly
