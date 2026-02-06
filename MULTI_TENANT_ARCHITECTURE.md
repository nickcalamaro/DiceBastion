# Multi-Tenant Platform Architecture for Bunny.net

## Overview

This guide outlines the high-level steps to transform DiceBastion into a multi-tenant platform using Bunny.net Edge Scripts and Bunny Database (libSQL). Each tenant gets their own isolated database while sharing common API logic.

## Architecture Decision: Separate Databases per Tenant

**Benefits:**
- Complete data isolation between tenants
- Independent scaling and backups
- Easier to migrate individual tenants
- No risk of cross-tenant data leakage
- Simpler queries (no tenant_id filtering)

**Trade-offs:**
- More databases to manage
- Higher costs at scale
- Schema changes need applying to all databases

---

## Phase 1: Repository Restructuring

### Step 1.1: Create Monorepo Structure

Convert your existing repository into a monorepo with shared packages:

```
DiceBastion/
├── packages/                    # Shared code used by all tenants
│   ├── edge-api/               # Core API handlers
│   ├── database-client/        # Database utilities
│   ├── auth/                   # Authentication logic
│   ├── payments/               # Payment processing (SumUp, etc.)
│   └── shared-types/           # TypeScript types
│
├── tenants/                    # Individual tenant deployments
│   ├── dicebastion/           # Your main site
│   │   ├── edge-script/       # Bunny edge entry point
│   │   ├── hugo-site/         # Static site content
│   │   └── config/            # Tenant-specific config
│   │
│   └── example-tenant/        # Template for new tenants
│
├── infrastructure/             # Deployment & management scripts
│   ├── scripts/
│   ├── templates/
│   └── docs/
│
└── package.json               # Root workspace config
```

**Action Items:**
- [ ] Create `packages/` directory structure
- [ ] Create `tenants/` directory structure
- [ ] Create `infrastructure/` directory for tooling
- [ ] Set up npm/pnpm workspaces in root `package.json`

### Step 1.2: Initialize Workspace Configuration

Create root `package.json` with workspace configuration:

```json
{
  "name": "dicebastion-platform",
  "private": true,
  "workspaces": [
    "packages/*",
    "tenants/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspaces",
    "build": "npm run build --workspaces",
    "deploy:tenant": "node infrastructure/scripts/deploy-tenant.js"
  }
}
```

**Action Items:**
- [ ] Create root package.json with workspaces
- [ ] Install pnpm or configure npm workspaces
- [ ] Test workspace linking works

---

## Phase 2: Extract Shared API Logic

### Step 2.1: Create Core API Package

Move your existing Worker logic into shared packages:

```
packages/edge-api/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Main export
│   ├── router.ts             # Hono app factory
│   ├── middleware/
│   │   ├── cors.ts
│   │   ├── auth.ts
│   │   ├── rate-limit.ts
│   │   └── error-handler.ts
│   ├── handlers/
│   │   ├── memberships.ts
│   │   ├── events.ts
│   │   ├── account.ts
│   │   └── admin.ts
│   └── utils/
│       ├── dates.ts
│       ├── validation.ts
│       └── email.ts
└── README.md
```

**Action Items:**
- [ ] Create `packages/edge-api` package
- [ ] Extract middleware from `worker/src/index.js` to separate files
- [ ] Extract route handlers into logical groups (memberships, events, etc.)
- [ ] Keep Hono as your router (works on both Cloudflare and Bunny)
- [ ] Export a factory function that creates the app with config

### Step 2.2: Create Database Client Package

Abstract database access for portability:

```
packages/database-client/
├── src/
│   ├── index.ts
│   ├── client.ts             # libSQL client wrapper
│   ├── queries/
│   │   ├── users.ts
│   │   ├── memberships.ts
│   │   └── events.ts
│   └── migrations/
│       └── schema.sql
```

**Action Items:**
- [ ] Create database client abstraction layer
- [ ] Move all SQL queries from Worker into typed query functions
- [ ] Support both Cloudflare D1 and libSQL (for migration)
- [ ] Create migration system

