---
title: "Order Confirmation"
---

<div id="order-confirmation-page">
<div class="confirmation-container">
<div id="confirmation-loading" class="loading-state">
<div class="spinner"></div>
<h2>Checking your order status...</h2>
<p>Please wait while we confirm your payment.</p>
</div>

<div id="confirmation-success" style="display: none;">
<div class="success-icon">✓</div>
<h1>Thank You for Your Order!</h1>
<p class="subtitle">Your order has been successfully placed</p>

<div class="order-details-card">
<h2>Order Details</h2>
<div class="detail-row">
<span class="label">Order Number:</span>
<span class="value" id="order-number">-</span>
</div>
<div class="detail-row">
<span class="label">Order Date:</span>
<span class="value" id="order-date">-</span>
</div>
<div class="detail-row">
<span class="label">Total:</span>
<span class="value" id="order-total">-</span>
</div>
<div class="detail-row">
<span class="label">Email:</span>
<span class="value" id="order-email">-</span>
</div>
</div>

<div class="info-box">
<h3>What's Next?</h3>
<ul>
<li>📧 You'll receive an order confirmation email shortly</li>
<li>📦 We'll prepare your items for shipping/pickup</li>
<li>🚚 You'll be notified when your order ships</li>
<li>💬 Contact us if you have any questions</li>
</ul>
</div>

<div class="actions">
<a href="/" class="btn btn-primary">Continue Shopping</a>
<a href="https://dicebastion.com" class="btn btn-secondary">Back to Main Site</a>
</div>
</div>

<div id="confirmation-pending" style="display: none;">
<div class="pending-icon">⏱️</div>
<h1>Payment Pending</h1>
<p class="subtitle">We're still waiting for payment confirmation</p>

<div class="info-box warning">
<h3>Your Order Status</h3>
<p>Your order has been created but payment hasn't been confirmed yet. This is normal and can take a few minutes.</p>
<p><strong>Order Number:</strong> <span id="pending-order-number">-</span></p>
</div>

<div class="actions">
<button onclick="checkOrderStatus()" class="btn btn-primary">Refresh Status</button>
<a href="/" class="btn btn-secondary">Back to Shop</a>
</div>
</div>

<div id="confirmation-error" style="display: none;">
<div class="error-icon">⚠️</div>
<h1>Unable to Confirm Order</h1>
<p class="subtitle">We couldn't find your order or there was an error</p>

<div class="info-box error">
<h3>What to do?</h3>
<ul>
<li>Check your email for order confirmation</li>
<li>Wait a few minutes and refresh this page</li>
<li>Contact us at contact@dicebastion.com with your order details</li>
</ul>
</div>

<div class="actions">
<a href="/cart" class="btn btn-primary">Back to Cart</a>
<a href="/" class="btn btn-secondary">Back to Shop</a>
</div>
</div>
</div>
</div>

<style>
#order-confirmation-page {
  padding: 2rem 1rem;
}

#order-confirmation-page .confirmation-container {
  max-width: 700px;
  margin: 2rem auto;
  text-align: center;
}

#order-confirmation-page .loading-state {
  padding: 4rem 2rem;
}

#order-confirmation-page .spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgb(var(--color-neutral-200));
  border-top-color: rgb(var(--color-primary-600));
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

#order-confirmation-page .success-icon,
#order-confirmation-page .pending-icon,
#order-confirmation-page .error-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  border-radius: 50%;
}

#order-confirmation-page .success-icon {
  background: rgb(16, 185, 129);
  color: white;
}

#order-confirmation-page .pending-icon {
  background: rgb(var(--color-primary-100));
  color: rgb(var(--color-primary-700));
}

#order-confirmation-page .error-icon {
  background: rgb(254, 226, 226);
  color: rgb(220, 38, 38);
}

#order-confirmation-page h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: rgb(var(--color-neutral-800));
}

#order-confirmation-page .subtitle {
  font-size: 1.125rem;
  color: rgb(var(--color-neutral-600));
  margin-bottom: 2rem;
}

#order-confirmation-page .order-details-card {
  background: rgb(var(--color-neutral));
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  text-align: left;
}

#order-confirmation-page .order-details-card h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: rgb(var(--color-neutral-800));
}

#order-confirmation-page .detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgb(var(--color-neutral-200));
}

#order-confirmation-page .detail-row:last-child {
  border-bottom: none;
}

#order-confirmation-page .detail-row .label {
  font-weight: 600;
  color: rgb(var(--color-neutral-700));
}

#order-confirmation-page .detail-row .value {
  color: rgb(var(--color-neutral-800));
}

#order-confirmation-page .info-box {
  background: rgb(var(--color-primary-50));
  border: 1px solid rgb(var(--color-primary-200));
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: left;
}

