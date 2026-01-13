---

title: Memberships
herostyle: "background"
showDate: false

---

<!-- Shared Utilities -->
<script src="/js/utils.js"></script>
<script src="/js/modal.js"></script>

<meta name="description" content="Become a member of Dice Bastion Gibraltar and enjoy local discounts, free venue access, and exclusive support for our board game, card game, RPG, and wargame events.">

<b>Gibraltar Dice Bastion is completely funded by our members!</b>

If you'd like to support us, get free bookings for game tables, and a whole range of other benefits, please consider becoming a member!

  <div class="plans-grid" id="membership-plans" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; align-items:stretch;">
  <!-- Monthly -->
  <div class="plan-card" data-plan="monthly" style="background:linear-gradient(180deg,#ffffff,#f9f9f9); border:1px solid #eaeaea; border-radius:12px; padding:18px; box-shadow:0 4px 14px rgba(0,0,0,0.06); display:flex; flex-direction:column;">
    <div style="font-weight:700; color: rgb(var(--color-primary-600)); font-size:0.85rem;">Most flexible</div>
    <h3 style="margin:6px 0 0; font-size:1.2rem;">Monthly</h3>
    <div style="margin:8px 0 12px; font-size:1.7rem; font-weight:800;">
      <span class="currency">£</span><span class="amount" data-price-for="monthly">10.00</span>
      <span style="font-size:0.9rem; color:#666; font-weight:500;">/month</span>
    </div>
    <ul style="list-style: none; padding:0; margin:0 0 12px; color:#333; line-height:1.5;">
      <li>Free access to table bookings</li>
      <li>Support our events and community</li>
    </ul>
    <button class="cta" data-plan="monthly" style="margin-top:auto; padding:10px 12px; border:none; border-radius:8px; background: rgb(var(--color-primary-500)); color:#fff; font-weight:700; cursor:pointer;">
      Join Monthly
    </button>
  </div>

  <!-- Quarterly (Most popular) -->
  <div class="plan-card" data-plan="quarterly" style="background:linear-gradient(180deg,#ffffff,#f9f9f9); border:2px solid rgb(var(--color-primary-500)); border-radius:12px; padding:18px; box-shadow:0 6px 16px rgba(0,0,0,0.08); position:relative; display:flex; flex-direction:column;">
    <div style="position:absolute; top:-10px; right:12px; background: rgb(var(--color-primary-500)); color:#fff; padding:4px 8px; border-radius:999px; font-size:0.8rem; font-weight:800;">Most popular</div>
    <h3 style="margin:6px 0 0; font-size:1.2rem;">Quarterly</h3>
    <div style="margin:8px 0 12px; font-size:1.7rem; font-weight:800;">
      <span class="currency">£</span><span class="amount" data-price-for="quarterly">25.00</span>
      <span style="font-size:0.9rem; color:#666; font-weight:500;">/quarter</span>
    </div>
    <ul style="list-style: none; padding:0; margin:0 0 12px; color:#333; line-height:1.5;">
      <li>Free table bookings</li>
      <li>Local discounts (Dominos, Imperial Newsagents, Music Corner, Euphoria)</li>
      <li>Discounts on club events</li>
      <li>Free drinks at selected events</li>
    </ul>
    <button class="cta" data-plan="quarterly" style="margin-top:auto; padding:10px 12px; border:none; border-radius:8px; background: rgb(var(--color-primary-500)); color:#fff; font-weight:700; cursor:pointer;">
      Join Quarterly
    </button>
  </div>

  <!-- Annual -->
  <div class="plan-card" data-plan="annual" style="background:linear-gradient(180deg,#ffffff,#f9f9f9); border:1px solid #eaeaea; border-radius:12px; padding:18px; box-shadow:0 4px 14px rgba(0,0,0,0.06); display:flex; flex-direction:column;">
    <div style="font-weight:700; color: rgb(var(--color-primary-600)); font-size:0.85rem;">Best value</div>
    <h3 style="margin:6px 0 0; font-size:1.2rem;">Annual</h3>
    <div style="margin:8px 0 12px; font-size:1.7rem; font-weight:800;">
      <span class="currency">£</span><span class="amount" data-price-for="annual">90.00</span>
      <span style="font-size:0.9rem; color:#666; font-weight:500;">/year</span>
    </div>
    <ul style="list-style: none; padding:0; margin:0 0 12px; color:#333; line-height:1.5;">
      <li>All quarterly benefits</li>
      <li>10% cheaper than paying quarterly</li>
    </ul>
    <button class="cta" data-plan="annual" style="margin-top:auto; padding:10px 12px; border:none; border-radius:8px; background: rgb(var(--color-primary-500)); color:#fff; font-weight:700; cursor:pointer;">
      Join Annual
    </button>
  </div>
