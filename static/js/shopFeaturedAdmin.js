/**
 * Featured products/categories admin (Products tab).
 * Four cards shown at the top of shop.dicebastion.com with no heading.
 * Each slot picks a product or category; display name and image are optional
 * overrides (blank falls back to the product/category defaults).
 * Kept outside the admin markdown so HTML strings cannot break the inline script.
 */
(function (global) {
  const SLOT_COUNT = 4;

  let slots = [];
  let products = [];
  let categories = [];

  function escapeHtml(s) {
    if (global.escapeCsvHtml) return global.escapeCsvHtml(s);
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function sessionToken() {
    if (global.utils && global.utils.session && typeof global.utils.session.get === 'function') {
      return global.utils.session.get() || '';
    }
    return global.sessionToken || '';
  }

  function apiBase() {
    if (global.utils && global.utils.getApiBase) return global.utils.getApiBase();
    return global.API_BASE || '';
  }

  function jsonHeaders() {
    if (typeof global.adminJsonHeaders === 'function') return global.adminJsonHeaders();
    return {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken()
    };
  }

  function byName(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''), 'en', { sensitivity: 'base' });
  }

  function emptySlot(i) {
    return { slot: i, kind: '', ref: '', custom_name: '', image_url: '' };
  }

  function normalizeSlots(rows) {
    const out = [];
    for (let i = 0; i < SLOT_COUNT; i++) out.push(emptySlot(i));
    (Array.isArray(rows) ? rows : []).forEach(function (row) {
      const slot = Number(row.slot);
      if (!Number.isInteger(slot) || slot < 0 || slot >= SLOT_COUNT) return;
      out[slot] = {
        slot: slot,
        kind: row.kind === 'category' || row.kind === 'product' ? row.kind : '',
        ref: String(row.ref || ''),
        custom_name: String(row.custom_name || ''),
        image_url: String(row.image_url || '')
      };
    });
    return out;
  }

  function productByRef(ref) {
    return products.find(function (p) { return String(p.id) === String(ref); }) || null;
  }

  function categoryByRef(ref) {
    const key = String(ref || '').trim().toLowerCase();
    return categories.find(function (c) { return String(c.name || '').trim().toLowerCase() === key; }) || null;
  }

  function defaultName(slot) {
    if (slot.kind === 'product') {
      const p = productByRef(slot.ref);
      return p ? String(p.name || '') : '';
    }
    if (slot.kind === 'category') {
      const c = categoryByRef(slot.ref);
      return c ? String(c.name || '') : '';
    }
    return '';
  }

  function defaultImage(slot) {
    if (slot.kind === 'product') {
      const p = productByRef(slot.ref);
      return p ? String(p.image_url || '') : '';
    }
    if (slot.kind === 'category') {
      const c = categoryByRef(slot.ref);
      return c ? String(c.seo_image || '') : '';
    }
    return '';
  }

  function refOptionsHtml(slot) {
    if (slot.kind === 'product') {
      const opts = ['<option value="">Select a product (' + products.length + ')</option>'];
      products.slice().sort(byName).forEach(function (p) {
        const label = String(p.name || '(unnamed)') + (Number(p.is_active) === 1 ? '' : ' (inactive)');
        const selected = String(slot.ref) === String(p.id) ? ' selected' : '';
        opts.push('<option value="' + escapeHtml(p.id) + '"' + selected + '>' + escapeHtml(label) + '</option>');
      });
      return opts.join('');
    }
    if (slot.kind === 'category') {
      const opts = ['<option value="">Select a category (' + categories.length + ')</option>'];
      categories.slice().sort(byName).forEach(function (c) {
        const count = Number(c.product_count) || 0;
        const selected = String(slot.ref).toLowerCase() === String(c.name || '').toLowerCase() ? ' selected' : '';
        opts.push('<option value="' + escapeHtml(c.name) + '"' + selected + '>' + escapeHtml(c.name) + ' (' + count + ')</option>');
      });
      return opts.join('');
    }
    return '<option value="">Choose a type first</option>';
  }

  function slotHtml(slot, index) {
    const kindOptions = [
      '<option value=""' + (slot.kind === '' ? ' selected' : '') + '>Empty</option>',
      '<option value="product"' + (slot.kind === 'product' ? ' selected' : '') + '>Product</option>',
      '<option value="category"' + (slot.kind === 'category' ? ' selected' : '') + '>Category</option>'
    ].join('');

    const defName = defaultName(slot);
    const defImage = defaultImage(slot);
    const effImage = slot.image_url || defImage;
    const imgHtml = effImage
      ? '<img src="' + escapeHtml(effImage) + '" alt="" referrerpolicy="no-referrer" loading="lazy" class="shop-featured-preview" onerror="this.style.display=\'none\'">'
      : '<span class="admin-text-small">No image</span>';
    const imgNote = slot.image_url
      ? '<small class="admin-text-small">Custom image. <button type="button" class="btn btn-secondary btn-sm shop-featured-clear-img" data-slot="' + index + '">Use default image</button></small>'
      : (defImage
        ? '<small class="admin-text-small">Using the default image (' + escapeHtml(slot.kind === 'product' ? 'product' : 'category featured') + '). Upload to override.</small>'
        : '<small class="admin-text-small">No default image. Upload one below.</small>');

    return (
      '<div class="item-card shop-featured-slot" data-slot="' + index + '" style="display:block;margin:0 0 1rem;">' +
        '<div class="admin-flex-between" style="margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem;">' +
          '<h3 style="margin:0;">Card ' + (index + 1) + '</h3>' +
          '<select class="form-select shop-featured-kind" data-slot="' + index + '" style="max-width:12rem;" aria-label="Card ' + (index + 1) + ' type">' + kindOptions + '</select>' +
        '</div>' +
        '<div class="admin-grid-2 admin-mb-1">' +
          '<div>' +
            '<label class="form-label">Product or category</label>' +
            '<select class="form-select shop-featured-ref" data-slot="' + index + '">' + refOptionsHtml(slot) + '</select>' +
          '</div>' +
          '<div>' +
            '<label class="form-label">Display name (optional)</label>' +
            '<input type="text" class="form-input shop-featured-name" data-slot="' + index + '" maxlength="120" value="' + escapeHtml(slot.custom_name) + '" placeholder="' + escapeHtml(defName || 'Default name') + '">' +
          '</div>' +
        '</div>' +
        '<div class="admin-flex" style="gap:0.75rem;align-items:center;flex-wrap:wrap;">' +
          imgHtml +
          '<button type="button" class="btn btn-secondary btn-sm shop-featured-upload" data-slot="' + index + '">Upload image</button>' +
          '<input type="file" accept="image/*" class="shop-featured-file" data-slot="' + index + '" hidden>' +
        '</div>' +
        '<div style="margin-top:0.4rem;">' + imgNote + '</div>' +
      '</div>'
    );
  }

  function render() {
    const host = document.getElementById('shop-featured-slots');
    if (!host) return;
    host.innerHTML = slots.map(function (slot, i) { return slotHtml(slot, i); }).join('');
  }

  function setStatus(message, kind) {
    const el = document.getElementById('shop-featured-status');
    if (!el) return;
    el.style.display = message ? 'block' : 'none';
    el.textContent = message || '';
    const colors = {
      info: { bg: 'rgba(var(--color-primary-50), 0.5)', color: 'rgb(var(--color-neutral-800))' },
      ok: { bg: '#ecfdf5', color: '#065f46' },
      err: { bg: '#fee2e2', color: '#991b1b' }
    };
    const c = colors[kind] || colors.info;
    el.style.background = c.bg;
    el.style.color = c.color;
  }

  async function load() {
    const host = document.getElementById('shop-featured-slots');
    if (!host) return;
    const token = sessionToken();
    if (!token) return;
    host.innerHTML = '<p class="admin-text-muted" style="margin:0;">Loading featured cards…</p>';
    try {
      const [featuredRes, productsRes, categoriesRes] = await Promise.all([
        fetch(apiBase() + '/admin/shop-featured', { headers: { 'X-Session-Token': token } }),
        fetch(apiBase() + '/admin/products', { headers: { 'X-Session-Token': token } }),
        fetch(apiBase() + '/admin/product-categories', { headers: { 'X-Session-Token': token } })
      ]);
      const featuredData = await featuredRes.json().catch(function () { return {}; });
      const productsData = await productsRes.json().catch(function () { return []; });
      const categoriesData = await categoriesRes.json().catch(function () { return {}; });
      if (!featuredRes.ok) {
        host.innerHTML = '<p class="admin-text-muted" style="margin:0;">Could not load featured cards (' +
          escapeHtml(featuredData.error || featuredRes.status) + '). Deploy the Worker if this is a new endpoint.</p>';
        return;
      }
      products = Array.isArray(productsData) ? productsData : [];
      categories = Array.isArray(categoriesData.categories) ? categoriesData.categories : [];
      slots = normalizeSlots(featuredData.cards);
      render();
    } catch (err) {
      console.error(err);
      host.innerHTML = '<p class="admin-text-muted" style="margin:0;">Could not load featured cards (network error).</p>';
    }
  }

  function collectSlots() {
    return slots.map(function (slot, i) {
      return {
        slot: i,
        kind: slot.kind,
        ref: slot.ref,
        custom_name: slot.custom_name,
        image_url: slot.image_url
      };
    });
  }

  async function save() {
    const btn = document.getElementById('shop-featured-save-btn');
    if (btn) btn.disabled = true;
    setStatus('Saving…', 'info');
    try {
      const res = await fetch(apiBase() + '/admin/shop-featured', {
        method: 'PUT',
        headers: jsonHeaders(),
        body: JSON.stringify({ cards: collectSlots() })
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || res.statusText);
      slots = normalizeSlots(data.cards);
      render();
      setStatus('Saved. The four cards at the top of the shop update right away.', 'ok');
    } catch (err) {
      setStatus('Save failed: ' + String(err.message || err), 'err');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function bindFeaturedAdminUi() {
    const host = document.getElementById('shop-featured-slots');
    if (host && host.getAttribute('data-featured-bound') !== '1') {
      host.setAttribute('data-featured-bound', '1');

      host.addEventListener('change', function (e) {
        const target = e.target;
        if (!target || !target.dataset) return;
        const i = Number(target.dataset.slot);
        if (!Number.isInteger(i) || !slots[i]) return;
        if (target.classList.contains('shop-featured-kind')) {
          slots[i].kind = target.value;
          slots[i].ref = '';
          render();
          return;
        }
        if (target.classList.contains('shop-featured-ref')) {
          slots[i].ref = target.value || '';
          render();
          return;
        }
        if (target.classList.contains('shop-featured-file')) {
          const file = target.files && target.files[0];
          target.value = '';
          if (!file) return;
          if (typeof global.showCropModal !== 'function') {
            alert('Image cropper is not available. Refresh the page and try again.');
            return;
          }
          global.showCropModal(file, function (url) {
            if (url && slots[i]) {
              slots[i].image_url = url;
              render();
            }
          });
        }
      });

      host.addEventListener('input', function (e) {
        const target = e.target;
        if (!target || !target.dataset) return;
        const i = Number(target.dataset.slot);
        if (!Number.isInteger(i) || !slots[i]) return;
        if (target.classList.contains('shop-featured-name')) {
          slots[i].custom_name = target.value;
        }
      });

      host.addEventListener('click', function (e) {
        const uploadBtn = e.target.closest('.shop-featured-upload');
        if (uploadBtn) {
          const i = Number(uploadBtn.getAttribute('data-slot'));
          const fileInput = host.querySelector('.shop-featured-file[data-slot="' + i + '"]');
          if (fileInput) fileInput.click();
          return;
        }
        const clearBtn = e.target.closest('.shop-featured-clear-img');
        if (clearBtn) {
          const i = Number(clearBtn.getAttribute('data-slot'));
          if (slots[i]) {
            slots[i].image_url = '';
            render();
          }
        }
      });
    }

    const refreshBtn = document.getElementById('shop-featured-refresh-btn');
    if (refreshBtn && refreshBtn.getAttribute('data-featured-bound') !== '1') {
      refreshBtn.setAttribute('data-featured-bound', '1');
      refreshBtn.addEventListener('click', load);
    }

    const saveBtn = document.getElementById('shop-featured-save-btn');
    if (saveBtn && saveBtn.getAttribute('data-featured-bound') !== '1') {
      saveBtn.setAttribute('data-featured-bound', '1');
      saveBtn.addEventListener('click', save);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindFeaturedAdminUi();
    if (sessionToken()) load();
  });
  if (document.readyState !== 'loading') {
    bindFeaturedAdminUi();
    if (sessionToken()) load();
  }

  global.ShopFeaturedAdmin = { load: load, render: render, save: save };
})(typeof window !== 'undefined' ? window : globalThis);
