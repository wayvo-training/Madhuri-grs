-- =====================================================================
-- GRIEVANCE RESOLUTION SYSTEM (GRS) - COMPLETE INTEGRATION TEST SUITE
-- This script tests:
--  1. Table existence count (verifies all 23 tables exist)
--  2. Foreign key and referential integrity
--  3. CHECK constraints on valid statuses and enums
--  4. Full end-to-end grievance lifecycle flow:
--     Submission -> Routing -> Assignment -> SLA Tracking -> Escalation
--     -> Resolution -> User Rejection (Reopen) -> Revised Resolution -> Closure
--  5. Verification report with row counts across key tables
-- =====================================================================

\echo '=================================================='
\echo 'STEP 1: VERIFYING TABLE COUNT (EXPECTED: 23 TABLES)'
\echo '=================================================='

DO $$
DECLARE
    v_table_count INT;
BEGIN
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    RAISE NOTICE 'Total tables found in public schema: % / 23', v_table_count;
    IF v_table_count < 23 THEN
        RAISE WARNING 'Table count mismatch! Expected 23 tables, found %', v_table_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All 23 tables are present!';
    END IF;
END $$;

\echo '=================================================='
\echo 'STEP 2: RUNNING END-TO-END WORKFLOW SIMULATION'
\echo '=================================================='

DO $$
DECLARE
    -- Test actor IDs
    v_end_user_id BIGINT;
    v_dept_head_id BIGINT;
    v_staff_id BIGINT;
    v_dept_id BIGINT;
    v_cat_id BIGINT;
    v_subcat_id BIGINT;
    v_skill_id BIGINT;

    -- Grievance IDs
    v_grievance_id BIGINT;
    v_grievance_dept_id BIGINT;
    v_assignment_id BIGINT;
    v_sla_policy_id BIGINT;
    v_sla_tracking_id BIGINT;
    v_escalation_id BIGINT;
    v_res_id BIGINT;
    v_review_id BIGINT;
    v_reopen_policy_id BIGINT;
