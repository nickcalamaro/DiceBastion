---
title: "My Account"
layout: "single"
showHero: false
showDate: false
showReadingTime: false
---

<script src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"></script>

<div id="account-page" style="max-width: 900px; margin: 3rem auto; padding: 0 1rem;">
<!-- Loading State -->
<div id="loading-state" style="text-align: center; padding: 4rem 0;">
<div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
<p style="color: rgb(var(--color-neutral-600));">Loading your account...</p>
</div>

<!-- Not Logged In State -->
<div id="not-logged-in-state" style="display: none; text-align: center; padding: 4rem 0;">
<div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
<h2>Please Log In</h2>
<p style="color: rgb(var(--color-neutral-600)); margin-bottom: 2rem;">
You need to be logged in to view your account.
</p>
<a href="/login" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; text-decoration: none; display: inline-block;">
Go to Login
</a>
</div>

<!-- Account Content -->
<div id="account-content" style="display: none;">
<!-- Header -->
<div style="margin-bottom: 2rem;">
<p id="user-email" style="color: rgb(var(--color-neutral-600)); margin: 0;"></p>
</div>

<!-- Membership Status -->
<div id="membership-section" style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
<h2 style="margin-top: 0; margin-bottom: 1.5rem;">Membership Status</h2>
<div id="membership-active" style="display: none;">
<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
    <span style="font-size: 2rem;">✅</span>
    <div>
    <div style="font-size: 1.25rem; font-weight: 600; color: rgb(var(--color-primary-600));" id="membership-plan"></div>
    <div style="color: rgb(var(--color-neutral-600)); font-size: 0.875rem;">Active Member</div>
    </div>
</div>
<div style="background: rgb(var(--color-neutral-50)); dark:bg-neutral-800; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
    <div>
        <div style="font-size: 0.75rem; color: rgb(var(--color-neutral-600)); text-transform: uppercase; margin-bottom: 0.25rem;">Valid Until</div>
        <div style="font-weight: 600;" id="membership-end-date"></div>
    </div>
    <div>
        <div style="font-size: 0.75rem; color: rgb(var(--color-neutral-600)); text-transform: uppercase; margin-bottom: 0.25rem;">Auto-Renewal</div>
        <div style="font-weight: 600;" id="membership-auto-renew"></div>
    </div>
    </div>
</div>

<!-- Auto-Renewal Management -->
<div id="auto-renewal-controls" style="margin-top: 1.5rem; padding: 1rem; border-radius: 8px; border: 1px solid rgb(var(--color-neutral-200));">
    <!-- Enable Auto-Renewal (shown when disabled) -->    <div id="enable-auto-renewal-section" style="display: none;">
    <div style="display: flex; align-items: start; gap: 1rem;">
        <div style="font-size: 1.5rem;">🔄</div>
        <div style="flex: 1;">        <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600;">Enable Auto-Renewal</h3>
        <p style="margin: 0 0 1rem 0; font-size: 0.875rem; color: rgb(var(--color-neutral-600));">
            Set up automatic renewal to ensure uninterrupted access. <strong>You'll be asked to save your payment details.</strong> Your card will not be charged until <span id="renewal-date-enable"></span>. You can cancel anytime before then.
        </p>        <button id="enable-auto-renewal-btn" style="padding: 0.5rem 1rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.875rem;">
            Enable Auto-Renewal
        </button>
        <!-- SumUp Payment Widget Container -->
        <div id="sumup-payment-container" style="display: none; margin-top: 1.5rem;">
            <h4 style="margin: 0 0 1rem 0; font-size: 0.875rem; font-weight: 600;">Add Payment Method</h4>
            <div id="sumup-card-widget"></div>
        </div>
        </div>
    </div>
    </div>

<!-- Cancel Auto-Renewal (shown when enabled) -->
<div id="cancel-auto-renewal-section" style="display: none;">
<div style="display: flex; align-items: start; gap: 1rem;">
<div style="font-size: 1.5rem;">✅</div>
<div style="flex: 1;">
<h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600;">Auto-Renewal Active</h3>
<p style="margin: 0 0 1rem 0; font-size: 0.875rem; color: rgb(var(--color-neutral-600));">
    Your membership will automatically renew when it expires. <strong>If you cancel, your membership will remain active until <span id="cancel-expiry-date"></span>.</strong>
