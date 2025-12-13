-- Migration 0008: Events enhancements for admin dashboard and public pages
-- Adds slug, full_description, requires_purchase, and is_active fields

-- Add slug for URL-friendly event pages
ALTER TABLE events ADD COLUMN slug TEXT;

-- Add full description with HTML support (like products)
ALTER TABLE events ADD COLUMN full_description TEXT;

-- Add flag to indicate if purchase is required
ALTER TABLE events ADD COLUMN requires_purchase INTEGER DEFAULT 1;

-- Add active/inactive flag for draft events
ALTER TABLE events ADD COLUMN is_active INTEGER DEFAULT 1;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
