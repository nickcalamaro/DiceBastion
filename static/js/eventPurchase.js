// Event Purchase Flow
// Depends on: utils.js (loaded globally via footer)
const API_BASE = utils.getApiBase();
const TURNSTILE_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k';

// Detect if we're running on localhost
const IS_LOCALHOST = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '0.0.0.0';

// Make functions globally accessible
window.renderEventPurchase = function renderEventPurchase(event) {
  const eventId = event.id || event.event_id;
  
  // Determine if event is free
  // Free if: requires_purchase is 0/false OR both prices are 0
  const requiresPurchase = event.requires_purchase === 1 || event.requires_purchase === true;
  const memberPrice = parseFloat(event.membership_price || 0);
  const nonMemberPrice = parseFloat(event.non_membership_price || 0);
  const isFree = !requiresPurchase || (memberPrice === 0 && nonMemberPrice === 0);  if (isFree) {
    // Free event registration - simplified UI
    return `
      <div class="event-purchase my-6" data-event-id="${eventId}" style="margin-top: 2rem;">
        <div class="event-ticket-box border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 bg-neutral dark:bg-neutral-800 shadow-lg max-w-xl">
          <h3 class="mt-0 mb-2 text-xl font-bold text-primary-700 dark:text-primary-400">Register Now</h3>
          <div class="mb-3">
            <div class="text-3xl font-extrabold text-primary-600 dark:text-primary-400">FREE</div>
            <p class="mt-2 mb-0 text-sm text-neutral-700 dark:text-neutral-300">This is a free event. You can get access to free drinks, local discounts, and help us keep these events going by becoming a <a href="/memberships/" class="text-primary-600 dark:text-primary-400 underline font-semibold hover:text-primary-700 dark:hover:text-primary-500">member</a>.</p>
          </div>
          <button type="button" class="evt-register-btn w-full py-3 px-6 border-0 rounded-lg bg-primary-600 dark:bg-primary-500 text-neutral-50 text-base font-bold cursor-pointer shadow-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">Sign Up</button>
        </div>
      </div>
      ${generateModal(eventId, true)}
    `;
  }
  
  // Paid event
  const formatPrice = (price) => {
    const numPrice = parseFloat(price || 0);
    return numPrice === 0 ? 'FREE' : `£${numPrice.toFixed(2)}`;
  };
  
  return `
    <div class="event-purchase my-6" data-event-id="${eventId}" style="margin-top: 2rem;">
      <div class="event-ticket-box border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 bg-neutral dark:bg-neutral-800 shadow-lg max-w-xl">
        <h3 class="mt-0 mb-2 text-xl font-bold text-primary-700 dark:text-primary-400">Get a Ticket</h3>
        <div class="event-prices flex gap-5 flex-wrap items-end mb-3">
          <div class="flex-1 min-w-[140px]">
            <div class="text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 tracking-wide">Member Price</div>
            <div class="text-2xl font-extrabold text-neutral-800 dark:text-neutral-200">${formatPrice(event.membership_price)}</div>
          </div>
          <div class="flex-1 min-w-[160px]">
            <div class="text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 tracking-wide">Non‑Member Price</div>
            <div class="text-2xl font-extrabold text-neutral-800 dark:text-neutral-200">${formatPrice(event.non_membership_price)}</div>
          </div>
        </div>
        <p class="mt-0 mb-4 text-sm text-neutral-700 dark:text-neutral-300">Member discount is applied automatically if an active membership is found for your email.</p>
        <button type="button" class="evt-buy-btn w-full py-3 px-6 border-0 rounded-lg bg-primary-600 dark:bg-primary-500 text-neutral-50 text-base font-bold cursor-pointer shadow-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors" data-member-price="${event.membership_price}" data-nonmember-price="${event.non_membership_price}">Get Your Ticket</button>
      </div>
      <div class="event-membership-promo mt-3 max-w-xl text-sm text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 py-3 px-4 rounded-lg">
        <strong>Not a member yet?</strong> <span>Check out the list of benefits and sign up today!</span>
        <br>
        <a href="/memberships/" class="inline-block mt-2 py-1.5 px-4 font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-800/50 border border-primary-300 dark:border-primary-600 rounded-md hover:bg-primary-100 dark:hover:bg-primary-700/60 transition-colors">Become a member!</a>
      </div>
    </div>    
    ${generateModal(eventId, false)}
  `;
}

