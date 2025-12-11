# Dice Bastion Shop API Reference

## Base URL
```
https://dicebastion-memberships.ncalamaro.workers.dev
```

## Authentication

Admin endpoints require the `X-Admin-Key` header:

```
X-Admin-Key: 0gEsjztl1DaokFPH63XQ5C4NGReUT9Ju
```

## Admin Page Access

**URL:** https://shop.dicebastion.com/admin

**Password:** `0gEsjztl1DaokFPH63XQ5C4NGReUT9Ju`

(Same as the API admin key)

---

## Public Endpoints

### Get All Products
```http
GET /products
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Warhammer 40K Starter Set",
    "slug": "warhammer-40k-starter-set",
    "description": "Complete starter set for Warhammer 40,000",
    "price": 8500,
    "currency": "GBP",
    "stock_quantity": 5,
    "image_url": "https://...",
    "category": "Warhammer",
    "is_active": 1,
    "created_at": "2025-11-27T18:19:56.474Z",
    "updated_at": "2025-11-27T18:19:56.474Z"
  }
]
```

### Get Single Product
```http
GET /products/{slug}
```

**Example:**
```http
GET /products/warhammer-40k-starter-set
```

### Get Order Details
```http
GET /orders/{orderNumber}?email={customerEmail}
```

**Example:**
```http
GET /orders/ORD-1732734958-AB12?email=customer@example.com
```

**Response:**
```json
{
  "id": 1,
  "order_number": "ORD-1732734958-AB12",
  "email": "customer@example.com",
  "name": "John Doe",
  "status": "completed",
  "subtotal": 8500,
  "tax": 0,
  "shipping": 400,
  "total": 8900,
  "currency": "GBP",
  "payment_status": "paid",
  "shipping_address": "{\"line1\":\"123 Main St\",\"city\":\"Gibraltar\"}",
  "notes": null,
  "created_at": "2025-11-27T18:30:00.000Z",
  "completed_at": "2025-11-27T18:31:00.000Z",
  "items": [
    {
      "id": 1,
      "order_id": 1,
      "product_id": 1,
      "product_name": "Warhammer 40K Starter Set",
      "quantity": 1,
      "unit_price": 8500,
      "subtotal": 8500
    }
  ]
}
```

---

## Shop Endpoints

### Create Checkout
```http
POST /shop/checkout
Content-Type: application/json

{
  "email": "customer@example.com",
  "name": "John Doe",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "delivery_method": "collection",
  "shipping_address": {
    "line1": "123 Main St",
    "line2": "Apt 4",
    "city": "Gibraltar",
    "postcode": "GX11 1AA",
    "country": "GI"
  },
  "notes": "Please handle with care",
  "consent_at": "2025-11-27T18:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "order_number": "ORD-1732734958-AB12",
  "widget": {
    "amount": 89.00,
    "currency": "GBP",
    "checkout_reference": "ORD-1732734958-AB12",
    "merchant_code": "MUZHYEAH"
  }
}
```

### Confirm Payment
```http
POST /shop/confirm-payment/{orderNumber}
```

**Example:**
```http
POST /shop/confirm-payment/ORD-1732734958-AB12
```

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "order": {
    "id": 1,
    "order_number": "ORD-1732734958-AB12",
    "status": "completed",
    "payment_status": "paid"
  }
}
```

---

## Admin Endpoints

All admin endpoints require authentication via `X-Admin-Key` header.

### Create Product
```http
POST /admin/products
X-Admin-Key: 0gEsjztl1DaokFPH63XQ5C4NGReUT9Ju
Content-Type: application/json

{
  "name": "Product Name",
  "slug": "product-name",
  "description": "Product description",
  "price": 5000,
  "currency": "GBP",
  "stock_quantity": 10,
  "image_url": "https://example.com/image.jpg",
  "category": "Board Games"
}
```

**Notes:**
- `price` is in pence (£50.00 = 5000)
- `slug` must be unique
- `currency` defaults to "GBP"
- `stock_quantity` defaults to 0

**Response:**
```json
{
  "success": true,
  "product_id": 4
}
```

**Errors:**
- `400` - `slug_already_exists`: Slug is already in use
- `400` - `missing_required_fields`: name, slug, or price missing
- `401` - `unauthorized`: Invalid admin key

### Update Product
```http
PUT /admin/products/{id}
X-Admin-Key: 0gEsjztl1DaokFPH63XQ5C4NGReUT9Ju
Content-Type: application/json

