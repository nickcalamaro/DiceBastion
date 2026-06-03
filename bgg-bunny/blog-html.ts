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

export interface BlogTaxonomyIndex {
  tags: { slug: string; label: string; count: number }[];
  authors: { slug: string; name: string; count: number }[];
}

const ORG_AUTHOR_NAMES = new Set([
  "dice bastion",
  "gibraltar dice bastion",
]);

/** Mirrors config/_default/menus.en.toml (Login, Account, Memberships omitted on blog). */
interface SiteNavItem {
  label: string;
  href?: string;
  external?: boolean;
  /** 0 = admin only; see utils.USER_LEVELS in static/js/utils.js */
  visibility?: number;
  blogActive?: boolean;
  children?: SiteNavItem[];
}

const SITE_NAV: SiteNavItem[] = [
  { label: "Events", href: "/events/" },
  { label: "Donate", href: "/donations/" },
  {
    label: "About Us",
    href: "/about/",
    children: [
      { label: "FAQs", href: "/faqs/" },
      { label: "Team", href: "/team/" },
      { label: "Dice Bastion Blog", href: "/posts/", blogActive: true },
    ],
  },
  {
    label: "Services",
    children: [
      { label: "Book a Table", href: "/bookings/" },
      { label: "Board Game Library", href: "/board-game-library/" },
    ],
  },
  { label: "Shop", href: "https://shop.dicebastion.com", external: true },
  { label: "Admin", href: "/admin/", visibility: 0 },
];

const SITE_NAME = "Gibraltar Dice Bastion";
const BLOG_SEO_DESCRIPTION =
  "Nicky and Jen's little corner of the internet for tabletop gaming in Gibraltar — board game reviews, event recaps, and club news from Dice Bastion.";

function renderBlogIndexIntro(siteUrl: string): string {
  const newsletterUrl = `${siteUrl}/newsletter/`;
  return `
    <div class="blog-seo-intro">
      <p>Nicky and Jen's little corner of the internet, for all things tabletop happening in Gibraltar. Check back regularly for board game reviews, event recaps and for a behind-the-scenes look at your favourite gaming club!</p>
      <p>Want to get the latest updates? Sign up for <a href="${escapeHtml(newsletterUrl)}">our newsletter</a> and hear about all of our events and activies right in your inbox!</p>
    </div>`;
}

function defaultOgImage(siteUrl: string): string {
  return `${siteUrl}/img/DB_Logo_2025.png`;
}

function isSiteLogoUrl(url: string): boolean {
  return /DB_Logo_2025\.png/i.test(url);
}

/** Prefer HTTPS and absolute URLs for crawlers (Google Images, og:image). */
function ensureAbsoluteImageUrl(url: string, siteUrl: string): string {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^http:\/\//i.test(trimmed)) return trimmed.replace(/^http:\/\//i, "https://");
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${siteUrl.replace(/\/$/, "")}${trimmed}`;
  return trimmed;
}

function extractImgUrlsFromHtml(html: string): string[] {
  if (!html || !html.includes("<img")) return [];
  const urls: string[] = [];
  const re = /<img\b[^>]*\bsrc=(["'])([^"']+)\1/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    urls.push(match[2]);
  }
  return urls;
}

/** Hosts allowed in XML sitemaps (must be crawlable; avoid unverified third-party CDNs in GSC). */
function isSitemapImageHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "dicebastion.b-cdn.net" || h === "dicebastion.com" || h.endsWith(".dicebastion.com");
}

/** All indexable images for a post (hero, card, inline), deduped, HTTPS. */
export function collectPostImageUrls(post: BlogPostRow, siteUrl: string): string[] {
  const seen = new Set<string>();
  const ordered = [
    post.seo_image,
    heroImage(post),
    post.featured_image,
    post.featured_image_card,
    ...extractImgUrlsFromHtml(post.html || ""),
  ];
  const out: string[] = [];
  for (const raw of ordered) {
    const abs = ensureAbsoluteImageUrl(raw || "", siteUrl);
    if (!abs || seen.has(abs) || isSiteLogoUrl(abs)) continue;
    seen.add(abs);
    out.push(abs);
  }
  return out;
}

/** Images for sitemaps only — Bunny/site hosts (excludes legacy R2 URLs Google may reject). */
export function collectPostImageUrlsForSitemap(post: BlogPostRow, siteUrl: string): string[] {
  return collectPostImageUrls(post, siteUrl).filter((url) => {
    try {
      return isSitemapImageHost(new URL(url).hostname);
    } catch {
      return false;
    }
  });
}

function resolvePostOgImage(post: BlogPostRow, siteUrl: string): string {
  const images = collectPostImageUrls(post, siteUrl);
  if (images.length > 0) return images[0];
  return defaultOgImage(siteUrl);
}

function postJsonLdImages(post: BlogPostRow, siteUrl: string): string | string[] {
  const images = collectPostImageUrls(post, siteUrl);
  if (images.length === 0) return defaultOgImage(siteUrl);
  if (images.length === 1) return images[0];
  return images;
}

function latestIsoDate(posts: BlogPostRow[]): string {
  let latest = "";
  for (const post of posts) {
    const candidate = post.updated_at || post.published_at || "";
    if (candidate > latest) latest = candidate;
  }
  return latest ? new Date(latest).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
}

function jsonLdScript(data: object | object[]): string {
  const payload = Array.isArray(data)
    ? { "@context": "https://schema.org", "@graph": data }
    : data;
  return `<script type="application/ld+json">${JSON.stringify(payload)}</script>`;
}

function publisherJsonLd(siteUrl: string): object {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    logo: { "@type": "ImageObject", url: defaultOgImage(siteUrl) },
  };
}

function buildBlogIndexJsonLd(posts: BlogPostRow[], siteUrl: string): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: siteUrl,
        publisher: publisherJsonLd(siteUrl),
      },
      {
        "@type": "Blog",
        name: "Dice Bastion Blog",
        description: BLOG_SEO_DESCRIPTION,
        url: `${siteUrl}/posts/`,
        inLanguage: "en-GB",
        publisher: publisherJsonLd(siteUrl),
      },
      {
        "@type": "ItemList",
        name: "Latest blog posts",
        itemListElement: posts.slice(0, 20).map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${siteUrl}/posts/${encodeURIComponent(post.slug)}/`,
          name: post.title,
        })),
      },
    ],
  };
}

/** Match admin blogSlugify for consistent tag URLs. */
export function slugifyTaxonomy(value: string): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function isOrgAuthorName(name: string): boolean {
  return ORG_AUTHOR_NAMES.has(name.trim().toLowerCase());
}

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

