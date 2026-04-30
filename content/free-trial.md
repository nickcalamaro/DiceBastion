---

title: Free Trial
herostyle: "background"
showDate: false
showPagination: false

---

<!-- Shared Utilities -->
<script src="/js/utils.js"></script>
<script src="/js/modal.js"></script>

<!-- Component Styles -->
<link rel="stylesheet" href="/css/forms.css">
<style>
#trial-plans .plan-cta {
  background: #2ac754 !important;
  color: #ffffff;
}
#trial-plans .plan-cta:hover {
  background: #00dd00 !important;
}
#trial-plans .plan-label {
  color: #2ac754 !important;
}
#trial-plans .plan-badge {
  background: #2ac754 !important;
  color: #ffffff;
}

</style>

<meta name="description" content="Gibraltar Dice Bastion is part of the Gibraltar Warhammer Club, and we’re completely funded by our members!">

<b>Gibraltar Dice Bastion is part of the Gibraltar Warhammer Club, and we’re completely funded by our members!</b>

If you're not sure whether you're ready to support us just yet, we offer a one-month free trial. Your card will be saved but won't be charged until your trial ends. We'll send you a reminder 2 days before.

<b>Choose the plan you'd like to continue with after your trial:</b>

  <div class="plans-grid" id="trial-plans">
  <!-- Monthly -->
  <div class="plan-card" data-plan="monthly">
    <div class="plan-label">Most flexible</div>
    <h3 class="plan-name">Monthly</h3>
    <div class="plan-price">
      <span class="currency">£</span><span class="amount" data-price-for="monthly">10.00</span>
      <span class="plan-price-period">/month</span>
    </div>
    <ul class="plan-features">
      <li>1 month free, then billed monthly</li>
      <li>Free access to table bookings</li>
      <li>Support our events and community</li>
    </ul>
    <button class="plan-cta" data-plan="monthly">
      Start Free Trial
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
      <li>1 month free, then billed quarterly</li>
      <li>Free table bookings</li>
      <li>Local discounts (Dominos, Imperial Newsagents, Music Corner, Euphoria)</li>
      <li>Discounts on club events</li>
      <li>Free drinks at selected events</li>
    </ul>
    <button class="plan-cta" data-plan="quarterly">
      Start Free Trial
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
      <li>1 month free, then billed annually</li>
      <li>All quarterly benefits</li>
      <li>10% cheaper than paying quarterly</li>
    </ul>
    <button class="plan-cta" data-plan="annual">
      Start Free Trial
    </button>
  </div>

</div>

<div class="footer-info">
  <span>Secure card verification powered by SumUp</span>
  <span class="footer-divider" aria-hidden="true"></span>
  <span>No charge during trial · Cancel anytime</span>
</div>

<div id="membership-cta-footer" class="text-center" style="margin: 1.5rem auto;">
  <a href="/memberships" class="link">Want to skip the trial? Purchase a membership directly.</a>
  <br>
  <a href="/login" class="link" style="margin-top: 0.5rem; display: inline-block;">Already a member? Log in here.</a>
</div>
</section>


