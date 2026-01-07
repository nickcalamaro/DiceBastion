# Testing Guide - Dice Bastion Fixes

## Overview
This guide provides step-by-step testing procedures for the recently deployed fixes to the Dice Bastion event ticket payment system.

**Date:** January 6, 2026  
**Deployment Status:** ✅ Both fixes deployed to production

---

## 🎯 What Was Fixed

### 1. Turnstile Widget Lifecycle (CRITICAL)
- **Issue:** "Could not find widget for provided container" error when reopening event modals
- **Root Causes:** 
  - Auto-render conflict from HTML `class="cf-turnstile"` attribute
  - Race condition with setTimeout continuing after modal closed
  - Browser cache serving old JavaScript
- **Solution:** 
  - Removed auto-render attributes
  - Added timeout tracking and cancellation
  - Added visibility checks before rendering
  - DOM node replacement for complete cleanup
  - Cache-busting version parameter (`?v=3`)

### 2. Admin Login Endpoint (CRITICAL)
- **Issue:** `/admin/login` returning 404 errors, preventing admin access
- **Solution:** 
  - Created `/admin/login` POST endpoint in worker
  - Session-based authentication with `user_sessions` table
  - bcrypt password verification
  - 7-day session expiration
  - Created `/admin/logout` endpoint

---

## 🧪 Testing Checklist

### Pre-Testing Setup

1. **Clear Browser Cache (CRITICAL)**
   ```
   Press: Ctrl + Shift + R (Windows)
   Or: Cmd + Shift + R (Mac)
   ```
   This is essential to load the new JavaScript file with Turnstile fixes.

2. **Open Developer Console**
   ```
   Press: F12
   Navigate to: Console tab
   ```
   Monitor for any errors during testing.

### Test 1: Turnstile Widget Lifecycle ⭐⭐⭐

**Objective:** Verify Turnstile widget renders correctly without errors when opening/closing modal multiple times.

**Steps:**
1. Navigate to an event page (e.g., `/events/weekly-game-night/`)
2. Click "Buy Ticket" button
3. **Verify:** Modal opens with Turnstile widget visible
4. **Check Console:** Should see `Turnstile widget rendered with ID: [number]`
5. Click "×" to close modal
6. **Check Console:** Should see:
   - `Turnstile widget removed: [number]`
   - `Turnstile container replaced with fresh clone`
7. Click "Buy Ticket" again
8. **Verify:** Turnstile widget renders fresh (no errors)
9. **Repeat steps 5-8** at least 3 more times

**Expected Results:**
- ✅ Widget renders every time without errors
- ✅ No "Could not find widget" errors in console
- ✅ Console shows proper cleanup on modal close
- ✅ Each render gets a new widget ID

**Known Issues to Watch For:**
- ❌ Widget shows error message instead of challenge
- ❌ Console error: "Could not find widget for provided container"
- ❌ Widget doesn't appear after 2nd+ modal open

---

### Test 2: Admin Login (New Feature) ⭐⭐⭐

**Objective:** Verify admin users can log in and access dashboard.

**Prerequisites:** You need admin credentials. If you don't have them, create an admin user:

```powershell
cd c:\Users\nickc\Desktop\Dev\DiceBastion\worker
.\create-admin-user.ps1 -email "admin@dicebastion.com" -password "your-secure-password" -name "Admin User"
```

**Steps:**
1. Navigate to `/admin`
2. **Verify:** Login form is visible
3. Enter email and password
4. Click "Login" button
5. **Check Console Network Tab:** 
   - Look for POST request to `/admin/login`
   - Should return 200 status with JSON response
6. **Verify:** Dashboard loads with Products/Events/Orders tabs
7. Click "Logout" button
8. **Verify:** Returns to login screen
9. Try logging in with wrong password
10. **Verify:** Shows "Invalid email or password" error

**Expected Results:**
- ✅ Login form displays correctly
- ✅ Valid credentials authenticate successfully
- ✅ Dashboard shows after login
- ✅ Invalid credentials show error message
- ✅ Logout returns to login screen
- ✅ Session persists on page refresh (if logged in)

**API Endpoints to Verify:**
- `POST /admin/login` - Returns 200 with session token
- `POST /admin/logout` - Returns 200

---

### Test 3: End-to-End Ticket Purchase ⭐⭐

**Objective:** Complete a full ticket purchase flow.

**Steps:**
1. Navigate to an event page
2. Click "Buy Ticket"
3. Fill in:
   - Full name: "Test User"
   - Email: "test@example.com"
4. Check privacy policy checkbox
5. Complete Turnstile challenge
6. Click "Continue to Payment"
7. **Verify:** SumUp payment widget loads
8. Use test card: `4200 0000 0000 0000`
   - Expiry: Any future date (e.g., 12/28)
   - CVV: Any 3 digits (e.g., 123)
9. Complete payment
10. **Verify:** Success message appears

**Expected Results:**
- ✅ All form fields work correctly
- ✅ Turnstile challenge completes
- ✅ Payment widget loads without errors
- ✅ Test payment processes successfully
- ✅ Success message displayed

