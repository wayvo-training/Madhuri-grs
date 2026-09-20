-- =====================================================================
-- GRIEVANCE RESOLUTION SYSTEM (GRS) - INTERACTIVE STEP-BY-STEP WALKTHROUGH
-- Run each section one by one in pgAdmin, DBeaver, or psql to see the
-- data transform at each stage of the grievance lifecycle!
-- =====================================================================

-- =====================================================================
-- STEP 1: INSPECT YOUR STARTING SETUP
-- See your departments, categories, skills, and admin
-- =====================================================================

-- 1.1 View available departments
SELECT department_id, department_name, status FROM departments;

-- 1.2 View categories and their linked subcategories
SELECT 
    c.category_id,
    c.category_name,
    s.subcategory_id,
    s.subcategory_name
FROM categories c
JOIN subcategories s ON c.category_id = s.category_id
ORDER BY c.category_name, s.subcategory_name;

-- 1.3 View skills and SLA policies
SELECT skill_id, skill_name FROM skills;
SELECT policy_name, priority_level, target_duration_minutes, warning_threshold_percent FROM sla_policies;


-- =====================================================================
-- STEP 2: CREATE A REAL GRIEVANCE AS AN END USER
-- Imagine employee "Alice" submits a ticket about faulty Wi-Fi
-- =====================================================================

-- 2.1 Let's make sure we have a test user for Alice
INSERT INTO users (employee_code, first_name, last_name, email, password_hash, role_id, status)
SELECT 'EMP-101', 'Alice', 'Smith', 'alice.smith@grs.local', 'secret_hash', role_id, 'ACTIVE'
FROM roles WHERE role_name = 'End User'
ON CONFLICT (email) DO NOTHING;

-- 2.2 Submit the grievance ticket
INSERT INTO grievances (
    grievance_number,
    submitted_by,
    category_id,
    subcategory_id,
    title,
    description,
    priority,
    status
)
SELECT 
    'GRS-LIVE-001',
    u.user_id,
    c.category_id,
    s.subcategory_id,
    'Laptop screen flickering after docking',
    'Screen turns black for 3 seconds whenever connecting dual HDMI monitors at desk 204.',
    'MEDIUM',
    'SUBMITTED'
FROM users u, categories c, subcategories s
WHERE u.email = 'alice.smith@grs.local'
  AND c.category_name = 'IT Infrastructure & Hardware'
  AND s.subcategory_name = 'Hardware & Peripherals'
RETURNING grievance_id, grievance_number, title, priority, status, created_at;

-- 2.3 Record the initial status in history
INSERT INTO grievance_status_history (grievance_id, old_status, new_status, changed_by, remarks)
SELECT g.grievance_id, NULL, 'SUBMITTED', g.submitted_by, 'Ticket submitted by employee via web portal'
FROM grievances g WHERE g.grievance_number = 'GRS-LIVE-001';

-- Check the ticket status right now:
SELECT grievance_number, title, priority, status, reopen_count FROM grievances WHERE grievance_number = 'GRS-LIVE-001';


-- =====================================================================
-- STEP 3: ROUTING ENGINE (DEPARTMENT MAPPING)
-- The system routes the ticket to the IT Department as PRIMARY
-- =====================================================================

INSERT INTO grievance_departments (grievance_id, department_id, involvement_type, status)
SELECT g.grievance_id, d.department_id, 'PRIMARY', 'PENDING_ASSIGNMENT'
FROM grievances g, departments d
WHERE g.grievance_number = 'GRS-LIVE-001'
  AND d.department_name = 'Information Technology';

-- See the department assignment:
SELECT 
    g.grievance_number,
    d.department_name,
    gd.involvement_type,
    gd.status AS dept_status
FROM grievance_departments gd
JOIN grievances g ON gd.grievance_id = g.grievance_id
JOIN departments d ON gd.department_id = d.department_id
WHERE g.grievance_number = 'GRS-LIVE-001';


-- =====================================================================
-- STEP 4: SMART RECOMMENDATION & ASSIGNMENT
-- Find the best Staff member with "Hardware Repair" skill and assign them
-- =====================================================================

-- 4.1 Ensure we have a Hardware specialist staff member "David"
INSERT INTO users (employee_code, first_name, last_name, email, password_hash, role_id, department_id, status)
SELECT 'EMP-202', 'David', 'Kowalski', 'david.hardware@grs.local', 'secret_hash', r.role_id, d.department_id, 'ACTIVE'
FROM roles r, departments d
WHERE r.role_name = 'Staff' AND d.department_name = 'Information Technology'
ON CONFLICT (email) DO NOTHING;

-- Give David the Hardware Repair skill
INSERT INTO user_skills (user_id, skill_id, experience_years, proficiency_level)
SELECT u.user_id, s.skill_id, 3.5, 'EXPERT'
FROM users u, skills s
WHERE u.email = 'david.hardware@grs.local' AND s.skill_name = 'Hardware Repair'
ON CONFLICT DO NOTHING;

