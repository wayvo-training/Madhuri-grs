import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import { AdminMetricCard } from "@/components/dashboard/admin/admin-shared";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { formatAuditFeedDetails } from "@/lib/department-head/utils";
import type {
  EscalationAuditRecord,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

export function OverviewMetricsSection({
  unassignedCount,
  inProgressCount,
  slaAtRiskCount,
  escalatedCount,
}: {
  unassignedCount: number;
  inProgressCount: number;
  slaAtRiskCount: number;
  escalatedCount: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <AdminMetricCard
        title="Unassigned"
        value={unassignedCount}
        helper="Awaiting assignment"
        icon={AlertTriangle}
        accent="slate"
      />
      <AdminMetricCard
        title="In Progress"
        value={inProgressCount}
        helper="Active cases"
        icon={CheckCircle2}
        accent="slate"
      />
      <AdminMetricCard
        title="SLA At Risk"
        value={slaAtRiskCount}
        helper="75%+ SLA consumed"
        icon={ShieldAlert}
        accent="amber"
      />
      <AdminMetricCard
        title="Escalated"
        value={escalatedCount}
        helper="SLA breach cases"
        icon={AlertTriangle}
        accent={escalatedCount > 0 ? "amber" : "slate"}
      />
    </div>
  );
}

export function AttentionRequiredPanel({
  attentionRequiredList,
  onInspect,
  onViewFullQueue,
}: {
  attentionRequiredList: GrievanceItem[];
  onInspect: (item: GrievanceItem, tab?: "progress" | "statement") => void;
  onViewFullQueue: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3 h-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
            Attention Required
          </h3>
          {attentionRequiredList.length > 0 && (
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {attentionRequiredList.length}
            </span>
          )}
          <span className="text-slate-300 hidden sm:inline">&bull;</span>
          <p className="text-xs text-slate-500 font-normal hidden sm:inline">
            Grievances requiring review or intervention
          </p>
        </div>

        <button
          type="button"
          onClick={onViewFullQueue}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
        >
          <span>View Full Queue</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {attentionRequiredList.length === 0 ? (
        <div className="py-6 text-center text-xs font-normal text-slate-400">
          <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600 mb-1.5" />
          <p className="font-semibold text-slate-700 text-xs">
            No grievances require intervention
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            All active grievances are operating within their defined SLA
            thresholds.
          </p>
        </div>
      ) : (
        <div className="max-h-75 overflow-y-auto custom-scrollbar divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white">
          {attentionRequiredList.map((item) => {
            const isEscalated = item.status === "ESCALATED";
            const isBreached = item.slaStatus === "BREACHED";
            const highlightSla = !isEscalated && isBreached;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50/80 transition group min-h-11"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="font-mono text-xs font-semibold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70 shrink-0">
                    {item.ticketCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => onInspect(item, "statement")}
                    className="text-xs font-medium text-slate-800 hover:text-emerald-900 transition truncate text-left"
                    title={item.title}
                  >
                    {item.title}
                  </button>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-20 flex justify-start shrink-0">
                    <PriorityBadge priority={item.priority} />
                  </div>

                  <div className="w-24 flex justify-start shrink-0">
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="w-34 flex justify-center shrink-0">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded font-medium text-center w-full whitespace-nowrap ${
                        highlightSla
                          ? "text-amber-900 bg-amber-50 border border-amber-200 font-semibold"
                          : "text-slate-600 bg-slate-100/80 border border-slate-200/80"
                      }`}
                    >
                      {item.slaTimeLeft}
                    </span>
                  </div>

                  <div className="w-36 shrink-0 text-left truncate hidden sm:block">
                    <span className="text-xs text-slate-400">To: </span>
                    <span className="text-xs font-medium text-slate-700">
                      {item.assignedStaffName || (
                        <span className="italic text-slate-400 font-normal">
                          Unassigned
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="w-20 flex justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => onInspect(item, "progress")}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 transition shadow-2xs"
                    >
                      <Eye className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TeamCapacityPanel({
  staffList,
  onViewFullRoster,
}: {
  staffList: StaffMember[];
  onViewFullRoster: () => void;
}) {
  return (
    <div className="lg:col-span-5 rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-2.5 h-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-emerald-800" />
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
            Team Capacity
          </h3>
          <span className="text-2.75 text-slate-400 font-normal">
            ({staffList.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onViewFullRoster}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
        >
          <span>Full Roster</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="max-h-21.25 overflow-y-scroll custom-scrollbar pr-1.5 space-y-2">
        {staffList.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center font-normal">
            No staff assigned to this department roster.
          </p>
        ) : (
          staffList.map((staff) => {
            const pct = Math.round(
              (staff.activeTickets / staff.maxCapacity) * 100,
            );
            return (
              <div
                key={staff.id}
                className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 text-xs truncate">
                    {staff.name}
                  </span>
                  <span className="text-slate-600 font-medium text-2.75 shrink-0">
                    {staff.activeTickets}/{staff.maxCapacity} active
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      staff.status === "ON_LEAVE"
                        ? "bg-slate-400"
                        : pct >= 80
                          ? "bg-amber-500"
                          : "bg-[#064E3B]"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function RecentActivityPanel({
  governanceAuditFeed,
  onViewFullActivity,
}: {
  governanceAuditFeed: EscalationAuditRecord[];
  onViewFullActivity: () => void;
}) {
  return (
    <div className="lg:col-span-7 rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-2.5 h-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
            Recent Activity
          </h3>
          <span className="text-2.75 text-slate-400 font-normal hidden sm:inline">
            (Governance)
          </span>
        </div>
        <button
          type="button"
          onClick={onViewFullActivity}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
        >
          <span>View Full Activity</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="max-h-21.25 overflow-y-scroll custom-scrollbar pr-1.5 space-y-1.5 divide-y divide-slate-100">
        {governanceAuditFeed.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-xs font-normal">
            No governance audit events recorded yet.
          </div>
        ) : (
          governanceAuditFeed.map((feed) => {
            const isSlaEngineAction =
              feed.action.includes("SLA") || feed.action.includes("Auto-");
            const displayActor =
              isSlaEngineAction && feed.actor.includes("DEPARTMENT_HEAD")
                ? "SLA Governance Engine"
                : feed.actor;
            const displayAction = feed.action
              .replace(
                /SLA 100 BREACH ESCALATED/g,
                "SLA Breached & Case Escalated",
              )
              .replace(
                /SLA 75 PERCENT HOD ALERT/g,
                "SLA At Risk (75% Threshold Alert)",
              )
              .replace(/SLA 50 PERCENT WARNING/g, "50% SLA Priority Warning");
            const cleanDetails = formatAuditFeedDetails(feed.details);

            return (
              <div
                key={feed.id}
                className="pt-2 first:pt-0 flex items-start gap-2.5 text-xs"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                  {isSlaEngineAction ? (
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <FileCheck className="h-3.5 w-3.5 text-emerald-700" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 text-xs truncate">
                      {displayActor}
                    </span>
                    <span className="text-2.5 text-slate-400 shrink-0">
                      {feed.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs font-medium leading-snug">
                    {displayAction}
                  </p>
                  {cleanDetails && (
                    <p className="text-2.75 text-slate-500 font-normal italic truncate">
                      {cleanDetails}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
