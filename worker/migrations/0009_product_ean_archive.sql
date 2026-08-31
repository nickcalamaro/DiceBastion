-- Keep cleaned-up import products in the database (hidden from the shop) and
-- match them on later imports by EAN so editorial fields can be restored.
-- catalog_status: 'listed' (default) | 'archived' (hidden after import cleanup).

ALTER TABLE products ADD COLUMN ean TEXT;
ALTER TABLE products ADD COLUMN catalog_status TEXT DEFAULT 'listed';

CREATE INDEX IF NOT EXISTS idx_products_ean ON products (ean);
CREATE INDEX IF NOT EXISTS idx_products_catalog_status ON products (catalog_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_ean_unique
  ON products (ean)
  WHERE ean IS NOT NULL AND TRIM(ean) != '';
