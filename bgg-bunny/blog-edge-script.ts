/**
 * Blog API - Bunny Edge Script
 *
 * Admin-managed blog posts stored in Bunny Database; Hugo CI fetches published posts.
 *
 * Bunny Dashboard → Env Configuration:
 *   - BUNNY_DATABASE_URL
 *   - BUNNY_DATABASE_AUTH_TOKEN
 *   - BLOG_BUILD_SECRET          (CI: GET /internal/blog/published)
 *   - GITHUB_DEPLOY_TOKEN        (repository_dispatch on publish)
 *   - GITHUB_REPO                (optional, default nickcalamaro/DiceBastion)
 *   - WORKER_API_URL             (admin session verify + Google indexing proxy)
 *   - ADMIN_KEY                  (optional legacy admin key fallback)
 *
 * Endpoints:
 *   GET    /admin/blog/posts
 *   POST   /admin/blog/posts
 *   GET    /admin/blog/posts/:id
 *   PUT    /admin/blog/posts/:id
 *   DELETE /admin/blog/posts/:id
 *   GET    /admin/blog/taxonomy-terms
 *   GET    /internal/blog/published
 */

/// <reference types="@bunny.net/edgescript-sdk" />

import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { createClient } from "@libsql/client/web";

const client = createClient({
  url: process.env.BUNNY_DATABASE_URL,
  authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN,
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Session-Token, X-Admin-Key, X-Build-Secret",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function parseJsonArray(val: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function serializeJsonArray(arr: unknown): string {
  return JSON.stringify(Array.isArray(arr) ? arr.filter(Boolean) : []);
}

function mapBlogPostRow(row: Record<string, unknown>) {
  return {
    ...row,
    tags: parseJsonArray(row.tags),
    categories: parseJsonArray(row.categories),
    series: parseJsonArray(row.series),
    authors: parseJsonArray(row.authors),
  };
}

function cleanBlogBody(html: unknown): string {
  if (!html) return "";
  return String(html)
    .replace(/ data-card="[^"]*"/g, "")
    .replace(/ contenteditable="[^"]*"/g, "")
    .replace(/ class="ql-[^"]*"/g, "")
    .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, "");
}

let migrated = false;

function dbConfigError(): Response | null {
  if (!process.env.BUNNY_DATABASE_URL || !process.env.BUNNY_DATABASE_AUTH_TOKEN) {
    return jsonResponse({
      error: "database_not_configured",
      message: "Set BUNNY_DATABASE_URL and BUNNY_DATABASE_AUTH_TOKEN in this script's Env Configuration (copy from the bookings script).",
    }, 503);
  }
  return null;
}

function formatDbError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("401") || msg.includes("Unauthorized")) {
    return "Bunny Database auth failed — check BUNNY_DATABASE_URL and BUNNY_DATABASE_AUTH_TOKEN on script 75941.";
  }
  return msg;
}