#order-confirmation-page .info-box.warning {
  background: rgb(254, 243, 199);
  border-color: rgb(252, 211, 77);
}

#order-confirmation-page .info-box.error {
  background: rgb(254, 226, 226);
  border-color: rgb(252, 165, 165);
}

#order-confirmation-page .info-box h3 {
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: rgb(var(--color-neutral-800));
}

#order-confirmation-page .info-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

#order-confirmation-page .info-box li {
  padding: 0.5rem 0;
  color: rgb(var(--color-neutral-700));
}

#order-confirmation-page .actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

#order-confirmation-page .btn {
  flex: 1;
  min-width: 200px;
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

#order-confirmation-page .btn-primary {
  background: rgb(var(--color-primary-600));
  color: white;
}

#order-confirmation-page .btn-primary:hover {
  background: rgb(var(--color-primary-700));
  transform: translateY(-1px);
}

#order-confirmation-page .btn-secondary {
  background: rgb(var(--color-neutral-100));
  color: rgb(var(--color-neutral-700));
  border: 1px solid rgb(var(--color-neutral-300));
}

#order-confirmation-page .btn-secondary:hover {
  background: rgb(var(--color-neutral-200));
}

@media (max-width: 768px) {
  #order-confirmation-page .actions {
    flex-direction: column;
  }

  #order-confirmation-page .btn {
    width: 100%;
  }
}
</style>

<script>
const API_BASE = 'https://dicebastion-memberships.ncalamaro.workers.dev';

function getUrlParams() {
const params = new URLSearchParams(window.location.search);
return {
order: params.get('order'),
email: params.get('email')
};
}

function formatPrice(pence) {
return '£' + (pence / 100).toFixed(2);
}

function formatDate(isoString) {
const date = new Date(isoString);
return date.toLocaleDateString('en-GB', {
year: 'numeric',
month: 'long',
day: 'numeric',
hour: '2-digit',
minute: '2-digit'
});
}

async function checkOrderStatus() {
const { order, email } = getUrlParams();

if (!order) {
showError();
return;
}

try {
// First, try to confirm payment with SumUp
const confirmResponse = await fetch(`${API_BASE}/shop/confirm-payment/${order}`, {
method: 'POST'
});

if (confirmResponse.ok) {
const confirmData = await confirmResponse.json();

if (confirmData.status === 'completed') {
showSuccess(confirmData.order);
clearCart();
return;
}
}

// If not completed, poll for order status
let attempts = 0;
const maxAttempts = 5;

while (attempts < maxAttempts) {
const response = await fetch(`${API_BASE}/orders/${order}?email=${encodeURIComponent(email || '')}`);

if (response.ok) {
const orderData = await response.json();

if (orderData.payment_status === 'paid' || orderData.status === 'completed') {
showSuccess(orderData);
clearCart();
return;
} else if (orderData.payment_status === 'pending' || orderData.status === 'pending') {
if (attempts >= maxAttempts - 1) {
showPending(orderData);
return;
}
}
}

attempts++;
if (attempts < maxAttempts) {
await new Promise(resolve => setTimeout(resolve, 2000));
}
}

// After max attempts, show pending state
showPending({ order_number: order });

} catch (error) {
console.error('Order status check error:', error);
showError();
}
}

function showSuccess(orderData) {
document.getElementById('confirmation-loading').style.display = 'none';
document.getElementById('confirmation-pending').style.display = 'none';
document.getElementById('confirmation-error').style.display = 'none';

document.getElementById('order-number').textContent = orderData.order_number;
document.getElementById('order-date').textContent = formatDate(orderData.created_at);
document.getElementById('order-total').textContent = formatPrice(orderData.total);
document.getElementById('order-email').textContent = orderData.email;

document.getElementById('confirmation-success').style.display = 'block';
}

function showPending(orderData) {
document.getElementById('confirmation-loading').style.display = 'none';
document.getElementById('confirmation-success').style.display = 'none';
document.getElementById('confirmation-error').style.display = 'none';

document.getElementById('pending-order-number').textContent = orderData.order_number;
document.getElementById('confirmation-pending').style.display = 'block';
}

function showError() {
document.getElementById('confirmation-loading').style.display = 'none';
document.getElementById('confirmation-success').style.display = 'none';
document.getElementById('confirmation-pending').style.display = 'none';
document.getElementById('confirmation-error').style.display = 'block';
}

function clearCart() {
localStorage.removeItem('shop_cart');
const event = new CustomEvent('cartUpdated', { detail: { count: 0 } });
window.dispatchEvent(event);
}

window.checkOrderStatus = checkOrderStatus;

document.addEventListener('DOMContentLoaded', function() {
checkOrderStatus();
});
</script>
