/**
 * Blog API - Bunny Edge Script
 *
 * Admin-managed blog posts in Bunny Database; publish renders HTML to Storage + CDN purge.
 *
 * Bunny Dashboard → Env Configuration:
 *   - BUNNY_DATABASE_URL
 *   - BUNNY_DATABASE_AUTH_TOKEN
 *   - BUNNY_STORAGE_ZONE          (default dicebastion)
 *   - BUNNY_STORAGE_API_KEY
 *   - BUNNY_CDN_URL               (e.g. https://dicebastion.b-cdn.net)
 *   - BUNNY_PULL_ZONE_ID
 *   - BUNNY_API_KEY               (account API key for CDN purge)
 *   - SITE_URL                    (default https://dicebastion.com)
 *   - WORKER_API_URL              (admin session verify + Google indexing proxy)
 *   - ADMIN_KEY                   (optional legacy admin key fallback)
 *
 * Endpoints:
 *   GET    /admin/blog/posts
 *   POST   /admin/blog/posts
 *   GET    /admin/blog/posts/:id
 *   PUT    /admin/blog/posts/:id
 *   DELETE /admin/blog/posts/:id
 *   POST   /admin/blog/sync-cdn
 *   GET    /admin/blog/authors
 *   GET    /admin/blog/authors/:slug
 *   PUT    /admin/blog/authors/:slug
 *   DELETE /admin/blog/authors/:slug
 */

/// <reference types="@bunny.net/edgescript-sdk" />

import * as BunnySDK from "@bunny.net/edgescript-sdk";
import { createClient } from "@libsql/client/web";
import {
  blogPublicPath,
  blogSiteUrl,
  deleteStorageFile,
  purgeBlogPaths,
  uploadStorageBinary,
  uploadStorageFile,
} from "./blog-cdn";
import {
  buildTaxonomyIndex,
  renderBlogAuthorPage,
  renderBlogListPage,
  renderBlogPostPage,
  renderBlogSitemap,
  renderBlogTagPage,
  type BlogAuthorProfile,
  type BlogPostRow,
} from "./blog-html";

const client = createClient({
  url: String(process.env.BUNNY_DATABASE_URL || "").trim(),
  authToken: String(process.env.BUNNY_DATABASE_AUTH_TOKEN || "").trim(),
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
  let out = String(html)
    .replace(/ data-card="[^"]*"/g, "")
    .replace(/ contenteditable="[^"]*"/g, "")
    .replace(/ class="ql-[^"]*"/g, "")
    .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, "");
  if (out.includes("style=")) {
    out = out.replace(/\sstyle=(["'])([\s\S]*?)\1/gi, (_match, quote: string, styles: string) => {
      const cleaned = styles
        .split(";")
        .map((chunk) => chunk.trim())
        .filter((chunk) => {
          if (!chunk) return false;
          const prop = chunk.split(":")[0]?.trim().toLowerCase() || "";
          return prop !== "color" && prop !== "background" && prop !== "background-color";
        })
        .join("; ");
      return cleaned ? ` style=${quote}${cleaned}${quote}` : "";
    });
  }
  return out;
}

let migrated = false;

function dbConfigError(): Response | null {
  const url = String(process.env.BUNNY_DATABASE_URL || "").trim();
  const token = String(process.env.BUNNY_DATABASE_AUTH_TOKEN || "").trim();
  if (!url || !token) {
    return jsonResponse({
      error: "database_not_configured",
      message: "Set BUNNY_DATABASE_URL and BUNNY_DATABASE_AUTH_TOKEN on blog script 75941 (copy exact values from bookings script 63643 → Env Configuration).",
    }, 503);
  }
  return null;
}

async function checkDatabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  const configError = dbConfigError();
  if (configError) {
    const body = await configError.json() as { message?: string };
    return { ok: false, error: body.message || "database_not_configured" };
  }
  try {
    await client.execute("SELECT 1 AS ok");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: formatDbError(error) };
  }
}

function formatDbError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  // libSQL auth failures — do not confuse with Bunny Storage 401s (handled separately)
  if (
    (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("authentication failed")) &&
    !msg.includes("Storage upload failed") &&
    !msg.includes("Storage delete")
  ) {
    return "Bunny Database auth failed — check BUNNY_DATABASE_URL and BUNNY_DATABASE_AUTH_TOKEN on script 75941.";
  }
  return msg;
}

