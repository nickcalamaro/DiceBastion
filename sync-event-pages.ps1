# sync-event-pages.ps1
# Automatically creates placeholder Hugo pages for all events in the database

$API_BASE = "https://dicebastion-memberships.ncalamaro.workers.dev"

Write-Host ""
Write-Host "=== Event Pages Sync ===" -ForegroundColor Cyan
Write-Host "Fetching events from API..." -ForegroundColor Cyan

try {
    $events = Invoke-RestMethod -Uri "$API_BASE/events" -ErrorAction Stop
    
    if (-not $events -or $events.Count -eq 0) {
        Write-Host "No events found in database" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "Found $($events.Count) events"
    Write-Host ""
    
    $created = 0
    $skipped = 0
    $errors = 0
    
    foreach ($event in $events) {
        $slug = $event.slug
        
        if (-not $slug) {
            Write-Host "Warning: Skipping event ID $($event.id) - no slug" -ForegroundColor Yellow
            $skipped++
            continue
        }
        
        $filename = "content\Events\$slug.md"
        
        if (Test-Path $filename) {
            Write-Host "  $slug.md - already exists" -ForegroundColor Gray
            $skipped++
            continue
        }
        
        $title = $event.title -replace '"', '`"'
        $frontmatter = @"
---
title: "$title"
layout: "events"
---
"@
        
        try {
            Set-Content -Path $filename -Value $frontmatter -ErrorAction Stop
            Write-Host "Created $slug.md" -ForegroundColor Green
            $created++
        } catch {
            Write-Host "Failed to create $slug.md : $_" -ForegroundColor Red
            $errors++
        }
    }
    
    Write-Host ""
    Write-Host "=== Summary ===" -ForegroundColor Cyan
    Write-Host "Created: $created" -ForegroundColor Green
    Write-Host "Skipped: $skipped" -ForegroundColor Yellow
    if ($errors -gt 0) {
        Write-Host "Errors:  $errors" -ForegroundColor Red
    }
    
    if ($created -gt 0) {
        Write-Host ""
        Write-Host "Run 'hugo' or 'hugo server' to rebuild the site." -ForegroundColor Cyan
    }
    
} catch {
    Write-Host ""
    Write-Host "Error fetching events from API" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
