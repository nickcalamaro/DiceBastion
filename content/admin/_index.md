---
title: "Admin Dashboard"
layout: "single"
showHero: false
showDate: false
---

<!-- Shared Utilities -->
<script src="/js/utils.js"></script>
<script src="/js/modal.js"></script>
<script src="/js/richTextEditor.js"></script>

<!-- Cropper.js for image cropping -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js"></script>

<style>
/* Admin Dashboard - Minimal Custom Styles */
/* Inherits from forms.css, only unique admin components */

.admin-container { max-width: 450px; margin: 5rem auto; padding: 0 1rem; }
.admin-wide-container { max-width: 600px; margin: 5rem auto; padding: 0 1rem; }
.admin-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.admin-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
.admin-flex { display: flex; gap: 1rem; }
.admin-flex-center { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.admin-flex-between { display: flex; justify-content: space-between; align-items: center; }
.admin-text-center { text-align: center; }
.admin-text-small { color: rgb(var(--color-neutral-500)); font-size: 0.875rem; }
.dark .admin-text-small { color: rgb(var(--color-neutral-400)); }
.admin-mb-1 { margin-bottom: 1rem; }
.admin-mb-2 { margin-bottom: 2rem; }
.admin-mt-0 { margin-top: 0; }
.admin-m-0 { margin: 0; }
.admin-icon-lg { font-size: 3rem; margin-bottom: 1rem; }

/* Rich Text Editor */
.admin-editor { border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; min-height: 200px; background: white; }
.dark .admin-editor { background: rgb(var(--color-neutral-800)); border-color: rgb(var(--color-neutral-600)); }
.admin-editor-toolbar { border-bottom: 1px solid rgb(var(--color-neutral-200)); padding: 0.5rem; background: rgb(var(--color-neutral-50)); display: flex; gap: 0.5rem; flex-wrap: wrap; }
.dark .admin-editor-toolbar { background: rgb(var(--color-neutral-900)); border-bottom-color: rgb(var(--color-neutral-700)); }
.admin-editor-btn { padding: 0.5rem; border: 1px solid rgb(var(--color-neutral-300)); background: white; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
.dark .admin-editor-btn { background: rgb(var(--color-neutral-800)); border-color: rgb(var(--color-neutral-600)); color: rgb(var(--color-neutral-200)); }
.admin-editor-btn:hover { background: rgb(var(--color-neutral-100)); }
.dark .admin-editor-btn:hover { background: rgb(var(--color-neutral-700)); }
.admin-editor-content { padding: 1rem; min-height: 150px; outline: none; font-family: inherit; color: rgb(var(--color-neutral-900)); }
.dark .admin-editor-content { color: rgb(var(--color-neutral-100)); }

/* Tabs */
.admin-tab-bar { border-bottom: 2px solid rgb(var(--color-neutral-200)); margin-bottom: 2rem; }
.dark .admin-tab-bar { border-bottom-color: rgb(var(--color-neutral-700)); }
.admin-tab-btn { padding: 1rem 2rem; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: rgb(var(--color-neutral-600)); transition: color 0.2s, border-color 0.2s; }
.dark .admin-tab-btn { color: rgb(var(--color-neutral-400)); }
.admin-tab-btn:hover { color: rgb(var(--color-neutral-800)); }
.dark .admin-tab-btn:hover { color: rgb(var(--color-neutral-200)); }
.admin-tab-btn.active { border-bottom-color: rgb(var(--color-primary-600)); color: rgb(var(--color-primary-600)); }
.dark .admin-tab-btn.active { border-bottom-color: rgb(var(--color-primary-400)); color: rgb(var(--color-primary-400)); }

/* Deep-link section headings (e.g. /admin#bookings-upcoming) */
.admin-section-heading { scroll-margin-top: 5rem; margin: 0 0 1rem 0; font-size: 1.125rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.admin-section-heading .admin-permalink { font-size: 0.75rem; font-weight: 500; color: rgb(var(--color-neutral-400)); text-decoration: none; opacity: 0.65; }
.admin-section-heading .admin-permalink:hover { opacity: 1; text-decoration: underline; color: rgb(var(--color-primary-600)); }
.admin-jump-links { display: flex; flex-wrap: wrap; gap: 0.35rem 1rem; margin-bottom: 1.25rem; padding: 0.65rem 1rem; background: rgb(var(--color-neutral-50)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 8px; font-size: 0.875rem; }
.dark .admin-jump-links { background: rgb(var(--color-neutral-900)); border-color: rgb(var(--color-neutral-700)); }
.admin-jump-links a { color: rgb(var(--color-primary-600)); text-decoration: none; }
.admin-jump-links a:hover { text-decoration: underline; }
/* Schedule greens/reds — Blowfish scheme has no --color-success/danger tokens */
#bookings-tab {
  --sch-green-50: 240, 253, 244;
  --sch-green-100: 220, 252, 231;
  --sch-green-200: 167, 243, 208;
  --sch-green-300: 110, 231, 183;
  --sch-green-500: 16, 185, 129;
  --sch-green-600: 5, 150, 105;
  --sch-green-700: 4, 120, 87;
  --sch-green-800: 6, 95, 70;
  --sch-green-900: 6, 78, 59;
  --sch-red-50: 254, 242, 242;
  --sch-red-100: 254, 226, 226;
  --sch-red-200: 254, 202, 202;
  --sch-red-300: 252, 165, 165;
  --sch-red-500: 239, 68, 68;
  --sch-red-600: 220, 38, 38;
  --sch-red-700: 185, 28, 28;
  --sch-red-800: 153, 27, 27;
  --sch-red-900: 127, 29, 29;
}
.admin-schedule-legend { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin: 0 0 1rem 0; padding: 0; list-style: none; }
.admin-schedule-legend li { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 600; color: rgb(var(--color-neutral-600)); }
.dark .admin-schedule-legend li { color: rgb(var(--color-neutral-400)); }
.admin-schedule-legend-swatch { width: 0.65rem; height: 0.65rem; border-radius: 2px; flex-shrink: 0; }
.admin-schedule-legend-swatch--event { background: rgb(var(--sch-green-500)); }
.admin-schedule-legend-swatch--booking { background: rgb(var(--color-primary-500)); }
.admin-schedule-legend-swatch--block { background: rgb(var(--sch-red-500)); }
.admin-schedule-month { display: flex; align-items: center; gap: 0.85rem; margin: 1.35rem 0 0.65rem; }
.admin-schedule-month:first-child { margin-top: 0; }
.admin-schedule-month-label { font-size: 0.9375rem; font-weight: 700; color: rgb(var(--color-neutral-800)); white-space: nowrap; letter-spacing: -0.01em; }
.dark .admin-schedule-month-label { color: rgb(var(--color-neutral-100)); }
.admin-schedule-month-line { flex: 1; height: 1px; background: rgb(var(--color-neutral-200)); }
.dark .admin-schedule-month-line { background: rgb(var(--color-neutral-700)); }
.admin-schedule-list { display: flex; flex-direction: column; gap: 0.5rem; }
.admin-schedule-row {
  display: grid;
  grid-template-columns: 76px 1fr auto;
  gap: 1rem;
  align-items: start;
  padding: 0.85rem 1rem;
  border: 1px solid rgb(var(--color-neutral-200));
  border-radius: 10px;
  background: rgb(var(--color-neutral-50));
  border-left-width: 4px;
}
.dark .admin-schedule-row { background: rgb(var(--color-neutral-900)); border-color: rgb(var(--color-neutral-700)); }
.admin-schedule-row--event { border-left-color: rgb(var(--sch-green-500)); }
.dark .admin-schedule-row--event { border-left-color: rgb(var(--sch-green-500)); }
.admin-schedule-row--booking { border-left-color: rgb(var(--color-primary-500)); }
.dark .admin-schedule-row--booking { border-left-color: rgb(var(--color-primary-500)); }
.admin-schedule-row--block { border-left-color: rgb(var(--sch-red-500)); }
.dark .admin-schedule-row--block { border-left-color: rgb(var(--sch-red-500)); }
.admin-schedule-date-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 76px;
  padding: 0.4rem 0.35rem;
  border-radius: 8px;
  background: rgb(var(--color-neutral));
  border: 1px solid rgb(var(--color-neutral-200));
  line-height: 1.15;
}
.dark .admin-schedule-date-box { background: rgb(var(--color-neutral-800)); border-color: rgb(var(--color-neutral-600)); }
.admin-schedule-date-dow { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; color: rgb(var(--color-neutral-500)); margin-bottom: 0.15rem; }
.admin-schedule-date-day { font-size: 1.625rem; font-weight: 700; color: rgb(var(--color-neutral-800)); }
.dark .admin-schedule-date-day { color: rgb(var(--color-neutral-100)); }
.admin-schedule-date-month { font-size: 0.75rem; font-weight: 600; color: rgb(var(--color-neutral-600)); margin-top: 0.1rem; }
.dark .admin-schedule-date-month { color: rgb(var(--color-neutral-400)); }
.admin-schedule-body-title { font-weight: 600; font-size: 1rem; margin: 0 0 0.25rem 0; color: rgb(var(--color-neutral-900)); }
.dark .admin-schedule-body-title { color: rgb(var(--color-neutral-100)); }
.admin-schedule-body-subtitle { font-size: 0.8125rem; font-weight: 400; color: rgb(var(--color-neutral-600)); line-height: 1.4; margin: -0.1rem 0 0.35rem 0; }
.dark .admin-schedule-body-subtitle { color: rgb(var(--color-neutral-400)); }
.admin-schedule-body-meta { font-size: 0.8125rem; color: rgb(var(--color-neutral-600)); line-height: 1.45; margin: 0; }
.dark .admin-schedule-body-meta { color: rgb(var(--color-neutral-400)); }
.admin-schedule-badge { display: inline-block; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.15rem 0.45rem; border-radius: 4px; margin-right: 0.35rem; vertical-align: middle; }
.admin-schedule-badge--event { background: rgb(var(--sch-green-50)); color: rgb(var(--sch-green-700)); }
.dark .admin-schedule-badge--event { background: rgba(var(--sch-green-900), 0.25); color: rgb(var(--sch-green-300)); }
.admin-schedule-badge--booking { background: rgb(var(--color-primary-50)); color: rgb(var(--color-primary-700)); }
.dark .admin-schedule-badge--booking { background: rgba(var(--color-primary-900), 0.25); color: rgb(var(--color-primary-300)); }
.admin-schedule-badge--block { background: rgb(var(--sch-red-50)); color: rgb(var(--sch-red-700)); }
.dark .admin-schedule-badge--block { background: rgba(var(--sch-red-900), 0.25); color: rgb(var(--sch-red-300)); }
.admin-schedule-actions { display: flex; flex-direction: column; gap: 0.35rem; align-items: flex-end; }
@media (max-width: 640px) {
  .admin-schedule-row { grid-template-columns: 64px 1fr; }
  .admin-schedule-actions { grid-column: 1 / -1; flex-direction: row; justify-content: flex-end; }
}

/* Info/category containers */
.admin-info-box { background: rgb(var(--color-neutral-100)); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; }
.dark .admin-info-box { background: rgb(var(--color-neutral-900)); }
.admin-category-container { display: flex; flex-wrap: wrap; gap: 0.5rem; min-height: 2rem; padding: 0.5rem; border: 1px solid rgb(var(--color-neutral-200)); border-radius: 6px; background: rgb(var(--color-neutral-50)); }
.dark .admin-category-container { background: rgb(var(--color-neutral-900)); border-color: rgb(var(--color-neutral-700)); }

/* Item cards (extends forms.css .card) */
.item-card { background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; }
.dark .item-card { background: rgb(var(--color-neutral-800)); border-color: rgb(var(--color-neutral-700)); }
.item-card h3 { margin-top: 0; margin-bottom: 0.5rem; color: rgb(var(--color-neutral-900)); }
.dark .item-card h3 { color: rgb(var(--color-neutral-100)); }
.item-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }

/* Recurring fields container */
.recurring-container { padding: 1rem; background: rgb(var(--color-neutral-50)); border-radius: 6px; border: 1px solid rgb(var(--color-neutral-200)); }
.dark .recurring-container { background: rgb(var(--color-neutral-900)); border-color: rgb(var(--color-neutral-700)); }

/* Collapsible SEO section */
.seo-toggle-btn { display: flex; align-items: center; gap: 0.5rem; background: none; border: 1px solid rgb(var(--color-neutral-200)); border-radius: 6px; padding: 0.625rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.875rem; color: rgb(var(--color-neutral-600)); width: 100%; transition: all 0.2s; }
.dark .seo-toggle-btn { border-color: rgb(var(--color-neutral-700)); color: rgb(var(--color-neutral-400)); }
.seo-toggle-btn:hover { background: rgb(var(--color-neutral-50)); color: rgb(var(--color-neutral-800)); }
.dark .seo-toggle-btn:hover { background: rgb(var(--color-neutral-900)); color: rgb(var(--color-neutral-200)); }
.seo-toggle-btn .seo-chevron { transition: transform 0.2s; font-size: 0.75rem; }
.seo-toggle-btn.is-open .seo-chevron { transform: rotate(90deg); }
.seo-section-body { display: none; padding: 1rem; margin-top: 0.5rem; background: rgb(var(--color-neutral-50)); border-radius: 6px; border: 1px solid rgb(var(--color-neutral-200)); }
.dark .seo-section-body { background: rgb(var(--color-neutral-900)); border-color: rgb(var(--color-neutral-700)); }
.seo-section-body.is-open { display: block; }
.seo-info-banner { display: flex; gap: 0.5rem; padding: 0.625rem 0.75rem; background: rgb(var(--color-primary-50)); border: 1px solid rgb(var(--color-primary-200)); border-radius: 6px; margin-bottom: 1rem; font-size: 0.813rem; color: rgb(var(--color-primary-700)); line-height: 1.4; }
.dark .seo-info-banner { background: rgba(var(--color-primary-900), 0.2); border-color: rgba(var(--color-primary-700), 0.4); color: rgb(var(--color-primary-300)); }
.seo-tooltip-trigger { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-600)); font-size: 0.7rem; font-weight: 700; cursor: help; position: relative; flex-shrink: 0; }
.dark .seo-tooltip-trigger { background: rgb(var(--color-neutral-700)); color: rgb(var(--color-neutral-300)); }
.seo-tooltip-trigger .seo-tooltip { display: none; position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); width: 280px; padding: 0.75rem; background: rgb(var(--color-neutral-900)); color: rgb(var(--color-neutral-100)); border-radius: 8px; font-size: 0.78rem; font-weight: 400; line-height: 1.5; box-shadow: 0 4px 16px rgba(0,0,0,0.25); z-index: 100; text-align: left; }
.seo-tooltip-trigger:hover .seo-tooltip, .seo-tooltip-trigger:focus .seo-tooltip { display: block; }
.seo-tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: rgb(var(--color-neutral-900)); }

/* Stat cards */
.stat-card { border-radius: 12px; padding: 1.5rem; color: white; }
.stat-card-label { font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem; }
.stat-card-value { font-size: 2rem; font-weight: 700; }

/* Table container */
.table-wrapper { background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; overflow: hidden; }
.dark .table-wrapper { background: rgb(var(--color-neutral-800)); border-color: rgb(var(--color-neutral-700)); }
.table-wrapper table { width: 100%; border-collapse: collapse; }
.table-wrapper thead { background: rgb(var(--color-neutral-100)); }
.dark .table-wrapper thead { background: rgb(var(--color-neutral-900)); }
.table-wrapper th { padding: 1rem; text-align: left; font-weight: 600; border-bottom: 1px solid rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-900)); }
.dark .table-wrapper th { border-bottom-color: rgb(var(--color-neutral-700)); color: rgb(var(--color-neutral-100)); }
.table-wrapper td { padding: 1rem; border-bottom: 1px solid rgb(var(--color-neutral-100)); color: rgb(var(--color-neutral-900)); }
.dark .table-wrapper td { border-bottom-color: rgb(var(--color-neutral-800)); color: rgb(var(--color-neutral-100)); }

/* Image cropper */
.image-preview { max-width: 200px; max-height: 200px; border-radius: 6px; margin-top: 0.5rem; }
/* Event export previews: fixed frame + cover so card/hero match how they render on site */
.event-export-thumb { margin-top: 0.5rem; border-radius: 6px; overflow: hidden; background: rgb(var(--color-neutral-200)); }
.dark .event-export-thumb { background: rgb(var(--color-neutral-700)); }
.event-export-thumb--main { width: 200px; aspect-ratio: 800 / 379; }
.event-export-thumb--card { width: 200px; aspect-ratio: 400 / 238; }
.event-export-thumb--hero { width: 200px; aspect-ratio: 885 / 300; }
.event-export-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; margin: 0; max-width: none; max-height: none; }
#crop-modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; align-items: center; justify-content: center; }
#crop-modal.is-open { display: flex; }
.crop-container { background: white; border-radius: 12px; padding: 1rem 2rem 2rem 2rem; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; overflow-y: auto; }
.dark .crop-container { background: rgb(var(--color-neutral-800)); color: rgb(var(--color-neutral-100)); }
.crop-container h2 { margin-top: 0; margin-bottom: 1rem; }
.crop-image-container { max-height: 50vh; margin: 1rem 0; overflow: hidden; position: relative; }
.crop-image-container.eyedropper-active { cursor: crosshair !important; }
.crop-image-container.eyedropper-active .cropper-face, .crop-image-container.eyedropper-active .cropper-point, .crop-image-container.eyedropper-active .cropper-line { cursor: crosshair !important; }
.crop-bg-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.crop-bg-btn { padding: 0.375rem 0.75rem; background: rgb(var(--color-neutral-100)); border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; cursor: pointer; font-size: 0.813rem; transition: all 0.15s; }
.dark .crop-bg-btn { background: rgb(var(--color-neutral-700)); border-color: rgb(var(--color-neutral-600)); color: rgb(var(--color-neutral-200)); }
.crop-bg-btn:hover { background: rgb(var(--color-neutral-200)); }
.dark .crop-bg-btn:hover { background: rgb(var(--color-neutral-600)); }
.crop-bg-btn.active { background: rgb(var(--color-primary-600)); color: white; border-color: rgb(var(--color-primary-600)); }
.crop-bg-swatch { display: inline-block; width: 20px; height: 20px; border-radius: 4px; border: 2px solid rgb(var(--color-neutral-300)); vertical-align: middle; }
</style>

<div id="admin-page">
<!-- Login Form -->
<div id="login-container" class="admin-container">
<h1 class="admin-text-center admin-mb-2">Admin Login</h1>
<form id="login-form" class="card card-centered">
<div class="form-group">
<label for="admin-email" class="form-label">Email</label>
<input type="email" id="admin-email" required autocomplete="email" class="form-input">
</div>
<div class="form-group">
<label for="admin-password" class="form-label">Password</label>
<input type="password" id="admin-password" required autocomplete="current-password" class="form-input">
</div>
<button type="submit" class="btn btn-primary btn-full">
Login
</button>
<div id="login-error" class="alert alert-error" style="display: none;"></div>
</form>
</div>

<!-- Non-Admin Message -->
<div id="non-admin-container" class="admin-wide-container" style="display: none;">
<div class="card card-centered admin-text-center">
<div class="admin-icon-lg">🔒</div>
<h2 class="admin-mt-0 admin-mb-1">Admin Access Required</h2>
<p style="color: rgb(var(--color-neutral-600)); margin-bottom: 1.5rem;">
You're logged in as <strong id="non-admin-email-display"></strong>, but you don't have admin privileges.
</p>
<div class="admin-info-box">
<p class="admin-m-0" style="color: rgb(var(--color-neutral-700));">
<span class="dark:text-neutral-300">If you need to manage products, events, or orders, please contact our team to request admin access.</span>
</p>
</div>
<div class="admin-flex-center">
<a href="/" class="btn btn-primary" style="text-decoration: none;">
Go to Home
</a>
<a href="/events" class="btn btn-secondary" style="text-decoration: none;">
Browse Events
</a>
<button id="non-admin-logout-btn" class="btn btn-secondary">
Logout
</button>
</div>
</div>
</div>

<!-- Admin Dashboard -->
<div id="admin-dashboard" style="display: none;">
<div class="admin-flex-between admin-mb-2">
  <h1 class="admin-m-0">Admin Dashboard</h1>
  <div class="admin-flex">
    <a href="/admin/docs/" class="link" style="display: flex; align-items: center; gap: 0.5rem;">
      📚 <span>Developer Docs</span>
    </a>
    <button id="logout-btn" class="btn btn-secondary btn-sm">
      Logout
    </button>
  </div>
</div>

<!-- Tabs -->
<div class="admin-tab-bar">
<button class="admin-tab-btn tab-btn active" data-tab="products">Products</button>
<button class="admin-tab-btn tab-btn" data-tab="shop-promos">Shop promo codes</button>
<button class="admin-tab-btn tab-btn" data-tab="events">Events</button>
<button class="admin-tab-btn tab-btn" data-tab="registrations">Registrations</button>
<button class="admin-tab-btn tab-btn" data-tab="orders">Orders</button>
<button class="admin-tab-btn tab-btn" data-tab="memberships">Memberships</button>
<button class="admin-tab-btn tab-btn" data-tab="bookings">Bookings & Calendar</button>
<button class="admin-tab-btn tab-btn" data-tab="cron">Cron Jobs</button>
<button class="admin-tab-btn tab-btn" data-tab="newsletter">Newsletter</button>
<button class="admin-tab-btn tab-btn" data-tab="blog">Blog</button>
</div>

<nav class="admin-jump-links admin-mb-2" aria-label="Admin sections">
<span style="color: rgb(var(--color-neutral-500));">Quick links:</span>
<a href="#products">Products</a>
<a href="#shop-promos">Shop promos</a>
<a href="#events">Events</a>
<a href="#registrations">Registrations</a>
<a href="#orders">Orders</a>
<a href="#memberships">Memberships</a>
<a href="#bookings">Bookings</a>
<a href="#bookings-upcoming">Upcoming</a>
<a href="#cron">Cron</a>
<a href="#newsletter">Newsletter</a>
<a href="#blog">Blog</a>
</nav>

<!-- Products Tab -->
<div id="products-tab" class="tab-content">
<div class="card card-compact">
<h2 id="product-form-title" class="admin-section-heading">Add New Product</h2>
<form id="product-form">
<input type="hidden" id="product-id">

<div class="admin-grid-2 admin-mb-1">
<div>
<label class="form-label">Product Name *</label>
<input type="text" id="product-name" required class="form-input">
</div>
<div>
<label class="form-label">URL Slug *</label>
<input type="text" id="product-slug" required class="form-input">
<small class="admin-text-small">Auto-generated from name</small>
</div>
</div>

<div class="admin-mb-1">
<label class="form-label">Summary</label>
<textarea id="product-summary" rows="2" placeholder="Brief description shown on product cards" class="form-textarea"></textarea>
<small class="admin-text-small">Short text displayed on product cards</small>
</div>

<div class="admin-mb-1">
<label class="form-label">Full Description</label>
<div class="admin-editor">
<div class="admin-editor-toolbar">
<button type="button" onclick="formatText('bold')" class="admin-editor-btn" style="font-weight: bold;">B</button>
<button type="button" onclick="formatText('italic')" class="admin-editor-btn" style="font-style: italic;">I</button>
<button type="button" onclick="formatText('underline')" class="admin-editor-btn" style="text-decoration: underline;">U</button>
<button type="button" onclick="formatText('insertUnorderedList')" class="admin-editor-btn">• List</button>
<button type="button" onclick="insertLink()" class="admin-editor-btn">🔗 Link</button>
</div>
<div id="description-content" contenteditable="true" class="admin-editor-content" placeholder="Detailed product description with formatting..."></div>
</div>
<small class="admin-text-small">Rich text shown in product details modal</small>
</div>

<div class="admin-grid-3 admin-mb-1">
<div>
<label class="form-label">Price (£) *</label>
<input type="number" id="product-price" step="0.01" required class="form-input">
</div>
<div>
<label class="form-label">Stock Quantity *</label>
<input type="number" id="product-stock" required class="form-input">
</div>
</div>

<div class="admin-mb-1">
<label class="form-label">Categories (up to 3)</label>
<div id="category-tags" class="admin-category-container"></div>
<div class="admin-flex">
<input type="text" id="category-input" placeholder="Type category name..." class="form-input" style="flex: 1;">
<button type="button" onclick="addCategory()" class="btn btn-primary" style="padding: 0.75rem 1.5rem;">Add</button>
</div>
<div id="existing-categories" class="admin-flex" style="margin-top: 0.5rem;"></div>
<small class="admin-text-small">Click existing categories below to add them, or type a new one</small>
</div>

<div class="admin-mb-1">
<label class="form-label">Image URL</label>
<input type="url" id="product-image" placeholder="https://..." class="form-input">
<small class="admin-text-small">Or upload an image below</small>
</div>

<div class="admin-mb-1">
<label class="form-label">Upload Image</label>
<input type="file" id="product-image-upload" accept="image/*" class="form-input">
<div id="product-image-preview" style="margin-top: 0.5rem;"></div>
</div>

<div class="checkbox-group admin-mb-1">
<input type="checkbox" id="product-active" checked class="checkbox-input">
<label for="product-active" class="checkbox-label">Active (visible in shop)</label>
</div>

<div class="checkbox-group admin-mb-1">
<input type="checkbox" id="product-preorder" onchange="togglePreorderDate()" class="checkbox-input">
<label for="product-preorder" class="checkbox-label">This is a pre-order item</label>
</div>

<div id="preorder-date-container" class="admin-mb-1" style="display: none;">
<label class="form-label">Expected Release Date</label>
<input type="date" id="product-release-date" class="form-input">
</div>

<div class="admin-flex">
<button type="submit" class="btn btn-primary" style="flex: 1;">
<span id="product-submit-text">Add Product</span>
</button>
<button type="button" id="cancel-product-edit" class="btn btn-secondary" style="display: none;">Cancel</button>
</div>
</form>
</div>

<h2 id="admin-section-products" class="admin-section-heading">Products <a href="#products" class="admin-permalink" aria-label="Link to products">#</a></h2>
<div id="products-list"></div>
</div>

<!-- Shop promo codes (checkout on shop.dicebastion.com) -->
<div id="shop-promos-tab" class="tab-content" style="display: none;">
<div class="admin-info-box admin-mb-2">
<p class="admin-m-0" style="color: rgb(var(--color-neutral-700));">
These codes apply at <strong>shop.dicebastion.com</strong> checkout. Rules live in <code>rules_json</code> (members-only, product IDs, categories, <code>apply_scope</code>).
</p>
</div>
<div class="card card-compact admin-mb-2">
<h2 id="admin-section-shop-promos" class="admin-section-heading admin-mt-0">New / edit promo code <a href="#shop-promos" class="admin-permalink" aria-label="Link to shop promos">#</a></h2>
<form id="shop-promo-form">
<input type="hidden" id="shop-promo-id">
<div class="admin-grid-2 admin-mb-1">
<div>
<label class="form-label" for="shop-promo-code">Code (customer enters) *</label>
<input type="text" id="shop-promo-code" required class="form-input" placeholder="SAVE10" autocomplete="off">
<small class="admin-text-small">Stored uppercase; spaces stripped</small>
</div>
<div>
<label class="form-label" for="shop-promo-label">Admin label</label>
<input type="text" id="shop-promo-label" class="form-input" placeholder="Spring sale">
</div>
</div>
<div class="admin-grid-2 admin-mb-1">
<div>
<label class="form-label" for="shop-promo-discount-type">Discount type *</label>
<select id="shop-promo-discount-type" class="form-input">
<option value="percent">Percent off eligible amount</option>
<option value="fixed_pence">Fixed amount (pence) off eligible amount</option>
</select>
</div>
<div>
<label class="form-label" for="shop-promo-discount-value">Discount value *</label>
<input type="number" id="shop-promo-discount-value" required min="1" value="10" class="form-input">
<small class="admin-text-small" id="shop-promo-value-hint">Percent (1–100) or whole pence (£1 = 100)</small>
</div>
</div>
<div class="admin-grid-2 admin-mb-1">
<div>
<label class="form-label" for="shop-promo-starts">Starts at (optional)</label>
<input type="datetime-local" id="shop-promo-starts" class="form-input">
</div>
<div>
<label class="form-label" for="shop-promo-ends">Ends at (optional)</label>
<input type="datetime-local" id="shop-promo-ends" class="form-input">
</div>
</div>
<div class="admin-grid-2 admin-mb-1">
<div>
<label class="form-label" for="shop-promo-max-uses">Max redemptions</label>
<input type="number" id="shop-promo-max-uses" min="0" class="form-input" placeholder="Unlimited">
</div>
<div>
<label class="form-label" for="shop-promo-min-subtotal">Minimum subtotal (pence)</label>
<input type="number" id="shop-promo-min-subtotal" min="0" class="form-input" placeholder="None">
</div>
</div>
<div class="checkbox-group admin-mb-1">
<input type="checkbox" id="shop-promo-active" checked class="checkbox-input">
<label for="shop-promo-active" class="checkbox-label">Active (visible at checkout)</label>
</div>
<div class="checkbox-group admin-mb-1">
<input type="checkbox" id="shop-promo-require-member" class="checkbox-input">
<label for="shop-promo-require-member" class="checkbox-label">Require active Dice Bastion membership (checkout email must match a member)</label>
</div>
<div class="admin-mb-1">
<label class="form-label" for="shop-promo-product-ids">Restrict to product IDs (comma-separated)</label>
<input type="text" id="shop-promo-product-ids" class="form-input" placeholder="e.g. 12, 44">
<small class="admin-text-small">Leave empty for all products</small>
</div>
<div class="admin-mb-1">
<label class="form-label" for="shop-promo-categories">Restrict to categories (comma-separated)</label>
<input type="text" id="shop-promo-categories" class="form-input" placeholder="e.g. Miniatures, Dice">
<small class="admin-text-small">Must match product category tags exactly</small>
</div>
<div class="admin-mb-1">
<label class="form-label" for="shop-promo-apply-scope">Apply scope</label>
<select id="shop-promo-apply-scope" class="form-input">
<option value="eligible_lines">Eligible lines only</option>
<option value="whole_subtotal_if_any_match">Whole basket subtotal if any line matches</option>
</select>
</div>
<div class="admin-flex">
<button type="submit" id="shop-promo-save-btn" class="btn btn-primary">Save promo code</button>
<button type="button" id="shop-promo-cancel-btn" class="btn btn-secondary" style="display: none;">Cancel edit</button>
</div>
</form>
</div>
<h2>Existing codes</h2>
<div id="shop-promo-list"></div>
</div>

