/**
 * Bunny.net Edge Script for BGG Board Game Library
 * Serves cached board game data from Bunny Storage
 * 
 * NOTE: Bunny Edge Scripting uses a subset of standard Web APIs
 * This script provides a custom /boardgames endpoint
 */

// Get environment variables (set in Edge Script settings)
const STORAGE_ZONE_NAME = 'dicebastion'; // Update with your storage zone name
const STORAGE_API_KEY = BunnyEdge.getEnvironmentVariable('STORAGE_API_KEY');
const DATA_PATH = 'boardgames/data.json';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // CORS headers
  const corsHeaders = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  // GET /boardgames - Return cached data from Bunny Storage
  if (url.pathname === '/boardgames' && request.method === 'GET') {
    try {
      // Fetch from Bunny Storage API
      const storageUrl = `https://storage.bunnycdn.com/${STORAGE_ZONE_NAME}/${DATA_PATH}`;
      
      const storageResponse = await fetch(storageUrl, {
        headers: {
          'AccessKey': STORAGE_API_KEY
        }
      });

      if (!storageResponse.ok) {
        const errorResponse = new Response(JSON.stringify({ 
          error: 'No data available yet. Run the sync script to populate data.',
          status: storageResponse.status
        }), {
          status: 404,
          headers: corsHeaders
        });
        errorResponse.headers.set('Content-Type', 'application/json');
        return errorResponse;
      }

      const data = await storageResponse.text();

      const response = new Response(data, {
        status: 200,
        headers: corsHeaders
      });
      response.headers.set('Content-Type', 'application/json');
      response.headers.set('Cache-Control', 'public, max-age=3600');
      
      return response;
      
    } catch (error) {
      const errorResponse = new Response(JSON.stringify({ 
        error: error.message || 'Internal server error'
      }), {
        status: 500,
        headers: corsHeaders
      });
      errorResponse.headers.set('Content-Type', 'application/json');
      return errorResponse;
    }
  }

  // Default response
  const response = new Response('BGG Sync - Endpoint: GET /boardgames', {
    status: 200,
    headers: corsHeaders
  });
  response.headers.set('Content-Type', 'text/plain');
  return response;
}
