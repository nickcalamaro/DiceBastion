---
title: "Shopping Cart"
---

<div id="cart-page">
<div class="cart-container">
<h1>Your Shopping Cart</h1>

<div id="cart-content">
    <div class="loading">Loading cart...</div>
</div>

<div id="cart-summary" style="display: none;">
    <div class="summary-card">
    <h2>Order Summary</h2>
    <div class="summary-line">
        <span>Subtotal</span>
        <span id="cart-subtotal">£0.00</span>
    </div>
    <div class="summary-line">
        <span>Shipping</span>
        <span id="cart-shipping">£0.00</span>
    </div>
    <div class="summary-line total">
        <span>Total</span>
        <span id="cart-total">£0.00</span>
    </div>
    <button id="checkout-btn" class="btn btn-primary btn-large">
        Proceed to Checkout
    </button>
    <a href="/" class="btn btn-secondary btn-large">Continue Shopping</a>
    </div>
</div>
</div>
</div>

<style>
.cart-container {
max-width: 1200px;
margin: 0 auto;
}

.cart-container h1 {
font-size: 2rem;
margin-bottom: 2rem;
color: rgb(var(--color-neutral-800));
}

#cart-content {
flex: 1;
min-width: 0;
}

.cart-empty {
text-align: center;
padding: 4rem 2rem;
background: rgb(var(--color-neutral));
border-radius: 12px;
border: 1px solid rgb(var(--color-neutral-200));
}

.cart-empty h2 {
color: rgb(var(--color-neutral-600));
margin-bottom: 1rem;
}

.cart-items {
background: rgb(var(--color-neutral));
border-radius: 12px;
border: 1px solid rgb(var(--color-neutral-200));
overflow: hidden;
}

.cart-item {
display: flex;
gap: 1.5rem;
padding: 1.5rem;
border-bottom: 1px solid rgb(var(--color-neutral-200));
align-items: center;
}

.cart-item:last-child {
border-bottom: none;
}

.cart-item-image {
width: 100px;
height: 100px;
object-fit: cover;
border-radius: 8px;
background: rgb(var(--color-neutral-100));
flex-shrink: 0;
}

.cart-item-details {
flex: 1;
min-width: 0;
}

.cart-item-name {
font-size: 1.125rem;
font-weight: 600;
color: rgb(var(--color-neutral-800));
margin-bottom: 0.25rem;
}

.cart-item-price {
font-size: 1rem;
color: rgb(var(--color-neutral-600));
}

.cart-item-actions {
display: flex;
align-items: center;
gap: 1rem;
flex-shrink: 0;
}

.quantity-control {
display: flex;
align-items: center;
gap: 0.5rem;
background: rgb(var(--color-neutral-50));
border: 1px solid rgb(var(--color-neutral-300));
border-radius: 6px;
padding: 0.25rem;
}

.quantity-btn {
width: 32px;
height: 32px;
border: none;
background: rgb(var(--color-neutral));
color: rgb(var(--color-neutral-700));
border-radius: 4px;
cursor: pointer;
font-size: 1rem;
font-weight: 600;
transition: all 0.2s;
}

.quantity-btn:hover {
background: rgb(var(--color-primary-50));
color: rgb(var(--color-primary-600));
}

.quantity-btn:disabled {
opacity: 0.5;
cursor: not-allowed;
}

.quantity-value {
min-width: 40px;
text-align: center;
font-weight: 600;
color: rgb(var(--color-neutral-800));
}

.cart-item-total {
font-size: 1.25rem;
font-weight: 700;
color: rgb(var(--color-primary-600));
min-width: 80px;
text-align: right;
}

.remove-btn {
padding: 0.5rem 1rem;
background: transparent;
border: 1px solid rgb(var(--color-neutral-300));
color: rgb(var(--color-neutral-600));
border-radius: 6px;
cursor: pointer;
font-size: 0.875rem;
transition: all 0.2s;
}

.remove-btn:hover {
background: rgb(254, 226, 226);
border-color: rgb(220, 38, 38);
color: rgb(220, 38, 38);
}

#cart-summary {
position: sticky;
top: 2rem;
}

.summary-card {
background: rgb(var(--color-neutral));
border: 1px solid rgb(var(--color-neutral-200));
border-radius: 12px;
padding: 1.5rem;
}

.summary-card h2 {
font-size: 1.5rem;
margin-bottom: 1rem;
color: rgb(var(--color-neutral-800));
}

.summary-line {
display: flex;
justify-content: space-between;
padding: 0.75rem 0;
color: rgb(var(--color-neutral-700));
font-size: 1rem;
}

.summary-line.total {
border-top: 2px solid rgb(var(--color-neutral-200));
margin-top: 0.5rem;
padding-top: 1rem;
font-size: 1.25rem;
font-weight: 700;
color: rgb(var(--color-neutral-900));
}

