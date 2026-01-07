# Login Endpoints Consolidated

**Worker Version:** `9c851dc8-50e5-481e-9bd3-e72756f12ad6`  
**Date:** 2024-01-06

## Overview

The login system has been refactored to eliminate code duplication. There are now **universal login endpoints** that work for all users (admin and non-admin), with the old `/admin/login` and `/admin/logout` endpoints maintained as legacy aliases for backward compatibility.

## Architecture

### Universal Endpoints (NEW)

#### `POST /login`
- **Purpose:** Universal login endpoint for ALL users
- **Accepts:** Any active user (admin or non-admin)
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "session_token": "uuid-token",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      "is_admin": true  // NEW: Flag for client-side role detection
    }
  }
  ```
- **Key Features:**
  - No longer requires `is_admin = 1` check (removed from WHERE clause)
  - Returns `is_admin` flag in user object for client-side routing
  - Creates 7-day session for any active user
  - Logs with `[Login]` prefix

#### `POST /logout`
- **Purpose:** Universal logout endpoint for ALL users
- **Headers:** `X-Session-Token: uuid-token`
- **Response:**
  ```json
  {
    "success": true
  }
  ```
- **Key Features:**
  - Invalidates session token
  - Works for both admin and non-admin users
  - Logs with `[Logout]` prefix

### Legacy Endpoints (BACKWARD COMPATIBLE)

#### `POST /admin/login`
- **Purpose:** Legacy admin login endpoint
- **Implementation:** Redirects internally to `POST /login`
- **Response:** Same as `/login` (includes `is_admin` flag)
- **Why Keep It:** Maintains backward compatibility with existing admin page

#### `POST /admin/logout`
- **Purpose:** Legacy admin logout endpoint
- **Implementation:** Redirects internally to `POST /logout`
- **Response:** Same as `/logout`
- **Why Keep It:** Maintains backward compatibility with existing admin page

## Code Changes

### Before (Duplicate Code)
```javascript
// /admin/login - 80 lines of login logic
app.post('/admin/login', async c => { /* ... full implementation ... */ })

// /admin/logout - 15 lines of logout logic
app.post('/admin/logout', async c => { /* ... full implementation ... */ })

// NO /login or /logout endpoints
```

### After (Single Source of Truth)
```javascript
// Universal endpoints with full implementation
app.post('/login', async c => { 
  // 80 lines of login logic for ALL users
  // Returns is_admin flag in response
})

app.post('/logout', async c => { 
  // 15 lines of logout logic
})

// Legacy aliases (simple redirects)
app.post('/admin/login', async c => {
  return app.fetch(new Request('/login', { ... }))
})

app.post('/admin/logout', async c => {
  return app.fetch(new Request('/logout', { ... }))
})
```

## Key Differences from Admin-Only Login

### Database Query Change
**Before:**
```sql
SELECT user_id, email, password_hash, name, is_admin, is_active
FROM users
WHERE email = ? AND is_admin = 1 AND is_active = 1
```

**After:**
```sql
SELECT user_id, email, password_hash, name, is_admin, is_active
FROM users
WHERE email = ? AND is_active = 1
```

The `is_admin = 1` check was **removed** to allow non-admin users to log in.

### Response Change
**Before:**
```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin Name"
    // No is_admin flag
  }
}
```

**After:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "is_admin": true  // NEW: Added for client-side routing
  }
}
```

## Client-Side Usage

### Admin Page (`/admin`)
```javascript
// Can use either endpoint (both work)
fetch('/admin/login', { ... })  // Legacy (redirects to /login)
fetch('/login', { ... })        // Direct (recommended)
```

### Login Page (`/login`)
```javascript
// Uses universal endpoint
const response = await fetch('/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})

const data = await response.json()

if (data.success) {
  // Role-based redirect
  if (data.user.is_admin) {
    window.location.href = '/admin'
  } else {
    showNonAdminMessage(data.user)
  }
}
```

### Footer (`loginStatus.js`)
```javascript
// Uses universal endpoints
fetch('/login', { ... })   // For login
fetch('/logout', { ... })  // For logout
```

## Benefits

1. **No Code Duplication:** Single implementation for login/logout logic
2. **Maintainability:** Changes only need to be made in one place
3. **Backward Compatible:** Old `/admin/login` still works
4. **Role Support:** Returns `is_admin` flag for client-side routing
5. **Universal:** Same endpoints work for all user types
6. **Future-Proof:** Easy to add non-admin features later

## Migration Guide

### For Existing Code
No changes required! The old `/admin/login` and `/admin/logout` endpoints still work exactly the same way.

### For New Code
Use the universal endpoints:
- Use `POST /login` instead of `POST /admin/login`
- Use `POST /logout` instead of `POST /admin/logout`
- Check `data.user.is_admin` for role-based routing

## Testing

### Test Admin Login
```bash
curl -X POST https://dicebastion-memberships.ncalamaro.workers.dev/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ncalamaro@gmail.com","password":"your_password"}'
```

Expected response includes `"is_admin": true`

### Test Non-Admin Login
```bash
curl -X POST https://dicebastion-memberships.ncalamaro.workers.dev/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonadmin@example.com","password":"their_password"}'
```

Expected response includes `"is_admin": false`

### Test Logout
```bash
curl -X POST https://dicebastion-memberships.ncalamaro.workers.dev/logout \
  -H "X-Session-Token: your-session-token"
```

### Test Legacy Endpoints
```bash
# Should work identically to /login
curl -X POST https://dicebastion-memberships.ncalamaro.workers.dev/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ncalamaro@gmail.com","password":"your_password"}'
```

## Summary

✅ **Duplicate code eliminated**  
✅ **Universal endpoints created** (`/login`, `/logout`)  
✅ **Legacy endpoints maintained** (`/admin/login`, `/admin/logout`)  
✅ **Role flag added** (`is_admin` in response)  
✅ **Backward compatible** (old code still works)  
✅ **Deployed** to production (version `9c851dc8-50e5-481e-9bd3-e72756f12ad6`)
