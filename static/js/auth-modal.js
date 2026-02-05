/**
 * Auth Modal Component
 * Reusable authentication modal with login/register tabs and forgot password
 * Uses forms.css for styling
 */

// Inject auth modal styles once
(function injectAuthModalStyles() {
  if (document.getElementById('auth-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'auth-modal-styles';
  style.textContent = `
    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
    }
    
    .modal-content {
      background: rgb(var(--color-neutral));
      border-radius: 12px;
      width: 100%;
      max-height: 90vh;
      overflow: auto;
      position: relative;
      z-index: 1;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }
    
    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: transparent;
      border: none;
      font-size: 2rem;
      line-height: 1;
      cursor: pointer;
      color: rgb(var(--color-neutral-600));
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
      z-index: 10;
    }
    
    .modal-close:hover {
      background: rgb(var(--color-neutral-200));
    }
    
    .dark .modal-close:hover {
      background: rgb(var(--color-neutral-700));
    }
    
    .link-button {
      background: none;
      border: none;
      color: rgb(var(--color-primary-600));
      cursor: pointer;
      padding: 0;
      font-size: 0.875rem;
      text-decoration: underline;
    }
    
    .link-button:hover {
      color: rgb(var(--color-primary-700));
    }
  `;
  document.head.appendChild(style);
})();

class AuthModal {
  constructor(options = {}) {
    this.mainApiUrl = options.mainApiUrl || 'https://dicebastion-memberships.ncalamaro.workers.dev';
    this.onSuccess = options.onSuccess || (() => {});
    this.modal = null;
    this.currentTab = 'login';
  }

  /**
   * Show the auth modal
   */
  show() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      return;
    }

    this.modal = this.createModal();
    document.body.appendChild(this.modal);
    this.attachEventListeners();
  }

  /**
   * Hide the auth modal
   */
  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  /**
   * Create the modal HTML structure
   */
  createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <button class="modal-close" aria-label="Close">&times;</button>
        
        <div class="card">
          <div class="card-header">
            <h2 style="margin: 0;">Account Required</h2>
          </div>
          
          <div class="card-body">
            <!-- Tabs -->
            <div class="auth-tabs" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e5e7eb;">
              <button class="auth-tab active" data-tab="login" style="flex: 1; padding: 0.75rem; border: none; background: none; cursor: pointer; font-weight: 600; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.3s;">
                Login
              </button>
              <button class="auth-tab" data-tab="register" style="flex: 1; padding: 0.75rem; border: none; background: none; cursor: pointer; font-weight: 600; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.3s;">
                Register
              </button>
            </div>

            <!-- Login Form -->
            <div class="auth-form-container" data-form="login">
              <form id="auth-login-form">
                <div class="form-group">
                  <label for="login-email" class="form-label">Email</label>
                  <input type="email" id="login-email" class="form-input" required autocomplete="email">
                </div>

                <div class="form-group">
                  <label for="login-password" class="form-label">Password</label>
                  <input type="password" id="login-password" class="form-input" required autocomplete="current-password">
                </div>

                <div class="alert alert-error" id="login-error" style="display: none;"></div>

                <button type="submit" class="btn-primary" style="width: 100%;">
                  <span class="btn-text">Login</span>
                  <span class="btn-loading" style="display: none;">
                    <svg class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>
                    Logging in...
                  </span>
                </button>

                <div style="margin-top: 1rem; text-align: center;">
                  <button type="button" class="link-button" id="show-forgot-password">
                    Forgot password?
                  </button>
                </div>
              </form>
            </div>

            <!-- Register Form -->
            <div class="auth-form-container" data-form="register" style="display: none;">
              <form id="auth-register-form">
                <div class="form-group">
                  <label for="register-name" class="form-label">Name</label>
                  <input type="text" id="register-name" class="form-input" required autocomplete="name">
                </div>

                <div class="form-group">
                  <label for="register-email" class="form-label">Email</label>
                  <input type="email" id="register-email" class="form-input" required autocomplete="email">
                </div>

                <div class="form-group">
                  <label for="register-password" class="form-label">Password</label>
                  <input type="password" id="register-password" class="form-input" required autocomplete="new-password" minlength="8">
                  <small class="form-help">Minimum 8 characters</small>
                </div>

                <div class="alert alert-info" id="register-info" style="display: none;"></div>
                <div class="alert alert-error" id="register-error" style="display: none;"></div>

                <button type="submit" class="btn-primary" style="width: 100%;">
                  <span class="btn btn-text">Create Account</span>
                  <span class="btn-loading" style="display: none;">
                    <svg class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>
                    Creating account...
                  </span>
                </button>
              </form>
            </div>

            <!-- Forgot Password Form -->
            <div class="auth-form-container" data-form="forgot" style="display: none;">
              <form id="auth-forgot-form">
                <p style="margin-bottom: 1.5rem; color: #6b7280;">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <div class="form-group">
                  <label for="forgot-email" class="form-label">Email</label>
                  <input type="email" id="forgot-email" class="form-input" required autocomplete="email">
                </div>

                <div class="alert alert-success" id="forgot-success" style="display: none;"></div>
                <div class="alert alert-error" id="forgot-error" style="display: none;"></div>

                <button type="submit" class="btn-primary" style="width: 100%;">
                  <span class="btn-text">Send Reset Link</span>
                  <span class="btn-loading" style="display: none;">
                    <svg class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle></svg>
                    Sending...
                  </span>
                </button>

                <div style="margin-top: 1rem; text-align: center;">
                  <button type="button" class="link-button" id="back-to-login">
                    Back to login
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    return modal;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    this.modal.querySelector('.modal-close').addEventListener('click', () => this.hide());
    
    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hide();
    });

    // Tab switching
    this.modal.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Show forgot password
    this.modal.querySelector('#show-forgot-password').addEventListener('click', () => {
      this.showForm('forgot');
    });

    // Back to login
    this.modal.querySelector('#back-to-login').addEventListener('click', () => {
      this.showForm('login');
    });

    // Form submissions
    this.modal.querySelector('#auth-login-form').addEventListener('submit', (e) => this.handleLogin(e));
    this.modal.querySelector('#auth-register-form').addEventListener('submit', (e) => this.handleRegister(e));
    this.modal.querySelector('#auth-forgot-form').addEventListener('submit', (e) => this.handleForgotPassword(e));
  }

  /**
   * Switch between tabs
   */
  switchTab(tab) {
    this.currentTab = tab;
    
    // Update tab buttons
    this.modal.querySelectorAll('.auth-tab').forEach(t => {
      if (t.dataset.tab === tab) {
        t.classList.add('active');
        t.style.color = '#6366f1';
        t.style.borderBottomColor = '#6366f1';
      } else {
        t.classList.remove('active');
        t.style.color = '#6b7280';
        t.style.borderBottomColor = 'transparent';
      }
    });

    // Show correct form
    this.showForm(tab);
  }

  /**
   * Show specific form
   */
  showForm(formName) {
    this.modal.querySelectorAll('.auth-form-container').forEach(form => {
      form.style.display = form.dataset.form === formName ? 'block' : 'none';
    });

    // Hide all alerts
    this.modal.querySelectorAll('.alert').forEach(alert => alert.style.display = 'none');
  }

  /**
   * Handle login form submission
   */
  async handleLogin(e) {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    const errorDiv = this.modal.querySelector('#login-error');

    const email = this.modal.querySelector('#login-email').value;
    const password = this.modal.querySelector('#login-password').value;

    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    errorDiv.style.display = 'none';

    try {
      const response = await fetch(`${this.mainApiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error === 'invalid_credentials' ? 'Invalid email or password' : 'Login failed');
      }

      // Store session
      localStorage.setItem('session_token', data.session_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Also store in admin_session format for compatibility
      localStorage.setItem('admin_session', data.session_token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));

      // Reload page to show logged-in state
      window.location.reload();

    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }

  /**
   * Handle register form submission
   */
  async handleRegister(e) {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    const errorDiv = this.modal.querySelector('#register-error');
    const infoDiv = this.modal.querySelector('#register-info');

    const name = this.modal.querySelector('#register-name').value;
    const email = this.modal.querySelector('#register-email').value;
    const password = this.modal.querySelector('#register-password').value;

    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    errorDiv.style.display = 'none';
    infoDiv.style.display = 'none';

    try {
      // Use the new /register endpoint
      const response = await fetch(`${this.mainApiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'user_already_exists') {
          throw new Error('An account with this email already exists. Please login instead.');
        } else if (data.error === 'password_too_short') {
          throw new Error('Password must be at least 8 characters long.');
        } else if (data.message) {
          throw new Error(data.message);
        }
        throw new Error('Registration failed. Please try again.');
      }

      // Store session (auto-login after registration)
      localStorage.setItem('session_token', data.session_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Also store in admin_session format for compatibility
      localStorage.setItem('admin_session', data.session_token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));

      // Reload page to show logged-in state
      window.location.reload();

    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
      
      // Reset button state on error
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }

  /**
   * Handle forgot password form submission
   */
  async handleForgotPassword(e) {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    const errorDiv = this.modal.querySelector('#forgot-error');
    const successDiv = this.modal.querySelector('#forgot-success');

    const email = this.modal.querySelector('#forgot-email').value;

    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    try {
      const response = await fetch(`${this.mainApiUrl}/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }

      successDiv.textContent = 'Password reset link sent! Please check your email.';
      successDiv.style.display = 'block';
      
      // Clear form
      this.modal.querySelector('#forgot-email').value = '';

    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
}

// Make available globally
window.AuthModal = AuthModal;