<!-- Events Tab -->
<div id="events-tab" class="tab-content" style="display: none;">
<div class="card card-compact">
<h2 id="event-form-title" class="admin-section-heading">Add New Event</h2>
<form id="event-form">
<input type="hidden" id="event-id">

<div class="form-group">
<label class="form-label">Event Title *</label>
<input type="text" id="event-title" required class="form-input">
</div>

<div class="form-group">
<label class="form-label">Organised By</label>
<input type="text" id="event-organiser" placeholder="e.g., John Smith, Gaming Club" class="form-input">
<small class="admin-text-small">Person or group organising this event (optional)</small>
</div>

<div class="form-group">
<label class="form-label">URL Slug *</label>
<input type="text" id="event-slug" required class="form-input" style="font-family: monospace;">
<small class="admin-text-small">Auto-generated from title, used in URL</small>
</div>

<div class="form-group">
<label class="form-label">Summary</label>
<textarea id="event-description" rows="3" class="form-textarea" placeholder="Short description for event cards..."></textarea>
<small class="admin-text-small">Brief summary shown on events listing</small>
</div>

<div class="form-group admin-mb-1">
<button type="button" class="seo-toggle-btn" onclick="toggleSeoSection()">
<span class="seo-chevron">▶</span> 🔍 Google Event SEO Settings
</button>
<div id="seo-section-body" class="seo-section-body">
<div class="seo-info-banner">
<span>ℹ️</span>
<span>These fields control how your event appears in Google Search results and social media previews. All fields are optional — sensible defaults are used when empty.</span>
</div>

<div class="form-group">
<label class="form-label">SEO Description</label>
<textarea id="event-seo-description" rows="2" maxlength="160" class="form-textarea" placeholder="Custom description for search engines and social previews..."></textarea>
<small class="admin-text-small">Max 160 chars. Falls back to Summary if empty. Used for meta description, Open Graph & Twitter Cards.</small>
</div>

<div class="form-group">
<div style="display: flex; align-items: center; gap: 0.375rem;">
<label class="form-label" style="margin-bottom: 0;">Organizer Name Override</label>
<span class="seo-tooltip-trigger" tabindex="0">?
<span class="seo-tooltip">By default the Google schema uses the <strong>Organised By</strong> field above. If that's empty it defaults to <strong>Dice Bastion</strong>. Use this field only if you need a different name specifically for Google's event schema (e.g. a more formal organisation name).</span>
</span>
</div>
<input type="text" id="event-seo-organizer" class="form-input" placeholder="Leave empty to use Organised By field or 'Dice Bastion'">
<small class="admin-text-small">Overrides schema.org organizer.name for Google Event markup only.</small>
</div>

<div class="form-group">
<div style="display: flex; align-items: center; gap: 0.375rem;">
<label class="form-label" style="margin-bottom: 0;">SEO Image Override</label>
<span class="seo-tooltip-trigger" tabindex="0">?
<span class="seo-tooltip"><strong>Google Image Guidelines:</strong><br>• Minimum width: 720px (1920px recommended)<br>• Minimum 50K total pixels (w×h)<br>• Provide 16:9, 4:3 and/or 1:1 ratios<br>• Must be crawlable (not blocked by robots.txt)<br>• Use .jpg, .png or .webp format<br><br>The event's uploaded image is used by default. Only set this if you want a different image for Google.</span>
</span>
</div>
<input type="url" id="event-seo-image" class="form-input" placeholder="Leave empty to use event image">
<small class="admin-text-small">Optional override. Uses the event's main image by default.</small>
</div>

<div class="form-group" style="margin-bottom: 0;">
<label class="form-label">Location Preview</label>
<div style="padding: 0.5rem 0.75rem; background: rgb(var(--color-neutral-100)); border-radius: 6px; font-size: 0.875rem; color: rgb(var(--color-neutral-600));">
<span id="seo-location-preview">Gibraltar Warhammer Club</span> · Unit 23a Casemates Vaults, Gibraltar, GX11 1AA
</div>
<small class="admin-text-small">Location name comes from the Location field below (defaults to "Gibraltar Warhammer Club"). Address is fixed to Unit 23a Casemates Vaults.</small>
</div>
</div>
</div>

<div class="form-group">
<label class="form-label">Full Description</label>
<div id="event-description-editor" class="admin-editor">
<div class="admin-editor-toolbar">
<button type="button" onclick="formatEventText('bold')" class="admin-editor-btn" style="font-weight: bold;">B</button>
<button type="button" onclick="formatEventText('italic')" class="admin-editor-btn" style="font-style: italic;">I</button>
<button type="button" onclick="formatEventText('underline')" class="admin-editor-btn" style="text-decoration: underline;">U</button>
<button type="button" onclick="formatEventText('insertUnorderedList')" class="admin-editor-btn">• List</button>
<button type="button" onclick="insertEventLink()" class="admin-editor-btn">🔗 Link</button>
</div>
<div id="event-full-description" contenteditable="true" class="admin-editor-content" placeholder="Detailed event information..."></div>
</div>
<small class="admin-text-small">Rich text shown on event detail page</small>
</div>

<div id="one-time-date-fields" class="admin-grid-2 admin-mb-1">
  <div class="form-group">
    <label class="form-label">Date *</label>
    <input type="date" id="event-date" required class="form-input">
  </div>
  <div style="display: flex; gap: 0.75rem;">
    <div class="form-group" style="flex: 1;">
      <label class="form-label">Start Time</label>
      <input type="time" id="event-time" class="form-input">
    </div>
    <div class="form-group" style="flex: 1;">
      <label class="form-label">End Time</label>
      <input type="time" id="event-end-time" class="form-input">
    </div>
  </div>
</div>

<div class="form-group">
  <div class="checkbox-group admin-mb-1">
    <input type="checkbox" id="event-is-recurring" onchange="toggleRecurringFields()" class="checkbox-input">
    <label for="event-is-recurring" class="checkbox-label" style="font-weight: 600;">Recurring Event</label>
  </div>
  
  <div id="recurring-fields" class="recurring-container" style="display: none;">
    <div class="admin-grid-2 admin-mb-1">
      <div class="form-group">
        <label class="form-label">Recurrence Type</label>
        <select id="recurrence-type" onchange="updateRecurrenceFields()" class="form-select">
          <option value="weekly">Weekly</option>
          <option value="monthly_day">Monthly (by day)</option>
          <option value="monthly_date">Monthly (by date)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Time *</label>
        <input type="time" id="recurring-time" class="form-input">
      </div>
      <div class="form-group">
        <label class="form-label">End Time</label>
        <input type="time" id="recurring-end-time" class="form-input">
      </div>
    </div>

<div id="weekly-fields" class="form-group" style="display: none;">
    <label class="form-label">Day of Week</label>
    <select id="weekly-day" class="form-select">
    <option value="1">Monday</option>
    <option value="2">Tuesday</option>
    <option value="3">Wednesday</option>
    <option value="4">Thursday</option>
    <option value="5">Friday</option>
    <option value="6">Saturday</option>
    <option value="0">Sunday</option>
    </select>
</div>

<div id="monthly-day-fields" style="display: none;">
    <div class="admin-grid-2 admin-mb-1">
    <div class="form-group">
        <label class="form-label">Week of Month</label>
        <select id="monthly-week" class="form-select">
        <option value="1">First</option>
        <option value="2">Second</option>
        <option value="3">Third</option>
        <option value="4">Fourth</option>
        <option value="5">Last</option>
        </select>
    </div>
    <div class="form-group">
        <label class="form-label">Day of Week</label>
        <select id="monthly-day" class="form-select">
        <option value="1">Monday</option>
        <option value="2">Tuesday</option>
        <option value="3">Wednesday</option>
        <option value="4">Thursday</option>
        <option value="5">Friday</option>
        <option value="6">Saturday</option>
        <option value="0">Sunday</option>
        </select>
    </div>
    </div>
</div>

<div id="monthly-date-fields" class="form-group" style="display: none;">
    <label class="form-label">Day of Month</label>
    <input type="number" id="monthly-date" min="1" max="31" placeholder="15" class="form-input">
</div>

<div class="form-group">
    <label class="form-label">End Date (optional)</label>
    <input type="date" id="recurrence-end-date" class="form-input">
    <small class="admin-text-small">Leave empty for indefinite recurrence</small>
</div>
</div>
</div>

<div class="checkbox-group admin-mb-1">
  <input type="checkbox" id="event-requires-purchase" checked onchange="toggleEventPricing()" class="checkbox-input">
  <label for="event-requires-purchase" class="checkbox-label" style="font-weight: 600;">Requires Ticket Purchase</label>
</div>

<div id="event-pricing-fields">
<div class="admin-grid-3 admin-mb-1">
<div>
<label class="form-label">Member Price (£) *</label>
<input type="number" id="event-member-price" step="0.01" required class="form-input">
</div>
<div>
<label class="form-label">Non-Member Price (£) *</label>
<input type="number" id="event-nonmember-price" step="0.01" required class="form-input">
</div>
<div>
<label class="form-label">Max Attendees</label>
<input type="number" id="event-max-attendees" class="form-input">
</div>
</div>
</div>

<div class="form-group">
<label class="form-label">Location</label>
<input type="text" id="event-location" placeholder="Gibraltar Warhammer Club" class="form-input">
</div>

<div class="form-group">
<label class="form-label">Image URL</label>
<input type="url" id="event-image" placeholder="https://..." class="form-input">
<small class="admin-text-small">Or upload below — one crop produces 800×379 (general), 400×238 (cards), and 885×300 (modal hero), each with the same edge treatment.</small>
<input type="hidden" id="event-image-card" value="">
<input type="hidden" id="event-image-hero" value="">
</div>

<div class="form-group">
<label class="form-label">Upload Image</label>
<input type="file" id="event-image-upload" accept="image/*" class="form-input">
<div id="event-image-preview" style="margin-top: 0.5rem;"></div>
</div>

<div class="checkbox-group admin-mb-1">
<input type="checkbox" id="event-active" checked class="checkbox-input">
<label for="event-active" class="checkbox-label">Active (visible on website)</label>
</div>

<div class="admin-flex">
<button type="submit" class="btn btn-primary" style="flex: 1;">
<span id="event-submit-text">Add Event</span>
</button>
<button type="button" id="cancel-event-edit" class="btn btn-secondary" style="display: none;">Cancel</button>
</div>
</form>
</div>

<h2 id="admin-section-events" class="admin-section-heading">Events <a href="#events" class="admin-permalink" aria-label="Link to events list">#</a></h2>
<div id="events-list"></div>
</div>

<!-- Registrations Tab -->
<div id="registrations-tab" class="tab-content" style="display: none;">
<h2 id="admin-section-registrations" class="admin-section-heading">Event Registrations <a href="#registrations" class="admin-permalink" aria-label="Link to registrations">#</a></h2>
<p style="color: rgb(var(--color-neutral-600)); margin-bottom: 2rem;">View and manage event registrations and ticket purchases</p>
<div id="registrations-list"></div>
</div>

<!-- Orders Tab -->
<div id="orders-tab" class="tab-content" style="display: none;">
<h2 id="admin-section-orders" class="admin-section-heading">Recent Orders <a href="#orders" class="admin-permalink" aria-label="Link to orders">#</a></h2>
<div id="orders-list"></div>
</div>

<!-- Memberships Tab -->
<div id="memberships-tab" class="tab-content" style="display: none;">
<div class="admin-flex-between admin-mb-2">
<h2 id="admin-section-memberships" class="admin-section-heading admin-m-0">Active Memberships <a href="#memberships" class="admin-permalink" aria-label="Link to memberships">#</a></h2>
<div class="admin-flex">
<select id="membership-filter" onchange="loadMemberships()" class="form-select" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
<option value="all">All Memberships</option>
<option value="active">Active Only</option>
<option value="expiring">Expiring Soon (30 days)</option>
<option value="expired">Expired</option>
</select>
<button id="refresh-memberships-btn" onclick="loadMemberships()" class="btn btn-primary btn-sm">
🔄 Refresh
</button>
</div>
</div>

<!-- Membership Stats -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
<div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
<div class="stat-card-label">Total Active</div>
<div class="stat-card-value" id="stat-active">-</div>
</div>
<div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
<div class="stat-card-label">Expiring Soon</div>
<div class="stat-card-value" id="stat-expiring">-</div>
</div>
<div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
<div class="stat-card-label">Monthly Revenue</div>
<div class="stat-card-value" id="stat-monthly-revenue">-</div>
</div>
<div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
<div class="stat-card-label">Auto-Renewal</div>
<div class="stat-card-value" id="stat-auto-renew">-</div>
</div>
</div>

<!-- Memberships Table -->
<div class="table-wrapper">
<div style="overflow-x: auto;">
<table>
<thead>
<tr>
<th>Member</th>
<th>Email</th>
<th>Plan</th>
<th>Start Date</th>
<th>Expiry Date</th>
<th>Days Left</th>
<th>Status</th>
<th>Auto-Renew</th>
</tr>
</thead>
<tbody id="memberships-list">
<tr>
<td colspan="8" style="padding: 3rem; text-align: center; color: rgb(var(--color-neutral-500));">
Loading memberships...
</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>

<!-- Bookings & Calendar Tab -->
<div id="bookings-tab" class="tab-content" style="display: none;">
<div class="admin-flex-between admin-mb-2">
<h2 id="admin-section-bookings" class="admin-section-heading admin-m-0">📅 Bookings &amp; Calendar <a href="#bookings" class="admin-permalink" aria-label="Link to bookings tab">#</a></h2>
<div class="admin-flex">
<button id="create-block-btn" class="btn btn-primary" onclick="showCreateBlockModal()">
+ Block Time
</button>
<button id="refresh-bookings-btn" class="btn btn-secondary btn-sm" onclick="loadBookingsAndCalendar()">
🔄 Refresh
</button>
</div>
</div>

<nav class="admin-jump-links" aria-label="Bookings sections">
<span style="color: rgb(var(--color-neutral-500));">Jump to:</span>
<a href="#bookings-upcoming">Upcoming</a>
<a href="#bookings-calendar">Week view</a>
</nav>

<section id="admin-section-bookings-upcoming" class="card card-compact admin-mb-2">
<span id="admin-section-bookings-blocks" class="admin-permalink" style="position:absolute;visibility:hidden;" aria-hidden="true"></span>
<h3 class="admin-section-heading admin-mt-0">Upcoming schedule <a href="#bookings-upcoming" class="admin-permalink" aria-label="Link to upcoming schedule">#</a></h3>
<p class="admin-text-small admin-mb-1">Everything from now onward, sorted by date.</p>
<ul class="admin-schedule-legend" aria-label="Schedule colour key">
<li><span class="admin-schedule-legend-swatch admin-schedule-legend-swatch--event" aria-hidden="true"></span> Events</li>
<li><span class="admin-schedule-legend-swatch admin-schedule-legend-swatch--booking" aria-hidden="true"></span> Table bookings</li>
<li><span class="admin-schedule-legend-swatch admin-schedule-legend-swatch--block" aria-hidden="true"></span> Blocked time</li>
</ul>
<div id="bookings-schedule-content">
<p class="admin-text-small" style="text-align: center; padding: 1.5rem;">Loading schedule…</p>
</div>

</section>

<!-- Calendar Week View -->
<section id="admin-section-bookings-calendar" class="card card-compact admin-mb-2">
<h3 class="admin-section-heading admin-mt-0">🗓️ Week view <a href="#bookings-calendar" class="admin-permalink" aria-label="Link to week calendar">#</a></h3>
<div id="calendar-nav" class="admin-flex-between admin-mb-1">
<button id="prev-week-btn" class="btn btn-secondary btn-sm" onclick="changeWeek(-1)">
← Previous
</button>
<h3 id="week-display" class="admin-m-0" style="font-size: 1.1rem;"></h3>
<button id="next-week-btn" class="btn btn-secondary btn-sm" onclick="changeWeek(1)">
Next →
</button>
</div>
<div id="calendar-grid" style="display: grid; gap: 1rem;">
<!-- Days will be populated by JavaScript -->
</div>
</section>


</div>

<!-- Cron Jobs Tab -->
<div id="cron-tab" class="tab-content" style="display: none;">
<div class="admin-flex-between admin-mb-2">
<h2 id="admin-section-cron" class="admin-section-heading admin-m-0">Automated Jobs <a href="#cron" class="admin-permalink" aria-label="Link to cron jobs">#</a></h2>
<div class="admin-flex">
<button id="sync-board-games-btn" onclick="syncBoardGames()" class="btn btn-sm" style="background: rgb(var(--color-secondary-600));">
🎲 Sync Board Games
</button>
<button id="refresh-cron-btn" onclick="loadCronLogs()" class="btn btn-primary btn-sm">
🔄 Refresh
</button>
</div>
</div>

<!-- Job Filter -->
<div class="form-group">
<label for="cron-job-filter" class="form-label" style="display: inline; margin-right: 0.5rem;">Filter by Job:</label>
<select id="cron-job-filter" onchange="loadCronLogs()" class="form-select" style="display: inline-block; width: auto;">
<option value="">All Jobs</option>
<option value="auto_renewals">Auto Renewals</option>
<option value="event_reminders">Event Reminders</option>
<option value="payment_reconciliation">Payment Reconciliation</option>
<option value="bgg_board_games_sync">Board Games Sync</option>
</select>
</div>

<!-- Summary Cards -->
<div id="cron-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
<!-- Will be populated by JavaScript -->
</div>

<!-- Cron Logs Table -->
<div class="table-wrapper">
<div style="overflow-x: auto;">
<table>
<thead>
<tr>
<th>Job Name</th>
<th>Started</th>
<th>Duration</th>
<th>Status</th>
<th>Processed</th>
<th>Success</th>
<th>Failed</th>
<th>Details</th>
</tr>
</thead>
<tbody id="cron-logs-table">
<tr>
<td colspan="8" style="padding: 2rem; text-align: center; color: rgb(var(--color-neutral-500));">
Loading cron job logs...
</td>
</tr>
</tbody>
</table>
</div>
</div>

<!-- Pagination -->
<div id="cron-pagination" style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
<!-- Will be populated by JavaScript -->
</div>
</div>

<!-- Newsletter Tab -->
<div id="newsletter-tab" class="tab-content" style="display: none;">
<div class="admin-flex-between admin-mb-2">
<h2 id="admin-section-newsletter" class="admin-section-heading admin-m-0">Newsletter Builder <a href="#newsletter" class="admin-permalink" aria-label="Link to newsletter">#</a></h2>
<div style="display:flex;gap:0.75rem;align-items:center;">
  <button type="button" id="nl-newsletters-btn" onclick="nlToggleNewslettersPanel()" class="btn btn-secondary btn-sm">Saved Newsletters</button>
  <div id="nl-recipient-badge" class="nl-badge">Loading recipients...</div>
</div>
</div>

<!-- Saved Newsletters Panel -->
<div id="nl-newsletters-panel" class="nl-newsletters-panel" style="display:none;">
  <div id="nl-newsletters-list">
    <div style="text-align:center;padding:1.5rem;color:rgb(var(--color-neutral-500));">Loading...</div>
  </div>
</div>

<!-- Active draft / editing banner -->
<div id="nl-active-banner" class="nl-draft-banner nl-banner-restored" style="display:none;">
  <span id="nl-active-banner-msg"></span>
  <div style="display:flex;gap:0.5rem;align-items:center;flex-shrink:0;">
    <button type="button" onclick="nlNewDraft()" class="nl-draft-discard-btn">New newsletter</button>
  </div>
</div>

<div class="card card-compact admin-mb-2">
<div class="form-group">
<label class="form-label">Subject Line</label>
<input type="text" id="nl-subject" class="form-input" placeholder="e.g. This Month at Dice Bastion">
</div>

<div class="form-group">
<label class="form-label">Email Body</label>
<div id="nl-quill-wrap">
<div id="nl-toolbar">
<span class="ql-formats"><select class="ql-header"><option selected></option><option value="1">Heading 1</option><option value="2">Heading 2</option><option value="3">Heading 3</option></select></span>
<span class="ql-formats"><button class="ql-bold"></button><button class="ql-italic"></button><button class="ql-underline"></button></span>
<span class="ql-formats"><button class="ql-list" value="bullet"></button><button class="ql-list" value="ordered"></button></span>
<span class="ql-formats"><button class="ql-link"></button></span>
<span class="ql-formats nl-extra-fmts"><button type="button" onclick="nlInsertDivider()" class="nl-tb-btn">Divider</button><button type="button" onclick="openNlEventPicker()" class="nl-tb-btn nl-tb-event-btn">Insert Event</button><button type="button" onclick="openNlCalendarPicker()" class="nl-tb-btn nl-tb-calendar-btn">Event Calendar</button></span>
</div>
<div id="nl-editor"></div>
</div>
<small class="admin-text-small">Tip: Type # / ## / ### then Space for headings, - or * then Space for bullets. Ctrl+B bold, Ctrl+I italic.</small>
</div>
</div>

<div class="admin-flex" style="justify-content: flex-end; gap: 1rem; flex-wrap: wrap; align-items: center;">
<span id="nl-draft-status" class="nl-draft-status"></span>
<button onclick="clearNewsletter()" class="btn btn-secondary">Clear</button>
<button onclick="previewNewsletter()" class="btn btn-secondary">Preview</button>
<button onclick="nlServerSaveDraft()" class="btn btn-secondary" id="nl-save-draft-btn">Save Draft</button>
<button onclick="nlOpenScheduleModal()" class="btn btn-secondary" id="nl-schedule-btn">Schedule</button>
<button onclick="sendNewsletter()" class="btn btn-primary" id="nl-send-btn">Send Now</button>
</div>
<div id="nl-send-result" style="display: none;"></div>
</div>

<!-- Event Picker Modal -->
<div id="nl-event-picker" class="nl-modal" style="display: none;">
<div class="nl-modal-box">
<div class="admin-flex-between admin-mb-2">
<h3 class="admin-m-0">Insert Upcoming Event</h3>
<button onclick="closeNlEventPicker()" class="btn btn-secondary btn-sm">Cancel</button>
</div>
<div id="nl-event-picker-list">
<div style="text-align: center; padding: 1.5rem; color: rgb(var(--color-neutral-500));">Loading events...</div>
</div>
</div>
</div>

<!-- Calendar Picker Modal -->
<div id="nl-calendar-picker" class="nl-modal" style="display: none;">
<div class="nl-modal-box">
<div class="admin-flex-between admin-mb-2">
<h3 class="admin-m-0">Insert Event Calendar</h3>
<button onclick="closeNlCalendarPicker()" class="btn btn-secondary btn-sm">Cancel</button>
</div>
<p style="font-size:0.875rem;color:rgb(var(--color-neutral-500));margin:0 0 1rem 0;">Select events to include. They appear in date order, two per row, showing the event image and date.</p>
<div id="nl-calendar-picker-list">
<div style="text-align: center; padding: 1.5rem; color: rgb(var(--color-neutral-500));">Loading events...</div>
</div>
<div style="margin-top:1.25rem;display:flex;gap:0.75rem;justify-content:flex-end;flex-wrap:wrap;align-items:center;">
<button onclick="nlCalendarToggleAll()" class="btn btn-secondary btn-sm" id="nl-cal-toggle-all-btn">Deselect All</button>
<button onclick="insertNlCalendarBlock()" class="btn btn-primary">Insert Calendar</button>
</div>
</div>
</div>

<!-- Preview Modal -->
<div id="nl-preview-modal" class="nl-modal" style="display: none;">
<div class="nl-modal-box" style="max-width: min(900px, 96vw); width: 100%;">
<div class="admin-flex-between" style="margin-bottom: 1rem;">
<h3 class="admin-m-0">Email Preview</h3>
<button onclick="closeNlPreview()" class="btn btn-secondary btn-sm">Close</button>
</div>
<iframe id="nl-preview-frame" style="width: 100%; height: min(82vh, 700px); border: 1px solid rgb(var(--color-neutral-300)); border-radius: 8px; background: white;"></iframe>
</div>
</div>

<!-- Schedule Modal -->
<div id="nl-schedule-modal" class="nl-modal" style="display: none;">
<div class="nl-modal-box" style="max-width:440px;">
<div class="admin-flex-between admin-mb-2">
<h3 class="admin-m-0">Schedule Newsletter</h3>
<button onclick="nlCloseScheduleModal()" class="btn btn-secondary btn-sm">Cancel</button>
</div>
<p style="font-size:0.875rem;color:rgb(var(--color-neutral-500));margin:0 0 1.25rem 0;">Choose when to send this newsletter. The daily job at 2 AM UTC will dispatch it automatically.</p>
<div class="form-group">
<label class="form-label">Send At</label>
<input type="datetime-local" id="nl-schedule-datetime" class="form-input">
</div>
<div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1.25rem;">
<button onclick="nlCloseScheduleModal()" class="btn btn-secondary">Cancel</button>
<button onclick="nlConfirmSchedule()" class="btn btn-primary" id="nl-schedule-confirm-btn">Schedule</button>
</div>
</div>
</div>
</div>

<!-- Blog Tab -->
<div id="blog-tab" class="tab-content" style="display: none;">
<div id="blog-health-banner" style="display:none;margin-bottom:1rem;padding:0.875rem 1rem;border-radius:8px;border:1px solid rgb(var(--color-neutral-300));background:rgb(var(--color-neutral-50));color:rgb(var(--color-neutral-800));font-size:0.95rem;"></div>
<div class="admin-flex-between admin-mb-2">
<h2 id="admin-section-blog" class="admin-section-heading admin-m-0">Blog <a href="#blog" class="admin-permalink" aria-label="Link to blog">#</a></h2>
<div style="display:flex;gap:0.75rem;align-items:center;">
  <button type="button" onclick="blogNewPost()" class="btn btn-secondary btn-sm">New Post</button>
  <span id="blog-status-badge" class="nl-badge" style="display:none;"></span>
</div>
</div>

<div class="admin-grid-2 admin-mb-2" style="gap: 1.5rem; align-items: start;">
<div class="card card-compact">
<h3 class="admin-m-0 admin-mb-1">Posts</h3>
<div id="blog-posts-list">
  <div style="text-align:center;padding:1.5rem;color:rgb(var(--color-neutral-500));">Loading...</div>
</div>
</div>

<div class="card card-compact">
<input type="hidden" id="blog-post-id">
<div class="admin-grid-2 admin-mb-1">
<div>
<label class="form-label">Title *</label>
<input type="text" id="blog-title" class="form-input" placeholder="Post title">
</div>
<div>
<label class="form-label">URL Slug *</label>
<input type="text" id="blog-slug" class="form-input" style="font-family: monospace;">
</div>
</div>

<div class="admin-mb-1">
<label class="form-label">Excerpt</label>
<textarea id="blog-excerpt" rows="2" class="form-textarea" placeholder="Short summary for list cards"></textarea>
</div>

<div class="admin-grid-2 admin-mb-1">
<div>
<label class="form-label">Publish Date</label>
<input type="datetime-local" id="blog-published-at" class="form-input">
</div>
<div></div>
</div>

<div class="admin-grid-2 admin-mb-1">
<div>
<label class="form-label">Card image</label>
<p style="margin:0 0 0.5rem;font-size:0.85rem;color:rgb(var(--color-neutral-500));">Shown on blog list cards. Crop to 400×238.</p>
<button type="button" onclick="document.getElementById('blog-card-upload').click()" class="btn btn-secondary btn-sm">Upload &amp; crop card</button>
<input type="file" id="blog-card-upload" accept="image/*" style="display:none;">
<input type="url" id="blog-featured-image-card" class="form-input" placeholder="Or paste card image URL" style="margin-top:0.5rem;">
<div id="blog-card-preview" style="margin-top:0.5rem;"></div>
</div>
<div>
<label class="form-label">Cover image</label>
<p style="margin:0 0 0.5rem;font-size:0.85rem;color:rgb(var(--color-neutral-500));">Wide hero at the top of the post. Crop to 885×300.</p>
<button type="button" onclick="document.getElementById('blog-cover-upload').click()" class="btn btn-secondary btn-sm">Upload &amp; crop cover</button>
<input type="file" id="blog-cover-upload" accept="image/*" style="display:none;">
<input type="hidden" id="blog-featured-image" value="">
<input type="url" id="blog-featured-image-hero" class="form-input" placeholder="Or paste cover image URL" style="margin-top:0.5rem;">
<div id="blog-cover-preview" style="margin-top:0.5rem;"></div>
</div>
</div>

