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
<div id="loading-state" class="card" style="max-width:640px; margin:0 auto; text-align:center;">
<h2 class="card-header">Processing Your Payment...</h2>
<div class="spinner"></div>
<p class="ty-note" style="margin-top:0;">Please wait while we confirm your transaction.</p>
</div>
</div>

<style>
.spinner {
  border: 4px solid rgba(128,128,128,0.2);
  border-left-color: rgb(var(--color-primary-500));
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.ty-badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  margin: 0.75rem 0;
}
.ty-details {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 1.25rem 0;
}
.ty-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  border-bottom: 1px solid rgb(var(--color-neutral-200));
}
.dark .ty-row {
  border-bottom-color: rgb(var(--color-neutral-700));
}
.ty-row:last-child {
  border-bottom: none;
}
.ty-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}
.ty-note {
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: rgb(var(--color-neutral-600));
}
.dark .ty-note {
  color: rgb(var(--color-neutral-400));
}
.ty-list {
  line-height: 1.8;
  padding-left: 1.25rem;
  color: rgb(var(--color-neutral-700));
}
.dark .ty-list {
  color: rgb(var(--color-neutral-300));
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
          // For memberships, use a generic message instead of event name
          const displayName = data.isMembership ? 'your membership' : data.eventName;
          window.showAccountSetupPrompt(data.email, displayName, true);
        }, 1500);
      }
    }
  } catch (err) {
    console.error('Failed to check pending account setup:', err);
  }
};

// Render success state for membership
const renderMembershipSuccess = (data) => {
const { plan, endDate, amount, currency, autoRenew, cardLast4, emailSent } = data;

// Check if we have emailPending flag in URL
const urlParams = new URLSearchParams(window.location.search);
const emailPending = urlParams.get('emailPending') === '1' || emailSent === false;

container.innerHTML = `
<div class="card" style="max-width:640px; margin:0 auto;">
<h2 class="card-header" style="text-align:center;">✅ Welcome to Dice Bastion!</h2>
<div style="text-align:center;"><span class="ty-badge alert-success">Payment Confirmed</span></div>

<div class="alert alert-info" style="margin:1.25rem 0;">
<strong>Your ${plan === 'monthly' ? 'Monthly' : 'Annual'} Membership is Active</strong><br>
You now have full access to all club facilities and member benefits.
</div>

<div class="card-section">
<div class="ty-details">
<div class="ty-row">
<span class="card-label" style="margin:0;">Membership Plan</span>
<span class="card-value">${plan === 'monthly' ? 'Monthly' : 'Annual'}</span>
</div>
<div class="ty-row">
<span class="card-label" style="margin:0;">Amount Paid</span>
<span class="card-value">${formatCurrency(amount, currency)}</span>
</div>
<div class="ty-row">
<span class="card-label" style="margin:0;">Valid Until</span>
<span class="card-value">${formatDate(endDate)}</span>
</div>
${autoRenew ? `
<div class="ty-row">
<span class="card-label" style="margin:0;">Auto-Renewal</span>
<span class="card-value">✓ Enabled${cardLast4 ? ` (•••• ${cardLast4})` : ''}</span>
</div>
` : ''}
</div>
</div>

<div class="ty-actions">
<a href="/events" class="btn btn-primary">Browse Events</a>
<a href="/memberships" class="btn btn-secondary">Manage Membership</a>
</div>

<p class="ty-note">
${emailPending 
  ? '<strong class="alert-warning" style="padding:0.35rem 0.6rem; border-radius:4px; display:inline-block;">⚠️ Your confirmation email is being processed and will arrive shortly.</strong><br>' 
  : 'A confirmation email has been sent to your registered email address.'}
${autoRenew ? ' Your membership will automatically renew before expiration.' : ''}
</p>
</div>
`;
};

