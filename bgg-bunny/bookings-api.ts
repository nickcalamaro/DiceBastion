/**
 * Booking System API - Bunny Edge Script
 * 
 * A RESTful API for managing facility bookings stored in Bunny Database.
 * 
 * Environment Variables (auto-configured from Bunny Dashboard):
 *   - BUNNY_DATABASE_URL: Database connection URL
 *   - BUNNY_DATABASE_AUTH_TOKEN: Database access token
 * 
 * API Endpoints:
 *   GET    /api/bookings/config          - Get booking configuration
 *   GET    /api/bookings/available/:date - Get available slots for a date
 *   GET    /api/bookings/:date           - Get all bookings for a date
 *   POST   /api/bookings                 - Create new booking
 *   DELETE /api/bookings/:id             - Cancel booking (by ID)
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
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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
    // GET /api/bookings/config - Get booking configuration
    if (path === "/api/bookings/config" && request.method === "GET") {
      return await getConfig();
    }

    // GET /api/bookings/available/:date - Get available slots for a date
    if (path.match(/^\/api\/bookings\/available\/[\d-]+$/) && request.method === "GET") {
      const date = path.split("/").pop();
      return await getAvailableSlots(date!);
    }

    // GET /api/bookings/:date - Get all bookings for a date
    if (path.match(/^\/api\/bookings\/[\d-]+$/) && request.method === "GET") {
      const date = path.split("/").pop();
      return await getBookings(date!);
    }

    // POST /api/bookings - Create new booking
    if (path === "/api/bookings" && request.method === "POST") {
      return await createBooking(request);
    }

    // DELETE /api/bookings/:id - Cancel booking
    if (path.match(/^\/api\/bookings\/\d+$/) && request.method === "DELETE") {
      const id = path.split("/").pop();
      return await cancelBooking(id!);
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
 * Get booking configuration
 */
async function getConfig() {
  try {
    const result = await client.execute(
      "SELECT * FROM booking_config WHERE id = 1"
    );
    
    if (result.rows.length === 0) {
      return jsonResponse({ error: "Configuration not found" }, 404);
    }
    
    const config = result.rows[0];
    return jsonResponse({
      config: {
        maxBookingsPerDay: config.max_bookings_per_day,
        slotDurationHours: config.slot_duration_hours,
        startHour: config.start_hour,
        endHour: config.end_hour,
        enabledDays: String(config.enabled_days).split(',').map(Number),
      }
    });
  } catch (error) {
    console.error("Error fetching config:", error);
    return jsonResponse({ error: "Failed to fetch configuration" }, 500);
  }
}

/**
 * Get available time slots for a date
 */
