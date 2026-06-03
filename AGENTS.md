# Agent instructions

Before generating UI (HTML, CSS, admin panels, or CDN pages), read **[docs/ui-style-guide.md](docs/ui-style-guide.md)**.

Also consult:

- `assets/css/forms.css` — component class library
- `layouts/partials/list-card-styles.html` — event/blog list card patterns
- `.github/instructions/instructions.md.instructions.md` — copy rules (no emojis, no arrow buttons)
- `.github/instructions/architecture.md.instructions.md` — Bunny/Worker/database architecture

Blog pages served from `/posts/*` are pre-rendered by `bgg-bunny/blog-html.ts` — edit that file, rebuild `bgg-bunny/dist/blog.js`, and republish posts to update CDN HTML. **CDN sync always rebuilds all published posts** (no incremental sync); see **[docs/blog-cdn-sync.md](docs/blog-cdn-sync.md)**.
