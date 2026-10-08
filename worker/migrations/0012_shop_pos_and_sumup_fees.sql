-- Shop POS: payment method + sale channel on orders; SumUp payout fee sync table.

ALTER TABLE orders ADD COLUMN payment_method TEXT;
ALTER TABLE orders ADD COLUMN sale_channel TEXT;

-- Existing SumUp-paid orders (checkout or payment id present)
UPDATE orders
SET payment_method = 'sumup'
WHERE payment_method IS NULL
  AND (
    (checkout_id IS NOT NULL AND TRIM(checkout_id) != '')
    OR (payment_id IS NOT NULL AND TRIM(payment_id) != '')
  );

-- Online shop (non walk-in) SumUp checkouts → online. Walk-in drinks leave sale_channel NULL
-- until a drinks-specific channel is introduced; admin POS always sets sale_channel='pos'.
UPDATE orders
SET sale_channel = 'online'
WHERE sale_channel IS NULL
  AND IFNULL(payment_method, '') = 'sumup'
  AND NOT (name = 'Walk-in' OR lower(email) = 'walk-in');

CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders (payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_sale_channel ON orders (sale_channel);

CREATE TABLE IF NOT EXISTS sumup_payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sumup_id INTEGER NOT NULL UNIQUE,
  type TEXT NOT NULL,
  amount_pence INTEGER NOT NULL,
  fee_pence INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  payout_date TEXT NOT NULL,
  status TEXT,
  reference TEXT,
  transaction_code TEXT,
  synced_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sumup_payouts_date ON sumup_payouts (payout_date);
