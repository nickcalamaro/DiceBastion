# BGG Sync Worker

Cloudflare Worker that syncs board game data from BoardGameGeek, caches images in R2, and serves the data.

## Setup

1. **Register BGG Application:**
   - Go to https://boardgamegeek.com/applications
   - Create a new application (non-commercial for personal sites)
   - Wait for approval (may take up to a week)
   - Once approved, create a token for your application

2. **Configure Worker:**
```bash
cd bgg-worker

# Set BGG API token (required)
wrangler secret put BGG_API_TOKEN
# Paste your Bearer token when prompted

# Optional: BGG credentials (only if needed for private lists)
wrangler secret put BGG_USERNAME
wrangler secret put BGG_PASSWORD
```

3. **Ensure R2 bucket exists:**
Your `dicebastion-images` R2 bucket should already be set up. The worker will use it to store:
- `boardgames/data.json` - Game library data
- `boardgames/images/{gameId}.jpg` - Game images

4. **Deploy:**
```bash
wrangler deploy
```

5. **Trigger initial sync:**
```bash
curl -X POST https://bgg-sync-worker.your-subdomain.workers.dev/sync
```

## How It Works

- **Cron job** runs daily at 2 AM UTC
- Fetches geeklist from BGG
- Downloads all images to R2 (skips if already cached)
- Updates game data with R2 image URLs
- Stores JSON in R2

## Endpoints

- **GET /boardgames** - Returns cached board game library data from R2
- **POST /sync** - Manually trigger a sync

## Update Main Site

In your `content/board-game-library.md`, update the fetch URL:

```javascript
const response = await fetch('https://bgg-sync-worker.your-subdomain.workers.dev/boardgames');
```

Images will be served from your R2 public URL: `https://pub-631ca6f207ca4661ac9cb2ba9371ba31.r2.dev/boardgames/images/{gameId}.jpg`
