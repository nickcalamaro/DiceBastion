// Shared utilities for account setup (used by both modal and standalone page)
// Depends on: utils.js

const API_BASE = utils.getApiBase();

/**
 * HTML Template Builders - Generate common modal patterns
 */

// Create icon header section
window.createModalHeader = function(icon, heading, text) {
  return `
    <div class="modal-icon-container">
      <div class="modal-icon">${icon}</div>
    </div>
    <h2 class="modal-heading">${heading}</h2>
    ${text ? `<p class="modal-text">${text}</p>` : ''}
  `;
};

// Create large icon header (for success states)
window.createModalHeaderLarge = function(icon, heading, text) {
  return `
    <div class="modal-text-center">
      <div class="modal-icon-container">
        <div class="modal-icon modal-icon-lg modal-icon-success">${icon}</div>
      </div>
      <h2 class="modal-subheading">${heading}</h2>
      ${text ? `<p class="modal-text">${text}</p>` : ''}
    </div>
  `;
};

// Create benefits list
window.createBenefitsList = function(benefits) {
  const items = benefits.map(benefit => 
    `<div class="modal-benefit-item">
      <span class="modal-benefit-icon">✓</span>
      <span class="modal-benefit-text">${benefit}</span>
    </div>`
  ).join('');
  
  return `<div class="modal-benefits">${items}</div>`;
};

// Create email display box
window.createEmailBox = function(email) {
  return `
    <div class="modal-email-box">
      <div class="modal-email-label">YOUR EMAIL</div>
      <div class="modal-email-value">${email}</div>
    </div>
  `;
};

// Create button group
window.createButtonGroup = function(buttons) {
  const buttonHTML = buttons.map(btn => {
    const btnClass = btn.secondary ? 'modal-btn modal-btn-secondary' : 'modal-btn modal-btn-primary';
    const type = btn.type || 'button';
    return `<button id="${btn.id}" class="${btnClass}" type="${type}">${btn.text}</button>`;
  }).join('\n');
  
  return `<div class="modal-actions">${buttonHTML}</div>`;
};

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
    <div class="mb-3">
      <label class="form-label">Agreements</label>
      <div class="checkbox-group mb-1">
        <input type="checkbox" id="${privacyId}" class="checkbox-input" />
        <label for="${privacyId}" class="checkbox-label text-sm">I agree to the <a href="/privacy-policy" target="_blank" class="link">privacy policy</a> (required)</label>
      </div>
      <div class="checkbox-group">
        <input type="checkbox" id="${marketingId}" class="checkbox-input" />
        <label for="${marketingId}" class="checkbox-label text-sm">I agree to receive marketing emails (discounts, news, and event announcements)</label>
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
    <div id="${strengthId}" class="modal-strength-container">
      <div class="modal-strength-bars">
        <div class="modal-strength-bar"></div>
        <div class="modal-strength-bar"></div>
        <div class="modal-strength-bar"></div>
        <div class="modal-strength-bar"></div>
      </div>
      <p id="${strengthTextId}" class="modal-strength-text"></p>
    </div>
  `;
};
