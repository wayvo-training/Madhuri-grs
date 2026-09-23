export type GrievancePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type GrievanceStatus =
  | "SUBMITTED"
  | "ROUTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "REOPENED"
  | "REOPEN_REVIEW"
  | "CLOSED"
  | "ESCALATED";

export type SlaStatus = "ON_TRACK" | "AT_RISK" | "BREACHED";

/**
 * Standard Priority Badge - Clean, neutral enterprise styling.
 */
export function PriorityBadge({
  priority,
}: {
  priority: GrievancePriority | string;
}) {
  const normalized = (priority || "").toUpperCase();

  switch (normalized) {
    case "CRITICAL":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/90 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          Critical
        </span>
      );
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-800">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          High
        </span>
      );
    case "MEDIUM":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-xs font-normal text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Medium
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-slate-50 px-2.5 py-0.5 text-xs font-normal text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          Low
        </span>
      );
  }
}

/**
 * Standard Status Badge - Calm neutral base; ESCALATED is the single focused highlight.
 */
export function StatusBadge({ status }: { status: GrievanceStatus | string }) {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "ESCALATED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
          Escalated
        </span>
      );
    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Closed
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          In Progress
        </span>
      );
    case "UNDER_REVIEW":
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          Under Review
        </span>
      );
    case "ASSIGNED":
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/70 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          Assigned
        </span>
      );
    case "ROUTED":
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/70 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          Routed
        </span>
      );
    case "SUBMITTED":
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/70 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          Submitted
        </span>
      );
    case "REOPENED":
    case "REOPEN_REVIEW":
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          Reopened
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {status}
        </span>
      );
  }
}

/**
 * Standard SLA Badge - Harmonized with calm enterprise status styling.
 */
export function SlaBadge({ status }: { status?: SlaStatus | string | null }) {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "BREACHED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          SLA Breached
        </span>
      );
    case "AT_RISK":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/70 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          SLA At Risk
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-xs font-normal text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          On Track
        </span>
      );
  }
}
