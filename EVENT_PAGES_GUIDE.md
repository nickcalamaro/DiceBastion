# Event Page Template Generator

This script helps create placeholder pages for events so Hugo can route to them.

## How Event Pages Work

1. **Database**: Events are stored in D1 database with fields including `slug`
2. **Listing Page**: `/events/` fetches all events from API and displays them
3. **Detail Pages**: `/events/[slug]/` are placeholder Hugo pages that fetch event data client-side
4. **Purchase**: Events with `requires_purchase=1` show ticket purchase UI

## Creating a New Event Page

When you add an event in the admin dashboard with a slug (e.g., "magic-draft-night"), you need to create a corresponding Hugo page at `content/Events/magic-draft-night.md`:

```markdown
---
title: "Event"
layout: "events"
---
```

That's it! The page template at `layouts/events/single.html` handles fetching the actual event data from the API using the slug from the URL.

## Automatic Page Creation Script

Run this PowerShell script to generate placeholder pages for all events in the database:

```powershell
# sync-event-pages.ps1
$API_BASE = "https://dicebastion-memberships.ncalamaro.workers.dev"

Write-Host "Fetching events from API..." -ForegroundColor Cyan
$events = Invoke-RestMethod -Uri "$API_BASE/events"

Write-Host "Found $($events.Count) events" -ForegroundColor Green

foreach ($event in $events) {
    $slug = $event.slug
    if (-not $slug) {
        Write-Host "Skipping event $($event.id) - no slug" -ForegroundColor Yellow
        continue
    }
    
    $filename = "content/Events/$slug.md"
    
    if (Test-Path $filename) {
        Write-Host "✓ $filename already exists" -ForegroundColor Gray
        continue
    }
    
    $content = @"
---
title: "$($event.title)"
layout: "events"
---
"@
    
    Set-Content -Path $filename -Value $content
    Write-Host "✓ Created $filename" -ForegroundColor Green
}

Write-Host "`nDone! Run 'hugo' to rebuild site." -ForegroundColor Cyan
```

## Manual Page Creation

To manually create a page for a new event:

1. Go to Admin Dashboard → Events → Add New Event
2. Fill in the form (title will auto-generate slug)
3. Note the slug (e.g., "summer-tournament")
4. Create `content/Events/summer-tournament.md`:
   ```markdown
   ---
   title: "Summer Tournament"
   layout: "events"
   ---
   ```
5. Run `hugo` to rebuild
6. Page will be available at `/events/summer-tournament/`

## URL Structure

- Events List: `/events/` → `content/Events/_index.md`
- Event Detail: `/events/slug-here/` → `content/Events/slug-here.md` → `layouts/events/single.html`

The detail page layout fetches event data client-side from `GET /events/:slug` API endpoint.

## Free vs Paid Events

Events with `requires_purchase=0` are free and won't show ticket purchase UI.
Events with `requires_purchase=1` will display:
- Member and non-member pricing
- Ticket purchase button
- SumUp payment widget
- Membership promotion

## Testing

1. Create an event in admin with slug "test-event"
2. Create `content/Events/test-event.md` with layout "events"
3. Run Hugo locally: `hugo server -D`
4. Visit `http://localhost:1313/events/test-event/`
5. Page should load event data and display it dynamically
