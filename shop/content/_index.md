---
title: "Dice Bastion Shop - Gibraltar board games, trading cards and accessories"
description: "Shop board games, Magic: The Gathering (MTG), trading cards, and accessories in Gibraltar."
---

<div id="shop-app">
  <div class="shop-header">
    <h1>Welcome to the Dice Bastion Shop</h1>
    <p>Browse our collection in Gibraltar: board games, <strong>Magic: The Gathering</strong> (MTG), trading cards, miniatures, dice, and gaming accessories. Local pickup and delivery available across Gibraltar.</p>
  </div>
  
  <!-- Search Bar -->
  <div class="search-container">
    <div class="search-input-wrapper">
      <label for="search-input" class="visually-hidden">Search products</label>
      <input type="text" id="search-input" placeholder="Search products by name or keyword..."
             class="search-input" autocomplete="off" enterkeyhint="search">
    </div>
  </div>
  
  <div id="category-filter" class="category-filter">
    <a href="/" class="category-btn active" data-category="">All Products</a>
  </div>
  <nav id="seo-category-links" class="seo-crawl-links" aria-label="Shop categories"></nav>

  <div class="shop-results-toolbar">
    <p id="shop-results-count" class="shop-results-count" aria-live="polite"></p>
  </div>
  
  <div id="product-grid" class="product-grid">
    <div class="loading">Loading products...</div>
  </div>
  <div id="shop-load-more" class="shop-load-more" hidden>
    <div id="shop-scroll-sentinel" class="shop-scroll-sentinel" aria-hidden="true"></div>
    <p id="shop-load-status" class="shop-load-status"></p>
    <button type="button" id="shop-load-more-btn" class="shop-load-more-btn">Load more products</button>
  </div>
</div>

<div id="cart-toast" class="cart-toast" role="status" aria-live="polite" aria-hidden="true"></div>

<!-- Product Detail Modal -->
<div id="product-modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-product-title" hidden>
<div class="modal-content">
<button type="button" class="modal-close" id="modal-close-btn" aria-label="Close product details">&times;</button>
<div id="modal-body"></div>
</div>
</div>

<style>
.shop-header {
  text-align: center;
  margin: 2rem 0 2rem;
}

.shop-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: rgb(var(--color-neutral-800));
}

.shop-header p {
  font-size: 1.125rem;
  color: rgb(var(--color-neutral-600));
}

/* Search Bar Styles */
.search-container {
  margin: 0 0 1.5rem;
}

