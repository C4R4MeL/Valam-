ALTER TABLE "orders" ADD COLUMN "stock_state" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN "reservation_expires_at" TIMESTAMP(3),
  ADD COLUMN "checkout_key" TEXT, ADD COLUMN "checkout_fingerprint" TEXT;
ALTER TABLE "payments" ADD COLUMN "gateway_order_id" TEXT;
ALTER TABLE "wallets" ADD COLUMN "refund_due" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN "frozen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "withdrawals" ADD COLUMN "request_key" TEXT;
CREATE UNIQUE INDEX "orders_checkout_key_key" ON "orders"("checkout_key");
CREATE UNIQUE INDEX "payments_gateway_order_id_key" ON "payments"("gateway_order_id");
CREATE UNIQUE INDEX "withdrawals_request_key_key" ON "withdrawals"("request_key");
-- Stops on pre-existing duplicate references. Never delete or silently deduplicate financial records.
CREATE UNIQUE INDEX "wallet_transactions_reference_order_id_type_key" ON "wallet_transactions"("reference_order_id", "type");
-- Legacy orders remain NONE and require reconciliation; do not infer stock ownership.
