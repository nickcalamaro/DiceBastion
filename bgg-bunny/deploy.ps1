# Deploy Bunny.net Edge Script
# Usage: .\deploy.ps1

# Configuration - set these as environment variables or update here
$BUNNY_API_KEY = $env:BUNNY_API_KEY
$PULL_ZONE_ID = $env:BUNNY_PULL_ZONE_ID  # Get this from your pull zone URL or settings

if (-not $BUNNY_API_KEY) {
    Write-Host "Error: BUNNY_API_KEY environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:BUNNY_API_KEY='your-api-key'" -ForegroundColor Yellow
    exit 1
}

if (-not $PULL_ZONE_ID) {
    Write-Host "Error: BUNNY_PULL_ZONE_ID environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:BUNNY_PULL_ZONE_ID='your-pull-zone-id'" -ForegroundColor Yellow
    exit 1
}

# Read the Edge Script
$scriptPath = Join-Path $PSScriptRoot "edge-script.js"
if (-not (Test-Path $scriptPath)) {
    Write-Host "Error: edge-script.js not found at $scriptPath" -ForegroundColor Red
    exit 1
}

$scriptCode = Get-Content $scriptPath -Raw

Write-Host "Deploying Edge Script to Pull Zone $PULL_ZONE_ID..." -ForegroundColor Cyan

# Prepare the request body
$body = @{
    Code = $scriptCode
    Enabled = $true
} | ConvertTo-Json

# Deploy via Bunny API
$uri = "https://api.bunny.net/pullzone/$PULL_ZONE_ID/edgerules/addOrUpdateEdgeRule"

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers @{
        "AccessKey" = $BUNNY_API_KEY
        "Content-Type" = "application/json"
    } -Body $body

    Write-Host "✅ Edge Script deployed successfully!" -ForegroundColor Green
    Write-Host $response | ConvertTo-Json
} catch {
    Write-Host "❌ Deployment failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host $_.ErrorDetails.Message
    exit 1
}