function stripEmbeddedAuthorBlocks(html: string): string {
  if (!html) return "";
  let out = html;
  out = out.replace(/<div class="flex author author-extra[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi, "");
  out = out.replace(/<div class="flex author"[\s\S]*?<\/div>\s*<\/div>/gi, "");
  out = out.replace(/<p[^>]*>\s*(?:<(?:strong|b)>)?\s*Author:?\s*(?:<\/(?:strong|b)>)?\s*[^<]*<\/p>/gi, "");
  return out.trim();
}

/** Wrap legacy bare inline images; preserve existing blog-inline-figure blocks. */
function enhanceBlogBodyImages(html: string, postTitle = ""): string {
  if (!html || !html.includes("<img")) return html;
  const fallbackAlt = postTitle.trim()
    ? `Photo from ${postTitle.trim()}`
    : "Blog post image";

  const figures: string[] = [];
  let work = html.replace(
    /<figure\b[^>]*class="[^"]*blog-inline-figure[^"]*"[^>]*>[\s\S]*?<\/figure>/gi,
    (block) => {
      figures.push(block);
      return `\x00BLOGFIG${figures.length - 1}\x00`;
    }
  );

  work = work.replace(/<img\b([^>]*?)>/gi, (_match, attrs: string) => {
    const altMatch = attrs.match(/\balt=(["'])([\s\S]*?)\1/i);
    let alt = altMatch ? altMatch[2] : "";
    let imgAttrs = attrs;
    if (!alt.trim()) {
      alt = fallbackAlt;
      if (/\balt=/i.test(imgAttrs)) {
        imgAttrs = imgAttrs.replace(/\balt=(["'])([\s\S]*?)\1/i, `alt="${escapeHtml(alt)}"`);
      } else {
        imgAttrs = `${imgAttrs} alt="${escapeHtml(alt)}"`;
      }
    }
    const imgTag = `<img${imgAttrs} loading="lazy" decoding="async">`;
    return `<figure class="blog-inline-figure">${imgTag}<figcaption>${escapeHtml(alt)}</figcaption></figure>`;
  });

  return work.replace(/\x00BLOGFIG(\d+)\x00/g, (_m, index: string) => figures[Number(index)] || "");
}

/** Quill/pasted HTML often sets inline color/background that breaks dark mode. */
function stripConflictingInlineStyles(html: string): string {
  if (!html || !html.includes("style=")) return html;
  return html.replace(/\sstyle=(["'])([\s\S]*?)\1/gi, (_match, quote: string, styles: string) => {
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

function prepareBlogBodyHtml(html: string, postTitle = ""): string {
  return stripConflictingInlineStyles(
    enhanceBlogBodyImages(stripEmbeddedAuthorBlocks(html), postTitle)
  );
}

export function buildTaxonomyIndex(
  posts: BlogPostRow[],
  authors: Record<string, BlogAuthorProfile>
): BlogTaxonomyIndex {
  const tagMap = new Map<string, { label: string; count: number }>();
  const authorMap = new Map<string, { name: string; count: number }>();

  for (const post of posts) {
    for (const tag of post.tags || []) {
      const slug = slugifyTaxonomy(tag);
      if (!slug) continue;
      const existing = tagMap.get(slug);
      if (existing) existing.count += 1;
      else tagMap.set(slug, { label: tag, count: 1 });
    }
    for (const authorSlug of post.authors || []) {
      if (!authorSlug) continue;
      const name = authors[authorSlug]?.name || authorSlug.replace(/-/g, " ");
      if (isOrgAuthorName(name)) continue;
      const existing = authorMap.get(authorSlug);
      if (existing) existing.count += 1;
      else authorMap.set(authorSlug, { name, count: 1 });
    }
  }

  return {
    tags: [...tagMap.entries()]
      .map(([slug, value]) => ({ slug, label: value.label, count: value.count }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    authors: [...authorMap.entries()]
      .map(([slug, value]) => ({ slug, name: value.name, count: value.count }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function postHasTag(post: BlogPostRow, tagSlug: string): boolean {
  return (post.tags || []).some((tag) => slugifyTaxonomy(tag) === tagSlug);
}

function tagLabelFromSlug(posts: BlogPostRow[], tagSlug: string): string {
  for (const post of posts) {
    for (const tag of post.tags || []) {
      if (slugifyTaxonomy(tag) === tagSlug) return tag;
    }
  }
  return tagSlug.replace(/-/g, " ");
}

function renderTagLinks(tags: string[], siteUrl: string): string {
  return (tags || [])
    .map((tag) => {
      const slug = slugifyTaxonomy(tag);
      const href = `${siteUrl}/posts/tag/${encodeURIComponent(slug)}/`;
      return `<a class="blog-tag" href="${escapeHtml(href)}">${escapeHtml(tag)}</a>`;
    })
    .join("");
}

function renderAuthorByline(profiles: BlogAuthorProfile[], siteUrl: string): string {
  if (!profiles.length) return "";
  const items = profiles
    .map((profile) => {
      const authorUrl = `${siteUrl}/posts/author/${encodeURIComponent(profile.slug)}/`;
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
            <a class="blog-author-name" href="${escapeHtml(authorUrl)}">${escapeHtml(profile.name)}</a>
            ${bio}
          </div>
        </div>`;
    })
    .join("");

  return `<aside class="blog-author-byline" aria-label="Article author">${items}</aside>`;
}

function renderTaxonomySidebar(
  taxonomy: BlogTaxonomyIndex,
  siteUrl: string,
  active?: { tag?: string; author?: string }
): string {
  const tagItems = taxonomy.tags
    .map(({ slug, label, count }) => {
      const activeClass = active?.tag === slug ? " is-active" : "";
      const href = `${siteUrl}/posts/tag/${encodeURIComponent(slug)}/`;
      return `<li><a class="sidebar-link${activeClass}" href="${escapeHtml(href)}">${escapeHtml(label)} <span class="sidebar-count">${count}</span></a></li>`;
    })
    .join("");

  const authorItems = taxonomy.authors
    .map(({ slug, name, count }) => {
      const activeClass = active?.author === slug ? " is-active" : "";
      const href = `${siteUrl}/posts/author/${encodeURIComponent(slug)}/`;
      return `<li><a class="sidebar-link${activeClass}" href="${escapeHtml(href)}">${escapeHtml(name)} <span class="sidebar-count">${count}</span></a></li>`;
    })
    .join("");

  return `
    <aside class="blog-sidebar" aria-label="Blog topics">
      ${taxonomy.tags.length ? `
        <div class="sidebar-block">
          <h2 class="sidebar-heading">Tags</h2>
          <ul class="sidebar-list">${tagItems}</ul>
        </div>
      ` : ""}
      ${taxonomy.authors.length ? `
        <div class="sidebar-block">
          <h2 class="sidebar-heading">Authors</h2>
          <ul class="sidebar-list">${authorItems}</ul>
        </div>
      ` : ""}
    </aside>`;
}

function renderBlogPageFooter(siteUrl: string, showBackLink = false): string {
  const blogUrl = `${siteUrl}/posts/`;
  const adminUrl = `${siteUrl}/admin/#blog`;
  const backLink = showBackLink
    ? `<a class="blog-back-link" href="${escapeHtml(blogUrl)}">← Back to the main blog</a>`
    : "";
  return `
    <nav class="blog-subpage-footer" aria-label="Blog navigation">
      ${backLink}
      <a class="blog-admin-edit-link" href="${escapeHtml(adminUrl)}" data-visibility="0">Edit blog posts</a>
    </nav>`;
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
html.dark {
  color-scheme: dark;
  --color-neutral: 30, 41, 59;
  --color-neutral-50: 15, 23, 42;
  --color-neutral-100: 30, 41, 59;
  --color-neutral-200: 51, 65, 85;
  --color-neutral-300: 71, 85, 105;
  --color-neutral-400: 100, 116, 139;
  --color-neutral-500: 148, 163, 184;
  --color-neutral-600: 203, 213, 225;
  --color-neutral-700: 226, 232, 240;
  --color-neutral-800: 241, 245, 249;
  --color-neutral-900: 248, 250, 252;
  --color-primary-50: 23, 37, 84;
  --color-primary-100: 30, 58, 138;
  --color-primary-200: 29, 78, 216;
  --color-primary-400: 96, 165, 250;
  --color-primary-600: 147, 197, 253;
  --color-primary-700: 191, 219, 254;
}
html.dark .event-card,
html.dark .blog-author-profile {
  background: rgb(var(--color-neutral-50));
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}
html.dark .event-meta {
  background: rgb(var(--color-neutral-100));
}
html.dark .blog-sidebar,
html.dark .blog-author-byline {
  background: rgb(var(--color-neutral-50));
}
html.dark .event-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
}
html.dark .site-nav-dropdown-menu {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}
html.dark .blog-author-profile-avatar {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}
html.dark .blog-article-body img,
html.dark .blog-inline-figure img {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}
html.dark .blog-article-body :where(p, li, span, div, blockquote, td, th, em, strong, b, i, u, ol, ul) {
  color: rgb(var(--color-neutral-700)) !important;
}
html.dark .blog-article-body :where(h1, h2, h3, h4, h5, h6) {
  color: rgb(var(--color-neutral-900)) !important;
}
html.dark .blog-article-body a {
  color: rgb(var(--color-primary-600)) !important;
}
html.dark .blog-article-body .blog-inline-figure figcaption {
  color: rgb(var(--color-neutral-500)) !important;
}
html.dark .blog-article-body blockquote {
  background: rgb(var(--color-neutral-100));
  border-left-color: rgb(var(--color-neutral-300));
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  background: rgb(var(--color-neutral));
  color: rgb(var(--color-neutral-800));
  line-height: 1.6;
}
a { color: rgb(var(--color-primary-600)); text-decoration: none; }
a:hover { color: rgb(var(--color-primary-700)); }
.site-header {
  border-bottom: 1px solid rgb(var(--color-neutral-200));
  background: rgb(var(--color-neutral));
}
.site-header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.5rem 1rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.site-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem 1rem;
  flex: 1;
  flex-wrap: wrap;
  min-width: 0;
}
.blog-appearance-switcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 8px;
  background: rgb(var(--color-neutral-50));
  color: rgb(var(--color-neutral-600));
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.blog-appearance-switcher:hover {
  color: rgb(var(--color-primary-600));
  border-color: rgb(var(--color-neutral-300));
}
.blog-appearance-icon {
  width: 1.1rem;
  height: 1.1rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.blog-appearance-icon--sun { display: none; }
html.dark .blog-appearance-icon--moon { display: none; }
html.dark .blog-appearance-icon--sun { display: block; }
.site-logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.site-logo img {
  display: block;
  max-height: 4.5rem;
  max-width: 18rem;
  width: auto;
  height: auto;
  object-fit: contain;
}
.hidden { display: none !important; }
.site-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem 1.25rem;
}
.site-nav a,
.site-nav-parent {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgb(var(--color-neutral-600));
  text-decoration: none;
  padding: 0.35rem 0;
}
.site-nav a:hover,
.site-nav-parent:hover { color: rgb(var(--color-primary-600)); }
.site-nav a.is-active,
.site-nav-parent.is-active { color: rgb(var(--color-primary-700)); font-weight: 600; }
.site-nav-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.15rem;
}
.site-nav-chevron {
  font-size: 0.65rem;
  color: rgb(var(--color-neutral-500));
  line-height: 1;
  pointer-events: none;
}
.site-nav-dropdown-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  min-width: 13rem;
  padding: 0.75rem 1rem;
  background: rgb(var(--color-neutral));
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 0.75rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, visibility 0.15s ease;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.site-nav-dropdown:hover .site-nav-dropdown-menu,
.site-nav-dropdown:focus-within .site-nav-dropdown-menu {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
.site-nav-dropdown-link {
  white-space: nowrap;
  font-size: 0.9rem;
}
.site-nav--desktop { display: flex; }
.site-header-tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.blog-menu-root { position: relative; }
.blog-menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 8px;
  background: rgb(var(--color-neutral-50));
  color: rgb(var(--color-neutral-600));
  cursor: pointer;
}
.blog-menu-toggle:hover { color: rgb(var(--color-primary-600)); }
.blog-menu-toggle svg {
  width: 1.15rem;
  height: 1.15rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
}
.blog-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  visibility: hidden;
  opacity: 0;
  overflow: auto;
  background: rgba(241, 245, 249, 0.95);
  backdrop-filter: blur(6px);
  transition: opacity 0.2s ease, visibility 0.2s ease;
}
html.dark .blog-menu-overlay {
  background: rgba(15, 23, 42, 0.95);
}
.blog-mobile-nav {
  list-style: none;
  margin: 0;
  padding: 1.25rem 1rem 2rem;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
}
.blog-mobile-nav-close {
  margin-bottom: 0.5rem;
}
.blog-mobile-nav-close button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgb(var(--color-neutral-600));
  cursor: pointer;
}
.blog-mobile-nav-close button:hover { color: rgb(var(--color-primary-600)); }
.blog-mobile-nav-close svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
}
.blog-mobile-nav-item { width: 100%; text-align: right; }
.blog-mobile-nav-label {
  display: block;
  padding: 0.5rem 0;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(var(--color-neutral-500));
}
.blog-mobile-nav-link {
  display: inline-block;
  padding: 0.45rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: rgb(var(--color-neutral-700));
  text-decoration: none;
}
.blog-mobile-nav-link:hover { color: rgb(var(--color-primary-600)); }
.blog-mobile-nav-link.is-active {
  color: rgb(var(--color-primary-700));
  font-weight: 600;
}
.blog-mobile-nav-item--child .blog-mobile-nav-link {
  font-size: 0.92rem;
  color: rgb(var(--color-neutral-600));
}
.blog-mobile-nav-spacer {
  height: 0.5rem;
  list-style: none;
}
main.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}
.blog-list-header { margin-bottom: 1.5rem; }
.blog-list-header h1 {
  margin: 0 0 0.35rem;
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: rgb(var(--color-neutral-900));
}
.blog-list-subtitle {
  margin: 0;
  color: rgb(var(--color-neutral-500));
  font-size: 1.05rem;
}
.blog-subpage-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.5rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgb(var(--color-neutral-200));
}
.blog-back-link {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgb(var(--color-primary-600));
  text-decoration: none;
}
.blog-back-link:hover {
  color: rgb(var(--color-primary-700));
  text-decoration: underline;
  text-underline-offset: 2px;
}
.blog-admin-edit-link {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgb(var(--color-neutral-600));
  text-decoration: none;
}
.blog-admin-edit-link:hover {
  color: rgb(var(--color-primary-600));
  text-decoration: underline;
  text-underline-offset: 2px;
}
.blog-seo-intro {
  margin-bottom: 1.5rem;
  color: rgb(var(--color-neutral-600));
  font-size: 1.02rem;
  line-height: 1.75;
}
.blog-seo-intro p { margin: 0; }
.blog-seo-intro p + p { margin-top: 0.75rem; }
.blog-seo-intro a { text-decoration: underline; text-underline-offset: 2px; }
.blog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 2.5rem;
  align-items: start;
}
.blog-main { min-width: 0; }
.list-card-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: 220px;
  overflow: hidden;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.event-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border-color: rgb(var(--color-neutral-400));
}
.event-card-image {
  flex: 0 0 340px;
  width: 340px;
  position: relative;
  min-height: 220px;
  background: rgb(var(--color-neutral-100));
}
.event-card-image::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--card-bg-image);
  background-size: cover;
  background-position: center;
  filter: blur(60px) brightness(0.92);
  transform: scale(1.15);
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
.event-content { flex: 1; padding: 1.5rem 1.25rem 0; display: flex; flex-direction: column; gap: 1.25rem; }
.event-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--color-neutral-900));
  letter-spacing: -0.02em;
  line-height: 1.25;
}
.event-description {
  color: rgb(var(--color-neutral-600));
  margin: 0;
  line-height: 1.65;
  font-size: 0.98rem;
}
.event-card-author-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}
.event-card-author-avatar {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
}
.event-card-author-avatar--placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--color-neutral-200));
  color: rgb(var(--color-neutral-700));
  font-weight: 700;
  font-size: 0.6rem;
}
.event-card-author-name {
  font-weight: 600;
  color: rgb(var(--color-neutral-800));
  font-size: 0.98rem;
  line-height: 1.2;
}
.event-meta-group {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1.25rem 1.75rem;
}
.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 1.75rem;
  padding: 0.875rem 1.25rem;
  margin: auto -1.25rem 0;
  background: rgb(var(--color-neutral-50));
  border-top: 1px solid rgb(var(--color-neutral-200));
}
.event-date-label, .event-location-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: rgb(var(--color-neutral-500));
}
.event-date-value, .event-location-value {
  font-weight: 600;
  color: rgb(var(--color-neutral-800));
  font-size: 0.98rem;
}
.event-date-value.event-author-value {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}
.blog-sidebar {
  position: sticky;
  top: 1rem;
  padding: 1rem;
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 12px;
  background: rgb(var(--color-neutral-50));
}
.sidebar-block + .sidebar-block { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid rgb(var(--color-neutral-200)); }
.sidebar-heading {
  margin: 0 0 0.65rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: rgb(var(--color-neutral-500));
}
.sidebar-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.sidebar-link {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: rgb(var(--color-neutral-700));
  text-decoration: none;
  padding: 0.2rem 0;
}
.sidebar-link:hover { color: rgb(var(--color-primary-600)); }
.sidebar-link.is-active {
  color: rgb(var(--color-primary-700));
  font-weight: 600;
}
.sidebar-count {
  font-size: 0.75rem;
  color: rgb(var(--color-neutral-400));
  font-weight: 500;
}
.blog-article { width: 100%; max-width: none; }
.blog-hero-image {
  width: 100%;
  max-height: 420px;
  aspect-ratio: 885 / 300;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 1.25rem;
}
.blog-article-title {
  font-size: clamp(1.75rem, 5vw, 2.2rem);
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 0.875rem;
  color: rgb(var(--color-neutral-900));
  letter-spacing: -0.03em;
}
.blog-article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 1.75rem;
  margin-bottom: 1rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  background: rgb(var(--color-neutral-50));
  border: 1px solid rgb(var(--color-neutral-200));
}
.blog-meta-block { display: flex; flex-direction: column; gap: 0.15rem; }
.blog-meta-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: rgb(var(--color-neutral-500));
}
.blog-meta-value {
  font-weight: 600;
  color: rgb(var(--color-neutral-800));
  font-size: 0.98rem;
}
.blog-tag-list { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem; }
.blog-tag {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: rgb(var(--color-neutral-100));
  border: 1px solid rgb(var(--color-neutral-200));
  color: rgb(var(--color-neutral-700));
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
}
.blog-tag:hover {
  background: rgb(var(--color-primary-50));
  border-color: rgb(var(--color-primary-200));
  color: rgb(var(--color-primary-700));
  text-decoration: none;
}
.blog-author-byline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.875rem 1rem;
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 8px;
  background: rgb(var(--color-neutral-50));
}
.blog-author-item { display: flex; align-items: center; gap: 0.875rem; }
.blog-author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
}
.blog-author-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--color-neutral-200));
  color: rgb(var(--color-neutral-700));
  font-weight: 700;
  font-size: 0.85rem;
}
.blog-author-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: rgb(var(--color-neutral-500));
}
.blog-author-name {
  font-weight: 600;
  color: rgb(var(--color-neutral-900));
  font-size: 1rem;
  text-decoration: none;
}
.blog-author-name:hover { color: rgb(var(--color-primary-700)); }
.blog-author-bio {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: rgb(var(--color-neutral-600));
  line-height: 1.45;
}
.blog-author-profile {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  padding: 1.75rem;
  margin-bottom: 2rem;
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 16px;
  background: linear-gradient(180deg, rgb(var(--color-neutral-50)), rgb(var(--color-neutral)));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.blog-author-profile-avatar {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgb(var(--color-neutral));
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}
.blog-author-profile-avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--color-primary-100));
  color: rgb(var(--color-primary-700));
  font-size: 2rem;
  font-weight: 800;
}
.blog-author-profile-body { min-width: 0; flex: 1; }
.blog-author-profile-label {
  margin: 0 0 0.35rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: rgb(var(--color-neutral-500));
}
.blog-author-profile-name {
  margin: 0 0 0.75rem;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: rgb(var(--color-neutral-900));
}
.blog-author-profile-bio {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgb(var(--color-neutral-600));
  max-width: 52rem;
}
.blog-author-profile-count {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(var(--color-neutral-500));
}
.blog-author-posts-heading {
  margin: 0 0 1.25rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: rgb(var(--color-neutral-800));
  letter-spacing: -0.02em;
}
@media (max-width: 640px) {
  .blog-author-profile {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .blog-author-profile-bio { margin-left: auto; margin-right: auto; }
}
.blog-article-body {
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgb(var(--color-neutral-700));
}
.blog-article-body img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 2rem 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.blog-article-body .blog-inline-figure {
  margin: 2rem 0;
  padding: 0;
}
.blog-article-body .blog-inline-figure img {
  margin: 0;
}
.blog-article-body .blog-inline-figure figcaption {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  font-style: italic;
  color: rgb(var(--color-neutral-500));
  text-align: center;
  line-height: 1.5;
}
.blog-article-body p:has(> img:only-child) {
  margin: 2rem 0;
}
.blog-article-body p:has(> img:only-child) img {
  margin: 0;
}
.blog-article-body p:has(> .blog-inline-figure:only-child) {
  margin: 2rem 0;
}
.blog-article-body p:has(> .blog-inline-figure:only-child) .blog-inline-figure {
  margin: 0;
}
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
  border-left: 3px solid rgb(var(--color-neutral-300));
  background: rgb(var(--color-neutral-50));
  border-radius: 0 6px 6px 0;
  color: rgb(var(--color-neutral-700));
}
.no-posts {
  padding: 2rem 1rem;
  color: rgb(var(--color-neutral-500));
  font-size: 1rem;
}
@media (max-width: 900px) {
  .blog-layout { grid-template-columns: 1fr; gap: 1.5rem; }
  .blog-sidebar { position: static; }
}
@media (max-width: 768px) {
  .site-nav--desktop { display: none !important; }
  .blog-menu-toggle { display: inline-flex; }
  .site-header-inner { padding: 0.4rem 0.75rem 0.5rem; }
  .site-logo img { max-height: 3rem; max-width: 11rem; }
  main.page-container { padding: 1rem 0.75rem 2rem; }
  .blog-list-header { margin-bottom: 1rem; }
  .blog-list-header h1 { font-size: 1.65rem; }
  .blog-list-subtitle { font-size: 0.95rem; }
  .blog-seo-intro { margin-bottom: 1rem; font-size: 0.95rem; line-height: 1.65; }
  .list-card-grid { gap: 0.875rem; }
  .event-card {
    flex-direction: column;
    min-height: 0;
    border-radius: 12px;
  }
  .event-card-image {
    flex: none;
    width: 100%;
    min-height: 0;
    aspect-ratio: 16 / 9;
    max-height: 200px;
  }
  .event-content { padding: 0.875rem 0.875rem 0; gap: 0.75rem; }
  .event-title { font-size: 1.15rem; line-height: 1.3; }
  .event-description { font-size: 0.9rem; line-height: 1.55; }
  .event-meta {
    padding: 0.65rem 0.875rem;
    margin-left: -0.875rem;
    margin-right: -0.875rem;
    gap: 0.875rem 1.25rem;
  }
  .event-meta-group { gap: 0.875rem 1.25rem; }
  .event-date-value, .event-location-value, .event-card-author-name { font-size: 0.9rem; }
  .blog-subpage-footer { margin-top: 1.5rem; padding-top: 1rem; }
  .blog-author-profile {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
    border-radius: 12px;
  }
  .blog-author-profile-avatar { width: 88px; height: 88px; }
  .blog-author-profile-name { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .blog-author-posts-heading { font-size: 1.15rem; margin-bottom: 0.75rem; }
  .blog-author-byline { padding: 0.75rem; margin-bottom: 1rem; }
  .blog-sidebar { padding: 0.75rem; border-radius: 10px; }
  .blog-hero-image { max-height: 200px; border-radius: 10px; margin-bottom: 1rem; }
  .blog-article-title { font-size: 1.55rem; margin-bottom: 0.75rem; }
  .blog-article-meta { gap: 0.75rem 1rem; margin-bottom: 0.75rem; }
  .blog-article-body { font-size: 1rem; line-height: 1.75; }
  .blog-article-body img,
  .blog-article-body .blog-inline-figure { margin: 1.25rem 0; }
}
`;

function resolveNavHref(item: SiteNavItem, siteUrl: string): string {
  if (!item.href) return "";
  return item.external ? item.href : `${siteUrl}${item.href}`;
}

function navVisibilityAttr(visibility?: number): string {
  if (visibility === undefined || visibility === 3) return "";
  return ` data-visibility="${visibility}"`;
}

function isBlogNavActive(item: SiteNavItem): boolean {
  return Boolean(item.blogActive);
}

function renderSiteNavLink(item: SiteNavItem, siteUrl: string): string {
  const href = resolveNavHref(item, siteUrl);
  const active = isBlogNavActive(item) ? " is-active" : "";
  const external = item.external ? ' target="_blank" rel="noopener noreferrer"' : "";
  const visibility = navVisibilityAttr(item.visibility);
  return `<a href="${escapeHtml(href)}" class="site-nav-link${active}"${external}${visibility}>${escapeHtml(item.label)}</a>`;
}

function renderSiteNavItem(item: SiteNavItem, siteUrl: string): string {
  if (!item.children?.length) {
    return renderSiteNavLink(item, siteUrl);
  }

  const childActive = item.children.some(isBlogNavActive);
  const parentActive = childActive ? " is-active" : "";
  const parentHref = item.href ? resolveNavHref(item, siteUrl) : "";
  const parentInner = parentHref
    ? `<a href="${escapeHtml(parentHref)}" class="site-nav-parent${parentActive}">${escapeHtml(item.label)}</a>`
    : `<span class="site-nav-parent${parentActive}">${escapeHtml(item.label)}</span>`;
  const children = item.children
    .map((child) => {
      const href = resolveNavHref(child, siteUrl);
      const active = isBlogNavActive(child) ? " is-active" : "";
      const external = child.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escapeHtml(href)}" class="site-nav-dropdown-link${active}"${external}>${escapeHtml(child.label)}</a>`;
    })
    .join("\n");

  return `
    <div class="site-nav-dropdown"${navVisibilityAttr(item.visibility)}>
      ${parentInner}
      <span class="site-nav-chevron" aria-hidden="true">▾</span>
      <div class="site-nav-dropdown-menu">${children}</div>
    </div>`;
}

