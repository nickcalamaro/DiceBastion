PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,            -- e.g. 'monthly', 'quarterly', 'annual'
  name TEXT,                            -- display name
  description TEXT,                     -- optional longer description
  amount TEXT NOT NULL,                 -- price as string (e.g. '10.00')
  currency TEXT NOT NULL DEFAULT 'GBP', -- ISO currency, e.g. 'GBP'
  months INTEGER NOT NULL,              -- duration in months to add
  active INTEGER NOT NULL DEFAULT 1,    -- 1 active, 0 inactive
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT
);
CREATE TABLE sponsored_memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchased_by_email TEXT NOT NULL,        -- email of the person who paid for the sponsorship
  purchased_by_name  TEXT,
  purchased_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  order_ref TEXT UNIQUE NOT NULL,          -- UUID order reference, linked to transactions table
  amount_paid REAL NOT NULL DEFAULT 0,     -- amount paid (annual plan price at purchase time)
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','available','claimed','refunded')),
                                           -- pending: awaiting payment, available: in the pool,
                                           -- claimed: used by a member, refunded: reversed
  claimed_by_user_id INTEGER,              -- FK to users.user_id once claimed
  claimed_at TEXT,
  FOREIGN KEY (claimed_by_user_id) REFERENCES users(user_id)
);
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
, password_hash TEXT, is_admin INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, last_login_at TEXT, updated_at TEXT
, store_credit_pence INTEGER NOT NULL DEFAULT 0);
-- store_credit_pence: cached balance; every change also appends store_credit_ledger.
CREATE TABLE memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan TEXT NOT NULL CHECK(plan IN ('monthly','quarterly','annual')),
  status TEXT NOT NULL CHECK(status IN ('pending','active','expired')) DEFAULT 'pending',
  start_date TEXT,
  end_date TEXT,
  payment_id TEXT UNIQUE,
  order_ref TEXT UNIQUE,
  auto_renew INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  checkout_id TEXT, amount TEXT, currency TEXT, consent_at TEXT, idempotency_key TEXT, payment_status TEXT, payment_instrument_id TEXT, renewal_failed_at TEXT, renewal_attempts INTEGER DEFAULT 0, renewal_warning_sent INTEGER DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(user_id)
);
CREATE TABLE payment_instruments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        instrument_id TEXT NOT NULL,
        card_type TEXT,
        last_4 TEXT,
        expiry_month INTEGER,
        expiry_year INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        UNIQUE(user_id, instrument_id)
      );
CREATE TABLE renewal_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        membership_id INTEGER NOT NULL,
        attempt_date TEXT NOT NULL,
        status TEXT NOT NULL,
        payment_id TEXT,
        error_message TEXT,
        amount TEXT,
        currency TEXT
      );
CREATE TABLE IF NOT EXISTS "tickets" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  amount TEXT,
  currency TEXT,
  consent_at TEXT,
  idempotency_key TEXT,
  payment_status TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_type TEXT NOT NULL,
        reference_id INTEGER,
        user_id INTEGER,
        email TEXT,
        name TEXT,
        order_ref TEXT UNIQUE,
        checkout_id TEXT,
        payment_id TEXT,
        amount TEXT,
        currency TEXT,
        payment_status TEXT,
        idempotency_key TEXT,
        consent_at TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT,
        sumup_transaction_code TEXT,
        sca_fired INTEGER DEFAULT NULL
      , credit_applied_pence INTEGER NOT NULL DEFAULT 0, card_charged_pence INTEGER);
-- credit_applied_pence / card_charged_pence: store-credit split for event tickets (pence).
CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        currency TEXT DEFAULT 'GBP',
        stock_quantity INTEGER DEFAULT 0,
        image_url TEXT,
        category TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      , summary TEXT, full_description TEXT, release_date TEXT, import_batch_id INTEGER, ean TEXT, catalog_status TEXT DEFAULT 'listed'
      , cost_tracked INTEGER DEFAULT 0);
-- catalog_status: 'listed' (in the shop when is_active = 1) | 'archived' (hidden after CSV import cleanup, kept for EAN restore).
-- cost_tracked: 1 once the product has a stock batch (stock_lots); stock then changes only via Receive stock / Write off / sales.