async function getAvailableSlots(date: string) {
  try {
    // Validate date format
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return jsonResponse({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
    }

    // Get configuration
    const configResult = await client.execute(
      "SELECT * FROM booking_config WHERE id = 1"
    );
    
    if (configResult.rows.length === 0) {
      return jsonResponse({ error: "Configuration not found" }, 500);
    }
    
    const config = configResult.rows[0];
    const maxBookingsPerDay = Number(config.max_bookings_per_day);
    const slotDuration = Number(config.slot_duration_hours);
    const startHour = Number(config.start_hour);
    const endHour = Number(config.end_hour);
    
    // Check if day is enabled
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    const enabledDays = String(config.enabled_days).split(',').map(Number);
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday from 0 to 7
    
    if (!enabledDays.includes(adjustedDay)) {
      return jsonResponse({ 
        available: false,
        reason: "This day is not available for bookings",
        slots: []
      });
    }

    // Get existing bookings for this date
    const bookingsResult = await client.execute({
      sql: "SELECT * FROM bookings WHERE booking_date = ? AND status = 'confirmed'",
      args: [date],
    });

    const existingBookings = bookingsResult.rows.length;
    
    // Check if max bookings reached
    if (existingBookings >= maxBookingsPerDay) {
      return jsonResponse({
        available: false,
        reason: "Maximum bookings reached for this day",
        slots: [],
        bookingsCount: existingBookings,
        maxBookings: maxBookingsPerDay,
      });
    }

    // Generate all possible time slots
    const allSlots = [];
    for (let hour = startHour; hour + slotDuration <= endHour; hour++) {
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      const endTime = `${String(hour + slotDuration).padStart(2, '0')}:00`;
      allSlots.push({ startTime, endTime });
    }

    // Filter out booked slots
    const bookedSlots = bookingsResult.rows.map(row => ({
      start: String(row.start_time),
      end: String(row.end_time),
    }));

    const availableSlots = allSlots.filter(slot => {
      // Check if this slot overlaps with any existing booking
      return !bookedSlots.some(booked => {
        return (
          (slot.startTime >= booked.start && slot.startTime < booked.end) ||
          (slot.endTime > booked.start && slot.endTime <= booked.end) ||
          (slot.startTime <= booked.start && slot.endTime >= booked.end)
        );
      });
    });

    return jsonResponse({
      available: true,
      date,
      slots: availableSlots,
      bookingsCount: existingBookings,
      maxBookings: maxBookingsPerDay,
      remainingSlots: maxBookingsPerDay - existingBookings,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return jsonResponse({ error: "Failed to fetch available slots" }, 500);
  }
}

/**
 * Get all bookings for a date
 */
async function getBookings(date: string) {
  try {
    // Validate date format
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return jsonResponse({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
    }

    const result = await client.execute({
      sql: `SELECT id, user_name, booking_date, start_time, end_time, status, created_at 
            FROM bookings 
            WHERE booking_date = ? AND status = 'confirmed'
            ORDER BY start_time ASC`,
      args: [date],
    });
    
    return jsonResponse({
      date,
      bookings: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return jsonResponse({ error: "Failed to fetch bookings" }, 500);
  }
}

/**
 * Create a new booking
 */
async function createBooking(request: Request) {
  try {
    const data = await request.json();
    const { user_email, user_name, booking_date, start_time, notes } = data;
    
    // Validate required fields
    if (!user_email || !user_name || !booking_date || !start_time) {
      return jsonResponse({ 
        error: "Missing required fields: user_email, user_name, booking_date, start_time" 
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

    // Validate time format
    if (!start_time.match(/^\d{2}:\d{2}$/)) {
      return jsonResponse({ error: "Invalid time format. Use HH:MM" }, 400);
    }

    // Get configuration
    const configResult = await client.execute(
      "SELECT * FROM booking_config WHERE id = 1"
    );
    
    if (configResult.rows.length === 0) {
      return jsonResponse({ error: "Configuration not found" }, 500);
    }
    
    const config = configResult.rows[0];
    const maxBookingsPerDay = Number(config.max_bookings_per_day);
    const slotDuration = Number(config.slot_duration_hours);
    
    // Calculate end time
    const [startHour, startMinute] = start_time.split(':').map(Number);
    const endHour = startHour + slotDuration;
    const end_time = `${String(endHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;

    // Check if max bookings reached for this day
    const existingResult = await client.execute({
      sql: "SELECT COUNT(*) as count FROM bookings WHERE booking_date = ? AND status = 'confirmed'",
      args: [booking_date],
    });

    const existingCount = Number(existingResult.rows[0].count);
    if (existingCount >= maxBookingsPerDay) {
      return jsonResponse({ 
        error: "Maximum bookings reached for this day",
        maxBookings: maxBookingsPerDay,
      }, 409);
    }

    // Check for time slot conflicts
    const conflictResult = await client.execute({
      sql: `SELECT id FROM bookings 
            WHERE booking_date = ? 
            AND status = 'confirmed'
            AND (
              (start_time >= ? AND start_time < ?) OR
              (end_time > ? AND end_time <= ?) OR
              (start_time <= ? AND end_time >= ?)
            )`,
      args: [booking_date, start_time, end_time, start_time, end_time, start_time, end_time],
    });

    if (conflictResult.rows.length > 0) {
      return jsonResponse({ 
        error: "This time slot is already booked",
        conflict: true,
      }, 409);
    }

    // Create the booking
    const now = new Date().toISOString();
    const insertResult = await client.execute({
      sql: `INSERT INTO bookings 
            (user_email, user_name, booking_date, start_time, end_time, notes, created_at, updated_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      args: [user_email, user_name, booking_date, start_time, end_time, notes || null, now, now],
    });

    return jsonResponse({ 
      success: true,
      message: "Booking created successfully",
      booking: {
        id: insertResult.lastInsertRowid,
        user_name,
        booking_date,
        start_time,
        end_time,
      }
    }, 201);
  } catch (error) {
    console.error("Error creating booking:", error);
    return jsonResponse({ error: "Failed to create booking" }, 500);
  }
}

/**
 * Cancel a booking
 */
async function cancelBooking(id: string) {
  try {
    const now = new Date().toISOString();
    
    await client.execute({
      sql: "UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?",
      args: [now, id],
    });
    
    return jsonResponse({ 
      success: true,
      message: "Booking cancelled successfully",
      id 
    });
  } catch (error) {
    console.error(`Error cancelling booking ${id}:`, error);
    return jsonResponse({ error: "Failed to cancel booking" }, 500);
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
