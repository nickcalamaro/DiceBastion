// Account Setup Flow for Post-Event Registration
// This module handles prompting users to create accounts after event registration/purchase
// Requires: accountSetupShared.js to be loaded first

/**
 * Show account setup prompt modal after event registration
 * @param {string} email - User's email address
 * @param {string} eventName - Name of the event they registered for
 * @param {boolean} isThankYouPage - Whether this is being shown on the thank you page
 */
window.showAccountSetupPrompt = function(email, eventName, isThankYouPage = false) {
  // Don't show if user is already logged in
  if (window.getLoggedInUser && window.getLoggedInUser()?.email) {
    console.log('[Account Setup] User already logged in, skipping prompt');
    return;
  }

  // Check if user has already dismissed this prompt (session storage)
  const dismissKey = `account-setup-dismissed-${email}`;
  if (sessionStorage.getItem(dismissKey)) {
    console.log('[Account Setup] User already dismissed prompt for this session');
    return;
  }

  let accountSetupModal = null;

  // Create modal content
  const modalContent = `
    ${window.createModalHeader('✨', 'One More Step!', 
      `Create your Dice Bastion account to manage your ${isThankYouPage ? 'tickets' : 'registration'}, get exclusive member discounts, and never miss an event!`
    )}

    ${window.createBenefitsList([
      '<strong>Manage all your tickets</strong> in one place',
      '<strong>Early access</strong> to new events',
      '<strong>Member-only discounts</strong> on future tickets',
      '<strong>Event reminders</strong> and updates'
    ])}

    ${window.createEmailBox(email)}

    <div id="account-setup-loading" style="display: none;" class="modal-text-center">
      <div class="loading" style="margin: 0 auto 12px auto;"></div>
      <p class="modal-text-sm">Sending invitation...</p>
    </div>

    <div id="account-setup-error" class="modal-error" style="display: none;"></div>

    <div id="account-setup-actions">
      ${window.createButtonGroup([
        { id: 'account-setup-create', text: 'Create My Account' },
        { id: 'account-setup-skip', text: 'Maybe Later', secondary: true }
      ])}
    </div>

    <div id="account-setup-success" style="display: none;">
      <div class="modal-text-center">
        ${window.createModalHeader('✉️', 'Check Your Email!', 
          `We've sent you a magic link to <strong>${email}</strong>. Click the link in the email to set your password and complete your account setup.`
        )}
        <p class="modal-text-sm"><em>Didn't receive it? Check your spam folder.</em></p>
      </div>
    </div>
  `;

  // Create modal using Modal component
  accountSetupModal = new Modal({
    title: '',
    content: modalContent,
    size: 'md',
    closeOnBackdrop: false,
    onClose: () => {
      sessionStorage.setItem(dismissKey, 'true');
    }
  });

  accountSetupModal.open();

  // Get elements from modal content
  const skipBtn = accountSetupModal.querySelector('#account-setup-skip');
  const createBtn = accountSetupModal.querySelector('#account-setup-create');
  const loading = accountSetupModal.querySelector('#account-setup-loading');
  const error = accountSetupModal.querySelector('#account-setup-error');
  const actions = accountSetupModal.querySelector('#account-setup-actions');

  // Handle skip button
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      sessionStorage.setItem(dismissKey, 'true');
      accountSetupModal.close();
    });
  }

  // Handle create account button
  if (createBtn) {
    createBtn.addEventListener('click', async () => {
      try {
        actions.style.display = 'none';
        error.style.display = 'none';
        showPasswordForm(email, eventName);
      } catch (err) {
        console.error('[Account Setup] Error:', err);
        error.textContent = err.message || 'Something went wrong. Please try again.';
        error.style.display = 'block';
        actions.style.display = 'flex';
      }
    });
  }

  // Function to show password form in the modal
  function showPasswordForm(userEmail, eventName) {
    loading.style.display = 'block';
    
    fetch(`${API_BASE}/account-setup/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, source: 'modal' })
    })
    .then(response => response.json())
    .then(data => {
      if (!data.success || !data.token) {
        throw new Error('Failed to generate setup token');
      }
      
      // Hide loading, update modal content with password form
      loading.style.display = 'none';
      
      // Replace modal content with password form
      const passwordFormHTML = `
        ${window.createModalHeader('🔐', 'Set Your Password', userEmail)}

        <!-- Password Form -->
        <div class="modal-form-group">
          <label class="modal-form-label">Choose a Password</label>
          <input type="password" id="modal-password" placeholder="Enter a secure password" class="modal-form-input" />
          <p class="modal-text-sm">Must be at least 8 characters long</p>
        </div>

        <div class="modal-form-group">
          <label class="modal-form-label">Confirm Password</label>
          <input type="password" id="modal-confirm-password" placeholder="Re-enter your password" class="modal-form-input" />
        </div>

        ${window.getConsentCheckboxesHTML('modal')}

        <!-- Password strength indicator -->
        <div id="modal-password-strength" class="modal-strength-container">
          <div class="modal-strength-bars">
            <div class="modal-strength-bar"></div>
            <div class="modal-strength-bar"></div>
            <div class="modal-strength-bar"></div>
            <div class="modal-strength-bar"></div>
          </div>
          <p id="modal-strength-text" class="modal-strength-text"></p>
        </div>

        <div id="modal-password-error" class="modal-error"></div>

        <button id="modal-submit-password" class="modal-btn modal-btn-primary">Create Account</button>
      `;

      // Update modal content
      accountSetupModal.setContent(passwordFormHTML);

      // Get elements from updated modal content
      const passwordInput = accountSetupModal.querySelector('#modal-password');
      const confirmInput = accountSetupModal.querySelector('#modal-confirm-password');
      const submitBtn = accountSetupModal.querySelector('#modal-submit-password');
      const errorDiv = accountSetupModal.querySelector('#modal-password-error');
      const strengthDiv = accountSetupModal.querySelector('#modal-password-strength');
      const strengthText = accountSetupModal.querySelector('#modal-strength-text');
      const strengthBars = accountSetupModal.querySelectorAll('.modal-strength-bar');

      // Password strength indicator using shared utility
      passwordInput.addEventListener('input', () => {
        window.updatePasswordStrengthUI(
          passwordInput.value,
          strengthDiv,
          strengthText,
          strengthBars
        );
      });

      // Submit password using shared utility
      submitBtn.addEventListener('click', async () => {
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;
        const privacyConsent = document.getElementById('modal-consent-privacy').checked;
        const consentMarketing = document.getElementById('modal-consent-marketing').checked;

        // Validate privacy consent first
        const privacyValidation = window.validatePrivacyConsent(privacyConsent);
        if (!privacyValidation.valid) {
          errorDiv.textContent = privacyValidation.error;
          errorDiv.style.display = 'block';
          return;
        }

        // Validate using shared utility
        const validation = window.validatePassword(password, confirmPassword);
        if (!validation.valid) {
          errorDiv.textContent = validation.error;
          errorDiv.style.display = 'block';
          return;
        }

        // Hide error
        errorDiv.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
        submitBtn.style.opacity = '0.7';

        try {
          await window.submitAccountSetup(data.token, password, privacyConsent, consentMarketing);

          // Success! Show success message
          accountSetupModal.setContent(`
            ${window.createModalHeaderLarge('🎉', 'Account Created!', 
              'Your Dice Bastion account is ready! You can now log in and enjoy member benefits.'
            )}
            <a href="/login" class="modal-btn modal-btn-primary" style="display: inline-block; text-decoration: none;">Log In Now</a>
          `);

          // Auto-close after 5 seconds
          setTimeout(() => accountSetupModal.close(), 5000);

        } catch (err) {
          console.error('[Account Setup] Password submission error:', err);
          errorDiv.textContent = err.message || 'Something went wrong. Please try again.';
          errorDiv.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
          submitBtn.style.opacity = '1';
        }
      });

      // Enter key support
      confirmInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          submitBtn.click();
        }
      });
      
    })
    .catch(err => {
      console.error('[Account Setup] Token generation error:', err);
      loading.style.display = 'none';
      error.textContent = 'Failed to start account setup. Please try again.';
      error.style.display = 'block';
      actions.style.display = 'flex';
    });
  }
};

/**
 * Check if user needs account setup and show prompt
 * Called from thank-you page or event confirmation
 */
window.checkAndPromptAccountSetup = async function(email, eventName) {
  if (!email) {
    console.log('[Account Setup] No email provided, skipping check');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/account-setup/check?email=${encodeURIComponent(email)}`);
    const data = await response.json();

    if (data.needsSetup) {
      console.log('[Account Setup] User needs account setup, showing prompt');
      // Small delay to let the page render first
      setTimeout(() => {
        window.showAccountSetupPrompt(email, eventName, true);
      }, 1000);
    } else {
      console.log('[Account Setup] User already has account or not found');
    }
  } catch (err) {
    console.error('[Account Setup] Failed to check setup status:', err);
    // Silently fail - don't block the user experience
  }
};
