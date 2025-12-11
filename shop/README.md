# Dice Bastion Shop

Separate e-commerce site for shop.dicebastion.com

## Architecture

- **Frontend**: Static Hugo site (shop/)
- **Backend**: Cloudflare Worker API (shared with main site)
- **Database**: Cloudflare D1 (shared database)
- **Payments**: SumUp (reusing existing integration)
- **Hosting**: Cloudflare Pages

## Cookie Compliance

The shop site includes a GDPR-compliant cookie consent banner:
- **Essential cookies**: Shopping cart, session management (always active)
- **Analytics cookies**: Optional, user can opt-in/out
- Main site (dicebastion.com) remains cookie-free

## Database Schema

### Products Table
```sql
- id: INTEGER PRIMARY KEY
- name: TEXT (product name)
- slug: TEXT UNIQUE (URL-friendly identifier)
- description: TEXT
- price: INTEGER (in pence/cents)
- currency: TEXT (default 'GBP')
- stock_quantity: INTEGER
- image_url: TEXT
- category: TEXT
- is_active: INTEGER (1/0 for soft delete)
- created_at, updated_at: TEXT
```

### Orders Table
```sql
- id: INTEGER PRIMARY KEY
- order_number: TEXT UNIQUE
- user_id: INTEGER (optional, if logged in)
- email, name: TEXT
- status: TEXT (pending/processing/completed/cancelled)
- subtotal, tax, shipping, total: INTEGER
- currency: TEXT
- checkout_id, payment_id, payment_status: TEXT (SumUp refs)
- shipping_address, billing_address: TEXT (JSON)
- notes: TEXT
- created_at, updated_at, completed_at: TEXT
```

### Order Items Table
```sql
- id: INTEGER PRIMARY KEY
- order_id: INTEGER (FK to orders)
- product_id: INTEGER (FK to products)
- product_name: TEXT (snapshot at purchase time)
- quantity: INTEGER
- unit_price: INTEGER
- subtotal: INTEGER
```

### Cart Items Table (temporary carts)
```sql
- id: INTEGER PRIMARY KEY
- session_id: TEXT (client-generated UUID)
- product_id: INTEGER (FK to products)
- quantity: INTEGER
- created_at, updated_at: TEXT
```

## API Endpoints

### Public Endpoints
- `GET /products` - List all active products
- `GET /products/:id` - Get product by ID or slug
- `GET /orders/:orderNumber?email=...` - Get order details (requires email match)

### Admin Endpoints (require X-Admin-Key header)
- `POST /admin/products` - Create product
- `PUT /admin/products/:id` - Update product
- `DELETE /admin/products/:id` - Soft delete product
- `GET /admin/orders` - List all orders

## Local Development

### 1. Start Hugo Server for Shop
```powershell
cd C:\Users\nickc\Dev\DiceBastion\shop
hugo server -D -p 1314
```

Shop will be available at http://localhost:1314/

### 2. Worker API (already running)
Your existing Worker at `https://dicebastion-memberships.ncalamaro.workers.dev` now includes product endpoints.

Test the schema:
```powershell
cd C:\Users\nickc\Dev\DiceBastion\worker
wrangler dev
```

## Deployment

### 1. Deploy Worker (with new product tables)
```powershell
cd C:\Users\nickc\Dev\DiceBastion\worker
wrangler deploy
```

The schema will auto-create the new tables on first request.

### 2. Build Shop Site
```powershell
cd C:\Users\nickc\Dev\DiceBastion\shop
hugo --minify
```

### 3. Deploy to Cloudflare Pages

**Option A: Via Wrangler**
```powershell
cd C:\Users\nickc\Dev\DiceBastion\shop
wrangler pages deploy public --project-name=dicebastion-shop
```

**Option B: Via Cloudflare Dashboard**
1. Go to Cloudflare Pages
2. Create new project
3. Connect to Git repo (or direct upload)
4. Build settings:
   - Build command: `hugo --minify`
   - Build output: `public`
   - Root directory: `shop`

### 4. Configure Custom Domain
In Cloudflare Pages project settings:
- Add custom domain: `shop.dicebastion.com`
- DNS will auto-configure

## Environment Variables

Add to Worker (`wrangler.toml` or dashboard):

```toml
[env.production.vars]
ADMIN_KEY = "your-secure-random-key-here"
```

Generate a secure admin key:
```powershell
[System.Convert]::ToBase64String((1..32 | % { Get-Random -Max 256 }))
```

## Admin Operations

### Create a Product
```bash
curl -X POST https://dicebastion-memberships.ncalamaro.workers.dev/admin/products \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Warhammer 40K Starter Set",
    "slug": "wh40k-starter-set",
    "description": "Complete starter set for Warhammer 40,000",
    "price": 8500,
    "currency": "GBP",
    "stock_quantity": 10,
    "category": "Miniatures",
    "image_url": "https://example.com/image.jpg"
  }'
```

### Update Product
```bash
curl -X PUT https://dicebastion-memberships.ncalamaro.workers.dev/admin/products/1 \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "stock_quantity": 15,
    "price": 7999
  }'
```

### List Products (Public)
```bash
curl https://dicebastion-memberships.ncalamaro.workers.dev/products
```

## Next Steps (TODO)

### Shopping Cart
- [ ] Implement session-based cart (localStorage + API sync)
- [ ] Add/remove items
- [ ] Update quantities
- [ ] Cart persistence

### Checkout
- [ ] Create order from cart
- [ ] Integrate SumUp checkout
- [ ] Handle payment webhooks for orders
- [ ] Send order confirmation emails
- [ ] Reduce stock quantities

### Admin Dashboard
- [ ] Create HTML admin interface
- [ ] Product management UI
- [ ] Order management
- [ ] Inventory tracking
- [ ] Sales reports

### Invoice Generation
- [ ] PDF invoice creation
- [ ] Email invoices automatically
- [ ] Gibraltar-compliant formatting

### Shipping
- [ ] Shipping calculator
- [ ] Local pickup option
- [ ] Order status updates
- [ ] Tracking integration

## Gibraltar Compliance Notes

- **No VAT**: Gibraltar has no VAT, simplifying tax calculations
- **Currency**: Pounds Sterling (GBP)
- **GDPR**: Follows UK GDPR requirements
- **Invoices**: Must include:
  - Business name and address
  - Customer name and address
  - Order number
  - Date
  - Itemized products
  - Total amount

## Security Considerations

- ✅ Admin endpoints protected with API key
- ✅ Order access requires email verification
- ✅ Payment processing handled by SumUp (PCI compliant)
- ✅ HTTPS enforced
- ⚠️ TODO: Add rate limiting
- ⚠️ TODO: Add CORS configuration
- ⚠️ TODO: Add more robust admin authentication

## Support

- Main site: https://dicebastion.com
- Shop site: https://shop.dicebastion.com (when deployed)
- API: https://dicebastion-memberships.ncalamaro.workers.dev
- Email: contact@dicebastion.com
