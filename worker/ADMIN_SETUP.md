# Admin User Setup Guide

## Overview
The admin dashboard uses secure session-based authentication with hashed passwords. The `users` table serves multiple purposes:
- **Guest users**: Email/name only (from orders, no password)
- **Registered users**: Email/password (future feature, `is_admin = 0`)
- **Admin users**: Email/password with admin flag (`is_admin = 1`)

## Setup Steps

### 1. Install Dependencies
```powershell
cd worker
npm install
```

### 2. Run Database Migration
```powershell
wrangler d1 execute dicebastion --file=worker/migrations/0003_admin_users.sql
```

### 3. Create Your First Admin User

**Option A: Using the PowerShell Script (Recommended)**
```powershell
cd worker
.\create-admin-user.ps1 -Email "your@email.com" -Name "Your Name" -Password (ConvertTo-SecureString "YourSecurePassword" -AsPlainText -Force)
```

**Option B: Manual SQL (requires bcrypt hash)**

First, generate a bcrypt hash of your password:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword', 10, (e,h) => console.log(h));"
```

Then insert the user:
```sql
INSERT INTO users (email, password_hash, name, is_admin, is_active, created_at, updated_at)
VALUES (
  'your@email.com',
  '$2a$10$...your.bcrypt.hash...', 
  'Your Name',
  1,
  1,
  datetime('now'),
  datetime('now')
);
```

Run the SQL:
```powershell
# Save the SQL to a file, then:
wrangler d1 execute dicebastion --file=path/to/insert.sql
```

### 4. Deploy the Worker
```powershell
cd worker
wrangler deploy
```

### 5. Access the Admin Dashboard
1. Go to `https://dicebastion.com/admin`
2. Enter your email and password
3. You'll get a session token that lasts 7 days

## Security Features

- **Bcrypt password hashing** - Passwords are hashed with bcrypt (10 rounds)
- **Session-based auth** - Sessions expire after 7 days
- **Role-based access** - Only users with `is_admin = 1` can access
- **Active status check** - Inactive users cannot log in
- **Secure session tokens** - 32-byte cryptographically random tokens

## Managing Users

### Add Another Admin User
Run the `create-admin-user.ps1` script again with different credentials.

### Deactivate a User
```sql
UPDATE users SET is_active = 0 WHERE email = 'user@email.com';
```

### Remove Admin Privileges
```sql
UPDATE users SET is_admin = 0 WHERE email = 'user@email.com';
```

### Promote User to Admin
```sql
UPDATE users SET is_admin = 1 WHERE email = 'user@email.com';
```

### List All Admin Users
```sql
SELECT user_id, email, name, is_admin, is_active, last_login_at FROM users WHERE is_admin = 1;
```

### List All Users (including guests)
```sql
SELECT user_id, email, name, is_admin, password_hash IS NOT NULL as has_account FROM users;
```

## Backward Compatibility

The system still supports the old `X-Admin-Key` header for API calls (for backward compatibility with scripts). However, the admin dashboard only uses session-based authentication.

## Troubleshooting

### "Invalid credentials" error
- Check that your email is lowercase in the database
- Verify the password hash was generated correctly
- Ensure `is_active = 1` and `is_admin = 1`

### Session expires immediately
- Check your system clock is correct
- Verify the `expires_at` field in `user_sessions` table

### Cannot create admin user
- Ensure the migration ran successfully
- Check the database has the `users` table with auth columns: `wrangler d1 execute dicebastion --command="PRAGMA table_info(users)"`
