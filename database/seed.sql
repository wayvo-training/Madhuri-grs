-- ============================================================
-- GRS - GRIEVANCE RESOLUTION SYSTEM
-- MOCK / SEED DATA
-- ============================================================

SET TIME ZONE 'Asia/Kolkata';


-- ============================================================
-- 1. USER & ROLE MANAGEMENT
-- ============================================================

-- ------------------------------------------------------------
-- 1.1 ROLES
-- ------------------------------------------------------------

INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'ADMIN', 'Full system administration and configuration access'),
(2, 'END_USER', 'Employee who submits and tracks grievances'),
(3, 'STAFF', 'Staff member who processes assigned grievances'),
(4, 'DEPARTMENT_HEAD', 'Department Head who reviews and assigns grievances');


-- ------------------------------------------------------------
-- 1.2 PERMISSIONS
-- ------------------------------------------------------------

INSERT INTO permissions
(permission_id, permission_name, permission_code, description)
VALUES
(1, 'Create Grievance', 'CREATE_GRIEVANCE',
 'Submit a new grievance'),

(2, 'View Own Grievances', 'VIEW_OWN_GRIEVANCES',
 'View grievances submitted by the employee'),

(3, 'Process Grievance', 'PROCESS_GRIEVANCE',
 'Process assigned grievances'),

(4, 'Assign Staff', 'ASSIGN_STAFF',
 'Assign grievances to staff members'),

(5, 'Manage Rules', 'MANAGE_RULES',
 'Manage priority, routing and SLA rules'),

(6, 'Manage Users', 'MANAGE_USERS',
 'Manage users and roles'),

(7, 'View Reports', 'VIEW_REPORTS',
 'View grievance reports and dashboards'),

(8, 'Review Resolution', 'REVIEW_RESOLUTION',
 'Accept or reject submitted resolutions');


-- ------------------------------------------------------------
-- 1.3 ROLE PERMISSIONS
-- ------------------------------------------------------------

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),
(2,1),(2,2),(2,8),
(3,2),(3,3),
(4,2),(4,3),(4,4),(4,7),(4,8);


-- ------------------------------------------------------------
-- 1.4 DEPARTMENTS
-- ------------------------------------------------------------

INSERT INTO departments
(department_id, department_name, description)
VALUES
(1, 'Human Resources',
 'Handles employee relations, employment and HR-related grievances'),

(2, 'Finance',
 'Handles compensation, salary, benefits and reimbursement grievances'),

(3, 'Facilities',
 'Handles workplace environment, safety and facility-related grievances'),

(4, 'Management',
 'Handles management and leadership related grievances'),

(5, 'Compliance',
 'Handles ethics, compliance and policy-related grievances');


-- ------------------------------------------------------------
-- 1.5 USERS
-- ------------------------------------------------------------

INSERT INTO users
(user_id, employee_code, first_name, last_name, email,
 password_hash, role_id, department_id)
VALUES

(1, 'EMP001', 'System', 'Admin',
 'admin@grs.local',
 '$2b$10$dummyhash', 1, NULL),

(2, 'EMP002', 'Bhavya', 'Rao',
 'bhavya.rao@company.com',
 '$2b$10$dummyhash', 2, 1),

(3, 'EMP003', 'Rahul', 'Kumar',
 'rahul.kumar@company.com',
 '$2b$10$dummyhash', 2, 2),

(4, 'EMP004', 'Sneha', 'Reddy',
 'sneha.reddy@company.com',
 '$2b$10$dummyhash', 2, 3),

(5, 'EMP005', 'Arjun', 'Sharma',
 'arjun.sharma@company.com',
 '$2b$10$dummyhash', 2, 4),

(6, 'EMP006', 'Ananya', 'Krishnan',
 'ananya.krishnan@company.com',
 '$2b$10$dummyhash', 2, 5),

(7, 'EMP007', 'Priya', 'Nair',
 'priya.nair@company.com',
 '$2b$10$dummyhash', 3, 1),

(8, 'EMP008', 'Kiran', 'Rao',
 'kiran.rao@company.com',
 '$2b$10$dummyhash', 3, 2),

(9, 'EMP009', 'Meena', 'Patel',
 'meena.patel@company.com',
 '$2b$10$dummyhash', 3, 3),

(10, 'EMP010', 'Vikram', 'Reddy',
 'vikram.reddy@company.com',
 '$2b$10$dummyhash', 3, 4),

(11, 'EMP011', 'Anjali', 'Sharma',
 'anjali.sharma@company.com',
 '$2b$10$dummyhash', 3, 5),

(12, 'EMP012', 'Ravi', 'Varma',
 'ravi.varma@company.com',
 '$2b$10$dummyhash', 4, 1),

(13, 'EMP013', 'Lakshmi', 'Iyer',
 'lakshmi.iyer@company.com',
 '$2b$10$dummyhash', 4, 2),

(14, 'EMP014', 'Suresh', 'Babu',
 'suresh.babu@company.com',
 '$2b$10$dummyhash', 4, 3),

(15, 'EMP015', 'Divya', 'Menon',
 'divya.menon@company.com',
 '$2b$10$dummyhash', 4, 4),

(16, 'EMP016', 'Naveen', 'Rao',
 'naveen.rao@company.com',
 '$2b$10$dummyhash', 4, 5);


-- ============================================================
-- 2. ORGANIZATION & CLASSIFICATION
-- ============================================================

-- ------------------------------------------------------------
-- 2.1 CATEGORIES
-- ------------------------------------------------------------

INSERT INTO categories
(category_id, category_name, description)
VALUES
(1, 'Compensation & Benefits',
 'Salary, benefits, deductions and reimbursement grievances'),

(2, 'Leave & Attendance',
 'Leave, attendance and working-hours related grievances'),

(3, 'Workplace Conduct',
 'Workplace behavior, conduct and employee interaction grievances'),

(4, 'HR & Employment',
 'Employment, performance, promotion and role-related grievances'),

(5, 'Management & Leadership',
 'Management conduct, unfair treatment and leadership concerns'),

(6, 'Policy & Process',
 'Policy interpretation, process delays and policy concerns'),

