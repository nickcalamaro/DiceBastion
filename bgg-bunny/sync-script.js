/**
 * BGG Board Game Library Sync Script for Bunny.net
 * Run this via Node.js or as a GitHub Action to sync data to Bunny Storage
 */

const https = require('https');
const http = require('http');

// Configuration - set these as environment variables
const GEEKLIST_ID = '352631';
const BGG_API_TOKEN = process.env.BGG_API_TOKEN; // Bearer token from BGG
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'dicebastion';
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || 'https://dicebastion.b-cdn.net';

const BGG_API_URL = `https://boardgamegeek.com/xmlapi/geeklist/${GEEKLIST_ID}`;
const STORAGE_API_BASE = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;

async function fetchBGGGeeklist() {
  console.log('Fetching BGG geeklist...');
  
  if (!BGG_API_TOKEN) {
    throw new Error('BGG_API_TOKEN not set. Please configure your BGG API token.');
  }

  return new Promise((resolve, reject) => {
    https.get(BGG_API_URL, {
      headers: {
        'Authorization': `Bearer ${BGG_API_TOKEN}`,
        'User-Agent': 'DiceBastionBot/1.0 (+https://dicebastion.com)',
        'Accept': 'application/xml, text/xml'
      }
    }, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✓ Got BGG data: ${data.length} bytes`);
          resolve(data);
        } else if (res.statusCode === 202) {
          console.log('BGG is preparing data (202). Please try again in a few seconds.');
          reject(new Error('BGG data not ready yet (202)'));
        } else {
          console.error(`BGG API error: ${res.statusCode}`);
          console.error(data.substring(0, 500));
          reject(new Error(`BGG API returned ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

function parseGeeklistXML(xmlText) {
  const games = [];
  
  // Extract geeklist metadata
  const geeklistMatch = xmlText.match(/<geeklist[^>]*>/);
  let metadata = {
    id: GEEKLIST_ID,
    title: 'Board Game Library',
    description: '',
    numitems: 0
  };
  
  if (geeklistMatch) {
    const attrs = geeklistMatch[0];
    metadata.numitems = parseInt(attrs.match(/numitems="(\d+)"/)?.[1] || '0');
    metadata.username = attrs.match(/username="([^"]+)"/)?.[1] || '';
  }
  
  // Extract title and description
  const titleMatch = xmlText.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
  if (titleMatch) metadata.title = titleMatch[1];
  
  const descMatch = xmlText.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
  if (descMatch) metadata.description = descMatch[1].replace(/<[^>]*>/g, '');
  
  // Extract items
  const itemRegex = /<item[^>]*>(.*?)<\/item>/gs;
  let itemMatch;
  
  while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
    const itemContent = itemMatch[0];
    const itemAttrs = itemMatch[0].match(/<item[^>]*>/)[0];
    
    const game = {
      id: itemAttrs.match(/objectid="(\d+)"/)?.[1] || '',
      name: itemAttrs.match(/objectname="([^"]+)"/)?.[1] || 'Unknown',
      username: itemAttrs.match(/username="([^"]+)"/)?.[1] || '',
      postdate: itemAttrs.match(/postdate="([^"]+)"/)?.[1] || '',
      thumbs: parseInt(itemAttrs.match(/thumbs="(\d+)"/)?.[1] || '0'),
      imageUrl: itemAttrs.match(/imageurl="([^"]+)"/)?.[1] || ''
    };
    
    // Extract body/description
    const bodyMatch = itemContent.match(/<body><!\[CDATA\[(.*?)\]\]><\/body>/s);
    if (bodyMatch) {
      game.body = bodyMatch[1].replace(/<[^>]*>/g, '').trim();
    }
    
    games.push(game);
  }
  
  return { metadata, games };
}

async function uploadToBunnyStorage(path, data, contentType = 'application/octet-stream') {
  const url = new URL(`${STORAGE_API_BASE}/${path}`);
  
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_STORAGE_API_KEY,
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let response = '';
      res.on('data', chunk => response += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(response);
        } else {
          reject(new Error(`Upload failed: ${res.statusCode} - ${response}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const protocol = imageUrl.startsWith('https') ? https : http;
    
    protocol.get(imageUrl, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Image download failed: ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function checkFileExists(path) {
  const url = new URL(`${STORAGE_API_BASE}/${path}`);
  
  return new Promise((resolve) => {
    https.request(url, {
      method: 'HEAD',
      headers: { 'AccessKey': BUNNY_STORAGE_API_KEY }
    }, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false)).end();
  });
}

async function syncBoardGames() {
  console.log('Starting BGG board game library sync...\n');

  if (!BUNNY_STORAGE_API_KEY) {
    throw new Error('BUNNY_STORAGE_API_KEY not set');
  }

  // Fetch from BGG
  const xmlData = await fetchBGGGeeklist();
  const { metadata, games } = parseGeeklistXML(xmlData);
  
  console.log(`\nFound ${games.length} games in geeklist`);
  console.log(`Title: ${metadata.title}\n`);

  // Download and cache images
  let successCount = 0;
  let skippedCount = 0;

  for (const game of games) {
    if (game.imageUrl) {
      try {
        const imageKey = `boardgames/images/${game.id}.jpg`;
        
        // Check if image already exists
        const exists = await checkFileExists(imageKey);
        
        if (!exists) {
          console.log(`Downloading image for: ${game.name}`);
          const imageData = await downloadImage(game.imageUrl);
          await uploadToBunnyStorage(imageKey, imageData, 'image/jpeg');
          successCount++;
        } else {
          skippedCount++;
        }
        
        // Update game object to use Bunny CDN URL
        game.imageUrl = `${BUNNY_CDN_URL}/${imageKey}`;
      } catch (error) {
        console.warn(`Failed to cache image for ${game.name}:`, error.message);
      }
    }
  }

  console.log(`\n✓ Cached ${successCount} new images`);
  console.log(`⊘ Skipped ${skippedCount} existing images`);

  // Sort games alphabetically
  games.sort((a, b) => a.name.localeCompare(b.name));

  // Prepare data
  const data = {
    metadata: {
      ...metadata,
      source: `https://boardgamegeek.com/geeklist/${GEEKLIST_ID}`,
      lastUpdate: new Date().toISOString()
    },
    games
  };

  // Upload data to Bunny Storage
  console.log('\nUploading data.json to Bunny Storage...');
  await uploadToBunnyStorage('boardgames/data.json', JSON.stringify(data, null, 2), 'application/json');
  
  console.log(`\n✅ Sync complete!`);
  console.log(`Games: ${games.length}`);
  console.log(`Last update: ${data.metadata.lastUpdate}`);
  console.log(`Data available at: ${BUNNY_CDN_URL}/boardgames/data.json`);
}

// Run sync
syncBoardGames().catch(error => {
  console.error('\n❌ Sync failed:', error.message);
  process.exit(1);
});
