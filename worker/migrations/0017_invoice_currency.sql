-- Supplier invoice currency: foreign unit costs with GBP settlement for books/COGS.

ALTER TABLE supplier_bills ADD COLUMN invoice_currency TEXT NOT NULL DEFAULT 'GBP';
ALTER TABLE supplier_bills ADD COLUMN settlement_amount_pence INTEGER;

ALTER TABLE stock_import_sessions ADD COLUMN invoice_currency TEXT NOT NULL DEFAULT 'GBP';
ALTER TABLE stock_import_sessions ADD COLUMN settlement_amount_pence INTEGER;
ALTER TABLE stock_import_sessions ADD COLUMN foreign_goods_total_minor INTEGER;

ALTER TABLE stock_import_lines ADD COLUMN unit_foreign_minor INTEGER;

ALTER TABLE stock_lots ADD COLUMN unit_foreign_minor INTEGER;
