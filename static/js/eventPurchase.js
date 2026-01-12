// Global API configuration
window.__DB_API_BASE = window.__DB_API_BASE || 'https://dicebastion-memberships.ncalamaro.workers.dev';
const API_BASE = window.__DB_API_BASE;
const TURNSTILE_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k';

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
  return `
    <div class="event-purchase my-6" data-event-id="${eventId}" style="margin-top: 2rem;">
      <div class="event-ticket-box border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 bg-neutral dark:bg-neutral-800 shadow-lg max-w-xl">
        <h3 class="mt-0 mb-2 text-xl font-bold text-primary-700 dark:text-primary-400">Get a Ticket</h3>
        <div class="event-prices flex gap-5 flex-wrap items-end mb-3">
          <div class="flex-1 min-w-[140px]">
            <div class="text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 tracking-wide">Member Price</div>
            <div class="text-2xl font-extrabold text-neutral-800 dark:text-neutral-200">£${event.membership_price}</div>
          </div>
          <div class="flex-1 min-w-[160px]">
            <div class="text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 tracking-wide">Non‑Member Price</div>
            <div class="text-2xl font-extrabold text-neutral-800 dark:text-neutral-200">£${event.non_membership_price}</div>
          </div>
        </div>
        <p class="mt-0 mb-4 text-sm text-neutral-700 dark:text-neutral-300">Member discount is applied automatically if an active membership is found for your email.</p>
        <button type="button" class="evt-buy-btn w-full py-3 px-6 border-0 rounded-lg bg-primary-600 dark:bg-primary-500 text-neutral-50 text-base font-bold cursor-pointer shadow-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">Buy Ticket</button>
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
  
  if (!root || !modal) return;
  
  // Check if user is logged in
  function getLoggedInUser() {
    const sessionToken = localStorage.getItem('admin_session');
    const userDataStr = localStorage.getItem('admin_user');
    
    if (!sessionToken || !userDataStr) {
      return null;
    }
    
    try {
      return JSON.parse(userDataStr);
    } catch (e) {
      console.error('Failed to parse user data:', e);
      return null;
    }
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
  
  function showSuccess() {
    const el = modal.querySelector('.evt-success');
    if (el) el.style.display = 'block';
  }
  
  async function loadSumUpSdk() {
    if (window.SumUpCard) return true;
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js';
      s.async = true;
      s.onload = () => res(true);
      s.onerror = () => rej(new Error('SumUp SDK load failed'));
      document.head.appendChild(s);
    });
  }
    function loadTurnstileSdk() {
    if (window.turnstile) return Promise.resolve(true);
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      s.defer = true;
      s.onload = () => res(true);
      s.onerror = () => rej(new Error('Turnstile load failed'));
      document.head.appendChild(s);
    });
  }  async function renderTurnstile(isLoggedIn = false) {
    await loadTurnstileSdk();
    const tsElId = isLoggedIn ? 'evt-ts-logged-' + eventId : 'evt-ts-' + eventId;
    const tsEl = document.getElementById(tsElId);
    const widgetIdRef = isLoggedIn ? 'turnstileLoggedWidgetId' : 'turnstileWidgetId';
    
    if (!tsEl || !window.turnstile) return;
    
    // Check if modal is still visible (in case it was closed while timeout was pending)
    if (!modal || modal.style.display === 'none') {
      console.log('Modal closed, skipping Turnstile render');
      return;
    }
    
    // Remove existing widget if present
    const currentWidgetId = isLoggedIn ? turnstileLoggedWidgetId : turnstileWidgetId;
    if (currentWidgetId !== null) {
      try {
        window.turnstile.remove(currentWidgetId);
        console.log('Turnstile widget removed:', currentWidgetId);
      } catch(e) {
        console.log('Turnstile remove failed:', e);
      }
      if (isLoggedIn) {
        turnstileLoggedWidgetId = null;
      } else {
        turnstileWidgetId = null;
      }
    }
    
    // Clear the container completely and reset any Turnstile state
    tsEl.innerHTML = '';
    
    // Remove any orphaned widgets by trying to get response from container
    try {
      if (window.turnstile.getResponse) {
        const existingResponse = window.turnstile.getResponse(tsEl);
        if (existingResponse !== undefined) {
          console.log('Found orphaned Turnstile widget, attempting cleanup');
          window.turnstile.reset(tsEl);
        }
      }
    } catch(e) {
      // Expected if no widget exists
    }
    
    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Render new widget and store the ID
    try {
      const widgetId = window.turnstile.render(tsEl, {
        sitekey: TURNSTILE_SITE_KEY,
        size: 'flexible'
      });
      if (isLoggedIn) {
        turnstileLoggedWidgetId = widgetId;
      } else {
        turnstileWidgetId = widgetId;
      }
      console.log('Turnstile widget rendered with ID:', widgetId, 'isLoggedIn:', isLoggedIn);
    } catch(e) {
      console.error('Turnstile render failed:', e);
      // If render fails, try one more time with a fresh container
      tsEl.innerHTML = '';
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        const widgetId = window.turnstile.render(tsEl, {
          sitekey: TURNSTILE_SITE_KEY,
          size: 'flexible'
        });
        if (isLoggedIn) {
          turnstileLoggedWidgetId = widgetId;
        } else {
          turnstileWidgetId = widgetId;
        }
        console.log('Turnstile widget rendered with ID (retry):', widgetId, 'isLoggedIn:', isLoggedIn);
      } catch(e2) {
        console.error('Turnstile render failed again:', e2);
        if (isLoggedIn) {
          turnstileLoggedWidgetId = null;
        } else {
          turnstileWidgetId = null;
        }
      }
    }
  }
    async function getTurnstileToken(isLoggedIn = false) {
    await loadTurnstileSdk();
    const tsElId = isLoggedIn ? 'evt-ts-logged-' + eventId : 'evt-ts-' + eventId;
    const tsEl = document.getElementById(tsElId);
    const currentWidgetId = isLoggedIn ? turnstileLoggedWidgetId : turnstileWidgetId;
    
    if (!tsEl || !window.turnstile) throw new Error('Turnstile not ready');
    
    // Get token from the widget
    const token = currentWidgetId !== null 
      ? window.turnstile.getResponse(currentWidgetId)
      : window.turnstile.getResponse(tsEl);
      
    if (!token) throw new Error('Please complete the security check.');
    return token;
  }
    async function confirmPayment(ref) {
    const attempts = 15;
    for (let i = 0; i < attempts; i++) {
      try {
        const r = await fetch(API_BASE + '/events/confirm?orderRef=' + encodeURIComponent(ref));
        const j = await r.json();
        
        // Success cases: ticket is active or already_active
        if (j.ok && (j.status === 'active' || j.status === 'already_active')) {
          showSuccess();
          return true;
        }
        
        // Still pending - keep polling
        if (j.status && String(j.status).toUpperCase() === 'PENDING') {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        
        // If we get ok: false with a specific error, stop polling
        if (!j.ok && j.error && j.error !== 'verify_failed') {
          showError(j.message || 'Payment failed: ' + j.error);
          return false;
        }
      } catch(e) {
        console.error('Polling error:', e);
      }
      await new Promise(r => setTimeout(r, 1500));
    }
    showError('Payment verification timed out. Please check your email or refresh the page.');
    return false;
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
      await loadSumUpSdk();
    } catch(e) {
      showError('Payment widget failed.');
      return;
    }
    
    try {
      clearError();
      
      // First unmount any existing widget to ensure clean state
      unmountWidget();
      
      // Show payment section and hide details
      cardEl.style.display = 'block';
      modal.querySelector('.evt-details').style.display = 'none';
        // Mount fresh widget
      window.SumUpCard.mount({
        id: 'evt-card-'+eventId,
        checkoutId,
        onResponse: async (type, body) => {
          console.log('SumUp onResponse:', type, body);
          
          // Handle final states only - intermediate states like verification should not trigger actions
          if (type === 'success') {
            // Payment succeeded - verify with backend
            const confirmed = await confirmPayment(orderRef);
            if (!confirmed) {
              // Only show error if backend confirmation failed after polling
              showError('Payment verification failed. Please check your email or refresh the page.');
            }
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
      const cleanupTurnstile = (widgetId, elementId) => {
        const tsEl = document.getElementById(elementId);
        
        if (window.turnstile && widgetId !== null) {
          try {
            console.log('Removing Turnstile widget:', widgetId);
            window.turnstile.remove(widgetId);
            console.log('Turnstile widget removed successfully');
          } catch(e) {
            console.error('Turnstile cleanup failed:', e);
          }
        }
        
        if (window.turnstile && tsEl) {
          try {
            window.turnstile.reset(tsEl);
            console.log('Reset Turnstile container as fallback');
          } catch(e) {
            // Silent fail - expected if no widget exists
          }
        }
        
        if (tsEl) {
          tsEl.innerHTML = '';
          const parent = tsEl.parentNode;
          const newTsEl = tsEl.cloneNode(false);
          parent.replaceChild(newTsEl, tsEl);
          console.log('Turnstile container replaced with fresh clone');
        }
      };
      
      // Clean up guest flow Turnstile
      cleanupTurnstile(turnstileWidgetId, 'evt-ts-' + eventId);
      turnstileWidgetId = null;
      
      // Clean up logged-in flow Turnstile
      cleanupTurnstile(turnstileLoggedWidgetId, 'evt-ts-logged-' + eventId);
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
    
    // Check if this is a free event by looking for privacy checkbox
    const privacyCheckbox = modal.querySelector('.evt-privacy');
    const isFreeEvent = !privacyCheckbox;
    
    if (isFreeEvent) {
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
