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
</div>

<!-- Products Tab -->
<div id="products-tab" class="tab-content">
<div class="card card-compact">
<h2 id="product-form-title">Add New Product</h2>
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

<h2>Products</h2>
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
<h2 class="admin-mt-0">New / edit promo code</h2>
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
<h2 id="event-form-title">Add New Event</h2>
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
<small class="admin-text-small">Or upload an image below</small>
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

<h2>Events</h2>
<div id="events-list"></div>
</div>

<!-- Registrations Tab -->
<div id="registrations-tab" class="tab-content" style="display: none;">
<h2>Event Registrations</h2>
<p style="color: rgb(var(--color-neutral-600)); margin-bottom: 2rem;">View and manage event registrations and ticket purchases</p>
<div id="registrations-list"></div>
</div>

<!-- Orders Tab -->
<div id="orders-tab" class="tab-content" style="display: none;">
<h2>Recent Orders</h2>
<div id="orders-list"></div>
</div>

<!-- Memberships Tab -->
<div id="memberships-tab" class="tab-content" style="display: none;">
<div class="admin-flex-between admin-mb-2">
<h2 class="admin-m-0">Active Memberships</h2>
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
<h2 class="admin-m-0">📅 Bookings & Calendar</h2>
<div class="admin-flex">
<button id="create-block-btn" class="btn btn-primary" onclick="showCreateBlockModal()">
+ Block Time
</button>
<button id="refresh-bookings-btn" class="btn btn-secondary btn-sm" onclick="loadBookingsAndCalendar()">
🔄 Refresh
</button>
</div>
</div>

<!-- Calendar Week View -->
<div class="card card-compact">
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
</div>

<!-- Active Time Blocks -->
<div class="card card-compact">
<h3 class="admin-mt-0">⛔ Active Time Blocks</h3>
<div id="blocks-list" style="display: grid; gap: 0.75rem;">
<div style="text-align: center; padding: 2rem; color: rgb(var(--color-neutral-500));">
Loading time blocks...
</div>
</div>
</div>
</div>

<!-- Cron Jobs Tab -->
<div id="cron-tab" class="tab-content" style="display: none;">
<div class="admin-flex-between admin-mb-2">
<h2 class="admin-m-0">Automated Jobs</h2>
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
<h2 class="admin-m-0">Newsletter Builder</h2>
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
#nl-quill-wrap { border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; overflow: hidden; }
.dark #nl-quill-wrap { border-color: rgb(var(--color-neutral-600)); }
#nl-quill-wrap .ql-toolbar.ql-snow { background: rgb(var(--color-neutral-50)); border: none; border-bottom: 1px solid rgb(var(--color-neutral-200)); flex-wrap: wrap; padding: 6px 8px; }
.dark #nl-quill-wrap .ql-toolbar.ql-snow { background: rgb(var(--color-neutral-900)); border-bottom-color: rgb(var(--color-neutral-700)); }
#nl-quill-wrap .ql-container.ql-snow { border: none; font-family: inherit; }
#nl-quill-wrap .ql-editor { min-height: 300px; font-size: 1rem; line-height: 1.7; padding: 1rem; color: rgb(var(--color-neutral-900)); }
.dark #nl-quill-wrap .ql-editor { color: rgb(var(--color-neutral-100)); background: rgb(var(--color-neutral-800)); }
.dark #nl-quill-wrap .ql-stroke { stroke: rgb(var(--color-neutral-400)) !important; }
.dark #nl-quill-wrap .ql-fill { fill: rgb(var(--color-neutral-400)) !important; }
.dark #nl-quill-wrap .ql-picker { color: rgb(var(--color-neutral-300)); }
.dark #nl-quill-wrap .ql-picker-options { background: rgb(var(--color-neutral-800)); border-color: rgb(var(--color-neutral-600)); color: rgb(var(--color-neutral-200)); }
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
let sessionToken = null;
let currentUser = null;
let uploadedProductImage = null;
let uploadedEventImage = null;
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
let cropBgMode = 'auto';   // 'auto' | 'white' | 'pick'
let cropBgPickedCol = null; // hex string when mode is 'pick'

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

