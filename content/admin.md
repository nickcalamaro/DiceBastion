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
/* Admin Dashboard Standardized Styles */

/* Containers */
.admin-container { max-width: 400px; margin: 5rem auto; }
.admin-wide-container { max-width: 600px; margin: 5rem auto; }
.admin-card { background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; }
.admin-card-sm { background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; margin-bottom: 2rem; }

/* Form Groups */
.admin-form-group { margin-bottom: 1.5rem; }
.admin-form-group-mb { margin-bottom: 1rem; }

/* Labels */
.admin-label { display: block; margin-bottom: 0.5rem; font-weight: 600; }
.admin-label-inline { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }

/* Inputs */
.admin-input { width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; }
.admin-input-text { width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-size: 1rem; }
.admin-textarea { width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-family: inherit; }
.admin-select { width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; }

/* Buttons */
.admin-btn-primary { padding: 0.75rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
.admin-btn-primary-full { width: 100%; padding: 0.75rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; }
.admin-btn-secondary { padding: 0.75rem 1.5rem; background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-700)); border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.admin-btn-secondary-sm { padding: 0.5rem 1rem; background: rgb(var(--color-neutral-200)); color: rgb(var(--color-neutral-700)); border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
.admin-btn-link { padding: 0.75rem 1.5rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; text-decoration: none; display: inline-block; }

/* Rich Text Editor */
.admin-editor { border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; min-height: 200px; }
.admin-editor-toolbar { border-bottom: 1px solid rgb(var(--color-neutral-200)); padding: 0.5rem; background: rgb(var(--color-neutral-50)); display: flex; gap: 0.5rem; flex-wrap: wrap; }
.admin-editor-btn { padding: 0.5rem; border: 1px solid rgb(var(--color-neutral-300)); background: white; border-radius: 4px; cursor: pointer; }
.admin-editor-content { padding: 1rem; min-height: 150px; outline: none; font-family: inherit; }

/* Grid Layouts */
.admin-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.admin-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }

