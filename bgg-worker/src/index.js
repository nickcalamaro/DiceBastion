/**
 * BGG Board Game Library Sync Worker
 * Fetches BGG data, downloads images to R2, and serves cached data
 */

const GEEKLIST_ID = '352631';
const DATA_KEY = 'boardgames/data.json';
const R2_PUBLIC_URL = 'https://pub-631ca6f207ca4661ac9cb2ba9371ba31.r2.dev';
const BGG_API_URL = `https://boardgamegeek.com/xmlapi/geeklist/${GEEKLIST_ID}`;


export default {
  async scheduled(event, env, ctx) {
    console.log('Scheduled sync triggered');
    try {
      await syncBoardGames(env);
    } catch (error) {
      console.error('Scheduled sync failed:', error);
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // GET /boardgames - Return cached data from R2
    if (url.pathname === '/boardgames' && request.method === 'GET') {
      try {
        const cached = await env.R2_BUCKET.get(DATA_KEY);
        
        if (!cached) {
          return new Response(JSON.stringify({ 
            error: 'No data available yet. Run POST /sync to trigger initial sync.' 
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const data = await cached.json();
        
        return new Response(JSON.stringify(data), {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
          }
        });
      } catch (error) {
        console.error('Error fetching board games:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /sync - Manual sync trigger
    if (url.pathname === '/sync' && request.method === 'POST') {
      try {
        const result = await syncBoardGames(env);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Manual sync failed:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('BGG Sync Worker - Endpoints: GET /boardgames, POST /sync', {
      headers: corsHeaders
    });
  }
};

async function syncBoardGames(env) {
  console.log('Starting board game library sync...');
  
  // Fetch geeklist using BGG API token
  const { metadata, games } = await fetchGeeklist(env);
  console.log(`Found ${games.length} games in geeklist`);
  
  // Download and cache images in R2
  let successCount = 0;
  for (const game of games) {
    if (game.imageUrl) {
      try {
        const imageKey = `boardgames/images/${game.id}.jpg`;
        
        // Check if image already exists in R2
        const existing = await env.R2_BUCKET.head(imageKey);
        
        if (!existing) {
          // Download image from BGG
          const imageResponse = await fetch(game.imageUrl);
          if (imageResponse.ok) {
            await env.R2_BUCKET.put(imageKey, imageResponse.body, {
              httpMetadata: {
                contentType: imageResponse.headers.get('content-type') || 'image/jpeg'
              }
            });
            successCount++;
          }
        }
        
        // Update game object to use R2 URL
        game.imageUrl = `${R2_PUBLIC_URL}/${imageKey}`;
      } catch (error) {
        console.warn(`Failed to cache image for ${game.name}:`, error.message);
      }
    }
  }
  
  console.log(`Cached ${successCount} new images in R2`);
  
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
  
  // Store data in R2
  await env.R2_BUCKET.put(DATA_KEY, JSON.stringify(data), {
    httpMetadata: {
      contentType: 'application/json'
    }
  });
  
  console.log(`Stored board game data in R2`);
  
  return {
    success: true,
    gamesCount: games.length,
    imagesCached: successCount,
    lastUpdate: data.metadata.lastUpdate
  };
}

async function fetchGeeklist(env, retries = 5) {
  console.log(`Fetching from: ${BGG_API_URL}`);
  
  if (!env.BGG_API_TOKEN) {
    throw new Error('BGG_API_TOKEN not configured. Please set it as a worker secret.');
  }
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`\n--- Attempt ${i + 1}/${retries} ---`);
      
      const response = await fetch(BGG_API_URL, {
        headers: {
          'Authorization': `Bearer ${env.BGG_API_TOKEN}`,
          'User-Agent': 'DiceBastionBot/1.0 (+https://dicebastion.com)',
          'Accept': 'application/xml, text/xml'
        }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const xmlText = await response.text();
        console.log(`✓ Success! Got ${xmlText.length} bytes`);
        return parseGeeklistXML(xmlText);
      } 
      
      if (response.status === 202) {
        console.log('BGG is preparing data (202), waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      
      // Any other status
      const responseText = await response.text();
      console.error(`✗ Failed with status ${response.status}`);
      if (responseText) {
        console.error(`Response:`, responseText.substring(0, 500));
      }
      
      if (i < retries - 1) {
        console.log('Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      throw new Error(`BGG API returned ${response.status}: ${responseText.substring(0, 200)}`);
      
    } catch (error) {
      console.error(`Attempt ${i + 1} error:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('Failed to fetch geeklist after all retries');
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

async function loginToBGG(env) {
  if (!env.BGG_USERNAME || !env.BGG_PASSWORD) {
    console.log('No BGG credentials provided');
    return null;
  }
  
  console.log(`Attempting BGG login for user: ${env.BGG_USERNAME}`);
  
  try {
    const response = await fetch('https://boardgamegeek.com/login/api/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; DiceBastion/1.0)'
      },
      body: `credentials[username]=${encodeURIComponent(env.BGG_USERNAME)}&credentials[password]=${encodeURIComponent(env.BGG_PASSWORD)}`
    });
    
    console.log(`BGG login response status: ${response.status}`);
    
    if (response.status === 200 || response.status === 204) {
      const cookies = response.headers.get('set-cookie');
      console.log('Successfully logged in to BGG, got cookies:', !!cookies);
      return cookies;
    }
    
    console.warn('BGG login failed - status:', response.status);
    const responseText = await response.text();
    console.warn('BGG login response:', responseText.substring(0, 200));
    return null;
  } catch (error) {
    console.warn('BGG login error:', error.message);
    return null;
  }
}
