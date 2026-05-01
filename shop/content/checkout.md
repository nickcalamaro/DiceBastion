---
title: "Checkout"
---

<div id="checkout-page">
<div class="checkout-container">
<div class="checkout-main">
<h1>Checkout</h1>

<div id="checkout-form-container">
<form id="checkout-form">
<div class="form-section">
<h2>Contact Information</h2>
<div class="form-group">
<label for="email">Email Address *</label>
<input type="email" id="email" name="email" required placeholder="your@email.com">
<small>We'll send your order confirmation here</small>
</div>

<div class="form-row">
<div class="form-group">
<label for="firstName">First Name *</label>
<input type="text" id="firstName" name="firstName" required>
</div>
<div class="form-group">
<label for="lastName">Last Name *</label>
<input type="text" id="lastName" name="lastName" required>
</div>
</div>
</div>

<div class="form-section">
<h2>Delivery Method</h2>
<div class="delivery-options">
<label class="delivery-option">
<input type="radio" name="delivery_method" value="collection" checked>
<div class="delivery-card">
<div class="delivery-header">
<strong>Collection (Free)</strong>
<span class="delivery-price">£0.00</span>
</div>
<p class="delivery-description">Collect from Gibraltar Warhammer Club</p>
<div class="collection-info">
<small><strong>Location:</strong> <a href="https://maps.app.goo.gl/xRVr1Jq58ANZ9DLY6" target="_blank" rel="noopener noreferrer">Gibraltar Warhammer Club (View on Map)</a></small>
<small>We'll email you when your order is ready for collection (usually within 24 hours)</small>
</div>
</div>
</label>

<label class="delivery-option">
<input type="radio" name="delivery_method" value="delivery">
<div class="delivery-card">
<div class="delivery-header">
<strong>Local Delivery</strong>
<span class="delivery-price">£4.00</span>
</div>
<p class="delivery-description">Delivery to your Gibraltar address</p>
<small>Delivered within 2-3 business days</small>
</div>
</label>
</div>
</div>

<div class="form-section" id="delivery-address-section" style="display: none;">
<h2>Delivery Address</h2>
<div class="form-group">
<label for="address1">Address Line 1 *</label>
<input type="text" id="address1" name="address1">
</div>
<div class="form-group">
<label for="address2">Address Line 2</label>
<input type="text" id="address2" name="address2">
</div>
<div class="form-row">
<div class="form-group">
<label for="city">City *</label>
<input type="text" id="city" name="city">
</div>
<div class="form-group">
<label for="postcode">Postcode *</label>
<input type="text" id="postcode" name="postcode">
</div>
</div>
<div class="form-group">
<label for="country">Country *</label>
<select id="country" name="country">
<option value="GI" selected>Gibraltar</option>
</select>
</div>
</div>

<div class="form-section">
<h2>Additional Notes</h2>
<div class="form-group">
<label for="notes">Order Notes (Optional)</label>
<textarea id="notes" name="notes" rows="3" placeholder="Any special instructions for your order..."></textarea>
</div>
</div>

<div class="form-section">
<label class="checkbox-label">
<input type="checkbox" id="terms" name="terms" required>
<span>I agree to the <a href="https://dicebastion.com/privacy-policy/" target="_blank">Privacy Policy</a> and understand my data will be processed to fulfill this order *</span>
</label>
</div>

<button type="submit" class="btn btn-primary btn-large" id="submit-order">
Place Order
</button>
</form>
</div>

<div id="payment-processing" style="display: none;">
<div class="processing-card">
<div class="spinner"></div>
<h2>Processing your order...</h2>
<p>Please wait while we prepare your payment.</p>
</div>
<div id="sumup-card" style="max-width: 500px; margin: 2rem auto;"></div>
</div>
</div>

