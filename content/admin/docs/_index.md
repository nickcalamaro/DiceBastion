---
title: "Developer Documentation"
layout: "single"
showHero: false
showDate: false
---

<div id="docs-auth-guard" style="text-align: center; padding: 3rem;">
  <p style="color: rgb(var(--color-neutral-500));">Checking authentication...</p>
</div>

<div id="docs-content" style="display: none;">

<div style="margin-bottom: 2rem;">
  <a href="/admin/" style="color: rgb(var(--color-primary-600)); text-decoration: underline;">← Back to Admin Dashboard</a>
</div>

## Documentation Index

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem;">

<a href="/admin/docs/cookies/" style="display: block; padding: 1.5rem; background: rgb(var(--color-neutral-50)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; text-decoration: none; transition: all 0.2s;">
  <h3 style="margin: 0 0 0.5rem 0; color: rgb(var(--color-primary-600));">🍪 Cookie System</h3>
  <p style="margin: 0; color: rgb(var(--color-neutral-600)); font-size: 0.9rem;">GDPR consent, analytics, and third-party cookies</p>
</a>

<div style="display: block; padding: 1.5rem; background: rgb(var(--color-neutral-50)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; opacity: 0.6;">
  <h3 style="margin: 0 0 0.5rem 0; color: rgb(var(--color-neutral-500));">💳 Payment Flow</h3>
  <p style="margin: 0; color: rgb(var(--color-neutral-500)); font-size: 0.9rem;">Coming soon</p>
</div>

<div style="display: block; padding: 1.5rem; background: rgb(var(--color-neutral-50)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; opacity: 0.6;">
  <h3 style="margin: 0 0 0.5rem 0; color: rgb(var(--color-neutral-500));">🗃️ Database Schema</h3>
  <p style="margin: 0; color: rgb(var(--color-neutral-500)); font-size: 0.9rem;">Coming soon</p>
</div>

</div>

</div>

<script>
(function(){
  const API = 'https://dicebastion-memberships.ncalamaro.workers.dev';
  const guard = document.getElementById('docs-auth-guard');
  const content = document.getElementById('docs-content');
  
  async function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      guard.innerHTML = '<p style="color: rgb(var(--color-neutral-600));">Access denied. <a href="/admin/" style="color: rgb(var(--color-primary-600)); text-decoration: underline;">Login to admin</a></p>';
      return;
    }
    
    try {
      const r = await fetch(API + '/admin/verify', {
        headers: { 'X-Session-Token': token }
      });
      if (r.ok) {
        guard.style.display = 'none';
        content.style.display = 'block';
      } else {
        guard.innerHTML = '<p style="color: rgb(var(--color-neutral-600));">Session expired. <a href="/admin/" style="color: rgb(var(--color-primary-600)); text-decoration: underline;">Login to admin</a></p>';
      }
    } catch (e) {
      guard.innerHTML = '<p style="color: rgb(var(--color-neutral-600));">Authentication check failed. <a href="/admin/" style="color: rgb(var(--color-primary-600)); text-decoration: underline;">Go to admin</a></p>';
    }
  }
  checkAuth();
})();
</script>