/* Flex Layouts */
.admin-flex { display: flex; gap: 1rem; }
.admin-flex-center { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.admin-flex-between { display: flex; justify-content: space-between; align-items: center; }

/* Typography */
.admin-text-center { text-align: center; }
.admin-text-small { color: rgb(var(--color-neutral-500)); font-size: 0.875rem; }
.admin-text-mono { font-family: monospace; }

/* Spacing */
.admin-mb-1 { margin-bottom: 1rem; }
.admin-mb-2 { margin-bottom: 2rem; }
.admin-mt-0 { margin-top: 0; }
.admin-m-0 { margin: 0; }

/* Tabs */
.admin-tab-bar { border-bottom: 2px solid rgb(var(--color-neutral-200)); margin-bottom: 2rem; }
.admin-tab-btn { padding: 1rem 2rem; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-weight: 600; color: rgb(var(--color-neutral-600)); }
.admin-tab-btn.active { border-bottom-color: rgb(var(--color-primary-600)); color: rgb(var(--color-primary-600)); }

/* Alerts */
.admin-error { display: none; margin-top: 1rem; padding: 0.75rem; background: #fee; color: #c00; border-radius: 6px; font-size: 0.875rem; }
.admin-info-box { background: rgb(var(--color-neutral-100)); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; }
.admin-info-highlight { background: rgb(var(--color-neutral-50)); padding: 1rem; border-radius: 6px; border: 1px solid rgb(var(--color-neutral-200)); }

/* Category Tags */
.admin-category-container { display: flex; flex-wrap: wrap; gap: 0.5rem; min-height: 2rem; padding: 0.5rem; border: 1px solid rgb(var(--color-neutral-200)); border-radius: 6px; background: rgb(var(--color-neutral-50)); }

/* Misc */
.admin-icon-lg { font-size: 3rem; margin-bottom: 1rem; }
.admin-link { color: rgb(var(--color-primary-600)); text-decoration: none; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; }
</style>

<div id="admin-page">
<!-- Login Form -->
<div id="login-container" class="admin-container">
<h1 class="admin-text-center admin-mb-2">Admin Login</h1>
<form id="login-form" class="admin-card">
<div class="admin-form-group">
<label for="admin-email" class="admin-label">Email</label>
<input type="email" id="admin-email" required autocomplete="email" class="admin-input-text">
</div>
<div class="admin-form-group">
<label for="admin-password" class="admin-label">Password</label>
<input type="password" id="admin-password" required autocomplete="current-password" class="admin-input-text">
</div>
<button type="submit" class="admin-btn-primary-full">
Login
</button>
<div id="login-error" class="admin-error"></div>
</form>
</div>

<!-- Non-Admin Message -->
<div id="non-admin-container" class="admin-wide-container" style="display: none;">
<div class="admin-card admin-text-center">
<div class="admin-icon-lg">🔒</div>
<h2 class="admin-mt-0 admin-mb-1">Admin Access Required</h2>
<p style="color: rgb(var(--color-neutral-600)); margin-bottom: 1.5rem;">
You're logged in as <strong id="non-admin-email-display"></strong>, but you don't have admin privileges.
</p>
<div class="admin-info-box">
<p class="admin-m-0" style="color: rgb(var(--color-neutral-700));">
If you need to manage products, events, or orders, please contact our team to request admin access.
</p>
</div>
<div class="admin-flex-center">
<a href="/" class="admin-btn-link">
Go to Home
</a>
<a href="/events" class="admin-btn-secondary">
Browse Events
</a>
<button id="non-admin-logout-btn" class="admin-btn-secondary">
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
    <a href="/admin/docs/" class="admin-link">
      📚 <span>Developer Docs</span>
    </a>
    <button id="logout-btn" class="admin-btn-secondary-sm">
      Logout
    </button>
  </div>
</div>

<!-- Tabs -->
<div class="admin-tab-bar">
<button class="admin-tab-btn tab-btn active" data-tab="products">Products</button>
<button class="admin-tab-btn tab-btn" data-tab="events">Events</button>
<button class="admin-tab-btn tab-btn" data-tab="registrations">Registrations</button>
<button class="admin-tab-btn tab-btn" data-tab="orders">Orders</button>
<button class="admin-tab-btn tab-btn" data-tab="memberships">Memberships</button>
<button class="admin-tab-btn tab-btn" data-tab="cron">Cron Jobs</button>
</div>

<!-- Products Tab -->
<div id="products-tab" class="tab-content">
<div class="admin-card-sm">
<h2 id="product-form-title">Add New Product</h2>
<form id="product-form">
<input type="hidden" id="product-id">

<div class="admin-grid-2 admin-mb-1">
<div>
<label class="admin-label">Product Name *</label>
<input type="text" id="product-name" required class="admin-input">
</div>
<div>
<label class="admin-label">URL Slug *</label>
<input type="text" id="product-slug" required class="admin-input">
<small class="admin-text-small">Auto-generated from name</small>
</div>
</div>

<div class="admin-mb-1">
<label class="admin-label">Summary</label>
<textarea id="product-summary" rows="2" placeholder="Brief description shown on product cards" class="admin-textarea"></textarea>
<small class="admin-text-small">Short text displayed on product cards</small>
</div>

<div class="admin-mb-1">
<label class="admin-label">Full Description</label>
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
<label class="admin-label">Price (£) *</label>
<input type="number" id="product-price" step="0.01" required class="admin-input">
</div>
<div>
<label class="admin-label">Stock Quantity *</label>
<input type="number" id="product-stock" required class="admin-input">
</div>
</div>

<div class="admin-mb-1">
<label class="admin-label">Categories (up to 3)</label>
<div id="category-tags" class="admin-category-container"></div>
<div class="admin-flex">
<input type="text" id="category-input" placeholder="Type category name..." class="admin-input" style="flex: 1;">
<button type="button" onclick="addCategory()" class="admin-btn-primary" style="padding: 0.75rem 1.5rem;">Add</button>
</div>
<div id="existing-categories" class="admin-flex" style="margin-top: 0.5rem;"></div>
<small class="admin-text-small">Click existing categories below to add them, or type a new one</small>
</div>

<div class="admin-mb-1">
<label class="admin-label">Image URL</label>
<input type="url" id="product-image" placeholder="https://..." class="admin-input">
<small class="admin-text-small">Or upload an image below</small>
</div>

<div class="admin-mb-1">
<label class="admin-label">Upload Image</label>
<input type="file" id="product-image-upload" accept="image/*" class="admin-input">
<div id="product-image-preview" style="margin-top: 0.5rem;"></div>
</div>

<div class="admin-mb-1">
<label class="admin-label-inline">
<input type="checkbox" id="product-active" checked>
<span>Active (visible in shop)</span>
</label>
</div>

<div class="admin-mb-1">
<label class="admin-label-inline">
<input type="checkbox" id="product-preorder" onchange="togglePreorderDate()">
<span>This is a pre-order item</span>
</label>
</div>

<div id="preorder-date-container" class="admin-mb-1" style="display: none;">
<label class="admin-label">Expected Release Date</label>
<input type="date" id="product-release-date" class="admin-input" style="background: rgb(var(--color-neutral)); color: rgb(var(--color-neutral-900));">
</div>

<div class="admin-flex">
<button type="submit" class="admin-btn-primary" style="flex: 1;">
<span id="product-submit-text">Add Product</span>
</button>
<button type="button" id="cancel-product-edit" class="admin-btn-secondary" style="display: none;">Cancel</button>
</div>
</form>
</div>

<h2>Products</h2>
<div id="products-list"></div>
</div>

<!-- Events Tab -->
<div id="events-tab" class="tab-content" style="display: none;">
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
<h2 id="event-form-title">Add New Event</h2>
<form id="event-form">
<input type="hidden" id="event-id">

<div style="margin-bottom: 1rem;">
<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Event Title *</label>
<input type="text" id="event-title" required style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
</div>

<div style="margin-bottom: 1rem;">
<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">URL Slug *</label>
<input type="text" id="event-slug" required style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-family: monospace;">
<small style="color: rgb(var(--color-neutral-500)); font-size: 0.875rem;">Auto-generated from title, used in URL</small>
</div>

<div style="margin-bottom: 1rem;">
<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Summary</label>
<textarea id="event-description" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-family: inherit;" placeholder="Short description for event cards..."></textarea>
<small style="color: rgb(var(--color-neutral-500)); font-size: 0.875rem;">Brief summary shown on events listing</small>
</div>

<div style="margin-bottom: 1rem;">
<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Full Description</label>
<div id="event-description-editor" style="border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; min-height: 200px;">
<div style="border-bottom: 1px solid rgb(var(--color-neutral-200)); padding: 0.5rem; background: rgb(var(--color-neutral-50)); display: flex; gap: 0.5rem; flex-wrap: wrap;">
<button type="button" onclick="formatEventText('bold')" style="padding: 0.5rem; border: 1px solid rgb(var(--color-neutral-300)); background: white; border-radius: 4px; cursor: pointer; font-weight: bold;">B</button>
<button type="button" onclick="formatEventText('italic')" style="padding: 0.5rem; border: 1px solid rgb(var(--color-neutral-300)); background: white; border-radius: 4px; cursor: pointer; font-style: italic;">I</button>
<button type="button" onclick="formatEventText('underline')" style="padding: 0.5rem; border: 1px solid rgb(var(--color-neutral-300)); background: white; border-radius: 4px; cursor: pointer; text-decoration: underline;">U</button>
<button type="button" onclick="formatEventText('insertUnorderedList')" style="padding: 0.5rem; border: 1px solid rgb(var(--color-neutral-300)); background: white; border-radius: 4px; cursor: pointer;">• List</button>
<button type="button" onclick="insertEventLink()" style="padding: 0.5rem; border: 1px solid rgb(var(--color-neutral-300)); background: white; border-radius: 4px; cursor: pointer;">🔗 Link</button>
</div>
<div id="event-full-description" contenteditable="true" style="padding: 1rem; min-height: 150px; outline: none; font-family: inherit;" placeholder="Detailed event information..."></div>
</div>
<small style="color: rgb(var(--color-neutral-500)); font-size: 0.875rem;">Rich text shown on event detail page</small>
</div>

<div id="one-time-date-fields" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
  <div>
    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Date *</label>
    <input type="date" id="event-date" required style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
  </div>
  <div>
    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Time</label>
    <input type="time" id="event-time" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
  </div>
</div>

<div style="margin-bottom: 1rem;">
  <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-bottom: 1rem;">
    <input type="checkbox" id="event-is-recurring" onchange="toggleRecurringFields()">
    <span style="font-weight: 600;">Recurring Event</span>
  </label>
  
  <div id="recurring-fields" style="display: none; padding: 1rem; background: rgb(var(--color-neutral-50)); border-radius: 6px; border: 1px solid rgb(var(--color-neutral-200));">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
      <div>
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Recurrence Type</label>
        <select id="recurrence-type" onchange="updateRecurrenceFields()" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
          <option value="weekly">Weekly</option>
          <option value="monthly_day">Monthly (by day)</option>
          <option value="monthly_date">Monthly (by date)</option>
        </select>
      </div>
      <div>
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Time *</label>
        <input type="time" id="recurring-time" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
      </div>
    </div>

<div id="weekly-fields" style="display: none;">
    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Day of Week</label>
    <select id="weekly-day" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; margin-bottom: 1rem;">
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
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
    <div>
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Week of Month</label>
        <select id="monthly-week" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
        <option value="1">First</option>
        <option value="2">Second</option>
        <option value="3">Third</option>
        <option value="4">Fourth</option>
        <option value="5">Last</option>
        </select>
    </div>
    <div>
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Day of Week</label>
        <select id="monthly-day" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
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

<div id="monthly-date-fields" style="display: none;">
    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Day of Month</label>
    <input type="number" id="monthly-date" min="1" max="31" placeholder="15" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; margin-bottom: 1rem;">
</div>

<div>
    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">End Date (optional)</label>
    <input type="date" id="recurrence-end-date" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
    <small style="color: rgb(var(--color-neutral-500)); font-size: 0.875rem;">Leave empty for indefinite recurrence</small>
</div>
</div>
</div>

<div style="margin-bottom: 1rem;">
  <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-bottom: 1rem;">
    <input type="checkbox" id="event-requires-purchase" checked onchange="toggleEventPricing()">
    <span style="font-weight: 600;">Requires Ticket Purchase</span>
  </label>
</div>

<div id="event-pricing-fields">
<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
<div>
<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Member Price (£) *</label>
<input type="number" id="event-member-price" step="0.01" required style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
</div>
<div>
<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Non-Member Price (£) *</label>
<input type="number" id="event-nonmember-price" step="0.01" required style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
</div>
<div>
<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Max Attendees</label>
<input type="number" id="event-max-attendees" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
</div>
</div>
</div>

<div style="margin-bottom: 1rem;">
<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Location</label>
<input type="text" id="event-location" placeholder="Gibraltar Warhammer Club" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
</div>

<div style="margin-bottom: 1rem;">
<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Image URL</label>
<input type="url" id="event-image" placeholder="https://..." style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
<small style="color: rgb(var(--color-neutral-500)); font-size: 0.875rem;">Or upload an image below</small>
</div>

<div style="margin-bottom: 1rem;">
<label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Upload Image</label>
<input type="file" id="event-image-upload" accept="image/*" style="width: 100%; padding: 0.75rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
<div id="event-image-preview" style="margin-top: 0.5rem;"></div>
</div>

<div style="margin-bottom: 1rem;">
<label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
<input type="checkbox" id="event-active" checked>
<span>Active (visible on website)</span>
</label>
</div>

<div style="display: flex; gap: 1rem;">
<button type="submit" style="flex: 1; padding: 0.75rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
<span id="event-submit-text">Add Event</span>
</button>
<button type="button" id="cancel-event-edit" style="display: none; padding: 0.75rem 1.5rem; background: rgb(var(--color-neutral-200)); border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
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
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
<h2 style="margin: 0;">Active Memberships</h2>
<div style="display: flex; gap: 1rem; align-items: center;">
<select id="membership-filter" onchange="loadMemberships()" style="padding: 0.5rem 1rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px; font-size: 0.875rem;">
<option value="all">All Memberships</option>
<option value="active">Active Only</option>
<option value="expiring">Expiring Soon (30 days)</option>
<option value="expired">Expired</option>
</select>
<button id="refresh-memberships-btn" onclick="loadMemberships()" style="padding: 0.5rem 1rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
🔄 Refresh
</button>
</div>
</div>

<!-- Membership Stats -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 1.5rem; color: white;">
<div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Total Active</div>
<div style="font-size: 2rem; font-weight: 700;" id="stat-active">-</div>
</div>
<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 1.5rem; color: white;">
<div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Expiring Soon</div>
<div style="font-size: 2rem; font-weight: 700;" id="stat-expiring">-</div>
</div>
<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 12px; padding: 1.5rem; color: white;">
<div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Monthly Revenue</div>
<div style="font-size: 2rem; font-weight: 700;" id="stat-monthly-revenue">-</div>
</div>
<div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 12px; padding: 1.5rem; color: white;">
<div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.5rem;">Auto-Renewal</div>
<div style="font-size: 2rem; font-weight: 700;" id="stat-auto-renew">-</div>
</div>
</div>

<!-- Memberships Table -->
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 12px; overflow: hidden;">
<div style="overflow-x: auto;">
<table style="width: 100%; border-collapse: collapse;">
<thead style="background: rgb(var(--color-neutral-100));">
<tr>
<th style="padding: 1rem; text-align: left; font-weight: 600; border-bottom: 1px solid rgb(var(--color-neutral-200));">Member</th>
<th style="padding: 1rem; text-align: left; font-weight: 600; border-bottom: 1px solid rgb(var(--color-neutral-200));">Email</th>
<th style="padding: 1rem; text-align: left; font-weight: 600; border-bottom: 1px solid rgb(var(--color-neutral-200));">Plan</th>
<th style="padding: 1rem; text-align: left; font-weight: 600; border-bottom: 1px solid rgb(var(--color-neutral-200));">Start Date</th>
<th style="padding: 1rem; text-align: left; font-weight: 600; border-bottom: 1px solid rgb(var(--color-neutral-200));">Expiry Date</th>
<th style="padding: 1rem; text-align: left; font-weight: 600; border-bottom: 1px solid rgb(var(--color-neutral-200));">Days Left</th>
<th style="padding: 1rem; text-align: left; font-weight: 600; border-bottom: 1px solid rgb(var(--color-neutral-200));">Status</th>
<th style="padding: 1rem; text-align: left; font-weight: 600; border-bottom: 1px solid rgb(var(--color-neutral-200));">Auto-Renew</th>
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

<!-- Cron Jobs Tab -->
<div id="cron-tab" class="tab-content" style="display: none;">
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
<h2 style="margin: 0;">Automated Jobs</h2>
<button id="refresh-cron-btn" onclick="loadCronLogs()" style="padding: 0.5rem 1rem; background: rgb(var(--color-primary-600)); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
🔄 Refresh
</button>
</div>

<!-- Job Filter -->
<div style="margin-bottom: 1.5rem;">
<label for="cron-job-filter" style="font-weight: 600; margin-right: 0.5rem;">Filter by Job:</label>
<select id="cron-job-filter" onchange="loadCronLogs()" style="padding: 0.5rem; border: 1px solid rgb(var(--color-neutral-300)); border-radius: 6px;">
<option value="">All Jobs</option>
<option value="auto_renewals">Auto Renewals</option>
<option value="event_reminders">Event Reminders</option>
<option value="payment_reconciliation">Payment Reconciliation</option>
</select>
</div>

<!-- Summary Cards -->
<div id="cron-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
<!-- Will be populated by JavaScript -->
</div>

<!-- Cron Logs Table -->
<div style="background: rgb(var(--color-neutral)); border: 1px solid rgb(var(--color-neutral-200)); border-radius: 8px; overflow: hidden;">
<div style="overflow-x: auto;">
<table style="width: 100%; border-collapse: collapse;">
<thead>
<tr style="background: rgb(var(--color-neutral-100)); border-bottom: 2px solid rgb(var(--color-neutral-200));">
<th style="padding: 1rem; text-align: left; font-weight: 600;">Job Name</th>
<th style="padding: 1rem; text-align: left; font-weight: 600;">Started</th>
<th style="padding: 1rem; text-align: left; font-weight: 600;">Duration</th>
<th style="padding: 1rem; text-align: left; font-weight: 600;">Status</th>
<th style="padding: 1rem; text-align: left; font-weight: 600;">Processed</th>
<th style="padding: 1rem; text-align: left; font-weight: 600;">Success</th>
<th style="padding: 1rem; text-align: left; font-weight: 600;">Failed</th>
<th style="padding: 1rem; text-align: left; font-weight: 600;">Details</th>
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
</div>
</div>

<button id="logout-btn" style="padding: 0.5rem 1rem; background: rgb(var(--color-neutral-200)); border: none; border-radius: 6px; cursor: pointer;">Logout</button>

<style>
.tab-btn {
transition: all 0.2s;
}
.tab-btn:hover {
color: rgb(var(--color-primary-600));
}
.tab-btn.active {
color: rgb(var(--color-primary-600));
border-bottom-color: rgb(var(--color-primary-600)) !important;
}
.item-card {
background: rgb(var(--color-neutral));
border: 1px solid rgb(var(--color-neutral-200));
border-radius: 8px;
padding: 1.5rem;
margin-bottom: 1rem;
}
.item-card h3 {
margin-top: 0;
margin-bottom: 0.5rem;
}
.item-actions {
display: flex;
gap: 0.5rem;
margin-top: 1rem;
}
.btn-edit {
padding: 0.5rem 1rem;
background: rgb(var(--color-primary-600));
color: white;
border: none;
border-radius: 6px;
cursor: pointer;
}
.btn-delete {
padding: 0.5rem 1rem;
background: rgb(var(--color-neutral-200));
border: none;
border-radius: 6px;
cursor: pointer;
}
.btn-delete:hover {
background: #fee;
color: #c00;
}
.image-preview {
max-width: 200px;
max-height: 200px;
border-radius: 6px;
margin-top: 0.5rem;
}
#crop-modal {
display: none;
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(0,0,0,0.8);
z-index: 9999;
align-items: center;
justify-content: center;
}
#crop-modal.is-open {
display: flex;
}
.crop-container {
background: white;
border-radius: 12px;
padding: 1rem 2rem 2rem 2rem;
max-width: 90vw;
max-height: 90vh;
display: flex;
flex-direction: column;
overflow-y: auto;
}
.crop-container h2 {
margin-top: 0;
margin-bottom: 1rem;
}
.crop-image-container {
max-height: 50vh;
margin: 1rem 0;
overflow: hidden;
}
.crop-actions {
display: flex;
gap: 1rem;
justify-content: flex-end;
}
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
<span style="padding: 0.5rem; color: rgb(var(--color-neutral-600)); font-size: 0.875rem; align-self: center;">💡 Drag crop box beyond image for white space</span>
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
localStorage.removeItem('admin_session');
localStorage.removeItem('admin_user');
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

