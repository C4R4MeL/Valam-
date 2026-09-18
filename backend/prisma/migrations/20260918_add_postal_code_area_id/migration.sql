-- AlterTable: Add Biteship address fields to profiles (buyer)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "postal_code" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "area_id" TEXT;

-- AlterTable: Add Biteship address fields to supplier_profiles
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "postal_code" TEXT;
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "area_id" TEXT;
