"use client";

import { AlertCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  PriorityBadge,
  SlaBadge,
  StatusBadge,
} from "@/components/dashboard/badges";
import {
  AdvancedTableSearch,
  type FilterMode,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  SortableTableHead,
  type SortDirection,
  type SortState,
} from "@/components/ui/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
import type { EscalationsReport, SlaMonitoringReport } from "@/types/reports";

export interface SlaMonitoringCardProps {
  slaMonitoring: SlaMonitoringReport;
  escalations: EscalationsReport;
  totalUniqueGrievances: number;
}

type SlaViewTab = "approaching" | "breached" | "escalations";

const deadlineSearchFields: SearchFieldDef[] = [
  { id: "ticketCode", label: "Grievance #", type: "text" },
  { id: "title", label: "Title", type: "text" },
  { id: "department_name", label: "Primary Dept", type: "text" },
  {
    id: "priority",
    label: "Priority",
    type: "select",
    options: [
      { value: "CRITICAL", label: "Critical" },
      { value: "HIGH", label: "High" },
      { value: "MEDIUM", label: "Medium" },
      { value: "LOW", label: "Low" },
    ],
  },
  { id: "status", label: "Status", type: "text" },
];

const escalationSearchFields: SearchFieldDef[] = [
  { id: "ticketCode", label: "Grievance #", type: "text" },
  { id: "title", label: "Grievance Title", type: "text" },
  { id: "name", label: "Escalated To", type: "text" },
  { id: "reason", label: "Reason", type: "text" },
  { id: "status", label: "Status", type: "text" },
];

