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
.crop-image-container { max-height: 50vh; margin: 1rem 0; overflow: hidden; }
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
<button class="admin-tab-btn tab-btn" data-tab="events">Events</button>
<button class="admin-tab-btn tab-btn" data-tab="registrations">Registrations</button>
<button class="admin-tab-btn tab-btn" data-tab="orders">Orders</button>
<button class="admin-tab-btn tab-btn" data-tab="memberships">Memberships</button>
<button class="admin-tab-btn tab-btn" data-tab="bookings">Bookings & Calendar</button>
<button class="admin-tab-btn tab-btn" data-tab="cron">Cron Jobs</button>
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
  <div class="form-group">
    <label class="form-label">Time</label>
    <input type="time" id="event-time" class="form-input">
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

  // Create a canvas with transparent background at target size
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const ctx = finalCanvas.getContext('2d', { alpha: true });

  // Get the cropped portion
  const croppedCanvas = cropper.getCroppedCanvas({
    width: targetWidth,
    height: targetHeight,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    fillColor: 'transparent',
  });

  // Draw the cropped image onto the transparent canvas
  ctx.drawImage(croppedCanvas, 0, 0, targetWidth, targetHeight);

  // Analyze for horizontal transparency and zoom if needed
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imageData.data;
  
  let minX = targetWidth;
  let maxX = 0;
  
  // Scan for non-transparent pixels
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const alpha = data[(y * targetWidth + x) * 4 + 3];
      if (alpha > 10) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }
  
  // If there's significant horizontal transparency, zoom to fill
  if (minX < maxX) {
    const contentWidth = maxX - minX + 1;
    const zoomFactor = targetWidth / contentWidth;
    
    if (zoomFactor > 1.01) {
      console.log(`Detected transparency - applying zoom factor: ${zoomFactor.toFixed(2)}`);
      
      // Create temp canvas with zoomed content
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight;
      const tempCtx = tempCanvas.getContext('2d', { alpha: true });
      
      // Calculate centered zoom
      const zoomedWidth = targetWidth * zoomFactor;
      const zoomedHeight = targetHeight * zoomFactor;
      const offsetX = -(zoomedWidth - targetWidth) / 2;
      const offsetY = -(zoomedHeight - targetHeight) / 2;
      
      // Draw zoomed image
      tempCtx.drawImage(finalCanvas, offsetX, offsetY, zoomedWidth, zoomedHeight);
      
      // Copy back to final canvas
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }

  // Convert to PNG base64 (PNG supports transparency)
  const croppedImage = finalCanvas.toDataURL('image/png');

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

// Auto-load data when switching to specific tabs
if (tab === 'bookings') {
  loadBookingsAndCalendar();
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
    organiser: document.getElementById('event-organiser').value,
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
    document.getElementById('event-organiser').value = event.organiser || '';
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

// Initialize
checkAuth();

</script>
