---
title: "Newsletter"
description: "Sign up for the Dice Bastion newsletter and stay up to date with upcoming events, game nights, new arrivals, and offers."
layout: "single"
showHero: false
showDate: false
showReadingTime: false
---

<script src="/js/utils.js"></script>

<div id="nl-page" style="max-width: 520px; margin: 2rem auto;">

  <!-- Loading -->
  <div id="nl-loading" class="card card-centered" style="text-align:center; padding: 3rem 2rem;">
    <p style="color: rgb(var(--color-neutral-500));">Loading&hellip;</p>
  </div>

  <!-- State: Email form (not logged in) -->
  <div id="nl-form-state" class="card" style="display:none;">
    <h2 class="card-header" style="margin-bottom: 0.5rem;">Stay up to date</h2>
    <p style="color: rgb(var(--color-neutral-600)); margin-bottom: 1.5rem; margin-top: 0;">
      Get the latest news on upcoming events, game nights, new arrivals, and special offers at Dice Bastion.
    </p>
    <form id="nl-subscribe-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="nl-email">Email address</label>
        <input type="email" id="nl-email" class="form-input" required autocomplete="email" placeholder="you@example.com">
      </div>
      <div class="form-group">
        <label class="form-label" for="nl-name">
          Name <span style="font-weight: 400; color: rgb(var(--color-neutral-500));">(optional)</span>
        </label>
        <input type="text" id="nl-name" class="form-input" autocomplete="name" placeholder="Your name">
      </div>
      <div class="checkbox-group" style="margin-bottom: 1.25rem;">
        <input type="checkbox" id="nl-consent" class="checkbox-input" required>
        <label for="nl-consent" class="checkbox-label" style="font-size: 0.875rem;">
          I agree to receive the Dice Bastion newsletter. I can unsubscribe at any time.
          See our <a href="/privacy-policy" class="link">privacy policy</a>.
        </label>
      </div>
      <!-- Honeypot — bots fill this, humans don't -->
      <input type="text" id="nl-hp" name="website" autocomplete="off" tabindex="-1" style="position:absolute;left:-9999px;opacity:0;" aria-hidden="true">

<div id="nl-form-error" class="alert alert-error" style="display:none; margin-bottom: 1rem;"></div>
<button type="submit" id="nl-submit-btn" class="btn btn-primary btn-full">Subscribe</button>
</form>
<p style="margin-top: 1.25rem; font-size: 0.8rem; color: rgb(var(--color-neutral-500)); text-align: center;">
Already have an account? <a href="/login?redirect=/newsletter" class="link">Log in</a> to manage your preferences.
</p>
</div>

  <!-- State: Logged in — newsletter settings (same as the account page) -->
  <div id="nl-settings-state" class="card" style="display:none;">
    <h2 class="card-header">Email Preferences</h2>
    <div class="card-section" style="display: flex; align-items: start; gap: 1rem; margin-bottom: 1rem;">
      <input type="checkbox" id="nl-essential-emails" checked disabled style="margin-top: 0.25rem;">
      <div style="flex: 1;">
        <label for="nl-essential-emails" class="card-label" style="display: block; margin-bottom: 0.25rem; text-transform: none; font-size: 1rem;">Essential Emails</label>
        <p class="text-muted" style="margin: 0; font-size: 0.875rem;">
          Order confirmations, event tickets, and account updates (required)
        </p>
      </div>
    </div>
    <div class="card-section" style="display: flex; align-items: start; gap: 1rem;">
      <input type="checkbox" id="nl-newsletter" style="margin-top: 0.25rem;">
      <div style="flex: 1;">
        <label for="nl-newsletter" class="card-label" style="display: block; margin-bottom: 0.25rem; text-transform: none; font-size: 1rem;">Newsletter</label>
        <p class="text-muted" style="margin: 0; font-size: 0.875rem;">
          The Dice Bastion newsletter: upcoming events, game nights, new arrivals, and special offers. You can unsubscribe at any time.
        </p>
      </div>
    </div>
    <div id="nl-prefs-message" style="display: none; margin-top: 1rem; padding: 0.75rem; border-radius: 6px; font-size: 0.875rem;"></div>
    <p style="margin: 1rem 0 0; font-size: 0.875rem; color: rgb(var(--color-neutral-500));">
      You can also manage these preferences from your <a href="/account" class="link">account page</a>.
    </p>
  </div>

  <!-- State: Email belongs to a registered account (not logged in) -->
  <div id="nl-registered-state" class="card" style="display:none;">
    <div class="alert alert-info" style="margin-bottom: 1.25rem;">
      This email address is associated with a Dice Bastion account. Please log in to manage your newsletter preferences.
    </div>
    <a href="/login?redirect=/newsletter" id="nl-login-link" class="btn btn-primary btn-full">Log in to manage preferences</a>
    <p style="text-align: center; margin-top: 1rem; font-size: 0.875rem; color: rgb(var(--color-neutral-500));">
      <a href="#" id="nl-try-again-link" class="link">Use a different email address</a>
    </p>
  </div>

  <!-- State: Success -->
  <div id="nl-success-state" class="card" style="display:none;">
    <div class="alert alert-success" style="margin-bottom: 1.25rem;">
      You're subscribed. Thanks for signing up to the Dice Bastion newsletter.
    </div>
    <p style="color: rgb(var(--color-neutral-600)); margin: 0;">
      Keep an eye on your inbox. You can unsubscribe at any time using the link in any of our emails.
    </p>
  </div>

