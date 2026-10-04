"use client";

import {
  BookOpen,
  ChevronDown,
  Clock,
  Eye,
  FileCheck2,
  Filter,
  Inbox,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProposeKnowledgeModal } from "@/components/knowledge/ProposeKnowledgeModal";
import { canStaffProposeKnowledge } from "@/lib/staff/utils";
import { ActionMenu } from "@/components/ui/action-menu";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import {
  CustomSelect,
  type CustomSelectOption,
} from "@/components/ui/custom-select";
import { Pagination } from "@/components/ui/pagination";
import { Popover } from "@/components/ui/popover";
import {
  SortableTh,
  type SortState,
} from "@/components/ui/sortable-table-head";
import { usePagination } from "@/hooks/usePagination";
import type {
  StaffGrievanceItem,
  StaffPriority,
  StaffQueueFilterState,
} from "@/types/staff";
import { evaluateSearchConditions } from "@/lib/search-evaluator";

interface GrievanceQueueProps {
  grievances: StaffGrievanceItem[];
  categories?: string[];
  staffName?: string;
  staffEmail?: string;
  onExamine: (grievance: StaffGrievanceItem) => void;
  onResolve: (grievance: StaffGrievanceItem) => void;
  initialTab?:
    | "all"
    | "in_progress"
    | "at_risk"
    | "breached"
    | "reopened"
    | "completed";
}

