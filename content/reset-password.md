---
title: "Reset Password"
layout: "single"
showHero: false
showDate: false
showReadingTime: false
---

<div id="reset-password-page" style="max-width: 450px; margin: 5rem auto;">
<h1 style="text-align: center; margin-bottom: 2rem;">Set New Password</h1>

<div id="reset-form-container">
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem;">
<p style="text-align: center; color: rgb(var(--color-neutral-600)); margin-bottom: 2rem;">
Enter your new password below.
</p>

<form id="reset-password-form">
<div style="margin-bottom: 1.5rem;">
    <label for="new-password" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">New Password</label>
    <input 
    type="password" 
    id="new-password" 
    required 
    minlength="8"
    autocomplete="new-password"
    style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-size: 1rem;">
    <p style="margin-top: 0.5rem; font-size: 0.75rem; color: rgb(var(--color-neutral-500));">
    Must be at least 8 characters long
    </p>
</div>

<div style="margin-bottom: 1.5rem;">
    <label for="confirm-password" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Confirm Password</label>
    <input 
    type="password" 
    id="confirm-password" 
    required 
    minlength="8"
    autocomplete="new-password"
    style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-size: 1rem;">
</div>

<button 
    type="submit" 
    id="submit-btn"
    style="width: 100%; padding: 0.75rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer;">
    Reset Password
</button>

<div id="error-message" style="display: none; margin-top: 1rem; padding: 0.75rem; background: #fee; color: #c00; border-radius: 6px; font-size: 0.875rem;"></div>
</form>
</div>
</div>

<div id="success-message-container" style="display: none;">
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; text-align: center;">
<div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
<h2 style="margin-top: 0; margin-bottom: 1rem;">Password Reset Successful</h2>
<p style="color: rgb(var(--color-neutral-600)); margin-bottom: 1.5rem;">
Your password has been reset successfully. You can now log in with your new password.
</p>
<a href="/login" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; text-decoration: none; display: inline-block;">
Go to Login
</a>
</div>
</div>

<div id="invalid-token-container" style="display: none;">
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; text-align: center;">
<div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
<h2 style="margin-top: 0; margin-bottom: 1rem;">Invalid or Expired Link</h2>
<p style="color: rgb(var(--color-neutral-600)); margin-bottom: 1.5rem;">
This password reset link is invalid or has expired. Please request a new one.
</p>
<a href="/forgot-password" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; text-decoration: none; display: inline-block;">
Request New Link
</a>
</div>
</div>
</div>

<script>
(function() {
const API_BASE = window.__DB_API_BASE || 'https://dicebastion-memberships.ncalamaro.workers.dev';
const form = document.getElementById('reset-password-form');
const submitBtn = document.getElementById('submit-btn');
const errorDiv = document.getElementById('error-message');
const resetContainer = document.getElementById('reset-form-container');
const successContainer = document.getElementById('success-message-container');
const invalidContainer = document.getElementById('invalid-token-container');

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
resetContainer.style.display = 'none';
invalidContainer.style.display = 'block';
return;
}

function showError(message) {
errorDiv.textContent = message;
errorDiv.style.display = 'block';
}

function hideError() {
errorDiv.style.display = 'none';
}

form.addEventListener('submit', async (e) => {
e.preventDefault();
hideError();

const newPassword = document.getElementById('new-password').value;
const confirmPassword = document.getElementById('confirm-password').value;

if (newPassword.length < 8) {
showError('Password must be at least 8 characters long');
return;
}

if (newPassword !== confirmPassword) {
showError('Passwords do not match');
return;
}

submitBtn.disabled = true;
submitBtn.textContent = 'Resetting...';

try {
const response = await fetch(`${API_BASE}/password-reset/confirm`, {
method: 'POST',
headers: {
    'Content-Type': 'application/json',
},
body: JSON.stringify({ 
    token,
    newPassword 
}),
});

const data = await response.json();

if (!response.ok) {
if (response.status === 400 || response.status === 404) {
    // Invalid or expired token
    resetContainer.style.display = 'none';
    invalidContainer.style.display = 'block';
    return;
}
throw new Error(data.error || 'Failed to reset password');
}

// Show success message
resetContainer.style.display = 'none';
successContainer.style.display = 'block';
} catch (error) {
console.error('Password reset error:', error);
showError(error.message || 'An error occurred. Please try again.');
submitBtn.disabled = false;
submitBtn.textContent = 'Reset Password';
}
});

// Show/hide password toggle (optional enhancement)
const passwordInputs = [document.getElementById('new-password'), document.getElementById('confirm-password')];
passwordInputs.forEach(input => {
input.addEventListener('input', hideError);
});
})();
</script>
