const fs = require('fs');
const path = require('path');
const https = require('https');
const { parseStringPromise } = require('xml2js');

const GEEKLIST_ID = '352631';
const BGG_USERNAME = process.env.BGG_USERNAME;
const BGG_PASSWORD = process.env.BGG_PASSWORD;
const OUTPUT_FILE = path.join(__dirname, '../data/boardgames.json');

// Ensure data directory exists
const dataDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function fetchFromBGG(url, cookies = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (compatible; DiceBastion/1.0; +https://dicebastion.com)',
      'Accept': 'application/xml, text/xml, */*'
    };
    
    if (cookies) {
      headers['Cookie'] = cookies;
    }
    
    const options = {
      headers
    };
    
    https.get(url, options, (res) => {
      let data = '';
      
      // Store cookies from response
      const setCookies = res.headers['set-cookie'];
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ data, cookies: setCookies });
        } else if (res.statusCode === 202) {
          // BGG API returns 202 when data is being prepared, need to retry
          reject(new Error('BGG_RETRY'));
        } else {
          reject(new Error(`BGG API returned ${res.statusCode}: ${data.substring(0, 500)}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function postToBGG(url, postData, cookies = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (compatible; DiceBastion/1.0; +https://dicebastion.com)',
        'Accept': '*/*'
      }
    };
    
    if (cookies) {
      options.headers['Cookie'] = cookies;
    }
    
    const req = https.request(options, (res) => {
      let data = '';
      const setCookies = res.headers['set-cookie'];
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({ data, cookies: setCookies, statusCode: res.statusCode });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

async function loginToBGG() {
  if (!BGG_USERNAME || !BGG_PASSWORD) {
    console.log('No BGG credentials provided, attempting anonymous access...');
    return null;
  }
  
  console.log(`Logging in to BGG as ${BGG_USERNAME}...`);
  
  const loginUrl = 'https://boardgamegeek.com/login/api/v1';
  const postData = `credentials[username]=${encodeURIComponent(BGG_USERNAME)}&credentials[password]=${encodeURIComponent(BGG_PASSWORD)}`;
  
  try {
    const response = await postToBGG(loginUrl, postData);
    
    if (response.statusCode === 200 || response.statusCode === 204) {
      console.log('Successfully logged in to BGG');
      return response.cookies ? response.cookies.join('; ') : null;
    } else {
      console.warn('BGG login returned status:', response.statusCode);
      return null;
    }
  } catch (error) {
    console.warn('BGG login failed:', error.message);
    return null;
  }
}

async function fetchGeeklist(cookies = null, retries = 3) {
  const url = `https://boardgamegeek.com/xmlapi/geeklist/${GEEKLIST_ID}`;
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Fetching geeklist ${GEEKLIST_ID} from BoardGameGeek (attempt ${i + 1}/${retries})...`);
      const response = await fetchFromBGG(url, cookies);
      const parsed = await parseStringPromise(response.data);
      
      if (!parsed.geeklist || !parsed.geeklist.item) {
        throw new Error('Invalid geeklist response');
      }
      
      return parsed.geeklist;
    } catch (error) {
      if (error.message === 'BGG_RETRY' && i < retries - 1) {
        console.log('BGG is preparing data, waiting 2 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Failed to fetch geeklist after retries');
}

function extractGameData(item) {
  // BGG geeklist items have this structure
  return {
    id: item.$.objectid,
    name: item.$.objectname,
    username: item.$.username || 'Unknown',
    postdate: item.$.postdate,
    editdate: item.$.editdate,
    thumbs: parseInt(item.$.thumbs || '0'),
    imageUrl: item.$.imageurl || '',
    body: item.body ? item.body[0] : '',
    // Additional metadata if available
    type: item.$.objecttype || 'thing',
    subtype: item.$.subtype || 'boardgame'
  };
}

async function syncBoardGames() {
  console.log('Starting board game library sync...');
  
  // Login to BGG if credentials provided
  const cookies = await loginToBGG();
  
  const geeklist = await fetchGeeklist(cookies);
  
  // Extract metadata
  const metadata = {
    id: geeklist.$.id,
    title: geeklist.title ? geeklist.title[0] : 'Board Game Library',
    description: geeklist.description ? geeklist.description[0] : '',
    numitems: parseInt(geeklist.$.numitems || '0'),
    thumbs: parseInt(geeklist.$.thumbs || '0'),
    username: geeklist.$.username,
    postdate: geeklist.$.postdate,
    editdate: geeklist.$.editdate,
    lastUpdate: new Date().toISOString(),
    source: `https://boardgamegeek.com/geeklist/${GEEKLIST_ID}`
  };
  
  // Extract games
  const games = geeklist.item.map(extractGameData);
  
  console.log(`Found ${games.length} games in the library`);
  
  // Create output object
  const output = {
    metadata,
    games: games.sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
  };
  
  // Write to JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Board game library data written to ${OUTPUT_FILE}`);
  console.log(`Total games: ${games.length}`);
}

syncBoardGames().catch(error => {
  console.error('Sync failed:', error);
  process.exit(1);
});