export function GrievanceQueue({
  grievances,
  categories: categoriesProp,
  onExamine,
  onResolve,
  initialTab = "all",
}: GrievanceQueueProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "in_progress" | "at_risk" | "breached" | "reopened" | "completed"
  >(initialTab);

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
  const [proposeKbItem, setProposeKbItem] = useState<StaffGrievanceItem | null>(null);
  const [locallyProposedIds, setLocallyProposedIds] = useState<Set<string>>(new Set());

  const handleSort = (field: string, direction: SortState["direction"]) => {
    setSortState({ field, direction });
  };

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Comprehensive master categories: combines system taxonomy + assigned grievances
  const categories = useMemo(() => {
    const set = new Set<string>(categoriesProp || []);
    for (const g of grievances) {
      if (g.category) set.add(g.category);
    }
    return Array.from(set).sort();
  }, [categoriesProp, grievances]);

  // Tab counts for quick stats
  const tabCounts = useMemo(() => {
    return {
      all: grievances.length,
      in_progress: grievances.filter(
        (g) =>
          g.status === "IN_PROGRESS" ||
          g.status === "ASSIGNED" ||
          g.status === "WAITING_ON_USER",
      ).length,
      at_risk: grievances.filter(
        (g) => g.slaStatus === "AT_RISK" && g.status !== "CLOSED",
      ).length,
      breached: grievances.filter(
        (g) => g.slaStatus === "BREACHED" && g.status !== "CLOSED",
      ).length,
      reopened: grievances.filter(
        (g) =>
          (g.reopenCount > 0 || g.status === "REOPENED") &&
          g.status !== "CLOSED",
      ).length,
      completed: grievances.filter(
        (g) =>
          g.status === "CLOSED" ||
          g.status === "RESOLVED" ||
          g.status === "UNDER_REVIEW",
      ).length,
    };
  }, [grievances]);

  // Options for custom dropdown menus
  const queueOptions: CustomSelectOption[] = useMemo(
    () => [
      { value: "all", label: `All Assigned (${tabCounts.all})` },
      { value: "in_progress", label: `In Progress (${tabCounts.in_progress})` },
      { value: "at_risk", label: `SLA At Risk (${tabCounts.at_risk})` },
      { value: "breached", label: `SLA Breached (${tabCounts.breached})` },
      {
        value: "reopened",
        label: `Reopened Grievance (${tabCounts.reopened})`,
      },
      { value: "completed", label: `Completed (${tabCounts.completed})` },
    ],
    [tabCounts],
  );

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
      { value: "WAITING_ON_USER", label: "Waiting on User" },
      { value: "REOPENED", label: "Reopened" },
      { value: "UNDER_REVIEW", label: "Resolution Pending Review" },
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
      // 1. Tab-level filter (preserves initialTab functionality from dashboard)
      if (activeTab === "in_progress") {
        if (
          item.status !== "IN_PROGRESS" &&
          item.status !== "ASSIGNED" &&
          item.status !== "WAITING_ON_USER"
        ) {
          return false;
        }
      } else if (activeTab === "at_risk") {
        if (item.slaStatus !== "AT_RISK" || item.status === "CLOSED") {
          return false;
        }
      } else if (activeTab === "breached") {
        if (item.slaStatus !== "BREACHED" || item.status === "CLOSED") {
          return false;
        }
      } else if (activeTab === "reopened") {
        if (item.reopenCount === 0 && item.status !== "REOPENED") {
          return false;
        }
      } else if (activeTab === "completed") {
        if (
          item.status !== "CLOSED" &&
          item.status !== "RESOLVED" &&
          item.status !== "UNDER_REVIEW"
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
      return list.sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      );
    }

    return list.sort((a, b) => {
      let aVal: any = a[sortState.field as keyof typeof a];
      let bVal: any = b[sortState.field as keyof typeof b];

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

  const appliedFiltersCount =
    (filters.priority !== "ALL" ? 1 : 0) +
    (filters.status !== "ALL" ? 1 : 0) +
    (filters.category !== "ALL" ? 1 : 0);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {activeTab !== "all" && (
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition"
          >
            ← Back to All Cases
          </button>
        )}
        <div className="flex-1 min-w-0 w-full">
          <AdvancedTableSearch
            fields={searchFields}
            onSearch={(conds, mode) => { setAdvancedSearch(conds); setFilterMode(mode); }}
            className="w-full"
          />
        </div>
      </div>

      {/* Grievances List - Table Format */}
      {sortedGrievances.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              No assigned grievances found
            </h4>
            <p className="text-sm text-slate-500 mt-0.5 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No grievances match your current search or filter criteria. Try clearing filters."
                : "You currently have no grievances assigned under this queue view."}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/60 bg-slate-50/80 text-[13px] font-bold uppercase tracking-wider text-slate-900">
                <SortableTh
                  field="grievanceNumber"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3.5"
                >
                  Grievance ID
                </SortableTh>
                <SortableTh
                  field="title"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3.5"
                >
                  Summary
                </SortableTh>
                <th className="py-3 px-3 text-slate-900 font-bold uppercase tracking-wider text-[13px] text-left">
                  Reopened Status
                </th>
                <SortableTh
                  field="category"
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
                  field="slaConsumptionPercent"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3"
                >
                  SLA
                </SortableTh>
                <SortableTh
                  field="submittedAt"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3"
                >
                  Last Updated
                </SortableTh>
                <th className="py-3 px-3.5 text-right text-slate-900 font-bold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
              {pagination.paginatedItems.map((item) => {
                const isBreached = item.slaStatus === "BREACHED";
                const isAtRisk = item.slaStatus === "AT_RISK";
                const isReopened =
                  item.reopenCount > 0 || item.status === "REOPENED";
                const isClosed = item.status === "CLOSED";

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Grievance Number */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {item.grievanceNumber}
                      </span>
                    </td>

                    {/* Summary */}
                    <td className="py-3 px-3.5 max-w-[200px]">
                      <span
                        className="font-medium text-slate-900 line-clamp-2"
                        title={item.title}
                      >
                        {item.title}
                      </span>
                    </td>

                    {/* Reopened Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isReopened ? (
                        <span className="inline-flex items-center gap-0.5 text-[13px] font-bold text-slate-900">
                          Reopened ({item.reopenCount})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-slate-900 truncate max-w-[140px]">
                      {item.category}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3">
                      <span className="text-[13px] font-medium text-slate-900">
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
                    <td className="py-3 px-3">
                      {item.status === "WAITING_ON_USER" ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Waiting on User
                        </span>
                      ) : item.status === "CLOSED" ? (
                        <span className="inline-block text-[13px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Closed
                        </span>
                      ) : item.status === "RESOLVED" ? (
                        <span className="inline-block text-[13px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                          Resolved
                        </span>
                      ) : (
                        <span className="inline-block text-[13px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
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
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-900">
                        <Clock className="w-3.5 h-3.5 text-slate-900" />
                        {isBreached
                          ? "SLA Breached"
                          : isAtRisk
                            ? "SLA At Risk"
                            : "Within SLA"}
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="py-3 px-3 text-slate-900 whitespace-nowrap text-[13px]">
                      {item.assignedAt || item.submittedAt}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
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
                          ...(!isClosed && item.status !== "UNDER_REVIEW" && item.status !== "RESOLVED"
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
                          ...(!item.hasProposedKb && !locallyProposedIds.has(item.id) && canStaffProposeKnowledge(item)
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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
      )}

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