function renderSiteNavMobileItem(item: SiteNavItem, siteUrl: string): string {
  const vis = navVisibilityAttr(item.visibility);
  if (!item.children?.length) {
    const href = resolveNavHref(item, siteUrl);
    const external = item.external ? ' target="_blank" rel="noopener noreferrer"' : "";
    const active = isBlogNavActive(item) ? " is-active" : "";
    return `<li class="blog-mobile-nav-item"${vis}><a href="${escapeHtml(href)}" class="blog-mobile-nav-link${active}"${external}>${escapeHtml(item.label)}</a></li>`;
  }

  const parentHref = item.href ? resolveNavHref(item, siteUrl) : "";
  const parentRow = parentHref
    ? `<li class="blog-mobile-nav-item"${vis}><a href="${escapeHtml(parentHref)}" class="blog-mobile-nav-link">${escapeHtml(item.label)}</a></li>`
    : `<li class="blog-mobile-nav-label"${vis}>${escapeHtml(item.label)}</li>`;
  const children = item.children
    .map((child) => {
      const href = resolveNavHref(child, siteUrl);
      const external = child.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      const active = isBlogNavActive(child) ? " is-active" : "";
      const childVis = navVisibilityAttr(child.visibility);
      return `<li class="blog-mobile-nav-item blog-mobile-nav-item--child"${childVis}><a href="${escapeHtml(href)}" class="blog-mobile-nav-link${active}"${external}>${escapeHtml(child.label)}</a></li>`;
    })
    .join("\n");
  return `${parentRow}\n${children}\n<li class="blog-mobile-nav-spacer" aria-hidden="true"></li>`;
}