<div class="checkout-sidebar">
<div class="order-summary">
<h2>Order Summary</h2>
<div id="summary-items"></div>
<div id="preorder-notice" style="display: none; background: rgb(var(--color-primary-100)); border: 1px solid rgb(var(--color-primary-600)); border-radius: 8px; padding: 1rem; margin: 1rem 0;">
<div style="display: flex; gap: 0.5rem; align-items: start;">
<svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0; margin-top: 2px;">
<path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z" fill="rgb(var(--color-primary-600))"/>
</svg>
<div style="flex: 1;">
<strong style="color: rgb(var(--color-primary-700)); display: block; margin-bottom: 0.25rem;">Pre-order Notice</strong>
<small style="color: rgb(var(--color-primary-800)); line-height: 1.4;">Your order contains one or more pre-order items. Your entire order will be delivered once all items are available.</small>
</div>
</div>
</div>
<div class="promo-box" style="margin: 1rem 0 0; padding: 1rem; background: rgb(var(--color-neutral-50)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 8px;">
<label for="promo-code-input" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Promo code</label>
<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
<input type="text" id="promo-code-input" name="promo_code" placeholder="Enter code" autocomplete="off" autocapitalize="characters" style="flex: 1; min-width: 140px; padding: 0.6rem 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
<button type="button" id="promo-apply-btn" class="btn btn-secondary" style="padding: 0.6rem 1rem; margin: 0;">Apply</button>
</div>
<p id="promo-message" style="margin: 0.5rem 0 0; font-size: 0.8125rem; min-height: 1.2em;"></p>
</div>
<div class="summary-totals">
<div class="summary-line">
<span>Subtotal</span>
<span id="summary-subtotal">£0.00</span>
</div>
<div class="summary-line summary-discount" id="summary-discount-row" style="display: none; color: rgb(22, 163, 74);">
<span>Promotion</span>
<span id="summary-discount">−£0.00</span>
</div>
<div class="summary-line">
<span>Shipping</span>
<span id="summary-shipping">£0.00</span>
</div>
<div class="summary-line total">
<span>Total</span>
<span id="summary-total">£0.00</span>
</div>
</div>
</div>
</div>
</div>
</div>

<style>
.checkout-container {
max-width: 1400px;
margin: 0 auto;
display: grid;
grid-template-columns: 1fr 400px;
gap: 2rem;
align-items: start;
}

.checkout-main h1 {
font-size: 2rem;
margin-bottom: 2rem;
color: rgb(var(--color-neutral-800));
}

.form-section {
background: rgb(var(--color-neutral));
border: 1px solid rgb(var(--color-neutral-200));
border-radius: 12px;
padding: 2rem;
margin-bottom: 1.5rem;
}

.form-section h2 {
font-size: 1.25rem;
margin-bottom: 1.5rem;
color: rgb(var(--color-neutral-800));
}

.form-group {
margin-bottom: 1.25rem;
}

.form-row {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 1rem;
}

label {
display: block;
margin-bottom: 0.5rem;
font-weight: 600;
color: rgb(var(--color-neutral-700));
font-size: 0.95rem;
}

input[type="text"],
input[type="email"],
select,
textarea {
width: 100%;
padding: 0.75rem;
border: 1px solid rgb(var(--color-neutral-300));
border-radius: 6px;
font-size: 1rem;
font-family: inherit;
transition: all 0.2s;
background: rgb(var(--color-neutral));
color: rgb(var(--color-neutral-800));
}