localStorage.removeItem('admin_session');
localStorage.removeItem('admin_user');
localStorage.removeItem('admin_token');
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

// Image Cropping
let cropper = null;
let currentCropCallback = null;
let currentAspectRatio = 336 / 220;

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

  // Create a canvas with white background at target size
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const ctx = finalCanvas.getContext('2d');

  // Fill with white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Get the cropped portion
  const croppedCanvas = cropper.getCroppedCanvas({
    width: targetWidth,
    height: targetHeight,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    fillColor: '#FFFFFF',
  });

  // Draw the cropped image onto the white canvas
  ctx.drawImage(croppedCanvas, 0, 0, targetWidth, targetHeight);

  // Convert to base64
  const croppedImage = finalCanvas.toDataURL('image/jpeg', 0.9);

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
    description: document.getElementById('event-description').value,
    full_description: document.getElementById('event-full-description').innerHTML,
    event_date: isRecurring ? '2025-01-01' : document.getElementById('event-date').value,
    time: isRecurring ? document.getElementById('recurring-time').value : document.getElementById('event-time').value,
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
document.getElementById('event-requires-purchase').checked = true;
document.getElementById('event-pricing-fields').style.display = 'block';
document.getElementById('event-form-title').textContent = 'Add New Event';
document.getElementById('event-submit-text').textContent = 'Add Event';
document.getElementById('cancel-event-edit').style.display = 'none';
document.getElementById('event-image-preview').innerHTML = '';
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
    document.getElementById('event-description').value = event.description || '';
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
    const res = await fetch(`https://dicebastion-memberships.ncalamaro.workers.dev/admin/registrations`, {
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
    const res = await fetch(`https://dicebastion-memberships.ncalamaro.workers.dev/admin/memberships?filter=${filter}`, {
      headers: {
        'X-Session-Token': sessionToken
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch memberships');
    }

    const data = await res.json();
    
    if (!data.success || !data.memberships || data.memberships.length === 0) {
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
    tableBody.innerHTML = data.memberships.map(membership => {
      // Handle null dates for pending memberships
      const hasValidDates = membership.start_date && membership.end_date;
      const startDate = hasValidDates ? new Date(membership.start_date) : null;
      const endDate = hasValidDates ? new Date(membership.end_date) : null;
      const today = new Date();
      const daysLeft = hasValidDates ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;
      
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
            ${startDate ? startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '<span style="color: rgb(var(--color-neutral-400));">N/A</span>'}
          </td>
          <td class="admin-text-sm" style="padding: 1rem;">
            ${endDate ? endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '<span style="color: rgb(var(--color-neutral-400));">N/A</span>'}
          </td>
          <td style="padding: 1rem;">
            <div style="font-weight: 600; color: ${daysLeft === null ? '#9e9e9e' : daysLeft < 0 ? '#f44336' : daysLeft <= 30 ? '#ff9800' : '#4CAF50'};">
              ${daysLeft === null ? 'Pending' : daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
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
    let url = `https://dicebastion-memberships.ncalamaro.workers.dev/admin/cron-logs?limit=${cronPageSize}&offset=${offset}`;
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
    payment_reconciliation: '💳 Payment Reconciliation'
  };
  return names[jobName] || jobName;
}

function showCronDetails(logId, details) {
  try {
    const parsed = JSON.parse(details);
    alert(`Job Details (ID: ${logId}):\n\n${JSON.stringify(parsed, null, 2)}`);
  } catch {
    alert(`Job Details (ID: ${logId}):\n\n${details}`);
  }
}

// Initialize
checkAuth();

</script>