</div>

<div style="display:flex; gap:12px; align-items:center; justify-content:center; margin-top:12px; color:#333;">
  <span style="font-size:0.95rem;">Secure checkout powered by SumUp</span>
  <span aria-hidden="true" style="width:6px; height:6px; background: rgb(var(--color-primary-500)); border-radius:50%; display:inline-block;"></span>
  <span style="font-size:0.95rem;">Auto-renewal is optional</span>
</div>

<!-- Simple footer with member login placeholder -->
<div id="membership-cta-footer" style="text-align:center; margin: 1.5rem auto;">
  <a href="/login" style="color: rgb(var(--color-primary-600)); text-decoration: underline;">Already a member? Log in here.</a>
</div>
</section>

<!-- Modals are now created programmatically using Modal component -->

<script>
(function(){
  const API_BASE = utils.getApiBase();
  const TS_SITE_KEY = (window.__DB_TS_SITE_KEY || '{{ with site.Params.turnstile_site_key }}{{ . }}{{ end }}' || (window.TURNSTILE_SITE_KEY || '0x4AAAAAACAB4xlOnW3S8K0k'));
  
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
  
  function clearError(){
    const err = membershipModal ? membershipModal.querySelector('#sumup-error') : null;
    if (err) { err.textContent = ''; err.style.display = 'none'; }
  }
  
  function showError(msg){
    const err = membershipModal ? membershipModal.querySelector('#sumup-error') : null;
    if (err) { err.textContent = msg || 'Payment error. Please try again.'; err.style.display = 'block'; }
  }
  
  function openModal(){
    membershipModal = new Modal({
      title: 'Complete your membership',
      size: 'md',
      closeOnBackdrop: false,
      content: `
        <div id="sumup-email-step">
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
            <div id="mship-ts" class="cf-turnstile" data-sitekey="0x4AAAAAACAB4xlOnW3S8K0k" data-size="flexible"></div>
          </div>

          <button id="modal-continue" type="button" class="modal-btn modal-btn-primary modal-section">Continue</button>
        </div>
        <div id="sumup-card" class="modal-widget-container"></div>
        <div id="sumup-error" class="modal-error"></div>
      `,
      onClose: () => {
        const sumupCardEl = membershipModal ? membershipModal.querySelector('#sumup-card') : null;
        if (sumupCardEl) sumupCardEl.innerHTML = '';
        if (window.turnstile) { try { window.turnstile.reset('#mship-ts'); } catch(_){} }
      }
    });
    
    membershipModal.open();
    loadTurnstileSdk().catch(()=>{});
    
    // Setup event listeners
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
    if (modalNameEl) modalNameEl.focus();
  }
  
  function closeModal(){
    if (membershipModal) {
      membershipModal.close();
      membershipModal = null;
    }
  }

  function showError(msg){ 
    const sumupErr = membershipModal ? membershipModal.querySelector('#sumup-err') : null;
    if (!sumupErr) return; 
    sumupErr.textContent = msg || 'Payment error. Please try again.'; 
    sumupErr.style.display='block'; 
  }

  function clearError(){ 
    const sumupErr = membershipModal ? membershipModal.querySelector('#sumup-err') : null;
    if (!sumupErr) return; 
    sumupErr.style.display = 'none'; 
  }

  async function loadSumUpSdk(){ if (window.SumUpCard) return true; return new Promise((resolve,reject)=>{ const s=document.createElement('script'); s.src='https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js'; s.async=true; s.onload=()=>resolve(true); s.onerror=()=>reject(new Error('Failed to load SumUp SDK')); document.head.appendChild(s); }); }
  
  function loadTurnstileSdk(){ if (IS_LOCALHOST || window.turnstile) return Promise.resolve(true); return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async=true; s.defer=true; s.onload=()=>res(true); s.onerror=()=>rej(new Error('Turnstile load failed')); document.head.appendChild(s); }); }
  
  async function getTurnstileToken(){ if (IS_LOCALHOST) { console.log('Localhost detected - using test-bypass token'); return 'test-bypass'; } await loadTurnstileSdk(); const el = membershipModal ? membershipModal.querySelector('#mship-ts') : document.getElementById('mship-ts'); if (!el || !window.turnstile) throw new Error('Security check not ready'); const t = window.turnstile.getResponse(el); if (!t) throw new Error('Please complete the security check.'); return t; }

  async function confirmOrder(ref){ const maxAttempts=200; for(let i=0;i<maxAttempts;i++){ try { const r=await fetch(`${API_BASE}/membership/confirm?orderRef=${encodeURIComponent(ref)}`); const d=await r.json(); if(d.ok && d.status==='active'){ closeModal(); return true; } if(d.status && String(d.status).toUpperCase()==='PENDING'){ await new Promise(r=>setTimeout(r,1500)); continue; } } catch(e){} await new Promise(r=>setTimeout(r,1500)); } showError('Payment is still processing. Please refresh shortly.'); return false; }

  async function checkActiveMembership(email){ try { const r = await fetch(`${API_BASE}/membership/status?email=${encodeURIComponent(email)}`); const d = await r.json(); if (d && d.active && d.endDate) { return { active:true, endDate:d.endDate, plan:d.plan }; } } catch(_){} return { active:false }; }

  async function mountSumUpWidget(checkoutId, ref){
    try { await loadSumUpSdk(); } catch(e){ showError('Could not load payment widget.'); return; }
    try {
      clearError();
      const emailStepEl = membershipModal ? membershipModal.querySelector('#sumup-email-step') : null;
      const sumupCardEl = membershipModal ? membershipModal.querySelector('#sumup-card') : null;
      if (emailStepEl) emailStepEl.style.display = 'none';
      if (sumupCardEl) { sumupCardEl.style.display = 'block'; sumupCardEl.innerHTML = ''; }
      window.SumUpCard.mount({
        id:'sumup-card',
        checkoutId,
        onResponse: async (type)=>{
          const t = String(type||'').toLowerCase();
          try {
            const ok = await confirmOrder(ref);
            if (ok) return;
          } catch(_) {}
          if (t === 'success') return;
          showError('Payment is processing. If you were charged, it will confirm shortly.');
        }
      });
    } catch (e) { showError('Could not start payment.'); }
  }

  function newIdempotencyKey(){ try { return crypto.randomUUID(); } catch { return String(Date.now())+'-'+Math.random().toString(36).slice(2); } }

  async function startCheckout(plan, email, name, privacyConsent, autoRenew){ try { clearError(); const token = await getTurnstileToken(); const resp = await fetch(`${API_BASE}/membership/checkout`, { method:'POST', headers:{ 'Content-Type':'application/json', 'Idempotency-Key': newIdempotencyKey() }, body: JSON.stringify({ email, name, plan, privacyConsent, autoRenew, turnstileToken: token }) }); const data = await resp.json(); if(!resp.ok){ const msg = data?.message || data?.error || 'Unknown error'; showError(`Checkout failed: ${msg}`); return; } if(data.checkoutId){ await mountSumUpWidget(data.checkoutId, data.orderRef); return; } showError('Failed to create in-page checkout.'); } catch(e){ showError('Checkout error.'); } }

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
    await startCheckout(pendingPlan,email,name,consent,autoRenew);
  }

  plansGrid && plansGrid.addEventListener('click', (e)=>{ 
    const btn = e.target.closest('button.cta[data-plan]'); 
    if(!btn) return; 
    pendingPlan = btn.dataset.plan; 
    const planName = btn.textContent || 'Membership';
    openModal(planName); 
  });

  async function populatePlans(){ try { const resp = await fetch(`${API_BASE}/membership/plans`); const data = await resp.json(); const plans=(data&&data.plans)||[]; const byCode=Object.fromEntries(plans.map(p=>[p.code,p])); const sym=c=>({GBP:'£',EUR:'€',USD:'$'})[String(c||'').toUpperCase()]||''; document.querySelectorAll('[data-price-for]').forEach(span=>{ const code=span.getAttribute('data-price-for'); const svc=byCode[code]; if(!svc) return; span.textContent = svc.amount || ''; const currencyEl = span.parentElement?.querySelector('.currency'); if(currencyEl && svc.currency) currencyEl.textContent = sym(svc.currency); }); } catch(e){} }

  (async()=>{ populatePlans(); if(orderRef){ await confirmOrder(orderRef); const url=new URL(window.location.href); url.searchParams.delete('orderRef'); window.history.replaceState({},'',url); } })();
})();
</script>
