---
title: "Forgot Password"
layout: "single"
showHero: false
showDate: false
showReadingTime: false
---

<div id="forgot-password-page" style="max-width: 450px; margin: 5rem auto;">
<h1 style="text-align: center; margin-bottom: 2rem;">Reset Your Password</h1>

<div id="request-form-container">
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem;">
<p style="text-align: center; color: rgb(var(--color-neutral-600)); margin-bottom: 2rem;">
Enter your email address and we'll send you a link to reset your password.
</p>

<form id="forgot-password-form">
<div style="margin-bottom: 1.5rem;">
<label for="reset-email" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email</label>
<input 
type="email" 
id="reset-email" 
required 
autocomplete="email"
style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-size: 1rem;">
</div>

<button 
type="submit" 
id="submit-btn"
style="width: 100%; padding: 0.75rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer;">
Send Reset Link
</button>

<div id="error-message" style="display: none; margin-top: 1rem; padding: 0.75rem; background: #fee; color: #c00; border-radius: 6px; font-size: 0.875rem;"></div>
</form>
</div>

<p style="text-align: center; margin-top: 1.5rem; color: rgb(var(--color-neutral-600)); font-size: 0.875rem;">
Remember your password? <a href="/login" style="color: rgb(var(--color-primary-600)); font-weight: 600; text-decoration: none;">Back to login</a>
</p>
</div>

<div id="success-message-container" style="display: none;">
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; text-align: center;">
<div style="font-size: 3rem; margin-bottom: 1rem;">✉️</div>
<h2 style="margin-top: 0; margin-bottom: 1rem;">Check Your Email</h2>
<p style="color: rgb(var(--color-neutral-600)); margin-bottom: 1.5rem;">
If an account exists for <strong id="submitted-email"></strong>, you will receive an email with instructions to reset your password.
</p>
<p style="color: rgb(var(--color-neutral-600)); font-size: 0.875rem; margin-bottom: 1.5rem;">
Please check your spam folder if you don't see the email within a few minutes.
</p>
<a href="/login" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; text-decoration: none; display: inline-block;">
Back to Login
</a>
</div>
</div>
</div>

<script>
(function() {
const API_BASE = window.__DB_API_BASE || 'https://dicebastion-memberships.ncalamaro.workers.dev';
const form = document.getElementById('forgot-password-form');
const submitBtn = document.getElementById('submit-btn');
const errorDiv = document.getElementById('error-message');
const requestContainer = document.getElementById('request-form-container');
const successContainer = document.getElementById('success-message-container');
const submittedEmailSpan = document.getElementById('submitted-email');

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

const email = document.getElementById('reset-email').value.trim();

if (!email) {
showError('Please enter your email address');
return;
}

submitBtn.disabled = true;
submitBtn.textContent = 'Sending...';

try {
const response = await fetch(`${API_BASE}/password-reset/request`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({ email }),
});

if (!response.ok) {
const data = await response.json();
throw new Error(data.error || 'Failed to send reset email');
}

// Show success message (we always show this for security)
submittedEmailSpan.textContent = email;
requestContainer.style.display = 'none';
successContainer.style.display = 'block';
} catch (error) {
console.error('Password reset request error:', error);
showError(error.message || 'An error occurred. Please try again.');
submitBtn.disabled = false;
submitBtn.textContent = 'Send Reset Link';
}
});
})();
</script>
