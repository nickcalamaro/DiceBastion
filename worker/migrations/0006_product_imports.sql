-- Product CSV import batches for temporary distributor catalogues.
-- Safe cleanup: hard-delete unsold; keep sold products (referenced by order_items).

CREATE TABLE IF NOT EXISTS product_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  source_filename TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT,
  product_count INTEGER DEFAULT 0,
  cleaned_at TEXT
);

-- May error if column already exists on re-run; that is expected.
ALTER TABLE products ADD COLUMN import_batch_id INTEGER;
