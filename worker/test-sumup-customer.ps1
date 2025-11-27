# Test SumUp Customer Creation API
# Usage: .\test-sumup-customer.ps1 -ClientId "your_client_id" -ClientSecret "your_secret"

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
    $tokenResponse = Invoke-RestMethod -Uri 'https://api.sumup.com/token' `
        -Method Post `
        -ContentType 'application/x-www-form-urlencoded' `
        -Body $tokenBody
    
    Write-Host "✓ Token obtained successfully" -ForegroundColor Green
    Write-Host "  Granted scopes: $($tokenResponse.scope)" -ForegroundColor Gray
    
    $accessToken = $tokenResponse.access_token
} catch {
    Write-Host "✗ Failed to get token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Try to get existing test customer
$testCustomerId = "TEST-CUSTOMER-001"
Write-Host "`n[2/4] Checking if test customer exists..." -ForegroundColor Yellow

try {
    $headers = @{
        'Authorization' = "Bearer $accessToken"
        'Content-Type' = 'application/json'
    }
    
    $getResponse = Invoke-RestMethod -Uri "https://api.sumup.com/v0.1/customers/$testCustomerId" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✓ Customer already exists:" -ForegroundColor Green
    Write-Host ($getResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    
    Write-Host "`n[INFO] Customer already exists. Skipping creation." -ForegroundColor Cyan
    $customerCreated = $false
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✓ Customer doesn't exist (404) - will create new one" -ForegroundColor Green
        $customerCreated = $true
    } else {
        Write-Host "✗ Error checking customer: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Gray
        $customerCreated = $true  # Try to create anyway
    }
}

# Step 3: Create customer (if does not exist)
if ($customerCreated) {
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
        $createResponse = Invoke-RestMethod -Uri 'https://api.sumup.com/v0.1/customers' `
            -Method Post `
            -Headers $headers `
            -Body $customerData
        
        Write-Host "✓ Customer created successfully:" -ForegroundColor Green
        Write-Host ($createResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    } catch {
        Write-Host "✗ Failed to create customer: $($_.Exception.Message)" -ForegroundColor Red
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

$checkoutData = @{
    checkout_reference = "TEST-CHECKOUT-$(Get-Date -Format 'yyyyMMddHHmmss')"
    amount = 0.01
    currency = 'GBP'
    merchant_code = 'MUZHYEAH'
    customer_id = $testCustomerId
    purpose = 'SETUP_RECURRING_PAYMENT'
    description = 'Test checkout for payment instrument tokenization'
} | ConvertTo-Json

try {
    $checkoutResponse = Invoke-RestMethod -Uri 'https://api.sumup.com/v0.1/checkouts' `
        -Method Post `
        -Headers $headers `
        -Body $checkoutData
    
    Write-Host "✓ Checkout created successfully:" -ForegroundColor Green
    Write-Host ($checkoutResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    
    Write-Host "`n=== Test Checkout URL ===" -ForegroundColor Cyan
    Write-Host "https://pay.sumup.com/checkout/$($checkoutResponse.id)" -ForegroundColor White
    Write-Host "`nYou can now test the payment widget with this URL." -ForegroundColor Yellow
    Write-Host "After completing payment, check the checkout again to see payment_instrument.token" -ForegroundColor Yellow
    
    # Save checkout ID for later verification
    Write-Host "`nCheckout ID: $($checkoutResponse.id)" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Failed to create checkout: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host "✓ Customer creation flow works correctly" -ForegroundColor Green
Write-Host "✓ Checkout with SETUP_RECURRING_PAYMENT created" -ForegroundColor Green
Write-Host "`nNext: Complete the payment in the widget to get payment_instrument.token" -ForegroundColor Cyan
