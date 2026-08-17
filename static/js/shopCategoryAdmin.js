/**
 * Shop category admin (kept outside Hugo markdown so HTML strings cannot
 * break the admin <script> block — e.g. </textarea> closing the page early).
 */
(function (global) {
  function escapeHtml(s) {
    if (global.escapeCsvHtml) return global.escapeCsvHtml(s);
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function apiBase() {
    return global.API_BASE || (global.utils && global.utils.getApiBase && global.utils.getApiBase()) || '';
  }

  function jsonHeaders() {
    if (typeof global.adminJsonHeaders === 'function') return global.adminJsonHeaders();
    return {
      'Content-Type': 'application/json',
      'X-Session-Token': global.sessionToken
    };
  }

  function categoryCanonicalUrl(name) {
    return 'https://shop.dicebastion.com/products/category/' + encodeURIComponent(name);
  }

  async function copyUrlToClipboard(url, btn) {
    const orig = btn ? btn.textContent : 'Copy URL';
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error('clipboard unavailable');
      }
      await navigator.clipboard.writeText(url);
      if (btn) {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = orig; }, 1600);
      }
    } catch (err) {
      window.prompt('Copy this URL for Google Search Console', url);
    }
  }

  async function copyProductSeoUrl(slug, btn) {
    if (!slug) return;
    await copyUrlToClipboard('https://shop.dicebastion.com/products/' + encodeURIComponent(slug), btn);
  }

  async function copyCategorySeoUrl(name, btn) {
    if (!name) return;
    await copyUrlToClipboard(categoryCanonicalUrl(name), btn);
  }

  function categoryCardHtml(row) {
    const name = escapeHtml(row.name);
    const nameAttr = encodeURIComponent(row.name || '');
    const canonical = categoryCanonicalUrl(row.name || '');
    const count = Number(row.product_count) || 0;
    const plural = count === 1 ? '' : 's';
    const featured = row.featured ? ' checked' : '';
    const sortOrder = Number(row.sort_order) || 0;
    return (
      '<div class="item-card shop-cat-card" style="display:block;margin-bottom:0.75rem;">' +
        '<div class="admin-flex-between" style="margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem;">' +
          '<h3 style="margin:0;">' + name + ' <span class="admin-text-small">' + count + ' product' + plural + '</span></h3>' +
          '<div class="admin-flex" style="gap:0.5rem;flex-wrap:wrap;">' +
            '<button type="button" class="btn-copy shop-cat-copy-url" data-name="' + nameAttr + '">Copy URL</button>' +
            '<button type="button" class="btn btn-primary btn-sm shop-cat-save" data-name="' + nameAttr + '">Save</button>' +
          '</div>' +
        '</div>' +
        '<p class="admin-text-small" style="margin:0 0 0.75rem;word-break:break-all;">' + escapeHtml(canonical) + '</p>' +
        '<div class="admin-grid-3 admin-mb-1" style="align-items:end;">' +
          '<div>' +
            '<label class="form-label">Featured</label>' +
            '<label style="display:inline-flex;align-items:center;gap:0.35rem;cursor:pointer;">' +
              '<input type="checkbox" class="shop-cat-featured"' + featured + '>' +
              '<span class="admin-text-small">Pin front</span>' +
            '</label>' +
          '</div>' +
          '<div>' +
            '<label class="form-label">Order</label>' +
            '<input type="number" class="form-input shop-cat-order" min="0" max="9999" value="' + sortOrder + '">' +
          '</div>' +
          '<div>' +
            '<label class="form-label">Search keywords</label>' +
            '<input type="text" class="form-input shop-cat-keywords" value="' + escapeHtml(row.keywords || '') + '" placeholder="e.g. mtg, magic">' +
          '</div>' +
        '</div>' +
        '<div class="admin-mb-1">' +
          '<label class="form-label">SEO title</label>' +
          '<input type="text" class="form-input shop-cat-seo-title" maxlength="120" value="' + escapeHtml(row.seo_title || '') + '" placeholder="Category | Dice Bastion Shop, Gibraltar">' +
        '</div>' +
        '<div class="admin-mb-1">' +
          '<label class="form-label">SEO description</label>' +
          '<textarea class="form-textarea shop-cat-seo-description" rows="2" maxlength="320" placeholder="Shown in Google and when this category is shared">' +
            escapeHtml(row.seo_description || '') +
          '</textarea>' +
        '</div>' +
        '<div>' +
          '<label class="form-label">SEO image URL</label>' +
          '<input type="url" class="form-input shop-cat-seo-image" value="' + escapeHtml(row.seo_image || '') + '" placeholder="Leave blank to use the first listed product">' +
          '<small class="admin-text-small">Overrides the default first-product preview image</small>' +
        '</div>' +
      '</div>'
    );
  }

  async function loadShopCategories() {
    const host = document.getElementById('shop-categories-list');
    if (!host || !global.sessionToken) return;
    try {
      const res = await fetch(apiBase() + '/admin/product-categories', {
        headers: { 'X-Session-Token': global.sessionToken }
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        host.innerHTML = '<p class="admin-text-muted">Could not load categories (' + escapeHtml(data.error || res.status) + '). Deploy the Worker if this is a new endpoint.</p>';
        return;
      }
      const rows = data.categories || [];
      if (!rows.length) {
        host.innerHTML = '<p class="admin-text-muted">No product categories yet. Add categories on products first.</p>';
        return;
      }
      host.innerHTML = rows.map(categoryCardHtml).join('');
    } catch (err) {
      console.error(err);
      host.innerHTML = '<p class="admin-text-muted">Could not load categories (network error).</p>';
    }
  }

  function bindShopCategoryList() {
    const host = document.getElementById('shop-categories-list');
    if (!host || host.getAttribute('data-shop-cat-bound') === '1') return;
    host.setAttribute('data-shop-cat-bound', '1');
    host.addEventListener('click', async function (e) {
      const copyBtn = e.target.closest('.shop-cat-copy-url');
      if (copyBtn) {
        const name = decodeURIComponent(copyBtn.getAttribute('data-name') || '');
        copyCategorySeoUrl(name, copyBtn);
        return;
      }
      const btn = e.target.closest('.shop-cat-save');
      if (!btn) return;
      const card = btn.closest('.shop-cat-card');
      if (!card) return;
      const name = decodeURIComponent(btn.getAttribute('data-name') || '');
      const featured = !!card.querySelector('.shop-cat-featured')?.checked;
      const sort_order = parseInt(card.querySelector('.shop-cat-order')?.value, 10) || 0;
      const keywords = card.querySelector('.shop-cat-keywords')?.value || '';
      const seo_title = card.querySelector('.shop-cat-seo-title')?.value || '';
      const seo_description = card.querySelector('.shop-cat-seo-description')?.value || '';
      const seo_image = card.querySelector('.shop-cat-seo-image')?.value || '';
      btn.disabled = true;
      try {
        const res = await fetch(apiBase() + '/admin/product-categories', {
          method: 'PUT',
          headers: jsonHeaders(),
          body: JSON.stringify({
            name: name,
            featured: featured,
            sort_order: sort_order,
            keywords: keywords,
            seo_title: seo_title,
            seo_description: seo_description,
            seo_image: seo_image
          })
        });
        const data = await res.json().catch(function () { return {}; });
        if (!res.ok) throw new Error(data.error || res.statusText);
        await loadShopCategories();
      } catch (err) {
        alert('Save failed: ' + String(err.message || err));
        btn.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', bindShopCategoryList);
  if (document.readyState !== 'loading') bindShopCategoryList();

  global.loadShopCategories = loadShopCategories;
  global.copyUrlToClipboard = copyUrlToClipboard;
  global.copyProductSeoUrl = copyProductSeoUrl;
  global.copyCategorySeoUrl = copyCategorySeoUrl;
})(typeof window !== 'undefined' ? window : globalThis);
