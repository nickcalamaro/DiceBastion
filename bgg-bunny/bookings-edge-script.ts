/**
 * Bookings API - Bunny Edge Script
 * 
 * Manages table bookings stored in Bunny Database.
 * Payment processing is handled by the separate Payments Worker.
 * 
 * Environment Variables (configured in Bunny Dashboard):
 *   - BUNNY_DATABASE_URL: Database connection URL
 *   - BUNNY_DATABASE_AUTH_TOKEN: Database access token
 *   - EMAIL_API_URL: URL of the DiceBastionEmails edge script (e.g., https://dicebastionemails-xxxxx.bunny.run/send)
 * 
 * API Endpoints:
 *   GET    /api/bookings/table-types    - Get available table types
 *   POST   /api/bookings                - Create new booking
 *   GET    /api/bookings/confirm/:ref   - Confirm booking after payment
 *   GET    /api/bookings/user/:email    - Get user's bookings
 */

/// <reference types="@bunny.net/edgescript-sdk" />

import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { createClient } from "@libsql/client/web";

// Initialize libSQL client with Bunny Database credentials
const client = createClient({
  url: process.env.BUNNY_DATABASE_URL,
  authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN,
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Helper function to create JSON responses
 */
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/**
 * Replace template placeholders with actual values
 */
function replacePlaceholders(template: string, data: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(value ?? ''));
  }
  return result;
}

/**
 * Send booking confirmation email
 */
