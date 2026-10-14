-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."assignments" (
    "assignment_id" BIGSERIAL NOT NULL,
    "grievance_id" BIGINT NOT NULL,
    "grievance_department_id" BIGINT NOT NULL,
    "staff_id" BIGINT NOT NULL,
    "recommendation_score" DECIMAL(5,2),
    "recommendation_reasons" JSONB,
    "assignment_status" VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
    "assigned_by" BIGINT NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "public"."attachments" (
    "attachment_id" BIGSERIAL NOT NULL,
    "grievance_id" BIGINT NOT NULL,
    "grievance_department_id" BIGINT,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "file_size" BIGINT,
    "uploaded_by" BIGINT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolution_id" BIGINT,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "audit_log_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "grievance_id" BIGINT,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" BIGINT,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("audit_log_id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "category_id" BIGSERIAL NOT NULL,
    "category_name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "public"."departments" (
    "department_id" BIGSERIAL NOT NULL,
    "department_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "public"."escalations" (
    "escalation_id" BIGSERIAL NOT NULL,
    "grievance_id" BIGINT NOT NULL,
    "sla_policy_id" BIGINT,
    "escalation_level" INTEGER NOT NULL DEFAULT 1,
    "escalated_to" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("escalation_id")
);

-- CreateTable
CREATE TABLE "public"."grievance_departments" (
    "grievance_department_id" BIGSERIAL NOT NULL,
    "grievance_id" BIGINT NOT NULL,
    "department_id" BIGINT NOT NULL,
    "involvement_type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
    "assigned_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "allocated_duration_minutes" INTEGER,
    "sla_percent_allocation" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "due_at" TIMESTAMPTZ(6),
    "sla_status" VARCHAR(20) NOT NULL DEFAULT 'ON_TRACK',
    "dependency_type" VARCHAR(20) NOT NULL DEFAULT 'PARALLEL',
    "prerequisite_department_ids" JSONB NOT NULL DEFAULT '[]',
    "execution_order" INTEGER NOT NULL DEFAULT 1,
    "activated_at" TIMESTAMPTZ(6),

    CONSTRAINT "grievance_departments_pkey" PRIMARY KEY ("grievance_department_id")
);

-- CreateTable
CREATE TABLE "public"."grievance_status_history" (
    "history_id" BIGSERIAL NOT NULL,
    "grievance_id" BIGINT NOT NULL,
    "old_status" VARCHAR(30),
    "new_status" VARCHAR(30) NOT NULL,
    "changed_by" BIGINT NOT NULL,
    "remarks" TEXT,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_status_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "public"."grievances" (
    "grievance_id" BIGSERIAL NOT NULL,
    "grievance_number" VARCHAR(50) NOT NULL,
    "submitted_by" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "subcategory_id" BIGINT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "priority_rule_id" BIGINT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    "reopen_count" INTEGER NOT NULL DEFAULT 0,
    "manual_review_count" INTEGER NOT NULL DEFAULT 0,
    "sla_status" VARCHAR(20),
    "due_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "grievances_pkey" PRIMARY KEY ("grievance_id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_articles" (
    "article_id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "category_id" BIGINT,
    "subcategory_id" BIGINT,
    "source_resolution_id" BIGINT,
    "created_by" BIGINT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("article_id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "notification_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "grievance_id" BIGINT,
    "notification_type" VARCHAR(50) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(6),
    "read_at" TIMESTAMPTZ(6),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "public"."password_reset_tokens" (
    "password_reset_token_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("password_reset_token_id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "permission_id" BIGSERIAL NOT NULL,
    "permission_name" VARCHAR(100) NOT NULL,
    "permission_code" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "public"."priority_rules" (
    "priority_rule_id" BIGSERIAL NOT NULL,
    "rule_name" VARCHAR(150) NOT NULL,
    "conditions" JSONB NOT NULL,
    "priority_level" VARCHAR(20) NOT NULL,
    "rule_order" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "priority_rules_pkey" PRIMARY KEY ("priority_rule_id")
);

-- CreateTable
CREATE TABLE "public"."reopen_policies" (
    "reopen_policy_id" BIGSERIAL NOT NULL,
    "policy_name" VARCHAR(150) NOT NULL,
    "reopen_window_hours" INTEGER,
    "max_reopen_count" INTEGER NOT NULL,
    "max_manual_review_count" INTEGER NOT NULL,
    "applicable_condition" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reopen_policies_pkey" PRIMARY KEY ("reopen_policy_id")
);

-- CreateTable
CREATE TABLE "public"."resolution_reviews" (
    "review_id" BIGSERIAL NOT NULL,
    "resolution_id" BIGINT NOT NULL,
    "reviewed_by" BIGINT NOT NULL,
    "decision" VARCHAR(20) NOT NULL,
    "rejection_reason" TEXT,
    "reviewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resolution_reviews_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "public"."resolutions" (
    "resolution_id" BIGSERIAL NOT NULL,
    "grievance_id" BIGINT NOT NULL,
    "submitted_by" BIGINT NOT NULL,
    "problem_summary" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "action_taken" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "evidence" TEXT,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resolutions_pkey" PRIMARY KEY ("resolution_id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "role_permission_id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_permission_id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "role_id" BIGSERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "public"."routing_rules" (
    "routing_rule_id" BIGSERIAL NOT NULL,
    "rule_name" VARCHAR(150) NOT NULL,
    "category_id" BIGINT,
    "subcategory_id" BIGINT,
    "conditions" JSONB,
    "department_id" BIGINT NOT NULL,
    "involvement_type" VARCHAR(20) NOT NULL,
    "supporting_departments" JSONB,
    "rule_order" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routing_rules_pkey" PRIMARY KEY ("routing_rule_id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "session_id" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "public"."skills" (
    "skill_id" BIGSERIAL NOT NULL,
    "skill_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("skill_id")
);

-- CreateTable
CREATE TABLE "public"."sla_policies" (
    "sla_policy_id" BIGSERIAL NOT NULL,
    "policy_name" VARCHAR(150) NOT NULL,
    "priority_level" VARCHAR(20),
    "sla_type" VARCHAR(30) NOT NULL DEFAULT 'RESOLUTION',
    "target_duration_minutes" INTEGER NOT NULL,
    "warning_threshold_percent" DECIMAL(5,2) NOT NULL,
    "trigger_condition" JSONB,
    "escalation_level" INTEGER NOT NULL DEFAULT 1,
    "target_role" VARCHAR(30) NOT NULL DEFAULT 'DEPARTMENT_HEAD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escalation_threshold_percent" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("sla_policy_id")
);

-- CreateTable
CREATE TABLE "public"."sla_tracking" (
    "sla_tracking_id" BIGSERIAL NOT NULL,
    "grievance_id" BIGINT NOT NULL,
    "sla_policy_id" BIGINT NOT NULL,
    "cycle_number" INTEGER NOT NULL DEFAULT 1,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ON_TRACK',
    "paused_at" TIMESTAMPTZ(6),
    "resumed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "grievance_department_id" BIGINT,

    CONSTRAINT "sla_tracking_pkey" PRIMARY KEY ("sla_tracking_id")
);

-- CreateTable
CREATE TABLE "public"."subcategories" (
    "subcategory_id" BIGSERIAL NOT NULL,
    "category_id" BIGINT NOT NULL,
    "subcategory_name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("subcategory_id")
);

-- CreateTable
CREATE TABLE "public"."user_skills" (
    "user_skill_id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "skill_id" BIGINT NOT NULL,
    "experience_years" DECIMAL(4,1),
    "proficiency_level" VARCHAR(30),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("user_skill_id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" BIGSERIAL NOT NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role_id" BIGINT NOT NULL,
    "department_id" BIGINT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "idx_assignments_grievance_id" ON "public"."assignments"("grievance_id" ASC);

-- CreateIndex
CREATE INDEX "idx_assignments_staff_id" ON "public"."assignments"("staff_id" ASC);

-- CreateIndex
CREATE INDEX "idx_assignments_staff_status" ON "public"."assignments"("staff_id" ASC, "assignment_status" ASC);

-- CreateIndex
CREATE INDEX "idx_assignments_status" ON "public"."assignments"("assignment_status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_active_assignment" ON "public"."assignments"("grievance_department_id" ASC) WHERE ((assignment_status)::text = 'ASSIGNED'::text);

-- CreateIndex
CREATE INDEX "idx_attachments_grievance_id" ON "public"."attachments"("grievance_id" ASC);

-- CreateIndex
CREATE INDEX "idx_attachments_resolution_id" ON "public"."attachments"("resolution_id" ASC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_grievance_id" ON "public"."audit_logs"("grievance_id" ASC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "public"."audit_logs"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "categories_category_name_key" ON "public"."categories"("category_name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "departments_department_name_key" ON "public"."departments"("department_name" ASC);

-- CreateIndex
CREATE INDEX "idx_escalations_grievance_id" ON "public"."escalations"("grievance_id" ASC);

-- CreateIndex
CREATE INDEX "idx_escalations_status" ON "public"."escalations"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_grievance_dept_dept_id" ON "public"."grievance_departments"("department_id" ASC);

-- CreateIndex
CREATE INDEX "idx_grievance_dept_dept_status" ON "public"."grievance_departments"("department_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "idx_grievance_dept_grievance_id" ON "public"."grievance_departments"("grievance_id" ASC);

-- CreateIndex
CREATE INDEX "idx_grievance_dept_status" ON "public"."grievance_departments"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_grievance_department" ON "public"."grievance_departments"("grievance_id" ASC, "department_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_grievance_single_primary" ON "public"."grievance_departments"("grievance_id" ASC, "involvement_type" ASC) WHERE ((involvement_type)::text = 'PRIMARY'::text);

-- CreateIndex
CREATE UNIQUE INDEX "grievances_grievance_number_key" ON "public"."grievances"("grievance_number" ASC);

-- CreateIndex
CREATE INDEX "idx_grievances_category_id" ON "public"."grievances"("category_id" ASC);

-- CreateIndex
CREATE INDEX "idx_grievances_created_at" ON "public"."grievances"("created_at" ASC);

-- CreateIndex
CREATE INDEX "idx_grievances_priority" ON "public"."grievances"("priority" ASC);

-- CreateIndex
CREATE INDEX "idx_grievances_status" ON "public"."grievances"("status" ASC);

-- CreateIndex
CREATE INDEX "idx_grievances_submitted_by" ON "public"."grievances"("submitted_by" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_grievance_id" ON "public"."notifications"("grievance_id" ASC);

-- CreateIndex
CREATE INDEX "idx_notifications_user_status" ON "public"."notifications"("user_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_expires_at" ON "public"."password_reset_tokens"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_user_id" ON "public"."password_reset_tokens"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "public"."password_reset_tokens"("token_hash" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_code_key" ON "public"."permissions"("permission_code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_name_key" ON "public"."permissions"("permission_name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_active_default_priority" ON "public"."priority_rules"("is_default" ASC) WHERE ((is_default = true) AND ((status)::text = 'ACTIVE'::text));

-- CreateIndex
CREATE INDEX "idx_role_permissions_permission_id" ON "public"."role_permissions"("permission_id" ASC);

-- CreateIndex
CREATE INDEX "idx_role_permissions_role_id" ON "public"."role_permissions"("role_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_role_permissions" ON "public"."role_permissions"("role_id" ASC, "permission_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "public"."roles"("role_name" ASC);

-- CreateIndex
CREATE INDEX "idx_routing_rules_category" ON "public"."routing_rules"("category_id" ASC, "subcategory_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_active_routing_rule" ON "public"."routing_rules"("category_id" ASC, "subcategory_id" ASC) WHERE ((status)::text = 'ACTIVE'::text);

-- CreateIndex
CREATE INDEX "idx_sessions_expires_at" ON "public"."sessions"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "idx_sessions_user_id" ON "public"."sessions"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions"("session_token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "skills_skill_name_key" ON "public"."skills"("skill_name" ASC);

-- CreateIndex
CREATE INDEX "idx_sla_policies_lookup" ON "public"."sla_policies"("priority_level" ASC, "sla_type" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_active_sla_policy_priority" ON "public"."sla_policies"("priority_level" ASC, "sla_type" ASC) WHERE (((status)::text = 'ACTIVE'::text) AND (priority_level IS NOT NULL));

-- CreateIndex
CREATE INDEX "idx_sla_tracking_dept_id" ON "public"."sla_tracking"("grievance_department_id" ASC);

-- CreateIndex
CREATE INDEX "idx_sla_tracking_grievance_id" ON "public"."sla_tracking"("grievance_id" ASC);

-- CreateIndex
CREATE INDEX "idx_sla_tracking_grievance_status" ON "public"."sla_tracking"("grievance_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "idx_sla_tracking_status_due" ON "public"."sla_tracking"("status" ASC, "due_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_subcategory_category_name" ON "public"."subcategories"("category_id" ASC, "subcategory_name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_skill" ON "public"."user_skills"("user_id" ASC, "skill_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_code_key" ON "public"."users"("employee_code" ASC);

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_grievance_department_id_fkey" FOREIGN KEY ("grievance_department_id") REFERENCES "public"."grievance_departments"("grievance_department_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."assignments" ADD CONSTRAINT "assignments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_grievance_department_id_fkey" FOREIGN KEY ("grievance_department_id") REFERENCES "public"."grievance_departments"("grievance_department_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_resolution_id_fkey" FOREIGN KEY ("resolution_id") REFERENCES "public"."resolutions"("resolution_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."escalations" ADD CONSTRAINT "escalations_escalated_to_fkey" FOREIGN KEY ("escalated_to") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."escalations" ADD CONSTRAINT "escalations_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."escalations" ADD CONSTRAINT "escalations_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "public"."sla_policies"("sla_policy_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."grievance_departments" ADD CONSTRAINT "grievance_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("department_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."grievance_departments" ADD CONSTRAINT "grievance_departments_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."grievance_status_history" ADD CONSTRAINT "grievance_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."grievance_status_history" ADD CONSTRAINT "grievance_status_history_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."grievances" ADD CONSTRAINT "grievances_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."grievances" ADD CONSTRAINT "grievances_priority_rule_id_fkey" FOREIGN KEY ("priority_rule_id") REFERENCES "public"."priority_rules"("priority_rule_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."grievances" ADD CONSTRAINT "grievances_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("subcategory_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."grievances" ADD CONSTRAINT "grievances_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."knowledge_articles" ADD CONSTRAINT "knowledge_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."knowledge_articles" ADD CONSTRAINT "knowledge_articles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."knowledge_articles" ADD CONSTRAINT "knowledge_articles_source_resolution_id_fkey" FOREIGN KEY ("source_resolution_id") REFERENCES "public"."resolutions"("resolution_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."knowledge_articles" ADD CONSTRAINT "knowledge_articles_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("subcategory_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."priority_rules" ADD CONSTRAINT "priority_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reopen_policies" ADD CONSTRAINT "reopen_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."resolution_reviews" ADD CONSTRAINT "resolution_reviews_resolution_id_fkey" FOREIGN KEY ("resolution_id") REFERENCES "public"."resolutions"("resolution_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."resolution_reviews" ADD CONSTRAINT "resolution_reviews_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."resolutions" ADD CONSTRAINT "resolutions_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."resolutions" ADD CONSTRAINT "resolutions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("permission_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."routing_rules" ADD CONSTRAINT "routing_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."routing_rules" ADD CONSTRAINT "routing_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."routing_rules" ADD CONSTRAINT "routing_rules_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("department_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."routing_rules" ADD CONSTRAINT "routing_rules_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("subcategory_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sla_policies" ADD CONSTRAINT "sla_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sla_tracking" ADD CONSTRAINT "sla_tracking_grievance_department_id_fkey" FOREIGN KEY ("grievance_department_id") REFERENCES "public"."grievance_departments"("grievance_department_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sla_tracking" ADD CONSTRAINT "sla_tracking_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "public"."grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sla_tracking" ADD CONSTRAINT "sla_tracking_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "public"."sla_policies"("sla_policy_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."subcategories" ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_skills" ADD CONSTRAINT "user_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("skill_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_skills" ADD CONSTRAINT "user_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("department_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

