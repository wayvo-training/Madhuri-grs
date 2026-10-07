"use client";

import {
  AlertCircle,
  BookOpen,
  Clock,
  Eye,
  FileCheck,
  Flame,
  RotateCcw,
  UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/dashboard/badges";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActionMenu } from "@/components/ui/action-menu";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Pagination } from "@/components/ui/pagination";
import {
  SortableTh,
  type SortState,
} from "@/components/ui/sortable-table-head";
import {
  canHeadProposeKnowledge,
  canHeadSubmitResolution,
  hasHeadResolutionAuthority,
  requiresHeadResolutionReview,
} from "@/lib/department-head/filters";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
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
  onProposeKb?: (item: GrievanceItem) => void;
}

export function SlaGovernanceView({
  grievances,
  metrics,
  onInspect,
  onIntervene,
  onReviewResolution,
  onAssign,
  onProposeKb,
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
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: null,
  });

  const [advancedConditions, setAdvancedConditions] = useState<
    SearchCondition[]
  >([]);
  const [advancedMode, setAdvancedMode] = useState<string>("AND");

  useEffect(() => {
    if (advancedConditions || advancedMode) {
      setCurrentPage(1);
    }
  }, [advancedConditions, advancedMode]);

  const handleSort = (field: string, direction: "asc" | "desc" | null) => {
    setSortState({ field, direction });
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    grievances.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return Array.from(set)
      .sort()
      .map((c) => ({ label: c, value: c }));
  }, [grievances]);

  const subcategoryOptions = useMemo(() => {
    const set = new Set<string>();
    grievances.forEach((g) => {
      if (g.subcategory) set.add(g.subcategory);
    });
    return Array.from(set)
      .sort()
      .map((c) => ({ label: c, value: c }));
  }, [grievances]);

  const filterFields: SearchFieldDef[] = useMemo(
    () => [
      { id: "ticketCode", label: "Grievance ID", type: "text" },
      {
        id: "category",
        label: "Category",
        type: "select",
        options: categoryOptions,
      },
      {
        id: "subCategory",
        label: "Sub Category",
        type: "select",
        options: subcategoryOptions,
      },
      {
        id: "sla",
        label: "SLA Status",
        type: "select",
        options: [
          { label: "On Track", value: "ON_TRACK" },
          { label: "At Risk", value: "AT_RISK" },
          { label: "Breached", value: "BREACHED" },
        ],
      },
      {
        id: "escalationStage",
        label: "Escalation",
        type: "select",
        options: [
          { label: "SLA Threshold Reached", value: "SLA_THRESHOLD_REACHED" },
          { label: "Grievance Escalated", value: "GRIEVANCE_ESCALATED" },
          { label: "HOD Notified", value: "HOD_NOTIFIED" },
          { label: "Under Review", value: "UNDER_REVIEW" },
          { label: "Bottleneck Identified", value: "BOTTLENECK_IDENTIFIED" },
          { label: "Intervention Taken", value: "INTERVENTION_TAKEN" },
          { label: "Audit Logged", value: "AUDIT_LOGGED" },
          { label: "Staff Notified", value: "STAFF_NOTIFIED" },
          { label: "In Progress", value: "IN_PROGRESS" },
          { label: "Resolution Submitted", value: "RESOLUTION_SUBMITTED" },
          { label: "Escalation Cleared", value: "ESCALATION_CLEARED" },
        ],
      },
      { id: "assignedStaffName", label: "Assigned Staff", type: "text" },
      {
        id: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Escalated", value: "ESCALATED" },
          { label: "Under Review", value: "UNDER_REVIEW" },
          { label: "In Progress", value: "IN_PROGRESS" },
          { label: "Resolved", value: "RESOLVED" },
          { label: "Closed", value: "CLOSED" },
        ],
      },
      { id: "search", label: "Global Search", type: "text" },
    ],
    [categoryOptions, subcategoryOptions],
  );

  const handleSearchChange = (conditions: SearchCondition[], mode: string) => {
    setAdvancedConditions(conditions);
    setAdvancedMode(mode);
  };

  const filteredList = useMemo(() => {
    return escalatedList.filter((g) =>
      evaluateSearchConditions(g, advancedConditions, advancedMode),
    );
  }, [escalatedList, advancedConditions, advancedMode]);

  const sortedList = useMemo(() => {
    if (!sortState.field || !sortState.direction) return filteredList;

    return [...filteredList].sort((a, b) => {
      const rawA = a[sortState.field as keyof GrievanceItem] ?? "";
      const rawB = b[sortState.field as keyof GrievanceItem] ?? "";
      const valA = typeof rawA === "string" ? rawA.toLowerCase() : rawA;
      const valB = typeof rawB === "string" ? rawB.toLowerCase() : rawB;

      if (valA < valB) return sortState.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredList, sortState]);

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
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 pb-3 gap-4">
          <div className="flex items-start gap-2 shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Escalation & SLA Governance
              </h3>
              <p className="text-sm font-normal text-slate-500 max-w-sm">
                Review escalated grievances, monitor SLA breaches, and take
                corrective intervention when required.
              </p>
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col items-end gap-3 w-full">
            <span className="text-[13px] font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap">
              {escalatedList.length} Managed Cases
            </span>
            <div className="w-full">
              <AdvancedTableSearch
                fields={filterFields}
                onSearch={handleSearchChange}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <SortableTh
                  field="ticketCode"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2 pl-4 pr-3 whitespace-nowrap"
                >
                  Grievance ID
                </SortableTh>
                <SortableTh
                  field="title"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2 px-3 whitespace-nowrap"
                >
                  Summary
                </SortableTh>
                <SortableTh
                  field="category"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2 px-3 whitespace-nowrap"
                >
                  Category
                </SortableTh>
                <SortableTh
                  field="subcategory"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2 px-3 whitespace-nowrap"
                >
                  Sub Category
                </SortableTh>
                <SortableTh
                  field="slaTimeLeft"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2 px-3 whitespace-nowrap"
                >
                  SLA
                </SortableTh>
                <SortableTh
                  field="status"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2 px-3 whitespace-nowrap"
                >
                  Escalation
                </SortableTh>
                <SortableTh
                  field="assignedStaffName"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2 px-3 whitespace-nowrap"
                >
                  Assigned Staff
                </SortableTh>
                <SortableTh
                  field="status"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2 px-3 whitespace-nowrap"
                >
                  Status
                </SortableTh>
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
                  const isClosedOrResolved =
                    item.status === "CLOSED" || item.status === "RESOLVED";
                  const isEscalated = item.status === "ESCALATED";
                  const hasAuthority = hasHeadResolutionAuthority(item);
                  const canSubmitResolution = canHeadSubmitResolution(item);
                  const isUnderIntervention =
                    !isClosedOrResolved &&
                    (hasAuthority ||
                      (item.status === "IN_PROGRESS" &&
                        !!item.hodIntervention));

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
                          {item.hodIntervention && !isClosedOrResolved ? (
                            <details className="group">
                              <summary
                                className={`list-none cursor-pointer w-fit inline-flex items-center text-[13px] group-hover:opacity-80 transition-opacity ${
                                  hasAuthority
                                    ? "font-semibold text-amber-800 dark:text-amber-300"
                                    : isEscalated
                                      ? "font-semibold text-slate-900 dark:text-slate-200"
                                      : isUnderIntervention ||
                                          canSubmitResolution
                                        ? "font-semibold text-slate-900 dark:text-slate-200"
                                        : "font-medium text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {hasAuthority
                                  ? "Head Intervention Active"
                                  : isEscalated
                                    ? "Escalated"
                                    : isUnderIntervention
                                      ? "Under Intervention"
                                      : canSubmitResolution
                                        ? "Resolution Required"
                                        : "Monitor"}
                              </summary>
                              <div className="text-[13px] text-slate-500 max-w-[210px] leading-tight mt-1 animate-in fade-in">
                                {item.hodIntervention.actionLabel ||
                                  (hasAuthority
                                    ? "Resolution Authority Assumed"
                                    : "")}
                              </div>
                            </details>
                          ) : (
                            <span
                              className={`w-fit inline-flex items-center text-[13px] ${
                                isClosedOrResolved
                                  ? "font-medium text-slate-500"
                                  : isEscalated
                                    ? "font-semibold text-slate-900 dark:text-slate-200"
                                    : canSubmitResolution
                                      ? "font-semibold text-slate-900 dark:text-slate-200"
                                      : "font-medium text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {isClosedOrResolved
                                ? item.status === "RESOLVED"
                                  ? "Resolved"
                                  : "Closed"
                                : isEscalated
                                  ? "Escalated"
                                  : canSubmitResolution
                                    ? "Resolution Required"
                                    : "Monitor"}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3 align-top">
                        {!isClosedOrResolved &&
                        item.hodIntervention?.isResolutionAuthority ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                              {item.hodIntervention.resolutionAuthorityName ||
                                "Department Head"}{" "}
                              (Authority)
                            </span>
                            {item.assignedStaffName && (
                              <span className="text-[11px] text-slate-500">
                                Staff: {item.assignedStaffName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-700">
                            {item.assignedStaffName || "Unassigned"}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 align-top">
                        <StatusBadge status={item.status} />
                        {hasAuthority && !isClosedOrResolved && (
                          <span className="block mt-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                            Head Intervention Active
                          </span>
                        )}
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
                            ...(canSubmitResolution &&
                            !isClosedOrResolved &&
                            item.isPrimaryDepartment !== false
                              ? [
                                  {
                                    label: "Submit Resolution",
                                    icon: <FileCheck className="h-3.5 w-3.5" />,
                                    variant: "default" as const,
                                    onClick: () => onReviewResolution(item),
                                  },
                                ]
                              : []),
                            ...(!hasAuthority &&
                            !isClosedOrResolved &&
                            (isEscalated || item.slaStatus === "BREACHED")
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
                            ...(!item.hasProposedKb &&
                            canHeadProposeKnowledge(item)
                              ? [
                                  {
                                    label: "Propose KB Article",
                                    icon: <BookOpen className="h-3.5 w-3.5" />,
                                    variant: "default" as const,
                                    onClick: () => onProposeKb?.(item),
                                  },
                                ]
                              : []),
                            ...(!hasAuthority &&
                            !isClosedOrResolved &&
                            !isEscalated &&
                            item.slaStatus !== "BREACHED" &&
                            (item.assignedStaffName || item.assignedStaffId)
                              ? [
                                  {
                                    label: "Change Assignment",
                                    icon: <UserCheck className="h-3.5 w-3.5" />,
                                    variant: "default" as const,
                                    onClick: () =>
                                      onAssign(
                                        item,
                                        item.assignedStaffId || "",
                                      ),
                                  },
                                ]
                              : []),
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
