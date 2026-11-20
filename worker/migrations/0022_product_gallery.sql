-- Extra product photos for the product page carousel.
-- image_url stays the main image for the shop list, cart, and link previews.
-- gallery_urls is a JSON array of additional image URLs.

ALTER TABLE products ADD COLUMN gallery_urls TEXT;
