"use client";

import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  FileCheck2,
  FileSearch,
  Inbox,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { StaffWorkloadCard } from "@/components/staff/staff-workload-card";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { usePagination } from "@/hooks/usePagination";
import { useTableSort } from "@/hooks/useTableSort";
import type {
  StaffAuditItem,
  StaffDashboardData,
  StaffGrievanceItem,
  StaffMemberProfile,
  StaffView,
} from "@/types/staff";

interface OverviewViewProps {
  data: StaffDashboardData | null;
  profile: StaffMemberProfile;
  onExamine: (grievance: StaffGrievanceItem) => void;
  onSwitchView: (view: StaffView) => void;
  onRefresh: () => void;
}

export function OverviewView({
  data,
  profile,
  onExamine,
  onSwitchView,
  onRefresh,
}: OverviewViewProps) {
  const stats = data?.stats || {
    activeGrievances: 0,
    slaAtRisk: 0,
    slaBreached: 0,
    resolutionPending: 0,
    reopenedCount: 0,
    completedCount: 0,
  };

  const attentionItems = data?.attentionGrievances || [];
  const assignedGrievances = data?.assignedGrievances || [];
  const activeCases = assignedGrievances.filter((g) => g.status !== "CLOSED");

  const {
    sortState,
    handleSort,
    sortedItems: sortedActiveCases,
  } = useTableSort(activeCases);

  const activeCasesPagination = usePagination(sortedActiveCases, {
    initialPageSize: 5,
    pageSizeOptions: [5, 10, 20],
  });

  const attentionPagination = usePagination(attentionItems, {
    initialPageSize: 3,
    pageSizeOptions: [3, 5, 10],
  });

  return (
    <div className="space-y-6">
      {/* 3. Welcome & Role Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">
              Staff Workspace
            </h1>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-600">
              Investigation &amp; Resolution Desk • {profile.departmentName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as{" "}
            <strong className="text-slate-800">{profile.name}</strong>
            {profile.employeeCode ? ` (${profile.employeeCode})` : ""} • Active
            assignment capacity limit: 10 grievances
          </p>
        </div>
      </div>

      {/* 4. KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Active Grievances"
          value={stats.activeGrievances}
          icon={Inbox}
          accentColor="blue"
          description="Currently assigned and active"
        />

        <StatCard
          label="SLA At Risk"
          value={stats.slaAtRisk}
          icon={AlertTriangle}
          accentColor="amber"
          description="Approaching SLA deadline"
        />

        <StatCard
          label="SLA Breached"
          value={stats.slaBreached}
          icon={AlertOctagon}
          accentColor="rose"
          description="Requires immediate attention"
        />

        <StatCard
          label="Resolutions Submitted"
          value={stats.completedCount}
          icon={FileCheck2}
          accentColor="emerald"
          description="Submitted or completed redressals"
        />
      </div>

      {/* 5. Staff Workload & Capacity Card */}
      <StaffWorkloadCard
        profile={profile}
        onRefresh={onRefresh}
        variant="banner"
      />

      {/* 1. Grievances Requiring Immediate Attention (Compact Alert Section) */}
      {attentionItems.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs sm:text-sm font-bold text-amber-900">
                Grievances Requiring Immediate Attention (
                {attentionItems.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full">
              {attentionItems.length === 1
                ? "1 grievance requires action"
                : `${attentionItems.length} grievances require action`}
            </span>
          </div>

          {/* Compact summary rows without redundant card duplication */}
          <div className="divide-y divide-amber-200/60 rounded-xl bg-white border border-amber-200/90 shadow-2xs overflow-hidden">
            {attentionPagination.paginatedItems.map((item) => {
              const isBreached = item.slaStatus === "BREACHED";
              const isAtRisk = item.slaStatus === "AT_RISK";
              const isCritical = item.priority === "CRITICAL";
              const isReopened =
                item.reopenCount > 0 || item.status === "REOPENED";

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 hover:bg-amber-50/30 transition gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0F766E]">
                        {item.grievanceNumber}
                      </span>
                      <span className="text-slate-300">—</span>
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                      {isCritical && (
                        <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Critical Priority
                        </span>
                      )}
                      {isBreached && (
                        <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          SLA Breached
                        </span>
                      )}
                      {isAtRisk && !isBreached && (
                        <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          SLA At Risk ({item.slaTimeLeft})
                        </span>
                      )}
                      {isReopened && (
                        <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          Reopened
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onExamine(item)}
                    className="shrink-0 self-start sm:self-center px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 rounded-lg transition cursor-pointer"
                  >
                    Examine
                  </button>
                </div>
              );
            })}

            {attentionPagination.totalCount > attentionPagination.pageSize && (
              <Pagination
                currentPage={attentionPagination.currentPage}
                totalPages={attentionPagination.totalPages}
                totalCount={attentionPagination.totalCount}
                pageSize={attentionPagination.pageSize}
                onPageChange={attentionPagination.onPageChange}
                compact
                itemLabel="attention cases"
              />
            )}
          </div>
        </div>
      )}

      {/* 8. 2-Column Split (~65% / ~35%): items-start prevents vertical stretch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 2. Left Column (~65%): My Active Grievances as a compact TABLE */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-600" />
              My Active Grievances
            </h3>
            <button
              type="button"
              onClick={() => onSwitchView("queue")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] transition cursor-pointer"
            >
              <span>View All Grievances ({activeCases.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeCases.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-medium text-slate-600">
                No active grievances currently in your queue.
              </p>
              <p className="text-[11px] text-slate-400">
                New grievances assigned by your Department Head will appear
                here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <SortableTh
                      field="title"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="py-3 px-3.5"
                    >
                      Grievance
                    </SortableTh>
                    <SortableTh
                      field="categoryName"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="py-3 px-3"
                    >
                      Category
                    </SortableTh>
                    <SortableTh
                      field="priority"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="py-3 px-3"
                    >
                      Priority
                    </SortableTh>
                    <SortableTh
                      field="status"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="py-3 px-3"
                    >
                      Status
                    </SortableTh>
                    <SortableTh
                      field="slaStatus"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="py-3 px-3"
                    >
                      SLA
                    </SortableTh>
                    <SortableTh
                      field="updatedAt"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="py-3 px-3"
                    >
                      Last Updated
                    </SortableTh>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {activeCasesPagination.paginatedItems.map((grievance) => {
                    const isBreached = grievance.slaStatus === "BREACHED";
                    const isAtRisk = grievance.slaStatus === "AT_RISK";
                    const isReopened =
                      grievance.reopenCount > 0 ||
                      grievance.status === "REOPENED";
                    const isAssigned = grievance.status === "ASSIGNED";
                    const isInProgress = grievance.status === "IN_PROGRESS";

                    return (
                      <tr
                        key={grievance.id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        {/* Grievance Number + Subject */}
                        <td className="py-3 px-3.5 max-w-[220px]">
                          <span className="font-mono text-xs font-bold text-[#0F766E] block">
                            {grievance.grievanceNumber}
                          </span>
                          <span
                            className="font-medium text-slate-900 line-clamp-1 mt-0.5"
                            title={grievance.title}
                          >
                            {grievance.title}
                          </span>
                          {isReopened && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-purple-700 mt-0.5">
                              <RotateCcw className="w-2.5 h-2.5" /> Reopened
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-slate-600 truncate max-w-[130px]">
                          {grievance.category}
                        </td>

                        {/* Priority */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              grievance.priority === "CRITICAL"
                                ? "bg-rose-100 text-rose-800"
                                : grievance.priority === "HIGH"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {grievance.priority}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                            {isInProgress
                              ? "In Progress"
                              : isAssigned
                                ? "Assigned"
                                : grievance.status}
                          </span>
                        </td>

                        {/* SLA */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isBreached
                                ? "bg-rose-100 text-rose-700"
                                : isAtRisk
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {isBreached
                              ? "SLA Breached"
                              : isAtRisk
                                ? "SLA At Risk"
                                : "Within SLA"}
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                          {grievance.assignedAt || grievance.submittedAt}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <ActionMenu
                            widthClass="w-44"
                            items={[
                              {
                                label: "Examine",
                                icon: (
                                  <Eye className="h-3.5 w-3.5 text-slate-500" />
                                ),
                                onClick: () => onExamine(grievance),
                              },
                              ...(isAssigned
                                ? [
                                    {
                                      label: "Investigate",
                                      icon: (
                                        <FileSearch className="h-3.5 w-3.5 text-[#0F766E]" />
                                      ),
                                      variant: "primary" as const,
                                      onClick: () =>
                                        onSwitchView("investigation"),
                                    },
                                  ]
                                : []),
                              ...(isInProgress
                                ? [
                                    {
                                      label: "Continue Investigation",
                                      icon: (
                                        <FileSearch className="h-3.5 w-3.5 text-[#0F766E]" />
                                      ),
                                      variant: "primary" as const,
                                      onClick: () =>
                                        onSwitchView("investigation"),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <Pagination
                currentPage={activeCasesPagination.currentPage}
                totalPages={activeCasesPagination.totalPages}
                totalCount={activeCasesPagination.totalCount}
                pageSize={activeCasesPagination.pageSize}
                onPageChange={activeCasesPagination.onPageChange}
                onPageSizeChange={activeCasesPagination.onPageSizeChange}
                pageSizeOptions={activeCasesPagination.pageSizeOptions}
                itemLabel="active grievances"
              />
            </div>
          )}
        </div>

        {/* 5. Right Column (~35%): Compact + Scrollable Activity Stream */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Activity Stream
            </h3>
            <span className="text-[11px] font-medium text-slate-400">
              Latest Activity
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
            {!data?.recentActivity || data.recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No recent activity recorded for your assigned cases.
              </p>
            ) : (
              /* Internal scrollable container with max-height ~360px */
              <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                {data.recentActivity.slice(0, 3).map((log: StaffAuditItem) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800">
                        {log.action}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {log.relativeTime || log.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {log.details}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      {log.actor ? <span>By {log.actor}</span> : <span />}
                      {log.grievanceNumber && (
                        <span className="font-mono font-medium text-slate-500">
                          {log.grievanceNumber}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6. Link to dedicated /staff/activity page */}
            <div className="pt-2 border-t border-slate-100 text-right">
              <Link
                href="/staff/activity"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] transition cursor-pointer"
              >
                <span>View All Activity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
