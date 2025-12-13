-- Migration 0009: Fix event_id to use proper SQLite auto-increment
-- SQLite requires INTEGER PRIMARY KEY (not SERIAL) for auto-increment

-- Create new events table with correct schema
CREATE TABLE events_new (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    description TEXT,
    event_datetime TEXT NOT NULL,
    location TEXT,
    membership_price REAL NOT NULL DEFAULT 0,
    non_membership_price REAL NOT NULL DEFAULT 0,
    capacity INTEGER,
    tickets_sold INTEGER DEFAULT 0,
    category TEXT,
    image_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    slug TEXT,
    full_description TEXT,
    requires_purchase INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1
);

-- Copy existing data
INSERT INTO events_new SELECT * FROM events;

-- Drop old table
DROP TABLE events;

-- Rename new table
ALTER TABLE events_new RENAME TO events;

-- Recreate index
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
