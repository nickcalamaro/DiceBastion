---
title: "Sell Us Your Cards"
description: "Sell Magic: The Gathering and Riftbound singles to Dice Bastion in Gibraltar for store credit — no international shipping."
---

<style>
.sell-hero {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 2rem;
  min-height: 280px;
  background: rgb(var(--color-neutral-900));
}
.sell-hero__img {
  width: 100%;
  height: 100%;
  min-height: 280px;
  max-height: 420px;
  object-fit: cover;
  display: block;
  filter: brightness(0.72);
}
.sell-hero__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1.75rem 1.5rem 2rem;
  background: linear-gradient(180deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.55) 45%, rgba(15,23,42,0.88) 100%);
  color: #fff;
}
.sell-hero__title {
  margin: 0 0 0.5rem;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.sell-hero__lead {
  margin: 0;
  max-width: 36rem;
  font-size: clamp(1rem, 2.2vw, 1.125rem);
  line-height: 1.5;
  color: rgba(255,255,255,0.92);
}
.sell-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 2rem;
}
@media (max-width: 720px) {
  .sell-grid { grid-template-columns: 1fr; }
}
.sell-panel {
  padding: 1.25rem 1.35rem;
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 10px;
  background: #fff;
}
.sell-panel h2 {
  margin: 0 0 0.75rem;
  font-size: 1.125rem;
  color: rgb(var(--color-neutral-900));
}
.sell-panel ol, .sell-panel ul {
  margin: 0;
  padding-left: 1.15rem;
  color: rgb(var(--color-neutral-700));
  line-height: 1.7;
}
.sell-panel li { margin-bottom: 0.4rem; }
.sell-form-shell {
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 12px;
  background: rgb(var(--color-neutral-50));
  padding: 1.5rem;
  margin-bottom: 2rem;
}
.sell-form-shell h2 {
  margin: 0 0 0.35rem;
  font-size: 1.35rem;
}
.sell-search-wrap { position: relative; }
#buyback-search-results {
  display: none;
  position: absolute;
  z-index: 30;
  left: 0; right: 0; top: 100%;
  max-height: 280px;
  overflow: auto;
  background: #fff;
  border: 1px solid rgb(var(--color-neutral-300));
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(15,23,42,0.12);
}
</style>

