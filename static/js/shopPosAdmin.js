/**
 * Admin shop POS: record cash / bank-transfer sales and list recent orders.
 */
(function (global) {
  let productsCache = [];
  let lines = [];
  let lineSeq = 1;

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatGbp(pence) {
    const n = (Number(pence) || 0) / 100;
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
  }

  function formatWhen(iso) {
    const d = new Date(String(iso || '').includes('T') || String(iso || '').includes(' ')
      ? String(iso).replace(' ', 'T')
      : iso);
    if (Number.isNaN(d.getTime())) return String(iso || '').slice(0, 16);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function methodLabel(method, channel) {
    const m = String(method || '').toLowerCase();
    if (m === 'cash') return 'Cash';
    if (m === 'bank_transfer') return 'Bank transfer';
    if (m === 'sumup') return channel === 'pos' ? 'SumUp (POS)' : 'SumUp';
    return m || '—';
  }

  function channelLabel(channel) {
    if (channel === 'pos') return 'POS';
    if (channel === 'online') return 'Online';
    return channel || '—';
  }

  function listedProducts() {
    return productsCache.filter(function (p) {
      return Number(p.is_active) === 1 && (p.catalog_status || 'listed') !== 'archived';
    });
  }

  function renderProductOptions(selectedId) {
    const opts = ['<option value="">Select product…</option>'];
    listedProducts().forEach(function (p) {
      const stock = Number(p.stock_quantity) || 0;
      const sel = Number(selectedId) === Number(p.id) ? ' selected' : '';
      opts.push(
        '<option value="' + p.id + '"' + sel + '>' +
        escapeHtml(p.name) + ' — ' + formatGbp(p.price) + ' (' + stock + ' in stock)' +
        '</option>'
      );
    });
    return opts.join('');
  }

  function lineTotalPence(line) {
    const qty = Math.max(0, parseInt(line.quantity, 10) || 0);
    const unit = Math.max(0, parseInt(line.unit_price_pence, 10) || 0);
    return qty * unit;
  }

  function cartTotalPence() {
    return lines.reduce(function (sum, line) { return sum + lineTotalPence(line); }, 0);
  }

  function renderLines() {
    const wrap = document.getElementById('pos-lines');
    const totalEl = document.getElementById('pos-cart-total');
    if (!wrap) return;

    if (!lines.length) {
      wrap.innerHTML = '<p class="admin-text-muted">No lines yet. Add a product below.</p>';
      if (totalEl) totalEl.textContent = formatGbp(0);
      return;
    }

    wrap.innerHTML = lines.map(function (line) {
      return (
        '<div class="admin-flex admin-mb-1" style="flex-wrap: wrap; align-items: end; gap: 0.75rem;" data-line-id="' + line.id + '">' +
          '<div style="flex: 2; min-width: 180px;">' +
            '<label class="form-label">Product</label>' +
            '<select class="form-select pos-product" data-line-id="' + line.id + '">' +
              renderProductOptions(line.product_id) +
            '</select>' +
          '</div>' +
          '<div style="width: 5rem;">' +
            '<label class="form-label">Qty</label>' +
            '<input type="number" class="form-input pos-qty" data-line-id="' + line.id + '" min="1" max="999" value="' + escapeHtml(line.quantity) + '">' +
          '</div>' +
          '<div style="width: 7rem;">' +
            '<label class="form-label">Unit (£)</label>' +
            '<input type="number" class="form-input pos-unit" data-line-id="' + line.id + '" min="0" step="0.01" value="' + (Number(line.unit_price_pence) / 100).toFixed(2) + '">' +
          '</div>' +
          '<div style="min-width: 5rem;">' +
            '<label class="form-label">Line</label>' +
            '<div class="admin-text-small" style="padding: 0.6rem 0;">' + formatGbp(lineTotalPence(line)) + '</div>' +
          '</div>' +
          '<div>' +
            '<button type="button" class="btn btn-secondary pos-remove" data-line-id="' + line.id + '">Remove</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    if (totalEl) totalEl.textContent = formatGbp(cartTotalPence());
  }

  function findLine(id) {
    return lines.find(function (l) { return String(l.id) === String(id); });
  }

  function onProductChange(lineId, productId) {
    const line = findLine(lineId);
    if (!line) return;
    const product = productsCache.find(function (p) { return Number(p.id) === Number(productId); });
    line.product_id = productId ? Number(productId) : null;
    if (product) {
      line.unit_price_pence = Number(product.price) || 0;
      line.catalogue_price_pence = Number(product.price) || 0;
    }
    renderLines();
  }

  function bindLineEvents() {
    const wrap = document.getElementById('pos-lines');
    if (!wrap || wrap._posBound) return;
    wrap._posBound = true;
    wrap.addEventListener('change', function (e) {
      const t = e.target;
      const lineId = t.getAttribute('data-line-id');
      if (!lineId) return;
      if (t.classList.contains('pos-product')) {
        onProductChange(lineId, t.value);
      }
    });
    wrap.addEventListener('input', function (e) {
      const t = e.target;
      const lineId = t.getAttribute('data-line-id');
      if (!lineId) return;
      const line = findLine(lineId);
      if (!line) return;
      if (t.classList.contains('pos-qty')) {
        line.quantity = Math.max(1, parseInt(t.value, 10) || 1);
      }
      if (t.classList.contains('pos-unit')) {
        const pounds = parseFloat(t.value);
        line.unit_price_pence = Number.isFinite(pounds) ? Math.round(pounds * 100) : 0;
      }
      const totalEl = document.getElementById('pos-cart-total');
      if (totalEl) totalEl.textContent = formatGbp(cartTotalPence());
      const row = t.closest('[data-line-id]');
      if (row) {
        const lineLabel = row.querySelector('.admin-text-small');
        if (lineLabel) lineLabel.textContent = formatGbp(lineTotalPence(line));
      }
    });
    wrap.addEventListener('click', function (e) {
      const btn = e.target.closest('.pos-remove');
      if (!btn) return;
      const lineId = btn.getAttribute('data-line-id');
      lines = lines.filter(function (l) { return String(l.id) !== String(lineId); });
      renderLines();
    });
  }

  function addLine() {
    lines.push({
      id: lineSeq++,
      product_id: null,
      quantity: 1,
      unit_price_pence: 0,
      catalogue_price_pence: 0
    });
    renderLines();
  }

  function setStatus(msg, isError) {
    const el = document.getElementById('pos-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? 'rgb(var(--color-primary-700))' : 'rgb(var(--color-neutral-600))';
  }

  async function loadProducts(apiBase, sessionToken) {
    const res = await fetch(apiBase + '/admin/products', {
      headers: { 'X-Session-Token': sessionToken }
    });
    if (!res.ok) throw new Error('Failed to load products');
    const data = await res.json();
    productsCache = data.products || data || [];
    if (!Array.isArray(productsCache)) productsCache = [];
  }

  function renderOrders(orders) {
    const list = document.getElementById('orders-list');
    if (!list) return;
    if (!orders.length) {
      list.innerHTML = '<p class="admin-text-muted">No orders yet.</p>';
      return;
    }
    list.innerHTML = (
      '<div class="table-wrapper"><div style="overflow-x: auto;"><table>' +
      '<thead><tr>' +
      '<th>When</th><th>Order</th><th>Customer</th><th>Channel</th><th>Method</th><th>Items</th><th style="text-align:right;">Total</th>' +
      '</tr></thead><tbody>' +
      orders.map(function (o) {
        const items = (o.items || []).map(function (it) {
          return escapeHtml(it.product_name) + ' ×' + escapeHtml(it.quantity);
        }).join('; ') || '—';
        return (
          '<tr>' +
          '<td>' + escapeHtml(formatWhen(o.completed_at || o.created_at)) + '</td>' +
          '<td><code>' + escapeHtml(o.order_number) + '</code></td>' +
          '<td>' + escapeHtml(o.name || '') + '<br><span class="admin-text-muted admin-text-small">' + escapeHtml(o.email || '') + '</span></td>' +
          '<td>' + escapeHtml(channelLabel(o.sale_channel)) + '</td>' +
          '<td>' + escapeHtml(methodLabel(o.payment_method, o.sale_channel)) + '</td>' +
          '<td class="admin-text-small">' + items + '</td>' +
          '<td style="text-align:right;">' + formatGbp(o.total) + '</td>' +
          '</tr>'
        );
      }).join('') +
      '</tbody></table></div></div>'
    );
  }

  async function loadOrders(apiBase, sessionToken) {
    const list = document.getElementById('orders-list');
    if (list) list.innerHTML = '<p class="admin-text-muted">Loading orders…</p>';
    const res = await fetch(apiBase + '/admin/orders?limit=50', {
      headers: { 'X-Session-Token': sessionToken }
    });
    if (!res.ok) throw new Error('Failed to load orders');
    const data = await res.json();
    renderOrders(data.orders || []);
  }

  async function submitSale(apiBase, sessionToken) {
    const paymentMethod = document.getElementById('pos-payment-method')?.value;
    const name = document.getElementById('pos-customer-name')?.value?.trim() || '';
    const email = document.getElementById('pos-customer-email')?.value?.trim() || '';
    const notes = document.getElementById('pos-notes')?.value?.trim() || '';

    if (paymentMethod !== 'cash' && paymentMethod !== 'bank_transfer') {
      setStatus('Choose cash or bank transfer.', true);
      return;
    }

    const payloadItems = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.product_id) {
        setStatus('Each line needs a product.', true);
        return;
      }
      const qty = parseInt(line.quantity, 10) || 0;
      if (qty < 1) {
        setStatus('Quantity must be at least 1.', true);
        return;
      }
      payloadItems.push({
        product_id: line.product_id,
        quantity: qty,
        unit_price_pence: Math.max(0, parseInt(line.unit_price_pence, 10) || 0)
      });
    }
    if (!payloadItems.length) {
      setStatus('Add at least one product line.', true);
      return;
    }

    const btn = document.getElementById('pos-submit-btn');
    if (btn) btn.disabled = true;
    setStatus('Recording sale…');

    try {
      const res = await fetch(apiBase + '/admin/shop/pos-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          name: name || undefined,
          email: email || undefined,
          notes: notes || undefined,
          items: payloadItems
        })
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        const msg = data.message || data.error || res.statusText;
        setStatus('Sale failed: ' + msg, true);
        return;
      }
      setStatus('Sale recorded: ' + (data.order_number || 'ok'));
      lines = [];
      renderLines();
      const nameEl = document.getElementById('pos-customer-name');
      const emailEl = document.getElementById('pos-customer-email');
      const notesEl = document.getElementById('pos-notes');
      if (nameEl) nameEl.value = '';
      if (emailEl) emailEl.value = '';
      if (notesEl) notesEl.value = '';
      await loadProducts(apiBase, sessionToken);
      await loadOrders(apiBase, sessionToken);
    } catch (err) {
      setStatus('Sale failed: ' + String(err.message || err), true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function init(apiBase, sessionToken) {
    bindLineEvents();
    const addBtn = document.getElementById('pos-add-line-btn');
    const submitBtn = document.getElementById('pos-submit-btn');
    if (addBtn && !addBtn._posBound) {
      addBtn._posBound = true;
      addBtn.addEventListener('click', function () { addLine(); });
    }
    if (submitBtn && !submitBtn._posBound) {
      submitBtn._posBound = true;
      submitBtn.addEventListener('click', function () { submitSale(apiBase, sessionToken); });
    }
    setStatus('Loading products…');
    try {
      await loadProducts(apiBase, sessionToken);
      if (!lines.length) addLine();
      else renderLines();
      setStatus('');
    } catch (err) {
      setStatus('Could not load products: ' + String(err.message || err), true);
    }
    try {
      await loadOrders(apiBase, sessionToken);
    } catch (err) {
      const list = document.getElementById('orders-list');
      if (list) list.innerHTML = '<p class="admin-text-muted">Could not load orders.</p>';
    }
  }

  global.ShopPosAdmin = {
    init: init,
    loadOrders: loadOrders,
    refresh: init
  };
})(typeof window !== 'undefined' ? window : globalThis);
