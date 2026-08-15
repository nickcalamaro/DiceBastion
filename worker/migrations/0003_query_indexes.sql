-- Query indexes for admin activity feed, checkout, and common lookups.
-- Safe to re-run (IF NOT EXISTS).

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_memberships_status_start ON memberships(status, start_date);
CREATE INDEX IF NOT EXISTS idx_memberships_end_date ON memberships(end_date);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON memberships(user_id, status);

CREATE INDEX IF NOT EXISTS idx_transactions_type_status_created
  ON transactions(transaction_type, payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_ref_type ON transactions(reference_id, transaction_type);

CREATE INDEX IF NOT EXISTS idx_tickets_status_created ON tickets(status, created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);

CREATE INDEX IF NOT EXISTS idx_orders_payment_created ON orders(payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON orders(completed_at);

CREATE INDEX IF NOT EXISTS idx_sponsored_status_purchased ON sponsored_memberships(status, purchased_at);
CREATE INDEX IF NOT EXISTS idx_sponsored_claimed_at ON sponsored_memberships(claimed_at);

CREATE INDEX IF NOT EXISTS idx_promo_codes_active_code ON promo_codes(active, code);

CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(event_datetime);
