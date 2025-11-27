# Dice Bastion Worker Tests

Automated test suite for the membership and ticketing worker.

## Setup

```bash
cd worker
npm install
```

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode (reruns on file changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

## Test Structure

Tests are located in `worker/test/` directory:

- `index.test.js` - Main API endpoint tests

## What's Tested

### Schema Tests
- ✅ Transactions table creation
- ✅ Payment instruments table creation
- ✅ Renewal log table creation
- ✅ Correct column structure

### API Endpoint Tests
- ✅ Health check (`GET /`)
- ✅ Membership plans (`GET /membership/plans`)
- ✅ Membership status (`GET /membership/status`)
- ✅ Auto-renewal status (`GET /membership/auto-renewal`)

### Validation Tests
- ✅ Email format validation
- ✅ Required parameters
- ✅ Error handling (404, 400)

### CORS Tests
- ✅ OPTIONS requests
- ✅ CORS headers

## Continuous Integration

Tests run automatically on:
- Every push to `main`/`master` branch
- Every pull request

See `.github/workflows/test-deploy.yml` for CI/CD configuration.

## Writing New Tests

Add new tests to `worker/test/index.test.js`:

```javascript
import { expect, test, describe } from 'vitest'
import worker from '../src/index.js'

describe('My Feature', () => {
  test('should do something', async () => {
    const response = await makeRequest('/my-endpoint')
    expect(response.status).toBe(200)
  })
})
```

## Testing with Real Database

Tests use an in-memory D1 database that mimics production. Schema is automatically initialized.

To test against your actual D1 database:

```bash
# Using wrangler
wrangler dev --test-scheduled

# Then in another terminal
curl http://localhost:8787/__scheduled?cron=0+2+*+*+*
```

## Manual Integration Testing

### Test Membership Purchase
```bash
curl -X POST http://localhost:8787/membership/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "plan": "monthly",
    "privacyConsent": true,
    "turnstileToken": "test",
    "autoRenew": true
  }'
```

### Test Ticket Purchase
```bash
curl -X POST http://localhost:8787/events/1/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "privacyConsent": true,
    "turnstileToken": "test"
  }'
```

### Check Auto-Renewal Status
```bash
curl "http://localhost:8787/membership/auto-renewal?email=test@example.com"
```

## Test Database Queries

```bash
# List all transactions
wrangler d1 execute DB --command "SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10"

# Check payment instruments
wrangler d1 execute DB --command "SELECT * FROM payment_instruments WHERE is_active = 1"

# View renewal logs
wrangler d1 execute DB --command "SELECT * FROM renewal_log ORDER BY attempt_date DESC LIMIT 10"
```

## Debugging Failed Tests

1. **Check worker logs:**
   ```bash
   wrangler tail
   ```

2. **Run tests in watch mode:**
   ```bash
   npm run test:watch
   ```

3. **Enable verbose output:**
   ```bash
   npm test -- --reporter=verbose
   ```

## Coverage Goals

Current coverage: Run `npm run test:coverage` to see latest

Target coverage:
- Statements: 70%+
- Branches: 60%+
- Functions: 70%+
- Lines: 70%+

## CI/CD Pipeline

The GitHub Actions workflow:

1. **Test Job:**
   - Installs dependencies
   - Runs all tests
   - Runs linting (if configured)

2. **Deploy Job:**
   - Only runs on `main`/`master` branch
   - Deploys to Cloudflare Workers after tests pass
   - Requires `CLOUDFLARE_API_TOKEN` secret

### Setting Up GitHub Secrets

Add to your repository secrets (Settings → Secrets and variables → Actions):

```
CLOUDFLARE_API_TOKEN=<your_cloudflare_api_token>
```

Get your API token from: https://dash.cloudflare.com/profile/api-tokens

Required permissions:
- Account: Workers Scripts (Edit)
- Zone: Workers Routes (Edit)

## Troubleshooting

### "Cannot find module" errors
```bash
cd worker
npm install
```

### D1 database errors in tests
- Tests use in-memory database
- Schema is auto-initialized
- Check `vitest.config.js` configuration

### Tests pass locally but fail in CI
- Check Node.js version matches (20.x)
- Ensure package-lock.json is committed
- Review GitHub Actions logs

## Future Test Additions

Consider adding:
- [ ] Integration tests with mock SumUp API
- [ ] Email sending tests with mock MailerSend
- [ ] Cron job renewal logic tests
- [ ] Payment instrument save/charge tests
- [ ] Load testing with k6 or Artillery
- [ ] E2E tests with Playwright