function renderMobileMenu(siteUrl: string): string {
  const items = SITE_NAV.map((item) => renderSiteNavMobileItem(item, siteUrl)).join("\n");
  return `
    <div id="blog-menu-button" class="blog-menu-root">
      <div id="blog-menu-wrapper" class="blog-menu-overlay" aria-hidden="true">
        <ul class="blog-mobile-nav">
          <li id="blog-menu-close-button" class="blog-mobile-nav-close">
            <button type="button" aria-label="Close menu">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>
            </button>
          </li>
          ${items}
        </ul>
      </div>
    </div>`;
}

function renderAppearanceSwitcher(): string {
  return `
    <button id="appearance-switcher" type="button" class="blog-appearance-switcher" aria-label="Dark mode switcher" title="Toggle dark mode">
      <svg class="blog-appearance-icon blog-appearance-icon--moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
      <svg class="blog-appearance-icon blog-appearance-icon--sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
      </svg>
    </button>`;
}

function renderSiteHeader(siteUrl: string): string {
  const logoUrl = `${siteUrl}/img/DB_Logo_2025.png`;
  const nav = SITE_NAV.map((item) => renderSiteNavItem(item, siteUrl)).join("\n");

  return `
    <header class="site-header">
      <div class="site-header-inner">
        <a class="site-logo" href="${escapeHtml(siteUrl)}/">
          <img src="${escapeHtml(logoUrl)}" alt="Gibraltar Dice Bastion" width="288" height="72">
        </a>
        <div class="site-header-actions">
          <nav class="site-nav site-nav--desktop" aria-label="Main">${nav}</nav>
          <div class="site-header-tools">
            ${renderAppearanceSwitcher()}
            <button id="blog-menu-icon" type="button" class="blog-menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="blog-menu-wrapper">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
            </button>
          </div>
        </div>
      </div>
      ${renderMobileMenu(siteUrl)}
    </header>`;
}