function formatRequestError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("Storage upload failed") && msg.includes("401")) {
    return "Bunny Storage upload rejected (401) — check BUNNY_STORAGE_API_KEY on script 75941 (use the storage zone FTP/API password, not the account API key).";
  }
  if (msg.includes("BUNNY_STORAGE_API_KEY")) {
    return msg;
  }
  return formatDbError(error);
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
  for (const column of ["featured_image_card TEXT", "featured_image_hero TEXT"]) {
    try {
      await client.execute(`ALTER TABLE blog_posts ADD COLUMN ${column}`);
    } catch {
      /* column already exists */
    }
  }
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

async function fetchAuthorMap(): Promise<Record<string, BlogAuthorProfile>> {
  const result = await client.execute("SELECT slug, name, image, bio FROM blog_authors");
  const map: Record<string, BlogAuthorProfile> = {};
  for (const row of result.rows) {
    const r = row as Record<string, unknown>;
    map[String(r.slug)] = {
      slug: String(r.slug),
      name: String(r.name),
      image: (r.image as string) || null,
      bio: (r.bio as string) || null,
    };
  }
  return map;
}

async function fetchPublishedPostsForRender(): Promise<BlogPostRow[]> {
  const result = await client.execute(`
    SELECT slug, title, html, excerpt, featured_image, featured_image_card, featured_image_hero,
           tags, categories, series, authors, published_at, seo_description, seo_image, updated_at
    FROM blog_posts
    WHERE status = 'published'
    ORDER BY published_at DESC
  `);
  return result.rows.map((row) => {
    const mapped = mapBlogPostRow(row as Record<string, unknown>) as BlogPostRow;
    mapped.html = cleanBlogBody((row as Record<string, unknown>).html);
    return mapped;
  });
}

async function syncPublishedBlogToCdn(options?: { deleteSlugs?: string[] }): Promise<{ posts: number }> {
  if (!process.env.BUNNY_STORAGE_API_KEY) {
    throw new Error("BUNNY_STORAGE_API_KEY is not set on the blog script — blog pages cannot be uploaded to CDN");
  }

  await migrateBlogPosts();
  const siteUrl = blogSiteUrl();
  const posts = await fetchPublishedPostsForRender();
  const authors = await fetchAuthorMap();
  const taxonomy = buildTaxonomyIndex(posts, authors);
  const purgePaths = ["blog/posts/index.html", "blog/posts/sitemap.xml"];

  await uploadStorageFile(
    "blog/posts/index.html",
    renderBlogListPage(posts, authors, siteUrl),
    "text/html; charset=utf-8"
  );
  await uploadStorageFile(
    "blog/posts/sitemap.xml",
    renderBlogSitemap(posts, authors, siteUrl),
    "application/xml; charset=utf-8"
  );

  for (const post of posts) {
    const path = `blog/posts/${post.slug}/index.html`;
    await uploadStorageFile(
      path,
      renderBlogPostPage(post, authors, siteUrl, posts),
      "text/html; charset=utf-8"
    );
    purgePaths.push(path);
  }

  for (const tag of taxonomy.tags) {
    const path = `blog/posts/tag/${tag.slug}/index.html`;
    await uploadStorageFile(
      path,
      renderBlogTagPage(tag.slug, posts, authors, siteUrl),
      "text/html; charset=utf-8"
    );
    purgePaths.push(path);
  }

  for (const author of taxonomy.authors) {
    const path = `blog/posts/author/${author.slug}/index.html`;
    await uploadStorageFile(
      path,
      renderBlogAuthorPage(author.slug, posts, authors, siteUrl),
      "text/html; charset=utf-8"
    );
    purgePaths.push(path);
  }

  for (const slug of options?.deleteSlugs || []) {
    if (!slug) continue;
    const path = `blog/posts/${slug}/index.html`;
    await deleteStorageFile(path);
    purgePaths.push(path);
  }

  await purgeBlogPaths(purgePaths);
  return { posts: posts.length };
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
    SELECT id, slug, title, excerpt, featured_image, featured_image_card, featured_image_hero,
           tags, categories, series, authors,
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
          slug, title, html, excerpt, featured_image, featured_image_card, featured_image_hero,
          tags, categories, series, authors,
          status, published_at, seo_description, seo_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        slug,
        title,
        body.html ?? "",
        body.excerpt || null,
        body.featured_image || null,
        body.featured_image_card || null,
        body.featured_image_hero || null,
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
    try {
      await syncPublishedBlogToCdn();
    } catch (err) {
      console.error("[Blog] CDN sync failed:", err);
      return jsonResponse({ error: String(err instanceof Error ? err.message : err) }, 502);
    }
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
  if (body.featured_image_card !== undefined) { setClauses.push("featured_image_card = ?"); args.push(body.featured_image_card || null); }
  if (body.featured_image_hero !== undefined) { setClauses.push("featured_image_hero = ?"); args.push(body.featured_image_hero || null); }
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
    body.featured_image_card !== undefined ||
    body.featured_image_hero !== undefined ||
    body.excerpt !== undefined ||
    body.seo_description !== undefined ||
    body.seo_image !== undefined ||
    body.published_at !== undefined
  );

  const oldSlug = String(existing.slug);
  const slugChanged = body.slug !== undefined && oldSlug !== slug;

  if (nowPublished && (publishStateChanged || contentChangedWhilePublished)) {
    await notifyGoogleIndexing(request, slug);
    const deleteSlugs = slugChanged ? [oldSlug] : [];
    try {
      await syncPublishedBlogToCdn({ deleteSlugs });
    } catch (err) {
      console.error("[Blog] CDN sync failed:", err);
      return jsonResponse({ error: String(err instanceof Error ? err.message : err) }, 502);
    }
  } else if (wasPublished && !nowPublished) {
    try {
      await syncPublishedBlogToCdn({ deleteSlugs: [oldSlug] });
    } catch (err) {
      console.error("[Blog] CDN sync failed:", err);
      return jsonResponse({ error: String(err instanceof Error ? err.message : err) }, 502);
    }
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

function sanitizeBlogImageSegment(value: unknown, fallback: string): string {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\/+|\/+$/g, "");
  return cleaned || fallback;
}

