/// <reference types="@bunny.net/edgescript-sdk" />

/**
 * DiceBastion Events - Bunny Edge Script
 * 
 * Proxies /events/:slug requests to the Cloudflare Worker, which serves
 * SEO-friendly HTML pages for browsers (with OG/Twitter/Schema.org metadata)
 * and JSON for API consumers (via Accept header detection).
 * 
 * All other requests pass through to origin (GitHub Pages static site).
 */

import * as BunnySDK from "@bunny.net/edgescript-sdk";

const WORKER_API_URL = "https://dicebastion-memberships.ncalamaro.workers.dev";

// Slug format: lowercase alphanumeric + hyphens, 2–60 chars
const VALID_SLUG = /^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$/;

BunnySDK.net.http.serve(async (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");

  // Only handle GET /events/:slug — everything else goes to origin
  if (request.method !== "GET" || !path.startsWith("/events/")) {
    return fetch(request);
  }

  const slug = path.split("/")[2];

  // No slug, static assets, or invalid slug format → pass through to origin
  if (!slug || slug.includes(".") || !VALID_SLUG.test(slug)) {
    return fetch(request);
  }

  try {
    // Proxy to the Cloudflare Worker — it detects Accept: text/html and
    // returns the SEO page for browsers, or JSON for API consumers.
    const workerRes = await fetch(`${WORKER_API_URL}/events/${encodeURIComponent(slug)}`, {
      headers: {
        "Accept": request.headers.get("Accept") || "text/html",
        "User-Agent": request.headers.get("User-Agent") || "",
      },
    });

    if (!workerRes.ok) {
      // Event not found or error — let origin handle it (404 page will redirect)
      return fetch(request);
    }

    return new Response(workerRes.body, {
      status: workerRes.status,
      headers: workerRes.headers,
    });
  } catch (error) {
    console.error("Events edge script error:", error);
    return fetch(request);
  }
});