input:focus,
select:focus,
textarea:focus {
outline: none;
border-color: rgb(var(--color-primary-500));
box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

small {
display: block;
margin-top: 0.25rem;
color: rgb(var(--color-neutral-500));
font-size: 0.875rem;
}

.checkbox-label {
display: flex;
align-items: flex-start;
gap: 0.75rem;
cursor: pointer;
font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
margin-top: 0.25rem;
width: auto;
cursor: pointer;
}

.checkbox-label a {
color: rgb(var(--color-primary-600));
text-decoration: underline;
}

.btn {
width: 100%;
padding: 1rem 1.5rem;
border: none;
border-radius: 8px;
font-size: 1.125rem;
font-weight: 600;
cursor: pointer;
transition: all 0.2s;
text-align: center;
}

.btn-primary {
background: rgb(var(--color-primary-600));
color: white;
}

.btn-primary:hover:not(:disabled) {
background: rgb(var(--color-primary-700));
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-primary:disabled {
opacity: 0.6;
cursor: not-allowed;
transform: none;
}

.checkout-sidebar {
position: sticky;
top: 2rem;
}

.order-summary {
background: rgb(var(--color-neutral));
border: 1px solid rgb(var(--color-neutral-200));
border-radius: 12px;
padding: 1.5rem;
}

.order-summary h2 {
font-size: 1.5rem;
margin-bottom: 1rem;
color: rgb(var(--color-neutral-800));
}

.summary-item {
display: flex;
justify-content: space-between;
padding: 0.75rem 0;
border-bottom: 1px solid rgb(var(--color-neutral-200));
gap: 1rem;
}

.summary-item:last-child {
border-bottom: none;
}

.summary-item-details {
flex: 1;
}

.summary-item-name {
font-weight: 600;
color: rgb(var(--color-neutral-800));
margin-bottom: 0.25rem;
}

.summary-item-qty {
font-size: 0.875rem;
color: rgb(var(--color-neutral-600));
}

.summary-item-price {
font-weight: 600;
color: rgb(var(--color-neutral-700));
white-space: nowrap;
}

.summary-totals {
margin-top: 1rem;
padding-top: 1rem;
border-top: 2px solid rgb(var(--color-neutral-200));
}

.summary-line {
display: flex;
justify-content: space-between;
padding: 0.5rem 0;
color: rgb(var(--color-neutral-700));
}

.summary-line.total {
font-size: 1.25rem;
font-weight: 700;
color: rgb(var(--color-neutral-900));
margin-top: 0.5rem;
padding-top: 0.75rem;
border-top: 1px solid rgb(var(--color-neutral-200));
}

.delivery-options {
display: flex;
flex-direction: column;
gap: 1rem;
}

.delivery-option {
display: block;
cursor: pointer;
}

.delivery-option input[type="radio"] {
position: absolute;
opacity: 0;
}

.delivery-card {
border: 2px solid rgb(var(--color-neutral-300));
border-radius: 8px;
padding: 1.25rem;
transition: all 0.2s;
background: rgb(var(--color-neutral));
}

.delivery-option input[type="radio"]:checked + .delivery-card {
border-color: rgb(var(--color-primary-600));
background: rgba(37, 99, 235, 0.03);
}

.delivery-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 0.5rem;
}

.delivery-header strong {
font-size: 1.05rem;
color: rgb(var(--color-neutral-800));
}

.delivery-price {
font-weight: 700;
color: rgb(var(--color-primary-600));
font-size: 1.1rem;
}

.delivery-description {
color: rgb(var(--color-neutral-600));
margin: 0.25rem 0 0.75rem;
}

.collection-info {
background: rgba(37, 99, 235, 0.05);
border-left: 3px solid rgb(var(--color-primary-600));
padding: 0.75rem;
border-radius: 4px;
margin-top: 0.75rem;
}

.collection-info small {
display: block;
margin: 0.25rem 0;
color: rgb(var(--color-neutral-700));
line-height: 1.4;
}

.processing-card {
background: rgb(var(--color-neutral));
border: 1px solid rgb(var(--color-neutral-200));
border-radius: 12px;
padding: 3rem;
text-align: center;
}

.spinner {
width: 50px;
height: 50px;
border: 4px solid rgb(var(--color-neutral-200));
border-top-color: rgb(var(--color-primary-600));
border-radius: 50%;
animation: spin 1s linear infinite;
margin: 0 auto 1.5rem;
}

@keyframes spin {
to { transform: rotate(360deg); }
}

@media (max-width: 968px) {
.checkout-container {
grid-template-columns: 1fr;
}

.checkout-sidebar {
position: static;
order: -1;
}

.form-row {
grid-template-columns: 1fr;
}
}
</style>

<script src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"></script>
<script>
const API_BASE = 'https://dicebastion-memberships.ncalamaro.workers.dev';
let cart = [];
let currentOrderNumber = null;
let appliedDiscountPence = 0;

const PROMO_ERR_MSG = {
  promo_not_found: 'That promo code could not be found.',
  promo_not_started: 'This code is not active yet.',
  promo_expired: 'This promo code has expired.',
  promo_max_uses: 'This code has reached its maximum number of uses.',
  promo_min_subtotal_not_met: 'Basket subtotal is too low for this code.',
  promo_membership_required: 'This code is only for active members — use your membership email at checkout.',
  promo_no_eligible_lines: 'No items in your basket qualify for this code.',
  promo_zero_discount: 'This code does not reduce your order.',
  promo_invalid_config: 'This promotion is misconfigured. Please contact support.',
  checkout_total_below_minimum: 'Discount would make your order total too low; add items or reduce the discount.',
  missing_items: '',
  invalid_delivery_method: '',
  insufficient_stock: ''
};

function formatPrice(pence) {
return '£' + (pence / 100).toFixed(2);
}

function loadCart() {
if (typeof ShopCartStorage !== 'undefined') {
return ShopCartStorage.load();
}
try {
const stored = localStorage.getItem('shop_cart');
return stored ? JSON.parse(stored) : [];
} catch (e) {
return [];
}
}

function renderOrderSummary() {
cart = loadCart();

if (cart.length === 0) {
window.location.href = '/cart';
return;
}

// Check for pre-order items
const hasPreorders = cart.some(item => {
if (item.is_preorder && item.release_date) {
const releaseDate = new Date(item.release_date);
return releaseDate > new Date();
}
return false;
});

// Show/hide pre-order notice
const preorderNotice = document.getElementById('preorder-notice');
if (preorderNotice) {
preorderNotice.style.display = hasPreorders ? 'block' : 'none';
}

const itemsHtml = cart.map(item => `
<div class="summary-item">
<div class="summary-item-details">
<div class="summary-item-name">${item.name}${item.is_preorder ? ' <span style="font-size: 0.75rem; color: rgb(var(--color-primary-600)); font-weight: 600;">(PRE-ORDER)</span>' : ''}</div>
<div class="summary-item-qty">Qty: ${item.quantity}</div>
</div>
<div class="summary-item-price">${formatPrice(item.price * item.quantity)}</div>
</div>
`).join('');

document.getElementById('summary-items').innerHTML = itemsHtml;
appliedDiscountPence = 0;
const pm = document.getElementById('promo-message');
if (pm) pm.textContent = '';
updateTotals();
}

function updateTotals() {
const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'collection';
const shipping = deliveryMethod === 'delivery' ? 400 : 0;
const disc = Math.max(0, appliedDiscountPence);
const total = Math.max(0, subtotal + shipping - disc);

document.getElementById('summary-subtotal').textContent = formatPrice(subtotal);
const discRow = document.getElementById('summary-discount-row');
if (disc > 0 && discRow) {
discRow.style.display = 'flex';
document.getElementById('summary-discount').textContent = '−' + formatPrice(disc);
} else if (discRow) {
discRow.style.display = 'none';
}
document.getElementById('summary-shipping').textContent = formatPrice(shipping);
document.getElementById('summary-total').textContent = formatPrice(total);
}

async function fetchPromoQuote(opts) {
const silent = !!(opts && opts.silent);
const msg = document.getElementById('promo-message');
const codeInput = document.getElementById('promo-code-input');
const code = (codeInput && codeInput.value ? codeInput.value : '').trim();
if (!code) {
appliedDiscountPence = 0;
updateTotals();
if (msg && !silent) msg.textContent = '';
return { ok: true, cleared: true };
}

const email = document.getElementById('email')?.value?.trim();
const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'collection';

const res = await fetch(`${API_BASE}/shop/promo/quote`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
email: email || undefined,
items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
promo_code: code,
delivery_method: deliveryMethod
})
});

