# Dice Bastion

Hugo static site (Blowfish theme) with a Cloudflare Worker API, D1 database, and Bunny edge scripts for email and integrations.

## Local development

**Hugo site**

```bash
hugo server
```

Open [http://localhost:1313](http://localhost:1313). The admin panel is at `/admin` (admin users only).

**Worker API**

```bash
cd worker
npm install
wrangler dev
```

See [worker/README.md](worker/README.md) for D1 setup and deployment.

## Admin panel

Sign in at `/admin` with an admin account. All admin API calls use the `X-Session-Token` header set after login.

### Newsletter Builder

The **Newsletter** tab (`/admin#newsletter`) is the primary content workflow for member email.

1. **Compose** — Quill rich-text editor with headings, lists, links, dividers, and embedded event cards/calendars from upcoming events.
2. **Save draft** — Persists to D1 (`newsletter_drafts` table) via `POST/PUT /admin/newsletters`.
3. **Preview** — Renders the full email template in a modal iframe.
4. **Schedule** — Sets `status = scheduled` and `scheduled_for`; the daily cron at 2 AM UTC sends due newsletters.
5. **Send now** — Sends immediately to opted-in recipients (`marketing_emails = 1`) via MailerSend.

Drafts are also cached in `localStorage` as crash recovery. Server-side drafts support statuses: `draft`, `scheduled`, `sent`, `failed`.

**Worker routes:** `GET/POST /admin/newsletters`, `GET/PUT/DELETE /admin/newsletters/:id`, `POST /admin/newsletters/:id/send`, `GET /admin/newsletter/recipients`, `GET /admin/newsletter/events`.

### Blog

The **Blog** tab (`/admin#blog`) manages posts stored in **Bunny Database** via the blog edge script (`bgg-bunny/blog-edge-script.ts`, script ID `75941`).

1. **Create** — Title, slug, excerpt, featured image (crop + multi-size upload via worker R2), SEO fields, publish date.
2. **Taxonomies** — Tags, categories, series, and authors as chip inputs with autocomplete from existing posts.
3. **Authors** — First use of an author slug prompts for display name, avatar URL, and bio (stored in `blog_authors`).
4. **Save draft** — `POST/PUT` to the Bunny blog API with `status: draft`.
5. **Publish** — Sets `status: published`, renders HTML to Bunny Storage, purges CDN, and notifies Google Indexing API (via worker proxy). No Hugo rebuild.
6. **Unpublish** — Reverts to draft; CDN files are updated on the next sync.

Published posts appear at `/posts/` (list) and `/posts/{slug}/` (article). The Cloudflare Worker proxies those paths to pre-rendered HTML on Bunny CDN (`dicebastion.b-cdn.net/blog/posts/...`).

**Bunny blog routes:** `GET/POST /admin/blog/posts`, `GET/PUT/DELETE /admin/blog/posts/:id`, `GET /admin/blog/taxonomy-terms`.

### Other admin areas

Events, shop products, memberships, bookings, and cron jobs are also managed from `/admin`. Events and shop products use worker-rendered SEO pages; blog posts are pre-rendered on Bunny CDN at publish time.

## Content model

| Content | Storage | Published as |
|---------|---------|--------------|
| Static pages | Hugo `content/` | GitHub Pages build |
| Events | D1 `events` | Worker HTML at `/events/{slug}` |
| Shop products | D1 + Hugo shop | Worker + shop subdomain |
| Newsletters | D1 `newsletter_drafts` | Email (not on site) |
| Blog posts | Bunny Database `blog_posts` | Pre-rendered HTML on Bunny CDN; Worker proxies `/posts/*` |

D1 schema: [Database_Schema.md](Database_Schema.md).

## Deploy

**Hugo site (GitHub Pages)** — `.github/workflows/hugo.yml` runs on push to `master`, daily schedule, and manual dispatch. Blog content is not generated at build time.

**Bunny edge scripts** — `.github/workflows/release-on-bunny.yml` builds and deploys scripts including the blog API (script ID `75941`). On publish, the blog script renders HTML to Storage and purges the CDN.

**Worker** — `cd worker && wrangler deploy` (memberships, events, shop, newsletters, image uploads, thin `/posts/*` CDN proxy)

## Secrets checklist

### GitHub Actions (repository secrets)

| Secret | Purpose |
|--------|---------|
| `DEPLOY_KEY` | Bunny edge script deploy key (Script → Deployments → Settings). Used by `release-on-bunny.yml` for all scripts including blog (`75941`). Alternatively, link the repo via Bunny GitHub App integration and omit this. |

The admin panel uses `https://dicebastionblogger-yvfyf.bunny.run` via `static/js/utils.js` (`__BLOG_API_BASE`).

### Bunny edge script env (script ID `75941` → Env Configuration)

| Variable | Purpose |
|----------|---------|
| `BUNNY_DATABASE_URL` | libSQL URL (same Bunny Database as bookings, or a dedicated DB) |
| `BUNNY_DATABASE_AUTH_TOKEN` | libSQL auth token |
| `BUNNY_STORAGE_ZONE` | Storage zone name (default `dicebastion`) |
| `BUNNY_STORAGE_API_KEY` | Storage zone password (AccessKey for uploads) |
| `BUNNY_CDN_URL` | Pull zone URL (e.g. `https://dicebastion.b-cdn.net`) |
| `BUNNY_PULL_ZONE_ID` | Pull zone ID for cache purge on publish |
| `BUNNY_API_KEY` | Bunny account API key for purge API |
| `SITE_URL` | Public site URL (default `https://dicebastion.com`) |
| `WORKER_API_URL` | Cloudflare worker URL; used to verify admin sessions and proxy Google indexing |
| `ADMIN_KEY` | Optional; legacy `X-Admin-Key` fallback (same value as worker `ADMIN_KEY` if used) |

### Cloudflare Worker vars

| Variable | Purpose |
|----------|---------|
| `BUNNY_CDN_URL` | Bunny pull zone URL; Worker proxies `/posts/*` to `{BUNNY_CDN_URL}/blog/posts/...` |

### Cloudflare Worker secrets

| Secret | Purpose |
|--------|---------|
| `MAILERSEND_API_KEY` | Transactional and newsletter email |
| `GOOGLE_SA_KEY` | Google Indexing API (blog publish calls worker `/admin/indexing/notify`) |
| `SUMUP_*` | Payments and memberships |
| `ADMIN_KEY` | Admin auth (also used by blog script session verify fallback) |
