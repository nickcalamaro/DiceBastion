/**
 * Shop Pages middleware: social/SEO bots hitting /?product=slug get minimal OG HTML
 * so WhatsApp/Discord/Facebook previews show product image + summary. Humans pass through
 * to Hugo (modal opens via existing client JS).
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

function ogHtml({ name, description, image, shareUrl }) {
  const title = escapeHtml(name);
  const desc = escapeHtml(truncateMeta(description, 160));
  const img = escapeHtml(image);
  const url = escapeHtml(shareUrl);
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
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
${imgMeta}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="${url}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<link rel="canonical" href="${url}">
</head>
<body>
<h1>${title}</h1>
<p>${desc}</p>
${img ? `<p><img src="${img}" alt="${title}"></p>` : ''}
<p><a href="${url}">View in Dice Bastion Shop</a></p>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, next } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }

  const url = new URL(request.url);
  const slug = (url.searchParams.get('product') || '').trim();
  if (!slug || !isBot(request)) {
    return next();
  }

  try {
    const apiUrl = `${API_BASE}/products/${encodeURIComponent(slug)}`;
    const res = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DiceBastion-shop-og/1'
      }
    });

    if (!res.ok) {
      return next();
    }

    const product = await res.json();
    if (!product || !product.name || product.error) {
      return next();
    }

    const shareUrl = `${SHOP_ORIGIN}/?product=${encodeURIComponent(product.slug || slug)}`;
    const html = ogHtml({
      name: product.name,
      description: productDescription(product),
      image: absoluteImageUrl(product.image_url),
      shareUrl
    });

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600'
      }
    });
  } catch (_) {
    return next();
  }
}