const data = await res.json().catch(() => ({}));
if (!res.ok) {
appliedDiscountPence = 0;
updateTotals();
const errKey = data.error || '';
let line = PROMO_ERR_MSG[errKey] || 'That code could not be applied.';
if (errKey === 'promo_membership_required' && !email) {
line = 'Enter the email on your Dice Bastion account, then apply the code again.';
}
if (msg && !silent) {
msg.style.color = '#b91c1c';
msg.textContent = line;
}
return { ok: false };
}

if (!data.promo_applied) {
appliedDiscountPence = 0;
updateTotals();
if (msg && !silent) {
msg.style.color = 'rgb(var(--color-neutral-600))';
msg.textContent = '';
}
return { ok: true };
}

if (data.total_below_minimum) {
appliedDiscountPence = 0;
updateTotals();
if (msg && !silent) {
msg.style.color = '#b91c1c';
msg.textContent = 'This discount would make your order total too low to pay online. Add more items or use a smaller discount.';
}
return { ok: false };
}

appliedDiscountPence = Number(data.discount_pence) || 0;
updateTotals();
if (msg && !silent) {
msg.style.color = 'rgb(22, 163, 74)';
msg.textContent = 'Promo applied: ' + (data.promo_label || code) + '.';
}
return { ok: true };
}

function toggleDeliveryAddress() {
const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value;
const addressSection = document.getElementById('delivery-address-section');
const addressFields = addressSection.querySelectorAll('input, select');

if (deliveryMethod === 'delivery') {
addressSection.style.display = 'block';
addressFields.forEach(field => {
if (field.id !== 'address2') { // address2 is optional
field.required = true;
}
});
} else {
addressSection.style.display = 'none';
addressFields.forEach(field => {
field.required = false;
field.value = '';
});
}
updateTotals();
const pc = document.getElementById('promo-code-input');
if (pc && pc.value.trim()) fetchPromoQuote({ silent: true }).catch(() => {});
}

