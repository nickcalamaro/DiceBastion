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
  }
};

// Export for compatibility with existing code
window.escapeHtml = window.utils.escapeHtml;
window.formatPrice = window.utils.formatPrice;
window.formatDate = window.utils.formatDate;