<div class="page-container" style="max-width: 880px; margin: 0 auto;">

  <div class="sell-hero">
    <img class="sell-hero__img" src="/img/sell-cards-hero.png" width="1600" height="900" alt="Trading card singles arranged on a table" decoding="async" fetchpriority="high">
    <div class="sell-hero__overlay">
      <h1 class="sell-hero__title">Sell us your singles</h1>
      <p class="sell-hero__lead">Trade Magic: The Gathering and Riftbound cards for store credit in Gibraltar — no international shipping, no fuss.</p>
    </div>
  </div>

  <div class="sell-grid">
    <section class="sell-panel">
      <h2>How it works</h2>
      <ol>
        <li>Sign in to your Dice Bastion account.</li>
        <li>Accept the Buyback Terms below.</li>
        <li>Search and list the cards you want to sell.</li>
        <li>We review your list and send a market-rate quote as soon as we can.</li>
        <li>Once accepted and completed, store credit lands on your account.</li>
      </ol>
    </section>
    <section class="sell-panel">
      <h2>What you get</h2>
      <ul>
        <li>Local buyback — keep cards in Gibraltar.</li>
        <li>Quotes after we review condition and authenticity.</li>
        <li>Credit for the online shop and paid event entry.</li>
        <li>Not for memberships or donations; not cash.</li>
      </ul>
      <p style="margin: 0.75rem 0 0; font-size: 0.875rem; color: rgb(var(--color-neutral-600));">
        Prices are never shown on this form. You will receive a quote from us after you submit.
      </p>
    </section>
  </div>

  <div id="buyback-login-gate" class="sell-form-shell" style="display: none; text-align: center;">
    <h2>Sign in to submit a list</h2>
    <p style="color: rgb(var(--color-neutral-600)); margin: 0 0 1.25rem;">Buyback and store credit are only available to registered users.</p>
    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center;">
      <button type="button" id="buyback-open-login" class="btn btn-primary">Sign in</button>
      <a class="btn btn-secondary" id="buyback-main-login" href="https://dicebastion.com/login">Sign in on main site</a>
    </div>
  </div>

  <div id="buyback-form-wrap" class="sell-form-shell" style="display: none;">
    <h2 id="submit">Submit cards for a quote</h2>
    <p style="margin: 0 0 1.25rem; color: rgb(var(--color-neutral-600));">Add cards with condition and language. We will get back to you with a quote.</p>

    <form id="buyback-form" novalidate>
      <div class="form-group" style="margin-bottom: 1.25rem; padding: 1rem; background: #fff; border: 1px solid rgb(var(--color-neutral-200)); border-radius: 8px;">
        <label class="checkbox-label" style="display: flex; gap: 0.65rem; align-items: flex-start; margin: 0;">
          <input type="checkbox" id="buyback-tos" required style="margin-top: 0.2rem;">
          <span>
            I have read and accept the
            <a href="/buyback-terms/" target="_blank" rel="noopener">Buyback Terms of Service</a>
            (including store credit rules and that I am selling cards to Dice Bastion) *
          </span>
        </label>
      </div>

      <div class="form-group" style="margin-bottom: 1rem;">
        <label class="form-label" for="buyback-game">Game system</label>
        <select id="buyback-game" class="form-input" required>
          <option value="mtg">Magic: The Gathering</option>
          <option value="riftbound">Riftbound</option>
        </select>
        <p id="buyback-game-hint" style="margin: 0.35rem 0 0; font-size: 0.8125rem; color: rgb(var(--color-neutral-600));"></p>
      </div>

      <div class="form-group sell-search-wrap" style="margin-bottom: 1rem;">
        <label class="form-label" for="buyback-search">Find a card</label>
        <input type="text" id="buyback-search" class="form-input" autocomplete="off" placeholder="Start typing a card name…" disabled>
        <div id="buyback-search-results"></div>
      </div>

      <div id="buyback-selected-editor" style="display: none; margin-bottom: 1.25rem; padding: 1rem; border: 1px solid rgb(var(--color-neutral-200)); border-radius: 8px; background: #fff;">
        <div style="display: flex; gap: 1rem; align-items: flex-start;">
          <img id="buyback-sel-img" alt="" width="72" height="100" style="object-fit: contain; border-radius: 4px; background: #fff; display: none;">
          <div style="flex: 1;">
            <div id="buyback-sel-name" style="font-weight: 700;"></div>
            <div id="buyback-sel-set" style="font-size: 0.8125rem; color: rgb(var(--color-neutral-600)); margin-bottom: 0.75rem;"></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="form-group">
                <label class="form-label" for="buyback-condition">Condition</label>
                <select id="buyback-condition" class="form-input"></select>
              </div>
              <div class="form-group">
                <label class="form-label" for="buyback-language">Language</label>
                <select id="buyback-language" class="form-input"></select>
              </div>
            </div>
            <div class="form-group" style="margin-top: 0.75rem;">
              <label class="form-label" for="buyback-item-notes">Notes (optional)</label>
              <input type="text" id="buyback-item-notes" class="form-input" maxlength="500" placeholder="Foil, signed, etc.">
            </div>
            <button type="button" id="buyback-add-item" class="btn btn-primary" style="margin-top: 0.75rem;">Add to list</button>
          </div>
        </div>
      </div>

      <h3 style="font-size: 1.05rem; margin: 1.25rem 0 0.5rem;">Your list</h3>
      <div id="buyback-list-empty" style="color: rgb(var(--color-neutral-600)); font-size: 0.9375rem;">No cards added yet.</div>
      <ul id="buyback-list" style="list-style: none; padding: 0; margin: 0 0 1.25rem;"></ul>

      <div class="form-group" style="margin-bottom: 1.25rem;">
        <label class="form-label" for="buyback-customer-notes">Message to staff (optional)</label>
        <textarea id="buyback-customer-notes" class="form-textarea" rows="3" maxlength="2000" placeholder="Anything we should know about this lot…"></textarea>
      </div>

      <button type="submit" id="buyback-submit-btn" class="btn btn-primary" disabled>Submit list for quote</button>
      <p id="buyback-form-message" style="margin-top: 1rem; min-height: 1.25em; font-size: 0.875rem;"></p>
    </form>
  </div>

  <p style="font-size: 0.875rem; color: rgb(var(--color-neutral-600));">
    Full legal text: <a href="/buyback-terms/">Buyback Terms of Service</a>.
  </p>
</div>

