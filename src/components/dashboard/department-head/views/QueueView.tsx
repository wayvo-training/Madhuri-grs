"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Filter,
  GitBranch,
  RotateCcw,
  Search,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { ActionMenu } from "@/components/ui/action-menu";
import { CustomSelect } from "@/components/ui/custom-select";
import { Popover } from "@/components/ui/popover";
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
  availableDepartments?: { id: string; name: string }[];
  selectedDeptId?: string;
  onDepartmentChange?: (deptId: string) => void;
  resetFilters: () => void;
  metrics: DepartmentMetricsSummary;
  onInspect: (item: GrievanceItem, tab?: CaseDrawerTab) => void;
  onAssign: (item: GrievanceItem, currentStaffId?: string) => void;
  onIntervene: (item: GrievanceItem) => void;
  onReviewResolution: (item: GrievanceItem) => void;
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
  availableDepartments = [],
  selectedDeptId,
  onDepartmentChange,
  resetFilters,
  metrics,
  onInspect,
  onAssign,
  onIntervene,
  onReviewResolution,
}: QueueViewProps) {
  // Popover internal state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [pendingDept, setPendingDept] = useState<string>("ALL");
  const [pendingPriority, setPendingPriority] = useState<string>("ALL");
  const [pendingStatus, setPendingStatus] = useState<string>("ALL");
  const [pendingStaff, setPendingStaff] = useState<string>("ALL");

  // View DropdownMenu state
  const [isViewOpen, setIsViewOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        viewMenuRef.current &&
        !viewMenuRef.current.contains(event.target as Node)
      ) {
        setIsViewOpen(false);
      }
    }
    if (isViewOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isViewOpen]);

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

  useEffect(() => {
    if (isFiltersOpen) {
      setPendingDept(departmentFilter || "ALL");
      setPendingPriority(priorityFilter);
      setPendingStatus(statusFilter || "ALL");
      setPendingStaff(staffFilter);
    }
  }, [
    isFiltersOpen,
    departmentFilter,
    priorityFilter,
    statusFilter,
    staffFilter,
  ]);

  const activeFiltersCount =
    (departmentFilter && departmentFilter !== "ALL" ? 1 : 0) +
    (priorityFilter !== "ALL" ? 1 : 0) +
    (statusFilter && statusFilter !== "ALL" ? 1 : 0) +
    (staffFilter !== "ALL" ? 1 : 0);

  const handleApply = () => {
    if (setDepartmentFilter) setDepartmentFilter(pendingDept);
    if (onDepartmentChange && pendingDept !== "ALL") {
      const matchDept = availableDepartments.find(
        (d) => d.name === pendingDept || d.id === pendingDept,
      );
      if (matchDept && matchDept.id !== selectedDeptId) {
        onDepartmentChange(matchDept.id);
      }
    }
    setPriorityFilter(pendingPriority);
    if (setStatusFilter) setStatusFilter(pendingStatus);
    setStaffFilter(pendingStaff);
    setIsFiltersOpen(false);
  };

  const handleClear = () => {
    setPendingDept("ALL");
    setPendingPriority("ALL");
    setPendingStatus("ALL");
    setPendingStaff("ALL");
    if (setDepartmentFilter) setDepartmentFilter("ALL");
    setPriorityFilter("ALL");
    if (setStatusFilter) setStatusFilter("ALL");
    setStaffFilter("ALL");
    setSelectedTab("ALL");
    setSearchQuery("");
    resetFilters();
    setIsFiltersOpen(false);
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

  // Exact 8 views requested by the user:
  // All, Exceptions, In Progress, SLA Risk, SLA Critical, Reopened, Escalated, Closed
  const dropdownViews: {
    key: DepartmentHeadTab;
    label: string;
    count: number;
    dotColor?: string;
  }[] = [
    { key: "ALL", label: "All", count: counts.all },
    {
      key: "EXCEPTIONS",
      label: "Exceptions",
      count: counts.exceptions,
      dotColor: "bg-amber-400",
    },
    {
      key: "IN_PROGRESS",
      label: "In Progress",
      count: counts.inProgress,
      dotColor: "bg-emerald-500",
    },
    {
      key: "SLA_RISK",
      label: "SLA Risk",
      count: counts.slaRisk,
      dotColor: "bg-amber-500",
    },
    {
      key: "SLA_CRITICAL",
      label: "SLA Critical",
      count: counts.slaCritical,
      dotColor: "bg-rose-500",
    },
    {
      key: "REOPENED",
      label: "Reopened",
      count: counts.reopened,
      dotColor: "bg-purple-500",
    },
    {
      key: "ESCALATED",
      label: "Escalated",
      count: counts.escalated,
      dotColor: "bg-red-600",
    },
    { key: "CLOSED", label: "Closed", count: counts.closed },
  ];

  const activeDropdownItem = dropdownViews.find((v) => v.key === selectedTab);
  const activeViewLabel =
    selectedTab !== "ALL" && activeDropdownItem
      ? `View: ${activeDropdownItem.label}`
      : "View";

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
      {/* Queue Filter Controls Bar */}
      <div className="p-3.5 sm:p-5 space-y-4 bg-white border-b border-slate-200/80">
        {/* Title Header */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Live Grievance Oversight Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing page 1 of 1 ({filteredGrievances.length} total records
            across department queue).
          </p>
        </div>

        {/* Single Line Controls Bar: Search on Left, View & Filter on Right */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search by ID, keyword, or submitter... */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, keyword, or submitter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Controls: Reset + [ View ▼ ] DropdownMenu + [ Filter View ] Popover */}
          <div className="flex items-center gap-2">
            {(activeFiltersCount > 0 ||
              selectedTab !== "ALL" ||
              searchQuery) && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}

            {/* [ View ▼ ] DropdownMenu */}
            <div className="relative inline-block" ref={viewMenuRef}>
              <button
                type="button"
                onClick={() => setIsViewOpen(!isViewOpen)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                  selectedTab !== "ALL"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{activeViewLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {isViewOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    View ▾
                  </div>
                  <div className="border-t border-slate-100 my-1" />
                  {dropdownViews.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setSelectedTab(item.key);
                        setIsViewOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3.5 py-2 text-xs transition cursor-pointer ${
                        selectedTab === item.key
                          ? "bg-emerald-50 font-semibold text-emerald-900"
                          : "font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.dotColor && (
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${item.dotColor}`}
                          />
                        )}
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {item.count}
                        </span>
                        {selectedTab === item.key && (
                          <Check className="h-3.5 w-3.5 text-emerald-700" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* [ Filter View ] Popover */}
            <Popover
              isOpen={isFiltersOpen}
              onOpenChange={setIsFiltersOpen}
              widthClass="w-80"
              trigger={
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                    activeFiltersCount > 0
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <span>Filter View</span>
                  {activeFiltersCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              }
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Filter Grievances
                  </span>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-xs font-medium text-emerald-800 hover:underline"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                {/* 1. Department */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Department
                  </span>
                  <CustomSelect
                    value={pendingDept}
                    onChange={setPendingDept}
                    options={departmentOptions}
                  />
                </div>

                {/* 2. Priority */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Priority
                  </span>
                  <CustomSelect
                    value={pendingPriority}
                    onChange={setPendingPriority}
                    options={[
                      { value: "ALL", label: "All Priorities" },
                      { value: "CRITICAL", label: "Critical" },
                      { value: "HIGH", label: "High" },
                      { value: "MEDIUM", label: "Medium" },
                      { value: "LOW", label: "Low" },
                    ]}
                  />
                </div>

                {/* 3. Status */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Status
                  </span>
                  <CustomSelect
                    value={pendingStatus}
                    onChange={setPendingStatus}
                    options={[
                      { value: "ALL", label: "All Statuses" },
                      { value: "SUBMITTED", label: "Submitted" },
                      { value: "ROUTED", label: "Routed" },
                      { value: "ASSIGNED", label: "Assigned" },
                      { value: "IN_PROGRESS", label: "In Progress" },
                      { value: "UNDER_REVIEW", label: "Under Review" },
                      { value: "RESOLVED", label: "Resolved" },
                      { value: "CLOSED", label: "Closed" },
                      { value: "REOPENED", label: "Reopened" },
                      { value: "ESCALATED", label: "Escalated" },
                    ]}
                  />
                </div>

                {/* 4. Assigned Staff */}
                {staffList.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-700">
                      Assigned Staff
                    </span>
                    <CustomSelect
                      value={pendingStaff}
                      onChange={setPendingStaff}
                      options={[
                        { value: "ALL", label: "All Assigned Staff" },
                        { value: "UNASSIGNED", label: "Unassigned Only" },
                        ...staffList.map((s) => ({
                          value: s.id,
                          label: `${s.name} (${s.activeTickets} active)`,
                        })),
                      ]}
                    />
                  </div>
                )}

                {/* Actions: [Clear] [Apply] */}
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="rounded-lg bg-[#064E3B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </Popover>
          </div>
        </div>
      </div>

      {/* Grievances Data Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
            <tr>
              <th className="py-3 pl-4 pr-3 whitespace-nowrap">Grievance ID</th>
              <th className="py-3 px-3 min-w-64">Grievance & Category</th>
              <th className="py-3 px-3 whitespace-nowrap">Priority</th>
              <th className="py-3 px-3 whitespace-nowrap">Status</th>
              <th className="py-3 px-3 whitespace-nowrap">SLA Status</th>
              <th className="py-3 px-3 whitespace-nowrap">Assigned Staff</th>
              <th className="py-3 px-3 whitespace-nowrap">Submitted</th>
              <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
            {filteredGrievances.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-slate-400 font-normal"
                >
                  <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700 text-xs">
                    No grievances match this filter
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try changing your search keywords or filter criteria.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-3 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
                  >
                    Reset filters
                  </button>
                </td>
              </tr>
            ) : (
              filteredGrievances.map((item) => {
                const isEscalated = item.status === "ESCALATED";
                const isBreached = item.slaStatus === "BREACHED";
                const highlightSla = !isEscalated && isBreached;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition group"
                  >
                    {/* 1. Ticket Code */}
                    <td className="py-3 pl-4 pr-3 whitespace-nowrap align-top">
                      <span className="font-mono text-xs font-semibold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 inline-block">
                        {item.ticketCode}
                      </span>
                    </td>

                    {/* 2. Title & Category & Badges */}
                    <td className="py-3 px-3 align-top">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => onInspect(item, "statement")}
                          className="font-semibold text-xs text-slate-900 hover:text-emerald-900 transition text-left group-hover:text-emerald-950 block cursor-pointer"
                        >
                          {item.title}
                        </button>
                        <p className="text-xs text-slate-500 font-normal">
                          {item.category}{" "}
                          <span className="text-slate-300">&rsaquo;</span>{" "}
                          {item.subcategory}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {item.isReopened && (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                              <RotateCcw className="h-2.5 w-2.5 text-slate-500" />
                              Reopened ({item.reopenCount}x)
                            </span>
                          )}
                          {item.isCrossDepartment && (
                            <span
                              className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-700"
                              title={item.collaboratingDepartments?.join(", ")}
                            >
                              <GitBranch className="h-2.5 w-2.5 text-slate-500" />
                              Cross-Dept
                            </span>
                          )}
                          {item.hodIntervention && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-xs font-medium text-emerald-900">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                              Directive: {item.hodIntervention.actionLabel}
                            </span>
                          )}
                          {item.submittedResolution &&
                            item.status === "UNDER_REVIEW" && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-900">
                                <Clock className="h-2.5 w-2.5 text-amber-600" />
                                Resolution Submitted
                              </span>
                            )}
                        </div>
                      </div>
                    </td>

                    {/* 3. Priority */}
                    <td className="py-3 px-3 whitespace-nowrap align-top">
                      <PriorityBadge priority={item.priority} />
                    </td>

                    {/* 4. Status */}
                    <td className="py-3 px-3 whitespace-nowrap align-top">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* 5. SLA Status */}
                    <td className="py-3 px-3 whitespace-nowrap align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded font-medium whitespace-nowrap ${
                            highlightSla
                              ? "text-amber-900 bg-amber-50 border border-amber-200 font-semibold"
                              : item.slaStatus === "AT_RISK"
                                ? "text-amber-800 bg-amber-50/60 border border-amber-200 font-medium"
                                : "text-slate-600 bg-slate-100/80 border border-slate-200/80"
                          }`}
                        >
                          {item.slaTimeLeft}
                        </span>
                        {item.slaStatus === "BREACHED" && (
                          <span className="text-xs font-semibold text-amber-800">
                            SLA Breached
                          </span>
                        )}
                        {item.slaStatus === "AT_RISK" && (
                          <span className="text-xs font-medium text-amber-700">
                            SLA At Risk
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 6. Assigned Officer */}
                    <td className="py-3 px-3 whitespace-nowrap align-top">
                      {item.assignedStaffName ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                          <User className="h-3 w-3 text-slate-400" />
                          <span>{item.assignedStaffName}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* 7. Submitter & Date */}
                    <td className="py-3 px-3 whitespace-nowrap align-top">
                      <div className="text-xs">
                        <p className="font-medium text-slate-800">
                          {item.submitterName}
                        </p>
                        <p className="text-xs text-slate-400 font-normal mt-0.5">
                          {item.createdAt}
                        </p>
                      </div>
                    </td>

                    {/* 8. Actions */}
                    <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap align-top">
                      <ActionMenu
                        widthClass="w-40"
                        items={[
                          {
                            label: "Inspect",
                            icon: <Eye className="h-3.5 w-3.5" />,
                            onClick: () => onInspect(item, "progress"),
                          },
                          ...(item.status === "UNDER_REVIEW"
                            ? [
                                {
                                  label: "Review",
                                  icon: (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  ),
                                  variant: "default" as const,
                                  onClick: () => onReviewResolution(item),
                                },
                              ]
                            : []),
                          ...(item.status === "ESCALATED"
                            ? [
                                {
                                  label: "Intervene",
                                  icon: <AlertCircle className="h-3.5 w-3.5" />,
                                  variant: "warning" as const,
                                  onClick: () => onIntervene(item),
                                },
                              ]
                            : []),
                          ...(item.status !== "CLOSED" &&
                          item.status !== "RESOLVED" &&
                          item.status !== "ESCALATED" &&
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
                          ...(item.status !== "CLOSED" &&
                          item.status !== "RESOLVED" &&
                          item.status !== "ESCALATED" &&
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
  );
}
