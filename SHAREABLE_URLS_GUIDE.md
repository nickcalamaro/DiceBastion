# Shareable Event URLs - Quick Reference

## 🎯 What You Get

Every event now has a **shareable, SEO-friendly URL** like:
```
https://dicebastion.co.uk/events/warhammer-tournament-42
```

## 🚀 How It Works

1. **Create Event** (via admin panel or API)
   - Event gets auto-generated slug: `event-name-{id}`
   - Or provide custom slug: `custom_slug: "my-event"`

2. **Get Shareable URL**
   - API returns: `share_url: "https://dicebastion.co.uk/events/my-event"`
   - Share button in event modal displays the URL

3. **Someone Clicks Link**
   - Sees full event page with meta tags (SEO)
   - Auto-redirected to events page
   - Event modal opens automatically
   - Google can index the content

## 📱 Using Shareable URLs

### Get Event's Shareable URL

**Via API:**
```bash
curl https://api.dicebastion.co.uk/api/events/42
```
Returns:
```json
{
  "slug": "warhammer-tournament-42",
  "share_url": "https://dicebastion.co.uk/events/warhammer-tournament-42"
}
```

**Via Frontend:**
- Open event modal
- Click "Share Event" button
- Copy URL from text field or clipboard

### Share on Social Media

The shareable URLs include Open Graph tags, so when shared on:
- **Facebook** - Shows event image, title, description
- **Twitter** - Shows card with event details
- **LinkedIn** - Professional event preview
- **WhatsApp** - Rich preview with image

### For Marketing

Create custom slugs for campaigns:
```json
{
  "event_name": "Summer Tournament 2026",
  "custom_slug": "summer-2026"
  ...
}
```
Share: `https://dicebastion.co.uk/events/summer-2026`

## 🎨 SEO Benefits

Each event URL includes:
- ✅ Unique page title
- ✅ Meta description
- ✅ Open Graph tags (social sharing)
- ✅ Twitter Card tags
- ✅ Schema.org Event structured data
- ✅ Canonical URL
- ✅ Google-indexable content

## 🔧 Admin Usage

### Create Event with Custom Slug
```bash
curl -X POST https://api.dicebastion.co.uk/api/events \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "Mega Tournament",
    "custom_slug": "mega-tournament-2026",
    "event_datetime": "2026-06-01T18:00:00Z",
    ...
  }'
```

### Update Event Slug
```bash
curl -X PUT https://api.dicebastion.co.uk/api/events/42 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "custom_slug": "new-slug-name"
  }'
```

## 📊 Tracking & Analytics

### Google Search Console
1. Submit event URLs for indexing
2. Monitor clicks and impressions
3. Track search appearance

### URL Parameters
All shared URLs support analytics:
```
https://dicebastion.co.uk/events/my-event?utm_source=facebook&utm_campaign=summer
```

## ⚠️ Important Notes

1. **Slug Uniqueness**
   - Slugs must be unique across all events
   - Auto-generated slugs include event ID for uniqueness
   - Custom slugs are validated for conflicts

2. **URL Permanence**
   - Once shared, don't change slugs
   - Old URLs won't redirect to new slugs
   - Consider URL impact before changing

3. **Deleted Events**
   - Soft-deleted events (`is_active = 0`) return 404
   - Shareable URLs stop working
   - Re-activating restores the URL

## 🧪 Testing Checklist

- [ ] Create test event via API
- [ ] Verify slug is generated/assigned
- [ ] Visit shareable URL directly
- [ ] Check meta tags in page source
- [ ] Verify auto-redirect works
- [ ] Confirm modal opens automatically
- [ ] Test share button (copy to clipboard)
- [ ] Share on social media (preview check)
- [ ] Test with Google Rich Results Test
- [ ] Verify in incognito/private browsing

## 📞 Support

**Issues?**
1. Check browser console for errors
2. Verify API response includes `slug` field
3. Check event `is_active = 1` in database
4. Test API endpoint: `/api/events/slug/your-slug`
5. Review Bunny.net edge script logs

**SEO Not Working?**
1. View page source - check for meta tags
2. Test with Google Rich Results Test
3. Verify `SITE_URL` environment variable
4. Check canonical URL matches
5. Submit to Google Search Console

## 🎓 Examples

### Tournament Event
```
Name: "Warhammer 40K Tournament - March 2026"
Auto-slug: "warhammer-40k-tournament-march-2026-15"
URL: https://dicebastion.co.uk/events/warhammer-40k-tournament-march-2026-15
```

### Weekly Event
```
Name: "Friday Night Magic"
Custom-slug: "fnm"
URL: https://dicebastion.co.uk/events/fnm
```

### Special Event
```
Name: "Grand Opening Celebration!"
Custom-slug: "grand-opening"
URL: https://dicebastion.co.uk/events/grand-opening
```
