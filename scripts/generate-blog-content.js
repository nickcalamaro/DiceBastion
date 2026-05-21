const fs = require('fs');
const path = require('path');

const API_URL = (process.env.BLOG_API_URL || 'https://dicebastionblogger-yvfyf.bunny.run').replace(/\/+$/, '');
const BUILD_SECRET = process.env.BLOG_BUILD_SECRET;
const POSTS_DIR = path.join(__dirname, '../content/posts');
const AUTHORS_DIR = path.join(__dirname, '../data/authors');
const MANIFEST_PATH = path.join(POSTS_DIR, '.blog-generated-manifest.json');
const AUTHORS_MANIFEST_PATH = path.join(AUTHORS_DIR, '.blog-generated-manifest.json');

function yamlEscape(str) {
  if (str == null || str === '') return '""';
  const value = String(str);
  if (/[:#"'\n]/.test(value) || value.startsWith(' ') || value.endsWith(' ')) {
    return JSON.stringify(value);
  }
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function arrayToYaml(arr) {
  const items = Array.isArray(arr) ? arr.filter(Boolean) : [];
  if (items.length === 0) return '[]';
  return `[${items.map(yamlEscape).join(', ')}]`;
}

function buildFrontMatter(post) {
  const date = post.published_at || new Date().toISOString();
  const lines = [
    '---',
    `title: ${yamlEscape(post.title)}`,
    `date: ${date}`,
    'draft: false',
  ];

  const description = post.seo_description || post.excerpt;
  if (description) {
    lines.push(`description: ${yamlEscape(description)}`);
  }

  lines.push(`tags: ${arrayToYaml(post.tags)}`);
  lines.push(`categories: ${arrayToYaml(post.categories)}`);
  lines.push(`series: ${arrayToYaml(post.series)}`);
  lines.push(`authors: ${arrayToYaml(post.authors)}`);

  if (post.featured_image_card) {
    lines.push(`cardImage: ${yamlEscape(post.featured_image_card)}`);
  } else if (post.featured_image) {
    lines.push(`cardImage: ${yamlEscape(post.featured_image)}`);
  }
  if (post.featured_image_hero) {
    lines.push(`featureimage: ${yamlEscape(post.featured_image_hero)}`);
    lines.push(`heroImage: ${yamlEscape(post.featured_image_hero)}`);
  } else if (post.featured_image) {
    lines.push(`featureimage: ${yamlEscape(post.featured_image)}`);
  }
  if (post.featured_image) {
    lines.push(`featuredImage: ${yamlEscape(post.featured_image)}`);
  }
  if (post.seo_image) {
    lines.push(`images: [${yamlEscape(post.seo_image)}]`);
  }

  lines.push('showTaxonomies: true');
  lines.push('showAuthor: true');
  lines.push('---');
  return lines.join('\n');
}

function readManifest(filePath) {
  if (!fs.existsSync(filePath)) return { slugs: [] };
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return { slugs: [] };
  }
}

function writeManifest(filePath, slugs) {
  fs.writeFileSync(filePath, JSON.stringify({
    slugs,
    generatedAt: new Date().toISOString(),
  }, null, 2), 'utf8');
}

function removeStaleFiles(dir, oldSlugs, newSlugs, extension) {
  for (const slug of oldSlugs) {
    if (newSlugs.has(slug)) continue;
    const filePath = path.join(dir, `${slug}${extension}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Removed stale file: ${path.relative(process.cwd(), filePath)}`);
    }
  }
}

function writeAuthorYaml(author) {
  const lines = [`name: ${yamlEscape(author.name || author.slug)}`];
  if (author.image) lines.push(`image: ${yamlEscape(author.image)}`);
  if (author.bio) lines.push(`bio: ${yamlEscape(author.bio)}`);
  fs.writeFileSync(path.join(AUTHORS_DIR, `${author.slug}.yaml`), `${lines.join('\n')}\n`, 'utf8');
}

async function fetchPublishedPosts() {
  const url = `${API_URL}/internal/blog/published`;
  let res;
  try {
    res = await fetch(url, {
      headers: { 'X-Build-Secret': BUILD_SECRET || '' },
    });
  } catch (error) {
    const cause = error?.cause?.code || error?.cause?.reason || error?.message || String(error);
    const hint = cause.includes('CERT') || cause.includes('TLS') || cause.includes('altnames')
      ? ' Check BLOG_API_URL — use the exact Edge Script URL from Bunny (e.g. https://dicebastionblog-xxxxx.bunny.run), not a made-up hostname.'
      : '';
    throw new Error(`Failed to reach blog API at ${url}: ${cause}.${hint}`);
  }
  if (!res.ok) {
    const body = await res.text();
    let hint = '';
    try {
      const parsed = JSON.parse(body);
      if (String(parsed.error || '').includes('401') || parsed.error === 'database_not_configured') {
        hint = ' Configure BUNNY_DATABASE_URL and BUNNY_DATABASE_AUTH_TOKEN on Bunny script 75941 (same values as the bookings script).';
      }
    } catch { /* ignore */ }
    throw new Error(`Failed to fetch published posts from ${url}: ${res.status} ${body}.${hint}`);
  }
  return res.json();
}

async function main() {
  if (!BUILD_SECRET) {
    console.warn('BLOG_BUILD_SECRET not set — skipping blog content generation');
    return;
  }
  if (!API_URL) {
    console.warn('BLOG_API_URL not set — skipping blog content generation (set GitHub repo variable BLOG_API_URL to your Bunny script URL)');
    return;
  }

  const data = await fetchPublishedPosts();
  const posts = data.posts || [];
  const authors = data.authors || [];

  fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.mkdirSync(AUTHORS_DIR, { recursive: true });

  const indexPath = path.join(POSTS_DIR, '_index.md');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, `---
title: Blog
description: News, updates, and stories from Dice Bastion.
---
Welcome to the Dice Bastion blog.
`, 'utf8');
  }

  const oldPostManifest = readManifest(MANIFEST_PATH);
  const newPostSlugs = new Set(posts.map((post) => post.slug));
  removeStaleFiles(POSTS_DIR, oldPostManifest.slugs || [], newPostSlugs, '.md');

  const generatedPostSlugs = [];
  for (const post of posts) {
    const content = `${buildFrontMatter(post)}\n${post.html || ''}\n`;
    fs.writeFileSync(path.join(POSTS_DIR, `${post.slug}.md`), content, 'utf8');
    generatedPostSlugs.push(post.slug);
    console.log(`Generated post: ${post.slug}.md`);
  }
  writeManifest(MANIFEST_PATH, generatedPostSlugs);

  const oldAuthorManifest = readManifest(AUTHORS_MANIFEST_PATH);
  const newAuthorSlugs = new Set(authors.map((author) => author.slug));
  removeStaleFiles(AUTHORS_DIR, oldAuthorManifest.slugs || [], newAuthorSlugs, '.yaml');

  const generatedAuthorSlugs = [];
  for (const author of authors) {
    if (!author.slug) continue;
    writeAuthorYaml(author);
    generatedAuthorSlugs.push(author.slug);
    console.log(`Generated author: ${author.slug}.yaml`);
  }
  writeManifest(AUTHORS_MANIFEST_PATH, generatedAuthorSlugs);

  console.log(`Blog content generation complete: ${posts.length} posts, ${authors.length} authors`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
