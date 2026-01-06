// Global API configuration
window.__DB_API_BASE = window.__DB_API_BASE || 'https://dicebastion-memberships.ncalamaro.workers.dev';
const API_BASE = window.__DB_API_BASE;
const TURNSTILE_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k';

function renderEventPurchase(event) {
  const eventId = event.id;
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
    
    <div class="evt-modal" id="evt-modal-${eventId}" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:99999; align-items:center; justify-content:center;">
      <div class="evt-modal-inner bg-neutral dark:bg-neutral-800 rounded-xl p-5 relative shadow-2xl" style="width:min(520px,95vw);">
        <button type="button" class="evt-close bg-transparent border-none text-2xl cursor-pointer text-neutral-700 dark:text-neutral-300" aria-label="Close" style="position:absolute; top:10px; right:10px;">×</button>
        <h3 class="mt-0 mb-3 text-lg font-bold text-neutral-800 dark:text-neutral-200">Ticket Checkout</h3>
        <div class="evt-step evt-details" style="display:block;">
          <label class="block mt-2 mb-1 font-semibold text-neutral-700 dark:text-neutral-300">Full name</label>
          <input type="text" class="evt-name w-full p-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200" placeholder="Jane Doe">
          <label class="block mt-3 mb-1 font-semibold text-neutral-700 dark:text-neutral-300">Email</label>
          <input type="email" class="evt-email w-full p-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200" placeholder="you@example.com">
          <div class="mt-3 flex gap-2 items-start text-sm leading-tight">
            <input type="checkbox" class="evt-privacy mt-1">
            <label class="text-neutral-700 dark:text-neutral-300">I agree to the <a href="/privacy-policy/" target="_blank" rel="noopener" class="text-primary-600 dark:text-primary-400 underline">Privacy Policy</a>.</label>
          </div>          <div class="mt-3">
            <div class="text-sm text-neutral-700 dark:text-neutral-300 mb-2">Security check</div>
            <div id="evt-ts-${eventId}"></div>
          </div>
          <button type="button" class="evt-continue mt-4 w-full py-3 border-none rounded-lg bg-primary-600 dark:bg-primary-500 text-neutral-50 font-bold cursor-pointer hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">Continue to Payment</button>
        </div>
        <div id="evt-card-${eventId}" class="evt-card mt-2" style="display:none;"></div>
        <div class="evt-error mt-2.5 text-sm font-semibold" style="display:none; color:#b00020;"></div>
        <div class="evt-success mt-4 py-3 px-4 rounded-lg font-semibold" style="display:none; background:#e9fbe9; border:1px solid #b9e8b9; color:#1a5d1a;">Ticket confirmed! See you there.</div>
      </div>
    </div>
  `;
}

function initEventPurchase(event) {
  const eventId = String(event.id);
  const root = document.querySelector('.event-purchase[data-event-id="'+eventId+'"]');
  const modal = document.getElementById('evt-modal-'+eventId);
  const cardEl = document.getElementById('evt-card-'+eventId);
  let turnstileWidgetId = null; // Store the Turnstile widget ID
  let turnstileRenderTimeout = null; // Store timeout ID to cancel if needed
  
  if (!root || !modal) return;
  
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
  }
  async function renderTurnstile() {
    await loadTurnstileSdk();
    const tsEl = document.getElementById('evt-ts-'+eventId);
    if (!tsEl || !window.turnstile) return;
    
    // Check if modal is still visible (in case it was closed while timeout was pending)
    if (!modal || modal.style.display === 'none') {
      console.log('Modal closed, skipping Turnstile render');
      return;
    }
    
    // Remove existing widget if present
    if (turnstileWidgetId !== null) {
      try {
        window.turnstile.remove(turnstileWidgetId);
        console.log('Turnstile widget removed:', turnstileWidgetId);
      } catch(e) {
        console.log('Turnstile remove failed:', e);
      }
      turnstileWidgetId = null;
    }
    
    // Clear the container completely
    tsEl.innerHTML = '';
    
    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Render new widget and store the ID
    try {
      turnstileWidgetId = window.turnstile.render(tsEl, {
        sitekey: TURNSTILE_SITE_KEY,
        size: 'flexible'
      });
      console.log('Turnstile widget rendered with ID:', turnstileWidgetId);
    } catch(e) {
      console.error('Turnstile render failed:', e);
      turnstileWidgetId = null;
    }
  }
  
  async function getTurnstileToken() {
    await loadTurnstileSdk();
    const tsEl = document.getElementById('evt-ts-'+eventId);
    if (!tsEl || !window.turnstile) throw new Error('Turnstile not ready');
    
    // Get token from the widget
    const token = turnstileWidgetId !== null 
      ? window.turnstile.getResponse(turnstileWidgetId)
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
        if (j.ok && j.status === 'active') {
          showSuccess();
          return true;
        }
        if (j.status && String(j.status).toUpperCase() === 'PENDING') {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
      } catch(e) {}
      await new Promise(r => setTimeout(r, 1500));
    }
    showError('Payment still processing. Refresh soon.');
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
          // Always attempt to confirm the payment by polling the backend
          // The backend will check the actual SumUp payment status
          const confirmed = await confirmPayment(orderRef);
          if (!confirmed) {
            // Only show error if backend confirmation failed after polling
            showError('Payment verification failed. Please refresh the page to check your order status.');
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
  }  function openPurchaseModal() {
    if (modal) {
      // Show modal FIRST so Turnstile can render properly
      modal.style.display = 'flex';
      
      // Focus name input
      const nameInput = modal.querySelector('.evt-name');
      if (nameInput) nameInput.focus();
      
      // Render fresh Turnstile widget after modal is visible
      // Store timeout ID so we can cancel it if modal closes early
      turnstileRenderTimeout = setTimeout(() => {
        turnstileRenderTimeout = null;
        renderTurnstile().catch((e) => {
          console.error('Failed to render Turnstile:', e);
        });
      }, 50);
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
      
      // Remove Turnstile widget if it was rendered
      if (window.turnstile && turnstileWidgetId !== null) {
        try {
          console.log('Removing Turnstile widget:', turnstileWidgetId);
          window.turnstile.remove(turnstileWidgetId);
          turnstileWidgetId = null;
          console.log('Turnstile widget removed successfully');
        } catch(e) {
          console.error('Turnstile cleanup failed:', e);
          turnstileWidgetId = null; // Reset anyway
        }
      }
      
      // Clear the Turnstile container to remove any orphaned widgets
      const tsEl = document.getElementById('evt-ts-'+eventId);
      if (tsEl) {
        tsEl.innerHTML = '';
      }
      
      // Use the unmount helper to properly clean up SumUp widget
      unmountWidget();
      
      // Hide modal
      modal.style.display = 'none';
      const d = modal.querySelector('.evt-details');
      if (d) d.style.display = 'block';
      
      clearError();
      const s = modal.querySelector('.evt-success');
      if (s) s.style.display = 'none';
      modal.querySelector('.evt-name').value = '';
      modal.querySelector('.evt-email').value = '';
      modal.querySelector('.evt-privacy').checked = false;
    }
  }
  
  root.querySelector('.evt-buy-btn')?.addEventListener('click', () => {
    openPurchaseModal();
  });
  
  modal.querySelector('.evt-close')?.addEventListener('click', closePurchaseModal);
  
  const contBtn = modal.querySelector('.evt-continue');
  contBtn && contBtn.addEventListener('click', async () => {
    const name = modal.querySelector('.evt-name').value.trim();
    const email = modal.querySelector('.evt-email').value.trim();
    const privacy = modal.querySelector('.evt-privacy').checked;
    
    if (!name) {
      showError('Enter your full name');
      return;
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showError('Enter a valid email');
      return;
    }
    if (!privacy) {
      showError('Please agree to the Privacy Policy');
      return;
    }
    
    clearError();
    contBtn.disabled = true;
    
    let token;
    try {
      token = await getTurnstileToken();
    } catch(e) {
      showError(e.message || 'Security check failed.');
      contBtn.disabled = false;
      return;
    }
    
    contBtn.disabled = false;
    startCheckout(email, name, privacy, token);
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
