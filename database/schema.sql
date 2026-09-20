-- ============================================================
-- GRS - GRIEVANCE RESOLUTION SYSTEM
-- PostgreSQL Database Schema
-- ============================================================
-- Time Zone : Asia/Kolkata (IST)
-- ORM       : Prisma
-- Database  : PostgreSQL
-- Tables    : 27
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SET TIME ZONE 'Asia/Kolkata';


-- ============================================================
-- 1. USER & ROLE MANAGEMENT
-- ============================================================

CREATE TABLE roles (
    role_id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE permissions (
    permission_id BIGSERIAL PRIMARY KEY,
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE departments (
    department_id BIGSERIAL PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    role_id BIGINT NOT NULL
        REFERENCES roles(role_id),

    department_id BIGINT
        REFERENCES departments(department_id)
        ON DELETE SET NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE role_permissions (
    role_permission_id BIGSERIAL PRIMARY KEY,

    role_id BIGINT NOT NULL
        REFERENCES roles(role_id)
        ON DELETE CASCADE,

    permission_id BIGINT NOT NULL
        REFERENCES permissions(permission_id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_role_permissions
        UNIQUE (role_id, permission_id)
);


CREATE TABLE sessions (
    session_id UUID PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);


CREATE TABLE password_reset_tokens (
    password_reset_token_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. ORGANIZATION & CLASSIFICATION
-- ============================================================

CREATE TABLE categories (
    category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(150) UNIQUE NOT NULL,
    description VARCHAR(255),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE subcategories (
    subcategory_id BIGSERIAL PRIMARY KEY,

    category_id BIGINT NOT NULL
        REFERENCES categories(category_id)
        ON DELETE CASCADE,

    subcategory_name VARCHAR(150) NOT NULL,
    description VARCHAR(255),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_subcategory_category_name
        UNIQUE (category_id, subcategory_name)
);


-- ============================================================
-- 3. PRIORITY & ROUTING
-- ============================================================

CREATE TABLE priority_rules (
    priority_rule_id BIGSERIAL PRIMARY KEY,

    rule_name VARCHAR(150) NOT NULL,
    conditions JSONB NOT NULL,

    priority_level VARCHAR(20) NOT NULL
        CHECK (priority_level IN (
            'LOW',
            'MEDIUM',
            'HIGH',
            'CRITICAL'
        )),

    rule_order INT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_by BIGINT NOT NULL
        REFERENCES users(user_id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE UNIQUE INDEX uq_active_default_priority
ON priority_rules (is_default)
WHERE is_default = TRUE
  AND status = 'ACTIVE';


CREATE TABLE routing_rules (
    routing_rule_id BIGSERIAL PRIMARY KEY,

    rule_name VARCHAR(150) NOT NULL,

    category_id BIGINT
        REFERENCES categories(category_id)
        ON DELETE SET NULL,

    subcategory_id BIGINT
        REFERENCES subcategories(subcategory_id)
        ON DELETE SET NULL,

    conditions JSONB,

    department_id BIGINT NOT NULL
        REFERENCES departments(department_id),

    involvement_type VARCHAR(20) NOT NULL
        CHECK (involvement_type IN (
            'PRIMARY',
            'SUPPORTING',
            'EQUAL'
        )),

    supporting_departments JSONB,

    rule_order INT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_by BIGINT NOT NULL
        REFERENCES users(user_id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 4. GRIEVANCE MANAGEMENT
-- ============================================================

CREATE TABLE grievances (
    grievance_id BIGSERIAL PRIMARY KEY,

    grievance_number VARCHAR(50) UNIQUE NOT NULL,

    submitted_by BIGINT NOT NULL
        REFERENCES users(user_id),

    category_id BIGINT NOT NULL
        REFERENCES categories(category_id),

    subcategory_id BIGINT NOT NULL
        REFERENCES subcategories(subcategory_id),

    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,

    priority VARCHAR(20) NOT NULL
        CHECK (priority IN (
            'LOW',
            'MEDIUM',
            'HIGH',
            'CRITICAL'
        )),

    priority_rule_id BIGINT
        REFERENCES priority_rules(priority_rule_id)
        ON DELETE SET NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN (
            'SUBMITTED',
            'ROUTED',
            'ASSIGNED',
            'IN_PROGRESS',
            'UNDER_REVIEW',
            'REOPENED',
            'REOPEN_REVIEW',
            'CLOSED',
            'ESCALATED'
        )),

    reopen_count INT NOT NULL DEFAULT 0
        CHECK (reopen_count >= 0),

    manual_review_count INT NOT NULL DEFAULT 0
        CHECK (manual_review_count >= 0),

    sla_status VARCHAR(20)
        CHECK (sla_status IN (
            'ON_TRACK',
            'AT_RISK',
            'BREACHED'
        )),

    due_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ
);


CREATE TABLE grievance_departments (
    grievance_department_id BIGSERIAL PRIMARY KEY,

    grievance_id BIGINT NOT NULL
        REFERENCES grievances(grievance_id)
        ON DELETE CASCADE,

    department_id BIGINT NOT NULL
        REFERENCES departments(department_id),

    involvement_type VARCHAR(20) NOT NULL
        CHECK (involvement_type IN (
            'PRIMARY',
            'SUPPORTING',
            'EQUAL'
        )),

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_ASSIGNMENT',

    assigned_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    CONSTRAINT uq_grievance_department
        UNIQUE (grievance_id, department_id)
);


CREATE UNIQUE INDEX uq_grievance_single_primary
ON grievance_departments (grievance_id)
WHERE involvement_type = 'PRIMARY';


CREATE TABLE grievance_status_history (
    history_id BIGSERIAL PRIMARY KEY,

    grievance_id BIGINT NOT NULL
        REFERENCES grievances(grievance_id)
        ON DELETE CASCADE,

    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,

    changed_by BIGINT NOT NULL
        REFERENCES users(user_id),

    remarks TEXT,

    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE attachments (
    attachment_id BIGSERIAL PRIMARY KEY,

    grievance_id BIGINT NOT NULL
        REFERENCES grievances(grievance_id)
        ON DELETE CASCADE,

    grievance_department_id BIGINT
        REFERENCES grievance_departments(grievance_department_id)
        ON DELETE SET NULL,

    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,

    file_size BIGINT
        CHECK (file_size IS NULL OR file_size >= 0),

    uploaded_by BIGINT NOT NULL
        REFERENCES users(user_id),

    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 5. STAFF RECOMMENDATION & ASSIGNMENT
-- ============================================================

CREATE TABLE skills (
    skill_id BIGSERIAL PRIMARY KEY,

    skill_name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE user_skills (
    user_skill_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    skill_id BIGINT NOT NULL
        REFERENCES skills(skill_id)
        ON DELETE CASCADE,

    experience_years DECIMAL(4,1)
        CHECK (
            experience_years IS NULL
            OR experience_years >= 0
        ),

    proficiency_level VARCHAR(30),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_user_skill
        UNIQUE (user_id, skill_id)
);


CREATE TABLE assignments (
    assignment_id BIGSERIAL PRIMARY KEY,

    grievance_id BIGINT NOT NULL
        REFERENCES grievances(grievance_id)
        ON DELETE CASCADE,

    grievance_department_id BIGINT NOT NULL
        REFERENCES grievance_departments(grievance_department_id)
        ON DELETE CASCADE,

    staff_id BIGINT NOT NULL
        REFERENCES users(user_id),

    recommendation_score DECIMAL(5,2),

    recommendation_reasons JSONB,

    assignment_status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',

    assigned_by BIGINT NOT NULL
        REFERENCES users(user_id),

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    completed_at TIMESTAMPTZ
);


CREATE UNIQUE INDEX uq_active_assignment
ON assignments (grievance_department_id)
WHERE assignment_status = 'ASSIGNED';


-- ============================================================
-- 6. SLA & ESCALATION
-- ============================================================

CREATE TABLE sla_policies (
    sla_policy_id BIGSERIAL PRIMARY KEY,

    policy_name VARCHAR(150) NOT NULL,

    priority_level VARCHAR(20)
        CHECK (priority_level IN (
            'LOW',
            'MEDIUM',
            'HIGH',
            'CRITICAL'
        )),

    sla_type VARCHAR(30) NOT NULL DEFAULT 'RESOLUTION'
        CHECK (sla_type IN (
            'ASSIGNMENT',
            'RESOLUTION'
        )),

    target_duration_minutes INT NOT NULL
        CHECK (target_duration_minutes > 0),

    warning_threshold_percent DECIMAL(5,2) NOT NULL
        CHECK (
            warning_threshold_percent > 0
            AND warning_threshold_percent < 100
        ),

    trigger_condition JSONB,

    escalation_level INT NOT NULL DEFAULT 1
        CHECK (escalation_level > 0),

    target_role VARCHAR(30) NOT NULL DEFAULT 'DEPARTMENT_HEAD'
        CHECK (target_role IN (
            'DEPARTMENT_HEAD',
            'ADMIN',
            'STAFF'
        )),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_by BIGINT NOT NULL
        REFERENCES users(user_id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE UNIQUE INDEX uq_active_sla_policy_priority
ON sla_policies (priority_level, sla_type)
WHERE status = 'ACTIVE'
  AND priority_level IS NOT NULL;


CREATE TABLE sla_tracking (
    sla_tracking_id BIGSERIAL PRIMARY KEY,

    grievance_id BIGINT NOT NULL
        REFERENCES grievances(grievance_id)
        ON DELETE CASCADE,

    sla_policy_id BIGINT NOT NULL
        REFERENCES sla_policies(sla_policy_id),

    cycle_number INT NOT NULL DEFAULT 1
        CHECK (cycle_number > 0),

    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_at TIMESTAMPTZ NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ON_TRACK'
        CHECK (status IN (
            'ON_TRACK',
            'AT_RISK',
            'BREACHED'
        )),

    paused_at TIMESTAMPTZ,
    resumed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);


CREATE TABLE escalations (
    escalation_id BIGSERIAL PRIMARY KEY,

    grievance_id BIGINT NOT NULL
        REFERENCES grievances(grievance_id)
        ON DELETE CASCADE,

    sla_policy_id BIGINT
        REFERENCES sla_policies(sla_policy_id)
        ON DELETE SET NULL,

    escalation_level INT NOT NULL DEFAULT 1
        CHECK (escalation_level > 0),

    escalated_to BIGINT NOT NULL
        REFERENCES users(user_id),

    reason TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN (
            'OPEN',
            'RESOLVED'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);


-- ============================================================
-- 7. RESOLUTION, REVIEW & REOPEN
-- ============================================================

CREATE TABLE reopen_policies (
    reopen_policy_id BIGSERIAL PRIMARY KEY,

    policy_name VARCHAR(150) NOT NULL,

    reopen_window_hours INT
        CHECK (
            reopen_window_hours IS NULL
            OR reopen_window_hours > 0
        ),

    max_reopen_count INT NOT NULL
        CHECK (max_reopen_count >= 0),

    max_manual_review_count INT NOT NULL
        CHECK (max_manual_review_count > 0),

    applicable_condition JSONB,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),

    created_by BIGINT NOT NULL
        REFERENCES users(user_id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE resolutions (
    resolution_id BIGSERIAL PRIMARY KEY,

    grievance_id BIGINT NOT NULL
        REFERENCES grievances(grievance_id)
        ON DELETE CASCADE,

    submitted_by BIGINT NOT NULL
        REFERENCES users(user_id),

    problem_summary TEXT NOT NULL,
    findings TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    outcome TEXT NOT NULL,
    evidence TEXT,

    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE resolution_reviews (
    review_id BIGSERIAL PRIMARY KEY,

    resolution_id BIGINT NOT NULL
        REFERENCES resolutions(resolution_id)
        ON DELETE CASCADE,

    reviewed_by BIGINT NOT NULL
        REFERENCES users(user_id),

    decision VARCHAR(20) NOT NULL
        CHECK (decision IN (
            'ACCEPTED',
            'REJECTED'
        )),

    rejection_reason TEXT,

    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_rejection_reason
        CHECK (
            decision = 'ACCEPTED'
            OR NULLIF(TRIM(rejection_reason), '') IS NOT NULL
        )
);


ALTER TABLE attachments
ADD COLUMN resolution_id BIGINT
REFERENCES resolutions(resolution_id)
ON DELETE SET NULL;


-- ============================================================
-- 8. NOTIFICATION & KNOWLEDGE BASE
-- ============================================================

CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    grievance_id BIGINT
        REFERENCES grievances(grievance_id)
        ON DELETE CASCADE,

    notification_type VARCHAR(50) NOT NULL,

    channel VARCHAR(20) NOT NULL
        CHECK (channel IN (
            'IN_APP',
            'EMAIL',
            'SMS'
        )),

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING',
            'SENT',
            'FAILED',
            'READ'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);


CREATE TABLE knowledge_articles (
    article_id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,

    category_id BIGINT
        REFERENCES categories(category_id)
        ON DELETE SET NULL,

    subcategory_id BIGINT
        REFERENCES subcategories(subcategory_id)
        ON DELETE SET NULL,

    source_resolution_id BIGINT
        REFERENCES resolutions(resolution_id)
        ON DELETE SET NULL,

    created_by BIGINT NOT NULL
        REFERENCES users(user_id),

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN (
            'DRAFT',
            'PUBLISHED',
            'ARCHIVED'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 9. AUDIT
-- ============================================================

CREATE TABLE audit_logs (
    audit_log_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    grievance_id BIGINT
        REFERENCES grievances(grievance_id)
        ON DELETE CASCADE,

    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT,

    old_value JSONB,
    new_value JSONB,

    ip_address VARCHAR(45),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 10. PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX idx_role_permissions_role_id
ON role_permissions(role_id);

CREATE INDEX idx_role_permissions_permission_id
ON role_permissions(permission_id);

CREATE INDEX idx_sessions_user_id
ON sessions(user_id);

CREATE INDEX idx_sessions_expires_at
ON sessions(expires_at);

CREATE INDEX idx_password_reset_tokens_user_id
ON password_reset_tokens(user_id);

CREATE INDEX idx_password_reset_tokens_expires_at
ON password_reset_tokens(expires_at);


CREATE INDEX idx_grievances_submitted_by
ON grievances(submitted_by);

CREATE INDEX idx_grievances_status
ON grievances(status);

CREATE INDEX idx_grievances_priority
ON grievances(priority);

CREATE INDEX idx_grievances_category_id
ON grievances(category_id);

CREATE INDEX idx_grievances_created_at
ON grievances(created_at);


CREATE INDEX idx_grievance_dept_grievance_id
ON grievance_departments(grievance_id);

CREATE INDEX idx_grievance_dept_dept_id
ON grievance_departments(department_id);

CREATE INDEX idx_grievance_dept_status
ON grievance_departments(status);

CREATE INDEX idx_grievance_dept_dept_status
ON grievance_departments(department_id, status);


CREATE INDEX idx_attachments_grievance_id
ON attachments(grievance_id);

CREATE INDEX idx_attachments_resolution_id
ON attachments(resolution_id);


CREATE INDEX idx_routing_rules_category
ON routing_rules(category_id, subcategory_id);


CREATE INDEX idx_assignments_staff_id
ON assignments(staff_id);

CREATE INDEX idx_assignments_grievance_id
ON assignments(grievance_id);

CREATE INDEX idx_assignments_status
ON assignments(assignment_status);

CREATE INDEX idx_assignments_staff_status
ON assignments(staff_id, assignment_status);


CREATE INDEX idx_sla_policies_lookup
ON sla_policies(priority_level, sla_type, status);

CREATE INDEX idx_sla_tracking_grievance_id
ON sla_tracking(grievance_id);

CREATE INDEX idx_sla_tracking_status_due
ON sla_tracking(status, due_at);

CREATE INDEX idx_sla_tracking_grievance_status
ON sla_tracking(grievance_id, status);

CREATE INDEX idx_escalations_grievance_id
ON escalations(grievance_id);

CREATE INDEX idx_escalations_status
ON escalations(status);


CREATE INDEX idx_notifications_user_status
ON notifications(user_id, status);

CREATE INDEX idx_notifications_grievance_id
ON notifications(grievance_id);


CREATE INDEX idx_knowledge_articles_fts
ON knowledge_articles
USING GIN (
    to_tsvector(
        'english',
        title || ' ' || content
    )
);


CREATE INDEX idx_audit_logs_grievance_id
ON audit_logs(grievance_id);

CREATE INDEX idx_audit_logs_user_id
ON audit_logs(user_id);

CREATE INDEX idx_audit_logs_created_at
ON audit_logs(created_at);


-- ============================================================
-- END OF GRS DATABASE SCHEMA
-- ============================================================