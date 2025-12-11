# Create First Admin User
# This script will create the admin user table and add your first admin account

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Name,
    
    [Parameter(Mandatory=$true)]
    [SecureString]$Password
)

# Convert SecureString to plain text for hashing
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host "Creating admin user: $Email" -ForegroundColor Cyan

# Optionally run migration (skip if already run)
Write-Host "`nRun migration? (Skip if already completed)" -ForegroundColor Yellow
$RunMigration = Read-Host "Enter 'y' to run migration, or press Enter to skip"
if ($RunMigration -eq 'y') {
    wrangler d1 execute dicebastion --remote --file=migrations/0003_admin_users.sql
}

# Hash the password using bcrypt (via Node.js since PowerShell doesn't have bcrypt)
$HashScript = @"
const bcrypt = require('bcryptjs');
const password = process.argv[2];
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log(hash);
});
"@

Write-Host "`nHashing password..." -ForegroundColor Yellow
$HashScript | Set-Content -Path "temp-hash.cjs"
$PasswordHash = node temp-hash.cjs $PlainPassword
Remove-Item "temp-hash.cjs"

# Create SQL to insert or update admin user
$Now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$InsertSQL = @"
INSERT INTO users (email, password_hash, name, is_admin, is_active, created_at, updated_at)
VALUES ('$Email', '$PasswordHash', '$Name', 1, 1, '$Now', '$Now')
ON CONFLICT(email) DO UPDATE SET 
  password_hash = excluded.password_hash,
  name = excluded.name,
  is_admin = 1,
  is_active = 1,
  updated_at = excluded.updated_at;
"@

$InsertSQL | Set-Content -Path "temp-insert.sql"

Write-Host "`nInserting admin user..." -ForegroundColor Yellow
wrangler d1 execute dicebastion --remote --file=temp-insert.sql
Remove-Item "temp-insert.sql"

Write-Host "`n[SUCCESS] Admin user created successfully!" -ForegroundColor Green
Write-Host "`nEmail: $Email" -ForegroundColor White
Write-Host "You can now log in at /admin" -ForegroundColor White

# Clear sensitive data
$PlainPassword = $null
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
