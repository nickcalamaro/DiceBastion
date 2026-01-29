/**
 * Generic Modal Utility
 * Creates and manages styled modals matching the Dice Bastion design system
 */

// Inject modal form styles once
(function injectModalStyles() {
  if (document.getElementById('modal-form-styles')) return;
  const style = document.createElement('style');
  style.id = 'modal-form-styles';
  style.textContent = `
    /* Modal Form Components */
    .modal-form-group {
      margin-bottom: 1rem;
    }
    
    .modal-form-label {
      display: block;
      margin: 0.5rem 0 0.375rem;
      font-weight: 600;
      color: rgb(var(--color-neutral-700));
    }
    
    .dark .modal-form-label {
      color: rgb(var(--color-neutral-300));
    }
    
    .modal-form-input {
      width: 100%;
      padding: 0.625rem;
      border: 1px solid rgb(var(--color-neutral-300));
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s;
      background: rgba(var(--color-neutral), 1);
      color: rgb(var(--color-neutral-800));
    }
    
    .dark .modal-form-input {
      background: rgb(var(--color-neutral-700));
      border-color: rgb(var(--color-neutral-600));
      color: rgb(var(--color-neutral-200));
    }
    
    .modal-form-input:focus {
      outline: none;
      border-color: rgb(var(--color-primary-500));
      box-shadow: 0 0 0 3px rgba(var(--color-primary-500), 0.1);
    }
    
    .modal-info-box {
      background: rgb(var(--color-neutral-50));
      border: 1px solid rgb(var(--color-neutral-200));
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      margin-bottom: 1.5rem;
    }
    
    .dark .modal-info-box {
      background: rgb(var(--color-neutral-800));
      border-color: rgb(var(--color-neutral-600));
    }
    
    .modal-info-box p {
      color: rgb(var(--color-neutral-600));
    }
    
    .dark .modal-info-box p {
      color: rgb(var(--color-neutral-300));
    }
    
    .modal-checkbox-group {
      margin-top: 0.75rem;
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
    }
    
    .modal-checkbox {
      margin-top: 0.1875rem;
      cursor: pointer;
    }
    
    .modal-checkbox-label {
      line-height: 1.4;
      cursor: pointer;
      user-select: none;
      color: rgb(var(--color-neutral-700));
    }
    
    .dark .modal-checkbox-label {
      color: rgb(var(--color-neutral-200));
    }
    
    .modal-btn {
      padding: 0.625rem 0.75rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .modal-btn:hover {
      transform: translateY(-1px);
    }
    
    .modal-btn:active {
      transform: translateY(0);
    }
    
    .modal-btn-primary {
      background: linear-gradient(135deg, #b2c6df 0%, #5374a5 100%);
      color: #fff;
      width: 100%;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
      box-shadow: 0 4px 12px rgba(83, 116, 165, 0.3);
    }
    
    .modal-btn-primary:hover {
      box-shadow: 0 6px 16px rgba(83, 116, 165, 0.4);
    }
    
    .modal-btn-secondary {
      background: transparent;
      color: rgb(var(--color-neutral-600));
      border: 1px solid rgb(var(--color-neutral-300));
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      width: 100%;
    }
    
    .modal-btn-secondary:hover {
      background: rgb(var(--color-neutral-50));
      color: rgb(var(--color-neutral-800));
    }
    
    .dark .modal-btn-secondary {
      color: rgb(var(--color-neutral-300));
      border-color: rgb(var(--color-neutral-700));
    }
    
    .dark .modal-btn-secondary:hover {
      background: rgb(var(--color-neutral-800));
      color: rgb(var(--color-neutral-200));
    }
    
    .modal-btn-danger {
      background: #dc2626;
      color: white;
      width: 100%;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
    
    .modal-btn-danger:hover {
      background: #b91c1c;
      box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
    }
    
    .modal-actions {
      display: flex;
      gap: 0.75rem;
      flex-direction: column;
    }
    
    .modal-error {
      display: none;
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: rgb(var(--color-danger-50));
      color: rgb(var(--color-danger-700));
      border-radius: 0.375rem;
      font-size: 0.9rem;
    }
    
    .dark .modal-error {
      background: rgba(var(--color-danger-900), 0.3);
      color: rgb(var(--color-danger-300));
    }
    
    .modal-link {
      color: rgb(var(--color-primary-600));
      text-decoration: underline;
    }
    
    .dark .modal-link {
      color: rgb(var(--color-primary-400));
    }
    
    .modal-link:hover {
      color: rgb(var(--color-primary-700));
    }
    
    .dark .modal-link:hover {
      color: rgb(var(--color-primary-300));
    }
    
    .modal-section {
      margin-top: 0.75rem;
    }
    
    .modal-help-text {
      font-size: 0.85rem;
      color: rgb(var(--color-neutral-600));
      margin-bottom: 0.375rem;
    }
    
    .dark .modal-help-text {
      color: rgb(var(--color-neutral-400));
    }
    
    .modal-widget-container {
      display: none;
      margin-top: 0.5rem;
    }
    
    /* Modal Icon Styles */
    .modal-icon-container {
      text-align: center;
      margin-bottom: 1.25rem;
    }
    
    .modal-icon {
      width: 4rem;
      height: 4rem;
      background: linear-gradient(135deg, #b2c6df 0%, #5374a5 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      font-size: 2rem;
    }
    
    .modal-icon-lg {
      width: 5rem;
      height: 5rem;
      font-size: 2.5rem;
    }
    
    .modal-icon-success {
      background: rgb(var(--color-success-100));
    }
    
    .dark .modal-icon-success {
      background: rgba(var(--color-success-900), 0.3);
    }
    
    /* Modal Typography */
    .modal-heading {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      color: rgb(var(--color-neutral-900));
    }
    
    .dark .modal-heading {
      color: rgb(var(--color-neutral-100));
    }
    
    .modal-subheading {
      margin: 0 0 0.75rem 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: rgb(var(--color-primary-600));
    }
    
    .dark .modal-subheading {
      color: rgb(var(--color-primary-400));
    }
    
    .modal-text {
      margin: 0 0 1.5rem 0;
      font-size: 0.875rem;
      text-align: center;
      color: rgb(var(--color-neutral-600));
    }
    
    .dark .modal-text {
      color: rgb(var(--color-neutral-300));
    }
    
    .modal-text-sm {
      font-size: 0.813rem;
      color: rgb(var(--color-neutral-600));
      margin: 0.5rem 0 0 0;
    }
    
    .dark .modal-text-sm {
      color: rgb(var(--color-neutral-400));
    }
    
    .modal-text-center {
      text-align: center;
    }
    
    /* Password Strength Indicator */
    .modal-strength-container {
      display: none;
      margin-bottom: 1.25rem;
    }
    
    .modal-strength-bars {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }
    
    .modal-strength-bar {
      flex: 1;
      height: 0.25rem;
      background: rgb(var(--color-neutral-200));
      border-radius: 0.125rem;
    }
    
    .dark .modal-strength-bar {
      background: rgb(var(--color-neutral-700));
    }
    
    .modal-strength-text {
      margin: 0;
      font-size: 0.75rem;
      color: rgb(var(--color-neutral-600));
    }
    
    .dark .modal-strength-text {
      color: rgb(var(--color-neutral-400));
    }
    
    /* Email Display Box */
    .modal-email-box {
      background: rgb(var(--color-primary-50));
      border: 1px solid rgb(var(--color-primary-200));
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      margin-bottom: 1.5rem;
    }
    
    .dark .modal-email-box {
      background: rgba(var(--color-primary-900), 0.2);
      border-color: rgba(var(--color-primary-700), 0.5);
    }
    
    .modal-email-label {
      font-size: 0.75rem;
      color: rgb(var(--color-primary-700));
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .dark .modal-email-label {
      color: rgb(var(--color-primary-400));
    }
    
    .modal-email-value {
      font-size: 0.938rem;
      color: rgb(var(--color-primary-800));
      font-weight: 500;
    }
    
    .dark .modal-email-value {
      color: rgb(var(--color-primary-300));
    }
    
    /* Benefits List */
    .modal-benefits {
      background: rgb(var(--color-neutral-50));
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    
    .dark .modal-benefits {
      background: rgb(var(--color-neutral-900));
    }
    
    .modal-benefit-item {
      display: flex;
      align-items: start;
      gap: 0.75rem;
      margin-bottom: 0.625rem;
    }
    
    .modal-benefit-item:last-child {
      margin-bottom: 0;
    }
    
    .modal-benefit-icon {
      color: rgb(var(--color-primary-600));
      font-size: 1.25rem;
    }
    
    .dark .modal-benefit-icon {
      color: rgb(var(--color-primary-400));
    }
    
    .modal-benefit-text {
      color: rgb(var(--color-neutral-700));
      font-size: 0.875rem;
    }
    
    .dark .modal-benefit-text {
      color: rgb(var(--color-neutral-300));
    }
  `;
  document.head.appendChild(style);
})();

