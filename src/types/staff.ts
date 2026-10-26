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
  | "RESOLVED"
  | "ESCALATED"
  | "COMPLETED";

export type StaffSlaState = "ON_TRACK" | "AT_RISK" | "BREACHED";

export type StaffView = "overview" | "queue" | "profile" | "activity";

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
  downloadUrl?: string;
  uploadedAt: string;
}

export interface StaffInternalNote {
  id: string;
  author: string;
  role: string;
  note: string;
  timestamp: string;
  parentId?: string;
  replyToAuthor?: string;
  createdAt?: string;
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

export interface FindingAttachment {
  id: string;
  name: string;
  size?: string;
  type?: string;
  path: string;
  downloadUrl?: string;
}

export interface SupportingDepartmentFinding {
  id: string;
  departmentName: string;
  submittedBy: string;
  findings: string;
  actionTaken?: string;
  notes?: string;
  createdAt: string;
  timestamp: string;
  attachments?: FindingAttachment[];
}

export interface StaffResolutionData {
  id?: string;
  submittedByUserId?: string;
  submittedByRole?: string;
  problemSummary: string;
  findings: string;
  actionTaken: string;
  outcome: string;
  evidence?: string | null;
  attachments?: StaffAttachmentItem[];
  submittedAt?: string;
  reviewStatus?: "PENDING" | "ACCEPTED" | "REJECTED";
  rejectionReason?: string | null;
  isDraft?: boolean;
}

export interface StaffInvolvedDepartment {
  id: string;
  departmentName: string;
  involvementType: "PRIMARY" | "SUPPORTING" | "EQUAL";
  status: string;
  assignedStaff?: string | null;
  isMyAssignment?: boolean;
  slaPercentAllocation?: number | null;
  allocatedDurationMinutes?: number | null;
  executionOrder?: number;
}

export interface StaffGrievanceItem {
  id: string;
  grievanceNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  categoryId?: string;
  subcategoryId?: string;
  priority: StaffPriority;
  status: StaffGrievanceStatus;
  reopenCount: number;
  manualReviewCount: number;
  slaStatus: StaffSlaState;
  slaConsumptionPercent: number;
  slaTimeLeft: string;
  dueAt: string | null;
  slaPercentAllocation?: number | null;
  allocatedDurationMinutes?: number | null;
  submittedAt: string;
  assignedAt: string;
  submitterName: string;
  submitterEmail: string;
  submitterRole: string;
  hasResolution: boolean;
  hasProposedKb?: boolean;
  submittedResolution?: StaffResolutionData | null;
  attachments?: StaffAttachmentItem[];
  internalNotes?: StaffInternalNote[];
  collaborationNotes?: StaffInternalNote[];
  supportingFindings?: SupportingDepartmentFinding[];
  auditTrail?: StaffAuditItem[];
  departmentsInvolved?: StaffInvolvedDepartment[];
  isCrossDepartment?: boolean;
  collaboratingDepartments?: string[];
  myInvolvementType?: "PRIMARY" | "SUPPORTING" | "EQUAL";
  isPrimaryOwner?: boolean;
  myDepartmentStatus?: string;
  isMyDepartmentCompleted?: boolean;
  canSubmitFinalResolution?: boolean;
  canSubmitFindings?: boolean;
  isFinalSequentialDepartment?: boolean;
  overallStatus?: string;
  activeDepartmentName?: string;
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

export type StaffQueueTab =
  | "all"
  | "in_progress"
  | "under_review"
  | "at_risk"
  | "breached"
  | "reopened"
  | "completed"
  | "on_track";

export interface StaffQueueFilterState {
  searchQuery: string;
  status: string;
  priority: string;
  slaStatus: string;
  category: string;
  isReopenedOnly?: boolean;
  tab?: StaffQueueTab;
}
