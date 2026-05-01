---
title: "Dice Bastion Shop"
description: "Board games, miniatures, accessories, and more"
---

<div id="shop-app">
  <div class="shop-header">
    <h1>Welcome to the Dice Bastion Shop</h1>
    <p>Browse our collection of board games, miniatures, and gaming accessories.</p>
  </div>
  
  <!-- Search Bar -->
  <div class="search-container">
    <div class="search-input-wrapper">
      <input type="text" id="search-input" placeholder="Search products by name..." 
             oninput="handleSearch()" 
             class="search-input">
      <span class="search-icon">🔍</span>
    </div>
  </div>
  
  <div id="category-filter" class="category-filter">
    <button type="button" class="category-btn active" onclick="filterByCategory(null, this)">All Products</button>
  </div>
  
  <div id="product-grid" class="product-grid">
    <div class="loading">Loading products...</div>
  </div>
</div>

<div id="cart-toast" class="cart-toast" role="status" aria-live="polite" aria-hidden="true"></div>

<!-- Product Detail Modal -->
<div id="product-modal" class="modal">
<div class="modal-content">
<span class="modal-close" onclick="closeProductModal()">&times;</span>
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
  padding: 1rem 1.5rem 1rem 2.5rem;
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

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgb(var(--color-neutral-400));
  font-size: 1.25rem;
}

.search-input::placeholder {
  color: rgb(var(--color-neutral-400));
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
  object-fit: cover;
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
}

.modal-close:hover {
background: rgb(var(--color-neutral-200));
color: rgb(var(--color-neutral-800));
}
  }
  
  .shop-header h1 {
    font-size: 2rem;
  }
}
</style>

<script>
// Shop initialization
const API_BASE = 'https://dicebastion-memberships.ncalamaro.workers.dev';

let allProducts = [];
let currentFilter = null;
let currentSearchTerm = '';

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
      applyFilters();
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
        if (row) clampGridQtyInput(row, product);
        applyFilters();
      }
    }
  });
}

// Load products from API
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    allProducts = await response.json();
    
    // Build category filter
    buildCategoryFilter(allProducts);
    
    // Apply filters (initially no search term, no category filter)
    applyFilters();
  } catch (error) {
    console.error('Failed to load products:', error);
    document.getElementById('product-grid').innerHTML = 
      '<div class="loading">Failed to load products. Please try again later.</div>';
  }
}

// Build category filter menu
function buildCategoryFilter(products) {
  const categoryCount = {};
  
  // Count products per category
  products.forEach(product => {
    if (product.category) {
      product.category.split(',').forEach(cat => {
        const trimmedCat = cat.trim();
        categoryCount[trimmedCat] = (categoryCount[trimmedCat] || 0) + 1;
      });
    }
  });
  
  // Get top 5 categories by count
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);
  
  const filterContainer = document.getElementById('category-filter');
  
  // Build filter buttons
  const buttons = ['<button type="button" class="category-btn active" onclick="filterByCategory(null, this)">All Products</button>'];
  topCategories.forEach(cat => {
    const safe = cat.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    buttons.push(`<button type="button" class="category-btn" onclick="filterByCategory('${safe}', this)">${cat}</button>`);
  });
  
  filterContainer.innerHTML = buttons.join('');
}

// Handle search input
function handleSearch() {
  currentSearchTerm = document.getElementById('search-input').value.toLowerCase();
  applyFilters();
}

// Apply both search and category filters
function applyFilters() {
  let filteredProducts = [...allProducts];
  
  // Apply search filter
  if (currentSearchTerm) {
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(currentSearchTerm)
    );
  }
  
  // Apply category filter
  if (currentFilter) {
    filteredProducts = filteredProducts.filter(product => 
      product.category && product.category.split(',').map(c => c.trim()).includes(currentFilter)
    );
  }
  
  renderProducts(filteredProducts);
}

// Filter products by category
function filterByCategory(category, btnElement) {
  currentFilter = category;
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  if (btnElement) {
    btnElement.classList.add('active');
  }
  applyFilters();
}

