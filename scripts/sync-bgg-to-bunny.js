/**
 * BGG to Bunny.net Sync Script
 * Fetches board games from BoardGameGeek geeklist and uploads to Bunny Storage
 * Run with: node scripts/sync-bgg-to-bunny.js
 */

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
      
      const metadata = {
        title: geeklist.title || 'Board Game Library',
        description: geeklist.description || '',
        numitems: parseInt(geeklist.$.numitems || '0', 10),
        thumbs: parseInt(geeklist.$.thumbs || '0', 10)
      };
      
      const games = items
        .filter(item => item.$.objecttype === 'thing' && item.$.subtype === 'boardgame')
        .map(item => {
          // BGG geeklist doesn't include image URLs in XML API v1
          // We'll fetch them separately using the thing ID
          return {
            id: item.$.objectid,
            name: item.$.objectname,
            username: item.$.username,
            postdate: item.$.postdate,
            thumbs: parseInt(item.$.thumbs || '0', 10),
            imageUrl: null, // Will be fetched separately
            description: typeof item.body === 'string' ? item.body.trim() : ''
          };
        })
        .filter(game => game.id && game.name);
      
      console.log(`✅ Fetched ${games.length} games from geeklist`);
      
      // Fetch images from BGG API v2 for each game
      console.log('📸 Fetching game images from BGG API v2...');
      for (const game of games) {
        try {
          const thingUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${game.id}`;
          await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit
          const { data } = await fetchURL(thingUrl);
          const parser = new xml2js.Parser({ explicitArray: false });
          const thingResult = await parser.parseStringPromise(data);
          const thing = thingResult.items?.item;
          if (thing && thing.image) {
            game.imageUrl = thing.image;
          }
        } catch (err) {
          console.warn(`⚠️  Could not fetch image for ${game.name}`);
        }
      }
      
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

// Download image and upload to Bunny
async function cacheImageToBunny(game, imageIndex) {
  if (!game.imageUrl) return null;
  
  try {
    const imageExt = game.imageUrl.match(/\.(jpg|jpeg|png|webp)$/i)?.[1] || 'jpg';
    const imagePath = `boardgames/images/${game.id}.${imageExt}`;
    
    console.log(`Downloading image for ${game.name}...`);
    const imageBuffer = await fetchBinary(game.imageUrl);
    
    await uploadToBunny(imagePath, imageBuffer, 'image/jpeg');
    
    // Return Bunny CDN URL (update with your actual Pull Zone URL)
    return `https://dicebastion.b-cdn.net/${imagePath}`;
    
  } catch (error) {
    console.warn(`⚠️  Failed to cache image for ${game.name}: ${error.message}`);
    return game.imageUrl; // Return original URL as fallback
  }
}

// Main sync function
async function syncBoardGames() {
  console.log('🎲 Starting BoardGameGeek sync to Bunny.net...\n');
  
  if (!BUNNY_STORAGE_API_KEY) {
    throw new Error('BUNNY_STORAGE_API_KEY environment variable is required');
  }
  
  // Fetch geeklist
  const { metadata, games } = await fetchGeeklist();
  
  // Cache images to Bunny Storage
  console.log(`\n📸 Caching ${games.length} images to Bunny Storage...`);
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const cachedUrl = await cacheImageToBunny(game, i);
    if (cachedUrl) {
      game.imageUrl = cachedUrl;
    }
    
    // Rate limiting - wait 500ms between requests
    if (i < games.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
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
