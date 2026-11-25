-- Featured products/categories cards shown at the top of shop.dicebastion.com.
-- Four slots (0-3). kind = 'product' (ref = products.id) or 'category' (ref = category name).
-- custom_name / image_url override the product name/image or category name/featured image.

CREATE TABLE IF NOT EXISTS shop_featured_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot INTEGER NOT NULL UNIQUE,        -- 0-3, display order left to right
  kind TEXT NOT NULL CHECK (kind IN ('product', 'category')),
  ref TEXT NOT NULL,                   -- products.id as text, or category name
  custom_name TEXT,                    -- optional display name override
  image_url TEXT,                      -- optional image override (defaults: product image / category featured image)
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_shop_featured_cards_slot
  ON shop_featured_cards (slot);
