---
title: "Unsubscribe"
layout: "single"
showHero: false
showDate: false
showReadingTime: false
---

<script src="/js/utils.js"></script>

<div id="unsub-page" style="max-width: 520px; margin: 5rem auto; text-align: center;">

  <div id="unsub-loading" style="color: rgb(var(--color-neutral-500)); font-size: 1rem;">
    Processing your request...
  </div>

  <div id="unsub-result" style="display: none;">
    <div id="unsub-icon" style="font-size: 2.5rem; margin-bottom: 1rem;"></div>
    <h1 id="unsub-title" style="font-size: 1.5rem; font-weight: 800; margin: 0 0 0.75rem;"></h1>
    <p id="unsub-message" style="color: rgb(var(--color-neutral-500)); line-height: 1.65; margin: 0 0 2rem;"></p>
    <a href="/" style="color: rgb(var(--color-neutral-400)); font-size: 0.875rem; text-decoration: underline;">Return to Dice Bastion</a>
  </div>

</div>

<script>
(async function () {
  const API_BASE = utils.getApiBase();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const loadingEl = document.getElementById('unsub-loading');
  const resultEl  = document.getElementById('unsub-result');
  const iconEl    = document.getElementById('unsub-icon');
  const titleEl   = document.getElementById('unsub-title');
  const msgEl     = document.getElementById('unsub-message');

  function show(icon, title, message) {
    loadingEl.style.display = 'none';
    iconEl.textContent  = icon;
    titleEl.textContent = title;
    msgEl.textContent   = message;
    resultEl.style.display = '';
  }

  if (!token) {
    show('', 'Invalid link', 'This unsubscribe link is missing a token. Please use the link from your email.');
    return;
  }

  try {
    const res  = await fetch(`${API_BASE}/unsubscribe?token=${encodeURIComponent(token)}`);
    const data = await res.json();

    if (data.success && data.already) {
      show('', 'Already unsubscribed', 'You have already been removed from our mailing list. You will not receive any further newsletters.');
    } else if (data.success) {
      show('', 'Unsubscribed', 'You have been removed from the Dice Bastion mailing list. You will not receive any further newsletters. You can re-enable emails from your account settings at any time.');
    } else if (data.error === 'expired_token') {
      show('', 'Link expired', 'This unsubscribe link has expired. Please log into your account to manage your email preferences.');
    } else if (data.error === 'invalid_token') {
      show('', 'Link not found', 'This unsubscribe link is not valid. It may have already been used or the link may be incorrect. You can also manage preferences from your account settings.');
    } else {
      show('', 'Something went wrong', 'We could not process your request. Please try again or contact us at hello@dicebastion.com.');
    }
  } catch (err) {
    show('', 'Something went wrong', 'We could not process your request. Please try again or contact us at hello@dicebastion.com.');
  }
})();
</script>
