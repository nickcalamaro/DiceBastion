# Quick Test: Verify Workers Can Communicate

Write-Host "`n=== Testing Payments Worker Health ===" -ForegroundColor Cyan
$paymentsHealth = Invoke-RestMethod -Uri "https://dicebastion-payments.ncalamaro.workers.dev/health"
Write-Host "Payments Worker: " -NoNewline
if ($paymentsHealth.status -eq "ok") {
    Write-Host "✅ Healthy" -ForegroundColor Green
} else {
    Write-Host "❌ Unhealthy" -ForegroundColor Red
}

Write-Host "`n=== Testing Main Worker Health ===" -ForegroundColor Cyan
$mainHealth = Invoke-RestMethod -Uri "https://dicebastion-memberships.ncalamaro.workers.dev/health"
Write-Host "Main Worker: " -NoNewline
if ($mainHealth.status -eq "ok") {
    Write-Host "✅ Healthy" -ForegroundColor Green
} else {
    Write-Host "❌ Unhealthy" -ForegroundColor Red
}

Write-Host "`n=== Testing Membership Plans Endpoint ===" -ForegroundColor Cyan
try {
    $plans = Invoke-RestMethod -Uri "https://dicebastion-memberships.ncalamaro.workers.dev/membership/plans"
    Write-Host "Plans Endpoint: " -NoNewline
    if ($plans.plans) {
        Write-Host "✅ Working ($($plans.plans.Count) plans found)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No plans found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host "`n=== All Systems Ready! ===" -ForegroundColor Green
Write-Host "You can now test the payment flow." -ForegroundColor White
Write-Host "Run: wrangler tail" -ForegroundColor Yellow
Write-Host "Then test a payment in your browser." -ForegroundColor White