-- Shop and events accounts (migration 0014). Amounts in pence; dates YYYY-MM-DD.
CREATE TABLE supplier_bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier TEXT NOT NULL,
  bill_date TEXT NOT NULL,
  reference TEXT,
  total_pence INTEGER NOT NULL,
  paid_date TEXT,
  paid_from TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- paid_from: 'bank' | 'cash' | 'owner' (paid personally, counts as owner capital). NULL paid_date = unpaid.
-- Bill total minus the cost of its stock batches is expensed as "Supplier bill costs not in stock".
CREATE TABLE stock_lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  received_date TEXT NOT NULL,
  supplier TEXT,
  quantity_received INTEGER NOT NULL,
  quantity_remaining INTEGER NOT NULL,
  unit_cost_pence INTEGER NOT NULL,
  supplier_bill_id INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  lot_id INTEGER,
  order_id INTEGER,
  order_item_id INTEGER,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost_pence INTEGER NOT NULL DEFAULT 0,
  occurred_at TEXT NOT NULL,
  reason TEXT
);
-- movement_type: 'sale' (from decrementOrderStock, FIFO oldest batch first) | 'write_off'.
-- lot_id NULL + reason 'no_cost_batch': sold with no batch left, recorded at zero cost.
CREATE TABLE business_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_date TEXT NOT NULL,
  category TEXT NOT NULL,
  event_id INTEGER,
  description TEXT,
  amount_pence INTEGER NOT NULL,
  paid_date TEXT,
  paid_from TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- category: 'event_costs' | 'postage' | 'packaging' | 'supplies' | 'software' | 'other'
CREATE TABLE owner_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movement_date TEXT NOT NULL,
  type TEXT NOT NULL,
  account TEXT NOT NULL DEFAULT 'bank',
  amount_pence INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- type: 'capital_in' | 'drawing'. account: 'bank' | 'cash'.
CREATE TABLE finance_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
-- books_start_date: shop and ticket sales before this date are left out of Shop and events accounts.
CREATE TABLE stock_import_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier TEXT NOT NULL,
  received_date TEXT NOT NULL,
  reference TEXT,
  receipt_url TEXT,
  notes TEXT,
  paid_date TEXT,
  paid_from TEXT,
  supplier_bill_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- One supplier receipt. supplier_bill_id is the bill whose total is the sum of the session's stock lines.
-- This is separate from products.import_batch_id, which belongs to CSV catalog imports.
CREATE TABLE stock_import_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  ean TEXT,
  name TEXT,
  quantity INTEGER NOT NULL,
  unit_cost_pence INTEGER NOT NULL,
  entry_method TEXT NOT NULL,
  lot_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- entry_method: 'barcode' | 'manual'. lot_id is the stock batch created for the line.
CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        subtotal INTEGER NOT NULL,
        tax INTEGER DEFAULT 0,
        shipping INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        currency TEXT DEFAULT 'GBP',
        checkout_id TEXT,
        payment_id TEXT,
        payment_status TEXT,
        shipping_address TEXT,
        billing_address TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        completed_at TEXT
      , promo_code_id INTEGER, discount_pence INTEGER DEFAULT 0, promo_code_applied TEXT
      , credit_applied_pence INTEGER NOT NULL DEFAULT 0, card_charged_pence INTEGER
      , payment_method TEXT, sale_channel TEXT, delivery_status TEXT DEFAULT 'undelivered');
-- credit_applied_pence / card_charged_pence: store-credit split for shop orders (pence).
-- payment_method: 'sumup' | 'cash' | 'bank_transfer' | 'store_credit' (card_charged_pence = 0)
-- sale_channel: 'online' (shop website) | 'pos' (admin manual sale); drinks walk-ins leave NULL
-- delivery_status: 'undelivered' (default for new shop orders) | 'delivered'
CREATE TABLE sumup_payouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sumup_id INTEGER NOT NULL UNIQUE,
        type TEXT NOT NULL,
        amount_pence INTEGER NOT NULL,
        fee_pence INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'GBP',
        payout_date TEXT NOT NULL,
        status TEXT,
        reference TEXT,
        transaction_code TEXT,
        synced_at TEXT NOT NULL
      );
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
      );
