# Event Widget State Management Fix

## Problem
When users changed their email from non-member to member (or vice versa) during ticket purchase:
1. The SumUp payment widget would show the OLD price (e.g., £6 instead of £3)
2. Validation errors from previous attempts would persist
3. The widget wouldn't update properly when "Continue to Payment" was clicked again

## Root Cause
The SumUp Card widget maintains internal state including:
- Cached form validation errors
- Mounted component references
- Previous checkout session data

When users went back from the payment step and changed their email, a NEW checkout was created on the backend with the correct price, but the OLD widget instance was still mounted in the DOM. When `SumUpCard.mount()` was called again with the new checkout ID, it tried to reuse the existing instance instead of creating a fresh one.

## Solution

### 1. Created `unmountWidget()` Helper Function
```javascript
function unmountWidget() {
  // Properly unmount SumUp widget if it exists
  if (window.SumUpCard && window.SumUpCard.unmount) {
    try {
      window.SumUpCard.unmount({ id: 'evt-card-'+eventId });
      console.log('SumUp widget unmounted');
    } catch(e) {
      console.log('SumUp unmount failed:', e);
    }
  }
  if (cardEl) {
    cardEl.innerHTML = '';
    cardEl.style.display = 'none';
  }
}
```

### 2. Updated `mountWidget()` to Unmount Before Mounting
```javascript
async function mountWidget(checkoutId, orderRef) {
  try {
    await loadSumUpSdk();
  } catch(e) {
    showError('Payment widget failed.');
    return;
  }
  
  try {
    clearError();
    
    // First unmount any existing widget to ensure clean state
    unmountWidget();
    
    // Show payment section and hide details
    cardEl.style.display = 'block';
    modal.querySelector('.evt-details').style.display = 'none';
    
    // Mount fresh widget
    window.SumUpCard.mount({
      id: 'evt-card-'+eventId,
      checkoutId,
      onResponse: async (type, body) => { /* ... */ },
      onBack: () => {
        console.log('SumUp onBack triggered');
        // User clicked back button in widget - return to details
        unmountWidget();
        modal.querySelector('.evt-details').style.display = 'block';
      }
    });
  } catch(e) {
    console.error('SumUp mount error:', e);
    showError('Could not start payment');
  }
}
```

### 3. Added `onBack` Callback
The widget now properly handles when users click the back button inside the SumUp widget:
- Unmounts the widget cleanly
- Returns to the details step
- Allows users to change their email/name
- Creates a fresh checkout with updated pricing when they continue again

### 4. Refactored `closePurchaseModal()`
Now uses the `unmountWidget()` helper for consistent cleanup:
```javascript
function closePurchaseModal() {
  if (modal) {
    modal.style.display = 'none';
    const d = modal.querySelector('.evt-details');
    if (d) d.style.display = 'block';
    
    // Use the unmount helper to properly clean up widget
    unmountWidget();
    
    clearError();
    // ... rest of cleanup
  }
}
```

## Benefits

### ✅ Fresh Widget Every Time
- Widget is completely unmounted before mounting again
- No cached state from previous attempts
- Correct price displayed based on new email's membership status

### ✅ No Persistent Errors
- Validation errors are cleared when widget is unmounted
- Users get a clean slate when changing details

### ✅ Better UX
- Back button in widget works properly
- Users can easily change their email without seeing stale data
- Pricing updates correctly: non-member → member shows £3 instead of £6

### ✅ Consistent Behavior
- Same cleanup logic used everywhere (back button, close modal)
- Predictable state management

## Testing Scenarios

### Scenario 1: Non-Member → Member Email Change
1. User enters non-member email → clicks Continue
2. Widget loads with £6 price
3. User clicks Back (or closes widget)
4. User changes to member email → clicks Continue
5. ✅ Widget loads with £3 price (previously would show £6)

### Scenario 2: Validation Error Recovery
1. User enters email → clicks Continue
2. Widget shows validation error (e.g., card number invalid)
3. User clicks Back
4. User re-enters same email → clicks Continue
5. ✅ Widget loads fresh without previous error (previously would show old error)

### Scenario 3: Multiple Attempts
1. User tries checkout → abandons
2. User tries again with different email
3. User goes back and forth multiple times
4. ✅ Each attempt shows correct price and clean state

## Files Modified
- `static/js/eventPurchase.js`
  - Added `unmountWidget()` helper function
  - Updated `mountWidget()` to call `unmountWidget()` first
  - Added `onBack` callback to handle widget back button
  - Refactored `closePurchaseModal()` to use helper

## Deployment
- ✅ Hugo site rebuilt successfully (530ms, 27 pages)
- ⏳ Pending deployment to production
- No worker changes needed (backend already creates fresh checkouts correctly)

## Related Issues Fixed
- [x] Price not updating when email changes
- [x] Validation errors persisting across attempts
- [x] Widget back button not working properly
- [x] Stale widget state causing confusion
