import type { StaffGrievanceItem, StaffSlaState } from "@/types/staff";

export interface SlaCalculationResult {
  consumptionPercent: number;
  timeRemaining: string;
  state: StaffSlaState;
  stateLabel: string;
}

/**
 * Calculates dynamic SLA consumption percent and remaining time from database timestamps.
 */
export function calculateSlaStatus(
  createdAt: Date | string,
  dueAt: Date | string | null,
  overrideStatus?: string | null,
): SlaCalculationResult {
  const now = new Date();
  const created = new Date(createdAt);
  const due = dueAt ? new Date(dueAt) : null;

  if (overrideStatus === "BREACHED") {
    return {
      consumptionPercent: 100,
      timeRemaining: "SLA Breached",
      state: "BREACHED",
      stateLabel: "SLA Breached",
    };
  }

  if (!due) {
    return {
      consumptionPercent: 0,
      timeRemaining: "No Target Set",
      state: "ON_TRACK",
      stateLabel: "Within SLA",
    };
  }

  const totalDuration = due.getTime() - created.getTime();
  const elapsedDuration = now.getTime() - created.getTime();

  let consumptionPercent = 0;
  if (totalDuration > 0) {
    consumptionPercent = Math.min(
      Math.max(Math.round((elapsedDuration / totalDuration) * 100), 0),
      100,
    );
  }

  if (now > due) {
    const diffMs = now.getTime() - due.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const timeRemaining =
      diffDays > 0 ? `Breached ${diffDays}d ago` : `Breached ${diffHours}h ago`;

    return {
      consumptionPercent: 100,
      timeRemaining,
      state: "BREACHED",
      stateLabel: "SLA Breached",
    };
  }

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);

  const timeRemaining =
    diffDays > 0
      ? `${diffDays}d ${diffHours}h remaining`
      : `${diffHours}h ${diffMins}m remaining`;

  const isAtRisk = consumptionPercent >= 75 || overrideStatus === "AT_RISK";

  return {
    consumptionPercent,
    timeRemaining,
    state: isAtRisk ? "AT_RISK" : "ON_TRACK",
    stateLabel: isAtRisk ? "Approaching SLA" : "Within SLA",
  };
}

export function formatRelativeTime(
  date: Date | string | null | undefined,
): string {
  if (!date) return "N/A";
  const now = new Date();
  const d = new Date(date);
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const GRS_STAFF_RELEVANT_ACTIONS = new Set([
  "GRIEVANCE_SUBMITTED",
  "STAFF_ASSIGNED",
  "STAFF_AUTO_ASSIGNED",
  "ASSIGNED_TO_STAFF",
  "ASSIGNMENT_CREATED",
  "INVESTIGATION_STARTED",
  "INVESTIGATION_NOTE_ADDED",
  "INTERNAL_NOTE_ADDED",
  "EVIDENCE_ADDED",
  "ATTACHMENT_ADDED",
  "SLA_75_PERCENT_HOD_ALERT",
  "SLA_100_BREACH_ESCALATED",
  "SLA_WARNING",
  "SLA_AT_RISK",
  "SLA_BREACHED",
  "SLA_BREACH",
  "APPEAL_PANEL_CONVENED",
  "CONTRIBUTION_AUDIT_VERIFIED",
  "SCORECARD_RECOMPUTED",
  "RESOLUTION_SUBMITTED",
  "SUBMIT_RESOLUTION",
  "RESOLUTION_ACCEPTED",
  "ACCEPT_RESOLUTION",
  "RESOLUTION_REJECTED",
  "REJECT_RESOLUTION",
  "GRIEVANCE_REOPENED",
  "STATUS_CHANGED",
  "ADDITIONAL_INFO_REQUESTED",
  "USER_INFO_SUBMITTED",
  "HOD_INTERVENTION_TAKEN",
  "HEAD_DIRECTIVE_ISSUED",
  "HOD_DIRECTIVE_NOTE",
]);

export function isStaffRelevantAuditAction(action: string): boolean {
  return GRS_STAFF_RELEVANT_ACTIONS.has(action);
}

export function formatAuditActionTitle(action: string): string {
  switch (action) {
    case "GRIEVANCE_SUBMITTED":
      return "Grievance Registered";
    case "STAFF_ASSIGNED":
    case "STAFF_AUTO_ASSIGNED":
    case "ASSIGNED_TO_STAFF":
    case "ASSIGNMENT_CREATED":
      return "Grievance Assigned";
    case "INVESTIGATION_STARTED":
      return "Investigation Started";
    case "INVESTIGATION_NOTE_ADDED":
    case "INTERNAL_NOTE_ADDED":
      return "Investigation Note";
    case "ADDITIONAL_INFO_REQUESTED":
      return "Additional Information Requested";
    case "USER_INFO_SUBMITTED":
      return "Complainant Information & Documents Submitted";
    case "HOD_DIRECTIVE_NOTE":
      return "Internal Note";
    case "EVIDENCE_ADDED":
    case "ATTACHMENT_ADDED":
      return "Evidence Added";
    case "APPEAL_PANEL_CONVENED":
      return "Independent Panel Convened";
    case "CONTRIBUTION_AUDIT_VERIFIED":
      return "Contribution Audit Verified";
    case "SCORECARD_RECOMPUTED":
      return "Scorecard Recomputed";
    case "SLA_100_BREACH_ESCALATED":
      return "SLA 100% Breach Escalated";
    case "SLA_75_PERCENT_HOD_ALERT":
    case "SLA_WARNING":
    case "SLA_AT_RISK":
      return "SLA Warning";
    case "SLA_BREACHED":
    case "SLA_BREACH":
      return "SLA Breach";
    case "HEAD_DIRECTIVE_ISSUED":
    case "HOD_INTERVENTION_TAKEN":
      return "Department Head Directive";
    case "RESOLUTION_SUBMITTED":
    case "SUBMIT_RESOLUTION":
      return "Resolution Submitted";
    case "RESOLUTION_ACCEPTED":
    case "ACCEPT_RESOLUTION":
      return "Resolution Approved";
    case "RESOLUTION_REJECTED":
    case "REJECT_RESOLUTION":
      return "Resolution Rejected";
    case "GRIEVANCE_REOPENED":
      return "Grievance Reopened";
    case "STATUS_CHANGED":
      return "Status Updated";
    default:
      return action.replace(/_/g, " ").toLowerCase();
  }
}

/**
 * Checks whether the current staff member is authorized to propose a knowledge article.
 * Rules:
 * - Grievance must be CLOSED (accepted by end user).
 * - If Department Head directly reviewed and submitted the resolution (e.g. after max reopen count was reached),
 *   ONLY the Department Head may propose the knowledge article (returns false for staff).
 * - If Staff submitted the resolution that was accepted by the end user, returns true.
 */
export function canStaffProposeKnowledge(
  grievance: StaffGrievanceItem,
): boolean {
  if (grievance.hasProposedKb) return false;
  if (grievance.status !== "CLOSED") return false;

  const role = grievance.submittedResolution?.submittedByRole;
  if (role) {
    return role === "STAFF";
  }

  // Fallback: If maximum reopen count or manual review threshold was reached, head resolved directly
  if (
    (grievance.reopenCount ?? 0) >= 2 ||
    (grievance.manualReviewCount ?? 0) >= 1
  ) {
    return false;
  }

  return true;
}
