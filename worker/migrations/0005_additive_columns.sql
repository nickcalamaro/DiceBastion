-- Columns previously added via runtime ALTER in the worker.
-- Run once on fresh databases; skip if columns already exist (duplicate column error is expected).

ALTER TABLE memberships ADD COLUMN is_free_trial INTEGER DEFAULT 0;
ALTER TABLE memberships ADD COLUMN trial_end_date TEXT;
ALTER TABLE memberships ADD COLUMN trial_reminder_sent INTEGER DEFAULT 0;

ALTER TABLE transactions ADD COLUMN sumup_transaction_code TEXT;
ALTER TABLE transactions ADD COLUMN sca_fired INTEGER DEFAULT NULL;

ALTER TABLE events ADD COLUMN image_url_card TEXT;
ALTER TABLE events ADD COLUMN image_url_hero TEXT;

ALTER TABLE orders ADD COLUMN promo_code_id INTEGER;
ALTER TABLE orders ADD COLUMN discount_pence INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN promo_code_applied TEXT;
