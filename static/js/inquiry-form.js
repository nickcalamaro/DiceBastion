(function () {
  const INQUIRY_API = `${window.utils.getApiBase(true)}/support/contact`;
  const TS_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k';
  const IS_LOCALHOST = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

  const form = document.getElementById('inquiry-form');
  const errorEl = document.getElementById('inquiry-error');
  const submitBtn = document.getElementById('inquiry-submit');
  const formState = document.getElementById('inquiry-form-state');
  const successState = document.getElementById('inquiry-success-state');

  if (!form) return;

  const unavailableDefault = form.dataset.unavailableMsg || 'This form is temporarily unavailable.';
  const submitLabel = submitBtn ? submitBtn.textContent : 'Send message';

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg || 'Something went wrong. Please try again.';
    errorEl.style.display = msg ? 'block' : 'none';
  }

  function prefillFromSession() {
    const user = window.utils.session.getUser();
    if (!user) return;
    const nameEl = document.getElementById('inquiry-name');
    const emailEl = document.getElementById('inquiry-email');
    if (nameEl && user.name && !nameEl.value) nameEl.value = user.name;
    if (emailEl && user.email && !emailEl.value) emailEl.value = user.email;
  }

  async function initTurnstile() {
    try {
      await window.utils.loadTurnstileSdk();
      await window.utils.renderTurnstile('inquiry-ts', TS_SITE_KEY, { skipOnLocalhost: IS_LOCALHOST });
    } catch (e) {
      console.warn('Turnstile failed to load:', e);
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    showError('');

    if (document.getElementById('inquiry-hp').value) return;

    const name = document.getElementById('inquiry-name').value.trim();
    const email = document.getElementById('inquiry-email').value.trim();
    const category = document.getElementById('inquiry-category').value;
    const message = document.getElementById('inquiry-message').value.trim();

    if (!name) { showError('Please enter your name.'); return; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { showError('Please enter a valid email address.'); return; }
    if (message.length < 10) { showError('Please enter a message of at least 10 characters.'); return; }

    let turnstileToken;
    try {
      turnstileToken = await window.utils.getTurnstileToken('inquiry-ts', null, IS_LOCALHOST);
    } catch (err) {
      showError('Security check failed. Please refresh and try again.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(INQUIRY_API, {
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
          service_unavailable: data.message || unavailableDefault,
          send_failed: data.message || 'Could not send your message. Please try again later.'
        };
        showError(msgs[data.error] || data.message || 'Something went wrong. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
        return;
      }

      if (formState) formState.style.display = 'none';
      if (successState) successState.style.display = '';
    } catch (err) {
      showError('Network error. Please check your connection and try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
  });

  prefillFromSession();
  initTurnstile();
})();
