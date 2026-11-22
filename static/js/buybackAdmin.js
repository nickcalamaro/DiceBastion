/**
 * Admin trade-in lists: review, PDF download, offer email, rejection, store credit.
 */
(function (global) {
  const GAMES = { mtg: 'Magic: The Gathering', riftbound: 'Riftbound' };
  const STATUS_LABELS = {
    submitted: 'Waiting for review',
    under_review: 'Under review',
    quoted: 'Offer sent',
    accepted: 'Customer agreed',
    rejected: 'Rejected',
    completed: 'Credit issued',
    cancelled: 'Cancelled'
  };
  const ERRORS = {
    case_closed: 'This list is already finished, so an offer cannot be sent.',
    invalid_amount: 'Enter an amount in pounds, such as 12.50. The most we can add here is £20,000.',
    invalid_note: 'The note is too long. Keep it under 2,000 characters.',
    offer_required: 'Send an offer before adding store credit.',
    already_completed: 'Store credit has already been added for this list.',
    already_rejected: 'This list has already been rejected.',
    invalid_message: 'Write a short message for the customer, at least 10 characters.',
    not_found: 'That list could not be found.',
    case_changed: 'This list changed while you were working. Refresh it and try again.',
    email_failed: 'The email did not send, so the list was left unchanged.',
    unauthorized: 'Sign in again to use trade-ins.',
    invalid_rate: 'Enter a trade-in rate from 30 to 150.',
    invalid_fx: 'Enter how many pounds one unit of the file currency is worth, such as 0.85.',
    empty_csv: 'That file has no cards.',
    bad_csv: 'Use a ManaBox card list. It needs Name, Quantity and Purchase price columns.',
    mixed_currency: 'Every row in the file needs the same purchase currency.',
    no_prices: 'None of the rows have a purchase price, so there is nothing to offer.',
    too_many_rows: 'This file has more than 400 cards. Split it and import the parts separately.',
    total_too_high: 'This offer is above £20,000. Lower the rate or split the list.',
    invalid_email: 'Enter the customer email address.',
    customer_not_found: 'That member could not be found.',
    csv_too_large: 'That file is too large.',
    invalid_email_draft: 'The email draft needs to be at least 10 characters and under 8,000.',
    invalid_subject: 'Keep the subject under 140 characters.'
  };

  let apiBase = '';
  let tokenFn = () => '';
  let currentId = null;
  let busy = false;
  let listFilter = 'open';
  let pickedCustomer = null;
  let customerMode = 'member';
  let searchTimer = null;
  let memberMatches = [];
  let pricedStamp = '';
  let pricedPreview = null;

  function root() {
    return document.getElementById('buyback-admin-root');
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pounds(pence) {
    if (pence == null || pence === '') return '';
    const n = Number(pence) || 0;
    return '£' + (n / 100).toFixed(2);
  }

  function when(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function messageFor(data, fallback) {
    return (data && (ERRORS[data.error] || data.message)) || fallback;
  }

  async function api(path, options) {
    const res = await fetch(apiBase + path, {
      method: (options && options.method) || 'GET',
      headers: {
        'X-Session-Token': tokenFn() || '',
        ...(options && options.body ? { 'Content-Type': 'application/json' } : {})
      },
      body: options && options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(messageFor(data, 'Something went wrong. Try again.'));
      err.data = data;
      throw err;
    }
    return data;
  }

  function setStatus(text, isError) {
    const el = document.getElementById('buyback-admin-status');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = isError ? '#b00020' : 'rgb(var(--color-neutral-600))';
  }

  async function load() {
    const el = root();
    if (!el) return;
    if (!tokenFn()) {
      el.innerHTML = '<p class="admin-text-muted">Sign in again to review trade-ins.</p>';
      return;
    }
    const status = listFilter;
    el.innerHTML = '<p class="admin-text-muted">Loading lists...</p>';
    try {
      const data = await api('/admin/buyback/cases' + (status ? '?status=' + encodeURIComponent(status) : ''));
      renderList(data.cases || []);
    } catch (err) {
      el.innerHTML = '<p style="color:#b00020;">' + esc(err.message) + '</p>';
    }
  }

  function renderList(cases) {
    const el = root();
    const rows = cases.length
      ? cases.map(row => `
        <tr>
          <td style="padding:0.55rem 0.4rem; border-bottom:1px solid rgb(var(--color-neutral-200));">${row.id}</td>
          <td style="padding:0.55rem 0.4rem; border-bottom:1px solid rgb(var(--color-neutral-200));">
            ${esc(row.user_name || '')}<br><span style="color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">${esc(row.user_email || '')}</span>
          </td>
          <td style="padding:0.55rem 0.4rem; border-bottom:1px solid rgb(var(--color-neutral-200));">${Number(row.item_count) || 0}</td>
          <td style="padding:0.55rem 0.4rem; border-bottom:1px solid rgb(var(--color-neutral-200));">${esc(STATUS_LABELS[row.status] || row.status)}</td>
          <td style="padding:0.55rem 0.4rem; border-bottom:1px solid rgb(var(--color-neutral-200));">${esc(pounds(row.agreed_value_pence))}</td>
          <td style="padding:0.55rem 0.4rem; border-bottom:1px solid rgb(var(--color-neutral-200));">${esc(when(row.created_at))}</td>
          <td style="padding:0.55rem 0.4rem; border-bottom:1px solid rgb(var(--color-neutral-200));">
            <button type="button" class="btn btn-secondary btn-sm" data-buyback-open="${row.id}">Open</button>
          </td>
        </tr>`).join('')
      : '<tr><td colspan="7" style="padding:0.75rem 0.4rem; color:rgb(var(--color-neutral-600));">No lists in this view.</td></tr>';

    pricedPreview = null;
    pricedStamp = '';
    el.innerHTML = `
      <div class="card admin-mb-2" style="padding:1rem;">
        <h3 style="margin-top:0; font-size:1.05rem;">New list for a customer</h3>
        <p class="admin-text-muted" style="margin-top:0;">Add a ManaBox card list for a member, or for someone who only has an email. Euro prices are converted at the pounds-per-euro rate, then multiplied by the trade-in rate. They are asked to reply with their thoughts.</p>
        <div class="admin-flex" style="gap:1rem; margin-bottom:0.75rem;">
          <label class="form-label" style="display:flex; gap:0.4rem; align-items:center; margin:0;">
            <input type="radio" name="buyback-customer-mode" value="member">
            Member
          </label>
          <label class="form-label" style="display:flex; gap:0.4rem; align-items:center; margin:0;">
            <input type="radio" name="buyback-customer-mode" value="email">
            Email address
          </label>
        </div>
        <div id="buyback-member-fields">
          <div class="form-group">
            <label class="form-label" for="buyback-member-search">Member</label>
            <input type="text" id="buyback-member-search" class="form-input" placeholder="Search by name or email" autocomplete="off">
            <div id="buyback-member-results" style="margin-top:0.4rem;"></div>
            <p id="buyback-member-picked" class="admin-text-small" style="margin-bottom:0;"></p>
          </div>
        </div>
        <div id="buyback-email-fields">
          <div class="admin-flex" style="flex-wrap:wrap; align-items:flex-end; gap:0.75rem;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="buyback-new-email">Email address</label>
              <input type="email" id="buyback-new-email" class="form-input" autocomplete="off">
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" for="buyback-new-name">Name</label>
              <input type="text" id="buyback-new-name" class="form-input" maxlength="80" autocomplete="off">
            </div>
          </div>
        </div>
        <p id="buyback-customer-using" class="admin-text-small"></p>
        <div class="admin-flex" style="flex-wrap:wrap; align-items:flex-end; gap:0.75rem; margin-top:0.75rem;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="buyback-csv-file">Card file</label>
            <input type="file" id="buyback-csv-file" class="form-input" accept=".csv,text/csv">
          </div>
          <div class="form-group" style="margin-bottom:0; max-width:10rem;">
            <label class="form-label" for="buyback-rate">Trade-in rate (%)</label>
            <input type="number" id="buyback-rate" class="form-input" min="30" max="150" step="1" value="30">
          </div>
        </div>
        <p class="admin-text-small">From 30% to 150% of the purchase price on the file.</p>
        <div class="form-group" id="buyback-fx-wrap" style="max-width:16rem;">
          <label class="form-label" for="buyback-gbp-per">Pounds for 1 <span id="buyback-fx-code">EUR</span></label>
          <input type="text" id="buyback-gbp-per" class="form-input" inputmode="decimal" value="0.85">
          <p class="admin-text-small">Starts at 0.85 pounds per euro. Change it before you price the list.</p>
        </div>
        <div class="admin-flex" style="gap:0.5rem; flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary" id="buyback-price-list">Price this list</button>
          <button type="button" class="btn btn-primary" id="buyback-email-offer">Email this offer</button>
        </div>
        <div id="buyback-price-preview" style="margin-top:0.75rem;"></div>
        <p id="buyback-new-status" class="admin-text-small" style="margin-bottom:0;"></p>
      </div>
      <div class="admin-flex admin-mb-1" style="align-items:flex-end; flex-wrap:wrap;">
        <div>
          <label class="form-label" for="buyback-admin-filter">Show</label>
          <select id="buyback-admin-filter" class="form-select">
            <option value="open">Waiting for review</option>
            <option value="quoted">Offer sent</option>
            <option value="accepted">Customer agreed</option>
            <option value="completed">Credit issued</option>
            <option value="rejected">Rejected</option>
            <option value="">All lists</option>
          </select>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" id="buyback-admin-refresh">Refresh</button>
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
        <thead>
          <tr>
            <th style="text-align:left; padding:0.4rem; color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Case</th>
            <th style="text-align:left; padding:0.4rem; color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Customer</th>
            <th style="text-align:left; padding:0.4rem; color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Cards</th>
            <th style="text-align:left; padding:0.4rem; color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Status</th>
            <th style="text-align:left; padding:0.4rem; color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Amount</th>
            <th style="text-align:left; padding:0.4rem; color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Submitted</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
    const filter = document.getElementById('buyback-admin-filter');
    filter.value = listFilter;
    filter.addEventListener('change', () => {
      listFilter = filter.value;
      load();
    });
    document.getElementById('buyback-admin-refresh').addEventListener('click', load);
    el.querySelectorAll('[data-buyback-open]').forEach(btn => {
      btn.addEventListener('click', () => openCase(btn.getAttribute('data-buyback-open')));
    });
    bindNewList();
  }

  function setNewStatus(text, isError) {
    const el = document.getElementById('buyback-new-status');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = isError ? '#b00020' : 'rgb(var(--color-neutral-600))';
  }

  function showPicked() {
    const el = document.getElementById('buyback-member-picked');
    if (!el) return;
    if (!pickedCustomer || customerMode !== 'member') {
      el.textContent = '';
      updateCustomerLine();
      return;
    }
    el.textContent = (pickedCustomer.name || 'Member') + ', ' + (pickedCustomer.email || '');
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'btn btn-secondary btn-sm';
    clear.style.marginLeft = '0.5rem';
    clear.textContent = 'Clear member';
    clear.addEventListener('click', () => {
      pickedCustomer = null;
      showPicked();
    });
    el.appendChild(clear);
    updateCustomerLine();
  }

  function updateCustomerLine() {
    const el = document.getElementById('buyback-customer-using');
    if (!el) return;
    if (customerMode === 'member') {
      el.textContent = pickedCustomer
        ? 'Using member ' + (pickedCustomer.name || 'account') + ', ' + (pickedCustomer.email || '') + '.'
        : 'Using a member. Search for their name or email.';
      return;
    }
    const email = document.getElementById('buyback-new-email');
    const typed = email ? email.value.trim() : '';
    el.textContent = typed
      ? 'Using email address ' + typed + '.'
      : 'Using an email address. Enter it below.';
  }

  function applyCustomerMode() {
    const memberFields = document.getElementById('buyback-member-fields');
    const emailFields = document.getElementById('buyback-email-fields');
    const email = document.getElementById('buyback-new-email');
    const name = document.getElementById('buyback-new-name');
    const search = document.getElementById('buyback-member-search');
    const memberOn = customerMode === 'member';
    if (memberFields) memberFields.hidden = false;
    if (emailFields) emailFields.hidden = false;
    if (email) {
      email.disabled = memberOn;
      if (memberOn) email.value = '';
    }
    if (name) {
      name.disabled = memberOn;
      if (memberOn) name.value = '';
    }
    if (search) search.disabled = !memberOn;
    if (!memberOn) {
      pickedCustomer = null;
      if (search) search.value = '';
      const results = document.getElementById('buyback-member-results');
      if (results) results.innerHTML = '';
    }
    document.querySelectorAll('input[name="buyback-customer-mode"]').forEach(input => {
      input.checked = input.value === customerMode;
    });
    showPicked();
  }

  function customerNameForDraft() {
    if (customerMode === 'member') return pickedCustomer ? (pickedCustomer.name || '') : '';
    const name = document.getElementById('buyback-new-name');
    return name ? name.value.trim() : '';
  }

  function listStamp() {
    const file = document.getElementById('buyback-csv-file');
    const chosen = file && file.files && file.files[0];
    const rate = document.getElementById('buyback-rate');
    const fx = document.getElementById('buyback-gbp-per');
    const email = document.getElementById('buyback-new-email');
    const name = document.getElementById('buyback-new-name');
    return [
      customerMode,
      customerMode === 'member' && pickedCustomer ? pickedCustomer.user_id : '',
      customerMode === 'email' && email ? email.value.trim() : '',
      customerMode === 'email' && name ? name.value.trim() : '',
      rate ? rate.value.trim() : '',
      fx ? fx.value.trim() : '',
      chosen ? chosen.name + ':' + chosen.size + ':' + chosen.lastModified : ''
    ].join('|');
  }

  function readCardFile() {
    const input = document.getElementById('buyback-csv-file');
    const file = input && input.files && input.files[0];
    if (!file) return Promise.reject(new Error('Choose a card file.'));
    return file.text();
  }

  function bindNewList() {
    applyCustomerMode();
    const search = document.getElementById('buyback-member-search');
    search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(searchMembers, 250);
    });
    document.querySelectorAll('input[name="buyback-customer-mode"]').forEach(input => {
      input.addEventListener('change', () => {
        if (!input.checked) return;
        customerMode = input.value;
        applyCustomerMode();
      });
    });
    const email = document.getElementById('buyback-new-email');
    if (email) email.addEventListener('input', updateCustomerLine);
    document.getElementById('buyback-price-list').addEventListener('click', () => { setTimeout(priceList, 0); });
    document.getElementById('buyback-email-offer').addEventListener('click', () => { setTimeout(emailOffer, 0); });
  }

  async function searchMembers() {
    const input = document.getElementById('buyback-member-search');
    const box = document.getElementById('buyback-member-results');
    if (!input || !box) return;
    const q = input.value.trim();
    if (q.length < 2) {
      box.innerHTML = '';
      return;
    }
    try {
      const data = await api('/admin/buyback/customers?q=' + encodeURIComponent(q));
      memberMatches = data.customers || [];
      if (!memberMatches.length) {
        box.innerHTML = '<p class="admin-text-small" style="margin:0;">No member with that name or email. Switch to Email address.</p>';
        return;
      }
      box.innerHTML = memberMatches.map(row =>
        '<button type="button" class="btn btn-secondary btn-sm" data-buyback-member="' + row.user_id + '" style="margin:0 0.4rem 0.4rem 0;">' +
        esc(row.name || row.email) + ', ' + esc(row.email) + '</button>'
      ).join('');
      box.querySelectorAll('[data-buyback-member]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = Number(btn.getAttribute('data-buyback-member'));
          pickedCustomer = memberMatches.find(row => Number(row.user_id) === id) || null;
          box.innerHTML = '';
          input.value = '';
          showPicked();
        });
      });
    } catch (err) {
      box.innerHTML = '<p class="admin-text-small" style="margin:0; color:#b00020;">' + esc(err.message) + '</p>';
    }
  }

  function printingText(line) {
    return [line.set_name, line.set_code ? String(line.set_code).toUpperCase() : '', line.collector_number ? '#' + line.collector_number : ''].filter(Boolean).join(' ');
  }

  function renderPricePreview(data) {
    const box = document.getElementById('buyback-price-preview');
    const fxWrap = document.getElementById('buyback-fx-wrap');
    const fxCode = document.getElementById('buyback-fx-code');
    if (fxWrap) fxWrap.style.display = data.currency && data.currency !== 'GBP' ? 'block' : 'none';
    if (fxCode && data.currency) fxCode.textContent = data.currency;
    const cell = 'padding:0.35rem 0.4rem; border-bottom:1px solid rgb(var(--color-neutral-200));';
    const rows = (data.lines || []).map(line => `
      <tr>
        <td style="${cell}">${esc(line.card_name)}</td>
        <td style="${cell}">${esc(printingText(line))}</td>
        <td style="${cell}">${esc(line.condition || '')}</td>
        <td style="${cell}">${esc(line.language || '')}</td>
        <td style="${cell}">${Number(line.quantity) || 0}</td>
        <td style="${cell}">${esc(line.list_price)} ${esc(data.currency || '')}</td>
        <td style="${cell}">${esc(pounds(line.offer_pence))}</td>
        <td style="${cell}">${esc(line.notes || '')}</td>
      </tr>`).join('');
    box.innerHTML = `
      <p style="margin-bottom:0.4rem;"><strong>${esc(pounds(data.total_pence))}</strong> for ${Number(data.card_count) || 0} cards at ${Number(data.rate_percent) || 0}%.</p>
      <div style="max-height:24rem; overflow:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.875rem;">
          <thead>
            <tr>
              <th style="text-align:left; ${cell} color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Card</th>
              <th style="text-align:left; ${cell} color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Set</th>
              <th style="text-align:left; ${cell} color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Condition</th>
              <th style="text-align:left; ${cell} color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Language</th>
              <th style="text-align:left; ${cell} color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Qty</th>
              <th style="text-align:left; ${cell} color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">List price</th>
              <th style="text-align:left; ${cell} color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Offer</th>
              <th style="text-align:left; ${cell} color:rgb(var(--color-neutral-600)); font-size:0.8125rem;">Notes</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="form-group" style="margin-top:1rem; max-width:32rem;">
        <label class="form-label" for="buyback-email-subject">Subject</label>
        <input type="text" id="buyback-email-subject" class="form-input" maxlength="140" value="${esc(data.email_subject || 'Offer for your card list')}">
      </div>
      <div class="form-group">
        <label class="form-label" for="buyback-email-draft">Email draft</label>
        <textarea id="buyback-email-draft" class="form-textarea" rows="14">${esc(data.email_draft || '')}</textarea>
        <p class="admin-text-small">Edit the wording before you send. The line [card table] is replaced with the table above, with the same columns.</p>
      </div>`;
  }

  async function priceList() {
    if (busy) return;
    const btn = document.getElementById('buyback-price-list');
    busy = true;
    if (btn) btn.disabled = true;
    setNewStatus('Pricing the list...');
    try {
      const csv = await readCardFile();
      const data = await api('/admin/buyback/cases/import', {
        method: 'POST',
        body: {
          csv: csv,
          rate_percent: document.getElementById('buyback-rate').value.trim(),
          gbp_per_unit: document.getElementById('buyback-gbp-per').value.trim(),
          name: customerNameForDraft()
        }
      });
      pricedPreview = data;
      pricedStamp = listStamp();
      renderPricePreview(data);
      setNewStatus(data.currency && data.currency !== 'GBP'
        ? 'File prices are in ' + data.currency + ', converted at ' + data.gbp_per_unit + ' pounds per ' + data.currency + '.'
        : '');
    } catch (err) {
      pricedPreview = null;
      pricedStamp = '';
      const box = document.getElementById('buyback-price-preview');
      if (box) box.innerHTML = '';
      setNewStatus(err.message, true);
    } finally {
      busy = false;
      const again = document.getElementById('buyback-price-list');
      if (again) again.disabled = false;
    }
  }

  async function emailOffer() {
    if (busy) return;
    if (!pricedPreview || pricedStamp !== listStamp()) {
      setNewStatus('Price the list again before emailing. The file, rate, or customer has changed.', true);
      return;
    }
    const email = document.getElementById('buyback-new-email').value.trim();
    const name = document.getElementById('buyback-new-name').value.trim();
    const usingMember = customerMode === 'member';
    if (usingMember && !pickedCustomer) {
      setNewStatus('Search for a member, or switch to Email address.', true);
      return;
    }
    if (!usingMember && !email) {
      setNewStatus('Enter the email address, or switch to Member.', true);
      return;
    }
    const who = usingMember ? (pickedCustomer.name || pickedCustomer.email) : email;
    if (!window.confirm('Email this ' + pounds(pricedPreview.total_pence) + ' offer to ' + who + '?')) return;
    const btn = document.getElementById('buyback-email-offer');
    busy = true;
    if (btn) btn.disabled = true;
    setNewStatus('Sending the offer...');
    try {
      const csv = await readCardFile();
      const data = await api('/admin/buyback/cases/import', {
        method: 'POST',
        body: {
          send: true,
          user_id: usingMember ? pickedCustomer.user_id : undefined,
          email: usingMember ? undefined : email,
          name: usingMember ? undefined : name,
          csv: csv,
          rate_percent: pricedPreview.rate_percent,
          gbp_per_unit: pricedPreview.gbp_per_unit,
          subject: document.getElementById('buyback-email-subject').value,
          message: document.getElementById('buyback-email-draft').value
        }
      });
      const caseId = data.case_id;
      if (data.email_sent === false) {
        listFilter = 'open';
        await load();
        setNewStatus(data.message || ('The list was saved as case ' + caseId + ', but the email did not send.'), true);
        return;
      }
      listFilter = 'quoted';
      customerMode = 'member';
      pickedCustomer = null;
      await load();
      setNewStatus('Offer emailed for case ' + caseId + '. It is under Offer sent.');
    } catch (err) {
      setNewStatus(err.message, true);
      const again = document.getElementById('buyback-email-offer');
      if (again) again.disabled = false;
    } finally {
      busy = false;
    }
  }

  async function openCase(id) {
    currentId = Number(id);
    const el = root();
    el.innerHTML = '<p class="admin-text-muted">Loading list...</p>';
    try {
      const data = await api('/admin/buyback/cases/' + currentId);
      renderDetail(data);
    } catch (err) {
      el.innerHTML = '<p style="color:#b00020;">' + esc(err.message) + '</p>';
    }
  }

  function renderDetail(data) {
    const row = data.case;
    const items = data.items || [];
    const canOffer = row.status === 'submitted' || row.status === 'under_review' || row.status === 'quoted';
    const canCredit = row.status === 'quoted' || row.status === 'accepted';
    const canReject = row.status !== 'completed' && row.status !== 'rejected';
    const offerValue = row.agreed_value_pence != null ? (Number(row.agreed_value_pence) / 100).toFixed(2) : '';
    const offerNote = (row.status === 'quoted' || row.status === 'accepted') ? (row.staff_comments || '') : '';
    const cards = items.map((item, index) => {
      const printing = [item.set_name, item.set_code ? String(item.set_code).toUpperCase() : '', item.collector_number ? '#' + item.collector_number : ''].filter(Boolean).join(' ');
      const qty = item.quantity != null ? ' · Qty ' + Number(item.quantity) : '';
      const linePrice = item.line_quote_pence != null ? ' · ' + pounds(item.line_quote_pence) : '';
      return `<li style="padding:0.45rem 0; border-bottom:1px solid rgb(var(--color-neutral-200));">
        <strong>${index + 1}. ${esc(item.card_name)}</strong><br>
        <span style="color:rgb(var(--color-neutral-600)); font-size:0.875rem;">${esc(GAMES[item.game_system] || item.game_system)}${printing ? ', ' + esc(printing) : ''} · ${esc(item.condition)}, ${esc(item.language)}${qty}${linePrice}${item.notes ? ' · ' + esc(item.notes) : ''}</span>
      </li>`;
    }).join('') || '<li style="color:rgb(var(--color-neutral-600));">No cards on this list.</li>';

    root().innerHTML = `
      <p style="margin-top:0;"><button type="button" class="btn btn-secondary btn-sm" id="buyback-admin-back">Back to lists</button></p>
      <h3 style="margin-bottom:0.25rem;">Case ${row.id}</h3>
      <p class="admin-text-muted" style="margin-top:0;">${esc(STATUS_LABELS[row.status] || row.status)} · ${esc(when(row.created_at))}</p>
      <p style="margin-bottom:0.25rem;"><strong>${esc(row.user_name || '')}</strong> · ${esc(row.user_email || '')}</p>
      ${row.customer_notes ? `<p style="margin-top:0;"><span style="color:rgb(var(--color-neutral-600));">Customer notes:</span> ${esc(row.customer_notes)}</p>` : ''}
      ${(row.status === 'quoted' || row.status === 'accepted') && row.agreed_value_pence != null ? `<p>${row.status === 'accepted' ? 'The customer agreed on the website' : 'Offer emailed'}: <strong>${esc(pounds(row.agreed_value_pence))}</strong>${row.status === 'quoted' && row.quoted_at ? ' on ' + esc(when(row.quoted_at)) : ''}.</p>` : ''}
      ${offerNote ? `<p style="white-space:pre-wrap;"><span style="color:rgb(var(--color-neutral-600));">Note with the offer:</span> ${esc(offerNote)}</p>` : ''}
      ${row.status === 'completed' ? `<p>Store credit added: <strong>${esc(pounds(row.agreed_value_pence))}</strong>${row.resolved_at ? ' on ' + esc(when(row.resolved_at)) : ''}.</p>` : ''}
      ${row.status === 'rejected' && row.staff_comments ? `<p><span style="color:rgb(var(--color-neutral-600));">Message sent:</span> ${esc(row.staff_comments)}</p>` : ''}
      <p><button type="button" class="btn btn-secondary" id="buyback-admin-pdf">Download PDF</button></p>
      <ul style="list-style:none; padding:0; margin:0 0 1.25rem;">${cards}</ul>
      ${canOffer ? `
        <h3 style="font-size:1.05rem;">Send an offer</h3>
        <p class="admin-text-muted">The customer gets an email with this amount. Add a note if you want to explain the price.</p>
        <div class="form-group" style="max-width:16rem;">
          <label class="form-label" for="buyback-offer-amount">Offer amount (£)</label>
          <input type="text" id="buyback-offer-amount" class="form-input" inputmode="decimal" value="${esc(offerValue)}" placeholder="12.50">
        </div>
        <div class="form-group">
          <label class="form-label" for="buyback-offer-note">Note to the customer (optional)</label>
          <textarea id="buyback-offer-note" class="form-textarea" rows="3" maxlength="2000">${esc(offerNote)}</textarea>
        </div>
        <button type="button" class="btn btn-primary" id="buyback-send-offer">Send offer</button>
      ` : ''}
      ${canCredit ? `
        <h3 style="font-size:1.05rem; margin-top:1.5rem;">Deliver the trade-in</h3>
        <p class="admin-text-muted">The amount starts as the offer. Change it if you agreed a different price. Delivering adds that store credit and emails the customer. If they have no account yet, they also get a link to choose a password.</p>
        <div class="form-group" style="max-width:16rem;">
          <label class="form-label" for="buyback-credit-amount">Store credit (£)</label>
          <input type="text" id="buyback-credit-amount" class="form-input" inputmode="decimal" value="${esc(offerValue)}">
        </div>
        <button type="button" class="btn btn-primary" id="buyback-issue-credit">Deliver and add store credit</button>
      ` : ''}
      ${canReject ? `
        <h3 style="font-size:1.05rem; margin-top:1.5rem;">Reject this list</h3>
        <p class="admin-text-muted">This message is emailed to the customer.</p>
        <div class="form-group">
          <label class="form-label" for="buyback-reject-message">Message</label>
          <textarea id="buyback-reject-message" class="form-textarea" rows="4" maxlength="2000"></textarea>
        </div>
        <button type="button" class="btn btn-secondary" id="buyback-send-reject">Send rejection</button>
      ` : ''}
      <p id="buyback-admin-status" class="admin-text-small" style="margin-top:0.75rem;"></p>`;

    document.getElementById('buyback-admin-back').addEventListener('click', () => { setTimeout(load, 0); });
    document.getElementById('buyback-admin-pdf').addEventListener('click', () => { setTimeout(() => downloadPdf(row.id), 0); });
    const offerBtn = document.getElementById('buyback-send-offer');
    if (offerBtn) offerBtn.addEventListener('click', () => { setTimeout(() => sendOffer(row), 0); });
    const creditBtn = document.getElementById('buyback-issue-credit');
    if (creditBtn) creditBtn.addEventListener('click', () => { setTimeout(() => issueCredit(row), 0); });
    const rejectBtn = document.getElementById('buyback-send-reject');
    if (rejectBtn) rejectBtn.addEventListener('click', () => { setTimeout(() => sendReject(row), 0); });
  }

  async function downloadPdf(id) {
    setStatus('Preparing the PDF...');
    try {
      const res = await fetch(apiBase + '/admin/buyback/cases/' + id + '/pdf', {
        headers: { 'X-Session-Token': tokenFn() || '' }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(messageFor(data, 'The PDF could not be downloaded.'));
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'trade-in-' + id + '.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      setStatus('');
    } catch (err) {
      setStatus(err.message, true);
    }
  }

  async function sendOffer(row) {
    if (busy) return;
    const amount = document.getElementById('buyback-offer-amount').value.trim();
    const note = document.getElementById('buyback-offer-note').value.trim();
    if (!amount) {
      setStatus('Enter the offer amount.', true);
      return;
    }
    const btn = document.getElementById('buyback-send-offer');
    busy = true;
    if (btn) btn.disabled = true;
    setStatus('Sending the offer...');
    try {
      await api('/admin/buyback/cases/' + row.id + '/offer', { method: 'POST', body: { amount, note } });
      await openCase(row.id);
      setStatus('Offer emailed.');
    } catch (err) {
      setStatus(err.message, true);
      const again = document.getElementById('buyback-send-offer');
      if (again) again.disabled = false;
    } finally {
      busy = false;
    }
  }

  async function issueCredit(row) {
    if (busy) return;
    const amount = document.getElementById('buyback-credit-amount').value.trim();
    if (!amount) {
      setStatus('Enter the amount of store credit.', true);
      return;
    }
    if (!window.confirm('Deliver this trade-in and add £' + amount.replace(/^£/, '') + ' of store credit to ' + (row.user_name || 'this account') + '?')) return;
    busy = true;
    setStatus('Adding store credit...');
    try {
      const data = await api('/admin/buyback/cases/' + row.id + '/credit', { method: 'POST', body: { amount } });
      let message = data.already ? 'This credit was already on the account.' : 'Trade-in delivered and store credit added.';
      if (data.email_sent === false) message += ' The confirmation email did not send.';
      if (data.account_setup_sent === true) message += ' They were emailed a link to finish their account.';
      if (data.account_setup_sent === false) message += ' The account setup email did not send.';
      await openCase(row.id);
      setStatus(message);
    } catch (err) {
      setStatus(err.message, true);
    } finally {
      busy = false;
    }
  }

  async function sendReject(row) {
    if (busy) return;
    const message = document.getElementById('buyback-reject-message').value.trim();
    if (message.length < 10) {
      setStatus('Write a short message for the customer, at least 10 characters.', true);
      return;
    }
    if (!window.confirm('Email this rejection to ' + (row.user_email || 'the customer') + '?')) return;
    busy = true;
    setStatus('Sending the rejection...');
    try {
      await api('/admin/buyback/cases/' + row.id + '/reject', { method: 'POST', body: { message } });
      await openCase(row.id);
      setStatus('Rejection emailed.');
    } catch (err) {
      setStatus(err.message, true);
    } finally {
      busy = false;
    }
  }

  global.BuybackAdmin = {
    init(opts) {
      apiBase = (opts && opts.apiBase) || apiBase;
      tokenFn = (opts && opts.token) || tokenFn;
    },
    load
  };
})(window);
