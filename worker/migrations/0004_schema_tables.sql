-- Tables previously created at runtime in the worker. Apply once per environment.

CREATE TABLE IF NOT EXISTS promo_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  label TEXT,
  discount_type TEXT NOT NULL,
  discount_value INTEGER NOT NULL,
  rules_json TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1,
  starts_at TEXT,
  ends_at TEXT,
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  min_subtotal_pence INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sponsored_memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchased_by_email TEXT NOT NULL,
  purchased_by_name TEXT,
  purchased_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  order_ref TEXT UNIQUE NOT NULL,
  amount_paid REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','available','claimed','refunded')),
  claimed_by_user_id INTEGER,
  claimed_at TEXT,
  FOREIGN KEY (claimed_by_user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