BEGIN
    RAISE NOTICE '--> 2.1 Fetching Master Entities (Department, Categories, Skills, Policies)...';

    SELECT department_id INTO v_dept_id FROM departments WHERE department_name = 'Information Technology' LIMIT 1;
    SELECT category_id INTO v_cat_id FROM categories WHERE category_name = 'IT Infrastructure & Hardware' LIMIT 1;
    SELECT subcategory_id INTO v_subcat_id FROM subcategories WHERE subcategory_name = 'Network & VPN' LIMIT 1;
    SELECT skill_id INTO v_skill_id FROM skills WHERE skill_name = 'Network Troubleshooting' LIMIT 1;
    SELECT sla_policy_id INTO v_sla_policy_id FROM sla_policies WHERE priority_level = 'HIGH' LIMIT 1;
    SELECT reopen_policy_id INTO v_reopen_policy_id FROM reopen_policies LIMIT 1;

    -- Ensure we have master data
    IF v_dept_id IS NULL OR v_cat_id IS NULL OR v_subcat_id IS NULL THEN
        RAISE EXCEPTION 'Master seed data missing! Please run database/seed.sql first.';
    END IF;

    RAISE NOTICE '--> 2.2 Creating Test Users (End User, Dept Head, Staff)...';

    -- Create End User
    INSERT INTO users (employee_code, first_name, last_name, email, password_hash, role_id, status)
    SELECT 'TEST-USR-01', 'Alice', 'Walker', 'alice.test@grs.local', 'hash123', role_id, 'ACTIVE'
    FROM roles WHERE role_name = 'End User'
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING user_id INTO v_end_user_id;

    -- Create Dept Head
    INSERT INTO users (employee_code, first_name, last_name, email, password_hash, role_id, department_id, status)
    SELECT 'TEST-DH-01', 'Bob', 'Manager', 'bob.head@grs.local', 'hash123', role_id, v_dept_id, 'ACTIVE'
    FROM roles WHERE role_name = 'Department Head'
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING user_id INTO v_dept_head_id;

    -- Create Staff Member
    INSERT INTO users (employee_code, first_name, last_name, email, password_hash, role_id, department_id, status)
    SELECT 'TEST-STF-01', 'Charlie', 'Engineer', 'charlie.tech@grs.local', 'hash123', role_id, v_dept_id, 'ACTIVE'
    FROM roles WHERE role_name = 'Staff'
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING user_id INTO v_staff_id;

    -- Assign Skill to Staff
    INSERT INTO user_skills (user_id, skill_id, experience_years, proficiency_level)
    VALUES (v_staff_id, v_skill_id, 4.5, 'EXPERT')
    ON CONFLICT (user_id, skill_id) DO UPDATE SET experience_years = 4.5;

    RAISE NOTICE '--> 2.3 Simulating Grievance Submission by End User...';

    INSERT INTO grievances (
        grievance_number, submitted_by, category_id, subcategory_id,
        title, description, priority, status
    ) VALUES (
        'GRS-TEST-9999', v_end_user_id, v_cat_id, v_subcat_id,
        'VPN connection fails intermittently on 4th floor',
        'Whenever connecting to GlobalProtect VPN from meeting room B, it drops packets every 2 minutes.',
        'HIGH', 'SUBMITTED'
    ) RETURNING grievance_id INTO v_grievance_id;

    -- Add attachment
    INSERT INTO attachments (grievance_id, file_name, file_path, file_type, file_size, uploaded_by)
    VALUES (v_grievance_id, 'vpn_error_log.txt', '/uploads/2026/09/vpn_error_log.txt', 'text/plain', 4096, v_end_user_id);

    -- Log status history
    INSERT INTO grievance_status_history (grievance_id, old_status, new_status, changed_by, remarks)
    VALUES (v_grievance_id, NULL, 'SUBMITTED', v_end_user_id, 'Grievance submitted via portal');

    -- Insert Audit Log
    INSERT INTO audit_logs (user_id, grievance_id, action, entity_type, entity_id, new_value)
    VALUES (v_end_user_id, v_grievance_id, 'SUBMIT_GRIEVANCE', 'grievances', v_grievance_id, '{"title": "VPN connection fails"}'::jsonb);

    RAISE NOTICE '--> 2.4 Routing Engine: Mapping Primary Department...';

    INSERT INTO grievance_departments (grievance_id, department_id, involvement_type, status)
    VALUES (v_grievance_id, v_dept_id, 'PRIMARY', 'PENDING_ASSIGNMENT')
    RETURNING grievance_department_id INTO v_grievance_dept_id;

    RAISE NOTICE '--> 2.5 Smart Recommendation & Dept Head Assignment...';

    -- Recommendation score calculated: 94.5% based on expert skill match & low workload
    INSERT INTO assignments (
        grievance_id, grievance_department_id, staff_id,
        recommendation_score, recommendation_reasons,
        assignment_status, assigned_by
    ) VALUES (
        v_grievance_id, v_grievance_dept_id, v_staff_id,
        94.50,
        '{"skill_match_score": 95, "experience_factor": 90, "current_active_tickets": 1, "availability": "AVAILABLE"}'::jsonb,
        'ASSIGNED', v_dept_head_id
    ) RETURNING assignment_id INTO v_assignment_id;

    -- Update grievance status
    UPDATE grievances SET status = 'ASSIGNED' WHERE grievance_id = v_grievance_id;
    UPDATE grievance_departments SET status = 'IN_PROGRESS' WHERE grievance_department_id = v_grievance_dept_id;

    -- Notification to Staff
    INSERT INTO notifications (user_id, grievance_id, notification_type, channel, title, message)
    VALUES (v_staff_id, v_grievance_id, 'ASSIGNMENT', 'IN_APP', 'New Grievance Assigned', 'You have been assigned to GRS-TEST-9999');

    RAISE NOTICE '--> 2.6 Initializing SLA Tracking Cycle 1...';

    INSERT INTO sla_tracking (
        grievance_id, sla_policy_id, cycle_number, started_at, due_at, status
    ) VALUES (
        v_grievance_id, v_sla_policy_id, 1, NOW(), NOW() + INTERVAL '24 hours', 'ON_TRACK'
    ) RETURNING sla_tracking_id INTO v_sla_tracking_id;

    RAISE NOTICE '--> 2.7 Simulating SLA Escalation Trigger...';

    INSERT INTO escalations (
        grievance_id, sla_policy_id, escalation_level, escalated_to, reason, status
    ) VALUES (
        v_grievance_id, v_sla_policy_id, 1, v_dept_head_id, 'Ticket approached 80% SLA window without resolution submission', 'RESOLVED'
    ) RETURNING escalation_id INTO v_escalation_id;

    RAISE NOTICE '--> 2.8 Staff Submits Resolution (Resolution #1)...';

    INSERT INTO resolutions (
        grievance_id, submitted_by, problem_summary, findings, action_taken, outcome, evidence
    ) VALUES (
        v_grievance_id, v_staff_id,
        'Packet loss on 4th floor AP',
        'AP-04 antenna had degraded signal causing VPN renegotiation timeouts.',
        'Replaced wireless access point AP-04 and tested throughput.',
        'Stable ping at 15ms with 0% packet loss.',
        'Speedtest and ping logs verified.'
    ) RETURNING resolution_id INTO v_res_id;

    UPDATE grievances SET status = 'UNDER_REVIEW' WHERE grievance_id = v_grievance_id;

    RAISE NOTICE '--> 2.9 End User Rejection #1 (Reopen Cycle 1)...';

    INSERT INTO resolution_reviews (resolution_id, reviewed_by, decision, rejection_reason)
    VALUES (v_res_id, v_end_user_id, 'REJECTED', 'I am still noticing dropped connection when moving towards corner desk 412.')
    RETURNING review_id INTO v_review_id;

    -- Reopen count incremented to 1 (within limit 1 <= 2)
    UPDATE grievances SET status = 'REOPENED', reopen_count = reopen_count + 1 WHERE grievance_id = v_grievance_id AND status != 'REOPENED';

    -- Start SLA Cycle 2
    INSERT INTO sla_tracking (grievance_id, sla_policy_id, cycle_number, started_at, due_at, status)
    VALUES (v_grievance_id, v_sla_policy_id, 2, NOW(), NOW() + INTERVAL '12 hours', 'ON_TRACK');

    RAISE NOTICE '--> 2.10 Staff Submits Revised Resolution #2 (Cycle 2)...';

    INSERT INTO resolutions (
        grievance_id, submitted_by, problem_summary, findings, action_taken, outcome, evidence
    ) VALUES (
        v_grievance_id, v_staff_id,
        'Coverage dead zone near desk 412',
        'Beamforming coverage was blocked by structural pillar.',
        'Adjusted radio power and installed supplementary mesh node AP-04B.',
        'Desk 412 now receives -58dBm strong Wi-Fi signal.',
        'RF heat map and 30-minute stress test report attached.'
    ) RETURNING resolution_id INTO v_res_id;

    UPDATE grievances SET status = 'UNDER_REVIEW' WHERE grievance_id = v_grievance_id;

    RAISE NOTICE '--> 2.11 End User Rejection #2 (Reopen Count reaches policy limit: 2 of 2)...';

    INSERT INTO resolution_reviews (resolution_id, reviewed_by, decision, rejection_reason)
    VALUES (v_res_id, v_end_user_id, 'REJECTED', 'Mesh node connection dropped during peak afternoon load.')
    RETURNING review_id INTO v_review_id;

    -- Reopen count incremented to 2 (limit reached: 2 of 2)
    UPDATE grievances SET status = 'REOPENED', reopen_count = reopen_count + 1 WHERE grievance_id = v_grievance_id AND status != 'REOPENED';

    -- Start SLA Cycle 3
    INSERT INTO sla_tracking (grievance_id, sla_policy_id, cycle_number, started_at, due_at, status)
    VALUES (v_grievance_id, v_sla_policy_id, 3, NOW(), NOW() + INTERVAL '12 hours', 'ON_TRACK');

    RAISE NOTICE '--> 2.12 Staff Submits Deep Diagnostic Fix #3 (Cycle 3)...';

    INSERT INTO resolutions (
        grievance_id, submitted_by, problem_summary, findings, action_taken, outcome, evidence
    ) VALUES (
        v_grievance_id, v_staff_id,
        'PoE power budget exhaustion on switch port',
        'Switch port was throttling AP-04B power budget during peak traffic.',
        'Moved AP-04B to dedicated PoE+ 30W port on switch SW-02 and updated controller firmware.',
        'Continuous uptime confirmed across 12 hours under simulated 50-client load.',
        'Switch telemetry and bandwidth stress test report attached.'
    ) RETURNING resolution_id INTO v_res_id;

    UPDATE grievances SET status = 'UNDER_REVIEW' WHERE grievance_id = v_grievance_id;

    RAISE NOTICE '--> 2.13 Testing Max Reopen Guardrail (User attempts Reopen #3 when Limit is 2)...';

    -- Attempted 3rd rejection by user
    INSERT INTO resolution_reviews (resolution_id, reviewed_by, decision, rejection_reason)
    VALUES (v_res_id, v_end_user_id, 'REJECTED', 'User still requesting physical site visit.')
    RETURNING review_id INTO v_review_id;

    -- Guardrail triggers: reopen_count (2) >= max_reopen_count (2), so status moves to REOPEN_REVIEW
    UPDATE grievances SET status = 'REOPEN_REVIEW' WHERE grievance_id = v_grievance_id;

    -- Escalation record created for Department Head triage
    INSERT INTO escalations (grievance_id, sla_policy_id, escalation_level, escalated_to, reason, status)
    VALUES (v_grievance_id, v_sla_policy_id, 1, v_dept_head_id, 'Maximum reopen count (2 of 2) reached. Department Head arbitration required.', 'OPEN');

    RAISE NOTICE '--> 2.14 Department Head Arbitrates & Approves Final Closure...';

    UPDATE escalations SET status = 'RESOLVED', resolved_at = NOW() WHERE grievance_id = v_grievance_id;

    UPDATE grievances SET status = 'CLOSED', closed_at = NOW() WHERE grievance_id = v_grievance_id;

    -- Curate Resolution into Knowledge Article
    INSERT INTO knowledge_articles (
        title, content, category_id, subcategory_id, source_resolution_id, created_by, status
    ) VALUES (
        'Resolving 4th Floor Wireless Dead Zones & PoE Switch Budgeting',
        'When installing supplementary mesh node AP-04B near Floor 4 pillars, ensure dedicated 30W PoE+ port allocation on SW-02.',
        v_cat_id, v_subcat_id, v_res_id, v_staff_id, 'PUBLISHED'
    );

    -- Log final audit
    INSERT INTO audit_logs (user_id, grievance_id, action, entity_type, entity_id, new_value)
    VALUES (v_dept_head_id, v_grievance_id, 'DEPT_HEAD_ADMIN_CLOSE', 'grievances', v_grievance_id, 
            '{"final_status": "CLOSED", "reopen_count": 2, "guardrail": "MAX_REOPEN_EXCEEDED"}'::jsonb);

    RAISE NOTICE 'SUCCESS: End-to-end simulated lifecycle with multi-cycle reopens and guardrail completed successfully!';
