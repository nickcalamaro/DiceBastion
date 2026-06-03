# Dice Bastion UI Style Guide

Reference this document when generating HTML, CSS, or UI copy for Dice Bastion (Hugo site, admin panel, Bunny CDN pages, Workers).

## Design tokens

Color variables live in `assets/css/schemes/blowfish.css`. Always prefer these over hardcoded hex values:

```css
rgb(var(--color-neutral-900))   /* headings, strong text */
rgb(var(--color-neutral-600))   /* body / secondary text */
rgb(var(--color-primary-600))   /* links, accents */
rgb(var(--color-primary-700))   /* link hover, emphasis */
rgba(var(--color-primary-50), 0.5)  /* tinted backgrounds */
```

Primary palette is blue (`--color-primary-*`). Secondary cyan exists but is used sparingly.

## Component library

**Canonical source:** `assets/css/forms.css`

Reuse existing classes before inventing new ones:

| Pattern | Classes |
|---------|---------|
| Page width | `.page-container` (max-width 1100px) |
| Hero / page intro | `.hero-cta-banner`, `.hero-cta-title`, `.hero-cta-subtitle` |
| Cards | `.card`, `.card-compact`, `.card-featured`, `.card-header`, `.card-badge-*` |
| Buttons | `.btn`, `.btn-primary`, `.btn-secondary` |
| Form fields | `.form-input`, `.form-textarea`, `.form-label` |
| Tags / pills | `.team-tag`, `.team-tag-primary`, `.team-tag-neutral` |
| Grids | `.feature-cards-grid` |

## List cards (events + blog)

**Canonical source:** `layouts/partials/list-card-styles.html`

Shared horizontal card layout:

- Grid: `.list-card-grid` inside `.list-card-scope`
- Card link: `.event-card-link` > `.event-card`
- Image: `.event-card-image` with `--card-bg-image` CSS variable for blurred backdrop
- Content: `.event-content`, `.event-title`, `.event-description`
- Footer band: `.event-meta` with `.event-date-label` / `.event-date-value` and `.event-location-label` / `.event-location-value`

Blog CDN pages (`bgg-bunny/blog-html.ts`) mirror list-card patterns with subdued styling (no hero gradient banners).

Taxonomy URLs (pre-rendered on CDN sync):

- Tag archive: `/posts/tag/{slug}/` (slug from tag name, e.g. `board-games`)
- Author archive: `/posts/author/{slug}/` (author slug from admin)
- Main list sidebar shows all tags and authors with post counts

## Blog article pages (CDN)

Rendered by `bgg-bunny/blog-html.ts` and uploaded to Bunny Storage on publish.

- **One author surface only:** `.blog-author-byline` with `.blog-author-item` — never duplicate in meta bar or article body
- Meta band (date, category): `.blog-article-meta` with `.blog-meta-label` / `.blog-meta-value`
- Tags: `.blog-tag-list` > `.blog-tag` (same visual weight as `.team-tag-primary`)
- Body: `.blog-article-body` — Quill HTML; strip Hugo `.author` blocks on render
- Social / JSON-LD images: cover hero, then inline photos; optional admin `seo_image` overrides. Logo only if the post has no images.
- Blog sitemaps: `https://dicebastion.com/posts/sitemap.xml` and `https://dicebastion.com/posts/sitemap-images.xml` (listed in `layouts/robots.txt`)
- Event SEO pages (`/events/:slug/`): hero/card/main images in Open Graph, JSON-LD, and `https://dicebastion.com/events/sitemap-images.xml`
- Product SEO pages (`shop.dicebastion.com/products/:slug/`): product image + description images in Open Graph, Product schema, and `https://shop.dicebastion.com/products/sitemap-images.xml`

## Copy guidelines

From `.github/instructions/instructions.md.instructions.md`:

- No emojis in headings, buttons, labels, or body text
- No arrow characters in button labels or links
- No decorative Unicode pseudo-icons
- Use CSS (border accents, colour, spacing) for visual differentiation
- Section headings: plain, descriptive text

## Hugo theme notes

- Site uses Blowfish layouts vendored at repo root (theme line commented out in `config/_default/hugo.toml`)
- Compiled Tailwind CSS is committed at `assets/css/compiled/main.css` — do not add Sass/Dart to CI
- Vendor JS is committed under `assets/lib/` — no `npm ci` needed for Hugo deploy
- Site author in config (`Gibraltar Dice Bastion`) is the organisation — do not repeat alongside post authors on blog pages

## File map

| Area | Files |
|------|-------|
| Tokens | `assets/css/schemes/blowfish.css` |
| Components | `assets/css/forms.css` |
| Header tweaks | `assets/css/custom.css` |
| List cards | `layouts/partials/list-card-styles.html` |
| Blog CDN HTML | `bgg-bunny/blog-html.ts` |
| Admin UI | `content/admin/_index.md` (inline styles use forms.css classes) |
