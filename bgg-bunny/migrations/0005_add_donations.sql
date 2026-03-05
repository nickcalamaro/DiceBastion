-- Donations table for fundraiser campaigns
CREATE TABLE IF NOT EXISTS donations (
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

CREATE INDEX idx_donations_campaign ON donations(campaign);
CREATE INDEX idx_donations_status ON donations(payment_status);
CREATE INDEX idx_donations_order_ref ON donations(order_ref);