CREATE TABLE cart_items (
        -- Reserved / unused for now. Active shop baskets are client-side only:
        -- localStorage key shop_cart + TTL cookie db_shop_basket_v1
        -- (see shop/static/js/shopCartStorage.js). Checkout writes orders/order_items.
        -- Wire this table only if adding abandoned-cart recovery or cross-device carts.
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        UNIQUE(session_id, product_id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
CREATE TABLE user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), last_activity TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS "events" (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    description TEXT,
    event_datetime TEXT NOT NULL,
    location TEXT,
    membership_price REAL NOT NULL DEFAULT 0,
    non_membership_price REAL NOT NULL DEFAULT 0,
    capacity INTEGER,
    tickets_sold INTEGER DEFAULT 0,
    category TEXT,
    image_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    slug TEXT,
    full_description TEXT,
    requires_purchase INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1
, is_recurring INTEGER DEFAULT 0, recurrence_pattern TEXT, recurrence_end_date TEXT, organiser TEXT, seo_description TEXT, seo_organizer TEXT, seo_image TEXT, end_time TEXT, series_id INTEGER REFERENCES events(event_id), occurrence_key TEXT);
CREATE TABLE email_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_type TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT,
        subject TEXT NOT NULL,
        template_used TEXT NOT NULL,
        related_id INTEGER,
        related_type TEXT,
        sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        status TEXT DEFAULT 'sent',
        error_message TEXT,
        metadata TEXT
      );
