---
title: "Create Your Account"
showDate: false
url: "/account-setup"
layout: "simple"
---

<div id="account-setup-page" class="max-w-md mx-auto py-8">
  <!-- Loading state -->
  <div id="setup-loading" style="text-align: center;">
    <div class="spinner" style="
      border: 4px solid rgba(0,0,0,0.1);
      border-left-color: #10b981;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      animation: spin 1s linear infinite;
      margin: 40px auto 20px auto;
    "></div>
    <p style="color: #6b7280;">Verifying your invitation...</p>
  </div>

  <!-- Main content (hidden initially) -->
  <div id="setup-content" style="display: none;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px auto;
        font-size: 40px;
      ">🔐</div>
      <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #1f2937;">
        Create Your Account
      </h1>
      <p id="setup-email" style="margin: 0; font-size: 16px; color: #6b7280;"></p>
    </div>

    <!-- Form -->
    <form id="setup-form" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="margin-bottom: 24px;">
        <label for="password" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
          Choose a Password
        </label>
        <input 
          type="password" 
          id="password" 
          required 
          minlength="8"
          placeholder="Enter a secure password"
          style="
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            font-size: 15px;
            transition: all 0.2s;
            box-sizing: border-box;
          "
          onfocus="this.style.borderColor='#10b981'; this.style.outline='none'"
          onblur="this.style.borderColor='#d1d5db'"
        />
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #6b7280;">
          Must be at least 8 characters long
        </p>
      </div>

      <div style="margin-bottom: 24px;">
        <label for="confirm-password" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 14px;">
          Confirm Password
        </label>
        <input 
          type="password" 
          id="confirm-password" 
          required 
          minlength="8"
          placeholder="Re-enter your password"
          style="
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            font-size: 15px;
            transition: all 0.2s;
            box-sizing: border-box;
          "
          onfocus="this.style.borderColor='#10b981'; this.style.outline='none'"
          onblur="this.style.borderColor='#d1d5db'"
        />
      </div>

      <!-- Consent Agreements -->
      <div style="margin-bottom: 24px;">
        <label style="display: block; font-weight: 600; color: #374151; font-size: 14px; margin-bottom: 8px;">Agreements</label>
        <div style="margin-bottom: 8px;">
          <input type="checkbox" id="consent-privacy" style="margin-right: 8px;" />
          <label for="consent-privacy" style="font-size: 14px; color: #374151;">I agree to the <a href="/privacy-policy" target="_blank" style="color: #10b981; text-decoration: underline;">privacy policy</a> (required)</label>
        </div>
        <div>
          <input type="checkbox" id="consent-marketing" style="margin-right: 8px;" />
          <label for="consent-marketing" style="font-size: 14px; color: #374151;">I agree to receive marketing emails (discounts, news, and event announcements)</label>
        </div>
      </div>

      <!-- Password strength indicator -->
      <div id="password-strength" style="display: none; margin-bottom: 20px;">
        <div style="display: flex; gap: 4px; margin-bottom: 8px;">
          <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
          <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
          <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
          <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
        </div>
        <p id="strength-text" style="margin: 0; font-size: 12px; color: #6b7280;"></p>
      </div>

      <!-- Error message -->
      <div id="setup-error" style="
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
        type="submit" 
        id="setup-submit"
        style="
          width: 100%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        "
        onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(16, 185, 129, 0.4)'"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)'"
      >
        Create Account
      </button>
    </form>

    <!-- Info box -->
    <div style="
      margin-top: 24px;
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    ">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        By creating an account, you'll be able to manage your tickets, get member discounts, and stay updated on upcoming events.
      </p>
    </div>
  </div>

  <!-- Error state (token invalid/expired) -->
  <div id="setup-invalid" style="display: none; text-align: center;">
    <div style="
      width: 80px;
      height: 80px;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
      font-size: 40px;
    ">⚠️</div>
    <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #991b1b;">
      Invalid or Expired Link
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
      This account setup link is invalid or has expired. Setup links are valid for 24 hours.
    </p>
    <a href="/" style="
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;
    " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
      Return to Home
    </a>
  </div>

  <!-- Success state -->
  <div id="setup-success" style="display: none; text-align: center;">
    <div style="
      width: 80px;
      height: 80px;
      background: #d1fae5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
      font-size: 40px;
    ">🎉</div>
    <h1 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: #10b981;">
      Account Created!
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
      Your Dice Bastion account has been created successfully. You can now log in and manage your tickets, view upcoming events, and enjoy member benefits!
    </p>
    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <a href="/login" style="
        display: inline-block;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(16, 185, 129, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)'">
        Log In Now
      </a>
      <a href="/events" style="
        display: inline-block;
        background: transparent;
        color: #6b7280;
        border: 1px solid #d1d5db;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.2s;
      " onmouseover="this.style.background='#f9fafb'; this.style.color='#374151'" onmouseout="this.style.background='transparent'; this.style.color='#6b7280'">
        Browse Events
      </a>
    </div>
  </div>
</div>

<style>
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    #setup-content form {
      background: #1f2937 !important;
      border-color: #374151 !important;
    }
    #setup-content input {
      background: #111827 !important;
      border-color: #4b5563 !important;
      color: #f9fafb !important;
    }
    #setup-content h1 {
      color: #f9fafb !important;
    }
  }
</style>

<script src="/js/accountSetupShared.js"></script>
<script>
(function() {
  // Get token from URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const loading = document.getElementById('setup-loading');
  const content = document.getElementById('setup-content');
  const invalid = document.getElementById('setup-invalid');
  const success = document.getElementById('setup-success');
  const form = document.getElementById('setup-form');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm-password');
  const submitBtn = document.getElementById('setup-submit');
  const errorDiv = document.getElementById('setup-error');
  const strengthDiv = document.getElementById('password-strength');
  const strengthText = document.getElementById('strength-text');
  const strengthBars = document.querySelectorAll('.strength-bar');

  // Check if token exists
  if (!token) {
    loading.style.display = 'none';
    invalid.style.display = 'block';
    return;
  }

  // Verify token is valid (just show the form - validation happens on submit)
  setTimeout(() => {
    loading.style.display = 'none';
    content.style.display = 'block';
    passwordInput.focus();
  }, 500);

  // Use shared password strength indicator
  passwordInput.addEventListener('input', () => {
    window.updatePasswordStrengthUI(
      passwordInput.value,
      strengthDiv,
      strengthText,
      strengthBars
    );
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    const privacyConsent = document.getElementById('consent-privacy').checked;
    const consentMarketing = document.getElementById('consent-marketing').checked;

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
      if (validation.error.includes('match')) {
        confirmInput.focus();
      } else {
        passwordInput.focus();
      }
      return;
    }

    // Hide error
    errorDiv.style.display = 'none';

    // Disable form
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.style.opacity = '0.7';
    submitBtn.style.cursor = 'not-allowed';

    try {
      // Use shared submit function
      await window.submitAccountSetup(token, password, privacyConsent, consentMarketing);

      // Success! Show success message
      content.style.display = 'none';
      success.style.display = 'block';

    } catch (err) {
      console.error('[Account Setup] Error:', err);
      
      // Handle INVALID_TOKEN specially
      if (err.message === 'INVALID_TOKEN') {
        loading.style.display = 'none';
        content.style.display = 'none';
        invalid.style.display = 'block';
        return;
      }
      
      errorDiv.textContent = err.message || 'Something went wrong. Please try again.';
      errorDiv.style.display = 'block';

      // Re-enable form
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
    }
  });
})();
</script>
