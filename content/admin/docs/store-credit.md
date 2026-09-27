---
title: "Store Credit & Buyback"
layout: "single"
showHero: false
showDate: false
---

<div id="docs-auth-guard" style="text-align: center; padding: 3rem;">
  <p style="color: rgb(var(--color-neutral-500));">Checking authentication...</p>
</div>

<div id="docs-content" style="display: none; max-width: 900px;">

<div style="margin-bottom: 2rem;">
  <a href="/admin/docs/" style="color: rgb(var(--color-primary-600)); text-decoration: underline;">Back to Developer Documentation</a>
</div>

<h1>Store Credit &amp; TCG Buyback</h1>
<p style="color: rgb(var(--color-neutral-600));">Operational reference for v1 (SQL-first staff ops). Migration: <code>worker/migrations/0010_store_credit_buyback.sql</code>.</p>

<h2>Session across shop and main site</h2>
<p>Login sets a <code>db_session</code> cookie on <code>.dicebastion.com</code> so the shop can share auth with the main site. Shop pages sync via <code>utils.session.syncFromSharedCookie</code>. Guests cannot use credit or buyback.</p>

<h2>Concepts</h2>
<ul>
  <li><strong>Balance</strong> — <code>users.store_credit_pence</code> (integer pence).</li>
  <li><strong>Ledger</strong> — append-only <code>store_credit_ledger</code>. Every credit change writes a history row with an <code>idempotency_key</code>.</li>
  <li><strong>Buyback case</strong> — <code>buyback_cases</code> + <code>buyback_case_items</code>. Customer submission; staff quote and credit via SQL until an admin UI exists.</li>
  <li><strong>Spend targets</strong> — shop orders and paid event tickets only. Not memberships or donations.</li>
  <li><strong>Guests</strong> — never see or use store credit.</li>
</ul>

<h2>Case statuses</h2>
<table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
<thead>
<tr><th style="text-align:left; border-bottom:1px solid #ccc; padding:0.4rem;">Status</th><th style="text-align:left; border-bottom:1px solid #ccc; padding:0.4rem;">Meaning</th></tr>
</thead>
<tbody>
<tr><td style="padding:0.4rem;"><code>submitted</code></td><td style="padding:0.4rem;">Customer just submitted</td></tr>
<tr><td style="padding:0.4rem;"><code>under_review</code></td><td style="padding:0.4rem;">Staff reviewing</td></tr>
<tr><td style="padding:0.4rem;"><code>quoted</code></td><td style="padding:0.4rem;">Quote communicated; <code>agreed_value_pence</code> may be set</td></tr>
<tr><td style="padding:0.4rem;"><code>accepted</code></td><td style="padding:0.4rem;">Customer accepted quote</td></tr>
<tr><td style="padding:0.4rem;"><code>rejected</code></td><td style="padding:0.4rem;">Declined / cancelled by staff</td></tr>
<tr><td style="padding:0.4rem;"><code>completed</code></td><td style="padding:0.4rem;">Cards taken; credit issued</td></tr>
<tr><td style="padding:0.4rem;"><code>cancelled</code></td><td style="padding:0.4rem;">Abandoned</td></tr>
</tbody>
</table>

<h2>Sub-£1 card charge rule</h2>
<p>If applying available credit would leave a card remainder of 1–99p, credit is <strong>not</strong> applied and the full amount is charged on card (SumUp minimum £1.00). Credit applies only when the remainder is £0 or ≥ £1.00.</p>

<h2>SQL recipes (D1)</h2>
<p>Run against the production D1 database. Prefer a single batch / transaction mentally: update the case, then ledger + balance together. Use a unique <code>idempotency_key</code> every time.</p>

<h3>1. Mark case under review</h3>
<pre style="background:#f8fafc; padding:1rem; overflow:auto; font-size:0.8rem;"><code>UPDATE buyback_cases
SET status = 'under_review', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = :case_id;
</code></pre>

<h3>2. Set quote</h3>
<pre style="background:#f8fafc; padding:1rem; overflow:auto; font-size:0.8rem;"><code>UPDATE buyback_cases
SET status = 'quoted',
    agreed_value_pence = :quote_pence,
    staff_comments = :comments,
    quoted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = :case_id;
</code></pre>

<h3>3. Issue credit when buyback completes</h3>
<p>Replace placeholders. <code>:user_id</code> must match the case owner. <code>:credit_pence</code> is usually <code>agreed_value_pence</code>.</p>
<pre style="background:#f8fafc; padding:1rem; overflow:auto; font-size:0.8rem;"><code>-- Read current balance
SELECT user_id, store_credit_pence FROM users WHERE user_id = :user_id;
SELECT id, user_id, agreed_value_pence, status FROM buyback_cases WHERE id = :case_id;

-- Assume :old_balance and :new_balance = old + credit are known
INSERT INTO store_credit_ledger (
  user_id, delta_pence, balance_after_pence, entry_type,
  reference_type, reference_id, idempotency_key, note, created_by, created_at
) VALUES (
  :user_id,
  :credit_pence,
  :new_balance,
  'buyback_credit',
  'buyback_case',
  CAST(:case_id AS TEXT),
  'buyback_credit:' || CAST(:case_id AS TEXT),
  'Buyback case #' || CAST(:case_id AS TEXT),
  'sql_admin',
  strftime('%Y-%m-%dT%H:%M:%fZ','now')
);

