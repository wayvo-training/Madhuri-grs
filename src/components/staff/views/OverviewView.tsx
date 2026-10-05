import {
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Clock,
  Eye,
  FileCheck2,
  Inbox,
} from "lucide-react";
import { useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActionMenu } from "@/components/ui/action-menu";
import type {
  StaffAuditItem,
  StaffDashboardData,
  StaffGrievanceItem,
  StaffMemberProfile,
  StaffView,
} from "@/types/staff";
import { StaffPieCharts } from "./StaffPieCharts";

type SortKey =
  | "grievanceNumber"
  | "title"
  | "reopenCount"
  | "category"
  | "priority"
  | "status"
  | "slaStatus"
  | "lastUpdated";

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
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const priorityWeight: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const slaWeight: Record<string, number> = {
    BREACHED: 3,
    AT_RISK: 2,
    ON_TRACK: 1,
  };

  const statusWeight: Record<string, number> = {
    WAITING_ON_USER: 4,
    IN_PROGRESS: 3,
    ASSIGNED: 2,
    UNDER_REVIEW: 1,
  };

  const sortedAttentionItems = [...attentionItems].sort((a, b) => {
    if (!sortKey) return 0;
    let comp = 0;
    switch (sortKey) {
      case "grievanceNumber":
        comp = a.grievanceNumber.localeCompare(b.grievanceNumber);
        break;
      case "title":
        comp = a.title.localeCompare(b.title);
        break;
      case "reopenCount":
        comp = a.reopenCount - b.reopenCount;
        break;
      case "category":
        comp = a.category.localeCompare(b.category);
        break;
      case "priority":
        comp =
          (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
        break;
      case "status":
        comp = (statusWeight[a.status] || 0) - (statusWeight[b.status] || 0);
        break;
      case "slaStatus":
        comp = (slaWeight[a.slaStatus] || 0) - (slaWeight[b.slaStatus] || 0);
        break;
      case "lastUpdated":
        comp =
          new Date(a.assignedAt || a.submittedAt).getTime() -
          new Date(b.assignedAt || b.submittedAt).getTime();
        break;
    }
    return sortDirection === "asc" ? comp : -comp;
  });

  const renderSortHeader = (label: string, key: SortKey) => {
    const isActive = sortKey === key;
    return (
      <th
        className="py-3 px-3.5 whitespace-nowrap cursor-pointer select-none hover:text-black transition text-slate-900 font-bold"
        onClick={() => handleSort(key)}
      >
        <div className="inline-flex items-center gap-1">
          <span>{label}</span>
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
      </th>
    );
  };
  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* 3. Welcome & Role Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-slate-900">
              Staff Workspace
            </h1>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              Staff Operations Workspace • {profile.departmentName}
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

      {/* Staff Pie Charts (Workload & SLA Overview) */}
      <StaffPieCharts grievances={assignedGrievances} layout="horizontal" />

      {/* 1. Grievances Requiring Immediate Attention (Compact Alert Section) */}
      <div className="flex-1 flex flex-col rounded-2xl border border-amber-200 bg-amber-50/50 p-3 sm:p-3.5 space-y-2 min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <h3 className="text-xs font-bold text-amber-900">
              Grievances Requiring Immediate Attention
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onSwitchView("queue")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 transition cursor-pointer"
          >
            <span>View All Grievances</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {attentionItems.length > 0 ? (
          <div className="flex-1 overflow-auto rounded-xl bg-white border border-amber-200/90 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse relative">
              <thead className="sticky top-0 z-10 bg-amber-50/50">
                <tr className="border-b border-amber-200/60 text-[11px] font-bold uppercase tracking-wider text-slate-900 shadow-sm">
                  {renderSortHeader("Grievance ID", "grievanceNumber")}
                  {renderSortHeader("Summary", "title")}
                  {renderSortHeader("Reopened Status", "reopenCount")}
                  {renderSortHeader("Category", "category")}
                  {renderSortHeader("Priority", "priority")}
                  {renderSortHeader("Status", "status")}
                  {renderSortHeader("SLA", "slaStatus")}
                  {renderSortHeader("Last Updated", "lastUpdated")}
                  <th className="py-2 px-3 whitespace-nowrap text-right text-slate-900 font-bold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200/60">
                {sortedAttentionItems.map((item) => {
                  const isBreached = item.slaStatus === "BREACHED";
                  const isAtRisk = item.slaStatus === "AT_RISK";
                  const isReopened =
                    item.reopenCount > 0 || item.status === "REOPENED";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-amber-50/30 transition"
                    >
                      {/* Grievance Number */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {item.grievanceNumber}
                        </span>
                      </td>

                      {/* Summary */}
                      <td className="py-2 px-3 max-w-[180px]">
                        <span
                          className="font-medium text-slate-900 line-clamp-1"
                          title={item.title}
                        >
                          {item.title}
                        </span>
                      </td>

                      {/* Reopened Status */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        {isReopened ? (
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-slate-900">
                            Reopened{" "}
                            {item.reopenCount > 0
                              ? `(${item.reopenCount})`
                              : ""}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-2 px-3 text-slate-900 truncate max-w-[130px]">
                        {item.category}
                      </td>

                      {/* Priority */}
                      <td className="py-2 px-3">
                        <span className="text-xs font-medium text-slate-900">
                          {item.priority === "CRITICAL"
                            ? "Critical"
                            : item.priority === "HIGH"
                              ? "High"
                              : item.priority === "MEDIUM"
                                ? "Medium"
                                : "Low"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3">
                        {item.status === "WAITING_ON_USER" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Waiting on User
                          </span>
                        ) : (
                          <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                            {item.status === "IN_PROGRESS"
                              ? "In Progress"
                              : item.status === "ASSIGNED"
                                ? "Assigned"
                                : item.status === "UNDER_REVIEW"
                                  ? "Under Review"
                                  : item.status}
                          </span>
                        )}
                      </td>

                      {/* SLA */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-900">
                          <Clock className="w-3 h-3 text-slate-900" />
                          {isBreached
                            ? "SLA Breached"
                            : isAtRisk
                              ? "SLA At Risk"
                              : "Within SLA"}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="py-2 px-3 text-slate-900 whitespace-nowrap text-xs">
                        {item.assignedAt || item.submittedAt}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <ActionMenu
                          widthClass="w-36"
                          items={[
                            {
                              label: "Examine",
                              icon: (
                                <Eye className="h-3.5 w-3.5 text-slate-500" />
                              ),
                              onClick: () => onExamine(item),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center rounded-xl bg-white border border-amber-200/90 shadow-2xs p-8 text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <FileCheck2 className="h-5 w-5 text-emerald-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">All Clear!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              You currently have no active grievances requiring immediate
              attention (such as SLA breaches, high-risk delays, or reopenings).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
