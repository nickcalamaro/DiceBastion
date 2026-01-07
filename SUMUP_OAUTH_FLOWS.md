# SumUp OAuth Integration Guide

## Overview

The payments worker supports **two OAuth 2.0 flows** for authenticating with SumUp's API:

1. **Client Credentials** (Default, simpler)
2. **Authorization Code + Refresh Token** (Required for some accounts)

## Flow Comparison

| Feature | Client Credentials | Authorization Code + Refresh Token |
|---------|-------------------|-----------------------------------|
| **Complexity** | Simple | More complex |
| **Setup** | Just client ID/secret | Requires authorization flow |
| **Token Lifespan** | Short-lived (request new each time) | Long-lived refresh token |
| **Required For** | Most SumUp accounts | Some enterprise/regulated accounts |
| **Security** | Machine-to-machine | User authorization |

## Flow 1: Client Credentials (Default)

### When to Use
- Your SumUp account allows machine-to-machine authentication
- You're getting started and haven't been given a refresh token
- Most common for standard SumUp integrations

### How It Works
```
1. Worker needs to make API call
2. Request token: POST /token with client_credentials grant
3. Get short-lived access token
4. Use token for API call
5. Repeat for next API call
```

### Configuration
Only need these secrets:
```bash
SUMUP_CLIENT_ID=com_xxxxx
SUMUP_CLIENT_SECRET=secret_xxxxx
```

### Code Flow
```typescript
// Automatically uses client_credentials when no refresh token
const params = new URLSearchParams()
params.set('grant_type', 'client_credentials')
params.set('client_id', env.SUMUP_CLIENT_ID)
params.set('client_secret', env.SUMUP_CLIENT_SECRET)
params.set('scope', 'payments payment_instruments')

const res = await fetch('https://api.sumup.com/token', {
  method: 'POST',
  body: params
})
```

## Flow 2: Authorization Code + Refresh Token

### When to Use
- SumUp requires you to use authorization_code flow
- You've been given a refresh token by SumUp
- Client credentials returns `unauthorized` or scope errors
- Your account type requires user authorization

### How It Works
```
1. (One-time) Complete authorization flow in SumUp dashboard
2. Save long-lived refresh token
3. Worker needs to make API call
4. Request token: POST /token with refresh_token grant
5. Get fresh access token (and potentially new refresh token)
6. Use access token for API call
7. Next time, reuse refresh token
```

### Initial Setup (One-Time)

#### Step 1: Create OAuth Application
1. Go to [SumUp Developer Dashboard](https://developer.sumup.com/)
2. Create new application
3. Note your **Client ID** and **Client Secret**
4. Configure redirect URI (e.g., `https://localhost:3000/callback`)

#### Step 2: Get Authorization Code
Construct authorization URL:
```
https://api.sumup.com/authorize?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  scope=payments+payment_instruments
```

Navigate to this URL in browser:
1. Login to SumUp
2. Approve permissions
3. Get redirected: `https://your-redirect-uri?code=AUTH_CODE`
4. Copy the `code` parameter

#### Step 3: Exchange for Refresh Token
```bash
curl -X POST https://api.sumup.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=AUTH_CODE_FROM_STEP_2" \
  -d "redirect_uri=YOUR_REDIRECT_URI"
```

Response:
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_xxxxx",  // <-- SAVE THIS
  "scope": "payments payment_instruments"
}
```

#### Step 4: Save Refresh Token
```bash
# Save to .dev.vars for local development
echo "SUMUP_REFRESH_TOKEN=refresh_xxxxx" >> .dev.vars

# Save to production
wrangler secret put SUMUP_REFRESH_TOKEN
```

### Configuration
Need these secrets:
```bash
SUMUP_CLIENT_ID=com_xxxxx
SUMUP_CLIENT_SECRET=secret_xxxxx
SUMUP_REFRESH_TOKEN=refresh_xxxxx  # <-- Additional
```

### Code Flow
```typescript
// Automatically uses refresh_token when present
const params = new URLSearchParams()
params.set('grant_type', 'refresh_token')
params.set('client_id', env.SUMUP_CLIENT_ID)
params.set('client_secret', env.SUMUP_CLIENT_SECRET)
params.set('refresh_token', env.SUMUP_REFRESH_TOKEN)

const res = await fetch('https://api.sumup.com/token', {
  method: 'POST',
  body: params
})
```

## How the Worker Chooses

The payments worker automatically detects which flow to use:

```typescript
async function sumupToken(env: Bindings, scopes: string) {
  if (env.SUMUP_REFRESH_TOKEN) {
    // Use refresh_token grant
    // More secure, required for some accounts
  } else {
    // Use client_credentials grant
    // Simpler, works for most accounts
  }
}
```

## Troubleshooting

### "Unauthorized" with client_credentials
**Problem**: Your SumUp account requires authorization flow
**Solution**: Set up refresh token (Flow 2)

### "Invalid refresh token"
**Problem**: Refresh token expired or revoked
**Solution**: Re-run authorization flow to get new refresh token

### "Scope not granted"
**Problem**: Token doesn't have required permissions
**Solution**: 
- Check scopes in authorization URL
- Ensure `payments payment_instruments` are requested

### "Token expired"
**Problem**: Access token expired (normal)
**Solution**: Worker automatically requests new token

## Security Best Practices

1. **Never commit tokens** to git
2. **Rotate refresh tokens** periodically
3. **Use HTTPS** for redirect URIs
4. **Validate webhook signatures** (already implemented)
5. **Monitor token usage** in SumUp dashboard

## Migration Guide

### From client_credentials to refresh_token

1. Get refresh token (see Flow 2 setup)
2. Add secret:
   ```bash
   wrangler secret put SUMUP_REFRESH_TOKEN
   ```
3. Deploy worker:
   ```bash
   npm run deploy
   ```
4. Worker automatically switches to refresh_token flow
5. Test payment flow

### From refresh_token back to client_credentials

1. Remove secret:
   ```bash
   wrangler secret delete SUMUP_REFRESH_TOKEN
   ```
2. Deploy worker:
   ```bash
   npm run deploy
   ```
3. Worker automatically falls back to client_credentials
4. Test payment flow

## Testing

### Verify Flow Being Used

Check worker logs:
```bash
wrangler tail dicebastion-payments
```

Look for:
- `grant_type=client_credentials` (Flow 1)
- `grant_type=refresh_token` (Flow 2)

### Test Token Request

```typescript
// Test endpoint: GET /health should work with either flow
curl https://dicebastion-payments.workers.dev/health

// Test internal endpoint (requires working tokens)
curl -X POST https://dicebastion-payments.workers.dev/internal/checkout \
  -H "X-Internal-Secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"amount":1,"currency":"GBP","orderRef":"TEST","description":"Test"}'
```

## References

- [SumUp OAuth Documentation](https://developer.sumup.com/docs/authorization)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [SumUp API Reference](https://developer.sumup.com/api)

## Summary

- **Try client_credentials first** (simpler)
- **Switch to refresh_token** if required by your SumUp account
- **Worker handles both** automatically based on secrets present
- **No code changes needed** to switch between flows
