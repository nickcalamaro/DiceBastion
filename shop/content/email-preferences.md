+++
title = "Email Preferences"
description = "Manage your email preferences for Dice Bastion"
+++

<div id="email-preferences-app">
  <div class="preferences-header">
    <h1>Email Preferences</h1>
    <p>Manage how you receive communications from Dice Bastion</p>
  </div>
  
  <div class="loading-indicator" id="loading-indicator">
    Loading your preferences...
  </div>
  
  <div class="preferences-form" id="preferences-form" style="display: none;">
    <div class="form-group">
  <label for="email-input">Your Email</label>
  <input type="email" id="email-input" class="form-input" readonly>
  <p class="form-hint">This is the email address associated with your account.</p>
</div>

<div class="form-section">
  <h3>Email Subscription Preferences</h3>
  
  <div class="form-group checkbox-group">
    <input type="checkbox" id="transactional-emails" checked disabled>
    <label for="transactional-emails">Transactional Emails</label>
    <p class="form-hint">Order confirmations, receipts, and account notifications (required)</p>
  </div>
  
  <div class="form-group checkbox-group">
    <input type="checkbox" id="membership-emails" checked>
    <label for="membership-emails">Membership Emails</label>
    <p class="form-hint">Membership renewals, expiration notices, and membership benefits</p>
  </div>
  
  <div class="form-group checkbox-group">
    <input type="checkbox" id="event-emails" checked>
    <label for="event-emails">Event Notifications</label>
    <p class="form-hint">Event reminders, ticket confirmations, and event updates</p>
  </div>
  
  <div class="form-group checkbox-group">
    <input type="checkbox" id="promotional-emails" checked>
    <label for="promotional-emails">Promotional Emails</label>
    <p class="form-hint">Special offers, new product announcements, and sales</p>
  </div>
</div>

<div class="form-actions">
  <button class="save-button" onclick="savePreferences()">Save Preferences</button>
  <div class="save-status" id="save-status"></div>
</div>
</div>

<div class="email-history" id="email-history" style="display: none;">
<h3>Recent Emails Sent To You</h3>
<div class="history-loading" id="history-loading">Loading email history...</div>
    <div class="history-list" id="history-list"></div>
  </div>
</div>

<style>
.email-preferences-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.preferences-header {
  text-align: center;
  margin-bottom: 2rem;
}

.preferences-header h1 {
  font-size: 2rem;
  color: rgb(var(--color-neutral-800));
  margin-bottom: 0.5rem;
}

.preferences-header p {
  color: rgb(var(--color-neutral-600));
  font-size: 1.1rem;
}

.loading-indicator {
  text-align: center;
  padding: 2rem;
  color: rgb(var(--color-neutral-500));
}

.preferences-form {
  background: rgb(var(--color-neutral));
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid rgb(var(--color-neutral-200));
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: rgb(var(--color-neutral-700));
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid rgb(var(--color-neutral-200));
  border-radius: 8px;
  font-size: 1rem;
  background: rgb(var(--color-neutral));
  color: rgb(var(--color-neutral-800));
}

.form-input:focus {
  outline: none;
  border-color: rgb(var(--color-primary-400));
}

.form-hint {
  font-size: 0.875rem;
  color: rgb(var(--color-neutral-500));
  margin-top: 0.25rem;
}

.form-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: rgb(var(--color-neutral-50));
  border-radius: 8px;
  border: 1px solid rgb(var(--color-neutral-200));
}

.form-section h3 {
  color: rgb(var(--color-neutral-800));
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-group input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: rgb(var(--color-primary-600));
  cursor: pointer;
}

.checkbox-group input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.checkbox-group label {
  margin-bottom: 0;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 2rem;
}

