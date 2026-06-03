---
title: Support
description: Contact the Dice Bastion team to report an issue, ask a question, or get help with memberships, events, and bookings.
showDate: false
showPagination: false
---

<link rel="stylesheet" href="/css/forms.css">
<script src="/js/utils.js"></script>

<div id="support-page" class="page-container" style="max-width: 560px;">

<div id="support-form-state" class="card">
<h1 class="card-header" style="margin-bottom: 0.5rem;">Contact support</h1>
<p style="color: rgb(var(--color-neutral-600)); margin-top: 0; margin-bottom: 1.5rem;">
  Report a problem, ask a question, or let us know if something isn&rsquo;t working. We&rsquo;ll get back to you by email as soon as we can.
</p>

<form id="support-form" novalidate>
  <div class="form-group">
    <label class="form-label" for="support-name">Your name</label>
    <input type="text" id="support-name" class="form-input" required autocomplete="name" placeholder="Your full name">
  </div>

  <div class="form-group">
    <label class="form-label" for="support-email">Email address</label>
    <input type="email" id="support-email" class="form-input" required autocomplete="email" placeholder="you@example.com">
  </div>

  <div class="form-group">
    <label class="form-label" for="support-category">What is this about?</label>
    <select id="support-category" class="form-select">
      <option value="general">General enquiry</option>
      <option value="membership">Membership</option>
      <option value="events">Events</option>
      <option value="bookings">Table bookings</option>
      <option value="website">Website / technical issue</option>
      <option value="other">Other</option>
    </select>
  </div>

  <div class="form-group">
    <label class="form-label" for="support-message">Message</label>
    <textarea id="support-message" class="form-textarea" rows="6" required placeholder="Please describe the issue or question in as much detail as you can."></textarea>
  </div>

  <!-- Honeypot -->
  <input type="text" id="support-hp" name="website" autocomplete="off" tabindex="-1" style="position:absolute;left:-9999px;opacity:0;" aria-hidden="true">

  <div class="form-group">
    <div class="form-label">Security check</div>
    <div id="support-ts" data-sitekey="0x4AAAAAACAB4xlOnW3S8K0k" data-size="flexible"></div>
  </div>

  <div id="support-error" class="alert alert-error" style="display:none; margin-bottom: 1rem;"></div>

  <button type="submit" id="support-submit" class="btn btn-primary btn-full">Send message</button>
</form>
</div>

<div id="support-success-state" class="card" style="display:none;">
<div class="alert alert-success" style="margin-bottom: 1.25rem;">
  Thanks — your message has been sent. We&rsquo;ll reply to the email address you provided.
</div>
<p style="color: rgb(var(--color-neutral-600)); margin: 0;">
  If your question is urgent, please check our <a href="/FAQs/" class="link">FAQs</a> or your <a href="/account/" class="link">account page</a> for membership details.
</p>
</div>

</div>

<script>
(function () {
const SUPPORT_API = `${window.utils.getApiBase(true)}/support/contact`;
const TS_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k';
const IS_LOCALHOST = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

const form = document.getElementById('support-form');
const errorEl = document.getElementById('support-error');
const submitBtn = document.getElementById('support-submit');
const formState = document.getElementById('support-form-state');
const successState = document.getElementById('support-success-state');

function showError(msg) {
if (!errorEl) return;
errorEl.textContent = msg || 'Something went wrong. Please try again.';
errorEl.style.display = msg ? 'block' : 'none';
}

function prefillFromSession() {
const user = utils.session.getUser();
if (!user) return;
const nameEl = document.getElementById('support-name');
const emailEl = document.getElementById('support-email');
if (nameEl && user.name && !nameEl.value) nameEl.value = user.name;
if (emailEl && user.email && !emailEl.value) emailEl.value = user.email;
}

async function initTurnstile() {
try {
  await window.utils.loadTurnstileSdk();
  await window.utils.renderTurnstile('support-ts', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST });
} catch (e) {
  console.warn('Turnstile failed to load:', e);
}
}

if (form) {
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  showError('');

  if (document.getElementById('support-hp').value) return;

  const name = document.getElementById('support-name').value.trim();
  const email = document.getElementById('support-email').value.trim();
  const category = document.getElementById('support-category').value;
  const message = document.getElementById('support-message').value.trim();

  if (!name) { showError('Please enter your name.'); return; }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) { showError('Please enter a valid email address.'); return; }
  if (message.length < 10) { showError('Please enter a message of at least 10 characters.'); return; }

  let turnstileToken;
  try {
    turnstileToken = await window.utils.getTurnstileToken('support-ts', null, IS_LOCALHOST);
  } catch (err) {
    showError('Security check failed. Please refresh and try again.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  try {
    const res = await fetch(SUPPORT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, category, message, turnstileToken })
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      const msgs = {
        name_required: 'Please enter your name.',
        invalid_email: 'Please enter a valid email address.',
        message_too_short: 'Please enter a message of at least 10 characters.',
        turnstile_failed: 'Security check failed. Please refresh and try again.',
        rate_limit_exceeded: data.message || 'Too many messages sent. Please wait a minute and try again.',
        service_unavailable: data.message || 'Support form is temporarily unavailable.',
        send_failed: data.message || 'Could not send your message. Please try again later.'
      };
      showError(msgs[data.error] || data.message || 'Something went wrong. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
      return;
    }

    if (formState) formState.style.display = 'none';
    if (successState) successState.style.display = '';
  } catch (err) {
    showError('Network error. Please check your connection and try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send message';
  }
});
}

prefillFromSession();
initTurnstile();
})();
</script>
