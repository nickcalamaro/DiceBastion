---
applyTo: '**'
---

# Architecture & Platform Reference

This file documents every technical convention, pattern, and service in the DiceBastion platform.
It is the single source of truth for how edge scripts, databases, deployments, and services work.
Consult this file before writing any new code.

---

## 1. Bunny.net Edge Scripts

### 1.1 What They Are

Bunny.net edge scripts are serverless functions that run on Bunny's global CDN edge.
They intercept HTTP requests to a Pull Zone and return dynamic responses.
They are the bunny.net equivalent of Cloudflare Workers.

### 1.2 Two Runtime Styles (Legacy vs Modern)

**Legacy style** (plain JS, `addEventListener('fetch', ...)`)
Used in: `bgg-bunny/edge-script.js`
```js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
```
- No imports, no TypeScript, no SDK reference.
- Environment variables via `BunnyEdge.getEnvironmentVariable('KEY')`.
- Suitable for simple passthrough/proxy scripts.

**Modern style** (TypeScript + BunnySDK)
Used in: `emails-edge-script.ts`, `bookings-edge-script.ts`, `board-games-api.ts`
```ts
/// <reference types="@bunny.net/edgescript-sdk" />
import * as BunnySDK from "@bunny.net/edgescript-sdk";

BunnySDK.net.http.serve(async (request: Request): Promise<Response> => {
  // handle request
});
```
- Always add `/// <reference types="@bunny.net/edgescript-sdk" />` at the top.
- Always import `* as BunnySDK from "@bunny.net/edgescript-sdk"`.
- The entry point is always `BunnySDK.net.http.serve(async (request) => { ... })`.
- Environment variables via `process.env.VARIABLE_NAME`.
- TypeScript is compiled with esbuild before deploy; the SDK is external.
- **All new edge scripts must use this modern style.**

### 1.3 Routing Pattern

Bunny edge scripts do NOT use a router framework. Routing is manual path + method matching:

```ts
BunnySDK.net.http.serve(async (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight — always handle first
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // Exact path match
    if (path === "/api/things" && request.method === "GET") {
      return await listThings();
    }

    // Dynamic path match (use regex)
    if (path.match(/^\/api\/things\/\d+$/) && request.method === "GET") {
      const id = path.split("/").pop();
      return await getThing(id!);
    }

    // Default 404
    return jsonResponse({ error: "Not found" }, 404);
  } catch (error) {
    console.error("Error handling request:", error);
    return jsonResponse({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});
```

Key conventions:
- Strip trailing slash: `url.pathname.replace(/\/$/, '')` (used in emails script).
- Dynamic segments extracted via `path.split("/").pop()` or regex capture.
- Wrap the entire routing block in try/catch with a generic 500 fallback.

### 1.4 CORS Pattern

Every edge script defines a shared CORS_HEADERS object and returns it on all responses:

```ts
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
```

OPTIONS preflight returns 204 with these headers. All JSON responses spread them in.

### 1.5 JSON Response Helper

Every edge script defines this helper (copy it exactly for consistency):

```ts
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
```

### 1.6 Authentication Patterns

**Bearer token auth** (board-games-api.ts):
```ts
function requireAuth(request: Request): boolean {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) return false;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  return authHeader.substring(7) === apiKey;
}
```

**Internal service-to-service auth** (payments-worker):
```ts
// Header: X-Internal-Secret: <shared_secret>
// Validated with constant-time comparison to prevent timing attacks
```

### 1.7 Build & Deploy

**Build command** (TypeScript edge scripts):
```bash
esbuild <script>.ts --bundle --format=esm --outfile=dist/index.js --platform=browser --target=es2022 --external:@bunny.net/edgescript-sdk
```
- `--format=esm` is required (Bunny runs ESM).
- `--platform=browser` because there's no Node.js runtime.
- `--external:@bunny.net/edgescript-sdk` because the SDK is provided by the runtime.
- `--target=es2022` for modern JS features.

