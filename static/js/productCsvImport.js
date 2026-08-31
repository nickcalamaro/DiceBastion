/**
 * Product CSV import helpers (kept outside Hugo markdown to avoid Goldmark mangling).
 * Expects BNW-style columns: Title, Price, Manufacturer, Type, Description, Image_URL, EAN
 */
(function (global) {
  function stripBom(text) {
    if (!text) return '';
    return String(text).replace(/^\uFEFF/, '');
  }

  function parseCsvText(text) {
    const input = stripBom(text);
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      const next = input[i + 1];

      if (inQuotes) {
        if (ch === '"') {
          if (next === '"') {
            field += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
        continue;
      }

      if (ch === '"') {
        // Opening quote — do not consume the following character (common off-by-one bug).
        inQuotes = true;
        continue;
      }

      if (ch === ',') {
        row.push(field);
        field = '';
        continue;
      }

      if (ch === '\r') {
        if (next === '\n') i += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        continue;
      }

      if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        continue;
      }

      field += ch;
    }

    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }

    return rows.filter((r) => r.some((cell) => String(cell || '').trim() !== ''));
  }

  function csvRowsToObjects(rows) {
    if (!rows.length) return [];
    const headers = rows[0].map((h) =>
      String(h || '')
        .replace(/^\uFEFF/, '')
        .trim()
    );
    return rows.slice(1).map((cells) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = cells[idx] != null ? String(cells[idx]) : '';
      });
      return obj;
    });
  }

  function slugifyProductName(name) {
    return String(name || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizeEan(raw) {
    const digits = String(raw == null ? '' : raw).replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 14) return null;
    return digits;
  }

  function headerKey(name) {
    return String(name || '')
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
  }

  function extractEanFromCsvRow(row) {
    if (!row || typeof row !== 'object') return null;
    const keys = Object.keys(row);
    const match = keys.find((k) => {
      const n = headerKey(k);
      return n === 'ean' || n === 'ean13' || n === 'ean8' || n === 'barcode' || n === 'gtin' || n === 'isbn' || n === 'isbn13';
    });
    return match ? normalizeEan(row[match]) : null;
  }

  function productNamesMatch(a, b) {
    const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return norm(a) === norm(b);
  }

  function isListedInShop(product) {
    if (!product) return false;
    return Number(product.is_active) === 1 && (product.catalog_status || 'listed') !== 'archived';
  }

  function isArchivedImport(product) {
    return !!(product && (product.catalog_status || 'listed') === 'archived');
  }

  function findImportMatch(products, opts) {
    const list = Array.isArray(products) ? products : [];
    const ean = normalizeEan(opts && opts.ean);
    const slug = opts && opts.slug ? String(opts.slug) : '';

    function pick(matches, via) {
      if (!matches.length) return null;
      const archived = matches.find(isArchivedImport);
      if (archived) return { product: archived, via };
      const listed = matches.find(isListedInShop);
      if (listed) return { product: listed, via };
      return { product: matches[0], via };
    }

    if (ean) {
      const byEan = list.filter((p) => normalizeEan(p.ean) === ean);
      const found = pick(byEan, 'ean');
      if (found) return found;
    }
    if (slug) {
      const bySlug = list.filter((p) => p.slug === slug);
      const found = pick(bySlug, 'slug');
      if (found) return found;
    }
    return null;
  }

  function importCategoryTag(raw) {
    const trimmed = String(raw || '').trim().replace(/\s+/g, ' ');
    if (!trimmed) return '';
    const lower = trimmed.toLowerCase().replace(/-/g, ' ');
    if (lower === 'board game' || lower === 'board games') return 'Board Games';
    return global.ShopCategories ? ShopCategories.display(trimmed) : trimmed;
  }

  function buildCategoryTags(row) {
    const tags = [];
    const seen = new Set();
    ;[row.Type, row.Manufacturer].forEach((raw) => {
      const tag = importCategoryTag(raw);
      const key = tag.toLowerCase();
      if (!tag || seen.has(key)) return;
      seen.add(key);
      tags.push(tag);
    });
    return tags.slice(0, 3);
  }

  function mapBnwRowToProduct(row, defaults) {
    const name = String(row.Title || '').trim();
    const pounds = parseFloat(String(row.Price || '').replace(/,/g, '').trim());
    const notes = [];

    if (!name) notes.push('Missing Title');
    if (!Number.isFinite(pounds)) notes.push('Invalid Price');

    const description = String(row.Description || '').trim();
    const imageUrl = String(row.Image_URL || row.Image_Url || row.image_url || '').trim();
    const categoryTags = buildCategoryTags(row);
    const category = categoryTags.length ? categoryTags.join(', ') : null;
    const slug = slugifyProductName(name);
    const pricePence = Number.isFinite(pounds) ? Math.round(pounds * 100) : null;
    const ean = extractEanFromCsvRow(row);

    if (!description) notes.push('Empty description');
    if (!imageUrl) notes.push('No image URL');
    if (!category) notes.push('No categories');
    if (!ean) notes.push('No EAN');

    const fullDescription = description
      ? `<p>${escapeHtml(description).replace(/\n/g, '<br>')}</p>`
      : null;

    const match = findImportMatch(defaults && defaults.existingProducts, { ean, slug });
    let skip = false;
    let restore = false;
    let nameMismatch = false;
    let matchedName = '';
    let skipReason = '';

    if (match && match.product) {
      matchedName = match.product.name || '';
      if (isListedInShop(match.product)) {
        skip = true;
        skipReason = match.via === 'ean' ? 'EAN already in shop' : 'slug exists';
        notes.push(skipReason + ' (will skip)');
      } else {
        restore = true;
        notes.push('Will restore archived listing (categories, description, summary kept)');
      }
      if (!productNamesMatch(match.product.name, name)) {
        nameMismatch = true;
        notes.push('Name differs from stored listing: "' + match.product.name + '"');
      }
    }

    return {
      valid: !!name && pricePence != null && pricePence >= 0,
      skip,
      restore,
      nameMismatch,
      matchedName,
      skipReason,
      notes,
      payload: {
        name,
        slug,
        ean,
        summary: '',
        description: description || null,
        full_description: fullDescription,
        price: pricePence,
        currency: 'GBP',
        stock_quantity: defaults.stock,
        category,
        image_url: imageUrl || null,
        is_active: 1,
        release_date: null,
        import_batch_id: defaults.importBatchId || null
      },
      preview: {
        name,
        slug,
        ean: ean || '',
        category: category || '',
        pricePence,
        priceLabel: pricePence != null ? `£${(pricePence / 100).toFixed(2)}` : '—',
        imageUrl,
        pounds
      }
    };
  }

  global.ProductCsvImport = {
    parseCsvText,
    csvRowsToObjects,
    slugifyProductName,
    mapBnwRowToProduct,
    escapeHtml,
    stripBom,
    normalizeEan,
    extractEanFromCsvRow,
    productNamesMatch,
    isListedInShop,
    isArchivedImport,
    findImportMatch
  };
})(typeof window !== 'undefined' ? window : globalThis);
