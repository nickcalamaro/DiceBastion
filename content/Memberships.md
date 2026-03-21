---

title: Memberships
herostyle: "background"
showDate: false
showPagination: false

---

<!-- Shared Utilities -->
<script src="/js/utils.js"></script>
<script src="/js/modal.js"></script>

<!-- Component Styles -->
<link rel="stylesheet" href="/css/forms.css">

<meta name="description" content="Become a member of Dice Bastion Gibraltar and enjoy local discounts, free venue access, and exclusive support for our board game, card game, RPG, and wargame events.">

<b>Gibraltar Dice Bastion is part of the Gibraltar Warhammer Club, and we're completely funded by our members!</b>

If you'd like to support us, get free bookings for game tables, and a whole range of other benefits, please consider becoming a member!

  <div class="plans-grid" id="membership-plans">
  <!-- Monthly -->
  <div class="plan-card" data-plan="monthly">
    <div class="plan-label">Most flexible</div>
    <h3 class="plan-name">Monthly</h3>
    <div class="plan-price">
      <span class="currency">£</span><span class="amount" data-price-for="monthly">10.00</span>
      <span class="plan-price-period">/month</span>
    </div>
    <ul class="plan-features">
      <li>Free access to table bookings</li>
      <li>Support our events and community</li>
    </ul>
    <button class="plan-cta" data-plan="monthly">
      Join Monthly
    </button>
  </div>

  <!-- Quarterly (Most popular) -->
  <div class="plan-card plan-card-featured" data-plan="quarterly">
    <div class="plan-badge">Most popular</div>
    <h3 class="plan-name">Quarterly</h3>
    <div class="plan-price">
      <span class="currency">£</span><span class="amount" data-price-for="quarterly">25.00</span>
      <span class="plan-price-period">/quarter</span>
    </div>
    <ul class="plan-features">
      <li>Free table bookings</li>
      <li>Local discounts (Dominos, Imperial Newsagents, Music Corner, Euphoria)</li>
      <li>Discounts on club events</li>
      <li>Free drinks at selected events</li>
    </ul>
    <button class="plan-cta" data-plan="quarterly">
      Join Quarterly
    </button>
  </div>

  <!-- Annual -->
  <div class="plan-card" data-plan="annual">
    <div class="plan-label">Best value</div>
    <h3 class="plan-name">Annual</h3>
    <div class="plan-price">
      <span class="currency">£</span><span class="amount" data-price-for="annual">90.00</span>
      <span class="plan-price-period">/year</span>
    </div>
    <ul class="plan-features">
      <li>All quarterly benefits</li>
      <li>10% cheaper than paying quarterly</li>
    </ul>
    <button class="plan-cta" data-plan="annual">
      Join Annual
    </button>
  </div>




</div>


<!-- ===== OTHER MEMBERSHIP OPTIONS (collapsible) ===== -->
<div style="margin: 2.5rem 0 0;">
  <button id="other-options-toggle" type="button"
    class="btn btn-secondary btn-full"
    style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;"
    aria-expanded="false"
    aria-controls="other-options-panel">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
         stroke-linejoin="round" style="flex-shrink:0;">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
    Other Membership Options
    <svg id="other-options-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round"
         style="transition: transform 0.2s; flex-shrink: 0;">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  </button>

  <div id="other-options-panel" style="display: none; margin-top: 1rem;">
    <div id="sponsor-alert" style="display: none; margin-bottom: 1rem;"></div>

<div class="plans-grid" style="margin-top: 0; grid-template-columns: repeat(2, 1fr);">

<!-- Sponsor a Membership -->
<div class="plan-card" id="sponsor-card">
  <div class="plan-label">Give back</div>
  <h3 class="plan-name">Sponsor a Membership</h3>
  <div class="plan-price">
    <span class="currency">£</span><span id="sponsor-price-amount">25.00</span>
    <span class="plan-price-period">/quarter</span>
  </div>
  <ul class="plan-features">
    <li>Funds a quarterly membership for someone who can't afford one</li>
    <li>Helps keep our club inclusive for everyone</li>
    <li>Your generosity is greatly appreciated</li>
  </ul>
  <button class="plan-cta" id="sponsor-cta-btn" type="button">
    Sponsor a Membership
  </button>
</div>

<!-- Sponsored Membership (claim) -->
<div class="plan-card" id="sponsored-claim-card">
  <div class="plan-label">Community supported</div>
  <h3 class="plan-name">Sponsored Membership</h3>
  <div class="plan-price" style="color: rgb(var(--color-success-600));">
    FREE
    <span class="plan-price-period">&nbsp;</span>
  </div>
  <ul class="plan-features">
    <li>Quarterly membership for those with limited financial means</li>
    <li>All standard membership benefits</li>
    <li>Funded by generous community members</li>
  </ul>
  <div id="sponsored-pool-status" style="margin-bottom: 0.75rem; font-size: 0.875rem;
        color: rgb(var(--color-neutral-600));">Checking availability…</div>
  <button class="plan-cta" id="sponsored-claim-btn" type="button">
    Claim Sponsored Membership
  </button>
</div>