### Step 2.3: Create Payments Package

Extract payment logic:

```
packages/payments/
├── src/
│   ├── index.ts
│   ├── sumup.ts              # Your existing SumUp integration
│   ├── checkout.ts
│   └── webhooks.ts
```

**Action Items:**
- [ ] Extract SumUp integration from Worker
- [ ] Make payment methods configurable (for future payment providers)
- [ ] Keep webhook handling logic separate

---

## Phase 3: Set Up Bunny Infrastructure

### Step 3.1: Create Bunny Storage Zones

For each tenant, create:
1. **Storage Zone** - Stores Hugo static files
2. **Pull Zone (CDN)** - Serves content globally
3. **Database** - libSQL database instance

**Action Items:**
- [ ] Create Bunny account (if not already done)
- [ ] Set up first storage zone for DiceBastion
- [ ] Link storage zone to pull zone (CDN)
- [ ] Enable Edge Scripting on pull zone
- [ ] Note down API keys and zone IDs

### Step 3.2: Create Bunny Databases

Create a libSQL database for each tenant:

**Option A: Bunny Dashboard**
1. Go to Bunny Dashboard → Database
2. Create new database (e.g., "dicebastion-db")
3. Copy connection URL and auth token
4. Store in environment variables

**Option B: Turso CLI (Bunny uses Turso)**
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create dicebastion-db --location lhr

# Get credentials
turso db show dicebastion-db --url
turso db tokens create dicebastion-db
```

**Action Items:**
- [ ] Create database for DiceBastion tenant
- [ ] Save database URL and token securely
- [ ] Test connection with libSQL client
- [ ] Create template/script for future tenant databases

---

## Phase 4: Create First Tenant (DiceBastion)

### Step 4.1: Set Up Tenant Structure

```
tenants/dicebastion/
├── package.json
├── tsconfig.json
├── bunny.config.json          # Deployment config
├── edge-script/
│   ├── index.ts               # Entry point
│   └── config.ts              # Tenant-specific config
├── hugo-site/                 # Your existing Hugo site
│   ├── config.toml
│   ├── content/
│   └── layouts/
└── .env.example
```

**Action Items:**
- [ ] Move existing Hugo site into `tenants/dicebastion/hugo-site/`
- [ ] Create edge script entry point
- [ ] Create tenant configuration file
- [ ] Set up environment variables

### Step 4.2: Create Edge Script Entry Point

The edge script imports shared packages and configures for this tenant:

```typescript
// tenants/dicebastion/edge-script/index.ts
import { createPlatformAPI } from '@platform/edge-api';
import { createClient } from '@libsql/client/web';
import { tenantConfig } from './config';

const db = createClient({
  url: process.env.BUNNY_DATABASE_URL!,
  authToken: process.env.BUNNY_DATABASE_AUTH_TOKEN!,
});

const app = createPlatformAPI(db, tenantConfig);

export default app;
```

**Action Items:**
- [ ] Create edge script that uses shared packages
- [ ] Configure database connection
- [ ] Set tenant-specific settings (domain, branding, etc.)
- [ ] Test locally if possible

### Step 4.3: Create Deployment Configuration

```json
// tenants/dicebastion/bunny.config.json
{
  "tenant": {
    "id": "dicebastion",
    "name": "Dice Bastion"
  },
  "bunny": {
    "pullZoneId": "YOUR_PULL_ZONE_ID",
    "storageZone": "dicebastion",
    "storagePath": "/"
  },
  "domains": [
    "dicebastion.com",
    "www.dicebastion.com"
  ],
  "database": {
    "urlEnvVar": "DICEBASTION_DB_URL",
    "tokenEnvVar": "DICEBASTION_DB_TOKEN"
  }
}
```

**Action Items:**
- [ ] Create Bunny configuration file
- [ ] Document all required environment variables
- [ ] Create secrets management strategy

---

## Phase 5: Database Migration

### Step 5.1: Export Cloudflare D1 Data

Export your current production data:

```bash
# Export from D1 (adjust based on actual D1 export method)
wrangler d1 export dicebastion-db --output=export.sql