-- 4.2 Department Head reviews recommendation score and assigns David
INSERT INTO assignments (
    grievance_id,
    grievance_department_id,
    staff_id,
    recommendation_score,
    recommendation_reasons,
    assignment_status,
    assigned_by
)
SELECT 
    g.grievance_id,
    gd.grievance_department_id,
    staff.user_id,
    96.00,
    '{"skill_match": "Hardware Repair (EXPERT)", "workload": "0 active tickets", "experience_yrs": 3.5}'::jsonb,
    'ASSIGNED',
    admin_u.user_id
FROM grievances g
JOIN grievance_departments gd ON g.grievance_id = gd.grievance_id
JOIN users staff ON staff.email = 'david.hardware@grs.local'
JOIN users admin_u ON admin_u.email = 'admin@grs.local'
WHERE g.grievance_number = 'GRS-LIVE-001';

-- Update ticket status to ASSIGNED:
UPDATE grievances SET status = 'ASSIGNED' WHERE grievance_number = 'GRS-LIVE-001';
UPDATE grievance_departments SET status = 'IN_PROGRESS' 
WHERE grievance_id = (SELECT grievance_id FROM grievances WHERE grievance_number = 'GRS-LIVE-001');

-- Start SLA countdown (24 hours):
INSERT INTO sla_tracking (grievance_id, sla_policy_id, cycle_number, started_at, due_at, status)
SELECT 
    g.grievance_id,
    sp.sla_policy_id,
    1,
    NOW(),
    NOW() + INTERVAL '24 hours',
    'ON_TRACK'
FROM grievances g, sla_policies sp
WHERE g.grievance_number = 'GRS-LIVE-001' AND sp.priority_level = 'MEDIUM'
LIMIT 1;

-- Check who is assigned and the SLA clock:
SELECT 
    g.grievance_number,
    g.status AS ticket_status,
    u.first_name || ' ' || u.last_name AS assigned_staff,
    a.recommendation_score,
    a.recommendation_reasons,
    sla.due_at,
    sla.status AS sla_status
FROM grievances g
JOIN assignments a ON g.grievance_id = a.grievance_id
JOIN users u ON a.staff_id = u.user_id
JOIN sla_tracking sla ON g.grievance_id = sla.grievance_id
WHERE g.grievance_number = 'GRS-LIVE-001';


-- =====================================================================
-- STEP 5: STAFF INVESTIGATES & SUBMITS RESOLUTION #1
-- David replaces the dock cable and submits the resolution
-- =====================================================================

INSERT INTO resolutions (
    grievance_id,
    submitted_by,
    problem_summary,
    findings,
    action_taken,
    outcome,
    evidence
)
SELECT 
    g.grievance_id,
    a.staff_id,
    'Thunderbolt docking station display cutout',
    'Loose USB-C cable connector caused intermittent handshake failures with Dell dock.',
    'Replaced Thunderbolt 4 cable and updated dock firmware to v1.22.',
    'Dual 4K displays operating at 60Hz without flickering.',
    'Tested 15-minute 4K video playback with zero dropouts.'
FROM grievances g
JOIN assignments a ON g.grievance_id = a.grievance_id
WHERE g.grievance_number = 'GRS-LIVE-001';

