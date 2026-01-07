# Check SumUp Secrets Configuration

Write-Host "`n=== Checking Payments Worker Secrets ===" -ForegroundColor Cyan
cd c:\Users\nickc\Desktop\Dev\DiceBastion\payments-worker
npx wrangler secret list

Write-Host "`n=== Required Secrets ===" -ForegroundColor Yellow
Write-Host "✅ SUMUP_CLIENT_ID" -ForegroundColor Green
Write-Host "✅ SUMUP_CLIENT_SECRET" -ForegroundColor Green  
Write-Host "✅ SUMUP_MERCHANT_CODE" -ForegroundColor Green
Write-Host "✅ INTERNAL_SECRET" -ForegroundColor Green
Write-Host "⚠️  SUMUP_REFRESH_TOKEN (optional - but may be required for payment_instruments scope)" -ForegroundColor Yellow

Write-Host "`n=== The Issue ===" -ForegroundColor Red
Write-Host "SumUp is only granting 'payments' scope but we need 'payment_instruments' too." -ForegroundColor White
Write-Host "This usually means one of two things:" -ForegroundColor White
Write-Host "  1. Your SumUp app doesn't have permission for payment_instruments scope" -ForegroundColor Gray
Write-Host "  2. You need to use authorization_code OAuth flow with SUMUP_REFRESH_TOKEN" -ForegroundColor Gray

Write-Host "`n=== Solution ===" -ForegroundColor Cyan
Write-Host "You may need to set SUMUP_REFRESH_TOKEN if you have one from the OAuth flow." -ForegroundColor White
Write-Host "See SUMUP_OAUTH_FLOWS.md for details on how to obtain a refresh token." -ForegroundColor White

Write-Host "`nTo set refresh token (if you have one):" -ForegroundColor Yellow
Write-Host "  cd payments-worker" -ForegroundColor Gray
Write-Host "  npx wrangler secret put SUMUP_REFRESH_TOKEN" -ForegroundColor Gray
Write-Host "  npx wrangler deploy" -ForegroundColor Gray
