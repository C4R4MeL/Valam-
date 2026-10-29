ALTER TABLE "products" ADD COLUMN "is_demo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "price_type" TEXT NOT NULL DEFAULT 'OFFER';
ALTER TABLE "product_parameters" ALTER COLUMN "status" SET DEFAULT 'UNEVALUATED';
ALTER TABLE "qc_results"
  ALTER COLUMN "pa_percentage" DROP NOT NULL,
  ALTER COLUMN "moisture" DROP NOT NULL,
  ALTER COLUMN "specific_gravity" DROP NOT NULL,
  ALTER COLUMN "refractive_index" DROP NOT NULL,
  ALTER COLUMN "optical_rotation" DROP NOT NULL,
  ALTER COLUMN "tested_at" DROP NOT NULL,
  ALTER COLUMN "tested_at" DROP DEFAULT,
  ALTER COLUMN "overall_status" SET DEFAULT 'UNEVALUATED',
  ADD COLUMN "lab_name" TEXT,
  ADD COLUMN "report_number" TEXT,
  ADD COLUMN "source_document_url" TEXT,
  ADD COLUMN "evaluation_rule_version" TEXT;
-- Existing pass/VERIFIED strings are not evidence of validated lab provenance.
-- Do not invent or backfill report metadata. API/UI treat legacy results as unevaluated.
