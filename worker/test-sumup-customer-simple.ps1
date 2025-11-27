# Test SumUp Customer Creation API
param(
    [Parameter(Mandatory=$true)]
    [string]$ClientId,
    
    [Parameter(Mandatory=$true)]
    [string]$ClientSecret
)

Write-Host "`n=== Testing SumUp Customer API ===" -ForegroundColor Cyan

# Step 1: Get OAuth token
Write-Host "`n[1/4] Getting OAuth token..." -ForegroundColor Yellow
$tokenBody = @{
    grant_type = 'client_credentials'
    client_id = $ClientId
    client_secret = $ClientSecret
    scope = 'payments payment_instruments'
}

try {
    $tokenResponse = Invoke-RestMethod -Uri 'https://api.sumup.com/token' -Method Post -ContentType 'application/x-www-form-urlencoded' -Body $tokenBody
    
    Write-Host "SUCCESS: Token obtained" -ForegroundColor Green
    Write-Host "  Granted scopes: $($tokenResponse.scope)" -ForegroundColor Gray
    
    $accessToken = $tokenResponse.access_token
} catch {
    Write-Host "ERROR: Failed to get token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Try to get existing test customer
$testCustomerId = "TEST-CUSTOMER-001"
Write-Host "`n[2/4] Checking if test customer exists..." -ForegroundColor Yellow

$headers = @{
    'Authorization' = "Bearer $accessToken"
    'Content-Type' = 'application/json'
}

try {
    $getResponse = Invoke-RestMethod -Uri "https://api.sumup.com/v0.1/customers/$testCustomerId" -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Host "SUCCESS: Customer already exists" -ForegroundColor Green
    Write-Host ($getResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    
    $customerExists = $true
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "INFO: Customer does not exist (404) - will create new one" -ForegroundColor Yellow
        $customerExists = $false
    } else {
        Write-Host "WARNING: Error checking customer: $($_.Exception.Message)" -ForegroundColor Yellow
        $customerExists = $false
    }
}

# Step 3: Create customer if needed
if (-not $customerExists) {
    Write-Host "`n[3/4] Creating test customer..." -ForegroundColor Yellow
    
    $customerData = @{
        customer_id = $testCustomerId
        personal_details = @{
            email = "test@dicebastion.com"
            first_name = "Test"
            last_name = "Customer"
        }
    } | ConvertTo-Json
    
    try {
        $createResponse = Invoke-RestMethod -Uri 'https://api.sumup.com/v0.1/customers' -Method Post -Headers $headers -Body $customerData
        
        Write-Host "SUCCESS: Customer created" -ForegroundColor Green
        Write-Host ($createResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: Failed to create customer: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
        }
        exit 1
    }
} else {
    Write-Host "`n[3/4] Skipped - customer already exists" -ForegroundColor Gray
}

# Step 4: Create test checkout with customer
Write-Host "`n[4/4] Creating test checkout with SETUP_RECURRING_PAYMENT..." -ForegroundColor Yellow

$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$checkoutData = @{
    checkout_reference = "TEST-CHECKOUT-$timestamp"
    amount = 0.01
    currency = 'GBP'
    merchant_code = 'MUZHYEAH'
    customer_id = $testCustomerId
    purpose = 'SETUP_RECURRING_PAYMENT'
    description = 'Test checkout for payment instrument tokenization'
} | ConvertTo-Json

try {
    $checkoutResponse = Invoke-RestMethod -Uri 'https://api.sumup.com/v0.1/checkouts' -Method Post -Headers $headers -Body $checkoutData
    
    Write-Host "SUCCESS: Checkout created" -ForegroundColor Green
    Write-Host ($checkoutResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    
    Write-Host "`n=== Test Checkout URL ===" -ForegroundColor Cyan
    $paymentUrl = "https://pay.sumup.com/checkout/$($checkoutResponse.id)"
    Write-Host $paymentUrl -ForegroundColor White
    Write-Host "`nYou can test the payment widget with this URL." -ForegroundColor Yellow
    Write-Host "After completing payment, check the checkout to see payment_instrument.token" -ForegroundColor Yellow
    Write-Host "`nCheckout ID: $($checkoutResponse.id)" -ForegroundColor Cyan
    
} catch {
    Write-Host "ERROR: Failed to create checkout: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host "Customer creation flow works correctly" -ForegroundColor Green
Write-Host "Checkout with SETUP_RECURRING_PAYMENT created" -ForegroundColor Green
Write-Host "`nNext: Complete the payment in the widget to get payment_instrument.token" -ForegroundColor Cyan