<div class="admin-grid-2 admin-mb-1">
<div>
<label class="form-label">SEO Description</label>
<input type="text" id="blog-seo-description" class="form-input">
</div>
<div>
<label class="form-label">SEO Image URL</label>
<input type="url" id="blog-seo-image" class="form-input" placeholder="https://...">
</div>
</div>

<div class="admin-mb-1">
<label class="form-label">Tags</label>
<div id="blog-tags-chips" class="admin-category-container"></div>
<div class="admin-flex" style="margin-top:0.5rem;">
<input type="text" id="blog-tags-input" list="blog-tags-suggestions" placeholder="Add tag..." class="form-input" style="flex:1;">
<button type="button" onclick="blogAddChip('tags')" class="btn btn-primary" style="padding:0.75rem 1.5rem;">Add</button>
</div>
<datalist id="blog-tags-suggestions"></datalist>
</div>

<div class="admin-mb-1">
<label class="form-label">Categories</label>
<div id="blog-categories-chips" class="admin-category-container"></div>
<div class="admin-flex" style="margin-top:0.5rem;">
<input type="text" id="blog-categories-input" list="blog-categories-suggestions" placeholder="Add category..." class="form-input" style="flex:1;">
<button type="button" onclick="blogAddChip('categories')" class="btn btn-primary" style="padding:0.75rem 1.5rem;">Add</button>
</div>
<datalist id="blog-categories-suggestions"></datalist>
</div>

<div class="admin-mb-1">
<label class="form-label">Series</label>
<div id="blog-series-chips" class="admin-category-container"></div>
<div class="admin-flex" style="margin-top:0.5rem;">
<input type="text" id="blog-series-input" list="blog-series-suggestions" placeholder="Add series..." class="form-input" style="flex:1;">
<button type="button" onclick="blogAddChip('series')" class="btn btn-primary" style="padding:0.75rem 1.5rem;">Add</button>
</div>
<datalist id="blog-series-suggestions"></datalist>
</div>

<div class="admin-mb-1">
<label class="form-label">Authors</label>
<div id="blog-authors-chips" class="admin-category-container"></div>
<div class="admin-flex" style="margin-top:0.5rem;">
<input type="text" id="blog-authors-input" list="blog-authors-suggestions" placeholder="Author slug (e.g. nick)" class="form-input" style="flex:1;">
<button type="button" onclick="blogAddChip('authors')" class="btn btn-primary" style="padding:0.75rem 1.5rem;">Add</button>
</div>
<datalist id="blog-authors-suggestions"></datalist>
<div id="blog-author-meta-panel" style="display:none;margin-top:1rem;padding:1rem;border:1px solid rgb(var(--color-neutral-200));border-radius:8px;">
  <div class="admin-grid-2 admin-mb-1">
    <div>
      <label class="form-label">Author display name</label>
      <input type="text" id="blog-author-name" class="form-input">
    </div>
    <div>
      <label class="form-label">Author avatar URL</label>
      <input type="url" id="blog-author-image" class="form-input" placeholder="https://...">
    </div>
  </div>
  <div>
    <label class="form-label">Author bio</label>
    <textarea id="blog-author-bio" rows="2" class="form-textarea"></textarea>
  </div>
</div>
</div>

<div class="form-group">
<label class="form-label">Post Body</label>
<div id="blog-quill-wrap">
<div id="blog-toolbar">
<span class="ql-formats"><select class="ql-header"><option selected></option><option value="1">Heading 1</option><option value="2">Heading 2</option><option value="3">Heading 3</option></select></span>
<span class="ql-formats"><button class="ql-bold"></button><button class="ql-italic"></button><button class="ql-underline"></button></span>
<span class="ql-formats"><button class="ql-list" value="bullet"></button><button class="ql-list" value="ordered"></button></span>
<span class="ql-formats"><button class="ql-link"></button></span>
<span class="ql-formats nl-extra-fmts"><button type="button" onclick="blogInsertImageUpload()" class="nl-tb-btn">Upload image</button><button type="button" onclick="blogInsertImageUrl()" class="nl-tb-btn">Image URL</button></span>
<input type="file" id="blog-inline-image-upload" accept="image/*" style="display:none;">
</div>
<div id="blog-editor"></div>
</div>
</div>

<div class="admin-flex" style="justify-content:flex-end;gap:1rem;flex-wrap:wrap;align-items:center;margin-top:1rem;">
<span id="blog-save-status" class="nl-draft-status"></span>
<button type="button" onclick="blogPreview()" class="btn btn-secondary">Preview</button>
<button type="button" onclick="blogSaveDraft()" class="btn btn-secondary" id="blog-save-btn">Save Draft</button>
<button type="button" onclick="blogPublish()" class="btn btn-primary" id="blog-publish-btn">Publish</button>
<button type="button" onclick="blogSyncCdn()" class="btn btn-secondary" id="blog-sync-cdn-btn">Rebuild CDN</button>
<button type="button" onclick="blogUnpublish()" class="btn btn-secondary" id="blog-unpublish-btn" style="display:none;">Unpublish</button>
<button type="button" onclick="blogDeletePost()" class="btn btn-secondary" id="blog-delete-btn" style="display:none;">Delete</button>
</div>
<div id="blog-action-result" style="display:none;margin-top:1rem;"></div>
</div>
</div>

<div id="blog-preview-modal" class="nl-modal" style="display:none;">
<div class="nl-modal-box" style="max-width:min(900px,96vw);width:100%;">
<div class="admin-flex-between" style="margin-bottom:1rem;">
<h3 class="admin-m-0">Post Preview</h3>
<button onclick="blogClosePreview()" class="btn btn-secondary btn-sm">Close</button>
</div>
<iframe id="blog-preview-frame" style="width:100%;height:min(82vh,700px);border:1px solid rgb(var(--color-neutral-300));border-radius:8px;background:white;"></iframe>
</div>
</div>
</div>

</div>

