-- Migration 0010: Add recurring events support

ALTER TABLE events ADD COLUMN is_recurring INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN recurrence_pattern TEXT;
ALTER TABLE events ADD COLUMN recurrence_end_date TEXT;

-- recurrence_pattern examples:
-- {"type":"weekly","day":5,"time":"18:00"}  -- Every Friday at 6pm
-- {"type":"monthly_day","week":1,"day":0,"time":"14:00"}  -- First Sunday at 2pm
-- {"type":"monthly_date","date":15,"time":"19:30"}  -- 15th of each month at 7:30pm