# Or use your preferred backup method
```

**Action Items:**
- [ ] Export all data from Cloudflare D1
- [ ] Verify export includes all tables and data
- [ ] Keep backup safe

### Step 5.2: Adapt Schema for libSQL

Review and adjust schema if needed:
- libSQL is SQLite-compatible (like D1)
- Most schemas should work as-is
- Test any D1-specific features

**Action Items:**
- [ ] Review current schema
- [ ] Create migration scripts in `packages/database-client/migrations/`
- [ ] Test schema on local libSQL database

### Step 5.3: Import to Bunny Database

```bash
# Import to libSQL
turso db shell dicebastion-db < export.sql

# Or use libSQL client programmatically
```

**Action Items:**
- [ ] Import data to Bunny Database
- [ ] Verify data integrity
- [ ] Test queries work correctly

---

## Phase 6: Create Deployment System

### Step 6.1: Build Deployment Script

Create a deployment script that:
1. Builds shared packages
2. Builds tenant edge script
3. Deploys edge script to Bunny
4. Uploads Hugo static files to Bunny Storage
5. Purges CDN cache

```bash
#!/bin/bash
# infrastructure/scripts/deploy-tenant.sh

TENANT=$1

echo "🏗️  Building shared packages..."
npm run build --workspace=packages/*

echo "📦 Building $TENANT edge script..."
npm run build --workspace=tenants/$TENANT

echo "🚀 Deploying edge script to Bunny..."
# Use Bunny API to deploy edge script

echo "📤 Uploading static files..."
# Use Bunny Storage API to upload Hugo output

echo "♻️  Purging CDN cache..."
# Purge Bunny CDN cache

echo "✅ Deployment complete!"
```

**Action Items:**
- [ ] Create deployment script
- [ ] Test on staging environment first
- [ ] Document deployment process
- [ ] Set up CI/CD (GitHub Actions, etc.)

### Step 6.2: Create Tenant Provisioning Script

Automate new tenant creation:

```bash
# infrastructure/scripts/create-tenant.sh NEW_TENANT_NAME
```

This script should:
1. Copy tenant template
2. Create Bunny storage zone
3. Create Bunny pull zone
4. Create Bunny database
5. Generate config files
6. Set up DNS (or provide instructions)

**Action Items:**
- [ ] Create tenant provisioning script
- [ ] Document manual steps (DNS, payment setup, etc.)
- [ ] Create tenant checklist

---

## Phase 7: Migration Execution

### Step 7.1: Test in Parallel

Run both systems simultaneously:
- Keep Cloudflare Worker running (production)
- Deploy to Bunny (staging/test)
- Compare behavior and performance

**Action Items:**
- [ ] Deploy DiceBastion to Bunny with different domain (e.g., beta.dicebastion.com)
- [ ] Test all functionality
- [ ] Run load tests
- [ ] Monitor error rates

### Step 7.2: DNS Cutover

When ready to switch:

```
1. Lower DNS TTL 24 hours before (set to 300s)
2. Update DNS records to point to Bunny CDN
3. Monitor traffic switching over
4. Keep Cloudflare Worker running for 24-48 hours
5. Gradually deprecate old Worker
```

**Action Items:**
- [ ] Plan maintenance window
- [ ] Prepare rollback plan
- [ ] Update DNS records
- [ ] Monitor for issues
- [ ] Communicate with users if needed

---

## Phase 8: Adding New Tenants

### Process for Each New Tenant:

1. **Run provisioning script**
   ```bash
   ./infrastructure/scripts/create-tenant.sh client-name
   ```

2. **Configure tenant settings**
   - Edit `tenants/client-name/edge-script/config.ts`
   - Set branding, domain, pricing, etc.

3. **Create database**
   ```bash
   turso db create client-name-db
   ```

4. **Import initial schema**
   ```bash
   turso db shell client-name-db < packages/database-client/migrations/schema.sql
   ```

5. **Deploy**
   ```bash
   ./infrastructure/scripts/deploy-tenant.sh client-name
   ```

6. **Set up Hugo content**
   - Tenant customizes `tenants/client-name/hugo-site/`
   - Deploy static files

**Action Items:**
- [ ] Document onboarding process
- [ ] Create tenant onboarding checklist
- [ ] Set up billing/invoicing system
- [ ] Create tenant management dashboard (future)

---

## Key Differences: Cloudflare → Bunny

### Code Changes Needed:

| Cloudflare Workers | Bunny Edge Scripts |
|-------------------|-------------------|
| `c.env.DB` | `db` (injected libSQL client) |
| `c.env.VARIABLE` | `process.env.VARIABLE` |
| `.prepare().bind().first()` | `.execute({ sql, args })` |
| `wrangler deploy` | Bunny API deployment |
| D1 Database | libSQL/Turso Database |
| R2 Storage | Bunny Storage |

### Environment Variables:
- Cloudflare: Set in `wrangler.toml` + Dashboard
- Bunny: Set in Edge Script settings via API/Dashboard

### Deployment:
- Cloudflare: `wrangler deploy`
- Bunny: HTTP API calls to update edge script

---

## Monitoring & Maintenance

### Things to Monitor:

- [ ] Edge script errors (Bunny logs)
- [ ] Database performance (query times)
- [ ] CDN cache hit rates
- [ ] API response times
- [ ] Storage usage per tenant
- [ ] Database size per tenant

### Regular Tasks:

- [ ] Update shared packages (test all tenants!)
- [ ] Run database backups
- [ ] Review tenant usage/billing
- [ ] Apply security updates
- [ ] Monitor costs

---

## Rollback Plan

If something goes wrong:

1. **DNS Rollback** - Point DNS back to Cloudflare
2. **Keep D1 Database** - Don't delete until confident
3. **Parallel Systems** - Run both for transition period
4. **Database Sync** - Consider syncing data both ways during migration

---

## Next Steps

### Immediate (Week 1-2):
- [ ] Set up monorepo structure
- [ ] Extract shared packages
- [ ] Create first Bunny database
- [ ] Test libSQL connection

### Short-term (Week 3-4):
- [ ] Deploy DiceBastion to Bunny staging
- [ ] Test all functionality
- [ ] Create deployment scripts
- [ ] Migrate data

### Medium-term (Month 2):
- [ ] Production cutover
- [ ] Monitor and optimize
- [ ] Document lessons learned
- [ ] Prepare for second tenant

### Long-term (Month 3+):
- [ ] Onboard first external tenant
- [ ] Build tenant management tools
- [ ] Automate provisioning
- [ ] Scale as needed

---

## Resources & References

- **Bunny.net Docs**: https://docs.bunny.net/
- **libSQL Docs**: https://docs.turso.tech/
- **Hono Docs**: https://hono.dev/ (works on both platforms)
- **Current Worker**: `worker/src/index.js` (reference)
- **Current Database**: Cloudflare D1 (export before migration)

---

## Questions to Answer During Implementation

- [ ] How will you handle database migrations across multiple tenant DBs?
- [ ] Will tenants be able to customize Hugo themes?
- [ ] How will you bill tenants (per-usage, flat fee, etc.)?
- [ ] Do you want tenant isolation at the code level too? (separate edge scripts vs shared)
- [ ] How will you handle shared resources like email sending?
- [ ] What's your backup and disaster recovery strategy?

---

## Success Criteria

**Migration is successful when:**
- ✅ DiceBastion runs on Bunny with same functionality
- ✅ All data migrated successfully
- ✅ Performance equals or exceeds Cloudflare
- ✅ Deployment process is documented and tested
- ✅ You can provision a new tenant in < 1 hour
- ✅ Shared package updates deploy to all tenants smoothly
- ✅ Costs are lower than Cloudflare
- ✅ You have a rollback plan

---

**Ready to start?** Begin with Phase 1 (Repository Restructuring) and work through methodically. Don't rush the migration - having both systems running in parallel during transition is smart.
