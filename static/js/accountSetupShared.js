// Shared utilities for account setup (used by both modal and standalone page)

window.__DB_API_BASE = window.__DB_API_BASE || 'https://dicebastion-memberships.ncalamaro.workers.dev';
const API_BASE = window.__DB_API_BASE;

/**
 * Calculate password strength (0-4)
 */
window.calculatePasswordStrength = function(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  return Math.min(strength, 4);
};

/**
 * Get password strength display info
 */
window.getPasswordStrengthInfo = function(strength) {
  const colors = ['#ef4444', '#f59e0b', '#eab308', '#5374a5'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return {
    color: colors[strength - 1] || '#6b7280',
    label: labels[strength - 1] || 'Weak'
  };
};

/**
 * Update password strength UI
 */
window.updatePasswordStrengthUI = function(password, strengthDiv, strengthText, strengthBars) {
  if (password.length === 0) {
    strengthDiv.style.display = 'none';
    return;
  }

  strengthDiv.style.display = 'block';
  const strength = window.calculatePasswordStrength(password);
  const info = window.getPasswordStrengthInfo(strength);

  // Reset all bars
  strengthBars.forEach(bar => bar.style.background = '#e5e7eb');

  // Fill bars based on strength
  for (let i = 0; i < strength; i++) {
    strengthBars[i].style.background = info.color;
  }

  strengthText.textContent = `Password strength: ${info.label}`;
  strengthText.style.color = info.color;
};

/**
 * Validate password and confirmation
 */
window.validatePassword = function(password, confirmPassword) {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (confirmPassword && password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  return { valid: true };
};

/**
 * Validate privacy policy consent
 */
window.validatePrivacyConsent = function(privacyConsent) {
  if (!privacyConsent) {
    return { valid: false, error: 'You must agree to the privacy policy to continue' };
  }
  return { valid: true };
};

/**
 * Submit account setup form
 */
window.submitAccountSetup = async function(token, password, privacyConsent, consentMarketing) {
  const response = await fetch(`${API_BASE}/account-setup/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      password,
      consent_essential: true,
      consent_marketing: consentMarketing
    })
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    // Handle specific errors
    if (data.error === 'invalid_token') {
      throw new Error('INVALID_TOKEN');
    }
    if (data.error === 'token_expired') {
      throw new Error('This link has expired. Please request a new account setup link.');
    }
    if (data.error === 'password_too_short') {
      throw new Error('Password must be at least 8 characters long');
    }
    if (data.error === 'already_has_password') {
      throw new Error('You already have an account. Please log in instead.');
    }
    throw new Error(data.message || 'Failed to create account');
  }

  return data;
};

/**
 * Generate consent checkboxes HTML
 */
window.getConsentCheckboxesHTML = function(idPrefix = '') {
  const privacyId = idPrefix ? `${idPrefix}-consent-privacy` : 'consent-privacy';
  const marketingId = idPrefix ? `${idPrefix}-consent-marketing` : 'consent-marketing';
  
  return `
    <div style="margin-bottom: 20px;">
      <label style="display: block; font-weight: 600; color: #374151; font-size: 14px; margin-bottom: 8px;">Agreements</label>
      <div style="margin-bottom: 8px;">
        <input type="checkbox" id="${privacyId}" style="margin-right: 8px;" />
        <label for="${privacyId}" style="font-size: 14px; color: #374151;">I agree to the <a href="/privacy-policy" target="_blank" style="color: #5374a5; text-decoration: underline;">privacy policy</a> (required)</label>
      </div>
      <div>
        <input type="checkbox" id="${marketingId}" style="margin-right: 8px;" />
        <label for="${marketingId}" style="font-size: 14px; color: #374151;">I agree to receive marketing emails (discounts, news, and event announcements)</label>
      </div>
    </div>
  `;
};

/**
 * Generate password strength indicator HTML
 */
window.getPasswordStrengthHTML = function(idPrefix = '') {
  const strengthId = idPrefix ? `${idPrefix}-password-strength` : 'password-strength';
  const strengthTextId = idPrefix ? `${idPrefix}-strength-text` : 'strength-text';
  
  return `
    <div id="${strengthId}" style="display: none; margin-bottom: 20px;">
      <div style="display: flex; gap: 4px; margin-bottom: 8px;">
        <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
        <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
        <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
        <div class="strength-bar" style="flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px;"></div>
      </div>
      <p id="${strengthTextId}" style="margin: 0; font-size: 12px; color: #6b7280;"></p>
    </div>
  `;
};
