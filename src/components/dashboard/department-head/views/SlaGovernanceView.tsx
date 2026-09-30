"use client";

import {
  AlertCircle,
  Clock,
  Eye,
  FileCheck,
  Flame,
  RotateCcw,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/dashboard/badges";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh, type SortState } from "@/components/ui/sortable-table-head";
import { requiresHeadResolutionReview } from "@/lib/department-head/filters";
import type {
  CaseDrawerTab,
  DepartmentMetricsSummary,
  GrievanceItem,
} from "@/types/department-head";

export interface SlaGovernanceViewProps {
  grievances: GrievanceItem[];
  metrics: DepartmentMetricsSummary;
  onInspect: (item: GrievanceItem, tab?: CaseDrawerTab) => void;
  onIntervene: (item: GrievanceItem) => void;
  onReviewResolution: (item: GrievanceItem) => void;
  onAssign: (item: GrievanceItem, currentStaffId?: string) => void;
}

export function SlaGovernanceView({
  grievances,
  metrics,
  onInspect,
  onIntervene,
  onReviewResolution,
  onAssign,
}: SlaGovernanceViewProps) {
  const escalatedList = grievances.filter((g) => {
    return (
      g.status === "ESCALATED" ||
      g.hodIntervention ||
      g.status === "UNDER_REVIEW" ||
      g.slaStatus === "BREACHED" ||
      (g.submittedResolution && requiresHeadResolutionReview(g))
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortState, setSortState] = useState<SortState>({ field: null, direction: null });

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const handleSort = (field: string, direction: "asc" | "desc" | null) => {
    setSortState({ field, direction });
  };

  const sortedList = useMemo(() => {
    if (!sortState.field || !sortState.direction) return escalatedList;

    return [...escalatedList].sort((a, b) => {
      let valA: any = a[sortState.field as keyof GrievanceItem] || "";
      let valB: any = b[sortState.field as keyof GrievanceItem] || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortState.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [escalatedList, sortState]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="SLA Breached"
          value={grievances.filter((g) => g.slaStatus === "BREACHED").length}
          icon={AlertCircle}
          accentColor="rose"
          description="Exceeded maximum SLA duration"
        />
        <StatCard
          label="SLA At Risk"
          value={grievances.filter((g) => g.slaStatus === "AT_RISK").length}
          icon={Clock}
          accentColor="amber"
          description="Approaching deadline threshold"
        />
        <StatCard
          label="Active Escalations"
          value={metrics.escalatedCount}
          icon={Flame}
          accentColor="rose"
          description="Requires Department Head action"
        />
        <StatCard
          label="Reopened Grievances"
          value={metrics.reopenedCount}
          icon={RotateCcw}
          accentColor="amber"
          description="Submitters contesting resolution"
        />
      </div>

      {/* SLA & ESCALATIONS QUEUE */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Escalation & SLA Governance
              </h3>
              <p className="text-sm font-normal text-slate-500">
                Review escalated grievances, monitor SLA breaches, and take
                corrective intervention when required.
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {
              grievances.filter(
                (g) =>
                  g.status === "ESCALATED" ||
                  g.hodIntervention ||
                  g.status === "UNDER_REVIEW",
              ).length
            }{" "}
            Managed Cases
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <SortableTh field="ticketCode" currentSort={sortState} onSort={handleSort} className="py-2 pl-4 pr-3 whitespace-nowrap">Grievance ID</SortableTh>
                <SortableTh field="title" currentSort={sortState} onSort={handleSort} className="py-2 px-3 whitespace-nowrap">Summary</SortableTh>
                <SortableTh field="category" currentSort={sortState} onSort={handleSort} className="py-2 px-3 whitespace-nowrap">Category</SortableTh>
                <SortableTh field="subcategory" currentSort={sortState} onSort={handleSort} className="py-2 px-3 whitespace-nowrap">Sub Category</SortableTh>
                <SortableTh field="slaTimeLeft" currentSort={sortState} onSort={handleSort} className="py-2 px-3 whitespace-nowrap">SLA</SortableTh>
                <SortableTh field="status" currentSort={sortState} onSort={handleSort} className="py-2 px-3 whitespace-nowrap">Escalation</SortableTh>
                <SortableTh field="assignedStaffName" currentSort={sortState} onSort={handleSort} className="py-2 px-3 whitespace-nowrap">Assigned Staff</SortableTh>
                <SortableTh field="status" currentSort={sortState} onSort={handleSort} className="py-2 px-3 whitespace-nowrap">Status</SortableTh>
                <th className="py-2 pl-3 pr-4 text-right whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300">
              {escalatedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-10 text-center text-slate-500 text-sm"
                  >
                    No active escalations requiring intervention.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item) => {
                  const isEscalated = item.status === "ESCALATED";
                  const isUnderIntervention =
                    item.status === "IN_PROGRESS" && item.hodIntervention;
                  const needsReview = requiresHeadResolutionReview(item);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition"
                    >
                      <td className="py-2 pl-4 pr-3 align-top whitespace-nowrap">
                        <span className="inline-block font-mono text-sm font-semibold text-slate-900 dark:text-slate-200">
                          {item.ticketCode}
                        </span>
                      </td>
                      <td className="py-2 px-3 align-top">
                        <button
                          type="button"
                          onClick={() => onInspect(item, "statement")}
                          className="block text-left text-sm font-semibold text-slate-900 hover:text-emerald-900 transition"
                        >
                          {item.title}
                        </button>
                      </td>

                      <td className="py-2 px-3 align-top text-sm font-medium text-slate-700">
                        {item.category}
                      </td>

                      <td className="py-2 px-3 align-top text-sm text-slate-500">
                        {item.subcategory}
                      </td>

                      <td className="py-2 px-3 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex text-[13px] font-medium ${
                              item.slaStatus === "BREACHED"
                                ? "text-slate-900 font-bold"
                                : item.slaStatus === "AT_RISK"
                                  ? "text-amber-800"
                                  : "text-slate-600"
                            }`}
                          >
                            {item.slaTimeLeft}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3 align-top">
                        <div className="flex flex-col items-start gap-1">
                          {item.hodIntervention ? (
                            <details className="group">
                              <summary className={`list-none cursor-pointer w-fit inline-flex items-center text-[13px] group-hover:opacity-80 transition-opacity ${
                                isEscalated 
                                  ? "font-semibold text-slate-900 dark:text-slate-200"
                                  : isUnderIntervention || needsReview
                                    ? "font-semibold text-slate-900 dark:text-slate-200"
                                    : "font-medium text-slate-700 dark:text-slate-300"
                              }`}>
                                {isEscalated ? "Escalated" : isUnderIntervention ? "Under Intervention" : needsReview ? "Resolution Required" : "Monitor"}
                              </summary>
                              <div className="text-[13px] text-slate-500 max-w-[210px] leading-tight mt-1 animate-in fade-in">
                                {item.hodIntervention.actionLabel}
                              </div>
                            </details>
                          ) : (
                            <span className={`w-fit inline-flex items-center text-[13px] ${
                              isEscalated
                                ? "font-semibold text-slate-900 dark:text-slate-200"
                                : needsReview
                                  ? "font-semibold text-slate-900 dark:text-slate-200"
                                  : "font-medium text-slate-700 dark:text-slate-300"
                            }`}>
                              {isEscalated ? "Escalated" : needsReview ? "Resolution Required" : "Monitor"}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3 align-top">
                        <span className="text-sm text-slate-700">
                          {item.assignedStaffName || "Unassigned"}
                        </span>
                      </td>

                      <td className="py-2 px-3 align-top">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="py-2 pl-3 pr-4 text-right align-top">
                        <ActionMenu
                          widthClass="w-40"
                          items={[
                            {
                              label: "Inspect",
                              icon: <Eye className="h-3.5 w-3.5" />,
                              onClick: () => onInspect(item, "progress"),
                            },
                            ...(needsReview
                              ? [
                                  {
                                    label: "Submit Resolution",
                                    icon: <FileCheck className="h-3.5 w-3.5" />,
                                    variant: "default" as const,
                                    onClick: () => onReviewResolution(item),
                                  },
                                ]
                              : []),
                            ...(isEscalated
                              ? [
                                  {
                                    label: "Intervene",
                                    icon: (
                                      <AlertCircle className="h-3.5 w-3.5" />
                                    ),
                                    variant: "warning" as const,
                                    onClick: () => onIntervene(item),
                                  },
                                ]
                              : []),
                            ...(item.status === "CLOSED" ||
                            item.status === "RESOLVED"
                              ? []
                              : item.assignedStaffName || item.assignedStaffId
                                ? [
                                    {
                                      label: "Change Assignment",
                                      icon: (
                                        <UserCheck className="h-3.5 w-3.5" />
                                      ),
                                      variant: "default" as const,
                                      onClick: () =>
                                        onAssign(
                                          item,
                                          item.assignedStaffId || "",
                                        ),
                                    },
                                  ]
                                : [
                                    {
                                      label: "Assign",
                                      icon: (
                                        <UserPlus className="h-3.5 w-3.5" />
                                      ),
                                      variant: "default" as const,
                                      onClick: () => onAssign(item),
                                    },
                                  ]),
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(escalatedList.length / pageSize)}
            totalCount={escalatedList.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="escalations"
          />
        </div>
      </div>
    </div>
  );
}
