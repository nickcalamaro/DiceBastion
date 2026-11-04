-- Slim Magic card catalog for trade-in search. One row per printing, no image files.
-- Filled by .github/workflows/mtgjson-sync.yml, not by the request path.

CREATE TABLE IF NOT EXISTS mtg_printings (
  scryfall_id TEXT PRIMARY KEY,
  oracle_id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  printed_name TEXT,
  lang TEXT,
  set_code TEXT,
  set_name TEXT,
  collector_number TEXT,
  released_at TEXT,
  image_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_mtg_printings_name_key ON mtg_printings (name_key);
CREATE INDEX IF NOT EXISTS idx_mtg_printings_oracle ON mtg_printings (oracle_id, released_at);

CREATE TABLE IF NOT EXISTS mtg_sets (
  code TEXT PRIMARY KEY,
  name TEXT,
  release_date TEXT,
  total_set_size INTEGER NOT NULL DEFAULT 0,
  imported_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mtg_catalog (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  print_count INTEGER NOT NULL DEFAULT 0,
  seeded_at TEXT,
  updated_at TEXT
);
