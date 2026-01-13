---
title: Thank You
showDate: false
url: "/thank-you"
layout: "simple"
---

<!-- Load utilities and account setup scripts -->
<script src="/js/utils.js"></script>
<script src="/js/modal.js"></script>
<script src="/js/accountSetupShared.js"></script>
<script src="/js/accountSetup.js"></script>

<div id="thank-you-content">
<div id="loading-state">
<h1>Processing Your Payment...</h1>
<div class="spinner"></div>
<p>Please wait while we confirm your transaction.</p>
</div>
</div>

<style>
.spinner {
border: 4px solid rgba(0,0,0,0.1);
border-left-color: #09f;
border-radius: 50%;
width: 40px;
height: 40px;
animation: spin 1s linear infinite;
margin: 20px auto;
}
@keyframes spin {
to { transform: rotate(360deg); }
}
.status-badge {
display: inline-block;
padding: 6px 12px;
border-radius: 4px;
font-weight: 600;
font-size: 14px;
margin: 12px 0;
}
.status-success { background: #d4edda; color: #155724; }
.status-pending { background: #fff3cd; color: #856404; }
.status-failed { background: #f8d7da; color: #721c24; }
.info-box {
background: #f8f9fa;
border-left: 4px solid #09f;
padding: 16px;
margin: 20px 0;
border-radius: 4px;
}
.details-grid {
display: grid;
gap: 12px;
margin: 20px 0;
}
.detail-row {
display: flex;
justify-content: space-between;
padding: 8px 0;
border-bottom: 1px solid #eee;
}
.detail-label {
font-weight: 600;
color: #666;
}
.detail-value {
text-align: right;
}
.action-button {
display: inline-block;
background: #09f;
color: white;
padding: 12px 24px;
border-radius: 4px;
text-decoration: none;
margin: 12px 8px 12px 0;
font-weight: 600;
}
.action-button:hover {
background: #0077cc;
}
.secondary-button {
background: #6c757d;
}
.secondary-button:hover {
background: #5a6268;
}
</style>

<script>
(function() {
const API_BASE = (window.__DB_API_BASE || 'https://dicebastion-memberships.ncalamaro.workers.dev').replace(/\/+$/, '');
const params = new URLSearchParams(location.search);
const orderRef = params.get('orderRef');
const checkoutId = params.get('checkout_id');
const status = params.get('status');

const container = document.getElementById('thank-you-content');

// Helper to format currency
const formatCurrency = (amount, currency) => {
const value = parseFloat(amount) || 0;
return new Intl.NumberFormat('en-GB', { 
style: 'currency', 
currency: currency || 'GBP' 
}).format(value);
};

// Helper to format date
const formatDate = (dateStr) => {
if (!dateStr) return 'N/A';
const date = new Date(dateStr);
return date.toLocaleDateString('en-GB', { 
year: 'numeric', 
month: 'long', 
day: 'numeric' 
});
};

// Check for pending account setup and show prompt
const checkPendingAccountSetup = () => {
  try {
    const pending = sessionStorage.getItem('pendingAccountSetup');
    if (pending) {
      const data = JSON.parse(pending);
      // Clear the pending flag
      sessionStorage.removeItem('pendingAccountSetup');
      // Show the prompt (delay to let success message render)
      if (window.showAccountSetupPrompt) {
        setTimeout(() => {
          window.showAccountSetupPrompt(data.email, data.eventName, true);
        }, 1500);
      }
    }
  } catch (err) {
    console.error('Failed to check pending account setup:', err);
  }
};

// Render success state for membership
const renderMembershipSuccess = (data) => {
const { plan, endDate, amount, currency, autoRenew, cardLast4 } = data;

container.innerHTML = `
<h1>✅ Welcome to Dice Bastion!</h1>
<div class="status-badge status-success">Payment Confirmed</div>

<div class="info-box">
<h3>Your ${plan === 'monthly' ? 'Monthly' : 'Annual'} Membership is Active</h3>
<p>You now have full access to all club facilities and member benefits.</p>
</div>

<div class="details-grid">
<div class="detail-row">
<span class="detail-label">Membership Plan:</span>
<span class="detail-value">${plan === 'monthly' ? 'Monthly' : 'Annual'}</span>
</div>
<div class="detail-row">
<span class="detail-label">Amount Paid:</span>
<span class="detail-value">${formatCurrency(amount, currency)}</span>
</div>
<div class="detail-row">
<span class="detail-label">Valid Until:</span>
<span class="detail-value">${formatDate(endDate)}</span>
</div>
${autoRenew ? `
<div class="detail-row">
<span class="detail-label">Auto-Renewal:</span>
<span class="detail-value">✓ Enabled${cardLast4 ? ` (•••• ${cardLast4})` : ''}</span>
</div>
` : ''}
</div>

<div style="margin-top: 24px;">
<a href="/events" class="action-button">Browse Events</a>
<a href="/memberships" class="action-button secondary-button">Manage Membership</a>
</div>

<p style="margin-top: 24px; color: #666;">
A confirmation email has been sent to your registered email address.
${autoRenew ? 'Your membership will automatically renew before expiration.' : ''}
</p>
`;
};

// Render success state for event ticket
const renderEventSuccess = (data) => {
const { eventName, eventDate, ticketCount, amount, currency, isFree } = data;
const amountNum = parseFloat(amount) || 0;
const isActuallyFree = isFree || amountNum === 0;

container.innerHTML = `
<h1>${isActuallyFree ? '✅ Registration Confirmed!' : '🎟️ Ticket Confirmed!'}</h1>
<div class="status-badge status-success">${isActuallyFree ? 'Registration' : 'Payment'} Confirmed</div>

<div class="info-box">
<h3>${eventName || 'Event Ticket'}</h3>
<p>${isActuallyFree 
  ? 'Your registration has been confirmed. We look forward to seeing you there!' 
  : `Your ticket${ticketCount > 1 ? 's have' : ' has'} been confirmed and reserved.`}
</p>
</div>

<div class="details-grid">
${eventName ? `
<div class="detail-row">
<span class="detail-label">Event:</span>
<span class="detail-value">${eventName}</span>
</div>
` : ''}
${eventDate ? `
<div class="detail-row">
<span class="detail-label">Date:</span>
<span class="detail-value">${formatDate(eventDate)}</span>
</div>
` : ''}
<div class="detail-row">
<span class="detail-label">${isActuallyFree ? 'Registration' : 'Ticket'}${ticketCount > 1 ? 's' : ''}:</span>
<span class="detail-value">${ticketCount || 1}</span>
</div>
${!isActuallyFree ? `
<div class="detail-row">
<span class="detail-label">Amount Paid:</span>
<span class="detail-value">${formatCurrency(amount, currency)}</span>
</div>
` : ''}
</div>

<div style="margin-top: 24px;">
<a href="/events" class="action-button">View All Events</a>
</div>

<p style="margin-top: 24px; color: #666;">
A confirmation email with ${isActuallyFree ? 'event details and a calendar attachment' : 'your ticket and event details'} has been sent to your registered email address.
</p>
`;
};

// Render pending/processing state
const renderPending = (type) => {
container.innerHTML = `
<h1>⏳ Payment Processing</h1>
<div class="status-badge status-pending">Payment Pending</div>

<div class="info-box">
<h3>Your payment is being processed</h3>
<p>Some payment methods take a few moments to confirm. This is normal and usually completes within a few seconds.</p>
<p><strong>You will receive a confirmation email once your payment is approved.</strong></p>
</div>

<p><strong>What happens next?</strong></p>
<ul style="line-height: 1.8;">
<li>Your payment is being verified by the payment provider</li>
<li><strong>You'll receive a confirmation email once approved</strong> (even if you close this page)</li>
<li>You can safely close this tab - we'll email you when ready</li>
${type === 'membership' ? '<li>Your membership will activate automatically upon confirmation</li>' : ''}
${type === 'event' ? '<li>Your ticket will be reserved once payment clears</li>' : ''}
</ul>

<div style="margin-top: 24px;">
<button onclick="location.reload()" class="action-button">Check Status Now</button>
<a href="/" class="action-button secondary-button">Close Tab</a>
</div>

<p style="margin-top: 24px; color: #666; font-size: 14px;">
<strong>Still no email after 10 minutes?</strong> Check your spam folder or contact us at support@dicebastion.com with your order reference.
</p>
`;
};

// Render failed state
const renderFailed = (type, errorMsg) => {
container.innerHTML = `
<h1>❌ Payment Not Completed</h1>
<div class="status-badge status-failed">Payment Failed</div>

<div class="info-box" style="border-left-color: #dc3545;">
<h3>We couldn't process your payment</h3>
<p>${errorMsg || 'Your payment was declined or cancelled. No charges have been made to your account.'}</p>
</div>

<p><strong>Common reasons for payment failure:</strong></p>
<ul style="line-height: 1.8;">
<li>Payment was cancelled before completion</li>
<li>Insufficient funds in account</li>
<li>Card details were incorrect</li>
<li>Bank declined the transaction</li>
</ul>

<div style="margin-top: 24px;">
<a href="/${type === 'event' ? 'events' : 'memberships'}" class="action-button">Try Again</a>
<a href="/" class="action-button secondary-button">Return Home</a>
</div>

<p style="margin-top: 24px; color: #666;">
Need help? Contact us at support@dicebastion.com
</p>
`;
};

// Render no order reference state
const renderNoOrder = () => {
container.innerHTML = `
<h1>Thank You</h1>
<p>We didn't detect a specific order reference. If you just completed a payment, it should be confirmed shortly.</p>

<div class="info-box">
<p><strong>What to do:</strong></p>
<ul style="line-height: 1.8;">
<li>Check your email for a confirmation message</li>
<li>If you purchased a membership, visit the Memberships page to check your status</li>
<li>If you purchased a ticket, visit the Events page for details</li>
</ul>
</div>

<div style="margin-top: 24px;">
<a href="/memberships" class="action-button">Check Membership</a>
<a href="/events" class="action-button secondary-button">View Events</a>
</div>

<p style="margin-top: 24px; color: #666;">
Questions? Email support@dicebastion.com
</p>
`;
};

// Main confirmation logic with retry/polling
const confirmOrder = async () => {
if (!orderRef) {
renderNoOrder();
return;
}

// Detect order type:
// - EVT-{eventId}-{uuid} = paid event ticket
// - REG-{eventId}-{ticketId} = free event registration
// - MEM-... = membership
const isEvent = /^EVT-\d+-[0-9a-f\-]{36}$/i.test(orderRef);
const isRegistration = /^REG-\d+-\d+$/i.test(orderRef);
const type = (isEvent || isRegistration) ? 'event' : 'membership';
const endpoint = (isEvent || isRegistration)
? `/events/confirm?orderRef=${encodeURIComponent(orderRef)}`
: `/membership/confirm?orderRef=${encodeURIComponent(orderRef)}`;

// Immediate status check from URL params (quick feedback)
if (status === 'failed' || status === 'cancelled') {
renderFailed(type);
return;
}

// Poll up to 5 times over 10 seconds for delayed confirmations
const maxAttempts = 5;
const delayMs = 2000;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
try {
console.log(`Confirmation attempt ${attempt}/${maxAttempts}`);
const response = await fetch(API_BASE + endpoint);
const data = await response.json();

console.log('Confirmation response:', data);

// Success states
if (data.ok && (data.status === 'active' || data.status === 'already_active')) {
if (type === 'membership') {
  renderMembershipSuccess({
    plan: data.plan,
    endDate: data.endDate,
    amount: data.amount,
    currency: data.currency,
    autoRenew: data.autoRenew,
    cardLast4: data.cardLast4
  });
  
  // Check for pending account setup (from membership purchase)
  checkPendingAccountSetup();
} else {      renderEventSuccess({
    eventName: data.eventName,
    eventDate: data.eventDate,
    ticketCount: data.ticketCount,
    amount: data.amount,
    currency: data.currency,
    isFree: data.isFree
  });
  
  // Check for pending account setup (from event registration)
  checkPendingAccountSetup();
}
return; // Success - stop polling
}

// Still pending
if (data.status === 'PENDING' || data.payment_status === 'PENDING') {
if (attempt === maxAttempts) {
  // After max attempts, show pending state
  // Webhook will handle confirmation + email independently
  renderPending(type);
  return;
}
// Continue polling
await new Promise(resolve => setTimeout(resolve, delayMs));
continue;
}

// Failed/declined
if (data.status === 'FAILED' || data.payment_status === 'FAILED' || response.status >= 400) {
renderFailed(type, data.error || data.message);
return; // Failed - stop polling
}

// Unknown state - try again
if (attempt < maxAttempts) {
await new Promise(resolve => setTimeout(resolve, delayMs));
} else {
renderPending(type);
}

} catch (error) {
console.error('Confirmation error:', error);
if (attempt < maxAttempts) {
await new Promise(resolve => setTimeout(resolve, delayMs));
} else {
// After all attempts failed, show pending state
// Webhook will handle confirmation + email
renderPending(type);
}
}
}
};

// Start confirmation process
confirmOrder();
})();
</script>
