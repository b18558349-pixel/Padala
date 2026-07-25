ALTER TABLE "payments" ADD COLUMN "idempotency_key" text;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "unsigned_xdr" text;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "unsigned_tx_digest" text;
--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_idx" ON "payments" USING btree ("idempotency_key");
