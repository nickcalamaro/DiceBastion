/**
 * Product CSV import helpers (kept outside Hugo markdown to avoid Goldmark mangling).
 * Expects BNW-style columns: Title, Price, Manufacturer, Type, Description, Image_URL
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

  function buildCategoryTags(row) {
    const tags = [];
    const seen = new Set();
    ;[row.Type, row.Manufacturer].forEach((raw) => {
      const tag = String(raw || '').trim();
      if (!tag || seen.has(tag)) return;
      seen.add(tag);
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

    if (!description) notes.push('Empty description');
    if (!imageUrl) notes.push('No image URL');
    if (!category) notes.push('No categories');

    const fullDescription = description
      ? `<p>${escapeHtml(description).replace(/\n/g, '<br>')}</p>`
      : null;

    return {
      valid: !!name && pricePence != null && pricePence >= 0,
      notes,
      payload: {
        name,
        slug,
        summary: '',
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
    stripBom
  };
})(typeof window !== 'undefined' ? window : globalThis);
