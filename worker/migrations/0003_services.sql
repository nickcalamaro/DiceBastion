-- filepath: worker/migrations/0003_services.sql
-- Create a services table to store plan/pricing metadata
-- Codes should match existing plan identifiers used by the frontend: monthly, quarterly, annual

CREATE TABLE IF NOT EXISTS services (
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

-- Seed default membership plans if not present
INSERT OR IGNORE INTO services (code, name, description, amount, currency, months, active) VALUES
  ('monthly',   'Monthly Membership',   'One month membership',      '10.00', 'GBP', 1, 1),
  ('quarterly', 'Quarterly Membership', 'Three months membership',   '25.00', 'GBP', 3, 1),
  ('annual',    'Annual Membership',    'Twelve months membership',  '90.00', 'GBP', 12, 1);

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_services_code ON services(code);
