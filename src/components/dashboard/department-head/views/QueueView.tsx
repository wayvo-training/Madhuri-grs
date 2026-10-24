"use client";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
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
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { TruncatedText } from "@/components/ui/truncated-text";
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
  isLoading?: boolean;
  onInspect: (item: GrievanceItem, tab?: CaseDrawerTab) => void;
  onAssign: (item: GrievanceItem, currentStaffId?: string) => void;
  onIntervene: (item: GrievanceItem) => void;
  onReviewResolution: (item: GrievanceItem) => void;
  onProposeKb?: (item: GrievanceItem) => void;
}

export function QueueView({
  grievances,
  filteredGrievances: _filteredGrievances,
  staffList,
  selectedTab,
  setSelectedTab,
  searchQuery: _searchQuery,
  setSearchQuery: _setSearchQuery,
  priorityFilter = "ALL",
  setPriorityFilter: _setPriorityFilter,
  staffFilter = "ALL",
  setStaffFilter: _setStaffFilter,
  statusFilter = "ALL",
  setStatusFilter,
  departmentFilter: _departmentFilter = "ALL",
  setDepartmentFilter: _setDepartmentFilter,
  slaFilter: _slaFilter = "ALL",
  setSlaFilter: _setSlaFilter,
  categoryFilter: _categoryFilter = "ALL",
  setCategoryFilter: _setCategoryFilter,
  subCategoryFilter: _subCategoryFilter = "ALL",
  setSubCategoryFilter: _setSubCategoryFilter,
  availableDepartments: _availableDepartments = [],
  selectedDeptId: _selectedDeptId,
  onDepartmentChange: _onDepartmentChange,
  resetFilters,
  metrics,
  isLoading = false,
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
    if (
      statusFilter ||
      priorityFilter ||
      staffFilter ||
      selectedTab ||
      advancedConditions ||
      advancedMode
    ) {
      setCurrentPage(1);
    }
  }, [
    statusFilter,
    priorityFilter,
    staffFilter,
    selectedTab,
    advancedConditions,
    advancedMode,
  ]);

  const localFilteredGrievances = useMemo(() => {
    return grievances.filter((g) => {
      // 0. Preset Quick Filter Tab
      if (selectedTab === "ESCALATED") {
        const isEscalated =
          g.status === "ESCALATED" ||
          g.slaStatus === "BREACHED" ||
          Boolean(g.hodIntervention);
        if (!isEscalated) return false;
      } else if (selectedTab === "UNASSIGNED") {
        if (["CLOSED", "RESOLVED"].includes(g.status)) return false;
        const isUnassigned =
          !g.assignedStaffId ||
          !g.assignedStaffName ||
          g.assignedStaffName === "Unassigned" ||
          g.status === "SUBMITTED" ||
          g.status === "ROUTED" ||
          g.status === "PENDING_ASSIGNMENT" ||
          g.myDepartmentStatus === "PENDING_ASSIGNMENT";
        if (!isUnassigned) return false;
      } else if (selectedTab === "IN_PROGRESS") {
        if (["CLOSED", "RESOLVED"].includes(g.status)) return false;
        const isInProgress =
          g.status === "IN_PROGRESS" ||
          g.status === "ASSIGNED" ||
          g.myDepartmentStatus === "IN_PROGRESS" ||
          g.myDepartmentStatus === "ASSIGNED";
        if (!isInProgress) return false;
      } else if (selectedTab === "RESOLUTION_REVIEW") {
        if (g.status !== "UNDER_REVIEW" && !canHeadSubmitResolution(g)) {
          return false;
        }
      } else if (selectedTab === "CLOSED") {
        if (!["CLOSED", "RESOLVED"].includes(g.status)) return false;
      }

      // 1. Status Filter from parent (e.g. from clicking Status chart or tab)
      if (statusFilter && statusFilter !== "ALL") {
        if (statusFilter === "UNASSIGNED") {
          if (["CLOSED", "RESOLVED"].includes(g.status)) return false;
          const isUnassigned =
            !g.assignedStaffId ||
            !g.assignedStaffName ||
            g.assignedStaffName === "Unassigned" ||
            g.status === "SUBMITTED" ||
            g.status === "ROUTED" ||
            g.status === "PENDING_ASSIGNMENT" ||
            g.myDepartmentStatus === "PENDING_ASSIGNMENT";
          if (!isUnassigned) return false;
        } else if (statusFilter === "IN_PROGRESS") {
          if (["CLOSED", "RESOLVED", "UNDER_REVIEW"].includes(g.status))
            return false;
          if (g.isReopened || g.status === "REOPENED") return false;
          const isUnassigned =
            !g.assignedStaffId ||
            !g.assignedStaffName ||
            g.assignedStaffName === "Unassigned" ||
            g.status === "SUBMITTED" ||
            g.status === "ROUTED" ||
            g.status === "PENDING_ASSIGNMENT" ||
            g.myDepartmentStatus === "PENDING_ASSIGNMENT";
          if (isUnassigned) return false;
        } else if (statusFilter === "UNDER_REVIEW") {
          if (g.status !== "UNDER_REVIEW") return false;
        } else if (statusFilter === "ASSIGNED") {
          if (g.status !== "ASSIGNED" && g.myDepartmentStatus !== "ASSIGNED")
            return false;
        } else if (statusFilter === "REOPENED") {
          if (!g.isReopened && g.status !== "REOPENED") return false;
        } else if (statusFilter === "RESOLVED") {
          if (!["RESOLVED", "CLOSED"].includes(g.status)) return false;
        } else if (g.status !== statusFilter) {
          return false;
        }
      }

      // 2. Priority Filter from parent
      if (priorityFilter && priorityFilter !== "ALL") {
        if (g.priority !== priorityFilter) return false;
      }

      // 3. Staff Filter from parent
      if (staffFilter && staffFilter !== "ALL") {
        if (staffFilter === "UNASSIGNED") {
          if (["CLOSED", "RESOLVED"].includes(g.status)) return false;
          if (g.assignedStaffId) return false;
        } else if (g.assignedStaffId !== staffFilter) {
          return false;
        }
      }

      return evaluateSearchConditions(g, advancedConditions, advancedMode);
    });
  }, [
    grievances,
    selectedTab,
    advancedConditions,
    advancedMode,
    statusFilter,
    priorityFilter,
    staffFilter,
  ]);

  const sortedGrievances = useMemo(() => {
    const list = [...localFilteredGrievances];
    if (!sortState.field || !sortState.direction) {
      // Default Sort: Unassigned grievances first (excluding closed/resolved), then sorted by newest first
      return list.sort((a, b) => {
        const isUnassignedA =
          !["CLOSED", "RESOLVED"].includes(a.status) &&
          (!a.assignedStaffId ||
            !a.assignedStaffName ||
            a.assignedStaffName === "Unassigned" ||
            a.status === "SUBMITTED" ||
            a.status === "ROUTED");
        const isUnassignedB =
          !["CLOSED", "RESOLVED"].includes(b.status) &&
          (!b.assignedStaffId ||
            !b.assignedStaffName ||
            b.assignedStaffName === "Unassigned" ||
            b.status === "SUBMITTED" ||
            b.status === "ROUTED");

        if (isUnassignedA && !isUnassignedB) return -1;
        if (!isUnassignedA && isUnassignedB) return 1;

        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
          return dateB - dateA;
        }

        return Number(b.id) - Number(a.id);
      });
    }

    return list.sort((a, b) => {
      const field = sortState.field as keyof GrievanceItem;

      if (field === "createdAt") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
          return sortState.direction === "asc" ? timeA - timeB : timeB - timeA;
        }
      }

      const rawA = a[field] ?? "";
      const rawB = b[field] ?? "";

      const strA = typeof rawA === "string" ? rawA : String(rawA);
      const strB = typeof rawB === "string" ? rawB : String(rawB);

      const comp = strA.localeCompare(strB, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortState.direction === "asc" ? comp : -comp;
    });
  }, [localFilteredGrievances, sortState]);

  const paginatedGrievances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedGrievances.slice(start, start + pageSize);
  }, [sortedGrievances, currentPage, pageSize]);

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

  return (
    <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
      {/* Queue Filter Controls Bar */}
      <div className="p-3 sm:p-3.5 bg-white border-b border-slate-200/80 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4">
          {/* Title Header */}
          <div className="shrink-0 flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Live Grievance Oversight Queue
            </h2>
            {(statusFilter !== "ALL" ||
              priorityFilter !== "ALL" ||
              staffFilter !== "ALL" ||
              (selectedTab && selectedTab !== "ALL")) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                Filtered:{" "}
                {selectedTab && selectedTab !== "ALL"
                  ? selectedTab.replace(/_/g, " ")
                  : statusFilter !== "ALL"
                    ? statusFilter.replace(/_/g, " ")
                    : priorityFilter !== "ALL"
                      ? priorityFilter
                      : "Staff"}
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    if (setSelectedTab) setSelectedTab("ALL");
                  }}
                  className="hover:text-teal-950 font-bold ml-1 cursor-pointer"
                  title="Clear filter"
                >
                  &times;
                </button>
              </span>
            )}
          </div>

          {/* Controls Bar: View & Filter */}
          <div className="flex-1 min-w-0 w-full">
            <AdvancedTableSearch
              fields={filterFields}
              onSearch={handleSearchChange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Grievances Data Table */}
      <div className="flex-1 min-h-0 overflow-x-auto custom-scrollbar flex flex-col">
        <div className="min-w-[1650px] flex-1 min-h-0 flex flex-col">
          {/* Static Header Table: no scrollbar next to header */}
          <table className="w-full text-left text-sm table-fixed border-collapse shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <colgroup>
              <col className="w-[115px]" />
              <col className="w-[245px]" />
              <col className="w-[140px]" />
              <col className="w-[135px]" />
              <col className="w-[90px]" />
              <col className="w-[135px]" />
              <col className="w-[155px]" />
              <col className="w-[215px]" />
              <col className="w-[170px]" />
              <col className="w-[155px]" />
              <col className="w-[95px]" />
            </colgroup>
            <thead>
              <tr>
                <SortableTableHead
                  field="ticketCode"
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
                  className="py-3 px-3"
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
                  className="py-3 px-4"
                >
                  SLA Status
                </SortableTableHead>
                <TableHead className="py-3 px-4">Head Intervention</TableHead>
                <SortableTableHead
                  field="assignedStaffName"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-4"
                >
                  Assigned Staff
                </SortableTableHead>
                <SortableTableHead
                  field="createdAt"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-4"
                >
                  Submitted
                </SortableTableHead>
                <TableHead className="py-3 pl-3 pr-4 text-right">
                  Actions
                </TableHead>
              </tr>
            </thead>
          </table>

          {/* Scrollable Rows Container (Vertical scroll starts directly below header) */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <table className="w-full text-left text-sm table-fixed border-collapse">
              <colgroup>
                <col className="w-[115px]" />
                <col className="w-[245px]" />
                <col className="w-[140px]" />
                <col className="w-[135px]" />
                <col className="w-[100px]" />
                <col className="w-[125px]" />
                <col className="w-[155px]" />
                <col className="w-[215px]" />
                <col className="w-[170px]" />
                <col className="w-[155px]" />
                <col className="w-[95px]" />
              </colgroup>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow
                      key={`queue-skel-${
                        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                        i
                      }`}
                      className="animate-pulse"
                    >
                      <TableCell className="py-3.5 pl-4 pr-3">
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                      </TableCell>
                      <TableCell className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="h-3.5 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                          <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-3">
                        <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                      </TableCell>
                      <TableCell className="py-3.5 px-3">
                        <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                      </TableCell>
                      <TableCell className="py-3.5 px-3">
                        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      </TableCell>
                      <TableCell className="py-3.5 px-3">
                        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      </TableCell>
                      <TableCell className="py-3.5 px-3">
                        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      </TableCell>
                      <TableCell className="py-3.5 px-3">
                        <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                      </TableCell>
                      <TableCell className="py-3.5 px-3">
                        <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                      </TableCell>
                      <TableCell className="py-3.5 pl-3 pr-4 text-right">
                        <div className="h-7 w-8 bg-slate-200 dark:bg-slate-700 rounded-md ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : sortedGrievances.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
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
                    const isItemBlocked = Boolean(
                      item.isBlocked ||
                        item.status === "BLOCKED" ||
                        item.myDepartmentStatus === "BLOCKED",
                    );
                    const isItemClosed = Boolean(
                      item.status === "CLOSED" ||
                        item.status === "RESOLVED" ||
                        item.myDepartmentStatus === "COMPLETED",
                    );
                    const isEscalated = item.status === "ESCALATED";
                    const isBreached =
                      !isItemBlocked &&
                      !isItemClosed &&
                      item.slaStatus === "BREACHED";
                    const highlightSla = !isEscalated && isBreached;
                    const hasAssignedStaff = Boolean(
                      item.assignedStaffId ||
                        (item.assignedStaffName &&
                          item.assignedStaffName !== "Unassigned" &&
                          item.assignedStaffName !== "Blocked"),
                    );

                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50/70 transition group"
                      >
                        {/* 1. Ticket Code */}
                        <TableCell className="py-3 pl-4 pr-3 align-top">
                          <button
                            type="button"
                            onClick={() => onInspect(item, "statement")}
                            className="font-mono text-sm font-semibold text-teal-800 dark:text-teal-300 hover:text-teal-950 dark:hover:text-teal-100 hover:underline inline-block cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 rounded-xs"
                          >
                            {item.ticketCode}
                          </button>
                        </TableCell>

                        {/* 2. Title & Badges */}
                        <TableCell className="py-3 px-3 align-top max-w-[240px] overflow-hidden">
                          <div className="space-y-1 min-w-0">
                            <TruncatedText
                              text={item.title}
                              maxChars={24}
                              className="font-semibold text-sm text-slate-900 dark:text-slate-100 block max-w-[215px] truncate border-none"
                            />

                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {item.isReopened && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                                  Reopened ({item.reopenCount}x)
                                </span>
                              )}
                              {item.isCrossDepartment && (
                                <span className="inline-flex items-center text-xs font-medium text-slate-600 dark:text-slate-300">
                                  Multi Department
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* 2b. Category */}
                        <TableCell className="py-3 px-3 align-top max-w-[140px] overflow-hidden">
                          <TruncatedText
                            text={item.category}
                            maxChars={16}
                            className="text-[13px] text-slate-600 dark:text-slate-300 font-medium border-none block max-w-[125px] truncate"
                          />
                        </TableCell>
                        <TableCell className="py-3 px-3 align-top max-w-[130px] overflow-hidden">
                          <TruncatedText
                            text={item.subcategory}
                            maxChars={16}
                            className="text-[13px] text-slate-500 dark:text-slate-400 border-none block max-w-[115px] truncate"
                          />
                        </TableCell>

                        {/* 3. Priority */}
                        <TableCell className="py-3 px-3 whitespace-nowrap align-top">
                          <PriorityBadge priority={item.priority} />
                        </TableCell>

                        {/* 4. Status */}
                        <TableCell className="py-3 px-3 whitespace-nowrap align-top">
                          <StatusBadge status={item.status} />
                          {isItemBlocked && (
                            <span className="block mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                              Waiting for Prerequisite
                            </span>
                          )}
                        </TableCell>

                        {/* 5. SLA Status */}
                        <TableCell className="py-3 px-4 whitespace-nowrap align-top max-w-[155px] overflow-hidden">
                          <div className="flex flex-col items-start gap-1 min-w-0">
                            {isItemBlocked ? (
                              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                Paused (Blocked)
                              </span>
                            ) : isItemClosed ? (
                              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Completed
                              </span>
                            ) : (
                              <>
                                <span
                                  className={`text-sm font-medium whitespace-nowrap ${
                                    highlightSla
                                      ? "text-rose-600 font-bold dark:text-rose-400"
                                      : item.slaStatus === "AT_RISK"
                                        ? "text-amber-800 font-semibold dark:text-amber-400"
                                        : "text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  {item.slaTimeLeft}
                                </span>
                                {item.slaStatus === "AT_RISK" && (
                                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                    SLA At Risk
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>

                        {/* 6. Head Intervention (New Column) */}
                        <TableCell className="py-3 px-4 whitespace-nowrap align-top">
                          {isItemBlocked ? (
                            <span className="text-xs text-slate-400 font-normal">
                              —
                            </span>
                          ) : isItemClosed ? (
                            <span className="text-xs text-slate-400 font-normal">
                              —
                            </span>
                          ) : hasHeadResolutionAuthority(item) ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                              <ShieldAlert className="h-3 w-3 text-amber-600 shrink-0" />
                              <span>Intervention Active</span>
                            </span>
                          ) : item.hodIntervention ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                              <ShieldCheck className="h-3 w-3 text-teal-600 shrink-0" />
                              <span>
                                {item.hodIntervention.actionLabel ||
                                  "Intervention Taken"}
                              </span>
                            </span>
                          ) : item.status === "ESCALATED" ||
                            item.slaStatus === "BREACHED" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                              <AlertCircle className="h-3 w-3 text-rose-600 shrink-0" />
                              <span>Intervention Required</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-normal">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* 7. Assigned Officer */}
                        <TableCell className="py-3 px-4 whitespace-nowrap align-top overflow-hidden">
                          {isItemBlocked ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-500/20">
                              Blocked
                            </span>
                          ) : hasAssignedStaff ? (
                            <span
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800 max-w-full truncate"
                              title={item.assignedStaffName || undefined}
                            >
                              <User className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {item.assignedStaffName}
                              </span>
                            </span>
                          ) : isItemClosed ? (
                            <span className="inline-flex items-center text-sm font-normal text-slate-400">
                              —
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-sm font-normal text-slate-500">
                              Unassigned
                            </span>
                          )}
                        </TableCell>

                        {/* 7. Submitter & Date */}
                        <TableCell className="py-3 px-4 whitespace-nowrap align-top">
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
                              !item.isBlocked &&
                              item.status !== "BLOCKED" &&
                              item.myDepartmentStatus !== "BLOCKED" &&
                              (item.status === "ESCALATED" ||
                                item.slaStatus === "BREACHED")
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
                              ...(!hasHeadResolutionAuthority(item) &&
                              item.status !== "CLOSED" &&
                              item.status !== "RESOLVED" &&
                              item.status !== "COMPLETED" &&
                              item.status !== "UNDER_REVIEW" &&
                              item.myDepartmentStatus !== "COMPLETED" &&
                              item.status !== "ESCALATED" &&
                              item.slaStatus !== "BREACHED" &&
                              !hasAssignedStaff
                                ? [
                                    {
                                      label: "Assign",
                                      icon: (
                                        <UserPlus className="h-3.5 w-3.5" />
                                      ),
                                      variant: "default" as const,
                                      onClick: () => onAssign(item),
                                    },
                                  ]
                                : []),
                              ...(!hasHeadResolutionAuthority(item) &&
                              item.status !== "CLOSED" &&
                              item.status !== "RESOLVED" &&
                              item.status !== "COMPLETED" &&
                              item.status !== "UNDER_REVIEW" &&
                              item.myDepartmentStatus !== "COMPLETED" &&
                              item.status !== "ESCALATED" &&
                              item.slaStatus !== "BREACHED" &&
                              hasAssignedStaff
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
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </table>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 mt-auto border-t border-slate-200 bg-white dark:bg-slate-900">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(localFilteredGrievances.length / pageSize)}
          totalCount={localFilteredGrievances.length}
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