<style>
/* Button styles for dynamically generated items */
.btn-edit { padding: 0.5rem 1rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.dark .btn-edit { background: rgb(var(--color-primary-500)); }
.btn-edit:hover { background: rgb(var(--color-primary-700)); }
.dark .btn-edit:hover { background: rgb(var(--color-primary-600)); }
.btn-delete { padding: 0.5rem 1rem; background: rgb(var(--color-neutral-200)); border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.dark .btn-delete { background: rgb(var(--color-neutral-700)); color: rgb(var(--color-neutral-200)); }
.btn-delete:hover { background: #fee; color: #c00; }
.dark .btn-delete:hover { background: rgba(220, 38, 38, 0.2); color: #fca5a5; }
.btn-index { padding: 0.5rem 1rem; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
.dark .btn-index { background: #10b981; }
.btn-index:hover { background: #047857; }
.dark .btn-index:hover { background: #059669; }
.btn-index:disabled { opacity: 0.5; cursor: not-allowed; }

/* Newsletter Builder */
.nl-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgb(var(--color-primary-50)); border: 1px solid rgb(var(--color-primary-200)); border-radius: 8px; font-size: 0.875rem; font-weight: 600; color: rgb(var(--color-primary-700)); }
.dark .nl-badge { background: rgba(var(--color-primary-900), 0.2); border-color: rgba(var(--color-primary-700), 0.4); color: rgb(var(--color-primary-300)); }
.nl-tb-btn { padding: 4px 10px; font-size: 0.8rem; border: 1px solid rgb(var(--color-neutral-300)); background: white; border-radius: 4px; cursor: pointer; font-weight: 500; color: rgb(var(--color-neutral-700)); line-height: 1.4; }
.dark .nl-tb-btn { background: rgb(var(--color-neutral-800)); border-color: rgb(var(--color-neutral-600)); color: rgb(var(--color-neutral-300)); }
.nl-tb-btn:hover { background: rgb(var(--color-neutral-100)); }
.dark .nl-tb-btn:hover { background: rgb(var(--color-neutral-700)); }
.nl-tb-event-btn { background: rgb(var(--color-secondary-600)) !important; color: white !important; border-color: rgb(var(--color-secondary-600)) !important; }
.nl-tb-event-btn:hover { background: rgb(var(--color-secondary-700)) !important; }
.nl-tb-calendar-btn { background: #312e81 !important; color: white !important; border-color: #312e81 !important; }
.nl-tb-calendar-btn:hover { background: #3730a3 !important; }
.nl-extra-fmts { border-left: 1px solid rgb(var(--color-neutral-200)); padding-left: 8px; margin-left: 4px; display: inline-flex; gap: 4px; align-items: center; vertical-align: middle; }
.dark .nl-extra-fmts { border-left-color: rgb(var(--color-neutral-700)); }
.nl-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.nl-modal-box { background: rgb(var(--color-neutral)); border-radius: 12px; padding: 1.5rem; max-width: 560px; width: 100%; max-height: 80vh; overflow-y: auto; }
.dark .nl-modal-box { background: rgb(var(--color-neutral-800)); }
.nl-event-pick-card { border: 1px solid rgb(var(--color-neutral-200)); border-radius: 8px; padding: 0.75rem; display: flex; gap: 0.75rem; align-items: center; cursor: pointer; transition: all 0.15s; margin-bottom: 0.5rem; }
.dark .nl-event-pick-card { border-color: rgb(var(--color-neutral-700)); }
.nl-event-pick-card:hover { border-color: rgb(var(--color-primary-400)); background: rgb(var(--color-primary-50)); }
.dark .nl-event-pick-card:hover { background: rgba(var(--color-primary-900), 0.2); }
.nl-event-pick-img { width: 64px; height: 48px; object-fit: cover; border-radius: 4px; flex-shrink: 0; background: rgb(var(--color-neutral-100)); }
.nl-event-pick-title { font-weight: 600; font-size: 0.9rem; color: rgb(var(--color-neutral-900)); }
.dark .nl-event-pick-title { color: rgb(var(--color-neutral-100)); }
.nl-event-pick-date { font-size: 0.8rem; color: rgb(var(--color-neutral-500)); margin-top: 2px; }
.nl-draft-status { font-size: 0.8rem; color: rgb(var(--color-neutral-400)); font-style: italic; transition: opacity 0.4s; }
.nl-draft-status.saved { color: rgb(var(--color-success-600)); font-style: normal; }
.nl-draft-banner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 11px 15px; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem; flex-wrap: wrap; }
.nl-draft-banner.nl-banner-restored { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.nl-draft-banner.nl-banner-available { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
.dark .nl-draft-banner.nl-banner-restored { background: rgba(22,101,52,0.15); border-color: rgba(134,239,172,0.25); color: rgb(var(--color-success-300)); }
.dark .nl-draft-banner.nl-banner-available { background: rgba(30,64,175,0.12); border-color: rgba(147,197,253,0.3); color: rgb(var(--color-primary-300)); }
.nl-draft-discard-btn { background: none; border: none; cursor: pointer; font-size: 0.8rem; text-decoration: underline; padding: 0; opacity: 0.75; color: inherit; }
.nl-draft-discard-btn:hover { opacity: 1; }
/* Saved newsletters panel */
.nl-newsletters-panel { background: rgb(var(--color-neutral-50)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 10px; padding: 1rem; margin-bottom: 1rem; max-height: 360px; overflow-y: auto; }
.dark .nl-newsletters-panel { background: rgb(var(--color-neutral-800)); border-color: rgb(var(--color-neutral-700)); }
.nl-saved-item { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.75rem 0.875rem; border: 1px solid rgb(var(--color-neutral-200)); border-radius: 8px; margin-bottom: 0.5rem; background: white; flex-wrap: wrap; }
.nl-saved-item:last-child { margin-bottom: 0; }
.dark .nl-saved-item { background: rgb(var(--color-neutral-900)); border-color: rgb(var(--color-neutral-700)); }
.nl-saved-item-active { border-color: rgb(var(--color-primary-400)); background: rgb(var(--color-primary-50)) !important; }
.dark .nl-saved-item-active { border-color: rgba(var(--color-primary-500),0.5); background: rgba(var(--color-primary-900),0.25) !important; }
.nl-saved-item-subject { font-weight: 600; font-size: 0.9rem; color: rgb(var(--color-neutral-900)); margin-bottom: 3px; }
.dark .nl-saved-item-subject { color: rgb(var(--color-neutral-100)); }
.nl-saved-item-meta { font-size: 0.78rem; color: rgb(var(--color-neutral-500)); }
.nl-saved-item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; flex-wrap: wrap; }
.nl-status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.nl-status-draft { background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-600)); }
.nl-status-scheduled { background: #dbeafe; color: #1d4ed8; }
.nl-status-sent { background: #dcfce7; color: #15803d; }
.nl-status-failed { background: #fee2e2; color: #dc2626; }
.dark .nl-status-draft { background: rgb(var(--color-neutral-700)); color: rgb(var(--color-neutral-300)); }
.dark .nl-status-scheduled { background: rgba(29,78,216,0.2); color: #93c5fd; }
.dark .nl-status-sent { background: rgba(21,128,61,0.2); color: #86efac; }
.dark .nl-status-failed { background: rgba(220,38,38,0.2); color: #fca5a5; }
.nl-send-result { padding: 1rem 1.25rem; border-radius: 8px; margin-top: 1rem; font-size: 0.9rem; }
.nl-send-result.nl-success { background: rgb(var(--color-success-50)); border: 1px solid rgb(var(--color-success-200)); color: rgb(var(--color-success-700)); }
.nl-send-result.nl-error { background: rgb(var(--color-danger-50)); border: 1px solid rgb(var(--color-danger-200)); color: rgb(var(--color-danger-700)); }
#nl-quill-wrap, #blog-quill-wrap { border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; overflow: hidden; }
.dark #nl-quill-wrap, .dark #blog-quill-wrap { border-color: rgb(var(--color-neutral-600)); }
#nl-quill-wrap .ql-toolbar.ql-snow, #blog-quill-wrap .ql-toolbar.ql-snow { background: rgb(var(--color-neutral-50)); border: none; border-bottom: 1px solid rgb(var(--color-neutral-200)); flex-wrap: wrap; padding: 6px 8px; }
.dark #nl-quill-wrap .ql-toolbar.ql-snow, .dark #blog-quill-wrap .ql-toolbar.ql-snow { background: rgb(var(--color-neutral-900)); border-bottom-color: rgb(var(--color-neutral-700)); }
#nl-quill-wrap .ql-container.ql-snow, #blog-quill-wrap .ql-container.ql-snow { border: none; font-family: inherit; }
#nl-quill-wrap .ql-editor, #blog-quill-wrap .ql-editor { min-height: 300px; font-size: 1rem; line-height: 1.7; padding: 1rem; color: rgb(var(--color-neutral-900)); }
#blog-quill-wrap .ql-editor img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 1.75rem 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.dark #nl-quill-wrap .ql-editor, .dark #blog-quill-wrap .ql-editor { color: rgb(var(--color-neutral-100)); background: rgb(var(--color-neutral-800)); }
.dark #nl-quill-wrap .ql-stroke, .dark #blog-quill-wrap .ql-stroke { stroke: rgb(var(--color-neutral-400)) !important; }
.dark #nl-quill-wrap .ql-fill, .dark #blog-quill-wrap .ql-fill { fill: rgb(var(--color-neutral-400)) !important; }
.dark #nl-quill-wrap .ql-picker, .dark #blog-quill-wrap .ql-picker { color: rgb(var(--color-neutral-300)); }
.dark #nl-quill-wrap .ql-picker-options, .dark #blog-quill-wrap .ql-picker-options { background: rgb(var(--color-neutral-800)); border-color: rgb(var(--color-neutral-600)); color: rgb(var(--color-neutral-200)); }
.nl-event-card-embed { margin: 16px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
.nl-calendar-embed { margin: 16px 0; padding: 16px; background: #f8f9ff; border: 1px solid #dde0fa; border-radius: 10px; overflow: hidden; }
.nl-cal-check-card { border: 1px solid rgb(var(--color-neutral-200)); border-radius: 8px; padding: 0.625rem 0.875rem; display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 0.5rem; cursor: pointer; transition: background 0.15s; }
.dark .nl-cal-check-card { border-color: rgb(var(--color-neutral-700)); }
.nl-cal-check-card:hover { background: rgb(var(--color-primary-50)); }
.dark .nl-cal-check-card:hover { background: rgba(var(--color-primary-900), 0.2); }
.nl-cal-check-card input[type="checkbox"] { flex-shrink: 0; accent-color: rgb(var(--color-primary-600)); width: 16px; height: 16px; margin-top: 3px; }
.nl-cal-card-title { font-weight: 600; font-size: 0.9rem; color: rgb(var(--color-neutral-900)); }
.dark .nl-cal-card-title { color: rgb(var(--color-neutral-100)); }
.nl-cal-card-date { font-size: 0.8rem; color: rgb(var(--color-neutral-500)); margin-top: 2px; }
</style>

<!-- Image Crop Modal -->
<div id="crop-modal">
<div class="crop-container">
<h2>Crop Image</h2>
<div class="crop-image-container">
<img id="crop-image" style="max-width: 100%;">
</div>
<div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem;">
<div style="display: flex; align-items: center; gap: 0.5rem;">
<label style="font-weight: 600; font-size: 0.875rem; min-width: 60px;">🔍 Zoom:</label>
<input type="range" id="crop-zoom" min="10" max="200" value="100" step="5" style="flex: 1; max-width: 300px;">
<span id="crop-zoom-value" style="font-size: 0.875rem; color: rgb(var(--color-neutral-600)); min-width: 50px;">100%</span>
</div>
<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
<button id="crop-center-h" style="padding: 0.5rem 1rem; background: rgb(var(--color-neutral-100)); border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; cursor: pointer;">↔️ Center H</button>
<button id="crop-center-v" style="padding: 0.5rem 1rem; background: rgb(var(--color-neutral-100)); border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; cursor: pointer;">↕️ Center V</button>
<button id="crop-reset" style="padding: 0.5rem 1rem; background: rgb(var(--color-neutral-100)); border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; cursor: pointer;">🔄 Reset</button>
<span style="padding: 0.5rem; color: rgb(var(--color-neutral-600)); font-size: 0.875rem; align-self: center;">💡 Drag crop box beyond image to extend background</span>
</div>
<div class="crop-bg-row">
<label style="font-weight: 600; font-size: 0.875rem; min-width: 60px;">🎨 Fill:</label>
<button type="button" class="crop-bg-btn active" data-bg="auto">Auto</button>
<button type="button" class="crop-bg-btn" data-bg="white">White</button>
<button type="button" class="crop-bg-btn" data-bg="pick" id="crop-bg-pick">🔍 Pick from image</button>
<span id="crop-bg-swatch" class="crop-bg-swatch" style="background: #ffffff; display: none;" title="Sampled colour"></span>
<span id="crop-bg-pick-hint" style="font-size: 0.78rem; color: rgb(var(--color-neutral-500)); display: none;">Click anywhere on the image to sample</span>
</div>
</div>
<div class="crop-actions">
<button id="crop-cancel" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-neutral-200)); border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
<button id="crop-confirm" style="padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; cursor: pointer;">Crop & Upload</button>
</div>
</div>
</div>

<script>
const API_BASE = utils.getApiBase();
const BLOG_API_BASE = (window.__BLOG_API_BASE || 'https://dicebastionblogger-yvfyf.bunny.run').replace(/\/+$/, '');
let sessionToken = null;
let currentUser = null;
let uploadedProductImage = null;
/** After crop upload: { image_url, image_url_card, image_url_hero } or null */
let uploadedEventBundle = null;
let editingShopPromoId = null;

function adminJsonHeaders() {
return { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken };
}

function escapeHtmlPromo(s) {
if (s == null) return '';
return String(s)
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;');
}

function isoToDatetimeLocalPromo(iso) {
if (!iso) return '';
const d = new Date(iso);
if (Number.isNaN(d.getTime())) return '';
const pad = n => String(n).padStart(2, '0');
return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseShopPromoRulesJson(raw) {
try {
const o = typeof raw === 'string' ? JSON.parse(raw) : raw;
return o && typeof o === 'object' ? o : {};
} catch (_) {
return {};
}
}

function shopPromoRulesToFormFields(rulesRaw) {
const r = parseShopPromoRulesJson(rulesRaw);
document.getElementById('shop-promo-require-member').checked = !!r.require_active_membership;
document.getElementById('shop-promo-product-ids').value = Array.isArray(r.product_ids)
? r.product_ids.join(', ')
: '';
document.getElementById('shop-promo-categories').value = Array.isArray(r.categories)
? r.categories.join(', ')
: '';
document.getElementById('shop-promo-apply-scope').value =
r.apply_scope === 'whole_subtotal_if_any_match'
? 'whole_subtotal_if_any_match'
: 'eligible_lines';
}

async function loadShopPromoCodes() {
const host = document.getElementById('shop-promo-list');
if (!host || !sessionToken) return;
try {
const res = await fetch(`${API_BASE}/admin/promo-codes`, { headers: { 'X-Session-Token': sessionToken } });
if (!res.ok) throw new Error('list failed');
const data = await res.json();
const rows = data.promo_codes || [];
if (!rows.length) {
host.innerHTML = '<p style="color: rgb(var(--color-neutral-500));">No promo codes yet.</p>';
return;
}
host.innerHTML = rows.map(p => {
const rr = parseShopPromoRulesJson(p.rules_json);
const flags = [];
if (rr.require_active_membership) flags.push('members only');
if ((rr.product_ids || []).length) flags.push(`${rr.product_ids.length} products`);
if ((rr.categories || []).length) flags.push(`${rr.categories.length} categories`);
const disc = String(p.discount_type).includes('fixed')
? `${p.discount_value}p off`
: `${p.discount_value}% off`;
return `
<div class="item-card">
<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.75rem;align-items:center;">
<div>
<h3 class="admin-m-0">${escapeHtmlPromo(p.code)}${p.label ? ' — ' + escapeHtmlPromo(p.label) : ''}</h3>
<p style="margin:0.35rem 0 0;font-size:0.875rem;color:rgb(var(--color-neutral-600));">${escapeHtmlPromo(disc)} · Uses ${Number(p.uses_count) || 0}${p.max_uses != null ? ' / ' + p.max_uses : ''}${Number(p.active) === 1 ? '' : ' · inactive'}</p>
${flags.length ? `<p style="margin:0.35rem 0 0;font-size:0.8rem;color:rgb(var(--color-primary-600));">${escapeHtmlPromo(flags.join(' · '))}</p>` : ''}
</div>
<div class="item-actions" style="margin-top:0;">
<button type="button" class="btn btn-secondary btn-sm" onclick="editShopPromo(${p.id})">Edit</button>
<button type="button" class="btn btn-secondary btn-sm" onclick="deleteShopPromo(${p.id}, ${JSON.stringify(String(p.code))})" style="color:#b91c1c;">Delete</button>
</div>
</div>
</div>`;
}).join('');
} catch (e) {
console.error(e);
host.innerHTML = '<p style="color:#c00;">Could not load promo codes.</p>';
}
}

function resetShopPromoForm() {
editingShopPromoId = null;
document.getElementById('shop-promo-form').reset();
document.getElementById('shop-promo-id').value = '';
document.getElementById('shop-promo-active').checked = true;
document.getElementById('shop-promo-require-member').checked = false;
document.getElementById('shop-promo-product-ids').value = '';
document.getElementById('shop-promo-categories').value = '';
document.getElementById('shop-promo-apply-scope').value = 'eligible_lines';
document.getElementById('shop-promo-discount-value').value = '10';
document.getElementById('shop-promo-cancel-btn').style.display = 'none';
}

async function editShopPromo(id) {
try {
const res = await fetch(`${API_BASE}/admin/promo-codes`, { headers: { 'X-Session-Token': sessionToken } });
const data = await res.json();
const p = (data.promo_codes || []).find(row => Number(row.id) === Number(id));
if (!p) {
alert('Promo not found');
return;
}
editingShopPromoId = id;
document.getElementById('shop-promo-id').value = id;
document.getElementById('shop-promo-code').value = p.code;
document.getElementById('shop-promo-label').value = p.label || '';
document.getElementById('shop-promo-discount-type').value = String(p.discount_type).includes('fixed')
? 'fixed_pence'
: 'percent';
document.getElementById('shop-promo-discount-value').value = String(p.discount_value);
document.getElementById('shop-promo-active').checked = Number(p.active) === 1;
document.getElementById('shop-promo-starts').value = isoToDatetimeLocalPromo(p.starts_at);
document.getElementById('shop-promo-ends').value = isoToDatetimeLocalPromo(p.ends_at);
document.getElementById('shop-promo-max-uses').value =
p.max_uses != null && p.max_uses !== '' ? String(p.max_uses) : '';
document.getElementById('shop-promo-min-subtotal').value =
p.min_subtotal_pence != null && p.min_subtotal_pence !== ''
? String(p.min_subtotal_pence)
: '';
shopPromoRulesToFormFields(p.rules_json);
document.getElementById('shop-promo-cancel-btn').style.display = 'inline-block';
document.getElementById('shop-promo-form').scrollIntoView({ behavior: 'smooth' });
const hint = document.getElementById('shop-promo-value-hint');
if (hint) {
hint.textContent = document.getElementById('shop-promo-discount-type').value === 'fixed_pence'
? 'Whole pence (e.g. 500 = £5.00) off eligible amount.'
: 'Percent (1–100) off eligible amount.';
}
} catch (e) {
console.error(e);
alert('Failed to load promo');
}
}

async function deleteShopPromo(id, codeStr) {
if (!confirm('Delete promo "' + codeStr + '"? This cannot be undone.')) return;
try {
const res = await fetch(`${API_BASE}/admin/promo-codes/${id}`, {
method: 'DELETE',
headers: { 'X-Session-Token': sessionToken }
});
if (!res.ok) throw new Error();
loadShopPromoCodes();
if (Number(editingShopPromoId) === Number(id)) resetShopPromoForm();
} catch (_) {
alert('Delete failed');
}
}

document.getElementById('shop-promo-discount-type')?.addEventListener('change', e => {
const hint = document.getElementById('shop-promo-value-hint');
if (!hint) return;
hint.textContent =
e.target.value === 'fixed_pence'
? 'Whole pence (e.g. 500 = £5.00) off eligible amount.'
: 'Percent (1–100) off eligible amount.';
});

document.getElementById('shop-promo-cancel-btn')?.addEventListener('click', () => resetShopPromoForm());

document.getElementById('shop-promo-form')?.addEventListener('submit', async e => {
e.preventDefault();
function dtInputToIso(val) {
if (!val) return null;
const d = new Date(val);
return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
const pidStr = document.getElementById('shop-promo-product-ids').value;
const catStr = document.getElementById('shop-promo-categories').value;
const ids = pidStr.split(/[\s,]+/).map(x => parseInt(String(x).trim(), 10)).filter(n => n > 0);
const cats = catStr.split(',').map(x => String(x).trim()).filter(Boolean);
const payload = {
code: document.getElementById('shop-promo-code').value,
label: document.getElementById('shop-promo-label').value.trim() || null,
discount_type: document.getElementById('shop-promo-discount-type').value,
discount_value: parseInt(String(document.getElementById('shop-promo-discount-value').value), 10),
active: document.getElementById('shop-promo-active').checked ? 1 : 0,
starts_at: dtInputToIso(document.getElementById('shop-promo-starts').value),
ends_at: dtInputToIso(document.getElementById('shop-promo-ends').value),
max_uses: document.getElementById('shop-promo-max-uses').value
? parseInt(document.getElementById('shop-promo-max-uses').value, 10)
: null,
min_subtotal_pence: document.getElementById('shop-promo-min-subtotal').value
? parseInt(document.getElementById('shop-promo-min-subtotal').value, 10)
: null,
rules: {
require_active_membership: document.getElementById('shop-promo-require-member').checked,
product_ids: ids,
categories: cats,
apply_scope:
document.getElementById('shop-promo-apply-scope').value === 'whole_subtotal_if_any_match'
? 'whole_subtotal_if_any_match'
: 'eligible_lines'
}
};
const btn = document.getElementById('shop-promo-save-btn');
btn.disabled = true;
try {
const url =
editingShopPromoId != null
? `${API_BASE}/admin/promo-codes/${editingShopPromoId}`
: `${API_BASE}/admin/promo-codes`;
const method = editingShopPromoId != null ? 'PUT' : 'POST';
const res = await fetch(url, {
method,
headers: adminJsonHeaders(),
body: JSON.stringify(payload)
});
const j = await res.json().catch(() => ({}));
if (!res.ok) throw new Error(j.error || res.statusText);
resetShopPromoForm();
await loadShopPromoCodes();
alert('Promo saved.');
} catch (err) {
alert('Save failed: ' + String(err.message || err));
} finally {
btn.disabled = false;
}
});

// Auth
function checkAuth() {
sessionToken = utils.session.get();
currentUser = utils.session.getUser();

if (sessionToken && currentUser) {
// Check if user is admin
if (currentUser.is_admin) {
// Optimistically show dashboard while verifying
document.getElementById('login-container').style.display = 'none';
document.getElementById('non-admin-container').style.display = 'none';
document.getElementById('admin-dashboard').style.display = 'block';
loadProducts();
loadEvents();
loadOrders();
loadRegistrations();
loadCronLogs();
loadShopPromoCodes();
handleAdminHash();
// Verify session is still valid in background
verifySession();
} else {
// User is logged in but not an admin - show message
showNonAdminMessage(currentUser);
}
} else {
// No session, show login
document.getElementById('login-container').style.display = 'block';
document.getElementById('non-admin-container').style.display = 'none';
document.getElementById('admin-dashboard').style.display = 'none';
}
}

function showNonAdminMessage(user) {
document.getElementById('login-container').style.display = 'none';
document.getElementById('admin-dashboard').style.display = 'none';
document.getElementById('non-admin-container').style.display = 'block';
document.getElementById('non-admin-email-display').textContent = user.email;
}

async function verifySession() {
try {
const res = await fetch(`${API_BASE}/admin/verify`, {
headers: { 'X-Session-Token': sessionToken }
});

if (!res.ok) {
// Session expired or invalid - redirect to login
utils.session.clear();
sessionToken = null;
currentUser = null;
document.getElementById('login-container').style.display = 'block';
document.getElementById('admin-dashboard').style.display = 'none';
}
// If OK, dashboard is already showing - do nothing
} catch (err) {
console.error('Session verification error:', err);
document.getElementById('login-container').style.display = 'block';
}
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
e.preventDefault();
const email = document.getElementById('admin-email').value;
const password = document.getElementById('admin-password').value;
const errorEl = document.getElementById('login-error');

try {
const res = await fetch(`${API_BASE}/admin/login`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password })
});

const data = await res.json();

if (res.ok && data.success) {
sessionToken = data.session_token;
currentUser = data.user;
localStorage.setItem('admin_session', sessionToken);
localStorage.setItem('admin_user', JSON.stringify(currentUser));
localStorage.setItem('admin_token', sessionToken); // For docs auth guard

      // Trigger login event for footer update
      window.dispatchEvent(new Event('userLoggedIn'));
      
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('admin-dashboard').style.display = 'block';
      loadProducts();
      loadEvents();
      loadOrders();
loadRegistrations();
loadCronLogs();
      loadShopPromoCodes();
      handleAdminHash();
} else {
errorEl.textContent = data.error === 'invalid_credentials' ? 'Invalid email or password' : 'Login failed';
errorEl.style.display = 'block';
}
} catch (err) {
console.error('Login error:', err);
errorEl.textContent = 'Login failed. Please try again.';
errorEl.style.display = 'block';
}
});

document.getElementById('logout-btn').addEventListener('click', async () => {
if (sessionToken) {
await fetch(`${API_BASE}/admin/logout`, {
method: 'POST',
headers: { 'X-Session-Token': sessionToken }
});
}

utils.session.clear();
sessionToken = null;
currentUser = null;

// Trigger logout event for footer update
window.dispatchEvent(new Event('userLoggedOut'));

document.getElementById('login-container').style.display = 'block';
document.getElementById('admin-dashboard').style.display = 'none';
document.getElementById('non-admin-container').style.display = 'none';
});

// Non-admin logout button
document.getElementById('non-admin-logout-btn')?.addEventListener('click', async () => {
if (sessionToken) {
await fetch(`${API_BASE}/logout`, {
method: 'POST',
headers: { 'X-Session-Token': sessionToken }
});
}

localStorage.removeItem('admin_session');
localStorage.removeItem('admin_user');
localStorage.removeItem('admin_token');
sessionToken = null;
currentUser = null;

// Trigger logout event for footer update
window.dispatchEvent(new Event('userLoggedOut'));

// Redirect to home
window.location.href = '/';
});

// Rich Text Editor Functions
function formatText(command) {
document.execCommand(command, false, null);
document.getElementById('description-content').focus();
}

function insertLink() {
const url = prompt('Enter URL:');
if (url) {
document.execCommand('createLink', false, url);
document.getElementById('description-content').focus();
}
}

// Event Rich Text Editor Functions
function formatEventText(command) {
document.execCommand(command, false, null);
document.getElementById('event-full-description').focus();
}

function insertEventLink() {
  const url = prompt('Enter URL:');
  if (url) {
    document.execCommand('createLink', false, url);
    document.getElementById('event-full-description').focus();
  }
}

// Recurring Events UI
function toggleRecurringFields() {
  const isRecurring = document.getElementById('event-is-recurring').checked;
  const fields = document.getElementById('recurring-fields');
  const dateFields = document.getElementById('one-time-date-fields');
  const dateField = document.getElementById('event-date');
  const recurringTime = document.getElementById('recurring-time');
  
  fields.style.display = isRecurring ? 'block' : 'none';
  dateFields.style.display = isRecurring ? 'none' : 'grid';
  dateField.required = !isRecurring;
  
  // Toggle required on recurring-time based on visibility
  if (recurringTime) {
    recurringTime.required = isRecurring;
  }
  
  if (isRecurring) {
    updateRecurrenceFields();
  }
}

function updateRecurrenceFields() {
  const type = document.getElementById('recurrence-type').value;
  
  document.getElementById('weekly-fields').style.display = type === 'weekly' ? 'block' : 'none';
  document.getElementById('monthly-day-fields').style.display = type === 'monthly_day' ? 'block' : 'none';
  document.getElementById('monthly-date-fields').style.display = type === 'monthly_date' ? 'block' : 'none';
}

function getRecurrencePattern() {
  const type = document.getElementById('recurrence-type').value;
  const time = document.getElementById('recurring-time').value || '00:00';
  
  const pattern = { type, time };
  
  switch (type) {
    case 'weekly':
      pattern.day = parseInt(document.getElementById('weekly-day').value);
      break;
    case 'monthly_day':
      pattern.week = parseInt(document.getElementById('monthly-week').value);
      pattern.day = parseInt(document.getElementById('monthly-day').value);
      break;
    case 'monthly_date':
      pattern.date = parseInt(document.getElementById('monthly-date').value);
      break;
  }
  
  return JSON.stringify(pattern);
}

function setRecurrencePattern(patternJson) {
  if (!patternJson) return;
  
  try {
    const pattern = JSON.parse(patternJson);
    document.getElementById('recurrence-type').value = pattern.type;
    if (pattern.time) {
      document.getElementById('recurring-time').value = pattern.time;
    }
    updateRecurrenceFields();
    
    switch (pattern.type) {
      case 'weekly':
        document.getElementById('weekly-day').value = pattern.day;
        break;
      case 'monthly_day':
        document.getElementById('monthly-week').value = pattern.week;
        document.getElementById('monthly-day').value = pattern.day;
        break;
      case 'monthly_date':
        document.getElementById('monthly-date').value = pattern.date;
        break;
    }
  } catch (e) {
    console.error('Error parsing recurrence pattern:', e);
  }
}

function toggleEventPricing() {
const checkbox = document.getElementById('event-requires-purchase');
const pricingFields = document.getElementById('event-pricing-fields');
const memberPrice = document.getElementById('event-member-price');
const nonMemberPrice = document.getElementById('event-nonmember-price');

if (checkbox.checked) {
pricingFields.style.display = 'block';
memberPrice.required = true;
nonMemberPrice.required = true;
} else {
pricingFields.style.display = 'none';
memberPrice.required = false;
nonMemberPrice.required = false;
memberPrice.value = '';
nonMemberPrice.value = '';
document.getElementById('event-max-attendees').value = '';
}
}

function toggleSeoSection() {
  const body = document.getElementById('seo-section-body');
  const btn = body?.previousElementSibling;
  body?.classList.toggle('is-open');
  btn?.classList.toggle('is-open');
}

// Keep the SEO location preview in sync with the Location field
document.getElementById('event-location')?.addEventListener('input', (e) => {
  const preview = document.getElementById('seo-location-preview');
  if (preview) preview.textContent = e.target.value || 'Gibraltar Warhammer Club';
});

// Image Cropping
let cropper = null;
let currentCropCallback = null;
let currentAspectRatio = 336 / 220;
/** 'event' = multi-size pack; 'blog-card' | 'blog-cover' | 'blog-inline' = single blog image; 'product' = single product image */
let currentCropKind = 'product';
let cropBgMode = 'auto';   // 'auto' | 'white' | 'pick'
let cropBgPickedCol = null; // hex string when mode is 'pick'

const EVENT_IMAGE_MASTER_W = 1600;
const EVENT_IMAGE_MASTER_H = 758;
/** Each export: DB field key, pixel size, R2 filename suffix. Extend here + matching DB column + API + layout. */
const EVENT_IMAGE_EXPORT_SPECS = [
  /** At least fill target height when needed; blur fills any letterbox. */
  { key: 'image_url', w: 800, h: 379, filename: 'event-main.jpg', fit: 'fillHeight' },
  /** Full artwork visible in 400×238; blur above/below (or sides) — never side-crop wide art. */
  { key: 'image_url_card', w: 400, h: 238, filename: 'event-card.jpg', fit: 'contain' },
  /** Hero stays contain so the full crop stays visible on the wide frame. */
  { key: 'image_url_hero', w: 885, h: 300, filename: 'event-hero.jpg', fit: 'contain' }
];

const BLOG_CARD_SPEC = { w: 400, h: 238, filename: 'blog-card.jpg', fit: 'contain' };
const BLOG_COVER_SPEC = { w: 885, h: 300, filename: 'blog-cover.jpg', fit: 'contain' };
/** 16:9 landscape — full text column width at 1× (960px), common blog embed ratio */
const BLOG_INLINE_SPEC = { w: 960, h: 540, filename: 'blog-inline.jpg' };

const MULTI_SIZE_CROP_SPECS = {
  event: EVENT_IMAGE_EXPORT_SPECS,
};

/** Tight axis-aligned bbox of sufficiently opaque pixels, or null if none. */
function getOpaqueBoundingBox(canvas, alphaThreshold = 24) {
  const w = canvas.width;
  const h = canvas.height;
  const data = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (data[row + x * 4 + 3] > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Opaque artwork rect on the master (alpha-weighted). No flush-to-full shortcut — margin size
 * flows through to how much extra zoom fillHeight needs vs pure contain.
 */
function getExportFitSourceRect(canvas) {
  const cw = canvas.width;
  const ch = canvas.height;
  const bbox = getOpaqueBoundingBox(canvas);
  if (!bbox || bbox.w * bbox.h < cw * ch * 0.02) {
    return { sx: 0, sy: 0, sw: cw, sh: ch };
  }
  return { sx: bbox.x, sy: bbox.y, sw: bbox.w, sh: bbox.h };
}

function containCenterOnCanvasRegion(sourceCanvas, sx, sy, sw, sh, targetW, targetH) {
  const scale = Math.min(targetW / sw, targetH / sh);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  const c = document.createElement('canvas');
  c.width = targetW;
  c.height = targetH;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, targetW, targetH);
  const ox = Math.floor((targetW - dw) / 2);
  const oy = Math.floor((targetH - dh) / 2);
  ctx.drawImage(sourceCanvas, sx, sy, sw, sh, ox, oy, dw, dh);
  return c;
}

/**
 * Uniform scale, centered: never less than contain; add zoom only until the artwork fills the
 * target height (so no transparent band top/bottom). If contain already touches top and bottom,
 * scale stays at contain (no extra zoom). Wider than target width → horizontal crop only.
 */
function fillHeightMinCenterOnCanvasRegion(sourceCanvas, sx, sy, sw, sh, targetW, targetH) {
  const sContain = Math.min(targetW / sw, targetH / sh);
  const sFillHeight = targetH / sh;
  const scale = Math.max(sContain, sFillHeight);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  const c = document.createElement('canvas');
  c.width = targetW;
  c.height = targetH;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, targetW, targetH);
  const ox = Math.floor((targetW - dw) / 2);
  const oy = Math.floor((targetH - dh) / 2);
  ctx.drawImage(sourceCanvas, sx, sy, sw, sh, ox, oy, dw, dh);
  return c;
}

/** Mean RGB of opaque pixels — used when flattening transparent pixels before blur/JPEG. */
function averageOpaqueRgb(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const d = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 128) {
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
      n++;
    }
  }
  if (!n) return { r: 100, g: 116, b: 139 };
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || '').trim());
  if (!m) return { r: 255, g: 255, b: 255 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

/** Paint under transparent pixels so blur/JPEG never composites against white letterbox. */
function flattenTransparentWithFill(src, rgb) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.fillStyle = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  x.fillRect(0, 0, c.width, c.height);
  x.drawImage(src, 0, 0);
  return c;
}

function composeBlurredBackgroundJpeg(croppedCanvas, targetWidth, targetHeight, cropBgMode, cropBgPickedCol) {
  const baseArea = 800 * 379;
  const area = targetWidth * targetHeight;
  const blurPx = Math.max(12, Math.round(28 * Math.sqrt(area / baseArea)));
  const pad = Math.round(blurPx * 1.07);

  let fillRgb;
  if (cropBgMode === 'white') {
    fillRgb = { r: 255, g: 255, b: 255 };
  } else if (cropBgMode === 'pick' && cropBgPickedCol) {
    fillRgb = hexToRgb(cropBgPickedCol);
  } else {
    fillRgb = averageOpaqueRgb(croppedCanvas);
  }

  const fillCol = `rgb(${fillRgb.r},${fillRgb.g},${fillRgb.b})`;
  const opaqueSrc = flattenTransparentWithFill(croppedCanvas, fillRgb);

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const ctx = finalCanvas.getContext('2d');
  ctx.fillStyle = fillCol;
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  if (cropBgMode === 'auto') {
    ctx.save();
    ctx.filter = `blur(${blurPx}px)`;
    ctx.drawImage(opaqueSrc, -pad, -pad, targetWidth + pad * 2, targetHeight + pad * 2);
    ctx.restore();
  }
  ctx.drawImage(opaqueSrc, 0, 0, targetWidth, targetHeight);
  return finalCanvas.toDataURL('image/jpeg', 0.92);
}

// Background fill mode buttons
document.querySelectorAll('.crop-bg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.crop-bg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    cropBgMode = btn.dataset.bg;
    const swatch = document.getElementById('crop-bg-swatch');
    const hint = document.getElementById('crop-bg-pick-hint');
    const container = document.querySelector('.crop-image-container');
    if (cropBgMode === 'pick') {
      hint.style.display = 'inline';
      container.classList.add('eyedropper-active');
      if (cropBgPickedCol) { swatch.style.background = cropBgPickedCol; swatch.style.display = 'inline-block'; }
    } else {
      hint.style.display = 'none';
      container.classList.remove('eyedropper-active');
      if (cropBgMode === 'white') { swatch.style.background = '#ffffff'; swatch.style.display = 'inline-block'; }
      else { swatch.style.display = 'none'; }
    }
  });
});

// Eyedropper: click on crop preview to sample a pixel colour
document.querySelector('.crop-image-container').addEventListener('click', (e) => {
  if (cropBgMode !== 'pick' || !cropper) return;
  // Get the displayed image canvas from Cropper
  const imgData = cropper.getImageData();
  const canvasData = cropper.getCanvasData();
  // Convert click coords to image pixel coords
  const rect = e.currentTarget.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  const imgX = Math.round((clickX - canvasData.left) / canvasData.width * imgData.naturalWidth);
  const imgY = Math.round((clickY - canvasData.top) / canvasData.height * imgData.naturalHeight);
  if (imgX < 0 || imgY < 0 || imgX >= imgData.naturalWidth || imgY >= imgData.naturalHeight) return;
  // Sample the pixel from a temporary canvas
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = imgData.naturalWidth;
  tmpCanvas.height = imgData.naturalHeight;
  const tmpCtx = tmpCanvas.getContext('2d');
  tmpCtx.drawImage(document.getElementById('crop-image'), 0, 0);
  const px = tmpCtx.getImageData(imgX, imgY, 1, 1).data;
  cropBgPickedCol = `#${((1<<24)+(px[0]<<16)+(px[1]<<8)+px[2]).toString(16).slice(1)}`;
  const swatch = document.getElementById('crop-bg-swatch');
  swatch.style.background = cropBgPickedCol;
  swatch.style.display = 'inline-block';
  document.getElementById('crop-bg-pick-hint').textContent = `Sampled: ${cropBgPickedCol}`;
});

function showCropModal(file, callback, aspectRatio = 336 / 220, cropKind = 'product') {
  currentAspectRatio = aspectRatio;
  currentCropKind = cropKind;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById('crop-image');
    img.src = e.target.result;
    document.getElementById('crop-modal').classList.add('is-open');
    currentCropCallback = callback;

// Destroy existing cropper if any
if (cropper) {
cropper.destroy();
}

// Initialize cropper with specified aspect ratio
// viewMode: 0 allows cropping beyond image boundaries
cropper = new Cropper(img, {
aspectRatio: aspectRatio,
viewMode: 0,
autoCropArea: 1,
responsive: true,
background: true,
zoomOnWheel: false, // Disable default wheel zoom to add custom behavior
ready: function() {
// Set initial zoom to 100%
const imageData = this.cropper.getImageData();
const containerData = this.cropper.getContainerData();
const initialRatio = Math.min(
containerData.width / imageData.naturalWidth,
containerData.height / imageData.naturalHeight
);
this.cropper.zoomTo(initialRatio);
}
});

// Add custom wheel zoom that always zooms from center
const cropImageContainer = document.querySelector('.crop-image-container');
cropImageContainer.addEventListener('wheel', (e) => {
if (cropper) {
e.preventDefault();
const imageData = cropper.getImageData();
const containerData = cropper.getContainerData();
const currentRatio = imageData.width / imageData.naturalWidth;
const delta = e.deltaY > 0 ? -0.1 : 0.1;
const newRatio = currentRatio + (currentRatio * delta);
const baseRatio = Math.min(
containerData.width / imageData.naturalWidth,
containerData.height / imageData.naturalHeight
);
// Limit zoom between 10% and 200% of base ratio
const minRatio = baseRatio * 0.1;
const maxRatio = baseRatio * 2;
const clampedRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
// Zoom to center of container
const centerX = containerData.width / 2;
const centerY = containerData.height / 2;
cropper.zoomTo(clampedRatio, { x: centerX, y: centerY });
// Update slider
const percentage = Math.round((clampedRatio / baseRatio) * 100);
document.getElementById('crop-zoom').value = percentage;
document.getElementById('crop-zoom-value').textContent = percentage + '%';
    }
  });
  };
  reader.readAsDataURL(file);
}

document.getElementById('crop-zoom').addEventListener('input', (e) => {
if (cropper) {
const percentage = parseFloat(e.target.value);
const imageData = cropper.getImageData();
const containerData = cropper.getContainerData();
// Calculate base ratio to fit image in container
const baseRatio = Math.min(
containerData.width / imageData.naturalWidth,
containerData.height / imageData.naturalHeight
);
// Apply zoom percentage relative to base ratio
const zoomRatio = baseRatio * (percentage / 100);
cropper.zoomTo(zoomRatio);
document.getElementById('crop-zoom-value').textContent = percentage + '%';
}
});

document.getElementById('crop-center-h').addEventListener('click', () => {
if (cropper) {
const containerData = cropper.getContainerData();
const cropBoxData = cropper.getCropBoxData();

// Center horizontally only
cropper.setCropBoxData({
left: (containerData.width - cropBoxData.width) / 2,
});
}
});

document.getElementById('crop-center-v').addEventListener('click', () => {
if (cropper) {
const containerData = cropper.getContainerData();
const cropBoxData = cropper.getCropBoxData();

// Center vertically only
cropper.setCropBoxData({
top: (containerData.height - cropBoxData.height) / 2,
});
}
});

document.getElementById('crop-reset').addEventListener('click', () => {
if (cropper) {
cropper.reset();
document.getElementById('crop-zoom').value = 100;
document.getElementById('crop-zoom-value').textContent = '100%';
}
});

document.getElementById('crop-cancel').addEventListener('click', () => {
document.getElementById('crop-modal').classList.remove('is-open');
if (cropper) {
cropper.destroy();
cropper = null;
}
currentCropCallback = null;
// Reset fill mode
cropBgMode = 'auto';
cropBgPickedCol = null;
document.querySelectorAll('.crop-bg-btn').forEach(b => b.classList.remove('active'));
document.querySelector('.crop-bg-btn[data-bg="auto"]').classList.add('active');
document.getElementById('crop-bg-swatch').style.display = 'none';
document.getElementById('crop-bg-pick-hint').style.display = 'none';
document.querySelector('.crop-image-container').classList.remove('eyedropper-active');
});

document.getElementById('crop-confirm').addEventListener('click', async () => {
  if (!cropper || !currentCropCallback) return;

  const closeCropModal = () => {
    document.getElementById('crop-modal').classList.remove('is-open');
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    currentCropCallback = null;
    cropBgMode = 'auto';
    cropBgPickedCol = null;
  };

  try {
    if (currentCropKind === 'blog-inline') {
      const spec = BLOG_INLINE_SPEC;
      const croppedCanvas = cropper.getCroppedCanvas({
        width: spec.w,
        height: spec.h,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
        fillColor: '#ffffff'
      });
      if (!croppedCanvas) {
        Modal.alert({ title: 'Crop Error', message: 'Could not read the cropped image.' });
        return;
      }
      const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.88);
      try {
        const url = await blogUploadImageToBunny(dataUrl, `inline-${Date.now()}.jpg`);
        currentCropCallback(url);
        closeCropModal();
      } catch (inlineErr) {
        Modal.alert({ title: 'Upload Failed', message: inlineErr.message || 'Failed to upload image.' });
        console.error('Inline upload error:', inlineErr);
      }
      return;
    }

    if (currentCropKind === 'blog-card' || currentCropKind === 'blog-cover') {
      const spec = currentCropKind === 'blog-card' ? BLOG_CARD_SPEC : BLOG_COVER_SPEC;
      const masterCropped = cropper.getCroppedCanvas({
        width: spec.w * 2,
        height: spec.h * 2,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
        fillColor: 'transparent'
      });
      if (!masterCropped) {
        Modal.alert({ title: 'Crop Error', message: 'Could not read the cropped image.' });
        return;
      }
      const fitRect = getExportFitSourceRect(masterCropped);
      const sized = containCenterOnCanvasRegion(
        masterCropped,
        fitRect.sx,
        fitRect.sy,
        fitRect.sw,
        fitRect.sh,
        spec.w,
        spec.h
      );
      const dataUrl = composeBlurredBackgroundJpeg(sized, spec.w, spec.h, cropBgMode, cropBgPickedCol);
      try {
        const url = await blogUploadImageToBunny(dataUrl, spec.filename);
        currentCropCallback(url);
        closeCropModal();
      } catch (uploadErr) {
        Modal.alert({ title: 'Upload Failed', message: uploadErr.message || 'Failed to upload image.' });
        console.error('Upload error:', uploadErr);
      }
      return;
    }

    if (currentCropKind === 'event') {
      const exportSpecs = MULTI_SIZE_CROP_SPECS.event;
      const masterCropped = cropper.getCroppedCanvas({
        width: EVENT_IMAGE_MASTER_W,
        height: EVENT_IMAGE_MASTER_H,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
        fillColor: 'transparent'
      });
      if (!masterCropped) {
        Modal.alert({ title: 'Crop Error', message: 'Could not read the cropped image.' });
        return;
      }
      const fitRect = getExportFitSourceRect(masterCropped);
      const batchId = Date.now();
      const bundle = {};
      for (const spec of exportSpecs) {
        const sized =
          spec.fit === 'contain'
            ? containCenterOnCanvasRegion(
                masterCropped,
                fitRect.sx,
                fitRect.sy,
                fitRect.sw,
                fitRect.sh,
                spec.w,
                spec.h
              )
            : fillHeightMinCenterOnCanvasRegion(
                masterCropped,
                fitRect.sx,
                fitRect.sy,
                fitRect.sw,
                fitRect.sh,
                spec.w,
                spec.h
              );
        const dataUrl = composeBlurredBackgroundJpeg(sized, spec.w, spec.h, cropBgMode, cropBgPickedCol);
        try {
          const uploadUrl = await adminUploadImageToR2(dataUrl, `${batchId}-${spec.filename}`);
          bundle[spec.key] = uploadUrl;
        } catch (uploadErr) {
          Modal.alert({ title: 'Upload Failed', message: uploadErr.message || 'Failed to upload an image variant.' });
          console.error('Upload error:', uploadErr);
          return;
        }
      }
      currentCropCallback(bundle);
      closeCropModal();
      return;
    }

    // Product (or other single-size) crop
    let targetWidth, targetHeight;
    if (Math.abs(currentAspectRatio - (800 / 379)) < 0.01) {
      targetWidth = 800;
      targetHeight = 379;
    } else {
      targetWidth = 672;
      targetHeight = 440;
    }

    const croppedCanvas = cropper.getCroppedCanvas({
      width: targetWidth,
      height: targetHeight,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      fillColor: 'transparent'
    });

    const croppedImage = composeBlurredBackgroundJpeg(
      croppedCanvas, targetWidth, targetHeight, cropBgMode, cropBgPickedCol
    );

    const uploadRes = await fetch(`${API_BASE}/admin/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        image: croppedImage,
        filename: 'product-image.jpg'
      })
    });

    const uploadData = await uploadRes.json();

    if (uploadData.success) {
      currentCropCallback(uploadData.url);
      closeCropModal();
    } else {
      Modal.alert({ title: 'Upload Failed', message: 'Failed to upload image. Please try again.' });
      console.error('Upload error:', uploadData);
    }
  } catch (err) {
    Modal.alert({ title: 'Error', message: 'Error uploading image. Please try again.' });
    console.error('Upload error:', err);
  }
});

// Tabs & deep links (e.g. /admin#bookings-upcoming, /admin#events)
const ADMIN_TABS = ['products', 'shop-promos', 'events', 'registrations', 'orders', 'memberships', 'bookings', 'cron', 'newsletter', 'blog'];

function scrollToAdminSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function switchAdminTab(tab, options = {}) {
  const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
  if (!btn) return false;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.style.borderBottomColor = 'transparent';
    b.style.color = 'rgb(var(--color-neutral-600))';
  });
  btn.classList.add('active');
  btn.style.borderBottomColor = 'rgb(var(--color-primary-600))';
  btn.style.color = 'rgb(var(--color-primary-600))';
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  const panel = document.getElementById(tab + '-tab');
  if (panel) panel.style.display = 'block';
  if (tab === 'bookings') loadBookingsAndCalendar();
  if (tab === 'memberships') loadMemberships();
  if (tab === 'newsletter') {
    loadNewsletterRecipients();
    loadNewsletterEvents();
    nlInitEditor();
  }
  if (tab === 'blog') {
    blogInitTab();
  }
  if (tab === 'shop-promos') loadShopPromoCodes();
  if (options.sectionId) {
    setTimeout(() => scrollToAdminSection(options.sectionId), 80);
  }
  return true;
}

function handleAdminHash() {
  const raw = (location.hash || '').replace(/^#/, '');
  if (!raw) return;
  if (document.getElementById('admin-dashboard').style.display === 'none') return;
  let tab = null;
  let sectionId = null;
  if (ADMIN_TABS.includes(raw)) {
    tab = raw;
  } else {
    for (const t of ADMIN_TABS) {
      if (raw === t || raw.startsWith(t + '-')) {
        tab = t;
        if (raw !== t) sectionId = 'admin-section-' + raw;
        break;
      }
    }
  }
  if (!tab) return;
  switchAdminTab(tab, { sectionId });
}

window.addEventListener('hashchange', handleAdminHash);

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    if (tab) history.replaceState(null, '', '#' + tab);
    switchAdminTab(tab);
  });
});

// Image Upload Handlers
document.getElementById('product-image-upload').addEventListener('change', (e) => {
const file = e.target.files[0];
if (file) {
showCropModal(file, (croppedImage) => {
uploadedProductImage = croppedImage;
document.getElementById('product-image-preview').innerHTML = 
`<img src="${croppedImage}" class="image-preview" alt="Preview">`;
});
}
});

document.getElementById('event-image-upload').addEventListener('change', (e) => {
const file = e.target.files[0];
if (file) {
showCropModal(file, (bundle) => {
  uploadedEventBundle = bundle;
  document.getElementById('event-image').value = bundle.image_url || '';
  document.getElementById('event-image-card').value = bundle.image_url_card || '';
  document.getElementById('event-image-hero').value = bundle.image_url_hero || '';
  document.getElementById('event-image-preview').innerHTML =
    `<div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:flex-start;">
      <div><div style="font-size:0.7rem;color:rgb(var(--color-neutral-500));">Main 800×379</div><div class="event-export-thumb event-export-thumb--main"><img src="${bundle.image_url}" alt="Main"></div></div>
      <div><div style="font-size:0.7rem;color:rgb(var(--color-neutral-500));">Card 400×238</div><div class="event-export-thumb event-export-thumb--card"><img src="${bundle.image_url_card}" alt="Card"></div></div>
      <div><div style="font-size:0.7rem;color:rgb(var(--color-neutral-500));">Hero 885×300</div><div class="event-export-thumb event-export-thumb--hero"><img src="${bundle.image_url_hero}" alt="Hero"></div></div>
    </div>`;
}, 800 / 379, 'event');
}
});

// Products
document.getElementById('product-name').addEventListener('input', (e) => {
const slug = e.target.value
.toLowerCase()
.replace(/[^a-z0-9]+/g, '-')
.replace(/^-+|-+$/g, '');
document.getElementById('product-slug').value = slug;
});

// Category management
let selectedCategories = [];
let allCategories = new Set();

function addCategory() {
const input = document.getElementById('category-input');
const category = input.value.trim();
  
if (!category) return;
  
if (selectedCategories.length >= 3) {
alert('Maximum 3 categories allowed');
return;
}
  
if (selectedCategories.includes(category)) {
alert('Category already added');
return;
}
  
selectedCategories.push(category);
allCategories.add(category);
input.value = '';
renderCategoryTags();
renderExistingCategories();
}

function removeCategory(category) {
selectedCategories = selectedCategories.filter(c => c !== category);
renderCategoryTags();
}

function renderCategoryTags() {
const container = document.getElementById('category-tags');
if (selectedCategories.length === 0) {
container.innerHTML = '<span style="color: rgb(var(--color-neutral-400)); font-size: 0.875rem;">No categories selected</span>';
return;
}
  
container.innerHTML = selectedCategories.map(cat => `
<span style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: rgb(var(--color-primary-600)); color: white; border-radius: 6px; font-size: 0.875rem;">
${cat}
<button type="button" onclick="removeCategory('${cat}')" style="background: none; border: none; color: white; cursor: pointer; padding: 0; font-size: 1.25rem; line-height: 1;">&times;</button>
</span>
`).join('');
}

function renderExistingCategories() {
const container = document.getElementById('existing-categories');
const availableCategories = Array.from(allCategories).filter(c => !selectedCategories.includes(c));
  
if (availableCategories.length === 0) {
container.innerHTML = '';
return;
}
  
container.innerHTML = availableCategories.map(cat => `
<button type="button" onclick="addExistingCategory('${cat}')" style="padding: 0.5rem 0.75rem; background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-700)); border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
${cat}
</button>
`).join('');
}

function addExistingCategory(category) {
if (selectedCategories.length >= 3) {
alert('Maximum 3 categories allowed');
return;
}
selectedCategories.push(category);
renderCategoryTags();
renderExistingCategories();
}

// Allow Enter key to add category
document.addEventListener('DOMContentLoaded', () => {
const categoryInput = document.getElementById('category-input');
if (categoryInput) {
categoryInput.addEventListener('keypress', (e) => {
if (e.key === 'Enter') {
e.preventDefault();
addCategory();
}
});
}
});

function togglePreorderDate() {
const preorderCheckbox = document.getElementById('product-preorder');
const dateContainer = document.getElementById('preorder-date-container');
dateContainer.style.display = preorderCheckbox.checked ? 'block' : 'none';
if (!preorderCheckbox.checked) {
document.getElementById('product-release-date').value = '';
}
}

async function loadProducts() {
try {
const res = await fetch(`${API_BASE}/products`);
const products = await res.json();
const list = document.getElementById('products-list');

// Collect all categories
products.forEach(p => {
if (p.category) {
p.category.split(',').forEach(cat => allCategories.add(cat.trim()));
}
});
renderExistingCategories();

if (products.length === 0) {
list.innerHTML = '<p style="color: rgb(var(--color-neutral-500));">No products yet</p>';
return;
}

list.innerHTML = products.map(p => {
const categories = p.category ? p.category.split(',').map(c => c.trim()).join(', ') : 'N/A';
return `
<div class="item-card">
<div style="display: flex; gap: 1rem;">
${p.image_url ? `<img src="${p.image_url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;">` : ''}
<div style="flex: 1;">
<h3>${p.name} ${p.is_active === 1 ? '' : '<span style="color: #999;">(Inactive)</span>'}</h3>
<p style="margin: 0.25rem 0; color: rgb(var(--color-neutral-600));">${p.summary || ''}</p>
<p style="margin: 0.5rem 0;"><strong>£${(p.price / 100).toFixed(2)}</strong> | Stock: ${p.stock_quantity} | Categories: ${categories}</p>
</div>
</div>
<div class="item-actions">
<button class="btn-edit" onclick="editProduct(${p.id})">Edit</button>
<button class="btn-delete" onclick="deleteProduct(${p.id}, '${p.name}')">Delete</button>
${p.slug ? `<button class="btn-index" onclick="requestIndexing('product', '${p.slug}', this)">📡 Index</button>` : ''}
</div>
</div>
`;
}).join('');
} catch (err) {
console.error('Load products error:', err);
}
}

document.getElementById('product-form').addEventListener('submit', async (e) => {
e.preventDefault();
const id = document.getElementById('product-id').value;
const imageUrl = uploadedProductImage || document.getElementById('product-image').value;
const preorderChecked = document.getElementById('product-preorder').checked;
const releaseDate = preorderChecked ? document.getElementById('product-release-date').value : null;

const data = {
name: document.getElementById('product-name').value,
slug: document.getElementById('product-slug').value,
summary: document.getElementById('product-summary').value,
full_description: document.getElementById('description-content').innerHTML,
price: Math.round(parseFloat(document.getElementById('product-price').value) * 100),
stock_quantity: parseInt(document.getElementById('product-stock').value),
category: selectedCategories.join(','),
image_url: imageUrl,
is_active: document.getElementById('product-active').checked ? 1 : 0,
release_date: releaseDate
};

try {
const url = id ? `${API_BASE}/admin/products/${id}` : `${API_BASE}/admin/products`;
const method = id ? 'PUT' : 'POST';

const res = await fetch(url, {
method,
headers: {
'Content-Type': 'application/json',
'X-Session-Token': sessionToken
},
body: JSON.stringify(data)
});

if (res.ok) {
document.getElementById('product-form').reset();
document.getElementById('product-id').value = '';
document.getElementById('description-content').innerHTML = '';
document.getElementById('product-form-title').textContent = 'Add New Product';
document.getElementById('product-submit-text').textContent = 'Add Product';
document.getElementById('cancel-product-edit').style.display = 'none';
document.getElementById('product-image-preview').innerHTML = '';
document.getElementById('product-preorder').checked = false;
document.getElementById('product-release-date').value = '';
document.getElementById('preorder-date-container').style.display = 'none';
selectedCategories = [];
renderCategoryTags();
uploadedProductImage = null;
loadProducts();
} else {
alert('Failed to save product');
}
} catch (err) {
alert('Error saving product');
}
});

document.getElementById('cancel-product-edit').addEventListener('click', () => {
document.getElementById('product-form').reset();
document.getElementById('product-id').value = '';
document.getElementById('description-content').innerHTML = '';
document.getElementById('product-form-title').textContent = 'Add New Product';
document.getElementById('product-submit-text').textContent = 'Add Product';
document.getElementById('cancel-product-edit').style.display = 'none';
document.getElementById('product-image-preview').innerHTML = '';
document.getElementById('product-preorder').checked = false;
document.getElementById('product-release-date').value = '';
document.getElementById('preorder-date-container').style.display = 'none';
selectedCategories = [];
renderCategoryTags();
uploadedProductImage = null;
});

async function editProduct(id) {
try {
const res = await fetch(`${API_BASE}/products`);
const products = await res.json();
const product = products.find(p => p.id === id);

if (product) {
document.getElementById('product-id').value = product.id;
document.getElementById('product-name').value = product.name;
document.getElementById('product-slug').value = product.slug;
document.getElementById('product-summary').value = product.summary || '';
document.getElementById('description-content').innerHTML = product.full_description || '';
document.getElementById('product-price').value = (product.price / 100).toFixed(2);
document.getElementById('product-stock').value = product.stock_quantity;
document.getElementById('product-image').value = product.image_url || '';
document.getElementById('product-active').checked = product.is_active === 1;

// Load categories
selectedCategories = product.category ? product.category.split(',').map(c => c.trim()) : [];
renderCategoryTags();

// Pre-order fields
if (product.release_date) {
document.getElementById('product-preorder').checked = true;
document.getElementById('product-release-date').value = product.release_date;
document.getElementById('preorder-date-container').style.display = 'block';
} else {
document.getElementById('product-preorder').checked = false;
document.getElementById('product-release-date').value = '';
document.getElementById('preorder-date-container').style.display = 'none';
}

if (product.image_url) {
document.getElementById('product-image-preview').innerHTML = 
`<img src="${product.image_url}" class="image-preview" alt="Current">`;
}

document.getElementById('product-form-title').textContent = 'Edit Product';
document.getElementById('product-submit-text').textContent = 'Update Product';
document.getElementById('cancel-product-edit').style.display = 'block';
document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
}
} catch (err) {
alert('Error loading product');
}
}

async function deleteProduct(id, name) {
if (!confirm(`Delete product "${name}"?`)) return;

try {
const res = await fetch(`${API_BASE}/admin/products/${id}`, {
method: 'DELETE',
headers: { 'X-Session-Token': sessionToken }
});

if (res.ok) {
loadProducts();
} else {
alert('Failed to delete product');
}
} catch (err) {
alert('Error deleting product');
}
}

// Events
document.getElementById('event-title').addEventListener('input', (e) => {
const slug = e.target.value
.toLowerCase()
.replace(/[^a-z0-9]+/g, '-')
.replace(/^-+|-+$/g, '');
document.getElementById('event-slug').value = slug;
});

async function loadEvents() {
try {
const res = await fetch(`${API_BASE}/events`);
const events = await res.json();
const list = document.getElementById('events-list');

if (events.length === 0) {
list.innerHTML = '<p style="color: rgb(var(--color-neutral-500));">No events yet</p>';
return;
}

list.innerHTML = events.map(e => {
const requiresPurchase = e.requires_purchase === 1;
const eventDate = e.event_datetime ? new Date(e.event_datetime).toLocaleDateString() : 'No date';
const eventTime = e.event_datetime ? new Date(e.event_datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
const eventId = e.id || e.event_id;
return `
<div class="item-card">
<div style="display: flex; gap: 1rem;">
${e.image_url ? `<img src="${e.image_url_card || e.image_url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;">` : ''}
<div style="flex: 1;">
<h3>${e.title} ${e.is_active === 1 ? '' : '<span style="color: #999;">(Inactive)</span>'} ${requiresPurchase ? '' : '<span style="color: #2563eb; font-size: 0.875rem;">(Free Event)</span>'}</h3>
<p style="margin: 0.25rem 0; color: rgb(var(--color-neutral-600));">${e.description || ''}</p>
<p style="margin: 0.5rem 0;"><strong>${eventDate}</strong> ${eventTime} ${e.location ? `| ${e.location}` : ''}</p>
${requiresPurchase ? `<p style="margin: 0.5rem 0;">Member: £${(e.membership_price / 100).toFixed(2)} | Non-member: £${(e.non_membership_price / 100).toFixed(2)}${e.capacity ? ` | Max: ${e.capacity}` : ''}</p>` : ''}
</div>
</div>
<div class="item-actions">
<button class="btn-edit" onclick="editEvent(${eventId})">Edit</button>
<button class="btn-delete" onclick="deleteEvent(${eventId}, '${e.title.replace(/'/g, "\\'")}')">Delete</button>
${e.slug ? `<button class="btn-index" onclick="requestIndexing('event', '${e.slug}', this)">📡 Index</button>` : ''}
</div>
</div>
`;
}).join('');
} catch (err) {
console.error('Load events error:', err);
}
}

document.getElementById('event-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('event-id').value;
  const imageUrl = uploadedEventBundle?.image_url || document.getElementById('event-image').value.trim();
  const imageUrlCard = uploadedEventBundle?.image_url_card ?? (document.getElementById('event-image-card').value.trim() || null);
  const imageUrlHero = uploadedEventBundle?.image_url_hero ?? (document.getElementById('event-image-hero').value.trim() || null);
  const requiresPurchase = document.getElementById('event-requires-purchase').checked;
  const isRecurring = document.getElementById('event-is-recurring').checked;

  const data = {
    title: document.getElementById('event-title').value,
    slug: document.getElementById('event-slug').value,
    organiser: document.getElementById('event-organiser').value,
    description: document.getElementById('event-description').value,
    seo_description: document.getElementById('event-seo-description').value,
    seo_organizer: document.getElementById('event-seo-organizer').value,
    seo_image: document.getElementById('event-seo-image').value,
    full_description: document.getElementById('event-full-description').innerHTML,
    event_date: isRecurring ? '2025-01-01' : document.getElementById('event-date').value,
    time: isRecurring ? document.getElementById('recurring-time').value : document.getElementById('event-time').value,
    end_time: isRecurring ? document.getElementById('recurring-end-time').value : document.getElementById('event-end-time').value,
    requires_purchase: requiresPurchase ? 1 : 0,
    membership_price: requiresPurchase ? parseFloat(document.getElementById('event-member-price').value) : 0,
    non_membership_price: requiresPurchase ? parseFloat(document.getElementById('event-nonmember-price').value) : 0,
    max_attendees: requiresPurchase ? (parseInt(document.getElementById('event-max-attendees').value) || null) : null,
    location: document.getElementById('event-location').value,
    image_url: imageUrl || null,
    image_url_card: imageUrlCard || null,
    image_url_hero: imageUrlHero || null,
    is_active: document.getElementById('event-active').checked ? 1 : 0,
    is_recurring: isRecurring ? 1 : 0,
    recurrence_pattern: isRecurring ? getRecurrencePattern() : null,
    recurrence_end_date: isRecurring ? (document.getElementById('recurrence-end-date').value || null) : null
  };

  try {
    const url = id ? `${API_BASE}/admin/events/${id}` : `${API_BASE}/admin/events`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      document.getElementById('event-form').reset();
      document.getElementById('event-id').value = '';
      document.getElementById('event-form-title').textContent = 'Add New Event';
      document.getElementById('event-submit-text').textContent = 'Add Event';
      document.getElementById('cancel-event-edit').style.display = 'none';
      document.getElementById('event-image-preview').innerHTML = '';
      document.getElementById('event-full-description').innerHTML = '';
      document.getElementById('event-seo-organizer').value = '';
      document.getElementById('event-seo-image').value = '';
      document.getElementById('event-image-card').value = '';
      document.getElementById('event-image-hero').value = '';
uploadedEventBundle = null;
loadEvents();
alert('Event saved successfully!');
} else {
const error = await res.json();
alert('Failed to save event: ' + (error.error || error.message || 'Unknown error'));
}
} catch (err) {
alert('Error saving event: ' + err.message);
}
});

document.getElementById('event-image')?.addEventListener('input', () => {
  const v = document.getElementById('event-image').value.trim();
  if (!uploadedEventBundle || v !== uploadedEventBundle.image_url) {
    uploadedEventBundle = null;
    document.getElementById('event-image-card').value = '';
    document.getElementById('event-image-hero').value = '';
  }
});

document.getElementById('cancel-event-edit').addEventListener('click', () => {
document.getElementById('event-form').reset();
document.getElementById('event-id').value = '';
document.getElementById('event-slug').value = '';
document.getElementById('event-full-description').innerHTML = '';
document.getElementById('event-seo-description').value = '';
document.getElementById('event-seo-organizer').value = '';
document.getElementById('event-seo-image').value = '';
document.getElementById('event-end-time').value = '';
document.getElementById('recurring-end-time').value = '';
document.getElementById('event-requires-purchase').checked = true;
document.getElementById('event-pricing-fields').style.display = 'block';
document.getElementById('event-form-title').textContent = 'Add New Event';
document.getElementById('event-submit-text').textContent = 'Add Event';
document.getElementById('cancel-event-edit').style.display = 'none';
document.getElementById('event-image-preview').innerHTML = '';
document.getElementById('event-image-card').value = '';
document.getElementById('event-image-hero').value = '';
const seoBody = document.getElementById('seo-section-body');
const seoBtn = seoBody?.previousElementSibling;
if (seoBody) seoBody.classList.remove('is-open');
if (seoBtn) seoBtn.classList.remove('is-open');
uploadedEventBundle = null;
});

async function editEvent(id) {
  try {
    const res = await fetch(`${API_BASE}/admin/events/${id}`, {
      headers: { 'X-Session-Token': sessionToken }
    });
    const data = await res.json();
    const event = data.event || data;

    document.getElementById('event-id').value = event.id || event.event_id;
    document.getElementById('event-title').value = event.title || event.event_name;
    document.getElementById('event-slug').value = event.slug || '';
    document.getElementById('event-organiser').value = event.organiser || '';
    document.getElementById('event-description').value = event.description || '';
    document.getElementById('event-seo-description').value = event.seo_description || '';
    document.getElementById('event-seo-organizer').value = event.seo_organizer || '';
    document.getElementById('event-seo-image').value = event.seo_image || '';
    if (event.seo_description || event.seo_organizer || event.seo_image) {
      const seoBody = document.getElementById('seo-section-body');
      const seoBtn = seoBody?.previousElementSibling;
      if (seoBody) seoBody.classList.add('is-open');
      if (seoBtn) seoBtn.classList.add('is-open');
    }
    document.getElementById('event-full-description').innerHTML = event.full_description || '';

    // Parse datetime (treat as local time, not UTC)
    if (event.event_datetime) {
      // Split the ISO string directly without Date parsing to avoid timezone conversion
      const datetimeStr = event.event_datetime.replace('Z', ''); // Remove Z if present
      const [eventDate, eventTime] = datetimeStr.split('T');
      document.getElementById('event-date').value = eventDate;
      document.getElementById('event-time').value = eventTime ? eventTime.slice(0, 5) : '';
      if (event.is_recurring === 1) {
        document.getElementById('recurring-time').value = eventTime ? eventTime.slice(0, 5) : '';
      }
    }

    // Set end time
    if (event.end_time) {
      document.getElementById('event-end-time').value = event.end_time.slice(0, 5);
      document.getElementById('recurring-end-time').value = event.end_time.slice(0, 5);
    } else {
      document.getElementById('event-end-time').value = '';
      document.getElementById('recurring-end-time').value = '';
    }

    document.getElementById('event-location').value = event.location || '';
    document.getElementById('event-image').value = event.image_url || '';
    document.getElementById('event-image-card').value = event.image_url_card || '';
    document.getElementById('event-image-hero').value = event.image_url_hero || '';

    // Pricing
    const requiresPurchase = event.requires_purchase === 1;
    document.getElementById('event-requires-purchase').checked = requiresPurchase;
    toggleEventPricing();

    if (requiresPurchase) {
      document.getElementById('event-member-price').value = event.membership_price || '';
      document.getElementById('event-nonmember-price').value = event.non_membership_price || '';
      document.getElementById('event-max-attendees').value = event.capacity || '';
    }

    document.getElementById('event-active').checked = event.is_active === 1;

    // Recurring event fields
    const isRecurring = event.is_recurring === 1;
    document.getElementById('event-is-recurring').checked = isRecurring;
    toggleRecurringFields();
    
    if (isRecurring && event.recurrence_pattern) {
      setRecurrencePattern(event.recurrence_pattern);
    }
    
    if (event.recurrence_end_date) {
      document.getElementById('recurrence-end-date').value = event.recurrence_end_date;
    }

    if (event.image_url) {
      const card = event.image_url_card || event.image_url;
      const hero = event.image_url_hero || event.image_url;
      document.getElementById('event-image-preview').innerHTML =
        `<div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:flex-start;">
          <div><div style="font-size:0.7rem;color:rgb(var(--color-neutral-500));">Main</div><div class="event-export-thumb event-export-thumb--main"><img src="${event.image_url}" alt="Current"></div></div>
          <div><div style="font-size:0.7rem;color:rgb(var(--color-neutral-500));">Card</div><div class="event-export-thumb event-export-thumb--card"><img src="${card}" alt="Card"></div></div>
          <div><div style="font-size:0.7rem;color:rgb(var(--color-neutral-500));">Hero</div><div class="event-export-thumb event-export-thumb--hero"><img src="${hero}" alt="Hero"></div></div>
        </div>`;
    }

    document.getElementById('event-form-title').textContent = 'Edit Event';
    document.getElementById('event-submit-text').textContent = 'Update Event';
    document.getElementById('cancel-event-edit').style.display = 'block';
    document.getElementById('event-form').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('Error loading event: ' + err.message);
  }
}

async function deleteEvent(id, title) {
  // First confirmation
  Modal.confirm({
    title: 'Delete Event',
    message: `Are you sure you want to delete "${utils.escapeHtml(title)}"?`,
    confirmText: 'Delete',
    confirmStyle: 'danger',
    onConfirm: async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/events/${id}`, {
          method: 'DELETE',
          headers: { 'X-Session-Token': sessionToken }
        });

        if (res.ok) {
          loadEvents();
        } else {
          const data = await res.json();
          
          // Event has tickets - show warning with ticket holders
          if (data.error === 'has_tickets') {
            const ticketHolders = data.ticket_holders || [];
            const ticketCount = data.tickets_sold || 0;
            
            let message = `<div style="margin-bottom: 1rem;">
              <p style="color: #dc2626; font-weight: 600; margin-bottom: 0.75rem;">
                ⚠️ WARNING: "${utils.escapeHtml(data.event_name)}" has ${ticketCount} ticket(s) sold.
              </p>
              <p style="margin-bottom: 0.75rem;">The following users have purchased tickets:</p>
              <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                ${ticketHolders.map(holder => 
                  `<li>${utils.escapeHtml(holder.name)} (${utils.escapeHtml(holder.email)}) - ${holder.ticket_count} ticket(s)</li>`
                ).join('')}
              </ul>
              <p style="color: #dc2626; margin-top: 1rem;">
                🗑️ If you delete this event, ALL ${ticketCount} ticket(s) will be permanently deleted.
              </p>
            </div>`;
            
            Modal.confirm({
              title: 'Confirm Deletion',
              message: message,
              confirmText: 'Delete Event & Tickets',
              cancelText: 'Cancel',
              confirmStyle: 'danger',
              size: 'md',
              onConfirm: async () => {
                // Force delete with all tickets
                const forceRes = await fetch(`${API_BASE}/admin/events/${id}?force=true`, {
                  method: 'DELETE',
                  headers: { 'X-Session-Token': sessionToken }
                });
                
                if (forceRes.ok) {
                  Modal.alert({
                    title: 'Success',
                    message: 'Event and all associated tickets deleted successfully'
                  });
                  loadEvents();
                } else {
                  Modal.alert({
                    title: 'Error',
                    message: 'Failed to delete event'
                  });
                }
              }
            });
          } else {
            Modal.alert({
              title: 'Error',
              message: 'Failed to delete event'
            });
          }
        }
      } catch (err) {
        console.error('Delete event error:', err);
        Modal.alert({
          title: 'Error',
          message: 'Error deleting event'
        });
      }
    }
  });
}

// Orders
async function loadOrders() {
  const list = document.getElementById('orders-list');
  list.innerHTML = '<p class="admin-text-muted">Order management coming soon. Use SQL queries for now.</p>';
}

// Registrations
async function loadRegistrations() {
  const list = document.getElementById('registrations-list');
  list.innerHTML = '<p class="admin-text-center admin-text-muted" style="padding: 2rem;">Loading...</p>';
  
  try {
    const res = await fetch(`${API_BASE}/admin/registrations`, {
      headers: {
        'X-Session-Token': sessionToken
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch registrations');
    }

    const data = await res.json();
    
    if (!data.success || !data.events || data.events.length === 0) {
      list.innerHTML = '<p class="admin-text-center admin-text-muted" style="padding: 2rem;">No upcoming events with registrations</p>';
      return;
    }

    // Group events by type
    const freeEvents = data.events.filter(e => e.requires_purchase === 0);
    const paidEvents = data.events.filter(e => e.requires_purchase === 1);

    let html = '';
    
    if (freeEvents.length > 0) {
      html += '<h3 class="admin-mt-0">Free Events (Registrations)</h3>';
      html += renderEventRegistrations(freeEvents, true);
    }
    
    if (paidEvents.length > 0) {
      html += '<h3 class="admin-mt-3">Paid Events (Ticket Sales)</h3>';
      html += renderEventRegistrations(paidEvents, false);
    }

    list.innerHTML = html;
    
    // Add event listeners for view details buttons
    document.querySelectorAll('.view-registrations-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const eventId = btn.dataset.eventId;
        const eventName = btn.dataset.eventName;
        viewEventRegistrations(eventId, eventName);
      });
    });
  } catch (err) {
    console.error('Error loading registrations:', err);
    list.innerHTML = '<p style="color: #c00;">Failed to load registrations. Please refresh the page.</p>';
  }
}