function showCropModal(file, callback, aspectRatio = 336 / 220) {
  currentAspectRatio = aspectRatio;
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

  // Determine target dimensions based on aspect ratio
  let targetWidth, targetHeight;
  if (Math.abs(currentAspectRatio - (800 / 379)) < 0.01) {
    // Event image (800x379)
    targetWidth = 800;
    targetHeight = 379;
  } else {
    // Product image (672x440, which is 336/220 * 2)
    targetWidth = 672;
    targetHeight = 440;
  }

  // Get the cropped portion (transparent where crop extends beyond image)
  const croppedCanvas = cropper.getCroppedCanvas({
    width: targetWidth,
    height: targetHeight,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    fillColor: 'transparent',
  });

  // Build final canvas with background fill
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const ctx = finalCanvas.getContext('2d');

  // Determine fill colour based on selected mode
  let fillCol;
  if (cropBgMode === 'white') {
    fillCol = '#ffffff';
  } else if (cropBgMode === 'pick' && cropBgPickedCol) {
    fillCol = cropBgPickedCol;
  } else {
    // Auto: sample average colour from opaque edge pixels
    const srcCtx = croppedCanvas.getContext('2d');
    const px = srcCtx.getImageData(0, 0, targetWidth, targetHeight).data;
    let rSum = 0, gSum = 0, bSum = 0, cnt = 0;
    const samplePx = (x, y) => {
      const i = (y * targetWidth + x) * 4;
      if (px[i + 3] > 128) { rSum += px[i]; gSum += px[i+1]; bSum += px[i+2]; cnt++; }
    };
    for (let x = 0; x < targetWidth; x += 3) {
      for (let d = 0; d < 3; d++) { samplePx(x, d); samplePx(x, targetHeight - 1 - d); }
    }
    for (let y = 0; y < targetHeight; y += 3) {
      for (let d = 0; d < 3; d++) { samplePx(d, y); samplePx(targetWidth - 1 - d, y); }
    }
    fillCol = cnt > 0
      ? `rgb(${Math.round(rSum/cnt)},${Math.round(gSum/cnt)},${Math.round(bSum/cnt)})`
      : '#ffffff';
  }

  // 1) Fill entire canvas with the chosen colour
  ctx.fillStyle = fillCol;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 2) For auto mode, draw a blurred copy so edges bleed softly
  if (cropBgMode === 'auto') {
    ctx.save();
    ctx.filter = 'blur(28px)';
    ctx.drawImage(croppedCanvas, -30, -30, targetWidth + 60, targetHeight + 60);
    ctx.restore();
  }

  // 3) Draw the sharp crop on top
  ctx.drawImage(croppedCanvas, 0, 0, targetWidth, targetHeight);

  // Convert to JPEG (no transparency needed)
  const croppedImage = finalCanvas.toDataURL('image/jpeg', 0.92);

  // Upload to R2
  try {
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
      document.getElementById('crop-modal').classList.remove('is-open');
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
      currentCropCallback = null;
      cropBgMode = 'auto';
      cropBgPickedCol = null;
    } else {
      Modal.alert({ title: 'Upload Failed', message: 'Failed to upload image. Please try again.' });
      console.error('Upload error:', uploadData);
    }
  } catch (err) {
    Modal.alert({ title: 'Error', message: 'Error uploading image. Please try again.' });
    console.error('Upload error:', err);
  }
});

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
btn.addEventListener('click', () => {
const tab = btn.dataset.tab;
document.querySelectorAll('.tab-btn').forEach(b => {
b.classList.remove('active');
b.style.borderBottomColor = 'transparent';
b.style.color = 'rgb(var(--color-neutral-600))';
});
btn.classList.add('active');
btn.style.borderBottomColor = 'rgb(var(--color-primary-600))';
btn.style.color = 'rgb(var(--color-primary-600))';

document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
document.getElementById(tab + '-tab').style.display = 'block';

// Auto-load data when switching to specific tabs
if (tab === 'bookings') {
  loadBookingsAndCalendar();
}
if (tab === 'memberships') {
  loadMemberships();
}
if (tab === 'newsletter') {
  loadNewsletterRecipients();
  loadNewsletterEvents();
  nlInitEditor();
}
if (tab === 'shop-promos') {
  loadShopPromoCodes();
}
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
showCropModal(file, (croppedImage) => {
uploadedEventImage = croppedImage;
document.getElementById('event-image-preview').innerHTML = 
`<img src="${croppedImage}" class="image-preview" alt="Preview">`;
}, 800 / 379);
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
${e.image_url ? `<img src="${e.image_url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;">` : ''}
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
  const imageUrl = uploadedEventImage || document.getElementById('event-image').value;
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
    image_url: imageUrl,
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
uploadedEventImage = null;
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
const seoBody = document.getElementById('seo-section-body');
const seoBtn = seoBody?.previousElementSibling;
if (seoBody) seoBody.classList.remove('is-open');
if (seoBtn) seoBtn.classList.remove('is-open');
uploadedEventImage = null;
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
      document.getElementById('event-image-preview').innerHTML = 
        `<img src="${event.image_url}" class="image-preview" alt="Current">`;
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

async function loadBookings() {
  const container = document.getElementById('bookings-list');
  
  try {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: rgb(var(--color-neutral-500));">
        Loading bookings...
      </div>
    `;
    
    const response = await fetch('https://dicebastionbookings-ofbbu.bunny.run/api/bookings/all', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    
    const data = await response.json();
    const bookings = data.bookings || [];
    
    if (bookings.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: rgb(var(--color-neutral-500));">
          📅 No upcoming bookings found.
        </div>
      `;
      return;
    }
    
    container.innerHTML = bookings.map(booking => {
      const statusColor = booking.status === 'confirmed' ? '#10b981' : booking.status === 'cancelled' ? '#ef4444' : '#f59e0b';
      const statusIcon = booking.status === 'confirmed' ? '✓' : booking.status === 'cancelled' ? '✕' : '⏳';
      
      return `
        <div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div style="flex: 1;">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1.125rem;">${booking.table_type || 'Table Booking'}</h3>
              <div style="color: rgb(var(--color-neutral-600)); font-size: 0.875rem;">
                📅 ${formatDate(booking.booking_date)} • 🕐 ${booking.start_time} - ${booking.end_time}
              </div>
            </div>
            <span style="background: ${statusColor}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;">
              ${statusIcon} ${booking.status.toUpperCase()}
            </span>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; padding: 1rem; background: rgb(var(--color-neutral-50)); border-radius: 8px; margin-bottom: 1rem;">
            <div>
              <div style="font-size: 0.75rem; color: rgb(var(--color-neutral-500)); margin-bottom: 0.25rem;">Customer</div>
              <div style="font-weight: 600;">${booking.user_name || 'N/A'}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: rgb(var(--color-neutral-500)); margin-bottom: 0.25rem;">Email</div>
              <div style="font-weight: 500; font-size: 0.875rem;">${booking.user_email}</div>
            </div>
          </div>
          
          ${booking.notes ? `
            <div style="padding: 1rem; background: rgb(var(--color-neutral-50)); border-left: 3px solid rgb(var(--color-primary-600)); border-radius: 4px; margin-bottom: 1rem;">
              <div style="font-size: 0.75rem; color: rgb(var(--color-neutral-500)); margin-bottom: 0.25rem;">Notes</div>
              <div style="font-size: 0.875rem; color: rgb(var(--color-neutral-700));">${booking.notes}</div>
            </div>
          ` : ''}
          
          ${booking.status !== 'cancelled' ? `
            <div style="text-align: right;">
              <button onclick="cancelBookingAdmin(${booking.id})" class="admin-btn-secondary-sm" style="background: #ef4444; color: white;">
                Cancel Booking
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    
  } catch (err) {
    console.error('Error loading bookings:', err);
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #f44336;">
        ❌ Error loading bookings: ${err.message}
      </div>
    `;
  }
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
      loadBookings(); // Reload the list
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
  try {
    const response = await fetch('https://dicebastionbookings-ofbbu.bunny.run/api/bookings/blocks');
    const data = await response.json();
    
    const container = document.getElementById('blocks-list');
    
    if (!data.blocks || data.blocks.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 2rem; color: rgb(var(--color-neutral-500));">No time blocks active</div>';
      return;
    }
    
    container.innerHTML = data.blocks.map(block => `
      <div class="card" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1;">
          <div style="font-weight: 600; color: rgb(var(--color-neutral-900)); margin-bottom: 0.25rem;">
            ${block.block_date} • ${block.start_time} - ${block.end_time}
          </div>
          ${block.reason ? `<div style="font-size: 0.875rem; color: rgb(var(--color-neutral-600));">${block.reason}</div>` : ''}
        </div>
        <button onclick="deleteTimeBlock(${block.id})" class="btn btn-secondary btn-sm" style="background: rgb(var(--color-danger-600)); color: white;">
          Delete
        </button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading time blocks:', err);
  }
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
      const dayBlocks = blocksData.blocks?.filter(b => b.block_date === dateStr) || [];
      
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
            <div style="padding: 1rem; background: rgb(var(--color-danger-50)); border-left: 4px solid rgb(var(--color-danger-600)); border-radius: 6px; margin-bottom: 1rem;">
              <div style="font-weight: 600; color: rgb(var(--color-danger-900)); margin-bottom: 0.25rem;">
                ⛔ BLOCKED • ${block.start_time} - ${block.end_time}
              </div>
              ${block.reason ? `<div style="font-size: 0.875rem; color: rgb(var(--color-danger-700));">${block.reason}</div>` : ''}
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
    calendarGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: rgb(var(--color-danger-600));">Failed to load calendar</div>';
  }
}

function changeWeek(direction) {
  currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
  loadCalendarWeek();
}

function loadBookingsAndCalendar() {
  loadTimeBlocks();
  loadCalendarWeek();
}

// ==================== Google Indexing API ====================
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

  try {
    const res = await fetch(`${API_BASE}/admin/indexing/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Session-Token': sessionToken },
      body: JSON.stringify({ url, type: 'URL_UPDATED' })
    });
    const data = await res.json();
    if (data.ok) {
      btn.textContent = '✅ Indexed';
      btn.style.background = '#059669';
      setTimeout(() => { btn.textContent = origText; btn.disabled = false; btn.style.background = ''; }, 3000);
    } else {
      btn.textContent = '❌ Failed';
      btn.style.background = '#dc2626';
      console.error('Indexing failed:', data);
      setTimeout(() => { btn.textContent = origText; btn.disabled = false; btn.style.background = ''; }, 4000);
    }
  } catch (err) {
    btn.textContent = '❌ Error';
    console.error('Indexing error:', err);
    setTimeout(() => { btn.textContent = origText; btn.disabled = false; btn.style.background = ''; }, 4000);
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

function nlInitEditor() {
  if (nlEditorReady) return;
  nlEditorReady = true;
  if (!document.getElementById('quill-css')) {
    const link = document.createElement('link');
    link.id = 'quill-css';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
    document.head.appendChild(link);
  }
  if (!window.Quill) {
    const script = document.createElement('script');
    script.src = 'https://cdn.quilljs.com/1.3.7/quill.min.js';
    script.onload = nlCreateEditor;
    document.head.appendChild(script);
  } else {
    nlCreateEditor();
  }
}

function nlCreateEditor() {
  if (nlQuill) return;

  // Custom blot: renders an hr divider
  const BlockEmbed = Quill.import('blots/block/embed');
  class DividerBlot extends BlockEmbed {}
  DividerBlot.blotName = 'divider';
  DividerBlot.tagName = 'hr';
  Quill.register(DividerBlot);

  // Custom blot: renders a non-editable event card, preserving full HTML
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

  // Custom blot: renders a non-editable 2-column events calendar grid
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

  nlQuill = new Quill('#nl-editor', {
    theme: 'snow',
    placeholder: 'Start writing your newsletter...',
    modules: {
      toolbar: { container: '#nl-toolbar' },
      keyboard: {
        bindings: {
          h1: { key: ' ', collapsed: true, prefix: /^#$/,   handler: function(r)     { this.quill.deleteText(r.index-1,1,'user'); this.quill.formatLine(r.index-1,1,'header',1,'user'); return false; } },
          h2: { key: ' ', collapsed: true, prefix: /^##$/,  handler: function(r)     { this.quill.deleteText(r.index-2,2,'user'); this.quill.formatLine(r.index-2,1,'header',2,'user'); return false; } },
          h3: { key: ' ', collapsed: true, prefix: /^###$/, handler: function(r)     { this.quill.deleteText(r.index-3,3,'user'); this.quill.formatLine(r.index-3,1,'header',3,'user'); return false; } },
          ul: { key: ' ', collapsed: true, prefix: /^[-*]$/, handler: function(r)    { this.quill.deleteText(r.index-1,1,'user'); this.quill.formatLine(r.index-1,1,'list','bullet','user'); return false; } },
          ol: { key: ' ', collapsed: true, prefix: /^\d+\.$/,handler: function(r,ctx){ const l=ctx.prefix.length; this.quill.deleteText(r.index-l,l,'user'); this.quill.formatLine(r.index-l,1,'list','ordered','user'); return false; } }
        }
      }
    }
  });

  // Auto-save to localStorage on any change (debounced 1.5 s — crash-recovery only)
  nlQuill.on('text-change', function() {
    if (nlRestoringDraft) return;
    clearTimeout(nlDraftTimer);
    nlDraftTimer = setTimeout(nlSaveDraft, 1500);
  });

  // Also auto-save when the subject line changes
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
      ? `<img class="nl-event-pick-img" src="${ev.image_url}" alt="">`
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
    ? '<img src="' + ev.image_url + '" alt="" width="400" height="190" style="width:100%;height:auto;display:block;">'
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
      ? '<tr><td style="padding:0;line-height:0;font-size:0;"><img src="' + ev.image_url + '" alt="" width="100%" style="display:block;width:100%;border-radius:8px 8px 0 0;" /></td></tr>'
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

// Initialize
checkAuth();

</script>
