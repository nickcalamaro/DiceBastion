---
title: "Drinks"
description: "Purchase drinks at Dice Bastion"
showDate: false
showPagination: false
---

<script src="/js/utils.js?v=4"></script>
<script src="/js/modal.js"></script>

<section class="page-container">
  <div class="card-wide" style="margin-bottom:1.5rem;">
    {{< figure src="img/soft-drink.jpg" alt="Drinks at Dice Bastion" class="card-hero-img nozoom" >}}
  </div>
  <div id="menu-loading" style="text-align:center;padding:2rem;">Loading menu…</div>
  <div id="menu-content" style="display:none;">
    <div class="card card-wide">
      <h3 class="card-header" style="margin-bottom:1rem;">Quantity</h3>
      <div id="menu-items"></div>
      <div id="order-summary" class="card-section" style="display:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">Total</span>
          <span id="order-total" class="card-price-sm" style="margin:0;"></span>
        </div>
      </div>
      <button class="btn btn-primary btn-full" id="checkout-btn" disabled style="margin-top:1rem;">Checkout</button>
    </div>
    <div class="footer-info"><span>Secure checkout powered by SumUp</span></div>
  </div>
</section>

<script>
(function () {
  var API = utils.getApiBase();
  var products = [], modal = null, cart = {};
  var scaWatcher = null;
  var paymentConfirmed = false;

  function inCategory(product, name) {
    var wanted = String(name || '').trim().toLowerCase();
    if (!wanted) return false;
    return String((product && product.category) || '').split(',').some(function (part) {
      return part.trim().toLowerCase() === wanted;
    });
  }

  async function init() {
    try {
      var res = await fetch(API + '/products?category=drinks');
      var data = await res.json();
      products = Array.isArray(data) ? data.filter(function (p) { return inCategory(p, 'drinks'); }) : [];
      products.sort(function (a, b) { return b.name.localeCompare(a.name); });
    } catch (e) { products = []; }

    if (!products.length) {
      document.getElementById('menu-loading').textContent = 'No drinks available right now.';
      return;
    }
    document.getElementById('menu-loading').style.display = 'none';
    document.getElementById('menu-content').style.display = 'block';

    var container = document.getElementById('menu-items');
    products.forEach(function (p) {
      cart[p.id] = 0;
      var row = document.createElement('div');
      row.className = 'card-list-item';
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
      row.innerHTML =
        '<div>' +
          '<div class="card-title" style="margin:0;">' + utils.escapeHtml(p.name) + '</div>' +
          '<span class="card-price-suffix-sm">' + utils.formatPrice(p.price, p.currency) + ' each</span>' +
        '</div>' +
        '<div class="qty-control">' +
          '<button class="qty-btn" data-id="' + p.id + '" data-dir="-1">\u2212</button>' +
          '<span class="qty-value" id="qty-' + p.id + '">0</span>' +
          '<button class="qty-btn" data-id="' + p.id + '" data-dir="1">+</button>' +
        '</div>';
      container.appendChild(row);
    });
  }

  function getTotal() { return products.reduce(function (s, p) { return s + (cart[p.id] || 0) * p.price; }, 0); }

  function refresh() {
    products.forEach(function (p) { var e = document.getElementById('qty-' + p.id); if (e) e.textContent = cart[p.id] || 0; });
    var t = getTotal(), btn = document.getElementById('checkout-btn');
    document.getElementById('order-summary').style.display = t ? '' : 'none';
    document.getElementById('order-total').textContent = utils.formatPrice(t);
    btn.disabled = !t;
    btn.textContent = t ? 'Checkout \u00B7 ' + utils.formatPrice(t) : 'Checkout';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.qty-btn');
    if (!b) return;
    var pid = parseInt(b.dataset.id);
    if (!cart.hasOwnProperty(pid)) return;
    cart[pid] = Math.max(0, Math.min(10, cart[pid] + parseInt(b.dataset.dir)));
    refresh();
  });

  document.getElementById('checkout-btn').addEventListener('click', async function () {
    if (!getTotal()) return;
    modal = new Modal({
      title: 'Order \u00B7 ' + utils.formatPrice(getTotal()),
      size: 'md',
      closeOnBackdrop: false,
      content:
        '<div id="pay-widget" class="modal-widget-container"></div>' +
        '<div id="pay-error" class="modal-error"></div>' +
        '<p id="pay-sca-note" class="modal-muted-text" style="display:none; margin:0.75rem 0 0; padding:0.75rem 1rem; border-left:3px solid rgb(var(--color-primary-600)); background:rgba(var(--color-primary-50), 0.5);">Waiting for your bank to confirm the payment. Complete any verification shown above or in your banking app, and keep this window open.</p>' +
        (window.utils.paymentSupportNoteHtml ? window.utils.paymentSupportNoteHtml() : ''),
      onClose: function () {
        stopScaWatcher();
        if (modal) { var w = modal.querySelector('#pay-widget'); if (w) w.innerHTML = ''; modal = null; }
      }
    });
    modal.open();
    await handlePay();
  });

  function showErr(msg) { utils.showError('pay-error', msg || 'Payment error.'); }

  function setScaNote(visible) {
    var note = modal && modal.querySelector('#pay-sca-note');
    if (note) note.style.display = visible ? 'block' : 'none';
  }

  function stopScaWatcher() {
    var w = scaWatcher;
    scaWatcher = null;
    setScaNote(false);
    return w ? w.stop() : Promise.resolve();
  }

  function drinksThankYou(ref) {
    location.href = '/thank-you?orderRef=' + encodeURIComponent(ref) + '&type=drinks';
  }

  // The card widget often never reports the end of a bank check, so confirm on the server.
  function startScaWatcher(ref) {
    if (scaWatcher || paymentConfirmed) return;
    utils.hideError('pay-error');
    setScaNote(true);
    scaWatcher = window.utils.watchScaPayment('/orders/confirm', ref, {
      onPaid: function () {
        scaWatcher = null;
        paymentConfirmed = true;
        drinksThankYou(ref);
      },
      onFailed: function (msg) {
        scaWatcher = null;
        setScaNote(false);
        showErr(msg);
      }
    });
  }

  // A widget "fail" during bank verification is not final while SumUp is still pending.
  function settleWidgetOutcome(ref) {
    if (paymentConfirmed) return;
    fetch(API + '/orders/confirm?orderRef=' + encodeURIComponent(ref) + '&_=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (paymentConfirmed) return;
        if (data && data.ok && (data.status === 'active' || data.status === 'already_active')) {
          paymentConfirmed = true;
          drinksThankYou(ref);
          return;
        }
        var status = String((data && data.status) || '').toUpperCase();
        if (status === 'FAILED' || status === 'DECLINED') {
          showErr('Payment failed. Please try again.');
          return;
        }
        startScaWatcher(ref);
      })
      .catch(function () { startScaWatcher(ref); });
  }

  async function handlePay() {
    utils.hideError('pay-error');
    var items = products.filter(function (p) { return cart[p.id] > 0; }).map(function (p) { return { id: p.id, qty: cart[p.id] }; });
    try {
      var res = await fetch(API + '/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items })
      });
      var data = await res.json();
      if (!res.ok || !data.checkoutId) { showErr(data.error || 'Checkout failed.'); return; }
      await mountWidget(data.checkoutId, data.orderNumber);
    } catch (e) { showErr('Checkout error.'); }
  }

  async function mountWidget(checkoutId, ref) {
    try {
      paymentConfirmed = false;
      await stopScaWatcher();
      utils.hideError('pay-error');
      var widget = document.getElementById('pay-widget');
      if (widget) {
        widget.style.display = 'block';
        widget.innerHTML = '';
      }
      await window.utils.mountSumUpWidget({
        id: 'pay-widget',
        checkoutId: checkoutId,
        onResponse: function (type, body) {
          var t = String(type || '').toLowerCase();
          try {
            window.utils.logPaymentEvent({
              flow: 'drinks',
              type: t,
              orderRef: ref,
              checkoutId: checkoutId,
              message: (body && body.message) || null,
              sumupBody: body
            });
          } catch (err) {}
          if (paymentConfirmed) return;
          if (t === 'auth-screen' || t === 'sent') {
            startScaWatcher(ref);
            return;
          }
          utils.hideError('pay-error');
          if (t === 'success') {
            var bodyStatus = String((body && body.status) || '').toUpperCase();
            stopScaWatcher().then(function () {
              if (paymentConfirmed) return;
              if (bodyStatus === 'FAILED' || bodyStatus === 'DECLINED') {
                showErr((body && body.message) || 'Payment failed. Please try again.');
                return;
              }
              confirmOrder(ref);
            });
            return;
          }
          if (t === 'error' || t === 'fail') {
            stopScaWatcher().then(function () { settleWidgetOutcome(ref); });
            return;
          }
          if (t === 'cancel') {
            stopScaWatcher();
            showErr('Payment cancelled.');
          }
        }
      });
    } catch (e) { console.error('mountWidget error:', e); showErr('Could not load payment widget.'); }
  }

  async function confirmOrder(ref) {
    await utils.pollPaymentConfirmation('/orders/confirm', ref, {
      pollInterval: 3000,
      maxAttempts: 20,
      onSuccess: function () {
        paymentConfirmed = true;
        drinksThankYou(ref);
      },
      onError: function (msg) { showErr(msg); },
      onTimeout: function () { location.href = '/thank-you?orderRef=' + encodeURIComponent(ref) + '&type=drinks&processing=1'; }
    });
  }

  init();
})();
</script>
