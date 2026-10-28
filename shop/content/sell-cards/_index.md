---
title: "Trade in your singles"
description: "Sell Magic: The Gathering and Riftbound singles to Dice Bastion in Gibraltar in exchange for store credit to spend in our online shop or on event entry."
---

<style>
.sell-hero {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 1.25rem;
  min-height: 220px;
  background: rgb(var(--color-neutral-900));
}
.sell-hero__img {
  width: 100%;
  height: 100%;
  min-height: 220px;
  max-height: 320px;
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
  padding: 1.5rem 1.5rem 1.75rem;
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
  max-width: 38rem;
  font-size: clamp(1rem, 2.2vw, 1.125rem);
  line-height: 1.5;
  color: rgba(255,255,255,0.92);
}
.sell-credit-rule {
  margin: 0 0 1.75rem;
  padding: 0.85rem 1rem;
  border-left: 3px solid rgb(var(--color-primary-500));
  background: rgba(var(--color-primary-50), 0.5);
  border-radius: 0 8px 8px 0;
  color: rgb(var(--color-neutral-700));
  font-size: 0.9375rem;
  line-height: 1.55;
}
.sell-shell {
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 12px;
  background: rgb(var(--color-neutral-50));
  padding: 1.5rem;
  margin-bottom: 2rem;
}
.sell-shell h2 {
  margin: 0 0 0.35rem;
  font-size: 1.3rem;
  color: rgb(var(--color-neutral-900));
}
.sell-help {
  margin: 0 0 1.25rem;
  color: rgb(var(--color-neutral-600));
  font-size: 0.9375rem;
}
.sell-progress {
  display: flex;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
}
.sell-progress li {
  flex: 1;
  padding-top: 0.6rem;
  border-top: 4px solid rgb(var(--color-neutral-200));
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(var(--color-neutral-500));
}
.sell-progress li.is-done { border-top-color: rgb(var(--color-primary-300)); color: rgb(var(--color-neutral-700)); }
.sell-progress li.is-current { border-top-color: rgb(var(--color-primary-600)); color: rgb(var(--color-primary-700)); }
.sell-step { display: none; }
.sell-step.is-active { display: block; }
.sell-games {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
@media (max-width: 640px) {
  .sell-games { grid-template-columns: 1fr; }
}
.sell-game {
  text-align: left;
  padding: 1.25rem;
  border: 2px solid rgb(var(--color-neutral-200));
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  font: inherit;
  color: rgb(var(--color-neutral-900));
}
.sell-game:hover:not(:disabled) { border-color: rgb(var(--color-primary-400)); }
.sell-game.is-selected { border-color: rgb(var(--color-primary-600)); }
.sell-game:disabled { cursor: not-allowed; opacity: 0.6; }
.sell-game__name { display: block; font-weight: 700; font-size: 1.05rem; }
.sell-game__note { display: block; margin-top: 0.3rem; font-size: 0.8125rem; color: rgb(var(--color-neutral-600)); }
.sell-game__note:empty { display: none; }
.sell-search-wrap { position: relative; }
#buyback-search-results {
  display: none;
  position: absolute;
  z-index: 30;
  left: 0; right: 0; top: 100%;
  max-height: 300px;
  overflow: auto;
  background: #fff;
  border: 1px solid rgb(var(--color-neutral-300));
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(15,23,42,0.12);
}
.sell-box {
  padding: 1rem;
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 8px;
  background: #fff;
}
.sell-list { list-style: none; padding: 0; margin: 0; }
.sell-list li {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.7rem 0;
  border-bottom: 1px solid rgb(var(--color-neutral-200));
}
.sell-list li:last-child { border-bottom: 0; }
.sell-list__info { flex: 1; min-width: 0; }
.sell-list__name { font-weight: 600; }
.sell-list__meta { font-size: 0.8125rem; color: rgb(var(--color-neutral-600)); }
.sell-list__actions { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end; }
.sell-small-btn { padding: 0.35rem 0.65rem; font-size: 0.8125rem; }
.sell-nav {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}
.sell-message { margin: 1rem 0 0; min-height: 1.25em; font-size: 0.875rem; }
.sell-message.is-error { color: #b00020; }
.sell-cases-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.sell-cases-table th, .sell-cases-table td {
  text-align: left;
  padding: 0.55rem 0.5rem;
  border-bottom: 1px solid rgb(var(--color-neutral-200));
}
.sell-cases-table th { font-size: 0.8125rem; color: rgb(var(--color-neutral-600)); font-weight: 600; }
</style>

<div class="page-container" style="max-width: 880px; margin: 0 auto;">
  <div class="sell-hero">
    <img class="sell-hero__img" src="/img/sell-cards-hero.jpg" width="1600" height="900" alt="A fan of Magic: The Gathering cards on a table" decoding="async" fetchpriority="high">
    <div class="sell-hero__overlay">
      <h1 class="sell-hero__title">Trade in your singles</h1>
      <p class="sell-hero__lead">We buy Magic: The Gathering and Riftbound singles in exchange for store credit, which you can spend in our online shop or on event entry.</p>
    </div>
  </div>
  <p class="sell-credit-rule">Store credit can be spent in the online shop and on paid event entry. It can't be used for memberships or donations, and it can't be exchanged for cash.</p>
  <div id="submit">
    <div id="buyback-login-gate" class="sell-shell" style="display: none; text-align: center;">
      <h2 data-copy="signInTitle"></h2>
      <p class="sell-help" data-copy="signInHelp"></p>
      <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center;">
        <button type="button" id="buyback-open-login" class="btn btn-primary">Sign in</button>
        <a class="btn btn-secondary" id="buyback-main-login" href="https://dicebastion.com/login">Sign in on the main site</a>
      </div>
    </div>
    <div id="buyback-flow" class="sell-shell" style="display: none;">
      <ol class="sell-progress" id="sell-progress">
        <li data-step="1">1 Choose a game</li>
        <li data-step="2">2 Add your cards</li>
        <li data-step="3">3 Check and send</li>
      </ol>
      <section class="sell-step" data-step="1">
        <h2>Choose a game</h2>
        <p class="sell-help" data-copy="stepGameHelp"></p>
        <div class="sell-games">
          <button type="button" class="sell-game" data-game="mtg">
            <span class="sell-game__name">Magic: The Gathering</span>
          </button>
          <button type="button" class="sell-game" data-game="riftbound">
            <span class="sell-game__name">Riftbound</span>
            <span class="sell-game__note" id="riftbound-note"></span>
          </button>
        </div>
      </section>
      <section class="sell-step" data-step="2">
        <h2>Add your cards</h2>
        <p class="sell-help" data-copy="stepCardsHelp"></p>
        <div class="form-group sell-search-wrap" style="margin-bottom: 1rem;">
          <label class="form-label" for="buyback-search" id="buyback-search-label">Find a card</label>
          <input type="text" id="buyback-search" class="form-input" autocomplete="off">
          <div id="buyback-search-results"></div>
        </div>
        <div id="buyback-selected-editor" class="sell-box" style="display: none; margin-bottom: 1.25rem;">
          <div style="display: flex; gap: 1rem; align-items: flex-start;">
            <img id="buyback-sel-img" alt="" width="72" height="100" style="object-fit: contain; border-radius: 4px; display: none;">
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
              <p style="margin: 0.5rem 0 0; font-size: 0.8125rem; color: rgb(var(--color-neutral-600));">
                <span data-copy="conditionHelp"></span>
                <a href="/buyback-terms/#condition">Buyback Terms</a>.
              </p>
              <div class="form-group" style="margin-top: 0.75rem;">
                <label class="form-label" for="buyback-item-notes">Notes (optional)</label>
                <input type="text" id="buyback-item-notes" class="form-input" maxlength="500" placeholder="For example foil, signed or misprint">
              </div>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap;">
                <button type="button" id="buyback-add-item" class="btn btn-primary">Add to list</button>
                <button type="button" id="buyback-cancel-item" class="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
        <h3 style="font-size: 1.05rem; margin: 1.25rem 0 0.5rem;">Your list <span id="buyback-count" style="font-weight: 400; color: rgb(var(--color-neutral-600));"></span></h3>
        <div class="sell-box">
          <p id="buyback-list-empty" style="margin: 0; color: rgb(var(--color-neutral-600)); font-size: 0.9375rem;" data-copy="listEmpty"></p>
          <ul id="buyback-list" class="sell-list"></ul>
        </div>
        <div class="sell-nav">
          <button type="button" class="btn btn-secondary" data-go="1">Change game</button>
          <button type="button" class="btn btn-primary" id="buyback-to-review" data-go="3" disabled>Review list</button>
        </div>
      </section>
      <section class="sell-step" data-step="3">
        <h2>Check and send</h2>
        <p class="sell-help" data-copy="stepReviewHelp"></p>
        <div class="sell-box" style="margin-bottom: 1.25rem;">
          <ul id="buyback-review-list" class="sell-list"></ul>
        </div>
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label" for="buyback-customer-notes">Message to us (optional)</label>
          <textarea id="buyback-customer-notes" class="form-textarea" rows="3" maxlength="2000" placeholder="Anything we should know about these cards"></textarea>
        </div>
        <label class="checkbox-label sell-box" style="display: flex; gap: 0.65rem; align-items: flex-start; margin: 0;">
          <input type="checkbox" id="buyback-tos" style="margin-top: 0.2rem;">
          <span>I have read and accept the <a href="/buyback-terms/" target="_blank" rel="noopener">Buyback Terms</a>.</span>
        </label>
        <p id="buyback-form-message" class="sell-message"></p>
        <div class="sell-nav">
          <button type="button" class="btn btn-secondary" data-go="2">Back to your list</button>
          <button type="button" class="btn btn-primary" id="buyback-submit-btn" disabled>Send list</button>
        </div>
      </section>
      <section class="sell-step" data-step="done">
        <h2>List sent</h2>
        <p style="margin: 0 0 0.75rem; color: rgb(var(--color-neutral-700)); line-height: 1.6;" data-copy="sentMessage"></p>
        <p id="buyback-case-ref" style="margin: 0 0 1.25rem; color: rgb(var(--color-neutral-600)); font-size: 0.9375rem;"></p>
        <button type="button" class="btn btn-primary" id="buyback-start-again">Start another list</button>
      </section>
    </div>
    <section id="buyback-history" class="sell-shell" style="display: none;">
      <h2>Your submissions</h2>
      <div id="buyback-history-body"></div>
    </section>
  </div>
  <p style="font-size: 0.875rem; color: rgb(var(--color-neutral-600));">
    Read the full <a href="/buyback-terms/">Buyback Terms</a>.
  </p>
</div>

<script src="https://dicebastion.com/js/auth-modal.js"></script>
<script>
(function () {
  // All wording for this page lives here so it can be edited in one place.
  const COPY = {
    signInTitle: 'Sign in to start',
    signInHelp: 'You need a Dice Bastion account to sell us cards.',
    stepGameHelp: 'Pick the game your cards are from. You can add cards from both games to the same list.',
    stepCardsHelp: 'Search for a card, then tell us its condition and language.',
    stepReviewHelp: 'Check your list before you send it. We will look at each card and email you an offer.',
    conditionHelp: 'Conditions follow the usual Cardmarket grades and we check every card when you bring them in. See the',
    listEmpty: 'You haven\'t added any cards yet.',
    searchPlaceholder: 'Start typing a card name',
    searching: 'Searching...',
    noResults: 'We couldn\'t find a card with that name.',
    searchFailed: 'Search isn\'t working right now. Please try again in a moment.',
    riftboundUnavailable: 'Riftbound isn\'t available yet.',
    sending: 'Sending your list...',
    sendFailed: 'We couldn\'t send your list. Please try again.',
    loadFailed: 'We couldn\'t load the form. Please refresh the page.',
    sentMessage: 'Thanks, we have your list. We will look through it and email you an offer within a few days. If you accept, we will arrange a time for you to bring the cards in.',
    caseRef: n => `Your list number is #${n}.`,
    historyEmpty: 'You haven\'t sent us any lists yet.',
    status: {
      submitted: 'Sent',
      under_review: 'Being looked at',
      quoted: 'Offer sent',
      accepted: 'Accepted',
      rejected: 'Declined',
      completed: 'Credit added',
      cancelled: 'Cancelled'
    }
  };
  const GAME_LABELS = { mtg: 'Magic: The Gathering', riftbound: 'Riftbound' };

  const API_BASE = (window.utils && window.utils.getApiBase(true)) || 'https://dicebastion.com/api';
  const $ = id => document.getElementById(id);
  const loginGate = $('buyback-login-gate');
  const flow = $('buyback-flow');
  const history = $('buyback-history');
  const msgEl = $('buyback-form-message');
  const searchInput = $('buyback-search');
  const resultsEl = $('buyback-search-results');
  const tos = $('buyback-tos');
  const submitBtn = $('buyback-submit-btn');

  document.querySelectorAll('[data-copy]').forEach(el => { el.textContent = COPY[el.dataset.copy]; });
  searchInput.placeholder = COPY.searchPlaceholder;

  let token = null;
  let meta = null;
  let riftboundReady = false;
  let selectedCard = null;
  let searchTimer = null;
  let state = { step: '1', game: null, items: [], notes: '' };

  function headers() {
    return { 'Content-Type': 'application/json', 'X-Session-Token': token };
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ---------- Saved progress ----------
  function draftKey() {
    const user = window.utils && utils.session && utils.session.getUser ? utils.session.getUser() : null;
    return 'buyback_draft_' + (user && user.id ? user.id : 'me');
  }
  function saveDraft() {
    try {
      localStorage.setItem(draftKey(), JSON.stringify({
        game: state.game,
        items: state.items,
        notes: $('buyback-customer-notes').value
      }));
    } catch (_) {}
  }
  function loadDraft() {
    try {
      const raw = JSON.parse(localStorage.getItem(draftKey()) || 'null');
      if (raw && Array.isArray(raw.items)) {
        state.game = raw.game || null;
        state.items = raw.items;
        $('buyback-customer-notes').value = raw.notes || '';
      }
    } catch (_) {}
  }
  function clearDraft() {
    try { localStorage.removeItem(draftKey()); } catch (_) {}
  }

  // ---------- Steps ----------
  function goTo(step, opts = {}) {
    if (step === '3' && !state.items.length) step = '2';
    if (step === '2' && !state.game) step = '1';
    state.step = step;
    flow.querySelectorAll('.sell-step').forEach(s => s.classList.toggle('is-active', s.dataset.step === step));
    const current = step === 'done' ? 4 : Number(step);
    flow.querySelectorAll('#sell-progress li').forEach(li => {
      const n = Number(li.dataset.step);
      li.classList.toggle('is-current', n === current);
      li.classList.toggle('is-done', n < current);
    });
    if (step === '2') {
      $('buyback-search-label').textContent = 'Find a ' + GAME_LABELS[state.game] + ' card';
      if (!opts.initial) setTimeout(() => searchInput.focus(), 0);
    }
    if (step === '3') renderReview();
    msgEl.textContent = '';
    msgEl.classList.remove('is-error');
    if (!opts.initial) flow.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  flow.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => goTo(btn.dataset.go));
  });

  flow.querySelectorAll('.sell-game').forEach(btn => {
    btn.addEventListener('click', () => {
      state.game = btn.dataset.game;
      closeEditor();
      resultsEl.style.display = 'none';
      searchInput.value = '';
      renderGames();
      saveDraft();
      goTo('2');
    });
  });

  function renderGames() {
    flow.querySelectorAll('.sell-game').forEach(btn => {
      const ready = btn.dataset.game === 'mtg' || riftboundReady;
      btn.disabled = !ready;
      btn.classList.toggle('is-selected', btn.dataset.game === state.game);
    });
    $('riftbound-note').textContent = riftboundReady ? '' : COPY.riftboundUnavailable;
  }

  // ---------- List ----------
  function itemMeta(it) {
    return [
      GAME_LABELS[it.game_system] || it.game_system,
      it.set_name || it.set_code,
      it.collector_number ? '#' + it.collector_number : '',
      it.condition + ', ' + it.language,
      it.notes
    ].filter(Boolean).map(escapeHtml).join(' &middot; ');
  }

  function itemRow(it, actions) {
    return `
      <li>
        ${it.image_url ? `<img src="${escapeHtml(it.image_url)}" alt="" width="40" height="56" style="object-fit:contain;border-radius:3px;">` : ''}
        <div class="sell-list__info">
          <div class="sell-list__name">${escapeHtml(it.card_name)}</div>
          <div class="sell-list__meta">${itemMeta(it)}</div>
        </div>
        ${actions}
      </li>`;
  }

  function renderList() {
    const n = state.items.length;
    $('buyback-list-empty').style.display = n ? 'none' : 'block';
    $('buyback-count').textContent = n ? `(${n} card${n === 1 ? '' : 's'})` : '';
    $('buyback-to-review').disabled = !n;
    $('buyback-list').innerHTML = state.items.map((it, idx) => itemRow(it, `
      <div class="sell-list__actions">
        <button type="button" class="btn btn-secondary sell-small-btn" data-copy-idx="${idx}">Add another copy</button>
        <button type="button" class="btn btn-secondary sell-small-btn" data-remove-idx="${idx}">Remove</button>
      </div>`)).join('');
    $('buyback-list').querySelectorAll('[data-copy-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.copyIdx);
        state.items.splice(idx + 1, 0, { ...state.items[idx] });
        renderList();
        saveDraft();
      });
    });
    $('buyback-list').querySelectorAll('[data-remove-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.items.splice(Number(btn.dataset.removeIdx), 1);
        renderList();
        saveDraft();
      });
    });
  }

  function renderReview() {
    $('buyback-review-list').innerHTML = state.items.map(it => itemRow(it, '')).join('');
    updateSubmitEnabled();
  }

  function updateSubmitEnabled() {
    submitBtn.disabled = !(tos.checked && state.items.length > 0);
  }

  // ---------- Search and card editor ----------
  function fillSelect(sel, options, defaultCode) {
    sel.innerHTML = options.map(o =>
      `<option value="${escapeHtml(o.code)}"${o.code === defaultCode ? ' selected' : ''}>${escapeHtml(o.label)}</option>`
    ).join('');
  }

  function closeEditor() {
    selectedCard = null;
    $('buyback-selected-editor').style.display = 'none';
  }

  function showSelected(card) {
    selectedCard = card;
    $('buyback-selected-editor').style.display = 'block';
    $('buyback-sel-name').textContent = card.name;
    $('buyback-sel-set').textContent = [card.set_name, card.set_code, card.collector_number].filter(Boolean).join(' \u00b7 ');
    const img = $('buyback-sel-img');
    if (card.image_url) {
      img.src = card.image_url;
      img.style.display = 'block';
    } else {
      img.style.display = 'none';
    }
    $('buyback-item-notes').value = '';
    resultsEl.style.display = 'none';
    searchInput.value = '';
  }

  function resultMessage(text, isError) {
    resultsEl.innerHTML = `<div style="padding:0.75rem;font-size:0.875rem;color:${isError ? '#b00020' : 'rgb(var(--color-neutral-600))'};">${escapeHtml(text)}</div>`;
    resultsEl.style.display = 'block';
  }

  async function runSearch(q) {
    resultMessage(COPY.searching, false);
    try {
      const res = await fetch(`${API_BASE}/buyback/cards/search?game=${encodeURIComponent(state.game)}&q=${encodeURIComponent(q)}`, {
        headers: headers(),
        credentials: 'include'
      });
      const data = await res.json();
      if (searchInput.value.trim() !== q) return;
      if (!res.ok) return resultMessage(data.message || COPY.searchFailed, true);
      const rows = data.results || [];
      if (!rows.length) return resultMessage(COPY.noResults, false);
      resultsEl.innerHTML = rows.map((c, i) => `
        <button type="button" data-i="${i}" style="display:flex;gap:0.65rem;align-items:center;width:100%;text-align:left;padding:0.55rem 0.75rem;border:0;border-bottom:1px solid rgb(var(--color-neutral-100));background:#fff;cursor:pointer;">
          ${c.image_url ? `<img src="${escapeHtml(c.image_url)}" alt="" width="36" height="50" style="object-fit:contain;">` : ''}
          <span><strong>${escapeHtml(c.name)}</strong><br><span style="font-size:0.75rem;color:rgb(var(--color-neutral-600));">${escapeHtml([c.set_name, c.set_code, c.collector_number].filter(Boolean).join(' \u00b7 '))}</span></span>
        </button>
      `).join('');
      resultsEl.style.display = 'block';
      resultsEl.querySelectorAll('button[data-i]').forEach(btn => {
        btn.addEventListener('click', () => showSelected(rows[Number(btn.dataset.i)]));
      });
    } catch (_) {
      resultMessage(COPY.searchFailed, true);
    }
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

  document.addEventListener('click', (e) => {
    if (!resultsEl.contains(e.target) && e.target !== searchInput) resultsEl.style.display = 'none';
  });

  $('buyback-add-item').addEventListener('click', () => {
    if (!selectedCard) return;
    state.items.push({
      game_system: state.game,
      external_id: selectedCard.id,
      card_name: selectedCard.name,
      set_code: selectedCard.set_code,
      set_name: selectedCard.set_name,
      collector_number: selectedCard.collector_number,
      image_url: selectedCard.image_url,
      condition: $('buyback-condition').value,
      language: $('buyback-language').value,
      notes: $('buyback-item-notes').value.trim() || null
    });
    closeEditor();
    renderList();
    saveDraft();
    searchInput.focus();
  });

  $('buyback-cancel-item').addEventListener('click', () => {
    closeEditor();
    searchInput.focus();
  });

  $('buyback-customer-notes').addEventListener('input', saveDraft);
  tos.addEventListener('change', updateSubmitEnabled);

  // ---------- Send ----------
  submitBtn.addEventListener('click', async () => {
    if (!tos.checked || !state.items.length) return;
    submitBtn.disabled = true;
    msgEl.classList.remove('is-error');
    msgEl.textContent = COPY.sending;
    try {
      const res = await fetch(`${API_BASE}/buyback/cases`, {
        method: 'POST',
        headers: headers(),
        credentials: 'include',
        body: JSON.stringify({
          tos_accepted: true,
          customer_notes: $('buyback-customer-notes').value.trim() || null,
          items: state.items
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || COPY.sendFailed);
      clearDraft();
      state.items = [];
      $('buyback-customer-notes').value = '';
      tos.checked = false;
      renderList();
      $('buyback-case-ref').textContent = data.case_id ? COPY.caseRef(data.case_id) : '';
      goTo('done');
      loadHistory();
    } catch (err) {
      msgEl.classList.add('is-error');
      msgEl.textContent = err.message || COPY.sendFailed;
      updateSubmitEnabled();
    }
  });

  $('buyback-start-again').addEventListener('click', () => goTo('1'));

  // ---------- Your submissions ----------
  function formatDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function loadHistory() {
    try {
      const res = await fetch(`${API_BASE}/buyback/cases`, { headers: headers(), credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const cases = data.cases || [];
      history.style.display = 'block';
      if (!cases.length) {
        $('buyback-history-body').innerHTML = `<p class="sell-help" style="margin:0;">${escapeHtml(COPY.historyEmpty)}</p>`;
        return;
      }
      $('buyback-history-body').innerHTML = `
        <table class="sell-cases-table">
          <thead><tr><th>List</th><th>Sent</th><th>Cards</th><th>Status</th><th>Offer</th></tr></thead>
          <tbody>
            ${cases.map(c => `
              <tr>
                <td>#${escapeHtml(c.id)}</td>
                <td>${escapeHtml(formatDate(c.created_at))}</td>
                <td>${c.item_count != null ? escapeHtml(c.item_count) : ''}</td>
                <td>${escapeHtml(COPY.status[c.status] || c.status)}</td>
                <td>${c.agreed_value_pence != null ? '&pound;' + (Number(c.agreed_value_pence) / 100).toFixed(2) : ''}</td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    } catch (_) {}
  }

  // ---------- Session ----------
  async function loadMeta() {
    const res = await fetch(`${API_BASE}/buyback/meta`, { headers: headers(), credentials: 'include' });
    if (res.status === 401) {
      showLoggedOut();
      return false;
    }
    if (!res.ok) throw new Error(COPY.loadFailed);
    meta = await res.json();
    fillSelect($('buyback-condition'), meta.conditions, 'EX');
    fillSelect($('buyback-language'), meta.languages, 'EN');
    const rb = (meta.games || []).find(g => g.code === 'riftbound');
    riftboundReady = !!(rb && rb.searchReady);
    return true;
  }

  function showLoggedOut() {
    flow.style.display = 'none';
    history.style.display = 'none';
    loginGate.style.display = 'block';
  }

  async function showLoggedIn() {
    loginGate.style.display = 'none';
    flow.style.display = 'block';
    try {
      if (!(await loadMeta())) return;
    } catch (err) {
      flow.innerHTML = `<p class="sell-message is-error" style="margin:0;">${escapeHtml(err.message || COPY.loadFailed)}</p>`;
      return;
    }
    loadDraft();
    if (state.game === 'riftbound' && !riftboundReady) state.game = null;
    renderGames();
    renderList();
    goTo(state.items.length && state.game ? '2' : '1', { initial: true });
    loadHistory();
  }

  async function ensureSession() {
    if (window.utils && utils.session && utils.session.syncFromSharedCookie) {
      await utils.session.syncFromSharedCookie(API_BASE);
    }
    token = (window.utils && utils.session) ? utils.session.get() : localStorage.getItem('admin_session');
    if (token) showLoggedIn();
    else showLoggedOut();
  }

  $('buyback-main-login').href = 'https://dicebastion.com/login?return=' + encodeURIComponent(window.location.href);

  $('buyback-open-login').addEventListener('click', () => {
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

  ensureSession();
})();
</script>
