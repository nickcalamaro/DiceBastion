-- Add summary and full_description columns to products table
-- Keep existing description as the summary, add full_description for rich text

ALTER TABLE products ADD COLUMN summary TEXT;
ALTER TABLE products ADD COLUMN full_description TEXT;

-- Copy existing description values to summary
UPDATE products SET summary = description WHERE description IS NOT NULL;