interface PageShellOptions {
  jsonLd?: object;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: "website" | "article" | "profile";
}

function pageShell(
  title: string,
  description: string,
  canonical: string,
  siteUrl: string,
  bodyHtml: string,
  options: PageShellOptions = {}
): string {
  const ogImage = ensureAbsoluteImageUrl(options.ogImage || defaultOgImage(siteUrl), siteUrl);
  const ogImageAlt = options.ogImageAlt || SITE_NAME;
  const ogType = options.ogType || "website";
  const fullTitle = `${title} | Dice Bastion`;
  const jsonLd = options.jsonLd ? jsonLdScript(options.jsonLd) : "";

  return `<!DOCTYPE html>
<html lang="en-GB" class="scroll-smooth" data-default-appearance="light" data-auto-appearance="true">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="sitemap" type="application/xml" title="Blog Sitemap" href="${escapeHtml(siteUrl)}/posts/sitemap.xml">
  <link rel="sitemap" type="application/xml" title="Blog Image Sitemap" href="${escapeHtml(siteUrl)}/posts/sitemap-images.xml">
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
  <meta property="og:locale" content="en_GB">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <meta name="twitter:image:alt" content="${escapeHtml(ogImageAlt)}">
  ${jsonLd}
  <script src="${escapeHtml(siteUrl)}/js/appearance.js"></script>
  <style>${PAGE_CSS}</style>
</head>
<body>
  ${renderSiteHeader(siteUrl)}
  <main class="page-container">${bodyHtml}</main>
  <script src="${escapeHtml(siteUrl)}/js/utils.js?v=2"></script>
  <script src="${escapeHtml(siteUrl)}/js/loginStatus.js"></script>
  <script src="${escapeHtml(siteUrl)}/js/blog-mobilemenu.js"></script>
</body>
</html>`;
}