{
  "name": "Updated Product Name",
  "price": 6000,
  "stock_quantity": 15,
  "is_active": 1
}
```

**Notes:**
- Only include fields you want to update
- `is_active`: 1 = active, 0 = inactive
- All fields are optional

**Response:**
```json
{
  "success": true
}
```

### Delete Product (Soft Delete)
```http
DELETE /admin/products/{id}
X-Admin-Key: 0gEsjztl1DaokFPH63XQ5C4NGReUT9Ju
```

**Notes:**
- This is a soft delete (sets `is_active = 0`)
- Product remains in database but won't appear in shop

**Response:**
```json
{
  "success": true
}
```

---

## Webhook Endpoints

### SumUp Shop Payment Webhook
```http
POST /webhooks/sumup/shop-payment
Content-Type: application/json

{
  "id": "checkout_id",
  "checkout_reference": "ORD-1732734958-AB12",
  "status": "PAID",
  "amount": 89.00,
  "currency": "GBP"
}
```

**Notes:**
- Automatically called by SumUp when payment completes
- Reduces stock and sends confirmation email
- Requires SumUp webhook configuration

---

## Database Schema

### Products Table
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,           -- In pence
  currency TEXT DEFAULT 'GBP',
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

### Orders Table
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',     -- pending, completed, cancelled
  subtotal INTEGER NOT NULL,
  tax INTEGER DEFAULT 0,
  shipping INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  currency TEXT DEFAULT 'GBP',
  checkout_id TEXT,
  payment_id TEXT,
  payment_status TEXT,               -- pending, paid, failed
  shipping_address TEXT,             -- JSON string
  billing_address TEXT,              -- JSON string
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
)
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
)
```

---

## Example Usage (PowerShell)

### Add a Product
```powershell
$headers = @{
    "X-Admin-Key" = "0gEsjztl1DaokFPH63XQ5C4NGReUT9Ju"
    "Content-Type" = "application/json"
}

$product = @{
    name = "Citadel Paint Starter Set"
    slug = "citadel-paint-set"
    description = "Essential paint set for miniatures"
    price = 2800
    stock_quantity = 15
    category = "Painting"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://dicebastion-memberships.ncalamaro.workers.dev/admin/products" -Method Post -Headers $headers -Body $product
```

### Update Stock
```powershell
$headers = @{
    "X-Admin-Key" = "0gEsjztl1DaokFPH63XQ5C4NGReUT9Ju"
    "Content-Type" = "application/json"
}

$update = @{
    stock_quantity = 20
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://dicebastion-memberships.ncalamaro.workers.dev/admin/products/1" -Method Put -Headers $headers -Body $update
```

### Get All Products
```powershell
Invoke-RestMethod -Uri "https://dicebastion-memberships.ncalamaro.workers.dev/products"
```

---

## Price Formatting

All prices are stored in **pence** (smallest currency unit):

- £10.00 = 1000 pence
- £85.50 = 8550 pence
- £4.00 = 400 pence

**To convert:**
- Pounds to pence: `price * 100`
- Pence to pounds: `price / 100`

---

## Payment Flow

1. **Customer adds items to cart** → Stored in `localStorage`
2. **Customer goes to checkout** → Enters details, selects delivery
3. **Frontend calls** `POST /shop/checkout` → Creates order with status "pending"
4. **Backend returns** SumUp widget configuration
5. **SumUp widget loads** → Customer enters card details
6. **Payment completes** → SumUp calls webhook OR frontend polls confirmation endpoint
7. **Webhook/Confirmation** processes payment:
   - Updates order status to "completed"
   - Reduces stock for each product
   - Sends invoice email via MailerSend
8. **Customer sees** order confirmation page

---

## Environment Variables

Required in Worker (wrangler.toml):

```toml
[vars]
SUMUP_MERCHANT_CODE = "MUZHYEAH"
ALLOWED_ORIGIN = "http://localhost:1313,http://localhost:1314,https://dicebastion.com,https://www.dicebastion.com,https://shop.dicebastion.com,https://dicebastion-shop.pages.dev"
```

Required secrets (set via `wrangler secret put`):

```bash
ADMIN_KEY=0gEsjztl1DaokFPH63XQ5C4NGReUT9Ju
SUMUP_ACCESS_TOKEN=<your_token>
MAILERSEND_API_KEY=<your_key>
MAILERSEND_FROM_EMAIL=<your_email>
```

---

## Support & Troubleshooting

### Common Issues

**CORS Error:**
- Ensure your domain is in `ALLOWED_ORIGIN` environment variable
- Redeploy Worker after updating

**Payment Not Confirming:**
- Check order status: `GET /orders/{orderNumber}?email={email}`
- Manually confirm: `POST /shop/confirm-payment/{orderNumber}`
- Check Worker logs for errors

**Stock Not Reducing:**
- Verify webhook is configured in SumUp dashboard
- Check order `payment_status` is "paid"
- Check Worker logs for stock reduction messages

**Admin Page Not Loading:**
- Clear browser cache
- Check you're using correct password
- Verify shop deployment is up to date

---

## Contact

For issues or questions:
- Email: support@dicebastion.com
- Main Site: https://dicebastion.com
- Shop: https://shop.dicebastion.com
