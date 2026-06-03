-- Run against Bunny Database (libSQL). Adds per-weekday booking hour overrides.
-- Example: Tuesday and Thursday only from 6pm (18:00):
--   UPDATE booking_config
--   SET day_hour_rules = '[{"days":["Tuesday","Thursday"],"start_hour":18}]'
--   WHERE id = 1;

ALTER TABLE booking_config ADD COLUMN day_hour_rules TEXT;