<script>
(function() {
  const API_BASE = utils.getApiBase();
  const TS_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k';
  const IS_LOCALHOST = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '0.0.0.0';

  const plansGrid = document.getElementById('trial-plans');
  let pendingPlan = null;
  let trialModal = null;
  const orderRef = new URLSearchParams(window.location.search).get('orderRef');

  function getLoggedInUser() {
    return utils.session.getUser();
  }

  function clearError(){
    const err = trialModal ? trialModal.querySelector('#sumup-error') : null;
    if (err) { err.textContent = ''; err.style.display = 'none'; }
  }

  function showError(msg){
    const err = trialModal ? trialModal.querySelector('#sumup-error') : null;
    if (err) { err.textContent = msg || 'An error occurred. Please try again.'; err.style.display = 'block'; }
  }

  function closeModal() {
    if (trialModal) {
      const sumupCardEl = trialModal.querySelector('#sumup-card');
      if (sumupCardEl) sumupCardEl.innerHTML = '';
      trialModal.close();
      trialModal = null;
    }
  }

  function openModal(){
    const user = getLoggedInUser();
    const isLoggedIn = user && user.email;

    const planName = pendingPlan ? pendingPlan.charAt(0).toUpperCase() + pendingPlan.slice(1) : 'Membership';

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
          <p style="margin: 0;"><strong>How the free trial works:</strong> Your card will be verified but <strong>not charged</strong> during the 1-month trial. After the trial, your ${planName} membership will begin and renew automatically. We'll email you 2 days before your first charge. You can cancel anytime from your <a href="/account/" class="modal-link">account page</a>.</p>
        </div>

        <div class="modal-section">
          <div class="modal-help-text">Security check</div>
          <div id="trial-ts" data-sitekey="0x4AAAAAACAB4xlOnW3S8K0k" data-size="flexible"></div>
        </div>

        <button id="modal-continue" type="button" class="modal-btn modal-btn-primary modal-section">Continue</button>
      </div>
    `;

    const loggedInForm = `
      <div id="sumup-logged-step" style="display: ${isLoggedIn ? 'block' : 'none'};">
        <div class="modal-info-box">
          <p style="margin: 0 0 8px 0; color: #666;">Starting free trial as:</p>
          <p style="margin: 0; font-weight: 600; font-size: 1.05em;" id="modal-user-email">${isLoggedIn ? user.email : ''}</p>
        </div>

        <div class="modal-info-box" style="font-size: 0.9em; color: #666;">
          <p style="margin: 0;"><strong>How the free trial works:</strong> Your card will be verified but <strong>not charged</strong> during the 1-month trial. After the trial, your ${planName} membership will begin and renew automatically. We'll email you 2 days before your first charge. You can cancel anytime from your <a href="/account/" class="modal-link">account page</a>.</p>
        </div>

        <div class="modal-section">
          <div class="modal-help-text">Security check</div>
          <div id="trial-ts-logged" data-sitekey="0x4AAAAAACAB4xlOnW3S8K0k" data-size="flexible"></div>
        </div>

        <button id="modal-continue-logged" type="button" class="modal-btn modal-btn-primary modal-section">Continue to Card Verification</button>

        <div class="modal-section" style="text-align: center;">
          <button id="modal-use-different" type="button" class="modal-btn-secondary" style="background: none; border: none; color: #0066cc; text-decoration: underline; cursor: pointer; font-size: 0.9em;">
            Use a different email address
          </button>
        </div>
      </div>
    `;

    trialModal = new Modal({
      title: 'Start your free trial',
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

    trialModal.open();

    if (isLoggedIn) {
      setTimeout(() => {
        window.utils.renderTurnstile('trial-ts-logged', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST });
      }, 100);
    } else {
      setTimeout(() => {
        window.utils.renderTurnstile('trial-ts', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST });
      }, 100);
    }

    window.utils.loadTurnstileSdk().catch(()=>{});

    const modalNameEl = trialModal.querySelector('#modal-name');
    const modalEmailEl = trialModal.querySelector('#modal-email');
    const privacyEl = trialModal.querySelector('#modal-privacy');
    const modalContinueBtn = trialModal.querySelector('#modal-continue');

    [modalNameEl, modalEmailEl, privacyEl].forEach(el=>{
      if(!el) return;
      const ev = el.type==='checkbox' ? 'change' : 'input';
      el.addEventListener(ev, clearError);
    });

    if (modalContinueBtn) modalContinueBtn.addEventListener('click', handleContinue);
    if (modalNameEl && !isLoggedIn) modalNameEl.focus();

    const modalContinueLoggedBtn = trialModal.querySelector('#modal-continue-logged');
    const useDifferentBtn = trialModal.querySelector('#modal-use-different');

    if (modalContinueLoggedBtn) modalContinueLoggedBtn.addEventListener('click', handleContinueLogged);
    if (useDifferentBtn) {
      useDifferentBtn.addEventListener('click', () => {
        const guestStep = trialModal.querySelector('#sumup-email-step');
        const loggedStep = trialModal.querySelector('#sumup-logged-step');
        if (guestStep) guestStep.style.display = 'block';
        if (loggedStep) loggedStep.style.display = 'none';
        setTimeout(() => {
          window.utils.renderTurnstile('trial-ts', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST });
        }, 100);
        if (modalNameEl) modalNameEl.focus();
      });
    }
  }

  async function getTurnstileToken(isLoggedIn){
    const elId = isLoggedIn ? 'trial-ts-logged' : 'trial-ts';
    return await window.utils.getTurnstileToken(elId, null, IS_LOCALHOST);
  }

  async function confirmOrder(ref, pollOptions = {}){
    const result = await window.utils.pollPaymentConfirmation('/membership/free-trial/confirm', ref, {
      pollInterval: pollOptions.pollInterval,
      maxAttempts: pollOptions.maxAttempts,
      onSuccess: (data) => {
        if (data.needsAccountSetup) {
          sessionStorage.setItem('pendingAccountSetup', JSON.stringify({
            email: data.userEmail,
            eventName: null,
            isMembership: true
          }));
        }
        const redirectUrl = '/thank-you?orderRef=' + encodeURIComponent(ref) +
          '&trial=1' +
          (data.emailSent === false ? '&emailPending=1' : '');
        window.location.href = redirectUrl;
      },
      onError: (errorMsg) => {
        showError(errorMsg);
      },
      onTimeout: () => {
        window.location.href = '/thank-you?orderRef=' + encodeURIComponent(ref) + '&trial=1&processing=1';
      }
    });
    return result !== null;
  }

  async function checkActiveMembership(email){
    try {
      const r = await fetch(`${API_BASE}/membership/status?email=${encodeURIComponent(email)}`);
      const d = await r.json();
      if (d && d.active && d.endDate) {
        utils.session.setMembershipStatus(d);
        return { active:true, endDate:d.endDate, plan:d.plan };
      }
    } catch(_){}
    utils.session.setMembershipStatus(null);
    return { active:false };
  }

  function showActiveGuard(endDate) {
    showError(`You already have an active membership (valid until ${new Date(endDate).toLocaleDateString('en-GB')}). Visit your account page to manage your membership.`);
  }

  async function mountSumUpWidget(checkoutId, ref){
    try {
      clearError();
      const emailStepEl = trialModal ? trialModal.querySelector('#sumup-email-step') : null;
      const loggedStepEl = trialModal ? trialModal.querySelector('#sumup-logged-step') : null;
      const sumupCardEl = trialModal ? trialModal.querySelector('#sumup-card') : null;
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
            if (sumupCardEl) {
              sumupCardEl.innerHTML = `
                <div style="text-align:center; padding: 2rem 1rem;">
                  <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">✅</div>
                  <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Card Verified Successfully!</div>
                  <div style="color: #666; font-size: 0.9rem;">Setting up your free trial…</div>
                  <div class="spinner" style="border: 3px solid rgba(128,128,128,0.2); border-left-color: rgb(var(--color-primary-500)); border-radius: 50%; width: 28px; height: 28px; animation: spin 1s linear infinite; margin: 1rem auto 0;"></div>
                </div>
              `;
            }
            await confirmOrder(ref, { pollInterval: 3000, maxAttempts: 20 });
          } else if (t === 'error' || t === 'fail') {
            showError('Card verification failed. Please try again.');
          } else if (t === 'cancel') {
            showError('Card verification cancelled.');
          }
        }
      });
    } catch (e) { showError('Could not load card verification widget.'); }
  }

  function newIdempotencyKey(){ try { return crypto.randomUUID(); } catch { return String(Date.now())+'-'+Math.random().toString(36).slice(2); } }

  async function startCheckout(plan, email, name, privacyConsent, isLoggedIn = false){
    try {
      clearError();
      const token = await getTurnstileToken(isLoggedIn);
      const resp = await fetch(`${API_BASE}/membership/free-trial/checkout`, {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Idempotency-Key': newIdempotencyKey()
        },
        body: JSON.stringify({ email, name, plan, privacyConsent, turnstileToken: token })
      });
      const data = await resp.json();
      if(!resp.ok){
        const msg = data?.message || data?.error || 'Unknown error';
        showError(msg);
        return;
      }
      if(data.checkoutId){
        await mountSumUpWidget(data.checkoutId, data.orderRef);
        return;
      }
      showError('Failed to start card verification.');
    } catch(e){
      showError('An error occurred. Please try again.');
    }
  }

  async function handleContinue(){
    const modalNameEl = trialModal ? trialModal.querySelector('#modal-name') : null;
    const modalEmailEl = trialModal ? trialModal.querySelector('#modal-email') : null;
    const privacyEl = trialModal ? trialModal.querySelector('#modal-privacy') : null;
    const email=(modalEmailEl&&modalEmailEl.value||'').trim();
    const name=(modalNameEl&&modalNameEl.value||'').trim();
    const consent=!!(privacyEl&&privacyEl.checked);

    if(!name){ showError('Please enter your full name.'); return; }
    if(!email || !/^\S+@\S+\.\S+$/.test(email)){ showError('Please enter a valid email.'); return; }
    if(!consent){ showError('Please agree to the Privacy Policy to continue.'); return; }
    if(!pendingPlan){ showError('Please select a membership plan.'); return; }

    const status = await checkActiveMembership(email);
    if (status.active) { showActiveGuard(status.endDate); return; }

    clearError();
    await startCheckout(pendingPlan, email, name, consent, false);
  }

  async function handleContinueLogged(){
    const user = getLoggedInUser();
    if (!user || !user.email) {
      showError('Session expired. Please refresh and try again.');
      return;
    }

    if(!pendingPlan){ showError('Please select a membership plan.'); return; }

    const status = await checkActiveMembership(user.email);
    if (status.active) { showActiveGuard(status.endDate); return; }

    clearError();
    await startCheckout(pendingPlan, user.email, user.name || '', true, true);
  }

  plansGrid && plansGrid.addEventListener('click', (e)=>{
    const btn = e.target.closest('button.plan-cta[data-plan]');
    if(!btn) return;
    pendingPlan = btn.dataset.plan;
    openModal();
  });

  async function populatePlans(){ try { const resp = await fetch(`${API_BASE}/membership/plans`); const data = await resp.json(); const plans=(data&&data.plans)||[]; const byCode=Object.fromEntries(plans.map(p=>[p.code,p])); const sym=c=>({GBP:'£',EUR:'€',USD:'$'})[String(c||'').toUpperCase()]||''; document.querySelectorAll('[data-price-for]').forEach(span=>{ const code=span.getAttribute('data-price-for'); const svc=byCode[code]; if(!svc) return; span.textContent = svc.amount || ''; const currencyEl = span.parentElement?.querySelector('.currency'); if(currencyEl && svc.currency) currencyEl.textContent = sym(svc.currency); }); } catch(e){} }

  (async()=>{ populatePlans(); if(orderRef){ await confirmOrder(orderRef); const url=new URL(window.location.href); url.searchParams.delete('orderRef'); window.history.replaceState({},'',url); } })();
})();
</script>
