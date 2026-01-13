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

  const modalHTML = `
    <div id="account-setup-modal" class="modal-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
      backdrop-filter: blur(4px);
    ">
      <div class="modal-content" style="
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        position: relative;
      ">
        <!-- Close button -->
        <button id="account-setup-close" style="
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'">×</button>

        <!-- Icon -->
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #b2c6df 0%, #5374a5 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            font-size: 32px;
          ">✨</div>
        </div>

        <!-- Heading -->
        <h2 style="
          margin: 0 0 12px 0;
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          color: #1f2937;
        ">One More Step!</h2>

        <p style="
          margin: 0 0 24px 0;
          font-size: 16px;
          text-align: center;
          color: #6b7280;
          line-height: 1.6;
        ">Create your Dice Bastion account to manage your ${isThankYouPage ? 'tickets' : 'registration'}, get exclusive member discounts, and never miss an event!</p>

        <!-- Benefits list -->
        <div style="
          background: #f9fafb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        ">
          <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 10px;">
              <span style="color: #5374a5; font-size: 20px;">✓</span>
              <span style="color: #374151; font-size: 14px;"><strong>Manage all your tickets</strong> in one place</span>
            </div>
            <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 10px;">
              <span style="color: #5374a5; font-size: 20px;">✓</span>
              <span style="color: #374151; font-size: 14px;"><strong>Early access</strong> to new events</span>
            </div>
            <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 10px;">
              <span style="color: #5374a5; font-size: 20px;">✓</span>
              <span style="color: #374151; font-size: 14px;"><strong>Member-only discounts</strong> on future tickets</span>
            </div>
            <div style="display: flex; align-items: start; gap: 12px;">
              <span style="color: #5374a5; font-size: 20px;">✓</span>
              <span style="color: #374151; font-size: 14px;"><strong>Event reminders</strong> and updates</span>
            </div>
          </div>
        </div>

        <!-- Email display -->
        <div style="
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 24px;
        ">
          <div style="font-size: 12px; color: #1e40af; font-weight: 600; margin-bottom: 4px;">YOUR EMAIL</div>
          <div style="font-size: 15px; color: #1e3a8a; font-weight: 500;">${email}</div>
        </div>

        <!-- Loading state (hidden initially) -->
        <div id="account-setup-loading" style="display: none; text-align: center; margin: 20px 0;">
          <div class="spinner" style="
            border: 3px solid rgba(0,0,0,0.1);
            border-left-color: #5374a5;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            animation: spin 1s linear infinite;
            margin: 0 auto 12px auto;
          "></div>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Sending invitation...</p>
        </div>

        <!-- Error message (hidden initially) -->
        <div id="account-setup-error" style="
          display: none;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        "></div>

        <!-- Action buttons -->
        <div id="account-setup-actions" style="display: flex; gap: 12px; flex-direction: column;">
          <button id="account-setup-create" style="
            background: linear-gradient(135deg, #b2c6df 0%, #5374a5 100%);
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(83, 116, 165, 0.3);
          " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(83, 116, 165, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(83, 116, 165, 0.3)'">
            Create My Account
          </button>
          
          <button id="account-setup-skip" style="
            background: transparent;
            color: #6b7280;
            border: 1px solid #d1d5db;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.background='#f9fafb'; this.style.color='#374151'" onmouseout="this.style.background='transparent'; this.style.color='#6b7280'">
            Maybe Later
          </button>
        </div>

        <!-- Success message (hidden initially) -->
        <div id="account-setup-success" style="display: none;">
          <div style="text-align: center;">
            <div style="
              width: 64px;
              height: 64px;
              background: #e0f2fe;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px auto;
              font-size: 32px;
            ">✉️</div>
            <h3 style="margin: 0 0 12px 0; color: #5374a5; font-size: 20px; font-weight: 700;">Check Your Email!</h3>
            <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
              We've sent you a magic link to <strong style="color: #374151;">${email}</strong>. 
              Click the link in the email to set your password and complete your account setup.
            </p>
            <p style="margin: 16px 0 0 0; font-size: 13px; color: #9ca3af;">
              <em>Didn't receive it? Check your spam folder.</em>
            </p>
          </div>
        </div>
      </div>
    </div>

    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        #account-setup-modal .modal-content {
          background: #1f2937 !important;
          color: #f9fafb !important;
        }
        #account-setup-modal h2 {
          color: #f9fafb !important;
        }
        #account-setup-modal p {
          color: #d1d5db !important;
        }
      }
    </style>
  `;

  // Insert modal into DOM
  const modalDiv = document.createElement('div');
  modalDiv.innerHTML = modalHTML;
  document.body.appendChild(modalDiv.firstElementChild);

  const modal = document.getElementById('account-setup-modal');
  const closeBtn = document.getElementById('account-setup-close');
  const skipBtn = document.getElementById('account-setup-skip');
  const createBtn = document.getElementById('account-setup-create');
  const loading = document.getElementById('account-setup-loading');
  const error = document.getElementById('account-setup-error');
  const actions = document.getElementById('account-setup-actions');
  const success = document.getElementById('account-setup-success');

  // Close modal function
  const closeModal = () => {
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.remove();
      }, 200);
    }
  };

  // Handle close button
  closeBtn.addEventListener('click', () => {
    sessionStorage.setItem(dismissKey, 'true');
    closeModal();
  });

  // Handle skip button
  skipBtn.addEventListener('click', () => {
    sessionStorage.setItem(dismissKey, 'true');
    closeModal();
  });

  // Handle create account button - Show password form instead of sending email
  createBtn.addEventListener('click', async () => {
    try {
      // Hide initial view, show password form
      actions.style.display = 'none';
      error.style.display = 'none';
      
      // Show password form
      showPasswordForm(email, eventName);
      
    } catch (err) {
      console.error('[Account Setup] Error:', err);
      error.textContent = err.message || 'Something went wrong. Please try again.';
      error.style.display = 'block';
      actions.style.display = 'flex';
    }
  });

  // Function to show password form in the modal
  function showPasswordForm(userEmail, eventName) {
    // First, request a token from the backend
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
      
      // Hide loading, show password form
      loading.style.display = 'none';
      
      // Replace modal content with password form
      const modalContent = modal.querySelector('.modal-content');
      modalContent.innerHTML = `
        <!-- Close button -->
        <button id="account-setup-close-2" style="
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'">×</button>

        <!-- Icon -->
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #b2c6df 0%, #5374a5 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            font-size: 32px;
          ">🔐</div>
        </div>

        <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; text-align: center; color: #1f2937;">
          Set Your Password
        </h2>
        <p style="margin: 0 0 24px 0; font-size: 14px; text-align: center; color: #6b7280;">
          ${userEmail}
        </p>


        <!-- Password Form -->
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
            Choose a Password
          </label>
          <input 
            type="password" 
            id="modal-password" 
            placeholder="Enter a secure password"
            style="
              width: 100%;
              padding: 12px 16px;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              font-size: 15px;
              box-sizing: border-box;
            "
          />
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #6b7280;">
            Must be at least 8 characters long
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
            Confirm Password
          </label>
          <input 
            type="password" 
            id="modal-confirm-password" 
            placeholder="Re-enter your password"
            style="
              width: 100%;
              padding: 12px 16px;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              font-size: 15px;
              box-sizing: border-box;
            "
          />
        </div>

        ${window.getConsentCheckboxesHTML('modal')}

        <!-- Password strength indicator -->
        <div id="modal-password-strength" style="display: none; margin-bottom: 20px;">
          <div style="display: flex; gap: 4px; margin-bottom: 8px;">
            <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
            <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
            <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
            <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
          </div>
          <p id="modal-strength-text" style="margin: 0; font-size: 12px; color: #6b7280;"></p>
        </div>

        <!-- Error message -->
        <div id="modal-password-error" style="
          display: none;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        "></div>

        <!-- Submit button -->
        <button 
          id="modal-submit-password"
          style="
            width: 100%;
            background: linear-gradient(135deg, #b2c6df 0%, #5374a5 100%);
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(83, 116, 165, 0.3);
          "
          onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(16, 185, 129, 0.4)'"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)'"
        >
          Create Account
        </button>
      `;

      // Add event listeners for new form
      const closeBtn2 = document.getElementById('account-setup-close-2');
      const passwordInput = document.getElementById('modal-password');
      const confirmInput = document.getElementById('modal-confirm-password');
      const submitBtn = document.getElementById('modal-submit-password');
      const errorDiv = document.getElementById('modal-password-error');
      const strengthDiv = document.getElementById('modal-password-strength');
      const strengthText = document.getElementById('modal-strength-text');
      const strengthBars = modalContent.querySelectorAll('.strength-bar');

      closeBtn2.addEventListener('click', closeModal);

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
          modalContent.innerHTML = `
            <div style="text-align: center;">
              <div style="
                width: 80px;
                height: 80px;
                background: #e0f2fe;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px auto;
                font-size: 40px;
              ">🎉</div>
              <h2 style="margin: 0 0 12px 0; color: #5374a5; font-size: 24px; font-weight: 700;">
                Account Created!
              </h2>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                Your Dice Bastion account is ready! You can now log in and enjoy member benefits.
              </p>
              <a href="/login" style="
                display: inline-block;
                background: linear-gradient(135deg, #b2c6df 0%, #5374a5 100%);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.2s;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
              " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                Log In Now
              </a>
            </div>
          `;

          // Auto-close after 5 seconds
          setTimeout(closeModal, 5000);

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

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      sessionStorage.setItem(dismissKey, 'true');
      closeModal();
    }
  });

  // Fade in animation
  modal.style.opacity = '0';
  modal.style.transition = 'opacity 0.2s';
  setTimeout(() => {
    modal.style.opacity = '1';
  }, 10);
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