.save-button {
  padding: 0.75rem 1.5rem;
  background: rgb(var(--color-primary-600));
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button:hover {
  background: rgb(var(--color-primary-700));
  transform: translateY(-1px);
}

.save-button:disabled {
  background: rgb(var(--color-neutral-300));
  cursor: not-allowed;
  transform: none;
}

.save-status {
  font-size: 0.95rem;
  margin-left: 1rem;
}

.save-status.success {
  color: rgb(16, 185, 129);
}

.save-status.error {
  color: rgb(220, 38, 38);
}

.email-history {
  margin-top: 3rem;
}

.email-history h3 {
  color: rgb(var(--color-neutral-800));
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.history-loading {
  color: rgb(var(--color-neutral-500));
  font-style: italic;
}

.history-list {
  display: grid;
  gap: 1rem;
}

.history-item {
  padding: 1rem;
  background: rgb(var(--color-neutral));
  border-radius: 8px;
  border: 1px solid rgb(var(--color-neutral-200));
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-item-info {
  flex: 1;
}

.history-item-type {
  font-weight: 600;
  color: rgb(var(--color-primary-600));
  margin-bottom: 0.25rem;
}

.history-item-subject {
  color: rgb(var(--color-neutral-700));
  font-size: 0.95rem;
}

.history-item-date {
  color: rgb(var(--color-neutral-500));
  font-size: 0.875rem;
  white-space: nowrap;
  margin-left: 1rem;
}

.history-item-status {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
}

.history-item-status.sent {
  background: rgb(16, 185, 129, 0.1);
  color: rgb(16, 185, 129);
}

.history-item-status.failed {
  background: rgb(220, 38, 38, 0.1);
  color: rgb(220, 38, 38);
}

@media (max-width: 768px) {
  .preferences-form {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .save-button {
    width: 100%;
  }
  
  .save-status {
    margin-left: 0;
    margin-top: 0.5rem;
    text-align: center;
  }
}
</style>

<script>
// Email Preferences Management
let currentUserEmail = null
let currentPreferences = {
  membership_emails: true,
  event_emails: true,
  promotional_emails: true
}

// Load user preferences
async function loadPreferences() {
  try {
    // In a real implementation, this would fetch from your API
    // For now, we'll simulate loading
    const email = localStorage.getItem('user_email') || ''
    
    if (!email) {
      // Prompt for email if not logged in
      const testEmail = prompt('Please enter your email to check preferences:')
      if (testEmail) {
        currentUserEmail = testEmail
        localStorage.setItem('user_email', testEmail)
      } else {
        alert('Email is required to manage preferences')
        return
      }
    } else {
      currentUserEmail = email
    }
    
    // Simulate API call
    document.getElementById('loading-indicator').textContent = 'Loading...'
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Show the form
    document.getElementById('loading-indicator').style.display = 'none'
    document.getElementById('preferences-form').style.display = 'block'
    document.getElementById('email-history').style.display = 'block'
    
    // Populate form
    document.getElementById('email-input').value = currentUserEmail
    document.getElementById('membership-emails').checked = currentPreferences.membership_emails
    document.getElementById('event-emails').checked = currentPreferences.event_emails
    document.getElementById('promotional-emails').checked = currentPreferences.promotional_emails
    
    // Load email history
    loadEmailHistory()
    
  } catch (error) {
    console.error('Failed to load preferences:', error)
    document.getElementById('loading-indicator').textContent = 'Failed to load preferences. Please try again.'
  }
}

// Load email history
async function loadEmailHistory() {
  try {
    document.getElementById('history-loading').textContent = 'Loading email history...'
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock email history data
    const mockHistory = [
      {
        email_type: 'shop_order_confirmation',
        subject: 'Order Confirmation - ORD-123456',
        sent_at: new Date(Date.now() - 86400000).toISOString(),
        status: 'sent'
      },
      {
        email_type: 'membership_welcome',
        subject: 'Welcome to Dice Bastion Monthly Membership!',
        sent_at: new Date(Date.now() - 172800000).toISOString(),
        status: 'sent'
      },
      {
        email_type: 'event_ticket_confirmation',
        subject: 'Ticket Confirmed: Board Game Night',
        sent_at: new Date(Date.now() - 259200000).toISOString(),
        status: 'sent'
      }
    ]
    
    // Display history
    const historyList = document.getElementById('history-list')
    historyList.innerHTML = mockHistory.map(email => `
      <div class="history-item">
        <div class="history-item-info">
          <div class="history-item-type">${formatEmailType(email.email_type)}</div>
          <div class="history-item-subject">${email.subject}</div>
        </div>
        <div class="history-item-date">${formatDate(email.sent_at)}</div>
        <div class="history-item-status ${email.status}">${email.status}</div>
      </div>
    `).join('')
    
    document.getElementById('history-loading').style.display = 'none'
    
  } catch (error) {
    console.error('Failed to load email history:', error)
    document.getElementById('history-loading').textContent = 'Failed to load email history.'
  }
}

// Save preferences
async function savePreferences() {
  const saveButton = document.querySelector('.save-button')
  const saveStatus = document.getElementById('save-status')
  
  // Disable button and show loading
  saveButton.disabled = true
  saveButton.textContent = 'Saving...'
  saveStatus.textContent = ''
  saveStatus.className = 'save-status'
  
  try {
    // Update preferences from form
    currentPreferences.membership_emails = document.getElementById('membership-emails').checked
    currentPreferences.event_emails = document.getElementById('event-emails').checked
    currentPreferences.promotional_emails = document.getElementById('promotional-emails').checked
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Show success
    saveStatus.textContent = 'Preferences saved successfully!'
    saveStatus.className = 'save-status success'
    
  } catch (error) {
    console.error('Failed to save preferences:', error)
    saveStatus.textContent = 'Failed to save preferences. Please try again.'
    saveStatus.className = 'save-status error'
  } finally {
    // Re-enable button
    saveButton.disabled = false
    saveButton.textContent = 'Save Preferences'
  }
}

// Helper functions
function formatEmailType(type) {
  const types = {
    'shop_order_confirmation': 'Order Confirmation',
    'membership_welcome': 'Membership Welcome',
    'membership_renewal_success': 'Membership Renewal',
    'membership_renewal_failed': 'Renewal Failed',
    'membership_renewal_final_failed': 'Renewal Disabled',
    'event_ticket_confirmation': 'Event Ticket',
    'membership_renewal_reminder': 'Renewal Reminder'
  }
  return types[type] || type
}

function formatDate(isoString) {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Initialize
window.addEventListener('DOMContentLoaded', function() {
  loadPreferences()
})

// Expose functions to window for testing
globalThis.savePreferences = savePreferences
</script>