# BGG Sync for Bunny.net

Syncs board game library data from BoardGameGeek to Bunny Storage and serves via Bunny CDN.

## Architecture

- **Bunny Storage**: Stores game data JSON and images
- **Bunny CDN**: Delivers files with global edge caching
- **GitHub Actions**: Scheduled sync (daily at 2 AM UTC)

No edge script needed - files are served directly from Bunny CDN!

## Setup

### 1. Create Bunny Storage Zone

1. Go to https://bunny.net/dashboard/storagezones
2. Click **Add Storage Zone**
3. Name: `dicebastion` (or your preferred name)
4. Region: Choose closest to your users
5. Note the **Password** (this is your Storage API key)

### 2. Create Bunny Pull Zone (CDN)

1. Go to https://bunny.net/dashboard/pullzones
2. Click **Add Pull Zone**
3. Name: `dicebastion` (or your preferred name)
4. Origin Type: Select **Bunny Storage Zone**
5. Link it to your storage zone created in step 1
6. Note the **CDN URL** (e.g., `https://dicebastion.b-cdn.net`)

### 3. Enable Edge Scripting (Optional - for custom endpoint)

If you want a custom `/boardgames` endpoint instead of `/boardgames/data.json`:

**Option A: Deploy via Terminal (like Cloudflare Workers)**

1. Get your Bunny API key: Dashboard → Account Settings → API Key
2. Get your Pull Zone ID: It's in the URL when viewing your pull zone, or check the pull zone settings
3. Set environment variables:
   ```powershell
   # Windows PowerShell
   $env:BUNNY_API_KEY="your-api-key"
   $env:BUNNY_PULL_ZONE_ID="your-pull-zone-id"
   
   # Then deploy
   .\bgg-bunny\deploy.ps1
   ```
   
   ```bash
   # Linux/Mac
   export BUNNY_API_KEY="your-api-key"
   export BUNNY_PULL_ZONE_ID="your-pull-zone-id"
   
   # Then deploy
   chmod +x bgg-bunny/deploy.sh
   ./bgg-bunny/deploy.sh
   ```

**Option B: Deploy via Bunny Dashboard**

1. Go to your Pull Zone → **Edge Rules** (or look for Edge Scripting section)
2. Click **Add Edge Rule** or **Edge Script**
3. Copy the contents from `bgg-bunny/edge-script.js`
4. Paste into the editor
5. Update line 9 with your storage zone name
6. Add environment variable `STORAGE_API_KEY` = your storage password
7. Save and enable

**Option C: Skip Edge Scripting** (Simplest)

Just use the direct URL: `https://your-cdn.b-cdn.net/boardgames/data.json`

No deployment needed, works immediately!

### 4. Enable CORS

In your Pull Zone settings:
1. Go to **Headers** or **General** tab
2. Look for **Custom Headers** or **CORS Settings**
3. Add:
   - Header: `Access-Control-Allow-Origin`
   - Value: `*` (or your specific domain like `https://dicebastion.com`)

### 4. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `BGG_API_TOKEN` - Your BGG API Bearer token (from https://boardgamegeek.com/applications)
- `BUNNY_STORAGE_ZONE` - Your storage zone name (e.g., `dicebastion`)
- `BUNNY_STORAGE_API_KEY` - Your storage zone password from step 1
- `BUNNY_CDN_URL` - Your pull zone URL (e.g., `https://dicebastion.b-cdn.net`)

### 5. Register BGG Application

1. Go to https://boardgamegeek.com/applications
2. Create a new non-commercial application
3. Wait for approval (may take up to a week)
4. Create a token and add to GitHub secrets as `BGG_API_TOKEN`

### 6. Run Initial Sync

**Option A: Via GitHub Actions**
- Go to Actions tab → "Sync Board Games to Bunny.net" → Run workflow

**Option B: Locally**
```bash
# Windows PowerShell
$env:BGG_API_TOKEN="your-token"
$env:BUNNY_STORAGE_ZONE="dicebastion"
$env:BUNNY_STORAGE_API_KEY="your-storage-password"
$env:BUNNY_CDN_URL="https://dicebastion.b-cdn.net"
node bgg-bunny/sync-script.js

# Linux/Mac
export BGG_API_TOKEN="your-token"
export BUNNY_STORAGE_ZONE="dicebastion"
export BUNNY_STORAGE_API_KEY="your-storage-password"
export BUNNY_CDN_URL="https://dicebastion.b-cdn.net"
node bgg-bunny/sync-script.js
```

## Usage

**If using Edge Scripting:**
```
https://your-pullzone.b-cdn.net/boardgames
```

**If using direct storage (simpler, recommended):**
```
https://your-pullzone.b-cdn.net/boardgames/data.json
```

Update your `content/board-game-library.md` to fetch from your chosen URL.

Images will always be at:
```
https://your-pullzone.b-cdn.net/boardgames/images/{gameId}.jpg
```

## How It Works

1. **GitHub Action** runs daily (or manually triggered)
2. Script fetches geeklist from BGG XML API
3. Downloads game images to Bunny Storage at `boardgames/images/{id}.jpg`
4. Uploads game data JSON to Bunny Storage at `boardgames/data.json`
5. **Bunny CDN** automatically serves everything with global edge caching

No edge script needed - it's just static file hosting with CDN!

## File Structure in Bunny Storage

```
/boardgames/
  data.json                    # Game library metadata
  images/
    12345.jpg                  # Game images by BGG ID
    67890.jpg
    ...
```

## Advantages over Cloudflare

- **Simpler**: No workers, no KV, just storage + CDN
- **Flat pricing**: No per-request charges
- **Better DDoS protection**: Bunny's specialty
- **EU-based**: Better GDPR compliance
- **Generous free tier**: 10GB storage + 100GB bandwidth free
