-- Door ticket sales store how the customer paid. NULL remains an online SumUp charge.
-- Duplicate column errors are expected if the worker already added this at runtime.

ALTER TABLE transactions ADD COLUMN payment_method TEXT;