**Deploy command** (via GitHub Actions — preferred):
Use the `BunnyWay/actions/deploy-script@main` GitHub Action. It supports three auth modes:
1. **OIDC** (recommended): link the GitHub repo to the Bunny script in the Dashboard. No secrets needed — the action uses `core.getIDToken()`. Requires `permissions: id-token: write`.
2. **deploy_key**: script deployment key from Dashboard > Script > Deployments > Settings.
3. **api_key**: Bunny account API key.

DiceBastion uses OIDC with hardcoded `script_id` integers:
```yaml
permissions:
  id-token: write
  contents: read

- name: Publish Script to Bunny
  uses: "BunnyWay/actions/deploy-script@main"
  with:
    script_id: 61994  # hardcoded, not a secret
    file: "dist/board-games.js"
```

Legacy deploy scripts also exist in `bgg-bunny/deploy.ps1` and `bgg-bunny/deploy.sh`.

Edge scripts are standalone entities with their own IDs. They can be linked to one or more Pull Zones for serving, but the script itself is independent.

---

## 2. Bunny.net Database (libSQL / Turso)

### 2.1 Connection Pattern

Bunny Database is a hosted libSQL instance (Turso-compatible). Connect using `@libsql/client/web`:

```ts
import { createClient } from "@libsql/client/web";

const client = createClient({
  url: process.env.BUNNY_DATABASE_URL,       // e.g. libsql://your-db.turso.io
  authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN,
});
```

- Always import from `@libsql/client/web` (NOT `@libsql/client`) — the `/web` variant uses HTTP and works in edge runtimes that lack TCP sockets.
- The client is created at module scope (outside the request handler) for connection reuse.
- `BUNNY_DATABASE_URL` and `BUNNY_DATABASE_AUTH_TOKEN` are set in the Bunny Dashboard per edge script (Env Configuration).

### 2.2 Query Patterns

**Simple query (no parameters):**
```ts
const result = await client.execute("SELECT * FROM things ORDER BY name ASC");
// result.rows is an array of row objects
// result.rowsAffected for INSERT/UPDATE/DELETE
```

**Parameterized query:**
```ts
const result = await client.execute({
  sql: "SELECT * FROM things WHERE id = ?",
  args: [id],
});
```

**Insert with last ID:**
```ts
const result = await client.execute({
  sql: "INSERT INTO things (name) VALUES (?)",
  args: [name],
});
const newId = Number(result.lastInsertRowid);
```

