/**
 * Pre-render blog list and article pages for Bunny Storage / CDN.
 * Visual tokens and patterns: docs/ui-style-guide.md
 */

export interface BlogPostRow {
  slug: string;
  title: string;
  html?: string;
  excerpt?: string | null;
  featured_image?: string | null;
  featured_image_card?: string | null;
  featured_image_hero?: string | null;
  tags?: string[];
  categories?: string[];
  series?: string[];
  authors?: string[];
  published_at?: string | null;
  seo_description?: string | null;
  seo_image?: string | null;
  updated_at?: string | null;
}

export interface BlogAuthorProfile {
  slug: string;
  name: string;
  image?: string | null;
  bio?: string | null;
}

/** Site/org bylines — hide when a named person author is also present. */
const ORG_AUTHOR_NAMES = new Set([
  "dice bastion",
  "gibraltar dice bastion",
]);

function escapeHtml(text: unknown): string {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function cardImage(post: BlogPostRow): string {
  return post.featured_image_card || post.featured_image || "";
}

function heroImage(post: BlogPostRow): string {
  return post.featured_image_hero || post.featured_image || "";
}

function isOrgAuthorName(name: string): boolean {
  return ORG_AUTHOR_NAMES.has(name.trim().toLowerCase());
}

/** Deduplicate by slug and display name; prefer person authors over org bylines. */
function resolvePostAuthors(
  post: BlogPostRow,
  authors: Record<string, BlogAuthorProfile>
): BlogAuthorProfile[] {
  const slugs = [...new Set((post.authors || []).map((s) => s.trim()).filter(Boolean))];
  const profiles: BlogAuthorProfile[] = [];
  const seenNames = new Set<string>();

  for (const slug of slugs) {
    const profile = authors[slug] || { slug, name: slug.replace(/-/g, " ") };
    const key = profile.name.trim().toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    profiles.push({ slug, name: profile.name.trim(), image: profile.image, bio: profile.bio });
  }

  const people = profiles.filter((p) => !isOrgAuthorName(p.name));
  return people.length > 0 ? people : profiles;
}

function authorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

/** Remove Hugo-style author blocks and duplicate bylines pasted into Quill HTML. */
function stripEmbeddedAuthorBlocks(html: string): string {
  if (!html) return "";
  let out = html;
  // Hugo author-extra / site author partials (flex author wrappers)
  out = out.replace(/<div class="flex author author-extra[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi, "");
  out = out.replace(/<div class="flex author"[\s\S]*?<\/div>\s*<\/div>/gi, "");
  // Plain "Author:" paragraphs
  out = out.replace(/<p[^>]*>\s*(?:<(?:strong|b)>)?\s*Author:?\s*(?:<\/(?:strong|b)>)?\s*[^<]*<\/p>/gi, "");
  return out.trim();
}

function renderAuthorByline(profiles: BlogAuthorProfile[]): string {
  if (!profiles.length) return "";
  const items = profiles
    .map((profile) => {
      const avatar = profile.image
        ? `<img class="blog-author-avatar" src="${escapeHtml(profile.image)}" alt="" width="48" height="48" loading="lazy">`
        : `<div class="blog-author-avatar blog-author-avatar--placeholder" aria-hidden="true">${escapeHtml(authorInitials(profile.name))}</div>`;
      const bio = profile.bio
        ? `<p class="blog-author-bio">${escapeHtml(profile.bio)}</p>`
        : "";
      return `
        <div class="blog-author-item">
          ${avatar}
          <div class="blog-author-text">
            <div class="blog-author-label">Author</div>
            <div class="blog-author-name">${escapeHtml(profile.name)}</div>
            ${bio}
          </div>
        </div>`;
    })
    .join("");

  return `<aside class="blog-author-byline" aria-label="Article author">${items}</aside>`;
}

const PAGE_CSS = `
:root {
  --color-neutral: 255, 255, 255;
  --color-neutral-50: 248, 250, 252;
  --color-neutral-100: 241, 245, 249;
  --color-neutral-200: 226, 232, 240;
  --color-neutral-300: 203, 213, 225;
  --color-neutral-400: 148, 163, 184;
  --color-neutral-500: 100, 116, 139;
  --color-neutral-600: 71, 85, 105;
  --color-neutral-700: 51, 65, 85;
  --color-neutral-800: 30, 41, 59;
  --color-neutral-900: 15, 23, 42;
  --color-primary-50: 239, 246, 255;
  --color-primary-100: 219, 234, 254;
  --color-primary-200: 191, 219, 254;
  --color-primary-400: 96, 165, 250;
  --color-primary-600: 37, 99, 235;
  --color-primary-700: 29, 78, 216;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: rgb(var(--color-neutral-50));
  color: rgb(var(--color-neutral-800));
  line-height: 1.6;
}
a { color: rgb(var(--color-primary-600)); text-decoration: none; }
a:hover { color: rgb(var(--color-primary-700)); text-decoration: underline; }
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: rgb(var(--color-neutral));
  border-bottom: 1px solid rgb(var(--color-neutral-200));
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}
.site-header a.brand {
  font-weight: 800;
  font-size: 1.05rem;
  color: rgb(var(--color-neutral-900));
  text-decoration: none;
  letter-spacing: -0.02em;
}
.site-header nav { display: flex; gap: 1.25rem; }
.site-header nav a {
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  color: rgb(var(--color-neutral-600));
}
.site-header nav a:hover { color: rgb(var(--color-primary-600)); text-decoration: none; }
main.page-container {
  max-width: 1100px;
  margin: 1rem auto 3rem;
  padding: 0 1rem;
}
.page-intro {
  background: linear-gradient(135deg, #4f46e5 0%, rgb(var(--color-primary-600)) 50%, #0ea5e9 100%);
  border-radius: 12px;
  padding: 1.75rem 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
  color: white;
}
.page-intro h1 {
  margin: 0 0 0.35rem;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.03em;
}
.page-intro p {
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.05rem;
}
.list-card-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 2rem 0;
}
.event-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}
.event-card {
  border: 1px solid rgb(var(--color-neutral-300));
  border-radius: 16px;
  background: rgb(var(--color-neutral));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: 240px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: rgba(var(--color-primary-400), 0.5);
}
.event-card-image {
  flex: 0 0 400px;
  width: 400px;
  position: relative;
  min-height: 240px;
  background: rgb(var(--color-neutral-100));
}
.event-card-image::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--card-bg-image);
  background-size: cover;
  background-position: center;
  filter: blur(60px) brightness(0.9);
  transform: scale(1.2);
}
.event-card-image img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  z-index: 1;
}
.event-content { flex: 1; padding: 2rem 1.5rem 0; display: flex; flex-direction: column; }
.event-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: rgb(var(--color-neutral-900));
  letter-spacing: -0.03em;
  line-height: 1.2;
}
.event-description {
  color: rgb(var(--color-neutral-600));
  margin: 0.75rem 0 1rem;
  line-height: 1.7;
}
.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem 2rem;
  padding: 1.25rem 1.5rem;
  margin: auto -1.5rem 0;
  background: linear-gradient(135deg, rgba(var(--color-primary-50), 0.5) 0%, rgba(var(--color-primary-100), 0.3) 100%);
  border-top: 2px solid rgba(var(--color-primary-200), 0.5);
}
.event-date-label, .event-location-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: rgba(var(--color-primary-600), 0.85);
}
.event-date-value, .event-location-value {
  font-weight: 700;
  color: rgb(var(--color-primary-700));
  font-size: 1.125rem;
}
.blog-article {
  max-width: 760px;
  margin: 0 auto;
}
.blog-hero-image {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}
.blog-article-title {
  font-size: clamp(1.75rem, 5vw, 2.35rem);
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 1rem;
  color: rgb(var(--color-neutral-900));
  letter-spacing: -0.03em;
}
.blog-article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem 2rem;
  margin-bottom: 1.25rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(var(--color-primary-50), 0.5) 0%, rgba(var(--color-primary-100), 0.3) 100%);
  border: 1px solid rgba(var(--color-primary-200), 0.5);
}
.blog-meta-block { display: flex; flex-direction: column; gap: 0.2rem; }
.blog-meta-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: rgba(var(--color-primary-600), 0.85);
}
.blog-meta-value {
  font-weight: 700;
  color: rgb(var(--color-primary-700));
  font-size: 1.05rem;
}
.blog-tag-list { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1.25rem; }
.blog-tag {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: rgb(var(--color-primary-100));
  color: rgb(var(--color-primary-700));
  font-size: 0.8rem;
  font-weight: 600;
}
.blog-author-byline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.75rem;
  padding: 1rem 1.25rem;
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 12px;
  background: rgb(var(--color-neutral));
}
.blog-author-item { display: flex; align-items: center; gap: 1rem; }
.blog-author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
}
.blog-author-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--color-primary-100));
  color: rgb(var(--color-primary-700));
  font-weight: 700;
  font-size: 0.95rem;
}
.blog-author-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: rgb(var(--color-neutral-500));
}
.blog-author-name {
  font-weight: 700;
  color: rgb(var(--color-neutral-900));
  font-size: 1.05rem;
}
.blog-author-bio {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: rgb(var(--color-neutral-600));
  line-height: 1.5;
}
.blog-article-body {
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgb(var(--color-neutral-700));
}
.blog-article-body img { max-width: 100%; height: auto; border-radius: 8px; }
.blog-article-body h1, .blog-article-body h2, .blog-article-body h3 {
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
  color: rgb(var(--color-neutral-900));
  letter-spacing: -0.02em;
}
.blog-article-body p { margin: 0 0 1rem; }
.blog-article-body a { text-decoration: underline; text-underline-offset: 2px; }
.blog-article-body blockquote {
  margin: 1.25rem 0;
  padding: 0.75rem 1rem;
  border-left: 4px solid rgb(var(--color-primary-400));
  background: rgb(var(--color-neutral-100));
  border-radius: 0 8px 8px 0;
  color: rgb(var(--color-neutral-700));
}
.no-posts {
  text-align: center;
  padding: 3rem;
  color: rgb(var(--color-neutral-600));
  font-size: 1.125rem;
}
@media (max-width: 768px) {
  .event-card { flex-direction: column; }
  .event-card-image {
    flex: none;
    width: 100%;
    aspect-ratio: 400 / 238;
    min-height: 0;
    border-radius: 16px 16px 0 0;
  }
}
`;

function pageShell(
  title: string,
  description: string,
  canonical: string,
  siteUrl: string,
  bodyHtml: string,
  jsonLd?: object,
  ogImage?: string
): string {
  const ogType = jsonLd ? "article" : "website";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | Dice Bastion</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:type" content="${ogType}">
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ""}
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
  <style>${PAGE_CSS}</style>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="${escapeHtml(siteUrl)}/">Dice Bastion</a>
    <nav>
      <a href="${escapeHtml(siteUrl)}/posts/">Blog</a>
      <a href="${escapeHtml(siteUrl)}/events/">Events</a>
    </nav>
  </header>
  <main class="page-container">${bodyHtml}</main>
</body>
</html>`;
}

function renderPostCard(post: BlogPostRow, siteUrl: string): string {
  const img = cardImage(post);
  const summary = post.excerpt || post.seo_description || "";
  const dateStr = formatDate(post.published_at);
  const category = (post.categories || [])[0] || "";
  const postUrl = `${siteUrl}/posts/${encodeURIComponent(post.slug)}/`;

  return `
    <a href="${escapeHtml(postUrl)}" class="event-card-link">
      <div class="event-card">
        ${img ? `<div class="event-card-image" style="--card-bg-image: url('${escapeHtml(img)}');"><img src="${escapeHtml(img)}" alt="${escapeHtml(post.title)}" loading="lazy" decoding="async"></div>` : ""}
        <div class="event-content">
          <h2 class="event-title">${escapeHtml(post.title)}</h2>
          ${summary ? `<p class="event-description">${escapeHtml(summary)}</p>` : ""}
          <div class="event-meta">
            <div class="blog-meta-block">
              <div class="event-date-label">Published</div>
              <div class="event-date-value">${escapeHtml(dateStr)}</div>
            </div>
            ${category ? `
              <div class="blog-meta-block">
                <div class="event-location-label">Category</div>
                <div class="event-location-value">${escapeHtml(category)}</div>
              </div>
            ` : ""}
          </div>
        </div>
      </div>
    </a>`;
}

export function renderBlogListPage(posts: BlogPostRow[], siteUrl: string): string {
  const cards = posts.length
    ? posts.map((p) => renderPostCard(p, siteUrl)).join("\n")
    : `<div class="no-posts">No posts yet. Check back soon!</div>`;

  const body = `
    <div class="page-intro">
      <h1>Blog</h1>
      <p>News, updates, and stories from Dice Bastion.</p>
    </div>
    <section class="list-card-grid">${cards}</section>`;

  return pageShell(
    "Blog",
    "News, updates, and stories from Dice Bastion.",
    `${siteUrl}/posts/`,
    siteUrl,
    body
  );
}

export function renderBlogPostPage(
  post: BlogPostRow,
  authors: Record<string, BlogAuthorProfile>,
  siteUrl: string
): string {
  const hero = heroImage(post);
  const dateStr = formatDate(post.published_at);
  const authorProfiles = resolvePostAuthors(post, authors);
  const canonical = `${siteUrl}/posts/${encodeURIComponent(post.slug)}/`;
  const description = post.seo_description || post.excerpt || post.title;
  const ogImage = post.seo_image || hero || cardImage(post);
  const tags = (post.tags || [])
    .map((t) => `<span class="blog-tag">${escapeHtml(t)}</span>`)
    .join("");
  const category = (post.categories || []).join(", ");
  const sanitizedBody = stripEmbeddedAuthorBlocks(post.html || "");

  const body = `
    <article class="blog-article">
      ${hero ? `<img class="blog-hero-image" src="${escapeHtml(hero)}" alt="${escapeHtml(post.title)}">` : ""}
      <h1 class="blog-article-title">${escapeHtml(post.title)}</h1>
      <div class="blog-article-meta">
        ${dateStr ? `
          <div class="blog-meta-block">
            <div class="blog-meta-label">Published</div>
            <div class="blog-meta-value">${escapeHtml(dateStr)}</div>
          </div>
        ` : ""}
        ${category ? `
          <div class="blog-meta-block">
            <div class="blog-meta-label">Category</div>
            <div class="blog-meta-value">${escapeHtml(category)}</div>
          </div>
        ` : ""}
      </div>
      ${tags ? `<div class="blog-tag-list">${tags}</div>` : ""}
      ${renderAuthorByline(authorProfiles)}
      <div class="blog-article-body">${sanitizedBody}</div>
    </article>`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    image: ogImage || undefined,
    author: authorProfiles.map((profile) => ({
      "@type": "Person",
      name: profile.name,
    })),
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };

  return pageShell(post.title, description, canonical, siteUrl, body, jsonLd, ogImage || undefined);
}

export function renderBlogSitemap(posts: BlogPostRow[], siteUrl: string): string {
  const today = new Date().toISOString().split("T")[0];
  const urls = [
    `  <url>\n    <loc>${siteUrl}/posts/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`,
    ...posts.map((post) => {
      const lastmod = post.updated_at || post.published_at;
      const mod = lastmod ? new Date(lastmod).toISOString().split("T")[0] : today;
      return `  <url>\n    <loc>${siteUrl}/posts/${encodeURIComponent(post.slug)}/</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
    }),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}
