/**
 * Shop and events accounts (owner-only tab) plus Receive stock / Write off dialogs.
 * Kept outside Hugo markdown to avoid Goldmark mangling.
 *
 * ShopFinance.init({ apiBase, token, isOwner, onStockChanged }) once; ShopFinance.load() when the tab opens.
 */
(function (global) {
  const EXPENSE_LABELS = {
    event_costs: 'Event costs',
    postage: 'Postage and delivery',
    packaging: 'Packaging',
    supplies: 'Supplies',
    software: 'Software and subscriptions',
    other: 'Other'
  };
  const PAID_FROM_LABELS = { bank: 'Bank', cash: 'Cash', owner: 'Paid personally' };
  const ERROR_MESSAGES = {
    invalid_quantity: 'Enter a quantity of 1 or more.',
    invalid_unit_cost: 'Enter a valid cost per unit.',
    missing_supplier: 'Enter the supplier.',
    insufficient_stock: 'There is not enough stock to write off that many.',
    product_not_cost_tracked: 'This product has no cost batches yet.',
    bill_not_found: 'That supplier bill no longer exists.',
    invalid_bill_date: 'Enter a valid bill date.',
    invalid_total: 'Enter a valid bill total.',
    invalid_expense_date: 'Enter a valid expense date.',
    invalid_category: 'Choose a category.',
    invalid_amount: 'Enter a valid amount greater than zero.',
    invalid_paid_date: 'Enter a valid paid date.',
    invalid_date: 'Enter a valid date.',
    invalid_type: 'Choose money in or money out.',
    invalid_books_start_date: 'Enter a valid start date.',
    forbidden: 'This is only available to the accounts owner.',
    session_not_found: 'That import session no longer exists.',
    line_not_found: 'That line no longer exists.',
    line_already_used: 'Some of that stock has already been sold or written off, so the line cannot be removed.',
    missing_name: 'Enter the product name.',
    missing_price: 'Enter the selling price.',
    ean_already_exists: 'That EAN is already used by another product.',
    invalid_receipt: 'The receipt link is not valid.',
    invalid_file: 'Choose a photo or PDF of the receipt.',
    unsupported_file: 'Receipts must be a JPEG, PNG, WEBP, GIF or PDF.',
    file_too_large: 'That receipt is larger than 8 MB.',
    upload_failed: 'The receipt could not be uploaded.'
  };

  let opts = null;
  let bound = false;
  let pnlData = null;
  let bsData = null;
  let bills = [];
  let expenses = [];
  let events = [];
  let ownerMovements = [];
  let sessions = [];
  let openSessionId = null;
  let productChoices = null;

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function el(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function gbp(pence) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format((Number(pence) || 0) / 100);
  }

  function pct(ratio) {
    return ratio == null || !Number.isFinite(ratio) ? '-' : (ratio * 100).toFixed(1) + '%';
  }

  function toPence(value) {
    const s = String(value == null ? '' : value).trim();
    if (s === '') return null;
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100);
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function isoDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function today() { return isoDate(new Date()); }

  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function setStatus(text) {
    const s = el('finance-status');
    if (s) s.textContent = text || '';
  }

  function errorText(data, fallback) {
    return (data && ERROR_MESSAGES[data.error]) || (data && data.error) || fallback || 'Something went wrong.';
  }

  async function api(path, options) {
    const o = options || {};
    const headers = { 'X-Session-Token': opts.token() || '' };
    if (o.body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(opts.apiBase() + path, {
      method: o.method || 'GET',
      headers: headers,
      body: o.body !== undefined ? JSON.stringify(o.body) : undefined
    });
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      const err = new Error(errorText(data, res.statusText));
      err.data = data;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function downloadCsv(filename, rows) {
    const text = rows.map(function (r) {
      return r.map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function poundsCsv(pence) { return ((Number(pence) || 0) / 100).toFixed(2); }

  const NUM = 'text-align: right; white-space: nowrap;';

  function table(head, rowsHtml, emptyText) {
    return '<div class="table-wrapper"><div style="overflow-x: auto;"><table><thead><tr>' +
      head.map(function (h) {
        return '<th' + (h.num ? ' style="' + NUM + '"' : '') + '>' + esc(h.label) + '</th>';
      }).join('') +
      '</tr></thead><tbody>' +
      (rowsHtml || '<tr><td colspan="' + head.length + '" class="admin-text-center admin-text-muted" style="padding: 1.5rem;">' + esc(emptyText || 'Nothing yet.') + '</td></tr>') +
      '</tbody></table></div></div>';
  }

  function statementRow(label, pence, opts2) {
    const o = opts2 || {};
    const style = o.total ? 'font-weight: 600; border-top: 2px solid rgb(var(--color-neutral-300));' : '';
    const indent = o.indent ? 'padding-left: 1.5rem;' : '';
    return '<tr style="' + style + '"><td style="' + indent + '">' + esc(label) + '</td><td style="' + NUM + '">' +
      (pence == null ? '' : esc(gbp(pence))) + (o.note ? ' <span class="admin-text-small admin-text-muted">' + esc(o.note) + '</span>' : '') +
      '</td></tr>';
  }

  function statementHeading(label) {
    return '<tr><td colspan="2" style="font-weight: 600; padding-top: 1rem; color: rgb(var(--color-neutral-900));">' + esc(label) + '</td></tr>';
  }

  function paidSelect(name, value) {
    const v = value || '';
    return '<select name="' + name + '" class="modal-form-input">' +
      '<option value=""' + (v === '' ? ' selected' : '') + '>Not paid yet</option>' +
      '<option value="bank"' + (v === 'bank' ? ' selected' : '') + '>Paid from bank</option>' +
      '<option value="cash"' + (v === 'cash' ? ' selected' : '') + '>Paid in cash</option>' +
      '<option value="owner"' + (v === 'owner' ? ' selected' : '') + '>Paid personally</option>' +
      '</select>';
  }

  function field(label, inputHtml, hint) {
    return '<div class="modal-form-group"><label class="modal-form-label">' + esc(label) + '</label>' + inputHtml +
      (hint ? '<small class="admin-text-small" style="display: block; margin-top: 0.25rem;">' + esc(hint) + '</small>' : '') +
      '</div>';
  }

  function statusText(paidDate, paidFrom) {
    if (!paidDate) return '<span style="color: rgb(180, 83, 9); font-weight: 600;">Unpaid</span>';
    return esc((PAID_FROM_LABELS[paidFrom] || 'Paid') + ', ' + formatDate(paidDate));
  }

  function smallBtn(cls, id, label) {
    return '<button type="button" class="btn btn-secondary ' + cls + '" data-id="' + id + '" style="padding: 0.25rem 0.6rem; font-size: 0.8125rem; margin: 0 0.25rem 0.25rem 0;">' + esc(label) + '</button>';
  }

  // -------------------------------------------------------------------------
  // P&L
  // -------------------------------------------------------------------------

  async function runPnl() {
    const from = el('finance-pnl-from').value;
    const to = el('finance-pnl-to').value;
    if (!from || !to) { setStatus('Choose a from and to date for the P&L.'); return; }
    const btn = el('finance-pnl-run');
    btn.disabled = true;
    setStatus('Loading P&L...');
    try {
      pnlData = await api('/admin/finance/pnl?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to));
      renderPnl();
      setStatus('');
    } catch (e) {
      setStatus('Could not load the P&L. ' + e.message);
    } finally {
      btn.disabled = false;
    }
  }

  function renderPnl() {
    const d = pnlData;
    el('finance-stat-revenue').textContent = gbp(d.revenue.total_pence);
    el('finance-stat-gross').textContent = gbp(d.gross_profit_pence);
    el('finance-stat-expenses').textContent = gbp(d.expenses.total_pence);
    el('finance-stat-net').textContent = gbp(d.net_profit_pence);
    el('finance-pnl-csv').disabled = false;

    const feeNote = d.fee_info.estimated ? 'partly estimated' : '';
    let rows = '';
    rows += statementHeading('Revenue');
    rows += statementRow('Product sales', d.revenue.product_sales_pence, { indent: true });
    rows += statementRow('Shipping charged', d.revenue.shipping_pence, { indent: true });
    rows += statementRow('Event tickets', d.revenue.event_tickets_pence, { indent: true });
    rows += statementRow('Total revenue', d.revenue.total_pence, { total: true });
    rows += statementRow('Cost of goods sold', -d.cost_of_goods_sold_pence);
    rows += statementRow('Gross profit', d.gross_profit_pence, { total: true, note: 'margin ' + pct(d.gross_margin) });
    rows += statementHeading('Expenses');
    rows += statementRow('SumUp fees', -d.expenses.sumup_fees_pence, { indent: true, note: feeNote });
    rows += statementRow('Stock written off', -d.expenses.stock_write_offs_pence, { indent: true });
    d.expenses.by_category.forEach(function (c) {
      rows += statementRow(EXPENSE_LABELS[c.category] || c.category, -c.amount_pence, { indent: true });
    });
    if (d.expenses.supplier_bill_extras_pence) {
      rows += statementRow('Supplier bill costs not in stock', -d.expenses.supplier_bill_extras_pence, { indent: true, note: 'delivery charges or bills without stock received' });
    }
    if (d.expenses.card_buyback_credit_pence) {
      rows += statementRow('Cards bought for store credit', -d.expenses.card_buyback_credit_pence, { indent: true });
    }
    if (d.expenses.store_credit_adjustments_pence) {
      rows += statementRow('Store credit adjustments', -d.expenses.store_credit_adjustments_pence, { indent: true });
    }
    rows += statementRow('Total expenses', -d.expenses.total_pence, { total: true });
    rows += statementRow('Net profit', d.net_profit_pence, { total: true });

    let html = '<div class="table-wrapper admin-mb-2"><div style="overflow-x: auto;"><table><tbody>' + rows + '</tbody></table></div></div>';

    const notes = [];
    notes.push(d.counts.shop_orders + ' shop order' + (d.counts.shop_orders === 1 ? '' : 's') + ' and ' + d.counts.tickets + ' ticket sale' + (d.counts.tickets === 1 ? '' : 's') + ' counted.');
    if (d.excluded_untracked.lines) {
      notes.push(d.excluded_untracked.lines + ' sale line' + (d.excluded_untracked.lines === 1 ? '' : 's') + ' of older stock with no recorded cost (' + gbp(d.excluded_untracked.pence) + ') left out.');
    }
    if (d.counts.uncosted_units) {
      notes.push(d.counts.uncosted_units + ' unit' + (d.counts.uncosted_units === 1 ? ' was' : 's were') + ' sold with no stock batch left, so their cost is recorded as zero. Receive stock for those products to fix future sales.');
    }
    if (d.fee_info.estimated) {
      notes.push('SumUp fees on ' + d.fee_info.estimated + ' sale' + (d.fee_info.estimated === 1 ? '' : 's') + ' are estimated at ' + pct(d.fee_info.estimate_rate) + '. Sync SumUp fees in Club accounts for exact figures where possible.');
    }
    if (d.fee_info.unknown) {
      notes.push(d.fee_info.unknown + ' SumUp sale' + (d.fee_info.unknown === 1 ? ' has' : 's have') + ' no fee because no SumUp payouts are synced yet.');
    }
    if (d.books_start_date > d.from) notes.push('Sales before the books start date (' + formatDate(d.books_start_date) + ') are not counted.');
    html += '<p class="admin-text-small admin-text-muted admin-mb-2">' + notes.map(esc).join(' ') + '</p>';

    html += '<h4 class="admin-section-heading" style="font-size: 1rem;">By product</h4>';
    html += table(
      [{ label: 'Product' }, { label: 'Units', num: true }, { label: 'Revenue', num: true }, { label: 'Cost', num: true }, { label: 'Gross profit', num: true }, { label: 'Margin', num: true }],
      d.products.map(function (p) {
        return '<tr><td>' + esc(p.name) + (p.uncosted_units ? ' <span class="admin-text-small admin-text-muted">' + p.uncosted_units + ' with no cost</span>' : '') + '</td>' +
          '<td style="' + NUM + '">' + esc(p.units) + '</td>' +
          '<td style="' + NUM + '">' + esc(gbp(p.revenue_pence)) + '</td>' +
          '<td style="' + NUM + '">' + esc(gbp(p.cogs_pence)) + '</td>' +
          '<td style="' + NUM + '">' + esc(gbp(p.gross_profit_pence)) + '</td>' +
          '<td style="' + NUM + '">' + esc(pct(p.revenue_pence ? p.gross_profit_pence / p.revenue_pence : null)) + '</td></tr>';
      }).join(''),
      'No product sales with a recorded cost in this range.'
    );

    html += '<h4 class="admin-section-heading" style="font-size: 1rem; margin-top: 1.5rem;">By event</h4>';
    html += table(
      [{ label: 'Event' }, { label: 'Date' }, { label: 'Tickets', num: true }, { label: 'Revenue', num: true }, { label: 'SumUp fees', num: true }, { label: 'Costs', num: true }, { label: 'Profit', num: true }],
      d.events.map(function (e) {
        return '<tr><td>' + esc(e.name) + '</td><td style="white-space: nowrap;">' + esc(formatDate(e.event_datetime)) + '</td>' +
          '<td style="' + NUM + '">' + esc(e.tickets) + '</td>' +
          '<td style="' + NUM + '">' + esc(gbp(e.revenue_pence)) + '</td>' +
          '<td style="' + NUM + '">' + esc(gbp(e.fee_pence)) + '</td>' +
          '<td style="' + NUM + '">' + esc(gbp(e.cost_pence)) + '</td>' +
          '<td style="' + NUM + '">' + esc(gbp(e.profit_pence)) + '</td></tr>';
      }).join(''),
      'No ticket sales or event costs in this range.'
    );

    el('finance-pnl-body').innerHTML = html;
  }

  function downloadPnlCsv() {
    const d = pnlData;
    if (!d) return;
    const rows = [['Profit and loss', d.from + ' to ' + d.to], [], ['Line', 'GBP']];
    rows.push(['Product sales', poundsCsv(d.revenue.product_sales_pence)]);
    rows.push(['Shipping charged', poundsCsv(d.revenue.shipping_pence)]);
    rows.push(['Event tickets', poundsCsv(d.revenue.event_tickets_pence)]);
    rows.push(['Total revenue', poundsCsv(d.revenue.total_pence)]);
    rows.push(['Cost of goods sold', poundsCsv(-d.cost_of_goods_sold_pence)]);
    rows.push(['Gross profit', poundsCsv(d.gross_profit_pence)]);
    rows.push(['SumUp fees', poundsCsv(-d.expenses.sumup_fees_pence)]);
    rows.push(['Stock written off', poundsCsv(-d.expenses.stock_write_offs_pence)]);
    d.expenses.by_category.forEach(function (c) {
      rows.push([EXPENSE_LABELS[c.category] || c.category, poundsCsv(-c.amount_pence)]);
    });
    rows.push(['Supplier bill costs not in stock', poundsCsv(-d.expenses.supplier_bill_extras_pence)]);
    rows.push(['Cards bought for store credit', poundsCsv(-(d.expenses.card_buyback_credit_pence || 0))]);
    rows.push(['Store credit adjustments', poundsCsv(-(d.expenses.store_credit_adjustments_pence || 0))]);
    rows.push(['Total expenses', poundsCsv(-d.expenses.total_pence)]);
    rows.push(['Net profit', poundsCsv(d.net_profit_pence)]);
    rows.push([]);
    rows.push(['Product', 'Units', 'Revenue', 'Cost', 'Gross profit']);
    d.products.forEach(function (p) {
      rows.push([p.name, p.units, poundsCsv(p.revenue_pence), poundsCsv(p.cogs_pence), poundsCsv(p.gross_profit_pence)]);
    });
    rows.push([]);
    rows.push(['Event', 'Date', 'Tickets', 'Revenue', 'SumUp fees', 'Costs', 'Profit']);
    d.events.forEach(function (e) {
      rows.push([e.name, String(e.event_datetime || '').slice(0, 10), e.tickets, poundsCsv(e.revenue_pence), poundsCsv(e.fee_pence), poundsCsv(e.cost_pence), poundsCsv(e.profit_pence)]);
    });
    downloadCsv('dicebastion-shop-events-pnl-' + d.from + '-to-' + d.to + '.csv', rows);
  }

  // -------------------------------------------------------------------------
  // Balance sheet
  // -------------------------------------------------------------------------

  async function runBalanceSheet() {
    const asOf = el('finance-bs-asof').value || today();
    const btn = el('finance-bs-run');
    btn.disabled = true;
    try {
      bsData = await api('/admin/finance/balance-sheet?as_of=' + encodeURIComponent(asOf));
      renderBalanceSheet();
    } catch (e) {
      setStatus('Could not load the balance sheet. ' + e.message);
    } finally {
      btn.disabled = false;
    }
  }

  function renderBalanceSheet() {
    const d = bsData;
    el('finance-bs-csv').disabled = false;
    let rows = '';
    rows += statementHeading('Assets');
    rows += statementRow('Stock at cost', d.assets.stock_at_cost_pence, { indent: true });
    rows += statementRow('Bank and SumUp (calculated)', d.assets.bank_and_sumup_pence, { indent: true });
    rows += statementRow('Cash (calculated)', d.assets.cash_pence, { indent: true });
    rows += statementRow('Total assets', d.assets.total_pence, { total: true });
    rows += statementHeading('Liabilities');
    rows += statementRow('Unpaid supplier bills', d.liabilities.unpaid_supplier_bills_pence, { indent: true });
    rows += statementRow('Unpaid expenses', d.liabilities.unpaid_expenses_pence, { indent: true });
    if (d.liabilities.store_credit_owed_pence || d.liabilities.store_credit_customer_balances_pence) {
      rows += statementRow('Store credit owed to customers', d.liabilities.store_credit_owed_pence, {
        indent: true,
        note: 'customer balances: £' + ((d.liabilities.store_credit_customer_balances_pence || 0) / 100).toFixed(2)
      });
    }
    rows += statementRow('Total liabilities', d.liabilities.total_pence, { total: true });
    rows += statementRow('Net assets', d.net_assets_pence, { total: true });
    rows += statementHeading('Owner equity');
    rows += statementRow('Money put in', d.equity.owner_capital_in_pence, { indent: true });
    rows += statementRow('Bills and expenses paid personally', d.equity.paid_personally_pence, { indent: true });
    rows += statementRow('Money taken out', -d.equity.drawings_pence, { indent: true });
    rows += statementRow('Profit to date', d.equity.retained_profit_pence, { indent: true });
    rows += statementRow('Total equity', d.equity.total_pence, { total: true });

    const check = d.balances
      ? '<p class="admin-text-small" style="color: rgb(var(--color-primary-700));">Balances: net assets equal owner equity.</p>'
      : '<p class="admin-text-small" style="color: rgb(185, 28, 28);">Does not balance (difference ' + esc(gbp(d.difference_pence)) + '). Please report this.</p>';

    el('finance-bs-body').innerHTML =
      '<p class="admin-text-small admin-text-muted">As of ' + esc(formatDate(d.as_of)) + '.</p>' +
      '<div class="table-wrapper admin-mb-1"><div style="overflow-x: auto;"><table><tbody>' + rows + '</tbody></table></div></div>' +
      check +
      '<p class="admin-text-small admin-text-muted">Bank, SumUp and cash are calculated from what is recorded here: sales after SumUp fees, bills and expenses paid, and owner money in and out. Compare them with your real balances; a difference usually means a payment or expense has not been recorded. SumUp payouts to your bank are not tracked, so check SumUp and bank together.</p>';
  }

  function downloadBsCsv() {
    const d = bsData;
    if (!d) return;
    downloadCsv('dicebastion-shop-events-balance-sheet-' + d.as_of + '.csv', [
      ['Balance sheet as of', d.as_of],
      [],
      ['Line', 'GBP'],
      ['Stock at cost', poundsCsv(d.assets.stock_at_cost_pence)],
      ['Bank and SumUp (calculated)', poundsCsv(d.assets.bank_and_sumup_pence)],
      ['Cash (calculated)', poundsCsv(d.assets.cash_pence)],
      ['Total assets', poundsCsv(d.assets.total_pence)],
      ['Unpaid supplier bills', poundsCsv(d.liabilities.unpaid_supplier_bills_pence)],
      ['Unpaid expenses', poundsCsv(d.liabilities.unpaid_expenses_pence)],
      ['Store credit owed to customers', poundsCsv(d.liabilities.store_credit_owed_pence || 0)],
      ['Total liabilities', poundsCsv(d.liabilities.total_pence)],
      ['Net assets', poundsCsv(d.net_assets_pence)],
      ['Money put in', poundsCsv(d.equity.owner_capital_in_pence)],
      ['Bills and expenses paid personally', poundsCsv(d.equity.paid_personally_pence)],
      ['Money taken out', poundsCsv(-d.equity.drawings_pence)],
      ['Profit to date', poundsCsv(d.equity.retained_profit_pence)],
      ['Total equity', poundsCsv(d.equity.total_pence)]
    ]);
  }

  // -------------------------------------------------------------------------
  // Supplier bills
  // -------------------------------------------------------------------------

  async function loadBills() {
    const unpaid = el('finance-bills-unpaid') && el('finance-bills-unpaid').checked;
    try {
      const data = await api('/admin/finance/bills' + (unpaid ? '?status=unpaid' : ''));
      bills = data.bills || [];
      renderBills();
    } catch (e) {
      el('finance-bills-list').innerHTML = '<p class="admin-text-muted">Could not load supplier bills. ' + esc(e.message) + '</p>';
    }
  }

  function renderBills() {
    el('finance-bills-list').innerHTML = table(
      [{ label: 'Date' }, { label: 'Supplier' }, { label: 'Reference' }, { label: 'Total', num: true }, { label: 'Stock received', num: true }, { label: 'Status' }, { label: '' }],
      bills.map(function (b) {
        return '<tr><td style="white-space: nowrap;">' + esc(formatDate(b.bill_date)) + '</td>' +
          '<td>' + esc(b.supplier) + '</td><td>' + esc(b.reference || '') + '</td>' +
          '<td style="' + NUM + '">' + esc(gbp(b.total_pence)) + '</td>' +
          '<td style="' + NUM + '">' + esc(gbp(b.stock_pence)) + (b.lot_count ? ' <span class="admin-text-small admin-text-muted">' + b.lot_count + ' batch' + (b.lot_count === 1 ? '' : 'es') + '</span>' : '') + '</td>' +
          '<td>' + statusText(b.paid_date, b.paid_from) + '</td>' +
          '<td style="white-space: nowrap;">' + (b.paid_date ? '' : smallBtn('finance-bill-pay', b.id, 'Mark paid')) + smallBtn('finance-bill-edit', b.id, 'Edit') + '</td></tr>';
      }).join(''),
      'No supplier bills yet. Bills are created when you start an import session or receive stock.'
    );
  }

  function openBillForm(bill) {
    const b = bill || {};
    Modal.form({
      title: bill ? 'Edit supplier bill' : 'Add supplier bill',
      submitText: bill ? 'Save bill' : 'Add bill',
      formContent:
        field('Supplier', '<input name="supplier" class="modal-form-input" required value="' + esc(b.supplier || '') + '">') +
        field('Bill date', '<input type="date" name="bill_date" class="modal-form-input" required value="' + esc(b.bill_date || today()) + '">') +
        field('Reference', '<input name="reference" class="modal-form-input" value="' + esc(b.reference || '') + '" placeholder="Invoice number">') +
        field('Total (£)', '<input type="number" step="0.01" min="0" name="total" class="modal-form-input" required value="' + (bill ? (b.total_pence / 100).toFixed(2) : '') + '">',
          'If this is more than the stock received on it (for example a delivery charge), the difference is counted as an expense.') +
        field('Paid', paidSelect('paid_from', b.paid_date ? b.paid_from : '')) +
        field('Paid date', '<input type="date" name="paid_date" class="modal-form-input" value="' + esc(b.paid_date || '') + '">', 'Leave blank to use the bill date.') +
        field('Notes', '<input name="notes" class="modal-form-input" value="' + esc(b.notes || '') + '">'),
      onSubmit: async function (fd, modal) {
        const total = toPence(fd.get('total'));
        if (total == null) throw new Error(ERROR_MESSAGES.invalid_total);
        const paidFrom = fd.get('paid_from');
        const body = {
          supplier: fd.get('supplier'),
          bill_date: fd.get('bill_date'),
          reference: fd.get('reference'),
          total_pence: total,
          notes: fd.get('notes'),
          paid_from: paidFrom || null,
          paid_date: paidFrom ? (fd.get('paid_date') || fd.get('bill_date')) : null
        };
        await api('/admin/finance/bills' + (bill ? '/' + bill.id : ''), { method: bill ? 'PUT' : 'POST', body: body });
        modal.close();
        refreshAfterChange();
      }
    });
  }

  function openMarkPaid(kind, row) {
    Modal.form({
      title: 'Mark as paid',
      submitText: 'Mark paid',
      size: 'sm',
      formContent:
        field('Paid date', '<input type="date" name="paid_date" class="modal-form-input" required value="' + today() + '">') +
        field('Paid from', '<select name="paid_from" class="modal-form-input"><option value="bank">Bank</option><option value="cash">Cash</option><option value="owner">Paid personally</option></select>'),
      onSubmit: async function (fd, modal) {
        const path = kind === 'bill' ? '/admin/finance/bills/' : '/admin/finance/expenses/';
        await api(path + row.id, { method: 'PUT', body: { paid_date: fd.get('paid_date'), paid_from: fd.get('paid_from') } });
        modal.close();
        refreshAfterChange();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Expenses
  // -------------------------------------------------------------------------

  async function loadExpenses() {
    try {
      const data = await api('/admin/finance/expenses');
      expenses = data.expenses || [];
      events = data.events || [];
      renderExpenses();
    } catch (e) {
      el('finance-expenses-list').innerHTML = '<p class="admin-text-muted">Could not load expenses. ' + esc(e.message) + '</p>';
    }
  }

  function renderExpenses() {
    el('finance-expenses-list').innerHTML = table(
      [{ label: 'Date' }, { label: 'Category' }, { label: 'Description' }, { label: 'Event' }, { label: 'Amount', num: true }, { label: 'Status' }, { label: '' }],
      expenses.map(function (x) {
        return '<tr><td style="white-space: nowrap;">' + esc(formatDate(x.expense_date)) + '</td>' +
          '<td>' + esc(EXPENSE_LABELS[x.category] || x.category) + '</td>' +
          '<td>' + esc(x.description || '') + '</td>' +
          '<td>' + esc(x.event_name || '') + '</td>' +
          '<td style="' + NUM + '">' + esc(gbp(x.amount_pence)) + '</td>' +
          '<td>' + statusText(x.paid_date, x.paid_from) + '</td>' +
          '<td style="white-space: nowrap;">' + (x.paid_date ? '' : smallBtn('finance-expense-pay', x.id, 'Mark paid')) +
          smallBtn('finance-expense-edit', x.id, 'Edit') + smallBtn('finance-expense-delete', x.id, 'Delete') + '</td></tr>';
      }).join(''),
      'No expenses recorded yet.'
    );
  }

  function openExpenseForm(expense) {
    const x = expense || {};
    const categoryOptions = Object.keys(EXPENSE_LABELS).map(function (k) {
      return '<option value="' + k + '"' + (x.category === k ? ' selected' : '') + '>' + esc(EXPENSE_LABELS[k]) + '</option>';
    }).join('');
    const eventOptions = '<option value="">Not linked to an event</option>' + events.map(function (e) {
      return '<option value="' + e.event_id + '"' + (Number(x.event_id) === Number(e.event_id) ? ' selected' : '') + '>' +
        esc(e.event_name) + ' (' + esc(formatDate(e.event_datetime)) + ')</option>';
    }).join('');
    Modal.form({
      title: expense ? 'Edit expense' : 'Add expense',
      submitText: expense ? 'Save expense' : 'Add expense',
      formContent:
        field('Date', '<input type="date" name="expense_date" class="modal-form-input" required value="' + esc(x.expense_date || today()) + '">') +
        field('Category', '<select name="category" class="modal-form-input">' + categoryOptions + '</select>') +
        field('Description', '<input name="description" class="modal-form-input" value="' + esc(x.description || '') + '" placeholder="e.g. Prize support for tournament">') +
        field('Event', '<select name="event_id" class="modal-form-input">' + eventOptions + '</select>', 'Linking an event shows this cost against that event in the P&L.') +
        field('Amount (£)', '<input type="number" step="0.01" min="0" name="amount" class="modal-form-input" required value="' + (expense ? (x.amount_pence / 100).toFixed(2) : '') + '">') +
        field('Paid', paidSelect('paid_from', x.paid_date ? x.paid_from : 'bank')) +
        field('Paid date', '<input type="date" name="paid_date" class="modal-form-input" value="' + esc(x.paid_date || '') + '">', 'Leave blank to use the expense date.'),
      onSubmit: async function (fd, modal) {
        const amount = toPence(fd.get('amount'));
        if (!amount) throw new Error(ERROR_MESSAGES.invalid_amount);
        const paidFrom = fd.get('paid_from');
        const body = {
          expense_date: fd.get('expense_date'),
          category: fd.get('category'),
          description: fd.get('description'),
          event_id: fd.get('event_id') || null,
          amount_pence: amount,
          paid_from: paidFrom || null,
          paid_date: paidFrom ? (fd.get('paid_date') || fd.get('expense_date')) : null
        };
        await api('/admin/finance/expenses' + (expense ? '/' + expense.id : ''), { method: expense ? 'PUT' : 'POST', body: body });
        modal.close();
        refreshAfterChange();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Owner money in and out
  // -------------------------------------------------------------------------

  async function loadOwnerMovements() {
    try {
      const data = await api('/admin/finance/owner-movements');
      ownerMovements = data.movements || [];
      renderOwnerMovements();
    } catch (e) {
      el('finance-owner-list').innerHTML = '<p class="admin-text-muted">Could not load owner money. ' + esc(e.message) + '</p>';
    }
  }

  function renderOwnerMovements() {
    el('finance-owner-list').innerHTML = table(
      [{ label: 'Date' }, { label: 'Type' }, { label: 'Account' }, { label: 'Amount', num: true }, { label: 'Notes' }, { label: '' }],
      ownerMovements.map(function (m) {
        return '<tr><td style="white-space: nowrap;">' + esc(formatDate(m.movement_date)) + '</td>' +
          '<td>' + (m.type === 'capital_in' ? 'Money put in' : 'Money taken out') + '</td>' +
          '<td>' + esc(m.account === 'cash' ? 'Cash' : 'Bank') + '</td>' +
          '<td style="' + NUM + '">' + esc(gbp(m.amount_pence)) + '</td>' +
          '<td>' + esc(m.notes || '') + '</td>' +
          '<td style="white-space: nowrap;">' + smallBtn('finance-owner-edit', m.id, 'Edit') + smallBtn('finance-owner-delete', m.id, 'Delete') + '</td></tr>';
      }).join(''),
      'Nothing recorded yet. Record money you put into the shop (for example to buy stock) or take out for yourself.'
    );
  }

  function openOwnerForm(movement) {
    const m = movement || {};
    Modal.form({
      title: movement ? 'Edit owner money' : 'Record money in or out',
      submitText: 'Save',
      formContent:
        field('Date', '<input type="date" name="movement_date" class="modal-form-input" required value="' + esc(m.movement_date || today()) + '">') +
        field('Type', '<select name="type" class="modal-form-input">' +
          '<option value="capital_in"' + (m.type !== 'drawing' ? ' selected' : '') + '>Money put in</option>' +
          '<option value="drawing"' + (m.type === 'drawing' ? ' selected' : '') + '>Money taken out</option></select>') +
        field('Account', '<select name="account" class="modal-form-input">' +
          '<option value="bank"' + (m.account !== 'cash' ? ' selected' : '') + '>Bank</option>' +
          '<option value="cash"' + (m.account === 'cash' ? ' selected' : '') + '>Cash</option></select>') +
        field('Amount (£)', '<input type="number" step="0.01" min="0" name="amount" class="modal-form-input" required value="' + (movement ? (m.amount_pence / 100).toFixed(2) : '') + '">') +
        field('Notes', '<input name="notes" class="modal-form-input" value="' + esc(m.notes || '') + '">'),
      onSubmit: async function (fd, modal) {
        const amount = toPence(fd.get('amount'));
        if (!amount) throw new Error(ERROR_MESSAGES.invalid_amount);
        const body = {
          movement_date: fd.get('movement_date'),
          type: fd.get('type'),
          account: fd.get('account'),
          amount_pence: amount,
          notes: fd.get('notes')
        };
        await api('/admin/finance/owner-movements' + (movement ? '/' + movement.id : ''), { method: movement ? 'PUT' : 'POST', body: body });
        modal.close();
        refreshAfterChange();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Stock batches
  // -------------------------------------------------------------------------

  async function loadLots() {
    const remaining = el('finance-lots-remaining') && el('finance-lots-remaining').checked;
    try {
      const data = await api('/admin/stock/lots' + (remaining ? '?remaining=1' : ''));
      const lots = data.lots || [];
      el('finance-lots-list').innerHTML = table(
        [{ label: 'Received' }, { label: 'Product' }, { label: 'Supplier' }, { label: 'Received qty', num: true }, { label: 'Left', num: true }, { label: 'Unit cost', num: true }, { label: 'Value left', num: true }],
        lots.map(function (l) {
          return '<tr><td style="white-space: nowrap;">' + esc(formatDate(l.received_date)) + '</td>' +
            '<td>' + esc(l.product_name || ('Product ' + l.product_id)) + '</td>' +
            '<td>' + esc(l.supplier || '') + '</td>' +
            '<td style="' + NUM + '">' + esc(l.quantity_received) + '</td>' +
            '<td style="' + NUM + '">' + esc(l.quantity_remaining) + '</td>' +
            '<td style="' + NUM + '">' + esc(gbp(l.unit_cost_pence)) + '</td>' +
            '<td style="' + NUM + '">' + esc(gbp(l.quantity_remaining * l.unit_cost_pence)) + '</td></tr>';
        }).join(''),
        remaining ? 'No stock batches with stock left.' : 'No stock batches yet.'
      );
    } catch (e) {
      el('finance-lots-list').innerHTML = '<p class="admin-text-muted">Could not load stock batches. ' + esc(e.message) + '</p>';
    }
  }

  // -------------------------------------------------------------------------
  // Receive stock and write off (product list)
  // -------------------------------------------------------------------------

  async function openReceiveStock(product) {
    if (!product || !opts) return;
    const owner = opts.isOwner();
    let unpaidBills = [];
    if (owner) {
      try {
        unpaidBills = (await api('/admin/finance/bills?status=unpaid')).bills || [];
      } catch (e) {
        unpaidBills = [];
      }
    }
    const billOptions = '<option value="">Create a new bill for this stock</option>' + unpaidBills.map(function (b) {
      return '<option value="' + b.id + '">' + esc(b.supplier) + ', ' + esc(formatDate(b.bill_date)) + ', ' + esc(gbp(b.total_pence)) + (b.reference ? ' (' + esc(b.reference) + ')' : '') + '</option>';
    }).join('');

    const modal = Modal.form({
      title: 'Receive stock: ' + product.name,
      submitText: 'Add stock',
      formContent:
        field('Quantity received', '<input type="number" name="quantity" min="1" step="1" class="modal-form-input" required>') +
        field('Cost per unit (£)', '<input type="number" name="unit_cost" min="0" step="0.01" class="modal-form-input" required>', 'What you paid per item, including any discount from the supplier.') +
        field('Supplier', '<input name="supplier" class="modal-form-input" autocomplete="off">') +
        field('Date received', '<input type="date" name="received_date" class="modal-form-input" required value="' + today() + '">') +
        (owner ? field('Supplier bill', '<select name="supplier_bill_id" class="modal-form-input">' + billOptions + '</select>', 'Choose an existing unpaid bill if this delivery is part of one.') : '') +
        '<div data-new-bill>' +
          field('Paid', paidSelect('paid_from', '')) +
          field('Invoice reference', '<input name="reference" class="modal-form-input">') +
        '</div>',
      onSubmit: async function (fd, m) {
        const unitCost = toPence(fd.get('unit_cost'));
        if (unitCost == null) throw new Error(ERROR_MESSAGES.invalid_unit_cost);
        const billId = fd.get('supplier_bill_id') || null;
        if (!billId && !String(fd.get('supplier') || '').trim()) throw new Error(ERROR_MESSAGES.missing_supplier);
        const paidFrom = fd.get('paid_from');
        await api('/admin/stock/receive', {
          method: 'POST',
          body: {
            product_id: product.id,
            quantity: parseInt(fd.get('quantity'), 10),
            unit_cost_pence: unitCost,
            supplier: fd.get('supplier'),
            received_date: fd.get('received_date'),
            supplier_bill_id: billId,
            paid: !!paidFrom,
            paid_from: paidFrom || null,
            reference: fd.get('reference')
          }
        });
        m.close();
        if (opts.onStockChanged) opts.onStockChanged();
        if (owner && el('finance-tab') && el('finance-tab').style.display !== 'none') refreshAfterChange();
      }
    });

    const billSelect = modal.querySelector('select[name="supplier_bill_id"]');
    const newBill = modal.querySelector('[data-new-bill]');
    if (billSelect && newBill) {
      billSelect.addEventListener('change', function () {
        newBill.style.display = billSelect.value ? 'none' : '';
      });
    }
  }

  function openWriteOff(product) {
    if (!product || !opts) return;
    Modal.form({
      title: 'Write off stock: ' + product.name,
      submitText: 'Write off',
      size: 'sm',
      formContent:
        '<p class="admin-text-small" style="margin-top: 0;">Removes items from stock at their recorded cost (oldest batch first), for example damaged, lost or given away as prizes. ' + esc(product.stock_quantity) + ' in stock.</p>' +
        field('Quantity', '<input type="number" name="quantity" min="1" step="1" max="' + esc(product.stock_quantity) + '" class="modal-form-input" required>') +
        field('Reason', '<input name="reason" class="modal-form-input" required placeholder="e.g. Damaged box">') +
        field('Date', '<input type="date" name="date" class="modal-form-input" value="' + today() + '">'),
      onSubmit: async function (fd, m) {
        await api('/admin/stock/write-off', {
          method: 'POST',
          body: {
            product_id: product.id,
            quantity: parseInt(fd.get('quantity'), 10),
            reason: fd.get('reason'),
            date: fd.get('date')
          }
        });
        m.close();
        if (opts.onStockChanged) opts.onStockChanged();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Settings, loading and wiring
  // -------------------------------------------------------------------------

  async function loadSettings() {
    try {
      const data = await api('/admin/finance/settings');
      el('finance-books-start').value = data.books_start_date || '';
    } catch (e) {
      setStatus('Could not load settings. ' + e.message);
    }
  }

  async function saveSettings() {
    const value = el('finance-books-start').value;
    try {
      await api('/admin/finance/settings', { method: 'PUT', body: { books_start_date: value } });
      setStatus('Books start date saved.');
      refreshReports();
    } catch (e) {
      setStatus('Could not save the start date. ' + e.message);
    }
  }

  function refreshReports() {
    if (pnlData) runPnl();
    runBalanceSheet();
  }

  function refreshAfterChange() {
    loadBills();
    loadExpenses();
    loadOwnerMovements();
    loadLots();
    loadSessions();
    if (openSessionId) loadSession(openSessionId);
    productChoices = null;
    if (opts.onStockChanged) opts.onStockChanged();
    refreshReports();
  }

  function confirmDelete(message, onConfirm) {
    Modal.confirm({
      title: 'Delete',
      message: esc(message),
      confirmText: 'Delete',
      confirmStyle: 'danger',
      onConfirm: async function () {
        try {
          await onConfirm();
          refreshAfterChange();
        } catch (e) {
          Modal.alert({ title: 'Not deleted', message: esc(e.message) });
        }
      }
    });
  }

  function findById(list, id) {
    return list.find(function (r) { return Number(r.id) === Number(id); }) || null;
  }

  // -------------------------------------------------------------------------
  // Stock import sessions
  // -------------------------------------------------------------------------

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('Could not read that file.')); };
      reader.readAsDataURL(file);
    });
  }

  async function uploadReceipt(file) {
    const dataUrl = await readFile(file);
    const data = await api('/admin/finance/receipts', { method: 'POST', body: { file: dataUrl, filename: file.name } });
    return data.url;
  }

  function sessionPaidBody(fd, dateFallback) {
    const paidFrom = fd.get('paid_from');
    return {
      paid_from: paidFrom || null,
      paid_date: paidFrom ? (fd.get('paid_date') || dateFallback) : null
    };
  }

  async function loadSessions() {
    const list = el('finance-sessions-list');
    if (!list) return;
    try {
      const data = await api('/admin/finance/import-sessions');
      sessions = data.sessions || [];
      if (openSessionId) return;
      list.innerHTML = table(
        [{ label: 'Date' }, { label: 'Supplier' }, { label: 'Reference' }, { label: 'Items', num: true }, { label: 'Cost', num: true }, { label: 'Receipt' }, { label: '' }],
        sessions.map(function (s) {
          const receipt = s.receipt_url
            ? '<a href="' + esc(s.receipt_url) + '" target="_blank" rel="noopener">View</a>'
            : '<span class="admin-text-muted">None</span>';
          return '<tr><td style="white-space: nowrap;">' + esc(formatDate(s.received_date)) + '</td>' +
            '<td>' + esc(s.supplier) + '</td><td>' + esc(s.reference || '') + '</td>' +
            '<td style="' + NUM + '">' + (Number(s.line_count) || 0) + '</td>' +
            '<td style="' + NUM + '">' + esc(gbp(s.stock_pence)) + '</td>' +
            '<td>' + receipt + '</td>' +
            '<td>' + smallBtn('finance-session-open', s.id, 'Open') + '</td></tr>';
        }).join(''),
        'No import sessions yet. Start one when you have a supplier receipt to enter.'
      );
    } catch (e) {
      list.innerHTML = '<p class="admin-text-muted">Could not load import sessions. ' + esc(e.message) + '</p>';
    }
  }

  function closeSessionPanel() {
    openSessionId = null;
    const panel = el('finance-session-panel');
    if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
    const list = el('finance-sessions-list');
    if (list) list.style.display = '';
    const btn = el('finance-session-new');
    if (btn) btn.style.display = '';
    loadSessions();
  }

  function openSession(id) {
    openSessionId = id;
    const list = el('finance-sessions-list');
    if (list) list.style.display = 'none';
    const btn = el('finance-session-new');
    if (btn) btn.style.display = 'none';
    const panel = el('finance-session-panel');
    if (panel) {
      panel.style.display = '';
      panel.innerHTML = '<p class="admin-text-muted">Loading session...</p>';
    }
    loadSession(id);
  }

  async function loadSession(id) {
    if (String(openSessionId) !== String(id)) return;
    try {
      const data = await api('/admin/finance/import-sessions/' + id);
      if (String(openSessionId) !== String(id)) return;
      renderSession(data.session, data.lines || []);
    } catch (e) {
      const panel = el('finance-session-panel');
      if (panel) panel.innerHTML = '<p class="admin-text-muted">' + esc(e.message) + '</p>';
    }
  }

  function renderSession(session, lines) {
    const panel = el('finance-session-panel');
    if (!panel) return;
    const total = lines.reduce(function (sum, line) { return sum + (Number(line.quantity) || 0) * (Number(line.unit_cost_pence) || 0); }, 0);
    const receipt = session.receipt_url
      ? '<p class="admin-text-small"><a href="' + esc(session.receipt_url) + '" target="_blank" rel="noopener">View current receipt</a></p>'
      : '';
    panel.innerHTML =
      '<button type="button" id="finance-session-back" class="btn btn-secondary admin-mb-1">Back to sessions</button>' +
      '<h3 class="admin-section-heading">' + esc(session.supplier) + ', ' + esc(formatDate(session.received_date)) + '</h3>' +
      '<form id="finance-session-header" class="admin-mb-2">' +
        '<div class="admin-flex" style="flex-wrap: wrap; align-items: end;">' +
          '<div><label class="form-label" for="finance-session-supplier">Supplier</label>' +
            '<input id="finance-session-supplier" name="supplier" class="form-input" required value="' + esc(session.supplier) + '"></div>' +
          '<div><label class="form-label" for="finance-session-date">Date</label>' +
            '<input id="finance-session-date" type="date" name="received_date" class="form-input" required value="' + esc(session.received_date) + '"></div>' +
          '<div><label class="form-label" for="finance-session-reference">Reference</label>' +
            '<input id="finance-session-reference" name="reference" class="form-input" value="' + esc(session.reference || '') + '" placeholder="Invoice number"></div>' +
        '</div>' +
        '<div class="admin-flex admin-mb-1" style="flex-wrap: wrap; align-items: end; margin-top: 0.75rem;">' +
          '<div><label class="form-label" for="finance-session-paid">Paid</label>' +
            paidSelect('paid_from', session.paid_date ? session.paid_from : '').replace('modal-form-input', 'form-input') + '</div>' +
          '<div><label class="form-label" for="finance-session-paid-date">Paid date</label>' +
            '<input id="finance-session-paid-date" type="date" name="paid_date" class="form-input" value="' + esc(session.paid_date || '') + '"></div>' +
          '<div><label class="form-label" for="finance-session-notes">Notes</label>' +
            '<input id="finance-session-notes" name="notes" class="form-input" value="' + esc(session.notes || '') + '"></div>' +
        '</div>' +
        '<div><label class="form-label" for="finance-session-receipt">Receipt photo or PDF</label>' +
          '<input id="finance-session-receipt" type="file" name="receipt" accept="image/*,application/pdf" class="form-input"></div>' +
        receipt +
        '<button type="submit" class="btn btn-secondary" style="margin-top: 0.75rem;">Save receipt details</button>' +
      '</form>' +
      '<div class="admin-flex admin-mb-1">' +
        '<button type="button" id="finance-session-add-manual" class="btn btn-primary">Add item</button>' +
      '</div>' +
      '<p class="admin-text-small admin-mb-1">' + lines.length + ' item' + (lines.length === 1 ? '' : 's') + ', ' + esc(gbp(total)) + ' at cost.</p>' +
      table(
        [{ label: 'Item' }, { label: 'How' }, { label: 'Qty', num: true }, { label: 'Cost each', num: true }, { label: 'Line cost', num: true }, { label: '' }],
        lines.map(function (line) {
          const how = line.entry_method === 'barcode' ? 'Barcode' : 'Manual';
          return '<tr><td>' + esc(line.product_name || line.name) + (line.ean ? ' <span class="admin-text-small admin-text-muted">' + esc(line.ean) + '</span>' : '') + '</td>' +
            '<td>' + how + '</td>' +
            '<td style="' + NUM + '">' + (Number(line.quantity) || 0) + '</td>' +
            '<td style="' + NUM + '">' + esc(gbp(line.unit_cost_pence)) + '</td>' +
            '<td style="' + NUM + '">' + esc(gbp((Number(line.quantity) || 0) * (Number(line.unit_cost_pence) || 0))) + '</td>' +
            '<td>' + (Number(line.removable) ? smallBtn('finance-session-line-remove', line.id, 'Remove') : '') + '</td></tr>';
        }).join(''),
        'No items yet. Add each product from this receipt.'
      );
    panel.style.display = '';

    const form = panel.querySelector('#finance-session-header');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(form);
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      try {
        let receiptUrl = session.receipt_url || null;
        const file = fd.get('receipt');
        if (file && file.size) receiptUrl = await uploadReceipt(file);
        await api('/admin/finance/import-sessions/' + session.id, {
          method: 'PUT',
          body: Object.assign({
            supplier: fd.get('supplier'),
            received_date: fd.get('received_date'),
            reference: fd.get('reference'),
            notes: fd.get('notes'),
            receipt_url: receiptUrl
          }, sessionPaidBody(fd, fd.get('received_date')))
        });
        setStatus('Receipt details saved.');
        refreshAfterChange();
      } catch (err) {
        setStatus(err.message);
        submit.disabled = false;
      }
    });
  }

  function openSessionForm() {
    Modal.form({
      title: 'New import session',
      submitText: 'Start session',
      size: 'lg',
      formContent:
        field('Supplier', '<input name="supplier" class="modal-form-input" required>') +
        field('Date on the receipt', '<input type="date" name="received_date" class="modal-form-input" required value="' + today() + '">') +
        field('Reference', '<input name="reference" class="modal-form-input" placeholder="Invoice number">') +
        field('Receipt photo or PDF', '<input type="file" name="receipt" accept="image/*,application/pdf" class="modal-form-input">', 'Optional. You can add it later.') +
        field('Paid', paidSelect('paid_from', '')) +
        field('Paid date', '<input type="date" name="paid_date" class="modal-form-input">', 'Leave blank to use the receipt date.') +
        field('Notes', '<input name="notes" class="modal-form-input">'),
      onSubmit: async function (fd, modal) {
        const supplier = String(fd.get('supplier') || '').trim();
        if (!supplier) throw new Error(ERROR_MESSAGES.missing_supplier);
        let receiptUrl = null;
        const file = fd.get('receipt');
        if (file && file.size) receiptUrl = await uploadReceipt(file);
        const created = await api('/admin/finance/import-sessions', {
          method: 'POST',
          body: Object.assign({
            supplier: supplier,
            received_date: fd.get('received_date'),
            reference: fd.get('reference'),
            notes: fd.get('notes'),
            receipt_url: receiptUrl
          }, sessionPaidBody(fd, fd.get('received_date')))
        });
        modal.close();
        refreshAfterChange();
        openSession(created.id);
      }
    });
  }

  async function loadProductChoices() {
    if (productChoices) return productChoices;
    const data = await api('/admin/products');
    productChoices = Array.isArray(data) ? data : [];
    return productChoices;
  }

  function productOptions(products, filter) {
    const q = String(filter || '').trim().toLowerCase();
    const matches = products.filter(function (p) {
      if (p.catalog_status === 'archived') return false;
      if (!q) return true;
      return String(p.name || '').toLowerCase().indexOf(q) !== -1 || String(p.ean || '').indexOf(q) !== -1;
    }).slice(0, 40);
    if (!matches.length) return '<option value="">No matching products</option>';
    return matches.map(function (p) {
      return '<option value="' + p.id + '">' + esc(p.name) + (p.ean ? ' (' + esc(p.ean) + ')' : '') + '</option>';
    }).join('');
  }

  function qtyCostFields() {
    return field('Quantity', '<input type="number" min="1" step="1" name="quantity" class="modal-form-input" required value="1">') +
      field('Cost each (£)', '<input type="number" min="0" step="0.01" name="unit_cost" class="modal-form-input" required>', 'What you paid the supplier for one unit, not the selling price.');
  }

  async function submitSessionLine(body, modal) {
    const quantity = parseInt(body.quantity, 10);
    const unitCost = toPence(body.unit_cost);
    if (!quantity || quantity < 1) throw new Error(ERROR_MESSAGES.invalid_quantity);
    if (unitCost == null) throw new Error(ERROR_MESSAGES.invalid_unit_cost);
    const payload = {
      entry_method: body.entry_method,
      quantity: quantity,
      unit_cost_pence: unitCost,
      product_id: body.product_id || null,
      ean: body.ean || null,
      name: body.name || null,
      price_pence: body.price != null && body.price !== '' ? toPence(body.price) : null,
      category: body.category || null,
      summary: body.summary || null,
      description: body.description || null,
      image_url: body.image_url || null
    };
    if (!payload.product_id && payload.price_pence == null && body.needs_price) throw new Error(ERROR_MESSAGES.missing_price);
    const result = await api('/admin/finance/import-sessions/' + openSessionId + '/lines', { method: 'POST', body: payload });
    modal.close();
    const copy = result.filled_copy || [];
    const filledText = copy.indexOf('summary') !== -1 || copy.indexOf('full_description') !== -1;
    if (result.created_product) {
      setStatus(filledText
        ? 'New product added to the shop and to this receipt, including the summary and description.'
        : 'New product added to the shop and to this receipt.');
    } else if (result.matched_existing) {
      setStatus(filledText || copy.indexOf('price') !== -1
        ? 'Stock was added, and the selling price, summary or description you entered was saved on the product.'
        : 'That product is already in the shop, so the stock was added to the existing product.');
    } else setStatus('Item added to this receipt.');
    refreshAfterChange();
  }

  function openSessionLine() {
    if (!openSessionId) return;
    openManualLine();
  }

  async function openManualLine() {
    let products = [];
    try {
      products = await loadProductChoices();
    } catch (e) {
      Modal.alert({ title: 'Products', message: esc(e.message) });
      return;
    }
    const modal = Modal.form({
      title: 'Add manually',
      submitText: 'Add to receipt',
      size: 'lg',
      formContent:
        '<div class="session-line-existing">' +
          field('Find a product', '<input class="modal-form-input session-line-filter" placeholder="Name or EAN">') +
          '<select name="product_id" class="modal-form-input session-line-products" size="6">' + productOptions(products, '') + '</select>' +
        '</div>' +
        '<label class="checkbox-label" style="display: flex; gap: 0.5rem; align-items: center; margin: 0.75rem 0;">' +
          '<input type="checkbox" name="new_product" class="checkbox-input session-line-new-toggle"> This is a new product' +
        '</label>' +
        '<div class="session-line-new" style="display: none;">' +
          field('Product name', '<input name="name" class="modal-form-input">') +
          field('EAN', '<input name="ean" class="modal-form-input" inputmode="numeric">', 'Optional. Stored on a new product so a later import can match it.') +
          field('Category', '<input name="category" class="modal-form-input">') +
        '</div>' +
        field('Selling price (£)', '<input type="number" min="0" step="0.01" name="price" class="modal-form-input">', 'The price you will charge in the shop. Filled in for a new product, and updates an existing one when you enter it.') +
        field('Summary', '<textarea name="summary" rows="2" class="modal-form-input"></textarea>') +
        field('Description', '<textarea name="description" rows="5" class="modal-form-input"></textarea>') +
        qtyCostFields(),
      onSubmit: async function (fd, m) {
        const isNew = fd.get('new_product') === 'on';
        if (!isNew && !fd.get('product_id')) throw new Error('Choose a product, or mark this as a new product.');
        if (isNew && !String(fd.get('name') || '').trim()) throw new Error(ERROR_MESSAGES.missing_name);
        await submitSessionLine({
          entry_method: 'manual',
          quantity: fd.get('quantity'),
          unit_cost: fd.get('unit_cost'),
          product_id: isNew ? null : fd.get('product_id'),
          ean: isNew ? fd.get('ean') : null,
          name: isNew ? fd.get('name') : null,
          price: fd.get('price'),
          category: isNew ? fd.get('category') : null,
          summary: fd.get('summary'),
          description: fd.get('description'),
          needs_price: isNew
        }, m);
      }
    });
    const select = modal.querySelector('.session-line-products');
    modal.querySelector('.session-line-filter').addEventListener('input', function (e) {
      select.innerHTML = productOptions(products, e.target.value);
    });
    modal.querySelector('.session-line-new-toggle').addEventListener('change', function (e) {
      const showNew = e.target.checked;
      modal.querySelector('.session-line-new').style.display = showNew ? '' : 'none';
      modal.querySelector('.session-line-existing').style.display = showNew ? 'none' : '';
    });
  }

  function bind() {
    if (bound) return;
    bound = true;
    const on = function (id, evt, fn) { const node = el(id); if (node) node.addEventListener(evt, fn); };
    on('finance-pnl-run', 'click', runPnl);
    on('finance-pnl-csv', 'click', downloadPnlCsv);
    on('finance-bs-run', 'click', runBalanceSheet);
    on('finance-bs-csv', 'click', downloadBsCsv);
    on('finance-books-start-save', 'click', saveSettings);
    on('finance-bill-add', 'click', function () { openBillForm(null); });
    on('finance-expense-add', 'click', function () { openExpenseForm(null); });
    on('finance-owner-add', 'click', function () { openOwnerForm(null); });
    on('finance-bills-unpaid', 'change', loadBills);
    on('finance-lots-remaining', 'change', loadLots);
    on('finance-session-new', 'click', function () { openSessionForm(); });

    const tab = el('finance-tab');
    if (tab) {
      tab.addEventListener('click', function (e) {
        const btn = e.target.closest('button');
        if (!btn || !tab.contains(btn)) return;
        if (btn.id === 'finance-session-back') { closeSessionPanel(); return; }
        if (btn.id === 'finance-session-add-manual') { openSessionLine(); return; }
        const id = btn.getAttribute('data-id');
        if (!id) return;
        if (btn.classList.contains('finance-bill-pay')) openMarkPaid('bill', findById(bills, id));
        else if (btn.classList.contains('finance-bill-edit')) openBillForm(findById(bills, id));
        else if (btn.classList.contains('finance-expense-pay')) openMarkPaid('expense', findById(expenses, id));
        else if (btn.classList.contains('finance-expense-edit')) openExpenseForm(findById(expenses, id));
        else if (btn.classList.contains('finance-expense-delete')) {
          confirmDelete('Delete this expense?', function () { return api('/admin/finance/expenses/' + id, { method: 'DELETE' }); });
        } else if (btn.classList.contains('finance-owner-edit')) openOwnerForm(findById(ownerMovements, id));
        else if (btn.classList.contains('finance-owner-delete')) {
          confirmDelete('Delete this owner money entry?', function () { return api('/admin/finance/owner-movements/' + id, { method: 'DELETE' }); });
        } else if (btn.classList.contains('finance-session-open')) openSession(id);
        else if (btn.classList.contains('finance-session-line-remove')) {
          confirmDelete('Remove this item from the receipt and from stock?', function () {
            return api('/admin/finance/import-sessions/' + openSessionId + '/lines/' + id, { method: 'DELETE' });
          });
        }
      });
    }
  }

  function init(options) {
    opts = options;
    bind();
    const now = new Date();
    if (el('finance-pnl-from') && !el('finance-pnl-from').value) {
      el('finance-pnl-from').value = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
    }
    if (el('finance-pnl-to') && !el('finance-pnl-to').value) el('finance-pnl-to').value = today();
    if (el('finance-bs-asof') && !el('finance-bs-asof').value) el('finance-bs-asof').value = today();
  }

  async function load() {
    if (!opts || !opts.isOwner()) return;
    await loadSettings();
    runPnl();
    runBalanceSheet();
    loadBills();
    loadExpenses();
    loadOwnerMovements();
    loadLots();
    loadSessions();
  }

  global.ShopFinance = {
    init: init,
    load: load,
    openReceiveStock: openReceiveStock,
    openWriteOff: openWriteOff,
    refreshImportSessions: function (sessionId) {
      refreshAfterChange();
      if (sessionId) openSession(sessionId);
    }
  };
})(window);
