import { cn } from "cn";

export type GrievancePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type GrievanceStatus =
  | "SUBMITTED"
  | "AWAITING_ROUTING"
  | "AWAITING_ASSIGNMENT"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "AWAITING_INFORMATION"
  | "RESOLVED"
  | "REWORK"
  | "RESOLUTION_PENDING_APPROVAL"
  | "REOPENED"
  | "CLOSED"
  // Legacy aliases
  | "ROUTED"
  | "WAITING_ON_USER"
  | "UNDER_REVIEW"
  | "REOPEN_REVIEW"
  | "ESCALATED"
  | "BLOCKED"
  | "PENDING_ASSIGNMENT"
  | "COMPLETED";

export type SlaStatus = "ON_TRACK" | "AT_RISK" | "BREACHED";

/**
 * Standard Priority Badge - Clean, neutral enterprise styling.
 */
export function PriorityBadge({
  priority,
  className,
}: {
  priority: GrievancePriority | string;
  className?: string;
}) {
  const normalized = (priority || "").toUpperCase();

  switch (normalized) {
    case "CRITICAL":
      return (
        <span
          title="Priority: Critical"
          className={cn(
            "text-sm font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap cursor-default",
            className,
          )}
        >
          Critical
        </span>
      );
    case "HIGH":
      return (
        <span
          title="Priority: High"
          className={cn(
            "text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap cursor-default",
            className,
          )}
        >
          High
        </span>
      );
    case "MEDIUM":
      return (
        <span
          title="Priority: Medium"
          className={cn(
            "text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap cursor-default",
            className,
          )}
        >
          Medium
        </span>
      );
    default:
      return (
        <span
          title="Priority: Low"
          className={cn(
            "text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap cursor-default",
            className,
          )}
        >
          Low
        </span>
      );
  }
}

export interface StatusBadgeProps {
  status: GrievanceStatus | string;
  className?: string;
  title?: string;
  label?: string;
}

/**
 * Standard Status Badge - Calm neutral base; ESCALATED is the single focused highlight.
 * Supports graceful truncation, full-text tooltips, and compact alignment.
 */
