export interface EscalationAuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  bottleneck?: string;
  details: string;
  stage?: string;
}

export interface GrievanceItem {
  id: string;
  ticketCode: string;
  title: string;
  category: string;
  subcategory: string;
  submitterName: string;
  submitterRole: string;
  submitterEmail: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status:
    | "SUBMITTED"
    | "ROUTED"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "UNDER_REVIEW"
    | "REOPENED"
    | "ESCALATED"
    | "CLOSED"
    | "RESOLVED";
  slaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED";
  slaDeadline: string;
  slaTimeLeft: string;
  slaConsumptionPercent?: number;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdAt: string;
  isReopened?: boolean;
  reopenCount?: number;
  reopenReason?: string;
  isCrossDepartment?: boolean;
  collaboratingDepartments?: string[];
  escalationReason?: string;
  escalationLevel?: number;
  // 11-Step SLA Escalation & Resolution Lifecycle
  escalationStage?:
    | "SLA_THRESHOLD_REACHED"
    | "GRIEVANCE_ESCALATED"
    | "HOD_NOTIFIED"
    | "UNDER_REVIEW"
    | "BOTTLENECK_IDENTIFIED"
    | "INTERVENTION_TAKEN"
    | "AUDIT_LOGGED"
    | "STAFF_NOTIFIED"
    | "IN_PROGRESS"
    | "RESOLUTION_SUBMITTED"
    | "ESCALATION_CLEARED";
  identifiedBottleneck?: string;
  hodIntervention?: {
    actionType:
      | "MONITOR"
      | "NOTIFY_STAFF"
      | "REASSIGN"
      | "CROSS_DEPT"
      | "EXPEDITE"
      | "OVERRIDE"
      | "SLA_EXTENSION";
    actionLabel: string;
    note: string;
    intervenedAt: string;
    intervenedBy: string;
    targetStaffName?: string;
    targetDepartment?: string;
    newDeadline?: string;
  } | null;
  submittedResolution?: {
    staffName: string;
    note: string;
    submittedAt: string;
  } | null;
  auditTrail?: EscalationAuditRecord[];
  description?: string;
  attachments?: {
    name: string;
    size: string;
    type: string;
    path?: string;
    uploadedAt?: string;
  }[];
  internalNotes?: {
    id: string;
    author: string;
    role: string;
    timestamp: string;
    note: string;
  }[];
}

export interface StaffMember {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
  email: string;
  activeTickets: number;
  maxCapacity: number;
  status: "ACTIVE" | "ON_LEAVE" | "BUSY";
}

export type EscalationBottleneck =
  | "STAFF_CAPACITY"
  | "CROSS_DEPT"
  | "MISSING_DOCS"
  | "COMPLEX_INVESTIGATION"
  | "ADMIN_DELAY";

export type EscalationInterventionType =
  | "MONITOR"
  | "NOTIFY_STAFF"
  | "REASSIGN"
  | "CROSS_DEPT";

export type DepartmentHeadTab =
  | "ALL"
  | "EXCEPTIONS"
  | "IN_PROGRESS"
  | "SLA_RISK"
  | "SLA_CRITICAL"
  | "REOPENED"
  | "ESCALATED"
  | "CLOSED"
  | "UNASSIGNED"
  | "HIGH_CRITICAL"
  | "AT_RISK"
  | "CROSS_DEPT"
  | "RESOLUTION_REVIEW";

export type DepartmentHeadView =
  | "overview"
  | "queue"
  | "staff"
  | "sla"
  | "activity"
  | "knowledge";

export type CaseDrawerTab = "progress" | "statement" | "notes" | "activity";

export interface DepartmentHeadOverviewProps {
  departmentName?: string;
  hodName?: string;
  hodEmail?: string;
  employeeCode?: string;
  isAdminPreview?: boolean;
}

export interface DocumentPreviewData {
  name: string;
  size: string;
  type: string;
  path?: string;
  uploadedAt?: string;
  grievanceNumber?: string;
  category?: string;
  title?: string;
  submitterName?: string;
  submitterRole?: string;
}

export interface CaseProgressData {
  grievance?: Record<string, unknown>;
  currentStage?: {
    key: string;
    label: string;
    stageNumber?: number;
    progressSteps: {
      key: string;
      label: string;
      isComplete: boolean;
      isCurrent?: boolean;
    }[];
  };
  assignment?: {
    isAssigned: boolean;
    staffId: string | null;
    staffName: string;
    designation: string;
    email: string | null;
    assignedAt: string | null;
    assignedAtRelative: string | null;
    status: string;
  };
  sla?: {
    consumptionPercent: number;
    timeRemaining: string;
    dueAt: string;
    state: string;
    stateLabel: string;
  };
  latestActivity?: string;
  timeline?: {
    id: string;
    timestamp: string;
    relativeTime: string;
    title: string;
    description: string;
    actor: string;
  }[];
  departmentsInvolved?: {
    id: string;
    departmentName: string;
    involvementType: string;
    status: string;
    assignedStaff?: string | null;
  }[];
}

export interface DepartmentMetricsSummary {
  unassignedCount: number;
  inProgressCount: number;
  slaAtRiskCount: number;
  escalatedCount: number;
  atRiskCount: number;
  reopenedCount: number;
  crossDeptCount: number;
  resolutionReviewCount: number;
  closedCount: number;
  highCriticalCount: number;
  totalStaffCapacity: number;
  totalActiveTickets: number;
  activeStaffCount: number;
  onLeaveStaffCount: number;
  exceptionsCount?: number;
  slaCriticalCount?: number;
}