</div><!-- /.plans-grid -->
  </div><!-- /#other-options-panel -->
</div><!-- /collapsible wrapper -->

<!-- Sponsor Purchase Modal -->
<div id="sponsor-modal-container"></div>

<!-- Sponsored Claim Modal -->
<div id="sponsored-claim-modal-container"></div>


<div class="footer-info">
  <span>Secure checkout powered by SumUp</span>
  <span class="footer-divider" aria-hidden="true"></span>
  <span>Auto-renewal included · Cancel anytime</span>
</div>

<!-- Simple footer with member login placeholder -->
<div id="membership-cta-footer" class="text-center" style="margin: 1.5rem auto;">
  <a href="/login" class="link">Already a member? Log in here.</a>
</div>
</section>


<script>
(function() {
  const API_BASE = utils.getApiBase();
  const TS_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k';
  const IS_LOCALHOST = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '0.0.0.0';

  // ── Collapsible toggle ──────────────────────────────────────────────────
  const toggleBtn = document.getElementById('other-options-toggle');
  const panel     = document.getElementById('other-options-panel');
  const chevron   = document.getElementById('other-options-chevron');

  toggleBtn.addEventListener('click', () => {
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'block';
    chevron.style.transform = open ? '' : 'rotate(180deg)';
    toggleBtn.setAttribute('aria-expanded', String(!open));
    if (!open) loadSponsorPool();
  });

  // ── Pool availability ───────────────────────────────────────────────────
  let sponsorPoolCount = null; // null = not yet loaded

  async function loadSponsorPool() {
    const poolStatus = document.getElementById('sponsored-pool-status');
    try {
      const resp = await fetch(`${API_BASE}/membership/sponsor/pool`);
      const data = await resp.json();
      const n = data.available || 0;
      sponsorPoolCount = n;
      if (n > 0) {
        poolStatus.textContent = `${n} sponsored membership${n === 1 ? '' : 's'} available`;
        poolStatus.style.color = 'rgb(var(--color-success-600))';
      } else {
        poolStatus.textContent = 'None currently available – check back soon!';
        poolStatus.style.color = 'rgb(var(--color-neutral-500))';
      }
    } catch {
      sponsorPoolCount = 0;
      poolStatus.textContent = 'Unable to check availability right now.';
    }
  }

  // Also load the annual plan price for the sponsor card
  async function loadSponsorPrice() {
    try {
      const resp = await fetch(`${API_BASE}/membership/plans`);
      const data = await resp.json();
      const quarterly = (data.plans || []).find(p => p.code === 'quarterly');
      if (quarterly) {
        document.getElementById('sponsor-price-amount').textContent = quarterly.amount || '25.00';
      }
    } catch { /* silently ignore */ }
  }
  loadSponsorPrice();

  // ── Shared helper ───────────────────────────────────────────────────────
  function showSponsorAlert(msg, type) {
    const el = document.getElementById('sponsor-alert');
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.style.display = 'block';
  }
  function hideSponsorAlert() {
    document.getElementById('sponsor-alert').style.display = 'none';
  }
  function newIdempotencyKey() {
    try { return crypto.randomUUID(); } catch { return String(Date.now()) + '-' + Math.random().toString(36).slice(2); }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SPONSOR PURCHASE FLOW
  // ══════════════════════════════════════════════════════════════════════════

  let sponsorModal = null;

  document.getElementById('sponsor-cta-btn').addEventListener('click', openSponsorInfoModal);

  function openSponsorInfoModal() {
    sponsorModal = new Modal({
      title: 'Sponsor a Membership',
      size: 'md',
      closeOnBackdrop: true,
      content: `
        <div style="margin-bottom: 1.25rem; line-height: 1.7; color: rgb(var(--color-neutral-700));">
          <p>Dice Bastion and the Gibraltar Warhammer Club are funded primarily by our members, and so we kindly request that all those using the club on a regular basis become paying members. Despite that, we appreciate that not everyone has the same financial means.</p><br>
          <p>Because of that, we're letting those who can afford to give a bit more the option to purchase this 'sponsored membership' which will allow others to use the club at no extra cost.</p><br>
          <p>If you have any other ideas how we can continue to improve our club and make our community as inclusive as possible, please let us know at <a href="mailto:contact@dicebastion.com" class="modal-link">contact@dicebastion.com</a></p><br>
          <p><strong>Thank you for all your support!</strong></p>
        </div>
        <button id="sponsor-info-proceed" type="button" class="modal-btn modal-btn-primary">
          Continue to Checkout
        </button>
      `,
      onClose: () => { sponsorModal = null; }
    });
    sponsorModal.open();
    sponsorModal.querySelector('#sponsor-info-proceed').addEventListener('click', () => {
      sponsorModal.close();
      sponsorModal = null;
      openSponsorCheckoutModal();
    });
  }

  function openSponsorCheckoutModal() {
    const user = utils.session.getUser();
    const isLoggedIn = user && user.email;

    const guestForm = `
      <div id="sp-guest-step" style="display: ${isLoggedIn ? 'none' : 'block'};">
        <div class="modal-form-group">
          <label for="sp-name" class="modal-form-label">Full name</label>
          <input id="sp-name" type="text" placeholder="Your full name" class="modal-form-input">
        </div>
        <div class="modal-form-group">
          <label for="sp-email" class="modal-form-label">Email</label>
          <input id="sp-email" type="email" placeholder="you@example.com" class="modal-form-input">
        </div>
        <div class="modal-checkbox-group">
          <input id="sp-privacy" type="checkbox" class="modal-checkbox">
          <label for="sp-privacy" class="modal-checkbox-label">
            I agree to the <a href="/privacy-policy/" target="_blank" rel="noopener" class="modal-link">Privacy Policy</a>.
          </label>
        </div>
        <div class="modal-section">
          <div class="modal-help-text">Security check</div>
          <div id="sp-ts"></div>
        </div>
        <button id="sp-continue" type="button" class="modal-btn modal-btn-primary modal-section">Continue to Payment</button>
      </div>
    `;

    const loggedForm = `
      <div id="sp-logged-step" style="display: ${isLoggedIn ? 'block' : 'none'};">
        <div class="modal-info-box">
          <p style="margin: 0 0 4px 0; color: #666;">Purchasing as:</p>
          <p style="margin: 0; font-weight: 600;">${isLoggedIn ? user.email : ''}</p>
        </div>
        <div class="modal-section">
          <div class="modal-help-text">Security check</div>
          <div id="sp-ts-logged"></div>
        </div>
        <button id="sp-continue-logged" type="button" class="modal-btn modal-btn-primary modal-section">Continue to Payment</button>
        <div class="modal-section" style="text-align: center;">
          <button id="sp-use-different" type="button" class="modal-btn-secondary"
            style="background: none; border: none; color: #0066cc; text-decoration: underline; cursor: pointer; font-size: 0.9em;">
            Use a different email address
          </button>
        </div>
      </div>
    `;

    sponsorModal = new Modal({
      title: 'Sponsor a Membership – Checkout',
      size: 'md',
      closeOnBackdrop: false,
      content: `
        ${guestForm}
        ${loggedForm}
        <div id="sp-sumup-card" class="modal-widget-container"></div>
        <div id="sp-error" class="modal-error"></div>
      `,
      onClose: () => { sponsorModal = null; }
    });
    sponsorModal.open();

    // Render Turnstile
    if (isLoggedIn) {
      setTimeout(() => window.utils.renderTurnstile('sp-ts-logged', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST }), 100);
    } else {
      setTimeout(() => window.utils.renderTurnstile('sp-ts', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST }), 100);
    }

    // Wire up buttons
    const guestContinue  = sponsorModal.querySelector('#sp-continue');
    const loggedContinue = sponsorModal.querySelector('#sp-continue-logged');
    const useDiff        = sponsorModal.querySelector('#sp-use-different');

    if (guestContinue)  guestContinue.addEventListener('click',  handleSponsorGuestContinue);
    if (loggedContinue) loggedContinue.addEventListener('click', handleSponsorLoggedContinue);
    if (useDiff) {
      useDiff.addEventListener('click', () => {
        sponsorModal.querySelector('#sp-guest-step').style.display  = 'block';
        sponsorModal.querySelector('#sp-logged-step').style.display = 'none';
        setTimeout(() => window.utils.renderTurnstile('sp-ts', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST }), 100);
      });
    }
  }

  function showSponsorError(msg) {
    const el = sponsorModal && sponsorModal.querySelector('#sp-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }
  function clearSponsorError() {
    const el = sponsorModal && sponsorModal.querySelector('#sp-error');
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }

  async function handleSponsorGuestContinue() {
    const email   = (sponsorModal.querySelector('#sp-email')?.value || '').trim();
    const name    = (sponsorModal.querySelector('#sp-name')?.value  || '').trim();
    const consent = sponsorModal.querySelector('#sp-privacy')?.checked;
    if (!name)    { showSponsorError('Please enter your full name.'); return; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { showSponsorError('Please enter a valid email.'); return; }
    if (!consent) { showSponsorError('Please agree to the Privacy Policy.'); return; }
    const token = await window.utils.getTurnstileToken('sp-ts', null, IS_LOCALHOST);
    await doSponsorCheckout(email, name, consent, token);
  }

  async function handleSponsorLoggedContinue() {
    const user = utils.session.getUser();
    if (!user?.email) { showSponsorError('Session expired. Please refresh.'); return; }
    const token = await window.utils.getTurnstileToken('sp-ts-logged', null, IS_LOCALHOST);
    await doSponsorCheckout(user.email, user.name || '', true, token);
  }

  async function doSponsorCheckout(email, name, privacyConsent, turnstileToken) {
    try {
      clearSponsorError();
      const resp = await fetch(`${API_BASE}/membership/sponsor/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': newIdempotencyKey() },
        body: JSON.stringify({ email, name, privacyConsent, turnstileToken })
      });
      const data = await resp.json();
      if (!resp.ok) { showSponsorError(data.message || data.error || 'Checkout failed.'); return; }

      // Hide form steps, show SumUp widget
      const guestStep  = sponsorModal.querySelector('#sp-guest-step');
      const loggedStep = sponsorModal.querySelector('#sp-logged-step');
      const cardEl     = sponsorModal.querySelector('#sp-sumup-card');
      if (guestStep)  guestStep.style.display  = 'none';
      if (loggedStep) loggedStep.style.display = 'none';
      if (cardEl)     { cardEl.style.display = 'block'; cardEl.innerHTML = ''; }

      await window.utils.loadSumUpSdk();
      await SumUpCard.mount({
        id: 'sp-sumup-card',
        checkoutId: data.checkoutId,
        locale: 'en-GB',
        country: 'GB',
        onResponse: async (type) => {
          clearSponsorError();
          const t = String(type || '').toLowerCase();
          if (t === 'success') {
            await confirmSponsorOrder(data.orderRef);
          } else if (t === 'error' || t === 'fail') {
            showSponsorError('Payment failed. Please try again.');
          } else if (t === 'cancel') {
            showSponsorError('Payment cancelled.');
          }
        }
      });
    } catch (e) {
      console.error('[sponsor checkout]', e);
      showSponsorError('Could not start checkout. Please try again.');
    }
  }

  async function confirmSponsorOrder(orderRef) {
    await window.utils.pollPaymentConfirmation('/membership/sponsor/confirm', orderRef, {
      pollInterval: 3000,
      maxAttempts: 20,
      onSuccess: () => {
        if (sponsorModal) { sponsorModal.close(); sponsorModal = null; }
        showSponsorAlert('🎉 Thank you! Your sponsored membership has been added to the pool.', 'success');
        loadSponsorPool();
        window.scrollTo({ top: document.getElementById('sponsor-alert').offsetTop - 80, behavior: 'smooth' });
      },
      onError: (msg) => showSponsorError(msg),
      onTimeout: () => {
        if (sponsorModal) { sponsorModal.close(); sponsorModal = null; }
        showSponsorAlert('Your payment is being processed — we\'ll add the sponsorship to the pool shortly. Thank you!', 'info');
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SPONSORED MEMBERSHIP CLAIM FLOW
  // ══════════════════════════════════════════════════════════════════════════

  let claimModal = null;

  document.getElementById('sponsored-claim-btn').addEventListener('click', () => {
    // If pool is empty (or finished loading and is 0), show unavailability modal
    if (sponsorPoolCount !== null && sponsorPoolCount <= 0) {
      const noPoolModal = new Modal({
        title: 'No Sponsored Memberships Available',
        size: 'sm',
        closeOnBackdrop: true,
        content: `
          <div style="line-height: 1.7; color: rgb(var(--color-neutral-700));">
            <p>Unfortunately we don't have any sponsored memberships available at the moment.</p>
            <p>If you'd like access to club facilities please contact us at
               <a href="mailto:contact@dicebastion.com" class="modal-link">contact@dicebastion.com</a></p>
          </div>
        `
      });
      noPoolModal.open();
      return;
    }
    openClaimDisclaimerModal();
  });

  function openClaimDisclaimerModal() {
    claimModal = new Modal({
      title: 'Sponsored Membership',
      size: 'md',
      closeOnBackdrop: true,
      content: `
        <div style="margin-bottom: 1.25rem; line-height: 1.7; color: rgb(var(--color-neutral-700));">
          <p>Dice Bastion and the Gibraltar Warhammer Club are funded primarily by our members, and so we kindly request that all those using the club on a regular basis become paying members. Despite that, we appreciate that not everyone has the same financial means and these sponsored memberships have been provided by other members to ensure that everyone has a welcoming and inclusive space to play their favourite games.</p><br>
          <p>Your information will solely be shared with the GWC Committee for administrative purposes and this sponsored membership entitles you to all the standard benefits.</p><br>
          <p>If you ever need any support, please feel free to reach out to us confidentially at <a href="mailto:contact@dicebastion.com" class="modal-link">contact@dicebastion.com</a>.</p><br>
          <p><strong>Happy gaming!</strong></p>
        </div>
        <button id="claim-info-proceed" type="button" class="modal-btn modal-btn-primary">
          I understand – Claim my Membership
        </button>
      `,
      onClose: () => { claimModal = null; }
    });
    claimModal.open();
    claimModal.querySelector('#claim-info-proceed').addEventListener('click', () => {
      claimModal.close();
      claimModal = null;
      openClaimFormModal();
    });
  }

  function openClaimFormModal() {
    const user = utils.session.getUser();
    const isLoggedIn = user && user.email;

    const guestForm = `
      <div id="cl-guest-step" style="display: ${isLoggedIn ? 'none' : 'block'};">
        <div class="modal-form-group">
          <label for="cl-name" class="modal-form-label">Full name</label>
          <input id="cl-name" type="text" placeholder="Your full name" class="modal-form-input">
        </div>
        <div class="modal-form-group">
          <label for="cl-email" class="modal-form-label">Email</label>
          <input id="cl-email" type="email" placeholder="you@example.com" class="modal-form-input">
        </div>
        <div class="modal-checkbox-group">
          <input id="cl-privacy" type="checkbox" class="modal-checkbox">
          <label for="cl-privacy" class="modal-checkbox-label">
            I agree to the <a href="/privacy-policy/" target="_blank" rel="noopener" class="modal-link">Privacy Policy</a>.
          </label>
        </div>
        <div class="modal-section">
          <div class="modal-help-text">Security check</div>
          <div id="cl-ts"></div>
        </div>
        <button id="cl-continue" type="button" class="modal-btn modal-btn-primary modal-section">Claim Membership</button>
      </div>
    `;

    const loggedForm = `
      <div id="cl-logged-step" style="display: ${isLoggedIn ? 'block' : 'none'};">
        <div class="modal-info-box">
          <p style="margin: 0 0 4px 0; color: #666;">Claiming as:</p>
          <p style="margin: 0; font-weight: 600;">${isLoggedIn ? user.email : ''}</p>
        </div>
        <div class="modal-section">
          <div class="modal-help-text">Security check</div>
          <div id="cl-ts-logged"></div>
        </div>
        <button id="cl-continue-logged" type="button" class="modal-btn modal-btn-primary modal-section">Claim Membership</button>
        <div class="modal-section" style="text-align: center;">
          <button id="cl-use-different" type="button" class="modal-btn-secondary"
            style="background: none; border: none; color: #0066cc; text-decoration: underline; cursor: pointer; font-size: 0.9em;">
            Use a different email address
          </button>
        </div>
      </div>
    `;

    claimModal = new Modal({
      title: 'Claim your Sponsored Membership',
      size: 'md',
      closeOnBackdrop: false,
      content: `
        ${guestForm}
        ${loggedForm}
        <div id="cl-error" class="modal-error"></div>
      `,
      onClose: () => { claimModal = null; }
    });
    claimModal.open();

    // Render Turnstile
    if (isLoggedIn) {
      setTimeout(() => window.utils.renderTurnstile('cl-ts-logged', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST }), 100);
    } else {
      setTimeout(() => window.utils.renderTurnstile('cl-ts', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST }), 100);
    }

    const guestContinue  = claimModal.querySelector('#cl-continue');
    const loggedContinue = claimModal.querySelector('#cl-continue-logged');
    const useDiff        = claimModal.querySelector('#cl-use-different');

    if (guestContinue)  guestContinue.addEventListener('click',  handleClaimGuest);
    if (loggedContinue) loggedContinue.addEventListener('click', handleClaimLogged);
    if (useDiff) {
      useDiff.addEventListener('click', () => {
        claimModal.querySelector('#cl-guest-step').style.display  = 'block';
        claimModal.querySelector('#cl-logged-step').style.display = 'none';
        setTimeout(() => window.utils.renderTurnstile('cl-ts', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST }), 100);
      });
    }
  }

  function showClaimError(msg) {
    const el = claimModal && claimModal.querySelector('#cl-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }
  function clearClaimError() {
    const el = claimModal && claimModal.querySelector('#cl-error');
    if (el) { el.textContent = ''; el.style.display = 'none'; }
  }

  async function handleClaimGuest() {
    const email   = (claimModal.querySelector('#cl-email')?.value || '').trim();
    const name    = (claimModal.querySelector('#cl-name')?.value  || '').trim();
    const consent = claimModal.querySelector('#cl-privacy')?.checked;
    if (!name)    { showClaimError('Please enter your full name.'); return; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { showClaimError('Please enter a valid email.'); return; }
    if (!consent) { showClaimError('Please agree to the Privacy Policy.'); return; }
    const token = await window.utils.getTurnstileToken('cl-ts', null, IS_LOCALHOST);
    await doClaimMembership(email, name, consent, token);
  }

  async function handleClaimLogged() {
    const user = utils.session.getUser();
    if (!user?.email) { showClaimError('Session expired. Please refresh.'); return; }
    const token = await window.utils.getTurnstileToken('cl-ts-logged', null, IS_LOCALHOST);
    await doClaimMembership(user.email, user.name || '', true, token);
  }

  async function doClaimMembership(email, name, privacyConsent, turnstileToken) {
    try {
      clearClaimError();
      const btn = claimModal.querySelector('#cl-continue, #cl-continue-logged');
      if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }

      const resp = await fetch(`${API_BASE}/membership/sponsor/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, privacyConsent, turnstileToken })
      });
      const data = await resp.json();

      if (!resp.ok) {
        if (btn) { btn.disabled = false; btn.textContent = 'Claim Membership'; }
        const knownErrors = {
          already_member: 'You already have an active membership.',
          none_available: 'No sponsored memberships are currently available. Please check back later.',
          turnstile_failed: 'Security check failed. Please refresh and try again.'
        };
        showClaimError(knownErrors[data.error] || data.message || 'Something went wrong. Please try again.');
        return;
      }

      // Success!
      if (claimModal) { claimModal.close(); claimModal = null; }
      showSponsorAlert('🎉 Your sponsored quarterly membership has been activated! Check your email for confirmation.', 'success');
      loadSponsorPool();
      window.scrollTo({ top: document.getElementById('sponsor-alert').offsetTop - 80, behavior: 'smooth' });
    } catch (e) {
      console.error('[claim membership]', e);
      const btn = claimModal && claimModal.querySelector('#cl-continue, #cl-continue-logged');
      if (btn) { btn.disabled = false; btn.textContent = 'Claim Membership'; }
      showClaimError('Something went wrong. Please try again.');
    }
  }

})();
</script>


