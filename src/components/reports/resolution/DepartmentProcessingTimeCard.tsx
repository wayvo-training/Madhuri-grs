"use client";

import { Building2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import type { DepartmentProcessingTimeItem } from "@/types/reports";

export interface DepartmentProcessingTimeCardProps {
  departments: DepartmentProcessingTimeItem[];
}

const searchFields: SearchFieldDef[] = [
  { id: "name", label: "Department Name", type: "text" },
];

export function DepartmentProcessingTimeCard({
  departments,
}: DepartmentProcessingTimeCardProps) {
  const [conditions, setConditions] = useState<SearchCondition[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("AND");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });

  const handleSort = (field: string, direction: SortDirection) => {
    setSort({ field, direction });
  };

  const filteredDepartments = useMemo(() => {
    if (!conditions || conditions.length === 0) return departments;
    return departments.filter((d) =>
      evaluateSearchConditions(
        {
          ...d,
          name: d.departmentName,
          title: d.departmentName,
        },
        conditions,
        filterMode,
      ),
    );
  }, [departments, conditions, filterMode]);

  const sortedDepartments = useMemo(() => {
    if (!sort.field || !sort.direction) return filteredDepartments;
    return [...filteredDepartments].sort((a, b) => {
      let valA: unknown;
      let valB: unknown;

      if (sort.field === "departmentName") {
        valA = a.departmentName;
        valB = b.departmentName;
      } else if (sort.field === "totalInvolved") {
        valA = a.totalInvolved;
        valB = b.totalInvolved;
      } else if (sort.field === "completedWithValidDurationCount") {
        valA = a.completedWithValidDurationCount;
        valB = b.completedWithValidDurationCount;
      } else if (sort.field === "blockedStagesCount") {
        valA = a.blockedStagesCount;
        valB = b.blockedStagesCount;
      } else if (sort.field === "pendingStagesCount") {
        valA = a.pendingStagesCount;
        valB = b.pendingStagesCount;
      } else if (sort.field === "avgProcessingTimeHours") {
        valA = a.avgProcessingTimeHours;
        valB = b.avgProcessingTimeHours;
      } else if (sort.field === "medianProcessingTimeHours") {
        valA = a.medianProcessingTimeHours;
        valB = b.medianProcessingTimeHours;
      } else if (sort.field === "primaryAvgProcessingHours") {
        valA = a.avgPrimaryProcessingHours;
        valB = b.avgPrimaryProcessingHours;
      } else if (sort.field === "supportingAvgProcessingHours") {
        valA = a.avgSupportingProcessingHours;
        valB = b.avgSupportingProcessingHours;
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
  }, [filteredDepartments, sort]);

  const totalPages = Math.ceil(sortedDepartments.length / pageSize);

  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDepartments.slice(start, start + pageSize);
  }, [sortedDepartments, currentPage, pageSize]);

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <CardHeader className="pb-2 pt-3.5 px-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Departmental Processing Time &amp; Workload
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Department-level processing durations, distinguishing Primary lead
              processing from Supporting contributor processing
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {/* Full-Width Search Input */}
        {departments.length > 0 && (
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

        {departments.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            No departmental records found for selected period and filters.
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            No departments matching search criteria.
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
            <div className="overflow-y-auto max-h-[220px] custom-scrollbar">
              <Table className="relative">
                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800/95 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-700">
                  <TableRow>
                    <SortableTableHead
                      field="departmentName"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Department
                    </SortableTableHead>
                    <SortableTableHead
                      field="totalInvolved"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Involved Cases
                    </SortableTableHead>
                    <SortableTableHead
                      field="completedWithValidDurationCount"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Completed
                    </SortableTableHead>
                    <SortableTableHead
                      field="blockedStagesCount"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Blocked
                    </SortableTableHead>
                    <SortableTableHead
                      field="pendingStagesCount"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Pending
                    </SortableTableHead>
                    <SortableTableHead
                      field="avgProcessingTimeHours"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Avg Duration
                    </SortableTableHead>
                    <SortableTableHead
                      field="medianProcessingTimeHours"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Median Duration
                    </SortableTableHead>
                    <SortableTableHead
                      field="primaryAvgProcessingHours"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Primary Avg
                    </SortableTableHead>
                    <SortableTableHead
                      field="supportingAvgProcessingHours"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Supporting Avg
                    </SortableTableHead>
                    <SortableTableHead
                      field="slaComplianceRate"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      SLA Compliance
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDepartments.map((dept) => (
                    <TableRow
                      key={dept.departmentId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <TableCell className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                        {dept.departmentName}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {dept.totalInvolved.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                        {dept.completedWithValidDurationCount.toLocaleString()}
                        {dept.missingActivationCount > 0 && (
                          <span
                            className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal"
                            title={`${dept.missingActivationCount} completed stages excluded due to missing activation timestamp`}
                          >
                            (+{dept.missingActivationCount} excl)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-purple-600 dark:text-purple-400">
                        {dept.blockedStagesCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-amber-600 dark:text-amber-400">
                        {dept.pendingStagesCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-200">
                        {dept.completedWithValidDurationCount > 0 ? (
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                            {dept.avgProcessingTimeDays}d{" "}
                            <span className="text-[11px] font-normal text-slate-400">
                              ({dept.avgProcessingTimeHours}h)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-200">
                        {dept.completedWithValidDurationCount > 0 ? (
                          <span className="font-semibold text-purple-600 dark:text-purple-400 font-mono tabular-nums">
                            {dept.medianProcessingTimeDays}d{" "}
                            <span className="text-[11px] font-normal text-slate-400">
                              ({dept.medianProcessingTimeHours}h)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                        {dept.primaryCount > 0
                          ? `${(dept.avgPrimaryProcessingHours / 24).toFixed(1)}d`
                          : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                        {dept.supportingCount > 0
                          ? `${(dept.avgSupportingProcessingHours / 24).toFixed(1)}d`
                          : "—"}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            dept.slaComplianceRate >= 90
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : dept.slaComplianceRate >= 75
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}
                        >
                          {dept.completedWithValidDurationCount > 0
                            ? `${dept.slaComplianceRate}%`
                            : "N/A"}
                        </span>
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
                {filteredDepartments.length > 0
                  ? (currentPage - 1) * pageSize + 1
                  : 0}{" "}
                to{" "}
                {Math.min(currentPage * pageSize, filteredDepartments.length)}{" "}
                of {filteredDepartments.length} departments
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalCount={filteredDepartments.length}
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
