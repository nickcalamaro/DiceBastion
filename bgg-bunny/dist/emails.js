// emails-edge-script.ts
import * as BunnySDK from "@bunny.net/edgescript-sdk";
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var supportRateLimits = /* @__PURE__ */ new Map();
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
function clampStr(value, max) {
  return String(value ?? "").trim().substring(0, max);
}
function escapeHtml(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function checkRateLimit(ip, limit = 3, windowMinutes = 1) {
  if (!ip) return true;
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1e3;
  const existing = supportRateLimits.get(ip);
  if (!existing || now - existing[0] > windowMs) {
    supportRateLimits.set(ip, [now, 1]);
    return true;
  }
  if (existing[1] >= limit) return false;
  existing[1] += 1;
  return true;
}
async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET not configured \u2014 bypassing verification");
    return true;
  }
  if (token === "test-bypass" && process.env.ALLOW_TEST_BYPASS === "true") {
    return true;
  }
  if (!token) return false;
  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form
    });
    const data = await res.json().catch(() => ({}));
    return !!data.success;
  } catch (error) {
    console.error("[turnstile] verification error:", error);
    return false;
  }
}
function buildSupportEmailHtml(params) {
  return `

    <!DOCTYPE html>

    <html>

    <head><meta charset="UTF-8"></head>

    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">

      <div style="background:linear-gradient(135deg,#b2c6df 0%,#5374a5 100%);color:white;padding:24px 20px;text-align:center;border-radius:8px 8px 0 0;">

        <h1 style="margin:0;font-size:1.4rem;">New support message</h1>

      </div>

      <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;">

        <p>You received a new message from the Dice Bastion support form.</p>

        <div style="background:#e0f2fe;border-left:4px solid #0284c7;padding:15px;margin:16px 0;">

          <p style="margin:0 0 8px;"><strong>From:</strong> ${escapeHtml(params.name)} &lt;${escapeHtml(params.email)}&gt;</p>

          <p style="margin:0 0 8px;"><strong>Category:</strong> ${escapeHtml(params.categoryLabel)}</p>

          <p style="margin:0;"><strong>Submitted:</strong> ${escapeHtml(params.submittedAt)} (Gibraltar time)</p>

        </div>

        <p><strong>Message:</strong></p>

        <p style="white-space:pre-wrap;">${escapeHtml(params.message)}</p>

        <p style="color:#666;font-size:0.9rem;">Reply directly to this email to respond to the sender.</p>

      </div>

    </body>

    </html>

  `.trim();
}
async function sendEmail(params) {
  const apiKey = process.env.MAILERSEND_API_KEY;
  if (!apiKey) {
    console.error("MAILERSEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }
  try {
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: {
          email: params.from_email,
          name: params.from_name
        },
        to: [
          {
            email: params.to_email,
            name: params.to_name
          }
        ],
        subject: params.subject,
        html: params.html,
        text: params.text || params.html.replace(/<[^>]*>/g, ""),
        reply_to: params.reply_to ? {
          email: params.reply_to,
          name: params.reply_to_name || params.from_name
        } : void 0
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("MailerSend API error:", response.status, errorText);
      return {
        success: false,
        error: `MailerSend API error: ${response.status}`
      };
    }
    const messageId = response.headers.get("X-Message-Id");
    return {
      success: true,
      message_id: messageId || void 0
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function handleSupportContact(request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  if (!checkRateLimit(ip)) {
    return jsonResponse({
      error: "rate_limit_exceeded",
      message: "Too many messages sent. Please wait a minute and try again."
    }, 429);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json", message: "Invalid request body." }, 400);
  }
  if (body.website) {
    return jsonResponse({ ok: true });
  }
  const trimmedName = clampStr(body.name, 200);
  const trimmedEmail = clampStr(body.email, 320).toLowerCase();
  const trimmedMessage = clampStr(body.message, 5e3);
  const trimmedCategory = clampStr(body.category || "general", 50);
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : void 0;
  if (!trimmedName) {
    return jsonResponse({ error: "name_required", message: "Please enter your name." }, 400);
  }
  if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
    return jsonResponse({ error: "invalid_email", message: "Please enter a valid email address." }, 400);
  }
  if (trimmedMessage.length < 10) {
    return jsonResponse({ error: "message_too_short", message: "Please enter a message of at least 10 characters." }, 400);
  }
  const tsOk = await verifyTurnstile(turnstileToken, ip);
  if (!tsOk) {
    return jsonResponse({ error: "turnstile_failed", message: "Security check failed. Please refresh and try again." }, 403);
  }
  const supportTo = process.env.SUPPORT_CONTACT_EMAIL;
  if (!supportTo) {
    console.error("[support] SUPPORT_CONTACT_EMAIL not configured");
    return jsonResponse({
      error: "service_unavailable",
      message: "Support form is temporarily unavailable. Please try again later."
    }, 503);
  }
  const categoryLabels = {
    general: "General enquiry",
    membership: "Membership",
    events: "Events",
    bookings: "Table bookings",
    website: "Website / technical issue",
    other: "Other"
  };
  const categoryLabel = categoryLabels[trimmedCategory] || categoryLabels.general;
  const submittedAt = (/* @__PURE__ */ new Date()).toLocaleString("en-GB", { timeZone: "Europe/Gibraltar" });
  const subject = `[Dice Bastion Support] ${categoryLabel} \u2014 ${trimmedName}`;
  const fromEmail = process.env.MAILERSEND_FROM_EMAIL || "noreply@dicebastion.com";
  const fromName = process.env.MAILERSEND_FROM_NAME || "Dice Bastion";
  const html = buildSupportEmailHtml({
    name: trimmedName,
    email: trimmedEmail,
    categoryLabel,
    submittedAt,
    message: trimmedMessage
  });
  const text = [
    "New support message from dicebastion.com/support",
    "",
    `From: ${trimmedName} <${trimmedEmail}>`,
    `Category: ${categoryLabel}`,
    `Submitted: ${submittedAt} (Gibraltar time)`,
    "",
    "Message:",
    trimmedMessage
  ].join("\n");
  const result = await sendEmail({
    to_email: supportTo,
    to_name: "Dice Bastion Support",
    from_email: fromEmail,
    from_name: fromName,
    subject,
    html,
    text,
    reply_to: trimmedEmail,
    reply_to_name: trimmedName
  });
  if (!result.success) {
    console.error("[support] send failed:", result.error);
    return jsonResponse({
      error: "send_failed",
      message: "Could not send your message. Please try again later."
    }, 502);
  }
  return jsonResponse({ ok: true, message_id: result.message_id });
}
BunnySDK.net.http.serve(async (request) => {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, "");
  if (request.method === "OPTIONS") {
    return jsonResponse({});
  }
  if (pathname === "/support" && request.method === "POST") {
    return handleSupportContact(request);
  }
  if ((pathname === "/send" || pathname === "") && request.method === "POST") {
    try {
      const body = await request.json();
      console.log("Email request received:", {
        to: body.to_email,
        subject: body.subject
      });
      const required = ["to_email", "to_name", "from_email", "from_name", "subject", "html"];
      const missing = required.filter((field) => !body[field]);
      if (missing.length > 0) {
        return jsonResponse({
          error: `Missing required fields: ${missing.join(", ")}`
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
        reply_to_name: body.reply_to_name
      });
      if (!result.success) {
        return jsonResponse({ error: result.error }, 500);
      }
      return jsonResponse({
        success: true,
        message_id: result.message_id,
        message: "Email sent successfully"
      });
    } catch (error) {
      console.error("Error processing send request:", error);
      return jsonResponse({ error: "Invalid request body" }, 400);
    }
  }
  console.log("Path not matched:", pathname, "Method:", request.method);
  return jsonResponse({ error: "Not found" }, 404);
});
