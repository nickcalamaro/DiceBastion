# Test Script - Complete Recurring Payment Flow
# This simulates the CORRECT flow with all steps in order

Write-Host "=== SumUp Recurring Payment - Complete Flow Test ===`n"

# Get access token
$accessToken = (Invoke-RestMethod -Uri "https://api.sumup.com/token" -Method POST -Body @{
    grant_type = "client_credentials"
    client_id = "cc_classic_XfyKJcVmWxZjHeIukGgH1Wn957m3W"
    client_secret = "cc_sk_classic_k7Gc5lTdycVXkHidFnPFq7QQFeNF2AmPSvb0badY93yFWEtZUp"
    scope = "payments payment_instruments"
} -ContentType "application/x-www-form-urlencoded").access_token

Write-Host "✅ Access token obtained`n"

# Step 1: Create Customer API Resource FIRST
Write-Host "Step 1: Creating Customer API Resource..."
$testUserId = 99
$customerId = "USER-$testUserId"

$customerBody = @{
    customer_id = $customerId
    personal_details = @{
        email = "test@example.com"
        first_name = "Test"
        last_name = "User"
    }
} | ConvertTo-Json

try {
    $customer = Invoke-RestMethod -Uri "https://api.sumup.com/v0.1/customers" -Method POST `
        -Headers @{ 
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
        } -Body $customerBody
    
    Write-Host "✅ Customer created: $($customer.customer_id)`n"
} catch {
    if ($_.Exception.Message -like "*conflict*") {
        Write-Host "⚠️  Customer already exists`n"
    } else {
        Write-Host "❌ Failed: $($_.ErrorDetails.Message)`n"
        exit 1
    }
}

# Step 2: Create SETUP_RECURRING_PAYMENT Checkout
Write-Host "Step 2: Creating SETUP_RECURRING_PAYMENT checkout..."
$checkoutBody = @{
    checkout_reference = [guid]::NewGuid().ToString()
    amount = 1.00
    currency = "GBP"
    merchant_code = "MUZHYEAH"
    description = "Initial setup for recurring payments"
    customer_id = $customerId
    purpose = "SETUP_RECURRING_PAYMENT"
} | ConvertTo-Json

$checkout = Invoke-RestMethod -Uri "https://api.sumup.com/v0.1/checkouts" -Method POST `
    -Headers @{ 
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    } -Body $checkoutBody

Write-Host "✅ Checkout created: $($checkout.id)"
Write-Host "⚠️  MANUAL STEP REQUIRED: Complete payment at:"
Write-Host "   https://pay.sumup.com/$($checkout.merchant_code)/$($checkout.id)"
Write-Host "`n   Press Enter after completing the payment..."
$null = Read-Host

# Step 3: Verify token was saved
Write-Host "`nStep 3: Verifying token was saved..."
$checkoutDetails = Invoke-RestMethod -Uri "https://api.sumup.com/v0.1/checkouts/$($checkout.id)" `
    -Headers @{ "Authorization" = "Bearer $accessToken" }

if ($checkoutDetails.payment_instrument -and $checkoutDetails.payment_instrument.token) {
    $token = $checkoutDetails.payment_instrument.token
    Write-Host "✅ Token saved: $token`n"
    
    # Step 4: Test recurring payment
    Write-Host "Step 4: Testing recurring payment with token + customer_id..."
    
    $renewalCheckoutBody = @{
        checkout_reference = [guid]::NewGuid().ToString()
        amount = 10.00
        currency = "GBP"
        merchant_code = "MUZHYEAH"
        description = "Monthly membership renewal"
    } | ConvertTo-Json
    
    $renewalCheckout = Invoke-RestMethod -Uri "https://api.sumup.com/v0.1/checkouts" -Method POST `
        -Headers @{ 
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
        } -Body $renewalCheckoutBody
    
    Write-Host "✅ Renewal checkout created: $($renewalCheckout.id)"
    
    $paymentBody = @{
        payment_type = "card"
        token = $token
        customer_id = $customerId
    } | ConvertTo-Json
    
    Write-Host "`nSending payment with:`n$paymentBody`n"
    
    try {
        $payment = Invoke-RestMethod -Uri "https://api.sumup.com/v0.1/checkouts/$($renewalCheckout.id)" -Method PUT `
            -Headers @{ 
                "Authorization" = "Bearer $accessToken"
                "Content-Type" = "application/json"
            } -Body $paymentBody
        
        if ($payment.next_step) {
            Write-Host "⚠️  REQUIRES 3DS AUTHENTICATION"
            Write-Host "Status: $($payment.next_step.current_transaction.status)"
        } else {
            Write-Host "✅ SUCCESS - NO 3DS REQUIRED!"
            Write-Host "Status: $($payment.status)"
            Write-Host "Transaction ID: $($payment.transaction_id)"
        }
        
        Write-Host "`nFull response:"
        $payment | ConvertTo-Json -Depth 5
        
    } catch {
        Write-Host "❌ Recurring payment failed:"
        Write-Host $_.ErrorDetails.Message
    }
    
} else {
    Write-Host "❌ No token found in checkout. Payment may not have been completed."
}

Write-Host "`n=== Test Complete ==="
