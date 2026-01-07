# Worker Codebase Refactoring Plan

## Current State Analysis

### File Structure
```
worker/
├── src/
│   ├── index.js (3,778 lines!) ⚠️ TOO LARGE
│   ├── auth-utils.js (334 lines)
│   ├── email-templates/ (248 lines total)
│   └── utils/ (140 lines total)
├── wrangler.toml (duplicate!)
└── [various test files and docs]
```

### Issues Identified

1. **❌ Duplicate wrangler.toml files**
   - `/wrangler.toml` (39 lines) - Project root
   - `/worker/wrangler.toml` (38 lines) - Worker folder
   - **Action**: Keep root version, delete worker version

2. **❌ index.js is too large (3,778 lines)**
   - Contains: Routes, helpers, SumUp integration, email logic, payment processing, renewals, etc.
   - **Action**: Split into logical modules

3. **✅ Good existing structure**
   - `auth-utils.js` - Email verification & preferences
   - `email-templates/` - Template functions
   - `utils/recurring.js` - Recurring event utils

## Proposed File Structure

```
worker/
├── wrangler.toml (DELETE - use root version)
├── src/
│   ├── index.js (main app, routes only ~500 lines)
│   │
│   ├── config/
│   │   └── constants.js (email regex, plans, etc.)
│   │
│   ├── middleware/
│   │   ├── cors.js (CORS handling)
│   │   └── rate-limit.js (rate limiting)
│   │
│   ├── db/
│   │   ├── schema.js (ensureSchema, migrations)
│   │   └── queries.js (common DB operations)
│   │
│   ├── auth/
│   │   └── auth-utils.js (EXISTING - keep as-is)
│   │
│   ├── payments/
│   │   ├── sumup.js (SumUp API integration)
│   │   ├── checkout.js (checkout creation)
│   │   ├── instruments.js (payment instrument management)
│   │   └── renewals.js (renewal processing)
│   │
│   ├── emails/
│   │   ├── send.js (sendEmail, logEmailHistory)
│   │   ├── templates.js (email template functions)
│   │   └── templates/ (EXISTING - keep as-is)
│   │
│   ├── routes/
│   │   ├── membership.js (membership endpoints)
│   │   ├── events.js (event endpoints)
│   │   ├── shop.js (shop endpoints)
│   │   └── admin.js (admin endpoints)
│   │
│   └── utils/
│       ├── helpers.js (addMonths, toIso, clampStr, etc.)
│       ├── validation.js (email validation, turnstile)
│       └── recurring.js (EXISTING - keep as-is)
```

## Refactoring Steps

### Phase 1: Remove Duplication ✅
1. Delete `/worker/wrangler.toml`
2. Ensure `/wrangler.toml` has all necessary config

### Phase 2: Extract Utilities (~300 lines)
1. Create `src/utils/helpers.js` - Move generic utilities
2. Create `src/config/constants.js` - Move constants

### Phase 3: Extract Middleware (~200 lines)
1. Create `src/middleware/cors.js` - CORS logic
2. Create `src/middleware/rate-limit.js` - Rate limiting

### Phase 4: Extract Database Layer (~400 lines)
1. Create `src/db/schema.js` - Schema setup & migrations
2. Create `src/db/queries.js` - Common queries

### Phase 5: Extract Payment Logic (~800 lines)
1. Create `src/payments/sumup.js` - SumUp API calls
2. Create `src/payments/checkout.js` - Checkout creation
3. Create `src/payments/instruments.js` - Token management
4. Create `src/payments/renewals.js` - Renewal processing

### Phase 6: Extract Email Logic (~400 lines)
1. Create `src/emails/send.js` - Email sending
2. Create `src/emails/templates.js` - Consolidate template functions

### Phase 7: Extract Routes (~1,000 lines)
1. Create `src/routes/membership.js` - All `/membership/*` endpoints
2. Create `src/routes/events.js` - All `/events/*` endpoints
3. Create `src/routes/shop.js` - All `/shop/*` endpoints
4. Create `src/routes/admin.js` - All admin endpoints

### Phase 8: Clean Main File (~500 lines remaining)
1. Keep only: App setup, route registration, cron triggers
2. Import all modules

## Expected Results

### Before
- `index.js`: **3,778 lines**
- Hard to navigate
- Hard to test individual components
- Merge conflicts likely

### After
- `index.js`: **~500 lines** (just routes & setup)
- 20+ focused modules, each **<200 lines**
- Easy to test
- Easy to maintain
- Clear separation of concerns

## Migration Strategy

1. ✅ Create new file
2. ✅ Copy relevant code
3. ✅ Export functions
4. ✅ Import in index.js
5. ✅ Test thoroughly
6. ✅ Remove from index.js
7. ✅ Repeat

## Testing Checklist (After Each Phase)

- [ ] Deployment succeeds
- [ ] Membership purchase works
- [ ] Auto-renewal works
- [ ] Event tickets work
- [ ] Cron job works
- [ ] No errors in Cloudflare logs

---

**Let's start with Phase 1: Remove the duplicate wrangler.toml**
