-- Stock import sessions: one supplier receipt, with a row per item received against it.
-- Each session also creates a supplier bill so the lines flow into the shop accounts.

CREATE TABLE IF NOT EXISTS stock_import_sessions (
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
-- paid_from: 'bank' | 'cash' | 'owner'. NULL paid_date = unpaid.
-- supplier_bill_id: the bill whose total is the sum of this session's lines.

CREATE TABLE IF NOT EXISTS stock_import_lines (
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
-- entry_method: 'barcode' | 'manual'
-- lot_id: the stock batch created for this line (stock_lots).

CREATE INDEX IF NOT EXISTS idx_stock_import_lines_session ON stock_import_lines (session_id);
