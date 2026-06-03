-- Store SumUp checkout id so booking confirmation can verify payment before sending emails.
ALTER TABLE bookings ADD COLUMN sumup_checkout_id TEXT;
