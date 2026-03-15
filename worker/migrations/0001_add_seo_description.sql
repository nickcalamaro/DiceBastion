-- Add SEO description column to events table
-- This allows admins to set a custom meta description for event share links
-- Falls back to the regular description if not set
ALTER TABLE events ADD COLUMN seo_description TEXT;
