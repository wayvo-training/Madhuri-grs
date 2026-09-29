export type GrievancePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type GrievanceStatus =
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
      return <span className="font-semibold text-amber-700">Critical</span>;
    case "HIGH":
      return <span className="font-medium text-slate-900">High</span>;
    case "MEDIUM":
      return <span className="font-medium text-slate-700">Medium</span>;
    default:
      return <span className="font-medium text-slate-600">Low</span>;
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
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900 shadow-2xs dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-500 animate-pulse" />
          Escalated
        </span>
      );
    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-[#162338] dark:border-[#243449] dark:text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
          Closed
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-400">
          In Progress
        </span>
      );
    case "WAITING_ON_USER":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 shadow-2xs dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
          Waiting on User
        </span>
      );
    case "UNDER_REVIEW":
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300">
          Under Review
        </span>
      );
    case "ASSIGNED":
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/70 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300">
          Assigned
        </span>
      );
    case "ROUTED":
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/70 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300">
          Routed
        </span>
      );
    case "SUBMITTED":
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/70 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300">
          Submitted
        </span>
      );
    case "REOPENED":
    case "REOPEN_REVIEW":
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300">
          Reopened
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-[#162338] dark:border-[#243449] dark:text-slate-400">
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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 dark:bg-rose-500" />
          SLA Breached
        </span>
      );
    case "AT_RISK":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/70 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
          SLA At Risk
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-xs font-normal text-slate-600 dark:bg-[#162338] dark:border-[#243449] dark:text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500" />
          On Track
        </span>
      );
  }
}
