/**
 * Board Games API - Bunny Edge Script
 * 
 * A RESTful API for managing board game library data stored in Bunny Database.
 * 
 * Environment Variables (auto-configured from Bunny Dashboard):
 *   - DB_URL: Database connection URL
 *   - DB_TOKEN: Database access token (Full Access for write operations)
 *   - ADMIN_API_KEY: Bearer token for write operation authentication
 * 
 * API Endpoints:
 *   GET    /api/boardgames     - List all board games
 *   GET    /api/boardgames/:id - Get single board game by ID
 *   POST   /api/boardgames     - Create new board game (auth required)
 *   PUT    /api/boardgames/:id - Update board game (auth required)
 *   DELETE /api/boardgames/:id - Delete board game (auth required)
 */

import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { createClient } from "@libsql/client/web";

// Initialize libSQL client with Bunny Database credentials
// These are auto-configured when you add database secrets from the Bunny dashboard
const client = createClient({
  url: process.env.BUNNY_DATABASE_URL,
  authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN,
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

BunnySDK.net.http.serve(async (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // GET /api/boardgames - List all board games
    if (path === "/api/boardgames" && request.method === "GET") {
      return await listBoardGames();
    }

    // GET /api/boardgames/:id - Get single board game
    if (path.match(/^\/api\/boardgames\/\d+$/) && request.method === "GET") {
      const id = path.split("/").pop();
      return await getBoardGame(id!);
    }

    // POST /api/boardgames - Create new board game (requires auth)
    if (path === "/api/boardgames" && request.method === "POST") {
      if (!requireAuth(request)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      return await createBoardGame(request);
    }

    // PUT /api/boardgames/:id - Update board game (requires auth)
    if (path.match(/^\/api\/boardgames\/\d+$/) && request.method === "PUT") {
      if (!requireAuth(request)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      const id = path.split("/").pop();
      return await updateBoardGame(id!, request);
    }

    // DELETE /api/boardgames/:id - Delete board game (requires auth)
    if (path.match(/^\/api\/boardgames\/\d+$/) && request.method === "DELETE") {
      if (!requireAuth(request)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      const id = path.split("/").pop();
      return await deleteBoardGame(id!);
    }

    // POST /api/boardgames/sync - Sync from BGG geeklist (requires auth)
    if (path === "/api/boardgames/sync" && request.method === "POST") {
      if (!requireAuth(request)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }
      return await syncFromBGG();
    }

    // Default 404
    return jsonResponse({ error: "Not found" }, 404);
  } catch (error) {
    console.error("Error handling request:", error);
    return jsonResponse(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      },
      500
    );
  }
});

/**
 * Validate Authorization header against ADMIN_API_KEY
 * Expects: Authorization: Bearer <token>
 */
function requireAuth(request: Request): boolean {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) return false;
  
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  
  const token = authHeader.substring(7);
  return token === apiKey;
}

async function listBoardGames() {
  try {
    const result = await client.execute(
      "SELECT id, name, description, short_description, image_url, thumbs, post_date, synced_at, updated_at FROM board_games ORDER BY name ASC"
    );
    
    return jsonResponse({
      games: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error listing board games:", error);
    return jsonResponse({ error: "Failed to fetch board games" }, 500);
  }
}

async function getBoardGame(id: string) {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM board_games WHERE id = ?",
      args: [id],
    });
    
    if (result.rows.length === 0) {
      return jsonResponse({ error: "Board game not found" }, 404);
    }
    
    return jsonResponse({ game: result.rows[0] });
  } catch (error) {
    console.error(`Error fetching board game ${id}:`, error);
    return jsonResponse({ error: "Failed to fetch board game" }, 500);
  }
}

async function createBoardGame(request: Request) {
  try {
    const data = await request.json();
    const { id, name, description, short_description, image_url, thumbs, post_date } = data;
    
    if (!id || !name) {
      return jsonResponse({ error: "Missing required fields: id, name" }, 400);
    }
    
    await upsertGame({ id, name, description, short_description, image_url, thumbs, post_date });
    
    return jsonResponse({ success: true, message: "Board game created", id }, 201);
  } catch (error) {
    console.error("Error creating board game:", error);
    return jsonResponse({ error: "Failed to create board game" }, 500);
  }
}

async function updateBoardGame(id: string, request: Request) {
  try {
    const data = await request.json();
    
    // Get existing game to merge with updates
    const existing = await client.execute({
      sql: "SELECT * FROM board_games WHERE id = ?",
      args: [id],
    });
    
    if (existing.rows.length === 0) {
      return jsonResponse({ error: "Board game not found" }, 404);
    }
    
    const current = existing.rows[0];
    
    await upsertGame({
      id,
      name: data.name ?? String(current.name),
      description: data.description !== undefined ? data.description : (current.description as string | null),
      short_description: data.short_description !== undefined ? data.short_description : (current.short_description as string | null),
      image_url: data.image_url !== undefined ? data.image_url : (current.image_url as string | null),
      thumbs: data.thumbs ?? Number(current.thumbs),
      post_date: data.post_date ?? (current.post_date as string),
    });
    
    return jsonResponse({ success: true, message: "Board game updated", id });
  } catch (error) {
    console.error(`Error updating board game ${id}:`, error);
    return jsonResponse({ error: "Failed to update board game" }, 500);
  }
}

async function deleteBoardGame(id: string) {
  try {
    await client.execute({
      sql: "DELETE FROM board_games WHERE id = ?",
      args: [id],
    });
    
    return jsonResponse({ success: true, message: "Board game deleted", id });
  } catch (error) {
    console.error(`Error deleting board game ${id}:`, error);
    return jsonResponse({ error: "Failed to delete board game" }, 500);
  }
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/**
 * Upsert board game to database (insert if new, update if exists)
 */
async function upsertGame(data: {
  id: string;
  name: string;
  description?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  thumbs?: number;
  post_date?: string;
}) {
  const now = new Date().toISOString();
  
  await client.execute({
    sql: `INSERT INTO board_games (id, name, description, short_description, image_url, thumbs, post_date, synced_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            description = COALESCE(excluded.description, description),
            short_description = excluded.short_description,
            image_url = excluded.image_url,
            thumbs = excluded.thumbs,
            post_date = excluded.post_date,
            synced_at = excluded.synced_at,
            updated_at = excluded.updated_at`,
    args: [
      data.id,
      data.name,
      data.description || null,
      data.short_description || null,
      data.image_url || null,
      data.thumbs || 0,
      data.post_date || now,
      now,
      now,
    ],
  });
}

/**
 * Sync board games from BGG geeklist
 * Fetches geeklist, compares with database, updates metadata, and handles images
 */
async function syncFromBGG() {
  const GEEKLIST_ID = "352631";
  const BGG_URL = `https://boardgamegeek.com/xmlapi/geeklist/${GEEKLIST_ID}`;
  const BUNNY_STORAGE_URL = "https://storage.bunnycdn.com/dicebastion/boardgames/images";
  const BUNNY_CDN_URL = "https://dicebastion.b-cdn.net/boardgames/images";
  
  let processed = 0;
  let updated = 0;
  let created = 0;
  let imagesUploaded = 0;
  const errors: string[] = [];

  console.log("[BGG SYNC] Starting board games sync...");

  try {
    // Fetch existing games from database
    const existingResult = await client.execute("SELECT id, image_url FROM board_games");
    const existingGames = new Map();
    for (const game of existingResult.rows) {
      existingGames.set(String(game.id), game.image_url);
    }
    
    console.log(`[BGG SYNC] Found ${existingGames.size} existing games in database`);

    // Fetch BGG geeklist
    console.log(`[BGG SYNC] Fetching geeklist from BGG (ID: ${GEEKLIST_ID})...`);
    const response = await fetch(BGG_URL, {
      headers: {
        "User-Agent": "DiceBastion/1.0 (+https://dicebastion.com)",
        "Accept": "application/xml, text/xml",
      },
    });

    if (!response.ok) {
      throw new Error(`BGG returned ${response.status}`);
    }

    const xmlText = await response.text();
    const games = parseGeeklistXML(xmlText);

    if (games.length === 0) {
      throw new Error("No games found in geeklist");
    }
    
    console.log(`[BGG SYNC] Parsed ${games.length} games from geeklist`);

    // Process each game
    for (const game of games) {
      processed++;
      console.log(`[BGG SYNC] Processing ${processed}/${games.length}: ${game.name} (ID: ${game.id})`);
      
      try {
        const existingImageUrl = existingGames.get(game.id);
        const isNewGame = !existingGames.has(game.id);
        let finalImageUrl = game.imageUrl;

        // Only fetch BGG details and upload image if:
        // 1. New game (no existing entry), OR
        // 2. Image URL has changed from what's in database
        if (isNewGame || (game.imageUrl && game.imageUrl !== existingImageUrl)) {
          console.log(`[BGG SYNC]   ${isNewGame ? 'New game' : 'Image changed'} - fetching details from BGG...`);
          
          // Fetch full details from BGG API
          const details = await fetchBGGDetails(game.id);
          
          if (details) {
            game.description = details.description || game.description;
            
            // Download and upload image to Bunny CDN if we have a new image URL
            if (details.imageUrl) {
              console.log(`[BGG SYNC]   Uploading image to Bunny CDN...`);
              const uploadedUrl = await uploadImageToBunny(details.imageUrl, game.id);
              if (uploadedUrl) {
                finalImageUrl = uploadedUrl;
                imagesUploaded++;
                console.log(`[BGG SYNC]   ✅ Image uploaded: ${uploadedUrl}`);
              } else {
                console.log(`[BGG SYNC]   ⚠️  Image upload failed`);
              }
            }
          }

          // Rate limit BGG API calls
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
          // Keep existing image URL
          finalImageUrl = existingImageUrl;
          console.log(`[BGG SYNC]   No changes needed - using existing data`);
        }

        // Upsert game data
        await upsertGame({
          id: game.id,
          name: game.name,
          description: game.description,
          short_description: game.shortDescription,
          image_url: finalImageUrl,
          thumbs: game.thumbs,
          post_date: game.postDate,
        });

        if (isNewGame) {
          created++;
          console.log(`[BGG SYNC]   ✅ Created new game entry`);
        } else {
          updated++;
          console.log(`[BGG SYNC]   ✅ Updated existing game`);
        }
        
      } catch (err) {
        const errorMsg = `Failed to process ${game.name}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(`[BGG SYNC]   ❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log("[BGG SYNC] ============================================");
    console.log(`[BGG SYNC] Sync completed successfully`);
    console.log(`[BGG SYNC]   Total processed: ${processed}`);
    console.log(`[BGG SYNC]   New games created: ${created}`);
    console.log(`[BGG SYNC]   Existing games updated: ${updated}`);
    console.log(`[BGG SYNC]   Images uploaded to CDN: ${imagesUploaded}`);
    console.log(`[BGG SYNC]   Errors: ${errors.length}`);
    console.log("[BGG SYNC] ============================================");

    return jsonResponse({
      success: true,
      message: "Sync completed",
      stats: {
        processed,
        created,
        updated,
        imagesUploaded,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
    
  } catch (error) {
    console.error("[BGG SYNC] ❌ Sync failed:", error);
    return jsonResponse({
      success: false,
      error: "Sync failed",
      message: error instanceof Error ? error.message : String(error),
    }, 500);
  }
}

/**
 * Parse BGG geeklist XML into game objects
 */
function parseGeeklistXML(xmlText: string) {
  const games: any[] = [];
  const itemMatches = xmlText.matchAll(/<item[^>]*>[\s\S]*?<\/item>/g);
  
  for (const itemMatch of itemMatches) {
    const itemXML = itemMatch[0];
    
    const objectIdMatch = itemXML.match(/<item[^>]*objectid="(\d+)"/);
    const objectnameMatch = itemXML.match(/<item[^>]*objectname="([^"]*)"/);
    const postdateMatch = itemXML.match(/<item[^>]*postdate="([^"]*)"/);
    const thumbsMatch = itemXML.match(/<item[^>]*thumbs="(\d+)"/);
    const bodyMatch = itemXML.match(/<body>([\s\S]*?)<\/body>/);
    
    const id = objectIdMatch ? objectIdMatch[1] : null;
    const name = objectnameMatch ? objectnameMatch[1] : null;
    const postDate = postdateMatch ? postdateMatch[1] : null;
    const thumbs = thumbsMatch ? parseInt(thumbsMatch[1]) : 0;
    const body = bodyMatch ? bodyMatch[1].trim() : null;
    
    // Extract short description from curly braces
    let shortDescription = null;
    if (body) {
      const braceMatch = body.match(/\{([^}]+)\}/);
      if (braceMatch) {
        shortDescription = braceMatch[1].trim();
      }
    }
    
    if (id && name) {
      games.push({
        id,
        name,
        postDate,
        thumbs,
        shortDescription,
        description: null,
        imageUrl: null,
      });
    }
  }
  
  return games;
}

/**
 * Fetch game details from BGG API
 */
async function fetchBGGDetails(gameId: string) {
  const BGG_API_URL = `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}`;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(BGG_API_URL, {
        headers: { "User-Agent": "DiceBastion/1.0 (+https://dicebastion.com)" },
      });
      
      if (response.status === 202) {
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`BGG API returned ${response.status}`);
      }
      
      const xmlText = await response.text();
      const descMatch = xmlText.match(/<description>([\s\S]*?)<\/description>/);
      const imageMatch = xmlText.match(/<image>([\s\S]*?)<\/image>/);
      
      return {
        description: descMatch ? descMatch[1].trim() : null,
        imageUrl: imageMatch ? imageMatch[1].trim() : null,
      };
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
  
  return null;
}

/**
 * Download image from BGG and upload to Bunny Storage
 */
async function uploadImageToBunny(imageUrl: string, gameId: string) {
  try {
    // Download image from BGG
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    
    // Determine file extension
    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("gif")) ext = "gif";
    else if (contentType.includes("webp")) ext = "webp";
    
    // Upload to Bunny Storage
    const storageUrl = `https://storage.bunnycdn.com/dicebastion/boardgames/images/${gameId}.${ext}`;
    const storageKey = process.env.BUNNY_STORAGE_API_KEY;
    
    if (!storageKey) {
      throw new Error("BUNNY_STORAGE_API_KEY not configured");
    }
    
    const uploadResponse = await fetch(storageUrl, {
      method: "PUT",
      headers: {
        "AccessKey": storageKey,
        "Content-Type": contentType,
      },
      body: imageBuffer,
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
    
    // Return Bunny CDN URL
    return `https://dicebastion.b-cdn.net/boardgames/images/${gameId}.${ext}`;
  } catch (err) {
    console.error(`Failed to upload image for game ${gameId}:`, err);
    return null;
  }
}
