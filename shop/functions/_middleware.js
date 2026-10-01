/**
 * Shop Pages middleware:
 * 1) Legacy /?product= and /?category= URLs 301 to the product and category paths.
 * 2) Homepage HTML gets crawlable product/category links injected (like events listing).
 * People and crawlers share /products/:slug and /products/category/:slug.
 * A category slug uses the same hyphen replace as an event slug.
 * The Worker serves SEO HTML to crawlers and the shop UI to everyone else.
 */

// workers.dev currently 404s; custom-domain /api proxy is the live API
const API_BASE = 'https://dicebastion.com/api';
const SHOP_ORIGIN = 'https://shop.dicebastion.com';

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function categorySlug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function categoryTags(field) {
  return String(field || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
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

function buildSeoCrawlNav(products) {
  const categories = new Set();
  for (const p of products) {
    categoryTags(p.category).forEach((c) => categories.add(c));
  }

  const categoryLinks = [...categories]
    .sort((a, b) => a.localeCompare(b))
    .map(
      (c) =>
        `<a href="/products/category/${categorySlug(c)}">${escapeHtml(c)}</a>`
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
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const product = (url.searchParams.get('product') || '').trim();
  const category = (url.searchParams.get('category') || '').trim();

  if (path === '/' && (product || category)) {
    const destPath = product
      ? `/products/${encodeURIComponent(product)}`
      : `/products/category/${categorySlug(category)}`;
    const dest = new URL(destPath, SHOP_ORIGIN);
    const q = (url.searchParams.get('q') || '').trim();
    if (q) dest.searchParams.set('q', q);
    return Response.redirect(dest.toString(), 301);
  }

  const response = await next();

  if (path === '/') {
    return injectHomepageCrawlLinks(response);
  }

  return response;
}