(7, 'Work Environment',
 'Workplace safety, cleanliness and hygiene concerns'),

(8, 'Ethics & Compliance',
 'Ethical, confidentiality and compliance concerns'),

(9, 'Career & Development',
 'Training, learning and career development concerns'),

(10, 'Workplace Services',
 'Employee transport, cafeteria and workplace services');


-- ------------------------------------------------------------
-- 2.2 SUBCATEGORIES
-- ------------------------------------------------------------

INSERT INTO subcategories
(subcategory_id, category_id, subcategory_name, description)
VALUES
(1, 1, 'Salary & Pay',
 'Concerns related to salary and payroll'),

(2, 1, 'Incorrect Deduction',
 'Incorrect or unexpected salary deduction'),

(3, 1, 'Benefits',
 'Employee benefits related concern'),

(4, 2, 'Leave Approval',
 'Concern regarding leave approval'),

(5, 2, 'Attendance Correction',
 'Incorrect attendance record'),

(6, 3, 'Unprofessional Conduct',
 'Concern regarding unprofessional workplace behavior'),

(7, 3, 'Workplace Conflict',
 'Conflict between employees or teams'),

(8, 4, 'Performance Evaluation',
 'Concern regarding performance evaluation'),

(9, 4, 'Promotion & Role',
 'Concern regarding promotion or role assignment'),

(10, 5, 'Managerial Conduct',
 'Concern regarding managerial behavior'),

(11, 5, 'Unfair Treatment',
 'Concern regarding perceived unfair treatment'),

(12, 6, 'Policy Concern',
 'Concern regarding organizational policy'),

(13, 6, 'Process Delay',
 'Delay in an organizational process'),

(14, 7, 'Cleanliness & Hygiene',
 'Workplace cleanliness and hygiene concern'),

(15, 7, 'Workplace Safety',
 'Workplace safety concern'),

(16, 8, 'Confidentiality Concern',
 'Concern involving confidentiality'),

(17, 8, 'Ethical Concern',
 'Concern involving ethical conduct'),

(18, 9, 'Career Growth',
 'Career progression concern'),

(19, 9, 'Training & Learning',
 'Training and learning opportunity concern'),

(20, 10, 'Cafeteria Services',
 'Cafeteria-related employee service concern'),

(21, 10, 'Transport Services',
 'Employee transport service concern');


-- ============================================================
-- 3. PRIORITY & ROUTING
-- ============================================================

-- ------------------------------------------------------------
-- 3.1 PRIORITY RULES
-- ------------------------------------------------------------

INSERT INTO priority_rules
(priority_rule_id, rule_name, conditions, priority_level,
 rule_order, is_default, status, created_by)
VALUES

(1,
 'Critical Workplace Safety',
 '{"subcategory":"Workplace Safety"}',
 'CRITICAL',
 1,
 FALSE,
 'ACTIVE',
 1),

(2,
 'High Unfair Treatment',
 '{"subcategory":"Unfair Treatment"}',
 'HIGH',
 2,
 FALSE,
 'ACTIVE',
 1),

(3,
 'High Confidentiality Concern',
 '{"subcategory":"Confidentiality Concern"}',
 'HIGH',
 3,
 FALSE,
 'ACTIVE',
 1),

(4,
 'Medium Process Concern',
 '{"subcategory":"Process Delay"}',
 'MEDIUM',
 4,
 FALSE,
 'ACTIVE',
 1),

(5,
 'Default Medium Priority',
 '{"default":true}',
 'MEDIUM',
 100,
 TRUE,
 'ACTIVE',
 1);


-- ------------------------------------------------------------
-- 3.2 ROUTING RULES
-- ------------------------------------------------------------

INSERT INTO routing_rules
(routing_rule_id, rule_name, category_id, subcategory_id,
 conditions, department_id, involvement_type,
 supporting_departments, rule_order, status, created_by)
VALUES

(1,
 'Salary and Pay to Finance',
 1, 1, '{}',
 2, 'PRIMARY', NULL, 1, 'ACTIVE', 1),

(2,
 'Incorrect Deduction to Finance',
 1, 2, '{}',
 2, 'PRIMARY', NULL, 2, 'ACTIVE', 1),

(3,
 'Leave Approval to HR',
 2, 4, '{}',
 1, 'PRIMARY', NULL, 3, 'ACTIVE', 1),

(4,
 'Attendance Correction to HR',
 2, 5, '{}',
 1, 'PRIMARY', NULL, 4, 'ACTIVE', 1),

(5,
 'Unprofessional Conduct to HR',
 3, 6, '{}',
 1, 'PRIMARY', NULL, 5, 'ACTIVE', 1),

(6,
 'Workplace Conflict to HR',
 3, 7, '{}',
 1, 'PRIMARY', NULL, 6, 'ACTIVE', 1),

(7,
 'Performance Evaluation to HR',
 4, 8, '{}',
 1, 'PRIMARY', NULL, 7, 'ACTIVE', 1),

(8,
 'Promotion and Role to HR',
 4, 9, '{}',
 1, 'PRIMARY', NULL, 8, 'ACTIVE', 1),

(9,
 'Managerial Conduct to Management',
 5, 10, '{}',
 4, 'PRIMARY', NULL, 9, 'ACTIVE', 1),

(10,
 'Unfair Treatment to Management',
 5, 11, '{}',
 4, 'PRIMARY', NULL, 10, 'ACTIVE', 1),

(11,
 'Policy Concern to Compliance',
 6, 12, '{}',
 5, 'PRIMARY', NULL, 11, 'ACTIVE', 1),

(12,
 'Process Delay to HR',
 6, 13, '{}',
 1, 'PRIMARY', NULL, 12, 'ACTIVE', 1),

(13,
 'Cleanliness to Facilities',
 7, 14, '{}',
 3, 'PRIMARY', NULL, 13, 'ACTIVE', 1),

(14,
 'Workplace Safety to Facilities',
 7, 15, '{}',
 3, 'PRIMARY', NULL, 14, 'ACTIVE', 1),