async function migrateBlogPosts(): Promise<void> {
  if (migrated) return;
  await client.execute(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL DEFAULT '',
      html TEXT NOT NULL DEFAULT '',
      excerpt TEXT,
      featured_image TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      categories TEXT NOT NULL DEFAULT '[]',
      series TEXT NOT NULL DEFAULT '[]',
      authors TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK(status IN ('draft','published')),
      published_at TEXT,
      seo_description TEXT,
      seo_image TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS blog_authors (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT,
      bio TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at)`);
  migrated = true;
}

async function upsertBlogAuthors(authorMeta: Record<string, { name?: string; image?: string | null; bio?: string | null }> | undefined): Promise<void> {
  if (!authorMeta || typeof authorMeta !== "object") return;
  for (const [slug, profile] of Object.entries(authorMeta)) {
    const key = String(slug || "").trim();
    if (!key || !profile?.name) continue;
    await client.execute({
      sql: `
        INSERT INTO blog_authors (slug, name, image, bio)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          name = excluded.name,
          image = COALESCE(excluded.image, blog_authors.image),
          bio = COALESCE(excluded.bio, blog_authors.bio),
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      `,
      args: [key, String(profile.name).trim(), profile.image || null, profile.bio || null],
    });
  }
}

async function triggerBlogPublishDeploy(): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.GITHUB_DEPLOY_TOKEN;
  if (!token) {
    console.warn("[Blog] GITHUB_DEPLOY_TOKEN not configured");
    return { ok: false, error: "github_token_not_configured" };
  }
  const repo = process.env.GITHUB_REPO || "nickcalamaro/DiceBastion";
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "dicebastion-blog-bunny",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event_type: "blog-published" }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("[Blog] GitHub dispatch failed:", res.status, text);
      return { ok: false, error: "dispatch_failed" };
    }
    return { ok: true };
  } catch (error) {
    console.error("[Blog] GitHub dispatch error:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function requireAdmin(request: Request): Promise<Response | null> {
  const adminKey = request.headers.get("X-Admin-Key");
  if (adminKey && adminKey === process.env.ADMIN_KEY) return null;

  const sessionToken = request.headers.get("X-Session-Token");
  if (!sessionToken) return jsonResponse({ error: "unauthorized" }, 401);

  const workerUrl = (process.env.WORKER_API_URL || "https://dicebastion-memberships.ncalamaro.workers.dev").replace(/\/+$/, "");
  try {
    const res = await fetch(`${workerUrl}/admin/verify`, {
      headers: { "X-Session-Token": sessionToken },
    });
    if (!res.ok) return jsonResponse({ error: "unauthorized" }, 401);
    return null;
  } catch (error) {
    console.error("[Blog] admin verify error:", error);
    return jsonResponse({ error: "unauthorized" }, 401);
  }
}

async function notifyGoogleIndexing(request: Request, slug: string): Promise<void> {
  const sessionToken = request.headers.get("X-Session-Token");
  if (!sessionToken) return;
  const workerUrl = (process.env.WORKER_API_URL || "https://dicebastion-memberships.ncalamaro.workers.dev").replace(/\/+$/, "");
  try {
    await fetch(`${workerUrl}/admin/indexing/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Token": sessionToken,
      },
      body: JSON.stringify({
        url: `https://dicebastion.com/posts/${encodeURIComponent(slug)}/`,
        type: "URL_UPDATED",
      }),
    });
  } catch (error) {
    console.error("[Blog] indexing notify error:", error);
  }
}

async function listPosts(url: URL): Promise<Response> {
  await migrateBlogPosts();
  const status = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  let countSql = "SELECT COUNT(*) as total FROM blog_posts";
  let listSql = `
    SELECT id, slug, title, excerpt, featured_image, tags, categories, series, authors,
           status, published_at, seo_description, seo_image, created_at, updated_at
    FROM blog_posts
  `;
  const args: unknown[] = [];
  if (status === "draft" || status === "published") {
    countSql += " WHERE status = ?";
    listSql += " WHERE status = ?";
    args.push(status);
  }
  listSql += " ORDER BY COALESCE(published_at, updated_at, created_at) DESC LIMIT ? OFFSET ?";

  const countResult = await client.execute({ sql: countSql, args });
  const listResult = await client.execute({ sql: listSql, args: [...args, limit, offset] });

  return jsonResponse({
    posts: listResult.rows.map((row) => mapBlogPostRow(row as Record<string, unknown>)),
    total: Number(countResult.rows[0]?.total || 0),
    page,
    limit,
  });
}

