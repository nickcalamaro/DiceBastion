# SumUp OAuth Helper - Manual Flow
# Since we can't use localhost redirect, we'll use a manual flow

Write-Host "`n=== SumUp OAuth Manual Authorization Flow ===" -ForegroundColor Cyan
Write-Host "This will help you get a new SUMUP_REFRESH_TOKEN with payment_instruments scope" -ForegroundColor White

# Read current secrets
Write-Host "`nStep 1: Get your SumUp credentials" -ForegroundColor Yellow
$clientId = Read-Host "Enter your SUMUP_CLIENT_ID (from payments worker)"
$clientSecret = Read-Host "Enter your SUMUP_CLIENT_SECRET (from payments worker)"

# Use dicebastion.com as redirect URI
Write-Host "`n=== Step 2: Using configured redirect URI ===" -ForegroundColor Yellow
$redirectUri = "https://dicebastion.com/"
Write-Host "Redirect URI: $redirectUri" -ForegroundColor Green
Write-Host "(A temporary callback endpoint has been deployed to your worker)" -ForegroundColor Gray

# Generate state for CSRF protection
$state = [System.Guid]::NewGuid().ToString("N")

# Build authorization URL
$scopes = "payments payment_instruments"

$authUrl = "https://api.sumup.com/authorize?" + 
    "response_type=code&" +
    "client_id=$clientId&" +
    "redirect_uri=$([uri]::EscapeDataString($redirectUri))&" +
    "scope=$([uri]::EscapeDataString($scopes))&" +
    "state=$state"

Write-Host "`n=== Step 3: Authorize in browser ===" -ForegroundColor Yellow
Write-Host "Copy this URL and open it in your browser:" -ForegroundColor White
Write-Host $authUrl -ForegroundColor Cyan

Write-Host "`nOpening browser..." -ForegroundColor Gray
Start-Process $authUrl

Write-Host "`n=== Step 4: Complete authorization ===" -ForegroundColor Yellow
Write-Host "1. Log in to SumUp" -ForegroundColor Gray
Write-Host "2. Authorize the app with these scopes:" -ForegroundColor Gray
Write-Host "   - payments" -ForegroundColor Cyan
Write-Host "   - payment_instruments" -ForegroundColor Cyan
Write-Host "3. You'll be redirected to: $redirectUri" -ForegroundColor Gray
Write-Host "4. The URL will contain a 'code' parameter" -ForegroundColor Gray

Write-Host "`n=== Step 5: Extract the code ===" -ForegroundColor Yellow
Write-Host "After authorization, you'll be redirected to a URL like:" -ForegroundColor Gray
Write-Host "$($redirectUri)?code=XXXXX&state=$state" -ForegroundColor Gray
Write-Host "`nCopy the 'code' value from the URL (the XXXXX part)" -ForegroundColor White

$code = Read-Host "`nPaste the authorization code here"

if ([string]::IsNullOrWhiteSpace($code)) {
    Write-Host "`n❌ No code provided. Exiting." -ForegroundColor Red
    exit
}

Write-Host "`n=== Step 6: Exchange code for refresh token ===" -ForegroundColor Yellow

$tokenBody = @{
    grant_type = "authorization_code"
    client_id = $clientId
    client_secret = $clientSecret
    code = $code
    redirect_uri = $redirectUri
}

try {
    $tokenResponse = Invoke-RestMethod -Uri "https://api.sumup.com/token" `
        -Method POST `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $tokenBody
    
    $refreshToken = $tokenResponse.refresh_token
    $accessToken = $tokenResponse.access_token
    $scope = $tokenResponse.scope
    
    Write-Host "`n✅ Got tokens successfully!" -ForegroundColor Green
    Write-Host "Scopes granted: $scope" -ForegroundColor Cyan
    
    if ($scope -notmatch "payment_instruments") {
        Write-Host "`n⚠️  WARNING: payment_instruments scope not granted!" -ForegroundColor Yellow
        Write-Host "You may need to check your SumUp app permissions." -ForegroundColor Yellow
    }
    
    Write-Host "`nYour new refresh token:" -ForegroundColor White
    Write-Host $refreshToken -ForegroundColor Green
    
    # Save to file
    $refreshToken | Out-File -FilePath "SUMUP_REFRESH_TOKEN_NEW.txt" -NoNewline
    Write-Host "`n✅ Saved to SUMUP_REFRESH_TOKEN_NEW.txt" -ForegroundColor Green
    
    Write-Host "`n=== Step 7: Update the secret in Cloudflare ===" -ForegroundColor Yellow
    Write-Host "Run these commands:" -ForegroundColor White
    Write-Host "  cd c:\Users\nickc\Desktop\Dev\DiceBastion\payments-worker" -ForegroundColor Gray
    Write-Host "  npx wrangler secret put SUMUP_REFRESH_TOKEN" -ForegroundColor Gray
    Write-Host "  (paste the token above when prompted)" -ForegroundColor Gray
    Write-Host "  npx wrangler deploy" -ForegroundColor Gray
    
    Write-Host "`n✅ Done! Your new refresh token has both scopes!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Error exchanging code for token:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Try to get the error response body
    if ($_.ErrorDetails.Message) {
        Write-Host "`nError Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
    
    Write-Host "`n=== Troubleshooting ===" -ForegroundColor Cyan
    Write-Host "Common causes of 401 Unauthorized:" -ForegroundColor White
    Write-Host "1. Client ID or Client Secret is incorrect" -ForegroundColor Gray
    Write-Host "2. Authorization code has expired (codes expire quickly!)" -ForegroundColor Gray
    Write-Host "3. Authorization code has already been used" -ForegroundColor Gray
    Write-Host "4. Redirect URI doesn't match exactly" -ForegroundColor Gray
    Write-Host "`nTry running the script again to get a fresh authorization code." -ForegroundColor Yellow
}
