# SumUp OAuth Re-Authorization Helper
# Use this to get a new refresh token with the correct scopes

Write-Host "`n=== SumUp OAuth Re-Authorization Helper ===" -ForegroundColor Cyan
Write-Host "This will help you get a new SUMUP_REFRESH_TOKEN with payment_instruments scope" -ForegroundColor White

# Read current secrets
Write-Host "`nStep 1: Get your SumUp Client ID and Secret" -ForegroundColor Yellow
Write-Host "These are already configured in your payments worker." -ForegroundColor Gray
Write-Host "You'll need them for the OAuth flow." -ForegroundColor Gray

$clientId = Read-Host "`nEnter your SUMUP_CLIENT_ID (from payments worker secrets)"
$clientSecret = Read-Host "Enter your SUMUP_CLIENT_SECRET (from payments worker secrets)"

# Generate state for CSRF protection
$state = [System.Guid]::NewGuid().ToString("N")

# Build authorization URL
$scopes = "payments payment_instruments"
$redirectUri = "http://localhost:8888/oauth/callback"

$authUrl = "https://api.sumup.com/authorize?" + 
    "response_type=code&" +
    "client_id=$clientId&" +
    "redirect_uri=$([System.Web.HttpUtility]::UrlEncode($redirectUri))&" +
    "scope=$([System.Web.HttpUtility]::UrlEncode($scopes))&" +
    "state=$state"

Write-Host "`n=== Step 2: Start local callback server ===" -ForegroundColor Yellow
Write-Host "We'll start a temporary local server to receive the OAuth callback." -ForegroundColor Gray

# Create simple HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8888/")
$listener.Start()

Write-Host "✅ Server started on http://localhost:8888" -ForegroundColor Green

Write-Host "`n=== Step 3: Authorize in browser ===" -ForegroundColor Yellow
Write-Host "Opening SumUp authorization page in your browser..." -ForegroundColor Gray
Write-Host "Please log in and authorize the app with these scopes:" -ForegroundColor White
Write-Host "  - payments" -ForegroundColor Cyan
Write-Host "  - payment_instruments" -ForegroundColor Cyan

Start-Sleep -Seconds 2
Start-Process $authUrl

Write-Host "`nWaiting for OAuth callback..." -ForegroundColor Gray
Write-Host "(The browser will redirect to localhost:8888 after you authorize)" -ForegroundColor Gray

# Wait for callback
$context = $listener.GetContext()
$request = $context.Request
$response = $context.Response

# Parse query parameters
$query = $request.Url.Query
$queryParams = [System.Web.HttpUtility]::ParseQueryString($query)

$code = $queryParams["code"]
$returnedState = $queryParams["state"]

if ($code -and $returnedState -eq $state) {
    Write-Host "`n✅ Authorization code received!" -ForegroundColor Green
    
    # Exchange code for tokens
    Write-Host "`n=== Step 4: Exchange code for refresh token ===" -ForegroundColor Yellow
    
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
        
        Write-Host "✅ Got tokens successfully!" -ForegroundColor Green
        Write-Host "Scopes granted: $scope" -ForegroundColor Cyan
        
        # Send success page
        $html = @"
<!DOCTYPE html>
<html>
<head><title>Authorization Successful</title></head>
<body style='font-family: Arial; text-align: center; padding: 50px;'>
    <h1 style='color: green;'>✅ Authorization Successful!</h1>
    <p>You can close this window and return to PowerShell.</p>
</body>
</html>
"@
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
        
        Write-Host "`n=== Step 5: Update SUMUP_REFRESH_TOKEN ===" -ForegroundColor Yellow
        Write-Host "Your new refresh token is:" -ForegroundColor White
        Write-Host $refreshToken -ForegroundColor Green
        
        # Save to file
        $refreshToken | Out-File -FilePath "SUMUP_REFRESH_TOKEN.txt" -NoNewline
        Write-Host "`n✅ Saved to SUMUP_REFRESH_TOKEN.txt" -ForegroundColor Green
        
        Write-Host "`n=== Step 6: Update the secret in Cloudflare ===" -ForegroundColor Yellow
        Write-Host "Run this command:" -ForegroundColor White
        Write-Host "  cd payments-worker" -ForegroundColor Gray
        Write-Host "  npx wrangler secret put SUMUP_REFRESH_TOKEN" -ForegroundColor Gray
        Write-Host "  (paste the token above when prompted)" -ForegroundColor Gray
        Write-Host "  npx wrangler deploy" -ForegroundColor Gray
        
        Write-Host "`n✅ Done! Your new refresh token has both scopes!" -ForegroundColor Green
        
    } catch {
        Write-Host "`n❌ Error exchanging code for token: $_" -ForegroundColor Red
        
        $html = @"
<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body style='font-family: Arial; text-align: center; padding: 50px;'>
    <h1 style='color: red;'>❌ Error</h1>
    <p>Failed to exchange code for token. Check PowerShell for details.</p>
</body>
</html>
"@
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
    }
} else {
    Write-Host "`n❌ Authorization failed or state mismatch" -ForegroundColor Red
    
    $html = @"
<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body style='font-family: Arial; text-align: center; padding: 50px;'>
    <h1 style='color: red;'>❌ Authorization Failed</h1>
    <p>State mismatch or no code received.</p>
</body>
</html>
"@
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
    $response.ContentLength64 = $buffer.Length
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.OutputStream.Close()
}

$listener.Stop()
Write-Host "`nCallback server stopped." -ForegroundColor Gray
