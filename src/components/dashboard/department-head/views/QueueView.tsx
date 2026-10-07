"use client";

import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  GitBranch,
  RotateCcw,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { ActionMenu } from "@/components/ui/action-menu";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Pagination } from "@/components/ui/pagination";
import {
  SortableTableHead,
  type SortState,
} from "@/components/ui/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  canHeadProposeKnowledge,
  canHeadSubmitResolution,
  hasHeadResolutionAuthority,
} from "@/lib/department-head/filters";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
import type {
  CaseDrawerTab,
  DepartmentHeadTab,
  DepartmentMetricsSummary,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

export interface QueueViewProps {
  grievances: GrievanceItem[];
  filteredGrievances: GrievanceItem[];
  staffList: StaffMember[];
  selectedTab: DepartmentHeadTab;
  setSelectedTab: (tab: DepartmentHeadTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  staffFilter: string;
  setStaffFilter: (staffId: string) => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  departmentFilter?: string;
  setDepartmentFilter?: (dept: string) => void;
  slaFilter?: string;
  setSlaFilter?: (sla: string) => void;
  categoryFilter?: string;
  setCategoryFilter?: (cat: string) => void;
  subCategoryFilter?: string;
  setSubCategoryFilter?: (sub: string) => void;
  availableDepartments?: { id: string; name: string }[];
  selectedDeptId?: string;
  onDepartmentChange?: (deptId: string) => void;
  resetFilters: () => void;
  metrics: DepartmentMetricsSummary;
  onInspect: (item: GrievanceItem, tab?: CaseDrawerTab) => void;
  onAssign: (item: GrievanceItem, currentStaffId?: string) => void;
  onIntervene: (item: GrievanceItem) => void;
  onReviewResolution: (item: GrievanceItem) => void;
  onProposeKb?: (item: GrievanceItem) => void;
}

export function QueueView({
  grievances,
  filteredGrievances,
  staffList,
  selectedTab,
  setSelectedTab,
  searchQuery,
  setSearchQuery,
  priorityFilter,
  setPriorityFilter,
  staffFilter,
  setStaffFilter,
  statusFilter = "ALL",
  setStatusFilter,
  departmentFilter = "ALL",
  setDepartmentFilter,
  slaFilter = "ALL",
  setSlaFilter,
  categoryFilter = "ALL",
  setCategoryFilter,
  subCategoryFilter = "ALL",
  setSubCategoryFilter,
  availableDepartments = [],
  selectedDeptId,
  onDepartmentChange,
  resetFilters,
  metrics,
  onInspect,
  onAssign,
  onIntervene,
  onReviewResolution,
  onProposeKb,
}: QueueViewProps) {
  // Local Advanced Search state
  const [advancedConditions, setAdvancedConditions] = useState<
    SearchCondition[]
  >([]);
  const [advancedMode, setAdvancedMode] = useState<string>("AND");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting state
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: null,
  });

  const handleSort = (field: string, direction: SortState["direction"]) => {
    setSortState({ field, direction });
  };

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const localFilteredGrievances = useMemo(() => {
    return grievances.filter((g) =>
      evaluateSearchConditions(g, advancedConditions, advancedMode),
    );
  }, [grievances, advancedConditions, advancedMode]);

  const sortedGrievances = useMemo(() => {
    if (!sortState.field || !sortState.direction)
      return localFilteredGrievances;

    return [...localFilteredGrievances].sort((a, b) => {
      let valA: any = a[sortState.field as keyof GrievanceItem] || "";
      let valB: any = b[sortState.field as keyof GrievanceItem] || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortState.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [localFilteredGrievances, sortState]);

  const paginatedGrievances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedGrievances.slice(start, start + pageSize);
  }, [sortedGrievances, currentPage, pageSize]);

  const departmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of availableDepartments) {
      if (d.name) {
        map.set(d.name, d.name);
      }
    }
    for (const g of grievances) {
      if (g.collaboratingDepartments) {
        for (const cd of g.collaboratingDepartments) {
          if (cd) map.set(cd, cd);
        }
      }
    }
    const names = Array.from(map.values()).sort((a, b) => a.localeCompare(b));
    return [
      { value: "ALL", label: "All Departments" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [availableDepartments, grievances]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    grievances.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((c) => ({ label: c, value: c }));
  }, [grievances]);

  const subcategoryOptions = useMemo(() => {
    const set = new Set<string>();
    grievances.forEach((g) => {
      if (g.subcategory) set.add(g.subcategory);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((c) => ({ label: c, value: c }));
  }, [grievances]);

  const filterFields: SearchFieldDef[] = [
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
      id: "priority",
      label: "Priority",
      type: "select",
      options: [
        { label: "Critical", value: "CRITICAL" },
        { label: "High", value: "HIGH" },
        { label: "Medium", value: "MEDIUM" },
        { label: "Low", value: "LOW" },
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Routed", value: "ROUTED" },
        { label: "Assigned", value: "ASSIGNED" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Under Review", value: "UNDER_REVIEW" },
        { label: "Reopened", value: "REOPENED" },
        { label: "Escalated", value: "ESCALATED" },
        { label: "Resolved", value: "RESOLVED" },
        { label: "Closed", value: "CLOSED" },
      ],
    },
    {
      id: "sla",
      label: "SLA Status",
      type: "select",
      options: [
        { label: "Breached", value: "BREACHED" },
        { label: "SLA Critical", value: "SLA_CRITICAL" },
        { label: "SLA Risk", value: "SLA_RISK" },
        { label: "On Track", value: "ON_TRACK" },
      ],
    },
    ...(staffList.length > 0
      ? [
          {
            id: "staff",
            label: "Assigned Staff",
            type: "select" as const,
            options: [
              { label: "Unassigned Only", value: "UNASSIGNED" },
              ...staffList.map((s) => ({
                label: `${s.name} (${s.activeTickets} active)`,
                value: s.id,
              })),
            ],
          },
        ]
      : []),
    {
      id: "search",
      label: "Search",
      type: "text",
    },
  ];

  const handleSearchChange = (conditions: SearchCondition[], mode: string) => {
    setAdvancedConditions(conditions);
    setAdvancedMode(mode);
    setCurrentPage(1);
  };

  const handleClear = () => {
    if (setDepartmentFilter) setDepartmentFilter("ALL");
    setPriorityFilter("ALL");
    if (setStatusFilter) setStatusFilter("ALL");
    if (setSlaFilter) setSlaFilter("ALL");
    if (setCategoryFilter) setCategoryFilter("ALL");
    if (setSubCategoryFilter) setSubCategoryFilter("ALL");
    setStaffFilter("ALL");
    setSelectedTab("ALL");
    setSearchQuery("");
    setAdvancedConditions([]);
    setAdvancedMode("AND");
    resetFilters();
    setCurrentPage(1);
  };

  // Metric counts for views
  const counts = {
    all: grievances.length,
    exceptions:
      metrics.exceptionsCount ??
      grievances.filter(
        (g) =>
          (!g.assignedStaffId ||
            g.status === "SUBMITTED" ||
            g.isReopened ||
            g.status === "REOPENED" ||
            g.isCrossDepartment ||
            g.slaStatus === "BREACHED") &&
          g.status !== "CLOSED" &&
          g.status !== "RESOLVED",
      ).length,
    inProgress:
      metrics.inProgressCount ??
      grievances.filter(
        (g) => g.status === "IN_PROGRESS" || g.status === "ASSIGNED",
      ).length,
    slaRisk:
      metrics.slaAtRiskCount ??
      grievances.filter(
        (g) =>
          g.slaStatus === "AT_RISK" &&
          g.status !== "ESCALATED" &&
          !["CLOSED", "RESOLVED"].includes(g.status),
      ).length,
    slaCritical:
      metrics.slaCriticalCount ??
      grievances.filter(
        (g) =>
          (g.slaStatus === "BREACHED" || g.status === "ESCALATED") &&
          !["CLOSED", "RESOLVED"].includes(g.status),
      ).length,
    reopened:
      metrics.reopenedCount ??
      grievances.filter(
        (g) =>
          (g.isReopened || g.status === "REOPENED") &&
          !["CLOSED", "RESOLVED"].includes(g.status),
      ).length,
    escalated:
      metrics.escalatedCount ??
      grievances.filter((g) => g.status === "ESCALATED").length,
    closed:
      metrics.closedCount ??
      grievances.filter((g) => ["CLOSED", "RESOLVED"].includes(g.status))
        .length,
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
      {/* Queue Filter Controls Bar */}
      <div className="p-3.5 sm:p-5 flex flex-col md:flex-row md:items-center gap-4 bg-white border-b border-slate-200/80">
        {/* Title Header */}
        <div className="shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Live Grievance Oversight Queue
          </h2>
        </div>

        {/* Controls Bar: View & Filter */}
        <div className="flex-1 min-w-0">
          <AdvancedTableSearch
            fields={filterFields}
            onSearch={handleSearchChange}
            className="w-full"
          />
        </div>
      </div>

      {/* Grievances Data Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                field="id"
                currentSort={sortState}
                onSort={handleSort}
                className="py-3 pl-4 pr-3"
              >
                Grievance ID
              </SortableTableHead>
              <SortableTableHead
                field="title"
                currentSort={sortState}
                onSort={handleSort}
                className="py-3 px-3 min-w-64"
              >
                Grievance
              </SortableTableHead>
              <SortableTableHead
                field="category"
                currentSort={sortState}
                onSort={handleSort}
                className="py-3 px-3"
              >
                Category
              </SortableTableHead>
              <SortableTableHead
                field="subcategory"
                currentSort={sortState}
                onSort={handleSort}
                className="py-3 px-3"
              >
                Sub Category
              </SortableTableHead>
              <SortableTableHead
                field="priority"
                currentSort={sortState}
                onSort={handleSort}
                className="py-3 px-3"
              >
                Priority
              </SortableTableHead>
              <SortableTableHead
                field="status"
                currentSort={sortState}
                onSort={handleSort}
                className="py-3 px-3"
              >
                Status
              </SortableTableHead>
              <SortableTableHead
                field="slaStatus"
                currentSort={sortState}
                onSort={handleSort}
                className="py-3 px-3"
              >
                SLA Status
              </SortableTableHead>
              <SortableTableHead
                field="assignedStaffName"
                currentSort={sortState}
                onSort={handleSort}
                className="py-3 px-3"
              >
                Assigned Staff
              </SortableTableHead>
              <SortableTableHead
                field="createdAt"
                currentSort={sortState}
                onSort={handleSort}
                className="py-3 px-3"
              >
                Submitted
              </SortableTableHead>
              <TableHead className="py-3 pl-3 pr-4 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGrievances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-12 text-center text-slate-400 font-normal"
                >
                  <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">
                    No grievances match this filter
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Try changing your search keywords or filter criteria.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-3 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition"
                  >
                    Reset filters
                  </button>
                </TableCell>
              </TableRow>
            ) : (
              paginatedGrievances.map((item) => {
                const isEscalated = item.status === "ESCALATED";
                const isBreached = item.slaStatus === "BREACHED";
                const highlightSla = !isEscalated && isBreached;

                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-slate-50/70 transition group"
                  >
                    {/* 1. Ticket Code */}
                    <TableCell className="py-3 pl-4 pr-3 align-top">
                      <span className="font-mono text-sm font-semibold text-emerald-950 inline-block">
                        {item.ticketCode}
                      </span>
                    </TableCell>

                    {/* 2. Title & Badges */}
                    <TableCell className="py-3 px-3 align-top">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => onInspect(item, "statement")}
                          className="font-semibold text-sm text-slate-900 hover:text-emerald-900 transition text-left group-hover:text-emerald-950 block cursor-pointer"
                        >
                          {item.title}
                        </button>

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {item.isReopened && (
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                              Reopened ({item.reopenCount}x)
                            </span>
                          )}
                          {item.isCrossDepartment && (
                            <span
                              className="inline-flex items-center gap-1 text-sm font-medium text-slate-700"
                              title={item.collaboratingDepartments?.join(", ")}
                            >
                              <GitBranch className="h-2.5 w-2.5 text-slate-500" />
                              Cross-Dept
                            </span>
                          )}
                          {/* Removed Resolution Submitted badge per requirement */}
                        </div>
                      </div>
                    </TableCell>

                    {/* 2b. Category */}
                    <TableCell className="py-3 px-3 align-top">
                      <p className="text-[13px] text-slate-600 font-medium">
                        {item.category}
                      </p>
                    </TableCell>
                    <TableCell className="py-3 px-3 align-top">
                      <p className="text-sm text-slate-500">
                        {item.subcategory}
                      </p>
                    </TableCell>

                    {/* 3. Priority */}
                    <TableCell className="py-3 px-3 whitespace-nowrap align-top">
                      <PriorityBadge priority={item.priority} />
                    </TableCell>

                    {/* 4. Status */}
                    <TableCell className="py-3 px-3 whitespace-nowrap align-top">
                      <StatusBadge status={item.status} />
                      {hasHeadResolutionAuthority(item) && (
                        <span className="block mt-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                          Head Intervention Active
                        </span>
                      )}
                    </TableCell>

                    {/* 5. SLA Status */}
                    <TableCell className="py-3 px-3 whitespace-nowrap align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`text-sm font-medium whitespace-nowrap ${
                            highlightSla
                              ? "text-slate-900 font-semibold dark:text-slate-100"
                              : item.slaStatus === "AT_RISK"
                                ? "text-amber-800 font-medium dark:text-amber-400"
                                : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {item.slaTimeLeft}
                        </span>
                        {item.slaStatus === "AT_RISK" && (
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                            SLA At Risk
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* 6. Assigned Officer */}
                    <TableCell className="py-3 px-3 whitespace-nowrap align-top">
                      {item.status !== "CLOSED" &&
                      item.status !== "RESOLVED" &&
                      item.hodIntervention?.isResolutionAuthority ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                            <UserCheck className="h-3 w-3 text-amber-600" />
                            <span>
                              {item.hodIntervention.resolutionAuthorityName ||
                                "Department Head"}{" "}
                              (Authority)
                            </span>
                          </span>
                          {item.assignedStaffName && (
                            <span className="text-[11px] text-slate-500">
                              Staff: {item.assignedStaffName}
                            </span>
                          )}
                        </div>
                      ) : item.assignedStaffName ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
                          <User className="h-3 w-3 text-slate-400" />
                          <span>{item.assignedStaffName}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-sm font-normal text-slate-500">
                          Unassigned
                        </span>
                      )}
                    </TableCell>

                    {/* 7. Submitter & Date */}
                    <TableCell className="py-3 px-3 whitespace-nowrap align-top">
                      <div className="text-sm">
                        <p className="font-medium text-slate-800">
                          {item.submitterName}
                        </p>
                        <p className="text-sm text-slate-400 font-normal mt-0.5">
                          {item.createdAt}
                        </p>
                      </div>
                    </TableCell>

                    {/* 8. Actions */}
                    <TableCell className="py-3 pl-3 pr-4 text-right whitespace-nowrap align-top">
                      <ActionMenu
                        widthClass="w-44"
                        items={[
                          {
                            label: "Inspect",
                            icon: <Eye className="h-3.5 w-3.5" />,
                            onClick: () => onInspect(item, "progress"),
                          },
                          ...(canHeadSubmitResolution(item) &&
                          item.status !== "CLOSED" &&
                          item.status !== "RESOLVED" &&
                          item.isPrimaryDepartment !== false
                            ? [
                                {
                                  label: "Submit Resolution",
                                  icon: (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ),
                                  variant: "default" as const,
                                  onClick: () => onReviewResolution(item),
                                },
                              ]
                            : []),
                          ...(!hasHeadResolutionAuthority(item) &&
                          item.status !== "CLOSED" &&
                          item.status !== "RESOLVED" &&
                          (item.status === "ESCALATED" ||
                            item.slaStatus === "BREACHED")
                            ? [
                                {
                                  label: "Intervene",
                                  icon: <AlertCircle className="h-3.5 w-3.5" />,
                                  variant: "warning" as const,
                                  onClick: () => onIntervene(item),
                                },
                              ]
                            : []),
                          ...(!hasHeadResolutionAuthority(item) &&
                          item.status !== "CLOSED" &&
                          item.status !== "RESOLVED" &&
                          item.status !== "ESCALATED" &&
                          item.slaStatus !== "BREACHED" &&
                          !item.assignedStaffName &&
                          !item.assignedStaffId
                            ? [
                                {
                                  label: "Assign",
                                  icon: <UserPlus className="h-3.5 w-3.5" />,
                                  variant: "default" as const,
                                  onClick: () => onAssign(item),
                                },
                              ]
                            : []),
                          ...(!hasHeadResolutionAuthority(item) &&
                          item.status !== "CLOSED" &&
                          item.status !== "RESOLVED" &&
                          item.status !== "ESCALATED" &&
                          item.slaStatus !== "BREACHED" &&
                          (item.assignedStaffName || item.assignedStaffId)
                            ? [
                                {
                                  label: "Change Assignment",
                                  icon: <UserCheck className="h-3.5 w-3.5" />,
                                  variant: "default" as const,
                                  onClick: () =>
                                    onAssign(item, item.assignedStaffId || ""),
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
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-slate-200/80">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredGrievances.length / pageSize)}
          totalCount={filteredGrievances.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel="grievances"
        />
      </div>
    </div>
  );
}
