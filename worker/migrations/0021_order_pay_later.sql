-- Pay later shop orders: stock is taken at payment, accounts wait until delivery.

ALTER TABLE orders ADD COLUMN pay_later INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN delivered_at TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_pay_later ON orders (pay_later);
