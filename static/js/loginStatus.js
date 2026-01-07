/**
 * Login Status Manager
 * Shared across main site and shop to display login state
 */

(function() {
  'use strict';

  // Check if user is logged in by checking localStorage
  function checkLoginStatus() {
    const sessionToken = localStorage.getItem('admin_session');
    const userDataStr = localStorage.getItem('admin_user');
    
    if (!sessionToken || !userDataStr) {
      return null;
    }
    
    try {
      const userData = JSON.parse(userDataStr);
      return userData;
    } catch (e) {
      console.error('Failed to parse user data:', e);
      return null;
    }
  }
  // Update login status in the UI
  function updateLoginUI() {
    const loginContainer = document.getElementById('login-status-container');
    if (!loginContainer) return;

    const user = checkLoginStatus();
    
    if (user && user.email) {
      // User is logged in
      loginContainer.innerHTML = `
        <span class="text-sm text-neutral-600 dark:text-neutral-400">
          <span class="hidden sm:inline">Logged in as </span>
          <a href="/admin" class="font-medium hover:text-primary-600 dark:hover:text-primary-400 hover:underline" title="Go to Admin Dashboard">
            ${escapeHtml(user.email)}
          </a>
          <span class="mx-2">|</span>
          <button 
            onclick="window.logoutUser()" 
            class="hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
            title="Log out">
            Log out
          </button>
        </span>
      `;    } else {
      // User is not logged in
      loginContainer.innerHTML = `
        <a href="/login" class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
          Login
        </a>
      `;
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  // Logout function
  window.logoutUser = async function() {
    const sessionToken = localStorage.getItem('admin_session');
    
    if (sessionToken) {
      // Call logout endpoint
      try {
        const API_BASE = 'https://dicebastion-memberships.ncalamaro.workers.dev';
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
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    
    // Update UI
    updateLoginUI();
    
    // If on admin page, reload to show login form
    if (window.location.pathname.startsWith('/admin')) {
      window.location.reload();
    }
  };

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
