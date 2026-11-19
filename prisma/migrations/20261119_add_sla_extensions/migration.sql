-- CreateTable
CREATE TABLE IF NOT EXISTS "sla_extensions" (
    "extension_id" BIGSERIAL NOT NULL,
    "grievance_id" BIGINT NOT NULL,
    "sla_tracking_id" BIGINT NOT NULL,
    "requested_by" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "requested_duration_minutes" INTEGER NOT NULL,
    "granted_duration_minutes" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "reviewed_by" BIGINT,
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sla_extensions_pkey" PRIMARY KEY ("extension_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_sla_extensions_grievance_id" ON "sla_extensions"("grievance_id");
CREATE INDEX IF NOT EXISTS "idx_sla_extensions_tracking_id" ON "sla_extensions"("sla_tracking_id");
CREATE INDEX IF NOT EXISTS "idx_sla_extensions_status" ON "sla_extensions"("status");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sla_extensions_grievance_id_fkey'
    ) THEN
        ALTER TABLE "sla_extensions" ADD CONSTRAINT "sla_extensions_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sla_extensions_sla_tracking_id_fkey'
    ) THEN
        ALTER TABLE "sla_extensions" ADD CONSTRAINT "sla_extensions_sla_tracking_id_fkey" FOREIGN KEY ("sla_tracking_id") REFERENCES "sla_tracking"("sla_tracking_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sla_extensions_requested_by_fkey'
    ) THEN
        ALTER TABLE "sla_extensions" ADD CONSTRAINT "sla_extensions_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sla_extensions_reviewed_by_fkey'
    ) THEN
        ALTER TABLE "sla_extensions" ADD CONSTRAINT "sla_extensions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

