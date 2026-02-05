/**
 * Bookings API - Bunny Edge Script
 * 
 * Manages table bookings stored in Bunny Database.
 * Payment processing is handled by the separate Payments Worker.
 * 
 * Environment Variables (configured in Bunny Dashboard):
 *   - BUNNY_DATABASE_URL: Database connection URL
 *   - BUNNY_DATABASE_AUTH_TOKEN: Database access token
 * 
 * API Endpoints:
 *   GET    /api/bookings/table-types    - Get available table types
 *   POST   /api/bookings                - Create new booking
 *   GET    /api/bookings/confirm/:ref   - Confirm booking after payment
 *   GET    /api/bookings/user/:email    - Get user's bookings
 */

import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { createClient } from "@libsql/client/web";

// Initialize libSQL client with Bunny Database credentials
const client = createClient({
  url: process.env.BUNNY_DATABASE_URL,
  authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN,
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

BunnySDK.net.http.serve(async (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // GET /api/bookings/table-types - Get available table types
    if (path === "/api/bookings/table-types" && request.method === "GET") {
      return await getTableTypes();
    }

    // POST /api/bookings - Create new booking
    if (path === "/api/bookings" && request.method === "POST") {
      return await createBooking(request);
    }

    // GET /api/bookings/confirm/:ref - Confirm booking after payment
    if (path.match(/^\/api\/bookings\/confirm\/[^/]+$/) && request.method === "GET") {
      const orderRef = path.split("/").pop();
      return await confirmBooking(orderRef!);
    }

    // GET /api/bookings/user/:email - Get user's bookings
    if (path.match(/^\/api\/bookings\/user\/[^/]+$/) && request.method === "GET") {
      const email = decodeURIComponent(path.split("/").pop()!);
      return await getUserBookings(email);
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
 * Get all active table types with pricing
 */
async function getTableTypes() {
  try {
    const result = await client.execute(
      `SELECT id, name, member_price, non_member_price, available_days, description
       FROM booking_table_types 
       WHERE active = 1
       ORDER BY name ASC`
    );
    
    return jsonResponse({
      table_types: result.rows.map(row => {
        // Parse available_days, handling malformed JSON
        let availableDays = [];
        try {
          const daysStr = String(row.available_days);
          // Fix double commas and parse
          const fixedJson = daysStr.replace(/,+/g, ',').replace(/,\]/g, ']');
          availableDays = JSON.parse(fixedJson).filter(Boolean); // Remove null/empty values
        } catch (e) {
          console.error('Error parsing available_days:', e);
          availableDays = [];
        }
        
        return {
          id: row.id,
          name: row.name,
          member_price: Number(row.member_price),
          non_member_price: Number(row.non_member_price),
          available_days: availableDays,
          description: row.description || null
        };
      })
    });
  } catch (error) {
    console.error("Error fetching table types:", error);
    return jsonResponse({ error: "Failed to fetch table types" }, 500);
  }
}

/**
 * Create new booking
 * Initially created with 'pending' status, confirmed after payment
 */
async function createBooking(request: Request) {
  try {
    const data = await request.json();
    const { 
      user_email, 
      user_name, 
      booking_date, 
      start_time, 
      end_time,
      table_type_id,
      order_ref,
      amount_paid,
      is_member_booking,
      notes 
    } = data;
    
    // Validate required fields
    if (!user_email || !user_name || !booking_date || !start_time || !end_time || !table_type_id || !order_ref) {
      return jsonResponse({ 
        error: "Missing required fields" 
      }, 400);
    }

    // Validate email format
    if (!user_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return jsonResponse({ error: "Invalid email address" }, 400);
    }

    // Validate date format
    if (!booking_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return jsonResponse({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
    }

    // Check if order_ref already exists (prevent duplicates)
    const existingResult = await client.execute({
      sql: "SELECT id FROM bookings WHERE order_ref = ?",
      args: [order_ref],
    });

    if (existingResult.rows.length > 0) {
      return jsonResponse({ 
        error: "Booking already exists",
        booking_id: existingResult.rows[0].id
      }, 409);
    }

    // Create the booking with pending status
    const now = new Date().toISOString();
    const insertResult = await client.execute({
      sql: `INSERT INTO bookings 
            (user_email, user_name, booking_date, start_time, end_time, 
             table_type_id, order_ref, amount_paid, is_member_booking, 
             payment_status, notes, created_at, updated_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        user_email, 
        user_name, 
        booking_date, 
        start_time, 
        end_time,
        table_type_id,
        order_ref,
        amount_paid || 0,
        is_member_booking ? 1 : 0,
        amount_paid > 0 ? 'pending' : 'confirmed', // Free bookings confirmed immediately
        notes || null,
        now,
        now,
        amount_paid > 0 ? 'pending' : 'confirmed'
      ],
    });

    return jsonResponse({ 
      success: true,
      message: "Booking created successfully",
      booking_id: Number(insertResult.lastInsertRowid),
      order_ref,
      payment_required: amount_paid > 0
    }, 201);
  } catch (error) {
    console.error("Error creating booking:", error);
    return jsonResponse({ error: "Failed to create booking" }, 500);
  }
}

/**
 * Confirm booking after successful payment
 */
async function confirmBooking(orderRef: string) {
  try {
    const now = new Date().toISOString();
    
    // Update booking status
    const result = await client.execute({
      sql: `UPDATE bookings 
            SET payment_status = 'confirmed', 
                status = 'confirmed',
                updated_at = ?
            WHERE order_ref = ? AND payment_status = 'pending'`,
      args: [now, orderRef],
    });

    if (result.rowsAffected === 0) {
      // Check if booking exists but already confirmed
      const checkResult = await client.execute({
        sql: "SELECT id, status, payment_status FROM bookings WHERE order_ref = ?",
        args: [orderRef],
      });

      if (checkResult.rows.length === 0) {
        return jsonResponse({ error: "Booking not found" }, 404);
      }

      const booking = checkResult.rows[0];
      if (booking.status === 'confirmed') {
        return jsonResponse({ 
          success: true, 
          message: "Booking already confirmed",
          booking_id: Number(booking.id)
        });
      }
    }
    
    return jsonResponse({ 
      success: true,
      message: "Booking confirmed successfully"
    });
  } catch (error) {
    console.error("Error confirming booking:", error);
    return jsonResponse({ error: "Failed to confirm booking" }, 500);
  }
}

/**
 * Get user's bookings
 */
async function getUserBookings(email: string) {
  try {
    const result = await client.execute({
      sql: `SELECT b.id, b.booking_date, b.start_time, b.end_time, 
                   b.status, b.payment_status, b.amount_paid, b.created_at,
                   t.name as table_type_name
            FROM bookings b
            LEFT JOIN booking_table_types t ON b.table_type_id = t.id
            WHERE b.user_email = ? AND b.status != 'cancelled'
            ORDER BY b.booking_date DESC, b.start_time DESC
            LIMIT 50`,
      args: [email],
    });
    
    return jsonResponse({
      bookings: result.rows.map(row => ({
        id: row.id,
        booking_date: row.booking_date,
        start_time: row.start_time,
        end_time: row.end_time,
        table_type: row.table_type_name,
        status: row.status,
        payment_status: row.payment_status,
        amount_paid: Number(row.amount_paid),
        created_at: row.created_at
      }))
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return jsonResponse({ error: "Failed to fetch bookings" }, 500);
  }
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
