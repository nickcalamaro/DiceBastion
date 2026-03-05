# Event Shareable URLs Implementation Summary

## ✅ What Was Implemented

### 1. **Events Edge Script** ([bgg-bunny/events-edge-script.ts](bgg-bunny/events-edge-script.ts))
A Cloudflare Worker-style edge script that provides:

- **RESTful API** for events (CRUD operations)
  - `GET /api/events` - List all events
  - `GET /api/events/:id` - Get event by ID
  - `GET /api/events/slug/:slug` - Get event by slug
  - `POST /api/events` - Create event (admin)
  - `PUT /api/events/:id` - Update event (admin)
  - `DELETE /api/events/:id` - Delete event (admin)

- **Dynamic Event Pages** (`/events/:slug`)
  - Server-rendered HTML for each event
  - Full SEO meta tags (Open Graph, Twitter Cards, Schema.org)
  - Auto-redirect to main events page with modal
  - Google-indexable content

- **Automatic Slug Generation**
  - Converts event names to URL-friendly slugs
  - Ensures uniqueness with event ID
  - Supports custom slugs via `custom_slug` parameter

### 2. **Frontend Updates**

#### [layouts/shortcodes/eventsPage.html](layouts/shortcodes/eventsPage.html)
- Auto-opens event modal from URL parameter (`?open=slug`)
- Detects `window.eventSlugToOpen` from dynamic pages
- Smooth user experience when clicking shared links

#### [layouts/partials/eventModal.html](layouts/partials/eventModal.html)
- **Share Button** with copy-to-clipboard functionality
- **Shareable URL Display** in read-only text field
- Visual feedback when URL is copied
- Clean, modern UI with proper styling

### 3. **Database Migration** ([bgg-bunny/migrations/0004_add_event_slugs.sql](bgg-bunny/migrations/0004_add_event_slugs.sql))
- Adds slugs to existing events
- Creates unique index on slug column
- Safe to run on existing databases

### 4. **Documentation**

- **[bgg-bunny/EVENTS_API_README.md](bgg-bunny/EVENTS_API_README.md)** - Complete API documentation
- **[SHAREABLE_URLS_GUIDE.md](SHAREABLE_URLS_GUIDE.md)** - Quick reference guide
- **Deployment scripts** (PowerShell & Bash)

## 🎯 How It Works

```mermaid
graph TD
    A[User clicks shared link] --> B[/events/my-event-42]
    B --> C[Edge Script serves HTML page]
    C --> D[SEO meta tags loaded]
    C --> E[Auto-redirect to /events?open=my-event-42]
    E --> F[Main events page loads]
    F --> G[JavaScript detects ?open parameter]
    G --> H[Event modal opens automatically]
    D --> I[Google indexes content]
```

## 📦 Files Created/Modified

### New Files
- `bgg-bunny/events-edge-script.ts` - Main edge script
- `bgg-bunny/EVENTS_API_README.md` - Full documentation
- `bgg-bunny/migrations/0004_add_event_slugs.sql` - Database migration
- `bgg-bunny/deploy-events.ps1` - PowerShell deployment script
- `bgg-bunny/deploy-events.sh` - Bash deployment script
- `SHAREABLE_URLS_GUIDE.md` - Quick reference guide

### Modified Files
- `layouts/shortcodes/eventsPage.html` - Added URL parameter handling
- `layouts/partials/eventModal.html` - Added share button and styling

## 🚀 Deployment Steps

### 1. Deploy Edge Script
```powershell
cd bgg-bunny
.\deploy-events.ps1
```

### 2. Configure Environment Variables
In Bunny.net dashboard:
- `BUNNY_DATABASE_URL` - Your database URL
- `BUNNY_DATABASE_AUTH_TOKEN` - Database token
- `ADMIN_API_KEY` - API key for admin endpoints
- `SITE_URL` - `https://dicebastion.co.uk`

### 3. Run Database Migration
```sql
UPDATE events 
SET slug = lower(replace(replace(...), ' ', '-')) || '-' || event_id
WHERE slug IS NULL OR slug = '';
```

### 4. Update Hugo Site
Deploy the updated Hugo templates:
```powershell
hugo
# Deploy public/ folder to your host
```

### 5. Test
```bash
# Create a test event
curl -X POST https://api.dicebastion.co.uk/api/events \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"event_name":"Test","event_datetime":"2026-03-01T18:00:00Z",...}'

# Visit shareable URL
# https://dicebastion.co.uk/events/test-{id}
```

## 🎨 SEO Features

Each event URL includes:

```html
<!-- Primary Meta Tags -->
<title>Event Name | Dice Bastion</title>
<meta name="description" content="Event description...">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="event">
<meta property="og:url" content="https://dicebastion.co.uk/events/slug">
<meta property="og:title" content="Event Name">
<meta property="og:image" content="event-image.jpg">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">

<!-- Schema.org -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Event Name",
  "startDate": "2026-03-15T18:00:00Z",
  ...
}
</script>
```

## 🔒 Security

- ✅ **SQL Injection Protected** - All queries use parameterized statements
- ✅ **API Authentication** - Admin endpoints require Bearer token
- ✅ **Input Validation** - Required fields validated
- ✅ **Slug Uniqueness** - Database constraint prevents duplicates

## 📊 Benefits

1. **SEO**: Event pages are fully indexable by Google
2. **Social Sharing**: Rich previews on Facebook, Twitter, LinkedIn
3. **User Experience**: Direct links to events with auto-opening modals
4. **Marketing**: Custom slugs for campaigns
5. **Analytics**: Track shared link performance
6. **Professionalism**: Clean, shareable URLs

## 🎯 Example Usage

### Creating an Event
```bash
curl -X POST https://api.dicebastion.co.uk/api/events \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "Warhammer Tournament",
    "custom_slug": "warhammer-march-2026",
    "event_datetime": "2026-03-15T18:00:00Z",
    "description": "Join us for an epic tournament!",
    "location": "Dice Bastion",
    "membership_price": 500,
    "non_membership_price": 1000,
    "capacity": 32,
    "image_url": "https://cdn.dicebastion.co.uk/warhammer.jpg"
  }'
```

**Response:**
```json
{
  "success": true,
  "event_id": 42,
  "slug": "warhammer-march-2026",
  "share_url": "https://dicebastion.co.uk/events/warhammer-march-2026"
}
```

### Sharing the Event
Share this URL anywhere:
```
https://dicebastion.co.uk/events/warhammer-march-2026
```

When clicked:
1. User sees full event page (SEO content)
2. Auto-redirects to events page
3. Event modal opens
4. User can book/view details

## 🔮 Future Enhancements

Potential additions:
- [ ] QR code generation for event URLs
- [ ] Calendar (.ics) file downloads
- [ ] Event series URLs (recurring events)
- [ ] Analytics dashboard for shared links
- [ ] Short URL service integration
- [ ] Email sharing templates
- [ ] Social media auto-posting

## 📞 Support

**Questions?** Check:
1. [EVENTS_API_README.md](bgg-bunny/EVENTS_API_README.md) - Full API docs
2. [SHAREABLE_URLS_GUIDE.md](SHAREABLE_URLS_GUIDE.md) - Quick reference

**Issues?**
1. Check Bunny.net edge script logs
2. Verify environment variables
3. Test API endpoints directly
4. Review browser console

---

**Status**: ✅ Ready for deployment
**Last Updated**: February 11, 2026
