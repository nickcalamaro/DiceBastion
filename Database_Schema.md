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
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
, password_hash TEXT, is_admin INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, last_login_at TEXT, updated_at TEXT);
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
        updated_at TEXT
      );
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
      , summary TEXT, full_description TEXT, release_date TEXT);
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
, is_recurring INTEGER DEFAULT 0, recurrence_pattern TEXT, recurrence_end_date TEXT);
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
