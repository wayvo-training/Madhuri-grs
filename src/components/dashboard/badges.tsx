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
 * Standard Priority Badge matching database constraints.
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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          Critical
        </span>
      );
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          High
        </span>
      );
    case "MEDIUM":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          Medium
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Low
        </span>
      );
  }
}

/**
 * Standard Status Badge matching database constraints.
 */
export function StatusBadge({ status }: { status: GrievanceStatus | string }) {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "SUBMITTED":
      return (
        <span className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          Submitted
        </span>
      );
    case "ROUTED":
      return (
        <span className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          Routed
        </span>
      );
    case "ASSIGNED":
      return (
        <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          Assigned
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          In Progress
        </span>
      );
    case "UNDER_REVIEW":
      return (
        <span className="inline-flex items-center rounded-md border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          Under Review
        </span>
      );
    case "REOPENED":
    case "REOPEN_REVIEW":
      return (
        <span className="inline-flex items-center rounded-md border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          Reopened
        </span>
      );
    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300/80 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Closed
        </span>
      );
    case "ESCALATED":
      return (
        <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
          Escalated
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
          {status}
        </span>
      );
  }
}

/**
 * Standard SLA Badge matching database tracking.
 */
export function SlaBadge({ status }: { status?: SlaStatus | string | null }) {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "BREACHED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          SLA Breached
        </span>
      );
    case "AT_RISK":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          SLA At Risk
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          On Track
        </span>
      );
  }
}
