---

title: Memberships
herostyle: "background"
showDate: false

---

<meta name="description" content="Become a member of Dice Bastion Gibraltar and enjoy local discounts, free venue access, and exclusive support for our board game, card game, RPG, and wargame events.">

Gibraltar Dice Bastion is completely funded by our members!

If you'd like to support us, free bookings for game tables, and a whole range of other benefits, please consider becoming a member!

  <!-- Pricing / Plans (revamped for better UX) -->
  <section id="membership-plans" style="max-width: 1100px; margin: 2rem auto; padding: 0 16px;">
    <header style="text-align:center; margin-bottom: 1rem;">
      <h2 style="margin:0; font-size:2rem;">Join Dice Bastion</h2>
      <p style="margin:0.5rem 0 0; color:#333;">Free table bookings, local discounts, and member-only perks. Choose a plan and get started in seconds.</p>
    </header>

  <div class="plans-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; align-items:stretch;">
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
      <li>Local discounts (Domino’s, Imperial Newsagents, Music Corner, Euphoria)</li>
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
      <li>~10% cheaper than paying quarterly</li>
    </ul>
    <button class="cta" data-plan="annual" style="margin-top:auto; padding:10px 12px; border:none; border-radius:8px; background: rgb(var(--color-primary-500)); color:#fff; font-weight:700; cursor:pointer;">
      Join Annual
    </button>
  </div>
</div>

<div style="display:flex; gap:12px; align-items:center; justify-content:center; margin-top:12px; color:#333;">
  <span style="font-size:0.95rem;">Secure checkout powered by SumUp</span>
  <span aria-hidden="true" style="width:6px; height:6px; background: rgb(var(--color-primary-500)); border-radius:50%; display:inline-block;"></span>
  <span style="font-size:0.95rem;">One-time payment — no auto-renew</span>
</div>

<!-- Simple footer with member login placeholder -->
<div id="membership-cta-footer" style="text-align:center; margin: 1.5rem auto;">
  <a href="#" style="color: rgb(var(--color-primary-600)); text-decoration: underline;">Already a member? Log in here.</a>
</div>
</section>

<!-- SumUp modal with email step -->
<div id="sumup-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; align-items:center; justify-content:center;">
  <div style="background:#fff; border-radius:12px; width:min(520px, 92vw); padding:16px; box-shadow:0 10px 30px rgba(0,0,0,0.35); position:relative;">
    <button id="sumup-close" type="button" aria-label="Close" style="position:absolute; right:8px; top:8px; background:transparent; border:none; font-size:20px; cursor:pointer;">×</button>
    <h3 style="margin:0 0 10px;">Complete your membership</h3>
    <div id="sumup-email-step" style="display:block;">
      <label for="modal-email" style="display:block; margin:8px 0 6px;">Email</label>
      <input id="modal-email" type="email" placeholder="you@example.com" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
      <button id="modal-continue" type="button" style="margin-top:10px; padding:10px 12px; border:none; border-radius:8px; background: rgb(var(--color-primary-500)); color:#fff; font-weight:700; cursor:pointer; width:100%;">Continue</button>
    </div>
    <div id="sumup-card" style="display:none; margin-top: 8px;"></div>
    <div id="sumup-error" style="display:none; margin-top: 8px; color: #b00020;"></div>
  </div>
</div>