**Upsert pattern** (INSERT ... ON CONFLICT):
```ts
await client.execute({
  sql: `INSERT INTO board_games (id, name, image_url, synced_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          image_url = excluded.image_url,
          synced_at = excluded.synced_at,
          updated_at = excluded.updated_at`,
  args: [id, name, imageUrl, now, now],
});
```

### 2.3 Key Differences from Cloudflare D1

| Feature | Cloudflare D1 | Bunny Database (libSQL) |
|---------|--------------|------------------------|
| Import | Built-in `c.env.DB` binding | `import { createClient } from "@libsql/client/web"` |
| Prepare | `db.prepare(sql).bind(...args)` | `client.execute({ sql, args })` |
| Single row | `.first()` | `.execute(...)` then `result.rows[0]` |
| All rows | `.all()` then `result.results` | `.execute(...)` then `result.rows` |
| Last insert ID | `result.lastInsertRowid` via RETURNING | `result.lastInsertRowid` |
| Rows affected | N/A (use RETURNING) | `result.rowsAffected` |
| Batch/transaction | `db.batch([...])` | `client.batch([...], "write")` |

### 2.4 Migration Files

Migrations live in `bgg-bunny/migrations/` with numeric prefix naming:
```
0004_add_event_slugs.sql
0005_add_donations.sql
```

Use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` for idempotency.
All timestamps use ISO 8601 format: `strftime('%Y-%m-%dT%H:%M:%fZ','now')`.

---

## 3. Bunny.net Storage & CDN

### 3.1 Storage Upload Pattern

Upload files to Bunny Storage via PUT:
```ts
const storageUrl = `https://storage.bunnycdn.com/${STORAGE_ZONE}/${filePath}`;
const storageKey = process.env.BUNNY_STORAGE_API_KEY;

await fetch(storageUrl, {
  method: "PUT",
  headers: {
    "AccessKey": storageKey,
    "Content-Type": contentType,
  },
  body: fileBuffer,  // ArrayBuffer from fetch or FormData
});
```

### 3.2 Storage Read Pattern

Read from Bunny Storage API (server-side, with auth):
```ts
const storageUrl = `https://storage.bunnycdn.com/${STORAGE_ZONE}/${filePath}`;
const response = await fetch(storageUrl, {
  headers: { "AccessKey": storageKey }
});
```

### 3.3 CDN URLs

Files in Bunny Storage are served publicly via the linked Pull Zone CDN:
- Storage: `https://storage.bunnycdn.com/dicebastion/boardgames/images/123.jpg` (private, needs AccessKey)
- CDN: `https://dicebastion.b-cdn.net/boardgames/images/123.jpg` (public, cached globally)

DiceBastion also has an R2 public bucket at `https://pub-631ca6f207ca4661ac9cb2ba9371ba31.r2.dev` used for event/product images uploaded via the Cloudflare worker.

---

## 4. Existing Services Inventory

### 4.1 Bunny.net Edge Scripts (already on bunny.net)

| Script | File | Script ID | Database | Purpose |
|--------|------|-----------|----------|---------|
| Board Games API | `bgg-bunny/board-games-api.ts` | 61994 | Bunny DB | CRUD + BGG sync for board game library |
| Bookings API | `bgg-bunny/bookings-edge-script.ts` | 63643 | Bunny DB | Table booking system with payment integration |
| Email Service | `bgg-bunny/emails-edge-script.ts` | 63650 | None | Stateless email relay via MailerSend API |
| Legacy BGG | `bgg-bunny/edge-script.js` | (legacy) | None | Serves cached JSON from Bunny Storage |

### 4.2 Cloudflare Workers (to be migrated)

| Worker | File | Database | Purpose |
|--------|------|----------|---------|
| Main Worker | `worker/src/index.js` | Cloudflare D1 | ~85 endpoints: auth, memberships, events, products, admin, newsletter, donations, cron jobs |
| Payments Worker | `payments-worker/src/index.ts` | Cloudflare D1 | SumUp payment integration (checkout, tokenization, recurring charges) |

### 4.3 Inter-Service Communication

```
[Bookings Edge Script] ---POST /internal/checkout---> [Payments Worker (CF)]
                        ---POST /send--------------> [Email Service (Bunny)]

[Main Worker (CF)]     ---POST /internal/checkout---> [Payments Worker (CF)]
                       ---POST /internal/customer---> [Payments Worker (CF)]
                       ---POST /internal/charge-----> [Payments Worker (CF)]
                       ---direct MailerSend calls---> [MailerSend API]
```

Service-to-service calls use `X-Internal-Secret` header for auth (constant-time comparison).
The Bookings script already calls the email service over HTTP — this is the pattern to follow.

---

## 5. Cloudflare Worker Patterns (reference for migration)

### 5.1 Hono Framework

Both Cloudflare workers use Hono as the router:
```ts
import { Hono } from 'hono';
const app = new Hono<{ Bindings: Bindings }>();
app.get('/path', handler);
app.post('/path', handler);
```

Hono also works on Bunny edge, but the existing Bunny scripts use manual routing.
For the new SaaS platform, consider using Hono on Bunny for complex scripts (it works with the BunnySDK serve function).

### 5.2 Session Auth (Main Worker)

- Users log in via `/login` which creates a row in `user_sessions` table.
- Session token returned as JSON, stored client-side.
- Subsequent requests send `X-Session-Token` header.
- Admin endpoints verify `is_admin = 1` on the user.
- Sessions have `expires_at` and `last_activity` tracking.

### 5.3 Cron Jobs (Main Worker)

Triggered daily at 2 AM UTC via Cloudflare `scheduled` event:
- Auto-renewals (3-day warnings, charge attempts, expiry)
- Event reminders (24-hour advance)
- Delayed account setup emails
- SEO indexing (Google Indexing API, sitemap pings)

These will need a new trigger mechanism on Bunny (external cron service or Bunny's scheduled tasks).

### 5.4 Custom Fetch Handler (Main Worker)

The main worker has a custom `fetch` handler that intercepts requests by hostname:
- `shop.dicebastion.com` requests get injected product nav links for SEO crawlers.
- `dicebastion.com` requests get injected event nav links for SEO crawlers.
- Dynamic sitemaps are served at `/events/sitemap.xml` and `/products/sitemap.xml`.

---

## 6. Environment Variables Convention

### 6.1 Bunny Edge Scripts

Set in Bunny Dashboard per edge script (Edge Platform > Scripting > [script] > Env Configuration). Access via `process.env.VARIABLE_NAME`.

Common variables across scripts:
```
BUNNY_DATABASE_URL          — libSQL connection URL
BUNNY_DATABASE_AUTH_TOKEN   — libSQL auth token
BUNNY_STORAGE_API_KEY       — Storage zone password for uploads
ADMIN_API_KEY               — Bearer token for admin-protected endpoints
EMAIL_API_URL               — URL of the email service edge script
PAYMENTS_API_URL            — URL of the payments service
INTERNAL_SECRET             — Shared secret for service-to-service auth
MAILERSEND_API_KEY          — MailerSend API key (email service only)
```

### 6.2 Cloudflare Workers

Set in `wrangler.toml` + Cloudflare Dashboard. Access via `c.env.VARIABLE_NAME` (Hono context).

---

## 7. Email Sending Convention

All email sending goes through the dedicated Email Service edge script.
Other services call it via HTTP POST:

```ts
const response = await fetch(process.env.EMAIL_API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to_email: 'user@example.com',
    to_name: 'User Name',
    from_email: 'noreply@domain.com',
    from_name: 'Service Name',
    subject: 'Subject line',
    html: '<p>HTML body</p>',
    text: 'Plain text body (optional)',
    reply_to: 'reply@domain.com (optional)',
  }),
});
```

The email service uses MailerSend API (`https://api.mailersend.com/v1/email`).
MailerSend returns 202 Accepted with `X-Message-Id` header on success.

Email templates can be stored in the database (`email_templates` table with `template_key` lookup) or hardcoded as fallbacks. The bookings script uses both patterns — DB templates first, inline fallback if not found.

Template placeholders use `{{variable_name}}` syntax, replaced by `replacePlaceholders()` helper.

---

## 8. Payment Integration (SumUp)

### 8.1 OAuth Token

```ts
const params = new URLSearchParams({
  grant_type: 'client_credentials',  // or 'refresh_token' if SUMUP_REFRESH_TOKEN is set
  client_id: env.SUMUP_CLIENT_ID,
  client_secret: env.SUMUP_CLIENT_SECRET,
  scope: 'payments payment_instruments',
});
const res = await fetch('https://api.sumup.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: params,
});
```

### 8.2 Checkout Flow

1. Create checkout: `POST https://api.sumup.com/v0.1/checkouts`
2. Client completes payment on SumUp widget
3. Redirect to `return_url` with `orderRef` query param
4. Server confirms payment: `GET https://api.sumup.com/v0.1/checkouts/{id}`
5. Update DB status on success

### 8.3 Recurring Payments (Card Tokenization)

1. Create customer: `POST https://api.sumup.com/v0.1/customers`
   - Customer ID format: `USER-{userId}`
2. Create checkout with `purpose: "SETUP_RECURRING_PAYMENT"` and `customer_id`
3. After payment, save instrument from checkout response to `payment_instruments` table
4. Charge later: Create new checkout + PUT with `payment_type: "card"`, `token`, `customer_id`

---

## 9. Key Technical Constraints

1. **No TCP sockets in edge runtimes** — always use `@libsql/client/web` (HTTP transport), never `@libsql/client`.
2. **No Node.js APIs** — edge scripts run in a V8 isolate. No `fs`, `path`, `crypto` module (use Web Crypto API).
3. **Bundle size matters** — keep edge scripts lean. External the SDK, avoid heavy deps.
4. **Edge scripts are standalone** — each script has its own ID, env vars, and deployment. Scripts can be linked to Pull Zones for serving. To run multiple APIs, use separate scripts or route by path within a single script.
5. **Goldmark in Hugo .md files** — never put literal `</style>`, `</script>`, `</pre>`, `</textarea>` inside a `<script>` block. Split across string literals: `'</sty'+'le>'`.
6. **Timestamps** — always ISO 8601 (`new Date().toISOString()`). SQLite defaults use `strftime('%Y-%m-%dT%H:%M:%fZ','now')`.

---

## 10. NPM Package Dependencies

### Edge Scripts (bgg-bunny/package.json)
```json
{
  "dependencies": {
    "@libsql/client": "^0.14.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0",
    "esbuild": "^0.20.0"
  }
}
```

The `@bunny.net/edgescript-sdk` is NOT in package.json — it's provided by the runtime.
Use `/// <reference types="@bunny.net/edgescript-sdk" />` for type hints only.
The `--external:@bunny.net/edgescript-sdk` esbuild flag ensures it's not bundled.

---

## 11. Database Schema Reference

Always consult `Database_Schema.md` at the project root for the full current schema.
Key tables (Cloudflare D1, to be migrated):

- `users` — accounts with `email`, `password_hash`, `is_admin`
- `user_sessions` — session tokens with `expires_at`
- `memberships` — plans with `auto_renew`, `payment_instrument_id`
- `services` — pricing plans (`code`, `amount`, `currency`, `months`)
- `events` — with recurring event support, SEO fields, slugs
- `tickets` — event ticket purchases
- `transactions` — unified transaction log for all payment types
- `payment_instruments` — saved cards for recurring payments
- `email_history` — audit log of all emails sent
- `email_preferences` — GDPR consent tracking per user
- `products`, `orders`, `order_items`, `cart_items` — shop (Phase 2)
- `donations` — fundraiser campaigns
- `cron_job_log` — scheduled job execution history
- `password_reset_tokens` — time-limited reset tokens
- `sponsored_memberships` — gifted membership pool

Bunny DB tables (already on bunny.net):

- `board_games` — synced from BoardGameGeek
- `bookings` — table reservations
- `booking_table_types` — table type config with pricing
- `booking_config` — slot duration, capacity, hours
- `booking_blocks` — admin time blocks
- `email_templates` — stored email templates with `template_key`

---

## 12. Bunny.net Official Documentation Notes

Sourced from https://docs.bunny.net/scripting/ — last checked July 2025.

### 12.1 Runtime

- Built on **Deno** and **V8** (the engine behind Chrome).
- Provides a secure, isolated runtime with access to standard **Web APIs** (Request, Response, URL, fetch, etc.).
- Two script types: **Standalone** (handles HTTP requests directly, no origin needed) and **Middleware** (intercepts/modifies requests as they flow through CDN).
- `HTMLRewriter` is available for streaming HTML transformations (similar to Cloudflare Workers).

### 12.2 The `serve` Function

```ts
import * as BunnySDK from "@bunny.net/edgescript-sdk";

BunnySDK.net.http.serve(async (request: Request): Response | Promise<Response> => {
  return new Response("Hello from the edge!");
});
```
- Handler receives a standard `Request` and must return `Response | Promise<Response>`.
- For middleware scripts, use `BunnySDK.net.http.servePullZone()` with `.onOriginRequest()` / `.onOriginResponse()`.

### 12.3 Local Development

Scripts can be run locally using Deno:
```bash
deno run -A script.ts
```
Test with `curl http://127.0.0.1:8080/`.

### 12.4 Environment Variables & Secrets

- Set in Bunny Dashboard under: Edge Platform > Scripting > [script] > Env Configuration.
- **Environment Variables**: viewable, editable. For non-sensitive config.
- **Environment Secrets**: encrypted, cannot be viewed after setting. For API keys, tokens, passwords.
- Access via `process.env.VAR_NAME` (using `import process from "node:process"`) or `Deno.env.get("VAR_NAME")`.
- Variable and secret names on the same script must be unique.

### 12.5 GitHub Actions Deployment

Official GitHub Action: `BunnyWay/actions/deploy-script@main`

Three auth modes (action tries in priority order: deploy_key → api_key → OIDC):

**OIDC (recommended — no secrets needed):**
```yaml
permissions:
  id-token: write
  contents: read

- name: Deploy Script to Bunny Edge Scripting
  uses: BunnyWay/actions/deploy-script@main
  with:
    script_id: 61994         # hardcoded integer from Dashboard
    file: "dist/index.js"
```
Requires linking the GitHub repo to the Bunny script in the Dashboard.
This is the pattern used by DiceBastion's `release-on-bunny.yml`.

**Deploy key (alternative):**
```yaml
- uses: BunnyWay/actions/deploy-script@main
  with:
    script_id: ${{ secrets.SCRIPT_ID }}
    deploy_key: ${{ secrets.DEPLOY_KEY }}
    file: "dist/index.js"
```

- `script_id` visible in Dashboard under Edge Platform > Scripting > [script].
- Can build with esbuild/tsc in a prior step, then deploy the bundled output.

### 12.6 Pricing

- **CPU Time**: $0.02 per 1000 seconds of CPU time (excludes I/O wait).
- **Requests**: $0.20 per million requests.
- CDN bandwidth billed separately.
- Example: 10M requests/month × 10ms CPU each ≈ $4.00/month total.

### 12.7 Custom Hostnames

- Each edge script gets an auto-generated `*.b-cdn.net` URL via its Pull Zone.
- Custom hostnames are added to the Pull Zone (Dashboard > Pull Zone > Hostnames or via API).
- Wildcard subdomains (`*.stellmare.com`) are supported on Pull Zones with a wildcard SSL certificate.
- CNAME the custom domain to the pull zone hostname.
- For Stellmare: CNAME `*.stellmare.com` → Pull Zone hostname. The edge script reads `request.headers.get("Host")` to resolve which tenant.

### 12.8 Key Runtime Notes

- Deno-compatible: can import from `node:process`, `node:crypto`, etc. via Deno's Node compatibility layer.
- `HTMLRewriter` available globally (no import needed).
- Standard Web APIs: `fetch`, `Request`, `Response`, `URL`, `Headers`, `TextEncoder`, `TextDecoder`, `crypto.subtle` (Web Crypto API).
- No filesystem access except via `node:fs` compatibility (limited).
- External npm packages can be used if bundled via esbuild (or imported from esm.sh as URL imports for Deno).

---

## 13. Stellmare SaaS Platform

### 13.1 Repository

Separate repository at `C:\Users\nickc\Desktop\Dev\Stellmare\` — NOT inside the DiceBastion workspace.
Uses the same Bunny.net patterns documented in this file.

### 13.2 Domain & Subdomain Model

- Platform domain: `stellmare.com`
- Client subdomains: `{client}.stellmare.com`
- Wildcard DNS: `*.stellmare.com` CNAME → Bunny Pull Zone
- Tenant resolution: edge script reads `Host` header, extracts subdomain, looks up tenant in DB
- Clients can also CNAME their own domain (added as custom hostname on the Pull Zone)

### 13.3 Architecture: Shared Database with tenant_id

Single Bunny Database instance with `tenant_id` column on all tenant-scoped tables.
- Simpler than per-tenant databases at early stage
- Every query includes `WHERE tenant_id = ?`
- Platform admin queries can span all tenants
- Can migrate to per-tenant DB later if needed

### 13.4 Repository Structure

```
stellmare/
├── src/
│   ├── api.ts                  # Main edge script (routing + admin HTML serving)
│   ├── handlers/               # auth, events, newsletters, subscribers, tenants
│   ├── middleware/              # tenant.ts (Host→tenant), auth.ts (session/API key)
│   ├── services/               # database.ts (libSQL), email.ts (MailerSend)
│   └── utils/                  # helpers.ts (CORS, crypto), validation.ts
├── admin/index.html            # SPA admin dashboard (injected into bundle at build)
├── widgets/                    # events-widget.js, newsletter-widget.js (IIFE embeds)
├── migrations/                 # SQL migrations (0001_initial_schema.sql)
├── tests/                      # Deno test suite
├── scripts/                    # build.mjs, deploy.mjs, migrate.mjs
├── .github/workflows/deploy.yml
├── deno.json                   # Local dev config
└── package.json                # Node deps for esbuild + @libsql/client
```

### 13.5 Key API Routes

- `/admin` — serves SPA admin dashboard HTML
- `/api/auth/*` — login, register, logout, password reset, profile
- `/api/events/*` — CRUD + public registration + registrations list
- `/api/newsletters/*` — CRUD + send + stats
- `/api/subscribers/*` — CRUD + import/export CSV + GDPR consent + stats
- `/api/public/*` — unauthenticated event listing, registration, unsubscribe
- `/api/widget/*` — API-key-authenticated endpoints for embeddable widgets
- `/api/platform/*` — platform admin (tenant CRUD, API key generation, stats)

### 13.6 Auth Model

- Tenant admins use session-based auth (`X-Session-Token` header)
- Widget endpoints use API key auth (`X-API-Key` header)
- Platform admin uses a bearer token (`PLATFORM_ADMIN_KEY` env var)
- Passwords hashed with PBKDF2 + SHA-256 (100k iterations) via Web Crypto API

### 13.7 Build & Deploy

- Build: `node scripts/build.mjs` — esbuild bundles `src/api.ts` → `dist/api.js`, injects `admin/index.html`
- Widgets bundled as IIFE: `dist/widgets/events.js`, `dist/widgets/newsletter.js`
- Deploy: GitHub Actions with `BunnyWay/actions/deploy-script@main`
- Migrations: `node scripts/migrate.mjs` — reads `migrations/*.sql`, tracks applied in `_migrations` table
- Local dev: `deno task dev` (runs `deno run -A src/api.ts`)

### 13.8 Core Features (Phase 1)

- **Events**: create, edit, RSVP/ticket sales, recurring events, SEO fields, embeddable widget
- **Newsletters**: HTML editor, send to all active subscribers via MailerSend, open tracking, scheduled sending
- **Subscribers/Clients**: import/export CSV, GDPR consent, preference management, segmentation
- **Auth**: tenant admin accounts with session-based auth
- **Embeddable Widgets**: `<script>` tags clients add to their existing site for events list and newsletter signup
- **Admin Dashboard**: single-page HTML app served at `/admin`, covers events/newsletters/subscribers/settings

### 13.9 Phase 2 Features

- Product shop / e-commerce
- Extended analytics
- Custom branding/themes
- Paid newsletter subscriptions (Substack-style monetisation)
- SumUp payment integration for event tickets
