"use client";

import { Hourglass } from "lucide-react";
import { useMemo, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import {
  AdvancedTableSearch,
  type FilterMode,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
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
import type { PendingCasesSummary } from "@/types/reports";

export interface PendingCasesCardProps {
  pendingCases: PendingCasesSummary;
}

const searchFields: SearchFieldDef[] = [
  { id: "ticketCode", label: "Grievance #", type: "text" },
  { id: "title", label: "Title", type: "text" },
  { id: "department_name", label: "Department", type: "text" },
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

export function PendingCasesCard({ pendingCases }: PendingCasesCardProps) {
  const [conditions, setConditions] = useState<SearchCondition[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("AND");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });

  const handleSort = (field: string, direction: SortDirection) => {
    setSort({ field, direction });
  };

  const filteredCases = useMemo(() => {
    if (!conditions || conditions.length === 0)
      return pendingCases.recentPendingCases;
    return pendingCases.recentPendingCases.filter((item) =>
      evaluateSearchConditions(
        {
          ...item,
          ticketCode: item.grievanceNumber,
          title: item.title,
          department_name: item.departmentName,
          priority: item.priority,
          status: item.status,
          daysOpen: item.daysOpen,
        },
        conditions,
        filterMode,
      ),
    );
  }, [pendingCases.recentPendingCases, conditions, filterMode]);

  const sortedCases = useMemo(() => {
    if (!sort.field || !sort.direction) return filteredCases;
    return [...filteredCases].sort((a, b) => {
      let valA: unknown;
      let valB: unknown;

      if (sort.field === "ticketCode") {
        valA = a.grievanceNumber;
        valB = b.grievanceNumber;
      } else if (sort.field === "title") {
        valA = a.title;
        valB = b.title;
      } else if (sort.field === "department") {
        valA = a.departmentName;
        valB = b.departmentName;
      } else if (sort.field === "priority") {
        valA = a.priority;
        valB = b.priority;
      } else if (sort.field === "status") {
        valA = a.status;
        valB = b.status;
      } else if (sort.field === "daysOpen") {
        valA = a.daysOpen;
        valB = b.daysOpen;
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
  }, [filteredCases, sort]);

  const totalPages = Math.ceil(sortedCases.length / pageSize);

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCases.slice(start, start + pageSize);
  }, [sortedCases, currentPage, pageSize]);

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <CardHeader className="pb-2 pt-3.5 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Hourglass className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Unresolved Grievances (Pending Cases)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Excluded from completed-resolution time calculations and tracked
                separately by active age
              </CardDescription>
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
            Average Days Open:{" "}
            <strong className="text-amber-600 dark:text-amber-400">
              {pendingCases.avgDaysOpen} days
            </strong>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {/* Full-Width Search Input for Pending Cases */}
        {pendingCases.recentPendingCases.length > 0 && (
          <div className="w-full">
            <AdvancedTableSearch
              fields={searchFields}
              onSearch={(conds, mode) => {
                setConditions(conds);
                setFilterMode(mode);
                setCurrentPage(1);
              }}
              className="w-full"
            />
          </div>
        )}

        {pendingCases.recentPendingCases.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No pending cases awaiting completion.
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No pending cases matching search criteria.
          </div>
        ) : (
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
                      field="priority"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Priority
                    </SortableTableHead>
                    <SortableTableHead
                      field="department"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Department
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
                      field="daysOpen"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Age (Days)
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCases.map((item) => (
                    <TableRow
                      key={item.grievanceId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <TableCell className="py-2.5 px-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {item.grievanceNumber}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 max-w-[240px] truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                        {item.title}
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <PriorityBadge priority={item.priority} />
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-400">
                        {item.departmentName}
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-mono text-xs tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                        {item.daysOpen}d
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Bottom-Fixed Pagination Bar */}
            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing{" "}
                {filteredCases.length > 0
                  ? (currentPage - 1) * pageSize + 1
                  : 0}{" "}
                to {Math.min(currentPage * pageSize, filteredCases.length)} of{" "}
                {filteredCases.length} pending cases
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalCount={filteredCases.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[5, 10, 20]}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
