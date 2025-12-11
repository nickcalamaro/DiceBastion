---
title: "Dice Bastion Shop"
description: "Board games, miniatures, accessories, and more"
---

<div id="shop-app">
  <div class="shop-header">
    <h1>Welcome to the Dice Bastion Shop</h1>
    <p>Browse our collection of board games, miniatures, and gaming accessories.</p>
  </div>
  
  <div id="category-filter" class="category-filter">
    <button class="category-btn active" onclick="filterByCategory(null)">All Products</button>
  </div>
  
  <div id="product-grid" class="product-grid">
    <div class="loading">Loading products...</div>
  </div>
</div>

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
  margin: 2rem 0 3rem;
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
  cursor: pointer;
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
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
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

// Load cart from localStorage
function loadCart() {
  const stored = localStorage.getItem('shop_cart');
  return stored ? JSON.parse(stored) : [];
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem('shop_cart', JSON.stringify(cart));
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

// Load products from API
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    allProducts = await response.json();
    
    // Build category filter
    buildCategoryFilter(allProducts);
    
    renderProducts(allProducts);
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
  const buttons = ['<button class="category-btn active" onclick="filterByCategory(null)">All Products</button>'];
  topCategories.forEach(cat => {
    buttons.push(`<button class="category-btn" onclick="filterByCategory('${cat}')">${cat}</button>`);
  });
  
  filterContainer.innerHTML = buttons.join('');
}

// Filter products by category
function filterByCategory(category) {
  currentFilter = category;
  
  // Update active button
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Filter and render products
  const filtered = category 
    ? allProducts.filter(p => p.category && p.category.split(',').map(c => c.trim()).includes(category))
    : allProducts;
  
  renderProducts(filtered);
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
  
  grid.innerHTML = products.map(product => {
    const isPreorder = product.release_date && new Date(product.release_date) > new Date();
    const releaseDate = isPreorder ? new Date(product.release_date).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }) : null;
    
    return `
    <div class="product-card" onclick="showProductDetail(${product.id})">
      ${product.image_url ? 
        `<img src="${product.image_url}" alt="${product.name}" class="product-image">` :
        '<div class="product-image"></div>'
      }
      ${isPreorder ? 
        `<div style="position: absolute; top: 10px; left: 10px; background: rgb(var(--color-primary-600)); color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">PRE-ORDER</div>` : 
        ''
      }
      <div class="product-content">
        <div class="product-name">${product.name}</div>
        <div class="product-description">${product.summary || ''}</div>
        ${isPreorder ? 
          `<div style="font-size: 0.875rem; color: rgb(var(--color-primary-600)); margin: 0.5rem 0; font-weight: 500;">Available ${releaseDate}</div>` : 
          ''
        }
        <div class="product-footer">
          <div>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="product-stock ${product.stock_quantity < 5 && product.stock_quantity > 0 ? 'low' : ''} ${product.stock_quantity === 0 ? 'out' : ''}">
              ${product.stock_quantity > 0 ? 
                `${product.stock_quantity} in stock` : 
                'Out of stock'
              }
            </div>
          </div>
          <button 
            class="add-to-cart-btn" 
            onclick="event.stopPropagation(); addToCart(${product.id}, '${product.name}', ${product.price}, ${product.stock_quantity}, '${product.image_url || ''}', ${isPreorder}, '${product.release_date || ''}', this)"
            ${product.stock_quantity === 0 ? 'disabled' : ''}
            data-product-id="${product.id}"
          >
            ${product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

// Add to cart function
window.addToCart = function(productId, name, price, stock, imageUrl, isPreorder, releaseDate, btnElement) {
  let cart = loadCart();
  
  // Check if item already in cart
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    // Check stock limit
    if (existingItem.quantity < stock) {
      existingItem.quantity += 1;
    } else {
      alert('Cannot add more - stock limit reached');
      return;
    }
  } else {
    // Add new item
    cart.push({
      id: productId,
      name: name,
      price: price,
      quantity: 1,
      stock_quantity: stock,
      image_url: imageUrl,
      is_preorder: isPreorder,
      release_date: releaseDate
    });
  }
  
  saveCart(cart);
  
  // Visual feedback
  btnElement.textContent = '✓ Added!';
  btnElement.classList.add('added');
  
  setTimeout(() => {
    btnElement.textContent = 'Add to Cart';
    btnElement.classList.remove('added');
  }, 1500);
};

// Show product detail modal
window.showProductDetail = async function(productId) {
try {
const response = await fetch(`${API_BASE}/products/${productId}`);
const product = await response.json();

const isPreorder = product.release_date && new Date(product.release_date) > new Date();
const releaseDate = isPreorder ? new Date(product.release_date).toLocaleDateString('en-GB', { 
  day: 'numeric', 
  month: 'long', 
  year: 'numeric' 
}) : null;

const modal = document.getElementById('product-modal');
const modalBody = document.getElementById('modal-body');

modalBody.innerHTML = `
<div style="padding: 2rem;">
${product.image_url ? 
`<img src="${product.image_url}" alt="${product.name}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 1.5rem;">` :
''
}
${isPreorder ? 
`<div style="display: inline-block; background: rgb(var(--color-primary-600)); color: white; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem;">PRE-ORDER</div>` : 
''
}
<h2 style="margin: 0 0 1rem 0; color: rgb(var(--color-neutral-800));">${product.name}</h2>
${isPreorder ? 
`<div style="font-size: 1rem; color: rgb(var(--color-primary-600)); margin-bottom: 1rem; font-weight: 500;">Available from ${releaseDate}</div>` : 
''
}
<div style="font-size: 2rem; font-weight: 700; color: rgb(var(--color-primary-600)); margin-bottom: 1rem;">${formatPrice(product.price)}</div>
<div style="margin-bottom: 1rem; color: rgb(var(--color-neutral-600));">
<strong>Stock:</strong> ${product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
</div>
${product.full_description ? 
`<div style="line-height: 1.6; margin-bottom: 1.5rem; color: rgb(var(--color-neutral-700));">${product.full_description}</div>` :
(product.summary ? `<div style="line-height: 1.6; margin-bottom: 1.5rem; color: rgb(var(--color-neutral-700));">${product.summary}</div>` : '')
}
<button 
class="add-to-cart-btn" 
onclick="addToCart(${product.id}, '${product.name}', ${product.price}, ${product.stock_quantity}, '${product.image_url || ''}', ${isPreorder}, '${product.release_date || ''}', this); closeProductModal();"
${product.stock_quantity === 0 ? 'disabled' : ''}
style="width: 100%; padding: 1rem; font-size: 1.1rem;"
>
${product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
</button>
</div>
`;

modal.classList.add('active');
} catch (error) {
console.error('Failed to load product details:', error);
}
};

window.closeProductModal = function() {
document.getElementById('product-modal').classList.remove('active');
};

// Close modal on background click
document.addEventListener('click', function(e) {
if (e.target.id === 'product-modal') {
closeProductModal();
}
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadProducts();
  updateCartBadge();
});
</script>
