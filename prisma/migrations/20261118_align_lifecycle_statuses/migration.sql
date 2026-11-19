-- Align Grievance Lifecycle Statuses 
-- 11 Approved Statuses:
-- SUBMITTED, AWAITING_ROUTING, AWAITING_ASSIGNMENT, ASSIGNED, IN_PROGRESS,
-- AWAITING_INFORMATION, RESOLVED, REWORK, RESOLUTION_PENDING_APPROVAL, REOPENED, CLOSED

-- 1. Drop old check constraint first so data can be migrated to new statuses
ALTER TABLE "public"."grievances" DROP CONSTRAINT IF EXISTS "grievances_status_check";

-- 2. Migrate existing records in grievances
UPDATE "public"."grievances" SET "status" = 'AWAITING_ASSIGNMENT' WHERE "status" = 'ROUTED';
UPDATE "public"."grievances" SET "status" = 'AWAITING_INFORMATION' WHERE "status" = 'WAITING_ON_USER';
UPDATE "public"."grievances" SET "status" = 'RESOLUTION_PENDING_APPROVAL' WHERE "status" IN ('UNDER_REVIEW', 'REOPEN_REVIEW');
UPDATE "public"."grievances" SET "status" = 'IN_PROGRESS' WHERE "status" = 'ESCALATED';

-- 3. Update historical audit trail in grievance_status_history
UPDATE "public"."grievance_status_history" SET "old_status" = 'AWAITING_ASSIGNMENT' WHERE "old_status" = 'ROUTED';
UPDATE "public"."grievance_status_history" SET "new_status" = 'AWAITING_ASSIGNMENT' WHERE "new_status" = 'ROUTED';
UPDATE "public"."grievance_status_history" SET "old_status" = 'AWAITING_INFORMATION' WHERE "old_status" = 'WAITING_ON_USER';
UPDATE "public"."grievance_status_history" SET "new_status" = 'AWAITING_INFORMATION' WHERE "new_status" = 'WAITING_ON_USER';
UPDATE "public"."grievance_status_history" SET "old_status" = 'RESOLUTION_PENDING_APPROVAL' WHERE "old_status" IN ('UNDER_REVIEW', 'REOPEN_REVIEW');
UPDATE "public"."grievance_status_history" SET "new_status" = 'RESOLUTION_PENDING_APPROVAL' WHERE "new_status" IN ('UNDER_REVIEW', 'REOPEN_REVIEW');
UPDATE "public"."grievance_status_history" SET "old_status" = 'IN_PROGRESS' WHERE "old_status" = 'ESCALATED';
UPDATE "public"."grievance_status_history" SET "new_status" = 'IN_PROGRESS' WHERE "new_status" = 'ESCALATED';

-- 4. Apply updated check constraint enforcing the 11 approved lifecycle statuses
ALTER TABLE "public"."grievances" ADD CONSTRAINT "grievances_status_check" CHECK (
  "status" IN (
    'SUBMITTED',
    'AWAITING_ROUTING',
    'AWAITING_ASSIGNMENT',
    'ASSIGNED',
    'IN_PROGRESS',
    'AWAITING_INFORMATION',
    'RESOLVED',
    'REWORK',
    'RESOLUTION_PENDING_APPROVAL',
    'REOPENED',
    'CLOSED'
  )
);