<script src="https://dicebastion.com/js/auth-modal.js"></script>
<script>
(function () {
  const API_BASE = (window.utils && window.utils.getApiBase(true)) || 'https://dicebastion.com/api';
  const loginGate = document.getElementById('buyback-login-gate');
  const formWrap = document.getElementById('buyback-form-wrap');
  const msgEl = document.getElementById('buyback-form-message');
  const listEl = document.getElementById('buyback-list');
  const listEmpty = document.getElementById('buyback-list-empty');
  const submitBtn = document.getElementById('buyback-submit-btn');
  const tos = document.getElementById('buyback-tos');
  const searchInput = document.getElementById('buyback-search');
  const resultsEl = document.getElementById('buyback-search-results');
  const gameSelect = document.getElementById('buyback-game');
  const gameHint = document.getElementById('buyback-game-hint');

  let token = null;
  let meta = null;
  let items = [];
  let selectedCard = null;
  let searchTimer = null;
  let riftboundReady = false;

  function headers() {
    return { 'Content-Type': 'application/json', 'X-Session-Token': token };
  }

  function fillSelect(sel, options, defaultCode) {
    sel.innerHTML = options.map(o =>
      `<option value="${o.code}"${o.code === defaultCode ? ' selected' : ''}>${o.label}</option>`
    ).join('');
  }

  function updateSubmitEnabled() {
    submitBtn.disabled = !(tos.checked && items.length > 0);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function renderList() {
    listEmpty.style.display = items.length ? 'none' : 'block';
    listEl.innerHTML = items.map((it, idx) => `
      <li style="display:flex; gap:0.75rem; align-items:center; padding:0.75rem 0; border-bottom:1px solid rgb(var(--color-neutral-200));">
        ${it.image_url ? `<img src="${escapeHtml(it.image_url)}" alt="" width="48" height="68" style="object-fit:contain;border-radius:3px;">` : ''}
        <div style="flex:1;">
          <div style="font-weight:600;">${escapeHtml(it.card_name)}</div>
          <div style="font-size:0.8125rem;color:rgb(var(--color-neutral-600));">
            ${escapeHtml(it.game_system.toUpperCase())}
            ${it.set_code ? ' · ' + escapeHtml(it.set_code) : ''}
            · ${escapeHtml(it.condition)} / ${escapeHtml(it.language)}
            ${it.notes ? ' · ' + escapeHtml(it.notes) : ''}
          </div>
        </div>
        <button type="button" data-idx="${idx}" class="buyback-remove btn btn-secondary" style="padding:0.35rem 0.65rem;font-size:0.8125rem;">Remove</button>
      </li>
    `).join('');
    listEl.querySelectorAll('.buyback-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        items.splice(Number(btn.dataset.idx), 1);
        renderList();
        updateSubmitEnabled();
      });
    });
  }

  function updateGameAvailability() {
    const game = gameSelect.value;
    const ready = game === 'mtg' ? true : riftboundReady;
    searchInput.disabled = !ready;
    if (!ready) {
      gameHint.textContent = 'Riftbound card search is not configured yet. Choose Magic: The Gathering for now.';
      searchInput.placeholder = 'Search unavailable for this game';
    } else {
      gameHint.textContent = '';
      searchInput.placeholder = 'Start typing a card name…';
    }
  }

  function showSelected(card) {
    selectedCard = card;
    const editor = document.getElementById('buyback-selected-editor');
    editor.style.display = 'block';
    document.getElementById('buyback-sel-name').textContent = card.name;
    document.getElementById('buyback-sel-set').textContent = [card.set_name, card.set_code, card.collector_number].filter(Boolean).join(' · ');
    const img = document.getElementById('buyback-sel-img');
    if (card.image_url) {
      img.src = card.image_url;
      img.style.display = 'block';
    } else {
      img.style.display = 'none';
    }
    document.getElementById('buyback-item-notes').value = '';
    resultsEl.style.display = 'none';
    searchInput.value = '';
  }

  async function loadMeta() {
    const res = await fetch(`${API_BASE}/buyback/meta`, { headers: headers(), credentials: 'include' });
    if (res.status === 401) {
      showLoggedOut();
      return;
    }
    if (!res.ok) throw new Error('Failed to load buyback options');
    meta = await res.json();
    fillSelect(document.getElementById('buyback-condition'), meta.conditions, 'EX');
    fillSelect(document.getElementById('buyback-language'), meta.languages, 'EN');
    const rb = (meta.games || []).find(g => g.code === 'riftbound');
    riftboundReady = !!(rb && rb.searchReady);
    updateGameAvailability();
  }

  async function runSearch(q) {
    resultsEl.innerHTML = '<div style="padding:0.75rem;font-size:0.875rem;color:rgb(var(--color-neutral-600));">Searching…</div>';
    resultsEl.style.display = 'block';
    try {
      const res = await fetch(`${API_BASE}/buyback/cards/search?game=${encodeURIComponent(gameSelect.value)}&q=${encodeURIComponent(q)}`, {
        headers: headers(),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        resultsEl.innerHTML = `<div style="padding:0.75rem;font-size:0.875rem;color:#b00020;">${escapeHtml(data.message || data.error || 'Search failed')}</div>`;
        return;
      }
      const rows = data.results || [];
      if (!rows.length) {
        resultsEl.innerHTML = '<div style="padding:0.75rem;font-size:0.875rem;color:rgb(var(--color-neutral-600));">No cards found.</div>';
        return;
      }
      resultsEl.innerHTML = rows.map((c, i) => `
        <button type="button" data-i="${i}" style="display:flex;gap:0.65rem;align-items:center;width:100%;text-align:left;padding:0.55rem 0.75rem;border:0;border-bottom:1px solid rgb(var(--color-neutral-100));background:#fff;cursor:pointer;">
          ${c.image_url ? `<img src="${escapeHtml(c.image_url)}" alt="" width="36" height="50" style="object-fit:contain;">` : ''}
          <span><strong>${escapeHtml(c.name)}</strong><br><span style="font-size:0.75rem;color:rgb(var(--color-neutral-600));">${escapeHtml([c.set_name, c.set_code, c.collector_number].filter(Boolean).join(' · '))}</span></span>
        </button>
      `).join('');
      resultsEl.querySelectorAll('button[data-i]').forEach(btn => {
        btn.addEventListener('click', () => showSelected(rows[Number(btn.dataset.i)]));
      });
    } catch (e) {
      resultsEl.innerHTML = '<div style="padding:0.75rem;font-size:0.875rem;color:#b00020;">Search failed.</div>';
    }
  }

  function showLoggedOut() {
    formWrap.style.display = 'none';
    loginGate.style.display = 'block';
  }

  function showLoggedIn() {
    loginGate.style.display = 'none';
    formWrap.style.display = 'block';
    loadMeta().catch(err => {
      msgEl.style.color = '#b00020';
      msgEl.textContent = err.message || 'Could not load form';
    });
  }

  async function ensureSession() {
    if (window.utils && utils.session && utils.session.syncFromSharedCookie) {
      await utils.session.syncFromSharedCookie(API_BASE);
    }
    token = (window.utils && utils.session) ? utils.session.get() : localStorage.getItem('admin_session');
    if (token) showLoggedIn();
    else showLoggedOut();
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = searchInput.value.trim();
    if (q.length < 2) {
      resultsEl.style.display = 'none';
      return;
    }
    searchTimer = setTimeout(() => runSearch(q), 280);
  });

  gameSelect.addEventListener('change', () => {
    selectedCard = null;
    document.getElementById('buyback-selected-editor').style.display = 'none';
    resultsEl.style.display = 'none';
    updateGameAvailability();
  });

  document.getElementById('buyback-add-item').addEventListener('click', () => {
    if (!selectedCard) return;
    items.push({
      game_system: gameSelect.value,
      external_id: selectedCard.id,
      card_name: selectedCard.name,
      set_code: selectedCard.set_code,
      set_name: selectedCard.set_name,
      collector_number: selectedCard.collector_number,
      image_url: selectedCard.image_url,
      condition: document.getElementById('buyback-condition').value,
      language: document.getElementById('buyback-language').value,
      notes: document.getElementById('buyback-item-notes').value.trim() || null
    });
    selectedCard = null;
    document.getElementById('buyback-selected-editor').style.display = 'none';
    renderList();
    updateSubmitEnabled();
  });

  tos.addEventListener('change', updateSubmitEnabled);

  document.getElementById('buyback-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!tos.checked || !items.length) return;
    submitBtn.disabled = true;
    msgEl.style.color = 'rgb(var(--color-neutral-600))';
    msgEl.textContent = 'Submitting…';
    try {
      const res = await fetch(`${API_BASE}/buyback/cases`, {
        method: 'POST',
        headers: headers(),
        credentials: 'include',
        body: JSON.stringify({
          tos_accepted: true,
          customer_notes: document.getElementById('buyback-customer-notes').value.trim() || null,
          items
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Submit failed');
      items = [];
      renderList();
      tos.checked = false;
      updateSubmitEnabled();
      msgEl.style.color = 'rgb(22, 163, 74)';
      msgEl.textContent = data.message || ('Submitted case #' + data.case_id + '. We will get back to you with a quote soon.');
    } catch (err) {
      msgEl.style.color = '#b00020';
      msgEl.textContent = err.message || 'Submit failed';
      updateSubmitEnabled();
    }
  });

  document.getElementById('buyback-main-login').href =
    'https://dicebastion.com/login?return=' + encodeURIComponent(window.location.href);

  document.getElementById('buyback-open-login')?.addEventListener('click', () => {
    if (typeof AuthModal === 'function') {
      const modal = new AuthModal({
        mainApiUrl: API_BASE,
        onSuccess: () => {
          token = utils.session.get();
          showLoggedIn();
          window.dispatchEvent(new Event('userLoggedIn'));
        }
      });
      modal.show();
    } else {
      window.location.href = 'https://dicebastion.com/login?return=' + encodeURIComponent(window.location.href);
    }
  });

  document.addEventListener('click', (e) => {
    if (!resultsEl.contains(e.target) && e.target !== searchInput) {
      resultsEl.style.display = 'none';
    }
  });

  ensureSession();
})();
</script>
