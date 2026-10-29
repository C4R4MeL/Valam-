-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "review_status" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW';

-- CreateTable
CREATE TABLE "testing_partners" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'LABORATORY',
    "logo_url" TEXT,
    "address" TEXT,
    "contact" TEXT,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instructions" TEXT,
    "fees" TEXT,
    "sample_requirements" TEXT,
    "turnaround" TEXT,
    "result_channel" TEXT,
    "permission_notes" TEXT,
    "publish_name" BOOLEAN NOT NULL DEFAULT false,
    "publish_logo" BOOLEAN NOT NULL DEFAULT false,
    "publish_reports" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT false,
    "accepting_requests" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'EXPLORATORY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testing_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testing_requests" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "supplier_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "partner_snapshot" JSONB NOT NULL,
    "service" TEXT NOT NULL,
    "sample_identity" TEXT,
    "notes" TEXT,
    "shipping_info" TEXT,
    "shipping_evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "request_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_files" (
    "id" UUID NOT NULL,
    "product_id" UUID,
    "partner_id" UUID,
    "uploaded_by" UUID NOT NULL,
    "storage_path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_reports" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "request_id" UUID,
    "partner_id" UUID NOT NULL,
    "issuer_snapshot" JSONB NOT NULL,
    "report_number" TEXT NOT NULL,
    "sample_identity" TEXT NOT NULL,
    "tested_at" TIMESTAMP(3),
    "issued_at" TIMESTAMP(3),
    "file_id" UUID NOT NULL,
    "parameters" JSONB NOT NULL DEFAULT '[]',
    "conclusion" TEXT,
    "source" TEXT NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "review_status" TEXT NOT NULL DEFAULT 'PENDING',
    "review_notes" TEXT,
    "review_checklist" JSONB,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "publication_allowed" BOOLEAN NOT NULL DEFAULT false,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "evaluation_status" TEXT NOT NULL DEFAULT 'UNEVALUATED',
    "replaces_id" UUID,
    "request_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_events" (
    "id" UUID NOT NULL,
    "request_id" UUID,
    "report_id" UUID,
    "actor_id" UUID NOT NULL,
    "actor_role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "evidence" TEXT,
    "action_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "testing_requests_number_key" ON "testing_requests"("number");

-- CreateIndex
CREATE UNIQUE INDEX "testing_requests_request_key_key" ON "testing_requests"("request_key");

-- CreateIndex
CREATE INDEX "testing_requests_supplier_id_created_at_idx" ON "testing_requests"("supplier_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "quality_files_storage_path_key" ON "quality_files"("storage_path");

-- CreateIndex


-- CreateIndex
CREATE UNIQUE INDEX "lab_reports_request_key_key" ON "lab_reports"("request_key");

-- CreateIndex
CREATE INDEX "lab_reports_product_id_review_status_idx" ON "lab_reports"("product_id", "review_status");

-- CreateIndex
CREATE UNIQUE INDEX "quality_events_action_key_key" ON "quality_events"("action_key");

-- AddForeignKey
ALTER TABLE "testing_requests" ADD CONSTRAINT "testing_requests_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testing_requests" ADD CONSTRAINT "testing_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testing_requests" ADD CONSTRAINT "testing_requests_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "testing_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_files" ADD CONSTRAINT "quality_files_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "testing_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "testing_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "testing_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "quality_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_replaces_id_fkey" FOREIGN KEY ("replaces_id") REFERENCES "lab_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "testing_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_events" ADD CONSTRAINT "quality_events_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "lab_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- No legacy certificate becomes an ARC report. All originals remain in place.
ALTER TABLE testing_partners ADD CONSTRAINT partner_status_check CHECK (status IN ('EXPLORATORY','ACTIVE','SUSPENDED','ENDED'));
ALTER TABLE testing_partners ADD CONSTRAINT partner_accepting_check CHECK (NOT accepting_requests OR status = 'ACTIVE');
ALTER TABLE testing_requests ADD CONSTRAINT request_status_check CHECK (status IN ('SUBMITTED','AWAITING_SHIPMENT','SHIPPED','RECEIVED','TESTING','RESULTS_AVAILABLE','CANCELLED'));
ALTER TABLE lab_reports ADD CONSTRAINT report_review_check CHECK (review_status IN ('PENDING','APPROVED','REVISION_REQUESTED','REJECTED','REVOKED','SUPERSEDED'));
ALTER TABLE quality_files ADD CONSTRAINT file_scope_check CHECK ((product_id IS NULL) <> (partner_id IS NULL));
ALTER TABLE quality_files ADD CONSTRAINT quality_files_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE;
INSERT INTO testing_partners (id, name, kind, status, visible, publish_name, publish_logo, publish_reports, accepting_requests, services, permission_notes, updated_at)
VALUES ('a7c00000-0000-4000-8000-000000000001', 'ARC USK', 'LABORATORY', 'ACTIVE', true, true, true, true, false, ARRAY[]::TEXT[], 'Izin nama, logo, dan dokumen dikonfirmasi pemilik platform. Layanan serta prosedur operasional menunggu konfigurasi berdasarkan kesepakatan. Izin bukan bukti bahwa semua produk telah diuji.', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
