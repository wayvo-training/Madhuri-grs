-- AlterTable: add closure_reason to grievances if not exists
ALTER TABLE "grievances" ADD COLUMN IF NOT EXISTS "closure_reason" VARCHAR(100);

