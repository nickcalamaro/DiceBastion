/**
 * Barcode scanning (phone camera) and catalog autofill for the admin product form.
 * Kept outside Hugo markdown to avoid Goldmark mangling.
 *
 * BarcodeScanner.open({ onDetected }) opens a camera modal and resolves one EAN/UPC.
 * ProductBarcodeLookup.init({...}) wires the EAN field, look-up button and autofill.
 */
(function (global) {
  const PONYFILL_URL = 'https://cdn.jsdelivr.net/npm/barcode-detector@3.2.2/dist/es/ponyfill.js/+esm';
  const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
  const SCAN_INTERVAL_MS = 150;

  function escapeHtml(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Returns digits when the GTIN length and check digit are valid, otherwise null. */
  function validateGtin(raw) {
    const digits = String(raw == null ? '' : raw).replace(/\D/g, '');
    if ([8, 12, 13, 14].indexOf(digits.length) === -1) return null;
    let sum = 0;
    for (let i = digits.length - 2, weight = 3; i >= 0; i--, weight = weight === 3 ? 1 : 3) {
      sum += Number(digits[i]) * weight;
    }
    return (10 - (sum % 10)) % 10 === Number(digits[digits.length - 1]) ? digits : null;
  }

  function forcePonyfill() {
    try {
      return new URLSearchParams(global.location.search).get('barcode_ponyfill') === '1';
    } catch (e) {
      return false;
    }
  }

  let detectorPromise = null;

  function getDetector() {
    if (detectorPromise) return detectorPromise;
    detectorPromise = (async function () {
      if (!forcePonyfill() && 'BarcodeDetector' in global) {
        try {
          const supported = await global.BarcodeDetector.getSupportedFormats();
          const formats = FORMATS.filter(function (f) { return supported.indexOf(f) !== -1; });
          if (formats.length) return new global.BarcodeDetector({ formats: formats });
        } catch (e) {
          console.warn('Native BarcodeDetector unavailable, using ZXing fallback', e);
        }
      }
      const mod = await import(PONYFILL_URL);
      return new mod.BarcodeDetector({ formats: FORMATS });
    })();
    detectorPromise.catch(function () { detectorPromise = null; });
    return detectorPromise;
  }

  // ---------------------------------------------------------------------------
  // Camera modal
  // ---------------------------------------------------------------------------

  const scanner = {
    overlay: null,
    video: null,
    statusEl: null,
    torchBtn: null,
    stream: null,
    timer: null,
    active: false,
    torchOn: false,
    onDetected: null
  };

  function buildOverlay() {
    if (scanner.overlay) return;
    const overlay = document.createElement('div');
    overlay.id = 'barcode-scanner-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'barcode-scanner-title');
    overlay.style.cssText = 'position: fixed; inset: 0; z-index: 10000; display: none; align-items: center; justify-content: center; padding: 1rem; background: rgba(0, 0, 0, 0.75);';
    overlay.innerHTML =
      '<div style="width: 100%; max-width: 480px; background: rgb(var(--color-neutral)); border-radius: 12px; padding: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">' +
        '<h3 id="barcode-scanner-title" style="margin: 0 0 0.75rem; font-size: 1.125rem; color: rgb(var(--color-neutral-900));">Scan barcode</h3>' +
        '<div style="position: relative; width: 100%; aspect-ratio: 4 / 3; background: #000; border-radius: 8px; overflow: hidden;">' +
          '<video id="barcode-scanner-video" playsinline muted style="width: 100%; height: 100%; object-fit: cover;"></video>' +
          '<div aria-hidden="true" style="position: absolute; left: 10%; right: 10%; top: 35%; bottom: 35%; border: 2px solid rgb(var(--color-primary-400)); border-radius: 8px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.25);"></div>' +
        '</div>' +
        '<p id="barcode-scanner-status" class="admin-text-small" style="margin: 0.75rem 0; min-height: 1.25rem; color: rgb(var(--color-neutral-600));">Starting camera...</p>' +
        '<div style="display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap;">' +
          '<button type="button" id="barcode-scanner-torch" class="btn btn-secondary" style="display: none;">Turn on light</button>' +
          '<button type="button" id="barcode-scanner-cancel" class="btn btn-secondary">Cancel</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    scanner.overlay = overlay;
    scanner.video = overlay.querySelector('#barcode-scanner-video');
    scanner.statusEl = overlay.querySelector('#barcode-scanner-status');
    scanner.torchBtn = overlay.querySelector('#barcode-scanner-torch');

    overlay.querySelector('#barcode-scanner-cancel').addEventListener('click', closeScanner);
    scanner.torchBtn.addEventListener('click', toggleTorch);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeScanner(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && scanner.active) closeScanner();
    });
  }

  function setScannerStatus(text) {
    if (scanner.statusEl) scanner.statusEl.textContent = text;
  }

  function cameraErrorMessage(err) {
    const name = err && err.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      return 'Camera access was blocked. Allow camera access for this site in your browser settings, then try again.';
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      return 'No camera was found on this device.';
    }
    if (name === 'NotReadableError') {
      return 'The camera is in use by another app. Close it and try again.';
    }
    return 'Could not start the camera.';
  }

  async function toggleTorch() {
    const track = scanner.stream && scanner.stream.getVideoTracks()[0];
    if (!track) return;
    try {
      scanner.torchOn = !scanner.torchOn;
      await track.applyConstraints({ advanced: [{ torch: scanner.torchOn }] });
      scanner.torchBtn.textContent = scanner.torchOn ? 'Turn off light' : 'Turn on light';
    } catch (e) {
      scanner.torchOn = false;
      scanner.torchBtn.style.display = 'none';
    }
  }

  function stopCamera() {
    if (scanner.timer) clearTimeout(scanner.timer);
    scanner.timer = null;
    if (scanner.stream) {
      scanner.stream.getTracks().forEach(function (t) { t.stop(); });
    }
    scanner.stream = null;
    scanner.torchOn = false;
    if (scanner.video) scanner.video.srcObject = null;
  }

  function closeScanner() {
    scanner.active = false;
    stopCamera();
    if (scanner.overlay) scanner.overlay.style.display = 'none';
    scanner.onDetected = null;
  }

  async function openScanner(options) {
    buildOverlay();
    scanner.onDetected = options && options.onDetected;
    scanner.active = true;
    scanner.overlay.style.display = 'flex';
    scanner.torchBtn.style.display = 'none';
    scanner.torchBtn.textContent = 'Turn on light';
    setScannerStatus('Starting camera...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerStatus('This browser cannot use the camera. Use Chrome on Android, or type the barcode instead.');
      return;
    }

    let detector;
    try {
      const results = await Promise.all([
        getDetector(),
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        })
      ]);
      detector = results[0];
      scanner.stream = results[1];
    } catch (err) {
      console.error('Barcode scanner start failed:', err);
      setScannerStatus(err && err.name ? cameraErrorMessage(err) : 'Could not load the barcode reader. Check your connection and try again.');
      return;
    }

    if (!scanner.active) {
      stopCamera();
      return;
    }

    scanner.video.srcObject = scanner.stream;
    try {
      await scanner.video.play();
    } catch (e) {}

    const track = scanner.stream.getVideoTracks()[0];
    const caps = track && typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
    if (caps && caps.torch) scanner.torchBtn.style.display = '';

    setScannerStatus('Point the camera at the barcode.');

    let lastValue = null;
    const tick = async function () {
      if (!scanner.active) return;
      try {
        if (scanner.video.readyState >= 2) {
          const codes = await detector.detect(scanner.video);
          const value = codes && codes.length ? validateGtin(codes[0].rawValue) : null;
          if (value && value === lastValue) {
            if (navigator.vibrate) navigator.vibrate(80);
            const cb = scanner.onDetected;
            closeScanner();
            if (cb) cb(value);
            return;
          }
          lastValue = value;
        }
      } catch (e) {
        console.warn('Barcode detect error:', e);
      }
      scanner.timer = setTimeout(tick, SCAN_INTERVAL_MS);
    };
    tick();
  }

  global.BarcodeScanner = { open: openScanner, close: closeScanner, validateGtin: validateGtin };

  // ---------------------------------------------------------------------------
  // Catalog lookup and form autofill
  // ---------------------------------------------------------------------------

  const NOTE_CLASS = 'barcode-fill-note';
  let opts = null;
  let lastFillFromScan = false;
  let lookupInFlight = false;

  function el(id) { return document.getElementById(id); }

  function statusEl() { return el('product-ean-status'); }

  function setStatus(html, tone) {
    const box = statusEl();
    if (!box) return;
    if (!html) {
      box.innerHTML = '';
      box.style.display = 'none';
      return;
    }
    const colours = {
      info: 'rgb(var(--color-neutral-600))',
      success: 'rgb(var(--color-primary-700))',
      warning: 'rgb(180, 83, 9)',
      error: 'rgb(185, 28, 28)'
    };
    box.style.display = 'block';
    box.style.color = colours[tone] || colours.info;
    box.innerHTML = html;
  }

  function clearNotes() {
    document.querySelectorAll('.' + NOTE_CLASS).forEach(function (n) { n.remove(); });
  }

  function addNote(anchor, source) {
    if (!anchor || !anchor.parentNode) return;
    const note = document.createElement('small');
    note.className = 'admin-text-small ' + NOTE_CLASS;
    note.style.cssText = 'display: block; margin-top: 0.25rem; color: rgb(var(--color-primary-700));';
    note.textContent = 'From ' + source + '. Check before saving.';
    anchor.parentNode.insertBefore(note, anchor.nextSibling);
  }

  function isEmptyRichText(node) {
    if (!node) return false;
    const text = node.textContent.replace(/\s+/g, '');
    return !text && !node.querySelector('img');
  }

  function formatMoney(amount, currency) {
    try {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'USD' }).format(amount);
    } catch (e) {
      return (currency || '') + ' ' + amount.toFixed(2);
    }
  }

  function apiHeaders() {
    return { 'X-Session-Token': opts.token() || '' };
  }

  function fillForm(product) {
    const source = product.source || 'catalog';
    const filled = [];

    const nameInput = el('product-name');
    if (nameInput && !nameInput.value.trim() && product.name) {
      nameInput.value = product.name;
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      addNote(nameInput, source);
      filled.push('name');
    }

    const summaryInput = el('product-summary');
    if (summaryInput && !summaryInput.value.trim() && product.summary) {
      summaryInput.value = product.summary;
      addNote(summaryInput, source);
      filled.push('summary');
    }

    const description = el('description-content');
    if (description && isEmptyRichText(description) && product.descriptionHtml) {
      description.innerHTML = product.descriptionHtml;
      addNote(description.closest('.admin-editor') || description, source);
      filled.push('description');
    }

    const imageInput = el('product-image');
    const imageUrl = (product.imageUrls || [])[0];
    const hasUpload = opts.hasUploadedImage && opts.hasUploadedImage();
    if (imageInput && !imageInput.value.trim() && !hasUpload && imageUrl) {
      imageInput.value = imageUrl;
      const preview = el('product-image-preview');
      if (preview) {
        preview.innerHTML =
          '<img src="' + escapeHtml(imageUrl) + '" class="image-preview" alt="Catalog image" referrerpolicy="no-referrer">' +
          '<div style="margin-top: 0.5rem;"><button type="button" class="btn btn-secondary" id="barcode-save-image-btn">Save image to our storage</button></div>';
        const saveBtn = el('barcode-save-image-btn');
        if (saveBtn) saveBtn.addEventListener('click', function () { copyImageToStorage(imageUrl, saveBtn); });
      }
      addNote(imageInput, source);
      filled.push('image');
    }

    const stockInput = el('product-stock');
    if (stockInput && stockInput.value === '') {
      stockInput.value = '1';
      filled.push('stock');
    }

    return filled;
  }

  async function copyImageToStorage(url, button) {
    button.disabled = true;
    button.textContent = 'Saving image...';
    try {
      const res = await fetch(opts.apiBase() + '/admin/images/from-url', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, apiHeaders()),
        body: JSON.stringify({ url: url })
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data.url) throw new Error(data.error || 'upload_failed');
      const imageInput = el('product-image');
      if (imageInput) imageInput.value = data.url;
      const preview = el('product-image-preview');
      if (preview) {
        preview.innerHTML = '<img src="' + escapeHtml(data.url) + '" class="image-preview" alt="Saved image">' +
          '<p class="admin-text-small" style="margin: 0.25rem 0 0;">Image saved to our storage.</p>';
      }
    } catch (e) {
      console.error('Image copy failed:', e);
      button.disabled = false;
      button.textContent = 'Save image to our storage';
      const msg = e && e.message === 'not_an_image'
        ? 'That catalog link is not an image.'
        : 'Could not copy the image. You can still save the product with the catalog link, or upload your own image.';
      if (global.Modal && Modal.alert) Modal.alert({ title: 'Image not saved', message: msg });
      else alert(msg);
    }
  }

  function renderResult(data) {
    const p = data.product;
    const filled = fillForm(p);
    const parts = [];

    const what = filled.filter(function (f) { return f !== 'stock'; });
    parts.push('<strong>Found in ' + escapeHtml(p.source) + ':</strong> ' + escapeHtml(p.name || 'Unnamed product') +
      (p.brand ? ' (' + escapeHtml(p.brand) + ')' : '') + '.');
    parts.push(what.length
      ? ' Filled ' + what.join(', ') + '. Fields you had already filled were left alone.'
      : ' All matching fields were already filled, so nothing was changed.');

    if (p.priceHint && (p.priceHint.low || p.priceHint.high)) {
      const low = p.priceHint.low;
      const high = p.priceHint.high;
      const range = low && high && low !== high
        ? formatMoney(low, p.priceHint.currency) + ' to ' + formatMoney(high, p.priceHint.currency)
        : formatMoney(low || high, p.priceHint.currency);
      parts.push('<br>Seen at other retailers for ' + escapeHtml(range) + '. Reference only; set your own price.');
    }

    if (p.categoryHints && p.categoryHints.length) {
      parts.push('<br>Catalog category: ' + p.categoryHints.map(function (c) {
        return '<button type="button" class="btn btn-secondary barcode-category-btn" data-category="' + escapeHtml(c) + '" style="padding: 0.2rem 0.6rem; font-size: 0.8125rem; margin: 0.25rem 0.25rem 0 0;">Add ' + escapeHtml(c) + '</button>';
      }).join(''));
    }

    if (data.quotaRemaining != null) {
      parts.push('<br><span style="color: rgb(var(--color-neutral-500));">' + data.quotaRemaining + ' free lookups left today.</span>');
    } else if (data.cached) {
      parts.push('<br><span style="color: rgb(var(--color-neutral-500));">From saved results; no lookup used.</span>');
    }

    setStatus(parts.join(''), 'success');
    const box = statusEl();
    if (box) {
      box.querySelectorAll('.barcode-category-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (opts.addCategory) opts.addCategory(btn.getAttribute('data-category'));
          btn.disabled = true;
        });
      });
    }
  }

  function renderExisting(existing, data) {
    const archived = existing.catalog_status === 'archived';
    setStatus(
      'This barcode is already used by <strong>' + escapeHtml(existing.name) + '</strong>' +
      (archived ? ' (archived)' : '') + '. ' +
      '<button type="button" class="btn btn-secondary" id="barcode-edit-existing-btn" style="padding: 0.25rem 0.75rem; margin-left: 0.25rem;">Edit existing</button>' +
      (data && data.found ? ' <button type="button" class="btn btn-secondary" id="barcode-fill-anyway-btn" style="padding: 0.25rem 0.75rem; margin-left: 0.25rem;">Fill this form anyway</button>' : ''),
      'warning'
    );
    const editBtn = el('barcode-edit-existing-btn');
    if (editBtn) editBtn.addEventListener('click', function () {
      setStatus('', 'info');
      if (opts.editExisting) opts.editExisting(existing.id);
    });
    const anywayBtn = el('barcode-fill-anyway-btn');
    if (anywayBtn) anywayBtn.addEventListener('click', function () { renderResult(data); });
  }

  function formatResetTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  async function lookup(rawEan, fromScan) {
    if (!opts || lookupInFlight) return;
    const eanInput = el('product-ean');
    const ean = validateGtin(rawEan);
    if (!ean) {
      setStatus('That does not look like a valid barcode. Check the digits and try again.', 'error');
      return;
    }
    if (eanInput) eanInput.value = ean;

    clearNotes();
    lastFillFromScan = !!fromScan;
    lookupInFlight = true;
    setStatus('Looking up ' + escapeHtml(ean) + '...', 'info');

    try {
      const res = await fetch(opts.apiBase() + '/admin/products/barcode-lookup/' + encodeURIComponent(ean), {
        headers: apiHeaders()
      });
      const data = await res.json().catch(function () { return {}; });

      const editingId = Number(el('product-id') && el('product-id').value) || null;
      const existing = data.existingProduct && Number(data.existingProduct.id) !== editingId ? data.existingProduct : null;

      if (res.status === 429 || data.error === 'quota_exceeded') {
        const reset = formatResetTime(data.resetAt);
        setStatus('Daily lookup limit reached' + (reset ? ', resets at ' + escapeHtml(reset) : '') +
          '. The barcode is saved in the EAN field; enter the details by hand.' +
          (existing ? '<br>Note: this barcode is already used by ' + escapeHtml(existing.name) + '.' : ''), 'warning');
        return;
      }
      if (res.status === 401 || res.status === 403) {
        setStatus('Your admin session has expired. Log in again to look up barcodes.', 'error');
        return;
      }
      if (!res.ok) {
        setStatus('Lookup failed. Try again, or enter the details by hand.', 'error');
        return;
      }

      if (existing) {
        renderExisting(existing, data);
        return;
      }
      if (!data.found || !data.product) {
        setStatus('Not found in the catalog. The barcode is saved in the EAN field; enter the details by hand.' +
          (data.quotaRemaining != null ? '<br><span style="color: rgb(var(--color-neutral-500));">' + data.quotaRemaining + ' free lookups left today.</span>' : ''), 'info');
        return;
      }
      renderResult(data);
    } catch (e) {
      console.error('Barcode lookup error:', e);
      setStatus('Lookup failed (network error). Try again, or enter the details by hand.', 'error');
    } finally {
      lookupInFlight = false;
    }
  }

  function startScan() {
    openScanner({ onDetected: function (code) { lookup(code, true); } });
  }

  function init(options) {
    opts = options;
    const eanInput = el('product-ean');
    const scanBtn = el('product-ean-scan-btn');
    const lookupBtn = el('product-ean-lookup-btn');

    if (scanBtn) scanBtn.addEventListener('click', startScan);
    if (lookupBtn) lookupBtn.addEventListener('click', function () { lookup(eanInput && eanInput.value, false); });
    if (eanInput) {
      eanInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        lookup(eanInput.value, false);
      });
    }
  }

  /** Clears notes and status, e.g. when the form is reset. */
  function clear() {
    clearNotes();
    setStatus('', 'info');
  }

  /** Called after a new product is saved; offers a quick rescan when the last fill came from the camera. */
  function afterSave() {
    clearNotes();
    if (!lastFillFromScan) {
      setStatus('', 'info');
      return;
    }
    lastFillFromScan = false;
    setStatus('Product saved. <button type="button" class="btn btn-primary" id="barcode-scan-next-btn" style="padding: 0.25rem 0.75rem; margin-left: 0.25rem;">Scan next product</button>', 'success');
    const next = el('barcode-scan-next-btn');
    if (next) next.addEventListener('click', startScan);
  }

  global.ProductBarcodeLookup = { init: init, lookup: lookup, clear: clear, afterSave: afterSave };
})(window);