CREATE TABLE email_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  essential_emails BOOLEAN DEFAULT 1,
  marketing_emails BOOLEAN DEFAULT 0,
  consent_given BOOLEAN DEFAULT 0,
  consent_date TEXT,
  last_updated TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE newsletter_unsub_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  donor_name TEXT,
  donor_email TEXT,
  message TEXT,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  order_ref TEXT UNIQUE,
  checkout_id TEXT,
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  show_name INTEGER DEFAULT 0,
  show_message INTEGER DEFAULT 0,
  campaign TEXT DEFAULT 'pokemon-day-2026',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT
);
CREATE TABLE cron_job_log (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_name TEXT NOT NULL,              -- e.g., 'auto_renewals', 'event_reminders', 'payment_reconciliation'
  started_at TEXT NOT NULL,            -- ISO timestamp when job started
  completed_at TEXT,                   -- ISO timestamp when job completed
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'partial'
  records_processed INTEGER DEFAULT 0, -- Count of items processed
  records_succeeded INTEGER DEFAULT 0, -- Count of successful operations
  records_failed INTEGER DEFAULT 0,    -- Count of failed operations
  error_message TEXT,                  -- Error details if status is 'failed'
  details TEXT,                        -- JSON string with additional details
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
DELETE FROM sqlite_sequence;
CREATE INDEX idx_services_code ON services(code);
CREATE INDEX idx_memberships_idem ON memberships(idempotency_key);
CREATE INDEX idx_memberships_payment_status ON memberships(payment_status);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE UNIQUE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_cron_job_log_name_date 
  ON cron_job_log(job_name, started_at DESC);
CREATE INDEX idx_cron_job_log_status 
  ON cron_job_log(status, started_at DESC);
CREATE INDEX idx_donations_campaign ON donations(campaign);
CREATE INDEX idx_donations_status ON donations(payment_status);
CREATE INDEX idx_donations_order_ref ON donations(order_ref);
CREATE INDEX idx_newsletter_unsub_tokens_token ON newsletter_unsub_tokens(token);
CREATE INDEX idx_newsletter_unsub_tokens_user ON newsletter_unsub_tokens(user_id);
CREATE INDEX idx_newsletter_drafts_status ON newsletter_drafts(status);
CREATE INDEX idx_newsletter_drafts_scheduled ON newsletter_drafts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_memberships_status_start ON memberships(status, start_date);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_type_status_created ON transactions(transaction_type, payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_ref_type ON transactions(reference_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_tickets_status_created ON tickets(status, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_created ON orders(payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON orders(completed_at);
CREATE INDEX IF NOT EXISTS idx_sponsored_status_purchased ON sponsored_memberships(status, purchased_at);
CREATE INDEX IF NOT EXISTS idx_sponsored_claimed_at ON sponsored_memberships(claimed_at);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active_code ON promo_codes(active, code);
CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(event_datetime);
CREATE INDEX IF NOT EXISTS idx_events_series_id ON events(series_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_series_occurrence ON events(series_id, occurrence_key)
  WHERE series_id IS NOT NULL AND occurrence_key IS NOT NULL AND TRIM(occurrence_key) != '';

## blog_posts

Admin-managed blog posts stored in D1 and published to Hugo at deploy time via CI content generation.

```sql
CREATE TABLE blog_posts (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT    NOT NULL UNIQUE,
  title            TEXT    NOT NULL DEFAULT '',
  html             TEXT    NOT NULL DEFAULT '',
  excerpt          TEXT,
  featured_image   TEXT,
  featured_image_card TEXT,
  featured_image_hero TEXT,
  tags             TEXT    NOT NULL DEFAULT '[]',
  categories       TEXT    NOT NULL DEFAULT '[]',
  series           TEXT    NOT NULL DEFAULT '[]',
  authors          TEXT    NOT NULL DEFAULT '[]',
  status           TEXT    NOT NULL DEFAULT 'draft',  -- 'draft' | 'published'
  published_at     TEXT,
  seo_description  TEXT,
  seo_image        TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
```

## blog_authors

Author profiles referenced by the `authors` taxonomy on blog posts (maps to Hugo `data/authors/*.yaml`).

```sql
CREATE TABLE blog_authors (
  slug       TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  image      TEXT,
  bio        TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
```

## newsletter_drafts

Server-side persistent newsletter drafts with scheduling support.

```sql
CREATE TABLE newsletter_drafts (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  subject          TEXT    NOT NULL DEFAULT '',
  html             TEXT    NOT NULL DEFAULT '',
  status           TEXT    NOT NULL DEFAULT 'draft',  -- 'draft' | 'scheduled' | 'sent' | 'failed'
  scheduled_for    TEXT,            -- ISO 8601 datetime; NULL unless status = 'scheduled'
  sent_at          TEXT,            -- ISO 8601 datetime; set when status transitions to 'sent'
  recipients_count INTEGER,         -- number of recipients actually sent to
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
```

### Product categories (shop filter / search metadata)

Optional metadata for tags that appear on `products.category`. Does not replace product tags — only controls featured ordering on the shop chips and keyword aliases for search (e.g. `mtg` → Magic: The Gathering).

```sql
CREATE TABLE product_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,           -- must match a product category tag exactly
  featured INTEGER NOT NULL DEFAULT 0, -- 1 = pin to front of category chip list
  sort_order INTEGER NOT NULL DEFAULT 0,
  keywords TEXT,                      -- comma-separated aliases (e.g. "mtg, magic")
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
```

### Store credit + TCG buyback

Migration: `worker/migrations/0010_store_credit_buyback.sql`.

```sql
CREATE TABLE store_credit_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  delta_pence INTEGER NOT NULL,
  balance_after_pence INTEGER NOT NULL,
  entry_type TEXT NOT NULL CHECK(entry_type IN (
    'buyback_credit', 'shop_spend', 'event_spend', 'adjustment', 'void'
  )),
  reference_type TEXT,
  reference_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  note TEXT,
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE buyback_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN (
    'submitted', 'under_review', 'quoted', 'accepted', 'rejected', 'completed', 'cancelled'
  )),
  tos_accepted_at TEXT NOT NULL,
  game_systems_json TEXT,
  customer_notes TEXT,
  agreed_value_pence INTEGER,
  staff_comments TEXT,
  quoted_at TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE buyback_case_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  game_system TEXT NOT NULL CHECK(game_system IN ('mtg', 'riftbound')),
  external_id TEXT,
  card_name TEXT NOT NULL,
  set_code TEXT,
  set_name TEXT,
  collector_number TEXT,
  image_url TEXT,
  condition TEXT NOT NULL DEFAULT 'EX',
  language TEXT NOT NULL DEFAULT 'EN',
  notes TEXT,
  line_quote_pence INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (case_id) REFERENCES buyback_cases(id)
);
```