</p>
<button id="cancel-auto-renewal-btn" style="padding: 0.5rem 1rem; background: rgb(var(--color-neutral-600)); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.875rem;">
    Cancel Auto-Renewal
</button>
</div>
</div>
</div>

<!-- Status Message -->
<div id="auto-renewal-message" style="display: none; margin-top: 1rem; padding: 0.75rem; border-radius: 6px; font-size: 0.875rem;"></div>
</div>
</div>
</div>
<div id="membership-inactive" style="display: none; text-align: center; padding: 2rem;">
<div style="font-size: 3rem; margin-bottom: 1rem;">🎫</div>
<h3 style="margin-top: 0; margin-bottom: 0.5rem;">No Active Membership</h3>
<p style="color: rgb(var(--color-neutral-600)); margin-bottom: 1.5rem;">
    Join us and get access to exclusive member benefits!
</p>
<a href="/memberships" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; text-decoration: none; display: inline-block;">
    Become a Member
</a>
</div>
</div>

<!-- Email Preferences -->
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
<h2 style="margin-top: 0; margin-bottom: 1.5rem;">Email Preferences</h2>
<div style="display: flex; align-items: start; gap: 1rem; padding: 1rem; background: rgb(var(--color-neutral-50)); dark:bg-neutral-800; border-radius: 8px; margin-bottom: 1rem;">
<input type="checkbox" id="essential-emails" checked disabled style="margin-top: 0.25rem;">
<div style="flex: 1;">
    <label for="essential-emails" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Essential Emails</label>
    <p style="margin: 0; font-size: 0.875rem; color: rgb(var(--color-neutral-600));">
    Order confirmations, event tickets, and account updates (required)
    </p>
</div>
</div>
<div style="display: flex; align-items: start; gap: 1rem; padding: 1rem; background: rgb(var(--color-neutral-50)); dark:bg-neutral-800; border-radius: 8px;">
<input type="checkbox" id="marketing-emails" style="margin-top: 0.25rem;">
<div style="flex: 1;">
    <label for="marketing-emails" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Marketing Emails</label>
    <p style="margin: 0; font-size: 0.875rem; color: rgb(var(--color-neutral-600));">
    News, special offers, and upcoming events
    </p>
</div>
</div>
<div id="email-prefs-message" style="display: none; margin-top: 1rem; padding: 0.75rem; border-radius: 6px; font-size: 0.875rem;"></div>
</div>

<!-- Event Tickets -->
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
<h2 style="margin-top: 0; margin-bottom: 1.5rem;">My Event Tickets</h2>
<div id="tickets-list"></div>
</div>

<!-- Shop Orders -->
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
<h2 style="margin-top: 0; margin-bottom: 1.5rem;">Shop Orders</h2>
<div id="orders-list"></div>
</div>
</div>
</div>