// Generate modal HTML (shared between free and paid events)
function generateModal(eventId, isFree) {
  return `
    <div class="evt-modal" id="evt-modal-${eventId}" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:99999; align-items:center; justify-content:center;">
      <div class="evt-modal-inner bg-neutral dark:bg-neutral-800 rounded-xl p-5 relative shadow-2xl" style="width:min(520px,95vw);">
        <button type="button" class="evt-close bg-transparent border-none text-2xl cursor-pointer text-neutral-700 dark:text-neutral-300" aria-label="Close" style="position:absolute; top:10px; right:10px;">×</button>
        <h3 class="mt-0 mb-3 text-lg font-bold text-neutral-800 dark:text-neutral-200 evt-modal-title">${isFree ? 'Event Registration' : 'Ticket Checkout'}</h3>
        
        <!-- Logged-in user confirmation screen -->
        <div class="evt-step evt-confirm-logged-in" style="display:none;">
          <p class="mt-0 mb-4 text-sm text-neutral-700 dark:text-neutral-300">
            <span class="evt-logged-message">${isFree ? 'Registering as' : 'Purchasing a ticket for'}</span> <strong class="text-neutral-800 dark:text-neutral-200 evt-user-email"></strong>
          </p>
          <div class="mt-3">
            <div class="text-sm text-neutral-700 dark:text-neutral-300 mb-2">Security check</div>
            <div id="evt-ts-logged-${eventId}"></div>
          </div>
          <button type="button" class="evt-continue-logged mt-4 w-full py-3 border-none rounded-lg bg-primary-600 dark:bg-primary-500 text-neutral-50 font-bold cursor-pointer hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">${isFree ? 'Complete Registration' : 'Continue to Payment'}</button>
          <p class="mt-3 mb-0 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Not you? <button type="button" class="evt-switch-account bg-transparent border-none text-primary-600 dark:text-primary-400 underline cursor-pointer hover:text-primary-700 dark:hover:text-primary-500">Use a different email</button>
          </p>
        </div>
        
        <!-- Guest/non-logged-in user form -->
        <div class="evt-step evt-details" style="display:block;">
          <label class="block mt-2 mb-1 font-semibold text-neutral-700 dark:text-neutral-300">Full name *</label>
          <input type="text" class="evt-name w-full p-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200" placeholder="Jane Doe" required>
          <label class="block mt-3 mb-1 font-semibold text-neutral-700 dark:text-neutral-300">Email *</label>
          <input type="email" class="evt-email w-full p-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200" placeholder="you@example.com" required>
          ${!isFree ? `
          <div class="mt-3 flex gap-2 items-start text-sm leading-tight">
            <input type="checkbox" class="evt-privacy mt-1" required>
            <label class="text-neutral-700 dark:text-neutral-300">I agree to the <a href="/privacy-policy/" target="_blank" rel="noopener" class="text-primary-600 dark:text-primary-400 underline">Privacy Policy</a>.</label>
          </div>
          ` : ''}
          <div class="mt-3">
            <div class="text-sm text-neutral-700 dark:text-neutral-300 mb-2">Security check</div>
            <div id="evt-ts-${eventId}"></div>
          </div>
          <button type="button" class="evt-continue mt-4 w-full py-3 border-none rounded-lg bg-primary-600 dark:bg-primary-500 text-neutral-50 font-bold cursor-pointer hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">${isFree ? 'Complete Registration' : 'Continue to Payment'}</button>
          <p class="mt-3 mb-0 text-center text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account? <a href="/login" class="text-primary-600 dark:text-primary-400 underline">Sign in</a>
          </p>
        </div>
        
        ${!isFree ? `<div id="evt-card-${eventId}" class="evt-card mt-2" style="display:none;"></div>` : ''}
        <div class="evt-error mt-2.5 text-sm font-semibold" style="display:none; color:#b00020;"></div>
        <div class="evt-success mt-4 py-3 px-4 rounded-lg font-semibold" style="display:none; background:#e9fbe9; border:1px solid #b9e8b9; color:#1a5d1a;">${isFree ? 'Registration confirmed! See you there.' : 'Ticket confirmed! See you there.'}</div>
      </div>
    </div>
  `;
}

