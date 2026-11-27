/**
 * Finance tab: add products before the supplier invoice arrives.
 *
 * Same row blocks as the invoice import (shopInvoiceImportAdmin.js): category
 * picker, listing enrichment via /admin/invoice-import/generate-copy, suggested
 * image review/crop and upload. No cost or sell price here: items are saved as
 * unpriced products (POST /admin/finance/pre-invoice-items) and the invoice
 * import links the cost back by EAN later.
 */
(function (global) {
  let rows = [];
  let nextRowId = 0;
  let busy = false;
  let productByEan = {};

  function S() {
    return global.ShopInvoiceImportAdmin || {};
  }

  function el(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return window.utils.escapeHtml(s);
  }

  async function api(path, options) {
    return window.utils.adminFetchJson(path, options || {});
  }

  function normalizeEan(e) {
    return S().normalizeEan ? S().normalizeEan(e) : String(e || '').replace(/\D/g, '');
  }

  function rowById(id) {
    return rows.find(function (r) { return Number(r.id) === Number(id); });
  }

  function newRow() {
    nextRowId += 1;
    return {
      id: nextRowId,
      include: true,
      enrich: true,
      name: '',
      ean: '',
      quantity: 1,
      category: '',
      summary: '',
      description: '',
      image_url: '',
      source_image_url: '',
      source_image_confidence: null,
      source_product_verified: false,
      image_pending: false,
      copy_pending: false,
      existing_listed: false,
      existing_product_id: null,
      notes: []
    };
  }

  function hooks() {
    return { setStatus: setStatus, log: appendLog, render: renderPreview, rowById: rowById };
  }

  function setStatus(msg, kind) {
    const node = el('pre-invoice-status');
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
    const log = el('pre-invoice-log');
    if (!log) return;
    const p = document.createElement('p');
    p.className = 'admin-text-small';
    p.style.margin = '0.25rem 0';
    p.textContent = line;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }

  function validRows() {
    return rows.filter(function (r) {
      return r.include && String(r.name || '').trim() && (parseInt(r.quantity, 10) || 0) >= 1;
    });
  }

  function addRow() {
    rows.push(newRow());
    renderPreview();
    const host = el('pre-invoice-preview');
    const first = host && host.querySelector('tr[data-row] .invoice-import-name');
    if (first) first.focus();
  }

  function removeRow(id) {
    const row = rowById(id);
    if (row) S().revokeSuggestedThumbBlob(row);
    rows = rows.filter(function (r) { return Number(r.id) !== Number(id); });
    renderPreview();
  }

  function rowHtml(r) {
    const thumb = S().rowThumbHtml(r, true);
    const nameCell =
      '<input type="text" class="form-input invoice-import-name" data-id="' + r.id + '" value="' + esc(r.name) + '" placeholder="Product name" style="min-width:12rem;">' +
      '<div class="admin-text-small" style="margin-top:0.25rem;"><label>EAN <input type="text" inputmode="numeric" class="form-input invoice-import-ean" data-id="' + r.id + '" value="' + esc(r.ean || '') + '" placeholder="Optional" aria-label="EAN for ' + esc(r.name) + '" style="width:9.5rem;display:inline-block;padding:0.2rem 0.4rem;"></label></div>' +
      '<div style="margin-top:0.35rem;">' +
      '<input type="text" class="form-input invoice-import-summary" data-id="' + r.id + '" value="' + esc(r.summary) + '" placeholder="Summary (shop card and SEO meta)" style="min-width:14rem;margin-bottom:0.25rem;">' +
      '<textarea class="form-input invoice-import-description" data-id="' + r.id + '" rows="2" placeholder="Description" style="min-width:14rem;font-size:0.8125rem;">' + esc(r.description) + '</textarea>' +
      '<div class="admin-flex" style="gap:0.35rem;flex-wrap:wrap;margin-top:0.25rem;">' +
      '<button type="button" class="btn btn-secondary btn-sm pre-invoice-upload" data-id="' + r.id + '">Upload image</button>' +
      (r.source_image_url
        ? '<button type="button" class="btn btn-secondary btn-sm pre-invoice-adjust-crop" data-id="' + r.id + '">' + (r.image_url ? 'Adjust crop' : 'Review and crop') + '</button>' +
          (r.image_url ? '' : '<button type="button" class="btn btn-secondary btn-sm pre-invoice-discard-source" data-id="' + r.id + '">Discard suggestion</button>')
        : '') +
      '<button type="button" class="btn btn-secondary btn-sm pre-invoice-gen-copy" data-id="' + r.id + '"' + (r.copy_pending ? ' disabled' : '') + '>Enrich listing</button>' +
      '</div></div>';
    const enrichCell = '<input type="checkbox" class="pre-invoice-enrich" data-id="' + r.id + '"' + (r.enrich ? ' checked' : '') + ' aria-label="Enrich listing for ' + esc(r.name || 'item') + '">';
    const categoryCell = '<div class="invoice-import-category-mount" data-row-id="' + r.id + '" style="min-width:11rem;"></div>';
    let notesText = r.notes.join('; ');
    if (r.copy_pending) notesText = notesText ? notesText + '; Enriching listing…' : 'Enriching listing…';
    else if (r.image_pending) notesText = notesText ? notesText + '; Framing image…' : 'Framing image…';
    return (
      '<tr data-row="' + r.id + '">' +
      '<td style="padding:0.35rem;vertical-align:top;"><input type="checkbox" class="pre-invoice-include" data-id="' + r.id + '"' + (r.include ? ' checked' : '') + '></td>' +
      '<td style="padding:0.35rem;vertical-align:top;text-align:center;">' + enrichCell + '</td>' +
      '<td style="padding:0.35rem;vertical-align:top;">' + thumb + '</td>' +
      '<td style="padding:0.35rem;vertical-align:top;">' + nameCell + '</td>' +
      '<td style="padding:0.35rem;vertical-align:top;"><input type="number" min="1" class="form-input invoice-import-qty" data-id="' + r.id + '" value="' + esc(r.quantity) + '" style="width:4rem;"></td>' +
      '<td style="padding:0.35rem;vertical-align:top;">' + categoryCell + '</td>' +
      '<td style="padding:0.35rem;vertical-align:top;" class="admin-text-small">' + esc(notesText) +
      '<div><button type="button" class="btn btn-secondary btn-sm pre-invoice-remove" data-id="' + r.id + '" style="margin-top:0.25rem;">Remove</button></div></td>' +
      '</tr>'
    );
  }

  function updateActionButtons() {
    const saveBtn = el('pre-invoice-save');
    const enrichBtn = el('pre-invoice-enrich-selected');
    const valid = validRows();
    if (saveBtn) {
      saveBtn.disabled = busy || valid.length === 0;
      saveBtn.textContent = valid.length
        ? 'Save ' + valid.length + ' item' + (valid.length === 1 ? '' : 's')
        : 'Save items';
    }
    if (enrichBtn) {
      enrichBtn.disabled = busy || rows.some(function (r) { return r.copy_pending; });
    }
  }

  function renderPreview() {
    const host = el('pre-invoice-preview');
    if (!host) return;

    const included = rows.filter(function (r) { return r.include; });
    const valid = validRows();

    if (!rows.length) {
      host.innerHTML = '<p class="admin-text-muted">No items yet. Use Add item to enter products before the invoice arrives.</p>';
      updateActionButtons();
      return;
    }

    host.innerHTML =
      '<p class="admin-text-muted" style="margin:0 0 0.75rem;">' +
      rows.length + ' item(s) · ' + included.length + ' selected · ' + valid.length + ' ready to save</p>' +
      '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.875rem;">' +
      '<thead><tr style="text-align:left;border-bottom:2px solid rgb(var(--color-neutral-300));">' +
      '<th style="padding:0.35rem;">Inc</th><th style="padding:0.35rem;" title="Run listing enrichment on checked items">Enrich</th><th style="padding:0.35rem;">Img</th><th style="padding:0.35rem;">Product</th>' +
      '<th style="padding:0.35rem;">Qty</th><th style="padding:0.35rem;">Category</th><th style="padding:0.35rem;">Notes</th>' +
      '</tr></thead><tbody>' + rows.map(rowHtml).join('') + '</tbody></table></div>';

    updateActionButtons();
    S().mountCategoryPickers(host, rowById, function () { return true; });
    S().hydrateSuggestedImageThumbs(host, rowById);
    if (S().applyInvoiceImportTabOrder) S().applyInvoiceImportTabOrder(host);
  }

  async function enrichRow(row, quiet, batchMeta) {
    if (!row || !String(row.name || '').trim()) {
      if (!quiet) setStatus('Enter a product name before enriching.', 'warn');
      return false;
    }
    return S().generateCopyForRowInternal(row, quiet, batchMeta, null, hooks());
  }

  async function enrichSelected() {
    const targets = rows.filter(function (r) { return r.include && r.enrich && String(r.name || '').trim(); });
    if (!targets.length) {
      setStatus('Tick Enrich on at least one item with a name.', 'warn');
      return;
    }
    busy = true;
    renderPreview();
    let ok = 0;
    let halt = false;
    const onLimit = function (message) {
      if (halt) return;
      if (!/refused further web searches|web_search rate limit/i.test(String(message || ''))) return;
      halt = true;
      appendLog('Stopped the rest of this batch. ' + message);
    };
    try {
      for (let i = 0; i < targets.length; i++) {
        if (halt) break;
        setStatus('Enriching (' + (i + 1) + ' of ' + targets.length + '): ' + targets[i].name + '…', 'info');
        const success = await S().generateCopyForRowInternal(targets[i], true, {
          index: i + 1,
          total: targets.length
        }, onLimit, hooks());
        if (success) ok++;
      }
      setStatus(
        'Listing enrichment finished for ' + ok + ' of ' + targets.length + ' item(s). Edit any field, then Save items.',
        ok ? 'ok' : 'warn'
      );
    } finally {
      busy = false;
      renderPreview();
    }
  }

  async function saveRows() {
    const valid = validRows();
    if (!valid.length) {
      setStatus('Add at least one item with a product name and quantity.', 'warn');
      return;
    }
    busy = true;
    el('pre-invoice-log').innerHTML = '';
    setStatus('Saving items…', 'info');
    renderPreview();
    try {
      const items = valid.map(function (r) {
        return {
          name: String(r.name || '').trim(),
          ean: normalizeEan(r.ean) || null,
          quantity: parseInt(r.quantity, 10),
          category: r.category || null,
          summary: r.summary || null,
          description: r.description || null,
          image_url: r.image_url || null
        };
      });
      const data = await api('/admin/finance/pre-invoice-items', {
        method: 'POST',
        body: JSON.stringify({ items: items })
      });
      (data.lines || []).forEach(function (line, i) {
        const r = valid[i];
        if (!r) return;
        if (line.created) {
          appendLog('Created "' + r.name + '" as product #' + line.product_id + ' (hidden until priced) with ' + line.stock_added + ' in stock.');
        } else if (line.stock_added) {
          appendLog('Linked "' + r.name + '" to product #' + line.product_id + '; added ' + line.stock_added + ' stock. The invoice adds the cost.');
        } else {
          appendLog('Linked "' + r.name + '" to product #' + line.product_id + '; stock will be added when the invoice is imported.');
        }
      });
      const savedIds = {};
      valid.forEach(function (r) { savedIds[r.id] = true; });
      rows = rows.filter(function (r) { return !savedIds[r.id]; });
      setStatus(
        'Saved ' + valid.length + ' item(s). When the invoice arrives, import it as usual: lines with the same EAN match these products and add the cost and receipt.',
        'ok'
      );
      productByEan = await S().loadProductsIndex();
      if (typeof global.loadProducts === 'function') global.loadProducts();
    } catch (e) {
      setStatus('Save failed: ' + e.message, 'err');
    } finally {
      busy = false;
      renderPreview();
    }
  }

  function bindPreviewEvents() {
    const host = el('pre-invoice-preview');
    if (!host || host._preInvoiceBound) return;
    host._preInvoiceBound = true;

    host.addEventListener('click', function (e) {
      const uploadBtn = e.target.closest('.pre-invoice-upload');
      if (uploadBtn) {
        const fileInput = el('pre-invoice-row-file');
        if (fileInput) {
          fileInput._rowId = uploadBtn.getAttribute('data-id');
          fileInput.click();
        }
        return;
      }
      const adjustBtn = e.target.closest('.pre-invoice-adjust-crop');
      if (adjustBtn) {
        S().openAdjustCropForRow(adjustBtn.getAttribute('data-id'), hooks());
        return;
      }
      const discardBtn = e.target.closest('.pre-invoice-discard-source');
      if (discardBtn) {
        const row = rowById(discardBtn.getAttribute('data-id'));
        if (row) {
          S().revokeSuggestedThumbBlob(row);
          row.source_image_url = '';
          row.source_image_confidence = null;
          row.source_product_verified = false;
          row.notes = ['Suggested source image discarded'];
          renderPreview();
        }
        return;
      }
      const genBtn = e.target.closest('.pre-invoice-gen-copy');
      if (genBtn) {
        if (genBtn.disabled) return;
        enrichRow(rowById(genBtn.getAttribute('data-id')), false);
        return;
      }
      const removeBtn = e.target.closest('.pre-invoice-remove');
      if (removeBtn) {
        removeRow(removeBtn.getAttribute('data-id'));
        return;
      }
    });

    host.addEventListener('change', function (e) {
      const t = e.target;
      const id = t.getAttribute('data-id');
      if (!id) return;
      const row = rowById(id);
      if (!row) return;
      if (t.classList.contains('pre-invoice-include')) {
        row.include = t.checked;
        renderPreview();
        return;
      }
      if (t.classList.contains('pre-invoice-enrich')) {
        row.enrich = t.checked;
        renderPreview();
        return;
      }
      if (t.classList.contains('invoice-import-ean')) {
        S().setRowEan(row, t.value, productByEan);
        renderPreview();
        return;
      }
      if (t.classList.contains('invoice-import-name')) {
        row.name = t.value;
        renderPreview();
        return;
      }
      if (t.classList.contains('invoice-import-qty')) {
        row.quantity = parseInt(t.value, 10) || 0;
        renderPreview();
        return;
      }
      if (t.classList.contains('invoice-import-summary')) {
        row.summary = t.value;
        return;
      }
    });

    host.addEventListener('input', function (e) {
      const t = e.target;
      const id = t.getAttribute('data-id');
      if (!id) return;
      const row = rowById(id);
      if (!row) return;
      if (t.classList.contains('invoice-import-description')) row.description = t.value;
      if (t.classList.contains('invoice-import-summary')) row.summary = t.value;
      if (t.classList.contains('invoice-import-name')) {
        row.name = t.value;
        updateActionButtons();
      }
      if (t.classList.contains('invoice-import-qty')) {
        row.quantity = parseInt(t.value, 10) || 0;
        updateActionButtons();
      }
    });
  }

  function bindRowFileInput() {
    const fileInput = el('pre-invoice-row-file');
    if (!fileInput || fileInput._bound) return;
    fileInput._bound = true;
    fileInput.addEventListener('change', function () {
      const file = fileInput.files && fileInput.files[0];
      const rowId = fileInput._rowId;
      fileInput.value = '';
      if (!file || !rowId) return;
      const row = rowById(rowId);
      if (!row || typeof global.showCropModal !== 'function') return;
      global.showCropModal(file, function (croppedImage) {
        S().uploadCroppedProductImage(row, croppedImage, 'Product image saved', hooks());
      }, 336 / 220, 'product');
    });
  }

  function bind() {
    if (bind._done) return;
    bind._done = true;
    bindPreviewEvents();
    bindRowFileInput();
    const on = function (id, evt, fn) {
      const node = el(id);
      if (node) node.addEventListener(evt, fn);
    };
    on('pre-invoice-add-row', 'click', addRow);
    on('pre-invoice-enrich-selected', 'click', enrichSelected);
    on('pre-invoice-save', 'click', saveRows);
  }

  async function init() {
    if (!el('pre-invoice-card')) return;
    bind();
    productByEan = await S().loadProductsIndex();
    renderPreview();
  }

  global.ShopPreInvoiceAdmin = { init: init };
})(typeof window !== 'undefined' ? window : globalThis);
