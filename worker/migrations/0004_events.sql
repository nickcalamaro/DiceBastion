-- Create events table
CREATE TABLE IF NOT EXISTS events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  description TEXT,
  event_datetime TEXT NOT NULL,
  location TEXT,
  membership_price TEXT NOT NULL,
  non_membership_price TEXT NOT NULL,
  capacity INTEGER,
  tickets_sold INTEGER DEFAULT 0,
  category TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(event_datetime);
