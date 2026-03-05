/// <reference types="@bunny.net/edgescript-sdk" />

/**
 * DiceBastion Events API & Dynamic Pages - Bunny Edge Script
 * 
 * Handles:
 * 1. RESTful API for events management
 * 2. Dynamic event pages at /events/[slug] with SEO meta tags
 * 3. Auto-opens event modal on direct link access
 * 
 * Environment Variables (configured in Bunny Dashboard):
 *   - BUNNY_DATABASE_URL: Database connection URL
 *   - BUNNY_DATABASE_AUTH_TOKEN: Database access token
 *   - ADMIN_API_KEY: Bearer token for admin operations
 *   - SITE_URL: Your main site URL (e.g., https://dicebastion.co.uk)
 */

import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { createClient } from "@libsql/client/web";

// Initialize libSQL client
const client = createClient({
  url: process.env.BUNNY_DATABASE_URL,
  authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN,
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SITE_URL = process.env.SITE_URL || "https://dicebastion.co.uk";

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Generate slug from event name
 */
function generateSlug(eventName: string, eventId?: number): string {
  let slug = eventName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .substring(0, 50);        // Limit length
  
  // Add event ID to ensure uniqueness
  if (eventId) {
    slug = `${slug}-${eventId}`;
  }
  
  return slug;
}

/**
 * Validate Authorization header
 */
function requireAuth(request: Request): boolean {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) return false;
  
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  
  const token = authHeader.substring(7);
  return token === apiKey;
}

/**
 * Format event data for API response
 */
function formatEventData(row: any) {
  return {
    id: row.event_id,
    event_id: row.event_id,
    title: row.event_name,
    event_name: row.event_name,
    slug: row.slug,
    description: row.description || '',
    full_description: row.full_description || '',
    event_datetime: row.event_datetime,
    location: row.location || '',
    membership_price: Number(row.membership_price) || 0,
    non_membership_price: Number(row.non_membership_price) || 0,
    capacity: Number(row.capacity) || 0,
    tickets_sold: Number(row.tickets_sold) || 0,
    category: row.category || '',
    image_url: row.image_url || '',
    requires_purchase: Number(row.requires_purchase) || 0,
    is_active: Number(row.is_active) || 0,
    is_recurring: Number(row.is_recurring) || 0,
    recurrence_pattern: row.recurrence_pattern || null,
    recurrence_end_date: row.recurrence_end_date || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    share_url: `${SITE_URL}/events/${row.slug}`
  };
}

/**
 * Generate SEO-friendly HTML page for event
 */
function generateEventPage(event: any): string {
  const memberPrice = event.requires_purchase 
    ? `£${(event.membership_price / 100).toFixed(2)}`
    : 'Free';
  const nonMemberPrice = event.requires_purchase
    ? `£${(event.non_membership_price / 100).toFixed(2)}`
    : 'Free';
  
  const eventDate = new Date(event.event_datetime);
  const formattedDate = eventDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const imageUrl = event.image_url || `${SITE_URL}/img/default-event.jpg`;
  const description = event.description || event.full_description?.substring(0, 160) || `Join us for ${event.event_name}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${event.event_name} | Dice Bastion</title>
  <meta name="title" content="${event.event_name} | Dice Bastion">
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="event">
  <meta property="og:url" content="${SITE_URL}/events/${event.slug}">
  <meta property="og:title" content="${event.event_name}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:site_name" content="Dice Bastion">
  <meta property="event:start_time" content="${event.event_datetime}">
  <meta property="event:location" content="${event.location || 'Dice Bastion'}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${SITE_URL}/events/${event.slug}">
  <meta property="twitter:title" content="${event.event_name}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${imageUrl}">
  
  <!-- Schema.org structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "${event.event_name}",
    "description": "${description}",
    "startDate": "${event.event_datetime}",
    "location": {
      "@type": "Place",
      "name": "${event.location || 'Dice Bastion'}"
    },
    "image": "${imageUrl}",
    "url": "${SITE_URL}/events/${event.slug}",
    "offers": {
      "@type": "Offer",
      "price": "${event.non_membership_price / 100}",
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${SITE_URL}/events/${event.slug}">
  
  <!-- Redirect to main events page with modal trigger -->
  <script>
    // Store event slug for modal
    window.eventSlugToOpen = '${event.slug}';
    window.eventIdToOpen = ${event.event_id};
  </script>
  
  <!-- Redirect after a brief delay (allows crawlers to index) -->
  <meta http-equiv="refresh" content="0;url=${SITE_URL}/events?open=${event.slug}">
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
    }
    .event-image {
      width: 100%;
      max-height: 400px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 2rem;
    }
    .redirect-notice {
      background: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 2rem;
    }
  </style>
</head>
<body>
  <div class="redirect-notice">
    <p><strong>Redirecting...</strong> If you're not redirected automatically, <a href="${SITE_URL}/events?open=${event.slug}">click here</a>.</p>
  </div>
  
  <img src="${imageUrl}" alt="${event.event_name}" class="event-image" onerror="this.style.display='none'">
  
  <h1>${event.event_name}</h1>
  
  <p><strong>When:</strong> ${formattedDate}</p>
  ${event.location ? `<p><strong>Where:</strong> ${event.location}</p>` : ''}
  
  ${event.requires_purchase ? `
    <p><strong>Pricing:</strong></p>
    <ul>
      <li>Members: ${memberPrice}</li>
      <li>Non-Members: ${nonMemberPrice}</li>
    </ul>
  ` : '<p><strong>Free Event</strong></p>'}
  
  ${event.full_description ? `
    <h2>About this event</h2>
    <p>${event.full_description}</p>
  ` : event.description ? `
    <p>${event.description}</p>
  ` : ''}
  
  <p><a href="${SITE_URL}/events?open=${event.slug}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 1rem;">View Event Details & Book</a></p>
</body>
</html>`;
}

BunnySDK.net.http.serve(async (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // ==================== DYNAMIC EVENT PAGES ====================
    
    // GET /events/:slug - Dynamic event page with SEO
    if (path.startsWith("/events/") && request.method === "GET") {
      const slug = path.split("/")[2];
      
      if (!slug) {
        return new Response("Not Found", { status: 404 });
      }

      // Fetch event by slug
      const result = await client.execute({
        sql: "SELECT * FROM events WHERE slug = ? AND is_active = 1",
        args: [slug],
      });

      if (result.rows.length === 0) {
        return new Response("Event Not Found", { status: 404 });
      }

      const event = formatEventData(result.rows[0]);
      
      // Return SEO-friendly HTML page
      return new Response(generateEventPage(event), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300, s-maxage=600",
        },
      });
    }

    // ==================== API ENDPOINTS ====================

    // GET /api/events - List all active events
    if (path === "/api/events" && request.method === "GET") {
      const result = await client.execute(
        "SELECT * FROM events WHERE is_active = 1 ORDER BY event_datetime ASC"
      );

      const events = result.rows.map(formatEventData);
      
      return jsonResponse({ events, count: events.length });
    }

    // GET /api/events/:id - Get single event by ID
    if (path.match(/^\/api\/events\/\d+$/) && request.method === "GET") {
      const id = path.split("/")[3];
      
      const result = await client.execute({
        sql: "SELECT * FROM events WHERE event_id = ?",
        args: [id],
      });

      if (result.rows.length === 0) {
        return jsonResponse({ error: "Event not found" }, 404);
      }

      return jsonResponse({ event: formatEventData(result.rows[0]) });
    }

    // GET /api/events/slug/:slug - Get event by slug
    if (path.match(/^\/api\/events\/slug\/.+$/) && request.method === "GET") {
      const slug = path.split("/")[4];
      
      const result = await client.execute({
        sql: "SELECT * FROM events WHERE slug = ?",
        args: [slug],
      });

      if (result.rows.length === 0) {
        return jsonResponse({ error: "Event not found" }, 404);
      }

      return jsonResponse({ event: formatEventData(result.rows[0]) });
    }

    // POST /api/events - Create new event (requires auth)
    if (path === "/api/events" && request.method === "POST") {
      if (!requireAuth(request)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      const data = await request.json();
      const {
        event_name,
        description,
        full_description,
        event_datetime,
        location,
        membership_price,
        non_membership_price,
        capacity,
        category,
        image_url,
        requires_purchase,
        is_recurring,
        recurrence_pattern,
        recurrence_end_date,
        custom_slug
      } = data;

      if (!event_name || !event_datetime) {
        return jsonResponse({ error: "Missing required fields: event_name, event_datetime" }, 400);
      }

      // Insert event first to get the ID
      const insertResult = await client.execute({
        sql: `INSERT INTO events (
          event_name, description, full_description, event_datetime, location,
          membership_price, non_membership_price, capacity, category, image_url,
          requires_purchase, is_active, is_recurring, recurrence_pattern, recurrence_end_date,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          event_name,
          description || null,
          full_description || null,
          event_datetime,
          location || null,
          membership_price || 0,
          non_membership_price || 0,
          capacity || null,
          category || null,
          image_url || null,
          requires_purchase !== undefined ? requires_purchase : 1,
          is_recurring || 0,
          recurrence_pattern || null,
          recurrence_end_date || null
        ],
      });

      const eventId = Number(insertResult.lastInsertRowid);
      
      // Generate slug
      const slug = custom_slug || generateSlug(event_name, eventId);

      // Update with slug
      await client.execute({
        sql: "UPDATE events SET slug = ? WHERE event_id = ?",
        args: [slug, eventId],
      });

      return jsonResponse({
        success: true,
        message: "Event created",
        event_id: eventId,
        slug,
        share_url: `${SITE_URL}/events/${slug}`
      }, 201);
    }

    // PUT /api/events/:id - Update event (requires auth)
    if (path.match(/^\/api\/events\/\d+$/) && request.method === "PUT") {
      if (!requireAuth(request)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      const id = path.split("/")[3];
      const data = await request.json();

      // Get existing event
      const existing = await client.execute({
        sql: "SELECT * FROM events WHERE event_id = ?",
        args: [id],
      });

      if (existing.rows.length === 0) {
        return jsonResponse({ error: "Event not found" }, 404);
      }

      const current = existing.rows[0];

      // Update event
      await client.execute({
        sql: `UPDATE events SET
          event_name = ?,
          description = ?,
          full_description = ?,
          event_datetime = ?,
          location = ?,
          membership_price = ?,
          non_membership_price = ?,
          capacity = ?,
          category = ?,
          image_url = ?,
          requires_purchase = ?,
          is_active = ?,
          is_recurring = ?,
          recurrence_pattern = ?,
          recurrence_end_date = ?,
          slug = ?,
          updated_at = CURRENT_TIMESTAMP
          WHERE event_id = ?`,
        args: [
          data.event_name ?? current.event_name,
          data.description !== undefined ? data.description : current.description,
          data.full_description !== undefined ? data.full_description : current.full_description,
          data.event_datetime ?? current.event_datetime,
          data.location !== undefined ? data.location : current.location,
          data.membership_price ?? current.membership_price,
          data.non_membership_price ?? current.non_membership_price,
          data.capacity !== undefined ? data.capacity : current.capacity,
          data.category !== undefined ? data.category : current.category,
          data.image_url !== undefined ? data.image_url : current.image_url,
          data.requires_purchase !== undefined ? data.requires_purchase : current.requires_purchase,
          data.is_active !== undefined ? data.is_active : current.is_active,
          data.is_recurring !== undefined ? data.is_recurring : current.is_recurring,
          data.recurrence_pattern !== undefined ? data.recurrence_pattern : current.recurrence_pattern,
          data.recurrence_end_date !== undefined ? data.recurrence_end_date : current.recurrence_end_date,
          data.custom_slug || current.slug || generateSlug(data.event_name || String(current.event_name), Number(id)),
          id
        ],
      });

      const updatedSlug = data.custom_slug || current.slug || generateSlug(data.event_name || String(current.event_name), Number(id));

      return jsonResponse({
        success: true,
        message: "Event updated",
        event_id: id,
        slug: updatedSlug,
        share_url: `${SITE_URL}/events/${updatedSlug}`
      });
    }

    // DELETE /api/events/:id - Soft delete event (requires auth)
    if (path.match(/^\/api\/events\/\d+$/) && request.method === "DELETE") {
      if (!requireAuth(request)) {
        return jsonResponse({ error: "Unauthorized" }, 401);
      }

      const id = path.split("/")[3];

      await client.execute({
        sql: "UPDATE events SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE event_id = ?",
        args: [id],
      });

      return jsonResponse({ success: true, message: "Event deleted", event_id: id });
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
