/**
 * Login Status Manager
 * Shared across main site and shop to display login state
 * Depends on: utils.js
 */

(function() {
  'use strict';

  // Check if user is logged in by checking localStorage
  function checkLoginStatus() {
    return utils.session.getUser();
  }

  // Update login status in the UI
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
            <a href="${user.is_admin ? '/admin' : '/account'}" class="font-medium hover:text-primary-600 dark:hover:text-primary-400 hover:underline" title="${user.is_admin ? 'Go to Admin Dashboard' : 'Go to Account'}">
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
        ? `<a id="nav-account-link" href="/account" class="text-base hover:text-primary-600 dark:hover:text-primary-400" title="My Account">Account</a>`
        : `<button id="nav-account-link" onclick="window.openLoginModal()" class="text-base hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer" title="Log in to your account">Login</button>`;
      
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
        ? `<li id="nav-account-link-mobile" class="mb-1"><a href="/account" class="flex items-center text-base hover:text-primary-600 dark:hover:text-primary-400">Account</a></li>`
        : `<li id="nav-account-link-mobile" class="mb-1"><button onclick="window.openLoginModal()" class="flex items-center text-base hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer">Login</button></li>`;
      
      if (closeButton) {
        closeButton.insertAdjacentHTML('afterend', linkHtml);
      }
    }
  }

  // Escape HTML to prevent XSS
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
  
  // Function to open login modal (to be called from footer)
  window.openLoginModal = function() {
    if (window.authModal && typeof window.authModal.show === 'function') {
      window.authModal.show();
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
