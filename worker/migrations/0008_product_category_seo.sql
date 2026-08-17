-- Optional per-category SEO overrides for shop.dicebastion.com/products/category/:name
ALTER TABLE product_categories ADD COLUMN seo_title TEXT;
ALTER TABLE product_categories ADD COLUMN seo_description TEXT;
ALTER TABLE product_categories ADD COLUMN seo_image TEXT;
