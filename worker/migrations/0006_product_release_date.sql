-- Add release_date column for pre-order functionality
-- If release_date is not null and in the future, product is a pre-order

ALTER TABLE products ADD COLUMN release_date TEXT;

-- release_date should be in ISO 8601 format (YYYY-MM-DD)
-- NULL = not a pre-order (regular product)
-- Future date = pre-order with expected release date
-- Past date = was a pre-order, now available