<script>
(function(){
  const API_BASE = utils.getApiBase();
  const TS_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k';
  
  // Detect if we're running on localhost
  const IS_LOCALHOST = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '0.0.0.0';

  const qs = new URLSearchParams(window.location.search);
  const orderRef = qs.get('orderRef');
  const plansGrid = document.getElementById('membership-plans') || document.querySelector('.plans-grid');

  let membershipModal = null;
  let pendingPlan = null;

  function formatDateOnly(iso){ try { const d=new Date(iso); return d.toLocaleDateString(); } catch { return iso; } }
  
  function showActiveGuard(endDate){
    Modal.alert({
      title: 'You\'re already a member',
      message: `Your membership is active until <strong>${formatDateOnly(endDate)}</strong>. You can renew when it expires.`,
      buttonText: 'OK'
    });
  }
  
  function getLoggedInUser() {
    return utils.session.getUser();
  }
  
  function clearError(){
    const err = membershipModal ? membershipModal.querySelector('#sumup-error') : null;
    if (err) { err.textContent = ''; err.style.display = 'none'; }
  }
  
  function showError(msg){
    const err = membershipModal ? membershipModal.querySelector('#sumup-error') : null;
    if (err) { err.textContent = msg || 'Payment error. Please try again.'; err.style.display = 'block'; }
  }
  
  function closeModal() {
    if (membershipModal) {
      const sumupCardEl = membershipModal.querySelector('#sumup-card');
      if (sumupCardEl) sumupCardEl.innerHTML = '';
      
      // Note: Turnstile cleanup happens automatically on next render via element replacement
      
      membershipModal.close();
      membershipModal = null;
    }
  }
  
  function openModal(){
    const user = getLoggedInUser();
    const isLoggedIn = user && user.email;
    
    // Build modal content based on login status
    const guestForm = `
      <div id="sumup-email-step" style="display: ${isLoggedIn ? 'none' : 'block'};">
        <div class="modal-form-group">
          <label for="modal-name" class="modal-form-label">Full name</label>
          <input id="modal-name" type="text" placeholder="Your full name" class="modal-form-input">
        </div>

        <div class="modal-form-group">
          <label for="modal-email" class="modal-form-label">Email</label>
          <input id="modal-email" type="email" placeholder="you@example.com" class="modal-form-input">
        </div>

        <div class="modal-checkbox-group">
          <input id="modal-privacy" type="checkbox" class="modal-checkbox">
          <label for="modal-privacy" class="modal-checkbox-label">
            I agree to the
            <a href="/privacy-policy/" target="_blank" rel="noopener" class="modal-link">Privacy Policy</a>.
          </label>
        </div>

        <div class="modal-info-box" style="font-size: 0.9em; color: #666;">
          <p style="margin: 0;">🔄 <strong>Auto-renewal is included</strong> — your membership will renew automatically so you never lose access. We'll email you 7 days before each renewal. You can cancel anytime from your <a href="/account/" class="modal-link">account page</a>.</p>
        </div>

        <div class="modal-section">
          <div class="modal-help-text">Security check</div>
          <div id="mship-ts" data-sitekey="0x4AAAAAACAB4xlOnW3S8K0k" data-size="flexible"></div>
        </div>

        <button id="modal-continue" type="button" class="modal-btn modal-btn-primary modal-section">Continue</button>
      </div>
    `;
    
    const loggedInForm = `
      <div id="sumup-logged-step" style="display: ${isLoggedIn ? 'block' : 'none'};">
        <div class="modal-info-box">
          <p style="margin: 0 0 8px 0; color: #666;">Purchasing membership as:</p>
          <p style="margin: 0; font-weight: 600; font-size: 1.05em;" id="modal-user-email">${isLoggedIn ? user.email : ''}</p>
        </div>
        
        <div class="modal-info-box" style="font-size: 0.9em; color: #666;">
          <p style="margin: 0;">🔄 <strong>Auto-renewal is included</strong> — your membership will renew automatically so you never lose access. We'll email you 7 days before each renewal. You can cancel anytime from your <a href="/account/" class="modal-link">account page</a>.</p>
        </div>

        <div class="modal-section">
          <div class="modal-help-text">Security check</div>
          <div id="mship-ts-logged" data-sitekey="0x4AAAAAACAB4xlOnW3S8K0k" data-size="flexible"></div>
        </div>

        <button id="modal-continue-logged" type="button" class="modal-btn modal-btn-primary modal-section">Continue to Payment</button>
        
        <div class="modal-section" style="text-align: center;">
          <button id="modal-use-different" type="button" class="modal-btn-secondary" style="background: none; border: none; color: #0066cc; text-decoration: underline; cursor: pointer; font-size: 0.9em;">
            Use a different email address
          </button>
        </div>
      </div>
    `;
    
    membershipModal = new Modal({
      title: 'Complete your membership',
      size: 'md',
      closeOnBackdrop: false,
      content: `
        ${guestForm}
        ${loggedInForm}
        <div id="sumup-card" class="modal-widget-container"></div>
        <div id="sumup-error" class="modal-error"></div>
      `,
      onClose: closeModal
    });
    
    membershipModal.open();
    
    // Render Turnstile programmatically (respects localhost skip)
    if (isLoggedIn) {
      setTimeout(() => {
        window.utils.renderTurnstile('mship-ts-logged', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST });
      }, 100);
    } else {
      setTimeout(() => {
        window.utils.renderTurnstile('mship-ts', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST });
      }, 100);
    }
    
    window.utils.loadTurnstileSdk().catch(()=>{});
    // Setup event listeners for guest flow
    const modalNameEl = membershipModal.querySelector('#modal-name');
    const modalEmailEl = membershipModal.querySelector('#modal-email');
    const privacyEl = membershipModal.querySelector('#modal-privacy');
    const modalContinueBtn = membershipModal.querySelector('#modal-continue');
    
    [modalNameEl, modalEmailEl, privacyEl].forEach(el=>{
      if(!el) return;
      const ev = el.type==='checkbox' ? 'change' : 'input';
      el.addEventListener(ev, clearError);
    });
    
    if (modalContinueBtn) modalContinueBtn.addEventListener('click', handleContinue);
    if (modalNameEl && !isLoggedIn) modalNameEl.focus();
    
    // Setup event listeners for logged-in flow
    const modalContinueLoggedBtn = membershipModal.querySelector('#modal-continue-logged');
    const useDifferentBtn = membershipModal.querySelector('#modal-use-different');
    
    if (modalContinueLoggedBtn) modalContinueLoggedBtn.addEventListener('click', handleContinueLogged);
    if (useDifferentBtn) {
      useDifferentBtn.addEventListener('click', () => {
        // Switch to guest flow
        const guestStep = membershipModal.querySelector('#sumup-email-step');
        const loggedStep = membershipModal.querySelector('#sumup-logged-step');
        if (guestStep) guestStep.style.display = 'block';
        if (loggedStep) loggedStep.style.display = 'none';
        
        // Render Turnstile for guest form
        setTimeout(() => {
          window.utils.renderTurnstile('mship-ts', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST });
        }, 100);
        
        if (modalNameEl) modalNameEl.focus();
      });
    }
  }

  async function getTurnstileToken(isLoggedIn){ 
    const elId = isLoggedIn ? 'mship-ts-logged' : 'mship-ts';
    return await window.utils.getTurnstileToken(elId, null, IS_LOCALHOST);
  }

  async function confirmOrder(ref, pollOptions = {}){ 
    console.log('[confirmOrder] Starting payment confirmation for orderRef:', ref);
    const result = await window.utils.pollPaymentConfirmation('/membership/confirm', ref, {
      pollInterval: pollOptions.pollInterval,
      maxAttempts: pollOptions.maxAttempts,
      onSuccess: (data) => {
        console.log('[confirmOrder] Payment confirmed successfully:', data);
        
        // Store in sessionStorage for thank-you page if account setup needed
        if (data.needsAccountSetup) {
          sessionStorage.setItem('pendingAccountSetup', JSON.stringify({
            email: data.userEmail,
            eventName: null,  // Not an event
            isMembership: true
          }));
        }
        
        // Log if email failed but still redirect - payment succeeded
        if (!data.emailSent) {
          console.warn('[Memberships] Payment succeeded but email failed. User:', data.userEmail);
        }
        
        // Redirect to thank-you page (even if email pending)
        const redirectUrl = '/thank-you?orderRef=' + encodeURIComponent(ref) + 
          (data.emailSent === false ? '&emailPending=1' : '');
        console.log('[confirmOrder] Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      },
      onError: (errorMsg) => {
        console.error('[confirmOrder] Payment failed:', errorMsg);
        showError(errorMsg);
      },
      onTimeout: () => {
        console.log('[confirmOrder] Payment polling timed out, redirecting with processing flag');
        // Payment is processing - webhook will complete it
        // Redirect to thank-you with processing flag
        window.location.href = '/thank-you?orderRef=' + encodeURIComponent(ref) + '&processing=1';
      }
    });
    
    console.log('[confirmOrder] Poll result:', result);
    return result !== null; 
  }

  async function checkActiveMembership(email){ 
    try { 
      const r = await fetch(`${API_BASE}/membership/status?email=${encodeURIComponent(email)}`); 
      const d = await r.json(); 
      if (d && d.active && d.endDate) {
        // Cache membership status for other pages
        utils.session.setMembershipStatus(d);
        return { active:true, endDate:d.endDate, plan:d.plan }; 
      } 
    } catch(_){} 
    utils.session.setMembershipStatus(null);
    return { active:false }; 
  }

  async function mountSumUpWidget(checkoutId, ref){
    try {
      clearError();
      const emailStepEl = membershipModal ? membershipModal.querySelector('#sumup-email-step') : null;
      const loggedStepEl = membershipModal ? membershipModal.querySelector('#sumup-logged-step') : null;
      const sumupCardEl = membershipModal ? membershipModal.querySelector('#sumup-card') : null;
      if (emailStepEl) emailStepEl.style.display = 'none';
      if (loggedStepEl) loggedStepEl.style.display = 'none';
      if (sumupCardEl) { sumupCardEl.style.display = 'block'; sumupCardEl.innerHTML = ''; }
      await window.utils.loadSumUpSdk();
      await SumUpCard.mount({
        id:'sumup-card',
        checkoutId,
        locale: 'en-GB',
        country: 'GB',
        onResponse: async (type)=>{
          clearError();
          const t = String(type||'').toLowerCase();
          if (t === 'success') {
            await confirmOrder(ref, { pollInterval: 3000, maxAttempts: 20 });
          } else if (t === 'error' || t === 'fail') {
            showError('Payment failed. Please try again.');
          } else if (t === 'cancel') {
            showError('Payment cancelled.');
          }
        }
      });
    } catch (e) { showError('Could not load payment widget.'); }
  }

  function newIdempotencyKey(){ try { return crypto.randomUUID(); } catch { return String(Date.now())+'-'+Math.random().toString(36).slice(2); } }

  async function startCheckout(plan, email, name, privacyConsent, autoRenew, isLoggedIn = false){ 
    try { 
      clearError(); 
      const token = await getTurnstileToken(isLoggedIn); 
      const resp = await fetch(`${API_BASE}/membership/checkout`, { 
        method:'POST', 
        headers:{ 
          'Content-Type':'application/json', 
          'Idempotency-Key': newIdempotencyKey() 
        }, 
        body: JSON.stringify({ email, name, plan, privacyConsent, autoRenew, turnstileToken: token }) 
      }); 
      const data = await resp.json(); 
      if(!resp.ok){ 
        const msg = data?.message || data?.error || 'Unknown error'; 
        showError(`Checkout failed: ${msg}`); 
        return; 
      } 
      if(data.checkoutId){ 
        await mountSumUpWidget(data.checkoutId, data.orderRef); 
        return; 
      } 
      showError('Failed to create in-page checkout.'); 
    } catch(e){ 
      showError('Checkout error.'); 
    } 
  }

  async function handleContinue(){
    const modalNameEl = membershipModal ? membershipModal.querySelector('#modal-name') : null;
    const modalEmailEl = membershipModal ? membershipModal.querySelector('#modal-email') : null;
    const privacyEl = membershipModal ? membershipModal.querySelector('#modal-privacy') : null;
    const email=(modalEmailEl&&modalEmailEl.value||'').trim();
    const name=(modalNameEl&&modalNameEl.value||'').trim();
    const consent=!!(privacyEl&&privacyEl.checked);
    const autoRenew = true; // Always enabled
    
    if(!name){ showError('Please enter your full name.'); return; }
    if(!email || !/^\S+@\S+\.\S+$/.test(email)){ showError('Please enter a valid email.'); return; }
    if(!consent){ showError('Please agree to the Privacy Policy to continue.'); return; }
    if(!pendingPlan){ showError('Please select a membership plan.'); return; }
    
    const status = await checkActiveMembership(email);
    if (status.active) { showActiveGuard(status.endDate); return; }
    
    clearError();
    await startCheckout(pendingPlan, email, name, consent, autoRenew, false);
  }
  
  async function handleContinueLogged(){
    const user = getLoggedInUser();
    if (!user || !user.email) {
      showError('Session expired. Please refresh and try again.');
      return;
    }
    
    const autoRenew = true; // Always enabled
    
    if(!pendingPlan){ showError('Please select a membership plan.'); return; }
    
    const status = await checkActiveMembership(user.email);
    if (status.active) { showActiveGuard(status.endDate); return; }
    
    clearError();
    // For logged-in users, privacy consent is implicitly agreed (they have an account)
    await startCheckout(pendingPlan, user.email, user.name || '', true, autoRenew, true);
  }

  plansGrid && plansGrid.addEventListener('click', (e)=>{ 
    const btn = e.target.closest('button.plan-cta[data-plan]'); 
    if(!btn) return; 
    pendingPlan = btn.dataset.plan; 
    const planName = btn.textContent || 'Membership';
    openModal(planName); 
  });

  async function populatePlans(){ try { const resp = await fetch(`${API_BASE}/membership/plans`); const data = await resp.json(); const plans=(data&&data.plans)||[]; const byCode=Object.fromEntries(plans.map(p=>[p.code,p])); const sym=c=>({GBP:'£',EUR:'€',USD:'$'})[String(c||'').toUpperCase()]||''; document.querySelectorAll('[data-price-for]').forEach(span=>{ const code=span.getAttribute('data-price-for'); const svc=byCode[code]; if(!svc) return; span.textContent = svc.amount || ''; const currencyEl = span.parentElement?.querySelector('.currency'); if(currencyEl && svc.currency) currencyEl.textContent = sym(svc.currency); }); } catch(e){} }

  (async()=>{ populatePlans(); if(orderRef){ await confirmOrder(orderRef); const url=new URL(window.location.href); url.searchParams.delete('orderRef'); window.history.replaceState({},'',url); } })();
})();
</script>
