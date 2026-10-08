-- Shop fulfilment: track whether an order has been delivered / handed over.

ALTER TABLE orders ADD COLUMN delivery_status TEXT DEFAULT 'undelivered';

-- All orders that already existed when this migration ran are treated as fulfilled.
UPDATE orders SET delivery_status = 'delivered';

CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders (delivery_status);
