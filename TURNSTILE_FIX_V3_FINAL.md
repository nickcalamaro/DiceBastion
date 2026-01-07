# Turnstile Widget Fix v3 - Race Condition Resolution

## The Actual Problem

The error occurred when closing the **event modal** (not the payment widget). Here's what was happening:

### Race Condition Timeline
```
1. User clicks "Buy Ticket"
   └─> openPurchaseModal() called
       ├─> modal.style.display = 'flex'
       └─> setTimeout(renderTurnstile, 50ms)  ← Timeout scheduled

2. User clicks "×" to close (within 50ms)
   └─> closePurchaseModal() called
       ├─> Tries to remove turnstileWidgetId (null - not rendered yet)
       └─> modal.style.display = 'none'

3. 50ms timer fires (modal now hidden!)
   └─> renderTurnstile() executes
       └─> Renders widget in HIDDEN modal
           └─> Turnstile creates widget, assigns internal ID
               └─> But our code doesn't know about it!

4. User clicks "Buy Ticket" again
   └─> openPurchaseModal() called
       └─> setTimeout(renderTurnstile, 50ms)

5. 50ms timer fires
   └─> renderTurnstile() tries to render
       └─> ERROR: "Could not find widget for provided container"
           └─> Turnstile still has orphaned widget from step 3
```

### Root Cause
**Uncancelled setTimeout** continued to execute after the modal was closed, rendering a widget in a hidden container. This orphaned widget prevented future renders.

## The Solution

### 1. Track the Timeout ID ✅
```javascript
let turnstileRenderTimeout = null; // Store timeout ID
```

### 2. Cancel Timeout When Closing ✅
```javascript
function closePurchaseModal() {
  // Cancel pending render if modal closes before timeout fires
  if (turnstileRenderTimeout !== null) {
    clearTimeout(turnstileRenderTimeout);
    turnstileRenderTimeout = null;
    console.log('Cancelled pending Turnstile render');
  }
  // ... rest of cleanup
}
```

### 3. Check Modal Visibility Before Rendering ✅
```javascript
async function renderTurnstile() {
  // Check if modal is still visible
  if (!modal || modal.style.display === 'none') {
    console.log('Modal closed, skipping Turnstile render');
    return; // Don't render if modal was closed
  }
  // ... render widget
}
```

### 4. Store Timeout ID When Scheduling ✅
```javascript
function openPurchaseModal() {
  modal.style.display = 'flex';
  
  // Store timeout ID so we can cancel it
  turnstileRenderTimeout = setTimeout(() => {
    turnstileRenderTimeout = null; // Clear after firing
    renderTurnstile().catch(...);
  }, 50);
}
```

### 5. Clear Container as Failsafe ✅
```javascript
function closePurchaseModal() {
  // ... remove widget ...
  
  // Clear container to remove any orphaned widgets
  const tsEl = document.getElementById('evt-ts-'+eventId);
  if (tsEl) {
    tsEl.innerHTML = '';
  }
}
```

## Complete Code Changes

### Variables
```javascript
function initEventPurchase(event) {
  let turnstileWidgetId = null;
  let turnstileRenderTimeout = null; // NEW: Track timeout
  // ...
}
```

### openPurchaseModal()
```javascript
function openPurchaseModal() {
  if (modal) {
    modal.style.display = 'flex';
    const nameInput = modal.querySelector('.evt-name');
    if (nameInput) nameInput.focus();
    
    // Store timeout ID so we can cancel it if needed
    turnstileRenderTimeout = setTimeout(() => {
      turnstileRenderTimeout = null; // Clear after firing
      renderTurnstile().catch((e) => {
        console.error('Failed to render Turnstile:', e);
      });
    }, 50);
  }
}
```

### closePurchaseModal()
```javascript
function closePurchaseModal() {
  if (modal) {
    // 1. Cancel pending render
    if (turnstileRenderTimeout !== null) {
      clearTimeout(turnstileRenderTimeout);
      turnstileRenderTimeout = null;
      console.log('Cancelled pending Turnstile render');
    }
    
    // 2. Remove rendered widget
    if (window.turnstile && turnstileWidgetId !== null) {
      try {
        console.log('Removing Turnstile widget:', turnstileWidgetId);
        window.turnstile.remove(turnstileWidgetId);
        turnstileWidgetId = null;
        console.log('Turnstile widget removed successfully');
      } catch(e) {
        console.error('Turnstile cleanup failed:', e);
        turnstileWidgetId = null;
      }
    }
    
    // 3. Clear container (failsafe)
    const tsEl = document.getElementById('evt-ts-'+eventId);
    if (tsEl) {
      tsEl.innerHTML = '';
    }
    
    // 4. Unmount SumUp widget
    unmountWidget();
    
    // 5. Hide modal and reset form
    modal.style.display = 'none';
    // ... rest of cleanup
  }
}
```