// Render success state for event ticket
const renderEventSuccess = (data) => {
const { eventName, eventDate, ticketCount, amount, currency, isFree } = data;
const amountNum = parseFloat(amount) || 0;
const isActuallyFree = isFree || amountNum === 0;

container.innerHTML = `
<div class="card" style="max-width:640px; margin:0 auto;">
<h2 class="card-header" style="text-align:center;">${isActuallyFree ? '✅ Registration Confirmed!' : '🎟️ Ticket Confirmed!'}</h2>
<div style="text-align:center;"><span class="ty-badge alert-success">${isActuallyFree ? 'Registration' : 'Payment'} Confirmed</span></div>

<div class="alert alert-info" style="margin:1.25rem 0;">
<strong>${eventName || 'Event Ticket'}</strong><br>
${isActuallyFree 
  ? 'Your registration has been confirmed. We look forward to seeing you there!' 
  : `Your ticket${ticketCount > 1 ? 's have' : ' has'} been confirmed and reserved.`}
</div>

<div class="card-section">
<div class="ty-details">
${eventName ? `
<div class="ty-row">
<span class="card-label" style="margin:0;">Event</span>
<span class="card-value">${eventName}</span>
</div>
` : ''}
${eventDate ? `
<div class="ty-row">
<span class="card-label" style="margin:0;">Date</span>
<span class="card-value">${formatDate(eventDate)}</span>
</div>
` : ''}
<div class="ty-row">
<span class="card-label" style="margin:0;">${isActuallyFree ? 'Registration' : 'Ticket'}${ticketCount > 1 ? 's' : ''}</span>
<span class="card-value">${ticketCount || 1}</span>
</div>
${!isActuallyFree ? `
<div class="ty-row">
<span class="card-label" style="margin:0;">Amount Paid</span>
<span class="card-value">${formatCurrency(amount, currency)}</span>
</div>
` : ''}
</div>
</div>

<div class="ty-actions">
<a href="/events" class="btn btn-primary">View All Events</a>
</div>

<p class="ty-note">
A confirmation email with ${isActuallyFree ? 'event details and a calendar attachment' : 'your ticket and event details'} has been sent to your registered email address.
</p>
</div>
`;
};

// Render pending/processing state
const renderPending = (type) => {
container.innerHTML = `
<div class="card" style="max-width:640px; margin:0 auto;">
<h2 class="card-header" style="text-align:center;">⏳ Payment Processing</h2>
<div style="text-align:center;"><span class="ty-badge alert-warning">Payment Pending</span></div>

<div class="alert alert-info" style="margin:1.25rem 0;">
<strong>Your payment is being processed</strong><br>
Some payment methods take a few moments to confirm. This is normal and usually completes within a few seconds.
<br><strong>You will receive a confirmation email once your payment is approved.</strong>
</div>

<p class="card-label" style="font-size:0.9rem; text-transform:none; letter-spacing:0;"><strong>What happens next?</strong></p>
<ul class="ty-list">
<li>Your payment is being verified by the payment provider</li>
<li><strong>You'll receive a confirmation email once approved</strong> (even if you close this page)</li>
<li>You can safely close this tab — we'll email you when ready</li>
${type === 'membership' ? '<li>Your membership will activate automatically upon confirmation</li>' : ''}
${type === 'event' ? '<li>Your ticket will be reserved once payment clears</li>' : ''}
</ul>

<div class="ty-actions">
<button onclick="location.reload()" class="btn btn-primary">Check Status Now</button>
<a href="/" class="btn btn-secondary">Close Tab</a>
</div>

<p class="ty-note" style="font-size:0.85rem;">
<strong>Still no email after 10 minutes?</strong> Check your spam folder or contact us at support@dicebastion.com with your order reference.
</p>
</div>
`;
};

// Render failed state
const renderFailed = (type, errorMsg) => {
container.innerHTML = `
<div class="card" style="max-width:640px; margin:0 auto;">
<h2 class="card-header" style="text-align:center;">❌ Payment Not Completed</h2>
<div style="text-align:center;"><span class="ty-badge alert-error">Payment Failed</span></div>

<div class="alert alert-error" style="margin:1.25rem 0;">
<strong>We couldn't process your payment</strong><br>
${errorMsg || 'Your payment was declined or cancelled. No charges have been made to your account.'}
</div>

<p class="card-label" style="font-size:0.9rem; text-transform:none; letter-spacing:0;"><strong>Common reasons for payment failure:</strong></p>
<ul class="ty-list">
<li>Payment was cancelled before completion</li>
<li>Insufficient funds in account</li>
<li>Card details were incorrect</li>
<li>Bank declined the transaction</li>
</ul>

<div class="ty-actions">
<a href="/${type === 'event' ? 'events' : 'memberships'}" class="btn btn-primary">Try Again</a>
<a href="/" class="btn btn-secondary">Return Home</a>
</div>

<p class="ty-note">
Need help? Contact us at support@dicebastion.com
</p>
</div>
`;
};