<script>
(function(){
  const API_BASE = (window.__DB_API_BASE || 'https://dicebastion-memberships.ncalamaro.workers.dev').replace(/\/+$/,'');

  const qs = new URLSearchParams(window.location.search);
  const orderRef = qs.get('orderRef');
  const plansGrid = document.getElementById('membership-plans');

  const modalEl = document.getElementById('sumup-modal');
  const modalClose = document.getElementById('sumup-close');
  const emailStepEl = document.getElementById('sumup-email-step');
  const modalEmailEl = document.getElementById('modal-email');
  const modalContinueBtn = document.getElementById('modal-continue');
  const sumupCardEl = document.getElementById('sumup-card');
  const sumupErr = document.getElementById('sumup-error');

  let pendingPlan = null;

  function openModal(){ if (modalEl) modalEl.style.display = 'flex'; }
  function closeModal(){ if (modalEl) modalEl.style.display = 'none'; if (sumupCardEl) { sumupCardEl.innerHTML = ''; sumupCardEl.style.display='none'; } if (emailStepEl) emailStepEl.style.display='block'; if (sumupErr){ sumupErr.textContent=''; sumupErr.style.display='none'; } }
  modalClose && modalClose.addEventListener('click', closeModal);

  async function loadSumUpSdk(){
    if (window.SumUpCard) return true;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load SumUp SDK'));
      document.head.appendChild(script);
    });
  }

  function showError(msg){
    if (!sumupErr) return;
    sumupErr.textContent = msg || 'Payment error. Please try again.';
    sumupErr.style.display = 'block';
  }

  async function confirmOrder(ref){
    const maxAttempts = 15;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const resp = await fetch(`${API_BASE}/membership/confirm?orderRef=${encodeURIComponent(ref)}`, { credentials: 'omit' });
        const data = await resp.json();
        if (data.ok && data.status === 'active') {
          closeModal();
          return true;
        }
        if (data.status && String(data.status).toUpperCase() === 'PENDING') {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1500));
    }
    showError('Payment is still processing. Please refresh this page shortly.');
    return false;
  }

  async function mountSumUpWidget(checkoutId, ref){
    try {
      await loadSumUpSdk();
    } catch (e) {
      showError('Could not load payment widget.');
      return;
    }
    try {
      emailStepEl.style.display = 'none';
      sumupCardEl.style.display = 'block';
      sumupCardEl.innerHTML = '';
      window.SumUpCard.mount({
        id: 'sumup-card',
        checkoutId,
        onResponse: async function(type){
          if (type && String(type).toLowerCase() === 'success') {
            await confirmOrder(ref);
          } else {
            showError('Payment failed. Please check your details and try again.');
          }
        }
      });
    } catch (e) {
      showError('Could not start payment.');
    }
  }

  async function startCheckout(plan, email){
    try {
      const resp = await fetch(`${API_BASE}/membership/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan })
      });
      const data = await resp.json();
      if (!resp.ok) {
        const msg = data?.message || data?.error || 'Unknown error';
        showError(`Checkout failed: ${msg}`);
        return;
      }
      if (data.checkoutId) {
        await mountSumUpWidget(data.checkoutId, data.orderRef);
        return;
      }
      showError('Failed to create in-page checkout.');
    } catch (e) {
      showError('Checkout error.');
    }
  }

  // Handle clicks on plan CTAs: open modal, request email, then proceed
  plansGrid && plansGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('button.cta[data-plan]');
    if (!btn) return;
    pendingPlan = btn.dataset.plan;
    openModal();
    if (modalEmailEl) {
      modalEmailEl.focus();
    }
  });

  // Continue after entering email
  modalContinueBtn && modalContinueBtn.addEventListener('click', async () => {
    const email = (modalEmailEl && modalEmailEl.value || '').trim();
    if (!email) { showError('Please enter a valid email to continue.'); return; }
    await startCheckout(pendingPlan, email);
  });

  // Dynamic pricing: populate prices and CTA labels from /membership/plans
  async function populatePlans(){
    try {
      const resp = await fetch(`${API_BASE}/membership/plans`, { credentials: 'omit' });
      const data = await resp.json();
      const plans = (data && data.plans) || [];
      const byCode = Object.fromEntries(plans.map(p => [p.code, p]));
      const sym = c => ({ GBP:'£', EUR:'€', USD:'$' })[String(c||'').toUpperCase()] || '';
      document.querySelectorAll('[data-price-for]')
        .forEach(span => {
          const code = span.getAttribute('data-price-for');
          const svc = byCode[code];
          if (!svc) return;
          span.textContent = svc.amount || '';
          const currencyEl = span.parentElement?.querySelector('.currency');
          if (currencyEl && svc.currency) currencyEl.textContent = sym(svc.currency);
        });
    } catch (e) {}
  }

  (async () => {
    populatePlans();
    if (orderRef) {
      await confirmOrder(orderRef);
      const url = new URL(window.location.href);
      url.searchParams.delete('orderRef');
      window.history.replaceState({}, '', url);
    }
  })();
})();
</script>
