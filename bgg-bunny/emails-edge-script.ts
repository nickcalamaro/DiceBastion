/// <reference types="@bunny.net/edgescript-sdk" />

/**
 * DiceBastion Email Service - Bunny Edge Script
 * Handles all email sending via MailerSend API
 */

import * as BunnySDK from "@bunny.net/edgescript-sdk";

// Helper function to create JSON responses
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
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
 * Send email via MailerSend API
 */
async function sendEmail(params: {
  to_email: string;
  to_name: string;
  from_email: string;
  from_name: string;
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
}): Promise<{ success: boolean; error?: string; message_id?: string }> {
  const apiKey = process.env.MAILERSEND_API_KEY;
  
  if (!apiKey) {
    console.error('MAILERSEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: params.from_email,
          name: params.from_name,
        },
        to: [
          {
            email: params.to_email,
            name: params.to_name,
          },
        ],
        subject: params.subject,
        html: params.html,
        text: params.text || params.html.replace(/<[^>]*>/g, ''),
        reply_to: params.reply_to ? {
          email: params.reply_to,
          name: params.from_name,
        } : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailerSend API error:', response.status, errorText);
      return { 
        success: false, 
        error: `MailerSend API error: ${response.status}` 
      };
    }

    // MailerSend returns 202 Accepted with X-Message-Id header
    const messageId = response.headers.get('X-Message-Id');
    
    return { 
      success: true, 
      message_id: messageId || undefined 
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Main request handler
 */
BunnySDK.net.http.serve(async (request: Request): Promise<Response> => {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return jsonResponse({});
  }

  // POST /send - Send an email with pre-populated template data
  if (url.pathname === '/send' && request.method === 'POST') {
    try {
      const body = await request.json();
      
      // Validate required fields
      const required = ['to_email', 'to_name', 'from_email', 'from_name', 'subject', 'html'];
      const missing = required.filter(field => !body[field]);
      
      if (missing.length > 0) {
        return jsonResponse({ 
          error: `Missing required fields: ${missing.join(', ')}` 
        }, 400);
      }

      const result = await sendEmail({
        to_email: body.to_email,
        to_name: body.to_name,
        from_email: body.from_email,
        from_name: body.from_name,
        subject: body.subject,
        html: body.html,
        text: body.text,
        reply_to: body.reply_to,
      });

      if (!result.success) {
        return jsonResponse({ 
          error: result.error 
        }, 500);
      }

      return jsonResponse({ 
        success: true,
        message_id: result.message_id,
        message: 'Email sent successfully'
      });
    } catch (error) {
      console.error('Error processing send request:', error);
      return jsonResponse({ 
        error: 'Invalid request body' 
      }, 400);
    }
  }

  return jsonResponse({ error: 'Not found' }, 404);
});
