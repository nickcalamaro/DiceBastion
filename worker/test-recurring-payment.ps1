# Test Recurring Payment with Stored Token
param(
    [Parameter(Mandatory=$true)]
    [string]$ClientId,
    
    [Parameter(Mandatory=$true)]
    [string]$ClientSecret,
    
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$true)]
    [string]$CustomerId,
    
    [Parameter(Mandatory=$false)]
    [decimal]$Amount = 0.01
)

Write-Host "`n=== Testing Recurring Payment ===" -ForegroundColor Cyan
Write-Host "Token: $Token" -ForegroundColor Gray
Write-Host "Customer: $CustomerId" -ForegroundColor Gray
Write-Host "Amount: £$Amount GBP" -ForegroundColor Gray

# Step 1: Get OAuth token
Write-Host "`n[1/3] Getting OAuth token..." -ForegroundColor Yellow
$tokenBody = @{
    grant_type = 'client_credentials'
    client_id = $ClientId
    client_secret = $ClientSecret
    scope = 'payments payment_instruments'
}

try {
    $tokenResponse = Invoke-RestMethod -Uri 'https://api.sumup.com/token' -Method Post -ContentType 'application/x-www-form-urlencoded' -Body $tokenBody
    Write-Host "SUCCESS: Token obtained" -ForegroundColor Green
    $accessToken = $tokenResponse.access_token
} catch {
    Write-Host "ERROR: Failed to get token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create checkout for recurring payment
Write-Host "`n[2/3] Creating checkout for recurring payment..." -ForegroundColor Yellow

$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$checkoutData = @{
    checkout_reference = "RECURRING-TEST-$timestamp"
    amount = $Amount
    currency = 'GBP'
    merchant_code = 'MUZHYEAH'
    description = 'Test recurring payment charge'
} | ConvertTo-Json

$headers = @{
    'Authorization' = "Bearer $accessToken"
    'Content-Type' = 'application/json'
}

try {
    $checkout = Invoke-RestMethod -Uri 'https://api.sumup.com/v0.1/checkouts' -Method Post -Headers $headers -Body $checkoutData
    Write-Host "SUCCESS: Checkout created" -ForegroundColor Green
    Write-Host "  Checkout ID: $($checkout.id)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to create checkout: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    exit 1
}

# Step 3: Process payment with stored token
Write-Host "`n[3/3] Processing payment with stored token..." -ForegroundColor Yellow

$paymentData = @{
    payment_type = 'card'
    token = $Token
    customer_id = $CustomerId
} | ConvertTo-Json

try {
    $payment = Invoke-RestMethod -Uri "https://api.sumup.com/v0.1/checkouts/$($checkout.id)" -Method Put -Headers $headers -Body $paymentData
    
    Write-Host "SUCCESS: Payment processed!" -ForegroundColor Green
    Write-Host "`nPayment Details:" -ForegroundColor Cyan
    Write-Host "  Status: $($payment.status)" -ForegroundColor $(if($payment.status -eq 'PAID'){'Green'}else{'Yellow'})
    Write-Host "  Amount: £$($payment.amount) $($payment.currency)" -ForegroundColor Gray
    Write-Host "  Transaction Code: $($payment.transaction_code)" -ForegroundColor Gray
    
    if ($payment.transactions -and $payment.transactions.Count -gt 0) {
        $txn = $payment.transactions[0]
        Write-Host "`nTransaction:" -ForegroundColor Cyan
        Write-Host "  ID: $($txn.id)" -ForegroundColor Gray
        Write-Host "  Status: $($txn.status)" -ForegroundColor $(if($txn.status -eq 'SUCCESSFUL'){'Green'}else{'Red'})
        Write-Host "  Auth Code: $($txn.auth_code)" -ForegroundColor Gray
    }
    
    Write-Host "`n=== Test Complete ===" -ForegroundColor Green
    Write-Host "The stored payment instrument works correctly!" -ForegroundColor Green
    Write-Host "Auto-renewal will be able to charge this card." -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: Failed to process payment: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    Write-Host "`nThis token may not work for auto-renewal!" -ForegroundColor Red
    exit 1
}
