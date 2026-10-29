/**
 * Finance tab: supplier invoice PDF import → editable preview → stock import session.
 */
(function (global) {
  const MISTRAL_KEY_STORAGE = 'dicebastion_mistral_api_key';
  const DEFAULT_MULTIPLIER = 1.3;

  let rows = [];
  let productByEan = {};
  let busy = false;

  function el(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return window.utils.escapeHtml(s);
  }

  function parseEuAmount(raw) {
    if (raw == null || raw === '') return null;
    let s = String(raw).trim().replace(/\u00a0/g, ' ').replace(/€/g, '').trim();
    if (!s) return null;
    if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.includes(',')) s = s.replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  function retailPricePence(unitNet, multiplier) {
    const m = Number(multiplier);
    if (!Number.isFinite(m) || m <= 0) return null;
    const u = parseEuAmount(unitNet);
    if (u == null) return null;
    return Math.ceil(u * m) * 100;
  }

  function unitCostPence(unitNet) {
    const u = parseEuAmount(unitNet);
    if (u == null) return null;
    return Math.round(u * 100);
  }

  function normalizeEan(e) {
    return String(e || '').replace(/\D/g, '');
  }

  function suggestCategoryFromName(name) {
    const n = String(name || '').trim()
    if (!n) return ''
    const beforeDash = n.split(/\s[-–—]\s/)[0].trim()
    if (beforeDash && beforeDash.length < 40) return beforeDash
    return ''
  }

  function getMistralKey() {
    return String(sessionStorage.getItem(MISTRAL_KEY_STORAGE) || '').trim();
  }

  async function api(path, options) {
    return window.utils.adminFetchJson(path, options || {});
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('Could not read file.')); };
      reader.readAsDataURL(file);
    });
  }

  function setStatus(msg, kind) {
    const node = el('invoice-import-status');
    if (!node) return;
    node.style.display = msg ? 'block' : 'none';
    node.textContent = msg || '';
    const colors = {
      info: { bg: 'rgba(var(--color-primary-50), 0.5)', color: 'rgb(var(--color-neutral-800))' },
      ok: { bg: '#ecfdf5', color: '#065f46' },
      warn: { bg: '#fffbeb', color: '#92400e' },
      err: { bg: '#fee2e2', color: '#991b1b' }
    };
    const c = colors[kind] || colors.info;
    node.style.background = c.bg;
    node.style.color = c.color;
  }

  function appendLog(line) {
    const log = el('invoice-import-log');
    if (!log) return;
    const p = document.createElement('p');
    p.className = 'admin-text-small';
    p.style.margin = '0.25rem 0';
    p.textContent = line;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }

  function multiplierValue() {
    const raw = el('invoice-import-multiplier') && el('invoice-import-multiplier').value;
    const n = parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_MULTIPLIER;
  }

  function indexProducts(list) {
    productByEan = {};
    (list || []).forEach(function (p) {
      const e = normalizeEan(p.ean);
      if (e) productByEan[e] = p;
    });
  }

  function buildRowsFromParse(data) {
    const mult = multiplierValue();
    return (data.lines || []).map(function (line, idx) {
      const ean = normalizeEan(line.ean);
      const existing = ean ? productByEan[ean] : null;
      const listed = existing && (existing.catalog_status || 'listed') === 'listed' && Number(existing.is_active) === 1;
      const unit = line.unit_net_price;
      return {
        id: idx,
        include: true,
        name: String(line.name || '').trim(),
        ean: ean,
        sku: line.sku ? String(line.sku).trim() : '',
        quantity: parseInt(line.quantity, 10) || 0,
        unit_net: unit,
        unit_cost_pence: unitCostPence(unit),
        price_pence: retailPricePence(unit, mult),
        category: suggestCategoryFromName(line.name),
        source_image_url: '',
        image_url: '',
        image_pending: false,
        existing_listed: !!listed,
        existing_product_id: existing ? existing.id : null,
        override_listing: false,
        notes: []
      };
    });
  }

  function recalcPrices() {
    const mult = multiplierValue();
    rows.forEach(function (r) {
      if (!r.existing_listed || r.override_listing) {
        r.price_pence = retailPricePence(r.unit_net, mult);
      }
      r.unit_cost_pence = unitCostPence(r.unit_net);
    });
  }

  function renderPreview() {
    const host = el('invoice-import-preview');
    const importBtn = el('invoice-import-commit');
    if (!host) return;

    recalcPrices();
    const included = rows.filter(function (r) { return r.include; });

    if (!rows.length) {
      host.innerHTML = '<p class="admin-text-muted">Upload a PDF and parse to see line items.</p>';
      if (importBtn) importBtn.disabled = true;
      return;
    }

    const body = rows.map(function (r) {
      const thumb = r.image_url
        ? '<img src="' + esc(r.image_url) + '" alt="" style="width:48px;height:48px;object-fit:contain;background:#fff;border-radius:4px;">'
        : (r.source_image_url
          ? '<span class="admin-text-small">Source set</span>'
          : '<span class="admin-text-muted">—</span>');
      const readOnly = r.existing_listed && !r.override_listing;
      const nameCell = readOnly
        ? esc(r.name) + ' <span class="admin-text-small">(existing)</span>'
        : '<input type="text" class="form-input invoice-import-name" data-id="' + r.id + '" value="' + esc(r.name) + '" style="min-width:12rem;">';
      const pricePounds = r.price_pence != null ? (r.price_pence / 100).toFixed(2) : '';
      const priceCell = readOnly
        ? '£' + esc(pricePounds)
        : '<input type="number" min="0" step="0.01" class="form-input invoice-import-price" data-id="' + r.id + '" value="' + esc(pricePounds) + '" style="width:5rem;">';
      const costPounds = r.unit_cost_pence != null ? (r.unit_cost_pence / 100).toFixed(2) : '';
      return (
        '<tr data-row="' + r.id + '">' +
        '<td style="padding:0.35rem;"><input type="checkbox" class="invoice-import-include" data-id="' + r.id + '"' + (r.include ? ' checked' : '') + '></td>' +
        '<td style="padding:0.35rem;">' + thumb + '</td>' +
        '<td style="padding:0.35rem;">' + nameCell +
          '<div class="admin-text-small">EAN ' + esc(r.ean || '—') + ' · SKU ' + esc(r.sku || '—') + '</div>' +
          (r.existing_listed ? '<label class="admin-text-small"><input type="checkbox" class="invoice-import-override" data-id="' + r.id + '"' + (r.override_listing ? ' checked' : '') + '> Override listing fields</label>' : '') +
        '</td>' +
        '<td style="padding:0.35rem;"><input type="number" min="1" class="form-input invoice-import-qty" data-id="' + r.id + '" value="' + esc(r.quantity) + '" style="width:4rem;"></td>' +
        '<td style="padding:0.35rem;"><input type="number" min="0" step="0.01" class="form-input invoice-import-cost" data-id="' + r.id + '" value="' + esc(costPounds) + '" style="width:5rem;"></td>' +
        '<td style="padding:0.35rem;">' + priceCell + '</td>' +
        '<td style="padding:0.35rem;"><input type="text" class="form-input invoice-import-category" data-id="' + r.id + '" value="' + esc(r.category) + '" style="min-width:8rem;"></td>' +
        '<td style="padding:0.35rem;"><input type="url" class="form-input invoice-import-img-src" data-id="' + r.id + '" value="' + esc(r.source_image_url) + '" placeholder="Image URL" style="min-width:10rem;"></td>' +
        '<td style="padding:0.35rem;" class="admin-text-small">' + esc(r.notes.join('; ') || (r.image_pending ? 'Processing…' : 'Ready')) + '</td>' +
        '</tr>'
      );
    }).join('');

    host.innerHTML =
      '<p class="admin-text-muted" style="margin:0 0 0.75rem;">' +
      rows.length + ' line(s) · ' + included.length + ' selected for import</p>' +
      '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.875rem;">' +
      '<thead><tr style="text-align:left;border-bottom:2px solid rgb(var(--color-neutral-300));">' +
      '<th style="padding:0.35rem;">Inc</th><th style="padding:0.35rem;">Img</th><th style="padding:0.35rem;">Product</th>' +
      '<th style="padding:0.35rem;">Qty</th><th style="padding:0.35rem;">Cost ea</th><th style="padding:0.35rem;">Sell</th>' +
      '<th style="padding:0.35rem;">Category</th><th style="padding:0.35rem;">Image URL</th><th style="padding:0.35rem;">Notes</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table></div>';

    const valid = included.filter(function (r) {
      return r.quantity > 0 && r.unit_cost_pence != null &&
        (!r.existing_listed || r.existing_product_id) &&
        (r.existing_listed || (r.price_pence > 0 && r.image_url));
    });

    if (importBtn) {
      importBtn.disabled = busy || valid.length === 0 || !String(el('invoice-import-supplier') && el('invoice-import-supplier').value || '').trim();
      importBtn.textContent = valid.length
        ? 'Import ' + valid.length + ' item' + (valid.length === 1 ? '' : 's')
        : 'Import items';
    }
  }

  function rowById(id) {
    return rows.find(function (r) { return Number(r.id) === Number(id); });
  }

  function bindPreviewEvents() {
    const host = el('invoice-import-preview');
    if (!host || host._invoiceImportBound) return;
    host._invoiceImportBound = true;
    host.addEventListener('change', function (e) {
      const t = e.target;
      const id = t.getAttribute('data-id');
      if (!id) return;
      const row = rowById(id);
      if (!row) return;
      if (t.classList.contains('invoice-import-include')) row.include = t.checked;
      if (t.classList.contains('invoice-import-override')) {
        row.override_listing = t.checked;
        renderPreview();
        return;
      }
      if (t.classList.contains('invoice-import-name')) row.name = t.value;
      if (t.classList.contains('invoice-import-qty')) row.quantity = parseInt(t.value, 10) || 0;
      if (t.classList.contains('invoice-import-cost')) {
        const p = parseFloat(t.value);
        row.unit_cost_pence = Number.isFinite(p) ? Math.round(p * 100) : null;
        row.unit_net = Number.isFinite(p) ? p : row.unit_net;
      }
      if (t.classList.contains('invoice-import-price')) {
        const p = parseFloat(t.value);
        row.price_pence = Number.isFinite(p) ? Math.round(p * 100) : null;
      }
      if (t.classList.contains('invoice-import-category')) row.category = t.value;
      if (t.classList.contains('invoice-import-img-src')) {
        row.source_image_url = t.value.trim();
        row.image_url = '';
      }
      renderPreview();
    });
  }

  async function loadProductsForMatch() {
    try {
      const list = await api('/admin/products');
      indexProducts(Array.isArray(list) ? list : []);
    } catch (_) {
      indexProducts([]);
    }
  }

  async function parseInvoice() {
    setStatus('Preparing invoice…', 'info');
    const fileInput = el('invoice-import-pdf');
    const file = fileInput && fileInput.files && fileInput.files[0];
    if (!file) {
      setStatus('Choose a PDF invoice first.', 'warn');
      return;
    }
    const mistralKey = getMistralKey();
    if (!mistralKey) {
      setStatus('Save your Mistral API key first (required for OCR).', 'warn');
      return;
    }
    busy = true;
    setStatus('Running Mistral OCR…', 'info');
    el('invoice-import-log').innerHTML = '';
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await loadProductsForMatch();
      const data = await api('/admin/invoice-import/parse', {
        method: 'POST',
        body: JSON.stringify({ pdf_base64: dataUrl, mistral_api_key: mistralKey })
      });
      if (data.supplier_name && el('invoice-import-supplier') && !el('invoice-import-supplier').value.trim()) {
        el('invoice-import-supplier').value = data.supplier_name;
      }
      if (data.invoice_reference && el('invoice-import-reference') && !el('invoice-import-reference').value.trim()) {
        el('invoice-import-reference').value = data.invoice_reference;
      }
      if (data.invoice_date && el('invoice-import-received-date') && !el('invoice-import-received-date').value) {
        el('invoice-import-received-date').value = data.invoice_date;
      }
      rows = buildRowsFromParse(data);
      setStatus('Parsed ' + rows.length + ' line(s) (' + (data.parse_source || 'pdf') + '). Review and edit before import.', 'ok');
      renderPreview();
    } catch (e) {
      setStatus('Parse failed: ' + e.message, 'err');
    } finally {
      busy = false;
      renderPreview();
    }
  }

  async function uploadProcessedImage(sourceUrl) {
    const dataUrl = await window.utils.productImage.exportProductImageFromUrl(sourceUrl);
    return window.utils.uploadAdminImage(dataUrl, 'invoice-product.jpg');
  }

  async function lookupImages() {
    if (!rows.length) return;
    if (!getMistralKey()) {
      setStatus('Mistral key recommended for image lookup fallback.', 'warn');
    }
    busy = true;
    setStatus('Looking up images…', 'info');
    renderPreview();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.include) continue;
      if (r.existing_listed && !r.override_listing) continue;
      if (r.source_image_url) continue;
      try {
        const data = await api('/admin/invoice-import/resolve-image', {
          method: 'POST',
          body: JSON.stringify({
            ean: r.ean,
            sku: r.sku,
            name: r.name,
            mistral_api_key: getMistralKey()
          })
        });
        r.source_image_url = data.image_url || '';
        r.notes = ['Image: ' + (data.source || 'found')];
      } catch (e) {
        r.notes = ['No image: ' + e.message];
      }
      renderPreview();
      await new Promise(function (ok) { setTimeout(ok, 350); });
    }
    setStatus('Image lookup finished. Process images before import.', 'ok');
    busy = false;
    renderPreview();
  }

  async function processImages() {
    busy = true;
    setStatus('Processing images (white background)…', 'info');
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.include) continue;
      if (r.existing_listed && !r.override_listing) continue;
      if (r.image_url) continue;
      if (!r.source_image_url) continue;
      r.image_pending = true;
      renderPreview();
      try {
        r.image_url = await uploadProcessedImage(r.source_image_url);
        r.notes = ['Uploaded to shop CDN'];
      } catch (e) {
        r.notes = ['Image process failed: ' + e.message];
      }
      r.image_pending = false;
      renderPreview();
    }
    busy = false;
    setStatus('Image processing done.', 'ok');
    renderPreview();
  }

  function sessionPaidBody() {
    const paidFrom = el('invoice-import-paid-from') && el('invoice-import-paid-from').value;
    const received = el('invoice-import-received-date') && el('invoice-import-received-date').value;
    return {
      paid_from: paidFrom || null,
      paid_date: paidFrom ? ((el('invoice-import-paid-date') && el('invoice-import-paid-date').value) || received) : null
    };
  }

  async function uploadReceipt(file) {
    const dataUrl = await readFileAsDataUrl(file);
    const data = await api('/admin/finance/receipts', {
      method: 'POST',
      body: JSON.stringify({ file: dataUrl, filename: file.name })
    });
    return data.url;
  }

  async function importRows() {
    const supplier = String(el('invoice-import-supplier') && el('invoice-import-supplier').value || '').trim();
    const receivedDate = el('invoice-import-received-date') && el('invoice-import-received-date').value;
    if (!supplier || !receivedDate) {
      setStatus('Supplier and receipt date are required.', 'warn');
      return;
    }
    const toImport = rows.filter(function (r) {
      if (!r.include || r.quantity < 1 || r.unit_cost_pence == null) return false;
      if (r.existing_listed) return !!r.existing_product_id;
      return r.price_pence > 0 && !!r.image_url;
    });
    if (!toImport.length) {
      setStatus('No valid rows to import. New products need a processed image and sell price.', 'warn');
      return;
    }

    busy = true;
    el('invoice-import-log').innerHTML = '';
    setStatus('Creating import session…', 'info');
    renderPreview();

    try {
      let receiptUrl = null;
      const file = el('invoice-import-pdf') && el('invoice-import-pdf').files && el('invoice-import-pdf').files[0];
      if (file) receiptUrl = await uploadReceipt(file);

      const session = await api('/admin/finance/import-sessions', {
        method: 'POST',
        body: JSON.stringify(Object.assign({
          supplier: supplier,
          received_date: receivedDate,
          reference: (el('invoice-import-reference') && el('invoice-import-reference').value) || null,
          notes: (el('invoice-import-notes') && el('invoice-import-notes').value) || 'Supplier invoice import',
          receipt_url: receiptUrl
        }, sessionPaidBody()))
      });

      const sessionId = session.id;
      appendLog('Session #' + sessionId + ' created.');

      for (let i = 0; i < toImport.length; i++) {
        const r = toImport[i];
        const payload = {
          entry_method: 'manual',
          quantity: r.quantity,
          unit_cost_pence: r.unit_cost_pence,
          ean: r.ean || null
        };
        if (r.existing_listed && !r.override_listing) {
          payload.product_id = r.existing_product_id;
        } else if (r.existing_listed && r.override_listing) {
          payload.product_id = r.existing_product_id;
          payload.name = r.name;
          payload.price_pence = r.price_pence;
          payload.category = global.ShopCategories
            ? ShopCategories.normalizeField(r.category)
            : r.category;
          payload.summary = r.name.slice(0, 500);
          if (r.image_url) payload.image_url = r.image_url;
        } else {
          payload.name = r.name;
          payload.price_pence = r.price_pence;
          payload.category = global.ShopCategories
            ? ShopCategories.normalizeField(r.category)
            : r.category;
          payload.image_url = r.image_url;
          payload.summary = r.name.slice(0, 500);
        }
        try {
          await api('/admin/finance/import-sessions/' + sessionId + '/lines', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          appendLog('Added: ' + r.name);
        } catch (e) {
          appendLog('Failed: ' + r.name + ' — ' + e.message);
        }
      }

      setStatus('Import finished. Open the stock import session below to review.', 'ok');
      if (global.ShopFinance && typeof ShopFinance.refreshImportSessions === 'function') {
        ShopFinance.refreshImportSessions(sessionId);
      }
    } catch (e) {
      setStatus('Import failed: ' + e.message, 'err');
    } finally {
      busy = false;
      renderPreview();
    }
  }

  function saveMistralKey() {
    const input = el('invoice-import-mistral-key');
    const val = input ? String(input.value || '').trim() : '';
    if (!val) {
      sessionStorage.removeItem(MISTRAL_KEY_STORAGE);
      setStatus('Mistral key cleared from this browser session.', 'info');
      return;
    }
    sessionStorage.setItem(MISTRAL_KEY_STORAGE, val);
    if (input) input.value = '';
    setStatus('Mistral key saved for this browser session only.', 'ok');
  }

  function bind() {
    if (bind._done) return;
    bind._done = true;
    bindPreviewEvents();
    const on = function (id, evt, fn) {
      const node = el(id);
      if (node) node.addEventListener(evt, fn);
    };
    on('invoice-import-save-key', 'click', saveMistralKey);
    on('invoice-import-parse', 'click', parseInvoice);
    on('invoice-import-multiplier', 'change', renderPreview);
    on('invoice-import-lookup-images', 'click', lookupImages);
    on('invoice-import-process-images', 'click', processImages);
    on('invoice-import-commit', 'click', importRows);
  }

  function init() {
    if (!el('invoice-import-card')) return;
    bind();
    const saved = getMistralKey();
    if (saved) setStatus('Mistral API key loaded from this browser session.', 'info');
    if (el('invoice-import-multiplier') && !el('invoice-import-multiplier').value) {
      el('invoice-import-multiplier').value = String(DEFAULT_MULTIPLIER);
    }
    if (el('invoice-import-received-date') && !el('invoice-import-received-date').value) {
      const d = new Date();
      el('invoice-import-received-date').value =
        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
  }

  global.ShopInvoiceImportAdmin = { init: init };
})(typeof window !== 'undefined' ? window : globalThis);