window.Modal = class Modal {
  /**
   * Create a new modal
   * @param {Object} options - Modal configuration
   * @param {string} options.title - Modal title
   * @param {string} options.content - HTML content for modal body
   * @param {string} options.size - Modal size: 'sm' (400px), 'md' (600px), 'lg' (800px), 'xl' (900px)
   * @param {boolean} options.closeOnBackdrop - Close modal when clicking backdrop (default: true)
   * @param {Function} options.onClose - Callback when modal closes
   * @param {string} options.footer - Optional HTML for modal footer
   * @param {string} options.className - Additional CSS class for modal container
   * @param {string} options.headerStyle - Additional inline styles for header
   */
  constructor(options = {}) {
    this.options = {
      title: options.title || '',
      content: options.content || '',
      size: options.size || 'lg',
      closeOnBackdrop: options.closeOnBackdrop !== false,
      onClose: options.onClose || null,
      footer: options.footer || '',
      className: options.className || '',
      headerStyle: options.headerStyle || ''
    };

    this.modal = null;
    this.backdrop = null;
    this.contentEl = null;
    this.bodyEl = null;
    this.isOpen = false;
    
    this._create();
  }

  /**
   * Create modal DOM elements
   * @private
   */
  _create() {
    // Get max width based on size
    const sizes = {
      sm: '400px',
      md: '600px',
      lg: '800px',
      xl: '900px'
    };
    const maxWidth = sizes[this.options.size] || sizes.lg;

    // Create modal container
    this.modal = document.createElement('div');
    this.modal.className = `db-modal ${this.options.className}`;
    this.modal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    `;

    // Create backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'db-modal-backdrop';
    this.backdrop.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      cursor: ${this.options.closeOnBackdrop ? 'pointer' : 'default'};
    `;

    if (this.options.closeOnBackdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }

    // Create content container
    this.contentEl = document.createElement('div');
    this.contentEl.className = 'db-modal-content';
    this.contentEl.style.cssText = `
      background: rgb(var(--color-neutral));
      border-radius: 12px;
      max-width: ${maxWidth};
      width: 100%;
      max-height: 90vh;
      overflow: auto;
      padding: 2rem;
      position: relative;
      z-index: 1;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    `;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'db-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close modal');
    closeBtn.style.cssText = `
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: rgb(var(--color-neutral-600));
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    `;
    closeBtn.addEventListener('click', () => this.close());
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgb(var(--color-neutral-200))';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'transparent';
    });

    // Create header if title provided
    if (this.options.title) {
      const header = document.createElement('h3');
      header.className = 'db-modal-header';
      header.textContent = this.options.title;
      header.style.cssText = `
        margin-top: 0;
        margin-bottom: 1.5rem;
        font-size: 1.5rem;
        font-weight: 600;
        color: rgb(var(--color-neutral-900));
        ${this.options.headerStyle}
      `;
      this.contentEl.appendChild(header);
    }

    // Create body
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'db-modal-body';
    this.bodyEl.innerHTML = this.options.content;
    this.contentEl.appendChild(this.bodyEl);

    // Create footer if provided
    if (this.options.footer) {
      const footer = document.createElement('div');
      footer.className = 'db-modal-footer';
      footer.innerHTML = this.options.footer;
      footer.style.cssText = `
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgb(var(--color-neutral-200));
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      `;
      this.contentEl.appendChild(footer);
    }

    // Assemble modal
    this.contentEl.appendChild(closeBtn);
    this.modal.appendChild(this.backdrop);
    this.modal.appendChild(this.contentEl);

    // Add keyboard listener
    this._handleKeyboard = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
  }

  /**
   * Open the modal
   */
  open() {
    if (this.isOpen) return;

    document.body.appendChild(this.modal);
    
    // Trigger reflow for animation
    this.modal.offsetHeight;
    
    this.modal.style.display = 'flex';
    this.modal.style.animation = 'db-modal-fade-in 0.2s ease';
    this.contentEl.style.animation = 'db-modal-slide-up 0.3s ease';
    
    this.isOpen = true;

    // Add keyboard listener
    document.addEventListener('keydown', this._handleKeyboard);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return this;
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.isOpen) return;

    // Remove keyboard listener
    document.removeEventListener('keydown', this._handleKeyboard);

    // Restore body scroll
    document.body.style.overflow = '';

    // Animate out
    this.modal.style.animation = 'db-modal-fade-out 0.2s ease';
    
    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.isOpen = false;

      // Call onClose callback
      if (this.options.onClose) {
        this.options.onClose();
      }
    }, 200);

    return this;
  }

  /**
   * Update modal content
   * @param {string} content - New HTML content
   */
  setContent(content) {
    if (this.bodyEl) {
      this.bodyEl.innerHTML = content;
    }
    return this;
  }

  /**
   * Update modal title
   * @param {string} title - New title
   */
  setTitle(title) {
    const header = this.contentEl.querySelector('.db-modal-header');
    if (header) {
      header.textContent = title;
    }
    return this;
  }

  /**
   * Show loading state
   * @param {string} message - Loading message (default: "Loading...")
   */
  showLoading(message = 'Loading...') {
    this.setContent(`
      <p style="text-align: center; color: rgb(var(--color-neutral-500)); padding: 2rem;">
        ${utils.escapeHtml(message)}
      </p>
    `);
    return this;
  }

  /**
   * Show error state
   * @param {string} message - Error message
   */
  showError(message) {
    this.setContent(`
      <div style="padding: 1rem; background: #fee; color: #c00; border-radius: 8px; text-align: center;">
        ${utils.escapeHtml(message)}
      </div>
    `);
    return this;
  }

  /**
   * Get element by selector within modal
   * @param {string} selector - CSS selector
   * @returns {Element|null}
   */
  querySelector(selector) {
    return this.contentEl ? this.contentEl.querySelector(selector) : null;
  }

  /**
   * Get all elements by selector within modal
   * @param {string} selector - CSS selector
   * @returns {NodeList}
   */
  querySelectorAll(selector) {
    return this.contentEl ? this.contentEl.querySelectorAll(selector) : [];
  }

  /**
   * Get modal body element for direct manipulation
   * @returns {HTMLElement}
   */
  getBody() {
    return this.bodyEl;
  }

  /**
   * Get modal content container element
   * @returns {HTMLElement}
   */
  getContent() {
    return this.contentEl;
  }

  /**
   * Destroy the modal completely
   */
  destroy() {
    this.close();
    this.modal = null;
    this.backdrop = null;
    this.contentEl = null;
    this.bodyEl = null;
  }
};