function sanitizeBlogImageFilename(value: unknown): string {
  const cleaned = String(value || "image.jpg")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!cleaned) return "image.jpg";
  return cleaned.toLowerCase().endsWith(".jpg") || cleaned.toLowerCase().endsWith(".jpeg")
    ? cleaned
    : `${cleaned}.jpg`;
}

async function listAuthorsAdmin(): Promise<Response> {
  await migrateBlogPosts();
  const result = await client.execute(
    "SELECT slug, name, image, bio, created_at, updated_at FROM blog_authors ORDER BY name"
  );
  return jsonResponse({
    authors: result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        slug: String(r.slug),
        name: String(r.name),
        image: (r.image as string) || null,
        bio: (r.bio as string) || null,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    }),
  });
}

async function getAuthorAdmin(slug: string): Promise<Response> {
  await migrateBlogPosts();
  const result = await client.execute({
    sql: "SELECT slug, name, image, bio, created_at, updated_at FROM blog_authors WHERE slug = ?",
    args: [slug],
  });
  if (result.rows.length === 0) return jsonResponse({ error: "Not found" }, 404);
  const r = result.rows[0] as Record<string, unknown>;
  return jsonResponse({
    slug: String(r.slug),
    name: String(r.name),
    image: (r.image as string) || null,
    bio: (r.bio as string) || null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  });
}

async function saveAuthorAdmin(slug: string, request: Request): Promise<Response> {
  await migrateBlogPosts();
  const key = String(slug || "").trim();
  if (!key) return jsonResponse({ error: "slug_required" }, 400);

  const body = await request.json() as { name?: string; image?: string | null; bio?: string | null };
  const name = String(body.name || "").trim();
  if (!name) return jsonResponse({ error: "name_required" }, 400);

  await client.execute({
    sql: `
      INSERT INTO blog_authors (slug, name, image, bio)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        image = excluded.image,
        bio = excluded.bio,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    `,
    args: [key, name, body.image ?? null, body.bio ?? null],
  });

  try {
    await syncPublishedBlogToCdn();
  } catch (err) {
    console.error("[Blog] CDN sync after author save failed:", err);
    return jsonResponse({ error: String(err instanceof Error ? err.message : err) }, 502);
  }

  return jsonResponse({ success: true, slug: key });
}

