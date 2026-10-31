/**
 * Finance tab: supplier invoice PDF import → editable preview → stock import session.
 */
(function (global) {
  const MISTRAL_KEY_STORAGE = 'dicebastion_mistral_api_key';
  const DEFAULT_MULTIPLIER = 1.3;

  let rows = [];
  let productByEan = {};
  let nextRowId = 0;
  let busy = false;
  let invoiceCurrency = 'GBP';

  function isForeignInvoice() {
    return invoiceCurrency && String(invoiceCurrency).toUpperCase() !== 'GBP';
  }

  function normalizeInvoiceCurrencyCode(raw) {
    const c = String(raw || 'GBP').trim().toUpperCase();
    return /^[A-Z]{3}$/.test(c) ? c : 'GBP';
  }

  function foreignMinorFromUnitNet(unitNet) {
    const u = parseEuAmount(unitNet);
    if (u == null) return null;
    return Math.round(u * 100);
  }

  function rowForeignMinor(r) {
    if (r.unit_foreign_minor != null && Number.isFinite(Number(r.unit_foreign_minor))) {
      return Math.round(Number(r.unit_foreign_minor));
    }
    return foreignMinorFromUnitNet(r.unit_net);
  }

  function syncRowCostFields(r) {
    if (isForeignInvoice()) {
      r.unit_foreign_minor = rowForeignMinor(r);
      r.unit_cost_pence = null;
    } else {
      r.unit_foreign_minor = null;
      r.unit_cost_pence = unitCostPence(r.unit_net);
    }
  }

  function settlementGbpPenceFromDom() {
    const node = el('invoice-import-settlement-gbp');
    if (!node) return null;
    const p = parseFloat(node.value);
    if (!Number.isFinite(p) || p <= 0) return null;
    return Math.round(p * 100);
  }

  function updateSettlementFieldVisibility() {
    const wrap = el('invoice-import-settlement-wrap');
    if (wrap) wrap.style.display = isForeignInvoice() ? '' : 'none';
  }

  function foreignGoodsTotalMinor(lines) {
    return lines.reduce(function (sum, r) {
      const fm = rowForeignMinor(r);
      const q = parseInt(r.quantity, 10) || 0;
      if (fm == null || q <= 0) return sum;
      return sum + fm * q;
    }, 0);
  }

  function costColumnLabel() {
    return isForeignInvoice() ? ('Cost (' + invoiceCurrency + ')') : 'Cost ea';
  }

  function formatForeignMajor(minor) {
    if (minor == null) return '';
    return (Number(minor) / 100).toFixed(2);
  }

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

  function effectiveDisposition(r) {
    if (!r) return 'shop';
    if (r.disposition === 'split_child') return r.child_disposition || 'shop';
    return r.disposition || 'shop';
  }

  function isShopLine(r) {
    const d = effectiveDisposition(r);
    return d === 'shop';
  }

  function isEventLine(r) {
    return effectiveDisposition(r) === 'event_write_off';
  }

  /** Keep in sync with worker normalizeVariantFamilyKey (invoice-import.js). */
  var VARIANT_FAMILY_STRIP_WORDS = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'grey', 'gray',
    'silver', 'gold', 'brown', 'teal', 'cyan', 'magenta', 'ivory', 'crimson', 'navy', 'lime', 'amber',
    'copper', 'bronze', 'charcoal', 'cream', 'ruby', 'sapphire', 'emerald', 'pearl', 'slate', 'wine',
    'olive', 'sand', 'beige', 'tan', 'turquoise', 'coral', 'peach', 'plum', 'mustard', 'ebony', 'jet',
    'snow', 'arctic', 'smoke', 'steel', 'brass', 'clear', 'transparent', 'petrol', 'petroleum',
    'english', 'french', 'german', 'italian', 'spanish', 'japanese', 'polish', 'dutch',
    'apple', 'blood', 'amazonite', 'mint', 'jade', 'graphite', 'violet', 'indigo', 'azure', 'umber',
    'burgundy', 'melon', 'pumpkin', 'grass', 'sky', 'ocean', 'forest', 'midnight', 'rose',
    'boros', 'dimir', 'golgari', 'azorius', 'simic', 'rakdos', 'gruul', 'izzet', 'selesnya', 'orzhov'
  ];

  var FAMILY_ENRICHMENT_MAX_LINES = 15;

  function productVariantFamilyKey(row) {
    var s = String(row && row.name || '').toLowerCase();
    s = s.replace(/^\s*ds\b\s*[-:]\s*/i, 'dragon shield ');
    s = s.replace(/\[[^\]]*\]/g, ' ');
    s = s.replace(/\(\s*\d+\s*sleeves?\s*\)/gi, ' ');
    s = s.replace(/\b\d+\s*sleeves?\b/gi, ' ');
    s = s.replace(/\s[-–—]\s/g, ' ').replace(/[^\w\s]/g, ' ');
    VARIANT_FAMILY_STRIP_WORDS.forEach(function (word) {
      s = s.replace(new RegExp('\\b' + word + '\\b', 'gi'), ' ');
    });
    s = s.replace(/\s+/g, ' ').trim();
    return s.slice(0, 160);
  }

  function pushFamilySetChunks(sets, group, setIdPrefix) {
    if (group.length < 2) {
      group.forEach(function (r) {
        sets.push({ setId: 'single-' + r.id, mode: 'single', rows: [r] });
      });
      return;
    }
    var hint = productVariantFamilyKey(group[0]);
    for (var i = 0; i < group.length; i += FAMILY_ENRICHMENT_MAX_LINES) {
      var chunk = group.slice(i, i + FAMILY_ENRICHMENT_MAX_LINES);
      sets.push({
        setId: setIdPrefix + '-chunk-' + i,
        mode: 'family',
        rows: chunk,
        familyHint: hint
      });
    }
  }

  function syncEnrichFlagForRow(row) {
    if (!row) return;
    if (!rowCanOfferEnrichment(row)) row.enrich = false;
  }

  function defaultEnrichForNewRow(row) {
    row.enrich = rowCanOfferEnrichment(row);
  }

  function buildListingSets(targets) {
    const sets = [];
    const byExplicit = {};
    const autoRows = [];
    targets.forEach(function (r) {
      if (r.listing_set_id) {
        if (!byExplicit[r.listing_set_id]) byExplicit[r.listing_set_id] = [];
        byExplicit[r.listing_set_id].push(r);
      } else {
        autoRows.push(r);
      }
    });
    Object.keys(byExplicit).forEach(function (sid) {
      const group = byExplicit[sid];
      pushFamilySetChunks(sets, group, sid);
    });
    const byKey = {};
    autoRows.forEach(function (r) {
      const key = productVariantFamilyKey(r);
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(r);
    });
    Object.keys(byKey).forEach(function (key) {
      const group = byKey[key];
      if (key.length >= 8 && group.length >= 2) {
        pushFamilySetChunks(sets, group, 'auto-' + key.slice(0, 40));
      } else {
        group.forEach(function (r) {
          sets.push({ setId: 'single-' + r.id, mode: 'single', rows: [r] });
        });
      }
    });
    return sets;
  }

  function enrichSetPreviewLabel(sets) {
    let familyIdx = 0;
    return sets.map(function (s) {
      if (s.mode === 'family') {
        familyIdx += 1;
        return 'Set ' + familyIdx + ' (' + s.rows.length + ' lines, harmonised)';
      }
      return 'Single: ' + truncateLabel(s.rows[0].name, 36);
    }).join('; ');
  }

  function linkSelectedListingSet() {
    const picked = rows.filter(function (r) {
      return r.enrich && rowCanOfferEnrichment(r);
    });
    if (picked.length < 2) {
      setStatus('Tick Enrich on at least 2 shop lines to link as one listing set.', 'warn');
      return;
    }
    const setId = 'set-' + Date.now();
    picked.forEach(function (r) {
      r.listing_set_id = setId;
    });
    setStatus('Linked ' + picked.length + ' lines as one listing set. Run Enrich selected once.', 'ok');
    renderPreview();
  }

  function unlinkListingSetForRow(id) {
    const row = rowById(id);
    if (!row) return;
    row.listing_set_id = null;
    renderPreview();
  }

  function applyFamilyLineToRow(row, lineData, meta) {
    if (lineData.error) {
      row.notes = ['Family enrich: ' + lineData.error];
      return false;
    }
    if (lineData.display_name) row.name = String(lineData.display_name).trim().slice(0, 200);
    row.summary = lineData.summary || '';
    row.description = lineData.description || '';
    if (lineData.image_url) {
      row.source_image_url = lineData.image_url;
      row.source_image_confidence = lineData.confidence != null ? Number(lineData.confidence) : null;
      row.source_product_verified = lineData.product_verified === true;
    }
    row.notes = ['Listing enriched (harmonised family set)'];
    if (lineData.image_url) row.notes[0] += '; suggested image pending review';
    return true;
  }

  async function enrichFamilySetInternal(set, mistralKey, quiet) {
    const setRows = set.rows;
    setRows.forEach(function (r) { r.copy_pending = true; });
    renderPreview();
    logProgress('[invoice-import] family set: ' + setRows.length + ' lines, 1 web search', {
      hint: set.familyHint
    });
    try {
      const data = await api('/admin/invoice-import/enrich-family', {
        method: 'POST',
        body: JSON.stringify({
          lines: setRows.map(function (r) {
            return { name: r.name, ean: r.ean || null };
          }),
          family_hint: set.familyHint || productVariantFamilyKey(setRows[0]),
          mistral_api_key: mistralKey
        })
      });
      const resultByEan = {};
      (data.lines || []).forEach(function (line) {
        const e = normalizeEan(line.ean);
        if (e) resultByEan[e] = line;
      });
      let ok = 0;
      const failedRows = [];
      setRows.forEach(function (row) {
        const e = normalizeEan(row.ean);
        const lineData = e && resultByEan[e] ? resultByEan[e] : null;
        if (lineData && !lineData.error && applyFamilyLineToRow(row, lineData, data)) ok++;
        else {
          row.notes = ['Family enrich: no matching result for this line'];
          failedRows.push(row);
        }
      });
      for (let fi = 0; fi < failedRows.length; fi++) {
        appendLog('Family line fallback (single): ' + failedRows[fi].name);
        const success = await generateCopyForRowInternal(failedRows[fi], mistralKey, true, {
          index: fi + 1,
          total: failedRows.length
        });
        if (success) ok++;
      }
      appendLog('Family set OK: ' + ok + ' of ' + setRows.length + ' line(s)' +
        (data.web_search_ms != null ? ' (' + Math.round(data.web_search_ms / 1000) + 's web search)' : ''));
      return ok;
    } catch (e) {
      appendLog('Family enrich failed (' + setRows.length + ' lines): ' + e.message + ' — retrying individually…');
      let ok = 0;
      for (let i = 0; i < setRows.length; i++) {
        const success = await generateCopyForRowInternal(setRows[i], mistralKey, true, {
          index: i + 1,
          total: setRows.length
        });
        if (success) ok++;
      }
      return ok;
    } finally {
      setRows.forEach(function (r) { r.copy_pending = false; });
      renderPreview();
    }
  }

  function rowCanOfferEnrichment(r) {
    if (!r || !isShopLine(r)) return false;
    if (r.existing_listed && !r.override_listing) return false;
    return true;
  }

  function rowEligibleForEnrichment(r) {
    return rowCanOfferEnrichment(r) && r.enrich === true;
  }

  function parentHasChildren(parentId) {
    return rows.some(function (x) {
      return x.parent_id === parentId && x.disposition === 'split_child';
    });
  }

  function childrenOfParent(parentId) {
    return rows
      .filter(function (x) {
        return x.parent_id === parentId && x.disposition === 'split_child';
      })
      .sort(function (a, b) { return a.id - b.id; });
  }

  function rowsInDisplayOrder() {
    const out = [];
    const emittedChild = new Set();
    rows.forEach(function (r) {
      if (r.disposition === 'split_child') return;
      out.push(r);
      if (r.disposition === 'split_parent') {
        childrenOfParent(r.id).forEach(function (c) {
          out.push(c);
          emittedChild.add(c.id);
        });
      }
    });
    rows.forEach(function (r) {
      if (r.disposition === 'split_child' && !emittedChild.has(r.id)) out.push(r);
    });
    return out;
  }

  function truncateLabel(name, maxLen) {
    const s = String(name || '').trim();
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen - 1) + '\u2026';
  }

  function rowGroupClass(r) {
    if (r.disposition === 'split_parent' && parentHasChildren(r.id)) {
      return ' invoice-import-row-parent invoice-import-row-group-start';
    }
    if (r.disposition === 'split_child') {
      const siblings = childrenOfParent(r.parent_id);
      const last = siblings.length ? siblings[siblings.length - 1].id === r.id : true;
      return ' invoice-import-row-child' + (last ? ' invoice-import-row-group-end' : '');
    }
    return '';
  }

  function removeSplitChildren(parentId) {
    rows = rows.filter(function (r) { return r.parent_id !== parentId; });
    const parent = rowById(parentId);
    if (parent) parent.include = true;
    setStatus('Split lines removed. You can expand again or change disposition.', 'info');
    renderPreview();
  }

  function allocateSplitUnitCosts(parentUnitCostPence, parentQuantity, childQuantities) {
    const total = parentUnitCostPence * parentQuantity;
    const sumQty = childQuantities.reduce(function (a, b) { return a + b; }, 0);
    if (!sumQty || total == null) return childQuantities.map(function () { return null; });
    const perUnit = Math.round(total / sumQty);
    return childQuantities.map(function (q) { return q > 0 ? perUnit : null; });
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

  /** Browser console progress (DevTools); always on during long OCR/enrichment runs. */
  function logProgress(message, detail) {
    const ts = new Date().toISOString().slice(11, 19);
    if (detail !== undefined) {
      console.log('[invoice-import ' + ts + ']', message, detail);
    } else {
      console.log('[invoice-import ' + ts + ']', message);
    }
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
    if (global.ShopCategoryPicker && typeof ShopCategoryPicker.seedShopCategoryCatalog === 'function') {
      ShopCategoryPicker.seedShopCategoryCatalog(list);
    }
  }

  function newRowId() {
    nextRowId += 1;
    return nextRowId;
  }

  function buildRowsFromParse(data) {
    const mult = multiplierValue();
    nextRowId = 0;
    return (data.lines || []).map(function (line) {
      const ean = normalizeEan(line.ean);
      const existing = ean ? productByEan[ean] : null;
      const listed = existing && (existing.catalog_status || 'listed') === 'listed' && Number(existing.is_active) === 1;
      const unit = line.unit_net_price;
      const rowObj = {
        id: newRowId(),
        include: true,
        enrich: false,
        disposition: 'shop',
        parent_id: null,
        child_disposition: 'shop',
        name: String(line.name || '').trim(),
        ean: ean,
        sku: line.sku ? String(line.sku).trim() : '',
        quantity: parseInt(line.quantity, 10) || 0,
        unit_net: unit,
        unit_cost_pence: null,
        price_pence: retailPricePence(unit, mult),
        price_manual: false,
        cost_manual: false,
        category: '',
        summary: '',
        description: '',
        image_url: '',
        source_image_url: '',
        source_image_confidence: null,
        source_product_verified: false,
        image_pending: false,
        copy_pending: false,
        existing_listed: !!listed,
        existing_product_id: existing ? existing.id : null,
        override_listing: false,
        notes: [],
        split_text: '',
        split_default_qty: 1,
        split_child_disposition: 'shop',
        listing_set_id: null,
        unit_foreign_minor: null
      };
      syncRowCostFields(rowObj);
      defaultEnrichForNewRow(rowObj);
      return rowObj;
    });
  }

  function recalcPrices() {
    const mult = multiplierValue();
    rows.forEach(function (r) {
      if (isShopLine(r) && !r.price_manual && (!r.existing_listed || r.override_listing)) {
        r.price_pence = retailPricePence(r.unit_net, mult);
      }
      const skipCost = r.disposition === 'split_parent' && parentHasChildren(r.id);
      if (!r.cost_manual && !skipCost) {
        if (isForeignInvoice()) {
          r.unit_foreign_minor = rowForeignMinor(r);
          r.unit_cost_pence = null;
        } else {
          r.unit_cost_pence = unitCostPence(r.unit_net);
          r.unit_foreign_minor = null;
        }
      }
    });
  }

  function syncRowFieldsFromDom() {
    const host = el('invoice-import-preview');
    if (!host) return;
    host.querySelectorAll('.invoice-import-price').forEach(function (node) {
      const row = rowById(node.getAttribute('data-id'));
      if (!row) return;
      const p = parseFloat(node.value);
      if (Number.isFinite(p)) row.price_pence = Math.round(p * 100);
    });
    host.querySelectorAll('.invoice-import-cost').forEach(function (node) {
      const row = rowById(node.getAttribute('data-id'));
      if (!row) return;
      const p = parseFloat(node.value);
      if (Number.isFinite(p)) {
        row.unit_cost_pence = Math.round(p * 100);
        row.unit_net = p;
        row.cost_manual = true;
      }
    });
    host.querySelectorAll('.invoice-import-cost-foreign').forEach(function (node) {
      const row = rowById(node.getAttribute('data-id'));
      if (!row) return;
      const p = parseFloat(node.value);
      if (Number.isFinite(p)) {
        row.unit_foreign_minor = Math.round(p * 100);
        row.unit_net = p;
        row.unit_cost_pence = null;
        row.cost_manual = true;
      }
    });
  }

  function mountCategoryPickers(host) {
    if (!host || !global.ShopCategoryPicker) return;
    ShopCategoryPicker.unmountAll(host);
    host.querySelectorAll('.invoice-import-category-mount').forEach(function (cell) {
      const id = cell.getAttribute('data-row-id');
      const row = rowById(id);
      if (!row || !isShopLine(row)) return;
      ShopCategoryPicker.mount(cell, {
        rowId: id,
        category: row.category,
        catalog: global.allCategories,
        maxTags: 3,
        onChange: function (normalized) {
          row.category = normalized;
        }
      });
    });
  }

  function rowsEligibleForImport() {
    return rows.filter(function (r) {
      if (!r.include) return false;
      if (r.disposition === 'split_parent') {
        if (parentHasChildren(r.id)) return false;
        return rowReadyForImport(r);
      }
      return rowReadyForImport(r);
    });
  }

  function rowReadyForImport(r) {
    if (!r || r.quantity < 1) return false;
    if (isForeignInvoice()) {
      if (rowForeignMinor(r) == null) return false;
    } else if (r.unit_cost_pence == null) {
      return false;
    }
    if (r.disposition === 'split_parent' && parentHasChildren(r.id)) return false;

    if (isEventLine(r)) {
      if (r.existing_product_id) return true;
      return !!String(r.name || '').trim();
    }

    if (!isShopLine(r)) return false;

    if (r.existing_listed && !r.override_listing) {
      return !!r.existing_product_id;
    }
    if (r.existing_listed && r.override_listing) {
      return !!r.existing_product_id && r.price_pence > 0;
    }
    return r.price_pence > 0 && !!r.image_url;
  }

  function importBlockerMessage() {
    const supplier = String(el('invoice-import-supplier') && el('invoice-import-supplier').value || '').trim();
    const receivedDate = el('invoice-import-received-date') && el('invoice-import-received-date').value;
    if (!supplier) return 'Enter supplier to enable import.';
    if (!receivedDate) return 'Enter receipt date to enable import.';
    const included = rows.filter(function (r) { return r.include; });
    if (!included.length) return 'Select at least one line to import.';
    const valid = rowsEligibleForImport();
    if (!valid.length) {
      return 'Shop lines need sell price and a saved product image (Review and crop a suggested image, or upload your own). Event lines need a product name. Split bundles need child rows or another disposition.';
    }
    if (isForeignInvoice() && !settlementGbpPenceFromDom()) {
      return 'Enter the amount paid in GBP for this invoice (bank settlement).';
    }
    return '';
  }

  function revokeSuggestedThumbBlob(row) {
    if (row && row._suggested_thumb_blob) {
      URL.revokeObjectURL(row._suggested_thumb_blob);
      row._suggested_thumb_blob = null;
    }
  }

  function hydrateSuggestedImageThumbs(host) {
    if (!host || !window.utils || typeof window.utils.adminProxyImageObjectUrl !== 'function') return;
    host.querySelectorAll('.invoice-import-suggested-thumb[data-id]').forEach(function (node) {
      const row = rowById(node.getAttribute('data-id'));
      if (!row || !row.source_image_url || row.image_url) return;
      if (node.getAttribute('data-loaded') === row.source_image_url) return;
      node.setAttribute('data-loaded', 'pending');
      revokeSuggestedThumbBlob(row);
      window.utils.adminProxyImageObjectUrl(row.source_image_url)
        .then(function (blobUrl) {
          if (!row.source_image_url || row.image_url) {
            URL.revokeObjectURL(blobUrl);
            return;
          }
          row._suggested_thumb_blob = blobUrl;
          node.innerHTML =
            '<img src="' + esc(blobUrl) + '" alt="" style="width:48px;height:48px;object-fit:contain;background:#fff;border-radius:4px;border:2px dashed rgb(var(--color-primary-400));">' +
            '<span class="admin-text-small admin-text-muted" style="display:block;font-size:0.6875rem;margin-top:0.1rem;">Suggested</span>';
          node.setAttribute('data-loaded', row.source_image_url);
        })
        .catch(function (err) {
          node.innerHTML = '<span class="admin-text-small admin-text-muted" title="' + esc(err.message || 'failed') + '">Preview failed</span>';
          node.removeAttribute('data-loaded');
        });
    });
  }

  function rowThumbHtml(r, shop) {
    if (!shop) return '<span class="admin-text-small">N/A</span>';
    if (r.image_url) {
      return (
        '<img src="' + esc(r.image_url) + '" alt="" style="width:48px;height:48px;object-fit:contain;background:#fff;border-radius:4px;">'
      );
    }
    if (r.source_image_url) {
      return (
        '<div class="invoice-import-suggested-thumb" data-id="' + r.id + '" title="Suggested source — not saved until you review and crop">' +
        '<span class="admin-text-small admin-text-muted" style="font-size:0.6875rem;">Loading…</span></div>'
      );
    }
    return '<span class="admin-text-muted">—</span>';
  }

  function dispositionOptions(r) {
    const opts = [
      ['shop', 'Shop stock'],
      ['event_write_off', 'Event use'],
      ['split_parent', 'Split bundle']
    ];
    if (r.disposition === 'split_child') {
      return (
        '<span class="admin-text-small">Split child</span>' +
        '<select class="form-select invoice-import-child-disp" data-id="' + r.id + '" style="margin-top:0.25rem;">' +
        '<option value="shop"' + (r.child_disposition === 'shop' ? ' selected' : '') + '>Shop</option>' +
        '<option value="event_write_off"' + (r.child_disposition === 'event_write_off' ? ' selected' : '') + '>Event</option>' +
        '</select>'
      );
    }
    return (
      '<select class="form-select invoice-import-disposition" data-id="' + r.id + '">' +
      opts.map(function (pair) {
        return '<option value="' + pair[0] + '"' + (r.disposition === pair[0] ? ' selected' : '') + '>' + esc(pair[1]) + '</option>';
      }).join('') +
      '</select>'
    );
  }

  function syncSplitDraftsFromDom() {
    const host = el('invoice-import-preview');
    if (!host) return;
    host.querySelectorAll('.invoice-import-split-text').forEach(function (node) {
      const row = rowById(node.getAttribute('data-id'));
      if (row) row.split_text = node.value;
    });
    host.querySelectorAll('.invoice-import-split-default-qty').forEach(function (node) {
      const row = rowById(node.getAttribute('data-id'));
      if (row) row.split_default_qty = parseInt(node.value, 10) || 1;
    });
    host.querySelectorAll('.invoice-import-split-child-disp').forEach(function (node) {
      const row = rowById(node.getAttribute('data-id'));
      if (row) row.split_child_disposition = node.value;
    });
  }

  function splitPanelRowHtml(r) {
    const childCount = rows.filter(function (x) { return x.parent_id === r.id; }).length;
    if (r.disposition !== 'split_parent') return '';
    if (childCount) {
      return (
        '<tr data-split-panel="' + r.id + '" class="invoice-import-split-panel">' +
        '<td colspan="10" class="invoice-import-split-panel-cell">' +
        '<span class="admin-text-small">' + childCount + ' split line(s) grouped below.</span> ' +
        '<button type="button" class="btn btn-secondary btn-sm invoice-import-split-remove" data-id="' + r.id + '">Remove split lines</button>' +
        '</td></tr>'
      );
    }
    const defQty = r.split_default_qty != null ? r.split_default_qty : 1;
    return (
      '<tr data-split-panel="' + r.id + '">' +
      '<td colspan="10" style="padding:0.75rem;background:rgba(var(--color-neutral-100),0.6);border-bottom:1px solid rgb(var(--color-neutral-200));">' +
      '<p class="admin-text-small" style="margin:0 0 0.5rem;"><strong>Split this line:</strong> paste distributor pick-list or bundle detail for <em>' + esc(r.name) + '</em>.</p>' +
      '<p class="admin-text-small admin-text-muted" style="margin:0 0 0.75rem;">Child lines should use full product titles (brand, range, size). Enrichment uses the name when there is no EAN, so keep names accurate before you tick Enrich.</p>' +
      '<label class="form-label" for="invoice-import-split-text-' + r.id + '">Bundle line text</label>' +
      '<textarea id="invoice-import-split-text-' + r.id + '" class="form-input invoice-import-split-text" data-id="' + r.id + '" rows="6" style="width:100%;font-family:inherit;">' + esc(r.split_text || '') + '</textarea>' +
      '<div class="admin-grid-2" style="margin-top:0.75rem;max-width:28rem;">' +
      '<div><label class="form-label">Default qty per line</label>' +
      '<input type="number" min="1" class="form-input invoice-import-split-default-qty" data-id="' + r.id + '" value="' + esc(defQty) + '"></div>' +
      '<div><label class="form-label">Default child disposition</label>' +
      '<select class="form-select invoice-import-split-child-disp" data-id="' + r.id + '">' +
      '<option value="shop"' + (r.split_child_disposition === 'shop' ? ' selected' : '') + '>Shop stock</option>' +
      '<option value="event_write_off"' + (r.split_child_disposition === 'event_write_off' ? ' selected' : '') + '>Event use</option>' +
      '</select></div></div>' +
      '<div class="admin-flex" style="gap:0.5rem;margin-top:0.75rem;flex-wrap:wrap;">' +
      '<button type="button" class="btn btn-primary btn-sm invoice-import-split-expand" data-id="' + r.id + '">Expand lines</button>' +
      '</div></td></tr>'
    );
  }

  function renderPreview() {
    const host = el('invoice-import-preview');
    const importBtn = el('invoice-import-commit');
    if (!host) return;

    syncSplitDraftsFromDom();
    syncRowFieldsFromDom();
    recalcPrices();
    const valid = rowsEligibleForImport();
    const included = rows.filter(function (r) { return r.include; });
    const blocker = importBlockerMessage();

    if (!rows.length) {
      host.innerHTML = '<p class="admin-text-muted">Upload a PDF and parse to see line items.</p>';
      if (importBtn) importBtn.disabled = true;
      return;
    }

    const body = rowsInDisplayOrder().map(function (r) {
      const shop = isShopLine(r);
      const readOnlyShop = shop && r.existing_listed && !r.override_listing;
      const isChild = r.disposition === 'split_child';
      const isParentWithKids = r.disposition === 'split_parent' && parentHasChildren(r.id);
      const parentRow = isChild ? rowById(r.parent_id) : null;
      const parentName = parentRow ? parentRow.name : '';
      const groupClass = rowGroupClass(r);
      const thumb = rowThumbHtml(r, shop);
      let nameCell = readOnlyShop
        ? esc(r.name) + ' <span class="admin-text-small">(existing)</span>'
        : '<input type="text" class="form-input invoice-import-name" data-id="' + r.id + '" value="' + esc(r.name) + '" style="min-width:12rem;">';
      if (isChild && parentName) {
        nameCell =
          '<span class="admin-text-small invoice-import-child-label">Split line</span> ' +
          '<span class="admin-text-muted admin-text-small">from ' + esc(truncateLabel(parentName, 48)) + '</span>' +
          '<div style="margin-top:0.25rem;">' + nameCell + '</div>';
      }
      const offerEnrich = rowCanOfferEnrichment(r);
      if (isChild && !r.ean && offerEnrich) {
        nameCell +=
          '<p class="admin-text-small admin-text-muted" style="margin:0.35rem 0 0;">No EAN — enrichment searches by this name; make it accurate before ticking Enrich.</p>';
      }
      if (offerEnrich && r.listing_set_id) {
        nameCell +=
          '<p class="admin-text-small admin-text-muted" style="margin:0.35rem 0 0;">Linked listing set · ' +
          '<button type="button" class="btn btn-secondary btn-sm invoice-import-unlink-set" data-id="' + r.id + '">Unlink</button></p>';
      }
      const enrichCell = offerEnrich
        ? '<input type="checkbox" class="invoice-import-enrich" data-id="' + r.id + '"' + (r.enrich ? ' checked' : '') + ' aria-label="Enrich listing for ' + esc(r.name) + '">'
        : '<span class="admin-text-muted">—</span>';
      const pricePounds = r.price_pence != null ? (r.price_pence / 100).toFixed(2) : '';
      const priceCell = !shop
        ? '<span class="admin-text-muted">—</span>'
        : (readOnlyShop
          ? '£' + esc(pricePounds)
          : '<input type="number" min="0" step="0.01" class="form-input invoice-import-price" data-id="' + r.id + '" value="' + esc(pricePounds) + '" style="width:5rem;">');
      const costPounds = r.unit_cost_pence != null ? (r.unit_cost_pence / 100).toFixed(2) : '';
      const costForeign = formatForeignMajor(rowForeignMinor(r));
      const costCell = isForeignInvoice()
        ? '<input type="number" min="0" step="0.01" class="form-input invoice-import-cost-foreign" data-id="' + r.id + '" value="' + esc(costForeign) + '" style="width:5rem;">'
        : '<input type="number" min="0" step="0.01" class="form-input invoice-import-cost" data-id="' + r.id + '" value="' + esc(costPounds) + '" style="width:5rem;">';
      const genCopyDisabled = r.copy_pending ? ' disabled' : '';
      const reviewCropLabel = r.image_url ? 'Adjust crop' : 'Review and crop';
      const reviewCropBtn = r.source_image_url && shop && !readOnlyShop
        ? '<button type="button" class="btn btn-secondary btn-sm invoice-import-adjust-crop" data-id="' + r.id + '">' + reviewCropLabel + '</button>'
        : '';
      const discardSourceBtn = r.source_image_url && shop && !readOnlyShop && !r.image_url
        ? '<button type="button" class="btn btn-secondary btn-sm invoice-import-discard-source" data-id="' + r.id + '">Discard suggestion</button>'
        : '';
      const shopExtras = shop && !readOnlyShop
        ? (
          '<div style="margin-top:0.35rem;">' +
          '<input type="text" class="form-input invoice-import-summary" data-id="' + r.id + '" value="' + esc(r.summary) + '" placeholder="Summary (shop card and SEO meta)" style="min-width:14rem;margin-bottom:0.25rem;">' +
          '<textarea class="form-input invoice-import-description" data-id="' + r.id + '" rows="2" placeholder="Description" style="min-width:14rem;font-size:0.8125rem;">' + esc(r.description) + '</textarea>' +
          '<div class="admin-flex" style="gap:0.35rem;flex-wrap:wrap;margin-top:0.25rem;">' +
          '<button type="button" class="btn btn-secondary btn-sm invoice-import-upload" data-id="' + r.id + '">Upload image</button>' +
          reviewCropBtn +
          discardSourceBtn +
          '<button type="button" class="btn btn-secondary btn-sm invoice-import-gen-copy" data-id="' + r.id + '"' + genCopyDisabled + '>Enrich listing</button>' +
          '</div></div>'
        )
        : '';
      let splitHint = '';
      if (isParentWithKids) {
        splitHint =
          '<span class="admin-text-small invoice-import-parent-badge">Bundle parent (not imported)</span>' +
          '<button type="button" class="btn btn-secondary btn-sm invoice-import-split-remove" data-id="' + r.id + '" style="margin-top:0.35rem;">Remove split lines</button>';
      }
      const categoryCell = shop
        ? '<div class="invoice-import-category-mount" data-row-id="' + r.id + '" style="min-width:11rem;"></div>'
        : '<span class="admin-text-muted">—</span>';
      let notesText = r.notes.join('; ');
      if (r.copy_pending) notesText = notesText ? notesText + '; Enriching listing…' : 'Enriching listing…';
      else if (r.image_pending) notesText = notesText ? notesText + '; Framing image…' : 'Framing image…';
      const parentAttr = isChild ? ' data-parent-id="' + r.parent_id + '"' : '';
      return (
        '<tr data-row="' + r.id + '"' + parentAttr + ' class="' + groupClass.trim() + '">' +
        '<td style="padding:0.35rem;vertical-align:top;"><input type="checkbox" class="invoice-import-include" data-id="' + r.id + '"' + (r.include ? ' checked' : '') + (isParentWithKids ? ' disabled' : '') + '></td>' +
        '<td style="padding:0.35rem;vertical-align:top;text-align:center;">' + enrichCell + '</td>' +
        '<td style="padding:0.35rem;vertical-align:top;">' + dispositionOptions(r) + splitHint + '</td>' +
        '<td style="padding:0.35rem;vertical-align:top;">' + thumb + '</td>' +
        '<td style="padding:0.35rem;vertical-align:top;"' + (isChild ? ' class="invoice-import-child-product"' : '') + '>' + nameCell +
          '<div class="admin-text-small">EAN ' + esc(r.ean || '—') + ' · SKU ' + esc(r.sku || '—') + '</div>' +
          (shop && r.existing_listed ? '<label class="admin-text-small"><input type="checkbox" class="invoice-import-override" data-id="' + r.id + '"' + (r.override_listing ? ' checked' : '') + '> Override listing fields</label>' : '') +
          shopExtras +
        '</td>' +
        '<td style="padding:0.35rem;vertical-align:top;"><input type="number" min="1" class="form-input invoice-import-qty" data-id="' + r.id + '" value="' + esc(r.quantity) + '" style="width:4rem;"></td>' +
        '<td style="padding:0.35rem;vertical-align:top;">' + costCell + '</td>' +
        '<td style="padding:0.35rem;vertical-align:top;">' + priceCell + '</td>' +
        '<td style="padding:0.35rem;vertical-align:top;">' + categoryCell + '</td>' +
        '<td style="padding:0.35rem;vertical-align:top;" class="admin-text-small">' + esc(notesText) + '</td>' +
        '</tr>' + splitPanelRowHtml(r)
      );
    }).join('');

    const enrichTargets = rows.filter(rowEligibleForEnrichment);
    const enrichPlanHtml = enrichTargets.length
      ? (
        '<p class="admin-text-small" style="margin:0 0 0.5rem;"><strong>Will enrich as:</strong> ' +
        esc(enrichSetPreviewLabel(buildListingSets(enrichTargets))) +
        '</p>' +
        '<p style="margin:0 0 0.75rem;">' +
        '<button type="button" class="btn btn-secondary btn-sm" id="invoice-import-link-listing-set">Link selected as one set</button>' +
        '</p>'
      )
      : '';

    const foreignSummaryHtml = isForeignInvoice() && rows.length
      ? (function () {
        const importLines = rows.filter(function (r) { return r.include && r.disposition !== 'split_parent'; });
        const foreignTotal = foreignGoodsTotalMinor(importLines) / 100;
        const settlement = settlementGbpPenceFromDom();
        let rateNote = '';
        if (settlement && foreignTotal > 0) {
          rateNote = ' · effective rate ≈ £' + (settlement / 100 / foreignTotal).toFixed(4) + ' per 1 ' + invoiceCurrency;
        }
        return '<p class="admin-text-small" style="margin:0 0 0.75rem;">Invoice currency: <strong>' + esc(invoiceCurrency) +
          '</strong> · goods total ' + esc(foreignTotal.toFixed(2)) + ' ' + esc(invoiceCurrency) +
          (settlement ? ' · GBP paid £' + (settlement / 100).toFixed(2) + rateNote : '') + '</p>';
      })()
      : '';

    host.innerHTML =
      '<p class="admin-text-muted" style="margin:0 0 0.75rem;">' +
      rows.length + ' line(s) · ' + included.length + ' selected · ' + valid.length + ' ready to import</p>' +
      foreignSummaryHtml +
      enrichPlanHtml +
      '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.875rem;">' +
      '<thead><tr style="text-align:left;border-bottom:2px solid rgb(var(--color-neutral-300));">' +
      '<th style="padding:0.35rem;">Inc</th><th style="padding:0.35rem;" title="Run listing enrichment on checked shop lines">Enrich</th><th style="padding:0.35rem;">Disposition</th><th style="padding:0.35rem;">Img</th><th style="padding:0.35rem;">Product</th>' +
      '<th style="padding:0.35rem;">Qty</th><th style="padding:0.35rem;">' + esc(costColumnLabel()) + '</th><th style="padding:0.35rem;">Sell</th>' +
      '<th style="padding:0.35rem;">Category</th><th style="padding:0.35rem;">Notes</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table></div>' +
      (blocker && included.length
        ? '<p class="admin-text-small admin-text-muted" style="margin:0.75rem 0 0;">' + esc(blocker) + '</p>'
        : '');

    if (importBtn) {
      importBtn.disabled = busy || valid.length === 0 || !!blocker;
      importBtn.textContent = valid.length
        ? 'Import ' + valid.length + ' item' + (valid.length === 1 ? '' : 's')
        : 'Import items';
    }
    const enrichBtn = el('invoice-import-enrich-selected');
    if (enrichBtn) {
      enrichBtn.disabled = busy || rows.some(function (r) { return r.copy_pending; });
    }
    mountCategoryPickers(host);
    hydrateSuggestedImageThumbs(host);
    updateSettlementFieldVisibility();
  }

  function rowById(id) {
    return rows.find(function (r) { return Number(r.id) === Number(id); });
  }

  function bindPreviewEvents() {
    const host = el('invoice-import-preview');
    if (!host || host._invoiceImportBound) return;
    host._invoiceImportBound = true;

    host.addEventListener('click', function (e) {
      const uploadBtn = e.target.closest('.invoice-import-upload');
      if (uploadBtn) {
        const id = uploadBtn.getAttribute('data-id');
        const fileInput = el('invoice-import-row-file');
        if (fileInput) {
          fileInput._rowId = id;
          fileInput.click();
        }
        return;
      }
      const adjustBtn = e.target.closest('.invoice-import-adjust-crop');
      if (adjustBtn) {
        openAdjustCropForRow(adjustBtn.getAttribute('data-id'));
        return;
      }
      const discardBtn = e.target.closest('.invoice-import-discard-source');
      if (discardBtn) {
        const row = rowById(discardBtn.getAttribute('data-id'));
        if (row) {
          revokeSuggestedThumbBlob(row);
          row.source_image_url = '';
          row.source_image_confidence = null;
          row.source_product_verified = false;
          row.notes = ['Suggested source image discarded'];
          logProgress('Source image discarded', { name: row.name });
          renderPreview();
        }
        return;
      }
      if (e.target.closest('#invoice-import-link-listing-set')) {
        linkSelectedListingSet();
        return;
      }
      const unlinkBtn = e.target.closest('.invoice-import-unlink-set');
      if (unlinkBtn) {
        unlinkListingSetForRow(unlinkBtn.getAttribute('data-id'));
        return;
      }
      const splitExpandBtn = e.target.closest('.invoice-import-split-expand');
      if (splitExpandBtn) {
        expandSplitForRow(splitExpandBtn.getAttribute('data-id'));
        return;
      }
      const splitRemoveBtn = e.target.closest('.invoice-import-split-remove');
      if (splitRemoveBtn) {
        const pid = splitRemoveBtn.getAttribute('data-id');
        if (window.confirm('Remove all split lines for this bundle?')) removeSplitChildren(pid);
        return;
      }
      const genBtn = e.target.closest('.invoice-import-gen-copy');
      if (genBtn) {
        if (genBtn.disabled) return;
        generateCopyForRow(genBtn.getAttribute('data-id'));
        return;
      }
    });

    host.addEventListener('change', function (e) {
      const t = e.target;
      const id = t.getAttribute('data-id');
      if (!id) return;
      const row = rowById(id);
      if (!row) return;
      if (t.classList.contains('invoice-import-include')) row.include = t.checked;
      if (t.classList.contains('invoice-import-enrich')) {
        row.enrich = t.checked;
        renderPreview();
        return;
      }
      if (t.classList.contains('invoice-import-disposition')) {
        row.disposition = t.value;
        if (row.disposition === 'split_parent' || row.disposition === 'event_write_off') {
          row.enrich = false;
        } else if (row.disposition === 'shop') {
          row.enrich = true;
        }
        syncEnrichFlagForRow(row);
        if (row.disposition === 'split_parent' && parentHasChildren(row.id)) {
          row.include = false;
        }
        renderPreview();
        return;
      }
      if (t.classList.contains('invoice-import-child-disp')) {
        row.child_disposition = t.value;
        if (row.child_disposition === 'event_write_off') {
          row.enrich = false;
        } else if (row.child_disposition === 'shop') {
          row.enrich = true;
        }
        syncEnrichFlagForRow(row);
        renderPreview();
        return;
      }
      if (t.classList.contains('invoice-import-override')) {
        row.override_listing = t.checked;
        renderPreview();
        return;
      }
      if (t.classList.contains('invoice-import-name')) row.name = t.value;
      if (t.classList.contains('invoice-import-qty')) row.quantity = parseInt(t.value, 10) || 0;
      if (t.classList.contains('invoice-import-cost')) {
        const p = parseFloat(t.value);
        row.cost_manual = true;
        row.unit_cost_pence = Number.isFinite(p) ? Math.round(p * 100) : null;
        row.unit_net = Number.isFinite(p) ? p : row.unit_net;
      }
      if (t.classList.contains('invoice-import-cost-foreign')) {
        const p = parseFloat(t.value);
        row.cost_manual = true;
        row.unit_foreign_minor = Number.isFinite(p) ? Math.round(p * 100) : null;
        row.unit_cost_pence = null;
        row.unit_net = Number.isFinite(p) ? p : row.unit_net;
      }
      if (t.classList.contains('invoice-import-price')) {
        const p = parseFloat(t.value);
        row.price_manual = true;
        row.price_pence = Number.isFinite(p) ? Math.round(p * 100) : null;
      }
      if (t.classList.contains('invoice-import-summary')) row.summary = t.value;
      if (t.classList.contains('invoice-import-split-text')) row.split_text = t.value;
      if (t.classList.contains('invoice-import-split-default-qty')) {
        row.split_default_qty = parseInt(t.value, 10) || 1;
      }
      if (t.classList.contains('invoice-import-split-child-disp')) {
        row.split_child_disposition = t.value;
      }
      renderPreview();
    });

    host.addEventListener('input', function (e) {
      const t = e.target;
      const id = t.getAttribute('data-id');
      if (t.classList.contains('invoice-import-description')) {
        const row = rowById(id);
        if (row) row.description = t.value;
      }
      if (t.classList.contains('invoice-import-split-text')) {
        const row = rowById(id);
        if (row) row.split_text = t.value;
      }
      if (t.classList.contains('invoice-import-price')) {
        const row = rowById(id);
        if (!row) return;
        row.price_manual = true;
        const p = parseFloat(t.value);
        if (Number.isFinite(p)) row.price_pence = Math.round(p * 100);
      }
      if (t.classList.contains('invoice-import-cost')) {
        const row = rowById(id);
        if (!row) return;
        row.cost_manual = true;
        const p = parseFloat(t.value);
        if (Number.isFinite(p)) {
          row.unit_cost_pence = Math.round(p * 100);
          row.unit_net = p;
        }
      }
      if (t.classList.contains('invoice-import-cost-foreign')) {
        const row = rowById(id);
        if (!row) return;
        row.cost_manual = true;
        const p = parseFloat(t.value);
        if (Number.isFinite(p)) {
          row.unit_foreign_minor = Math.round(p * 100);
          row.unit_cost_pence = null;
          row.unit_net = p;
        }
      }
    });
  }

  function uploadCroppedProductImage(row, croppedImage, successNote) {
    row.image_pending = true;
    renderPreview();
    logProgress('Uploading cropped product image to storage…', { name: row.name });
    return window.utils.uploadAdminImage(croppedImage, 'invoice-product.jpg')
      .then(function (url) {
        revokeSuggestedThumbBlob(row);
        row.image_url = url;
        row.notes = [successNote || 'Product image saved'];
        logProgress('Product image saved to storage', { name: row.name, url: url });
      })
      .catch(function (err) {
        row.notes = ['Upload failed: ' + err.message];
      })
      .finally(function () {
        row.image_pending = false;
        renderPreview();
      });
  }

  function bindRowFileInput() {
    const fileInput = el('invoice-import-row-file');
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
        uploadCroppedProductImage(row, croppedImage);
      }, 336 / 220, 'product');
    });
  }

  async function openAdjustCropForRow(id) {
    const row = rowById(id);
    if (!row || !row.source_image_url || typeof global.showCropModal !== 'function') return;
    if (!window.utils || !window.utils.productImage) {
      setStatus('Product image tools are not loaded.', 'warn');
      return;
    }
    logProgress('Loading suggested image for review (not uploaded yet)…', { name: row.name });
    row.image_pending = true;
    renderPreview();
    try {
      const framed = await window.utils.productImage.exportProductImageFromUrl(row.source_image_url);
      row.image_pending = false;
      renderPreview();
      global.showCropModal(framed, function (croppedImage) {
        uploadCroppedProductImage(row, croppedImage, 'Product image saved after review');
      }, 336 / 220, 'product');
    } catch (e) {
      row.image_pending = false;
      setStatus('Could not load source image for crop: ' + e.message, 'err');
      logProgress('Review crop failed to load source', { name: row.name, error: e.message });
      renderPreview();
    }
  }

  function applyEnrichmentApiResult(row, data) {
    if (data.display_name) row.name = String(data.display_name).trim().slice(0, 200);
    row.summary = data.summary || '';
    row.description = data.description || '';
    if (data.image_url) {
      row.source_image_url = data.image_url;
      row.source_image_confidence = data.confidence != null ? Number(data.confidence) : null;
      row.source_product_verified = data.product_verified === true;
    }
    const secs = data.duration_ms != null ? Math.round(data.duration_ms / 1000) : null;
    const srcLabel =
      data.copy_source === 'web_search'
        ? 'web research'
        : data.copy_source === 'family'
          ? 'harmonised family set'
          : 'chat fallback';
    let note = 'Listing enriched (' + srcLabel + (secs != null ? ', ' + secs + 's' : '') + ')';
    if (data.image_url) {
      note += '; suggested image pending review (not saved)';
    } else if (data.image_rejected) {
      note += '; no suitable image (' + data.image_rejected + ')';
    }
    row.notes = [note];
    return { secs: secs, srcLabel: srcLabel };
  }

  async function generateCopyForRowInternal(row, mistralKey, quiet, batchMeta) {
    if (!row || row.copy_pending) return false;
    row.copy_pending = true;
    renderPreview();
    const batchLabel = batchMeta && batchMeta.total
      ? '(' + batchMeta.index + '/' + batchMeta.total + ') '
      : '';
    const started = Date.now();
    logProgress('Enrichment started ' + batchLabel + row.name, {
      ean: row.ean || null,
      category: row.category || null
    });
    try {
      if (!quiet) {
        setStatus('Enriching listing (web research can take 30–60 seconds)…', 'info');
      }
      const data = await api('/admin/invoice-import/generate-copy', {
        method: 'POST',
        body: JSON.stringify({
          name: row.name,
          ean: row.ean || null,
          category: row.category || null,
          mistral_api_key: mistralKey
        })
      });
      const meta = applyEnrichmentApiResult(row, data);
      logProgress('Enrichment API done ' + batchLabel + row.name, {
        ms: Date.now() - started,
        copy_source: data.copy_source,
        web_search_ms: data.web_search_ms,
        suggested_image: !!data.image_url,
        image_rejected: data.image_rejected || null,
        product_verified: data.product_verified,
        saved_to_storage: false
      });
      if (data.image_url && !row.image_url) {
        logProgress('Suggested source image ready for review (use Review and crop to save)', {
          name: row.name,
          confidence: data.confidence,
          product_verified: data.product_verified
        });
      }
      if (!quiet) {
        setStatus(
          'Listing updated for: ' + row.name +
          (meta.secs != null ? ' (' + meta.secs + 's, ' + meta.srcLabel + ')' : ''),
          'ok'
        );
      }
      if (data.web_search_ms != null) {
        appendLog(
          (quiet ? row.name + ': ' : 'Enrichment timing: ') +
          'web search ' + Math.round(data.web_search_ms / 1000) + 's, total ' + (meta.secs || '?') + 's'
        );
      } else if (quiet) {
        appendLog('Enrichment OK: ' + row.name + (row.source_image_url && !row.image_url ? ' (suggested image)' : '') + (row.image_url ? ' (saved)' : ''));
      }
      logProgress('Enrichment complete ' + batchLabel + row.name, {
        ms: Date.now() - started,
        has_shop_image: !!row.image_url
      });
      return true;
    } catch (e) {
      logProgress('Enrichment failed ' + batchLabel + row.name, {
        ms: Date.now() - started,
        error: e.message
      });
      if (!quiet) {
        setStatus('Listing enrichment failed: ' + e.message, 'err');
      }
      appendLog('Enrichment failed: ' + row.name + ' — ' + e.message);
      return false;
    } finally {
      row.copy_pending = false;
      renderPreview();
    }
  }

  async function enrichSelectedRows() {
    const mistralKey = getMistralKey();
    if (!mistralKey) {
      setStatus('Save your Mistral API key first (required for listing enrichment).', 'warn');
      return;
    }
    const targets = rows.filter(rowEligibleForEnrichment);
    if (!targets.length) {
      setStatus('No lines selected for enrichment. Tick Enrich on shop lines first.', 'warn');
      return;
    }
    const sets = buildListingSets(targets);
    busy = true;
    renderPreview();
    logProgress('Enrichment batch starting', { lines: targets.length, sets: sets.length });
    appendLog('Enriching ' + targets.length + ' line(s) in ' + sets.length + ' listing set(s)…');
    const batchStarted = Date.now();
    let ok = 0;
    try {
      for (let si = 0; si < sets.length; si++) {
        const set = sets[si];
        if (set.mode === 'family') {
          setStatus(
            'Harmonised family set (' + (si + 1) + ' of ' + sets.length + '): ' + set.rows.length + ' lines…',
            'info'
          );
          ok += await enrichFamilySetInternal(set, mistralKey, true);
        } else {
          const r = set.rows[0];
          setStatus(
            'Enriching single (' + (si + 1) + ' of ' + sets.length + '): ' + r.name + '…',
            'info'
          );
          const success = await generateCopyForRowInternal(r, mistralKey, true, {
            index: si + 1,
            total: sets.length
          });
          if (success) ok++;
        }
      }
      logProgress('Enrichment batch finished', {
        ok: ok,
        total: targets.length,
        ms: Date.now() - batchStarted
      });
      setStatus(
        'Listing enrichment finished for ' + ok + ' of ' + targets.length + ' selected line(s). Review images before import.',
        ok ? 'ok' : 'warn'
      );
    } finally {
      busy = false;
      renderPreview();
    }
  }

  async function generateCopyForRow(id) {
    const row = rowById(id);
    if (!row) return;
    if (!rowCanOfferEnrichment(row)) {
      setStatus('This line is not eligible for listing enrichment.', 'warn');
      return;
    }
    const mistralKey = getMistralKey();
    if (!mistralKey) {
      setStatus('Save your Mistral API key first (required for listing enrichment).', 'warn');
      return;
    }
    await generateCopyForRowInternal(row, mistralKey, false);
  }

  async function expandSplitForRow(parentId) {
    syncSplitDraftsFromDom();
    const parent = rowById(parentId);
    if (!parent || parent.disposition !== 'split_parent') return;
    if (parentHasChildren(parent.id)) {
      const ok = window.confirm('Replace existing split children for this line?');
      if (!ok) return;
      rows = rows.filter(function (r) { return r.parent_id !== parent.id; });
    }
    const text = String(parent.split_text || '').trim();
    const defaultQty = parseInt(parent.split_default_qty, 10) || 1;
    const childDisp = parent.split_child_disposition || 'shop';
    if (!text) {
      setStatus('Paste bundle line text in the split panel for this row first.', 'warn');
      return;
    }
    const mistralKey = getMistralKey();
    if (!mistralKey) {
      setStatus('Save your Mistral API key first (required for split expansion).', 'warn');
      return;
    }
    busy = true;
    setStatus('Expanding bundle lines for: ' + parent.name + '…', 'info');
    renderPreview();
    try {
      const data = await api('/admin/invoice-import/expand-split', {
        method: 'POST',
        body: JSON.stringify({
          text: text,
          default_quantity: defaultQty,
          mistral_api_key: mistralKey
        })
      });
      const childLines = data.lines || [];
      const qtys = childLines.map(function (l) { return l.quantity || defaultQty; });
      const parentUnit = isForeignInvoice() ? rowForeignMinor(parent) : parent.unit_cost_pence;
      const unitCosts = allocateSplitUnitCosts(parentUnit, parent.quantity, qtys);
      const mult = multiplierValue();
      const parentIndex = rows.findIndex(function (r) { return r.id === parent.id; });
      const splitSetId = 'split-' + parent.id;
      const newChildren = [];
      childLines.forEach(function (line, i) {
        const ean = normalizeEan(line.ean);
        const existing = ean ? productByEan[ean] : null;
        const listed = existing && (existing.catalog_status || 'listed') === 'listed' && Number(existing.is_active) === 1;
        const unitPence = unitCosts[i];
        const unitNet = unitPence != null ? unitPence / 100 : parent.unit_net;
        const childRow = {
          id: newRowId(),
          include: true,
          enrich: false,
          disposition: 'split_child',
          parent_id: parent.id,
          child_disposition: childDisp,
          name: line.name,
          ean: ean,
          sku: line.sku || '',
          quantity: qtys[i],
          unit_net: unitNet,
          unit_cost_pence: isForeignInvoice() ? null : unitPence,
          unit_foreign_minor: isForeignInvoice() ? unitPence : null,
          price_pence: retailPricePence(unitNet, mult),
          price_manual: false,
          cost_manual: true,
          category: '',
          summary: '',
          description: '',
          image_url: '',
          source_image_url: '',
          source_image_confidence: null,
          source_product_verified: false,
          image_pending: false,
          copy_pending: false,
          existing_listed: !!listed,
          existing_product_id: existing ? existing.id : null,
          override_listing: false,
          notes: ['Split from ' + parent.name],
          split_text: '',
          split_default_qty: 1,
          split_child_disposition: 'shop',
          listing_set_id: splitSetId
        };
        childRow.enrich = childDisp === 'shop';
        newChildren.push(childRow);
      });
      if (parentIndex >= 0) {
        rows.splice(parentIndex + 1, 0, ...newChildren);
      } else {
        rows.push.apply(rows, newChildren);
      }
      parent.include = false;
      setStatus('Added ' + childLines.length + ' split line(s) for ' + parent.name + '.', 'ok');
      renderPreview();
    } catch (e) {
      setStatus('Split failed: ' + e.message, 'err');
    } finally {
      busy = false;
      renderPreview();
    }
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
    logProgress('Parse started', { file: file.name, size_kb: Math.round(file.size / 1024) });
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await loadProductsForMatch();
      logProgress('OCR request sending…');
      const ocrStarted = Date.now();
      const data = await api('/admin/invoice-import/parse', {
        method: 'POST',
        body: JSON.stringify({ pdf_base64: dataUrl, mistral_api_key: mistralKey })
      });
      logProgress('OCR finished', {
        ms: Date.now() - ocrStarted,
        lines: (data.lines || []).length,
        supplier: data.supplier_name || null
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
      invoiceCurrency = normalizeInvoiceCurrencyCode(data.currency);
      updateSettlementFieldVisibility();
      rows = buildRowsFromParse(data);
      renderPreview();
      setStatus(
        'Parsed ' + rows.length + ' line(s). Set disposition and splits, tick Enrich on shop lines, then Enrich selected.',
        'ok'
      );
    } catch (e) {
      logProgress('Parse failed', { error: e.message });
      setStatus('Parse failed: ' + e.message, 'err');
    } finally {
      busy = false;
      renderPreview();
    }
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

  function buildLinePayload(r) {
    if (global.ShopImportLinePayload) {
      return ShopImportLinePayload.fromInvoiceRow(r, {
        isEventLine: isEventLine,
        isForeignInvoice: isForeignInvoice
      });
    }
    const payload = {
      entry_method: 'manual',
      quantity: r.quantity,
      ean: r.ean || null
    };
    if (isForeignInvoice()) {
      payload.unit_foreign_minor = rowForeignMinor(r);
    } else {
      payload.unit_cost_pence = r.unit_cost_pence;
    }
    if (isEventLine(r)) {
      payload.disposition = 'event_write_off';
      if (r.existing_product_id) {
        payload.product_id = r.existing_product_id;
      } else {
        payload.name = r.name;
      }
      return payload;
    }
    if (r.existing_listed && !r.override_listing) {
      payload.product_id = r.existing_product_id;
      return payload;
    }
    payload.name = r.name;
    payload.price_pence = r.price_pence;
    payload.category = global.ShopCategories
      ? ShopCategories.normalizeField(r.category)
      : r.category;
    payload.summary = (r.summary || r.name).slice(0, 500);
    if (r.description) payload.description = r.description;
    if (r.image_url) payload.image_url = r.image_url;
    if (r.existing_listed && r.override_listing) {
      payload.product_id = r.existing_product_id;
    }
    return payload;
  }

  async function importRows() {
    const supplier = String(el('invoice-import-supplier') && el('invoice-import-supplier').value || '').trim();
    const receivedDate = el('invoice-import-received-date') && el('invoice-import-received-date').value;
    if (!supplier || !receivedDate) {
      setStatus('Supplier and receipt date are required.', 'warn');
      return;
    }
    const toImport = rowsEligibleForImport();
    if (!toImport.length) {
      setStatus(importBlockerMessage() || 'No valid rows to import.', 'warn');
      return;
    }
    if (isForeignInvoice() && !settlementGbpPenceFromDom()) {
      setStatus('Enter the amount paid in GBP for this invoice.', 'warn');
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

      const sessionBody = Object.assign({
        supplier: supplier,
        received_date: receivedDate,
        reference: (el('invoice-import-reference') && el('invoice-import-reference').value) || null,
        notes: (el('invoice-import-notes') && el('invoice-import-notes').value) || 'Supplier invoice import',
        receipt_url: receiptUrl,
        invoice_currency: invoiceCurrency
      }, sessionPaidBody());
      if (isForeignInvoice()) {
        sessionBody.settlement_amount_pence = settlementGbpPenceFromDom();
      }
      const session = await api('/admin/finance/import-sessions', {
        method: 'POST',
        body: JSON.stringify(sessionBody)
      });

      const sessionId = session.id;
      appendLog('Session #' + sessionId + ' created.');

      const linePayloads = toImport.map(function (r) { return buildLinePayload(r); });
      try {
        const batch = await api('/admin/finance/import-sessions/' + sessionId + '/lines/batch', {
          method: 'POST',
          body: JSON.stringify({ lines: linePayloads })
        });
        (batch.lines || []).forEach(function (_line, i) {
          appendLog('Added: ' + toImport[i].name + (isEventLine(toImport[i]) ? ' (event write-off)' : ''));
        });
      } catch (e) {
        appendLog('Batch import failed: ' + e.message);
        throw e;
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
    bindRowFileInput();
    const on = function (id, evt, fn) {
      const node = el(id);
      if (node) node.addEventListener(evt, fn);
    };
    on('invoice-import-save-key', 'click', saveMistralKey);
    on('invoice-import-parse', 'click', parseInvoice);
    on('invoice-import-enrich-selected', 'click', enrichSelectedRows);
    on('invoice-import-multiplier', 'change', renderPreview);
    on('invoice-import-supplier', 'input', renderPreview);
    on('invoice-import-received-date', 'change', renderPreview);
    on('invoice-import-settlement-gbp', 'input', renderPreview);
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
    updateSettlementFieldVisibility();
    if (el('invoice-import-received-date') && !el('invoice-import-received-date').value) {
      const d = new Date();
      el('invoice-import-received-date').value =
        d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
  }

  global.ShopInvoiceImportAdmin = { init: init };
})(typeof window !== 'undefined' ? window : globalThis);
