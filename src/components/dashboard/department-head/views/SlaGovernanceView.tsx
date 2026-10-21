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
import { TruncatedText } from "@/components/ui/truncated-text";
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
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-4">
          <div className="flex items-start gap-2 shrink-0">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Escalation & SLA Governance
              </h3>
              <p className="text-sm font-normal text-slate-500 dark:text-slate-400 max-w-sm">
                Review escalated grievances, monitor SLA breaches, and take
                corrective intervention when required.
              </p>
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col items-end gap-3 w-full">
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap">
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

        <div className="overflow-x-auto custom-scrollbar border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="min-w-[1240px]">
            {/* Static Header Table: no scrollbar next to header */}
            <table className="w-full text-left text-sm table-fixed border-collapse shrink-0 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <colgroup>
                <col className="w-[110px]" />
                <col className="w-[230px]" />
                <col className="w-[140px]" />
                <col className="w-[130px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[140px]" />
                <col className="w-[100px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                <tr>
                  <SortableTh
                    field="ticketCode"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-2.5 pl-4 pr-3 whitespace-nowrap"
                  >
                    Grievance ID
                  </SortableTh>
                  <SortableTh
                    field="title"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-2.5 px-3 whitespace-nowrap"
                  >
                    Summary
                  </SortableTh>
                  <SortableTh
                    field="category"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-2.5 px-3 whitespace-nowrap"
                  >
                    Category
                  </SortableTh>
                  <SortableTh
                    field="subcategory"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-2.5 px-3 whitespace-nowrap"
                  >
                    Sub Category
                  </SortableTh>
                  <SortableTh
                    field="slaTimeLeft"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-2.5 px-3 whitespace-nowrap"
                  >
                    SLA
                  </SortableTh>
                  <SortableTh
                    field="status"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-2.5 px-3 whitespace-nowrap"
                  >
                    Escalation
                  </SortableTh>
                  <SortableTh
                    field="assignedStaffName"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-2.5 px-3 whitespace-nowrap"
                  >
                    Assigned Staff
                  </SortableTh>
                  <SortableTh
                    field="status"
                    currentSort={sortState}
                    onSort={handleSort}
                    className="py-2.5 px-3 whitespace-nowrap"
                  >
                    Status
                  </SortableTh>
                  <th className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
            </table>

            {/* Scrollable Rows Container (Vertical scroll within rows only) */}
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto overflow-x-hidden custom-scrollbar">
              <table className="w-full text-left text-sm table-fixed border-collapse">
                <colgroup>
                  <col className="w-[110px]" />
                  <col className="w-[230px]" />
                  <col className="w-[140px]" />
                  <col className="w-[130px]" />
                  <col className="w-[150px]" />
                  <col className="w-[150px]" />
                  <col className="w-[140px]" />
                  <col className="w-[100px]" />
                  <col className="w-[90px]" />
                </colgroup>
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
                      const isItemBlocked = Boolean(
                        item.isBlocked ||
                          item.status === "BLOCKED" ||
                          item.myDepartmentStatus === "BLOCKED",
                      );
                      const isClosedOrResolved =
                        item.status === "CLOSED" ||
                        item.status === "RESOLVED" ||
                        item.myDepartmentStatus === "COMPLETED";
                      const isEscalated =
                        !isItemBlocked && item.status === "ESCALATED";
                      const hasAuthority = hasHeadResolutionAuthority(item);
                      const canSubmitResolution = canHeadSubmitResolution(item);
                      const isUnderIntervention =
                        !isClosedOrResolved &&
                        !isItemBlocked &&
                        (hasAuthority ||
                          (item.status === "IN_PROGRESS" &&
                            !!item.hodIntervention));

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="py-2.5 pl-4 pr-3 align-middle whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onInspect(item, "statement")}
                              className="inline-block font-mono text-sm font-semibold text-teal-800 dark:text-teal-300 hover:text-teal-950 dark:hover:text-teal-100 hover:underline cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 rounded-xs"
                            >
                              {item.ticketCode}
                            </button>
                          </td>

                          <td className="py-2.5 px-3 align-middle max-w-[230px] overflow-hidden">
                            <TruncatedText
                              text={item.title}
                              maxChars={24}
                              className="truncate whitespace-nowrap block text-left text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-[205px] border-none"
                            />
                          </td>

                          <td className="py-2.5 px-3 align-middle max-w-[140px] overflow-hidden">
                            <TruncatedText
                              text={item.category}
                              maxChars={16}
                              className="truncate whitespace-nowrap block text-sm font-medium text-slate-700 dark:text-slate-300 border-none max-w-[125px]"
                            />
                          </td>

                          <td className="py-2.5 px-3 align-middle max-w-[130px] overflow-hidden">
                            <TruncatedText
                              text={item.subcategory}
                              maxChars={16}
                              className="truncate whitespace-nowrap block text-sm text-slate-500 dark:text-slate-400 border-none max-w-[115px]"
                            />
                          </td>

                          <td className="py-2.5 px-3 align-middle whitespace-nowrap max-w-[150px] overflow-hidden">
                            <span
                              className={`inline-flex whitespace-nowrap text-[13px] font-medium ${
                                isItemBlocked
                                  ? "text-amber-700 dark:text-amber-400 font-semibold"
                                  : isClosedOrResolved
                                    ? "text-slate-500 dark:text-slate-400 font-normal"
                                    : item.slaStatus === "BREACHED"
                                      ? "text-rose-600 dark:text-rose-400 font-bold"
                                      : item.slaStatus === "AT_RISK"
                                        ? "text-amber-800 dark:text-amber-400 font-semibold"
                                        : "text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {isItemBlocked
                                ? "Paused (Blocked)"
                                : isClosedOrResolved
                                  ? "Completed"
                                  : item.slaTimeLeft}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 align-middle whitespace-nowrap max-w-[150px] overflow-hidden">
                            <span
                              title={
                                item.hodIntervention?.actionLabel ||
                                (hasAuthority
                                  ? "Resolution Authority Assumed"
                                  : undefined)
                              }
                              className={`w-fit inline-flex items-center whitespace-nowrap text-[13px] ${
                                isItemBlocked
                                  ? "font-normal text-slate-400"
                                  : hasAuthority
                                    ? "font-semibold text-amber-800 dark:text-amber-300"
                                    : isClosedOrResolved
                                      ? "font-medium text-slate-500 dark:text-slate-400"
                                      : isEscalated
                                        ? "font-semibold text-slate-900 dark:text-slate-200"
                                        : isUnderIntervention ||
                                            canSubmitResolution
                                          ? "font-semibold text-slate-900 dark:text-slate-200"
                                          : "font-medium text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {isItemBlocked
                                ? "—"
                                : hasAuthority
                                  ? "Head Intervention Active"
                                  : isClosedOrResolved
                                    ? item.status === "RESOLVED"
                                      ? "Resolved"
                                      : "Closed"
                                    : isEscalated
                                      ? "Escalated"
                                      : isUnderIntervention
                                        ? "Under Intervention"
                                        : canSubmitResolution
                                          ? "Resolution Required"
                                          : "Monitor"}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                            {!isClosedOrResolved &&
                            item.hodIntervention?.isResolutionAuthority ? (
                              <span
                                className="inline-block truncate max-w-[150px] text-xs font-semibold text-amber-800 dark:text-amber-300 whitespace-nowrap"
                                title={`${item.hodIntervention.resolutionAuthorityName || "Department Head"} (Authority)${item.assignedStaffName ? ` · Staff: ${item.assignedStaffName}` : ""}`}
                              >
                                {item.hodIntervention.resolutionAuthorityName ||
                                  "Dept Head"}{" "}
                                (Authority)
                              </span>
                            ) : item.isBlocked || item.status === "BLOCKED" ? (
                              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
                                Blocked
                              </span>
                            ) : (
                              <span
                                className="inline-block truncate max-w-[150px] text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap"
                                title={item.assignedStaffName || "Unassigned"}
                              >
                                {item.assignedStaffName || "Unassigned"}
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                            <StatusBadge status={item.status} />
                          </td>

                          <td className="py-2.5 pl-3 pr-4 text-right align-middle whitespace-nowrap">
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
                                        icon: (
                                          <FileCheck className="h-3.5 w-3.5" />
                                        ),
                                        variant: "default" as const,
                                        onClick: () => onReviewResolution(item),
                                      },
                                    ]
                                  : []),
                                ...(!hasAuthority &&
                                !isClosedOrResolved &&
                                !item.isBlocked &&
                                item.status !== "BLOCKED" &&
                                item.myDepartmentStatus !== "BLOCKED" &&
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
                                        icon: (
                                          <BookOpen className="h-3.5 w-3.5" />
                                        ),
                                        variant: "default" as const,
                                        onClick: () => onProposeKb?.(item),
                                      },
                                    ]
                                  : []),
                                ...(!hasAuthority &&
                                !isClosedOrResolved &&
                                item.status !== "COMPLETED" &&
                                item.status !== "UNDER_REVIEW" &&
                                item.myDepartmentStatus !== "COMPLETED" &&
                                !isEscalated &&
                                item.slaStatus !== "BREACHED" &&
                                (item.assignedStaffName || item.assignedStaffId)
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
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
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
