#!/usr/bin/env pwsh

# Test script for Event Shareable URLs
# Run this after deploying to verify everything works

param(
    [string]$ApiUrl = "https://api.dicebastion.co.uk",
    [string]$SiteUrl = "https://dicebastion.co.uk",
    [string]$AdminApiKey = $env:ADMIN_API_KEY
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 Testing Event Shareable URLs Implementation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: API Health Check
Write-Host "1️⃣ Testing API endpoints..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/events" -Method Get
    if ($response.events) {
        Write-Host "   ✅ GET /api/events - OK ($($response.count) events found)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ No events found, but API is working" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ GET /api/events - FAILED" -ForegroundColor Red
    Write-Host "      Error: $_" -ForegroundColor Red
}

# Test 2: Create Test Event (if admin key provided)
if ($AdminApiKey) {
    Write-Host ""
    Write-Host "2️⃣ Creating test event..." -ForegroundColor Yellow
    
    $testEvent = @{
        event_name = "API Test Event"
        event_datetime = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ")
        description = "This is a test event created by the test script"
        location = "Dice Bastion"
        membership_price = 0
        non_membership_price = 0
        requires_purchase = 0
        custom_slug = "test-event-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    } | ConvertTo-Json
    
    try {
        $headers = @{
            "Authorization" = "Bearer $AdminApiKey"
            "Content-Type" = "application/json"
        }
        
        $createResponse = Invoke-RestMethod -Uri "$ApiUrl/api/events" `
            -Method Post `
            -Headers $headers `
            -Body $testEvent
        
        if ($createResponse.success) {
            $eventId = $createResponse.event_id
            $slug = $createResponse.slug
            $shareUrl = $createResponse.share_url
            
            Write-Host "   ✅ Event created successfully!" -ForegroundColor Green
            Write-Host "      Event ID: $eventId" -ForegroundColor Gray
            Write-Host "      Slug: $slug" -ForegroundColor Gray
            Write-Host "      Share URL: $shareUrl" -ForegroundColor Gray
            
            # Test 3: Fetch event by slug
            Write-Host ""
            Write-Host "3️⃣ Testing event by slug..." -ForegroundColor Yellow
            try {
                $slugResponse = Invoke-RestMethod -Uri "$ApiUrl/api/events/slug/$slug" -Method Get
                if ($slugResponse.event.slug -eq $slug) {
                    Write-Host "   ✅ GET /api/events/slug/$slug - OK" -ForegroundColor Green
                }
            } catch {
                Write-Host "   ❌ Failed to fetch event by slug" -ForegroundColor Red
            }
            
            # Test 4: Check shareable URL
            Write-Host ""
            Write-Host "4️⃣ Testing shareable URL..." -ForegroundColor Yellow
            try {
                $urlResponse = Invoke-WebRequest -Uri "$SiteUrl/events/$slug" `
                    -Method Get `
                    -MaximumRedirection 0 `
                    -ErrorAction SilentlyContinue
                
                $htmlContent = $urlResponse.Content
                
                # Check for meta tags
                $hasTitleTag = $htmlContent -match "<title>.*API Test Event.*</title>"
                $hasOgTags = $htmlContent -match "property=`"og:"
                $hasSchemaOrg = $htmlContent -match "schema.org"
                
                if ($hasTitleTag -and $hasOgTags -and $hasSchemaOrg) {
                    Write-Host "   ✅ Shareable URL page has proper SEO tags" -ForegroundColor Green
                    Write-Host "      ✓ Title tag found" -ForegroundColor Gray
                    Write-Host "      ✓ Open Graph tags found" -ForegroundColor Gray
                    Write-Host "      ✓ Schema.org markup found" -ForegroundColor Gray
                } else {
                    Write-Host "   ⚠️ Some SEO tags may be missing" -ForegroundColor Yellow
                    if (!$hasTitleTag) { Write-Host "      ✗ Title tag missing" -ForegroundColor Red }
                    if (!$hasOgTags) { Write-Host "      ✗ Open Graph tags missing" -ForegroundColor Red }
                    if (!$hasSchemaOrg) { Write-Host "      ✗ Schema.org markup missing" -ForegroundColor Red }
                }
            } catch {
                Write-Host "   ⚠️ Could not fetch shareable URL (this is OK if not deployed yet)" -ForegroundColor Yellow
            }
            
            # Test 5: Clean up
            Write-Host ""
            Write-Host "5️⃣ Cleaning up test event..." -ForegroundColor Yellow
            try {
                $deleteResponse = Invoke-RestMethod -Uri "$ApiUrl/api/events/$eventId" `
                    -Method Delete `
                    -Headers $headers
                
                if ($deleteResponse.success) {
                    Write-Host "   ✅ Test event deleted successfully" -ForegroundColor Green
                }
            } catch {
                Write-Host "   ⚠️ Failed to delete test event (ID: $eventId)" -ForegroundColor Yellow
                Write-Host "      You may need to delete it manually" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "   ❌ Failed to create test event" -ForegroundColor Red
        Write-Host "      Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "2️⃣ Skipping admin tests (no API key provided)" -ForegroundColor Yellow
    Write-Host "   To run full tests, set ADMIN_API_KEY environment variable" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

if ($AdminApiKey) {
    Write-Host "✅ All tests completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Create a real event via admin panel or API" -ForegroundColor White
    Write-Host "2. Share the event URL on social media" -ForegroundColor White
    Write-Host "3. Test the URL in Google Rich Results Test:" -ForegroundColor White
    Write-Host "   https://search.google.com/test/rich-results" -ForegroundColor Gray
    Write-Host "4. Submit to Google Search Console for indexing" -ForegroundColor White
} else {
    Write-Host "ℹ️ Partial tests completed (read-only)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To run full tests:" -ForegroundColor Yellow
    Write-Host "`$env:ADMIN_API_KEY='your-api-key'" -ForegroundColor Gray
    Write-Host ".\test-event-urls.ps1" -ForegroundColor Gray
}

Write-Host ""