function renderPostCardAuthorValue(profiles: BlogAuthorProfile[]): string {
  if (!profiles.length) return "";
  const names = profiles.map((profile) => profile.name).join(" & ");
  const first = profiles[0];
  const avatar = first.image
    ? `<img class="event-card-author-avatar" src="${escapeHtml(first.image)}" alt="" width="22" height="22" loading="lazy">`
    : `<span class="event-card-author-avatar event-card-author-avatar--placeholder" aria-hidden="true">${escapeHtml(authorInitials(first.name))}</span>`;

  return `<span class="event-card-author-inline">${avatar}<span class="event-card-author-name">${escapeHtml(names)}</span></span>`;
}

function renderPostCardMetaPrimary(dateStr: string, authorValue: string): string {
  const publishedBlock = dateStr
    ? `
              <div class="blog-meta-block">
                <div class="event-date-label">Published</div>
                <div class="event-date-value">${escapeHtml(dateStr)}</div>
              </div>`
    : "";

  const authorBlock = authorValue
    ? `
              <div class="blog-meta-block">
                <div class="event-date-label">By</div>
                <div class="event-date-value event-author-value">${authorValue}</div>
              </div>`
    : "";

  if (!publishedBlock && !authorBlock) return "";

  return `
            <div class="event-meta-group">
              ${publishedBlock}
              ${authorBlock}
            </div>`;
}