.search-input-wrapper {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 1rem 1.5rem;
  border: 2px solid rgb(var(--color-neutral-200));
  border-radius: 12px;
  font-size: 1rem;
  background: rgb(var(--color-neutral));
  color: rgb(var(--color-neutral-800));
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.search-input:focus {
  outline: none;
  border-color: rgb(var(--color-primary-400));
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.search-input::placeholder {
  color: rgb(var(--color-neutral-400));
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.category-filter {
  display: flex;
  gap: 0.75rem;
  margin: 0 0 2rem;
  padding: 1rem;
  background: rgb(var(--color-neutral));
  border-radius: 12px;
  border: 1px solid rgb(var(--color-neutral-200));
  overflow-x: auto;
  flex-wrap: wrap;
}

.category-btn {
  padding: 0.625rem 1.25rem;
  background: rgb(var(--color-neutral-100));
  color: rgb(var(--color-neutral-700));
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9375rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-decoration: none;
  display: inline-block;
  box-sizing: border-box;
}

.category-btn:hover {
  background: rgb(var(--color-neutral-200));
  border-color: rgb(var(--color-neutral-300));
}

.category-btn.active {
  background: rgb(var(--color-primary-600));
  color: white;
  border-color: rgb(var(--color-primary-600));
}

.category-btn.active:hover {
  background: rgb(var(--color-primary-700));
  border-color: rgb(var(--color-primary-700));
  color: white;
}

.seo-crawl-links {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.category-filter-extra {
  display: none;
  flex-wrap: wrap;
  gap: 0.75rem;
  width: 100%;
}

.category-filter-extra.is-open {
  display: flex;
}

.category-toggle-btn {
  padding: 0.625rem 1.25rem;
  background: transparent;
  color: rgb(var(--color-primary-700));
  border: 1px dashed rgb(var(--color-primary-300));
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9375rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.category-toggle-btn:hover {
  background: rgba(var(--color-primary-50), 0.5);
  border-color: rgb(var(--color-primary-400));
}

.modal {
display: none;
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: rgba(0, 0, 0, 0.5);
z-index: 1000;
align-items: center;
justify-content: center;
}

.modal.active {
display: flex;
}

.modal[hidden] {
display: none !important;
}

.modal-content {
background: rgb(var(--color-neutral));
max-width: 800px;
max-height: 90vh;
overflow-y: auto;
border-radius: 12px;
position: relative;
margin: 1rem;
box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-close {
position: absolute;
top: 1rem;
right: 1rem;
font-size: 2rem;
line-height: 1;
cursor: pointer;
color: rgb(var(--color-neutral-500));
z-index: 1;
width: 2rem;
height: 2rem;
display: flex;
align-items: center;
justify-content: center;
border-radius: 50%;
transition: all 0.2s ease;
border: none;
background: transparent;
padding: 0;
}

.modal-close:hover {
background: rgb(var(--color-neutral-200));
color: rgb(var(--color-neutral-800));
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.product-card-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  cursor: pointer;
}

.product-card {
  position: relative;
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 12px;
  padding: 0;
  transition: all 0.3s ease;
  background: rgb(var(--color-neutral));
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.product-card-actions {
  padding: 0 1.5rem 1.5rem;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  border-color: rgb(var(--color-primary-300));
}

.product-image {
  width: 100%;
  height: 220px;
  object-fit: contain;
  background: rgb(var(--color-neutral-100));
}

.product-image-placeholder {
  width: 100%;
  height: 220px;
  background: rgb(var(--color-neutral-100));
}

.product-content {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: rgb(var(--color-neutral-800));
  line-height: 1.3;
}

.product-description {
  color: rgb(var(--color-neutral-600));
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  flex: 1;
}

.product-footer {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
  margin-top: auto;
}

.product-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--color-primary-600));
}

.product-stock {
  font-size: 0.85rem;
  color: rgb(var(--color-neutral-500));
  margin-top: 0.25rem;
}

.product-stock.low {
  color: rgb(234, 88, 12);
  font-weight: 600;
}

.product-stock.out {
  color: rgb(220, 38, 38);
  font-weight: 600;
}

.add-to-cart-btn {
  padding: 0.75rem 1.25rem;
  background: rgb(var(--color-primary-600));
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: rgb(var(--color-primary-700));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.add-to-cart-btn:disabled {
  background: rgb(var(--color-neutral-300));
  cursor: not-allowed;
  transform: none;
}

.add-to-cart-btn.added {
  background: rgb(16, 185, 129);
}

.product-quick-add {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  margin-top: auto;
}

.product-quick-add .add-to-cart-btn {
  flex: 1 1 auto;
  min-width: min(140px, 100%);
  min-height: 48px;
}

.product-quick-add .add-to-cart-btn:only-child {
  flex: 1 1 100%;
  width: 100%;
}

.qty-stepper {
  display: inline-flex;
  align-items: stretch;
  flex-shrink: 0;
  border: 1px solid rgb(var(--color-neutral-300));
  border-radius: 10px;
  overflow: hidden;
  background: rgb(var(--color-neutral-50));
}

.qty-stepper-btn {
  width: 48px;
  min-width: 48px;
  min-height: 48px;
  border: none;
  background: rgb(var(--color-neutral-100));
  color: rgb(var(--color-neutral-800));
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-stepper-btn:hover:not(:disabled) {
  background: rgb(var(--color-primary-50));
  color: rgb(var(--color-primary-600));
}

.qty-stepper-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.qty-stepper-input {
  width: 3.25rem;
  min-width: 3.25rem;
  min-height: 48px;
  text-align: center;
  border: none;
  border-left: 1px solid rgb(var(--color-neutral-200));
  border-right: 1px solid rgb(var(--color-neutral-200));
  background: rgb(var(--color-neutral));
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(var(--color-neutral-800));
  -moz-appearance: textfield;
}

.qty-stepper-input::-webkit-outer-spin-button,
.qty-stepper-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.modal-product-actions {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.modal-product-actions .qty-stepper {
  border-radius: 10px;
}

.modal-product-actions #modal-add-btn {
  flex: 1 1 auto;
  min-width: min(200px, 100%);
  min-height: 48px;
  margin-top: 0;
}

.modal-product-actions .modal-add-success {
  flex-basis: 100%;
  width: 100%;
}

.modal-add-success {
  margin-top: 1rem;
  padding: 1rem;
  background: rgb(var(--color-primary-50));
  border: 1px solid rgb(var(--color-primary-200));
  border-radius: 8px;
  font-size: 0.9375rem;
  color: rgb(var(--color-neutral-800));
  line-height: 1.5;
}

.modal-add-success[hidden] {
  display: none !important;
}

.modal-add-success-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.modal-add-success-actions button,
.modal-add-success-actions a {
  font-size: 0.875rem;
}

.cart-toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%) translateY(120%);
  z-index: 2100;
  padding: 0.875rem 1.25rem;
  background: rgb(var(--color-neutral-900));
  color: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  opacity: 0;
  visibility: hidden;
  transition: transform 0.28s ease, opacity 0.28s ease, visibility 0.28s;
  max-width: min(92vw, 420px);
  text-align: center;
  font-size: 0.9375rem;
}

.cart-toast.visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
  visibility: visible;
}

.cart-toast-link {
  color: rgb(var(--color-primary-300));
  font-weight: 600;
  margin-left: 0.5rem;
}

.loading {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: rgb(var(--color-neutral-500));
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  background: rgb(var(--color-neutral));
  border-radius: 12px;
  border: 1px solid rgb(var(--color-neutral-200));
}

.empty-state h2 {
  color: rgb(var(--color-neutral-700));
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: rgb(var(--color-neutral-600));
  margin-bottom: 1rem;
}

.shop-results-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 0 0 0.25rem;
  min-height: 1.25rem;
}

.shop-results-count {
  margin: 0;
  color: rgb(var(--color-neutral-600));
  font-size: 0.9375rem;
}

.shop-load-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0 0;
  min-height: 1px;
}

.shop-load-more[hidden] {
  display: none !important;
}

.shop-scroll-sentinel {
  width: 100%;
  height: 1px;
  pointer-events: none;
}

.shop-load-status {
  margin: 0;
  color: rgb(var(--color-neutral-500));
  font-size: 0.875rem;
}

.shop-load-more-btn {
  min-height: 2.5rem;
  padding: 0.625rem 1.25rem;
  background: rgb(var(--color-neutral-100));
  color: rgb(var(--color-neutral-700));
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9375rem;
}

.shop-load-more-btn:hover:not(:disabled) {
  background: rgb(var(--color-neutral-200));
  border-color: rgb(var(--color-neutral-300));
}

.shop-load-more-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.shop-load-more-btn[hidden] {
  display: none !important;
}

@media (max-width: 768px) {
  .shop-header h1 {
    font-size: 2rem;
  }
}
</style>

<script src="/js/shopCategories.js"></script>
<script>
// Shop initialization
const API_BASE = 'https://dicebastion.com/api';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 220;
const SCROLL_LOAD_MARGIN = '480px 0px';

let allProducts = [];
let categoryMeta = [];
let categoryMetaByName = new Map();
let currentFilter = null;
let currentSearchTerm = '';
let visibleCount = PAGE_SIZE;
let searchDebounceTimer = null;
let lastModalFocus = null;
let loadMoreObserver = null;
let loadMoreQueued = false;

function categoryDisplay(name) {
  return (window.ShopCategories && ShopCategories.display(name)) || String(name || '').trim();
}

function categoryKey(name) {
  return (window.ShopCategories && ShopCategories.key(name)) || String(name || '').trim().toLowerCase();
}

function categoryTags(raw) {
  if (window.ShopCategories) return ShopCategories.parseField(raw);
  return String(raw || '').split(',').map(c => c.trim()).filter(Boolean);
}

function categoriesSame(a, b) {
  if (window.ShopCategories) return ShopCategories.same(a, b);
  return categoryKey(a) === categoryKey(b) && !!categoryKey(a);
}

function loadCart() {
  if (typeof ShopCartStorage !== 'undefined') {
    return ShopCartStorage.load();
  }
  try {
    const stored = localStorage.getItem('shop_cart');
    return stored ? JSON.parse(stored) : [];
  } catch (_) {
    return [];
  }
}

function saveCart(cart) {
  const data = Array.isArray(cart) ? cart : [];
  if (typeof ShopCartStorage !== 'undefined') {
    ShopCartStorage.save(data);
    return;
  }
  localStorage.setItem('shop_cart', JSON.stringify(data));
  updateCartBadge();
}

// Update cart badge in header
function updateCartBadge() {
  const cart = loadCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Dispatch event for header to listen to
  const event = new CustomEvent('cartUpdated', { detail: { count: totalItems } });
  window.dispatchEvent(event);
}

// Format price
function formatPrice(pence) {
  return '£' + (pence / 100).toFixed(2);
}

function escapeHtml(text) {
  if (text == null || text === '') return '';
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function stripHtmlToText(html) {
  if (!html) return '';
  try {
    const parsed = new DOMParser().parseFromString(String(html), 'text/html');
    return (parsed.body.textContent || '').replace(/\s+/g, ' ').trim();
  } catch (_) {
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

function sanitizeProductHtml(html) {
  if (!html) return '';
  let parsed;
  try {
    parsed = new DOMParser().parseFromString(String(html), 'text/html');
  } catch (_) {
    return escapeHtml(stripHtmlToText(html));
  }
  const forbidden = new Set([
    'SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'STYLE',
    'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'BASE'
  ]);
  parsed.body.querySelectorAll('*').forEach(el => {
    if (forbidden.has(el.tagName)) {
      el.remove();
      return;
    }
    [...el.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const val = String(attr.value || '');
      if (name.startsWith('on') || name === 'srcdoc' || name === 'xlink:href') {
        el.removeAttribute(attr.name);
        return;
      }
      if ((name === 'href' || name === 'src' || name === 'poster') &&
          /^\s*(javascript|data|vbscript):/i.test(val)) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return parsed.body.innerHTML;
}

function productCardPreview(product) {
  const summary = typeof product.summary === 'string' ? product.summary.trim() : '';
  if (summary) return escapeHtml(summary);

  const fromFull = stripHtmlToText(product.full_description);
  const fromShort =
    typeof product.description === 'string' ? product.description.trim() : '';
  const raw = fromFull || fromShort;
  if (!raw) return '';

  const maxLen = 140;
  if (raw.length <= maxLen) return escapeHtml(raw);
  const sliced = raw.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  const truncated = (lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced).trim();
  return escapeHtml(truncated) + '...';
}

function productImageSrc(url) {
  if (url == null) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  return '';
}

function productImageHtml(url, altHtml, className, extraStyle) {
  const src = productImageSrc(url);
  if (!src) {
    return `<div class="${className || 'product-image'} product-image-placeholder" aria-hidden="true"></div>`;
  }
  const styleAttr = extraStyle ? ` style="${extraStyle}"` : '';
  const cls = className ? ` class="${className}"` : '';
  return `<img src="${escapeHtml(src)}" alt="${altHtml || ''}"${cls}${styleAttr} loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.removeAttribute('src');this.classList.add('product-image-placeholder');">`;
}

let toastHideTimer = null;

function showToast(message, options) {
  const el = document.getElementById('cart-toast');
  if (!el) return;
  const opts = options || {};
  clearTimeout(toastHideTimer);
  el.setAttribute('aria-hidden', 'false');
  let html = escapeHtml(message);
  if (opts.actionHref) {
    html +=
      ' <a class="cart-toast-link" href="' +
      encodeURI(opts.actionHref) +
      '">' +
      escapeHtml(opts.actionLabel || 'View cart') +
      '</a>';
  }
  el.innerHTML = html;
  requestAnimationFrame(() => el.classList.add('visible'));
  toastHideTimer = setTimeout(() => {
    el.classList.remove('visible');
    el.setAttribute('aria-hidden', 'true');
  }, opts.durationMs || 4200);
}

function remainingForProduct(product) {
  if (!product) return 0;
  const cart = loadCart();
  const line = cart.find(item => item.id === product.id);
  const inCart = line ? line.quantity : 0;
  return Math.max(0, product.stock_quantity - inCart);
}

/** Public stock label: hide high stock on cards; cap modal at "3+". */
function formatPublicStock(qty, { hideWhenPlenty = false } = {}) {
  const n = Number(qty) || 0;
  if (n <= 0) return { text: 'Out of stock', className: 'out' };
  if (n >= 3) {
    if (hideWhenPlenty) return { text: '', className: '' };
    return { text: '3+ in stock', className: '' };
  }
  return { text: `${n} in stock`, className: 'low' };
}

function addProductToCart(product, requestedQty, options) {
  const opts = options || {};
  if (!product || product.stock_quantity === 0) return 0;

  let cart = loadCart();
  const existing = cart.find(item => item.id === product.id);
  const inCart = existing ? existing.quantity : 0;
  const room = product.stock_quantity - inCart;

  let want = requestedQty !== undefined ? Number(requestedQty) : 1;
  want = Math.floor(want);
  if (!Number.isFinite(want) || want < 1) want = 1;

  const toAdd = Math.min(want, room);
  if (toAdd < 1) {
    showToast(
      'You already have all available units of this product in your cart.',
      { durationMs: 3600 }
    );
    return 0;
  }

  const isPreorder =
    !!(product.release_date && new Date(product.release_date) > new Date());

  if (existing) {
    existing.quantity += toAdd;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: toAdd,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url || '',
      is_preorder: isPreorder,
      release_date: product.release_date || ''
    });
  }

  saveCart(cart);

  if (!opts.silentToast) {
    let msg =
      toAdd === 1
        ? `Added "${product.name}" to your cart.`
        : `Added ${toAdd} x "${product.name}" to your cart.`;
    if (toAdd < want) {
      msg += ` (${toAdd} is the maximum you can add.)`;
    }
    showToast(msg, { actionHref: '/cart', actionLabel: 'View cart' });
  }

  if (opts.feedbackButton) flashAddedButton(opts.feedbackButton);
  return toAdd;
}

function flashAddedButton(btn) {
  if (!btn) return;
  const prev = btn.textContent;
  btn.textContent = '✓ Added';
  btn.classList.add('added');
  clearTimeout(btn._addedFlashT);
  btn._addedFlashT = setTimeout(() => {
    btn.textContent = prev;
    btn.classList.remove('added');
  }, 1600);
}

function clampGridQtyInput(input, product) {
  if (!input || !product) return;
  const maxSel = Math.max(1, remainingForProduct(product));
  let v = parseInt(input.value, 10);
  if (!Number.isFinite(v) || v < 1) v = 1;
  input.value = Math.min(v, maxSel);
  const wrap = input.closest('.qty-stepper');
  if (!wrap) return;
  v = parseInt(input.value, 10) || 1;
  const dec = wrap.querySelector('[data-action="dec"]');
  const inc = wrap.querySelector('[data-action="inc"]');
  if (dec) dec.disabled = v <= 1;
  if (inc) inc.disabled = v >= maxSel;
}

function renderQuickAddBlock(product) {
  const soldOut = product.stock_quantity === 0;
  const room = remainingForProduct(product);
  if (soldOut) {
    return `<div class="product-quick-add">
      <button type="button" class="add-to-cart-btn" disabled>Out of stock</button>
    </div>`;
  }
  if (room <= 0) {
    return `<div class="product-quick-add">
      <button type="button" class="add-to-cart-btn" disabled>Maximum in cart</button>
    </div>`;
  }
  return `<div class="product-quick-add">
    <div class="qty-stepper" data-product-id="${product.id}">
      <button type="button" class="qty-stepper-btn" data-action="dec" aria-label="Decrease quantity">−</button>
      <input type="number" class="qty-stepper-input" min="1" max="${room}" value="1" aria-label="Quantity" />
      <button type="button" class="qty-stepper-btn" data-action="inc" aria-label="Increase quantity">+</button>
    </div>
    <button type="button" class="add-to-cart-btn" data-product-id="${product.id}">Add to cart</button>
  </div>`;
}

function wireModalCartUI(product) {
  const qtyInput = document.getElementById('modal-qty-input');
  const addBtn = document.getElementById('modal-add-btn');
  const successBox = document.getElementById('modal-add-success');
  if (!qtyInput || !addBtn || !successBox) return;

  const dec = document.getElementById('modal-qty-dec');
  const inc = document.getElementById('modal-qty-inc');
  const successLine = document.getElementById('modal-add-success-line');

  function clampModalQty() {
    const r = remainingForProduct(product);
    if (product.stock_quantity === 0 || r < 1) {
      qtyInput.value = '1';
      if (dec) dec.disabled = true;
      if (inc) inc.disabled = true;
      addBtn.disabled = true;
      return;
    }
    let v = parseInt(qtyInput.value, 10);
    if (!Number.isFinite(v) || v < 1) v = 1;
    qtyInput.value = Math.min(v, r);
    v = parseInt(qtyInput.value, 10);
    if (dec) dec.disabled = v <= 1;
    if (inc) inc.disabled = v >= r;
    addBtn.disabled = false;
  }

  const stepBy = delta => {
    successBox.hidden = true;
    let v = parseInt(qtyInput.value, 10) || 1;
    qtyInput.value = v + delta;
    clampModalQty();
  };

  if (dec) dec.addEventListener('click', () => stepBy(-1));
  if (inc) inc.addEventListener('click', () => stepBy(1));
  qtyInput.addEventListener('change', () => {
    successBox.hidden = true;
    clampModalQty();
  });

  addBtn.addEventListener('click', () => {
    successBox.hidden = true;
    const want = parseInt(qtyInput.value, 10) || 1;
    const added = addProductToCart(product, want, { silentToast: true });
    if (added > 0) {
      flashAddedButton(addBtn);
      successLine.textContent =
        added === 1
          ? 'Added 1 item to your cart.'
          : `Added ${added} items to your cart.`;
      successBox.hidden = false;
      clampModalQty();
      refreshProductCardActions(product);
      let msg =
        added === 1
          ? `Added "${product.name}" to your cart.`
          : `Added ${added} x "${product.name}" to your cart.`;
      if (added < want) msg += ` (${added} is the maximum you can add.)`;
      showToast(msg, { actionHref: '/cart', actionLabel: 'View cart' });
    }
  });

  clampModalQty();
}

function bindProductGridActions() {
  const grid = document.getElementById('product-grid');
  if (!grid || grid.dataset.cartBound === '1') return;
  grid.dataset.cartBound = '1';

  grid.addEventListener('change', function (e) {
    const input = e.target.closest ? e.target.closest('.qty-stepper-input') : null;
    if (!input || !grid.contains(input)) return;
    const wrap = input.closest('.qty-stepper');
    if (!wrap) return;
    const pid = parseInt(wrap.dataset.productId, 10);
    const product = allProducts.find(p => p.id === pid);
    if (product) clampGridQtyInput(input, product);
  });

  grid.addEventListener('click', function (e) {
    const card = e.target.closest('.product-card');

    const stepBtn = e.target.closest('.qty-stepper-btn');
    if (stepBtn && card) {
      e.preventDefault();
      e.stopPropagation();
      const wrap = stepBtn.closest('.qty-stepper');
      if (!wrap) return;
      const pid = parseInt(wrap.dataset.productId, 10);
      const product = allProducts.find(p => p.id === pid);
      if (!product) return;
      const input = wrap.querySelector('.qty-stepper-input');
      if (!input) return;
      let v = parseInt(input.value, 10) || 1;
      const maxSel = Math.max(1, remainingForProduct(product));
      if (stepBtn.dataset.action === 'inc') {
        input.value = Math.min(v + 1, maxSel);
      } else {
        input.value = Math.max(1, v - 1);
      }
      clampGridQtyInput(input, product);
      return;
    }

    const addBtn = e.target.closest('.add-to-cart-btn[data-product-id]');
    if (addBtn && card) {
      e.preventDefault();
      e.stopPropagation();
      const pid = parseInt(addBtn.dataset.productId, 10);
      const product = allProducts.find(p => p.id === pid);
      if (!product || product.stock_quantity === 0) return;
      const row = card.querySelector('.qty-stepper-input');
      const qtyRaw = row ? parseInt(row.value, 10) : 1;
      const qty = Math.max(1, Number.isFinite(qtyRaw) ? qtyRaw : 1);
      const added = addProductToCart(product, qty, { feedbackButton: addBtn });
      if (added > 0) {
        refreshProductCardActions(product);
      }
      return;
    }

    // Soft-open product modal (no full reload). Keep href="/products/slug" for SEO
    // and for ctrl/cmd/middle-click → real Worker SEO URL.
    const link = e.target.closest('a.product-card-link');
    if (link && grid.contains(link)) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const pid = parseInt(link.getAttribute('data-product-id'), 10);
      const slug = link.getAttribute('data-product-slug') || '';
      if (Number.isFinite(pid) && pid > 0) {
        showProductDetail(pid, slug);
      }
    }
  });
}

// Load products from API
async function loadProducts() {
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${API_BASE}/products`),
      fetch(`${API_BASE}/product-categories`)
    ]);
    if (!productsRes.ok) throw new Error('products_http_' + productsRes.status);
    allProducts = await productsRes.json();
    if (!Array.isArray(allProducts)) allProducts = [];

    let meta = [];
    try {
      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        meta = Array.isArray(catData.categories) ? catData.categories : [];
      }
    } catch (_) {
      meta = [];
    }
    categoryMeta = meta;
    categoryMetaByName = new Map();
    meta.forEach(row => {
      const key = categoryKey(row.name);
      if (key) categoryMetaByName.set(key, row);
    });

    buildCategoryFilter(allProducts);
  } catch (error) {
    console.error('Failed to load products:', error);
    document.getElementById('product-grid').innerHTML =
      '<div class="loading">Failed to load products. Please try again later.</div>';
    const countEl = document.getElementById('shop-results-count');
    if (countEl) countEl.textContent = '';
    updateLoadMoreUi(0, 0);
  }
}

function categoryButtonHtml(cat) {
  const label = escapeHtml(cat);
  const href = `/products/category/${encodeURIComponent(cat)}`;
  return `<a href="${href}" class="category-btn" data-category="${label}">${label}</a>`;
}

function buildSeoCategoryLinks(categories) {
  const nav = document.getElementById('seo-category-links');
  if (!nav) return;
  nav.innerHTML = categories
    .map(cat => {
      const label = escapeHtml(cat);
      return `<a href="/products/category/${encodeURIComponent(cat)}">${label}</a>`;
    })
    .join('');
}

// Build category filter menu (featured first; top 5 visible; rest behind Show more)
function buildCategoryFilter(products) {
  const categoryCount = {};

  products.forEach(product => {
    categoryTags(product.category).forEach(name => {
      categoryCount[name] = (categoryCount[name] || 0) + 1;
    });
  });

  const discovered = Object.keys(categoryCount);
  const metaNames = categoryMeta.map(m => categoryDisplay(m.name)).filter(Boolean);
  const allNames = [...new Set([...discovered, ...metaNames])].filter(name => categoryCount[name] > 0);

  const sortedCategories = allNames.sort((a, b) => {
    const ma = categoryMetaByName.get(categoryKey(a));
    const mb = categoryMetaByName.get(categoryKey(b));
    const fa = !!(ma && ma.featured);
    const fb = !!(mb && mb.featured);
    if (fa !== fb) return fa ? -1 : 1;
    if (fa && fb) {
      const oa = Number(ma.sort_order) || 0;
      const ob = Number(mb.sort_order) || 0;
      if (oa !== ob) return oa - ob;
    }
    const ca = categoryCount[a] || 0;
    const cb = categoryCount[b] || 0;
    if (ca !== cb) return cb - ca;
    return a.localeCompare(b);
  });

  const topCategories = sortedCategories.slice(0, 5);
  const extraCategories = sortedCategories.slice(5);

  buildSeoCategoryLinks(sortedCategories);

  const filterContainer = document.getElementById('category-filter');
  const parts = [
    '<a href="/" class="category-btn active" data-category="">All Products</a>'
  ];

  topCategories.forEach(cat => {
    parts.push(categoryButtonHtml(cat));
  });

  if (extraCategories.length > 0) {
    parts.push(
      `<button type="button" class="category-toggle-btn" id="category-toggle-btn" aria-expanded="false" aria-controls="category-filter-extra">Show more</button>`
    );
    parts.push(
      `<div id="category-filter-extra" class="category-filter-extra" hidden>${extraCategories.map(categoryButtonHtml).join('')}</div>`
    );
  }

  filterContainer.innerHTML = parts.join('');
}

function parseCategoryKeywords(raw) {
  return String(raw || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

function productMatchesSearch(product, term) {
  if (!term) return true;
  const name = String(product.name || '').toLowerCase();
  if (name.includes(term)) return true;

  const summary = String(product.summary || '').toLowerCase();
  if (summary.includes(term)) return true;
  const description = String(product.description || '').toLowerCase();
  if (description.includes(term)) return true;

  const cats = categoryTags(product.category);

  if (cats.some(c => c.toLowerCase().includes(term))) return true;

  for (const cat of cats) {
    const meta = categoryMetaByName.get(categoryKey(cat));
    if (!meta) continue;
    const keywords = parseCategoryKeywords(meta.keywords);
    if (keywords.some(kw => kw.startsWith(term) || (term.length >= kw.length && term.startsWith(kw)))) {
      return true;
    }
  }
  return false;
}

function bindCategoryFilter() {
  const filterContainer = document.getElementById('category-filter');
  if (!filterContainer || filterContainer.dataset.bound === '1') return;
  filterContainer.dataset.bound = '1';
  filterContainer.addEventListener('click', function (e) {
    const toggle = e.target.closest('#category-toggle-btn');
    if (toggle && filterContainer.contains(toggle)) {
      e.preventDefault();
      toggleCategoryExtras();
      return;
    }
    const btn = e.target.closest('.category-btn');
    if (!btn || !filterContainer.contains(btn)) return;
    e.preventDefault();
    const cat = btn.getAttribute('data-category') || '';
    filterByCategory(cat || null, btn);
  });
}

function handleSearchInput() {
  const input = document.getElementById('search-input');
  currentSearchTerm = input ? input.value.toLowerCase().trim() : '';
  applyFilters({ resetList: true });
  syncShopUrl({ replace: true });
}

function scheduleSearch() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(handleSearchInput, SEARCH_DEBOUNCE_MS);
}

function getFilteredProducts() {
  let filteredProducts = allProducts.slice();

  if (currentSearchTerm) {
    filteredProducts = filteredProducts.filter(product =>
      productMatchesSearch(product, currentSearchTerm)
    );
  }

  if (currentFilter) {
    filteredProducts = filteredProducts.filter(product =>
      categoryTags(product.category).some(c => categoriesSame(c, currentFilter))
    );
  }

  return filteredProducts;
}

function applyFilters({ resetList = false } = {}) {
  if (resetList) visibleCount = PAGE_SIZE;
  renderProducts(getFilteredProducts());
}

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function updateLoadMoreUi(shown, total) {
  const wrap = document.getElementById('shop-load-more');
  const status = document.getElementById('shop-load-status');
  const btn = document.getElementById('shop-load-more-btn');
  if (!wrap) return;

  const hasMore = shown > 0 && shown < total;
  wrap.hidden = !hasMore;
  if (status) {
    status.textContent = hasMore ? 'Scroll for more products' : '';
  }
  if (btn) {
    btn.hidden = !hasMore;
    btn.disabled = !hasMore;
  }
}

function loadMoreProducts() {
  if (loadMoreQueued) return;
  const list = getFilteredProducts();
  if (visibleCount >= list.length) {
    updateLoadMoreUi(Math.min(visibleCount, list.length), list.length);
    return;
  }
  loadMoreQueued = true;
  visibleCount = Math.min(visibleCount + PAGE_SIZE, list.length);
  renderProducts(list, { append: true });
  loadMoreQueued = false;
}

function bindInfiniteScroll() {
  const btn = document.getElementById('shop-load-more-btn');
  if (btn && btn.dataset.bound !== '1') {
    btn.dataset.bound = '1';
    btn.addEventListener('click', function () {
      loadMoreProducts();
    });
  }

  const sentinel = document.getElementById('shop-scroll-sentinel');
  if (!sentinel || loadMoreObserver || typeof IntersectionObserver === 'undefined') return;
  if (prefersReducedMotion()) return;

  loadMoreObserver = new IntersectionObserver(
    function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      loadMoreProducts();
    },
    { root: null, rootMargin: SCROLL_LOAD_MARGIN, threshold: 0 }
  );
  loadMoreObserver.observe(sentinel);
}

function toggleCategoryExtras(forceOpen) {
  const extra = document.getElementById('category-filter-extra');
  const toggle = document.getElementById('category-toggle-btn');
  if (!extra || !toggle) return;

  const shouldOpen = typeof forceOpen === 'boolean'
    ? forceOpen
    : !extra.classList.contains('is-open');

  extra.classList.toggle('is-open', shouldOpen);
  extra.hidden = !shouldOpen;
  toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
  toggle.textContent = shouldOpen ? 'Show less' : 'Show more';
}

function setActiveCategoryButton(category) {
  const target = category || '';
  document.querySelectorAll('.category-btn').forEach(btn => {
    const btnCat = btn.getAttribute('data-category') || '';
    const isAll = !btnCat && !target;
    btn.classList.toggle('active', isAll || (!!target && categoriesSame(btnCat, target)));
  });

  if (category) {
    const activeBtn = [...document.querySelectorAll('.category-btn')].find(btn =>
      categoriesSame(btn.getAttribute('data-category'), category)
    );
    if (activeBtn && activeBtn.closest('#category-filter-extra')) {
      toggleCategoryExtras(true);
    }
  }
}

function syncShopUrl({ replace = false } = {}) {
  const params = new URLSearchParams(window.location.search);
  if (currentFilter) {
    params.set('category', currentFilter);
  } else {
    params.delete('category');
  }
  if (currentSearchTerm) {
    params.set('q', currentSearchTerm);
  } else {
    params.delete('q');
  }
  params.delete('page');
  const qs = params.toString();
  const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  const method = replace ? 'replaceState' : 'pushState';
  history[method]({}, '', nextUrl);
}

function shopQueryUrl(updates = {}) {
  const params = new URLSearchParams(window.location.search);
  Object.entries(updates).forEach(([key, value]) => {
    if (value == null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });
  const qs = params.toString();
  return qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
}

function filterByCategory(category, btnElement, { syncUrl = true } = {}) {
  currentFilter = category ? categoryDisplay(category) : null;
  if (btnElement) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
  } else {
    setActiveCategoryButton(currentFilter);
  }
  applyFilters({ resetList: true });
  if (syncUrl) {
    syncShopUrl();
  }
}

function productCardHtml(product) {
  const isPreorder =
    product.release_date && new Date(product.release_date) > new Date();
  const releaseDate = isPreorder
    ? new Date(product.release_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null;

  const nameHtml = escapeHtml(product.name || '');
  const summaryHtml = productCardPreview(product);
  const quickAdd = renderQuickAddBlock(product);
  const slugRaw = product.slug || '';
  const slugAttr = escapeHtml(slugRaw);
  const slugHref = encodeURIComponent(slugRaw);

  return `
<div class="product-card">
    <a href="/products/${slugHref}"
       class="product-card-link"
       data-product-id="${product.id}"
       data-product-slug="${slugAttr}">
    ${productImageHtml(product.image_url, nameHtml, 'product-image')}
      ${
        isPreorder
          ? `<div style="position: absolute; top: 10px; left: 10px; background: rgb(var(--color-primary-600)); color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">PRE-ORDER</div>`
          : ''
      }
      <div class="product-content">
        <div class="product-name">${nameHtml}</div>
        <div class="product-description">${summaryHtml}</div>
        ${
          isPreorder
            ? `<div style="font-size: 0.875rem; color: rgb(var(--color-primary-600)); margin: 0.5rem 0; font-weight: 500;">Available ${releaseDate}</div>`
            : ''
        }
        <div class="product-footer">
          <div>
            <div class="product-price">${formatPrice(product.price)}</div>
            ${(() => {
              const stock = formatPublicStock(product.stock_quantity, {
                hideWhenPlenty: true
              });
              if (!stock.text) return '';
              return `<div class="product-stock ${stock.className}">${stock.text}</div>`;
            })()}
          </div>
        </div>
      </div>
    </a>
    <div class="product-card-actions">
      ${quickAdd}
    </div>
</div>
  `;
}

function refreshProductCardActions(product) {
  if (!product) return;
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const stepper = grid.querySelector('.qty-stepper[data-product-id="' + product.id + '"]');
  const card = stepper
    ? stepper.closest('.product-card')
    : grid.querySelector('.product-card-link[data-product-id="' + product.id + '"]')?.closest('.product-card');
  const actions = card && card.querySelector('.product-card-actions');
  if (!actions) return;
  actions.innerHTML = renderQuickAddBlock(product);
  const input = actions.querySelector('.qty-stepper-input');
  if (input) clampGridQtyInput(input, product);
}

function clampRenderedCards(grid, items) {
  items.forEach(p => {
    const row = grid.querySelector(
      `.qty-stepper[data-product-id="${p.id}"] .qty-stepper-input`
    );
    if (row) clampGridQtyInput(row, p);
  });
}

function renderProducts(products, options) {
  const opts = options || {};
  const grid = document.getElementById('product-grid');
  const countEl = document.getElementById('shop-results-count');
  const list = products || [];
  const hasFilters = !!(currentSearchTerm || currentFilter);
  const append = !!opts.append && grid.querySelector('.product-card');

  if (!list.length) {
    if (countEl) countEl.textContent = '';
    updateLoadMoreUi(0, 0);
    if (hasFilters) {
      grid.innerHTML = `
      <div class="empty-state">
        <h2>No matching products</h2>
        <p>Try a different search or category.</p>
        <button type="button" class="category-btn" id="shop-clear-filters">Clear filters</button>
      </div>
    `;
      document.getElementById('shop-clear-filters')?.addEventListener('click', function () {
        currentSearchTerm = '';
        currentFilter = null;
        visibleCount = PAGE_SIZE;
        const input = document.getElementById('search-input');
        if (input) input.value = '';
        setActiveCategoryButton(null);
        applyFilters({ resetList: true });
        syncShopUrl({ replace: true });
      });
    } else {
      grid.innerHTML = `
      <div class="empty-state">
        <h2>No products available yet</h2>
        <p>Check back soon for new items!</p>
      </div>
    `;
    }
    return;
  }

  if (visibleCount < 1) visibleCount = PAGE_SIZE;
  if (visibleCount > list.length) visibleCount = list.length;

  const alreadyShown = append ? grid.querySelectorAll('.product-card').length : 0;
  const start = append ? alreadyShown : 0;
  const pageItems = list.slice(start, visibleCount);

  if (countEl) {
    countEl.textContent =
      'Showing ' + visibleCount + ' of ' + list.length;
  }

  if (append && pageItems.length) {
    grid.insertAdjacentHTML('beforeend', pageItems.map(productCardHtml).join(''));
    clampRenderedCards(grid, pageItems);
  } else {
    grid.innerHTML = list.slice(0, visibleCount).map(productCardHtml).join('');
    clampRenderedCards(grid, list.slice(0, visibleCount));
  }

  updateLoadMoreUi(visibleCount, list.length);
  scheduleFillViewport();
}

function scheduleFillViewport() {
  if (prefersReducedMotion()) return;
  requestAnimationFrame(function () {
    const wrap = document.getElementById('shop-load-more');
    const sentinel = document.getElementById('shop-scroll-sentinel');
    if (!wrap || wrap.hidden || !sentinel) return;
    const rect = sentinel.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 480) loadMoreProducts();
  });
}

// Show product detail modal
window.showProductDetail = async function (productId, slug, skipPushState) {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`);
    if (!response.ok) throw new Error('product_http_' + response.status);
    const product = await response.json();
    if (!product || product.error) throw new Error('product_not_found');

    if (!skipPushState) {
      const productSlug = slug || product.slug;
      if (productSlug) {
        history.pushState(
          { product: productSlug },
          '',
          shopQueryUrl({ product: productSlug })
        );
      }
    }

    const isPreorder =
      product.release_date && new Date(product.release_date) > new Date();
    const releaseDate = isPreorder
      ? new Date(product.release_date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : null;

    const modal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');
    const nameHtml = escapeHtml(product.name || '');
    const room = remainingForProduct(product);
    const modalImageHtml = productImageSrc(product.image_url)
      ? productImageHtml(
          product.image_url,
          nameHtml,
          '',
          'width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; margin-bottom: 1.5rem; background: rgb(var(--color-neutral-100));'
        )
      : '';

    const richHtml = product.full_description
      ? sanitizeProductHtml(product.full_description)
      : product.summary
        ? `<p>${escapeHtml(product.summary)}</p>`
        : '';

    let actionsHtml;
    if (product.stock_quantity === 0) {
      actionsHtml = `<button type="button" class="add-to-cart-btn" disabled style="width: 100%; padding: 1rem; font-size: 1.1rem;">Out of stock</button>`;
    } else if (room <= 0) {
      actionsHtml = `<button type="button" class="add-to-cart-btn" disabled style="width: 100%; padding: 1rem; font-size: 1.1rem;">Maximum in cart</button>`;
    } else {
      actionsHtml = `
        <div class="modal-product-actions">
          <div class="qty-stepper">
            <button type="button" class="qty-stepper-btn" id="modal-qty-dec" aria-label="Decrease quantity">−</button>
            <input type="number" class="qty-stepper-input" id="modal-qty-input" min="1" max="${room}" value="1" aria-label="Quantity" />
            <button type="button" class="qty-stepper-btn" id="modal-qty-inc" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="add-to-cart-btn" id="modal-add-btn" style="width: auto; padding: 1rem 1.25rem; font-size: 1.1rem;">Add to cart</button>
          <div id="modal-add-success" class="modal-add-success" hidden role="status">
            <span id="modal-add-success-line"></span>
            <div class="modal-add-success-actions">
              <button type="button" id="modal-keep-shopping" style="padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid rgb(var(--color-neutral-300)); background: rgb(var(--color-neutral-100)); cursor: pointer; font-weight: 600; color: rgb(var(--color-neutral-800));">Keep shopping</button>
              <a href="/cart" style="padding: 0.5rem 1rem; border-radius: 8px; display: inline-block; text-decoration: none; background: rgb(var(--color-primary-600)); color: white; font-weight: 600;">View cart</a>
            </div>
          </div>
        </div>`;
    }

    modalBody.innerHTML = `
<div style="padding: 2rem;">
${modalImageHtml}
${isPreorder ? `<div style="display: inline-block; background: rgb(var(--color-primary-600)); color: white; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem;">PRE-ORDER</div>` : ''}
<h2 id="modal-product-title" style="margin: 0 0 1rem 0; color: rgb(var(--color-neutral-800));">${nameHtml}</h2>
${isPreorder ? `<div style="font-size: 1rem; color: rgb(var(--color-primary-600)); margin-bottom: 1rem; font-weight: 500;">Available from ${releaseDate}</div>` : ''}
<div style="font-size: 2rem; font-weight: 700; color: rgb(var(--color-primary-600)); margin-bottom: 1rem;">${formatPrice(product.price)}</div>
<div style="margin-bottom: 1rem; color: rgb(var(--color-neutral-600));">
<strong>Stock:</strong> ${escapeHtml(formatPublicStock(product.stock_quantity).text)}
</div>
${richHtml ? `<div style="line-height: 1.6; margin-bottom: 1.5rem; color: rgb(var(--color-neutral-700));">${richHtml}</div>` : ''}
${actionsHtml}
</div>`;

    lastModalFocus = document.activeElement;
    modal.hidden = false;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-close-btn')?.focus();
    if (product.stock_quantity > 0 && room > 0) {
      wireModalCartUI(product);
      document.getElementById('modal-keep-shopping')?.addEventListener('click', () => closeProductModal());
    }
  } catch (error) {
    console.error('Failed to load product details:', error);
  }
};
window.closeProductModal = function() {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.hidden = true;
  }
  document.body.style.overflow = '';
  if (lastModalFocus && typeof lastModalFocus.focus === 'function') {
    lastModalFocus.focus();
  }
  lastModalFocus = null;
  const params = new URLSearchParams(window.location.search);
  if (params.has('product')) {
    history.pushState({}, '', shopQueryUrl({ product: null }));
  }
};

function applyShopStateFromUrl({ syncUrl = false } = {}) {
  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get('category');
  const qParam = (params.get('q') || '').trim();
  const pageParam = parseInt(params.get('page'), 10);

  currentFilter = categoryParam ? categoryDisplay(categoryParam) : null;
  currentSearchTerm = qParam.toLowerCase();
  visibleCount = pageParam > 1 ? pageParam * PAGE_SIZE : PAGE_SIZE;

  const input = document.getElementById('search-input');
  if (input && input.value !== qParam) input.value = qParam;

  setActiveCategoryButton(currentFilter);
  applyFilters();
  if (syncUrl || (categoryParam && currentFilter && currentFilter !== categoryParam)) {
    syncShopUrl({ replace: true });
  }
}

// Close modal on background click
document.addEventListener('click', function(e) {
if (e.target.id === 'product-modal') {
closeProductModal();
}
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  const modal = document.getElementById('product-modal');
  if (modal && modal.classList.contains('active')) {
    closeProductModal();
  }
});

window.addEventListener('popstate', function() {
  const params = new URLSearchParams(window.location.search);
  const productSlug = params.get('product');

  if (allProducts.length > 0) {
    applyShopStateFromUrl();
  }

  if (productSlug && allProducts.length > 0) {
    const match = allProducts.find(p => p.slug === productSlug);
    if (match) showProductDetail(match.id, match.slug, true);
  } else {
    const modal = document.getElementById('product-modal');
    if (modal) {
      modal.classList.remove('active');
      modal.hidden = true;
    }
    document.body.style.overflow = '';
  }
});

document.addEventListener('DOMContentLoaded', async function() {
  bindProductGridActions();
  bindCategoryFilter();
  bindInfiniteScroll();

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', scheduleSearch);
  }
  document.getElementById('modal-close-btn')?.addEventListener('click', function () {
    closeProductModal();
  });

  await loadProducts();
  updateCartBadge();

  if (allProducts.length > 0) {
    applyShopStateFromUrl({ syncUrl: true });
  }

  const productSlug = new URLSearchParams(window.location.search).get('product');
  if (productSlug && allProducts.length > 0) {
    const match = allProducts.find(p => p.slug === productSlug);
    if (match) {
      showProductDetail(match.id, match.slug, true);
    }
  }
});
</script>
