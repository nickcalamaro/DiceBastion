/**
 * BGG to Bunny.net Sync Script
 * Fetches board games from BoardGameGeek geeklist and uploads to Bunny Storage
 * Run with: node scripts/sync-bgg-to-bunny.js
 */

// Load environment variables from .env file
require('dotenv').config();

const https = require('https');
const http = require('http');
const xml2js = require('xml2js');

// Configuration
const GEEKLIST_ID = '352631';
const BGG_API_TOKEN = process.env.BGG_API_TOKEN; // Your BGG API token
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'dicebastion';
const BUNNY_STORAGE_REGION = process.env.BUNNY_STORAGE_REGION || 'de'; // de, ny, la, sg, etc.

const BGG_GEEKLIST_URL = `https://boardgamegeek.com/xmlapi/geeklist/${GEEKLIST_ID}`;
// Bunny Storage endpoint format: storage.bunnycdn.com/{storageZoneName}/{path}
const BUNNY_STORAGE_URL = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;

// Fetch from URL with retry logic for BGG API
function fetchURL(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'DiceBastion/1.0 (+https://dicebastion.com)',
        ...headers
      }
    };

    protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ data, headers: res.headers });
        } else if (res.statusCode === 202) {
          // BGG returns 202 when preparing data - need to retry
          reject(new Error('BGG_RETRY'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

// Download binary data (for images)
function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'DiceBastion/1.0 (+https://dicebastion.com)'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// Upload to Bunny Storage
async function uploadToBunny(path, data, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const url = `${BUNNY_STORAGE_URL}/${path}`;
    const options = new URL(url);
    
    console.log(`Uploading to: ${url}`);
    console.log(`API Key length: ${BUNNY_STORAGE_API_KEY ? BUNNY_STORAGE_API_KEY.length : 0}`);
    
    const req = https.request({
      hostname: options.hostname,
      path: options.pathname,
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log(`✅ Uploaded: ${path}`);
          resolve(responseData);
        } else {
          console.error(`Upload failed - Status: ${res.statusCode}`);
          console.error(`Response: ${responseData}`);
          reject(new Error(`Upload failed (${res.statusCode}): ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Fetch geeklist from BGG
async function fetchGeeklist(retries = 3) {
  console.log(`Fetching geeklist ${GEEKLIST_ID} from BoardGameGeek...`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const headers = {};
      if (BGG_API_TOKEN) {
        headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`;
      }
      
      const { data } = await fetchURL(BGG_GEEKLIST_URL, headers);
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(data);
      
      const geeklist = result.geeklist;
      const items = Array.isArray(geeklist.item) ? geeklist.item : [geeklist.item];
      
      // Log first item to see what image data is available
      if (items.length > 0) {
        console.log('First item structure:', JSON.stringify(items[0], null, 2));
      }
      
      const metadata = {
        title: geeklist.title || 'Board Game Library',
        description: geeklist.description || '',
        numitems: parseInt(geeklist.$.numitems || '0', 10),
        thumbs: parseInt(geeklist.$.thumbs || '0', 10)
      };
      
      const games = items
        .filter(item => item.$.objecttype === 'thing' && item.$.subtype === 'boardgame')
        .map(item => {
          // BGG XML API v1 geeklist includes imageid attribute
          let imageUrl = null;
          const imageId = item.$.imageid;
          
          if (imageId && imageId !== '0') {
            // BGG image URL format
            imageUrl = `https://cf.geekdo-images.com/original/img/${imageId.substring(0, 2)}/${imageId}.jpg`;
          }
          
          return {
            id: item.$.objectid,
            name: item.$.objectname,
            username: item.$.username,
            postdate: item.$.postdate,
            thumbs: parseInt(item.$.thumbs || '0', 10),
            imageUrl: imageUrl,
            imageId: imageId || null,
            description: typeof item.body === 'string' ? item.body.trim() : ''
          };
        })
        .filter(game => game.id && game.name);
      
      console.log(`✅ Fetched ${games.length} games from geeklist`);
      console.log(`   ${games.filter(g => g.imageUrl).length} games have images from geeklist`)
      
      return { metadata, games };
      
    } catch (error) {
      if (error.message === 'BGG_RETRY' && attempt < retries) {
        console.log(`BGG API returned 202, retrying in 5 seconds... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Failed to fetch geeklist after multiple retries');
}

// Fetch game details from BGG API v2
async function fetchGameDetails(gameId, retries = 3) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&type=boardgame`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const headers = BGG_API_TOKEN ? { 'Authorization': `Bearer ${BGG_API_TOKEN}` } : {};
      const { data } = await fetchURL(url, headers);
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(data);
      
      const item = result.items?.item;
      if (item) {
        return {
          imageUrl: item.image || null,
          description: item.description || null
        };
      }
      return null;
    } catch (error) {
      if (error.message === 'BGG_RETRY' && attempt < retries) {
        console.log(`   BGG API returned 202, retrying... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      // If we get 401 or other error, just return null
      console.warn(`   Could not fetch details: ${error.message}`);
      return null;
    }
  }
  return null;
}

// Download image and upload to Bunny
async function cacheImageToBunny(game, imageIndex) {
  try {
    // If no imageUrl from geeklist, fetch from BGG API v2
    if (!game.imageUrl) {
      console.log(`📡 Fetching details for ${game.name}...`);
      const details = await fetchGameDetails(game.id);
      const imageUrl = details?.imageUrl;
      if (!imageUrl) {
        console.log(`⏭️  Skipping ${game.name} - no image available`);
        return null;
      }
      game.imageUrl = imageUrl;
      // Also store the description if we fetched it
      if (details?.description && !game.description) {
        game.description = details.description;
      }
    }
    
    const imageExt = game.imageUrl.match(/\.(jpg|jpeg|png|webp)$/i)?.[1] || 'jpg';
    const imagePath = `boardgames/images/${game.id}.${imageExt}`;
    
    console.log(`📥 Downloading ${game.name} from ${game.imageUrl}...`);
    const imageBuffer = await fetchBinary(game.imageUrl);
    console.log(`   Downloaded ${imageBuffer.length} bytes`);
    
    await uploadToBunny(imagePath, imageBuffer, 'image/jpeg');
    
    // Return Bunny CDN URL (update with your actual Pull Zone URL)
    return `https://dicebastion.b-cdn.net/${imagePath}`;
    
  } catch (error) {
    console.warn(`⚠️  Failed to cache image for ${game.name}: ${error.message}`);
    console.warn(`   URL was: ${game.imageUrl || 'unknown'}`);
    return game.imageUrl || null; // Return original URL as fallback
  }
}

// Main sync function
async function syncBoardGames() {
  console.log('🎲 Starting BoardGameGeek sync to Bunny.net...\n');
  
  if (!BUNNY_STORAGE_API_KEY) {
    throw new Error('BUNNY_STORAGE_API_KEY environment variable is required');
  }
  
  // Fetch existing data to avoid re-downloading images
  let existingGames = {};
  try {
    console.log('📥 Checking for existing data...');
    const { data } = await fetchURL('https://dicebastion.b-cdn.net/boardgames/data.json');
    const existingData = JSON.parse(data);
    // Create a map of existing games by ID for quick lookup
    existingData.games.forEach(game => {
      existingGames[game.id] = game;
    });
    console.log(`✅ Found ${Object.keys(existingGames).length} existing games\n`);
  } catch (error) {
    console.log('ℹ️  No existing data found, will create new library\n');
  }
  
  // Fetch geeklist
  const { metadata, games } = await fetchGeeklist();
  
  // Identify new games vs existing games
  const newGames = games.filter(game => !existingGames[game.id]);
  const existingGamesList = games.filter(game => existingGames[game.id]);
  
  console.log(`\n📊 Summary:`);
  console.log(`   - Total games in geeklist: ${games.length}`);
  console.log(`   - New games to process: ${newGames.length}`);
  console.log(`   - Existing games (reusing data): ${existingGamesList.length}`);
  
  // Reuse existing game data
  existingGamesList.forEach(game => {
    const existing = existingGames[game.id];
    game.imageUrl = existing.imageUrl;
    game.description = existing.description || game.description;
  });
  
  // Cache images only for NEW games
  if (newGames.length > 0) {
    console.log(`\n📸 Fetching details and caching images for ${newGames.length} new games...`);
    for (let i = 0; i < newGames.length; i++) {
      const game = newGames[i];
      const cachedUrl = await cacheImageToBunny(game, i);
      if (cachedUrl) {
        game.imageUrl = cachedUrl;
      }
      
      // Rate limiting - wait 1.5s between requests to be respectful
      if (i < newGames.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  } else {
    console.log('\n✅ No new games to process!');
  }
  
  // Sort games alphabetically
  games.sort((a, b) => a.name.localeCompare(b.name));
  
  // Prepare final data
  const data = {
    metadata: {
      ...metadata,
      source: `https://boardgamegeek.com/geeklist/${GEEKLIST_ID}`,
      lastUpdate: new Date().toISOString()
    },
    games
  };
  
  // Upload JSON to Bunny Storage
  console.log('\n📦 Uploading data.json to Bunny Storage...');
  await uploadToBunny('boardgames/data.json', JSON.stringify(data, null, 2));
  
  console.log(`\n✅ Sync complete!`);
  console.log(`   - ${games.length} games processed`);
  console.log(`   - Data available at: https://dicebastion.b-cdn.net/boardgames/data.json`);
  
  return data;
}

// Run sync
if (require.main === module) {
  syncBoardGames()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Sync failed:', error.message);
      process.exit(1);
    });
}

module.exports = { syncBoardGames };
