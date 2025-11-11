-- Add audit/idempotency/payment columns to memberships and create tickets table with full schema
-- This migration formalizes what ensureSchema() was adding at runtime.

-- Memberships extra columns (skip if already exist)
ALTER TABLE memberships ADD COLUMN amount TEXT;
ALTER TABLE memberships ADD COLUMN currency TEXT;
ALTER TABLE memberships ADD COLUMN consent_at TEXT;
ALTER TABLE memberships ADD COLUMN idempotency_key TEXT;
ALTER TABLE memberships ADD COLUMN payment_status TEXT;
-- created_at already existed in 0001_init

CREATE INDEX IF NOT EXISTS idx_memberships_idem ON memberships(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_memberships_payment_status ON memberships(payment_status);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  order_ref TEXT UNIQUE,
  checkout_id TEXT,
  payment_id TEXT,
  amount TEXT,
  currency TEXT,
  consent_at TEXT,
  idempotency_key TEXT,
  payment_status TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(member_id) REFERENCES members(id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_member ON tickets(member_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_idem ON tickets(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_tickets_order_ref ON tickets(order_ref);
