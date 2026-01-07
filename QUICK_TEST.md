# Quick Test - 2 Minute Verification

## ⚡ BEFORE TESTING: Clear Cache!
**Press:** `Ctrl + Shift + R` (critical for Turnstile fix)

---

## Test 1: Turnstile Widget (30 seconds)

1. Go to any event page
2. Click "Buy Ticket" 
3. ✅ Widget appears
4. Close modal (click ×)
5. Click "Buy Ticket" again
6. ✅ Widget appears again (no error)
7. **Repeat 3 more times**

**✅ PASS:** Widget works every time  
**❌ FAIL:** See "Could not find widget" error

---

## Test 2: Admin Login (30 seconds)

1. Go to `/admin`
2. Enter credentials:
   - Email: (your admin email)
   - Password: (your admin password)
3. Click "Login"
4. ✅ Dashboard appears with tabs

**✅ PASS:** Dashboard loads  
**❌ FAIL:** 404 error or "Invalid credentials"

**Need admin account?**
```powershell
cd worker
.\create-admin-user.ps1 -email "admin@test.com" -password "Test123!" -name "Admin"
```

---

## Test 3: Full Purchase Flow (60 seconds)

1. Event page → "Buy Ticket"
2. Fill form:
   - Name: "Test User"
   - Email: "test@example.com"
   - ✅ Privacy checkbox
3. Complete Turnstile challenge
4. Click "Continue to Payment"
5. Use test card: `4200 0000 0000 0000`
   - Expiry: `12/28`
   - CVV: `123`
6. Complete payment
7. ✅ Success message

**✅ PASS:** "Ticket confirmed!" appears  
**❌ FAIL:** Error at any step

---

## 🐛 Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| Turnstile error | Hard refresh (Ctrl+Shift+R) |
| Admin 404 | Check worker deployed |
| Widget won't load | Check console for errors |
| Payment fails | Use test card above |

---

## Console Commands (if needed)

**Check admin user exists:**
```powershell
cd worker
npx wrangler d1 execute dicebastion-db --command "SELECT email, is_admin FROM users WHERE is_admin = 1"
```

**View recent orders:**
```powershell
npx wrangler d1 execute dicebastion-db --command "SELECT * FROM event_orders ORDER BY created_at DESC LIMIT 5"
```

---

## ✅ All Good?

If all 3 tests pass:
- Both fixes are working correctly
- Ready for production use
- No further action needed

## ❌ Issues Found?

1. Note which test failed
2. Copy console errors (F12 → Console)
3. See full `TESTING_GUIDE.md` for detailed troubleshooting

---

**Status:** 🟢 Both fixes deployed  
**Date:** January 6, 2026
