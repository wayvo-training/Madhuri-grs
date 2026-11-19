-- AlterTable
ALTER TABLE "sla_tracking" ADD COLUMN IF NOT EXISTS "accumulated_paused_minutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "sla_tracking" ADD COLUMN IF NOT EXISTS "cycle_type" VARCHAR(20) NOT NULL DEFAULT 'INITIAL';

-- CreateTable
CREATE TABLE IF NOT EXISTS "sla_pause_logs" (
    "id" BIGSERIAL NOT NULL,
    "sla_tracking_id" BIGINT NOT NULL,
    "pause_reason" VARCHAR(100) NOT NULL,
    "paused_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumed_at" TIMESTAMPTZ(6),
    "duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "paused_by" BIGINT NOT NULL,
    "resumed_by" BIGINT,

    CONSTRAINT "sla_pause_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_sla_pause_logs_tracking_id" ON "sla_pause_logs"("sla_tracking_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sla_pause_logs_sla_tracking_id_fkey'
    ) THEN
        ALTER TABLE "sla_pause_logs" ADD CONSTRAINT "sla_pause_logs_sla_tracking_id_fkey" FOREIGN KEY ("sla_tracking_id") REFERENCES "sla_tracking"("sla_tracking_id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sla_pause_logs_paused_by_fkey'
    ) THEN
        ALTER TABLE "sla_pause_logs" ADD CONSTRAINT "sla_pause_logs_paused_by_fkey" FOREIGN KEY ("paused_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sla_pause_logs_resumed_by_fkey'
    ) THEN
        ALTER TABLE "sla_pause_logs" ADD CONSTRAINT "sla_pause_logs_resumed_by_fkey" FOREIGN KEY ("resumed_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;