<script>
(function() {
const API_BASE = window.__DB_API_BASE || 'https://dicebastion-memberships.ncalamaro.workers.dev';

const loadingState = document.getElementById('loading-state');
const notLoggedInState = document.getElementById('not-logged-in-state');
const accountContent = document.getElementById('account-content');

async function loadAccountData() {
const sessionToken = localStorage.getItem('admin_session');

if (!sessionToken) {
loadingState.style.display = 'none';
notLoggedInState.style.display = 'block';
return;
}
try {
console.log('Fetching account info...');
const response = await fetch(`${API_BASE}/account/info`, {
headers: {
    'X-Session-Token': sessionToken
}
});

console.log('Response status:', response.status);

if (!response.ok) {
if (response.status === 401) {
    // Session expired
    console.log('Session expired, logging out');
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    loadingState.style.display = 'none';
    notLoggedInState.style.display = 'block';
    return;
}
const errorData = await response.json().catch(() => ({}));
console.error('API error:', errorData);
throw new Error('Failed to load account data');
}

const data = await response.json();
console.log('Account data received:', data);

if (data.success) {
renderAccountData(data);
loadingState.style.display = 'none';
accountContent.style.display = 'block';
} else {
throw new Error(data.error || 'Unknown error');
}
} catch (error) {
console.error('Error loading account:', error);
loadingState.innerHTML = `
<div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
<p style="color: rgb(var(--color-neutral-600));">Failed to load account data. Please try again.</p>
<button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
    Retry
</button>
`;
}
}
function renderAccountData(data) {
console.log('Rendering account data:', data);

// User email
const userEmailEl = document.getElementById('user-email');
if (userEmailEl) {
userEmailEl.textContent = data.user.email;
}

// Membership status
const membershipActiveEl = document.getElementById('membership-active');
const membershipInactiveEl = document.getElementById('membership-inactive');

if (data.membership && membershipActiveEl && membershipInactiveEl) {
membershipActiveEl.style.display = 'block';
membershipInactiveEl.style.display = 'none';

const planNames = {
monthly: 'Monthly Membership',
quarterly: 'Quarterly Membership',
annual: 'Annual Membership'
};

const membershipPlanEl = document.getElementById('membership-plan');
if (membershipPlanEl) {
membershipPlanEl.textContent = planNames[data.membership.plan] || data.membership.plan;
}

const endDate = new Date(data.membership.end_date);
const membershipEndDateEl = document.getElementById('membership-end-date');
if (membershipEndDateEl) {
membershipEndDateEl.textContent = endDate.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});
}

const membershipAutoRenewEl = document.getElementById('membership-auto-renew');
if (membershipAutoRenewEl) {
membershipAutoRenewEl.textContent = data.membership.auto_renew ? 'Enabled' : 'Disabled';
}

// Show/hide auto-renewal controls based on current state
const autoRenewalControls = document.getElementById('auto-renewal-controls');
const enableSection = document.getElementById('enable-auto-renewal-section');
const cancelSection = document.getElementById('cancel-auto-renewal-section');
const cancelExpiryDate = document.getElementById('cancel-expiry-date');

if (autoRenewalControls) {
autoRenewalControls.style.display = 'block';
}

if (data.membership.auto_renew) {
// Auto-renewal is enabled - show cancel option
if (enableSection) enableSection.style.display = 'none';
if (cancelSection) {
    cancelSection.style.display = 'block';
    if (cancelExpiryDate) {
    cancelExpiryDate.textContent = endDate.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    }
}
} else {
// Auto-renewal is disabled - show enable option
if (cancelSection) cancelSection.style.display = 'none';
if (enableSection) {
    enableSection.style.display = 'block';
    // Set the renewal date in the enable section
    const renewalDateEnable = document.getElementById('renewal-date-enable');
    if (renewalDateEnable) {
    renewalDateEnable.textContent = endDate.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    }
}
}
} else if (membershipActiveEl && membershipInactiveEl) {
membershipActiveEl.style.display = 'none';
membershipInactiveEl.style.display = 'block';

// Hide auto-renewal controls if no active membership
const autoRenewalControls = document.getElementById('auto-renewal-controls');
if (autoRenewalControls) {
autoRenewalControls.style.display = 'none';
}
}

// Email preferences
const marketingCheckbox = document.getElementById('marketing-emails');
if (marketingCheckbox && data.email_preferences) {
marketingCheckbox.checked = data.email_preferences.marketing_emails === 1;
// Set up email preference listener after the checkbox is populated
setupEmailPreferenceListener();
}

// Set up auto-renewal listeners
setupAutoRenewalListeners();

// Tickets
renderTickets(data.tickets);

// Orders
renderOrders(data.orders);
}
function renderTickets(tickets) {
const ticketsList = document.getElementById('tickets-list');

if (!ticketsList) {
console.error('tickets-list element not found');
return;
}

if (!tickets || tickets.length === 0) {
ticketsList.innerHTML = `
<p style="text-align: center; color: rgb(var(--color-neutral-600)); padding: 2rem 0;">
    No event tickets yet. <a href="/events" style="color: rgb(var(--color-primary-600)); font-weight: 600;">Browse upcoming events</a>
</p>
`;
return;
}

ticketsList.innerHTML = tickets.map(ticket => {
const eventDate = new Date(ticket.event_datetime);
const isPast = eventDate < new Date();

return `
<div style="border-bottom: 1px solid rgb(var(--color-neutral-200)); padding: 1rem 0; last:border-0;">
    <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
    <div style="flex: 1;">
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.125rem;">
        <a href="/events/${ticket.slug}" style="color: rgb(var(--color-primary-600)); text-decoration: none;">${ticket.event_name}</a>
        </h3>
        <div style="color: rgb(var(--color-neutral-600)); font-size: 0.875rem;">
        📅 ${eventDate.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} 
        at ${eventDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
        ${ticket.location ? `<div style="color: rgb(var(--color-neutral-600)); font-size: 0.875rem;">📍 ${ticket.location}</div>` : ''}
    </div>
    <div style="text-align: right;">
        <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; ${isPast ? 'background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-700));' : 'background: rgb(var(--color-primary-100)); color: rgb(var(--color-primary-700));'}">
        ${isPast ? 'Past Event' : 'Upcoming'}
        </span>
        ${ticket.payment_status ? `<div style="font-size: 0.75rem; color: rgb(var(--color-neutral-500)); margin-top: 0.25rem;">${ticket.payment_status}</div>` : ''}
    </div>
    </div>
</div>
`;
}).join('');
}
function renderOrders(orders) {
const ordersList = document.getElementById('orders-list');

if (!ordersList) {
console.error('orders-list element not found');
return;
}

if (!orders || orders.length === 0) {
ordersList.innerHTML = `
<p style="text-align: center; color: rgb(var(--color-neutral-600)); padding: 2rem 0;">
    No shop orders yet. <a href="/shop" style="color: rgb(var(--color-primary-600)); font-weight: 600;">Visit the shop</a>
</p>
`;
return;
}

ordersList.innerHTML = orders.map(order => {
const orderDate = new Date(order.created_at);
const total = (order.total / 100).toFixed(2);

const statusColors = {
pending: 'background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-700));',
processing: 'background: #fef3c7; color: #92400e;',
shipped: 'background: #dbeafe; color: #1e40af;',
delivered: 'background: #d1fae5; color: #065f46;',
cancelled: 'background: #fee2e2; color: #991b1b;'
};

return `
<div style="border-bottom: 1px solid rgb(var(--color-neutral-200)); padding: 1rem 0; last:border-0;">
    <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; flex-wrap: wrap;">
    <div style="flex: 1; min-width: 200px;">
        <div style="font-weight: 600; margin-bottom: 0.25rem;">Order #${order.order_number}</div>
        <div style="color: rgb(var(--color-neutral-600)); font-size: 0.875rem;">
        ${orderDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
    </div>
    <div style="text-align: right;">
        <div style="font-weight: 600; margin-bottom: 0.25rem;">£${total}</div>
        <span style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; ${statusColors[order.status] || statusColors.pending}">
        ${order.status || 'Pending'}
        </span>
    </div>
    </div>
</div>
`;
}).join('');
}
// Load account data on page load
loadAccountData();