// Add CSS animations if not already present
if (!document.getElementById('db-modal-animations')) {
  const style = document.createElement('style');
  style.id = 'db-modal-animations';
  style.textContent = `
    @keyframes db-modal-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes db-modal-fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    @keyframes db-modal-slide-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dark .db-modal-content {
      background: rgb(var(--color-neutral-800)) !important;
    }

    .dark .db-modal-header {
      color: rgb(var(--color-neutral-100)) !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Helper function to create a simple confirmation modal
 * @param {Object} options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Confirmation message
 * @param {string} options.confirmText - Confirm button text (default: "Confirm")
 * @param {string} options.cancelText - Cancel button text (default: "Cancel")
 * @param {Function} options.onConfirm - Callback when confirmed
 * @param {Function} options.onCancel - Callback when cancelled
 * @param {string} options.confirmStyle - 'danger' or 'primary' (default: 'primary')
 */
window.Modal.confirm = function(options = {}) {
  const confirmText = options.confirmText || 'Confirm';
  const cancelText = options.cancelText || 'Cancel';
  const confirmStyle = options.confirmStyle || 'primary';
  
  const confirmBtnColor = confirmStyle === 'danger' 
    ? 'background: #dc2626; color: white;' 
    : 'background: rgb(var(--color-primary-600)); color: white;';

  const modal = new Modal({
    title: options.title || 'Confirm',
    size: 'sm',
    content: `<p style="color: rgb(var(--color-neutral-700));">${options.message || 'Are you sure?'}</p>`,
    footer: `
      <button class="db-modal-cancel" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-700)); border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
        ${cancelText}
      </button>
      <button class="db-modal-confirm" style="padding: 0.75rem 1.5rem; ${confirmBtnColor} border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
        ${confirmText}
      </button>
    `,
    closeOnBackdrop: false
  });

  modal.open();

  // Add event listeners
  const confirmBtn = modal.contentEl.querySelector('.db-modal-confirm');
  const cancelBtn = modal.contentEl.querySelector('.db-modal-cancel');

  confirmBtn.addEventListener('click', () => {
    modal.close();
    if (options.onConfirm) options.onConfirm();
  });

  cancelBtn.addEventListener('click', () => {
    modal.close();
    if (options.onCancel) options.onCancel();
  });

  return modal;
};

/**
 * Helper function to create an alert modal
 * @param {Object} options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Alert message
 * @param {string} options.buttonText - Button text (default: "OK")
 * @param {Function} options.onClose - Callback when closed
 */
window.Modal.alert = function(options = {}) {
  const modal = new Modal({
    title: options.title || 'Alert',
    size: 'sm',
    content: `<p style="color: rgb(var(--color-neutral-700));">${options.message || ''}</p>`,
    footer: `
      <button class="db-modal-ok" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; width: 100%;">
        ${options.buttonText || 'OK'}
      </button>
    `,
    onClose: options.onClose
  });

  modal.open();

  const okBtn = modal.contentEl.querySelector('.db-modal-ok');
  okBtn.addEventListener('click', () => modal.close());

  return modal;
};

/**
 * Helper function to create a form modal
 * @param {Object} options
 * @param {string} options.title - Modal title
 * @param {string} options.formId - ID for the form element
 * @param {string} options.formContent - HTML content for form fields
 * @param {string} options.submitText - Submit button text (default: "Submit")
 * @param {string} options.cancelText - Cancel button text (default: "Cancel")
 * @param {Function} options.onSubmit - Callback when form is submitted with FormData
 * @param {Function} options.validate - Optional validation function, returns error message or null
 * @param {string} options.size - Modal size (default: 'md')
 */
window.Modal.form = function(options = {}) {
  const formId = options.formId || 'modal-form-' + Date.now();
  const submitText = options.submitText || 'Submit';
  const cancelText = options.cancelText || 'Cancel';
  
  const modal = new Modal({
    title: options.title || 'Form',
    size: options.size || 'md',
    content: `
      <form id="${formId}">
        ${options.formContent || ''}
        <div id="${formId}-error" style="display: none; margin-top: 1rem; padding: 0.75rem; background: #fee; color: #c00; border-radius: 6px;"></div>
      </form>
    `,
    footer: `
      <button type="button" class="db-modal-cancel" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-700)); border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
        ${cancelText}
      </button>
      <button type="submit" form="${formId}" class="db-modal-submit" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
        ${submitText}
      </button>
    `,
    closeOnBackdrop: false
  });

  modal.open();

  const form = document.getElementById(formId);
  const errorEl = document.getElementById(`${formId}-error`);
  const cancelBtn = modal.querySelector('.db-modal-cancel');
  const submitBtn = modal.querySelector('.db-modal-submit');

  cancelBtn.addEventListener('click', () => modal.close());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Hide previous errors
    errorEl.style.display = 'none';
    errorEl.textContent = '';

    // Validate if validator provided
    if (options.validate) {
      const error = options.validate(form);
      if (error) {
        errorEl.textContent = error;
        errorEl.style.display = 'block';
        return;
      }
    }

    // Disable submit button during processing
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      if (options.onSubmit) {
        const formData = new FormData(form);
        await options.onSubmit(formData, modal);
      }
    } catch (err) {
      errorEl.textContent = err.message || 'An error occurred';
      errorEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  return modal;
};