**Check Backend:**
```powershell
cd c:\Users\nickc\Desktop\Dev\DiceBastion\worker
npx wrangler d1 execute dicebastion-db --command "SELECT * FROM event_orders ORDER BY created_at DESC LIMIT 1"
```
Should show your new test order.

---

### Test 4: Admin Dashboard Operations ⭐

**Objective:** Verify admin can manage products, events, and view orders.

**Prerequisites:** Must be logged in as admin (see Test 2).

**Steps:**
1. Login to `/admin`
2. **Products Tab:**
   - Click "Add Product" button
   - Verify modal opens
   - Cancel without saving
3. **Events Tab:**
   - Click "Add Event" button
   - Verify modal opens
   - Cancel without saving
4. **Orders Tab:**
   - Verify recent orders display
   - Check if your test order from Test 3 appears

**Expected Results:**
- ✅ All tabs load without errors
- ✅ Add/Edit modals open correctly
- ✅ Orders display with correct data
- ✅ No console errors

---

## 🐛 Troubleshooting

### Turnstile Widget Issues

**Problem:** Widget still shows errors after cache clear
- **Solution:** Hard refresh with DevTools open
  - Open DevTools (F12)
  - Right-click browser refresh button
  - Select "Empty Cache and Hard Reload"

**Problem:** Widget renders but shows error message
- **Possible Cause:** Turnstile site key issue
- **Check:** Verify `TURNSTILE_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k'` in console

**Problem:** Console shows "Turnstile not ready"
- **Solution:** Wait longer before clicking Continue
- **Check:** Ensure Cloudflare script loaded (Network tab)

### Admin Login Issues

**Problem:** "Invalid credentials" for known-good password
- **Check Database:**
  ```powershell
  cd c:\Users\nickc\Desktop\Dev\DiceBastion\worker
  npx wrangler d1 execute dicebastion-db --command "SELECT email, is_admin, is_active FROM users WHERE is_admin = 1"
  ```
- **Verify:** User has `is_admin = 1` and `is_active = 1`

**Problem:** Login succeeds but dashboard doesn't load
- **Check Console:** Look for JavaScript errors
- **Check Network Tab:** Verify `/admin/products`, `/admin/events` return 200

**Problem:** 401 Unauthorized on protected endpoints
- **Solution:** Session may have expired, log out and back in
- **Check:** `localStorage.getItem('admin_session')` in console

### Payment Flow Issues

**Problem:** Payment widget doesn't load
- **Check Console:** Look for SumUp SDK errors
- **Check Network:** Verify `https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js` loads

**Problem:** Payment completes but no confirmation
- **Check:** Backend may be polling SumUp status
- **Wait:** Up to 30 seconds for confirmation
- **Check Database:** See Test 3 database query

---

## 📊 Deployment Information

### Frontend (Hugo Site)
- **Build Status:** ✅ Compiled successfully (455ms, 27 pages)
- **Cache Busting:** Version 3 (`eventPurchase.js?v=3`)
- **Files Modified:**
  - `static/js/eventPurchase.js`
  - `layouts/partials/eventModal.html`

### Backend (Cloudflare Worker)
- **Deployment Status:** ✅ Live in production
- **Version:** `9c742353-4105-40f9-9aca-eeeb970a505a`
- **URL:** `https://dicebastion-memberships.ncalamaro.workers.dev`
- **Endpoints Added:**
  - `POST /admin/login`
  - `POST /admin/logout`

### Database Changes
- **Table:** `user_sessions` (created automatically by login endpoint)
- **Schema:**
  ```sql
  CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_activity TEXT NOT NULL
  )
  ```

---

## 🎉 Success Criteria

All tests pass if:

1. ✅ Turnstile widget renders/removes cleanly 5+ times in a row
2. ✅ Admin can log in with valid credentials
3. ✅ Complete ticket purchase flows without errors
4. ✅ No console errors during normal operation
5. ✅ Dashboard loads and displays data correctly

---

## 📝 Reporting Issues

If you encounter issues during testing:

1. **Capture Console Logs:**
   - Copy all errors/warnings from Console tab
   
2. **Capture Network Logs:**
   - Filter Network tab to show failed requests (red)
   - Note the endpoint and status code
   
3. **Note Reproduction Steps:**
   - What you clicked/entered
   - In what order
   - What you expected vs what happened

4. **Browser/Environment:**
   - Browser name and version
   - Operating system
   - Any browser extensions that might interfere

---

## 🔄 Next Steps After Testing

If all tests pass:
1. ✅ Mark both issues as RESOLVED
2. 📚 Update production documentation
3. 🎯 Monitor for any edge cases in production use

If tests fail:
1. 🐛 Document specific failure scenarios
2. 🔍 Review console/network logs
3. 🔧 Create targeted fixes
4. 🔄 Redeploy and retest

---

## 📚 Related Documentation

- `TURNSTILE_FIX_V3_FINAL.md` - Complete Turnstile fix details
- `ADMIN_LOGIN_FIX.md` - Admin authentication implementation
- `CACHE_BUSTING_FIX.md` - Browser cache solution
- `worker/ADMIN_SETUP.md` - Admin user management guide

---

**Last Updated:** January 6, 2026  
**Tested By:** _Awaiting testing_  
**Status:** 🟡 Ready for Testing
