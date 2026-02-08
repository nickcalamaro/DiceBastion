/**
 * Login Status Manager
 * Shared across main site and shop to display login state
 * Depends on: utils.js
 * 
 * VISIBILITY SYSTEM:
 * Use data-visibility attribute on any element to control role-based access.
 * Values correspond to utils.USER_LEVELS:
 * 
 *   0 (ADMIN)       = Admins only
 *   1 (MEMBER)      = Admins + Active Members
 *   2 (LOGGED_IN)   = Admins + Members + Any logged-in user
 *   3 (PUBLIC)      = Everyone (default - no restrictions)
 *   4 (NON_MEMBER)  = Non-members only (includes logged-out users AND logged-in non-members)
 *   5 (LOGGED_OUT)  = Logged-out users only
 * 
 * Best Practice: Use named constants from utils.USER_LEVELS when setting values in JavaScript
 * 
 * HTML Examples:
 *   <div data-visibility="0">Admin dashboard link</div>
 *   <div data-visibility="1">Member exclusive perks</div>
 *   <button data-visibility="2">Account settings (any logged-in user)</button>
 *   <div data-visibility="3">Public content (no restrictions)</div>
 *   <div data-visibility="4">Membership upsell promo</div>
 *   <button data-visibility="5">Login/Register button</button>
 * 
 * JavaScript Example:
 *   promoDiv.setAttribute('data-visibility', utils.USER_LEVELS.NON_MEMBER);
 * 
 * After dynamically adding elements with data-visibility, call:
 *   utils.applyVisibilityControls();
 */

(function() {
  'use strict';

  // Fetch and cache membership status on page load
  async function initializeMembershipStatus() {
    const sessionToken = localStorage.getItem('admin_session');
    if (!sessionToken) return;
    
    try {
      const API_BASE = utils.getApiBase();
      const resp = await fetch(`${API_BASE}/account/info`, {
        headers: { 'X-Session-Token': sessionToken }
      });
      
      if (resp.ok) {
        const data = await resp.json();
        const membershipData = data.membership !== null && data.membership !== undefined ? data.membership : null;
        utils.session.setMembershipStatus(membershipData);
      }
    } catch (e) {
      console.log('[loginStatus] Could not fetch membership status:', e);
    }
  }

  // Update login status in the UI
  async function updateLoginUI() {
    // Fetch membership first if logged in
    await initializeMembershipStatus();
    
    const loginContainer = document.getElementById('login-status-container');
    const { user, isAdmin } = utils.session.getUserStatus();
    
    // Update footer login/account link
    if (loginContainer) {
      if (user && user.email) {
        // User is logged in
        loginContainer.innerHTML = `
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            <span class="hidden sm:inline">Logged in as </span>
            <a href="${isAdmin ? '/admin' : '/account'}" class="font-medium hover:text-primary-600 dark:hover:text-primary-400 hover:underline" title="${isAdmin ? 'Go to Admin Dashboard' : 'Go to Account'}">
              ${utils.escapeHtml(user.email)}
            </a>
            <span class="mx-2">|</span>
            <button 
              onclick="window.logoutUser()" 
              class="hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
              title="Log out">
              Log out
            </button>
          </span>
        `;
      } else {
        // User is not logged in
        loginContainer.innerHTML = `
          <button 
            onclick="window.openLoginModal()" 
            class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline cursor-pointer"
            title="Log in to your account">
            Login
          </button>
        `;
      }
    }
    
    // Update all visibility-controlled elements (menus, promos, etc.)
    utils.applyVisibilityControls();
  }
  
  // Logout function
  window.logoutUser = async function() {
    const sessionToken = utils.session.get();
    
    if (sessionToken) {
      // Call logout endpoint
      try {
        const API_BASE = utils.getApiBase();
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken
          }
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    
    // Clear local storage
    utils.session.clear();
    
    // Reload the page to refresh all states
    window.location.reload();
  };
  
  // Function to open login modal
  window.openLoginModal = function() {
    if (window.authModal && typeof window.authModal.show === 'function') {
      window.authModal.show();
    }
  };
  
  // Handle menu items with data-action attribute
  document.addEventListener('click', function(e) {
    const actionElement = e.target.closest('[data-action]');
    if (actionElement) {
      const action = actionElement.getAttribute('data-action');
      if (action === 'login') {
        e.preventDefault();
        window.openLoginModal();
      }
    }
  });

  // Listen for storage events to sync across tabs
  window.addEventListener('storage', function(e) {
    if (e.key === 'admin_session' || e.key === 'admin_user') {
      updateLoginUI();
    }
  });
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateLoginUI);
  } else {
    updateLoginUI();
  }

  // Also update when user logs in/out (custom events)
  window.addEventListener('userLoggedIn', updateLoginUI);
  window.addEventListener('userLoggedOut', updateLoginUI);
})();
