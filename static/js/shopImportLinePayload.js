/**
 * Shared POST body for /admin/finance/import-sessions/:id/lines (addImportLine).
 */
(function (global) {
  function normalizeCategory(raw) {
    if (raw == null || String(raw).trim() === '') return null;
    if (global.ShopCategories) return ShopCategories.normalizeField(raw);
    return String(raw).trim().slice(0, 200);
  }

  /**
   * Manual import session modal (shopFinanceAdmin).
   */
  function fromFinanceModal(body) {
    const payload = {
      entry_method: body.entry_method || 'manual',
      quantity: parseInt(body.quantity, 10),
      unit_cost_pence: body.unit_cost_pence,
      product_id: body.product_id ? parseInt(body.product_id, 10) : null,
      ean: body.ean || null,
      name: body.name ? String(body.name).trim() : null,
      price_pence: body.price_pence != null ? body.price_pence : null,
      category: body.category ? normalizeCategory(body.category) : null,
      summary: body.summary ? String(body.summary).trim() : null,
      description: body.description ? String(body.description) : null,
      image_url: body.image_url || null
    };
    if (payload.product_id != null && !payload.product_id) payload.product_id = null;
    return payload;
  }

  /**
   * Supplier invoice import row (shopInvoiceImportAdmin).
   */
  function fromInvoiceRow(r, ctx) {
    const isEventLine = ctx && typeof ctx.isEventLine === 'function' ? ctx.isEventLine(r) : false;
    const isForeign = ctx && typeof ctx.isForeignInvoice === 'function' ? ctx.isForeignInvoice() : false;
    const payload = {
      entry_method: 'manual',
      quantity: r.quantity,
      ean: r.ean || null
    };
    if (isForeign) {
      const fm = r.unit_foreign_minor != null ? Math.round(Number(r.unit_foreign_minor)) : null;
      if (fm != null) payload.unit_foreign_minor = fm;
    } else {
      payload.unit_cost_pence = r.unit_cost_pence;
    }
    if (isEventLine) {
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
    payload.category = normalizeCategory(r.category);
    payload.summary = (r.summary || r.name).slice(0, 500);
    if (r.description) payload.description = r.description;
    if (r.image_url) payload.image_url = r.image_url;
    if (r.existing_listed && r.override_listing) {
      payload.product_id = r.existing_product_id;
    }
    return payload;
  }

  global.ShopImportLinePayload = {
    fromFinanceModal: fromFinanceModal,
    fromInvoiceRow: fromInvoiceRow,
    normalizeCategory: normalizeCategory
  };
})(typeof window !== 'undefined' ? window : globalThis);
