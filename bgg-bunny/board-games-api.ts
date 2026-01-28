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
      "SELECT id, name, description, short_description, image_url, thumbs, post_date, synced_at, updated_at FROM board_games ORDER BY post_date DESC"
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
    
    const now = new Date().toISOString();
    
    await client.execute({
      sql: "INSERT INTO board_games (id, name, description, short_description, image_url, thumbs, post_date, synced_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id, name, description || null, short_description || null, image_url || null, thumbs || 0, post_date || now, now, now],
    });
    
    return jsonResponse({ success: true, message: "Board game created", id }, 201);
  } catch (error) {
    console.error("Error creating board game:", error);
    return jsonResponse({ error: "Failed to create board game" }, 500);
  }
}

async function updateBoardGame(id: string, request: Request) {
  try {
    const data = await request.json();
    const { name, description, short_description, image_url, thumbs, post_date } = data;
    
    const updates: string[] = [];
    const args: any[] = [];
    
    if (name !== undefined) { updates.push("name = ?"); args.push(name); }
    if (description !== undefined) { updates.push("description = ?"); args.push(description); }
    if (short_description !== undefined) { updates.push("short_description = ?"); args.push(short_description); }
    if (image_url !== undefined) { updates.push("image_url = ?"); args.push(image_url); }
    if (thumbs !== undefined) { updates.push("thumbs = ?"); args.push(thumbs); }
    if (post_date !== undefined) { updates.push("post_date = ?"); args.push(post_date); }
    
    if (updates.length === 0) {
      return jsonResponse({ error: "No fields to update" }, 400);
    }
    
    updates.push("updated_at = ?");
    args.push(new Date().toISOString());
    args.push(id);
    
    await client.execute({
      sql: `UPDATE board_games SET ${updates.join(", ")} WHERE id = ?`,
      args,
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
