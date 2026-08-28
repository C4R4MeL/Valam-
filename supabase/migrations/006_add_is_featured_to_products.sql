-- Add is_featured column to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN DEFAULT false;