async function createPost(request: Request): Promise<Response> {
  await migrateBlogPosts();
  const body = await request.json() as Record<string, unknown>;
  const slug = String(body.slug || "").trim();
  const title = String(body.title || "").trim();
  if (!slug || !title) return jsonResponse({ error: "slug_and_title_required" }, 400);

  try {
    await client.execute({
      sql: `
        INSERT INTO blog_posts (
          slug, title, html, excerpt, featured_image, tags, categories, series, authors,
          status, published_at, seo_description, seo_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        slug,
        title,
        body.html ?? "",
        body.excerpt || null,
        body.featured_image || null,
        serializeJsonArray(body.tags),
        serializeJsonArray(body.categories),
        serializeJsonArray(body.series),
        serializeJsonArray(body.authors),
        body.status === "published" ? "published" : "draft",
        body.published_at || null,
        body.seo_description || null,
        body.seo_image || null,
      ],
    });
  } catch (error) {
    if (String(error).includes("UNIQUE constraint")) {
      return jsonResponse({ error: "slug_already_exists" }, 400);
    }
    throw error;
  }

  const idResult = await client.execute("SELECT last_insert_rowid() as id");
  const id = Number(idResult.rows[0]?.id);

  await upsertBlogAuthors(body.author_meta as Record<string, { name?: string; image?: string | null; bio?: string | null }>);

  if (body.status === "published") {
    if (!String(body.html || "").trim()) return jsonResponse({ error: "body_required_for_publish" }, 400);
    await client.execute({
      sql: `UPDATE blog_posts SET published_at = COALESCE(published_at, ?) WHERE id = ?`,
      args: [nowIso(), id],
    });
    await notifyGoogleIndexing(request, slug);
    triggerBlogPublishDeploy().catch((err) => console.error("[Blog] deploy trigger failed:", err));
  }

  return jsonResponse({ id, success: true }, 201);
}

async function getPost(id: string): Promise<Response> {
  await migrateBlogPosts();
  const result = await client.execute({
    sql: "SELECT * FROM blog_posts WHERE id = ?",
    args: [id],
  });
  if (result.rows.length === 0) return jsonResponse({ error: "Not found" }, 404);
  return jsonResponse(mapBlogPostRow(result.rows[0] as Record<string, unknown>));
}

async function updatePost(id: string, request: Request): Promise<Response> {
  await migrateBlogPosts();
  const existingResult = await client.execute({
    sql: "SELECT id, slug, status, published_at FROM blog_posts WHERE id = ?",
    args: [id],
  });
  if (existingResult.rows.length === 0) return jsonResponse({ error: "Not found" }, 404);
  const existing = existingResult.rows[0] as Record<string, unknown>;

  const body = await request.json() as Record<string, unknown>;
  const nextStatus = body.status !== undefined ? body.status : existing.status;
  const slug = body.slug !== undefined ? String(body.slug).trim() : String(existing.slug);
  const title = body.title !== undefined ? String(body.title).trim() : undefined;

  if (body.slug !== undefined && !slug) return jsonResponse({ error: "slug_required" }, 400);
  if (body.title !== undefined && !title) return jsonResponse({ error: "title_required" }, 400);

  if (nextStatus === "published") {
    let html = body.html;
    if (html === undefined) {
      const htmlResult = await client.execute({
        sql: "SELECT html FROM blog_posts WHERE id = ?",
        args: [id],
      });
      html = htmlResult.rows[0]?.html;
    }
    if (!String(html || "").trim()) return jsonResponse({ error: "body_required_for_publish" }, 400);
  }

  const setClauses: string[] = [];
  const args: unknown[] = [];
  if (body.slug !== undefined) { setClauses.push("slug = ?"); args.push(slug); }
  if (body.title !== undefined) { setClauses.push("title = ?"); args.push(title); }
  if (body.html !== undefined) { setClauses.push("html = ?"); args.push(body.html); }
  if (body.excerpt !== undefined) { setClauses.push("excerpt = ?"); args.push(body.excerpt || null); }
  if (body.featured_image !== undefined) { setClauses.push("featured_image = ?"); args.push(body.featured_image || null); }
  if (body.tags !== undefined) { setClauses.push("tags = ?"); args.push(serializeJsonArray(body.tags)); }
  if (body.categories !== undefined) { setClauses.push("categories = ?"); args.push(serializeJsonArray(body.categories)); }
  if (body.series !== undefined) { setClauses.push("series = ?"); args.push(serializeJsonArray(body.series)); }
  if (body.authors !== undefined) { setClauses.push("authors = ?"); args.push(serializeJsonArray(body.authors)); }
  if (body.seo_description !== undefined) { setClauses.push("seo_description = ?"); args.push(body.seo_description || null); }
  if (body.seo_image !== undefined) { setClauses.push("seo_image = ?"); args.push(body.seo_image || null); }
  if (body.status !== undefined) { setClauses.push("status = ?"); args.push(nextStatus); }
  if (body.published_at !== undefined) { setClauses.push("published_at = ?"); args.push(body.published_at || null); }

  const wasPublished = existing.status === "published";
  const nowPublished = nextStatus === "published";
  if (nowPublished && !existing.published_at && body.published_at === undefined) {
    setClauses.push("published_at = ?");
    args.push(nowIso());
  }

  if (setClauses.length === 0 && !body.author_meta) {
    return jsonResponse({ error: "No fields to update" }, 400);
  }

  if (setClauses.length > 0) {
    setClauses.push("updated_at = ?");
    args.push(nowIso(), id);
    try {
      await client.execute({
        sql: `UPDATE blog_posts SET ${setClauses.join(", ")} WHERE id = ?`,
        args,
      });
    } catch (error) {
      if (String(error).includes("UNIQUE constraint")) {
        return jsonResponse({ error: "slug_already_exists" }, 400);
      }
      throw error;
    }
  }

  await upsertBlogAuthors(body.author_meta as Record<string, { name?: string; image?: string | null; bio?: string | null }>);

  const publishStateChanged = wasPublished !== nowPublished;
  const contentChangedWhilePublished = nowPublished && (
    body.html !== undefined ||
    body.slug !== undefined ||
    body.title !== undefined ||
    body.tags !== undefined ||
    body.categories !== undefined ||
    body.series !== undefined ||
    body.authors !== undefined ||
    body.featured_image !== undefined ||
    body.excerpt !== undefined ||
    body.seo_description !== undefined ||
    body.seo_image !== undefined ||
    body.published_at !== undefined
  );

  if (nowPublished && (publishStateChanged || contentChangedWhilePublished)) {
    await notifyGoogleIndexing(request, slug);
    triggerBlogPublishDeploy().catch((err) => console.error("[Blog] deploy trigger failed:", err));
  }

  return jsonResponse({ success: true });
}

async function deletePost(id: string): Promise<Response> {
  await migrateBlogPosts();
  const existingResult = await client.execute({
    sql: "SELECT id, status FROM blog_posts WHERE id = ?",
    args: [id],
  });
  if (existingResult.rows.length === 0) return jsonResponse({ error: "Not found" }, 404);
  if (existingResult.rows[0]?.status === "published") {
    return jsonResponse({ error: "unpublish_before_delete" }, 400);
  }
  await client.execute({ sql: "DELETE FROM blog_posts WHERE id = ?", args: [id] });
  return jsonResponse({ success: true });
}

async function taxonomyTerms(): Promise<Response> {
  await migrateBlogPosts();
  const result = await client.execute("SELECT tags, categories, series, authors FROM blog_posts");
  const tags = new Set<string>();
  const categories = new Set<string>();
  const series = new Set<string>();
  const authors = new Set<string>();

  for (const row of result.rows) {
    for (const term of parseJsonArray((row as Record<string, unknown>).tags)) tags.add(term);
    for (const term of parseJsonArray((row as Record<string, unknown>).categories)) categories.add(term);
    for (const term of parseJsonArray((row as Record<string, unknown>).series)) series.add(term);
    for (const term of parseJsonArray((row as Record<string, unknown>).authors)) authors.add(term);
  }

  const authorProfilesResult = await client.execute(
    "SELECT slug, name, image, bio FROM blog_authors ORDER BY name"
  );

  return jsonResponse({
    tags: [...tags].sort((a, b) => a.localeCompare(b)),
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
    series: [...series].sort((a, b) => a.localeCompare(b)),
    authors: [...authors].sort((a, b) => a.localeCompare(b)),
    authorProfiles: authorProfilesResult.rows,
  });
}

async function publishedPosts(request: Request): Promise<Response> {
  const secret = request.headers.get("X-Build-Secret");
  if (!process.env.BLOG_BUILD_SECRET || secret !== process.env.BLOG_BUILD_SECRET) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  const dbErr = dbConfigError();
  if (dbErr) return dbErr;

  await migrateBlogPosts();
  const postsResult = await client.execute(`
    SELECT id, slug, title, html, excerpt, featured_image, tags, categories, series, authors,
           published_at, seo_description, seo_image
    FROM blog_posts
    WHERE status = 'published'
    ORDER BY published_at DESC
  `);
  const authorsResult = await client.execute(
    "SELECT slug, name, image, bio FROM blog_authors ORDER BY slug"
  );

  return jsonResponse({
    posts: postsResult.rows.map((row) => ({
      ...mapBlogPostRow(row as Record<string, unknown>),
      html: cleanBlogBody((row as Record<string, unknown>).html),
    })),
    authors: authorsResult.rows,
  });
}

BunnySDK.net.http.serve(async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    if (path === "/internal/blog/published" && request.method === "GET") {
      return await publishedPosts(request);
    }

    if (path.startsWith("/admin/blog")) {
      const authError = await requireAdmin(request);
      if (authError) return authError;

      if (path === "/admin/blog/posts" && request.method === "GET") {
        return await listPosts(url);
      }
      if (path === "/admin/blog/posts" && request.method === "POST") {
        return await createPost(request);
      }
      if (path === "/admin/blog/taxonomy-terms" && request.method === "GET") {
        return await taxonomyTerms();
      }

      const postMatch = path.match(/^\/admin\/blog\/posts\/(\d+)$/);
      if (postMatch) {
        const id = postMatch[1];
        if (request.method === "GET") return await getPost(id);
        if (request.method === "PUT") return await updatePost(id, request);
        if (request.method === "DELETE") return await deletePost(id);
      }
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (error) {
    console.error("[Blog] request error:", error);
    const message = formatDbError(error);
    const status = message.includes("Bunny Database auth failed") ? 503 : 500;
    return jsonResponse({ error: message }, status);
  }
});