async function handleCheckout(e) {
e.preventDefault();

const form = e.target;
const submitBtn = document.getElementById('submit-order');

// Disable form
submitBtn.disabled = true;
submitBtn.textContent = 'Processing...';

try {
// Collect form data
const formData = new FormData(form);
const deliveryMethod = formData.get('delivery_method');

const orderData = {
email: formData.get('email'),
name: `${formData.get('firstName')} ${formData.get('lastName')}`,
items: cart.map(item => ({
product_id: item.id,
quantity: item.quantity
})),
delivery_method: deliveryMethod,
notes: formData.get('notes') || null,
consent_at: new Date().toISOString()
};

const promoInput = document.getElementById('promo-code-input');
const promoTrim = promoInput && promoInput.value ? promoInput.value.trim() : '';
if (promoTrim) {
orderData.promo_code = promoTrim;
}

// Only include shipping address if delivery is selected
if (deliveryMethod === 'delivery') {
orderData.shipping_address = {
line1: formData.get('address1'),
line2: formData.get('address2'),
city: formData.get('city'),
postcode: formData.get('postcode'),
country: formData.get('country')
};
}

// Show processing UI
document.getElementById('checkout-form-container').style.display = 'none';
document.getElementById('payment-processing').style.display = 'block';

// Create order and get widget configuration
const response = await fetch(`${API_BASE}/shop/checkout`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify(orderData)
});

const result = await response.json();

if (!response.ok || !result.checkoutId) {
const detail = result.message || PROMO_ERR_MSG[result.error] || result.error || 'Failed to create checkout';
throw new Error(detail);
}

// Store order number for later
currentOrderNumber = result.order_number;

// Mount SumUp widget with checkoutId
const sumUpUtils = typeof window !== 'undefined' ? window.utils : null;
const SumUpCardMount = typeof window !== 'undefined' && window.SumUpCard ? window.SumUpCard : (typeof SumUpCard !== 'undefined' ? SumUpCard : null);
if (!sumUpUtils || typeof sumUpUtils.loadSumUpSdk !== 'function') {
throw new Error('SumUp checkout could not start (payment SDK missing). Refresh the page or check browser extensions blocking scripts.');
}
await sumUpUtils.loadSumUpSdk();
if (!SumUpCardMount || typeof SumUpCardMount.mount !== 'function') {
throw new Error('SumUp card widget is not available.');
}
await SumUpCardMount.mount({
id: 'sumup-card',
checkoutId: result.checkoutId,
locale: 'en-GB',
country: 'GB',
onResponse: async function(type, body) {
if (type === 'success') {
if (typeof ShopCartStorage !== 'undefined') ShopCartStorage.clear(); else localStorage.removeItem('shop_cart');
window.location.href = '/order-confirmation?order=' + encodeURIComponent(currentOrderNumber)
  + '&email=' + encodeURIComponent(orderData.email || '')
  + '&status=success';
} else if (type === 'error') {
console.error('Payment error:', body);
alert('Payment failed. Please try again.');
document.getElementById('checkout-form-container').style.display = 'block';
document.getElementById('payment-processing').style.display = 'none';
submitBtn.disabled = false;
submitBtn.textContent = 'Place Order';
}
}
}); // Hide spinner, show widget
document.querySelector('.processing-card').style.display = 'none';

} catch (error) {
console.error('Checkout error:', error);
alert('Sorry, there was an error processing your order. Please try again.');

// Re-enable form
document.getElementById('checkout-form-container').style.display = 'block';
document.getElementById('payment-processing').style.display = 'none';
submitBtn.disabled = false;
submitBtn.textContent = 'Place Order';
}
}

document.addEventListener('DOMContentLoaded', function() {
renderOrderSummary();

const form = document.getElementById('checkout-form');
if (form) {
form.addEventListener('submit', handleCheckout);
}

// Listen for delivery method changes
const deliveryOptions = document.querySelectorAll('input[name="delivery_method"]');
deliveryOptions.forEach(option => {
option.addEventListener('change', toggleDeliveryAddress);
});

// Initialize delivery address visibility
toggleDeliveryAddress();

document.getElementById('promo-apply-btn')?.addEventListener('click', () => {
fetchPromoQuote({ silent: false }).catch(() => {});
});

document.getElementById('promo-code-input')?.addEventListener('keydown', e => {
if (e.key === 'Enter') {
e.preventDefault();
fetchPromoQuote({ silent: false }).catch(() => {});
}
});
});
</script>
