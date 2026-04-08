-- Add demo_video column to products table (required by US-34)
ALTER TABLE products ADD COLUMN IF NOT EXISTS demo_video VARCHAR(500);
