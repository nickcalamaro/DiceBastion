---
title: "Login"
layout: "single"
showHero: false
showDate: false
showReadingTime: false
---

<script src="/js/utils.js"></script>

<div id="login-page" style="max-width: 450px; margin: 5rem auto;">
<h1 style="text-align: center; margin-bottom: 2rem;">Login to Dice Bastion</h1>

<!-- Login Form -->
<div id="login-form-container">
<form id="login-form" style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem;">
<div style="margin-bottom: 1.5rem;">
<label for="user-email" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email</label>
<input type="email" id="user-email" required autocomplete="email" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-size: 1rem;">
</div>

<div style="margin-bottom: 1.5rem;">
<label for="user-password" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Password</label>
<input type="password" id="user-password" required autocomplete="current-password" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-size: 1rem;">
</div>

<div style="text-align: right; margin-bottom: 1rem;">
<a href="/forgot-password" style="color: rgb(var(--color-primary-600)); font-size: 0.875rem; text-decoration: none;">Forgot password?</a>
</div>

<button type="submit" style="width: 100%; padding: 0.75rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer;">
Login
</button>

<div id="login-error" style="display: none; margin-top: 1rem; padding: 0.75rem; background: #fee; color: #c00; border-radius: 6px; font-size: 0.875rem;"></div>
</form>

<p style="text-align: center; margin-top: 1.5rem; color: rgb(var(--color-neutral-600)); font-size: 0.875rem;">
Don't have an account? <a href="/memberships" style="color: rgb(var(--color-primary-600)); font-weight: 600; text-decoration: none; hover: underline;">Become a member</a>
</p>
</div>
</div>

<script>
const API_BASE = utils.getApiBase();

// Check if already logged in
function checkExistingLogin() {
const sessionToken = utils.session.get();
const userData = utils.session.getUser();

if (sessionToken && userData) {
    // If user is admin, redirect to admin dashboard
    if (userData.is_admin) {
      window.location.href = '/admin';
      return;
    }

    // If non-admin, redirect to account page
    window.location.href = '/account';
  }
}

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
e.preventDefault();

const email = document.getElementById('user-email').value;
const password = document.getElementById('user-password').value;
const errorEl = document.getElementById('login-error');

// Clear previous errors
errorEl.style.display = 'none';

try {
const res = await fetch(`${API_BASE}/login`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password })
});

const data = await res.json();

if (res.ok && data.success) {
// Store session data
utils.session.set(data.session_token, data.user);

// Trigger login status update
window.dispatchEvent(new Event('userLoggedIn'));

// Redirect based on user role
      if (data.user.is_admin) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/account';
      }
} else {
errorEl.textContent = data.error === 'invalid_credentials' 
? 'Invalid email or password' 
: 'Login failed. Please try again.';
errorEl.style.display = 'block';
}
} catch (err) {
console.error('Login error:', err);
errorEl.textContent = 'Login failed. Please try again.';
errorEl.style.display = 'block';
}
});

// Check on page load
checkExistingLogin();
</script>

<style>
#login-form button[type="submit"]:hover {
background: rgb(var(--color-primary-700));
}

#login-form input:focus {
outline: none;
border-color: rgb(var(--color-primary-600));
box-shadow: 0 0 0 3px rgba(var(--color-primary-600), 0.1);
}

#logout-btn:hover,
a[href="/"]:hover,
a[href="/events"]:hover {
opacity: 0.9;
}
</style>
