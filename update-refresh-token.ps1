# Update SUMUP_REFRESH_TOKEN in Payments Worker

Write-Host "`n=== Updating SUMUP_REFRESH_TOKEN ===" -ForegroundColor Cyan

# Read the new token
$token = Get-Content "c:\Users\nickc\Desktop\Dev\DiceBastion\SUMUP_REFRESH_TOKEN_NEW.txt" -Raw

Write-Host "Token loaded from file (length: $($token.Length) characters)" -ForegroundColor Gray
Write-Host "`nSetting secret in payments worker..." -ForegroundColor Yellow

# Set the secret
Set-Location "c:\Users\nickc\Desktop\Dev\DiceBastion\payments-worker"

# Use stdin to pass the token
$token | npx wrangler secret put SUMUP_REFRESH_TOKEN

Write-Host "`n✅ Secret updated!" -ForegroundColor Green

Write-Host "`n=== Deploying payments worker ===" -ForegroundColor Cyan
npx wrangler deploy

Write-Host "`n✅ Payments worker deployed with new refresh token!" -ForegroundColor Green
Write-Host "`nNow test your payment flow - auto-renewal should work!" -ForegroundColor White
