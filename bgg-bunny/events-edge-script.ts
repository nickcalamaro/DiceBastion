/// <reference types="@bunny.net/edgescript-sdk" />

/**
 * DiceBastion Events - Bunny Edge Script
 *
 * Serves pre-built static SEO pages from Bunny Storage for /events/:slug URLs.
 * The Worker uploads these HTML files to storage on event create/update.
 * All other requests pass through to origin (GitHub Pages).
 *
 * Environment Variables (configured in Bunny Dashboard):
 *   - STORAGE_API_KEY: Bunny Storage API key for the 'dicebastion' zone
 */

import * as BunnySDK from "@bunny.net/edgescript-sdk";

const STORAGE_ZONE = "dicebastion";
const STORAGE_API_KEY = process.env.STORAGE_API_KEY || "";

// Slug format: lowercase alphanumeric + hyphens, 2–60 chars
const VALID_SLUG = /^[a-z0-9][a-z0-9-]{0,58}[a-z0-9]$/;

BunnySDK.net.http.serve(async (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");

  // Only handle GET /events/:slug
  if (request.method !== "GET" || !path.startsWith("/events/")) {
    return fetch(request);
  }

  const slug = path.split("/")[2];

  // No slug, static assets, or invalid slug → pass through to origin
  if (!slug || slug.includes(".") || !VALID_SLUG.test(slug)) {
    return fetch(request);
  }

  try {
    // Fetch the pre-built SEO page from Bunny Storage
    const storageUrl = `https://storage.bunnycdn.com/${STORAGE_ZONE}/events/${slug}/index.html`;
    const res = await fetch(storageUrl, {
      headers: { "AccessKey": STORAGE_API_KEY },
    });

    if (!res.ok) {
      // No SEO page for this slug — fall through to origin (404.html will redirect)
      return fetch(request);
    }

    return new Response(await res.text(), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch {
    return fetch(request);
  }
});
