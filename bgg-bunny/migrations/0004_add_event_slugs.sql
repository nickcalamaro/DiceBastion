-- Migration: Add slugs to existing events
-- This ensures all events have slugs for shareable URLs

-- Update events that don't have slugs
UPDATE events 
SET slug = lower(
  replace(
    replace(
      replace(
        replace(
          replace(
            replace(event_name, ' ', '-'),
          '?', ''),
        '!', ''),
      '.', ''),
    ',', ''),
  '''', '')
) || '-' || event_id
WHERE slug IS NULL OR slug = '';

-- Create unique index on slug if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
