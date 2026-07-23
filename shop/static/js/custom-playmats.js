(function () {
  const API_BASE = 'https://dicebastion-memberships.ncalamaro.workers.dev';
  const PLAYMAT_API = API_BASE + '/support/contact';
  const TS_SITE_KEY = '0x4AAAAAACAB4xlOnW3S8K0k';
  const IS_LOCALHOST = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

  const MAX_FILES = 5;
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
  const ALLOWED_TYPES = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'application/pdf': 'pdf'
  };
  const ALLOWED_EXT = /\.(png|jpe?g|pdf)$/i;

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
        900: {
          perPage: 2,
          gap: '0.65rem'
        },
        640: {
          perPage: 1,
          gap: '0.5rem',
          arrows: false,
          padding: { left: '0.35rem', right: '0.35rem' }
        }
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
  const filesInput = document.getElementById('playmat-files');
  const fileListEl = document.getElementById('playmat-file-list');
  let turnstileWidgetId = null;

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg || 'Something went wrong. Please try again.';
    errorEl.style.display = msg ? 'block' : 'none';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function isAllowedFile(file) {
    if (ALLOWED_TYPES[file.type]) return true;
    return ALLOWED_EXT.test(file.name || '');
  }

  function validateSelectedFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length > MAX_FILES) {
      return { error: 'Please attach no more than ' + MAX_FILES + ' files.' };
    }
    let total = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!isAllowedFile(file)) {
        return { error: '"' + file.name + '" is not supported. Use PNG, JPG, or PDF.' };
      }
      if (file.size > MAX_FILE_BYTES) {
        return { error: '"' + file.name + '" is over 5 MB. Please choose a smaller file.' };
      }
      total += file.size;
    }
    if (total > MAX_TOTAL_BYTES) {
      return { error: 'Attachments total more than 15 MB. Please remove some files.' };
    }
    return { files: files };
  }

  function renderFileList(files) {
    if (!fileListEl) return;
    if (!files.length) {
      fileListEl.hidden = true;
      fileListEl.innerHTML = '';
      return;
    }
    fileListEl.hidden = false;
    fileListEl.innerHTML = files.map(function (file) {
      return '<li><span class="playmat-file-name">' + escapeHtml(file.name) + '</span>' +
        '<span class="playmat-file-size">' + formatBytes(file.size) + '</span></li>';
    }).join('');
  }

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        const result = String(reader.result || '');
        const comma = result.indexOf(',');
        if (comma < 0) {
          reject(new Error('encode_failed'));
          return;
        }
        resolve(result.slice(comma + 1));
      };
      reader.onerror = function () {
        reject(new Error('read_failed'));
      };
      reader.readAsDataURL(file);
    });
  }

  async function buildAttachments(files) {
    const attachments = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await readFileAsBase64(file);
      attachments.push({
        filename: file.name.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 120) || ('attachment-' + (i + 1)),
        content: content,
        contentType: ALLOWED_TYPES[file.type] ? file.type : (
          /\.pdf$/i.test(file.name) ? 'application/pdf' :
          /\.png$/i.test(file.name) ? 'image/png' : 'image/jpeg'
        )
      });
    }
    return attachments;
  }

  if (filesInput) {
    filesInput.addEventListener('change', function () {
      showError('');
      const result = validateSelectedFiles(filesInput.files);
      if (result.error) {
        showError(result.error);
        filesInput.value = '';
        renderFileList([]);
        return;
      }
      renderFileList(result.files);
    });
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
      const game = document.getElementById('playmat-game').value.trim();
      const design = document.getElementById('playmat-design').value.trim();
      const layout = document.getElementById('playmat-layout').value.trim();
      const timelineOk = document.getElementById('playmat-timeline').checked;

      if (!name) {
        showError('Please enter your name.');
        return;
      }
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        showError('Please enter a valid email address.');
        return;
      }
      if (!game) {
        showError('Please tell us what the playmat is for.');
        return;
      }
      if (design.length < 10) {
        showError('Please add a bit more detail about the design you want.');
        return;
      }
      if (!timelineOk) {
        showError('Please confirm the payment schedule before sending.');
        return;
      }

      const fileCheck = validateSelectedFiles(filesInput ? filesInput.files : []);
      if (fileCheck.error) {
        showError(fileCheck.error);
        return;
      }

      const messageParts = [
        'Custom playmat commission request',
        '',
        'Game / use: ' + game,
        '',
        'Design:',
        design
      ];
      if (layout) {
        messageParts.push('', 'Layout and extras:', layout);
      }
      messageParts.push('', 'Customer confirmed: 50% before design starts, 50% on delivery.');
      if (fileCheck.files.length) {
        messageParts.push('', 'Attachments included: ' + fileCheck.files.map(function (f) { return f.name; }).join(', '));
      }
      const message = messageParts.join('\n');

      let turnstileToken;
      try {
        turnstileToken = await getTurnstileToken();
      } catch (err) {
        showError('Security check failed. Please refresh and try again.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = fileCheck.files.length ? 'Preparing files...' : 'Sending...';

      let attachments = [];
      try {
        if (fileCheck.files.length) {
          attachments = await buildAttachments(fileCheck.files);
        }
      } catch (err) {
        showError('Could not read one of the attached files. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send commission request';
        return;
      }

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
            turnstileToken: turnstileToken,
            attachments: attachments
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
            send_failed: data.message || 'Could not send your request. Please try again later.',
            invalid_attachment: data.message || 'One or more attachments could not be accepted.',
            attachment_too_large: data.message || 'One or more attachments are too large.',
            too_many_attachments: data.message || 'Please attach fewer files.'
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
