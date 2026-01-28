/**
 * Bunny Edge Script - Board Games API
 * Serves board game library data from Bunny Database
 * 
 * Endpoints:
 * - GET /api/boardgames - List all board games
 * - GET /api/boardgames/:id - Get single board game by ID
 * - POST /api/boardgames - Create new board game (requires auth)
 * - PUT /api/boardgames/:id - Update board game (requires auth)
 * - DELETE /api/boardgames/:id - Delete board game (requires auth)
 * 
 * Environment Secrets Required:
 * - DATABASE_URL: libsql://01KG03QGHB70WY748QJ1WJXKN9-dicebastion.lite.bunnydb.net/
 * - DATABASE_TOKEN: Your Bunny Database access token (Full Access)
 * - ADMIN_API_KEY: Secret key for authenticating write operations
 */

import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { createClient } from "@libsql/client/web";

// Get environment secrets
const DB_URL = BunnySDK.getEnvironmentVariable("DATABASE_URL") || "";
const DB_TOKEN = BunnySDK.getEnvironmentVariable("DATABASE_TOKEN") || "";
const ADMIN_API_KEY = BunnySDK.getEnvironmentVariable("ADMIN_API_KEY") || "";

// Initialize database client
const db = createClient({
  url: DB_URL,
  authToken: DB_TOKEN,
});

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

BunnySDK.net.http.serve(async (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
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

function requireAuth(request: Request): boolean {
  if (!ADMIN_API_KEY) return false;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
  return token === ADMIN_API_KEY;
}

async function listBoardGames() {
  try {
    const result = await db.execute(`
      SELECT id, name, description, short_description, image_url, thumbs, post_date, synced_at, updated_at
      FROM board_games ORDER BY post_date DESC
    `);
    return jsonResponse({ games: result.rows, count: result.rows.length });
  } catch (error) {
    console.error("Error listing board games:", error);
    return jsonResponse({ error: "Failed to fetch board games" }, 500);
  }
}

async function getBoardGame(id: string) {
  try {
    const result = await db.execute({
      sql: "SELECT * FROM board_games WHERE id = ?",
      args: [id],
    });
    if (result.rows.length === 0) return jsonResponse({ error: "Game not found" }, 404);
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
    if (!id || !name) return jsonResponse({ error: "Missing required fields: id, name" }, 400);
    const now = new Date().toISOString();
    await db.execute({
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
    if (updates.length === 0) return jsonResponse({ error: "No fields to update" }, 400);
    updates.push("updated_at = ?");
    args.push(new Date().toISOString());
    args.push(id);
    await db.execute({ sql: `UPDATE board_games SET ${updates.join(", ")} WHERE id = ?`, args });
    return jsonResponse({ success: true, message: "Board game updated", id });
  } catch (error) {
    console.error(`Error updating board game ${id}:`, error);
    return jsonResponse({ error: "Failed to update board game" }, 500);
  }
}

async function deleteBoardGame(id: string) {
  try {
    await db.execute({ sql: "DELETE FROM board_games WHERE id = ?", args: [id] });
    return jsonResponse({ success: true, message: "Board game deleted", id });
  } catch (error) {
    console.error(`Error deleting board game ${id}:`, error);
    return jsonResponse({ error: "Failed to delete board game" }, 500);
  }
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
  });
}
