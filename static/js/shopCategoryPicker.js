/**
 * Inline category chips + combobox (same UX as Products tab).
 */
(function (global) {
  const mounts = new WeakMap();

  function escapeHtml(s) {
    if (global.utils && global.utils.escapeHtml) return global.utils.escapeHtml(s);
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function categoryKey(name) {
    if (global.ShopCategories) return ShopCategories.key(name);
    return String(name || '').trim().toLowerCase();
  }

  function categoryDisplay(name) {
    if (global.ShopCategories) return ShopCategories.display(name);
    return String(name || '').trim();
  }

  function parseCategories(raw) {
    if (global.ShopCategories) return ShopCategories.parseField(raw);
    return String(raw || '')
      .split(',')
      .map(function (c) { return c.trim(); })
      .filter(Boolean);
  }

  function normalizeField(categories) {
    if (global.ShopCategories) return ShopCategories.normalizeField(categories.join(','));
    return categories.join(', ');
  }

  function catalogSet(catalog) {
    if (catalog instanceof Set) return catalog;
    if (Array.isArray(catalog)) return new Set(catalog);
    if (global.allCategories instanceof Set) return global.allCategories;
    return new Set();
  }

  function seedShopCategoryCatalog(products) {
    if (!global.allCategories || !(global.allCategories instanceof Set)) {
      global.allCategories = new Set();
    }
    (products || []).forEach(function (p) {
      if ((p.catalog_status || 'listed') === 'archived') return;
      if (!p.category) return;
      parseCategories(p.category).forEach(function (cat) {
        const d = categoryDisplay(cat);
        if (d) global.allCategories.add(d);
      });
    });
    return global.allCategories;
  }

  function suggestionItems(selected, queryText, catalog) {
    const typed = categoryDisplay(queryText);
    const needle = typed.toLowerCase();
    const all = catalogSet(catalog);
    const matches = Array.from(all)
      .filter(function (c) {
        return !selected.some(function (s) { return categoryKey(s) === categoryKey(c); });
      })
      .filter(function (c) {
        return !needle || String(c).toLowerCase().indexOf(needle) !== -1;
      })
      .sort(function (a, b) { return String(a).localeCompare(String(b)); });
    const exact = typed && matches.some(function (c) { return categoryKey(c) === categoryKey(typed); });
    const alreadySelected = typed && selected.some(function (s) { return categoryKey(s) === categoryKey(typed); });
    return {
      typed: typed,
      matches: matches,
      showCreate: !!(typed && !exact && !alreadySelected)
    };
  }

  function renderTags(tagsEl, selected, maxTags, onRemove) {
    if (!selected.length) {
      tagsEl.innerHTML = '<span class="admin-text-muted admin-text-small">No categories</span>';
      return;
    }
    tagsEl.innerHTML = selected.map(function (cat) {
      return (
        '<span class="invoice-import-cat-tag" style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.25rem 0.5rem;background:rgb(var(--color-primary-600));color:#fff;border-radius:6px;font-size:0.8125rem;margin:0 0.25rem 0.25rem 0;">' +
        escapeHtml(cat) +
        '<button type="button" class="invoice-import-cat-remove" data-name="' + encodeURIComponent(cat) + '" style="background:none;border:none;color:#fff;cursor:pointer;padding:0;font-size:1.1rem;line-height:1;">&times;</button>' +
        '</span>'
      );
    }).join('');
    tagsEl.querySelectorAll('.invoice-import-cat-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const name = decodeURIComponent(btn.getAttribute('data-name') || '');
        onRemove(name);
      });
    });
  }

  function renderSuggest(state, listEl, inputEl) {
    const data = suggestionItems(state.selected, inputEl.value, state.catalog);
    const rows = data.matches.map(function (name, idx) {
      const active = idx === state.suggestIndex ? ' is-active' : '';
      return '<li><button type="button" class="admin-category-suggest-item' + active + '" data-name="' + encodeURIComponent(name) + '">' + escapeHtml(name) + '</button></li>';
    });
    if (data.showCreate) {
      const createIdx = data.matches.length;
      const active = createIdx === state.suggestIndex ? ' is-active' : '';
      rows.push(
        '<li><button type="button" class="admin-category-suggest-item admin-category-suggest-create' + active + '" data-create="1">Add ' + escapeHtml(data.typed) + '</button></li>'
      );
    }
    if (!rows.length) {
      listEl.innerHTML = '<li class="admin-category-suggest-empty">No matching categories</li>';
    } else {
      listEl.innerHTML = rows.join('');
    }
    listEl.hidden = !state.suggestOpen;
    inputEl.setAttribute('aria-expanded', state.suggestOpen ? 'true' : 'false');
  }

  function addCategory(state, raw, onChange) {
    const name = categoryDisplay(raw);
    if (!name) return;
    if (state.selected.length >= state.maxTags) {
      window.alert('Maximum ' + state.maxTags + ' categories allowed');
      return;
    }
    if (state.selected.some(function (s) { return categoryKey(s) === categoryKey(name); })) return;
    state.selected.push(name);
    state.catalog.add(name);
    if (global.allCategories instanceof Set) global.allCategories.add(name);
    onChange(state.selected.slice());
  }

  function refreshTags(state, onChange) {
    renderTags(state.tagsEl, state.selected, state.maxTags, function (removed) {
      state.selected = state.selected.filter(function (c) { return c !== removed; });
      onChange(state.selected.slice());
      refreshTags(state, onChange);
    });
  }

  function mount(container, options) {
    if (!container) return null;
    unmount(container);
    const rowId = options.rowId != null ? String(options.rowId) : String(Date.now());
    const selected = parseCategories(options.categories != null ? options.categories : options.category);
    const maxTags = options.maxTags != null ? options.maxTags : 3;
    const catalog = catalogSet(options.catalog);
    selected.forEach(function (c) { catalog.add(categoryDisplay(c)); });

    container.innerHTML =
      '<div class="admin-category-container invoice-import-cat-tags" style="min-height:1.75rem;padding:0.35rem;margin-bottom:0.35rem;"></div>' +
      '<div class="admin-category-combobox">' +
      '<div class="admin-category-combobox-row">' +
      '<input type="text" class="form-input invoice-import-cat-input" autocomplete="off" role="combobox" placeholder="Search category" style="font-size:0.8125rem;">' +
      '<button type="button" class="btn btn-secondary btn-sm invoice-import-cat-add">Add</button>' +
      '</div>' +
      '<ul class="admin-category-suggest invoice-import-cat-suggest" hidden></ul>' +
      '</div>';

    const tagsEl = container.querySelector('.invoice-import-cat-tags');
    const inputEl = container.querySelector('.invoice-import-cat-input');
    const listEl = container.querySelector('.invoice-import-cat-suggest');
    const addBtn = container.querySelector('.invoice-import-cat-add');

    const state = {
      rowId: rowId,
      selected: selected.slice(),
      maxTags: maxTags,
      catalog: catalog,
      suggestOpen: false,
      suggestIndex: -1,
      tagsEl: tagsEl,
      inputEl: inputEl,
      listEl: listEl
    };

    function onChange(cats) {
      if (typeof options.onChange === 'function') {
        options.onChange(normalizeField(cats));
      }
    }

    function refresh() {
      refreshTags(state, onChange);
    }
    refresh();

    function pickAt(index) {
      const data = suggestionItems(state.selected, inputEl.value, state.catalog);
      const total = data.matches.length + (data.showCreate ? 1 : 0);
      if (!total) {
        addCategory(state, inputEl.value, onChange);
        inputEl.value = '';
        state.suggestOpen = false;
        renderSuggest(state, listEl, inputEl);
        refresh();
        return;
      }
      const i = Math.max(0, Math.min(index, total - 1));
      if (i < data.matches.length) {
        addCategory(state, data.matches[i], onChange);
      } else {
        addCategory(state, data.typed, onChange);
      }
      inputEl.value = '';
      state.suggestOpen = false;
      state.suggestIndex = -1;
      renderSuggest(state, listEl, inputEl);
      refresh();
    }

    inputEl.addEventListener('focus', function () {
      state.suggestIndex = -1;
      state.suggestOpen = true;
      renderSuggest(state, listEl, inputEl);
    });
    inputEl.addEventListener('input', function () {
      state.suggestIndex = -1;
      state.suggestOpen = true;
      renderSuggest(state, listEl, inputEl);
    });
    inputEl.addEventListener('keydown', function (e) {
      const data = suggestionItems(state.selected, inputEl.value, state.catalog);
      const total = data.matches.length + (data.showCreate ? 1 : 0);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        state.suggestOpen = true;
        if (total) state.suggestIndex = state.suggestIndex < total - 1 ? state.suggestIndex + 1 : 0;
        renderSuggest(state, listEl, inputEl);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        state.suggestOpen = true;
        if (total) state.suggestIndex = state.suggestIndex <= 0 ? total - 1 : state.suggestIndex - 1;
        renderSuggest(state, listEl, inputEl);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (state.suggestOpen && state.suggestIndex >= 0) pickAt(state.suggestIndex);
        else pickAt(0);
      } else if (e.key === 'Escape') {
        state.suggestOpen = false;
        renderSuggest(state, listEl, inputEl);
      }
    });

    addBtn.addEventListener('click', function () {
      pickAt(state.suggestIndex >= 0 ? state.suggestIndex : 0);
    });

    listEl.addEventListener('mousedown', function (e) { e.preventDefault(); });
    listEl.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-name], button[data-create]');
      if (!btn) return;
      if (btn.getAttribute('data-create') === '1') {
        addCategory(state, inputEl.value, onChange);
      } else {
        addCategory(state, decodeURIComponent(btn.getAttribute('data-name') || ''), onChange);
      }
      inputEl.value = '';
      state.suggestOpen = false;
      renderSuggest(state, listEl, inputEl);
      refresh();
    });

    const docClick = function (e) {
      if (!container.contains(e.target)) {
        state.suggestOpen = false;
        renderSuggest(state, listEl, inputEl);
      }
    };
    document.addEventListener('click', docClick);

    state.cleanup = function () {
      document.removeEventListener('click', docClick);
    };

    mounts.set(container, state);
    return state;
  }

  function unmount(container) {
    const state = mounts.get(container);
    if (state && state.cleanup) state.cleanup();
    mounts.delete(container);
    if (container) container.innerHTML = '';
  }

  function unmountAll(root) {
    if (!root) return;
    root.querySelectorAll('.invoice-import-category-mount').forEach(function (node) {
      unmount(node);
    });
  }

  global.ShopCategoryPicker = {
    mount: mount,
    unmount: unmount,
    unmountAll: unmountAll,
    seedShopCategoryCatalog: seedShopCategoryCatalog,
    parseCategories: parseCategories
  };
})(typeof window !== 'undefined' ? window : globalThis);
