-- Migration 0007: Convert category to categories (multi-category support)
-- Changes single category field to support up to 3 categories per product

-- The category field will now store comma-separated category names
-- Example: "Dice,Accessories" or "Miniatures,Paint,Brushes"
-- We keep it as TEXT for backward compatibility but the app will enforce max 3 categories

-- No schema change needed - just renaming conceptually
-- The existing 'category' column in products table will be used for comma-separated categories
-- Format: "Category1,Category2,Category3" (max 3)
