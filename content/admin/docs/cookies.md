---
title: "Cookie System Documentation"
layout: "single"
showHero: false
showDate: false
---

<div id="docs-auth-guard" style="text-align: center; padding: 3rem;">
  <p style="color: rgb(var(--color-neutral-500));">Checking authentication...</p>
</div>

<div id="docs-content" style="display: none;">

<div style="margin-bottom: 2rem;">
  <a href="/admin/docs/" style="color: rgb(var(--color-primary-600)); text-decoration: underline;">← Back to Documentation</a>
</div>

## Cookie System Overview

**Framework:** Custom cookie consent partial

**Files:** 
- Main site: `layouts/partials/cookie-consent.html`
- Shop: `shop/layouts/partials/cookie-consent.html`

**Storage:** `localStorage` key `dicebastion_cookie_consent`

---

## Configuration

The consent system is self-contained in the partial. Key settings:

```javascript
const CONSENT_KEY = 'dicebastion_cookie_consent';
const CONSENT_VERSION = '1.0'; // Increment to force re-consent
```

---

## Consent Data Structure

```json
{
  "version": "1.0",
  "timestamp": "2024-12-15T10:30:00.000Z",
  "preferences": {
    "essential": true,
    "analytics": true
  }
}
```

---

## Cookies Set

| Cookie/Storage | Set By | When | Purpose | Duration |
|----------------|--------|------|---------|----------|
| `dicebastion_cookie_consent` | Consent JS | On user choice | Stores preference | Persistent (localStorage) |
| `_cf_bm` | Cloudflare | On Turnstile load | Bot management | 30 min |
| SumUp session cookies | SumUp iframe | During payment | Payment processing | Session |

---

## User Flow

1. **First Visit** → Banner appears, no tracking active
2. **User Chooses:**
   - **Accept All** → `{essential: true, analytics: true}`
   - **Save Preferences** → Uses checkbox state
   - **Essential Only** → `{essential: true, analytics: false}`
3. **Consent Saved** → Banner hidden, cookie trigger button shown
4. **Return Visit** → If version matches, preferences auto-applied; otherwise re-prompt

---

## Analytics Integration

Analytics only loads after consent. See `loadAnalytics()` in the partial:

```javascript
function loadAnalytics() {
  const consent = getConsent();
  if (consent && consent.preferences.analytics) {
    // Load your analytics here
    console.log('Analytics enabled');
  }
}
```

**To add Google Analytics:**
```javascript
// Uncomment in loadAnalytics():
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'YOUR-GA-ID');
```

---

## Third-Party Services

### Cloudflare Turnstile
- Sets `_cf_bm` cookie for bot detection
- Required for checkout security
- Not controlled by consent (essential for payment fraud prevention)
- [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/)

### SumUp Payments
- Session cookies in their iframe
- Required for payment processing
- Not controlled by consent (essential for transactions)
- [SumUp Privacy Policy](https://www.sumup.com/en-gb/privacy/)

---

## GDPR Compliance

| Requirement | Status |
|-------------|--------|
| No tracking before consent | ✅ |
| Clear reject option | ✅ |
| Equal button prominence | ✅ |
| Consent recorded with timestamp | ✅ |
| Link to privacy policy | ✅ |
| Ability to change preferences | ✅ (cookie trigger button) |

---

## Files Involved

| File | Purpose |
|------|---------|
| `layouts/partials/cookie-consent.html` | Main site banner (HTML, CSS, JS) |
| `shop/layouts/partials/cookie-consent.html` | Shop site banner (separate copy) |
| `layouts/_default/baseof.html` | Main site includes partial |
| `shop/layouts/_default/baseof.html` | Shop includes partial |
| `content/privacy-policy.md` | Public cookie explanation |

> ⚠️ **Important:** There are TWO copies of the cookie consent partial - one for the main site and one for the shop. Changes must be made to both files.

---

## Testing

```bash
# Clear consent and retest
# Browser DevTools → Application → Local Storage
# Delete: dicebastion_cookie_consent
# Refresh page → banner should reappear
```

**Force re-consent for all users:**
Increment `CONSENT_VERSION` in BOTH partials.

---

## Future: User Account Integration

When user accounts are implemented, cookie preferences should sync with user profiles:

### Planned Data Structure

```javascript
// When user logs in, merge localStorage with server preferences
const userPreferences = {
  cookie_consent: {
    version: '1.0',
    preferences: { essential: true, analytics: true },
    synced_at: '2024-12-15T10:30:00.000Z'
  },
  marketing_opt_in: false,
  saved_payment_method: true,
  remember_details: true
};
```

### Implementation Notes

1. **On Login:** Fetch user preferences from API, merge with localStorage
2. **On Consent Change:** POST updated preferences to `/api/user/preferences`
3. **On Logout:** Keep localStorage consent (anonymous), clear user-specific data
4. **Cross-device Sync:** Logged-in preferences override localStorage

### Storage Keys (Planned)

| Key | Purpose | Sync to Account |
|-----|---------|-----------------|
| `dicebastion_cookie_consent` | Cookie preferences | ✅ Yes |
| `dicebastion_user_session` | Auth token | ❌ No (device-specific) |
| `dicebastion_saved_details` | Name/email for checkout | ✅ Yes |
| `dicebastion_cart` | Shopping cart | ✅ Yes (optional) |

### API Endpoints (Planned)

```
GET  /api/user/preferences     - Fetch user preferences
POST /api/user/preferences     - Update preferences
POST /api/user/consent         - Record consent with timestamp
```

---

## JavaScript API

The cookie consent system exposes a public API via `window.DiceBastionCookies`:

```javascript
// Check if user has given analytics consent
if (window.DiceBastionCookies.hasAnalyticsConsent()) {
  // Safe to load tracking pixels, etc.
}

// Get full consent object
const consent = window.DiceBastionCookies.getConsent();
// Returns: { version, timestamp, preferences: { essential, analytics }, synced }

// Programmatically set consent (e.g., from user account sync)
window.DiceBastionCookies.setConsent(
  { essential: true, analytics: true },
  true // fromServer - marks as synced from account
);

// Show the consent banner programmatically
window.DiceBastionCookies.showBanner();

// Check current consent version
const version = window.DiceBastionCookies.getVersion(); // '1.0'
```

### Usage: Syncing from User Account

```javascript
// On user login, sync preferences from server
async function syncUserPreferences(userId) {
  const response = await fetch(`/api/user/${userId}/preferences`);
  const serverPrefs = await response.json();
  
  if (serverPrefs.cookie_consent) {
    window.DiceBastionCookies.setConsent(
      serverPrefs.cookie_consent.preferences,
      true // mark as synced
    );
  }
}

// On consent change, save to server (if logged in)
function onConsentChange(preferences) {
  const userId = localStorage.getItem('user_id');
  if (userId) {
    fetch(`/api/user/${userId}/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie_consent: preferences })
    });
  }
}
```

---

## Button Styling (GDPR Compliance)

All buttons now have equal visual weight per GDPR guidelines:

```css
/* All buttons use same styling */
.cookie-btn-equal {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ccc;
}

.cookie-btn-equal:hover {
  background: #e5e5e5;
  border-color: #bbb;
}
```

This ensures no button (like "Accept All") appears more prominent than alternatives like "Essential Only".

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
