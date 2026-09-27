-- Store credit ledger + TCG buyback cases.
-- Run once on D1. Duplicate-column errors on ALTER are expected if already applied.

ALTER TABLE users ADD COLUMN store_credit_pence INTEGER NOT NULL DEFAULT 0;

ALTER TABLE orders ADD COLUMN credit_applied_pence INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN card_charged_pence INTEGER;

ALTER TABLE transactions ADD COLUMN credit_applied_pence INTEGER NOT NULL DEFAULT 0;
ALTER TABLE transactions ADD COLUMN card_charged_pence INTEGER;

CREATE TABLE IF NOT EXISTS store_credit_ledger (
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

CREATE INDEX IF NOT EXISTS idx_store_credit_ledger_user_id
  ON store_credit_ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS buyback_cases (
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

CREATE INDEX IF NOT EXISTS idx_buyback_cases_user_id ON buyback_cases(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buyback_cases_status ON buyback_cases(status, created_at DESC);

CREATE TABLE IF NOT EXISTS buyback_case_items (
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

CREATE INDEX IF NOT EXISTS idx_buyback_case_items_case_id ON buyback_case_items(case_id);
