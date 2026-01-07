# Verify INTERNAL_SECRET Configuration

Write-Host "`n=== Checking INTERNAL_SECRET Configuration ===" -ForegroundColor Cyan

Write-Host "`nMain Worker Secrets:" -ForegroundColor Yellow
Set-Location "c:\Users\nickc\Desktop\Dev\DiceBastion"
npx wrangler secret list

Write-Host "`n`nPayments Worker Secrets:" -ForegroundColor Yellow
Set-Location "c:\Users\nickc\Desktop\Dev\DiceBastion\payments-worker"
npx wrangler secret list

Write-Host "`n`n=== Important Notes ===" -ForegroundColor Cyan
Write-Host "1. Both workers MUST have INTERNAL_SECRET set" -ForegroundColor White
Write-Host "2. The values MUST be EXACTLY the same" -ForegroundColor White
Write-Host "3. If they don't match, payments will fail with 401 Unauthorized" -ForegroundColor White

Write-Host "`n=== How to Fix If Secrets Don't Match ===" -ForegroundColor Yellow
Write-Host "1. Choose a strong random secret (e.g., a UUID or long random string)" -ForegroundColor White
Write-Host "2. Set it in BOTH workers:" -ForegroundColor White
Write-Host "   cd c:\Users\nickc\Desktop\Dev\DiceBastion" -ForegroundColor Gray
Write-Host "   npx wrangler secret put INTERNAL_SECRET" -ForegroundColor Gray
Write-Host "   cd payments-worker" -ForegroundColor Gray
Write-Host "   npx wrangler secret put INTERNAL_SECRET" -ForegroundColor Gray
Write-Host "3. Use the SAME value for both!" -ForegroundColor Red
Write-Host "4. Redeploy both workers" -ForegroundColor White