interface PostCardOptions {
  showAuthor?: boolean;
}

function renderPostCard(
  post: BlogPostRow,
  siteUrl: string,
  authors: Record<string, BlogAuthorProfile> = {},
  options: PostCardOptions = {}
): string {
  const img = cardImage(post);
  const summary = post.excerpt || post.seo_description || "";
  const dateStr = formatDate(post.published_at);
  const category = (post.categories || [])[0] || "";
  const postUrl = `${siteUrl}/posts/${encodeURIComponent(post.slug)}/`;
  const showAuthor = options.showAuthor !== false;
  const authorValue = showAuthor
    ? renderPostCardAuthorValue(resolvePostAuthors(post, authors))
    : "";
  const metaPrimary = renderPostCardMetaPrimary(dateStr, authorValue);

  return `
    <a href="${escapeHtml(postUrl)}" class="event-card-link">
      <div class="event-card">
        ${img ? `<div class="event-card-image" style="--card-bg-image: url('${escapeHtml(img)}');"><img src="${escapeHtml(img)}" alt="${escapeHtml(post.title)}" loading="lazy" decoding="async"></div>` : ""}
        <div class="event-content">
          <h2 class="event-title">${escapeHtml(post.title)}</h2>
          ${summary ? `<p class="event-description">${escapeHtml(summary)}</p>` : ""}
          <div class="event-meta">
            ${metaPrimary}
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

interface ListPageOptions {
  title: string;
  subtitle?: string;
  seoIntroHtml?: string;
  canonical: string;
  metaDescription: string;
  activeTag?: string;
  activeAuthor?: string;
  showSubpageFooter?: boolean;
  jsonLd?: object;
}

function renderBlogListLayout(
  allPosts: BlogPostRow[],
  displayedPosts: BlogPostRow[],
  authors: Record<string, BlogAuthorProfile>,
  siteUrl: string,
  options: ListPageOptions
): string {
  const taxonomy = buildTaxonomyIndex(allPosts, authors);
  const cards = displayedPosts.length
    ? displayedPosts.map((p) => renderPostCard(p, siteUrl, authors)).join("\n")
    : `<div class="no-posts">No posts in this section yet.</div>`;

  const body = `
    <header class="blog-list-header">
      <h1>${escapeHtml(options.title)}</h1>
      ${options.subtitle ? `<p class="blog-list-subtitle">${escapeHtml(options.subtitle)}</p>` : ""}
    </header>
    ${options.seoIntroHtml || ""}
    <div class="blog-layout">
      <div class="blog-main">
        <section class="list-card-grid">${cards}</section>
        ${renderBlogPageFooter(siteUrl, !!options.showSubpageFooter)}
      </div>
      ${renderTaxonomySidebar(taxonomy, siteUrl, { tag: options.activeTag, author: options.activeAuthor })}
    </div>`;

  return pageShell(options.title, options.metaDescription, options.canonical, siteUrl, body, {
    ogImage: defaultOgImage(siteUrl),
    ogType: "website",
    jsonLd: options.jsonLd,
  });
}

export function renderBlogListPage(
  posts: BlogPostRow[],
  authors: Record<string, BlogAuthorProfile>,
  siteUrl: string
): string {
  return renderBlogListLayout(posts, posts, authors, siteUrl, {
    title: "Blog",
    seoIntroHtml: renderBlogIndexIntro(siteUrl),
    canonical: `${siteUrl}/posts/`,
    metaDescription: BLOG_SEO_DESCRIPTION,
    jsonLd: buildBlogIndexJsonLd(posts, siteUrl),
  });
}

export function renderBlogTagPage(
  tagSlug: string,
  posts: BlogPostRow[],
  authors: Record<string, BlogAuthorProfile>,
  siteUrl: string
): string {
  const label = tagLabelFromSlug(posts, tagSlug);
  const filtered = posts.filter((post) => postHasTag(post, tagSlug));
  return renderBlogListLayout(posts, filtered, authors, siteUrl, {
    title: label,
    subtitle: `Posts tagged “${label}”.`,
    canonical: `${siteUrl}/posts/tag/${encodeURIComponent(tagSlug)}/`,
    metaDescription: `Board game blog posts tagged “${label}” from Gibraltar Dice Bastion.`,
    activeTag: tagSlug,
    showSubpageFooter: true,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `Posts tagged “${label}”`,
      description: `Blog posts tagged “${label}” on Dice Bastion.`,
      url: `${siteUrl}/posts/tag/${encodeURIComponent(tagSlug)}/`,
      isPartOf: { "@type": "Blog", name: "Dice Bastion Blog", url: `${siteUrl}/posts/` },
      publisher: publisherJsonLd(siteUrl),
    },
  });
}

export function renderBlogAuthorPage(
  authorSlug: string,
  posts: BlogPostRow[],
  authors: Record<string, BlogAuthorProfile>,
  siteUrl: string
): string {
  const profile = authors[authorSlug];
  const name = profile?.name || authorSlug.replace(/-/g, " ");
  const bio = profile?.bio || "";
  const image = profile?.image || "";
  const filtered = posts.filter((post) => (post.authors || []).includes(authorSlug));
  const postCount = filtered.length;
  const canonical = `${siteUrl}/posts/author/${encodeURIComponent(authorSlug)}/`;
  const metaDescription = bio
    ? `${bio.slice(0, 155)}${bio.length > 155 ? "…" : ""}`
    : `Articles by ${name} on the Dice Bastion blog.`;
  const taxonomy = buildTaxonomyIndex(posts, authors);

  const avatar = image
    ? `<img class="blog-author-profile-avatar" src="${escapeHtml(image)}" alt="" width="120" height="120" loading="eager">`
    : `<div class="blog-author-profile-avatar blog-author-profile-avatar--placeholder" aria-hidden="true">${escapeHtml(authorInitials(name))}</div>`;

  const profileHeader = `
    <header class="blog-author-profile">
      ${avatar}
      <div class="blog-author-profile-body">
        <p class="blog-author-profile-label">Author</p>
        <h1 class="blog-author-profile-name">${escapeHtml(name)}</h1>
        ${bio ? `<p class="blog-author-profile-bio">${escapeHtml(bio)}</p>` : ""}
        <p class="blog-author-profile-count">${postCount} ${postCount === 1 ? "article" : "articles"}</p>
      </div>
    </header>`;

  const cards = filtered.length
    ? filtered.map((p) => renderPostCard(p, siteUrl, authors, { showAuthor: false })).join("\n")
    : `<div class="no-posts">No published articles yet.</div>`;

  const body = `
    <div class="blog-layout">
      <div class="blog-main">
        ${profileHeader}
        <h2 class="blog-author-posts-heading">Articles by ${escapeHtml(name)}</h2>
        <section class="list-card-grid">${cards}</section>
        ${renderBlogPageFooter(siteUrl, true)}
      </div>
      ${renderTaxonomySidebar(taxonomy, siteUrl, { author: authorSlug })}
    </div>`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${name} — Dice Bastion Blog`,
    description: metaDescription,
    url: canonical,
    mainEntity: {
      "@type": "Person",
      name,
      description: bio || undefined,
      image: image || undefined,
      url: canonical,
    },
    isPartOf: { "@type": "Blog", name: "Dice Bastion Blog", url: `${siteUrl}/posts/` },
    publisher: publisherJsonLd(siteUrl),
  };

  return pageShell(name, metaDescription, canonical, siteUrl, body, {
    ogImage: image || defaultOgImage(siteUrl),
    ogType: "profile",
    jsonLd,
  });
}

