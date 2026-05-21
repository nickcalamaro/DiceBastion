/**
 * Pre-render blog list and article pages for Bunny Storage / CDN.
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

function authorLine(post: BlogPostRow, authors: Record<string, BlogAuthorProfile>): string {
  return (post.authors || [])
    .map((slug) => authors[slug]?.name || slug.replace(/-/g, " "))
    .filter(Boolean)
    .join(", ");
}

const PAGE_CSS = `
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: #fafafa;
  color: #1e293b;
  line-height: 1.6;
}
a { color: #2563eb; }
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}
.site-header a.brand {
  font-weight: 800;
  font-size: 1.125rem;
  color: #0f172a;
  text-decoration: none;
}
.site-header nav a {
  margin-left: 1rem;
  text-decoration: none;
  font-weight: 600;
  color: #475569;
}
main {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
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
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: 240px;
  overflow: hidden;
}
.event-card-image {
  flex: 0 0 400px;
  width: 400px;
  position: relative;
  min-height: 240px;
  background: #f1f5f9;
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
.event-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: #0f172a; line-height: 1.2; }
.event-description { color: #475569; margin: 0.75rem 0 1rem; }
.event-meta {
  display: flex;
  gap: 2rem;
  padding: 1.25rem 1.5rem;
  margin: auto -1.5rem 0;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-top: 2px solid #bfdbfe;
}
.event-date-label, .event-location-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: #2563eb;
}
.event-date-value, .event-location-value {
  font-weight: 700;
  color: #1d4ed8;
  font-size: 1.125rem;
}
.blog-hero-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}
.blog-article-title {
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 1rem;
  color: #0f172a;
}
.blog-article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
}
.blog-tag-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
.blog-tag {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.8rem;
  font-weight: 600;
}
.blog-article-body { font-size: 1.05rem; line-height: 1.8; color: #334155; }
.blog-article-body img { max-width: 100%; height: auto; border-radius: 8px; }
.blog-article-body h1, .blog-article-body h2, .blog-article-body h3 {
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
  color: #0f172a;
}
.no-posts { text-align: center; padding: 3rem; color: #64748b; }
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
  <main>${bodyHtml}</main>
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
            <div>
              <div class="event-date-label">Published</div>
              <div class="event-date-value">${escapeHtml(dateStr)}</div>
            </div>
            ${category ? `
              <div>
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
    <h1>Blog</h1>
    <p>News, updates, and stories from Dice Bastion.</p>
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
  const authorsText = authorLine(post, authors);
  const canonical = `${siteUrl}/posts/${encodeURIComponent(post.slug)}/`;
  const description = post.seo_description || post.excerpt || post.title;
  const ogImage = post.seo_image || hero || cardImage(post);
  const tags = (post.tags || [])
    .map((t) => `<span class="blog-tag">${escapeHtml(t)}</span>`)
    .join("");

  const body = `
    ${hero ? `<img class="blog-hero-image" src="${escapeHtml(hero)}" alt="${escapeHtml(post.title)}">` : ""}
    <h1 class="blog-article-title">${escapeHtml(post.title)}</h1>
    <div class="blog-article-meta">
      ${dateStr ? `<div><strong>Published:</strong> ${escapeHtml(dateStr)}</div>` : ""}
      ${authorsText ? `<div><strong>Author:</strong> ${escapeHtml(authorsText)}</div>` : ""}
      ${(post.categories || []).length ? `<div><strong>Category:</strong> ${escapeHtml((post.categories || []).join(", "))}</div>` : ""}
    </div>
    ${tags ? `<div class="blog-tag-list">${tags}</div>` : ""}
    <div class="blog-article-body">${post.html || ""}</div>`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    image: ogImage || undefined,
    author: (post.authors || []).map((slug) => ({
      "@type": "Person",
      name: authors[slug]?.name || slug,
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
