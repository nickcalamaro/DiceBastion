---

title: Memberships
herostyle: "background"
showDate: false

---

<!-- Shared Utilities -->
<script src="/js/utils.js"></script>
<script src="/js/modal.js"></script>

<!-- Component Styles -->
<link rel="stylesheet" href="/css/components.css">

<meta name="description" content="Become a member of Dice Bastion Gibraltar and enjoy local discounts, free venue access, and exclusive support for our board game, card game, RPG, and wargame events.">

<b>Gibraltar Dice Bastion is completely funded by our members!</b>

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

<div class="footer-info">
  <span>Secure checkout powered by SumUp</span>
  <span class="footer-divider" aria-hidden="true"></span>
  <span>Auto-renewal is optional</span>
</div>

<!-- Simple footer with member login placeholder -->
<div id="membership-cta-footer" class="text-center" style="margin: 1.5rem auto;">
  <a href="/login" class="link">Already a member? Log in here.</a>
</div>
</section>

<!-- Modals are now created programmatically using Modal component -->

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
      
      // Clean up Turnstile widgets using shared utility
      window.utils.cleanupTurnstile(null, 'mship-ts');
      window.utils.cleanupTurnstile(null, 'mship-ts-logged');
      
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

        <div class="modal-checkbox-group">
          <input id="modal-auto-renew" type="checkbox" class="modal-checkbox">
          <label for="modal-auto-renew" class="modal-checkbox-label">
            Enable auto-renewal (saves your payment method for automatic renewal before expiry)
          </label>
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
        
        <div class="modal-checkbox-group">
          <input id="modal-auto-renew-logged" type="checkbox" class="modal-checkbox">
          <label for="modal-auto-renew-logged" class="modal-checkbox-label">
            Enable auto-renewal (saves your payment method for automatic renewal before expiry)
          </label>
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
    const autoRenewEl = membershipModal.querySelector('#modal-auto-renew');
    const modalContinueBtn = membershipModal.querySelector('#modal-continue');
    
    [modalNameEl, modalEmailEl, privacyEl, autoRenewEl].forEach(el=>{
      if(!el) return;
      const ev = el.type==='checkbox' ? 'change' : 'input';
      el.addEventListener(ev, clearError);
    });
    
    if (modalContinueBtn) modalContinueBtn.addEventListener('click', handleContinue);
    if (modalNameEl && !isLoggedIn) modalNameEl.focus();
    
    // Setup event listeners for logged-in flow
    const autoRenewLoggedEl = membershipModal.querySelector('#modal-auto-renew-logged');
    const modalContinueLoggedBtn = membershipModal.querySelector('#modal-continue-logged');
    const useDifferentBtn = membershipModal.querySelector('#modal-use-different');
    
    if (autoRenewLoggedEl) autoRenewLoggedEl.addEventListener('change', clearError);
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
    const result = await window.utils.pollPaymentConfirmation('/membership/confirm', ref, {
      pollInterval: pollOptions.pollInterval,
      maxAttempts: pollOptions.maxAttempts,
      onSuccess: (data) => {
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
        window.location.href = '/thank-you?orderRef=' + encodeURIComponent(ref) + 
          (data.emailSent === false ? '&emailPending=1' : '');
      },
      onError: (errorMsg) => {
        showError(errorMsg);
      },
      onTimeout: () => {
        // Payment is processing - webhook will complete it
        // Redirect to thank-you with processing flag
        window.location.href = '/thank-you?orderRef=' + encodeURIComponent(ref) + '&processing=1';
      }
    });
    
    return result !== null; 
  }

  async function checkActiveMembership(email){ 
    try { 
      const r = await fetch(`${API_BASE}/membership/status?email=${encodeURIComponent(email)}`); 
      const d = await r.json(); 
      if (d && d.active && d.endDate) { 
        return { active:true, endDate:d.endDate, plan:d.plan }; 
      } 
    } catch(_){} 
    return { active:false }; 
  }

  async function mountSumUpWidget(checkoutId, ref){
    try { await window.utils.loadSumUpSdk(); } catch(e){ showError('Could not load payment widget.'); return; }
    try {
      clearError();
      const emailStepEl = membershipModal ? membershipModal.querySelector('#sumup-email-step') : null;
      const loggedStepEl = membershipModal ? membershipModal.querySelector('#sumup-logged-step') : null;
      const sumupCardEl = membershipModal ? membershipModal.querySelector('#sumup-card') : null;
      if (emailStepEl) emailStepEl.style.display = 'none';
      if (loggedStepEl) loggedStepEl.style.display = 'none';
      if (sumupCardEl) { sumupCardEl.style.display = 'block'; sumupCardEl.innerHTML = ''; }
      window.SumUpCard.mount({
        id:'sumup-card',
        checkoutId,
        onResponse: async (type)=>{
          const t = String(type||'').toLowerCase();
          if (t === 'success') {
            // Payment succeeded - use reduced polling (3s intervals, 20 attempts = 1 min)
            await confirmOrder(ref, { pollInterval: 3000, maxAttempts: 20 });
          } else if (t === 'error' || t === 'fail') {
            showError('Payment failed. Please try again.');
          } else if (t === 'cancel') {
            showError('Payment cancelled.');
          }
        }
      });
    } catch (e) { showError('Could not start payment.'); }
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
    const autoRenewEl = membershipModal ? membershipModal.querySelector('#modal-auto-renew') : null;
    
    const email=(modalEmailEl&&modalEmailEl.value||'').trim();
    const name=(modalNameEl&&modalNameEl.value||'').trim();
    const consent=!!(privacyEl&&privacyEl.checked);
    const autoRenew=!!(autoRenewEl&&autoRenewEl.checked);
    
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
    
    const autoRenewLoggedEl = membershipModal ? membershipModal.querySelector('#modal-auto-renew-logged') : null;
    const autoRenew = !!(autoRenewLoggedEl && autoRenewLoggedEl.checked);
    
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