UPDATE users
SET store_credit_pence = :new_balance,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE user_id = :user_id;

UPDATE buyback_cases
SET status = 'completed',
    resolved_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id = :case_id;
</code></pre>
<p>If the INSERT fails on unique <code>idempotency_key</code>, credit was already issued for that case — do not bump the balance again.</p>

<h3>4. Manual adjustment</h3>
<pre style="background:#f8fafc; padding:1rem; overflow:auto; font-size:0.8rem;"><code>INSERT INTO store_credit_ledger (
  user_id, delta_pence, balance_after_pence, entry_type,
  reference_type, reference_id, idempotency_key, note, created_by, created_at
) VALUES (
  :user_id, :delta_pence, :new_balance, 'adjustment',
  NULL, NULL,
  'adjustment:' || lower(hex(randomblob(8))),
  :note,
  'sql_admin',
  strftime('%Y-%m-%dT%H:%M:%fZ','now')
);

UPDATE users SET store_credit_pence = :new_balance,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE user_id = :user_id;
</code></pre>

<h3>5. Void / reverse a mistaken credit</h3>
<p>Insert a negative <code>void</code> (or <code>adjustment</code>) entry with a new idempotency key; never delete ledger rows.</p>

<h3>Inspect a case</h3>
<pre style="background:#f8fafc; padding:1rem; overflow:auto; font-size:0.8rem;"><code>SELECT * FROM buyback_cases WHERE id = :case_id;
SELECT * FROM buyback_case_items WHERE case_id = :case_id ORDER BY id;
SELECT * FROM store_credit_ledger WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 20;
</code></pre>

<h2>Card search APIs</h2>
<ul>
  <li><strong>MTG</strong> — Scryfall (free fair-use). Worker proxies <code>GET /buyback/cards/search?game=mtg&amp;q=…</code>. No API key. Descriptive User-Agent set server-side. Prices are never returned to the client.</li>
  <li><strong>Riftbound</strong> — Scrydex (<code>https://api.scrydex.com/riftbound/v1/…</code>). Requires secrets <code>SCRYDEX_API_KEY</code> and <code>SCRYDEX_TEAM_ID</code> (<code>wrangler secret put</code>). Until set, Riftbound search returns 503 and the submit form blocks Riftbound.</li>
  <li><strong>Cardmarket</strong> — not used for search (new API apps closed). Condition labels only: MT, NM, EX, GD, LP, PL, PO.</li>
</ul>

<h2>Compliance notes (Gibraltar)</h2>
<ul>
  <li>Customers sell second-hand cards <strong>to</strong> Dice Bastion; we are the buyer. We are not selling used goods to customers via this flow.</li>
  <li>Public terms: shop <code>/buyback-terms/</code> (ownership on acceptance/completion, store credit only, 12-month validity policy without technical enforcement yet, non-transferable, no memberships/donations).</li>
  <li>Privacy: existing Privacy Policy covers account and case data.</li>
  <li>Have a Gibraltar-qualified advisor review the published terms before heavy marketing use.</li>
</ul>

<h2>Customer URLs</h2>
<ul>
  <li>Explainer: <code>https://shop.dicebastion.com/sell-cards/</code></li>
  <li>Terms: <code>https://shop.dicebastion.com/buyback-terms/</code></li>
  <li>Submit form: <code>https://shop.dicebastion.com/sell-cards/submit/</code></li>
  <li>Account balance: <code>https://dicebastion.com/account</code></li>
</ul>

<h2>Env</h2>
<ul>
  <li><code>BUYBACK_NOTIFY_EMAIL</code> — staff notification on new cases (default <code>SUPPORT_CONTACT_EMAIL</code>).</li>
  <li><code>SCRYDEX_API_KEY</code>, <code>SCRYDEX_TEAM_ID</code> — optional until Riftbound onboarding.</li>
</ul>

</div>

<script>
(function(){
  const API = 'https://dicebastion-memberships.ncalamaro.workers.dev';
  const guard = document.getElementById('docs-auth-guard');
  const content = document.getElementById('docs-content');

  async function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      guard.innerHTML = '<p style="color: rgb(var(--color-neutral-600));">Access denied. <a href="/admin/" style="color: rgb(var(--color-primary-600)); text-decoration: underline;">Login to admin</a></p>';
      return;
    }
    try {
      const r = await fetch(API + '/admin/verify', {
        headers: { 'X-Session-Token': token }
      });
      if (r.ok) {
        guard.style.display = 'none';
        content.style.display = 'block';
      } else {
        guard.innerHTML = '<p style="color: rgb(var(--color-neutral-600));">Access denied. <a href="/admin/" style="color: rgb(var(--color-primary-600)); text-decoration: underline;">Login to admin</a></p>';
      }
    } catch (e) {
      guard.innerHTML = '<p style="color: rgb(var(--color-neutral-600));">Could not verify session.</p>';
    }
  }
  checkAuth();
})();
</script>
