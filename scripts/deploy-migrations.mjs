#!/usr/bin/env node

/**
 * Production Database Migration Runner
 * Executes idempotent DDL to ensure required columns (closure_reason)
 * and tables (sla_extensions, sla_pause_logs) exist on the target PostgreSQL database.
 */

import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log(
    "[MIGRATE] No DATABASE_URL provided. Skipping build-time migration.",
  );
  process.exit(0);
}

const client = new pg.Client({
  connectionString,
  connectionTimeoutMillis: 10000,
});

async function run() {
  try {
    await client.connect();
    console.log(
      "[MIGRATE] Connected to database. Ensuring schema migrations...",
    );

    await client.query(`
      ALTER TABLE "grievances" ADD COLUMN IF NOT EXISTS "closure_reason" VARCHAR(100);
      ALTER TABLE "sla_tracking" ADD COLUMN IF NOT EXISTS "accumulated_paused_minutes" INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE "sla_tracking" ADD COLUMN IF NOT EXISTS "cycle_type" VARCHAR(20) NOT NULL DEFAULT 'INITIAL';
    `);

    await client.query(`
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
      CREATE INDEX IF NOT EXISTS "idx_sla_pause_logs_tracking_id" ON "sla_pause_logs"("sla_tracking_id");
    `);

    await client.query(`
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
      CREATE INDEX IF NOT EXISTS "idx_sla_extensions_grievance_id" ON "sla_extensions"("grievance_id");
      CREATE INDEX IF NOT EXISTS "idx_sla_extensions_tracking_id" ON "sla_extensions"("sla_tracking_id");
      CREATE INDEX IF NOT EXISTS "idx_sla_extensions_status" ON "sla_extensions"("status");
    `);

    await client.query(`
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
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "grievance_feedback" (
        "feedback_id" BIGSERIAL NOT NULL,
        "grievance_id" BIGINT NOT NULL,
        "employee_id" BIGINT NOT NULL,
        "rating" INTEGER NOT NULL,
        "comments" TEXT,
        "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "grievance_feedback_pkey" PRIMARY KEY ("feedback_id"),
        CONSTRAINT "check_grievance_feedback_rating" CHECK ("rating" >= 1 AND "rating" <= 5)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_grievance_feedback_grievance_id" ON "grievance_feedback"("grievance_id");
      CREATE INDEX IF NOT EXISTS "idx_grievance_feedback_employee_id" ON "grievance_feedback"("employee_id");
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'grievance_feedback_grievance_id_fkey'
        ) THEN
          ALTER TABLE "grievance_feedback" ADD CONSTRAINT "grievance_feedback_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'grievance_feedback_employee_id_fkey'
        ) THEN
          ALTER TABLE "grievance_feedback" ADD CONSTRAINT "grievance_feedback_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'check_grievance_feedback_rating'
            AND conrelid = 'grievance_feedback'::regclass
        ) THEN
          ALTER TABLE "grievance_feedback"
            ADD CONSTRAINT "check_grievance_feedback_rating"
            CHECK ("rating" >= 1 AND "rating" <= 5);
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_prisma_migrations') THEN
          IF NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20261121_add_grievance_feedback') THEN
            INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
            VALUES (gen_random_uuid()::text, 'self-healed', CURRENT_TIMESTAMP, '20261121_add_grievance_feedback', NULL, NULL, CURRENT_TIMESTAMP, 1);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20261119_add_closure_reason') THEN
            INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
            VALUES (gen_random_uuid()::text, 'self-healed', CURRENT_TIMESTAMP, '20261119_add_closure_reason', NULL, NULL, CURRENT_TIMESTAMP, 1);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20261119_add_sla_extensions') THEN
            INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
            VALUES (gen_random_uuid()::text, 'self-healed', CURRENT_TIMESTAMP, '20261119_add_sla_extensions', NULL, NULL, CURRENT_TIMESTAMP, 1);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20261118_sla_pause_logs') THEN
            INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
            VALUES (gen_random_uuid()::text, 'self-healed', CURRENT_TIMESTAMP, '20261118_sla_pause_logs', NULL, NULL, CURRENT_TIMESTAMP, 1);
          END IF;
        END IF;
      END $$;
    `);

    console.log("[MIGRATE] Schema migrations applied successfully.");
  } catch (err) {
    console.warn(
      "[MIGRATE] Could not run build-time migration (runtime self-healing will apply it):",
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    try {
      await client.end();
    } catch {
      // Ignored
    }
  }
}

run();
