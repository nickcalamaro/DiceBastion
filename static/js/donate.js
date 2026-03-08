/**
 * Dice Bastion - Donation Page
 * Handles the Pokémon Day Fundraiser donation flow:
 *  - Amount selection (presets + custom)
 *  - Donation wall loading
 *  - Progress bar
 *  - SumUp checkout integration
 *  - Payment confirmation polling
 */

(function () {
  'use strict';

  const API_BASE = window.utils.getApiBase();
  const CAMPAIGN = 'pokemon-day-2026';
  const MILESTONES = [100, 200, 300, 500, 750, 1000];
  const EVENT_ID = 51;

  function getCurrentGoal(total) {
    for (const m of MILESTONES) {
      if (total < m) return m;
    }
    return MILESTONES[MILESTONES.length - 1];
  }

  let selectedAmount = null;
  let currentCheckoutId = null;

  // ───────── DOM refs ─────────
  const $totalRaised = document.getElementById('total-raised');
  const $donationCount = document.getElementById('donation-count');
  const $progressBar = document.getElementById('progress-bar');
  const $customAmount = document.getElementById('custom-amount');
  const $donorName = document.getElementById('donor-name');
  const $donorEmail = document.getElementById('donor-email');
  const $donorMessage = document.getElementById('donor-message');
  const $showName = document.getElementById('show-name');
  const $showMessage = document.getElementById('show-message');
  const $privacyConsent = document.getElementById('privacy-consent');
  const $donateBtn = document.getElementById('donate-btn');
  const $amountError = document.getElementById('amount-error');
  const $donationError = document.getElementById('donation-error');
  const $donationStatus = document.getElementById('donation-status');
  const $formCard = document.getElementById('donation-form-card');
  const $paymentSection = document.getElementById('sumup-payment-section');
  const $paymentProcessing = document.getElementById('payment-processing');
  const $thankYou = document.getElementById('donation-thank-you');
  const $tyAmount = document.getElementById('ty-amount');
  const $wallEmpty = document.getElementById('donation-wall-empty');
  const $wallList = document.getElementById('donation-wall-list');
  const $charCount = document.getElementById('message-char-count');

  // ───────── Init ─────────
  loadDonationWall();
  initAmountButtons();
  initFormEvents();
  initSaveTheDate();

  // ───────── Donation Wall & Progress ─────────
  async function loadDonationWall() {
    try {
      const res = await fetch(`${API_BASE}/donations/wall?campaign=${CAMPAIGN}`);
      const data = await res.json();
      if (!data.ok) return;

      // Update progress
      const total = parseFloat(data.total_raised) || 0;
      const goal = getCurrentGoal(total);
      animateValue($totalRaised, 0, total, 1200, v => `£${v.toFixed(2)}`);
      $donationCount.textContent = data.donation_count || 0;

      // Show current goal
      const $goalLabel = document.getElementById('goal-label');
      if ($goalLabel) $goalLabel.textContent = `Goal: £${goal}`;

      const pct = Math.min((total / goal) * 100, 100);
      setTimeout(() => { $progressBar.style.width = pct + '%'; }, 200);

      // Render messages
      const msgs = data.messages || [];
      if (msgs.length === 0) {
        $wallEmpty.style.display = '';
        $wallList.innerHTML = '';
        return;
      }

      $wallEmpty.style.display = 'none';
      $wallList.innerHTML = msgs.map(m => {
        const name = m.name ? window.utils.escapeHtml(m.name) : 'Anonymous';
        const initials = name === 'Anonymous' ? '🎁' : name.charAt(0).toUpperCase();
        const message = m.message ? window.utils.escapeHtml(m.message) : '';
        const amount = parseFloat(m.amount) || 0;
        const timeAgo = formatTimeAgo(m.created_at);

        return `
          <div class="donate-wall-item">
            <div class="donate-wall-avatar">${initials}</div>
            <div class="donate-wall-content">
              <div class="donate-wall-header">
                <span class="donate-wall-name">${name}</span>
                <span class="donate-wall-amount">£${amount.toFixed(2)}</span>
              </div>
              ${message ? `<div class="donate-wall-message">${message}</div>` : ''}
              <div class="donate-wall-time">${timeAgo}</div>
            </div>
          </div>`;
      }).join('');
    } catch (err) {
      console.error('[donate] Failed to load wall:', err);
    }
  }

  // ───────── Amount Selection ─────────
  function initAmountButtons() {
    const btns = document.querySelectorAll('.donate-amount-btn');
    const $customToggle = document.getElementById('custom-amount-toggle');
    const $customWrapper = document.getElementById('custom-amount-wrapper');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Skip the "Other" toggle – handled separately
        if (btn === $customToggle) return;

        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAmount = Number(btn.dataset.amount);
        $customAmount.value = '';
        $customWrapper.style.display = 'none';
        hideError($amountError);
        updateDonateButton();
      });
    });

    // "Other" button toggles the custom input
    $customToggle.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      $customToggle.classList.add('active');
      $customWrapper.style.display = '';
      selectedAmount = null;
      $customAmount.value = '';
      $customAmount.focus();
      hideError($amountError);
      updateDonateButton();
    });

    $customAmount.addEventListener('input', () => {
      const val = parseFloat($customAmount.value);
      selectedAmount = (val && val >= 1) ? val : null;
      hideError($amountError);
      updateDonateButton();
    });
  }

  // ───────── Form Events ─────────
  function initFormEvents() {
    $donorMessage.addEventListener('input', () => {
      $charCount.textContent = $donorMessage.value.length;
    });

    $privacyConsent.addEventListener('change', updateDonateButton);

    $donateBtn.addEventListener('click', handleDonate);
  }

  function updateDonateButton() {
    const hasAmount = selectedAmount && selectedAmount >= 1;
    const hasConsent = $privacyConsent.checked;
    $donateBtn.disabled = !(hasAmount && hasConsent);

    if (hasAmount) {
      $donateBtn.textContent = `🎁 Donate £${Number(selectedAmount).toFixed(2)}`;
    } else {
      $donateBtn.textContent = '🎁 Donate Now';
    }
  }

  // ───────── Donate Handler ─────────
  async function handleDonate() {
    hideError($donationError);
    hideError($donationStatus);
    hideError($amountError);

    if (!selectedAmount || selectedAmount < 1) {
      showError($amountError, 'Please select or enter a donation amount.');
      return;
    }

    if (!$privacyConsent.checked) {
      showError($donationError, 'Please accept the privacy policy to continue.');
      return;
    }

    $donateBtn.disabled = true;
    $donateBtn.textContent = 'Processing...';

    try {
      const idemKey = window.utils.generateIdempotencyKey();
      const body = {
        amount: selectedAmount,
        name: $donorName.value.trim() || null,
        email: $donorEmail.value.trim() || null,
        message: $donorMessage.value.trim() || null,
        showName: $showName.checked,
        showMessage: $showMessage.checked,
        privacyConsent: true,
        turnstileToken: null
      };

      const res = await fetch(`${API_BASE}/donations/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idemKey
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || 'Failed to create checkout');
      }

      currentCheckoutId = data.checkoutId;
      const orderRef = data.orderRef;

      // Show payment section, hide form
      $formCard.style.display = 'none';
      $paymentSection.style.display = '';
      $paymentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Mount SumUp widget
      await mountSumUpWidget(data.checkoutId, orderRef);

    } catch (err) {
      console.error('[donate] Checkout error:', err);
      showError($donationError, err.message || 'Something went wrong. Please try again.');
      $donateBtn.disabled = false;
      updateDonateButton();
    }
  }

  // ───────── SumUp Widget ─────────
  async function mountSumUpWidget(checkoutId, orderRef) {
    try {
      await window.utils.loadSumUpSdk();
    } catch (e) {
      showError($donationError, 'Failed to load payment system. Please refresh and try again.');
      $formCard.style.display = '';
      $paymentSection.style.display = 'none';
      return;
    }

    window.SumUpCard.mount({
      id: 'donation-sumup-card',
      checkoutId: checkoutId,
      onResponse: async function (type, body) {
        console.log('[donate] SumUp response:', type, body);

        if (type === 'sent' || type === 'success') {
          $paymentProcessing.style.display = '';

          // Poll for confirmation
          await window.utils.pollPaymentConfirmation('/donations/confirm', orderRef, {
            maxAttempts: 80,
            pollInterval: 2000,
            onSuccess: (data) => {
              showThankYou(data.amount, data.currency);
            },
            onError: (msg) => {
              $paymentProcessing.style.display = 'none';
              $paymentSection.style.display = 'none';
              $formCard.style.display = '';
              showError($donationError, msg);
              updateDonateButton();
            },
            onTimeout: () => {
              showThankYou(String(selectedAmount), 'GBP');
            }
          });
        } else if (type === 'error' || type === 'fail') {
          $paymentSection.style.display = 'none';
          $formCard.style.display = '';
          showError($donationError, 'Payment failed. Please check your card details and try again.');
          updateDonateButton();
        } else if (type === 'cancel') {
          $paymentSection.style.display = 'none';
          $formCard.style.display = '';
          showInfo($donationStatus, 'Payment cancelled. You can try again when you\'re ready.');
          updateDonateButton();
        }
      }
    });
  }

  // ───────── Thank You ─────────
  function showThankYou(amount, currency) {
    $paymentSection.style.display = 'none';
    $formCard.style.display = 'none';
    $thankYou.style.display = '';
    $tyAmount.textContent = `£${parseFloat(amount).toFixed(2)}`;
    $thankYou.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Reload the wall data after a short delay
    setTimeout(() => loadDonationWall(), 1500);
  }

  // ───────── Helpers ─────────
  function showError(el, msg) {
    el.textContent = msg;
    el.style.display = '';
  }

  function hideError(el) {
    el.textContent = '';
    el.style.display = 'none';
  }

  function showInfo(el, msg) {
    el.textContent = msg;
    el.style.display = '';
  }

  function animateValue(el, start, end, duration, formatter) {
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      el.textContent = formatter(current);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function formatTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  // ───────── Save the Date / Event Registration ─────────
  function initSaveTheDate() {
    const $btn = document.getElementById('save-date-btn');
    const $registered = document.getElementById('save-date-registered');
    const $modal = document.getElementById('reg-modal');
    const $closeBtn = document.getElementById('reg-modal-close');
    const $loggedIn = document.getElementById('reg-logged-in');
    const $guest = document.getElementById('reg-guest');
    const $userEmail = document.getElementById('reg-user-email');
    const $confirmLogged = document.getElementById('reg-confirm-logged');
    const $confirmGuest = document.getElementById('reg-confirm-guest');
    const $switchAccount = document.getElementById('reg-switch-account');
    const $regName = document.getElementById('reg-name');
    const $regEmail = document.getElementById('reg-email');
    const $regError = document.getElementById('reg-error');
    const $regDonateScreen = document.getElementById('reg-donate-screen');
    const $regNoThanks = document.getElementById('reg-no-thanks');

    // Modal donation form refs
    const $modalDonateBtn = document.getElementById('modal-donate-btn');
    const $modalCustomToggle = document.getElementById('modal-custom-toggle');
    const $modalCustomWrapper = document.getElementById('modal-custom-wrapper');
    const $modalCustomAmount = document.getElementById('modal-custom-amount');
    const $modalDonorName = document.getElementById('modal-donor-name');
    const $modalDonorEmail = document.getElementById('modal-donor-email');
    const $modalDonorMessage = document.getElementById('modal-donor-message');
    const $modalShowName = document.getElementById('modal-show-name');
    const $modalShowMessage = document.getElementById('modal-show-message');
    const $modalPrivacy = document.getElementById('modal-privacy');
    const $modalDonateError = document.getElementById('modal-donate-error');
    let modalSelectedAmount = null;

    if (!$btn) return;

    // Open modal
    $btn.addEventListener('click', () => {
      $regError.style.display = 'none';
      $regDonateScreen.style.display = 'none';
      $modal.style.display = 'flex';

      const user = window.utils.session ? window.utils.session.getUser() : null;
      const isLoggedIn = user && user.email;

      if (isLoggedIn) {
        $userEmail.textContent = user.email;
        $loggedIn.style.display = '';
        $guest.style.display = 'none';
      } else {
        $loggedIn.style.display = 'none';
        $guest.style.display = '';
      }
    });

    // Close modal
    $closeBtn.addEventListener('click', closeRegModal);
    $modal.addEventListener('click', (e) => {
      if (e.target === $modal) closeRegModal();
    });

    // Switch to guest form
    $switchAccount.addEventListener('click', () => {
      $loggedIn.style.display = 'none';
      $guest.style.display = '';
    });

    // Logged-in user confirm
    $confirmLogged.addEventListener('click', async () => {
      $regError.style.display = 'none';
      const user = window.utils.session.getUser();
      const name = user.name || user.email.split('@')[0];
      $confirmLogged.disabled = true;
      $confirmLogged.textContent = 'Registering…';
      await submitRegistration(user.email, name);
      $confirmLogged.disabled = false;
      $confirmLogged.textContent = 'Complete Registration';
    });

    // Guest confirm
    $confirmGuest.addEventListener('click', async () => {
      $regError.style.display = 'none';
      const name = $regName.value.trim();
      const email = $regEmail.value.trim();
      if (!name) { showRegError('Please enter your name.'); return; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showRegError('Please enter a valid email.'); return;
      }
      $confirmGuest.disabled = true;
      $confirmGuest.textContent = 'Registering…';
      await submitRegistration(email, name);
      $confirmGuest.disabled = false;
      $confirmGuest.textContent = 'Complete Registration';
    });

    async function submitRegistration(email, name) {
      try {
        const resp = await fetch(`${API_BASE}/events/${EVENT_ID}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, turnstileToken: null })
        });
        const data = await resp.json();
        if (!resp.ok) {
          showRegError(data?.message || data?.error || 'Registration failed.');
          return;
        }
        if (data.success || data.registered || data.already_registered) {
          if (data.needsAccountSetup && data.userEmail) {
            sessionStorage.setItem('pendingAccountSetup', JSON.stringify({
              email: data.userEmail,
              eventName: data.eventName || 'Pokémon Day Fundraiser'
            }));
          }
          const ticketId = data.ticketId || Date.now();
          const regRef = `REG-${EVENT_ID}-${ticketId}`;
          const thankYouUrl = '/thank-you?orderRef=' + encodeURIComponent(regRef);

          // Hide registration screens, show donation form
          $regError.style.display = 'none';
          $loggedIn.style.display = 'none';
          $guest.style.display = 'none';
          $regDonateScreen.style.display = '';

          // Pre-fill name/email from registration
          $modalDonorName.value = name || '';
          $modalDonorEmail.value = email || '';

          // Update the save-the-date button behind the modal
          $btn.style.display = 'none';
          $registered.style.display = '';

          // Wire up "No thanks"
          $regNoThanks.onclick = () => { window.location.href = thankYouUrl; };

          // Init the modal donation form
          initModalDonationForm(thankYouUrl);
        } else {
          showRegError('Registration failed. Please try again.');
        }
      } catch (err) {
        showRegError('Network error. Please check your connection.');
      }
    }

    function initModalDonationForm(thankYouUrl) {
      const amtBtns = document.querySelectorAll('.donate-modal-amt');

      amtBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn === $modalCustomToggle) return;
          amtBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          modalSelectedAmount = Number(btn.dataset.amount);
          $modalCustomAmount.value = '';
          $modalCustomWrapper.style.display = 'none';
          hideError($modalDonateError);
          updateModalDonateButton();
        });
      });

      $modalCustomToggle.addEventListener('click', () => {
        amtBtns.forEach(b => b.classList.remove('active'));
        $modalCustomToggle.classList.add('active');
        $modalCustomWrapper.style.display = '';
        modalSelectedAmount = null;
        $modalCustomAmount.value = '';
        $modalCustomAmount.focus();
        updateModalDonateButton();
      });

      $modalCustomAmount.addEventListener('input', () => {
        const val = parseFloat($modalCustomAmount.value);
        modalSelectedAmount = (val && val >= 1) ? val : null;
        updateModalDonateButton();
      });

      $modalPrivacy.addEventListener('change', updateModalDonateButton);
      $modalDonateBtn.addEventListener('click', handleModalDonate);
    }

    function updateModalDonateButton() {
      const hasAmount = modalSelectedAmount && modalSelectedAmount >= 1;
      const hasConsent = $modalPrivacy.checked;
      $modalDonateBtn.disabled = !(hasAmount && hasConsent);
      if (hasAmount) {
        $modalDonateBtn.textContent = `🎁 Donate £${Number(modalSelectedAmount).toFixed(2)}`;
      } else {
        $modalDonateBtn.textContent = '🎁 Donate Now';
      }
    }

    async function handleModalDonate() {
      hideError($modalDonateError);

      if (!modalSelectedAmount || modalSelectedAmount < 1) {
        showError($modalDonateError, 'Please select or enter a donation amount.');
        return;
      }
      if (!$modalPrivacy.checked) {
        showError($modalDonateError, 'Please accept the privacy policy to continue.');
        return;
      }

      $modalDonateBtn.disabled = true;
      $modalDonateBtn.textContent = 'Processing...';

      try {
        const idemKey = window.utils.generateIdempotencyKey();
        const body = {
          amount: modalSelectedAmount,
          name: $modalDonorName.value.trim() || null,
          email: $modalDonorEmail.value.trim() || null,
          message: $modalDonorMessage.value.trim() || null,
          showName: $modalShowName.checked,
          showMessage: $modalShowMessage.checked,
          privacyConsent: true,
          turnstileToken: null
        };

        const res = await fetch(`${API_BASE}/donations/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idemKey
          },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.message || data.error || 'Failed to create checkout');
        }

        // Close the registration modal, switch to the main-page payment section
        closeRegModal();
        $formCard.style.display = 'none';
        $paymentSection.style.display = '';
        $paymentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

        await mountSumUpWidget(data.checkoutId, data.orderRef);

      } catch (err) {
        console.error('[donate] Modal checkout error:', err);
        showError($modalDonateError, err.message || 'Something went wrong. Please try again.');
        $modalDonateBtn.disabled = false;
        updateModalDonateButton();
      }
    }

    function closeRegModal() {
      $modal.style.display = 'none';
    }

    function showRegError(msg) {
      $regError.textContent = msg;
      $regError.style.display = '';
    }
  }
})();