function renderEventRegistrations(events, isFree) {
  return events.map(event => {
    const eventDate = new Date(event.event_datetime);
    // Don't mark recurring events as past (they continue indefinitely)
    const isPast = event.is_recurring !== 1 && eventDate < new Date();
    const capacity = event.capacity || '∞';
    const percentage = event.capacity ? Math.round((event.tickets_sold / event.capacity) * 100) : 0;
    
    return `
      <div class="admin-card" style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.125rem;">${event.event_name}${event.is_recurring === 1 ? ' 🔄' : ''}</h4>
            <div class="admin-text-sm admin-text-muted" style="margin-bottom: 0.5rem;">
              📅 ${eventDate.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            ${isPast ? '<span style="background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-700)); padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">PAST EVENT</span>' : ''}
            ${!event.is_active ? '<span style="background: #fee2e2; color: #991b1b; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">INACTIVE</span>' : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 2rem; font-weight: bold; color: rgb(var(--color-primary-600));">
              ${event.confirmed_registrations || 0}
            </div>
            <div class="admin-text-sm admin-text-muted">
              ${isFree ? 'Registered' : 'Tickets Sold'}
            </div>
            ${event.capacity ? `
              <div class="admin-mt-2">
                <div style="background: rgb(var(--color-neutral-200)); height: 6px; border-radius: 3px; overflow: hidden;">
                  <div style="background: rgb(var(--color-primary-600)); height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
                </div>
                <div class="admin-text-xs admin-text-muted admin-mt-1">
                  ${event.tickets_sold} / ${capacity}
                </div>
              </div>
            ` : ''}
            ${event.pending_registrations > 0 ? `
              <div class="admin-text-xs admin-mt-2" style="color: #f59e0b;">
                ⏳ ${event.pending_registrations} pending
              </div>
            ` : ''}
          </div>
        </div>
        <div class="admin-flex admin-mt-3" style="gap: 0.5rem;">
          <button 
            class="view-registrations-btn admin-btn-primary" 
            data-event-id="${event.event_id}"
            data-event-name="${event.event_name}">
            View Details
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function viewEventRegistrations(eventId, eventName) {
  // Create modal with loading state
  const modal = new Modal({
    title: `${eventName} - Registrations`,
    size: 'lg',
    content: '<p class="admin-text-center admin-text-muted" style="padding: 2rem;">Loading...</p>'
  });
  
  modal.open();
  
  try {
    const res = await fetch(`${API_BASE}/admin/events/${eventId}/registrations`, {
      headers: {
        'X-Session-Token': sessionToken
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch event registrations');
    }

    const data = await res.json();
    
    if (!data.registrations || data.registrations.length === 0) {
      modal.setContent('<p class="admin-text-center admin-text-muted" style="padding: 2rem;">No registrations yet</p>');
      return;
    }

    const isFree = data.event.requires_purchase === 0;
    
    // Group registrations by status
    const groupedByStatus = {
      active: data.registrations.filter(r => r.status === 'active'),
      pending: data.registrations.filter(r => r.status === 'pending'),
      cancelled: data.registrations.filter(r => r.status === 'cancelled')
    };
    
    // Count totals
    const activeCount = groupedByStatus.active.length;
    const pendingCount = groupedByStatus.pending.length;
    const cancelledCount = groupedByStatus.cancelled.length;
    
    const statusConfigs = {
      active: {
        label: 'Active',
        color: '#065f46',
        bgColor: '#d1fae5',
        icon: '✓'
      },
      pending: {
        label: 'Pending',
        color: '#92400e',
        bgColor: '#fef3c7',
        icon: '⏳'
      },
      cancelled: {
        label: 'Cancelled',
        color: '#991b1b',
        bgColor: '#fee2e2',
        icon: '✕'
      }
    };
    
    // Build content with grouped sections
    let tableHTML = '';
    
    ['active', 'pending', 'cancelled'].forEach(status => {
      const regs = groupedByStatus[status];
      if (regs.length === 0) return;
      
      const config = statusConfigs[status];
      
      tableHTML += `
        <div class="admin-mb-3">
          <h4 style="margin: 0 0 1rem 0; padding: 0.5rem 1rem; background: ${config.bgColor}; color: ${config.color}; border-radius: 6px; font-size: 1rem; display: inline-flex; align-items: center; gap: 0.5rem;">
            <span>${config.icon}</span>
            ${config.label} (${regs.length})
          </h4>
          <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem;">
            <thead>
              <tr style="border-bottom: 2px solid rgb(var(--color-neutral-200));">
                <th style="text-align: left; padding: 0.75rem; font-weight: 600;">Name</th>
                <th style="text-align: left; padding: 0.75rem; font-weight: 600;">Email</th>
                ${!isFree ? '<th style="text-align: left; padding: 0.75rem; font-weight: 600;">Amount</th>' : ''}
                <th style="text-align: left; padding: 0.75rem; font-weight: 600;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${regs.map(reg => {
                const regDate = new Date(reg.created_at);
                
                // Amount is already in pounds from transactions table
                const amount = parseFloat(reg.amount);
                const displayAmount = !isNaN(amount) && amount > 0 ? `£${amount.toFixed(2)}` : 'FREE';
                
                return `
                  <tr style="border-bottom: 1px solid rgb(var(--color-neutral-200));">
                    <td style="padding: 0.75rem;">${utils.escapeHtml(reg.name || 'N/A')}</td>
                    <td style="padding: 0.75rem;">${utils.escapeHtml(reg.email)}</td>
                    ${!isFree ? `<td style="padding: 0.75rem;">${displayAmount}</td>` : ''}
                    <td class="admin-text-sm" style="padding: 0.75rem;">${regDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    });
    
    modal.setContent(`
      <div class="admin-card admin-mb-3">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
          <div>
            <div class="admin-text-xs admin-text-muted" style="text-transform: uppercase; margin-bottom: 0.25rem;">Total</div>
            <div style="font-size: 1.5rem; font-weight: bold;">${data.registrations.length}</div>
          </div>
          <div>
            <div class="admin-text-xs" style="text-transform: uppercase; margin-bottom: 0.25rem; color: #065f46;">Active</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #065f46;">${activeCount}</div>
          </div>
          <div>
            <div class="admin-text-xs" style="text-transform: uppercase; margin-bottom: 0.25rem; color: #92400e;">Pending</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #92400e;">${pendingCount}</div>
          </div>
          <div>
            <div class="admin-text-xs" style="text-transform: uppercase; margin-bottom: 0.25rem; color: #991b1b;">Cancelled</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #991b1b;">${cancelledCount}</div>
          </div>
          ${data.event.capacity ? `
          <div>
            <div class="admin-text-xs admin-text-muted" style="text-transform: uppercase; margin-bottom: 0.25rem;">Capacity</div>
            <div style="font-size: 1.5rem; font-weight: bold;">${data.event.capacity}</div>
          </div>
          <div>
            <div class="admin-text-xs admin-text-muted" style="text-transform: uppercase; margin-bottom: 0.25rem;">Remaining</div>
            <div style="font-size: 1.5rem; font-weight: bold;">${data.event.capacity - data.event.tickets_sold}</div>
          </div>
          ` : ''}
        </div>
      </div>
      
      ${tableHTML || '<p class="admin-text-center admin-text-muted" style="padding: 2rem;">No registrations found</p>'}
    `);
  } catch (err) {
    console.error('Error loading event registrations:', err);
    modal.showError('Failed to load registrations');
  }
}

// Memberships
async function loadMemberships() {
  const tableBody = document.getElementById('memberships-list');
  const filter = document.getElementById('membership-filter')?.value || 'all';
  
  try {
    const res = await fetch(`${API_BASE}/admin/memberships?filter=${filter}`, {
      headers: {
        'X-Session-Token': sessionToken
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch memberships');
    }

    const data = await res.json();
    
    // Filter out pending memberships
    const activeMemberships = data.memberships ? data.memberships.filter(m => m.status !== 'pending') : [];
    
    if (!data.success || !activeMemberships || activeMemberships.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="admin-text-center admin-text-muted" style="padding: 3rem;">
            No memberships found
          </td>
        </tr>
      `;
      updateMembershipStats(data.stats || {});
      return;
    }

    // Update stats
    updateMembershipStats(data.stats || {});

    // Render table rows
    tableBody.innerHTML = activeMemberships.map(membership => {
      const startDate = new Date(membership.start_date);
      const endDate = new Date(membership.end_date);
      const today = new Date();
      const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      let statusBadge, statusColor;
      if (membership.status === 'active') {
        if (daysLeft < 0) {
          statusBadge = 'Expired';
          statusColor = '#f44336';
        } else if (daysLeft <= 7) {
          statusBadge = 'Expiring';
          statusColor = '#ff9800';
        } else if (daysLeft <= 30) {
          statusBadge = 'Active';
          statusColor = '#ff9800';
        } else {
          statusBadge = 'Active';
          statusColor = '#4CAF50';
        }
      } else {
        statusBadge = membership.status.charAt(0).toUpperCase() + membership.status.slice(1);
        statusColor = '#9e9e9e';
      }

      const planNames = {
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        annual: 'Annual'
      };

      return `
        <tr style="border-bottom: 1px solid rgb(var(--color-neutral-200));">
          <td style="padding: 1rem;">
            <div style="font-weight: 600;">${escapeHtml(membership.name || 'N/A')}</div>
          </td>
          <td style="padding: 1rem;">
            <div class="admin-text-sm admin-text-muted">${escapeHtml(membership.email)}</div>
          </td>
          <td style="padding: 1rem;">
            <span class="admin-text-sm" style="padding: 0.25rem 0.75rem; background: rgb(var(--color-primary-100)); color: rgb(var(--color-primary-700)); border-radius: 4px; font-weight: 600;">
              ${planNames[membership.plan] || membership.plan}
            </span>
          </td>
          <td class="admin-text-sm" style="padding: 1rem;">
            ${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </td>
          <td class="admin-text-sm" style="padding: 1rem;">
            ${endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </td>
          <td style="padding: 1rem;">
            <div style="font-weight: 600; color: ${daysLeft < 0 ? '#f44336' : daysLeft <= 30 ? '#ff9800' : '#4CAF50'};">
              ${daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
            </div>
          </td>
          <td style="padding: 1rem;">
            <span class="admin-text-xs" style="padding: 0.25rem 0.75rem; background: ${statusColor}; color: white; border-radius: 4px; font-weight: 600;">
              ${statusBadge}
            </span>
          </td>
          <td class="admin-text-center" style="padding: 1rem;">
            ${membership.auto_renew ? '✅' : '❌'}
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading memberships:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="admin-text-center admin-text-muted" style="padding: 3rem;">
          Error loading memberships: ${error.message}
        </td>
      </tr>
    `;
  }
}

function updateMembershipStats(stats) {
  document.getElementById('stat-active').textContent = stats.total_active || 0;
  document.getElementById('stat-expiring').textContent = stats.expiring_soon || 0;
  document.getElementById('stat-monthly-revenue').textContent = stats.monthly_revenue ? `£${stats.monthly_revenue}` : '£0';
  document.getElementById('stat-auto-renew').textContent = stats.auto_renew_count || 0;
}

// Cron Jobs
let cronCurrentPage = 0;
const cronPageSize = 20;

async function loadCronLogs(page = 0) {
  cronCurrentPage = page;
  const tableBody = document.getElementById('cron-logs-table');
  const summaryDiv = document.getElementById('cron-summary');
  const paginationDiv = document.getElementById('cron-pagination');
  const jobFilter = document.getElementById('cron-job-filter')?.value || '';
  
  try {
    const offset = page * cronPageSize;
    let url = `${API_BASE}/admin/cron-logs?limit=${cronPageSize}&offset=${offset}`;
    if (jobFilter) {
      url += `&job_name=${encodeURIComponent(jobFilter)}`;
    }

    const res = await fetch(url, {
      headers: {
        'X-Session-Token': sessionToken
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch cron logs');
    }

    const data = await res.json();
    
    // Render summary cards
    if (data.summary && data.summary.length > 0) {
      summaryDiv.innerHTML = data.summary.map(job => {
        const successRate = job.total_runs > 0 
          ? Math.round(((job.completed || 0) / job.total_runs) * 100) 
          : 0;
        const lastRun = job.last_run ? new Date(job.last_run).toLocaleString() : 'Never';
        
        return `
          <div class="admin-card">
            <h3 class="admin-text-muted" style="margin: 0 0 1rem 0; font-size: 1rem;">
              ${formatJobName(job.job_name)}
            </h3>
            <div class="admin-text-sm" style="display: grid; gap: 0.5rem;">
              <div style="display: flex; justify-content: space-between;">
                <span class="admin-text-muted">Total Runs (7d):</span>
                <strong>${job.total_runs}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span class="admin-text-muted">Success Rate:</span>
                <strong style="color: ${successRate >= 90 ? '#4CAF50' : successRate >= 70 ? '#ff9800' : '#f44336'};">${successRate}%</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span class="admin-text-muted">Processed:</span>
                <strong>${job.total_processed || 0}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span class="admin-text-muted">Last Run:</span>
                <strong class="admin-text-xs">${lastRun}</strong>
              </div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      summaryDiv.innerHTML = '<p class="admin-text-muted">No job summary available</p>';
    }
    
    // Render logs table
    if (!data.logs || data.logs.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="admin-text-center admin-text-muted" style="padding: 2rem;">
            No cron job logs found
          </td>
        </tr>
      `;
      paginationDiv.innerHTML = '';
      return;
    }

    tableBody.innerHTML = data.logs.map(log => {
      const startDate = new Date(log.started_at);
      const duration = log.completed_at 
        ? Math.round((new Date(log.completed_at) - startDate) / 1000) 
        : null;
      
      const statusColors = {
        completed: '#4CAF50',
        failed: '#f44336',
        partial: '#ff9800',
        running: '#2196F3'
      };
      const statusColor = statusColors[log.status] || '#666';
      
      return `
        <tr style="border-bottom: 1px solid rgb(var(--color-neutral-200));">
          <td style="padding: 1rem;">
            <strong>${formatJobName(log.job_name)}</strong>
          </td>
          <td style="padding: 1rem;">
            <div style="font-weight: 500;">${startDate.toLocaleDateString()}</div>
            <div class="admin-text-sm admin-text-muted">${startDate.toLocaleTimeString()}</div>
          </td>
          <td style="padding: 1rem;">
            ${duration !== null ? `${duration}s` : '-'}
          </td>
          <td style="padding: 1rem;">
            <span class="admin-text-sm" style="padding: 0.25rem 0.75rem; background: ${statusColor}22; color: ${statusColor}; border-radius: 4px; font-weight: 500; text-transform: uppercase;">
              ${log.status}
            </span>
          </td>
          <td class="admin-text-center" style="padding: 1rem;">
            ${log.records_processed || 0}
          </td>
          <td class="admin-text-center" style="padding: 1rem; color: #4CAF50; font-weight: 500;">
            ${log.records_succeeded || 0}
          </td>
          <td class="admin-text-center" style="padding: 1rem; color: #f44336; font-weight: 500;">
            ${log.records_failed || 0}
          </td>
          <td class="admin-text-sm" style="padding: 1rem;">
            ${log.error_message ? `<span style="color: #f44336;" title="${log.error_message}">⚠️ Error</span>` : ''}
            ${log.details ? `<button onclick="showCronDetails(${log.log_id}, '${escapeHtml(log.details)}')" class="admin-text-xs" style="padding: 0.25rem 0.5rem; background: rgb(var(--color-neutral-200)); border: none; border-radius: 4px; cursor: pointer;">View</button>` : '-'}
          </td>
        </tr>
      `;
    }).join('');

    // Render pagination
    const hasMore = data.logs.length === cronPageSize;
    paginationDiv.innerHTML = `
      <button 
        onclick="loadCronLogs(${page - 1})" 
        ${page === 0 ? 'disabled' : ''}
        class="${page === 0 ? 'admin-btn-secondary' : 'admin-btn-primary'}" 
        style="cursor: ${page === 0 ? 'not-allowed' : 'pointer'}; opacity: ${page === 0 ? '0.5' : '1'};">
        ← Previous
      </button>
      <span>Page ${page + 1}</span>
      <button 
        onclick="loadCronLogs(${page + 1})" 
        ${!hasMore ? 'disabled' : ''}
        class="${!hasMore ? 'admin-btn-secondary' : 'admin-btn-primary'}" 
        style="cursor: ${!hasMore ? 'not-allowed' : 'pointer'}; opacity: ${!hasMore ? '0.5' : '1'};">
        Next →
      </button>
    `;

  } catch (err) {
    console.error('Error loading cron logs:', err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="admin-text-center" style="padding: 2rem; color: #f44336;">
          Error loading cron logs: ${err.message}
        </td>
      </tr>
    `;
  }
}

function formatJobName(jobName) {
  const names = {
    auto_renewals: '🔄 Auto Renewals',
    event_reminders: '📧 Event Reminders',
    payment_reconciliation: '💳 Payment Reconciliation',
    bgg_board_games_sync: '🎲 Board Games Sync'
  };
  return names[jobName] || jobName;
}

async function syncBoardGames() {
  const button = document.getElementById('sync-board-games-btn');
  const originalText = button.innerHTML;
  
  try {
    button.disabled = true;
    button.innerHTML = '⏳ Syncing...';
    button.style.opacity = '0.6';
    
    const response = await fetch('https://dicebastiongames-9ze9m.bunny.run/api/boardgames/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Sync failed');
    }
    
    const data = await response.json();
    
    if (data.success) {
      const stats = data.stats || {};
      const message = `✅ Synced! Created: ${stats.created || 0}, Updated: ${stats.updated || 0}, Images: ${stats.imagesUploaded || 0}`;
      button.innerHTML = message;
      
      // Show detailed results in a modal if there were errors
      if (data.errors && data.errors.length > 0) {
        const modal = new Modal({
          title: 'Sync Completed with Errors',
          content: `
            <p><strong>Stats:</strong></p>
            <ul>
              <li>Processed: ${stats.processed || 0}</li>
              <li>Created: ${stats.created || 0}</li>
              <li>Updated: ${stats.updated || 0}</li>
              <li>Images Uploaded: ${stats.imagesUploaded || 0}</li>
              <li>Errors: ${stats.errors || 0}</li>
            </ul>
            <p><strong>Errors:</strong></p>
            <ul>${data.errors.map(e => `<li>${e}</li>`).join('')}</ul>
          `,
          size: 'lg'
        });
        modal.open();
      }
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        button.style.opacity = '1';
      }, 3000);
    } else {
      throw new Error(data.message || 'Sync failed');
    }
  } catch (err) {
    console.error('Error syncing board games:', err);
    button.innerHTML = '❌ Failed';
    alert(`Failed to sync board games: ${err.message}`);
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
      button.style.opacity = '1';
    }, 2000);
  }
}

function showCronDetails(logId, details) {
  try {
    const parsed = JSON.parse(details);
    alert(`Job Details (ID: ${logId}):\n\n${JSON.stringify(parsed, null, 2)}`);
  } catch {
    alert(`Job Details (ID: ${logId}):\n\n${details}`);
  }
}

function adminEscapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function adminParseDateTime(dateStr, timeStr) {
  const t = String(timeStr || '00:00').slice(0, 5);
  return new Date(`${dateStr}T${t}:00`);
}

function isUpcomingBooking(booking) {
  if (!booking || booking.status === 'cancelled') return false;
  if (!booking.booking_date) return false;
  return adminParseDateTime(booking.booking_date, booking.end_time || booking.start_time) >= new Date();
}

function isUpcomingTimeBlock(block) {
  if (!block || !block.block_date) return false;
  return adminParseDateTime(block.block_date, block.end_time || block.start_time) >= new Date();
}

function adminFormatBookingDate(dateStr) {
  try {
    const [y, m, d] = String(dateStr).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch { return dateStr; }
}

function adminScheduleDateBox(dt) {
  const d = dt instanceof Date ? dt : new Date(dt);
  if (Number.isNaN(d.getTime())) {
    return '<div class="admin-schedule-date-box"><div class="admin-schedule-date-day">—</div></div>';
  }
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const dow = d.toLocaleDateString('en-GB', { weekday: 'short' });
  return '<div class="admin-schedule-date-box">' +
    '<div class="admin-schedule-date-dow">' + dow + '</div>' +
    '<div class="admin-schedule-date-day">' + day + '</div>' +
    '<div class="admin-schedule-date-month">' + month + '</div>' +
    '</div>';
}

function adminScheduleRow(opts) {
  const type = opts.type;
  const rowClass = 'admin-schedule-row admin-schedule-row--' + type;
  const badgeClass = 'admin-schedule-badge admin-schedule-badge--' + type;
  const badgeLabel = type === 'event' ? 'Event' : type === 'booking' ? 'Booking' : 'Blocked';
  let actions = opts.actionsHtml || '';
  return '<article class="' + rowClass + '">' +
    adminScheduleDateBox(opts.when) +
    '<div class="admin-schedule-body">' +
    '<h4 class="admin-schedule-body-title"><span class="' + badgeClass + '">' + badgeLabel + '</span> ' + opts.title + '</h4>' +
    (opts.subtitle ? '<p class="admin-schedule-body-subtitle">' + opts.subtitle + '</p>' : '') +
    (opts.meta ? '<p class="admin-schedule-body-meta">' + opts.meta + '</p>' : '') +
    '</div>' +
    (actions ? '<div class="admin-schedule-actions">' + actions + '</div>' : '') +
    '</article>';
}

function adminScheduleMonthKey(dt) {
  const d = dt instanceof Date ? dt : new Date(dt);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function adminScheduleMonthLabel(dt) {
  const d = dt instanceof Date ? dt : new Date(dt);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function renderScheduleMonthDivider(when) {
  const label = adminScheduleMonthLabel(when);
  return '<div class="admin-schedule-month" role="separator" aria-label="' + adminEscapeHtml(label) + '">' +
    '<span class="admin-schedule-month-label">' + adminEscapeHtml(label) + '</span>' +
    '<span class="admin-schedule-month-line" aria-hidden="true"></span>' +
    '</div>';
}

function renderScheduleTimeline(items) {
  if (!items.length) return '';
  const sorted = items.slice().sort((a, b) => a.when - b.when).slice(0, 60);
  let html = '';
  let currentMonth = '';
  for (const item of sorted) {
    const monthKey = adminScheduleMonthKey(item.when);
    if (monthKey !== currentMonth) {
      currentMonth = monthKey;
      html += renderScheduleMonthDivider(item.when);
    }
    html += item.html;
  }
  return '<div class="admin-schedule-list">' + html + '</div>';
}

function normalizeEventsList(events) {
  if (Array.isArray(events)) return events;
  if (events && Array.isArray(events.events)) return events.events;
  if (events && Array.isArray(events.results)) return events.results;
  return [];
}

function buildScheduleEventItems(events, now) {
  return normalizeEventsList(events)
    .filter(e => e && e.event_datetime && new Date(e.event_datetime) >= now)
    .map(e => {
      const when = new Date(e.event_datetime);
      const timeStr = when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const endStr = e.end_time ? String(e.end_time).slice(0, 5) : '';
      const timeLine = endStr ? timeStr + ' – ' + adminEscapeHtml(endStr) : timeStr;
      const loc = e.location ? adminEscapeHtml(e.location) : '';
      const meta = timeLine + (loc ? '<br>' + loc : '');
      const title = adminEscapeHtml(e.title || e.event_name || 'Event');
      return { when, html: adminScheduleRow({ type: 'event', when, title, meta }) };
    });
}

function buildScheduleBookingItems(bookings) {
  return (bookings || [])
    .filter(isUpcomingBooking)
    .map(b => {
      const when = adminParseDateTime(b.booking_date, b.start_time);
      const meta = adminEscapeHtml(b.start_time) + ' – ' + adminEscapeHtml(b.end_time) +
        (b.table_type ? '<br>Table: ' + adminEscapeHtml(b.table_type) : '') +
        '<br>' + adminEscapeHtml(b.user_email || '');
      const title = adminEscapeHtml(b.user_name || 'Guest');
      const notesRaw = b.notes != null ? String(b.notes).trim() : '';
      const subtitle = notesRaw ? adminEscapeHtml(notesRaw) : '';
      return { when, html: adminScheduleRow({ type: 'booking', when, title, subtitle, meta }) };
    });
}

function buildScheduleBlockItems(blocks) {
  return (blocks || [])
    .filter(isUpcomingTimeBlock)
    .map(block => {
      const when = adminParseDateTime(block.block_date, block.start_time);
      const title = adminEscapeHtml(block.reason || 'Time blocked');
      const meta = adminEscapeHtml(block.start_time) + ' – ' + adminEscapeHtml(block.end_time);
      return { when, html: adminScheduleRow({ type: 'block', when, title, meta }) };
    });
}

async function loadBookingsSchedule() {
  const container = document.getElementById('bookings-schedule-content');
  if (!container) return;
  container.innerHTML = '<p class="admin-text-small" style="text-align:center;padding:1.5rem;">Loading schedule…</p>';
  try {
    const headers = sessionToken ? { 'Authorization': 'Bearer ' + sessionToken } : {};
    const [eventsRes, bookingsRes, blocksRes] = await Promise.all([
      fetch(API_BASE + '/events'),
      fetch('https://dicebastionbookings-ofbbu.bunny.run/api/bookings/all', { headers }),
      fetch('https://dicebastionbookings-ofbbu.bunny.run/api/bookings/blocks')
    ]);
    const eventsRaw = eventsRes.ok ? await eventsRes.json() : [];
    const bookingsData = bookingsRes.ok ? await bookingsRes.json() : { bookings: [] };
    const blocksData = blocksRes.ok ? await blocksRes.json() : { blocks: [] };
    const now = new Date();

    const items = [
      ...buildScheduleEventItems(eventsRaw, now),
      ...buildScheduleBookingItems(bookingsData.bookings || []),
      ...buildScheduleBlockItems(blocksData.blocks || [])
    ];

    if (!items.length) {
      container.innerHTML = '<p class="admin-text-small" style="text-align:center;padding:2rem;margin:0;">Nothing scheduled from now onward.</p>';
      return;
    }

    container.innerHTML = renderScheduleTimeline(items);
  } catch (err) {
    console.error('Error loading bookings schedule:', err);
    container.innerHTML = '<p class="admin-text-small" style="color:#dc2626;text-align:center;padding:1.5rem;">Failed to load schedule.</p>';
  }
}

async function loadUpcomingOverview() {
  await loadBookingsSchedule();
}

async function loadBookings() {
  await loadBookingsSchedule();
}

async function cancelBookingAdmin(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) {
    return;
  }
  
  try {
    const response = await fetch(`https://dicebastionbookings-ofbbu.bunny.run/api/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to cancel booking');
    }
    
    const data = await response.json();
    
    if (data.success) {
      alert('Booking cancelled successfully');
      loadBookingsAndCalendar();
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (err) {
    console.error('Error cancelling booking:', err);
    alert(`Failed to cancel booking: ${err.message}`);
  }
}

// ====== CALENDAR & TIME BLOCKS ======

let currentWeekStart = new Date();
currentWeekStart.setHours(0, 0, 0, 0);
// Set to Monday of current week
const day = currentWeekStart.getDay();
const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
currentWeekStart.setDate(diff);

async function loadTimeBlocks() {
  await loadBookingsSchedule();
}

async function deleteTimeBlock(blockId) {
  if (!confirm('Delete this time block?')) return;
  
  try {
    const response = await fetch(`https://dicebastionbookings-ofbbu.bunny.run/api/bookings/blocks/${blockId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      await loadTimeBlocks();
      await loadCalendarWeek();
    }
  } catch (err) {
    console.error('Error deleting block:', err);
    alert('Failed to delete time block');
  }
}

function showCreateBlockModal() {
  const userStatus = utils.session.getUserStatus();
  
  const modal = new Modal({
    title: 'Block Time Slot',
    size: 'md',
    content: `
      <form id="block-form" class="form-container">
        <div class="form-group">
          <label for="block-date" class="form-label">Date *</label>
          <input type="date" id="block-date" required class="form-input">
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="block-start-time" class="form-label">Start Time *</label>
            <input type="time" id="block-start-time" required class="form-input">
          </div>
          <div class="form-group">
            <label for="block-end-time" class="form-label">End Time *</label>
            <input type="time" id="block-end-time" required class="form-input">
          </div>
        </div>
        
        <div class="form-group">
          <label for="block-reason" class="form-label">Reason (Optional)</label>
          <input type="text" id="block-reason" placeholder="e.g., Staff meeting, Maintenance" class="form-input">
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-full">Create Block</button>
        </div>
      </form>
    `
  });
  
  modal.open();
  
  document.getElementById('block-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const blockData = {
      block_date: document.getElementById('block-date').value,
      start_time: document.getElementById('block-start-time').value,
      end_time: document.getElementById('block-end-time').value,
      reason: document.getElementById('block-reason').value,
      created_by: userStatus.user?.email || 'admin'
    };
    
    try {
      const response = await fetch('https://dicebastionbookings-ofbbu.bunny.run/api/bookings/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockData)
      });
      
      if (response.ok) {
        modal.close();
        await loadTimeBlocks();
        await loadCalendarWeek();
      } else {
        const data = await response.json();
        alert('Failed to create block: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating block:', err);
      alert('Failed to create time block');
    }
  });
}

async function loadCalendarWeek() {
  const weekDisplay = document.getElementById('week-display');
  const calendarGrid = document.getElementById('calendar-grid');
  
  if (!weekDisplay || !calendarGrid) return; // Guard for when tab isn't loaded
  
  // Format week display
  const endDate = new Date(currentWeekStart);
  endDate.setDate(endDate.getDate() + 6);
  weekDisplay.textContent = `${currentWeekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  
  // Load bookings and blocks for the week
  try {
    const bookingsResponse = await fetch('https://dicebastionbookings-ofbbu.bunny.run/api/bookings/all');
    const blocksResponse = await fetch('https://dicebastionbookings-ofbbu.bunny.run/api/bookings/blocks');
    
    const bookingsData = await bookingsResponse.json();
    const blocksData = await blocksResponse.json();
    
    // Generate 7 day cards
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      // Use local date string to avoid timezone issues
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const dayBookings = bookingsData.bookings?.filter(b => b.booking_date === dateStr && b.status !== 'cancelled') || [];
      const dayBlocks = blocksData.blocks?.filter(b => b.block_date === dateStr && isUpcomingTimeBlock(b)) || [];
      
      days.push({ date, dateStr, bookings: dayBookings, blocks: dayBlocks });
    }
    
    calendarGrid.innerHTML = days.map(day => {
      const isToday = day.date.toDateString() === new Date().toDateString();
      
      return `
        <div class="card" style="padding: 1.5rem; ${isToday ? 'border: 2px solid rgb(var(--color-primary-600));' : ''}">
          <div style="font-weight: 700; margin-bottom: 1rem; color: rgb(var(--color-primary-700)); font-size: 1.1rem;">
            ${day.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
            ${isToday ? '<span style="margin-left: 0.5rem; font-size: 0.875rem; background: rgb(var(--color-primary-100)); padding: 0.25rem 0.5rem; border-radius: 4px;">Today</span>' : ''}
          </div>
          
          ${day.blocks.length > 0 ? day.blocks.map(block => `
            <div style="padding: 1rem; background: rgb(var(--color-neutral-50)); border: 1px solid rgb(var(--color-neutral-200)); border-left: 4px solid rgb(var(--sch-red-500)); border-radius: 6px; margin-bottom: 1rem;">
              <div style="font-weight: 600; color: rgb(var(--color-neutral-800)); margin-bottom: 0.25rem;">
                <span style="display:inline-block;font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;padding:0.15rem 0.45rem;border-radius:4px;background:rgb(var(--sch-red-50));color:rgb(var(--sch-red-700));margin-right:0.35rem;">Blocked</span>
                ${block.start_time} – ${block.end_time}
              </div>
              ${block.reason ? `<div style="font-size: 0.875rem; color: rgb(var(--color-neutral-600));">${block.reason}</div>` : ''}
            </div>
          `).join('') : ''}
          
          ${day.bookings.length > 0 ? day.bookings.map(booking => `
            <div class="card" style="padding: 1rem; margin-bottom: 1rem; background: rgb(var(--color-neutral-50)); border-left: 4px solid rgb(var(--color-primary-600));">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 0.75rem;">
                <div>
                  <div style="font-size: 0.75rem; color: rgb(var(--color-neutral-500)); margin-bottom: 0.25rem;">Time</div>
                  <div style="font-weight: 600; font-size: 0.9rem;">⏰ ${booking.start_time} - ${booking.end_time}</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; color: rgb(var(--color-neutral-500)); margin-bottom: 0.25rem;">Table</div>
                  <div style="font-weight: 600; font-size: 0.9rem;">${booking.table_type || 'N/A'}</div>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
                <div>
                  <div style="font-size: 0.75rem; color: rgb(var(--color-neutral-500)); margin-bottom: 0.25rem;">Name</div>
                  <div style="font-weight: 500; font-size: 0.875rem;">${booking.user_name}</div>
                </div>
                <div>
                  <div style="font-size: 0.75rem; color: rgb(var(--color-neutral-500)); margin-bottom: 0.25rem;">Email</div>
                  <div style="font-weight: 500; font-size: 0.875rem;">${booking.user_email}</div>
                </div>
              </div>
              ${booking.notes ? `
                <div style="padding: 0.75rem; background: white; border-radius: 4px; margin-top: 0.75rem; font-size: 0.875rem;">
                  💬 ${booking.notes}
                </div>
              ` : ''}
            </div>
          `).join('') : ''}
          
          ${day.bookings.length === 0 && day.blocks.length === 0 ? `
            <div style="text-align: center; padding: 2rem; color: rgb(var(--color-neutral-400)); font-size: 0.875rem;">
              No bookings or blocks
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading calendar:', err);
    calendarGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc2626;">Failed to load calendar</div>';
  }
}

function changeWeek(direction) {
  currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
  loadCalendarWeek();
}

function loadBookingsAndCalendar() {
  loadBookingsSchedule();
  loadCalendarWeek();
}

// ==================== Google Indexing API ====================
function formatIndexingError(data) {
  if (!data || typeof data !== 'object') return 'Unknown error';
  if (data.error) return String(data.error);
  const b = data.body;
  if (b && typeof b === 'object') {
    if (typeof b.error === 'string') return b.error;
    if (b.error && b.error.message) return String(b.error.message);
    if (b.error && typeof b.error === 'object' && b.error.status) return JSON.stringify(b.error);
    return JSON.stringify(b);
  }
  if (data.message) return String(data.message);
  return JSON.stringify(data);
}

async function requestIndexing(type, slug, btn) {
  const urlMap = {
    event: `https://dicebastion.com/events/${encodeURIComponent(slug)}`,
    product: `https://shop.dicebastion.com/products/${encodeURIComponent(slug)}`
  };
  const url = urlMap[type];
  if (!url) return;

  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Sending…';
  btn.removeAttribute('title');

  try {
    const res = await fetch(`${API_BASE}/admin/indexing/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
      body: JSON.stringify({ url, type: 'URL_UPDATED' })
    });
    let data;
    try {
      data = await res.json();
    } catch (_) {
      data = { error: 'invalid_response', rawStatus: res.status };
    }
    if (data.ok) {
      btn.textContent = '✅ Request submitted';
      btn.style.background = '#059669';
      btn.title = 'Google received the request. Crawling and ranking are not immediate; use Search Console to verify. Product URLs may be declined if not Indexing API–eligible — sitemap ping still helps.';
      setTimeout(() => { btn.textContent = origText; btn.disabled = false; btn.style.background = ''; btn.removeAttribute('title'); }, 4000);
    } else {
      const detail = formatIndexingError(data);
      btn.textContent = '❌ Failed';
      btn.style.background = '#dc2626';
      btn.title = detail;
      console.error('Indexing failed:', data);
      alert('Indexing request failed:\n\n' + detail + '\n\nURL: ' + url);
      setTimeout(() => { btn.textContent = origText; btn.disabled = false; btn.style.background = ''; btn.removeAttribute('title'); }, 4000);
    }
  } catch (err) {
    btn.textContent = '❌ Error';
    btn.style.background = '#dc2626';
    btn.title = err && err.message ? err.message : String(err);
    console.error('Indexing error:', err);
    alert('Indexing error: ' + (err && err.message ? err.message : String(err)));
    setTimeout(() => { btn.textContent = origText; btn.disabled = false; btn.style.background = ''; btn.removeAttribute('title'); }, 4000);
  }
}

// ==================== Newsletter Builder ====================

let nlEvents = [];
let nlActiveDraftId = null;         // ID of the server-side draft being edited (null = new)
const NL_DRAFT_KEY = 'nl_draft_v1'; // localStorage key for crash-recovery autosave
let nlDraftTimer = null;
let nlRestoringDraft = false;

// ---- localStorage crash-recovery autosave ----
// These functions silently persist the editor contents to localStorage as a
// safety net against browser crashes. They are NOT the primary save mechanism —
// the server-side "Save Draft" button is.
function nlSaveDraft() {
  const subject = document.getElementById('nl-subject')?.value || '';
  const body = nlQuill ? nlQuill.root.innerHTML : '';
  if (!subject.trim() && (!body || body === '<p><br></p>')) return;
  localStorage.setItem(NL_DRAFT_KEY, JSON.stringify({ subject, body, saved: Date.now() }));
}

function nlClearDraft(showMsg) {
  clearTimeout(nlDraftTimer);
  localStorage.removeItem(NL_DRAFT_KEY);
}

function nlShowDraftStatus(msg) {
  const el = document.getElementById('nl-draft-status');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('saved', !!msg);
}

// ---- Server-side newsletters panel ----

function formatRelative(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + (mins === 1 ? ' min ago' : ' mins ago');
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
  const days = Math.round(hrs / 24);
  return days + (days === 1 ? ' day ago' : ' days ago');
}

function nlUpdateActiveBanner(draft) {
  const banner = document.getElementById('nl-active-banner');
  const msgEl = document.getElementById('nl-active-banner-msg');
  if (!banner) return;
  if (!nlActiveDraftId || !draft) { banner.style.display = 'none'; return; }
  let msg = '';
  if (draft.status === 'scheduled' && draft.scheduled_for) {
    const timeStr = new Date(draft.scheduled_for).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
    msg = 'Editing scheduled newsletter — sends ' + timeStr;
    banner.className = 'nl-draft-banner nl-banner-available';
  } else if (draft.status === 'sent') {
    msg = 'Viewing sent newsletter (read only)';
    banner.className = 'nl-draft-banner nl-banner-restored';
  } else {
    msg = 'Editing saved draft';
    banner.className = 'nl-draft-banner nl-banner-restored';
  }
  if (msgEl) msgEl.textContent = msg;
  banner.style.display = 'flex';
}

function nlToggleNewslettersPanel() {
  const panel = document.getElementById('nl-newsletters-panel');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  if (isOpen) {
    panel.style.display = 'none';
  } else {
    panel.style.display = 'block';
    nlLoadDraftsList();
  }
}

async function nlLoadDraftsList() {
  const listEl = document.getElementById('nl-newsletters-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:1.5rem;color:rgb(var(--color-neutral-500));">Loading...</div>';
  try {
    const res = await fetch(`${API_BASE}/admin/newsletters`, {
      headers: { 'X-Session-Token': sessionToken }
    });
    const drafts = await res.json();
    if (!Array.isArray(drafts) || drafts.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:1.5rem;color:rgb(var(--color-neutral-500));">No saved newsletters yet. Use Save Draft to save your work.</div>';
      return;
    }
    listEl.innerHTML = drafts.map(d => {
      const statusLabel = { draft: 'Draft', scheduled: 'Scheduled', sent: 'Sent', failed: 'Failed' }[d.status] || d.status;
      const sub = (d.subject || '(no subject)').replace(/</g, '&lt;');
      let metaText = '';
      if (d.status === 'scheduled' && d.scheduled_for) {
        metaText = 'Scheduled for ' + new Date(d.scheduled_for).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
      } else if (d.status === 'sent' && d.sent_at) {
        metaText = 'Sent ' + formatRelative(d.sent_at) + (d.recipients_count != null ? ' &middot; ' + d.recipients_count + ' recipients' : '');
      } else {
        metaText = 'Updated ' + formatRelative(d.updated_at);
      }
      const isActive = d.id === nlActiveDraftId;
      const editLabel = isActive ? 'Editing' : (d.status === 'sent' ? 'View' : 'Edit');
      const editBtn = `<button onclick="nlLoadServerDraft(${d.id})" class="btn btn-secondary btn-sm"${isActive ? ' disabled' : ''}>${editLabel}</button>`;
      const sendBtn = d.status === 'scheduled' ? `<button onclick="nlSendScheduledNow(${d.id})" class="btn btn-primary btn-sm">Send Now</button>` : '';
      const deleteBtn = d.status !== 'sent' ? `<button onclick="nlDeleteServerDraft(${d.id})" class="btn btn-secondary btn-sm">Delete</button>` : '';
      return `<div class="nl-saved-item${isActive ? ' nl-saved-item-active' : ''}">
        <div class="nl-saved-item-info">
          <div class="nl-saved-item-subject">${sub}</div>
          <div class="nl-saved-item-meta"><span class="nl-status-badge nl-status-${d.status}">${statusLabel}</span> &nbsp;${metaText}</div>
        </div>
        <div class="nl-saved-item-actions">${editBtn}${sendBtn}${deleteBtn}</div>
      </div>`;
    }).join('');
  } catch (e) {
    listEl.innerHTML = '<div style="text-align:center;padding:1.5rem;color:rgb(var(--color-danger-600));">Failed to load. Please try again.</div>';
  }
}

async function nlServerSaveDraft() {
  const subject = document.getElementById('nl-subject')?.value || '';
  const html = nlQuill ? nlQuill.root.innerHTML : '';
  const btn = document.getElementById('nl-save-draft-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  nlShowDraftStatus('Saving...');
  try {
    let draft;
    if (nlActiveDraftId) {
      const res = await fetch(`${API_BASE}/admin/newsletters/${nlActiveDraftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ subject, html })
      });
      if (!res.ok) throw new Error('Update failed');
      draft = { id: nlActiveDraftId, status: 'draft', subject };
    } else {
      const res = await fetch(`${API_BASE}/admin/newsletters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ subject, html })
      });
      if (!res.ok) throw new Error('Create failed');
      const data = await res.json();
      nlActiveDraftId = data.id;
      draft = { id: nlActiveDraftId, status: 'draft', subject };
    }
    nlShowDraftStatus('Saved');
    nlUpdateActiveBanner(draft);
    setTimeout(() => nlShowDraftStatus(''), 3000);
    // Refresh list if panel is open
    const panel = document.getElementById('nl-newsletters-panel');
    if (panel && panel.style.display !== 'none') nlLoadDraftsList();
  } catch (e) {
    nlShowDraftStatus('Save failed');
    console.error('nlServerSaveDraft error:', e);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Save Draft'; }
  }
}

async function nlLoadServerDraft(id) {
  try {
    const res = await fetch(`${API_BASE}/admin/newsletters/${id}`, {
      headers: { 'X-Session-Token': sessionToken }
    });
    if (!res.ok) throw new Error('Failed to load');
    const draft = await res.json();
    nlRestoringDraft = true;
    const subjectEl = document.getElementById('nl-subject');
    if (subjectEl) subjectEl.value = draft.subject || '';
    if (nlQuill) nlQuill.root.innerHTML = draft.html || '';
    nlRestoringDraft = false;
    nlActiveDraftId = id;
    nlUpdateActiveBanner(draft);
    // Close panel after loading
    const panel = document.getElementById('nl-newsletters-panel');
    if (panel) panel.style.display = 'none';
    nlShowDraftStatus('');
    // Scroll to top of editor
    document.getElementById('nl-subject')?.focus();
  } catch (e) {
    nlRestoringDraft = false;
    Modal.alert({ title: 'Error', message: 'Could not load this newsletter.' });
  }
}

async function nlDeleteServerDraft(id) {
  if (!confirm('Permanently delete this newsletter?')) return;
  try {
    const res = await fetch(`${API_BASE}/admin/newsletters/${id}`, {
      method: 'DELETE',
      headers: { 'X-Session-Token': sessionToken }
    });
    if (!res.ok) throw new Error('Delete failed');
    if (nlActiveDraftId === id) {
      nlActiveDraftId = null;
      nlUpdateActiveBanner(null);
    }
    nlLoadDraftsList();
  } catch (e) {
    Modal.alert({ title: 'Error', message: 'Could not delete this newsletter.' });
  }
}

async function nlSendScheduledNow(id) {
  const confirmed = await Modal.confirm({
    title: 'Send Now',
    message: 'Send this scheduled newsletter immediately to all opted-in recipients? This cannot be undone.'
  });
  if (!confirmed) return;
  try {
    const res = await fetch(`${API_BASE}/admin/newsletters/${id}/send`, {
      method: 'POST',
      headers: { 'X-Session-Token': sessionToken }
    });
    const data = await res.json();
    if (res.ok && data.success) {
      Modal.alert({ title: 'Sent', message: `Newsletter sent. ${data.sent} delivered, ${data.failed} failed.` });
      if (nlActiveDraftId === id) { nlActiveDraftId = null; nlUpdateActiveBanner(null); }
      nlLoadDraftsList();
    } else {
      Modal.alert({ title: 'Error', message: data.error || 'Send failed.' });
    }
  } catch (e) {
    Modal.alert({ title: 'Error', message: 'Network error: ' + e.message });
  }
}

function nlOpenScheduleModal() {
  const subject = document.getElementById('nl-subject')?.value?.trim();
  const body = nlQuill ? nlQuill.root.innerHTML.trim() : '';
  if (!subject) { Modal.alert({ title: 'Missing Subject', message: 'Please add a subject line before scheduling.' }); return; }
  if (!body || body === '<p><br></p>') { Modal.alert({ title: 'Empty Newsletter', message: 'Please write some content before scheduling.' }); return; }
  // Default to tomorrow at 10:00 AM local time
  const dt = new Date();
  dt.setDate(dt.getDate() + 1);
  dt.setHours(10, 0, 0, 0);
  const pad = n => String(n).padStart(2, '0');
  const local = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  const dtInput = document.getElementById('nl-schedule-datetime');
  if (dtInput) dtInput.value = local;
  document.getElementById('nl-schedule-modal').style.display = 'flex';
}

function nlCloseScheduleModal() {
  document.getElementById('nl-schedule-modal').style.display = 'none';
}

async function nlConfirmSchedule() {
  const dtInput = document.getElementById('nl-schedule-datetime');
  if (!dtInput?.value) { Modal.alert({ title: 'Invalid', message: 'Please select a date and time.' }); return; }
  const scheduledDate = new Date(dtInput.value);
  if (scheduledDate <= new Date()) { Modal.alert({ title: 'Invalid', message: 'Please select a future date and time.' }); return; }
  const btn = document.getElementById('nl-schedule-confirm-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Scheduling...'; }
  try {
    const subject = document.getElementById('nl-subject')?.value || '';
    const html = nlQuill ? nlQuill.root.innerHTML : '';
    const scheduledFor = scheduledDate.toISOString();
    if (nlActiveDraftId) {
      const res = await fetch(`${API_BASE}/admin/newsletters/${nlActiveDraftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ subject, html, status: 'scheduled', scheduled_for: scheduledFor })
      });
      if (!res.ok) throw new Error('Schedule failed');
    } else {
      const createRes = await fetch(`${API_BASE}/admin/newsletters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ subject, html })
      });
      if (!createRes.ok) throw new Error('Save failed');
      const createData = await createRes.json();
      nlActiveDraftId = createData.id;
      const schedRes = await fetch(`${API_BASE}/admin/newsletters/${nlActiveDraftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ status: 'scheduled', scheduled_for: scheduledFor })
      });
      if (!schedRes.ok) throw new Error('Schedule failed');
    }
    nlCloseScheduleModal();
    const timeStr = scheduledDate.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    nlShowDraftStatus('Scheduled for ' + timeStr);
    nlUpdateActiveBanner({ id: nlActiveDraftId, status: 'scheduled', scheduled_for: scheduledFor });
    setTimeout(() => nlShowDraftStatus(''), 5000);
    const panel = document.getElementById('nl-newsletters-panel');
    if (panel && panel.style.display !== 'none') nlLoadDraftsList();
  } catch (e) {
    Modal.alert({ title: 'Error', message: 'Could not schedule this newsletter. ' + e.message });
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Schedule'; }
  }
}

function nlNewDraft() {
  if (!confirm('Start a new newsletter? Your current editor content will be cleared.')) return;
  nlActiveDraftId = null;
  nlUpdateActiveBanner(null);
  document.getElementById('nl-subject').value = '';
  nlRestoringDraft = true;
  if (nlQuill) nlQuill.setText('');
  nlRestoringDraft = false;
  nlClearDraft();
  nlShowDraftStatus('');
  const resultEl = document.getElementById('nl-send-result');
  if (resultEl) resultEl.style.display = 'none';
}

let nlQuill = null;
let nlEditorReady = false;

const quillMarkdownKeyboardBindings = {
  h1: { key: ' ', collapsed: true, prefix: /^#$/, handler: function(r) { this.quill.deleteText(r.index - 1, 1, 'user'); this.quill.formatLine(r.index - 1, 1, 'header', 1, 'user'); return false; } },
  h2: { key: ' ', collapsed: true, prefix: /^##$/, handler: function(r) { this.quill.deleteText(r.index - 2, 2, 'user'); this.quill.formatLine(r.index - 2, 1, 'header', 2, 'user'); return false; } },
  h3: { key: ' ', collapsed: true, prefix: /^###$/, handler: function(r) { this.quill.deleteText(r.index - 3, 3, 'user'); this.quill.formatLine(r.index - 3, 1, 'header', 3, 'user'); return false; } },
  ul: { key: ' ', collapsed: true, prefix: /^[-*]$/, handler: function(r) { this.quill.deleteText(r.index - 1, 1, 'user'); this.quill.formatLine(r.index - 1, 1, 'list', 'bullet', 'user'); return false; } },
  ol: { key: ' ', collapsed: true, prefix: /^\d+\.$/, handler: function(r, ctx) { const l = ctx.prefix.length; this.quill.deleteText(r.index - l, l, 'user'); this.quill.formatLine(r.index - l, 1, 'list', 'ordered', 'user'); return false; } }
};

function loadQuillAssets(onReady) {
  if (window.Quill && document.getElementById('quill-css')) {
    onReady();
    return;
  }
  if (!document.getElementById('quill-css')) {
    const link = document.createElement('link');
    link.id = 'quill-css';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
    document.head.appendChild(link);
  }
  if (window.Quill) {
    onReady();
    return;
  }
  if (loadQuillAssets._loading) {
    loadQuillAssets._queue = loadQuillAssets._queue || [];
    loadQuillAssets._queue.push(onReady);
    return;
  }
  loadQuillAssets._loading = true;
  loadQuillAssets._queue = [onReady];
  const script = document.createElement('script');
  script.src = 'https://cdn.quilljs.com/1.3.7/quill.min.js';
  script.onload = () => {
    loadQuillAssets._loading = false;
    const queue = loadQuillAssets._queue || [];
    loadQuillAssets._queue = [];
    queue.forEach((fn) => fn());
  };
  document.head.appendChild(script);
}

function registerNewsletterQuillBlots() {
  if (registerNewsletterQuillBlots._done) return;
  registerNewsletterQuillBlots._done = true;

  const BlockEmbed = Quill.import('blots/block/embed');
  class DividerBlot extends BlockEmbed {}
  DividerBlot.blotName = 'divider';
  DividerBlot.tagName = 'hr';
  Quill.register(DividerBlot);

  class EventCardBlot extends BlockEmbed {
    static create(html) {
      const node = super.create();
      node.setAttribute('data-card', html);
      node.innerHTML = html;
      node.contentEditable = 'false';
      return node;
    }
    static value(node) {
      return node.getAttribute('data-card');
    }
  }
  EventCardBlot.blotName = 'event-card';
  EventCardBlot.tagName = 'div';
  EventCardBlot.className = 'nl-event-card-embed';
  Quill.register(EventCardBlot);

  class CalendarBlot extends BlockEmbed {
    static create(html) {
      const node = super.create();
      node.setAttribute('data-card', html);
      node.innerHTML = html;
      node.contentEditable = 'false';
      return node;
    }
    static value(node) {
      return node.getAttribute('data-card');
    }
  }
  CalendarBlot.blotName = 'event-calendar';
  CalendarBlot.tagName = 'div';
  CalendarBlot.className = 'nl-calendar-embed';
  Quill.register(CalendarBlot);
}

function initQuillEditor(containerId, toolbarId, options = {}) {
  if (options.newsletterBlots) registerNewsletterQuillBlots();
  const modules = {
    toolbar: { container: toolbarId },
  };
  if (options.keyboardBindings) {
    modules.keyboard = { bindings: options.keyboardBindings };
  }
  return new Quill(containerId, {
    theme: 'snow',
    placeholder: options.placeholder || '',
    modules,
  });
}

function nlInitEditor() {
  if (nlEditorReady) return;
  nlEditorReady = true;
  loadQuillAssets(nlCreateEditor);
}

function nlCreateEditor() {
  if (nlQuill) return;

  nlQuill = initQuillEditor('#nl-editor', '#nl-toolbar', {
    placeholder: 'Start writing your newsletter...',
    newsletterBlots: true,
    keyboardBindings: quillMarkdownKeyboardBindings,
  });

  nlQuill.on('text-change', function() {
    if (nlRestoringDraft) return;
    clearTimeout(nlDraftTimer);
    nlDraftTimer = setTimeout(nlSaveDraft, 1500);
  });

  const subjectEl = document.getElementById('nl-subject');
  if (subjectEl) {
    subjectEl.addEventListener('input', function() {
      if (nlRestoringDraft) return;
      clearTimeout(nlDraftTimer);
      nlDraftTimer = setTimeout(nlSaveDraft, 1500);
    });
  }
}

async function loadNewsletterRecipients() {
  const badge = document.getElementById('nl-recipient-badge');
  if (!badge) return;
  badge.textContent = 'Loading...';
  try {
    const res = await fetch(`${API_BASE}/admin/newsletter/recipients`, {
      headers: { 'X-Session-Token': sessionToken }
    });
    const data = await res.json();
    const count = data.count ?? 0;
    badge.textContent = `${count} ${count === 1 ? 'recipient' : 'recipients'}`;
  } catch (err) {
    badge.textContent = 'Could not load';
    console.error('Newsletter recipients error:', err);
  }
}

async function loadNewsletterEvents() {
  try {
    const res = await fetch(`${API_BASE}/admin/newsletter/events`, {
      headers: { 'X-Session-Token': sessionToken }
    });
    nlEvents = await res.json();
    renderNlEventPickerList();
  } catch (err) {
    console.error('Newsletter events error:', err);
    nlEvents = [];
  }
}

function renderNlEventPickerList() {
  const list = document.getElementById('nl-event-picker-list');
  if (!list) return;
  if (!nlEvents || nlEvents.length === 0) {
    list.innerHTML = '<div style="text-align: center; padding: 1.5rem; color: rgb(var(--color-neutral-500));">No upcoming events found.</div>';
    return;
  }
  list.innerHTML = nlEvents.map((ev, idx) => {
    const dt = new Date(ev.event_datetime);
    const dateStr = dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });
    const timeStr = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const imgHtml = ev.image_url
      ? `<img class="nl-event-pick-img" src="${ev.image_url_card || ev.image_url}" alt="">`
      : `<div class="nl-event-pick-img"></div>`;
    const locationSuffix = ev.location ? ` &middot; ${ev.location}` : '';
    return `
      <div class="nl-event-pick-card" onclick="insertNlEventBlock(${idx})">
        ${imgHtml}
        <div>
          <div class="nl-event-pick-title">${ev.event_name || ''}</div>
          <div class="nl-event-pick-date">${dateStr} at ${timeStr}${locationSuffix}</div>
        </div>
      </div>
    `;
  }).join('');
}

function openNlEventPicker() {
  renderNlEventPickerList();
  document.getElementById('nl-event-picker').style.display = 'flex';
}

function closeNlEventPicker() {
  document.getElementById('nl-event-picker').style.display = 'none';
}

function insertNlEventBlock(idx) {
  closeNlEventPicker();
  if (!nlQuill) return;
  const ev = nlEvents[idx];
  if (!ev) return;

  const dt = new Date(ev.event_datetime);
  const dateStr = dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // Images are always 400x190 - use natural aspect ratio, no cropping
  const imgPart = ev.image_url
    ? '<img src="' + (ev.image_url_card || ev.image_url) + '" alt="" width="400" height="190" style="width:100%;height:auto;display:block;">'
    : '';
  const locationPart = ev.location
    ? '<p style="margin:4px 0;font-size:14px;color:#64748b;">' + ev.location + '</p>'
    : '';
  const descPart = ev.description
    ? '<p style="margin:8px 0 0 0;font-size:14px;color:#475569;">' + ev.description + '</p>'
    : '';
  const linkHref = ev.slug
    ? 'https://dicebastion.com/events/' + ev.slug
    : 'https://dicebastion.com/events';

  const cardHtml = imgPart
    + '<div style="padding:18px 20px 20px 20px;">'
    + '<p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#4f46e5;margin:0 0 8px 0;">Upcoming Event</p>'
    + '<h3 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 8px 0;line-height:1.3;">' + (ev.event_name || '') + '</h3>'
    + '<p style="margin:0 0 4px 0;font-size:14px;color:#64748b;">' + dateStr + ' at ' + timeStr + '</p>'
    + locationPart + descPart
    + '<a href="' + linkHref + '" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:11px 24px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin-top:14px;letter-spacing:0.01em;">View Event</a>'
    + '</div>';

  const range = nlQuill.getSelection(true);
  const index = range ? range.index : nlQuill.getLength() - 1;
  nlQuill.insertEmbed(index, 'event-card', cardHtml, 'user');
  nlQuill.setSelection(index + 1, 0, 'user');
}

function buildCalendarHtml(events) {
  if (!events || events.length === 0) return '';
  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function ordinal(n) {
    const s = ['th','st','nd','rd'], v = n % 100;
    return n + (s[(v-20)%10] || s[v] || s[0]);
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    const h = d.getHours(), mn = d.getMinutes();
    const ampm = h < 12 ? 'AM' : 'PM';
    const dh = h % 12 || 12;
    return { dayName: DAY_NAMES[d.getDay()], dayOrdinal: ordinal(d.getDate()), month: MONTH_NAMES[d.getMonth()], time: dh + ':' + String(mn).padStart(2,'0') + ' ' + ampm };
  }
  function buildCard(ev) {
    const p = fmtDate(ev.event_datetime);
    const imgRow = ev.image_url
      ? '<tr><td style="padding:0;line-height:0;font-size:0;"><img src="' + (ev.image_url_card || ev.image_url) + '" alt="" width="100%" style="display:block;width:100%;border-radius:8px 8px 0 0;" /></td></tr>'
      : '<tr><td style="background:#e0e7ff;height:120px;border-radius:8px 8px 0 0;text-align:center;vertical-align:middle;"><p style="margin:0;font-size:11px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.08em;">Event</p></td></tr>';
    const href = ev.slug ? 'https://dicebastion.com/events/' + ev.slug : 'https://dicebastion.com/events';
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">'
      + imgRow
      + '<tr><td style="padding:12px 14px 14px;background:#ffffff;">'
      + '<p style="margin:0;font-size:11px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.07em;line-height:1;">' + p.dayName + '</p>'
      + '<p style="margin:4px 0 8px;font-size:16px;font-weight:700;color:#111827;line-height:1.2;">' + p.dayOrdinal + ' ' + p.month + '</p>'
      + '<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.4;">' + p.time + ' &nbsp;&middot;&nbsp; <a href="' + href + '" style="color:#4f46e5;text-decoration:underline;font-weight:600;">Sign Up</a></p>'
      + '</td></tr></table>';
  }
  let rows = '';
  for (let i = 0; i < events.length; i += 2) {
    const left = buildCard(events[i]);
    const right = events[i + 1] ? buildCard(events[i + 1]) : '';
    rows += '<tr>'
      + '<td class="ec-cell" width="50%" valign="top" style="padding:0 6px 12px 0;vertical-align:top;">' + left + '</td>'
      + '<td class="ec-cell" width="50%" valign="top" style="padding:0 0 12px 6px;vertical-align:top;">' + right + '</td>'
      + '</tr>';
  }
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 12px 0;">'
    + rows
    + '</table>';
}

function openNlCalendarPicker() {
  renderNlCalendarPickerList();
  document.getElementById('nl-calendar-picker').style.display = 'flex';
}

function closeNlCalendarPicker() {
  document.getElementById('nl-calendar-picker').style.display = 'none';
}

function renderNlCalendarPickerList() {
  const list = document.getElementById('nl-calendar-picker-list');
  if (!list) return;
  if (!nlEvents || nlEvents.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:1.5rem;color:rgb(var(--color-neutral-500));">No upcoming events found.</div>';
    return;
  }
  list.innerHTML = nlEvents.map((ev, idx) => {
    const dt = new Date(ev.event_datetime);
    const dateStr = dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });
    const timeStr = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const locationSuffix = ev.location ? ' &middot; ' + ev.location : '';
    return '<label class="nl-cal-check-card">'
      + '<input type="checkbox" name="nl-cal-ev" value="' + idx + '" checked>'
      + '<div>'
      + '<div class="nl-cal-card-title">' + (ev.event_name || '') + '</div>'
      + '<div class="nl-cal-card-date">' + dateStr + ' at ' + timeStr + locationSuffix + '</div>'
      + '</div></label>';
  }).join('');
  const btn = document.getElementById('nl-cal-toggle-all-btn');
  if (btn) btn.textContent = 'Deselect All';
}

function nlCalendarToggleAll() {
  const boxes = document.querySelectorAll('#nl-calendar-picker-list input[type="checkbox"]');
  const allChecked = Array.from(boxes).every(b => b.checked);
  boxes.forEach(b => { b.checked = !allChecked; });
  const btn = document.getElementById('nl-cal-toggle-all-btn');
  if (btn) btn.textContent = allChecked ? 'Select All' : 'Deselect All';
}

function insertNlCalendarBlock() {
  const boxes = document.querySelectorAll('#nl-calendar-picker-list input[type="checkbox"]:checked');
  const selected = Array.from(boxes).map(b => nlEvents[parseInt(b.value)]).filter(Boolean);
  closeNlCalendarPicker();
  if (!nlQuill || selected.length === 0) return;
  const calHtml = buildCalendarHtml(selected);
  const range = nlQuill.getSelection(true);
  const index = range ? range.index : nlQuill.getLength() - 1;
  nlQuill.insertEmbed(index, 'event-calendar', calHtml, 'user');
  nlQuill.setSelection(index + 1, 0, 'user');
}

function nlInsertDivider() {
  if (!nlQuill) return;
  const range = nlQuill.getSelection(true);
  const index = range ? range.index : nlQuill.getLength() - 1;
  nlQuill.insertEmbed(index, 'divider', true, 'user');
  nlQuill.setSelection(index + 1, 0, 'user');
}

function clearNewsletter() {
  if (!confirm('Clear the editor? Any unsaved changes will be lost.')) return;
  nlActiveDraftId = null;
  nlUpdateActiveBanner(null);
  document.getElementById('nl-subject').value = '';
  nlRestoringDraft = true;
  if (nlQuill) nlQuill.setText('');
  nlRestoringDraft = false;
  nlClearDraft();
  nlShowDraftStatus('');
  const result = document.getElementById('nl-send-result');
  if (result) result.style.display = 'none';
}

function buildNlEmailHtml(bodyHtml, subject) {
  const body = bodyHtml
    .replace(/ data-card="[^"]*"/g, '')
    .replace(/ contenteditable="[^"]*"/g, '')
    .replace(/class="nl-event-card-embed"/g,
      'style="margin:24px 0;background:#f8f9ff;border:1px solid #dde0fa;border-radius:12px;overflow:hidden;display:block;"')
    .replace(/class="nl-calendar-embed"/g, 'style="margin:24px 0;"')
    .replace(/ class="ql-[^"]*"/g, '')
    .replace(/<p[^>]*>\s*<br\s*\/?>\s*<\/p>/gi, '');
  // Goldmark terminates a script block on a literal closing style tag,
  // so split that string across two literals.
  const stO = '<sty' + 'le>';
  const stC = '</sty' + 'le>';
  const pReset = stO
    + 'p{margin:0 0 14px 0;padding:0;}'
    + 'h1{font-size:26px;font-weight:800;color:#111827;margin:0 0 16px 0;line-height:1.25;}'
    + 'h2{font-size:20px;font-weight:700;color:#111827;margin:0 0 12px 0;line-height:1.3;}'
    + 'h3{font-size:17px;font-weight:700;color:#111827;margin:0 0 10px 0;line-height:1.35;}'
    + 'ul,ol{margin:0 0 14px 0;padding-left:1.5em;}li{margin:0 0 5px 0;}'
    + 'a{color:#4f46e5;}hr{border:none;border-top:1px solid #e5e7eb;margin:24px 0;}'
    + stC;
  const ecMedia = stO + '@media only screen and (max-width:480px){.ec-cell{display:block!important;width:100%!important;padding:0 0 12px 0!important;}}' + stC;
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>' + subject + '</title>' + pReset + ecMedia + '</head>'
    + '<body style="margin:0;padding:0;background:#f0f0f8;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;color:#1a1a1a;">'
    + '<div style="max-width:680px;margin:0 auto;padding:24px 16px;">'
    + '<div style="background:#ffffff;border-radius:16px;border:1px solid #dde0fa;overflow:hidden;">'
    + '<div style="background-color:#2d1f8a;background-image:url(https://dicebastion.com/img/clubfull.png?v=2);background-size:cover;background-position:center 40%;">'
    + '<div style="background:linear-gradient(155deg,rgba(6,8,40,0.55) 0%,rgba(79,70,229,0.88) 100%);padding:36px 32px 32px 32px;">'
    + '<div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:12px;">Dice Bastion</div>'
    + '<div style="font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;letter-spacing:-0.02em;max-width:480px;">' + subject.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>'
    + '</div></div>'
    + '<div style="padding:32px;line-height:1.75;font-size:16px;color:#1a1a1a;">' + body + '</div>'
    + '<div style="padding:20px 32px;background:#f8f8fc;border-top:1px solid #ebebf5;font-size:12px;color:#9ca3af;line-height:1.6;">'
    + '<p style="margin:0 0 6px 0;">You\'re receiving this as a Dice Bastion member who signed up for updates.</p>'
    + '<p style="margin:0;"><a href="https://dicebastion.com/account" style="color:#9ca3af;text-decoration:underline;">Manage email preferences</a></p>'
    + '</div>'
    + '</div>'
    + '</div></body></html>';
}

function previewNewsletter() {
  const subject = document.getElementById('nl-subject').value.trim() || 'Newsletter Preview';
  const bodyHtml = nlQuill ? nlQuill.root.innerHTML.trim() : '';
  if (!bodyHtml || bodyHtml === '<p><br></p>') {
    Modal.alert({ title: 'Empty', message: 'Add some content before previewing.' });
    return;
  }
  const fullHtml = buildNlEmailHtml(bodyHtml, subject);
  const frame = document.getElementById('nl-preview-frame');
  frame.srcdoc = fullHtml;
  document.getElementById('nl-preview-modal').style.display = 'flex';
}

function closeNlPreview() {
  document.getElementById('nl-preview-modal').style.display = 'none';
}

async function sendNewsletter() {
  const subject = document.getElementById('nl-subject').value.trim();
  const bodyHtml = nlQuill ? nlQuill.root.innerHTML.trim() : '';
  const resultEl = document.getElementById('nl-send-result');

  if (!subject) {
    Modal.alert({ title: 'Missing Subject', message: 'Please enter a subject line before sending.' });
    return;
  }
  if (!bodyHtml || bodyHtml === '<p><br></p>') {
    Modal.alert({ title: 'Empty Newsletter', message: 'Please write some content before sending.' });
    return;
  }

  const badge = document.getElementById('nl-recipient-badge');
  const recipientText = badge ? badge.textContent : 'subscribers';
  const confirmed = await Modal.confirm({
    title: 'Send Newsletter',
    message: `This will send the newsletter to ${recipientText}. This cannot be undone. Continue?`
  });
  if (!confirmed) return;

  const btn = document.getElementById('nl-send-btn');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  resultEl.style.display = 'none';

  try {
    // Ensure we have a server-side draft record to track this send
    if (!nlActiveDraftId) {
      const createRes = await fetch(`${API_BASE}/admin/newsletters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ subject, html: bodyHtml })
      });
      if (!createRes.ok) throw new Error('Failed to create draft record');
      const createData = await createRes.json();
      nlActiveDraftId = createData.id;
    } else {
      // Update the existing draft with the current editor content
      await fetch(`${API_BASE}/admin/newsletters/${nlActiveDraftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
        body: JSON.stringify({ subject, html: bodyHtml })
      });
    }

    const res = await fetch(`${API_BASE}/admin/newsletters/${nlActiveDraftId}/send`, {
      method: 'POST',
      headers: { 'X-Session-Token': sessionToken }
    });
    const data = await res.json();

    if (res.ok && data.success) {
      resultEl.className = 'nl-send-result nl-success';
      resultEl.textContent = `Newsletter sent. ${data.sent} delivered, ${data.failed} failed (${data.total} total recipients).`;
      resultEl.style.display = 'block';
      nlClearDraft();
      nlActiveDraftId = null;
      nlUpdateActiveBanner(null);
      // Refresh the list if open
      const panel = document.getElementById('nl-newsletters-panel');
      if (panel && panel.style.display !== 'none') nlLoadDraftsList();
    } else {
      resultEl.className = 'nl-send-result nl-error';
      resultEl.textContent = `Send failed: ${data.error || 'Unknown error'}`;
      resultEl.style.display = 'block';
    }
  } catch (err) {
    resultEl.className = 'nl-send-result nl-error';
    resultEl.textContent = `Network error: ${err.message}`;
    resultEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Now';
  }
}

// Blog
let blogQuill = null;
let blogEditorReady = false;
let blogPosts = [];
let blogCurrentStatus = 'draft';
let blogTaxonomyTerms = { tags: [], categories: [], series: [], authors: [], authorProfiles: [] };
const blogChipState = {
  tags: [],
  categories: [],
  series: [],
  authors: [],
};
let blogAuthorMeta = {};
let blogPendingAuthorSlug = null;

const blogChipConfig = {
  tags: { inputId: 'blog-tags-input', containerId: 'blog-tags-chips', datalistId: 'blog-tags-suggestions' },
  categories: { inputId: 'blog-categories-input', containerId: 'blog-categories-chips', datalistId: 'blog-categories-suggestions' },
  series: { inputId: 'blog-series-input', containerId: 'blog-series-chips', datalistId: 'blog-series-suggestions' },
  authors: { inputId: 'blog-authors-input', containerId: 'blog-authors-chips', datalistId: 'blog-authors-suggestions' },
};

function blogInitTab() {
  blogInitEditor();
  blogCheckHealth();
  loadBlogTaxonomyTerms();
  loadBlogPosts();
}

async function blogCheckHealth() {
  const banner = document.getElementById('blog-health-banner');
  if (!banner) return;
  try {
    const res = await fetch(`${BLOG_API_BASE}/admin/blog/health`, {
      headers: { 'X-Session-Token': sessionToken },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Health check failed');
    const issues = [];
    if (!data.database?.ok) {
      issues.push(`Database: ${data.database?.error || 'not connected'} — copy BUNNY_DATABASE_URL and BUNNY_DATABASE_AUTH_TOKEN from bookings script 63643 into blog script 75941.`);
    }
    if (!data.storage) issues.push('BUNNY_STORAGE_API_KEY is not set on script 75941.');
    if (!data.cdnUrl) issues.push('BUNNY_CDN_URL is not set on script 75941.');
    if (issues.length) {
      banner.style.display = 'block';
      banner.style.borderColor = 'rgb(var(--color-primary-300))';
      banner.style.background = 'rgb(var(--color-primary-50))';
      banner.textContent = issues.join(' ');
    } else {
      banner.style.display = 'none';
    }
  } catch (err) {
    banner.style.display = 'block';
    banner.style.borderColor = 'rgb(var(--color-primary-300))';
    banner.style.background = 'rgb(var(--color-primary-50))';
    banner.textContent = err.message || 'Blog API health check failed.';
  }
}

function blogInitEditor() {
  if (blogEditorReady) return;
  blogEditorReady = true;
  loadQuillAssets(blogCreateEditor);
}

function blogCreateEditor() {
  if (blogQuill) return;
  blogQuill = initQuillEditor('#blog-editor', '#blog-toolbar', {
    placeholder: 'Write your blog post...',
    keyboardBindings: quillMarkdownKeyboardBindings,
  });
}

function blogSlugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function blogSetActionResult(message, isError) {
  const el = document.getElementById('blog-action-result');
  if (!el) return;
  el.className = isError ? 'nl-send-result nl-error' : 'nl-send-result nl-success';
  el.textContent = message;
  el.style.display = message ? 'block' : 'none';
}

function blogUpdateStatusUi(status) {
  blogCurrentStatus = status || 'draft';
  const badge = document.getElementById('blog-status-badge');
  const unpublishBtn = document.getElementById('blog-unpublish-btn');
  const deleteBtn = document.getElementById('blog-delete-btn');
  const publishBtn = document.getElementById('blog-publish-btn');
  if (badge) {
    badge.style.display = 'inline-flex';
    badge.textContent = blogCurrentStatus === 'published' ? 'Published' : 'Draft';
  }
  if (unpublishBtn) unpublishBtn.style.display = blogCurrentStatus === 'published' ? 'inline-flex' : 'none';
  if (deleteBtn) deleteBtn.style.display = document.getElementById('blog-post-id').value ? 'inline-flex' : 'none';
  if (publishBtn) publishBtn.textContent = blogCurrentStatus === 'published' ? 'Update Published' : 'Publish';
}

function blogRenderChipField(field) {
  const cfg = blogChipConfig[field];
  const container = document.getElementById(cfg.containerId);
  const chips = blogChipState[field];
  if (!container) return;
  if (!chips.length) {
    container.innerHTML = '<span style="color: rgb(var(--color-neutral-400)); font-size: 0.875rem;">None selected</span>';
    return;
  }
  container.innerHTML = chips.map((chip) => `
    <span style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;background:rgb(var(--color-primary-600));color:white;border-radius:6px;font-size:0.875rem;">
      ${chip}
      <button type="button" onclick="blogRemoveChip('${field}', '${chip.replace(/'/g, "\\'")}')" style="background:none;border:none;color:white;cursor:pointer;padding:0;font-size:1.25rem;line-height:1;">&times;</button>
    </span>
  `).join('');
}

function blogRenderAllChips() {
  Object.keys(blogChipConfig).forEach(blogRenderChipField);
}

function blogFillDatalists() {
  Object.entries(blogChipConfig).forEach(([field, cfg]) => {
    const datalist = document.getElementById(cfg.datalistId);
    if (!datalist) return;
    const terms = blogTaxonomyTerms[field] || [];
    datalist.innerHTML = terms.map((term) => `<option value="${term}"></option>`).join('');
  });
}

function blogAddChip(field) {
  const cfg = blogChipConfig[field];
  const input = document.getElementById(cfg.inputId);
  const raw = field === 'authors' ? blogSlugify(input.value) : input.value.trim();
  if (!raw) return;
  if (blogChipState[field].includes(raw)) {
    input.value = '';
    return;
  }
  blogChipState[field].push(raw);
  input.value = '';
  blogRenderChipField(field);

  if (field === 'authors') {
    const profile = (blogTaxonomyTerms.authorProfiles || []).find((item) => item.slug === raw);
    if (profile) {
      blogAuthorMeta[raw] = {
        name: profile.name,
        image: profile.image || '',
        bio: profile.bio || '',
      };
    } else if (!blogAuthorMeta[raw]?.name) {
      blogPendingAuthorSlug = raw;
      document.getElementById('blog-author-meta-panel').style.display = 'block';
      document.getElementById('blog-author-name').value = raw.replace(/-/g, ' ');
      document.getElementById('blog-author-image').value = '';
      document.getElementById('blog-author-bio').value = '';
    }
  }
}

function blogRemoveChip(field, value) {
  blogChipState[field] = blogChipState[field].filter((item) => item !== value);
  blogRenderChipField(field);
  if (field === 'authors') {
    delete blogAuthorMeta[value];
  }
}

function blogCollectAuthorMeta() {
  if (blogPendingAuthorSlug) {
    const name = document.getElementById('blog-author-name').value.trim();
    if (name) {
      blogAuthorMeta[blogPendingAuthorSlug] = {
        name,
        image: document.getElementById('blog-author-image').value.trim() || null,
        bio: document.getElementById('blog-author-bio').value.trim() || null,
      };
    }
  }
  const meta = {};
  for (const slug of blogChipState.authors) {
    if (blogAuthorMeta[slug]?.name) {
      meta[slug] = blogAuthorMeta[slug];
    }
  }
  return meta;
}

function blogImageSubpath() {
  const slug = document.getElementById('blog-slug')?.value.trim();
  return slug ? blogSlugify(slug) : 'draft';
}

async function blogUploadImageToBunny(dataUrl, filename) {
  const res = await fetch(`${BLOG_API_BASE}/admin/blog/images`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify({
      image: dataUrl,
      filename,
      subpath: blogImageSubpath(),
    }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || data.error || 'Failed to upload image to Bunny CDN');
  }
  return data.url;
}

async function adminUploadImageToR2(dataUrl, filename) {
  const uploadRes = await fetch(`${API_BASE}/admin/images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken
    },
    body: JSON.stringify({ image: dataUrl, filename })
  });
  const uploadData = await uploadRes.json();
  if (!uploadData.success) {
    throw new Error(uploadData.error || 'Failed to upload image.');
  }
  return uploadData.url;
}

function blogRenderCardPreview(url) {
  const el = document.getElementById('blog-card-preview');
  if (!el) return;
  el.innerHTML = url
    ? `<div><div style="font-size:0.7rem;color:rgb(var(--color-neutral-500));">Card 400×238</div><div class="event-export-thumb event-export-thumb--card"><img src="${url}" alt="Card"></div></div>`
    : '';
}

function blogRenderCoverPreview(url) {
  const el = document.getElementById('blog-cover-preview');
  if (!el) return;
  el.innerHTML = url
    ? `<div><div style="font-size:0.7rem;color:rgb(var(--color-neutral-500));">Cover 885×300</div><div class="event-export-thumb event-export-thumb--hero"><img src="${url}" alt="Cover"></div></div>`
    : '';
}

function blogApplyCardImage(url) {
  document.getElementById('blog-featured-image-card').value = url || '';
  blogRenderCardPreview(url);
}

function blogApplyCoverImage(url) {
  document.getElementById('blog-featured-image-hero').value = url || '';
  document.getElementById('blog-featured-image').value = url || '';
  blogRenderCoverPreview(url);
}

function blogCollectPayload(status) {
  const publishedAtRaw = document.getElementById('blog-published-at').value;
  return {
    title: document.getElementById('blog-title').value.trim(),
    slug: document.getElementById('blog-slug').value.trim(),
    excerpt: document.getElementById('blog-excerpt').value.trim() || null,
    featured_image: document.getElementById('blog-featured-image-hero').value.trim()
      || document.getElementById('blog-featured-image').value.trim()
      || null,
    featured_image_card: document.getElementById('blog-featured-image-card').value.trim() || null,
    featured_image_hero: document.getElementById('blog-featured-image-hero').value.trim() || null,
    seo_description: document.getElementById('blog-seo-description').value.trim() || null,
    seo_image: document.getElementById('blog-seo-image').value.trim() || null,
    html: blogQuill ? blogQuill.root.innerHTML.trim() : '',
    tags: [...blogChipState.tags],
    categories: [...blogChipState.categories],
    series: [...blogChipState.series],
    authors: [...blogChipState.authors],
    author_meta: blogCollectAuthorMeta(),
    status,
    published_at: publishedAtRaw ? new Date(publishedAtRaw).toISOString() : null,
  };
}

function blogValidatePayload(payload) {
  if (!payload.title || !payload.slug) {
    Modal.alert({ title: 'Missing fields', message: 'Title and slug are required.' });
    return false;
  }
  if (payload.status === 'published' && (!payload.html || payload.html === '<p><br></p>')) {
    Modal.alert({ title: 'Missing body', message: 'Add post content before publishing.' });
    return false;
  }
  return true;
}

async function loadBlogTaxonomyTerms() {
  try {
    const res = await fetch(`${BLOG_API_BASE}/admin/blog/taxonomy-terms`, {
      headers: { 'X-Session-Token': sessionToken },
    });
    if (!res.ok) throw new Error('Failed to load taxonomy terms');
    blogTaxonomyTerms = await res.json();
    blogFillDatalists();
  } catch (err) {
    console.error('Blog taxonomy terms error:', err);
  }
}

async function loadBlogPosts() {
  const list = document.getElementById('blog-posts-list');
  if (!list) return;
  try {
    const res = await fetch(`${BLOG_API_BASE}/admin/blog/posts?limit=50`, {
      headers: { 'X-Session-Token': sessionToken },
    });
    const data = await res.json();
    blogPosts = data.posts || [];
    if (!blogPosts.length) {
      list.innerHTML = '<p style="color: rgb(var(--color-neutral-500));">No posts yet</p>';
      return;
    }
    list.innerHTML = blogPosts.map((post) => {
      const statusLabel = post.status === 'published'
        ? '<span style="color:#059669;font-weight:600;">Published</span>'
        : '<span style="color:#64748b;">Draft</span>';
      const dateLabel = post.published_at
        ? new Date(post.published_at).toLocaleString('en-GB')
        : new Date(post.updated_at || post.created_at).toLocaleString('en-GB');
      return `
        <div class="item-card" style="margin-bottom:0.75rem;">
          <div style="display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;">
            <div>
              <strong>${post.title || 'Untitled'}</strong>
              <div style="font-size:0.875rem;color:rgb(var(--color-neutral-600));margin-top:0.25rem;">/${post.slug}/ · ${statusLabel}</div>
              <div style="font-size:0.8rem;color:rgb(var(--color-neutral-500));margin-top:0.25rem;">${dateLabel}</div>
            </div>
            <button type="button" class="btn-edit btn-sm" onclick="blogEditPost(${post.id})">Edit</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Load blog posts error:', err);
    list.innerHTML = '<p style="color:#c00;">Failed to load posts</p>';
  }
}

function blogResetForm() {
  document.getElementById('blog-post-id').value = '';
  document.getElementById('blog-title').value = '';
  document.getElementById('blog-slug').value = '';
  document.getElementById('blog-excerpt').value = '';
  document.getElementById('blog-published-at').value = '';
  document.getElementById('blog-featured-image').value = '';
  document.getElementById('blog-featured-image-card').value = '';
  document.getElementById('blog-featured-image-hero').value = '';
  document.getElementById('blog-seo-description').value = '';
  document.getElementById('blog-seo-image').value = '';
  blogRenderCardPreview('');
  blogRenderCoverPreview('');
  document.getElementById('blog-author-meta-panel').style.display = 'none';
  document.getElementById('blog-save-status').textContent = '';
  blogPendingAuthorSlug = null;
  blogAuthorMeta = {};
  Object.keys(blogChipState).forEach((field) => { blogChipState[field] = []; });
  blogRenderAllChips();
  if (blogQuill) blogQuill.setContents([]);
  blogUpdateStatusUi('draft');
  blogSetActionResult('', false);
}

function blogNewPost() {
  blogResetForm();
}

function blogIsoToLocalInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function blogEditPost(id) {
  try {
    const res = await fetch(`${BLOG_API_BASE}/admin/blog/posts/${id}`, {
      headers: { 'X-Session-Token': sessionToken },
    });
    if (!res.ok) throw new Error('Failed to load post');
    const post = await res.json();
    blogResetForm();
    document.getElementById('blog-post-id').value = post.id;
    document.getElementById('blog-title').value = post.title || '';
    document.getElementById('blog-slug').value = post.slug || '';
    document.getElementById('blog-excerpt').value = post.excerpt || '';
    document.getElementById('blog-published-at').value = blogIsoToLocalInput(post.published_at);
    document.getElementById('blog-featured-image').value = post.featured_image || post.featured_image_hero || '';
    document.getElementById('blog-featured-image-card').value = post.featured_image_card || '';
    document.getElementById('blog-featured-image-hero').value = post.featured_image_hero || '';
    document.getElementById('blog-seo-description').value = post.seo_description || '';
    document.getElementById('blog-seo-image').value = post.seo_image || '';
    blogRenderCardPreview(post.featured_image_card || '');
    blogRenderCoverPreview(post.featured_image_hero || post.featured_image || '');
    blogChipState.tags = [...(post.tags || [])];
    blogChipState.categories = [...(post.categories || [])];
    blogChipState.series = [...(post.series || [])];
    blogChipState.authors = [...(post.authors || [])];
    blogRenderAllChips();
    for (const slug of blogChipState.authors) {
      const profile = (blogTaxonomyTerms.authorProfiles || []).find((item) => item.slug === slug);
      if (profile) {
        blogAuthorMeta[slug] = { name: profile.name, image: profile.image || '', bio: profile.bio || '' };
      }
    }
    if (blogQuill) {
      blogQuill.root.innerHTML = post.html || '';
    }
    blogUpdateStatusUi(post.status);
    blogSetActionResult('', false);
  } catch (err) {
    Modal.alert({ title: 'Error', message: err.message || 'Could not load post.' });
  }
}

async function blogSaveDraft() {
  const payload = blogCollectPayload('draft');
  if (!blogValidatePayload(payload)) return;
  const saveBtn = document.getElementById('blog-save-btn');
  saveBtn.disabled = true;
  try {
    const id = document.getElementById('blog-post-id').value;
    const res = await fetch(`${BLOG_API_BASE}/admin/blog/posts${id ? `/${id}` : ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed');
    if (!id && data.id) document.getElementById('blog-post-id').value = data.id;
    document.getElementById('blog-save-status').textContent = 'Draft saved';
    blogUpdateStatusUi('draft');
    await loadBlogTaxonomyTerms();
    await loadBlogPosts();
    blogSetActionResult('Draft saved.', false);
  } catch (err) {
    blogSetActionResult(err.message || 'Save failed', true);
  } finally {
    saveBtn.disabled = false;
  }
}

async function blogSyncCdn() {
  const confirmed = await Modal.confirm({
    title: 'Rebuild blog CDN?',
    message: 'Uploads all published posts to Bunny Storage. Use this if /posts/ is empty or stale.',
  });
  if (!confirmed) return;

  const btn = document.getElementById('blog-sync-cdn-btn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';
  try {
    const res = await fetch(`${BLOG_API_BASE}/admin/blog/sync-cdn`, {
      method: 'POST',
      headers: { 'X-Session-Token': sessionToken },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'CDN rebuild failed');
    blogSetActionResult(`CDN rebuilt (${data.posts ?? 0} published posts). /posts/ should be live within a minute.`, false);
  } catch (err) {
    blogSetActionResult(err.message || 'CDN rebuild failed', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Rebuild CDN';
  }
}

async function blogPublish() {
  const confirmed = await Modal.confirm({
    title: 'Publish post?',
    message: 'This will publish the post to /posts/ immediately (no site rebuild).',
  });
  if (!confirmed) return;

  const payload = blogCollectPayload('published');
  if (!blogValidatePayload(payload)) return;
  const publishBtn = document.getElementById('blog-publish-btn');
  publishBtn.disabled = true;
  publishBtn.textContent = 'Publishing...';
  try {
    const id = document.getElementById('blog-post-id').value;
    if (!id) {
      const createRes = await fetch(`${BLOG_API_BASE}/admin/blog/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken,
        },
        body: JSON.stringify(payload),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Publish failed');
      document.getElementById('blog-post-id').value = createData.id;
    } else {
      const updateRes = await fetch(`${BLOG_API_BASE}/admin/blog/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken,
        },
        body: JSON.stringify(payload),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error || 'Publish failed');
    }
    blogUpdateStatusUi('published');
    await loadBlogTaxonomyTerms();
    await loadBlogPosts();
    blogSetActionResult('Published. Live at /posts/ now.', false);
  } catch (err) {
    blogSetActionResult(err.message || 'Publish failed', true);
  } finally {
    publishBtn.disabled = false;
    blogUpdateStatusUi(blogCurrentStatus);
  }
}

async function blogUnpublish() {
  const id = document.getElementById('blog-post-id').value;
  if (!id) return;
  const confirmed = await Modal.confirm({
    title: 'Unpublish post?',
    message: 'The post will be removed from the public site immediately.',
  });
  if (!confirmed) return;
  try {
    const res = await fetch(`${BLOG_API_BASE}/admin/blog/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken,
      },
      body: JSON.stringify({ status: 'draft' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unpublish failed');
    blogUpdateStatusUi('draft');
    await loadBlogPosts();
    blogSetActionResult('Post unpublished.', false);
  } catch (err) {
    blogSetActionResult(err.message || 'Unpublish failed', true);
  }
}

async function blogDeletePost() {
  const id = document.getElementById('blog-post-id').value;
  if (!id) return;
  if (blogCurrentStatus === 'published') {
    Modal.alert({ title: 'Unpublish first', message: 'Unpublish this post before deleting it.' });
    return;
  }
  const confirmed = await Modal.confirm({
    title: 'Delete draft?',
    message: 'This cannot be undone.',
  });
  if (!confirmed) return;
  try {
    const res = await fetch(`${BLOG_API_BASE}/admin/blog/posts/${id}`, {
      method: 'DELETE',
      headers: { 'X-Session-Token': sessionToken },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    blogResetForm();
    await loadBlogPosts();
    blogSetActionResult('Draft deleted.', false);
  } catch (err) {
    blogSetActionResult(err.message || 'Delete failed', true);
  }
}

function blogPreview() {
  const title = document.getElementById('blog-title').value.trim() || 'Post Preview';
  const bodyHtml = blogQuill ? blogQuill.root.innerHTML.trim() : '';
  if (!bodyHtml || bodyHtml === '<p><br></p>') {
    Modal.alert({ title: 'Empty', message: 'Add some content before previewing.' });
    return;
  }
  const featured = document.getElementById('blog-featured-image-hero').value.trim()
    || document.getElementById('blog-featured-image').value.trim();
  const hero = featured
    ? '<div style="margin:-32px -32px 24px -32px;"><img src="' + featured + '" alt="" style="width:100%;aspect-ratio:885/300;max-height:320px;object-fit:cover;display:block;border-radius:12px;"></div>'
    : '';
  // Hugo goldmark chokes on literal <style> inside page content — split the tag.
  const stO = '<sty' + 'le>';
  const stC = '</sty' + 'le>';
  const styles = stO
    + 'body{font-family:Georgia,serif;line-height:1.7;color:#111;margin:0;padding:24px;background:#fafafa;}'
    + '.wrap{max-width:720px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;}'
    + '.content{padding:32px;}'
    + 'h1,h2,h3{color:#111827;}'
    + 'a{color:#4f46e5;}'
    + stC;
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title>' + styles + '</head><body><div class="wrap">' + hero + '<div class="content"><h1>' + title + '</h1>' + bodyHtml + '</div></div></body></html>';
  document.getElementById('blog-preview-frame').srcdoc = html;
  document.getElementById('blog-preview-modal').style.display = 'flex';
}

function blogClosePreview() {
  document.getElementById('blog-preview-modal').style.display = 'none';
}

function blogInsertImageUrl() {
  if (!blogQuill) return;
  const url = prompt('Image URL');
  if (!url) return;
  const range = blogQuill.getSelection(true);
  blogQuill.insertEmbed(range.index, 'image', url, 'user');
  blogQuill.setSelection(range.index + 1);
}

function blogInsertImageUpload() {
  if (!blogQuill) return;
  const input = document.getElementById('blog-inline-image-upload');
  if (!input) return;
  input.value = '';
  input.click();
}

document.getElementById('blog-title')?.addEventListener('input', (e) => {
  const slugField = document.getElementById('blog-slug');
  if (!slugField || slugField.dataset.manual === '1') return;
  slugField.value = blogSlugify(e.target.value);
});

document.getElementById('blog-slug')?.addEventListener('input', () => {
  document.getElementById('blog-slug').dataset.manual = '1';
});

['tags', 'categories', 'series', 'authors'].forEach((field) => {
  const input = document.getElementById(blogChipConfig[field].inputId);
  if (!input) return;
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      blogAddChip(field);
    }
  });
});

document.getElementById('blog-card-upload')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  showCropModal(file, (url) => {
    blogApplyCardImage(url);
  }, 400 / 238, 'blog-card');
  e.target.value = '';
});

document.getElementById('blog-cover-upload')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  showCropModal(file, (url) => {
    blogApplyCoverImage(url);
  }, 885 / 300, 'blog-cover');
  e.target.value = '';
});

document.getElementById('blog-inline-image-upload')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  showCropModal(file, (url) => {
    if (!blogQuill) return;
    const range = blogQuill.getSelection(true);
    blogQuill.insertEmbed(range.index, 'image', url, 'user');
    blogQuill.setSelection(range.index + 1);
  }, 960 / 540, 'blog-inline');
  e.target.value = '';
});

// Initialize
checkAuth();

</script>
