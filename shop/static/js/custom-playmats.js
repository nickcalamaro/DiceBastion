(function () {
  const API_BASE = 'https://dicebastion-memberships.ncalamaro.workers.dev';
  const PLAYMAT_API = API_BASE + '/support/contact';
  const TS_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k';
  const IS_LOCALHOST = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

  if (window.Splide && document.getElementById('playmat-carousel')) {
    new Splide('#playmat-carousel', {
      type: 'loop',
      perPage: 3,
      perMove: 1,
      gap: '0.75rem',
      pagination: true,
      arrows: true,
      speed: 450,
      breakpoints: {
        900: { perPage: 2 },
        560: { perPage: 1 }
      }
    }).mount();
  }

  (function initPlaymatLightbox() {
    const frames = document.querySelectorAll('#playmat-carousel .playmat-slide-frame');
    if (!frames.length) return;

    const lightbox = document.createElement('div');
    lightbox.className = 'playmat-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Playmat preview');
    lightbox.innerHTML =
      '<div class="playmat-lightbox-inner">' +
        '<button type="button" class="playmat-lightbox-close" aria-label="Close preview">&times;</button>' +
        '<img src="" alt="Custom playmat by Jen">' +
      '</div>';
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.playmat-lightbox-close');

    function openLightbox(src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || 'Custom playmat by Jen';
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightboxImg.removeAttribute('src');
      document.body.style.overflow = '';
    }

    frames.forEach(function (frame) {
      const img = frame.querySelector('img');
      if (!img) return;
      frame.setAttribute('role', 'button');
      frame.setAttribute('tabindex', '0');
      frame.setAttribute('aria-label', 'View playmat at full size');
      frame.addEventListener('click', function () {
        openLightbox(img.currentSrc || img.src, img.alt);
      });
      frame.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(img.currentSrc || img.src, img.alt);
        }
      });
    });

    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeLightbox();
    });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    });
  })();

  const form = document.getElementById('playmat-form');
  const errorEl = document.getElementById('playmat-error');
  const submitBtn = document.getElementById('playmat-submit');
  const formState = document.getElementById('playmat-form-state');
  const successState = document.getElementById('playmat-success-state');
  let turnstileWidgetId = null;

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg || 'Something went wrong. Please try again.';
    errorEl.style.display = msg ? 'block' : 'none';
  }

  function loadTurnstileSdk() {
    return new Promise(function (resolve, reject) {
      if (window.turnstile) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-playmat-turnstile]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.dataset.playmatTurnstile = '1';
      script.onload = function () { resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function initTurnstile() {
    if (IS_LOCALHOST) return;
    try {
      await loadTurnstileSdk();
      const el = document.getElementById('playmat-ts');
      if (!el || !window.turnstile) return;
      turnstileWidgetId = window.turnstile.render(el, {
        sitekey: TS_SITE_KEY,
        size: 'flexible'
      });
    } catch (e) {
      console.warn('Playmat Turnstile failed to load:', e);
    }
  }

  async function getTurnstileToken() {
    if (IS_LOCALHOST) return 'test-bypass';
    if (!window.turnstile) throw new Error('turnstile_missing');
    const token = turnstileWidgetId != null
      ? window.turnstile.getResponse(turnstileWidgetId)
      : window.turnstile.getResponse(document.getElementById('playmat-ts'));
    if (!token) throw new Error('turnstile_empty');
    return token;
  }

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      showError('');
      if (document.getElementById('playmat-hp').value) return;

      const name = document.getElementById('playmat-name').value.trim();
      const email = document.getElementById('playmat-email').value.trim();
      const brief = document.getElementById('playmat-brief').value.trim();
      const timelineOk = document.getElementById('playmat-timeline').checked;

      if (!name) {
        showError('Please enter your name.');
        return;
      }
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        showError('Please enter a valid email address.');
        return;
      }
      if (brief.length < 10) {
        showError('Please add a bit more detail about your project.');
        return;
      }
      if (!timelineOk) {
        showError('Please confirm you understand the two-week timeline and two rounds of feedback.');
        return;
      }

      const message = [
        'Custom playmat commission request',
        '',
        'Project details:',
        brief,
        '',
        'Customer confirmed: ~2 weeks turnaround and two rounds of feedback.'
      ].join('\n');

      let turnstileToken;
      try {
        turnstileToken = await getTurnstileToken();
      } catch (err) {
        showError('Security check failed. Please refresh and try again.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const res = await fetch(PLAYMAT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            email: email,
            category: 'custom_playmat',
            message: message,
            turnstileToken: turnstileToken
          })
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          const msgs = {
            name_required: 'Please enter your name.',
            invalid_email: 'Please enter a valid email address.',
            message_too_short: 'Please add a bit more detail about your project.',
            turnstile_failed: 'Security check failed. Please refresh and try again.',
            rate_limit_exceeded: data.message || 'Too many messages sent. Please wait a minute and try again.',
            service_unavailable: data.message || 'The form is temporarily unavailable.',
            send_failed: data.message || 'Could not send your request. Please try again later.'
          };
          showError(msgs[data.error] || data.message || 'Something went wrong. Please try again.');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send commission request';
          return;
        }

        if (formState) formState.style.display = 'none';
        if (successState) successState.style.display = '';
      } catch (err) {
        showError('Network error. Please check your connection and try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send commission request';
      }
    });
  }

  initTurnstile();
})();