export function SlaMonitoringCard({
  slaMonitoring,
  escalations,
  totalUniqueGrievances: _totalUniqueGrievances,
}: SlaMonitoringCardProps) {
  const [activeTab, setActiveTab] = useState<SlaViewTab>("approaching");
  const [conditions, setConditions] = useState<SearchCondition[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("AND");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });

  const {
    onTrackCount,
    approachingDeadlineCount,
    breachedDeadlineCount,
    approachingGrievances,
    breachedGrievances,
  } = slaMonitoring;

  const totalMonitored =
    onTrackCount + approachingDeadlineCount + breachedDeadlineCount;
  const complianceRate =
    totalMonitored > 0
      ? ((totalMonitored - breachedDeadlineCount) / totalMonitored) * 100
      : 100;

  // Handle column sort toggle
  const handleSort = (field: string, direction: SortDirection) => {
    setSort({ field, direction });
  };

  // Reset pagination & sort on tab change
  const handleTabChange = (tab: SlaViewTab) => {
    setActiveTab(tab);
    setConditions([]);
    setCurrentPage(1);
    setSort({ field: null, direction: null });
  };

  // Filter deadline grievances (approaching or breached)
  const currentDeadlineList =
    activeTab === "approaching" ? approachingGrievances : breachedGrievances;

  const filteredDeadlines = useMemo(() => {
    if (activeTab === "escalations") return [];
    if (!conditions || conditions.length === 0) return currentDeadlineList;
    return currentDeadlineList.filter((g) =>
      evaluateSearchConditions(
        {
          ...g,
          ticketCode: g.grievanceNumber,
          title: g.title,
          department_name: g.primaryDepartmentName,
          priority: g.priority,
          status: g.status,
          slaStatus: g.slaStatus,
        },
        conditions,
        filterMode,
      ),
    );
  }, [activeTab, currentDeadlineList, conditions, filterMode]);

  // Sort deadlines
  const sortedDeadlines = useMemo(() => {
    if (!sort.field || !sort.direction) return filteredDeadlines;
    return [...filteredDeadlines].sort((a, b) => {
      let valA: unknown;
      let valB: unknown;
      if (sort.field === "ticketCode") {
        valA = a.grievanceNumber;
        valB = b.grievanceNumber;
      } else if (sort.field === "title") {
        valA = a.title;
        valB = b.title;
      } else if (sort.field === "department") {
        valA = a.primaryDepartmentName;
        valB = b.primaryDepartmentName;
      } else if (sort.field === "priority") {
        valA = a.priority;
        valB = b.priority;
      } else if (sort.field === "status") {
        valA = a.status;
        valB = b.status;
      } else if (sort.field === "slaStatus") {
        valA = a.slaStatus;
        valB = b.slaStatus;
      } else if (sort.field === "dueAt") {
        valA = a.dueAt ? new Date(a.dueAt).getTime() : 0;
        valB = b.dueAt ? new Date(b.dueAt).getTime() : 0;
      }
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      let cmp = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB), undefined, {
          numeric: true,
        });
      }
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [filteredDeadlines, sort]);

  // Filter escalations
  const filteredEscalations = useMemo(() => {
    if (activeTab !== "escalations") return [];
    if (!conditions || conditions.length === 0) return escalations.events;
    return escalations.events.filter((e) =>
      evaluateSearchConditions(
        {
          ...e,
          ticketCode: e.grievanceNumber,
          title: e.grievanceTitle,
          name: e.escalatedToName,
          reason: e.reason,
          status: e.status,
        },
        conditions,
        filterMode,
      ),
    );
  }, [activeTab, escalations.events, conditions, filterMode]);

  // Sort escalations
  const sortedEscalations = useMemo(() => {
    if (!sort.field || !sort.direction) return filteredEscalations;
    return [...filteredEscalations].sort((a, b) => {
      let valA: unknown;
      let valB: unknown;
      if (sort.field === "ticketCode") {
        valA = a.grievanceNumber;
        valB = b.grievanceNumber;
      } else if (sort.field === "title") {
        valA = a.grievanceTitle;
        valB = b.grievanceTitle;
      } else if (sort.field === "level") {
        valA = a.escalationLevel;
        valB = b.escalationLevel;
      } else if (sort.field === "escalatedTo") {
        valA = a.escalatedToName;
        valB = b.escalatedToName;
      } else if (sort.field === "reason") {
        valA = a.reason;
        valB = b.reason;
      } else if (sort.field === "status") {
        valA = a.status;
        valB = b.status;
      } else if (sort.field === "createdAt") {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      let cmp = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB), undefined, {
          numeric: true,
        });
      }
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [filteredEscalations, sort]);

  const totalFilteredCount =
    activeTab === "escalations"
      ? filteredEscalations.length
      : filteredDeadlines.length;

  const totalPages = Math.ceil(totalFilteredCount / pageSize);

  const paginatedDeadlines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDeadlines.slice(start, start + pageSize);
  }, [sortedDeadlines, currentPage, pageSize]);

  const paginatedEscalations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEscalations.slice(start, start + pageSize);
  }, [sortedEscalations, currentPage, pageSize]);

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <CardHeader className="pb-2 pt-3.5 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                SLA Compliance &amp; Governance Escalations
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Authoritative deadline tracking and recorded governance
                escalation records
              </CardDescription>
            </div>
          </div>

          {/* Level Distribution Badges shown when Escalations view is active */}
          {activeTab === "escalations" && (
            <div className="flex flex-wrap items-center gap-1.5">
              {escalations.byLevel.map((lvl) => (
                <Badge
                  key={lvl.level}
                  variant="outline"
                  className="text-xs border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 font-semibold"
                >
                  Level {lvl.level}: {lvl.count}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {/* SLA Performance Strip (4 Metric Cards with Hairline Dividers) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 rounded-lg border border-slate-200 dark:border-slate-800 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="p-2.5 sm:p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              SLA Compliance Rate
            </span>
            <div className="mt-0.5 text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              {complianceRate.toFixed(1)}%
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              {totalMonitored - breachedDeadlineCount} of {totalMonitored}{" "}
              on-track
            </p>
          </div>

          <div className="p-2.5 sm:p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active On Track
            </span>
            <div className="mt-0.5 text-xl font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400">
              {onTrackCount.toLocaleString()}
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              Elapsed within safe threshold (&lt; 50%)
            </p>
          </div>

          <div className="p-2.5 sm:p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active At Risk (50-99%)
            </span>
            <div className="mt-0.5 text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
              {approachingDeadlineCount.toLocaleString()}
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              Approaching deadline / warning
            </p>
          </div>

          <div className="p-2.5 sm:p-3 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Breached (≥ 100%)
            </span>
            <div className="mt-0.5 text-xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400">
              {breachedDeadlineCount.toLocaleString()}
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              Exceeded target turnaround
            </p>
          </div>
        </div>

        {/* Unified Table Controls: 3 Tabs (Deadlines + Escalations) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <Button
            type="button"
            variant={activeTab === "approaching" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTabChange("approaching")}
            className="h-8 text-xs px-3 font-medium rounded-md gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Active Approaching Deadlines ({approachingGrievances.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === "breached" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTabChange("breached")}
            className="h-8 text-xs px-3 font-medium rounded-md gap-1.5 cursor-pointer"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Active Exceeded Deadlines ({breachedGrievances.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === "escalations" ? "default" : "outline"}
            size="sm"
            onClick={() => handleTabChange("escalations")}
            className="h-8 text-xs px-3 font-medium rounded-md gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Recorded Escalations ({escalations.events.length})
          </Button>
        </div>

        {/* Full-Width Search Bar */}
        <div className="w-full">
          <AdvancedTableSearch
            fields={
              activeTab === "escalations"
                ? escalationSearchFields
                : deadlineSearchFields
            }
            onSearch={(conds, mode) => {
              setConditions(conds);
              setFilterMode(mode);
              setCurrentPage(1);
            }}
            className="w-full"
          />
        </div>

        {/* Unified Table Display with Fixed Header, Internal Vertical Scroll, and Bottom-Fixed Pagination */}
        {totalFilteredCount === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            {activeTab === "approaching" &&
              "No grievances currently approaching their SLA deadline."}
            {activeTab === "breached" &&
              "No grievances currently exceeding their SLA deadline."}
            {activeTab === "escalations" &&
              "No escalation events recorded within the selected period."}
          </div>
        ) : activeTab === "escalations" ? (
          /* Escalations Table with Sticky Header & Scrollable Body */
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
            <div className="overflow-y-auto max-h-[220px] custom-scrollbar">
              <Table className="relative">
                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800/95 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-700">
                  <TableRow>
                    <SortableTableHead
                      field="ticketCode"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Grievance #
                    </SortableTableHead>
                    <SortableTableHead
                      field="title"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Grievance Title
                    </SortableTableHead>
                    <SortableTableHead
                      field="level"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-center font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Level
                    </SortableTableHead>
                    <SortableTableHead
                      field="escalatedTo"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Escalated To
                    </SortableTableHead>
                    <SortableTableHead
                      field="reason"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Reason
                    </SortableTableHead>
                    <SortableTableHead
                      field="status"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Status
                    </SortableTableHead>
                    <SortableTableHead
                      field="createdAt"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Escalation Date
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedEscalations.map((esc) => {
                    const dateFormatted = new Date(
                      esc.createdAt,
                    ).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <TableRow
                        key={esc.escalationId}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <TableCell className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                          {esc.grievanceNumber}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                          {esc.grievanceTitle}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-center">
                          <Badge
                            variant="secondary"
                            className="font-bold text-purple-700 bg-purple-50 dark:bg-purple-900/40 dark:text-purple-300 font-mono"
                          >
                            L{esc.escalationLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                          {esc.escalatedToName}
                        </TableCell>
                        <TableCell
                          className="py-2.5 px-3 max-w-sm truncate text-slate-600 dark:text-slate-400"
                          title={esc.reason}
                        >
                          {esc.reason}
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <StatusBadge status={esc.status} />
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px] tabular-nums">
                          {dateFormatted}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          /* Deadlines Table with Sticky Header & Scrollable Body */
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
            <div className="overflow-y-auto max-h-[220px] custom-scrollbar">
              <Table className="relative">
                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800/95 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-700">
                  <TableRow>
                    <SortableTableHead
                      field="ticketCode"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Grievance #
                    </SortableTableHead>
                    <SortableTableHead
                      field="title"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Title
                    </SortableTableHead>
                    <SortableTableHead
                      field="department"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Primary Dept
                    </SortableTableHead>
                    <SortableTableHead
                      field="priority"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Priority
                    </SortableTableHead>
                    <SortableTableHead
                      field="status"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Status
                    </SortableTableHead>
                    <SortableTableHead
                      field="slaStatus"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      SLA Status
                    </SortableTableHead>
                    <SortableTableHead
                      field="dueAt"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-right text-slate-600 dark:text-slate-300"
                    >
                      Target Due At
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedDeadlines.map((g) => {
                    const dueFormatted = g.dueAt
                      ? new Date(g.dueAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—";

                    return (
                      <TableRow
                        key={g.grievanceId}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <TableCell className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                          {g.grievanceNumber}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                          {g.title}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {g.primaryDepartmentName}
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <PriorityBadge priority={g.priority} />
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <StatusBadge status={g.status} />
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <SlaBadge status={g.slaStatus} />
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                          {dueFormatted}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Standard Pagination Controls Fixed Below the Table */}
        {totalFilteredCount > 0 && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalFilteredCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
              itemLabel={
                activeTab === "escalations" ? "escalations" : "grievances"
              }
              compact
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
