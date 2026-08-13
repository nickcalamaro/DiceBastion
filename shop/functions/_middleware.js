/**
 * Shop Pages middleware:
 * 1) Social bots on /?product=slug get OG HTML (canonical → /products/slug).
 * 2) Homepage HTML gets crawlable product/category links injected (like events listing).
 * Humans still use the shop UI + product modal; /products/:slug 302s humans to /?product=.
 */

const API_BASE = 'https://dicebastion-memberships.ncalamaro.workers.dev';
const SHOP_ORIGIN = 'https://shop.dicebastion.com';

const BOT_UA =
  /googlebot|google-inspectiontool|google-structured-data-testing-tool|google-read-aloud|storebot-google|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|gptbot|chatgpt|anthropic|claude|crawler|spider|bot\/|crawl/i;

function isBot(request) {
  const ua = request.headers.get('User-Agent') || '';
  return BOT_UA.test(ua);
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateMeta(text, maxLen) {
  const t = String(text || '').trim();
  if (t.length <= maxLen) return t;
  const sliced = t.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace > maxLen * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return cut.trim() + '...';
}

function productDescription(product) {
  const summary = typeof product.summary === 'string' ? product.summary.trim() : '';
  if (summary) return summary;
  const description =
    typeof product.description === 'string' ? product.description.trim() : '';
  if (description) return description;
  const fromFull = stripHtml(product.full_description);
  if (fromFull) return fromFull;
  return 'Available from Dice Bastion in Gibraltar — board games, Magic: The Gathering (MTG), trading cards, miniatures, and accessories.';
}

function absoluteImageUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return `${SHOP_ORIGIN}${raw}`;
  return `${SHOP_ORIGIN}/${raw}`;
}

function responseWithHtml(html, status = 200, baseHeaders = null) {
  const headers = new Headers(baseHeaders || undefined);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.delete('content-length');
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  }
  return new Response(html, { status, headers });
}

function ogHtml({ name, description, image, canonicalUrl, shareUrl }) {
  const title = escapeHtml(name);
  const desc = escapeHtml(truncateMeta(description, 160));
  const img = escapeHtml(image);
  const canonical = escapeHtml(canonicalUrl);
  const share = escapeHtml(shareUrl);
  const imgMeta = img
    ? `<meta property="og:image" content="${img}">
<meta property="og:image:alt" content="${title}">
<meta name="twitter:image" content="${img}">
<meta name="twitter:image:alt" content="${title}">`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | Dice Bastion Shop</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Dice Bastion Shop">
<meta property="og:url" content="${share}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
${imgMeta}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="${share}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<link rel="canonical" href="${canonical}">
</head>
<body>
<h1>${title}</h1>
<p>${desc}</p>
${img ? `<p><img src="${img}" alt="${title}"></p>` : ''}
<p><a href="${share}">Open in Dice Bastion Shop</a></p>
</body>
</html>`;
}

function buildSeoCrawlNav(products) {
  const categories = new Set();
  for (const p of products) {
    if (!p.category) continue;
    String(p.category)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
      .forEach((c) => categories.add(c));
  }

  const categoryLinks = [...categories]
    .sort((a, b) => a.localeCompare(b))
    .map(
      (c) =>
        `<a href="/products/category/${encodeURIComponent(c)}">${escapeHtml(c)}</a>`
    )
    .join('\n          ');

  const productLinks = products
    .filter((p) => p.slug)
    .map(
      (p) =>
        `<a href="/products/${encodeURIComponent(p.slug)}">${escapeHtml(p.name || p.slug)}</a>`
    )
    .join('\n          ');

  if (!productLinks && !categoryLinks) return '';

  return `
      <nav data-seo-product-links="1" aria-label="Shop products" style="padding:1.5rem 1rem;text-align:center;font-size:0.85rem;color:#888;border-top:1px solid rgba(128,128,128,0.2)">
        ${
          categoryLinks
            ? `<p style="margin-bottom:0.5rem;font-weight:600;color:#aaa">Categories</p>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.5rem 1.25rem;margin-bottom:1rem">${categoryLinks}</div>`
            : ''
        }
        <p style="margin-bottom:0.5rem;font-weight:600;color:#aaa">All Products</p>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.5rem 1.25rem">
          ${productLinks}
        </div>
      </nav>`;
}

async function fetchActiveProducts() {
  const res = await fetch(`${API_BASE}/products`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'DiceBastion-shop-seo/1'
    }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function handleProductOg(request, next, slug) {
  try {
    const apiUrl = `${API_BASE}/products/${encodeURIComponent(slug)}`;
    const res = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DiceBastion-shop-og/1'
      }
    });

    if (!res.ok) return next();

    const product = await res.json();
    if (!product || !product.name || product.error) return next();

    const productSlug = product.slug || slug;
    const shareUrl = `${SHOP_ORIGIN}/?product=${encodeURIComponent(productSlug)}`;
    const canonicalUrl = `${SHOP_ORIGIN}/products/${encodeURIComponent(productSlug)}`;
    const html = ogHtml({
      name: product.name,
      description: productDescription(product),
      image: absoluteImageUrl(product.image_url),
      canonicalUrl,
      shareUrl
    });

    return responseWithHtml(html);
  } catch (_) {
    return next();
  }
}

async function injectHomepageCrawlLinks(response) {
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return response;

  let html = await response.text();
  if (html.includes('data-seo-product-links')) {
    return responseWithHtml(html, response.status, response.headers);
  }

  try {
    const products = await fetchActiveProducts();
    const nav = buildSeoCrawlNav(products);
    if (nav) {
      html = html.includes('</body>')
        ? html.replace('</body>', `${nav}\n</body>`)
        : html + nav;
    }
  } catch (_) {
    // Pass through unmodified HTML if product fetch fails
  }

  return responseWithHtml(html, response.status, response.headers);
}

export async function onRequest(context) {
  const { request, next } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }

  const url = new URL(request.url);
  const slug = (url.searchParams.get('product') || '').trim();

  if (slug && isBot(request)) {
    return handleProductOg(request, next, slug);
  }

  const response = await next();

  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (path === '/') {
    return injectHomepageCrawlLinks(response);
  }

  return response;
}