// Render products
function renderProducts(products) {
  const grid = document.getElementById('product-grid');

  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h2>No products available yet</h2>
        <p>Check back soon for new items!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products
    .map(product => {
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
      const summaryHtml =
        typeof product.summary === 'string' ? product.summary : '';

      const quickAdd = renderQuickAddBlock(product);

      return `
<div class="product-card">
    <a href="/products/${
      product.slug
    }" class="product-card-link" onclick="event.preventDefault(); showProductDetail(${
      product.id
    }, ${JSON.stringify(product.slug || '')});">
    ${
      product.image_url
        ? `<img src="${escapeHtml(product.image_url)}" alt="${nameHtml}" class="product-image">`
        : '<div class="product-image"></div>'
    }
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
            <div class="product-stock ${
              product.stock_quantity < 5 && product.stock_quantity > 0
                ? 'low'
                : ''
            } ${product.stock_quantity === 0 ? 'out' : ''}">
              ${
                product.stock_quantity > 0
                  ? `${product.stock_quantity} in stock`
                  : 'Out of stock'
              }
            </div>
          </div>
        </div>
      </div>
    </a>
    <div class="product-card-actions">
      ${quickAdd}
    </div>
</div>
  `;
    })
    .join('');

  products.forEach(p => {
    const row = grid.querySelector(
      `.qty-stepper[data-product-id="${p.id}"] .qty-stepper-input`
    );
    if (row) clampGridQtyInput(row, p);
  });
}

// Show product detail modal
window.showProductDetail = async function (productId, slug, skipPushState) {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`);
    const product = await response.json();

    if (!skipPushState) {
      const productSlug = slug || product.slug;
      if (productSlug) {
        const newUrl = `${window.location.pathname}?product=${encodeURIComponent(productSlug)}`;
        history.pushState({ product: productSlug }, '', newUrl);
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
    const imgUrl = escapeHtml(product.image_url || '');
    const room = remainingForProduct(product);

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
${product.image_url ? `<img src="${imgUrl}" alt="${nameHtml}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 1.5rem;">` : ''}
${isPreorder ? `<div style="display: inline-block; background: rgb(var(--color-primary-600)); color: white; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem;">PRE-ORDER</div>` : ''}
<h2 style="margin: 0 0 1rem 0; color: rgb(var(--color-neutral-800));">${nameHtml}</h2>
${isPreorder ? `<div style="font-size: 1rem; color: rgb(var(--color-primary-600)); margin-bottom: 1rem; font-weight: 500;">Available from ${releaseDate}</div>` : ''}
<div style="font-size: 2rem; font-weight: 700; color: rgb(var(--color-primary-600)); margin-bottom: 1rem;">${formatPrice(product.price)}</div>
<div style="margin-bottom: 1rem; color: rgb(var(--color-neutral-600));">
<strong>Stock:</strong> ${product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
</div>
${product.full_description ? `<div style="line-height: 1.6; margin-bottom: 1.5rem; color: rgb(var(--color-neutral-700));">${product.full_description}</div>` : product.summary ? `<div style="line-height: 1.6; margin-bottom: 1.5rem; color: rgb(var(--color-neutral-700));">${product.summary}</div>` : ''}
${actionsHtml}
</div>`;

    modal.classList.add('active');
    if (product.stock_quantity > 0 && room > 0) {
      wireModalCartUI(product);
      document.getElementById('modal-keep-shopping')?.addEventListener('click', () => closeProductModal());
    }
  } catch (error) {
    console.error('Failed to load product details:', error);
  }
};
window.closeProductModal = function() {
document.getElementById('product-modal').classList.remove('active');
// Restore clean URL
const params = new URLSearchParams(window.location.search);
if (params.has('product')) {
  const cleanUrl = params.has('category')
    ? `${window.location.pathname}?category=${encodeURIComponent(params.get('category'))}`
    : window.location.pathname;
  history.pushState({}, '', cleanUrl);
}
};

// Close modal on background click
document.addEventListener('click', function(e) {
if (e.target.id === 'product-modal') {
closeProductModal();
}
});

// Handle browser back/forward button
window.addEventListener('popstate', function(e) {
const params = new URLSearchParams(window.location.search);
const productSlug = params.get('product');
if (productSlug && allProducts.length > 0) {
  const match = allProducts.find(p => p.slug === productSlug);
  if (match) showProductDetail(match.id, match.slug, true);
} else {
  document.getElementById('product-modal').classList.remove('active');
}
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
  bindProductGridActions();
  // Check for ?category= param to auto-filter
  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get('category');

  await loadProducts();
  updateCartBadge();

  // Auto-filter by category if specified in URL
  if (categoryParam && allProducts.length > 0) {
    currentFilter = categoryParam;
    applyFilters();
    // Activate matching category button
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.textContent.trim() === categoryParam) btn.classList.add('active');
    });
  }

  // Auto-open product modal if ?product=slug is set
  const productSlug = params.get('product');
  if (productSlug && allProducts.length > 0) {
    const match = allProducts.find(p => p.slug === productSlug);
    if (match) {
      showProductDetail(match.id, match.slug, true);
    }
  }
});
</script>
