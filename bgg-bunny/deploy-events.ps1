#!/usr/bin/env pwsh

# Deploy Events Edge Script to Bunny.net
# 
# This script deploys the Events API edge script which handles:
# - Event CRUD API endpoints
# - Dynamic event pages with SEO
# - Shareable event URLs

Write-Host "🚀 Deploying Events Edge Script to Bunny.net..." -ForegroundColor Cyan

# Configuration
$SCRIPT_NAME = "DiceBastionEvents"
$SCRIPT_FILE = "events-edge-script.ts"
$PULL_ZONE_ID = $env:BUNNY_PULL_ZONE_ID
$API_KEY = $env:BUNNY_API_KEY

if (-not $PULL_ZONE_ID) {
    Write-Host "❌ Error: BUNNY_PULL_ZONE_ID environment variable not set" -ForegroundColor Red
    Write-Host "Please set it with: `$env:BUNNY_PULL_ZONE_ID='your-pull-zone-id'" -ForegroundColor Yellow
    exit 1
}

if (-not $API_KEY) {
    Write-Host "❌ Error: BUNNY_API_KEY environment variable not set" -ForegroundColor Red
    Write-Host "Please set it with: `$env:BUNNY_API_KEY='your-api-key'" -ForegroundColor Yellow
    exit 1
}

# Check if script file exists
if (-not (Test-Path $SCRIPT_FILE)) {
    Write-Host "❌ Error: $SCRIPT_FILE not found" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Reading script file..." -ForegroundColor Yellow
$scriptContent = Get-Content $SCRIPT_FILE -Raw

Write-Host "📤 Uploading to Bunny.net..." -ForegroundColor Yellow

# API endpoint for edge scripts
$apiUrl = "https://api.bunny.net/pullzone/$PULL_ZONE_ID/edgerules/addorupdate"

# Prepare the payload
$payload = @{
    Guid = [guid]::NewGuid().ToString()
    ActionType = 13  # Edge Script action
    TriggerMatchingType = 0  # Match any
    Description = "Events API & Dynamic Pages"
    Enabled = $true
    ActionParameter1 = $scriptContent
    Triggers = @(
        @{
            Type = 0  # URL
            PatternMatches = @("/events/*", "/api/events*")
            PatternMatchingType = 0  # Match any
            Parameter1 = ""
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post `
        -Headers @{
            "AccessKey" = $API_KEY
            "Content-Type" = "application/json"
        } `
        -Body $payload

    Write-Host "✅ Events Edge Script deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Verify environment variables in Bunny.net dashboard:" -ForegroundColor White
    Write-Host "   - BUNNY_DATABASE_URL" -ForegroundColor Gray
    Write-Host "   - BUNNY_DATABASE_AUTH_TOKEN" -ForegroundColor Gray
    Write-Host "   - ADMIN_API_KEY" -ForegroundColor Gray
    Write-Host "   - SITE_URL" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Run database migration:" -ForegroundColor White
    Write-Host "   See migrations/0004_add_event_slugs.sql" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Test the deployment:" -ForegroundColor White
    Write-Host "   curl https://dicebastion.co.uk/api/events" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📖 Full documentation: EVENTS_API_README.md" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
