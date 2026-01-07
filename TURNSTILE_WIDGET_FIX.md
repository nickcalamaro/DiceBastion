# Cloudflare Turnstile Widget Lifecycle Fix

## Problem
When closing the payment modal and reopening it, Cloudflare Turnstile was throwing an error:
```
[Cloudflare Turnstile] Could not find widget for provided container.
```

## Root Cause
The Turnstile widget has a specific lifecycle that needs to be managed:

1. **Initial Issue**: Code was calling `window.turnstile.reset('#evt-ts-' + eventId)` with a CSS selector
2. **Problem**: Turnstile's `reset()` method expects a **widget ID** (number), not a selector
3. **Side Effect**: When the modal was closed, the widget wasn't properly removed
4. **Result**: On reopening, Turnstile couldn't find the widget container because the old widget was still registered

## Solution

### 1. Store Widget ID
Added `turnstileWidgetId` variable to track the widget instance:

```javascript
function initEventPurchase(event) {
  const eventId = String(event.id);
  let turnstileWidgetId = null; // Track the widget ID
  // ...
}
```

### 2. Created `renderTurnstile()` Function
Properly manages widget lifecycle with render/remove:

```javascript
async function renderTurnstile() {
  await loadTurnstileSdk();
  const tsEl = document.getElementById('evt-ts-'+eventId);
  if (!tsEl || !window.turnstile) return;
  
  // Remove existing widget if present
  if (turnstileWidgetId !== null) {
    try {
      window.turnstile.remove(turnstileWidgetId);
    } catch(e) {
      console.log('Turnstile remove failed:', e);
    }
    turnstileWidgetId = null;
  }
  
  // Clear the container
  tsEl.innerHTML = '';
  
  // Render new widget and store the ID
  try {
    turnstileWidgetId = window.turnstile.render('#evt-ts-'+eventId, {
      sitekey: TURNSTILE_SITE_KEY,
      size: 'flexible'
    });
  } catch(e) {
    console.log('Turnstile render failed:', e);
  }
}
```

### 3. Updated `openPurchaseModal()`
Renders fresh Turnstile widget when opening:

```javascript
function openPurchaseModal() {
  if (modal) {
    modal.style.display = 'flex';
    const nameInput = modal.querySelector('.evt-name');
    if (nameInput) nameInput.focus();
    
    // Render fresh Turnstile widget when opening
    renderTurnstile().catch(() => {});
  }
}
```

### 4. Updated `closePurchaseModal()`
Properly removes widget using stored ID:

```javascript
function closePurchaseModal() {
  // ... other cleanup ...
  
  // Remove Turnstile widget properly using widget ID
  if (window.turnstile && turnstileWidgetId !== null) {
    try {
      window.turnstile.remove(turnstileWidgetId);
      turnstileWidgetId = null;
    } catch(e) {
      console.log('Turnstile cleanup failed:', e);
    }
  }
}
```

### 5. Updated `getTurnstileToken()`
Uses widget ID when available:

```javascript
async function getTurnstileToken() {
  await loadTurnstileSdk();
  const tsEl = document.getElementById('evt-ts-'+eventId);
  if (!tsEl || !window.turnstile) throw new Error('Turnstile not ready');
  
  // Get token using widget ID or fallback to container
  const token = turnstileWidgetId !== null 
    ? window.turnstile.getResponse(turnstileWidgetId)
    : window.turnstile.getResponse(tsEl);
    
  if (!token) throw new Error('Please complete the security check.');
  return token;
}
```

## How It Works Now

### Widget Lifecycle Flow

1. **User Opens Modal**
   ```javascript
   openPurchaseModal()
   └─> renderTurnstile()
       ├─> Remove old widget (if exists)
       ├─> Clear container HTML
       └─> Render fresh widget, store ID
   ```

2. **User Closes Modal**
   ```javascript
   closePurchaseModal()
   └─> window.turnstile.remove(turnstileWidgetId)
       └─> Widget completely removed
   ```

3. **User Reopens Modal**
   ```javascript
   openPurchaseModal()
   └─> renderTurnstile()
       └─> Clean render (no old widget exists)
   ```

## Key Differences

### Before (Incorrect ❌)
```javascript
// Closing modal
if (window.turnstile) {
  window.turnstile.reset('#evt-ts-'+eventId); // Wrong! Expects widget ID, not selector
}

// Opening modal
loadTurnstileSdk(); // Only loads SDK, doesn't render widget
```

**Problems:**
- `reset()` called with selector instead of widget ID
- Widget never properly removed from Turnstile's internal registry
- Container lost reference to widget
- Error on reopen: "Could not find widget for provided container"

### After (Correct ✅)
```javascript
// Closing modal
if (window.turnstile && turnstileWidgetId !== null) {
  window.turnstile.remove(turnstileWidgetId); // Correct! Uses stored widget ID
  turnstileWidgetId = null;
}

// Opening modal
renderTurnstile(); // Properly renders fresh widget and stores ID
```

**Benefits:**
- Widget removed using correct API method
- Widget ID tracked throughout lifecycle
- Fresh widget rendered on each open
- No orphaned widgets in Turnstile registry

## Turnstile API Methods Used

### `window.turnstile.render(selector, options)`
- Creates a new Turnstile widget
- Returns a widget ID (number)
- Must store this ID for later operations

### `window.turnstile.remove(widgetId)`
- Removes a widget from the page and Turnstile's registry
- Requires the widget ID returned from `render()`
- Properly cleans up all widget state

### `window.turnstile.getResponse(widgetId)`
- Gets the verification token from a completed challenge
- Can accept widget ID or container element
- Preferred to use widget ID when available

### `window.turnstile.reset(widgetId)` ❌ Not Used
- Resets a widget to its initial state
- **Not appropriate for our use case** - we want complete removal, not reset

## Testing Scenarios

### Scenario 1: Open and Close Multiple Times
1. Click "Buy Ticket" → Modal opens
2. ✅ Turnstile widget renders
3. Click "×" to close
4. ✅ Widget removed cleanly
5. Click "Buy Ticket" again
6. ✅ Fresh widget renders, no errors

### Scenario 2: Navigate Away and Back
1. Open modal → Turnstile renders
2. Close modal → Widget removed
3. Click browser back/forward
4. Open modal again
5. ✅ New widget renders correctly

### Scenario 3: Multiple Events on Same Page
1. Event A: Open → Turnstile renders with ID 1
2. Event A: Close → Widget 1 removed
3. Event B: Open → Turnstile renders with ID 2
4. Event A: Open → Turnstile renders with ID 3
5. ✅ Each event manages its own widget independently

## Files Modified

- **`static/js/eventPurchase.js`**
  - Added `turnstileWidgetId` tracking variable
  - Created `renderTurnstile()` function
  - Updated `openPurchaseModal()` to call `renderTurnstile()`
  - Updated `closePurchaseModal()` to properly remove widget
  - Updated `getTurnstileToken()` to use widget ID

## Deployment

- ✅ Hugo site rebuilt successfully (563ms, 27 pages)
- ✅ No JavaScript errors
- ⏳ Pending deployment to production

## Related Documentation

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- Event Widget State Management Fix (`EVENT_WIDGET_STATE_FIX.md`)
- Complete Payment Fixes (`COMPLETE_PAYMENT_FIXES.md`)

## Summary

The Turnstile widget now has proper lifecycle management:
- ✅ Fresh widget on every modal open
- ✅ Complete cleanup on modal close
- ✅ No orphaned widgets in registry
- ✅ No console errors
- ✅ Works reliably across multiple open/close cycles
