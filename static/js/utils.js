/**
 * Shared utility functions for Dice Bastion
 * Used across admin, account, events, memberships, and shop pages
 */

// API Configuration
window.__DB_API_BASE = window.__DB_API_BASE || 'https://dicebastion-memberships.ncalamaro.workers.dev';

window.utils = {
  /**
   * Get API base URL (with optional trailing slash removal)
   */
  getApiBase: (removeTrailingSlash = false) => {
    const base = window.__DB_API_BASE || 'https://dicebastion-memberships.ncalamaro.workers.dev';
    return removeTrailingSlash ? base.replace(/\/+$/, '') : base;
  },

  /**
   * Escape HTML to prevent XSS attacks
   */
  escapeHtml: (text) => {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  },

  /**
   * Format price in pence to pounds string
   */
  formatPrice: (pence, currency = 'GBP') => {
    const symbols = { GBP: '£', EUR: '€', USD: '$' };
    const symbol = symbols[currency] || currency;
    return `${symbol}${(pence / 100).toFixed(2)}`;
  },

  /**
   * Format date for display
   */
  formatDate: (dateStr, options = { year: 'numeric', month: 'long', day: 'numeric' }) => {
    return new Date(dateStr).toLocaleDateString('en-GB', options);
  },

  /**
   * Format datetime for display
   */
  formatDateTime: (dateStr) => {
    const date = new Date(dateStr);
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return `${date.toLocaleDateString('en-GB', dateOptions)} at ${date.toLocaleTimeString('en-GB', timeOptions)}`;
  },

  /**
   * Generate a unique idempotency key
   */
  generateIdempotencyKey: () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  },

  /**
   * Session management utilities
   */
  session: {
    get: () => localStorage.getItem('admin_session'),
    getUser: () => JSON.parse(localStorage.getItem('admin_user') || 'null'),
    set: (token, user) => {
      localStorage.setItem('admin_session', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
    },
    clear: () => {
      localStorage.removeItem('admin_session');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_token');
    },
    isLoggedIn: () => !!localStorage.getItem('admin_session')
  },

  /**
   * Make authenticated API request
   */
  fetchAuth: async (url, options = {}) => {
    const sessionToken = localStorage.getItem('admin_session');
    const headers = {
      ...(options.headers || {}),
      'X-Session-Token': sessionToken
    };
    
    return fetch(url, { ...options, headers });
  },

  /**
   * Show error message in a container
   */
  showError: (containerId, message) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.textContent = message;
    container.style.display = 'block';
  },

  /**
   * Hide error message container
   */
  hideError: (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.style.display = 'none';
    container.textContent = '';
  },

  /**
   * Show success message in a container
   */
  showSuccess: (containerId, message) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.textContent = message;
    container.style.background = '#d1fae5';
    container.style.color = '#065f46';
    container.style.display = 'block';
  },

  /**
   * Debounce function calls
   */
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Sleep/wait utility
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate slug from text
   */
  slugify: (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  },

  /**
   * Poll payment confirmation endpoint until payment is confirmed or timeout
   * @param {string} endpoint - The API endpoint to poll (e.g., '/events/confirm' or '/membership/confirm')
   * @param {string} orderRef - The order reference ID
   * @param {Object} options - Optional configuration
   * @param {number} options.maxAttempts - Maximum polling attempts (default: 120)
   * @param {number} options.pollInterval - Time between polls in ms (default: 1500)
   * @param {Function} options.onSuccess - Callback when payment confirmed, receives response data
   * @param {Function} options.onError - Callback when error occurs, receives error message
   * @param {Function} options.onTimeout - Callback when polling times out (webhook will complete)
   * @returns {Promise<Object|null>} - Response data on success, null on timeout/error
   */
  pollPaymentConfirmation: async (endpoint, orderRef, options = {}) => {
    const {
      maxAttempts = 120,  // 3 minutes at 1.5s intervals
      pollInterval = 1500,
      onSuccess = null,
      onError = null,
      onTimeout = null
    } = options;

    const apiBase = window.utils.getApiBase();
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const url = `${apiBase}${endpoint}?orderRef=${encodeURIComponent(orderRef)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('[pollPaymentConfirmation] Response:', JSON.stringify(data, null, 2));
        
        // Success cases: payment confirmed (active or already_active status)
        if (data.ok && (data.status === 'active' || data.status === 'already_active')) {
          console.log('[pollPaymentConfirmation] ✅ Payment confirmed! Calling onSuccess');
          if (onSuccess) {
            onSuccess(data);
          }
          return data;
        }
        
        // Still pending - keep polling
        if (data.status && String(data.status).toUpperCase() === 'PENDING') {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }
        
        // Payment failed or was declined - use backend message if available
        if (data.status === 'FAILED' || data.status === 'DECLINED') {
          const errorMsg = data.message || (data.status === 'DECLINED' 
            ? 'Your card was declined. Please check your card details and try again, or use a different payment method.'
            : 'Payment failed. Please try again or use a different payment method.');
          console.log('[pollPaymentConfirmation] Payment failed:', data.status, errorMsg);
          if (onError) {
            onError(errorMsg);
          }
          return null;
        }
        
        // If we get ok: false with a specific error, stop polling
        if (!data.ok && data.error && data.error !== 'verify_failed') {
          const errorMsg = data.message || 'Payment failed: ' + data.error;
          if (onError) {
            onError(errorMsg);
          }
          return null;
        }
      } catch (error) {
        console.error('Payment confirmation polling error:', error);
        // Don't fail immediately on network errors - payment might still be processing
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    // Timeout - webhook will complete the payment
    console.log('Payment polling timed out - webhook will complete transaction');
    if (onTimeout) {
      onTimeout();
    } else if (onError) {
      const timeoutMsg = 'Your payment is being processed. Please check your email for confirmation.';
      onError(timeoutMsg);
    }
    return null;
  },

  /**
   * Load SumUp Card SDK dynamically
   * @returns {Promise<boolean>} - Resolves when SDK is loaded
   */
  loadSumUpSdk: async () => {
    if (window.SumUpCard) return true;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load SumUp SDK'));
      document.head.appendChild(script);
    });
  },

  /**
   * Load Cloudflare Turnstile SDK dynamically
   * @returns {Promise<boolean>} - Resolves when SDK is loaded
   */
  loadTurnstileSdk: async () => {
    if (window.turnstile) return true;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Turnstile load failed'));
      document.head.appendChild(script);
    });
  },

  /**
   * Render Turnstile widget with automatic cleanup and retry logic
   * @param {string} elementId - The ID of the container element
   * @param {string} sitekey - Turnstile site key
   * @param {Object} options - Optional configuration
   * @param {boolean} options.skipOnLocalhost - Skip rendering on localhost (default: true)
   * @param {Object} options.widgetState - Object to store widget ID (e.g., {widgetId: null})
   * @returns {Promise<string|null>} - Widget ID on success, null if skipped
   */
  renderTurnstile: async (elementId, sitekey, options = {}) => {
    const {
      skipOnLocalhost = true,
      widgetState = null
    } = options;

    // Skip on localhost if configured
    if (skipOnLocalhost && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('Localhost detected - skipping Turnstile render');
      return null;
    }

    await window.utils.loadTurnstileSdk();
    const element = document.getElementById(elementId);
    
    if (!element || !window.turnstile) return null;

    // Remove existing widget if present
    if (widgetState && widgetState.widgetId !== null && widgetState.widgetId !== undefined) {
      try {
        window.turnstile.remove(widgetState.widgetId);
        console.log('Turnstile widget removed:', widgetState.widgetId);
        widgetState.widgetId = null;
      } catch(e) {
        console.log('Turnstile remove failed:', e);
      }
    }

    // Aggressive cleanup: remove any widgets from this container
    try {
      // Try to remove by element reference
      window.turnstile.remove(element);
      console.log('Removed any existing widget from element');
    } catch(e) {
      // Expected if no widget exists
    }

    // Clear container completely - replace it with a fresh clone
    const parent = element.parentNode;
    if (parent) {
      const newElement = element.cloneNode(false);
      parent.replaceChild(newElement, element);
      console.log('Replaced Turnstile container with fresh clone');
      
      // Update reference to new element
      const freshElement = document.getElementById(elementId);
      if (!freshElement) {
        console.error('Failed to get fresh element after replacement');
        return null;
      }

      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Render new widget in fresh container
      try {
        const widgetId = window.turnstile.render(freshElement, {
          sitekey,
          size: 'flexible'
        });
        
        if (widgetState) {
          widgetState.widgetId = widgetId;
        }
        
        console.log('Turnstile widget rendered with ID:', widgetId);
        return widgetId;
      } catch(e) {
        console.error('Turnstile render failed:', e);
        if (widgetState) {
          widgetState.widgetId = null;
        }
        return null;
      }
    } else {
      console.error('Element has no parent, cannot replace');
      return null;
    }
  },

  /**
   * Get Turnstile token from a rendered widget
   * @param {string} elementId - The ID of the Turnstile container
   * @param {string|null} widgetId - The widget ID (optional, will try to get from element)
   * @param {boolean} skipOnLocalhost - Return test token on localhost (default: true)
   * @returns {Promise<string>} - The Turnstile token
   */
  getTurnstileToken: async (elementId, widgetId = null, skipOnLocalhost = true) => {
    // Bypass on localhost
    if (skipOnLocalhost && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('Localhost detected - using test-bypass token');
      return 'test-bypass';
    }

    await window.utils.loadTurnstileSdk();
    const element = document.getElementById(elementId);
    
    if (!element || !window.turnstile) {
      throw new Error('Turnstile not ready');
    }

    // Get token from widget
    const token = widgetId !== null 
      ? window.turnstile.getResponse(widgetId)
      : window.turnstile.getResponse(element);
      
    if (!token) {
      throw new Error('Please complete the security check.');
    }
    
    return token;
  },

  /**
   * Clean up Turnstile widget and container
   * @param {string|null} widgetId - The widget ID to remove
   * @param {string} elementId - The container element ID
   */
  cleanupTurnstile: (widgetId, elementId) => {
    const element = document.getElementById(elementId);
    
    if (window.turnstile && widgetId !== null) {
      try {
        console.log('Removing Turnstile widget:', widgetId);
        window.turnstile.remove(widgetId);
        console.log('Turnstile widget removed successfully');
      } catch(e) {
        console.error('Turnstile cleanup failed:', e);
      }
    }
    
    if (window.turnstile && element) {
      try {
        window.turnstile.reset(element);
        console.log('Reset Turnstile container as fallback');
      } catch(e) {
        // Silent fail - expected if no widget exists
      }
    }
    
    if (element) {
      element.innerHTML = '';
      const parent = element.parentNode;
      if (parent) {
        const newElement = element.cloneNode(false);
        parent.replaceChild(newElement, element);
        console.log('Turnstile container replaced with fresh clone');
      }
    }
  }
};

// Export for compatibility with existing code
window.escapeHtml = window.utils.escapeHtml;
window.formatPrice = window.utils.formatPrice;
window.formatDate = window.utils.formatDate;