async function deleteAuthorAdmin(slug: string): Promise<Response> {
  await migrateBlogPosts();
  const key = String(slug || "").trim();
  if (!key) return jsonResponse({ error: "slug_required" }, 400);

  await client.execute({
    sql: "DELETE FROM blog_authors WHERE slug = ?",
    args: [key],
  });

  try {
    await syncPublishedBlogToCdn();
  } catch (err) {
    console.error("[Blog] CDN sync after author delete failed:", err);
  }

  return jsonResponse({ success: true });
}

async function uploadBlogImage(request: Request): Promise<Response> {
  if (!process.env.BUNNY_STORAGE_API_KEY) {
    return jsonResponse({ error: "storage_not_configured", message: "BUNNY_STORAGE_API_KEY not set" }, 500);
  }

  const body = await request.json() as { image?: string; filename?: string; subpath?: string };
  const image = String(body.image || "").trim();
  if (!image) return jsonResponse({ error: "missing_image" }, 400);

  const subpath = sanitizeBlogImageSegment(body.subpath, "misc");
  const filename = sanitizeBlogImageFilename(body.filename);
  const storagePath = `blog/images/${subpath}/${Date.now()}-${filename}`;

  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  let binary: Uint8Array;
  try {
    binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  } catch {
    return jsonResponse({ error: "invalid_image_data" }, 400);
  }

  if (binary.length === 0) return jsonResponse({ error: "empty_image" }, 400);
  if (binary.length > 8 * 1024 * 1024) return jsonResponse({ error: "image_too_large" }, 413);

  await uploadStorageBinary(storagePath, binary, "image/jpeg");
  await purgeBlogPaths([storagePath]);

  return jsonResponse({
    success: true,
    url: blogPublicPath(storagePath),
    key: storagePath,
  });
}

BunnySDK.net.http.serve(async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    if (path.startsWith("/admin/blog")) {
      const authError = await requireAdmin(request);
      if (authError) return authError;

      const dbError = dbConfigError();
      if (dbError && path !== "/admin/blog/health") return dbError;

      if (path === "/admin/blog/health" && request.method === "GET") {
        const db = await checkDatabaseConnection();
        return jsonResponse({
          database: db,
          storage: Boolean(String(process.env.BUNNY_STORAGE_API_KEY || "").trim()),
          cdnUrl: Boolean(String(process.env.BUNNY_CDN_URL || "").trim()),
          pullZoneId: Boolean(String(process.env.BUNNY_PULL_ZONE_ID || "").trim()),
          bunnyApiKey: Boolean(String(process.env.BUNNY_API_KEY || "").trim()),
        });
      }

      if (path === "/admin/blog/posts" && request.method === "GET") {
        return await listPosts(url);
      }
      if (path === "/admin/blog/posts" && request.method === "POST") {
        return await createPost(request);
      }
      if (path === "/admin/blog/taxonomy-terms" && request.method === "GET") {
        return await taxonomyTerms();
      }
      if (path === "/admin/blog/sync-cdn" && request.method === "POST") {
        const result = await syncPublishedBlogToCdn();
        return jsonResponse({ success: true, ...result });
      }
      if (path === "/admin/blog/images" && request.method === "POST") {
        return await uploadBlogImage(request);
      }

      if (path === "/admin/blog/authors" && request.method === "GET") {
        return await listAuthorsAdmin();
      }

      const authorMatch = path.match(/^\/admin\/blog\/authors\/([^/]+)$/);
      if (authorMatch) {
        const authorSlug = decodeURIComponent(authorMatch[1]);
        if (request.method === "GET") return await getAuthorAdmin(authorSlug);
        if (request.method === "PUT") return await saveAuthorAdmin(authorSlug, request);
        if (request.method === "DELETE") return await deleteAuthorAdmin(authorSlug);
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
    const message = formatRequestError(error);
    const status = message.includes("auth failed") || message.includes("rejected (401)") ? 503 : 500;
    return jsonResponse({ error: message }, status);
  }
});
