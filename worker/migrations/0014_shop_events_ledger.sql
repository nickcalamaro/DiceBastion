-- Shop and events accounts: FIFO stock batches, cost movements, supplier bills,
-- other expenses, owner money in/out, and finance settings (books start date).
-- Products only count toward these accounts once they have a stock batch (cost_tracked = 1).

ALTER TABLE products ADD COLUMN cost_tracked INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS supplier_bills (
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
-- paid_from: 'bank' | 'cash' | 'owner' (paid personally; counts as owner capital). NULL paid_date = unpaid.

CREATE TABLE IF NOT EXISTS stock_lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  received_date TEXT NOT NULL,
  supplier TEXT,
  quantity_received INTEGER NOT NULL,
  quantity_remaining INTEGER NOT NULL,
  unit_cost_pence INTEGER NOT NULL,
  supplier_bill_id INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (supplier_bill_id) REFERENCES supplier_bills(id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
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
-- movement_type: 'sale' | 'write_off'. lot_id NULL with reason 'no_cost_batch' = sold with no batch left.

CREATE TABLE IF NOT EXISTS business_expenses (
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

CREATE TABLE IF NOT EXISTS owner_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movement_date TEXT NOT NULL,
  type TEXT NOT NULL,
  account TEXT NOT NULL DEFAULT 'bank',
  amount_pence INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- type: 'capital_in' | 'drawing'. account: 'bank' | 'cash'.

CREATE TABLE IF NOT EXISTS finance_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_stock_lots_product ON stock_lots (product_id, received_date, id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_bill ON stock_lots (supplier_bill_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements (order_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements (occurred_at);
CREATE INDEX IF NOT EXISTS idx_supplier_bills_date ON supplier_bills (bill_date);
CREATE INDEX IF NOT EXISTS idx_business_expenses_date ON business_expenses (expense_date);
CREATE INDEX IF NOT EXISTS idx_owner_movements_date ON owner_movements (movement_date);
