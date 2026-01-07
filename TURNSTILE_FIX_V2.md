# Turnstile Widget Fix v2 - Auto-Render Prevention

## The Real Problem

The Turnstile widget was **auto-rendering** due to HTML attributes, which conflicted with our manual rendering approach.

### Root Cause
```html
<!-- OLD HTML - Causes auto-render -->
<div id="evt-ts-${eventId}" 
     class="cf-turnstile"           <!-- ❌ Triggers auto-render -->
     data-sitekey="${TURNSTILE_SITE_KEY}" 
     data-size="flexible">
</div>
```

When Cloudflare's Turnstile SDK loads, it automatically scans the page for elements with `class="cf-turnstile"` and renders widgets for them. This created a conflict:

1. **Page Load**: Turnstile SDK auto-renders widget (assigns internal ID)
2. **Modal Close**: Our code tries to remove widget using `turnstileWidgetId` (which is null because we didn't track the auto-rendered widget)
3. **Modal Reopen**: Our code tries to render a new widget in the same container
4. **Error**: `"Could not find widget for provided container"` because the old auto-rendered widget is still registered

## The Solution

### 1. Remove Auto-Render HTML Attributes ✅
```html
<!-- NEW HTML - Manual rendering only -->
<div id="evt-ts-${eventId}"></div>
```

**No** `class="cf-turnstile"`, **no** `data-sitekey`, **no** `data-size`. The container is completely empty until we manually render.

### 2. Pass Element (Not Selector) to render() ✅
```javascript
// OLD - Using selector
turnstileWidgetId = window.turnstile.render('#evt-ts-'+eventId, {
  sitekey: TURNSTILE_SITE_KEY,
  size: 'flexible'
});

// NEW - Using element
const tsEl = document.getElementById('evt-ts-'+eventId);
turnstileWidgetId = window.turnstile.render(tsEl, {
  sitekey: TURNSTILE_SITE_KEY,
  size: 'flexible'
});
```

### 3. Render After Modal is Visible ✅
```javascript
function openPurchaseModal() {
  // Show modal FIRST
  modal.style.display = 'flex';
  
  // Render Turnstile AFTER DOM update (small delay)
  setTimeout(() => {
    renderTurnstile().catch((e) => {
      console.error('Failed to render Turnstile:', e);
    });
  }, 50);
}
```

### 4. Remove Widget BEFORE Hiding Modal ✅
```javascript
function closePurchaseModal() {
  // Remove Turnstile FIRST (while still visible)
  if (window.turnstile && turnstileWidgetId !== null) {
    console.log('Removing Turnstile widget:', turnstileWidgetId);
    window.turnstile.remove(turnstileWidgetId);
    turnstileWidgetId = null;
  }
  
  // THEN hide modal
  modal.style.display = 'none';
}
```

### 5. Added Delay Before Render ✅
```javascript
async function renderTurnstile() {
  // ... remove old widget ...
  
  // Clear container
  tsEl.innerHTML = '';
  
  // Small delay to ensure DOM is ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Render widget
  turnstileWidgetId = window.turnstile.render(tsEl, {...});
  console.log('Turnstile widget rendered with ID:', turnstileWidgetId);
}
```

### 6. Added Comprehensive Logging ✅
```javascript
// Logs help debug lifecycle issues
console.log('Turnstile widget rendered with ID:', turnstileWidgetId);
console.log('Removing Turnstile widget:', turnstileWidgetId);
console.log('Turnstile widget removed successfully');
console.error('Turnstile render failed:', e);
```

## Complete Code Changes

### HTML Template (renderEventPurchase)
```javascript
// BEFORE
<div id="evt-ts-${eventId}" class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}" data-size="flexible"></div>

// AFTER
<div id="evt-ts-${eventId}"></div>
```

### renderTurnstile() Function
```javascript
async function renderTurnstile() {
  await loadTurnstileSdk();
  const tsEl = document.getElementById('evt-ts-'+eventId);
  if (!tsEl || !window.turnstile) return;
  
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
  
  // Clear the container completely
  tsEl.innerHTML = '';
  
  // Small delay to ensure DOM is ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Render new widget and store the ID
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

### openPurchaseModal() Function
```javascript
function openPurchaseModal() {
  if (modal) {
    // Show modal FIRST so Turnstile can render properly
    modal.style.display = 'flex';
    
    // Focus name input
    const nameInput = modal.querySelector('.evt-name');
    if (nameInput) nameInput.focus();
    
    // Render fresh Turnstile widget after modal is visible
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      renderTurnstile().catch((e) => {
        console.error('Failed to render Turnstile:', e);
      });
    }, 50);
  }
}
```

### closePurchaseModal() Function
```javascript
function closePurchaseModal() {
  if (modal) {
    // Remove Turnstile widget FIRST before hiding modal
    if (window.turnstile && turnstileWidgetId !== null) {
      try {
        console.log('Removing Turnstile widget:', turnstileWidgetId);
        window.turnstile.remove(turnstileWidgetId);
        turnstileWidgetId = null;
        console.log('Turnstile widget removed successfully');
      } catch(e) {
        console.error('Turnstile cleanup failed:', e);
        turnstileWidgetId = null; // Reset anyway
      }
    }
    
    // Use the unmount helper to properly clean up SumUp widget
    unmountWidget();
    
    // Hide modal
    modal.style.display = 'none';
    
    // ... rest of cleanup ...
  }
}
```

## Why This Works

### No Auto-Rendering Conflict
- Empty `<div>` doesn't trigger Turnstile's auto-scan
- Only our code controls when/how widgets are created

### Proper Timing
- Modal visible before widget renders (Turnstile needs visible container)
- Widget removed before modal hides (cleaner removal)
- Small delays ensure DOM has updated

### Complete Control
- We track every widget ID
- We remove every widget we create
- No orphaned widgets in Turnstile's registry

### Better Error Handling
- Try/catch around all Turnstile operations
- Logging helps debug issues
- Fallback to null on errors

## Testing

### Console Output on Success
```
Turnstile widget rendered with ID: 0
Removing Turnstile widget: 0
Turnstile widget removed successfully
Turnstile widget rendered with ID: 1
Removing Turnstile widget: 1
Turnstile widget removed successfully
```

### What to Check
1. Open browser console
2. Click "Buy Ticket"
3. See: `Turnstile widget rendered with ID: X`
4. Close modal
5. See: `Removing Turnstile widget: X` and `removed successfully`
6. Reopen modal
7. See: `Turnstile widget rendered with ID: Y` (new ID)
8. **No errors** about "Could not find widget"

## Files Modified

- **`static/js/eventPurchase.js`**
  - Removed `class="cf-turnstile"` and data attributes from HTML
  - Updated `renderTurnstile()` to pass element instead of selector
  - Added 100ms delay before rendering
  - Updated `openPurchaseModal()` to render after modal shown
  - Updated `closePurchaseModal()` to remove widget first
  - Added comprehensive console logging

## Deployment

✅ Hugo rebuilt successfully (598ms, 27 pages)

## Key Takeaways

1. **Don't mix auto-render and manual render** - Choose one approach
2. **Pass elements, not selectors** - More reliable with Turnstile API
3. **Timing matters** - Render when visible, remove before hiding
4. **Track everything** - Store widget IDs, clean up what you create
5. **Log operations** - Makes debugging much easier

---

**This should completely resolve the Turnstile widget error!**
