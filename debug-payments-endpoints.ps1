# Debug Payments Worker Endpoints

Write-Host "`n=== Testing Payments Worker Endpoints ===" -ForegroundColor Cyan

# Test 1: Health check (public)
Write-Host "`n1. Testing /health (public endpoint)..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "https://dicebastion-payments.ncalamaro.workers.dev/health"
    Write-Host "   ✅ Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

# Test 2: Internal endpoint without auth (should fail with 401)
Write-Host "`n2. Testing /internal/customer without auth (should return 401)..." -ForegroundColor Yellow
try {
    $headers = @{ "Content-Type" = "application/json" }
    $body = '{"email":"test@example.com","firstName":"Test","lastName":"User"}'
    Invoke-RestMethod -Uri "https://dicebastion-payments.ncalamaro.workers.dev/internal/customer" `
        -Method POST -Headers $headers -Body $body
    Write-Host "   ❌ Unexpected success - auth should be required!" -ForegroundColor Red
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401) {
        Write-Host "   ✅ Correctly returned 401 Unauthorized" -ForegroundColor Green
    } elseif ($status -eq 404) {
        Write-Host "   ❌ Returned 404 - Route not found! Deployment issue!" -ForegroundColor Red
    } else {
        Write-Host "   ⚠️  Unexpected status: $status" -ForegroundColor Yellow
    }
}

# Test 3: Check all internal routes exist
Write-Host "`n3. Testing all internal routes (all should return 401 without auth)..." -ForegroundColor Yellow

$endpoints = @(
    @{Method="POST"; Path="/internal/checkout"},
    @{Method="POST"; Path="/internal/customer"},
    @{Method="GET"; Path="/internal/payment/test-123"},
    @{Method="POST"; Path="/internal/payment-instrument"},
    @{Method="POST"; Path="/internal/charge"},
    @{Method="POST"; Path="/internal/verify-webhook"}
)

foreach ($endpoint in $endpoints) {
    try {
        $headers = @{ "Content-Type" = "application/json" }
        $body = '{}'
        
        $uri = "https://dicebastion-payments.ncalamaro.workers.dev$($endpoint.Path)"
        
        Invoke-RestMethod -Uri $uri -Method $endpoint.Method -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "   ⚠️  $($endpoint.Method) $($endpoint.Path): Unexpected success" -ForegroundColor Yellow
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 401) {
            Write-Host "   ✅ $($endpoint.Method) $($endpoint.Path): Returns 401 (route exists)" -ForegroundColor Green
        } elseif ($status -eq 404) {
            Write-Host "   ❌ $($endpoint.Method) $($endpoint.Path): Returns 404 (ROUTE MISSING!)" -ForegroundColor Red
        } else {
            Write-Host "   ⚠️  $($endpoint.Method) $($endpoint.Path): Returns $status" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "If any routes return 404, the payments worker needs to be redeployed." -ForegroundColor White
Write-Host "If routes return 401, they exist and are working correctly." -ForegroundColor White
Write-Host "`nTo redeploy payments worker:" -ForegroundColor Yellow
Write-Host "  cd payments-worker" -ForegroundColor Gray
Write-Host "  npx wrangler deploy" -ForegroundColor Gray