async function sendBookingConfirmationEmail(params: {
  userEmail: string;
  userName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  tableTypeId: number;
  amountPaid: number;
}): Promise<void> {
  const { userEmail, userName, bookingDate, startTime, endTime, tableTypeId, amountPaid } = params;
  
  try {
    // Fetch email template from database
    const templateResult = await client.execute({
      sql: `SELECT subject, body_html, body_text, from_email, from_name 
            FROM email_templates 
            WHERE template_key = ? AND active = 1`,
      args: ['booking_confirmation'],
    });

    if (templateResult.rows.length === 0) {
      console.error('Email template not found: booking_confirmation');
      return;
    }

    // Get table type name
    const tableTypeResult = await client.execute({
      sql: "SELECT name FROM booking_table_types WHERE id = ?",
      args: [tableTypeId],
    });
    
    const tableTypeName = tableTypeResult.rows[0]?.name || 'Table';
    const template = templateResult.rows[0];

    // Prepare template data
    const templateData = {
      user_name: userName,
      table_type_name: tableTypeName,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      amount_paid: amountPaid.toFixed(2),
    };

    // Replace placeholders in subject and body
    const subject = replacePlaceholders(String(template.subject), templateData);
    const html = replacePlaceholders(String(template.body_html), templateData);
    const text = template.body_text 
      ? replacePlaceholders(String(template.body_text), templateData)
      : undefined;

    // Send email via DiceBastionEmails edge script
    const emailApiUrl = process.env.EMAIL_API_URL;
    
    if (!emailApiUrl) {
      console.error('EMAIL_API_URL not configured');
      return;
    }
    
    const response = await fetch(emailApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_email: userEmail,
        to_name: userName,
        from_email: String(template.from_email),
        from_name: String(template.from_name),
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send email:', response.status, errorText);
    }
  } catch (error) {
    console.error('Error in sendBookingConfirmationEmail:', error);
    throw error;
  }
}

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

    // GET /api/bookings/available-slots - Get available time slots for a date/table type
    if (path === "/api/bookings/available-slots" && request.method === "GET") {
      const date = url.searchParams.get('date');
      const tableTypeId = url.searchParams.get('table_type_id');
      if (!date || !tableTypeId) {
        return jsonResponse({ error: "Missing date or table_type_id parameter" }, 400);
      }
      return await getAvailableSlots(date, parseInt(tableTypeId));
    }

    // POST /api/bookings - Create new booking
    if (path === "/api/bookings" && request.method === "POST") {
      return await createBooking(request);
    }

    // PATCH /api/bookings/:id/cancel - Cancel a booking
    if (path.match(/^\/api\/bookings\/\d+\/cancel$/) && request.method === "PATCH") {
      const bookingId = path.split("/")[3];
      return await cancelBooking(parseInt(bookingId));
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

    // GET /api/bookings/all - Get all bookings (admin endpoint)
    if (path === "/api/bookings/all" && request.method === "GET") {
      return await getAllBookings();
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
 * Get available time slots for a specific date and table type
 * Returns slots with availability based on max_bookings config
 */
async function getAvailableSlots(date: string, tableTypeId: number) {
  try {
    // Validate date format
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return jsonResponse({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
    }

    // Get config from booking_config table
    const configResult = await client.execute(
      "SELECT max_bookings, start_hour, end_hour, slot_duration_hours FROM booking_config WHERE id = 1"
    );
    
    if (configResult.rows.length === 0) {
      console.error("No booking config found, using defaults");
      // Use defaults if config not found
    }
    
    const config = configResult.rows[0] || {};
    const maxBookings = Number(config.max_bookings || 4);
    const startHour = Number(config.start_hour || 10);
    const endHour = Number(config.end_hour || 22);
    const slotDuration = Number(config.slot_duration_hours || 3);

    console.log('Slot config:', { maxBookings, startHour, endHour, slotDuration });

    // Generate time slots based on config
    const timeSlots: Array<{start: string, end: string}> = [];
    for (let hour = startHour; hour + slotDuration <= endHour; hour += slotDuration) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + slotDuration).toString().padStart(2, '0')}:00`;
      timeSlots.push({ start: startTime, end: endTime });
    }
    
    console.log('Generated time slots:', timeSlots);

    // Count non-cancelled bookings for each slot across ALL table types
    // max_bookings applies to total simultaneous bookings, not per table type
    const slotsWithAvailability = await Promise.all(
      timeSlots.map(async (slot) => {
        // Check for overlapping bookings: a booking overlaps if it starts before this slot ends
        // AND ends after this slot starts
        // Count across ALL table types (removed table_type_id filter)
        const bookingCount = await client.execute({
          sql: `SELECT COUNT(*) as count FROM bookings 
                WHERE booking_date = ? 
                AND start_time < ? 
                AND end_time > ? 
                AND status != 'cancelled'`,
          args: [date, slot.end, slot.start]
        });
        
        const count = Number(bookingCount.rows[0]?.count || 0);
        const spotsLeft = maxBookings - count;
        
        return {
          start_time: slot.start,
          end_time: slot.end,
          spots_left: spotsLeft,
          available: spotsLeft > 0
        };
      })
    );

    // Filter to only available slots
    const availableSlots = slotsWithAvailability.filter(slot => slot.available);
    
    console.log('Slots with availability:', slotsWithAvailability);
    console.log('Available slots:', availableSlots);

    return jsonResponse({
      date,
      table_type_id: tableTypeId,
      max_bookings: maxBookings,
      slots: availableSlots
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return jsonResponse({ error: "Failed to fetch available slots" }, 500);
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

    // Check max_bookings limit across ALL table types for this time slot
    const configResult = await client.execute(
      "SELECT max_bookings FROM booking_config WHERE id = 1"
    );
    const maxBookings = Number(configResult.rows[0]?.max_bookings || 4);

    const bookingCountResult = await client.execute({
      sql: `SELECT COUNT(*) as count FROM bookings 
            WHERE booking_date = ? 
            AND start_time < ? 
            AND end_time > ? 
            AND status != 'cancelled'`,
      args: [booking_date, end_time, start_time]
    });

    const currentBookings = Number(bookingCountResult.rows[0]?.count || 0);
    
    if (currentBookings >= maxBookings) {
      return jsonResponse({ 
        error: "Time slot fully booked",
        message: `This time slot has reached the maximum of ${maxBookings} simultaneous bookings.`
      }, 409);
    }

    // Create the booking
    // Note: status is always 'confirmed' due to DB constraint, but payment_status tracks payment
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
        amount_paid > 0 ? 'pending' : 'confirmed', // Track payment status separately
        notes || null,
        now,
        now,
        'confirmed' // Status is always confirmed (CHECK constraint only allows confirmed/cancelled)
      ],
    });

    // For free bookings, send confirmation email immediately
    if (amount_paid === 0) {
      try {
        await sendBookingConfirmationEmail({
          userEmail: user_email,
          userName: user_name,
          bookingDate: booking_date,
          startTime: start_time,
          endTime: end_time,
          tableTypeId: table_type_id,
          amountPaid: 0
        });
      } catch (e) {
        console.error('Error sending confirmation email:', e);
      }
      
      return jsonResponse({ 
        success: true,
        message: "Booking created successfully",
        booking_id: Number(insertResult.lastInsertRowid),
        order_ref,
        payment_required: false
      }, 201);
    }

    // For paid bookings, create payment checkout
    try {
      const paymentsApiUrl = process.env.PAYMENTS_API_URL || 'https://dicebastion-payments.ncalamaro.workers.dev';
      const internalSecret = process.env.INTERNAL_SECRET;
      
      if (!internalSecret) {
        throw new Error('INTERNAL_SECRET not configured');
      }

      // Get table type name for description
      const tableTypeResult = await client.execute({
        sql: "SELECT name FROM booking_table_types WHERE id = ?",
        args: [table_type_id],
      });

      const tableTypeName = tableTypeResult.rows.length > 0 ? tableTypeResult.rows[0].name : 'Table Booking';
      const description = `${tableTypeName} - ${booking_date} ${start_time}`;

      const checkoutResponse = await fetch(`${paymentsApiUrl}/internal/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': internalSecret
        },
        body: JSON.stringify({
          amount: amount_paid,
          currency: 'GBP',
          orderRef: order_ref,
          description
        })
      });

      const checkoutData = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error || 'Payment checkout failed');
      }

      return jsonResponse({
        success: true,
        message: "Booking created, payment required",
        booking_id: Number(insertResult.lastInsertRowid),
        order_ref,
        payment_required: true,
        checkout_id: checkoutData.id
      }, 201);

    } catch (paymentError) {
      console.error('Error creating payment checkout:', paymentError);
      // Booking was created but payment checkout failed - return error but keep booking
      return jsonResponse({ 
        error: "Booking created but payment setup failed. Please contact support.",
        booking_id: Number(insertResult.lastInsertRowid),
        order_ref
      }, 500);
    }

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
          ok: true,
          status: 'already_active',
          message: "Booking already confirmed",
          booking_id: Number(booking.id)
        });
      }
    }
    
    // Send confirmation email for paid bookings
    try {
      const booking = await client.execute({
        sql: `SELECT b.user_email, b.user_name, b.booking_date, b.start_time, 
                     b.end_time, b.amount_paid, b.table_type_id
              FROM bookings b
              WHERE b.order_ref = ?`,
        args: [orderRef],
      });
      
      if (booking.rows.length > 0) {
        const row = booking.rows[0];
        await sendBookingConfirmationEmail({
          userEmail: String(row.user_email),
          userName: String(row.user_name),
          bookingDate: String(row.booking_date),
          startTime: String(row.start_time),
          endTime: String(row.end_time),
          tableTypeId: Number(row.table_type_id),
          amountPaid: Number(row.amount_paid)
        });
      }
    } catch (e) {
      console.error('Error sending confirmation email:', e);
    }
    
    return jsonResponse({ 
      ok: true,
      status: 'active',
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

/**
 * Get all bookings (admin endpoint)
 * Returns upcoming bookings sorted by date
 */
async function getAllBookings() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const result = await client.execute({
      sql: `SELECT b.id, b.user_email, b.user_name, b.booking_date, b.start_time, b.end_time, 
                   b.status, b.payment_status, b.amount_paid, b.notes, b.created_at,
                   t.name as table_type_name
            FROM bookings b
            LEFT JOIN booking_table_types t ON b.table_type_id = t.id
            WHERE b.booking_date >= ?
            ORDER BY b.booking_date ASC, b.start_time ASC
            LIMIT 100`,
      args: [today],
    });
    
    return jsonResponse({
      bookings: result.rows.map(row => ({
        id: row.id,
        user_email: row.user_email,
        user_name: row.user_name,
        booking_date: row.booking_date,
        start_time: row.start_time,
        end_time: row.end_time,
        table_type: row.table_type_name,
        status: row.status,
        payment_status: row.payment_status,
        amount_paid: Number(row.amount_paid),
        notes: row.notes,
        created_at: row.created_at
      }))
    });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    return jsonResponse({ error: "Failed to fetch bookings" }, 500);
  }
}

/**
 * Cancel a booking
 * Sets status to 'cancelled' instead of deleting the record
 */
async function cancelBooking(bookingId: number) {
  try {
    const now = new Date().toISOString();
    
    // Update booking status to cancelled
    const result = await client.execute({
      sql: `UPDATE bookings 
            SET status = 'cancelled',
                payment_status = 'cancelled',
                updated_at = ?
            WHERE id = ? AND status != 'cancelled'`,
      args: [now, bookingId],
    });

    if (result.rowsAffected === 0) {
      // Check if booking exists
      const checkResult = await client.execute({
        sql: "SELECT id, status FROM bookings WHERE id = ?",
        args: [bookingId],
      });

      if (checkResult.rows.length === 0) {
        return jsonResponse({ error: "Booking not found" }, 404);
      }

      const booking = checkResult.rows[0];
      if (booking.status === 'cancelled') {
        return jsonResponse({ 
          success: true, 
          message: "Booking already cancelled",
          booking_id: bookingId
        });
      }
    }
    
    return jsonResponse({ 
      success: true,
      message: "Booking cancelled successfully",
      booking_id: bookingId
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return jsonResponse({ error: "Failed to cancel booking" }, 500);
  }
}
