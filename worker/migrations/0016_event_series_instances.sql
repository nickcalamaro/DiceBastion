-- Recurring event series: template row + materialized session instances.
-- series_id NULL + is_recurring=1 => series template (public slug lives here).
-- series_id set => session instance (own tickets_sold, event_datetime, occurrence_key).

ALTER TABLE events ADD COLUMN series_id INTEGER REFERENCES events(event_id);
ALTER TABLE events ADD COLUMN occurrence_key TEXT;

CREATE INDEX IF NOT EXISTS idx_events_series_id ON events(series_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_series_occurrence ON events(series_id, occurrence_key)
  WHERE series_id IS NOT NULL AND occurrence_key IS NOT NULL AND TRIM(occurrence_key) != '';