// Handle marketing email preference changes (set up after page loads)
function setupEmailPreferenceListener() {
const marketingCheckbox = document.getElementById('marketing-emails');
if (!marketingCheckbox) return;

marketingCheckbox.addEventListener('change', async (e) => {
const sessionToken = localStorage.getItem('admin_session');
const messageEl = document.getElementById('email-prefs-message');

try {
const response = await fetch(`${API_BASE}/account/email-preferences`, {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    'X-Session-Token': sessionToken
    },
    body: JSON.stringify({
    marketing_emails: e.target.checked
    })
});

if (response.ok) {
    messageEl.textContent = 'Email preferences updated successfully!';
    messageEl.style.background = '#d1fae5';
    messageEl.style.color = '#065f46';
    messageEl.style.display = 'block';
    
    setTimeout(() => {
    messageEl.style.display = 'none';
    }, 3000);
} else {
    throw new Error('Failed to update preferences');
}
} catch (error) {
console.error('Error updating preferences:', error);
messageEl.textContent = 'Failed to update preferences. Please try again.';
messageEl.style.background = '#fee2e2';
messageEl.style.color = '#991b1b';
messageEl.style.display = 'block';

// Revert checkbox
e.target.checked = !e.target.checked;
}
});
}

// Handle auto-renewal enable/cancel
function setupAutoRenewalListeners() {
const enableBtn = document.getElementById('enable-auto-renewal-btn');
const cancelBtn = document.getElementById('cancel-auto-renewal-btn');
const messageEl = document.getElementById('auto-renewal-message');

if (enableBtn) {
enableBtn.addEventListener('click', async () => {
const sessionToken = localStorage.getItem('admin_session');
const originalText = enableBtn.textContent;

try {
    // Disable button and show loading state
    enableBtn.disabled = true;
    enableBtn.textContent = 'Processing...';
    
    const response = await fetch(`${API_BASE}/account/enable-auto-renewal`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
    }
    });

    const data = await response.json();

    if (response.ok && data.success) {
    // Auto-renewal enabled successfully (user already had a payment method)
    messageEl.textContent = data.message || 'Auto-renewal enabled successfully!';
    messageEl.style.background = '#d1fae5';
    messageEl.style.color = '#065f46';
    messageEl.style.display = 'block';
    
    // Reload account data to update UI
    setTimeout(() => {
        loadAccountData();
    }, 1500);    } else if (data.requires_payment_setup) {
    // User needs to add a payment method - show SumUp widget
    messageEl.textContent = 'Please add your payment method below...';
    messageEl.style.background = '#dbeafe';
    messageEl.style.color = '#1e40af';
    messageEl.style.display = 'block';
    
    // Show SumUp payment container
    const sumupContainer = document.getElementById('sumup-payment-container');
    if (sumupContainer) {
        sumupContainer.style.display = 'block';
    }
    
    // Hide the enable button
    enableBtn.style.display = 'none';
    
    // Mount SumUp card widget
    try {
        if (typeof SumUpCard === 'undefined') {
        throw new Error('SumUp SDK not loaded');
        }        window.sumUpCardInstance = SumUpCard.mount({
        id: 'sumup-card-widget',
        checkoutId: data.checkout_id,
        onResponse: async (type, body) => {
            console.log('SumUp response:', type, body);
            
            // Handle final states only - keep widget visible for intermediate states
            if (type === 'success') {
            messageEl.textContent = 'Verifying payment method...';
            messageEl.style.background = '#dbeafe';
            messageEl.style.color = '#1e40af';
            
            // Hide the widget
            if (sumupContainer) {
                sumupContainer.style.display = 'none';
            }
            
            // Poll for confirmation
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds
            const pollInterval = setInterval(async () => {
                attempts++;
                
                try {
                const confirmResponse = await fetch(
                    `${API_BASE}/account/confirm-payment-setup?orderRef=${data.order_ref}`,
                    {
                    headers: { 'X-Session-Token': sessionToken }
                    }
                );
                
                const confirmData = await confirmResponse.json();
                
                if (confirmData.success && confirmData.status === 'completed') {
                    clearInterval(pollInterval);
                    
                    messageEl.textContent = 'Auto-renewal enabled successfully!';
                    messageEl.style.background = '#d1fae5';
                    messageEl.style.color = '#065f46';
                    
                    // Reload to show updated state
                    setTimeout(() => {
                    loadAccountData();
                    }, 1500);
                } else if (confirmData.success === false || confirmData.status === 'failed') {
                    clearInterval(pollInterval);
                    messageEl.textContent = confirmData.message || 'Payment verification failed. Please try again.';
                    messageEl.style.background = '#fee2e2';
                    messageEl.style.color = '#991b1b';
                    
                    enableBtn.disabled = false;
                    enableBtn.textContent = originalText;
                    enableBtn.style.display = 'block';
                } else if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    messageEl.textContent = 'Setup timed out. Please refresh and try again.';
                    messageEl.style.background = '#fee2e2';
                    messageEl.style.color = '#991b1b';
                    
                    enableBtn.disabled = false;
                    enableBtn.textContent = originalText;
                    enableBtn.style.display = 'block';
                }
                } catch (e) {
                console.error('Error polling payment setup:', e);
                if (attempts >= maxAttempts) {
                    clearInterval(pollInterval);
                    messageEl.textContent = 'Error verifying payment. Please refresh and try again.';
                    messageEl.style.background = '#fee2e2';
                    messageEl.style.color = '#991b1b';
                    
                    enableBtn.disabled = false;
                    enableBtn.textContent = originalText;
                    enableBtn.style.display = 'block';
                }
                }
            }, 1000);
            } else if (type === 'error' || type === 'fail') {
            // Payment failed - hide widget and show error
            messageEl.textContent = `Payment error: ${body.message || 'Unknown error'}`;
            messageEl.style.background = '#fee2e2';
            messageEl.style.color = '#991b1b';
            
            enableBtn.disabled = false;
            enableBtn.textContent = originalText;
            enableBtn.style.display = 'block';
            
            if (sumupContainer) {
                sumupContainer.style.display = 'none';
            }
            } else if (type === 'cancel') {
            // User cancelled the payment - hide widget and allow retry
            messageEl.textContent = 'Payment cancelled. Please try again when ready.';
            messageEl.style.background = '#fef3c7';
            messageEl.style.color = '#92400e';
            
            enableBtn.disabled = false;
            enableBtn.textContent = originalText;
            enableBtn.style.display = 'block';
            
            if (sumupContainer) {
                sumupContainer.style.display = 'none';
            }
            } else {
            // Intermediate state (e.g., verification check) - keep widget visible
            console.log('SumUp intermediate state:', type, body);
            messageEl.textContent = 'Please complete the verification above...';
            messageEl.style.background = '#dbeafe';
            messageEl.style.color = '#1e40af';
            messageEl.style.display = 'block';
            // Keep widget visible - don't hide sumupContainer
            }
        }
        });
    } catch (sdkError) {
        console.error('SumUp SDK error:', sdkError);
        messageEl.textContent = 'Failed to load payment form. Please refresh and try again.';
        messageEl.style.background = '#fee2e2';
        messageEl.style.color = '#991b1b';
        
        enableBtn.disabled = false;
        enableBtn.textContent = originalText;
    }
    } else {
    throw new Error(data.message || data.error || 'Failed to enable auto-renewal');
    }
} catch (error) {
    console.error('Error enabling auto-renewal:', error);
    messageEl.textContent = 'Failed to enable auto-renewal. Please try again or contact support.';
    messageEl.style.background = '#fee2e2';
    messageEl.style.color = '#991b1b';
    messageEl.style.display = 'block';
    
    // Re-enable button
    enableBtn.disabled = false;
    enableBtn.textContent = originalText;
}
});
}