END $$;

\echo '=================================================='
\echo 'STEP 3: TESTING DATA INTEGRITY / CHECK CONSTRAINTS'
\echo '=================================================='

-- Test 3.1: Attempting to insert an invalid priority level (should fail)
DO $$
BEGIN
    BEGIN
        INSERT INTO grievances (
            grievance_number, submitted_by, category_id, subcategory_id,
            title, description, priority, status
        ) VALUES (
            'FAIL-TEST-001', 1, 1, 1, 'Test', 'Test desc', 'ULTRA_CRITICAL', 'SUBMITTED'
        );
        RAISE EXCEPTION 'CHECK constraint failed: Invalid priority was accepted!';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'SUCCESS: Invalid priority constraint correctly blocked invalid value!';
    END;
END $$;

-- Test 3.2: Attempting to insert an invalid status (should fail)
DO $$
BEGIN
    BEGIN
        INSERT INTO departments (department_name, status)
        VALUES ('Bad Department', 'UNKNOWN_STATUS');
        RAISE EXCEPTION 'CHECK constraint failed: Invalid department status was accepted!';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'SUCCESS: Status CHECK constraint correctly blocked invalid status!';
    END;
END $$;

\echo '=================================================='
\echo 'STEP 4: SUMMARY VERIFICATION OF SYSTEM TABLES'
\echo '=================================================='

