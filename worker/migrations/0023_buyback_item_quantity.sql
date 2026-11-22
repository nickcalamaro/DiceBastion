-- Quantity on a trade-in line. Staff CSV imports store one row per card name
-- and keep the file quantity here. line_quote_pence is the offer for the whole line.
ALTER TABLE buyback_case_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