if (cancelBtn) {
cancelBtn.addEventListener('click', async () => {
// Confirm cancellation
if (!confirm('Are you sure you want to cancel auto-renewal? Your membership will remain active until it expires, but will not renew automatically.')) {
    return;
}

const sessionToken = localStorage.getItem('admin_session');
const originalText = cancelBtn.textContent;

try {
    // Disable button and show loading state
    cancelBtn.disabled = true;
    cancelBtn.textContent = 'Processing...';
    
    const response = await fetch(`${API_BASE}/account/cancel-auto-renewal`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
    }
    });

    const data = await response.json();

    if (response.ok && data.success) {
    messageEl.textContent = data.message || 'Auto-renewal cancelled successfully.';
    messageEl.style.background = '#d1fae5';
    messageEl.style.color = '#065f46';
    messageEl.style.display = 'block';
    
    // Reload account data to update UI
    setTimeout(() => {
        loadAccountData();
    }, 1500);
    } else {
    throw new Error(data.error || 'Failed to cancel auto-renewal');
    }
} catch (error) {
    console.error('Error cancelling auto-renewal:', error);
    messageEl.textContent = 'Failed to cancel auto-renewal. Please try again or contact support.';
    messageEl.style.background = '#fee2e2';
    messageEl.style.color = '#991b1b';
    messageEl.style.display = 'block';
      // Re-enable button
    cancelBtn.disabled = false;
    cancelBtn.textContent = originalText;
}
});
}
}
})();
</script>