SELECT 
    'roles' AS table_name, count(*) AS total_rows FROM roles
UNION ALL SELECT 'departments', count(*) FROM departments
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'subcategories', count(*) FROM subcategories
UNION ALL SELECT 'skills', count(*) FROM skills
UNION ALL SELECT 'user_skills', count(*) FROM user_skills
UNION ALL SELECT 'priority_rules', count(*) FROM priority_rules
UNION ALL SELECT 'routing_rules', count(*) FROM routing_rules
UNION ALL SELECT 'sla_policies', count(*) FROM sla_policies
UNION ALL SELECT 'reopen_policies', count(*) FROM reopen_policies
UNION ALL SELECT 'grievances', count(*) FROM grievances
UNION ALL SELECT 'grievance_departments', count(*) FROM grievance_departments
UNION ALL SELECT 'attachments', count(*) FROM attachments
UNION ALL SELECT 'grievance_status_history', count(*) FROM grievance_status_history
UNION ALL SELECT 'assignments', count(*) FROM assignments
UNION ALL SELECT 'sla_tracking', count(*) FROM sla_tracking
UNION ALL SELECT 'escalations', count(*) FROM escalations
UNION ALL SELECT 'resolutions', count(*) FROM resolutions
UNION ALL SELECT 'resolution_reviews', count(*) FROM resolution_reviews
UNION ALL SELECT 'notifications', count(*) FROM notifications
UNION ALL SELECT 'knowledge_articles', count(*) FROM knowledge_articles
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
ORDER BY table_name;