window.initEventPurchase = function initEventPurchase(event) {
  const eventId = String(event.id);
  const root = document.querySelector('.event-purchase[data-event-id="'+eventId+'"]');
  const modal = document.getElementById('evt-modal-'+eventId);
  const cardEl = document.getElementById('evt-card-'+eventId);
  let turnstileWidgetId = null; // Store the Turnstile widget ID
  let turnstileLoggedWidgetId = null; // Store the Turnstile widget ID for logged-in flow
  let turnstileRenderTimeout = null; // Store timeout ID to cancel if needed
  let userApplicablePrice = null; // User's price based on membership status
  let hasActiveMembership = false; // Whether user has active membership
  
  if (!root || !modal) return;
  
  // Check membership status and update button text if needed
  async function checkMembershipAndUpdateButton() {
    const user = getLoggedInUser();
    const buyBtn = root.querySelector('.evt-buy-btn');
    if (!buyBtn) return;
    
    const memberPrice = parseFloat(buyBtn.dataset.memberPrice || 0);
    const nonMemberPrice = parseFloat(buyBtn.dataset.nonmemberPrice || 0);
    
    if (user && user.email) {
      // User is logged in - check for membership
      try {
        const sessionToken = localStorage.getItem('admin_session');
        if (sessionToken) {
          const resp = await fetch(API_BASE + '/account/info', {
            headers: { 'X-Session-Token': sessionToken }
          });
          if (resp.ok) {
            const data = await resp.json();
            hasActiveMembership = data.membership !== null && data.membership !== undefined;
            
            // Update applicable price
            userApplicablePrice = hasActiveMembership ? memberPrice : nonMemberPrice;
            
            // If member price is 0, enable auto-registration
            if (hasActiveMembership && memberPrice === 0) {
              buyBtn.dataset.autoRegister = 'true';
            }
          }
        }
      } catch (e) {
        console.error('[eventPurchase] Error checking membership:', e);
      }
    } else {
      // Not logged in - use non-member price
      userApplicablePrice = nonMemberPrice;
    }
  }
  
  // Run membership check on init
  checkMembershipAndUpdateButton();
  
  // Auto-register function for logged-in members with free access
  async function autoRegisterMember() {
    const user = getLoggedInUser();
    if (!user || !user.email) {
      console.error('[autoRegister] No user found');
      return;
    }
    
    // Show a subtle loading indicator
    const buyBtn = root.querySelector('.evt-buy-btn');
    if (buyBtn) {
      buyBtn.disabled = true;
      buyBtn.textContent = 'Registering...';
    }
    
    try {
      // Get Turnstile token (will be test token on localhost)
      const token = await window.utils.getTurnstileToken(null, null, IS_LOCALHOST);
      
      // Call registration endpoint
      const resp = await fetch(API_BASE + '/events/' + encodeURIComponent(eventId) + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.name || user.email,
          turnstileToken: token
        })
      });
      
      const data = await resp.json();
      
      if (!resp.ok) {
        console.error('[autoRegister] Registration failed:', data);
        if (buyBtn) {
          buyBtn.disabled = false;
          buyBtn.textContent = 'Register for Free';
        }
        // Show error in modal instead
        openPurchaseModal();
        showError(data?.message || data?.error || 'Registration failed');
        return;
      }
      
      if (data.success || data.registered) {
        // Check if user needs account setup
        if (data.needsAccountSetup && data.userEmail) {
          sessionStorage.setItem('pendingAccountSetup', JSON.stringify({
            email: data.userEmail,
            eventName: data.eventName || event.event_name || 'this event'
          }));
        }
        
        // Redirect to thank-you page
        const ticketId = data.ticketId || Date.now();
        const regRef = `REG-${eventId}-${ticketId}`;
        window.location.href = '/thank-you?orderRef=' + encodeURIComponent(regRef);
      }
    } catch (e) {
      console.error('[autoRegister] Error:', e);
      if (buyBtn) {
        buyBtn.disabled = false;
        buyBtn.textContent = 'Register for Free';
      }
    }
  }
  
  // Check if user is logged in
  function getLoggedInUser() {
    return utils.session.getUser();
  }
  
  function showError(msg) {
    const el = modal.querySelector('.evt-error');
    if (!el) return;
    el.textContent = msg || 'Error';
    el.style.display = 'block';
  }
  
  function clearError() {
    const el = modal.querySelector('.evt-error');
    if (el) {
      el.textContent = '';
      el.style.display = 'none';
    }
  }
  
  function showSuccess(emailSent = true) {
    const el = modal.querySelector('.evt-success');
    if (!el) return;
    
    // Update success message based on whether email was sent
    const message = el.querySelector('.success-message') || el;
    if (!emailSent && message) {
      const originalText = message.textContent || message.innerText;
      // Add note about email if not already mentioned
      if (!originalText.includes('check your email')) {
        const emailNote = document.createElement('p');
        emailNote.className = 'email-pending-note';
        emailNote.style.cssText = 'margin-top: 0.75rem; font-size: 0.9em; color: #f59e0b;';
        emailNote.textContent = 'Note: Your confirmation email is being processed and will arrive shortly.';
        el.appendChild(emailNote);
      }
    }
    
    el.style.display = 'block';
  }
  
  function showPending() {
    const el = modal.querySelector('.evt-success');
    if (!el) return;
    
    // Show processing message (webhook will complete payment)
    el.innerHTML = `
      <div style="text-align: center;">
        <h3>🎉 Payment Received!</h3>
        <p>Your payment is being processed. You'll receive a confirmation email shortly.</p>
        <p style="margin-top: 1rem; font-size: 0.9em; color: #666;">
          You can safely close this window. We'll email you once everything is confirmed.
        </p>
      </div>
    `;
    el.style.display = 'block';
  }
  
  async function renderTurnstile(isLoggedIn = false) {
    // Check if modal is still visible (in case it was closed while timeout was pending)
    if (!modal || modal.style.display === 'none') {
      console.log('Modal closed, skipping Turnstile render');
      return;
    }
    
    const tsElId = isLoggedIn ? 'evt-ts-logged-' + eventId : 'evt-ts-' + eventId;
    const widgetState = isLoggedIn 
      ? { get widgetId() { return turnstileLoggedWidgetId; }, set widgetId(val) { turnstileLoggedWidgetId = val; } }
      : { get widgetId() { return turnstileWidgetId; }, set widgetId(val) { turnstileWidgetId = val; } };
    
    const widgetId = await window.utils.renderTurnstile(tsElId, TURNSTILE_SITE_KEY, {
      skipOnLocalhost: IS_LOCALHOST,
      widgetState
    });
    
    console.log('Turnstile widget rendered:', widgetId, 'isLoggedIn:', isLoggedIn);
  }
  async function getTurnstileToken(isLoggedIn = false) {
    const tsElId = isLoggedIn ? 'evt-ts-logged-' + eventId : 'evt-ts-' + eventId;
    const currentWidgetId = isLoggedIn ? turnstileLoggedWidgetId : turnstileWidgetId;
    
    return await window.utils.getTurnstileToken(tsElId, currentWidgetId, IS_LOCALHOST);
  }
  async function confirmPayment(ref, pollOptions = {}) {
    console.log('[confirmPayment] Starting confirmation for ref:', ref, 'options:', pollOptions);
    const result = await window.utils.pollPaymentConfirmation('/events/confirm', ref, {
      pollInterval: pollOptions.pollInterval,
      maxAttempts: pollOptions.maxAttempts,
      onSuccess: (data) => {
        console.log('[confirmPayment] ✅ Success callback triggered with data:', data);
        
        // Check if user needs account setup and store data in sessionStorage
        if (data.needsAccountSetup && data.userEmail) {
          sessionStorage.setItem('pendingAccountSetup', JSON.stringify({
            email: data.userEmail,
            eventName: data.eventName || 'this event'
          }));
        }
        
        // Log if email failed but still redirect - payment succeeded
        if (!data.emailSent) {
          console.warn('[eventPurchase] Payment succeeded but email failed. User:', data.userEmail);
        }
        
        // Redirect to thank-you page with event details
        const redirectUrl = '/thank-you?orderRef=' + encodeURIComponent(ref) + 
          (data.emailSent === false ? '&emailPending=1' : '');
        console.log('[confirmPayment] Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      },
      onError: (errorMsg) => {
        console.error('[confirmPayment] ❌ Error callback triggered:', errorMsg);
        showError(errorMsg);
      },
      onTimeout: () => {
        console.log('[confirmPayment] ⏱️ Timeout callback triggered');
        // Payment is processing - webhook will complete it
        // Redirect to thank-you with processing flag
        window.location.href = '/thank-you?orderRef=' + encodeURIComponent(ref) + '&processing=1';
      }
    });
    
    console.log('[confirmPayment] Poll completed with result:', result);
    return result !== null;
  }
    function unmountWidget() {
    // Properly unmount SumUp widget if it exists
    if (window.SumUpCard && window.SumUpCard.unmount) {
      try {
        window.SumUpCard.unmount({ id: 'evt-card-'+eventId });
        console.log('SumUp widget unmounted');
      } catch(e) {
        console.log('SumUp unmount failed:', e);
      }
    }
    if (cardEl) {
      cardEl.innerHTML = '';
      cardEl.style.display = 'none';
    }
  }
  
  async function mountWidget(checkoutId, orderRef) {
    try {
      await window.utils.loadSumUpSdk();
    } catch(e) {
      showError('Payment widget failed.');
      return;
    }
    
    try {
      clearError();
      
      // First unmount any existing widget to ensure clean state
      unmountWidget();
      
      // Hide all form steps and show payment section
      const detailsEl = modal.querySelector('.evt-details');
      const confirmLoggedEl = modal.querySelector('.evt-confirm-logged-in');
      if (detailsEl) detailsEl.style.display = 'none';
      if (confirmLoggedEl) confirmLoggedEl.style.display = 'none';
      cardEl.style.display = 'block';
        // Mount fresh widget
      window.SumUpCard.mount({
        id: 'evt-card-'+eventId,
        checkoutId,
        onResponse: async (type, body) => {
          console.log('SumUp onResponse:', type, body);
          
          // Clear any previous errors when user tries again
          clearError();
          
          // Handle final states only - intermediate states like verification should not trigger actions
          if (type === 'success') {
            // Payment succeeded! Try immediate verification (should be instant)
            // Use reduced polling: 3s intervals, only 20 attempts (1 minute)
            // Webhook will handle it if user closes browser
            await confirmPayment(orderRef, { pollInterval: 3000, maxAttempts: 20 });
          } else if (type === 'error' || type === 'fail') {
            // Payment failed
            showError(body.message || 'Payment failed. Please try again.');
          } else if (type === 'cancel') {
            // User cancelled the payment
            showError('Payment cancelled. You can try again when ready.');
          } else {
            // Intermediate state (e.g., verification check) - don't do anything, let user complete it
            console.log('SumUp intermediate state:', type, body);
          }
        },
        onBack: () => {
          console.log('SumUp onBack triggered');
          // User clicked back button in widget - return to details
          unmountWidget();
          modal.querySelector('.evt-details').style.display = 'block';
        }
      });
    } catch(e) {
      console.error('SumUp mount error:', e);
      showError('Could not start payment');
    }
  }
  
  function newIdempotencyKey() {
    try {
      return crypto.randomUUID();
    } catch {
      return String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    }
  }
  
  async function startCheckout(email, name, privacy, turnstileToken) {
    clearError();
    
    // If user's applicable price is 0, use free registration
    if (userApplicablePrice === 0) {
      await startRegistration(email, name, turnstileToken);
      return;
    }
    
    // Otherwise proceed with paid checkout
    let resp;
    try {
      resp = await fetch(API_BASE + '/events/' + encodeURIComponent(eventId) + '/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': newIdempotencyKey()
        },
        body: JSON.stringify({
          email,
          name,
          privacyConsent: privacy,
          turnstileToken
        })
      });
    } catch(e) {
      showError('Network error');
      return;
    }
    
    const data = await resp.json();
    if (!resp.ok) {
      showError(data?.message || data?.error || 'Checkout failed');
      return;
    }
    
    if (data.checkoutId) {
      mountWidget(data.checkoutId, data.orderRef);
      return;
    }
    
    showError('Missing checkout ID');
  }

  async function startRegistration(email, name, turnstileToken) {
    clearError();
    let resp;
    try {
      resp = await fetch(API_BASE + '/events/' + encodeURIComponent(eventId) + '/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          name,
          turnstileToken
        })
      });
    } catch(e) {
      showError('Network error');
      return;
    }
    const data = await resp.json();
    if (!resp.ok) {
      showError(data?.message || data?.error || 'Registration failed');
      return;
    }
      if (data.success || data.registered || data.already_registered) {
      // Check if user needs account setup and store data in sessionStorage
      if (data.needsAccountSetup && data.userEmail) {
        sessionStorage.setItem('pendingAccountSetup', JSON.stringify({
          email: data.userEmail,
          eventName: data.eventName || 'this event'
        }));
      }
      
      // Redirect to thank you page with registration reference
      // Format: REG-{eventId}-{ticketId}
      const ticketId = data.ticketId || Date.now();
      const regRef = `REG-${eventId}-${ticketId}`;
      window.location.href = '/thank-you?orderRef=' + encodeURIComponent(regRef);
      return;
    }
    
    showError('Registration failed');
  }

  function openPurchaseModal() {
    // Check if auto-registration should happen (logged-in member with free price)
    const buyBtn = root.querySelector('.evt-buy-btn');
    if (buyBtn && buyBtn.dataset.autoRegister === 'true') {
      // Auto-register without showing modal
      autoRegisterMember();
      return;
    }
    
    if (modal) {
      // Check if user is logged in
      const user = getLoggedInUser();
      const isLoggedIn = user && user.email;
      
      // Show modal FIRST so Turnstile can render properly
      modal.style.display = 'flex';
      
      // Show appropriate screen based on login status
      const detailsScreen = modal.querySelector('.evt-details');
      const loggedInScreen = modal.querySelector('.evt-confirm-logged-in');
      
      if (isLoggedIn) {
        // Show logged-in confirmation screen
        detailsScreen.style.display = 'none';
        loggedInScreen.style.display = 'block';
        
        // Populate user email
        const emailDisplay = modal.querySelector('.evt-user-email');
        if (emailDisplay) {
          emailDisplay.textContent = user.email;
        }
        
        // Render Turnstile for logged-in flow
        turnstileRenderTimeout = setTimeout(() => {
          turnstileRenderTimeout = null;
          renderTurnstile(true).catch((e) => {
            console.error('Failed to render Turnstile:', e);
          });
        }, 50);
      } else {
        // Show guest form
        detailsScreen.style.display = 'block';
        loggedInScreen.style.display = 'none';
        
        // Focus name input
        const nameInput = modal.querySelector('.evt-name');
        if (nameInput) nameInput.focus();
        
        // Render Turnstile for guest flow
        turnstileRenderTimeout = setTimeout(() => {
          turnstileRenderTimeout = null;
          renderTurnstile(false).catch((e) => {
            console.error('Failed to render Turnstile:', e);
          });
        }, 50);
      }
    }
  }
  function closePurchaseModal() {
    if (modal) {
      // Cancel pending Turnstile render if modal closes before timeout fires
      if (turnstileRenderTimeout !== null) {
        clearTimeout(turnstileRenderTimeout);
        turnstileRenderTimeout = null;
        console.log('Cancelled pending Turnstile render');
      }
      
      // Clean up both Turnstile widgets
      window.utils.cleanupTurnstile(turnstileWidgetId, 'evt-ts-' + eventId);
      turnstileWidgetId = null;
      
      window.utils.cleanupTurnstile(turnstileLoggedWidgetId, 'evt-ts-logged-' + eventId);
      turnstileLoggedWidgetId = null;
      
      // Use the unmount helper to properly clean up SumUp widget
      unmountWidget();
        // Hide modal and reset state
      modal.style.display = 'none';
      const detailsScreen = modal.querySelector('.evt-details');
      const loggedInScreen = modal.querySelector('.evt-confirm-logged-in');
      if (detailsScreen) detailsScreen.style.display = 'block';
      if (loggedInScreen) loggedInScreen.style.display = 'none';
      
      clearError();
      const s = modal.querySelector('.evt-success');
      if (s) s.style.display = 'none';
      
      // Reset form fields
      const nameField = modal.querySelector('.evt-name');
      const emailField = modal.querySelector('.evt-email');
      const privacyField = modal.querySelector('.evt-privacy');
      if (nameField) nameField.value = '';
      if (emailField) emailField.value = '';
      if (privacyField) privacyField.checked = false;
    }
  }root.querySelector('.evt-buy-btn')?.addEventListener('click', openPurchaseModal);
  root.querySelector('.evt-register-btn')?.addEventListener('click', openPurchaseModal);
  
  modal.querySelector('.evt-close')?.addEventListener('click', closePurchaseModal);
  
  const contBtn = modal.querySelector('.evt-continue');
  contBtn && contBtn.addEventListener('click', async () => {
    const name = modal.querySelector('.evt-name').value.trim();
    const email = modal.querySelector('.evt-email').value.trim();
    const privacyCheckbox = modal.querySelector('.evt-privacy');
    const privacy = privacyCheckbox ? privacyCheckbox.checked : true; // Free events don't have privacy checkbox
    const isFreeEvent = !privacyCheckbox; // If no privacy checkbox, it's a free event
    
    if (!name) {
      showError('Enter your full name');
      return;
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showError('Enter a valid email');
      return;
    }
    if (!isFreeEvent && !privacy) {
      showError('Please agree to the Privacy Policy');
      return;
    }
    
    clearError();
    contBtn.disabled = true;
    
    let token;
    try {
      token = await getTurnstileToken(false);
    } catch(e) {
      showError(e.message || 'Security check failed.');
      contBtn.disabled = false;
      return;
    }
    
    contBtn.disabled = false;
    
    // Route to registration or checkout based on event type
    if (isFreeEvent) {
      startRegistration(email, name, token);
    } else {
      startCheckout(email, name, privacy, token);
    }
  });
  
  // Logged-in flow: Continue to payment button
  const contLoggedBtn = modal.querySelector('.evt-continue-logged');
  contLoggedBtn && contLoggedBtn.addEventListener('click', async () => {
    const user = getLoggedInUser();
    if (!user || !user.email) {
      showError('Session expired. Please refresh and try again.');
      return;
    }
    
    clearError();
    contLoggedBtn.disabled = true;
    
    let token;
    try {
      token = await getTurnstileToken(true);
    } catch(e) {
      showError(e.message || 'Security check failed.');
      contLoggedBtn.disabled = false;
      return;
    }
      contLoggedBtn.disabled = false;
    // Use user's name from session if available, otherwise use email
    const name = user.name || user.email;
    
    // Route based on user's applicable price (not just event type)
    // If member has 0 price, use free registration even if event has paid tier
    if (userApplicablePrice === 0) {
      startRegistration(user.email, name, token);
    } else {
      startCheckout(user.email, name, true, token);
    }
  });
  
  // Switch account button (show guest form)
  const switchAccountBtn = modal.querySelector('.evt-switch-account');
  switchAccountBtn && switchAccountBtn.addEventListener('click', () => {
    const detailsScreen = modal.querySelector('.evt-details');
    const loggedInScreen = modal.querySelector('.evt-confirm-logged-in');
    
    // Hide logged-in screen, show guest form
    if (loggedInScreen) loggedInScreen.style.display = 'none';
    if (detailsScreen) {
      detailsScreen.style.display = 'block';
      // Focus name input
      const nameInput = modal.querySelector('.evt-name');
      if (nameInput) nameInput.focus();
    }
    
    // Render Turnstile for guest flow
    renderTurnstile(false).catch((e) => {
      console.error('Failed to render Turnstile:', e);
    });
  });
  
  ['input', 'change'].forEach(ev => {
    ['.evt-name', '.evt-email', '.evt-privacy'].forEach(sel => {
      const el = modal.querySelector(sel);
      if (el) el.addEventListener(ev, clearError);
    });
  });
  
  // Check for order confirmation in URL
  const qs = new URLSearchParams(location.search);
  const ref = qs.get('orderRef');
  if (ref) {
    confirmPayment(ref).then(() => {
      const u = new URL(location.href);
      u.searchParams.delete('orderRef');
      history.replaceState({}, '', u);
    });
  }
}
