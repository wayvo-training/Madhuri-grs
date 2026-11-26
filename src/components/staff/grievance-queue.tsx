"use client";

import { BookOpen, Clock, Eye, FileCheck2, Inbox, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { ProposeKnowledgeModal } from "@/components/knowledge/ProposeKnowledgeModal";
import { ActionMenu } from "@/components/ui/action-menu";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import type { CustomSelectOption } from "@/components/ui/custom-select";
import { Pagination } from "@/components/ui/pagination";
import {
  SortableTh,
  type SortState,
} from "@/components/ui/sortable-table-head";
import { TruncatedText } from "@/components/ui/truncated-text";
import { usePagination } from "@/hooks/usePagination";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
import { canStaffProposeKnowledge } from "@/lib/staff/utils";
import type {
  StaffGrievanceItem,
  StaffQueueFilterState,
  StaffQueueTab,
} from "@/types/staff";

interface GrievanceQueueProps {
  grievances: StaffGrievanceItem[];
  categories?: string[];
  staffName?: string;
  staffEmail?: string;
  onExamine: (grievance: StaffGrievanceItem) => void;
  onResolve: (grievance: StaffGrievanceItem) => void;
  initialTab?: StaffQueueTab;
  onBackToOverview?: () => void;
}

export function GrievanceQueue({
  grievances,
  categories: categoriesProp,
  onExamine,
  onResolve,
  initialTab = "all",
  onBackToOverview: _onBackToOverview,
}: GrievanceQueueProps) {
  const [activeTab, setActiveTab] = useState<StaffQueueTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [filters, setFilters] = useState<StaffQueueFilterState>({
    searchQuery: "",
    status: "ALL",
    priority: "ALL",
    slaStatus: "ALL",
    category: "ALL",
    isReopenedOnly: false,
  });

  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: null,
  });

  const [advancedSearch, setAdvancedSearch] = useState<SearchCondition[]>([]);
  const [filterMode, setFilterMode] = useState<string>("AND");
  const [proposeKbItem, setProposeKbItem] = useState<StaffGrievanceItem | null>(
    null,
  );
  const [locallyProposedIds, setLocallyProposedIds] = useState<Set<string>>(
    new Set(),
  );

  const handleSort = (field: string, direction: SortState["direction"]) => {
    setSortState({ field, direction });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get("search");
      if (q) {
        setFilters((prev) => ({ ...prev, searchQuery: q }));
      }
      const t = sp.get("tab") as StaffQueueTab | null;
      if (t) {
        setActiveTab(t);
      }
    }
  }, []);

  // Comprehensive master categories: combines system taxonomy + assigned grievances
  const categories = useMemo(() => {
    const set = new Set<string>(categoriesProp || []);
    for (const g of grievances) {
      if (g.category) set.add(g.category);
    }
    return Array.from(set).sort();
  }, [categoriesProp, grievances]);

  const priorityOptions: CustomSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "All Priorities" },
      {
        value: "CRITICAL",
        label: "Critical",
        icon: (
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shrink-0" />
        ),
      },
      {
        value: "HIGH",
        label: "High",
        icon: (
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" />
        ),
      },
      {
        value: "MEDIUM",
        label: "Medium",
        icon: (
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0" />
        ),
      },
      {
        value: "LOW",
        label: "Low",
        icon: (
          <span className="w-2 h-2 rounded-full bg-slate-400 inline-block shrink-0" />
        ),
      },
    ],
    [],
  );

  const statusOptions: CustomSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "All Statuses" },
      { value: "ASSIGNED", label: "Assigned" },
      { value: "IN_PROGRESS", label: "In Progress" },
      { value: "AWAITING_INFORMATION", label: "Awaiting Information" },
      { value: "REWORK", label: "Rework" },
      {
        value: "RESOLUTION_PENDING_APPROVAL",
        label: "Resolution Pending Approval",
      },
      { value: "REOPENED", label: "Reopened" },
      { value: "RESOLVED", label: "Resolved" },
      { value: "CLOSED", label: "Closed" },
    ],
    [],
  );

  const categoryOptions: CustomSelectOption[] = useMemo(
    () => [
      { value: "ALL", label: "All Categories" },
      ...categories.map((cat) => ({
        value: cat,
        label: cat,
      })),
    ],
    [categories],
  );

  const searchFields: SearchFieldDef[] = useMemo(
    () => [
      { id: "grievanceNumber", label: "Grievance ID", type: "text" },
      {
        id: "isReopened",
        label: "Reopened Status",
        type: "select",
        options: [
          { value: "YES", label: "Reopened" },
          { value: "NO", label: "Standard" },
        ],
      },
      {
        id: "category",
        label: "Category",
        type: "select",
        options: categoryOptions
          .filter((o) => o.value !== "ALL")
          .map((o) => ({ value: o.value as string, label: o.label as string })),
      },
      {
        id: "priority",
        label: "Priority",
        type: "select",
        options: priorityOptions
          .filter((o) => o.value !== "ALL")
          .map((o) => ({ value: o.value as string, label: o.label as string })),
      },
      {
        id: "status",
        label: "Status",
        type: "select",
        options: statusOptions
          .filter((o) => o.value !== "ALL")
          .map((o) => ({ value: o.value as string, label: o.label as string })),
      },
      {
        id: "slaStatus",
        label: "SLA Status",
        type: "select",
        options: [
          { value: "ON_TRACK", label: "On Track" },
          { value: "AT_RISK", label: "At Risk" },
          { value: "BREACHED", label: "Breached" },
        ],
      },
      { id: "search", label: "Global Search", type: "text" },
    ],
    [categoryOptions, priorityOptions, statusOptions],
  );

  // Filtered grievances
  const filteredGrievances = useMemo(() => {
    return grievances.filter((item) => {
      const s = (item.status || "").toUpperCase();
      const overallS = (item.overallStatus || "").toUpperCase();
      const isClosed = s === "CLOSED" || overallS === "CLOSED";

      if (activeTab === "in_progress") {
        if (
          item.isMyDepartmentCompleted ||
          s === "COMPLETED" ||
          isClosed ||
          s === "RESOLVED" ||
          overallS === "RESOLVED" ||
          s === "REOPENED" ||
          s === "REWORK" ||
          (item.reopenCount || 0) > 0 ||
          s === "ESCALATED" ||
          s === "UNDER_REVIEW" ||
          s === "REOPEN_REVIEW" ||
          s === "RESOLUTION_PENDING_APPROVAL" ||
          s === "AWAITING_INFORMATION" ||
          s === "WAITING_ON_USER"
        ) {
          return false;
        }
      } else if (activeTab === "under_review") {
        if (
          item.isMyDepartmentCompleted ||
          s === "COMPLETED" ||
          isClosed ||
          s === "RESOLVED" ||
          overallS === "RESOLVED" ||
          (s !== "UNDER_REVIEW" &&
            s !== "REOPEN_REVIEW" &&
            s !== "RESOLUTION_PENDING_APPROVAL")
        ) {
          return false;
        }
      } else if (activeTab === "on_track") {
        if (
          item.slaStatus !== "ON_TRACK" ||
          isClosed ||
          s === "COMPLETED" ||
          s === "RESOLVED" ||
          overallS === "RESOLVED" ||
          item.isMyDepartmentCompleted
        ) {
          return false;
        }
      } else if (activeTab === "at_risk") {
        if (
          item.slaStatus !== "AT_RISK" ||
          isClosed ||
          s === "COMPLETED" ||
          s === "RESOLVED" ||
          overallS === "RESOLVED" ||
          item.isMyDepartmentCompleted
        ) {
          return false;
        }
      } else if (activeTab === "breached") {
        if (
          item.slaStatus !== "BREACHED" ||
          isClosed ||
          s === "COMPLETED" ||
          s === "RESOLVED" ||
          overallS === "RESOLVED" ||
          item.isMyDepartmentCompleted
        ) {
          return false;
        }
      } else if (activeTab === "reopened") {
        if (
          isClosed ||
          s === "RESOLVED" ||
          overallS === "RESOLVED" ||
          s === "COMPLETED" ||
          item.isMyDepartmentCompleted
        ) {
          return false;
        }
        if (
          (item.reopenCount || 0) === 0 &&
          s !== "REOPENED" &&
          s !== "REWORK"
        ) {
          return false;
        }
      } else if (activeTab === "completed") {
        if (
          isClosed ||
          (s !== "RESOLVED" &&
            overallS !== "RESOLVED" &&
            s !== "UNDER_REVIEW" &&
            s !== "COMPLETED" &&
            !item.isMyDepartmentCompleted)
        ) {
          return false;
        }
      } else if (activeTab === "closed") {
        if (!isClosed) {
          return false;
        }
      } else if (activeTab === "resolved") {
        if (isClosed) {
          return false;
        }
        const isStaffResolved =
          s === "RESOLVED" ||
          overallS === "RESOLVED" ||
          s === "COMPLETED" ||
          Boolean(item.isMyDepartmentCompleted);
        if (!isStaffResolved) return false;
      } else if (activeTab === "awaiting_info") {
        if (
          isClosed ||
          s === "RESOLVED" ||
          overallS === "RESOLVED" ||
          item.isMyDepartmentCompleted ||
          (s !== "AWAITING_INFORMATION" &&
            s !== "WAITING_ON_USER" &&
            s !== "PENDING_INFO")
        ) {
          return false;
        }
      } else if (activeTab === "escalated") {
        if (
          isClosed ||
          s === "RESOLVED" ||
          overallS === "RESOLVED" ||
          item.isMyDepartmentCompleted ||
          s !== "ESCALATED"
        ) {
          return false;
        }
      }

      // 2. Advanced Search Evaluator
      const computedItem = {
        ...item,
        isReopened: item.reopenCount > 0 ? "YES" : "NO",
      };

      return evaluateSearchConditions(computedItem, advancedSearch, filterMode);
    });
  }, [grievances, activeTab, advancedSearch, filterMode]);

  // Sorted list
  const sortedGrievances = useMemo(() => {
    const list = [...filteredGrievances];
    if (!sortState.field || !sortState.direction) {
      // Default Sort: Most recently assigned / received grievances on top
      return list.sort((a, b) => {
        const dateB = new Date(b.assignedAt || b.submittedAt).getTime();
        const dateA = new Date(a.assignedAt || a.submittedAt).getTime();
        if (!Number.isNaN(dateB) && !Number.isNaN(dateA) && dateB !== dateA) {
          return dateB - dateA;
        }
        const idA = Number(a.id) || 0;
        const idB = Number(b.id) || 0;
        return idB - idA;
      });
    }

    return list.sort((a, b) => {
      let aVal: string | number =
        (a[sortState.field as keyof typeof a] as string | number) ?? "";
      let bVal: string | number =
        (b[sortState.field as keyof typeof b] as string | number) ?? "";

      // specific comparisons
      if (sortState.field === "submittedAt") {
        aVal = new Date(a.submittedAt).getTime();
        bVal = new Date(b.submittedAt).getTime();
      }
      if (sortState.field === "priority") {
        const score: Record<string, number> = {
          CRITICAL: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };
        aVal = score[a.priority as string] || 0;
        bVal = score[b.priority as string] || 0;
      }
      if (sortState.field === "slaConsumptionPercent") {
        if (a.slaStatus === "BREACHED" && b.slaStatus !== "BREACHED")
          return sortState.direction === "asc" ? 1 : -1;
        if (b.slaStatus === "BREACHED" && a.slaStatus !== "BREACHED")
          return sortState.direction === "asc" ? -1 : 1;
      }

      if (aVal < bVal) return sortState.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredGrievances, sortState]);

  const pagination = usePagination(sortedGrievances, {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  });

  // Reset to page 1 whenever filters, tab, or sort order changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset to page 1 on filter/tab/sort changes
  useEffect(() => {
    pagination.resetPage();
  }, [filters, activeTab, sortState, advancedSearch, pagination.resetPage]);

  const hasActiveFilters =
    activeTab !== "all" ||
    filters.searchQuery !== "" ||
    filters.status !== "ALL" ||
    filters.priority !== "ALL" ||
    filters.category !== "ALL";

  const resetFilters = () => {
    setActiveTab("all");
    setFilters({
      searchQuery: "",
      status: "ALL",
      priority: "ALL",
      slaStatus: "ALL",
      category: "ALL",
      isReopenedOnly: false,
    });
    setAdvancedSearch([]);
  };

  const getTabLabel = (tab: StaffQueueTab) => {
    switch (tab) {
      case "in_progress":
        return "In Progress";
      case "under_review":
        return "Pending Approval";
      case "reopened":
        return "Reopened";
      case "on_track":
        return "SLA On Track";
      case "at_risk":
        return "SLA At Risk";
      case "breached":
        return "SLA Breached";
      case "completed":
        return "Completed";
      case "closed":
        return "Closed";
      case "resolved":
        return "Resolved";
      case "awaiting_info":
        return "Awaiting Info";
      case "escalated":
        return "Escalated";
      default:
        return "All Assigned";
    }
  };

  const colGroup = (
    <colgroup>
      <col className="w-[145px]" />
      <col className="w-[260px]" />
      <col className="w-[140px]" />
      <col className="w-[170px]" />
      <col className="w-[105px]" />
      <col className="w-[160px]" />
      <col className="w-[155px]" />
      <col className="w-[130px]" />
      <col className="w-[115px]" />
    </colgroup>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
      <div className="shrink-0 p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {activeTab !== "all" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">
                Filtered:
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {getTabLabel(activeTab)}
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className="hover:text-teal-950 dark:hover:text-teal-100 cursor-pointer ml-0.5"
                  title="Clear filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0 w-full">
            <AdvancedTableSearch
              fields={searchFields}
              onSearch={(conds, mode) => {
                setAdvancedSearch(conds);
                setFilterMode(mode);
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Grievances List - Table Format */}
      <div className="flex-1 min-h-0 overflow-x-auto custom-scrollbar flex flex-col">
        <div className="min-w-[1380px] flex-1 min-h-0 flex flex-col">
          {/* Static Header Table: fixed at top, no horizontal mismatch */}
          <table className="w-full text-left text-sm table-fixed border-collapse shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            {colGroup}
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[13px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                <SortableTh
                  field="grievanceNumber"
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
                  className="py-2.5 px-3.5 whitespace-nowrap"
                >
                  Summary
                </SortableTh>
                <th className="py-2.5 px-4 text-slate-900 dark:text-slate-200 font-bold uppercase tracking-wider text-[13px] text-left whitespace-nowrap">
                  Reopened Status
                </th>
                <SortableTh
                  field="category"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2.5 px-4 whitespace-nowrap"
                >
                  Category
                </SortableTh>
                <SortableTh
                  field="priority"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2.5 px-3 whitespace-nowrap"
                >
                  Priority
                </SortableTh>
                <SortableTh
                  field="status"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2.5 px-3 whitespace-nowrap"
                >
                  Status
                </SortableTh>
                <SortableTh
                  field="slaConsumptionPercent"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2.5 px-3 whitespace-nowrap"
                >
                  SLA
                </SortableTh>
                <SortableTh
                  field="submittedAt"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2.5 px-3 whitespace-nowrap"
                >
                  Last Updated
                </SortableTh>
                <th className="py-2.5 pr-6 pl-2 text-right text-slate-900 dark:text-slate-200 font-bold whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
          </table>

          {/* Scrollable Rows Container (Vertical scroll starts directly below header) */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {sortedGrievances.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No assigned grievances found
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm mx-auto">
                    {hasActiveFilters
                      ? "No grievances match your current search or filter criteria. Try clearing filters."
                      : "You currently have no grievances assigned under this queue view."}
                  </p>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-sm table-fixed border-collapse">
                {colGroup}
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300">
                  {pagination.paginatedItems.map((item) => {
                    const isBreached = item.slaStatus === "BREACHED";
                    const isAtRisk = item.slaStatus === "AT_RISK";
                    const isReopened =
                      item.reopenCount > 0 || item.status === "REOPENED";
                    const isClosed =
                      item.status === "CLOSED" ||
                      item.overallStatus === "CLOSED";
                    const isResolved =
                      item.status === "RESOLVED" ||
                      item.overallStatus === "RESOLVED";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Grievance Number */}
                        <td className="py-2.5 pl-4 pr-3 whitespace-nowrap align-middle">
                          <button
                            type="button"
                            onClick={() => onExamine(item)}
                            className="font-mono text-sm font-bold text-teal-800 dark:text-teal-300 hover:text-teal-950 dark:hover:text-teal-100 hover:underline cursor-pointer text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 rounded-xs transition"
                            title={`Examine case ${item.grievanceNumber}`}
                          >
                            {item.grievanceNumber}
                          </button>
                        </td>

                        {/* Summary */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap align-middle max-w-[240px]">
                          <TruncatedText
                            text={item.title}
                            maxChars={30}
                            className="font-medium text-slate-900 dark:text-slate-100 border-none truncate whitespace-nowrap block max-w-[220px]"
                          />
                        </td>

                        {/* Reopened Status */}
                        <td className="py-2.5 px-4 whitespace-nowrap align-middle">
                          {isReopened ? (
                            <span className="inline-flex items-center gap-0.5 text-[13px] font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              Reopened ({item.reopenCount})
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-xs">
                              -
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-4 whitespace-nowrap align-middle max-w-[170px]">
                          <TruncatedText
                            text={item.category}
                            maxChars={18}
                            className="text-slate-900 dark:text-slate-200 border-none truncate whitespace-nowrap block max-w-[155px]"
                          />
                        </td>

                        {/* Priority */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          <PriorityBadge priority={item.priority} />
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          {isClosed ? (
                            <StatusBadge status="CLOSED" label="Closed" />
                          ) : isResolved ||
                            item.isMyDepartmentCompleted ||
                            item.status === "COMPLETED" ? (
                            <StatusBadge status="RESOLVED" label="Resolved" />
                          ) : (
                            <StatusBadge status={item.status} />
                          )}
                        </td>

                        {/* SLA */}
                        <td className="py-2.5 px-3 whitespace-nowrap align-middle">
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 text-slate-900 dark:text-slate-400 shrink-0" />
                            {isBreached
                              ? "SLA Breached"
                              : isAtRisk
                                ? "SLA At Risk"
                                : "Within SLA"}
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="py-2.5 px-3 text-slate-900 dark:text-slate-300 whitespace-nowrap align-middle text-[13px]">
                          {item.assignedAt || item.submittedAt}
                        </td>

                        {/* Action */}
                        <td className="py-2.5 pr-6 pl-2 text-right whitespace-nowrap align-middle">
                          <div className="flex items-center justify-end">
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
                                ...(!isClosed &&
                                item.status !== "UNDER_REVIEW" &&
                                item.status !== "RESOLVED" &&
                                item.status !== "COMPLETED" &&
                                item.overallStatus !== "RESOLVED" &&
                                !item.isMyDepartmentCompleted &&
                                item.status !== "ASSIGNED"
                                  ? [
                                      {
                                        label: "Resolve",
                                        icon: (
                                          <FileCheck2 className="h-3.5 w-3.5 text-[#0F766E]" />
                                        ),
                                        variant: "primary" as const,
                                        onClick: () => onResolve(item),
                                      },
                                    ]
                                  : []),
                                ...(!item.hasProposedKb &&
                                !locallyProposedIds.has(item.id) &&
                                canStaffProposeKnowledge(item)
                                  ? [
                                      {
                                        label: "Propose KB Article",
                                        icon: (
                                          <BookOpen className="h-3.5 w-3.5 text-teal-600" />
                                        ),
                                        variant: "default" as const,
                                        onClick: () => setProposeKbItem(item),
                                      },
                                    ]
                                  : []),
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Sticky pagination footer */}
      <div className="border-t border-slate-200/80 bg-white dark:bg-slate-900 shrink-0 mt-auto sticky bottom-0 z-10">
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          pageSizeOptions={pagination.pageSizeOptions}
          itemLabel="grievances"
        />
      </div>

      {proposeKbItem && (
        <ProposeKnowledgeModal
          isOpen={Boolean(proposeKbItem)}
          onClose={() => setProposeKbItem(null)}
          onSuccess={() => {
            const proposedId = proposeKbItem.id;
            setLocallyProposedIds((prev) => {
              const next = new Set(prev);
              next.add(proposedId);
              return next;
            });
            proposeKbItem.hasProposedKb = true;
          }}
          grievance={proposeKbItem}
        />
      )}
    </div>
  );
}
