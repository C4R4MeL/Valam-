ALTER TABLE "rfq_responses" ADD COLUMN "product_id" UUID, ADD COLUMN "expires_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "rfq_id" UUID;
CREATE UNIQUE INDEX "orders_rfq_id_key" ON "orders"("rfq_id");
ALTER TABLE "rfq_responses" ADD CONSTRAINT "rfq_responses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfq_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