(15,
 'Confidentiality Concern to Compliance',
 8, 16, '{}',
 5, 'PRIMARY', NULL, 15, 'ACTIVE', 1),

(16,
 'Ethical Concern to Compliance',
 8, 17, '{}',
 5, 'PRIMARY', NULL, 16, 'ACTIVE', 1),

(17,
 'Career Growth to HR',
 9, 18, '{}',
 1, 'PRIMARY', NULL, 17, 'ACTIVE', 1),

(18,
 'Training and Learning to HR',
 9, 19, '{}',
 1, 'PRIMARY', NULL, 18, 'ACTIVE', 1),

(19,
 'Cafeteria Services to Facilities',
 10, 20, '{}',
 3, 'PRIMARY', NULL, 19, 'ACTIVE', 1),

(20,
 'Transport Services to Facilities',
 10, 21, '{}',
 3, 'PRIMARY', NULL, 20, 'ACTIVE', 1),

(21,
 'Managerial Conduct with HR Support',
 5, 10,
 '{"requires_hr_support":true}',
 4,
 'PRIMARY',
 '[1]',
 21,
 'ACTIVE',
 1);


-- ============================================================
-- 4. GRIEVANCE MANAGEMENT
-- ============================================================

-- ------------------------------------------------------------
-- 4.1 GRIEVANCES
-- ------------------------------------------------------------

INSERT INTO grievances
(grievance_id, grievance_number, submitted_by,
 category_id, subcategory_id, title, description,
 priority, priority_rule_id, status,
 reopen_count, manual_review_count,
 sla_status, due_at, created_at, updated_at)
VALUES

(1,
 'GRS-2026-0001',
 2,
 1,
 1,
 'Salary discrepancy in monthly pay',
 'The salary credited for the current month does not match the expected salary amount.',
 'MEDIUM',
 5,
 'SUBMITTED',
 0,
 0,
 'ON_TRACK',
 CURRENT_TIMESTAMP + INTERVAL '3 days',
 CURRENT_TIMESTAMP - INTERVAL '2 hours',
 CURRENT_TIMESTAMP - INTERVAL '2 hours'),

(2,
 'GRS-2026-0002',
 3,
 2,
 4,
 'Leave approval pending',
 'A submitted leave request has not been processed within the expected time.',
 'MEDIUM',
 5,
 'ROUTED',
 0,
 0,
 'ON_TRACK',
 CURRENT_TIMESTAMP + INTERVAL '2 days',
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 CURRENT_TIMESTAMP - INTERVAL '1 hour'),

(3,
 'GRS-2026-0003',
 4,
 3,
 6,
 'Unprofessional workplace communication',
 'I would like to report repeated unprofessional communication during workplace interactions.',
 'MEDIUM',
 5,
 'ASSIGNED',
 0,
 0,
 'ON_TRACK',
 CURRENT_TIMESTAMP + INTERVAL '2 days',
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 CURRENT_TIMESTAMP - INTERVAL '3 hours'),

(4,
 'GRS-2026-0004',
 5,
 5,
 11,
 'Concern regarding unfair treatment',
 'I believe there has been inconsistent treatment in the allocation of responsibilities within my team.',
 'HIGH',
 2,
 'IN_PROGRESS',
 0,
 0,
 'AT_RISK',
 CURRENT_TIMESTAMP + INTERVAL '8 hours',
 CURRENT_TIMESTAMP - INTERVAL '2 days',
 CURRENT_TIMESTAMP - INTERVAL '30 minutes'),

(5,
 'GRS-2026-0005',
 3,
 1,
 2,
 'Incorrect salary deduction',
 'An amount was deducted from my salary that does not appear to match the applicable deduction.',
 'MEDIUM',
 5,
 'CLOSED',
 0,
 0,
 'ON_TRACK',
 CURRENT_TIMESTAMP - INTERVAL '3 days',
 CURRENT_TIMESTAMP - INTERVAL '10 days',
 CURRENT_TIMESTAMP - INTERVAL '3 days'),

