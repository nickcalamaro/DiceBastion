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
  }  // Update login status in the UI
  function updateLoginUI() {
    const loginContainer = document.getElementById('login-status-container');
    const user = checkLoginStatus();
    
    // Update footer login/account link
    if (loginContainer) {
      if (user && user.email) {
        // User is logged in
        loginContainer.innerHTML = `
          <span class="text-sm text-neutral-600 dark:text-neutral-400">
            <span class="hidden sm:inline">Logged in as </span>
            <a href="'https://dicebastion.com/account'}" class="font-medium hover:text-primary-600 dark:hover:text-primary-400 hover:underline" title="${user.is_admin ? 'Go to Admin Dashboard' : 'Go to Account'}">
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
        `;
      } else {
        // User is not logged in
        loginContainer.innerHTML = `
          <a href="https://dicebastion.com/login" class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
            Login
          </a>
        `;
      }
    }
    
    // Update main navigation menu
    updateNavigationMenu(user);
  }
  
  // Update navigation menu to show Login or Account
  function updateNavigationMenu(user) {
    // Desktop menu
    const desktopNav = document.querySelector('nav.hidden.md\\:flex');
    if (desktopNav) {
      // Remove existing login/account link
      const existingLink = desktopNav.querySelector('#nav-account-link');
      if (existingLink) {
        existingLink.remove();
      }
      
      // Add new link before search/appearance switcher
      const searchButton = desktopNav.querySelector('#search-button');
      const linkHtml = user && user.email
        ? `<a id="nav-account-link" href="https://dicebastion.com/account" class="text-base hover:text-primary-600 dark:hover:text-primary-400" title="My Account">Account</a>`
        : `<a id="nav-account-link" href="https://dicebastion.com/login" class="text-base hover:text-primary-600 dark:hover:text-primary-400" title="Log in to your account">Login</a>`;
      
      if (searchButton) {
        searchButton.insertAdjacentHTML('beforebegin', linkHtml);
      } else {
        // If no search button, add before appearance switcher or at the end
        const appearanceSwitcher = desktopNav.querySelector('#appearance-switcher');
        if (appearanceSwitcher && appearanceSwitcher.parentElement) {
          appearanceSwitcher.parentElement.insertAdjacentHTML('beforebegin', linkHtml);
        } else {
          desktopNav.insertAdjacentHTML('beforeend', linkHtml);
        }
      }
    }
    
    // Mobile menu
    const mobileMenuWrapper = document.querySelector('#menu-wrapper ul');
    if (mobileMenuWrapper) {
      // Remove existing login/account link
      const existingMobileLink = mobileMenuWrapper.querySelector('#nav-account-link-mobile');
      if (existingMobileLink) {
        existingMobileLink.remove();
      }
      
      // Add new link after close button
      const closeButton = mobileMenuWrapper.querySelector('#menu-close-button');
      const linkHtml = user && user.email
        ? `<li id="nav-account-link-mobile" class="mb-1"><a href="https://dicebastion.com/account" class="flex items-center text-base hover:text-primary-600 dark:hover:text-primary-400">Account</a></li>`
        : `<li id="nav-account-link-mobile" class="mb-1"><a href="https://dicebastion.com/login" class="flex items-center text-base hover:text-primary-600 dark:hover:text-primary-400">Login</a></li>`;
      
      if (closeButton) {
        closeButton.insertAdjacentHTML('afterend', linkHtml);
      }
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
    
    // Clear local storage (includes membership cache)
    utils.session.clear();
    
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