export function StatusBadge({
  status,
  className,
  title,
  label,
}: StatusBadgeProps) {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "ESCALATED":
      return (
        <span
          title={title ?? "Status: Escalated"}
          className={cn(
            "inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 shadow-2xs dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400 cursor-default select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600 dark:bg-amber-500 animate-pulse" />
          <span className="truncate">{label ?? "Escalated"}</span>
        </span>
      );
    case "RESOLVED":
      return (
        <span
          title={title ?? "Status: Resolved"}
          className={cn(
            "inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 shadow-2xs dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 cursor-default select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-500" />
          <span className="truncate">{label ?? "Resolved"}</span>
        </span>
      );
    case "REWORK":
      return (
        <span
          title={title ?? "Status: Rework"}
          className={cn(
            "inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-md border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-800 shadow-2xs dark:bg-orange-500/20 dark:border-orange-500/30 dark:text-orange-400 cursor-default select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500 dark:bg-orange-400 animate-pulse" />
          <span className="truncate">{label ?? "Rework"}</span>
        </span>
      );
    case "RESOLUTION_PENDING_APPROVAL":
    case "UNDER_REVIEW":
      return (
        <span
          title={title ?? "Status: Resolution Pending Approval"}
          className={cn(
            "inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-md border border-indigo-200 bg-indigo-50/90 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-700/30 dark:border-indigo-600 dark:text-indigo-300 cursor-default select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 dark:bg-indigo-400" />
          <span className="truncate">
            {label ?? "Resolution Pending Approval"}
          </span>
        </span>
      );
    case "AWAITING_INFORMATION":
    case "WAITING_ON_USER":
      return (
        <span
          title={title ?? "Status: Awaiting Information"}
          className={cn(
            "inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 shadow-2xs dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400 cursor-default select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
          <span className="truncate">{label ?? "Awaiting Information"}</span>
        </span>
      );
    case "AWAITING_ROUTING":
      return (
        <span
          title={title ?? "Status: Awaiting Routing"}
          className={cn(
            "inline-flex items-center min-w-0 max-w-full rounded-md border border-amber-200 bg-amber-50/70 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-700/30 dark:border-amber-600 dark:text-amber-300 cursor-default select-none",
            className,
          )}
        >
          <span className="truncate">{label ?? "Awaiting Routing"}</span>
        </span>
      );
    case "AWAITING_ASSIGNMENT":
    case "PENDING_ASSIGNMENT":
      return (
        <span
          title={title ?? "Status: Awaiting Assignment"}
          className={cn(
            "inline-flex items-center min-w-0 max-w-full rounded-md border border-slate-200 bg-slate-100/70 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300 cursor-default select-none",
            className,
          )}
        >
          <span className="truncate">{label ?? "Awaiting Assignment"}</span>
        </span>
      );
    case "CLOSED":
      return (
        <span
          title={title ?? "Status: Closed"}
          className={cn(
            "inline-flex items-center gap-1 min-w-0 max-w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-[#162338] dark:border-[#243449] dark:text-slate-400 cursor-default select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
          <span className="truncate">{label ?? "Closed"}</span>
        </span>
      );
    case "COMPLETED":
      return (
        <span
          title={title ?? "Department Findings Submitted"}
          className={cn(
            "inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 cursor-default select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-500" />
          <span className="truncate">{label ?? "Findings Done"}</span>
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span
          title={title ?? "Status: In Progress"}
          className={cn(
            "inline-flex items-center min-w-0 max-w-full rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-400 cursor-default select-none",
            className,
          )}
        >
          <span className="truncate">{label ?? "In Progress"}</span>
        </span>
      );
    case "ASSIGNED":
      return (
        <span
          title={title ?? "Status: Assigned"}
          className={cn(
            "inline-flex items-center min-w-0 max-w-full rounded-md border border-slate-200 bg-slate-100/70 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300 cursor-default select-none",
            className,
          )}
        >
          <span className="truncate">{label ?? "Assigned"}</span>
        </span>
      );
    case "ROUTED":
      return (
        <span
          title={title ?? "Status: Routed"}
          className={cn(
            "inline-flex items-center min-w-0 max-w-full rounded-md border border-slate-200 bg-slate-100/70 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300 cursor-default select-none",
            className,
          )}
        >
          <span className="truncate">{label ?? "Routed"}</span>
        </span>
      );
    case "SUBMITTED":
      return (
        <span
          title={title ?? "Status: Submitted"}
          className={cn(
            "inline-flex items-center min-w-0 max-w-full rounded-md border border-slate-200 bg-slate-100/70 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300 cursor-default select-none",
            className,
          )}
        >
          <span className="truncate">{label ?? "Submitted"}</span>
        </span>
      );
    case "REOPENED":
    case "REOPEN_REVIEW":
      return (
        <span
          title={title ?? "Status: Reopened"}
          className={cn(
            "inline-flex items-center min-w-0 max-w-full rounded-md border border-slate-200 bg-slate-100/80 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300 cursor-default select-none",
            className,
          )}
        >
          <span className="truncate">{label ?? "Reopened"}</span>
        </span>
      );
    case "BLOCKED":
      return (
        <span
          title={title ?? "Status: Blocked"}
          className={cn(
            "inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900 shadow-2xs dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400 cursor-default select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600 dark:bg-amber-500" />
          <span className="truncate">{label ?? "Blocked"}</span>
        </span>
      );
    default:
      return (
        <span
          title={title ?? String(status)}
          className={cn(
            "inline-flex items-center min-w-0 max-w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-[#162338] dark:border-[#243449] dark:text-slate-400 cursor-default select-none",
            className,
          )}
        >
          <span className="truncate">{label ?? status}</span>
        </span>
      );
  }
}

/**
 * Standard SLA Badge - Harmonized with calm enterprise status styling.
 */
export function SlaBadge({
  status,
  className,
  title,
}: {
  status?: SlaStatus | string | null;
  className?: string;
  title?: string;
}) {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "BREACHED":
      return (
        <span
          title={title ?? "SLA Breached"}
          className={cn(
            "inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400 cursor-default shadow-2xs select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600 dark:bg-rose-500" />
          <span className="truncate">Breached</span>
        </span>
      );
    case "AT_RISK":
      return (
        <span
          title={title ?? "SLA At Risk"}
          className={cn(
            "inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-md border border-amber-200/90 bg-amber-50/70 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400 cursor-default shadow-2xs select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400" />
          <span className="truncate">At Risk</span>
        </span>
      );
    case "PAUSED":
      return (
        <span
          title={title ?? "SLA Paused"}
          className={cn(
            "inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400 cursor-default shadow-2xs select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
          <span className="truncate">Paused</span>
        </span>
      );
    default:
      return (
        <span
          title={title ?? "SLA On Track"}
          className={cn(
            "inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs font-normal text-slate-600 dark:bg-[#162338] dark:border-[#243449] dark:text-slate-400 cursor-default shadow-2xs select-none",
            className,
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-500" />
          <span className="truncate">On Track</span>
        </span>
      );
  }
}
