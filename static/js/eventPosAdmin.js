/**
 * Admin door tickets: open events (and the past month), payment method, member or typed name.
 */
(function (global) {
  let eventsCache = [];
  let membersCache = [];

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatGbpPounds(pounds) {
    const n = Number(pounds) || 0;
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
  }

  function formatWhen(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso || '');
    return d.toLocaleString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function setStatus(message, isError) {
    const el = document.getElementById('event-pos-status');
    if (!el) return;
    el.textContent = message || '';
    el.style.color = isError ? 'rgb(185, 28, 28)' : 'rgb(var(--color-neutral-600))';
  }

  function selectedEvent() {
    const id = Number(document.getElementById('event-pos-event')?.value);
    return eventsCache.find(function (ev) { return Number(ev.event_id) === id; }) || null;
  }

  function isExistingMember() {
    return !!document.getElementById('event-pos-existing-member')?.checked;
  }

  function isSoldOut(ev) {
    if (!ev || ev.capacity == null || ev.capacity === '') return false;
    const cap = Number(ev.capacity);
    if (!Number.isFinite(cap)) return false;
    return Number(ev.tickets_sold) >= cap;
  }

  function ticketPrice(ev, member) {
    if (!ev) return 0;
    const raw = member ? ev.membership_price : ev.non_membership_price;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  function syncMemberFields() {
    const member = isExistingMember();
    const memberWrap = document.getElementById('event-pos-member-wrap');
    const nameWrap = document.getElementById('event-pos-name-wrap');
    if (memberWrap) memberWrap.style.display = member ? '' : 'none';
    if (nameWrap) nameWrap.style.display = member ? 'none' : '';
    updatePrice();
  }

  function updatePrice() {
    const el = document.getElementById('event-pos-price');
    const ev = selectedEvent();
    if (!el) return;
    if (!ev) {
      el.textContent = 'Choose an event to see the ticket price.';
      return;
    }
    const member = isExistingMember();
    const price = ticketPrice(ev, member);
    const rate = member ? 'member price' : 'standard price';
    const full = isSoldOut(ev) ? ' This event is full.' : '';
    el.textContent = 'Ticket price: ' + formatGbpPounds(price) + ' (' + rate + ').' + full;
  }

  function eventOption(ev) {
    const remaining = ev.capacity != null && ev.capacity !== ''
      ? ' (' + (Number(ev.tickets_sold) || 0) + ' / ' + ev.capacity + ')'
      : '';
    const full = isSoldOut(ev) ? ' — full' : '';
    return '<option value="' + ev.event_id + '"' + (full ? ' disabled' : '') + '>' +
      escapeHtml(formatWhen(ev.event_datetime) + ' — ' + (ev.event_name || 'Event') + remaining + full) +
      '</option>';
  }

  function renderEvents() {
    const select = document.getElementById('event-pos-event');
    if (!select) return;
    const previous = select.value;
    const now = Date.now();
    const open = [];
    const past = [];
    eventsCache.forEach(function (ev) {
      const when = Date.parse(ev.event_datetime);
      if (Number.isFinite(when) && when < now) past.push(ev);
      else open.push(ev);
    });
    past.sort(function (a, b) { return Date.parse(b.event_datetime) - Date.parse(a.event_datetime); });
    open.sort(function (a, b) { return Date.parse(a.event_datetime) - Date.parse(b.event_datetime); });

    if (!open.length && !past.length) {
      select.innerHTML = '<option value="">No open events in the past month</option>';
      updatePrice();
      return;
    }

    let html = '<option value="">Select event…</option>';
    if (open.length) {
      html += '<optgroup label="Open">' + open.map(eventOption).join('') + '</optgroup>';
    }
    if (past.length) {
      html += '<optgroup label="Past month">' + past.map(eventOption).join('') + '</optgroup>';
    }
    select.innerHTML = html;
    if (previous && select.querySelector('option[value="' + previous + '"]:not([disabled])')) {
      select.value = previous;
    }
    updatePrice();
  }

  function renderMembers() {
    const select = document.getElementById('event-pos-member');
    if (!select) return;
    const previous = select.value;
    if (!membersCache.length) {
      select.innerHTML = '<option value="">No active members</option>';
      return;
    }
    const opts = ['<option value="">Select member…</option>'];
    membersCache.forEach(function (m) {
      const label = (m.name || m.email || 'Member') + (m.email && m.name ? ' — ' + m.email : '');
      opts.push('<option value="' + m.user_id + '">' + escapeHtml(label) + '</option>');
    });
    select.innerHTML = opts.join('');
    if (previous && select.querySelector('option[value="' + previous + '"]')) select.value = previous;
  }

  async function loadOptions(apiBase, sessionToken) {
    const res = await fetch(apiBase + '/admin/shop/event-sale-options', {
      headers: { 'X-Session-Token': sessionToken }
    });
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.message || data.error || 'Could not load events');
    eventsCache = data.events || [];
    membersCache = data.members || [];
    renderEvents();
    renderMembers();
  }

  async function submitSale(apiBase, sessionToken) {
    const ev = selectedEvent();
    const paymentMethod = document.getElementById('event-pos-payment')?.value;
    const member = isExistingMember();
    if (!ev) {
      setStatus('Choose an event.', true);
      return;
    }
    if (isSoldOut(ev)) {
      setStatus('This event is full.', true);
      return;
    }
    if (paymentMethod !== 'cash' && paymentMethod !== 'bank_transfer' && paymentMethod !== 'sumup') {
      setStatus('Choose how they paid.', true);
      return;
    }

    const payload = {
      event_id: ev.event_id,
      payment_method: paymentMethod,
      existing_member: member
    };
    if (member) {
      const userId = parseInt(document.getElementById('event-pos-member')?.value, 10);
      if (!userId) {
        setStatus('Choose a member.', true);
        return;
      }
      payload.user_id = userId;
    } else {
      const name = document.getElementById('event-pos-name')?.value?.trim() || '';
      if (!name) {
        setStatus('Enter their name.', true);
        return;
      }
      payload.name = name;
    }

    const btn = document.getElementById('event-pos-submit');
    if (btn) btn.disabled = true;
    setStatus('Recording ticket…');
    try {
      const res = await fetch(apiBase + '/admin/shop/event-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        setStatus(data.message || data.error || 'Ticket was not recorded.', true);
        return;
      }
      const who = data.name || 'Attendee';
      const price = formatGbpPounds(data.amount);
      setStatus('Ticket recorded for ' + who + ' — ' + (data.event_name || 'event') + ' (' + price + ').');
      const nameEl = document.getElementById('event-pos-name');
      const memberEl = document.getElementById('event-pos-member');
      if (nameEl) nameEl.value = '';
      if (memberEl) memberEl.value = '';
      await loadOptions(apiBase, sessionToken);
    } catch (err) {
      setStatus(String(err.message || err), true);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function init(apiBase, sessionToken) {
    const memberToggle = document.getElementById('event-pos-existing-member');
    const eventSelect = document.getElementById('event-pos-event');
    const submit = document.getElementById('event-pos-submit');
    if (memberToggle && !memberToggle._eventPosBound) {
      memberToggle._eventPosBound = true;
      memberToggle.addEventListener('change', syncMemberFields);
    }
    if (eventSelect && !eventSelect._eventPosBound) {
      eventSelect._eventPosBound = true;
      eventSelect.addEventListener('change', updatePrice);
    }
    if (submit && !submit._eventPosBound) {
      submit._eventPosBound = true;
      submit.addEventListener('click', function () { submitSale(apiBase, sessionToken); });
    }
    syncMemberFields();
    setStatus('Loading events…');
    try {
      await loadOptions(apiBase, sessionToken);
      setStatus('');
    } catch (err) {
      setStatus(String(err.message || err), true);
    }
  }

  global.EventPosAdmin = {
    init: init,
    loadOptions: loadOptions
  };
})(typeof window !== 'undefined' ? window : globalThis);