// Render no order reference state
const renderNoOrder = () => {
container.innerHTML = `
<div class="card" style="max-width:640px; margin:0 auto;">
<h2 class="card-header" style="text-align:center;">Thank You</h2>
<p class="ty-note" style="margin-top:0;">We didn't detect a specific order reference. If you just completed a payment, it should be confirmed shortly.</p>

<div class="alert alert-info" style="margin:1.25rem 0;">
<strong>What to do:</strong>
<ul class="ty-list" style="margin:0.5rem 0 0;">
<li>Check your email for a confirmation message</li>
<li>If you purchased a membership, visit the Memberships page to check your status</li>
<li>If you purchased a ticket, visit the Events page for details</li>
</ul>
</div>

<div class="ty-actions">
<a href="/memberships" class="btn btn-primary">Check Membership</a>
<a href="/events" class="btn btn-secondary">View Events</a>
</div>

<p class="ty-note">
Questions? Email support@dicebastion.com
</p>
</div>
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
  // - BUNDLE-{eventId}-{uuid} = membership + event bundle
  // - BOOK-{timestamp}-{uuid} = table booking
  // - MEM-... = membership
  const isEvent = /^EVT-\d+-[0-9a-f\-]{36}$/i.test(orderRef);
  const isRegistration = /^REG-\d+-\d+$/i.test(orderRef);
  const isBundle = /^BUNDLE-\d+-[0-9a-f\-]{36}$/i.test(orderRef);
  const isBooking = /^BOOK-\d+-[a-z0-9]+$/i.test(orderRef);
  
  // Bookings are already confirmed by the bookings API, just show success
  if (isBooking) {
    container.innerHTML = `
<div class="card" style="max-width:640px; margin:0 auto;">
<h2 class="card-header" style="text-align:center;">🎲 Table Booking Confirmed!</h2>
<div style="text-align:center;"><span class="ty-badge alert-success">Booking Confirmed</span></div>

<div class="alert alert-info" style="margin:1.25rem 0;">
<strong>Your Table is Reserved</strong><br>
Your table booking has been confirmed. A confirmation email with all the details has been sent to your registered email address.
</div>

<div class="card-section">
<div class="ty-details">
<div class="ty-row">
<span class="card-label" style="margin:0;">Booking Reference</span>
<span class="card-value">${orderRef}</span>
</div>
</div>
</div>

<div class="ty-actions">
<a href="/bookings" class="btn btn-primary">View My Bookings</a>
<a href="/account" class="btn btn-secondary">My Account</a>
</div>

<p class="ty-note">
Please check your email for booking details and any additional information.
</p>
</div>
`;
    return;
  }
  
  const type = (isEvent || isRegistration || isBundle) ? 'event' : 'membership';
  const endpoint = (isEvent || isRegistration || isBundle)
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
    
    if (!response.ok) {
      console.error('Confirmation request failed:', response.status, response.statusText);
      if (response.status >= 400) {
        const data = await response.json().catch(() => ({}));
        renderFailed(type, data.error || data.message || 'Order not found');
        return;
      }
    }
    
    const data = await response.json();
    console.log('Confirmation response:', data);
    console.log('Response checks:', {
      hasOk: !!data.ok,
      status: data.status,
      isActive: data.status === 'active',
      isAlreadyActive: data.status === 'already_active',
      isBundle: data.isBundle,
      conditionMet: data.ok && (data.status === 'active' || data.status === 'already_active')
    });

    // Success states
    if (data.ok && (data.status === 'active' || data.status === 'already_active')) {
      // Handle bundle purchases (membership + event)
      if (data.isBundle) {
        // Format membership plan name
        const planName = data.membershipPlan 
          ? data.membershipPlan.charAt(0).toUpperCase() + data.membershipPlan.slice(1) + ' Membership'
          : 'Membership';
        
        container.innerHTML = `
<div class="card" style="max-width:640px; margin:0 auto;">
<h2 class="card-header" style="text-align:center;">🎉 Bundle Purchase Complete!</h2>
<div style="text-align:center;"><span class="ty-badge alert-success">Payment Confirmed</span></div>

<div class="alert alert-info" style="margin:1.25rem 0;">
<strong>${planName} + ${data.eventName || 'Event Ticket'}</strong><br>
Your membership and event ticket have both been confirmed. Welcome to Dice Bastion!
</div>

<div class="card-section">
<div class="ty-details">
<div class="ty-row">
<span class="card-label" style="margin:0;">Membership Plan</span>
<span class="card-value">${data.membershipPlan || 'Standard'}</span>
</div>
<div class="ty-row">
<span class="card-label" style="margin:0;">Valid Until</span>
<span class="card-value">${formatDate(data.membershipEndDate)}</span>
</div>
<div class="ty-row">
<span class="card-label" style="margin:0;">Event</span>
<span class="card-value">${data.eventName || 'Event'}</span>
</div>
${data.eventDate ? `
<div class="ty-row">
<span class="card-label" style="margin:0;">Event Date</span>
<span class="card-value">${formatDate(data.eventDate)}</span>
</div>
` : ''}
<div class="ty-row">
<span class="card-label" style="margin:0;">Total Paid</span>
<span class="card-value">${formatCurrency(data.amount, data.currency)}</span>
</div>
</div>
</div>

<div class="ty-actions">
<a href="/events" class="btn btn-primary">Browse Events</a>
<a href="/account" class="btn btn-secondary">View Account</a>
</div>

<p class="ty-note">
Confirmation emails for your membership and event ticket have been sent to your registered email address.
</p>
</div>
`;
        // Check for pending account setup
        checkPendingAccountSetup();
        return; // Success - stop polling
      }
      
      // Regular membership or event
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
      } else {
        renderEventSuccess({
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
