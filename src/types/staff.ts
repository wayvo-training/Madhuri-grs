/**
 * Staff Module Types
 * Strictly enforces GRS domain terminology and rules:
 * Uses: Staff, Assigned Grievance, My Grievances, Investigation, Resolution, SLA, Reopened Grievance.
 * Never uses: Ticket, Support Ticket, Officer, Assigned Officer.
 */

export type StaffPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type StaffGrievanceStatus =
  | "SUBMITTED"
  | "ROUTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_ON_USER"
  | "UNDER_REVIEW"
  | "REOPENED"
  | "REOPEN_REVIEW"
  | "CLOSED"
  | "ESCALATED";

export type StaffSlaState = "ON_TRACK" | "AT_RISK" | "BREACHED";

export type StaffView =
  | "overview"
  | "queue"
  | "investigation"
  | "resolutions"
  | "profile";

export interface StaffKpiStats {
  activeGrievances: number;
  slaAtRisk: number;
  slaBreached: number;
  resolutionPending: number;
  reopenedCount: number;
  completedCount: number;
}

export interface StaffAttachmentItem {
  id: string;
  name: string;
  size: string;
  type: string;
  path?: string;
  uploadedAt: string;
}

export interface StaffInternalNote {
  id: string;
  author: string;
  role: string;
  note: string;
  timestamp: string;
}

export interface StaffAuditItem {
  id: string;
  action: string;
  details: string;
  actor: string;
  timestamp: string;
  relativeTime?: string;
  grievanceNumber?: string;
}

export interface StaffResolutionData {
  id?: string;
  problemSummary: string;
  findings: string;
  actionTaken: string;
  outcome: string;
  evidence?: string | null;
  submittedAt?: string;
  reviewStatus?: "PENDING" | "ACCEPTED" | "REJECTED";
  rejectionReason?: string | null;
}

export interface StaffInvolvedDepartment {
  id: string;
  departmentName: string;
  involvementType: "PRIMARY" | "SUPPORTING" | "EQUAL";
  status: string;
  assignedStaff?: string | null;
  isMyAssignment?: boolean;
}

export interface StaffGrievanceItem {
  id: string;
  grievanceNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  priority: StaffPriority;
  status: StaffGrievanceStatus;
  reopenCount: number;
  manualReviewCount: number;
  slaStatus: StaffSlaState;
  slaConsumptionPercent: number;
  slaTimeLeft: string;
  dueAt: string | null;
  submittedAt: string;
  assignedAt: string;
  submitterName: string;
  submitterEmail: string;
  submitterRole: string;
  hasResolution: boolean;
  submittedResolution?: StaffResolutionData | null;
  attachments?: StaffAttachmentItem[];
  internalNotes?: StaffInternalNote[];
  auditTrail?: StaffAuditItem[];
  departmentsInvolved?: StaffInvolvedDepartment[];
}

export interface StaffMemberProfile {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  departmentName: string;
  departmentId?: string;
  roleName: string;
  activeWorkload: number;
  maxCapacity: number;
  hodName?: string | null;
  hodEmail?: string | null;
}

export interface StaffDashboardData {
  profile: StaffMemberProfile;
  stats: StaffKpiStats;
  attentionGrievances: StaffGrievanceItem[];
  assignedGrievances: StaffGrievanceItem[];
  recentActivity: StaffAuditItem[];
  categories?: string[];
}

export interface StaffQueueFilterState {
  searchQuery: string;
  status: string;
  priority: string;
  slaStatus: string;
  category: string;
  isReopenedOnly?: boolean;
  tab?:
    | "all"
    | "in_progress"
    | "at_risk"
    | "breached"
    | "reopened"
    | "completed";
}
