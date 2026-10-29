-- Align historical manual Supabase DDL with the application without rewriting
-- business data. UTC keeps existing UTC timestamps intact on fresh installations.
SET TIME ZONE 'UTC';
ALTER TABLE "supplier_profiles"
  ALTER COLUMN "nama_koperasi" DROP NOT NULL,
  ALTER COLUMN "nib" DROP NOT NULL,
  ALTER COLUMN "npwp" DROP NOT NULL,
  ALTER COLUMN "alamat_lengkap" DROP NOT NULL,
  ALTER COLUMN "kapasitas_produksi" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "supplier_profiles_supplier_subtype_idx" ON "supplier_profiles"("supplier_subtype");
-- This fails instead of inventing a value if any old row is NULL.
ALTER TABLE "products" ALTER COLUMN "is_featured" SET NOT NULL;
ALTER TABLE "circular_products"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
  ALTER COLUMN "rejection_reason" DROP DEFAULT,
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6) USING "created_at"::TIMESTAMPTZ(6),
  ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ(6) USING "updated_at"::TIMESTAMPTZ(6),
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_circular_product_id_fkey";
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_circular_product_id_fkey" FOREIGN KEY ("circular_product_id") REFERENCES "circular_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "circular_products" DROP CONSTRAINT IF EXISTS "circular_products_supplier_id_fkey";
ALTER TABLE "circular_products" ADD CONSTRAINT "circular_products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_circular_product_id_fkey";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_circular_product_id_fkey" FOREIGN KEY ("circular_product_id") REFERENCES "circular_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- Retain the operational database's protection of historical order items.
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_product_id_fkey";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quality_files" DROP CONSTRAINT IF EXISTS "quality_files_product_fk";
ALTER TABLE "quality_files" ADD CONSTRAINT "quality_files_product_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- These tables are served by the authenticated Nest backend. Supabase browser
-- roles have no policies granting direct access to session or private test data.
ALTER TABLE "auth_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "testing_partners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "testing_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quality_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lab_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quality_events" ENABLE ROW LEVEL SECURITY;