-- Ticket moves to UNDER_REVIEW (waiting for Alice's confirmation):
UPDATE grievances SET status = 'UNDER_REVIEW' WHERE grievance_number = 'GRS-LIVE-001';

-- See the ticket waiting for User Review:
SELECT grievance_number, status, updated_at FROM grievances WHERE grievance_number = 'GRS-LIVE-001';
SELECT * FROM resolutions WHERE grievance_id = (SELECT grievance_id FROM grievances WHERE grievance_number = 'GRS-LIVE-001');


-- =====================================================================
-- STEP 6: END USER REVIEWS & REJECTS (THE REOPEN PROCESS)
-- Alice tests it, but finds the second monitor still blinks when waking from sleep
-- =====================================================================

-- 6.1 Alice logs her rejection
INSERT INTO resolution_reviews (resolution_id, reviewed_by, decision, rejection_reason)
SELECT 
    r.resolution_id,
    g.submitted_by,
    'REJECTED',
    'The flickering stopped during normal work, but the right-side monitor stays black after laptop sleeps.'
FROM resolutions r
JOIN grievances g ON r.grievance_id = g.grievance_id
WHERE g.grievance_number = 'GRS-LIVE-001';

-- 6.2 System checks policy and increments reopen_count:
UPDATE grievances 
SET 
    status = 'REOPENED',
    reopen_count = reopen_count + 1
WHERE grievance_number = 'GRS-LIVE-001';

-- 6.3 SLA Cycle 2 begins for the reopened ticket:
INSERT INTO sla_tracking (grievance_id, sla_policy_id, cycle_number, started_at, due_at, status)
SELECT 
    g.grievance_id,
    sp.sla_policy_id,
    2, -- Cycle 2!
    NOW(),
    NOW() + INTERVAL '12 hours',
    'ON_TRACK'
FROM grievances g, sla_policies sp
WHERE g.grievance_number = 'GRS-LIVE-001' AND sp.priority_level = 'MEDIUM'
LIMIT 1;

-- Notice that status is now REOPENED and reopen_count is 1:
SELECT grievance_number, status, reopen_count FROM grievances WHERE grievance_number = 'GRS-LIVE-001';
SELECT cycle_number, started_at, due_at, status FROM sla_tracking 
WHERE grievance_id = (SELECT grievance_id FROM grievances WHERE grievance_number = 'GRS-LIVE-001');

-- 6.4 Check active reopen policy and understand the max reopen guardrail:
SELECT policy_name, max_reopen_count, reopen_window_hours FROM reopen_policies WHERE status = 'ACTIVE';
-- Guardrail rule: When reopen_count < max_reopen_count, status = 'REOPENED'.
-- Once reopen_count >= max_reopen_count (e.g. 2), status moves to 'REOPEN_REVIEW' for Dept Head triage:
-- UPDATE grievances SET status = 'REOPEN_REVIEW' WHERE grievance_number = 'GRS-LIVE-001';


-- =====================================================================
-- STEP 7: STAFF FIXES ROOT CAUSE & SUBMITS RESOLUTION #2
-- David updates Intel Display Driver power management settings
-- =====================================================================

INSERT INTO resolutions (
    grievance_id,
    submitted_by,
    problem_summary,
    findings,
    action_taken,
    outcome,
    evidence
)
SELECT 
    g.grievance_id,
    a.staff_id,
    'Display sleep wake-up timeout',
    'Intel Graphics Command Center sleep state DPMS timeout set to 500ms instead of 2000ms.',
    'Configured DPMS wake-up delay registry key to 2000ms and tested sleep/wake cycle.',
    'Both monitors wake instantly upon keyboard press.',
    'Verified 5 consecutive sleep/wake cycles successfully.'
FROM grievances g
JOIN assignments a ON g.grievance_id = a.grievance_id
WHERE g.grievance_number = 'GRS-LIVE-001';

UPDATE grievances SET status = 'UNDER_REVIEW' WHERE grievance_number = 'GRS-LIVE-001';


-- =====================================================================
-- STEP 8: END USER ACCEPTS & TICKET REACHES FINAL CLOSURE
-- Alice confirms both screens wake up properly and accepts!
-- =====================================================================

-- 8.1 Alice accepts
INSERT INTO resolution_reviews (resolution_id, reviewed_by, decision)
SELECT 
    r.resolution_id,
    g.submitted_by,
    'ACCEPTED'
FROM resolutions r
JOIN grievances g ON r.grievance_id = g.grievance_id
WHERE g.grievance_number = 'GRS-LIVE-001'
ORDER BY r.submitted_at DESC
LIMIT 1;

-- 8.2 Ticket is officially CLOSED
UPDATE grievances 
SET 
    status = 'CLOSED',
    closed_at = NOW()
WHERE grievance_number = 'GRS-LIVE-001';

-- 8.3 Complete SLA cycle
UPDATE sla_tracking 
SET completed_at = NOW() 
WHERE grievance_id = (SELECT grievance_id FROM grievances WHERE grievance_number = 'GRS-LIVE-001')
  AND completed_at IS NULL;

-- 8.4 Turn the fix into a Knowledge Base article for other staff
INSERT INTO knowledge_articles (
    title,
    content,
    category_id,
    subcategory_id,
    source_resolution_id,
    created_by,
    status
)
SELECT 
    'Fix: Dell Dock Dual Monitor Sleep Wake-up Black Screen',
    'If dual monitors stay black after wake-up, adjust the Intel Graphics DPMS timeout to 2000ms and update dock firmware.',
    g.category_id,
    g.subcategory_id,
    r.resolution_id,
    r.submitted_by,
    'PUBLISHED'
FROM grievances g
JOIN resolutions r ON g.grievance_id = r.grievance_id
WHERE g.grievance_number = 'GRS-LIVE-001'
ORDER BY r.submitted_at DESC
LIMIT 1;

-- =====================================================================
-- STEP 9: FINAL VERIFICATION - INSPECT THE COMPLETED LIFECYCLE
-- =====================================================================

-- 9.1 Final Ticket Details
SELECT 
    grievance_number,
    title,
    priority,
    status,
    reopen_count,
    created_at,
    closed_at
FROM grievances 
WHERE grievance_number = 'GRS-LIVE-001';

-- 9.2 All Resolutions and User Decisions
SELECT 
    r.resolution_id,
    r.action_taken,
    r.outcome,
    rev.decision,
    rev.rejection_reason,
    r.submitted_at,
    rev.reviewed_at
FROM resolutions r
LEFT JOIN resolution_reviews rev ON r.resolution_id = rev.resolution_id
WHERE r.grievance_id = (SELECT grievance_id FROM grievances WHERE grievance_number = 'GRS-LIVE-001')
ORDER BY r.submitted_at ASC;

-- 9.3 Both SLA Cycles (Cycle 1 vs Cycle 2)
SELECT 
    cycle_number,
    started_at,
    due_at,
    completed_at,
    status
FROM sla_tracking
WHERE grievance_id = (SELECT grievance_id FROM grievances WHERE grievance_number = 'GRS-LIVE-001')
ORDER BY cycle_number ASC;
