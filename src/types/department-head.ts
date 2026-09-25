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
  name: string;
  designation: string;
  email: string;
  activeTickets: number;
  maxCapacity: number;
  status: "ACTIVE" | "ON_LEAVE" | "BUSY";
}
