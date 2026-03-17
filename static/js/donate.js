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
      await SumUpCard.mount({
        id: 'donation-sumup-card',
        checkoutId: checkoutId,
        locale: 'en-GB',
        country: 'GB',
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
    } catch (e) {
      console.error('[donate] SumUp widget error:', e);
      $paymentSection.style.display = 'none';
      $formCard.style.display = '';
      showError($donationError, 'Could not load payment widget. Please try again.');
      updateDonateButton();
    }
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

})();
