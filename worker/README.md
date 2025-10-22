Setup steps

1) Install Wrangler
- npm i -g wrangler

2) Configure D1 binding
- wrangler d1 execute dicebastion-d1 --file=worker/migrations/0001_init.sql

3) Set secrets
- wrangler secret put SUMUP_CLIENT_ID
- wrangler secret put SUMUP_CLIENT_SECRET

4) Dev
- wrangler dev

5) Deploy
- wrangler deploy

Endpoints
- POST /membership/checkout { email, name?, plan: 'monthly'|'quarterly'|'annual' }
- GET /membership/status?email=foo@example.com
- POST /webhooks/sumup  (configure in SumUp dashboard)

Client example (SumUp Checkout)
- Fetch /membership/checkout to get { orderRef, amount, currency, title, description, returnUrl }
- Initialize the SumUp Checkout widget with the order reference and amount.

Notes
- True auto-renew requires SumUp recurring/tokenization availability in your account/region. Otherwise consider email reminders.
