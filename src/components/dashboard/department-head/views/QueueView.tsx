"use client";

import {
  AlertCircle,
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
import { useEffect, useMemo, useRef, useState } from "react";
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
  // View DropdownMenu state
  const [isViewOpen, setIsViewOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

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

  const sortedGrievances = useMemo(() => {
    if (!sortState.field || !sortState.direction) return filteredGrievances;

    return [...filteredGrievances].sort((a, b) => {
      let valA: any = a[sortState.field as keyof GrievanceItem] || "";
      let valB: any = b[sortState.field as keyof GrievanceItem] || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortState.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredGrievances, sortState]);

  const paginatedGrievances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedGrievances.slice(start, start + pageSize);
  }, [sortedGrievances, currentPage, pageSize]);

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

  const filterFields: SearchFieldDef[] = [
    {
      id: "department",
      label: "Department",
      type: "select",
      options: departmentOptions
        .filter((o) => o.value !== "ALL")
        .map((o) => ({ label: o.label, value: o.value as string })),
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
      id: "sla",
      label: "SLA Status",
      type: "select",
      options: [
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
    let dept = "ALL";
    let prio = "ALL";
    let status = "ALL";
    let staff = "ALL";
    let search = "";

    conditions.forEach((condition) => {
      const valArray = Array.isArray(condition.value) ? condition.value : [condition.value as string];
      if (valArray.length > 0) {
        if (condition.field === "department") dept = valArray[0];
        if (condition.field === "priority") prio = valArray[0];
        if (condition.field === "status") status = valArray[0];
        if (condition.field === "staff") staff = valArray[0];
        if (condition.field === "search") search = valArray[0];
      }
    });

    if (setDepartmentFilter) setDepartmentFilter(dept);
    if (onDepartmentChange && dept !== "ALL") {
      const matchDept = availableDepartments.find(
        (d) => d.name === dept || d.id === dept,
      );
      if (matchDept && matchDept.id !== selectedDeptId) {
        onDepartmentChange(matchDept.id);
      }
    }
    setPriorityFilter(prio);
    if (setStatusFilter) setStatusFilter(status);
    setStaffFilter(staff);
    setSearchQuery(search);
    setCurrentPage(1);
  };

  const handleClear = () => {
    if (setDepartmentFilter) setDepartmentFilter("ALL");
    setPriorityFilter("ALL");
    if (setStatusFilter) setStatusFilter("ALL");
    setStaffFilter("ALL");
    setSelectedTab("ALL");
    setSearchQuery("");
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
      <div className="p-3.5 sm:p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white border-b border-slate-200/80">
        {/* Title Header */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Live Grievance Oversight Queue
          </h2>

        </div>

        {/* Controls Bar: View & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end lg:w-3/5">
          {/* Advanced Filter Builder (Search & Filter Tags) */}
          <div className="flex-1 w-full">
            <AdvancedTableSearch
              fields={filterFields}
              onSearch={handleSearchChange}
              className="w-full"
            />
          </div>



            {/* [ View ▼ ] DropdownMenu */}
            <div className="relative inline-block" ref={viewMenuRef}>
              <button
                type="button"
                onClick={() => setIsViewOpen(!isViewOpen)}
                className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition cursor-pointer ${
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
                  <div className="px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-wider text-slate-400">
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
                      className={`flex w-full items-center justify-between px-3.5 py-2 text-sm transition cursor-pointer ${
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
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[13px] font-medium text-slate-600">
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
                      {item.assignedStaffName ? (
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
                        widthClass="w-40"
                        items={[
                          {
                            label: "Inspect",
                            icon: <Eye className="h-3.5 w-3.5" />,
                            onClick: () => onInspect(item, "progress"),
                          },
                          ...((item.reopenCount ?? 0) >= 3
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
