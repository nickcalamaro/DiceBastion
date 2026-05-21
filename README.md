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

1. **Create** — Title, slug, excerpt, featured image (R2 upload via worker), SEO fields, publish date.
2. **Taxonomies** — Tags, categories, series, and authors as chip inputs with autocomplete from existing posts.
3. **Authors** — First use of an author slug prompts for display name, avatar URL, and bio (stored in `blog_authors`, generated as `data/authors/*.yaml` at build time).
4. **Save draft** — `POST/PUT` to the Bunny blog API with `status: draft`.
5. **Publish** — Sets `status: published`, notifies Google Indexing API (via worker proxy), and triggers a GitHub Actions rebuild via `repository_dispatch` (`blog-published`).
6. **Unpublish** — Reverts to draft and triggers another rebuild to remove the post from the site.

Published posts appear at `/posts/{slug}/` with native Blowfish taxonomy pages at `/tags/`, `/categories/`, `/series/`, and `/authors/`.

**Bunny blog routes:** `GET/POST /admin/blog/posts`, `GET/PUT/DELETE /admin/blog/posts/:id`, `GET /admin/blog/taxonomy-terms`, `GET /internal/blog/published`.

### Other admin areas

Events, shop products, memberships, bookings, and cron jobs are also managed from `/admin`. Events and shop products use worker-rendered SEO pages; blog posts use Hugo static generation instead.

## Content model

| Content | Storage | Published as |
|---------|---------|--------------|
| Static pages | Hugo `content/` | GitHub Pages build |
| Events | D1 `events` | Worker HTML at `/events/{slug}` |
| Shop products | D1 + Hugo shop | Worker + shop subdomain |
| Newsletters | D1 `newsletter_drafts` | Email (not on site) |
| Blog posts | Bunny Database `blog_posts` | Hugo markdown generated in CI |

D1 schema: [Database_Schema.md](Database_Schema.md).

## Deploy

**Hugo site (GitHub Pages)** — `.github/workflows/hugo.yml` runs on push to `master`, daily schedule, manual dispatch, and `repository_dispatch` type `blog-published`. Before `hugo`, CI runs `node scripts/generate-blog-content.js`, which fetches published posts from the **Bunny blog edge script** and writes `content/posts/*.md` plus `data/authors/*.yaml`.

**Bunny edge scripts** — `.github/workflows/release-on-bunny.yml` builds and deploys scripts including the blog API (script ID `75941`).

**Worker** — `cd worker && wrangler deploy` (memberships, events, shop, newsletters, image uploads — not blog)

## Secrets checklist

### GitHub Actions (repository secrets)

| Secret | Purpose |
|--------|---------|
| `DEPLOY_KEY` | Bunny edge script deploy key (Script → Deployments → Settings). Used by `release-on-bunny.yml` for all scripts including blog (`75941`). Alternatively, link the repo via Bunny GitHub App integration and omit this. |
| `BLOG_BUILD_SECRET` | Shared with Bunny blog script; CI sends it as `X-Build-Secret` to `GET /internal/blog/published` |

Set **`BLOG_API_URL`** in GitHub repo variables only if you need to override the default (`https://dicebastionblogger-yvfyf.bunny.run`). The admin panel uses the same URL via `static/js/utils.js`.

### Bunny edge script env (script ID `75941` → Env Configuration)

| Variable | Purpose |
|----------|---------|
| `BUNNY_DATABASE_URL` | libSQL URL (same Bunny Database as bookings, or a dedicated DB) |
| `BUNNY_DATABASE_AUTH_TOKEN` | libSQL auth token |
| `BLOG_BUILD_SECRET` | Must match GitHub `BLOG_BUILD_SECRET`; protects `/internal/blog/published` |
| `GITHUB_DEPLOY_TOKEN` | PAT with `repo` + `actions` scope; triggers Hugo rebuild on publish |
| `GITHUB_REPO` | Optional; default `nickcalamaro/DiceBastion` |
| `WORKER_API_URL` | Cloudflare worker URL; used to verify admin sessions and proxy Google indexing |
| `ADMIN_KEY` | Optional; legacy `X-Admin-Key` fallback (same value as worker `ADMIN_KEY` if used) |

### Cloudflare Worker secrets (unchanged for blog)

| Secret | Purpose |
|--------|---------|
| `MAILERSEND_API_KEY` | Transactional and newsletter email |
| `GOOGLE_SA_KEY` | Google Indexing API (blog publish calls worker `/admin/indexing/notify`) |
| `SUMUP_*` | Payments and memberships |
| `ADMIN_KEY` | Admin auth (also used by blog script session verify fallback) |
