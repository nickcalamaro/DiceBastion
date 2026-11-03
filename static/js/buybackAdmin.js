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
    unauthorized: 'Sign in again to use trade-ins.'
  };

  let apiBase = '';
  let tokenFn = () => '';
  let currentId = null;
  let busy = false;
  let listFilter = 'open';

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

    el.innerHTML = `
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
      return `<li style="padding:0.45rem 0; border-bottom:1px solid rgb(var(--color-neutral-200));">
        <strong>${index + 1}. ${esc(item.card_name)}</strong><br>
        <span style="color:rgb(var(--color-neutral-600)); font-size:0.875rem;">${esc(GAMES[item.game_system] || item.game_system)}${printing ? ', ' + esc(printing) : ''} · ${esc(item.condition)}, ${esc(item.language)}${item.notes ? ' · ' + esc(item.notes) : ''}</span>
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
        <h3 style="font-size:1.05rem; margin-top:1.5rem;">${row.status === 'accepted' ? 'Customer agreed' : 'Add store credit'}</h3>
        <p class="admin-text-muted">${row.status === 'accepted'
          ? 'They agreed on the website. Add the credit once you have the cards. Change the amount if you agreed a different price by email. The customer is emailed when the credit is on their account.'
          : 'Use this once the customer has agreed and you have the cards. Change the amount if you agreed a different price by email. The customer is emailed when the credit is on their account.'}</p>
        <div class="form-group" style="max-width:16rem;">
          <label class="form-label" for="buyback-credit-amount">Store credit (£)</label>
          <input type="text" id="buyback-credit-amount" class="form-input" inputmode="decimal" value="${esc(offerValue)}">
        </div>
        <button type="button" class="btn btn-primary" id="buyback-issue-credit">Issue store credit</button>
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
    if (!window.confirm('Add £' + amount.replace(/^£/, '') + ' of store credit to ' + (row.user_name || 'this account') + '?')) return;
    busy = true;
    setStatus('Adding store credit...');
    try {
      const data = await api('/admin/buyback/cases/' + row.id + '/credit', { method: 'POST', body: { amount } });
      const extra = data.email_sent === false ? ' The confirmation email did not send.' : '';
      await openCase(row.id);
      setStatus((data.already ? 'This credit was already on the account.' : 'Store credit added.') + extra);
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