export function renderBlogPostPage(
  post: BlogPostRow,
  authors: Record<string, BlogAuthorProfile>,
  siteUrl: string,
  allPosts: BlogPostRow[] = []
): string {
  const hero = heroImage(post);
  const dateStr = formatDate(post.published_at);
  const authorProfiles = resolvePostAuthors(post, authors);
  const canonical = `${siteUrl}/posts/${encodeURIComponent(post.slug)}/`;
  const description = post.seo_description || post.excerpt || post.title;
  const ogImage = resolvePostOgImage(post, siteUrl);
  const tags = renderTagLinks(post.tags || [], siteUrl);
  const category = (post.categories || []).join(", ");
  const sanitizedBody = prepareBlogBodyHtml(post.html || "", post.title);
  const heroSrc = hero ? ensureAbsoluteImageUrl(hero, siteUrl) : "";
  const taxonomy = buildTaxonomyIndex(allPosts.length ? allPosts : [post], authors);

  const articleHtml = `
    <article class="blog-article">
      ${heroSrc ? `<img class="blog-hero-image" src="${escapeHtml(heroSrc)}" alt="${escapeHtml(post.title)}" width="885" height="300" loading="eager" decoding="async" fetchpriority="high">` : ""}
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
      ${renderAuthorByline(authorProfiles, siteUrl)}
      <div class="blog-article-body">${sanitizedBody}</div>
    </article>`;

  const body = `
    <div class="blog-layout">
      <div class="blog-main">${articleHtml}</div>
      ${renderTaxonomySidebar(taxonomy, siteUrl, {})}
    </div>`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    image: postJsonLdImages(post, siteUrl),
    author: authorProfiles.map((profile) => ({
      "@type": "Person",
      name: profile.name,
      url: `${siteUrl}/posts/author/${encodeURIComponent(profile.slug)}/`,
    })),
    publisher: publisherJsonLd(siteUrl),
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    isPartOf: { "@type": "Blog", name: "Dice Bastion Blog", url: `${siteUrl}/posts/` },
  };

  return pageShell(post.title, description, canonical, siteUrl, body, {
    jsonLd,
    ogImage,
    ogImageAlt: post.title,
    ogType: "article",
  });
}

export function renderBlogSitemap(
  posts: BlogPostRow[],
  authors: Record<string, BlogAuthorProfile>,
  siteUrl: string
): string {
  const today = new Date().toISOString().split("T")[0];
  const indexLastmod = latestIsoDate(posts);
  const taxonomy = buildTaxonomyIndex(posts, authors);
  const urls: string[] = [
    `  <url>\n    <loc>${siteUrl}/posts/</loc>\n    <lastmod>${indexLastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`,
  ];

  for (const post of posts) {
    const lastmod = post.updated_at || post.published_at;
    const mod = lastmod ? new Date(lastmod).toISOString().split("T")[0] : today;
    const images = collectPostImageUrlsForSitemap(post, siteUrl);
    const imageEntries = images
      .map(
        (loc) =>
          `    <image:image>\n      <image:loc>${escapeHtml(loc)}</image:loc>\n      <image:title>${escapeHtml(post.title)}</image:title>\n    </image:image>`
      )
      .join("\n");
    const imageBlock = imageEntries ? `\n${imageEntries}` : "";
    urls.push(
      `  <url>\n    <loc>${siteUrl}/posts/${encodeURIComponent(post.slug)}/</loc>${imageBlock}\n    <lastmod>${mod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    );
  }

  for (const tag of taxonomy.tags) {
    urls.push(
      `  <url>\n    <loc>${siteUrl}/posts/tag/${encodeURIComponent(tag.slug)}/</loc>\n    <lastmod>${indexLastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`
    );
  }

  for (const author of taxonomy.authors) {
    urls.push(
      `  <url>\n    <loc>${siteUrl}/posts/author/${encodeURIComponent(author.slug)}/</loc>\n    <lastmod>${indexLastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>`;
}

/** Google Image Sitemap — helps Image Search discover post photos. */
export function renderBlogImageSitemap(posts: BlogPostRow[], siteUrl: string): string {
  const urls: string[] = [];

  for (const post of posts) {
    const images = collectPostImageUrlsForSitemap(post, siteUrl);
    if (!images.length) continue;

    const pageUrl = `${siteUrl}/posts/${encodeURIComponent(post.slug)}/`;
    const imageEntries = images
      .map(
        (loc) =>
          `    <image:image>\n      <image:loc>${escapeHtml(loc)}</image:loc>\n      <image:title>${escapeHtml(post.title)}</image:title>\n    </image:image>`
      )
      .join("\n");

    urls.push(`  <url>\n    <loc>${escapeHtml(pageUrl)}</loc>\n${imageEntries}\n  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
}
