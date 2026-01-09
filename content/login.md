---
title: "Login"
layout: "single"
showHero: false
showDate: false
showReadingTime: false
---

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

<!-- Non-Admin Message -->
<div id="non-admin-message" style="display: none;">
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; text-align: center;">
<div style="font-size: 3rem; margin-bottom: 1rem;">👋</div>
<h2 style="margin-top: 0; margin-bottom: 1rem;">Welcome back!</h2>
<p style="color: rgb(var(--color-neutral-600)); margin-bottom: 1.5rem;">
You're logged in as <strong id="user-email-display"></strong>
</p>
<div style="background: rgb(var(--color-neutral-100)); dark:bg-neutral-700; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
<p style="margin: 0; color: rgb(var(--color-neutral-700)); dark:color-neutral-300;">
    You don't currently have admin access. If you need to manage products, events, or orders, please contact our team.
</p>
</div>
<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
<a href="/" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; text-decoration: none; display: inline-block;">
    Go to Home
</a>
<a href="/events" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-700)); border: none; border-radius: 6px; font-weight: 600; text-decoration: none; display: inline-block;">
    Browse Events
</a>
<button id="logout-btn" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-700)); border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
    Logout
</button>
</div>
</div>
</div>
</div>

<script>
const API_BASE = 'https://dicebastion-memberships.ncalamaro.workers.dev';

// Check if already logged in
function checkExistingLogin() {
const sessionToken = localStorage.getItem('admin_session');
const userDataStr = localStorage.getItem('admin_user');

if (sessionToken && userDataStr) {
try {
const userData = JSON.parse(userDataStr);

// If user is admin, redirect to admin dashboard
if (userData.is_admin) {
window.location.href = '/admin';
return;
}

// If non-admin, show welcome message
showNonAdminMessage(userData);
} catch (e) {
console.error('Failed to parse user data:', e);
}
}
}

function showNonAdminMessage(user) {
document.getElementById('login-form-container').style.display = 'none';
document.getElementById('non-admin-message').style.display = 'block';
document.getElementById('user-email-display').textContent = user.email;
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
localStorage.setItem('admin_session', data.session_token);
localStorage.setItem('admin_user', JSON.stringify(data.user));
localStorage.setItem('admin_token', data.session_token);

// Trigger login status update
window.dispatchEvent(new Event('userLoggedIn'));

// Redirect based on user role
if (data.user.is_admin) {
window.location.href = '/admin';
} else {
showNonAdminMessage(data.user);
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

// Handle logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
const sessionToken = localStorage.getItem('admin_session');

if (sessionToken) {
try {
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

// Trigger UI update
window.dispatchEvent(new Event('userLoggedIn'));

// Reload page
window.location.reload();
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
