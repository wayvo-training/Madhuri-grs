"use client";

import { Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { PriorityBadge } from "@/components/dashboard/badges";
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
import type { PriorityTatItem } from "@/types/reports";

export interface ResolutionTatByPriorityCardProps {
  tatByPriority: PriorityTatItem[];
}

export function ResolutionTatByPriorityCard({
  tatByPriority,
}: ResolutionTatByPriorityCardProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });

  const handleSort = (field: string, direction: SortDirection) => {
    setSort({ field, direction });
  };

  const sortedRows = useMemo(() => {
    if (!sort.field || !sort.direction) return tatByPriority;
    return [...tatByPriority].sort((a, b) => {
      let valA: unknown;
      let valB: unknown;

      if (sort.field === "priority") {
        valA = a.priority;
        valB = b.priority;
      } else if (sort.field === "totalGrievances") {
        valA = a.totalGrievances;
        valB = b.totalGrievances;
      } else if (sort.field === "closedCount") {
        valA = a.closedCount;
        valB = b.closedCount;
      } else if (sort.field === "avgResolutionTimeHours") {
        valA = a.avgResolutionTimeHours;
        valB = b.avgResolutionTimeHours;
      } else if (sort.field === "medianResolutionTimeHours") {
        valA = a.medianResolutionTimeHours;
        valB = b.medianResolutionTimeHours;
      } else if (sort.field === "slaCompliantCount") {
        valA = a.slaCompliantCount;
        valB = b.slaCompliantCount;
      } else if (sort.field === "slaBreachedCount") {
        valA = a.slaBreachedCount;
        valB = b.slaBreachedCount;
      } else if (sort.field === "slaComplianceRate") {
        valA = a.slaComplianceRate;
        valB = b.slaComplianceRate;
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
  }, [tatByPriority, sort]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  return (
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col h-full min-h-0 justify-between overflow-hidden">
      <CardHeader className="pb-1.5 pt-2.5 px-3.5 sm:px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
            <Timer className="h-3.5 w-3.5" />
          </div>
          <div>
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
              Turnaround Time (TAT) by Priority
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 dark:text-slate-400">
              End-to-end resolution duration and SLA outcomes for completed
              cases across priority tiers
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3.5 sm:px-4 pb-3 sm:pb-3.5 pt-0 flex-1 min-h-0 flex flex-col justify-between">
        {tatByPriority.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            No priority turnaround data available for this selection.
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col justify-between">
            <div className="overflow-y-auto flex-1 min-h-0 custom-scrollbar">
              <Table className="relative">
                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800/95 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-700">
                  <TableRow>
                    <SortableTableHead
                      field="priority"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Priority
                    </SortableTableHead>
                    <SortableTableHead
                      field="totalGrievances"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Total Cases
                    </SortableTableHead>
                    <SortableTableHead
                      field="closedCount"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Closed Cases
                    </SortableTableHead>
                    <SortableTableHead
                      field="avgResolutionTimeHours"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Average TAT
                    </SortableTableHead>
                    <SortableTableHead
                      field="medianResolutionTimeHours"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Median TAT
                    </SortableTableHead>
                    <SortableTableHead
                      field="slaCompliantCount"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      SLA Compliant
                    </SortableTableHead>
                    <SortableTableHead
                      field="slaBreachedCount"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      SLA Breached
                    </SortableTableHead>
                    <SortableTableHead
                      field="slaComplianceRate"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Compliance Rate
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((row) => (
                    <TableRow
                      key={row.priority}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <TableCell className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                        <PriorityBadge priority={row.priority} />
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {row.totalGrievances.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                        {row.closedCount.toLocaleString()}
                        {row.missingClosedAtCount > 0 && (
                          <span
                            className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal"
                            title={`${row.missingClosedAtCount} closed record(s) excluded due to missing closure timestamp`}
                          >
                            ({row.closedWithValidTat} eval)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right text-slate-700 dark:text-slate-200">
                        {row.closedWithValidTat > 0 ? (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                            {row.avgResolutionTimeDays}d{" "}
                            <span className="text-[11px] font-normal text-slate-400">
                              ({row.avgResolutionTimeHours}h)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            No closures
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right text-slate-700 dark:text-slate-200">
                        {row.closedWithValidTat > 0 ? (
                          <span className="font-semibold text-purple-600 dark:text-purple-400 font-mono tabular-nums">
                            {row.medianResolutionTimeDays}d{" "}
                            <span className="text-[11px] font-normal text-slate-400">
                              ({row.medianResolutionTimeHours}h)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            No closures
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                        {row.slaCompliantCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right font-mono tabular-nums font-medium text-rose-600 dark:text-rose-400">
                        {row.slaBreachedCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right font-mono tabular-nums">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            row.slaComplianceRate >= 90
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : row.slaComplianceRate >= 75
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}
                        >
                          {row.closedWithValidTat > 0
                            ? `${row.slaComplianceRate}%`
                            : "N/A"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Bottom-Fixed Pagination Bar */}
            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 px-3 py-2 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Showing{" "}
                {tatByPriority.length > 0
                  ? (currentPage - 1) * pageSize + 1
                  : 0}{" "}
                to {Math.min(currentPage * pageSize, tatByPriority.length)} of{" "}
                {tatByPriority.length} priorities
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalCount={tatByPriority.length}
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
