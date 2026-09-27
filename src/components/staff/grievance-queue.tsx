"use client";

import {
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
import { ActionMenu } from "@/components/ui/action-menu";
import {
  CustomSelect,
  type CustomSelectOption,
} from "@/components/ui/custom-select";
import { Pagination } from "@/components/ui/pagination";
import { Popover } from "@/components/ui/popover";
import { usePagination } from "@/hooks/usePagination";
import type {
  StaffGrievanceItem,
  StaffPriority,
  StaffQueueFilterState,
} from "@/types/staff";

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

  const [sortBy, setSortBy] = useState<"sla" | "newest" | "priority">("sla");
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
        (g) => g.status === "CLOSED" || g.status === "UNDER_REVIEW",
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

  const sortOptions: CustomSelectOption[] = useMemo(
    () => [
      { value: "sla", label: "SLA Urgency (Highest first)" },
      { value: "priority", label: "Priority (Critical first)" },
      { value: "newest", label: "Creation Date (Newest first)" },
    ],
    [],
  );

  // Filtered grievances
  const filteredGrievances = useMemo(() => {
    return grievances.filter((item) => {
      // 1. Tab-level filter
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
        if (item.status !== "CLOSED" && item.status !== "UNDER_REVIEW") {
          return false;
        }
      }

      // 2. Search query (id, title, category, submitter)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchNumber = item.grievanceNumber.toLowerCase().includes(query);
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchCategory = item.category.toLowerCase().includes(query);
        const matchSubmitter = item.submitterName.toLowerCase().includes(query);
        if (!matchNumber && !matchTitle && !matchCategory && !matchSubmitter) {
          return false;
        }
      }

      // 3. Status filter
      if (filters.status !== "ALL" && item.status !== filters.status) {
        return false;
      }

      // 4. Priority filter
      if (filters.priority !== "ALL" && item.priority !== filters.priority) {
        return false;
      }

      // 5. Category filter
      if (filters.category !== "ALL" && item.category !== filters.category) {
        return false;
      }

      // 6. SLA status filter
      if (filters.slaStatus !== "ALL" && item.slaStatus !== filters.slaStatus) {
        return false;
      }

      return true;
    });
  }, [grievances, activeTab, filters]);

  // Sorted list
  const sortedGrievances = useMemo(() => {
    return [...filteredGrievances].sort((a, b) => {
      if (sortBy === "sla") {
        // Breached first, then highest percentage used
        if (a.slaStatus === "BREACHED" && b.slaStatus !== "BREACHED") return -1;
        if (b.slaStatus === "BREACHED" && a.slaStatus !== "BREACHED") return 1;
        return b.slaConsumptionPercent - a.slaConsumptionPercent;
      }
      if (sortBy === "priority") {
        const score: Record<StaffPriority, number> = {
          CRITICAL: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };
        return (score[b.priority] || 0) - (score[a.priority] || 0);
      }
      // Newest
      return (
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    });
  }, [filteredGrievances, sortBy]);

  const pagination = usePagination(sortedGrievances, {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  });

  // Reset to page 1 whenever filters, tab, or sort order changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset to page 1 on filter/tab/sort changes
  useEffect(() => {
    pagination.resetPage();
  }, [filters, activeTab, sortBy, pagination.resetPage]);

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
  };

  return (
    <div className="space-y-4">
      {/* Filter and Search Controls Bar */}
      <div className="bg-slate-50/70 p-3 sm:p-4 rounded-xl border border-slate-200/80 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by grievance ID, title, complainant, or category..."
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, searchQuery: "" }))
                }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium hidden sm:block">
              Sort:
            </span>
            <CustomSelect
              value={sortBy}
              onChange={(val) =>
                setSortBy(val as "sla" | "newest" | "priority")
              }
              options={sortOptions}
              align="right"
              size="sm"
              className="w-56"
            />
          </div>
        </div>

        {/* Filter Dropdown Menus Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filter by:</span>
          </div>

          {/* Queue View Dropdown */}
          <CustomSelect
            value={activeTab}
            onChange={(val) =>
              setActiveTab(
                val as
                  | "all"
                  | "in_progress"
                  | "at_risk"
                  | "breached"
                  | "reopened"
                  | "completed",
              )
            }
            options={queueOptions}
            size="sm"
            aria-label="Filter by queue view"
            className="w-auto"
          />

          {/* Unified Filters Dropdown Menu (combines Priority, Status, Category into 1 dropdown) */}
          <Popover
            isOpen={isFilterMenuOpen}
            onOpenChange={setIsFilterMenuOpen}
            align="left"
            widthClass="w-80"
            trigger={
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 h-8 text-xs font-semibold transition cursor-pointer ${
                  appliedFiltersCount > 0
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Filters</span>
                {appliedFiltersCount > 0 && (
                  <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                    {appliedFiltersCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isFilterMenuOpen ? "rotate-180 text-emerald-700" : ""
                  }`}
                />
              </button>
            }
          >
            <div className="flex flex-col gap-3.5">
              {/* Popover Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Filter Grievances
                  </span>
                </div>
                {appliedFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        priority: "ALL",
                        status: "ALL",
                        category: "ALL",
                      }));
                    }}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* 1. Priority */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Priority
                </span>
                <CustomSelect
                  value={filters.priority}
                  onChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      priority: val as StaffPriority | "ALL",
                    }))
                  }
                  options={priorityOptions}
                  size="sm"
                  aria-label="Filter by priority"
                  className="w-full"
                />
              </div>

              {/* 2. Status */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Status
                </span>
                <CustomSelect
                  value={filters.status}
                  onChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: val as StaffQueueFilterState["status"],
                    }))
                  }
                  options={statusOptions}
                  size="sm"
                  aria-label="Filter by status"
                  className="w-full"
                />
              </div>

              {/* 3. Category */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Category
                </span>
                <CustomSelect
                  value={filters.category}
                  onChange={(val) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: val,
                    }))
                  }
                  options={categoryOptions}
                  size="sm"
                  aria-label="Filter by category"
                  className="w-full"
                />
              </div>

              {/* Close / Done footer */}
              <div className="flex items-center justify-end border-t border-slate-100 pt-2.5">
                <button
                  type="button"
                  onClick={() => setIsFilterMenuOpen(false)}
                  className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </Popover>

          {/* Active Filter Chips */}
          {filters.priority !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              Priority: {filters.priority}
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, priority: "ALL" }))
                }
                className="hover:text-emerald-950 cursor-pointer ml-0.5"
                title="Remove priority filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              Status:{" "}
              {statusOptions.find((s) => s.value === filters.status)?.label ||
                filters.status}
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, status: "ALL" }))
                }
                className="hover:text-emerald-950 cursor-pointer ml-0.5"
                title="Remove status filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.category !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs max-w-[220px]">
              <span className="truncate">Category: {filters.category}</span>
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, category: "ALL" }))
                }
                className="hover:text-emerald-950 cursor-pointer ml-0.5 shrink-0"
                title="Remove category filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Clear button if any filter is set */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 py-1 px-2 text-rose-600 hover:text-rose-700 font-medium ml-auto cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
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
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No grievances match your current search or filter criteria. Try clearing filters."
                : "You currently have no grievances assigned under this queue view."}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-3.5">Grievance</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">SLA</th>
                <th className="py-3 px-3">Last Updated</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {pagination.paginatedItems.map((item) => {
                const isBreached = item.slaStatus === "BREACHED";
                const isAtRisk = item.slaStatus === "AT_RISK";
                const isReopened =
                  item.reopenCount > 0 || item.status === "REOPENED";
                const isClosed = item.status === "CLOSED";

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Grievance Number + Subject */}
                    <td className="py-3 px-3.5 max-w-[240px]">
                      <span className="font-mono text-xs font-bold text-[#0F766E] block">
                        {item.grievanceNumber}
                      </span>
                      <span
                        className="font-medium text-slate-900 line-clamp-1 mt-0.5"
                        title={item.title}
                      >
                        {item.title}
                      </span>
                      {isReopened && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-purple-700 mt-0.5">
                          <RotateCcw className="w-2.5 h-2.5" /> Reopened (
                          {item.reopenCount})
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                      {item.category}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : item.priority === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      {item.status === "WAITING_ON_USER" ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Waiting on User
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
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
                          ...(!isClosed && item.status !== "UNDER_REVIEW"
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
    </div>
  );
}
