-- Name and word indexes so a search reads matching names, not every printing.

CREATE TABLE IF NOT EXISTS mtg_names (
  name_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scryfall_id TEXT NOT NULL,
  printed_name TEXT,
  lang TEXT,
  set_code TEXT,
  set_name TEXT,
  collector_number TEXT,
  released_at TEXT,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS mtg_name_words (
  word TEXT NOT NULL,
  name_key TEXT NOT NULL,
  PRIMARY KEY (word, name_key)
);