### renderTurnstile()
```javascript
async function renderTurnstile() {
  await loadTurnstileSdk();
  const tsEl = document.getElementById('evt-ts-'+eventId);
  if (!tsEl || !window.turnstile) return;
  
  // Check if modal is still visible (guard against race condition)
  if (!modal || modal.style.display === 'none') {
    console.log('Modal closed, skipping Turnstile render');
    return;
  }
  
  // Remove existing widget if present
  if (turnstileWidgetId !== null) {
    try {
      window.turnstile.remove(turnstileWidgetId);
      console.log('Turnstile widget removed:', turnstileWidgetId);
    } catch(e) {
      console.log('Turnstile remove failed:', e);
    }
    turnstileWidgetId = null;
  }
  
  // Clear container
  tsEl.innerHTML = '';
  
  // Delay for DOM readiness
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Render widget
  try {
    turnstileWidgetId = window.turnstile.render(tsEl, {
      sitekey: TURNSTILE_SITE_KEY,
      size: 'flexible'
    });
    console.log('Turnstile widget rendered with ID:', turnstileWidgetId);
  } catch(e) {
    console.error('Turnstile render failed:', e);
    turnstileWidgetId = null;
  }
}
```

## How It Works Now

### Normal Flow (Modal Stays Open)
```
1. User clicks "Buy Ticket"
   └─> modal.display = 'flex'
   └─> setTimeout(render, 50ms) → timeout ID stored

2. 50ms passes
   └─> renderTurnstile() executes
       ├─> Checks modal.display === 'flex' ✓
       └─> Renders widget with ID 0

3. User closes modal
   └─> clearTimeout() ← timeout already fired, no-op
   └─> widget.remove(0) ← widget removed cleanly
   └─> tsEl.innerHTML = '' ← container cleared
```

### Quick Close Flow (Closes Before 50ms)
```
1. User clicks "Buy Ticket"
   └─> modal.display = 'flex'
   └─> setTimeout(render, 50ms) → timeout ID stored

2. User closes modal (< 50ms)
   └─> clearTimeout() ← CANCELS timeout! ✓
   └─> widget.remove() ← no widget to remove (null)
   └─> tsEl.innerHTML = '' ← container cleared
   └─> modal.display = 'none'

3. Timeout would have fired here
   └─> BUT IT WAS CANCELLED ✓

4. User reopens modal
   └─> Fresh render, no conflicts ✓
```

### Race Condition Caught (Failsafe)
```
1. User clicks "Buy Ticket"
   └─> setTimeout(render, 50ms)

2. User closes modal
   └─> clearTimeout() attempts to cancel
   └─> But timeout fires at EXACT same moment

3. renderTurnstile() executes
   └─> Checks modal.display === 'none'
   └─> ABORTS: "Modal closed, skipping render" ✓
   └─> No widget created!
```

## Testing Scenarios

### Scenario 1: Normal Open/Close
1. Click "Buy Ticket" → wait 2 seconds → close
2. Console shows:
   ```
   Turnstile widget rendered with ID: 0
   Removing Turnstile widget: 0
   Turnstile widget removed successfully
   ```
3. ✅ No errors

### Scenario 2: Quick Open/Close
1. Click "Buy Ticket" → **immediately** click × (before widget renders)
2. Console shows:
   ```
   Cancelled pending Turnstile render
   ```
3. ✅ No "Could not find widget" error

### Scenario 3: Multiple Quick Open/Close
1. Rapidly click "Buy Ticket" → × → "Buy Ticket" → × → "Buy Ticket"
2. Console shows cancellations and successful renders
3. ✅ No errors, clean state every time

### Scenario 4: Open → Wait → Close → Reopen
1. Open → wait for widget → close → open again
2. Console shows:
   ```
   Turnstile widget rendered with ID: 0
   Removing Turnstile widget: 0
   Turnstile widget removed successfully
   Turnstile widget rendered with ID: 1
   ```
3. ✅ Fresh widget with new ID

## Files Modified

- **`static/js/eventPurchase.js`**
  - Added `turnstileRenderTimeout` variable
  - Updated `openPurchaseModal()` to store timeout ID
  - Updated `closePurchaseModal()` to cancel timeout and clear container
  - Updated `renderTurnstile()` to check modal visibility

## Deployment

✅ Hugo rebuilt successfully (525ms, 27 pages)

## Key Takeaways

1. **Cancel Async Operations** - Always cancel pending timeouts/promises when cleaning up
2. **Track Timeout IDs** - Store `setTimeout` return value so you can `clearTimeout` later
3. **Guard Against Race Conditions** - Check state before executing delayed operations
4. **Defensive Programming** - Multiple layers of protection (cancel + visibility check + container clear)
5. **Clear Logging** - Console messages help debug timing issues

## Why This Fixes The Error

### Before
- Timeout fires even after modal closes
- Widget rendered in hidden container
- Orphaned widget prevents future renders
- Error: "Could not find widget for provided container"

### After
- Timeout cancelled when modal closes quickly
- Visibility check prevents render in hidden modal
- Container cleared as failsafe
- Fresh widget every time, no conflicts

---

**This should COMPLETELY resolve the Turnstile error!** The race condition is now handled with:
1. Timeout cancellation (prevents scheduled render)
2. Visibility check (prevents render in hidden modal)
3. Container clearing (removes any orphaned widgets)