</div>

<script>
(function () {
  const API_BASE = typeof utils !== 'undefined' ? utils.getApiBase(true) : 'https://dicebastion-memberships.ncalamaro.workers.dev';

  // ── State helpers ──────────────────────────────────────────────────────────
  const states = ['nl-loading', 'nl-form-state', 'nl-settings-state', 'nl-registered-state', 'nl-success-state'];
  function showState(id) {
    states.forEach(s => {
      const el = document.getElementById(s);
      if (el) el.style.display = s === id ? '' : 'none';
    });
  }

  function showFormError(msg) {
    const el = document.getElementById('nl-form-error');
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
  }

  function showPrefsMessage(msg, isError) {
    const el = document.getElementById('nl-prefs-message');
    if (!el) return;
    el.textContent = msg;
    el.style.background = isError ? '#fee2e2' : '#d1fae5';
    el.style.color = isError ? '#991b1b' : '#065f46';
    el.style.display = msg ? 'block' : 'none';
  }

  // ── On page load: check login status ──────────────────────────────────────
  async function init() {
    const sessionToken = typeof utils !== 'undefined' ? utils.session.get() : localStorage.getItem('admin_session');

    if (!sessionToken) {
      showState('nl-form-state');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/account/info`, {
        headers: { 'X-Session-Token': sessionToken }
      });

      if (!res.ok) {
        // Session expired / invalid — fall through to email form
        if (res.status === 401 && typeof utils !== 'undefined') utils.session.clear();
        showState('nl-form-state');
        return;
      }

      const data = await res.json();
      const prefs = data.email_preferences || {};
      const newsletterCheckbox = document.getElementById('nl-newsletter');
      if (newsletterCheckbox) newsletterCheckbox.checked = prefs.marketing_emails === 1;
      setupNewsletterPreferenceListener();
      showState('nl-settings-state');
    } catch (e) {
      // Network error — still show form
      showState('nl-form-state');
    }
  }

  // ── Newsletter preference toggle (logged in) — same endpoint as /account ──
  function setupNewsletterPreferenceListener() {
    const checkbox = document.getElementById('nl-newsletter');
    if (!checkbox) return;

    checkbox.addEventListener('change', async function (e) {
      const sessionToken = typeof utils !== 'undefined' ? utils.session.get() : localStorage.getItem('admin_session');
      if (!sessionToken) { showState('nl-form-state'); return; }
      showPrefsMessage('');

      try {
        const response = await fetch(`${API_BASE}/account/email-preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken
          },
          body: JSON.stringify({ marketing_emails: e.target.checked })
        });

        if (response.ok) {
          showPrefsMessage('Email preferences updated successfully!', false);
          setTimeout(() => showPrefsMessage(''), 3000);
        } else {
          throw new Error('Failed to update preferences');
        }
      } catch (error) {
        showPrefsMessage('Failed to update preferences. Please try again.', true);
        // Revert checkbox
        e.target.checked = !e.target.checked;
      }
    });
  }

  // ── Email form submit ──────────────────────────────────────────────────────
  const form = document.getElementById('nl-subscribe-form');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      showFormError('');

      // Honeypot check
      if (document.getElementById('nl-hp').value) return;

      const email = document.getElementById('nl-email').value.trim();
      const name = document.getElementById('nl-name').value.trim();
      const consent = document.getElementById('nl-consent').checked;

      if (!email) { showFormError('Please enter your email address.'); return; }
      if (!consent) { showFormError('Please tick the consent box to subscribe.'); return; }

      const btn = document.getElementById('nl-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Subscribing\u2026';

      try {
        const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: name || undefined, consent: true })
        });

        const data = await res.json();

        if (!res.ok) {
          const msgs = {
            email_required: 'Please enter your email address.',
            invalid_email: 'Please enter a valid email address.',
            consent_required: 'Please tick the consent box to subscribe.',
          };
          showFormError(msgs[data.error] || 'Something went wrong. Please try again.');
          btn.disabled = false;
          btn.textContent = 'Subscribe';
          return;
        }

        if (data.status === 'registered_user') {
          // Store the entered email so the login-link redirect makes sense
          const loginLink = document.getElementById('nl-login-link');
          if (loginLink) {
            const encoded = encodeURIComponent('/newsletter');
            loginLink.href = `/login?redirect=${encoded}`;
          }
          showState('nl-registered-state');
          return;
        }

        // 'subscribed' or 'already_subscribed'
        showState('nl-success-state');
      } catch (err) {
        showFormError('Network error. Please check your connection and try again.');
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    });
  }

  // ── "Use a different email" link in registered-user state ─────────────────
  const tryAgainLink = document.getElementById('nl-try-again-link');
  if (tryAgainLink) {
    tryAgainLink.addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('nl-email').value = '';
      showFormError('');
      showState('nl-form-state');
    });
  }

  // Kick off
  init();
})();
</script>
