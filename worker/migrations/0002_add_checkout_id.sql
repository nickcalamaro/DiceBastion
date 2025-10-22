-- Add checkout_id column for OAuth2 confirm flow (id from SumUp checkout)
ALTER TABLE memberships ADD COLUMN checkout_id TEXT;

-- Optional: index for lookups by order_ref/checkout_id
CREATE INDEX IF NOT EXISTS idx_memberships_order_ref ON memberships(order_ref);
CREATE INDEX IF NOT EXISTS idx_memberships_checkout_id ON memberships(checkout_id);
