# Events API & Shareable Event URLs

## Overview

The Events API provides:
1. **RESTful API** for event management (CRUD operations)
2. **Dynamic event pages** at `/events/[slug]` with SEO optimization
3. **Auto-opening modals** when users visit event URLs
4. **Share functionality** with custom URL slugs

## Features

### 📱 Shareable Event URLs
Every event gets a unique, SEO-friendly URL like:
```
https://dicebastion.co.uk/events/warhammer-tournament-42
```

When users visit this URL:
- They see a full HTML page with Open Graph meta tags (for social sharing)
- Google can index the content (SEO)
- They're redirected to the main events page with the event modal auto-opened
- The URL updates cleanly in the browser

### 🔍 SEO Benefits
Each event page includes:
- Proper `<title>` and meta descriptions
- Open Graph tags (Facebook, LinkedIn)
- Twitter Card tags
- Schema.org structured data (Event type)
- Canonical URLs

## Deployment

### 1. Deploy the Events Edge Script

```powershell
# Navigate to bgg-bunny directory
cd bgg-bunny

# Deploy to Bunny.net
bunny edge-script deploy events-edge-script.ts
```

### 2. Configure Environment Variables

In your Bunny.net Edge Script dashboard, add:

```
BUNNY_DATABASE_URL=<your-database-url>
BUNNY_DATABASE_AUTH_TOKEN=<your-database-token>
ADMIN_API_KEY=<your-admin-api-key>
SITE_URL=https://dicebastion.co.uk
```

### 3. Set Up URL Routing

Configure your Bunny.net zone to route:
- `/events/*` → Events Edge Script
- `/api/events*` → Events Edge Script

### 4. Run Database Migration

Apply the slug migration to ensure all existing events have slugs:

```sql
-- Via your database console
UPDATE events 
SET slug = lower(
  replace(replace(replace(replace(replace(replace(event_name, ' ', '-'), '?', ''), '!', ''), '.', ''), ',', ''), '''', '')
) || '-' || event_id
WHERE slug IS NULL OR slug = '';
```

## API Endpoints

### Public Endpoints

#### `GET /api/events`
List all active events

**Response:**
```json
{
  "events": [
    {
      "id": 42,
      "event_id": 42,
      "title": "Warhammer Tournament",
      "slug": "warhammer-tournament-42",
      "description": "...",
      "event_datetime": "2026-03-15T18:00:00Z",
      "share_url": "https://dicebastion.co.uk/events/warhammer-tournament-42",
      ...
    }
  ],
  "count": 1
}
```

#### `GET /api/events/:id`
Get event by ID

#### `GET /api/events/slug/:slug`
Get event by slug

**Example:**
```bash
curl https://api.dicebastion.co.uk/api/events/slug/warhammer-tournament-42
```

#### `GET /events/:slug`
Dynamic event page (HTML with SEO)

**Example:** `https://dicebastion.co.uk/events/warhammer-tournament-42`

Returns a full HTML page with:
- SEO meta tags
- Open Graph tags
- Schema.org structured data
- Auto-redirect to `/events?open=warhammer-tournament-42`

### Admin Endpoints (Require Authentication)

All admin endpoints require `Authorization: Bearer <ADMIN_API_KEY>` header.

#### `POST /api/events`
Create new event

**Request:**
```json
{
  "event_name": "Warhammer Tournament",
  "description": "Join us for an epic tournament!",
  "event_datetime": "2026-03-15T18:00:00Z",
  "location": "Dice Bastion Gaming Hall",
  "membership_price": 500,
  "non_membership_price": 1000,
  "capacity": 32,
  "category": "tournament",
  "image_url": "https://cdn.dicebastion.co.uk/events/warhammer.jpg",
  "requires_purchase": 1,
  "custom_slug": "warhammer-tournament-march"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event created",
  "event_id": 42,
  "slug": "warhammer-tournament-march",
  "share_url": "https://dicebastion.co.uk/events/warhammer-tournament-march"
}
```

**Notes:**
- `custom_slug` is optional. If not provided, it's auto-generated from event name + ID
- Prices are in pence (500 = £5.00)
- `requires_purchase`: 1 = paid event, 0 = free event

#### `PUT /api/events/:id`
Update existing event

**Request:**
```json
{
  "event_name": "Updated Event Name",
  "custom_slug": "new-custom-slug"
}
```

#### `DELETE /api/events/:id`
Soft-delete event (sets `is_active = 0`)

## Frontend Integration

### Auto-Opening Events from URL

The events page now supports URL parameters:

```
/events?open=warhammer-tournament-42
```

When a user visits this URL, the event modal automatically opens.

### Share Button

Each event modal includes a "Share Event" button that:
1. Copies the shareable URL to clipboard
2. Shows "Copied!" confirmation
3. Displays the URL in a read-only text field for manual copying

## Slug Generation

Slugs are automatically generated from event names:
- Lowercase
- Spaces → hyphens
- Special characters removed
- Max 50 characters
- Event ID appended for uniqueness

**Examples:**
- "Warhammer Tournament" + ID 42 → `warhammer-tournament-42`
- "D&D One-Shot!" + ID 15 → `dd-one-shot-15`

## Testing

### 1. Create an event via API
```bash
curl -X POST https://api.dicebastion.co.uk/api/events \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "Test Event",
    "event_datetime": "2026-04-01T19:00:00Z",
    "description": "This is a test event",
    "membership_price": 0,
    "non_membership_price": 0,
    "requires_purchase": 0
  }'
```

### 2. Get the slug from response
```json
{
  "slug": "test-event-43",
  "share_url": "https://dicebastion.co.uk/events/test-event-43"
}
```

### 3. Visit the shareable URL
Open `https://dicebastion.co.uk/events/test-event-43` in your browser

### 4. Verify:
- ✅ Page loads with event title and description
- ✅ Open Graph tags visible in page source
- ✅ Page redirects to `/events?open=test-event-43`
- ✅ Event modal opens automatically
- ✅ Share button works

### 5. Test SEO
Use Google's Rich Results Test:
```
https://search.google.com/test/rich-results?url=https://dicebastion.co.uk/events/test-event-43
```

## Google Search Console Integration

1. **Submit Sitemap** (optional)
   Generate a sitemap including event URLs:
   ```xml
   <url>
     <loc>https://dicebastion.co.uk/events/warhammer-tournament-42</loc>
     <lastmod>2026-02-11</lastmod>
     <changefreq>weekly</changefreq>
     <priority>0.8</priority>
   </url>
   ```

2. **Request Indexing**
   In Google Search Console:
   - URL Inspection → Enter event URL
   - Request Indexing

3. **Monitor Performance**
   Track clicks and impressions for event URLs

## Security

- ✅ All database queries use **parameterized statements** (SQL injection protection)
- ✅ Admin endpoints require **API key authentication**
- ✅ CORS configured for your domain
- ✅ Input validation on all fields
- ✅ Slug uniqueness enforced via database index

## Future Enhancements

- [ ] Auto-generate sitemaps with event URLs
- [ ] Event series/recurrence in shareable URLs
- [ ] QR code generation for event URLs
- [ ] Analytics tracking for shared links
- [ ] Event calendar (.ics) downloads

## Support

For issues or questions:
1. Check Bunny.net Edge Script logs
2. Verify environment variables are set
3. Test API endpoints with curl/Postman
4. Check browser console for JavaScript errors
