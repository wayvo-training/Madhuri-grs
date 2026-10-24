import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Clock,
  Eye,
  FileCheck2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";
import { TruncatedText } from "@/components/ui/truncated-text";
import type {
  StaffDashboardData,
  StaffGrievanceItem,
  StaffMemberProfile,
  StaffQueueTab,
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

interface OverviewViewProps {
  data: StaffDashboardData | null;
  profile: StaffMemberProfile;
  onExamine: (grievance: StaffGrievanceItem) => void;
  onSwitchView: (view: StaffView) => void;
  onRefresh: () => void;
  onFilterQueue?: (tab: StaffQueueTab) => void;
}

export function OverviewView({
  data,
  profile,
  onExamine,
  onSwitchView,
  onRefresh: _onRefresh,
  onFilterQueue,
}: OverviewViewProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const attentionItems = data?.attentionGrievances || [];
  const assignedGrievances = data?.assignedGrievances || [];

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const displayList = useMemo(() => {
    const source =
      assignedGrievances.length > 0 ? assignedGrievances : attentionItems;
    return [...source].sort((a, b) => {
      const timeB = new Date(b.assignedAt || b.submittedAt).getTime();
      const timeA = new Date(a.assignedAt || a.submittedAt).getTime();
      if (!Number.isNaN(timeB) && !Number.isNaN(timeA) && timeB !== timeA) {
        return timeB - timeA;
      }
      return Number(b.id) - Number(a.id);
    });
  }, [assignedGrievances, attentionItems]);

  const totalCount = displayList.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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

  const sortedList = useMemo(() => {
    if (!sortKey) return displayList;
    return [...displayList].sort((a, b) => {
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
            (priorityWeight[a.priority] || 0) -
            (priorityWeight[b.priority] || 0);
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
  }, [displayList, sortKey, sortDirection]);

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
      {/* Welcome & Role Strip */}
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
      <StaffPieCharts
        grievances={assignedGrievances}
        layout="horizontal"
        onFilterQueue={onFilterQueue}
      />

      {/* Recent Grievances Area */}
      <div className="flex-1 flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 space-y-2 min-h-0 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
              Recent Grievances
            </h3>
            <span className="text-slate-300 hidden sm:inline">&bull;</span>
            <p className="text-xs text-slate-500 font-normal hidden sm:inline">
              Grievances assigned to you
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSwitchView("queue")}
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition cursor-pointer"
          >
            <span>View All Grievances</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayList.length > 0 ? (
          <div className="flex-1 overflow-auto max-h-[400px] custom-scrollbar rounded-xl bg-white border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse relative">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-900 shadow-sm">
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
              <tbody className="divide-y divide-slate-100">
                {sortedList
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => {
                    const isItemClosed =
                      item.status === "CLOSED" ||
                      item.status === "RESOLVED" ||
                      item.status === "COMPLETED";
                    const isBreached =
                      !isItemClosed && item.slaStatus === "BREACHED";
                    const isAtRisk =
                      !isItemClosed && item.slaStatus === "AT_RISK";
                    const isReopened =
                      item.reopenCount > 0 || item.status === "REOPENED";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Grievance Number */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          <button
                            type="button"
                            onClick={() => onExamine(item)}
                            className="font-mono text-xs font-semibold text-teal-800 dark:text-teal-300 hover:text-teal-950 dark:hover:text-teal-100 hover:underline cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 rounded-xs"
                          >
                            {item.grievanceNumber}
                          </button>
                        </td>

                        {/* Summary */}
                        <td className="py-2.5 px-3 align-middle max-w-[200px]">
                          <TruncatedText
                            text={item.title}
                            maxChars={30}
                            alwaysShowTooltip={true}
                            onClick={() => onExamine(item)}
                            className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate hover:underline hover:text-teal-800 dark:hover:text-teal-300 cursor-pointer"
                          />
                        </td>

                        {/* Reopened Status */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          {isReopened ? (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              Reopened{" "}
                              {item.reopenCount > 0
                                ? `(${item.reopenCount})`
                                : ""}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-xs">
                              -
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle max-w-[140px]">
                          <TruncatedText
                            text={item.category}
                            maxChars={20}
                            alwaysShowTooltip={true}
                            className="text-slate-900 dark:text-slate-200 truncate whitespace-nowrap block max-w-[130px]"
                          />
                        </td>

                        {/* Priority */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          <PriorityBadge priority={item.priority} />
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* SLA */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          {isItemClosed ? (
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Completed
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${
                                isBreached
                                  ? "text-rose-600 font-bold dark:text-rose-400"
                                  : isAtRisk
                                    ? "text-amber-800 font-semibold dark:text-amber-400"
                                    : "text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              <Clock className="w-3 h-3 text-slate-400" />
                              {isBreached
                                ? "SLA Breached"
                                : isAtRisk
                                  ? "SLA At Risk"
                                  : item.slaTimeLeft || "Within SLA"}
                            </span>
                          )}
                        </td>

                        {/* Last Updated */}
                        <td className="py-2.5 px-3 text-slate-900 dark:text-slate-300 whitespace-nowrap align-middle text-xs">
                          {item.assignedAt || item.submittedAt}
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap align-middle">
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
          <div className="flex-1 flex flex-col items-center justify-center rounded-xl bg-slate-50/40 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 shadow-2xs p-8 text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mb-3">
              <FileCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              No Grievances Assigned
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              New grievances assigned to you by the Department Head will appear
              here.
            </p>
          </div>
        )}

        {totalCount > 0 && (
          <div className="mt-auto pt-2 shrink-0 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="Grievances"
            />
          </div>
        )}
      </div>
    </div>
  );
}