(6,
 'GRS-2026-0006',
 4,
 4,
 8,
 'Performance evaluation concern',
 'I would like clarification regarding the evaluation recorded during the recent review cycle.',
 'MEDIUM',
 5,
 'REOPENED',
 1,
 0,
 'ON_TRACK',
 CURRENT_TIMESTAMP + INTERVAL '2 days',
 CURRENT_TIMESTAMP - INTERVAL '8 days',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

(7,
 'GRS-2026-0007',
 5,
 5,
 10,
 'Managerial conduct concern',
 'I raised a concern regarding repeated communication issues with my reporting manager.',
 'MEDIUM',
 5,
 'REOPEN_REVIEW',
 2,
 0,
 'ON_TRACK',
 CURRENT_TIMESTAMP + INTERVAL '1 day',
 CURRENT_TIMESTAMP - INTERVAL '12 days',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

(8,
 'GRS-2026-0008',
 4,
 7,
 15,
 'Workplace safety concern',
 'A workplace safety condition requires immediate attention and review.',
 'CRITICAL',
 1,
 'ESCALATED',
 0,
 0,
 'BREACHED',
 CURRENT_TIMESTAMP - INTERVAL '4 hours',
 CURRENT_TIMESTAMP - INTERVAL '2 days',
 CURRENT_TIMESTAMP - INTERVAL '1 hour');


-- ------------------------------------------------------------
-- 4.2 GRIEVANCE DEPARTMENTS
-- ------------------------------------------------------------

INSERT INTO grievance_departments
(grievance_department_id, grievance_id, department_id,
 involvement_type, status, assigned_at, completed_at)
VALUES

(1, 1, 2, 'PRIMARY', 'PENDING_ASSIGNMENT', NULL, NULL),

(2, 2, 1, 'PRIMARY', 'PENDING_ASSIGNMENT', NULL, NULL),

(3, 3, 1, 'PRIMARY',
 'ASSIGNED',
 CURRENT_TIMESTAMP - INTERVAL '20 hours',
 NULL),

(4, 4, 4, 'PRIMARY',
 'ASSIGNED',
 CURRENT_TIMESTAMP - INTERVAL '30 hours',
 NULL),

(5, 5, 2, 'PRIMARY',
 'COMPLETED',
 CURRENT_TIMESTAMP - INTERVAL '9 days',
 CURRENT_TIMESTAMP - INTERVAL '3 days'),

(6, 6, 1, 'PRIMARY',
 'ASSIGNED',
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 NULL),

(7, 7, 4, 'PRIMARY',
 'ASSIGNED',
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 NULL),

(8, 8, 3, 'PRIMARY',
 'ASSIGNED',
 CURRENT_TIMESTAMP - INTERVAL '2 days',
 NULL),

(9, 8, 5, 'SUPPORTING',
 'ASSIGNED',
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 NULL);


-- ------------------------------------------------------------
-- 4.3 GRIEVANCE STATUS HISTORY
-- ------------------------------------------------------------

INSERT INTO grievance_status_history
(grievance_id, old_status, new_status, changed_by, remarks, changed_at)
VALUES

(1, NULL, 'SUBMITTED', 2,
 'Grievance submitted by End User',
 CURRENT_TIMESTAMP - INTERVAL '2 hours'),

(2, NULL, 'SUBMITTED', 3,
 'Grievance submitted by End User',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

(2, 'SUBMITTED', 'ROUTED', 1,
 'Routed to Human Resources based on category and subcategory',
 CURRENT_TIMESTAMP - INTERVAL '1 hour'),

(3, NULL, 'SUBMITTED', 4,
 'Grievance submitted by End User',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

(3, 'SUBMITTED', 'ROUTED', 1,
 'Routed to Human Resources',
 CURRENT_TIMESTAMP - INTERVAL '22 hours'),

(3, 'ROUTED', 'ASSIGNED', 12,
 'Department Head assigned Staff',
 CURRENT_TIMESTAMP - INTERVAL '20 hours'),

(4, NULL, 'SUBMITTED', 5,
 'Grievance submitted by End User',
 CURRENT_TIMESTAMP - INTERVAL '2 days'),

(4, 'SUBMITTED', 'ROUTED', 1,
 'Routed to Management',
 CURRENT_TIMESTAMP - INTERVAL '40 hours'),

(4, 'ROUTED', 'ASSIGNED', 15,
 'Department Head assigned Staff',
 CURRENT_TIMESTAMP - INTERVAL '30 hours'),

(4, 'ASSIGNED', 'IN_PROGRESS', 10,
 'Staff started processing the grievance',
 CURRENT_TIMESTAMP - INTERVAL '29 hours'),

(5, NULL, 'SUBMITTED', 3,
 'Grievance submitted by End User',
 CURRENT_TIMESTAMP - INTERVAL '10 days'),

(5, 'SUBMITTED', 'ROUTED', 1,
 'Routed to Finance',
 CURRENT_TIMESTAMP - INTERVAL '9 days'),

(5, 'ROUTED', 'ASSIGNED', 13,
 'Department Head assigned Finance Staff',
 CURRENT_TIMESTAMP - INTERVAL '9 days'),

(5, 'ASSIGNED', 'IN_PROGRESS', 8,
 'Staff started investigation',
 CURRENT_TIMESTAMP - INTERVAL '8 days'),

(5, 'IN_PROGRESS', 'UNDER_REVIEW', 8,
 'Resolution submitted for End User review',
 CURRENT_TIMESTAMP - INTERVAL '4 days'),

(5, 'UNDER_REVIEW', 'CLOSED', 3,
 'End User accepted the resolution',
 CURRENT_TIMESTAMP - INTERVAL '3 days'),

(6, NULL, 'SUBMITTED', 4,
 'Grievance submitted by End User',
 CURRENT_TIMESTAMP - INTERVAL '8 days'),

(6, 'SUBMITTED', 'ROUTED', 1,
 'Routed to HR',
 CURRENT_TIMESTAMP - INTERVAL '7 days'),

(6, 'ROUTED', 'ASSIGNED', 12,
 'Assigned to HR Staff',
 CURRENT_TIMESTAMP - INTERVAL '7 days'),

(6, 'ASSIGNED', 'IN_PROGRESS', 7,
 'Staff processed the grievance',
 CURRENT_TIMESTAMP - INTERVAL '6 days'),

(6, 'IN_PROGRESS', 'UNDER_REVIEW', 7,
 'Resolution submitted',
 CURRENT_TIMESTAMP - INTERVAL '4 days'),

(6, 'UNDER_REVIEW', 'REOPENED', 4,
 'End User rejected the resolution with a reason',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

(7, NULL, 'SUBMITTED', 5,
 'Grievance submitted by End User',
 CURRENT_TIMESTAMP - INTERVAL '12 days'),

(7, 'SUBMITTED', 'ROUTED', 1,
 'Routed to Management',
 CURRENT_TIMESTAMP - INTERVAL '11 days'),

(7, 'ROUTED', 'ASSIGNED', 15,
 'Assigned to Management Staff',
 CURRENT_TIMESTAMP - INTERVAL '10 days'),

(7, 'ASSIGNED', 'IN_PROGRESS', 10,
 'Staff processed the grievance',
 CURRENT_TIMESTAMP - INTERVAL '9 days'),

(7, 'IN_PROGRESS', 'UNDER_REVIEW', 10,
 'Resolution submitted',
 CURRENT_TIMESTAMP - INTERVAL '7 days'),

(7, 'UNDER_REVIEW', 'REOPENED', 5,
 'Resolution rejected by End User',
 CURRENT_TIMESTAMP - INTERVAL '6 days'),

(7, 'REOPENED', 'UNDER_REVIEW', 10,
 'Resolution submitted again',
 CURRENT_TIMESTAMP - INTERVAL '4 days'),

(7, 'UNDER_REVIEW', 'REOPENED', 5,
 'Maximum normal reopen count reached; manual review required',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

(7, 'REOPENED', 'REOPEN_REVIEW', 15,
 'Sent to Department Head for manual review',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

(8, NULL, 'SUBMITTED', 4,
 'Critical workplace safety grievance submitted',
 CURRENT_TIMESTAMP - INTERVAL '2 days'),

(8, 'SUBMITTED', 'ROUTED', 1,
 'Routed to Facilities',
 CURRENT_TIMESTAMP - INTERVAL '46 hours'),

(8, 'ROUTED', 'ASSIGNED', 14,
 'Assigned to Facilities Staff',
 CURRENT_TIMESTAMP - INTERVAL '40 hours'),

(8, 'ASSIGNED', 'IN_PROGRESS', 9,
 'Staff started investigation',
 CURRENT_TIMESTAMP - INTERVAL '38 hours'),

(8, 'IN_PROGRESS', 'ESCALATED', 1,
 'SLA breached and escalation initiated',
 CURRENT_TIMESTAMP - INTERVAL '1 hour');


-- ------------------------------------------------------------
-- 4.4 ATTACHMENTS
-- ------------------------------------------------------------

INSERT INTO attachments
(attachment_id, grievance_id, grievance_department_id,
 file_name, file_path, file_type, file_size, uploaded_by)
VALUES

(1, 1, 1,
 'salary_statement.pdf',
 '/uploads/grievances/GRS-2026-0001/salary_statement.pdf',
 'application/pdf',
 245760,
 2),

(2, 4, 4,
 'communication_record.pdf',
 '/uploads/grievances/GRS-2026-0004/communication_record.pdf',
 'application/pdf',
 182400,
 5),

(3, 8, 8,
 'safety_observation.jpg',
 '/uploads/grievances/GRS-2026-0008/safety_observation.jpg',
 'image/jpeg',
 356800,
 4);


-- ============================================================
-- 5. STAFF RECOMMENDATION & ASSIGNMENT
-- ============================================================

-- ------------------------------------------------------------
-- 5.1 SKILLS
-- ------------------------------------------------------------

INSERT INTO skills
(skill_id, skill_name, description)
VALUES
(1, 'Employee Relations',
 'Handling employee relations and workplace concerns'),

(2, 'Payroll Management',
 'Knowledge of salary and payroll processes'),

(3, 'Conflict Resolution',
 'Handling workplace conflicts'),

(4, 'Performance Management',
 'Understanding employee performance processes'),

(5, 'Policy Interpretation',
 'Understanding and interpreting organizational policies'),

(6, 'Compliance Management',
 'Handling compliance and ethical concerns'),

(7, 'Workplace Safety',
 'Workplace safety and risk management'),

(8, 'Facilities Management',
 'Managing workplace facilities and services');


-- ------------------------------------------------------------
-- 5.2 USER SKILLS
-- ------------------------------------------------------------

INSERT INTO user_skills
(user_skill_id, user_id, skill_id,
 experience_years, proficiency_level)
VALUES

(1, 7, 1, 4.5, 'EXPERT'),
(2, 7, 3, 3.0, 'ADVANCED'),
(3, 7, 4, 2.5, 'INTERMEDIATE'),

(4, 8, 2, 5.0, 'EXPERT'),
(5, 8, 5, 3.5, 'ADVANCED'),

(6, 9, 7, 4.0, 'EXPERT'),
(7, 9, 8, 5.0, 'EXPERT'),

(8, 10, 1, 3.0, 'ADVANCED'),
(9, 10, 3, 4.0, 'EXPERT'),

(10, 11, 6, 4.5, 'EXPERT'),
(11, 11, 5, 3.5, 'ADVANCED');


-- ------------------------------------------------------------
-- 5.3 ASSIGNMENTS
-- ------------------------------------------------------------

INSERT INTO assignments
(assignment_id, grievance_id, grievance_department_id,
 staff_id, recommendation_score, recommendation_reasons,
 assignment_status, assigned_by, assigned_at, completed_at)
VALUES

(1,
 3, 3, 7,
 94.50,
 '{"matched_skills":["Employee Relations","Conflict Resolution"],"experience_match":true,"workload":"LOW","availability":"AVAILABLE","sla_risk":"LOW"}',
 'ASSIGNED',
 12,
 CURRENT_TIMESTAMP - INTERVAL '20 hours',
 NULL),

(2,
 4, 4, 10,
 91.20,
 '{"matched_skills":["Employee Relations","Conflict Resolution"],"experience_match":true,"workload":"MEDIUM","availability":"AVAILABLE","sla_risk":"MEDIUM"}',
 'ASSIGNED',
 15,
 CURRENT_TIMESTAMP - INTERVAL '30 hours',
 NULL),

(3,
 5, 5, 8,
 96.40,
 '{"matched_skills":["Payroll Management","Policy Interpretation"],"experience_match":true,"workload":"LOW","availability":"AVAILABLE","sla_risk":"LOW"}',
 'COMPLETED',
 13,
 CURRENT_TIMESTAMP - INTERVAL '9 days',
 CURRENT_TIMESTAMP - INTERVAL '3 days'),

(4,
 6, 6, 7,
 89.70,
 '{"matched_skills":["Performance Management"],"experience_match":true,"workload":"MEDIUM","availability":"AVAILABLE","sla_risk":"MEDIUM"}',
 'REASSIGNED',
 12,
 CURRENT_TIMESTAMP - INTERVAL '7 days',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

(5,
 6, 6, 7,
 93.10,
 '{"matched_skills":["Employee Relations","Performance Management"],"experience_match":true,"workload":"LOW","availability":"AVAILABLE","sla_risk":"LOW"}',
 'ASSIGNED',
 12,
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 NULL),

(6,
 8, 8, 9,
 98.00,
 '{"matched_skills":["Workplace Safety","Facilities Management"],"experience_match":true,"workload":"LOW","availability":"AVAILABLE","sla_risk":"HIGH"}',
 'ASSIGNED',
 14,
 CURRENT_TIMESTAMP - INTERVAL '40 hours',
 NULL);


-- ============================================================
-- 6. SLA & ESCALATION
-- ============================================================

-- ------------------------------------------------------------
-- 6.1 SLA POLICIES
-- ------------------------------------------------------------

INSERT INTO sla_policies
(
    sla_policy_id,
    policy_name,
    priority_level,
    sla_type,
    target_duration_minutes,
    warning_threshold_percent,
    escalation_threshold_percent,
    trigger_condition,
    escalation_level,
    target_role,
    status,
    created_by
)
VALUES

(
    1,
    'Low Priority Resolution SLA',
    'LOW',
    'RESOLUTION',
    4320,
    50.00,
    75.00,
    '{"breach_at_percent":100}',
    1,
    'STAFF',
    'ACTIVE',
    1
),

(
    2,
    'Medium Priority Resolution SLA',
    'MEDIUM',
    'RESOLUTION',
    2880,
    50.00,
    75.00,
    '{"breach_at_percent":100}',
    1,
    'STAFF',
    'ACTIVE',
    1
),

(
    3,
    'High Priority Resolution SLA',
    'HIGH',
    'RESOLUTION',
    1440,
    50.00,
    75.00,
    '{"breach_at_percent":100}',
    2,
    'DEPARTMENT_HEAD',
    'ACTIVE',
    1
),

(
    4,
    'Critical Priority Resolution SLA',
    'CRITICAL',
    'RESOLUTION',
    720,
    50.00,
    75.00,
    '{"breach_at_percent":100}',
    3,
    'DEPARTMENT_HEAD',
    'ACTIVE',
    1
);


-- ------------------------------------------------------------
-- 6.2 SLA TRACKING
-- ------------------------------------------------------------

INSERT INTO sla_tracking
(sla_tracking_id, grievance_id, sla_policy_id,
 cycle_number, started_at, due_at, status)
VALUES

(1,
 1,
 2,
 1,
 CURRENT_TIMESTAMP - INTERVAL '2 hours',
 CURRENT_TIMESTAMP + INTERVAL '46 hours',
 'ON_TRACK'),

(2,
 3,
 2,
 1,
 CURRENT_TIMESTAMP - INTERVAL '24 hours',
 CURRENT_TIMESTAMP + INTERVAL '24 hours',
 'AT_RISK'),

(3,
 4,
 3,
 1,
 CURRENT_TIMESTAMP - INTERVAL '18 hours',
 CURRENT_TIMESTAMP + INTERVAL '6 hours',
 'AT_RISK'),

(4,
 5,
 2,
 1,
 CURRENT_TIMESTAMP - INTERVAL '10 days',
 CURRENT_TIMESTAMP - INTERVAL '3 days',
 'ON_TRACK'),

(5,
 6,
 2,
 2,
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 CURRENT_TIMESTAMP + INTERVAL '47 hours',
 'ON_TRACK'),

(6,
 8,
 4,
 1,
 CURRENT_TIMESTAMP - INTERVAL '14 hours',
 CURRENT_TIMESTAMP - INTERVAL '4 hours',
 'BREACHED');


-- ------------------------------------------------------------
-- 6.3 ESCALATIONS
-- ------------------------------------------------------------

INSERT INTO escalations
(escalation_id, grievance_id, sla_policy_id,
 escalation_level, escalated_to, reason, status,
 created_at, resolved_at)
VALUES

(1,
 4,
 3,
 1,
 15,
 'SLA reached the configured escalation threshold and requires Department Head attention.',
 'OPEN',
 CURRENT_TIMESTAMP - INTERVAL '2 hours',
 NULL),

(2,
 8,
 4,
 2,
 14,
 'Critical grievance SLA has been breached and requires Department Head intervention.',
 'OPEN',
 CURRENT_TIMESTAMP - INTERVAL '1 hour',
 NULL);


-- ============================================================
-- 7. RESOLUTION, REVIEW & REOPEN
-- ============================================================

-- ------------------------------------------------------------
-- 7.1 REOPEN POLICIES
-- ------------------------------------------------------------

INSERT INTO reopen_policies
(reopen_policy_id, policy_name, reopen_window_hours,
 max_reopen_count, max_manual_review_count,
 applicable_condition, status, created_by)
VALUES

(1,
 'Standard Reopen Policy',
 72,
 2,
 2,
 '{"applicable_priorities":["LOW","MEDIUM","HIGH"]}',
 'ACTIVE',
 1),

(2,
 'Critical Reopen Policy',
 48,
 1,
 2,
 '{"applicable_priorities":["CRITICAL"]}',
 'ACTIVE',
 1);


-- ------------------------------------------------------------
-- 7.2 RESOLUTIONS
-- ------------------------------------------------------------

INSERT INTO resolutions
(resolution_id, grievance_id, submitted_by,
 problem_summary, findings, action_taken,
 outcome, evidence, submitted_at)
VALUES

(1,
 5,
 8,
 'Incorrect salary deduction was reported.',
 'Payroll records were reviewed and the deduction was found to be incorrect.',
 'The incorrect deduction was corrected in the payroll record.',
 'The deducted amount was adjusted and reflected in the subsequent payroll.',
 'Payroll correction record attached.',
 CURRENT_TIMESTAMP - INTERVAL '4 days'),

(2,
 6,
 7,
 'Performance evaluation concern was reviewed.',
 'The evaluation was reviewed with the relevant HR records.',
 'The evaluation was discussed with the employee and clarification was provided.',
 'Employee requested further review of the evaluation.',
 'Evaluation review notes available.',
 CURRENT_TIMESTAMP - INTERVAL '5 days'),

(3,
 7,
 10,
 'Managerial conduct concern was investigated.',
 'The reported interactions were reviewed with the concerned parties.',
 'A discussion was conducted and corrective communication guidance was provided.',
 'Employee requested further review after the proposed resolution.',
 'Review meeting notes available.',
 CURRENT_TIMESTAMP - INTERVAL '7 days');


-- ------------------------------------------------------------
-- 7.3 RESOLUTION REVIEWS
-- ------------------------------------------------------------

INSERT INTO resolution_reviews
(review_id, resolution_id, reviewed_by,
 decision, rejection_reason, reviewed_at)
VALUES

(1,
 1,
 3,
 'ACCEPTED',
 NULL,
 CURRENT_TIMESTAMP - INTERVAL '3 days'),

(2,
 2,
 4,
 'REJECTED',
 'The clarification provided did not fully address the concerns raised regarding the evaluation.',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

(3,
 3,
 5,
 'REJECTED',
 'The proposed resolution did not adequately address the reported management concern.',
 CURRENT_TIMESTAMP - INTERVAL '6 days');


-- ------------------------------------------------------------
-- 7.4 PROOF OF RESOLUTION ATTACHMENT
-- ------------------------------------------------------------

INSERT INTO attachments
(
    attachment_id,
    grievance_id,
    grievance_department_id,
    file_name,
    file_path,
    file_type,
    file_size,
    uploaded_by,
    resolution_id
)
VALUES
(
    4,
    5,
    5,
    'payroll_correction.pdf',
    '/uploads/grievances/GRS-2026-0005/payroll_correction.pdf',
    'application/pdf',
    198450,
    8,
    1
);


-- ============================================================
-- 8. NOTIFICATION & KNOWLEDGE BASE
-- ============================================================

-- ------------------------------------------------------------
-- 8.1 NOTIFICATIONS
-- ------------------------------------------------------------

INSERT INTO notifications
(notification_id, user_id, grievance_id,
 notification_type, channel, title, message,
 status, created_at, sent_at, read_at)
VALUES

(1,
 7,
 3,
 'SLA_REMINDER',
 'IN_APP',
 'SLA Reminder',
 'GRS-2026-0003 has reached the configured SLA reminder threshold.',
 'SENT',
 CURRENT_TIMESTAMP - INTERVAL '30 minutes',
 CURRENT_TIMESTAMP - INTERVAL '29 minutes',
 NULL),

(2,
 7,
 3,
 'SLA_REMINDER',
 'EMAIL',
 'SLA Reminder - GRS-2026-0003',
 'Please review the SLA progress for GRS-2026-0003.',
 'SENT',
 CURRENT_TIMESTAMP - INTERVAL '30 minutes',
 CURRENT_TIMESTAMP - INTERVAL '29 minutes',
 NULL),

(3,
 7,
 3,
 'SLA_REMINDER',
 'SMS',
 'SLA Reminder',
 'GRS-2026-0003 has reached its configured SLA reminder threshold.',
 'SENT',
 CURRENT_TIMESTAMP - INTERVAL '30 minutes',
 CURRENT_TIMESTAMP - INTERVAL '29 minutes',
 NULL),

(4,
 15,
 4,
 'SLA_ESCALATION',
 'IN_APP',
 'SLA Escalation',
 'GRS-2026-0004 requires Department Head attention.',
 'SENT',
 CURRENT_TIMESTAMP - INTERVAL '2 hours',
 CURRENT_TIMESTAMP - INTERVAL '119 minutes',
 NULL),

(5,
 15,
 4,
 'SLA_ESCALATION',
 'EMAIL',
 'SLA Escalation - GRS-2026-0004',
 'GRS-2026-0004 has reached the configured escalation threshold.',
 'SENT',
 CURRENT_TIMESTAMP - INTERVAL '2 hours',
 CURRENT_TIMESTAMP - INTERVAL '119 minutes',
 NULL),

(6,
 15,
 4,
 'SLA_ESCALATION',
 'SMS',
 'SLA Escalation',
 'GRS-2026-0004 requires Department Head attention.',
 'SENT',
 CURRENT_TIMESTAMP - INTERVAL '2 hours',
 CURRENT_TIMESTAMP - INTERVAL '119 minutes',
 NULL),

(7,
 3,
 5,
 'RESOLUTION_ACCEPTED',
 'IN_APP',
 'Grievance Resolved',
 'Your resolution for GRS-2026-0005 was accepted.',
 'READ',
 CURRENT_TIMESTAMP - INTERVAL '3 days',
 CURRENT_TIMESTAMP - INTERVAL '3 days',
 CURRENT_TIMESTAMP - INTERVAL '3 days'),

(8,
 4,
 6,
 'GRIEVANCE_REOPENED',
 'EMAIL',
 'Grievance Reopened',
 'GRS-2026-0006 has been reopened for further processing.',
 'SENT',
 CURRENT_TIMESTAMP - INTERVAL '1 day',
 CURRENT_TIMESTAMP - INTERVAL '23 hours',
 NULL),

(9,
 14,
 8,
 'SLA_BREACH',
 'IN_APP',
 'Critical SLA Breach',
 'GRS-2026-0008 has breached its SLA and requires immediate attention.',
 'SENT',
 CURRENT_TIMESTAMP - INTERVAL '1 hour',
 CURRENT_TIMESTAMP - INTERVAL '59 minutes',
 NULL),

(10,
 14,
 8,
 'SLA_BREACH',
 'SMS',
 'Critical SLA Breach',
 'GRS-2026-0008 has breached its SLA.',
 'SENT',
 CURRENT_TIMESTAMP - INTERVAL '1 hour',
 CURRENT_TIMESTAMP - INTERVAL '59 minutes',
 NULL);


-- ------------------------------------------------------------
-- 8.2 KNOWLEDGE ARTICLES
-- ------------------------------------------------------------

INSERT INTO knowledge_articles
(article_id, title, content,
 category_id, subcategory_id,
 source_resolution_id, created_by, status)
VALUES

(1,
 'Salary Deduction Review Process',
 'Steps for reviewing salary deductions, validating payroll records and documenting the resolution.',
 1,
 2,
 1,
 13,
 'PUBLISHED'),

(2,
 'Handling Workplace Conduct Concerns',
 'Guidelines for documenting workplace conduct concerns and processing them through the grievance workflow.',
 3,
 6,
 NULL,
 12,
 'PUBLISHED'),

(3,
 'Employee Performance Review Process',
 'Guidance for handling employee concerns related to performance evaluations.',
 4,
 8,
 2,
 12,
 'PUBLISHED'),

(4,
 'Workplace Safety Grievance Handling',
 'Guidelines for recording, routing and escalating workplace safety concerns.',
 7,
 15,
 NULL,
 14,
 'PUBLISHED');


-- ============================================================
-- 9. AUDIT
-- ============================================================

INSERT INTO audit_logs
(audit_log_id, user_id, grievance_id,
 action, entity_type, entity_id,
 old_value, new_value, ip_address, created_at)
VALUES

(1,
 2,
 1,
 'CREATE',
 'GRIEVANCE',
 1,
 NULL,
 '{"status":"SUBMITTED","priority":"MEDIUM"}',
 '192.168.1.101',
 CURRENT_TIMESTAMP - INTERVAL '2 hours'),

(2,
 1,
 2,
 'ROUTE',
 'GRIEVANCE',
 2,
 '{"status":"SUBMITTED"}',
 '{"status":"ROUTED","department_id":1}',
 '192.168.1.10',
 CURRENT_TIMESTAMP - INTERVAL '1 hour'),

(3,
 12,
 3,
 'ASSIGN',
 'ASSIGNMENT',
 1,
 NULL,
 '{"staff_id":7,"recommendation_score":94.50}',
 '192.168.1.12',
 CURRENT_TIMESTAMP - INTERVAL '20 hours'),

(4,
 15,
 4,
 'ASSIGN',
 'ASSIGNMENT',
 2,
 NULL,
 '{"staff_id":10,"recommendation_score":91.20}',
 '192.168.1.15',
 CURRENT_TIMESTAMP - INTERVAL '30 hours'),

(5,
 8,
 5,
 'SUBMIT_RESOLUTION',
 'RESOLUTION',
 1,
 NULL,
 '{"outcome":"The deducted amount was adjusted"}',
 '192.168.1.18',
 CURRENT_TIMESTAMP - INTERVAL '4 days'),

(6,
 3,
 5,
 'ACCEPT_RESOLUTION',
 'RESOLUTION_REVIEW',
 1,
 '{"decision":"PENDING"}',
 '{"decision":"ACCEPTED"}',
 '192.168.1.103',
 CURRENT_TIMESTAMP - INTERVAL '3 days'),

(7,
 4,
 6,
 'REJECT_RESOLUTION',
 'RESOLUTION_REVIEW',
 2,
 '{"decision":"PENDING"}',
 '{"decision":"REJECTED","reason":"Further review required"}',
 '192.168.1.104',
 CURRENT_TIMESTAMP - INTERVAL '1 day'),

(8,
 1,
 8,
 'SLA_BREACH',
 'SLA',
 6,
 '{"status":"AT_RISK"}',
 '{"status":"BREACHED"}',
 '192.168.1.10',
 CURRENT_TIMESTAMP - INTERVAL '1 hour');


-- ============================================================
-- 10. RESET SEQUENCES
-- ============================================================

SELECT setval('roles_role_id_seq',
              COALESCE((SELECT MAX(role_id) FROM roles), 1));

SELECT setval('permissions_permission_id_seq',
              COALESCE((SELECT MAX(permission_id) FROM permissions), 1));

SELECT setval('departments_department_id_seq',
              COALESCE((SELECT MAX(department_id) FROM departments), 1));

SELECT setval('users_user_id_seq',
              COALESCE((SELECT MAX(user_id) FROM users), 1));

SELECT setval('role_permissions_role_permission_id_seq',
              COALESCE((SELECT MAX(role_permission_id)
                        FROM role_permissions), 1));

SELECT setval('categories_category_id_seq',
              COALESCE((SELECT MAX(category_id) FROM categories), 1));

SELECT setval('subcategories_subcategory_id_seq',
              COALESCE((SELECT MAX(subcategory_id)
                        FROM subcategories), 1));

SELECT setval('priority_rules_priority_rule_id_seq',
              COALESCE((SELECT MAX(priority_rule_id)
                        FROM priority_rules), 1));

SELECT setval('routing_rules_routing_rule_id_seq',
              COALESCE((SELECT MAX(routing_rule_id)
                        FROM routing_rules), 1));

SELECT setval('grievances_grievance_id_seq',
              COALESCE((SELECT MAX(grievance_id)
                        FROM grievances), 1));

SELECT setval('grievance_departments_grievance_department_id_seq',
              COALESCE((SELECT MAX(grievance_department_id)
                        FROM grievance_departments), 1));

SELECT setval('grievance_status_history_history_id_seq',
              COALESCE((SELECT MAX(history_id)
                        FROM grievance_status_history), 1));

SELECT setval('attachments_attachment_id_seq',
              COALESCE((SELECT MAX(attachment_id)
                        FROM attachments), 1));

SELECT setval('skills_skill_id_seq',
              COALESCE((SELECT MAX(skill_id) FROM skills), 1));

SELECT setval('user_skills_user_skill_id_seq',
              COALESCE((SELECT MAX(user_skill_id) FROM user_skills), 1));

SELECT setval('assignments_assignment_id_seq',
              COALESCE((SELECT MAX(assignment_id) FROM assignments), 1));

SELECT setval('sla_policies_sla_policy_id_seq',
              COALESCE((SELECT MAX(sla_policy_id) FROM sla_policies), 1));

SELECT setval('sla_tracking_sla_tracking_id_seq',
              COALESCE((SELECT MAX(sla_tracking_id)
                        FROM sla_tracking), 1));

SELECT setval('escalations_escalation_id_seq',
              COALESCE((SELECT MAX(escalation_id)
                        FROM escalations), 1));

SELECT setval('reopen_policies_reopen_policy_id_seq',
              COALESCE((SELECT MAX(reopen_policy_id)
                        FROM reopen_policies), 1));

SELECT setval('resolutions_resolution_id_seq',
              COALESCE((SELECT MAX(resolution_id)
                        FROM resolutions), 1));

SELECT setval('resolution_reviews_review_id_seq',
              COALESCE((SELECT MAX(review_id)
                        FROM resolution_reviews), 1));

SELECT setval('notifications_notification_id_seq',
              COALESCE((SELECT MAX(notification_id)
                        FROM notifications), 1));

SELECT setval('knowledge_articles_article_id_seq',
              COALESCE((SELECT MAX(article_id)
                        FROM knowledge_articles), 1));

SELECT setval('audit_logs_audit_log_id_seq',
              COALESCE((SELECT MAX(audit_log_id)
                        FROM audit_logs), 1));


-- ============================================================
-- END OF SEED DATA
-- ============================================================