.btn {
width: 100%;
padding: 0.875rem 1.5rem;
border: none;
border-radius: 8px;
font-size: 1rem;
font-weight: 600;
cursor: pointer;
transition: all 0.2s;
text-align: center;
text-decoration: none;
display: inline-block;
}

.btn-large {
padding: 1rem 1.5rem;
font-size: 1.125rem;
}

.btn-primary {
background: rgb(var(--color-primary-600));
color: white;
margin-bottom: 0.75rem;
}

.btn-primary:hover {
background: rgb(var(--color-primary-700));
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-secondary {
background: rgb(var(--color-neutral-100));
color: rgb(var(--color-neutral-700));
border: 1px solid rgb(var(--color-neutral-300));
}

.btn-secondary:hover {
background: rgb(var(--color-neutral-200));
}

.loading {
text-align: center;
padding: 3rem;
color: rgb(var(--color-neutral-500));
}

@media (max-width: 768px) {
.cart-item {
flex-direction: column;
align-items: flex-start;
}

.cart-item-image {
width: 100%;
height: 200px;
}

.cart-item-actions {
width: 100%;
flex-direction: column;
align-items: stretch;
}

.cart-item-total {
text-align: left;
}

#cart-summary {
position: static;
}
}
</style>

<script>
const API_BASE = 'https://dicebastion-memberships.ncalamaro.workers.dev';
let cart = [];

// Get or create session ID
function getSessionId() {
let sessionId = localStorage.getItem('shop_session_id');
if (!sessionId) {
sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
localStorage.setItem('shop_session_id', sessionId);
}
return sessionId;
}

// Load cart from localStorage
function loadCart() {
const stored = localStorage.getItem('shop_cart');
return stored ? JSON.parse(stored) : [];
}

// Save cart to localStorage
function saveCart(cartData) {
localStorage.setItem('shop_cart', JSON.stringify(cartData));
cart = cartData;
updateCartDisplay();
}

// Format currency
function formatPrice(pence) {
return '£' + (pence / 100).toFixed(2);
}

// Render cart
function renderCart() {
const contentEl = document.getElementById('cart-content');
const summaryEl = document.getElementById('cart-summary');

if (cart.length === 0) {
contentEl.innerHTML = `
    <div class="cart-empty">
    <h2>🛒 Your cart is empty</h2>
    <p>Start shopping to add items to your cart!</p>
    <a href="/" class="btn btn-primary" style="max-width: 300px; margin: 1.5rem auto 0;">Browse Products</a>
    </div>
`;
summaryEl.style.display = 'none';
return;
}

const itemsHtml = cart.map(item => `
<div class="cart-item" data-product-id="${item.id}">
    ${item.image_url ? 
    `<img src="${item.image_url}" alt="${item.name}" class="cart-item-image">` :
    '<div class="cart-item-image"></div>'
    }
    <div class="cart-item-details">
    <div class="cart-item-name">${item.name}</div>
    <div class="cart-item-price">${formatPrice(item.price)} each</div>
    </div>
    <div class="cart-item-actions">
    <div class="quantity-control">
        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
        <span class="quantity-value">${item.quantity}</span>
        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})" ${item.quantity >= item.stock_quantity ? 'disabled' : ''}>+</button>
    </div>
    <div class="cart-item-total">${formatPrice(item.price * item.quantity)}</div>
    <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
    </div>
</div>
`).join('');

contentEl.innerHTML = `<div class="cart-items">${itemsHtml}</div>`;

// Update summary
const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
const shipping = 0; // TODO: Calculate shipping
const total = subtotal + shipping;

document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
document.getElementById('cart-shipping').textContent = formatPrice(shipping);
document.getElementById('cart-total').textContent = formatPrice(total);

summaryEl.style.display = 'block';
}

// Update quantity
window.updateQuantity = function(productId, newQuantity) {
if (newQuantity < 1) return;

const item = cart.find(i => i.id === productId);
if (item && newQuantity <= item.stock_quantity) {
item.quantity = newQuantity;
saveCart(cart);
renderCart();
}
};

// Remove from cart
window.removeFromCart = function(productId) {
cart = cart.filter(item => item.id !== productId);
saveCart(cart);
renderCart();
};

// Update cart display (for header badge, etc.)
function updateCartDisplay() {
const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
const event = new CustomEvent('cartUpdated', { detail: { count: totalItems, cart } });
window.dispatchEvent(event);
}

// Proceed to checkout
document.getElementById('checkout-btn')?.addEventListener('click', function() {
if (cart.length === 0) {
alert('Your cart is empty');
return;
}
window.location.href = '/checkout';
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
cart = loadCart();
renderCart();
});
</script>
