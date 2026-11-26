/**
 * Grievance Redressal System (GRS) Lifecycle Statuses
 * The 11 canonical lifecycle statuses:
 * 1. SUBMITTED - Grievance submitted by employee; routing in progress.
 * 2. AWAITING_ROUTING - Routing evaluation failed or unmapped; awaits Admin manual routing.
 * 3. AWAITING_ASSIGNMENT - Routing complete; awaits Department Head staff assignment.
 * 4. ASSIGNED - Department Head confirmed staff assignment; staff has not yet begun investigation.
 * 5. IN_PROGRESS - Staff initiated investigation.
 * 6. AWAITING_INFORMATION - Staff requested clarification/documents from employee (SLA paused).
 * 7. RESOLVED - Proposed resolution submitted (resolutionStatus: PENDING_CONFIRMATION, SLA paused).
 * 8. REWORK - Employee rejected proposed resolution; returned for staff rework investigation.
 * 9. RESOLUTION_PENDING_APPROVAL - Mandatory HOD review for Rework resolution or Reopening dispute.
 * 10. REOPENED - HOD approved reopening dispute; fresh SLA cycle initialized.
 * 11. CLOSED - Terminal state upon resolution acceptance, 7-day inactivity expiry, or dispute rejection.
 *
 * NOTE: ESCALATED and SLA_BREACHED are operational SLA indicators maintained in `sla_tracking`
 * and `escalations`. They MUST NOT be used as Grievance.status values (which remains IN_PROGRESS).
 */

export type GrievanceLifecycleStatus =
  | "SUBMITTED"
  | "AWAITING_ROUTING"
  | "AWAITING_ASSIGNMENT"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "AWAITING_INFORMATION"
  | "ESCALATED"
  | "RESOLVED"
  | "REWORK"
  | "RESOLUTION_PENDING_APPROVAL"
  | "REOPENED"
  | "CLOSED";

export const GRIEVANCE_LIFECYCLE_STATUSES: readonly GrievanceLifecycleStatus[] =
  [
    "SUBMITTED",
    "AWAITING_ROUTING",
    "AWAITING_ASSIGNMENT",
    "ASSIGNED",
    "IN_PROGRESS",
    "AWAITING_INFORMATION",
    "ESCALATED",
    "RESOLVED",
    "REWORK",
    "RESOLUTION_PENDING_APPROVAL",
    "REOPENED",
    "CLOSED",
  ] as const;

/**
 * Resolution Status enum (LLD Table 19)
 */
export type ResolutionReviewStatus =
  | "PENDING_CONFIRMATION"
  | "ACCEPTED"
  | "REJECTED"
  | "REWORK_REQUIRED";

/**
 * Normalizes any legacy or alias status string into the canonical status
 */
export function normalizeGrievanceStatus(
  rawStatus: string,
): GrievanceLifecycleStatus {
  switch (rawStatus) {
    case "ROUTED":
      return "AWAITING_ASSIGNMENT";
    case "WAITING_ON_USER":
    case "WAITING_ON_EMPLOYEE":
    case "AWAITING_USER_RESPONSE":
      return "AWAITING_INFORMATION";
    case "UNDER_REVIEW":
    case "REOPEN_REVIEW":
      return "RESOLUTION_PENDING_APPROVAL";
    case "ESCALATED":
      return "ESCALATED";
    case "SUBMITTED":
    case "AWAITING_ROUTING":
    case "AWAITING_ASSIGNMENT":
    case "ASSIGNED":
    case "IN_PROGRESS":
    case "AWAITING_INFORMATION":
    case "RESOLVED":
    case "REWORK":
    case "RESOLUTION_PENDING_APPROVAL":
    case "REOPENED":
    case "CLOSED":
      return rawStatus;
    default:
      return "IN_PROGRESS";
  }
}
