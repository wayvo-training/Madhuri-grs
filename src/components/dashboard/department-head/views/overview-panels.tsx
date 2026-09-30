"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";
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
        accent="emerald"
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
        accent={escalatedCount > 0 ? "rose" : "slate"}
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
  type SortKey = "ticketCode" | "title" | "priority" | "status" | "slaStatus" | "assignedStaffName";

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const totalCount = attentionRequiredList.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const priorityWeight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const statusWeight: Record<string, number> = { WAITING_ON_USER: 4, IN_PROGRESS: 3, ASSIGNED: 2, UNDER_REVIEW: 1 };
  const slaWeight: Record<string, number> = { BREACHED: 3, AT_RISK: 2, ON_TRACK: 1 };

  const sortedList = [...attentionRequiredList].sort((a, b) => {
    if (!sortKey) return 0;
    let comp = 0;
    switch (sortKey) {
      case "ticketCode":
        comp = a.ticketCode.localeCompare(b.ticketCode);
        break;
      case "title":
        comp = a.title.localeCompare(b.title);
        break;
      case "priority":
        comp = (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
        break;
      case "status":
        comp = (statusWeight[a.status] || 0) - (statusWeight[b.status] || 0);
        break;
      case "slaStatus":
        comp = (slaWeight[a.slaStatus] || 0) - (slaWeight[b.slaStatus] || 0);
        break;
      case "assignedStaffName":
        comp = (a.assignedStaffName || "").localeCompare(b.assignedStaffName || "");
        break;
    }
    return sortDirection === "asc" ? comp : -comp;
  });

  const renderSortHeader = (label: string, key: SortKey) => {
    const isActive = sortKey === key;
    return (
      <div 
        className="flex items-center gap-1 cursor-pointer select-none hover:text-black transition"
        onClick={() => handleSort(key)}
      >
        <span className="text-[13px] font-semibold text-slate-700">{label}</span>
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5 text-black" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-black" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-slate-400 hover:text-black" />
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3 h-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-sm font-semibold text-slate-900">
            Attention Required
          </h3>
          {attentionRequiredList.length > 0 && (
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-sm font-semibold text-slate-700">
              {attentionRequiredList.length}
            </span>
          )}
          <span className="text-slate-300 hidden sm:inline">&bull;</span>
          <p className="text-sm text-slate-500 font-normal hidden sm:inline">
            Grievances requiring review or intervention
          </p>
        </div>

        <button
          type="button"
          onClick={onViewFullQueue}
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition"
        >
          <span>View Full Queue</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {attentionRequiredList.length === 0 ? (
        <div className="py-6 text-center text-sm font-normal text-slate-400">
          <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600 mb-1.5" />
          <p className="font-semibold text-slate-700 text-sm">
            No grievances require intervention
          </p>
          <p className="text-sm text-slate-400 mt-0.5">
            All active grievances are operating within their defined SLA
            thresholds.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200/80 bg-white overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80">
            <div className="w-28 shrink-0">
              {renderSortHeader("Grievance ID", "ticketCode")}
            </div>
            <div className="w-80 shrink-0 pr-4">
              {renderSortHeader("Grievance", "title")}
            </div>
            <div className="w-20 shrink-0">
              {renderSortHeader("Priority", "priority")}
            </div>
            <div className="w-24 shrink-0">
              {renderSortHeader("Status", "status")}
            </div>
            <div className="w-34 shrink-0 flex justify-center">
              {renderSortHeader("SLA Status", "slaStatus")}
            </div>
            <div className="w-36 shrink-0 hidden sm:block text-left">
              {renderSortHeader("Assigned To", "assignedStaffName")}
            </div>
            <div className="flex-1"></div>
            <div className="w-[88px] shrink-0 text-center">
              <span className="text-[13px] font-semibold text-slate-700">Action</span>
            </div>
          </div>
          <div className="max-h-75 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60">
            {sortedList
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((item) => {
            const isEscalated = item.status === "ESCALATED";
            const isBreached = item.slaStatus === "BREACHED";
            const highlightSla = !isEscalated && isBreached;

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50/80 dark:hover:bg-[#162338] transition group min-h-11 w-full"
              >
                <div className="w-28 shrink-0">
                  <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-200">
                    {item.ticketCode}
                  </span>
                </div>
                <div className="w-80 shrink-0 pr-4">
                  <button
                    type="button"
                    onClick={() => onInspect(item, "statement")}
                    className="text-sm font-medium text-slate-800 hover:text-emerald-900 transition truncate text-left block w-full"
                    title={item.title}
                  >
                    {item.title}
                  </button>
                </div>

                <div className="w-20 shrink-0">
                  <PriorityBadge priority={item.priority} />
                </div>
                <div className="w-24 shrink-0">
                  <StatusBadge status={item.status} />
                </div>
                <div className="w-34 shrink-0 text-center">
                  <span
                    className={`text-[13px] font-medium w-full whitespace-nowrap ${
                      highlightSla
                        ? "text-slate-900 font-semibold"
                        : "text-slate-600"
                    }`}
                  >
                    {item.slaTimeLeft}
                  </span>
                </div>
                <div className="w-36 shrink-0 text-left truncate hidden sm:block">
                  <span className="text-[13px] font-normal text-slate-400">To: </span>
                  <span className="text-[13px] font-medium text-slate-700">
                    {item.assignedStaffName || (
                      <span className="italic text-[13px] text-slate-400 font-normal">
                        Unassigned
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex-1"></div>
                <div className="w-[88px] shrink-0 flex justify-center">
                  <button
                    type="button"
                    onClick={() => onInspect(item, "progress")}
                    className="inline-flex w-full justify-center items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[13px] font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 transition shadow-2xs"
                  >
                    <Eye className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {attentionRequiredList.length > 0 && (
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="Grievances"
          />
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
          <h3 className="text-sm sm:text-sm font-semibold text-slate-900">
            Team Capacity
          </h3>
          <span className="text-2.75 text-slate-400 font-normal">
            ({staffList.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onViewFullRoster}
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition"
        >
          <span>Full Roster</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="max-h-21.25 overflow-y-scroll custom-scrollbar pr-1.5 space-y-2">
        {staffList.length === 0 ? (
          <p className="text-sm text-slate-400 py-3 text-center font-normal">
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
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-900 text-sm truncate">
                    {staff.name}
                  </span>
                  <span className="text-slate-600 font-medium text-2.75 shrink-0">
                    Active Workload: {staff.activeTickets} /{" "}
                    {staff.maxCapacity || 10} (Available Capacity:{" "}
                    {Math.max(
                      0,
                      (staff.maxCapacity || 10) - staff.activeTickets,
                    )}
                    )
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      staff.status === "ON_LEAVE"
                        ? "bg-slate-400"
                        : pct >= 80
                          ? "bg-amber-500"
                          : "bg-[#0F766E]"
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
          <h3 className="text-sm sm:text-sm font-semibold text-slate-900">
            Recent Activity
          </h3>
          <span className="text-2.75 text-slate-400 font-normal hidden sm:inline">
            (Governance)
          </span>
        </div>
        <button
          type="button"
          onClick={onViewFullActivity}
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition"
        >
          <span>View Full Activity</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="max-h-21.25 overflow-y-scroll custom-scrollbar pr-1.5 space-y-1.5 divide-y divide-slate-100">
        {governanceAuditFeed.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-sm font-normal">
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
                className="pt-2 first:pt-0 flex items-start gap-2.5 text-sm"
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
                    <span className="font-semibold text-slate-900 text-sm truncate">
                      {displayActor}
                    </span>
                    <span className="text-2.5 text-slate-400 shrink-0">
                      {feed.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-700 text-sm font-medium leading-snug">
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
