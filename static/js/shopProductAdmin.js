/**
 * Admin product list search + pagination (kept outside Hugo markdown).
 */
(function (global) {
  const PAGE_SIZE = 20;
  let page = 1;
  let query = '';

  function escapeHtml(s) {
    if (global.escapeCsvHtml) return global.escapeCsvHtml(s);
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function categoryLabel(raw) {
    if (global.ShopCategories) return ShopCategories.parseField(raw).join(', ');
    return String(raw || '')
      .split(',')
      .map(function (c) { return c.trim(); })
      .filter(Boolean)
      .join(', ');
  }

  function filteredProducts() {
    const list = Array.isArray(global.adminProductsList) ? global.adminProductsList : [];
    const q = query.trim().toLowerCase();
    if (!q) return list.slice();
    return list.filter(function (p) {
      const name = String(p.name || '').toLowerCase();
      const slug = String(p.slug || '').toLowerCase();
      const summary = String(p.summary || '').toLowerCase();
      const cats = categoryLabel(p.category).toLowerCase();
      return name.indexOf(q) !== -1 || slug.indexOf(q) !== -1 || summary.indexOf(q) !== -1 || cats.indexOf(q) !== -1;
    });
  }

  function render() {
    const list = document.getElementById('products-list');
    const pager = document.getElementById('admin-product-pagination');
    const countEl = document.getElementById('admin-product-count');
    if (!list) return;

    const all = Array.isArray(global.adminProductsList) ? global.adminProductsList : [];
    if (!all.length) {
      list.innerHTML = '<p class="admin-text-muted">No products yet</p>';
      if (countEl) countEl.textContent = '';
      if (pager) pager.innerHTML = '';
      return;
    }

    const filtered = filteredProducts();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    const start = (page - 1) * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);

    if (countEl) {
      if (!filtered.length) {
        countEl.textContent = 'No products match that search.';
      } else {
        const from = start + 1;
        const to = start + slice.length;
        countEl.textContent = 'Showing ' + from + '-' + to + ' of ' + filtered.length +
          (filtered.length !== all.length ? ' (filtered from ' + all.length + ')' : '');
      }
    }

    if (!filtered.length) {
      list.innerHTML = '<p class="admin-text-muted">No products match that search.</p>';
    } else {
      list.innerHTML = slice.map(function (p) {
        const categories = p.category ? categoryLabel(p.category) : 'N/A';
        const inactive = Number(p.is_active) === 1 ? '' : ' <span class="admin-text-small">(Inactive)</span>';
        const img = p.image_url
          ? '<img src="' + escapeHtml(p.image_url) + '" alt="" referrerpolicy="no-referrer" loading="lazy" style="width: 80px; height: 80px; object-fit: contain; border-radius: 6px; background: rgb(var(--color-neutral-100));" onerror="this.style.display=\'none\'">'
          : '';
        const slugAttr = p.slug ? encodeURIComponent(p.slug) : '';
        const nameAttr = encodeURIComponent(p.name || '');
        const copyBtn = p.slug
          ? '<button type="button" class="btn-copy" data-slug="' + slugAttr + '" title="Copy Search Console URL">Copy URL</button>'
          : '';
        const indexBtn = p.slug
          ? '<button type="button" class="btn-index" data-slug="' + slugAttr + '">Index</button>'
          : '';
        return (
          '<div class="item-card">' +
            '<div style="display: flex; gap: 1rem;">' +
              img +
              '<div style="flex: 1;">' +
                '<h3>' + escapeHtml(p.name) + inactive + '</h3>' +
                '<p style="margin: 0.25rem 0; color: rgb(var(--color-neutral-600));">' + escapeHtml(p.summary || '') + '</p>' +
                '<p style="margin: 0.5rem 0;"><strong>£' + (Number(p.price || 0) / 100).toFixed(2) +
                  '</strong> | Stock: ' + escapeHtml(p.stock_quantity) +
                  ' | Categories: ' + escapeHtml(categories) + '</p>' +
              '</div>' +
            '</div>' +
            '<div class="item-actions">' +
              '<button type="button" class="btn-edit" data-id="' + p.id + '">Edit</button>' +
              '<button type="button" class="btn-delete" data-id="' + p.id + '" data-name="' + nameAttr + '">Delete</button>' +
              copyBtn +
              indexBtn +
            '</div>' +
          '</div>'
        );
      }).join('');
    }

    if (pager) {
      if (filtered.length <= PAGE_SIZE) {
        pager.innerHTML = '';
      } else {
        const prevDisabled = page <= 1 ? ' disabled' : '';
        const nextDisabled = page >= totalPages ? ' disabled' : '';
        pager.innerHTML =
          '<button type="button" class="btn btn-secondary btn-sm" data-page="prev"' + prevDisabled + '>Previous</button>' +
          '<span class="admin-text-small">Page ' + page + ' of ' + totalPages + '</span>' +
          '<button type="button" class="btn btn-secondary btn-sm" data-page="next"' + nextDisabled + '>Next</button>';
      }
    }
  }

  let suggestOpen = false;
  let suggestIndex = -1;

  function categoryKey(name) {
    if (global.ShopCategories) return ShopCategories.key(name);
    return String(name || '').trim().toLowerCase();
  }

  function categoryDisplay(name) {
    if (global.ShopCategories) return ShopCategories.display(name);
    return String(name || '').trim();
  }

  function availableCategories() {
    const selected = Array.isArray(global.selectedCategories) ? global.selectedCategories : [];
    const all = global.allCategories instanceof Set ? global.allCategories : new Set();
    return Array.from(all)
      .filter(function (c) {
        return !selected.some(function (s) { return categoryKey(s) === categoryKey(c); });
      })
      .sort(function (a, b) { return String(a).localeCompare(String(b)); });
  }

  function suggestionItems(queryText) {
    const typed = categoryDisplay(queryText);
    const needle = typed.toLowerCase();
    const matches = availableCategories().filter(function (c) {
      return !needle || String(c).toLowerCase().indexOf(needle) !== -1;
    });
    const exact = typed && matches.some(function (c) { return categoryKey(c) === categoryKey(typed); });
    const alreadySelected = typed && (global.selectedCategories || []).some(function (s) {
      return categoryKey(s) === categoryKey(typed);
    });
    return {
      typed: typed,
      matches: matches,
      showCreate: !!(typed && !exact && !alreadySelected)
    };
  }

  function closeCategorySuggest() {
    suggestOpen = false;
    suggestIndex = -1;
    const input = document.getElementById('category-input');
    const list = document.getElementById('category-suggest');
    if (input) input.setAttribute('aria-expanded', 'false');
    if (list) {
      list.hidden = true;
      list.innerHTML = '';
    }
  }

  function openCategorySuggest() {
    suggestOpen = true;
    renderCategorySuggest();
  }

  function renderCategorySuggest() {
    const input = document.getElementById('category-input');
    const list = document.getElementById('category-suggest');
    if (!input || !list) return;
    if (!suggestOpen) {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      return;
    }

    const data = suggestionItems(input.value);
    const rows = data.matches.map(function (name, idx) {
      const active = idx === suggestIndex ? ' is-active' : '';
      return '<li><button type="button" class="admin-category-suggest-item' + active + '" data-name="' + encodeURIComponent(name) + '">' + escapeHtml(name) + '</button></li>';
    });
    if (data.showCreate) {
      const createIdx = data.matches.length;
      const active = createIdx === suggestIndex ? ' is-active' : '';
      rows.push(
        '<li><button type="button" class="admin-category-suggest-item admin-category-suggest-create' + active + '" data-create="1">' +
          'Add ' + escapeHtml(data.typed) +
        '</button></li>'
      );
    }
    if (!rows.length) {
      list.innerHTML = '<li class="admin-category-suggest-empty">No matching categories</li>';
    } else {
      list.innerHTML = rows.join('');
    }
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function pickSuggestion(index) {
    const input = document.getElementById('category-input');
    const data = suggestionItems(input ? input.value : '');
    const total = data.matches.length + (data.showCreate ? 1 : 0);
    if (!total) {
      if (typeof global.addCategory === 'function') global.addCategory();
      return;
    }
    const i = Math.max(0, Math.min(index, total - 1));
    if (i < data.matches.length) {
      if (typeof global.addExistingCategory === 'function') global.addExistingCategory(data.matches[i]);
      if (input) input.value = '';
      closeCategorySuggest();
      return;
    }
    if (typeof global.addCategory === 'function') global.addCategory();
  }

  function bindCategoryCombobox() {
    const input = document.getElementById('category-input');
    const list = document.getElementById('category-suggest');
    if (!input || !list || input.getAttribute('data-combobox-bound') === '1') return;
    input.setAttribute('data-combobox-bound', '1');

    input.addEventListener('focus', function () {
      suggestIndex = -1;
      openCategorySuggest();
    });
    input.addEventListener('input', function () {
      suggestIndex = -1;
      openCategorySuggest();
    });
    input.addEventListener('keydown', function (e) {
      const data = suggestionItems(input.value);
      const total = data.matches.length + (data.showCreate ? 1 : 0);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!suggestOpen) openCategorySuggest();
        if (!total) return;
        suggestIndex = suggestIndex < total - 1 ? suggestIndex + 1 : 0;
        renderCategorySuggest();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!suggestOpen) openCategorySuggest();
        if (!total) return;
        suggestIndex = suggestIndex <= 0 ? total - 1 : suggestIndex - 1;
        renderCategorySuggest();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestOpen && suggestIndex >= 0) pickSuggestion(suggestIndex);
        else if (typeof global.addCategory === 'function') global.addCategory();
        return;
      }
      if (e.key === 'Escape') {
        closeCategorySuggest();
      }
    });

    list.addEventListener('mousedown', function (e) {
      e.preventDefault();
    });
    list.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-name], button[data-create]');
      if (!btn) return;
      if (btn.getAttribute('data-create') === '1') {
        if (typeof global.addCategory === 'function') global.addCategory();
        return;
      }
      const name = decodeURIComponent(btn.getAttribute('data-name') || '');
      if (typeof global.addExistingCategory === 'function') global.addExistingCategory(name);
      input.value = '';
      closeCategorySuggest();
    });

    document.addEventListener('click', function (e) {
      const wrap = input.closest('.admin-category-combobox');
      if (wrap && wrap.contains(e.target)) return;
      closeCategorySuggest();
    });
  }

  function bind() {
    const search = document.getElementById('admin-product-search');
    if (search && search.getAttribute('data-bound') !== '1') {
      search.setAttribute('data-bound', '1');
      search.addEventListener('input', function () {
        query = search.value || '';
        page = 1;
        render();
      });
    }

    const pager = document.getElementById('admin-product-pagination');
    if (pager && pager.getAttribute('data-bound') !== '1') {
      pager.setAttribute('data-bound', '1');
      pager.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        if (btn.getAttribute('data-page') === 'prev') page -= 1;
        if (btn.getAttribute('data-page') === 'next') page += 1;
        render();
        const heading = document.getElementById('admin-section-products');
        if (heading && heading.scrollIntoView) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    const list = document.getElementById('products-list');
    if (list && list.getAttribute('data-product-admin-bound') !== '1') {
      list.setAttribute('data-product-admin-bound', '1');
      list.addEventListener('click', function (e) {
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn && typeof global.editProduct === 'function') {
          global.editProduct(Number(editBtn.getAttribute('data-id')));
          return;
        }
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn && typeof global.deleteProduct === 'function') {
          const name = decodeURIComponent(deleteBtn.getAttribute('data-name') || '');
          global.deleteProduct(Number(deleteBtn.getAttribute('data-id')), name);
          return;
        }
        const copyBtn = e.target.closest('.btn-copy');
        if (copyBtn && typeof global.copyProductSeoUrl === 'function') {
          const slug = decodeURIComponent(copyBtn.getAttribute('data-slug') || '');
          global.copyProductSeoUrl(slug, copyBtn);
          return;
        }
        const indexBtn = e.target.closest('.btn-index');
        if (indexBtn && typeof global.requestIndexing === 'function') {
          const slug = decodeURIComponent(indexBtn.getAttribute('data-slug') || '');
          global.requestIndexing('product', slug, indexBtn);
        }
      });
    }
    bindCategoryCombobox();
  }

  document.addEventListener('DOMContentLoaded', bind);
  if (document.readyState !== 'loading') bind();

  global.ShopProductAdmin = {
    render: render,
    bind: bind,
    renderCategorySuggest: renderCategorySuggest,
    closeCategorySuggest: closeCategorySuggest
  };
})(typeof window !== 'undefined' ? window : globalThis);
