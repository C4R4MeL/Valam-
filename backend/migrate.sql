-- CreateEnum
CREATE TYPE "ShipmentType" AS ENUM ('DOMESTIK', 'EKSPOR');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('MENUNGGU_KONFIRMASI', 'TERKONFIRMASI', 'DIPROSES', 'DIKIRIM', 'DALAM_PERJALANAN', 'TIBA_DI_TUJUAN', 'SELESAI', 'BERMASALAH', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "Incoterms" AS ENUM ('EXW', 'FOB', 'CIF');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('TERDAFTAR', 'DALAM_VERIFIKASI', 'TERVERIFIKASI', 'LEGACY_VERIFIED');

-- CreateEnum
CREATE TYPE "GradeNilam" AS ENUM ('GRADE_A', 'GRADE_B', 'GRADE_C');

-- CreateEnum
CREATE TYPE "SupplierSubtype" AS ENUM ('PETANI', 'PENYULING', 'KOPERASI');

-- CreateEnum
CREATE TYPE "TipeDocument" AS ENUM ('AKTA_KOPERASI', 'COA', 'FOTO_FASILITAS', 'SURAT_PERNYATAAN');

-- CreateEnum
CREATE TYPE "StatusDokumen" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED');

-- CreateEnum
CREATE TYPE "AksiVerifikasi" AS ENUM ('APPROVE_DOCUMENT', 'REJECT_DOCUMENT', 'REQUEST_REVISION', 'FINALIZE_VERIFIED', 'RESET_TO_TERDAFTAR', 'LEGACY_REMINDER_SENT', 'LEGACY_DEADLINE_ENFORCED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_name" TEXT,
    "legal_number" TEXT,
    "npwp" TEXT,
    "chairman_name" TEXT,
    "country" TEXT,
    "contact_person" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "avatar_url" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "batch_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "origin_village" TEXT,
    "origin_district" TEXT,
    "origin_province" TEXT,
    "production_date" TIMESTAMP(3),
    "total_volume_kg" DOUBLE PRECISION NOT NULL,
    "available_volume_kg" DOUBLE PRECISION NOT NULL,
    "moq_kg" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "price_per_kg" DOUBLE PRECISION NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_parameters" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "standard_min" DOUBLE PRECISION,
    "standard_max" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pass',

    CONSTRAINT "product_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_results" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "pa_percentage" DOUBLE PRECISION NOT NULL,
    "moisture" DOUBLE PRECISION NOT NULL,
    "specific_gravity" DOUBLE PRECISION NOT NULL,
    "refractive_index" DOUBLE PRECISION NOT NULL,
    "optical_rotation" DOUBLE PRECISION NOT NULL,
    "overall_status" TEXT NOT NULL DEFAULT 'pass',
    "tested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lab_notes" TEXT,

    CONSTRAINT "qc_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "qc_result_id" UUID NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_name" TEXT NOT NULL,
    "admin_signature_url" TEXT,
    "pdf_url" TEXT,
    "qr_code_url" TEXT,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trace_logs" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "location_district" TEXT,
    "gps_latitude" DOUBLE PRECISION,
    "gps_longitude" DOUBLE PRECISION,
    "description" TEXT,
    "event_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trace_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "buyer_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total_amount" DOUBLE PRECISION NOT NULL,
    "shipping_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipping_address" JSONB NOT NULL DEFAULT '{}',
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "delivery_proof_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID,
    "circular_product_id" UUID,
    "quantity_kg" DOUBLE PRECISION NOT NULL,
    "price_per_kg" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "payment_method" TEXT,
    "payment_gateway_id" TEXT,
    "snap_token" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "shipment_type" "ShipmentType" NOT NULL DEFAULT 'DOMESTIK',
    "biteship_rate_id" TEXT,
    "courier_name" TEXT,
    "courier_code" TEXT,
    "service_name" TEXT,
    "service_code" TEXT,
    "estimated_days" INTEGER,
    "base_shipping_cost" DECIMAL(15,2),
    "insurance_fee" DECIMAL(15,2),
    "packaging_fee" DECIMAL(15,2),
    "total_shipping_cost" DECIMAL(15,2),
    "actual_weight" DECIMAL(10,3),
    "volumetric_weight" DECIMAL(10,3),
    "billed_weight" DECIMAL(10,3),
    "drum_count" INTEGER,
    "tracking_number" TEXT,
    "tracking_url" TEXT,
    "last_tracking_data" JSONB,
    "incoterms" "Incoterms",
    "port_origin" TEXT,
    "port_destination" TEXT,
    "forwarder_name" TEXT,
    "estimated_freight" DECIMAL(15,2),
    "export_notes" TEXT,
    "origin_address" JSONB NOT NULL,
    "destination_address" JSONB NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'MENUNGGU_KONFIRMASI',
    "shipped_at" TIMESTAMP(3),
    "estimated_arrival" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "issue_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_tracking_logs" (
    "id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_tracking_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID,
    "circular_product_id" UUID,
    "quantity_kg" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0.0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reference_order_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_requests" (
    "id" UUID NOT NULL,
    "rfq_number" TEXT NOT NULL,
    "buyer_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "volume_kg" DOUBLE PRECISION NOT NULL,
    "budget_per_kg" DOUBLE PRECISION NOT NULL,
    "min_pa_percentage" DOUBLE PRECISION NOT NULL,
    "max_moisture" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_responses" (
    "id" UUID NOT NULL,
    "rfq_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "proposed_price_per_kg" DOUBLE PRECISION NOT NULL,
    "proposed_volume_kg" DOUBLE PRECISION NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RESPONDED',
    "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfq_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "supplier_subtype" "SupplierSubtype" NOT NULL DEFAULT 'KOPERASI',
    "nama_pic" TEXT NOT NULL,
    "ktp_pic" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "desa" TEXT NOT NULL,
    "nama_koperasi" TEXT,
    "nib" TEXT,
    "npwp" TEXT,
    "alamat_lengkap" TEXT,
    "kapasitas_produksi" DOUBLE PRECISION,
    "luas_lahan" DOUBLE PRECISION,
    "estimasi_panen" DOUBLE PRECISION,
    "punya_alat_suling" BOOLEAN NOT NULL DEFAULT false,
    "koperasi_pembina_id" UUID,
    "nomor_rekening" TEXT,
    "nama_bank" TEXT,
    "nama_rekening" TEXT,
    "tahun_berdiri" TEXT,
    "jumlah_anggota" INTEGER DEFAULT 15,
    "minimum_order" DOUBLE PRECISION DEFAULT 10,
    "durasi_produksi" TEXT DEFAULT '7-14 Hari',
    "metode_distilasi" TEXT DEFAULT 'Uap (Steam Distillation)',
    "bahan_baku" TEXT DEFAULT '100% Daun Nilam Segar',
    "website" TEXT,
    "grade_nilam" "GradeNilam"[],
    "status" "SupplierStatus" NOT NULL DEFAULT 'TERDAFTAR',
    "is_legacy" BOOLEAN NOT NULL DEFAULT false,
    "legacy_deadline" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_documents" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "tipe_document" "TipeDocument" NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "status_dokumen" "StatusDokumen" NOT NULL DEFAULT 'PENDING',
    "catatan_reviewer" TEXT,
    "tanggal_coa" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" UUID,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_logs" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "aksi" "AksiVerifikasi" NOT NULL,
    "document_id" UUID,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circular_products" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "benefit" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "image" TEXT DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circular_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_batch_code_key" ON "products"("batch_code");

-- CreateIndex
CREATE UNIQUE INDEX "qc_results_product_id_key" ON "qc_results"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_product_id_key" ON "certificates"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_qc_result_id_key" ON "certificates"("qc_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_number_key" ON "certificates"("certificate_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_order_id_key" ON "shipments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_requests_rfq_number_key" ON "rfq_requests"("rfq_number");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_responses_rfq_id_key" ON "rfq_responses"("rfq_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_profiles_user_id_key" ON "supplier_profiles"("user_id");

-- CreateIndex
CREATE INDEX "supplier_profiles_status_idx" ON "supplier_profiles"("status");

-- CreateIndex
CREATE INDEX "supplier_profiles_supplier_subtype_idx" ON "supplier_profiles"("supplier_subtype");

-- CreateIndex
CREATE INDEX "supplier_documents_supplier_id_tipe_document_idx" ON "supplier_documents"("supplier_id", "tipe_document");

-- CreateIndex
CREATE INDEX "verification_logs_supplier_id_idx" ON "verification_logs"("supplier_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_parameters" ADD CONSTRAINT "product_parameters_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_results" ADD CONSTRAINT "qc_results_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_results" ADD CONSTRAINT "qc_results_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_qc_result_id_fkey" FOREIGN KEY ("qc_result_id") REFERENCES "qc_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trace_logs" ADD CONSTRAINT "trace_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_circular_product_id_fkey" FOREIGN KEY ("circular_product_id") REFERENCES "circular_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking_logs" ADD CONSTRAINT "shipment_tracking_logs_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_circular_product_id_fkey" FOREIGN KEY ("circular_product_id") REFERENCES "circular_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_responses" ADD CONSTRAINT "rfq_responses_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfq_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_responses" ADD CONSTRAINT "rfq_responses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_profiles" ADD CONSTRAINT "supplier_profiles_koperasi_pembina_id_fkey" FOREIGN KEY ("koperasi_pembina_id") REFERENCES "supplier_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_profiles" ADD CONSTRAINT "supplier_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_documents" ADD CONSTRAINT "supplier_documents_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "supplier_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circular_products" ADD CONSTRAINT "circular_products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

