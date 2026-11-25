"use client";

import { CheckCircle2, GitBranch, UserCheck, Users, UserX } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  AdvancedTableSearch,
  type FilterMode,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Badge } from "@/components/ui/badge";
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
import type { StaffAssignmentReport } from "@/types/reports";

export interface StaffAssignmentReportCardProps {
  staffAssignments: StaffAssignmentReport;
  totalUniqueGrievances: number;
}

const searchFields: SearchFieldDef[] = [
  { id: "name", label: "Staff Name", type: "text" },
  { id: "department_name", label: "Department", type: "text" },
  { id: "email", label: "Email Address", type: "text" },
];

export function StaffAssignmentReportCard({
  staffAssignments,
  totalUniqueGrievances,
}: StaffAssignmentReportCardProps) {
  const [conditions, setConditions] = useState<SearchCondition[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("AND");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });

  const {
    currentStaffWorkload,
    assignedGrievancesCount,
    unassignedGrievancesCount,
    activities,
  } = staffAssignments;

  const handleSort = (field: string, direction: SortDirection) => {
    setSort({ field, direction });
  };

  const filteredStaff = useMemo(() => {
    if (!conditions || conditions.length === 0) return currentStaffWorkload;
    return currentStaffWorkload.filter((s) =>
      evaluateSearchConditions(
        {
          ...s,
          name: s.staffName,
          title: s.staffName,
          department_name: s.departmentName,
          email: s.email,
        },
        conditions,
        filterMode,
      ),
    );
  }, [currentStaffWorkload, conditions, filterMode]);

  const sortedStaff = useMemo(() => {
    if (!sort.field || !sort.direction) return filteredStaff;
    return [...filteredStaff].sort((a, b) => {
      let valA: unknown;
      let valB: unknown;
      if (sort.field === "staffName") {
        valA = a.staffName;
        valB = b.staffName;
      } else if (sort.field === "departmentName") {
        valA = a.departmentName;
        valB = b.departmentName;
      } else if (sort.field === "email") {
        valA = a.email;
        valB = b.email;
      } else if (sort.field === "activeAssignmentsCount") {
        valA = a.activeAssignmentsCount;
        valB = b.activeAssignmentsCount;
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
  }, [filteredStaff, sort]);

  const totalPages = Math.ceil(sortedStaff.length / pageSize);

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStaff.slice(start, start + pageSize);
  }, [sortedStaff, currentPage, pageSize]);

  return (
    <div className="flex flex-col gap-2">
      {/* Top Caseload Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
            <span>Currently Assigned</span>
            <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-3 w-3" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {assignedGrievancesCount.toLocaleString()}
          </div>
          <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            {totalUniqueGrievances > 0
              ? `${((assignedGrievancesCount / totalUniqueGrievances) * 100).toFixed(1)}% of total received`
              : "0% assigned"}
          </p>
        </div>

        <div className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
            <span>Unassigned Cases</span>
            <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <UserX className="h-3 w-3" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-400">
            {unassignedGrievancesCount.toLocaleString()}
          </div>
          <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Awaiting staff assignment
          </p>
        </div>

        <div className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
            <span>Period Assignments</span>
            <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <GitBranch className="h-3 w-3" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400">
            {activities.totalAssignmentsInPeriod.toLocaleString()}
          </div>
          <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Routing handovers performed
          </p>
        </div>

        <div className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
            <span>Reassignments</span>
            <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="h-3 w-3" />
            </div>
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
            {activities.reassignmentsCount.toLocaleString()}
          </div>
          <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Caseload balancing transfers
          </p>
        </div>
      </div>

      {/* Staff Caseload Table Card with Sticky Header, Scrollable Body & Bottom Pagination */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="pb-1.5 pt-2 px-3 sm:px-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Staff Caseload &amp; Handover Governance
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Active grievance allocation per staff investigator
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-3 sm:px-3.5 pb-2 pt-0 space-y-2">
          {/* Full-Width Search Input */}
          {currentStaffWorkload.length > 0 && (
            <div className="w-full -mt-0.5 sm:-mt-1">
              <AdvancedTableSearch
                fields={searchFields}
                onSearch={(conds, mode) => {
                  setConditions(conds);
                  setFilterMode(mode);
                  setCurrentPage(1);
                }}
                className="w-full"
                side="bottom"
              />
            </div>
          )}

          {currentStaffWorkload.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
              No staff members currently hold active assignments in this scope.
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
              No staff members matching search criteria.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
              <div className="overflow-y-auto min-h-[140px] max-h-[175px] custom-scrollbar">
                <Table className="relative">
                  <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800/95 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-700">
                    <TableRow>
                      <SortableTableHead
                        field="staffName"
                        currentSort={sort}
                        onSort={handleSort}
                        className="py-1.5 px-2.5 sm:px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                      >
                        Staff Member
                      </SortableTableHead>
                      <SortableTableHead
                        field="departmentName"
                        currentSort={sort}
                        onSort={handleSort}
                        className="py-1.5 px-2.5 sm:px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                      >
                        Department
                      </SortableTableHead>
                      <SortableTableHead
                        field="email"
                        currentSort={sort}
                        onSort={handleSort}
                        className="py-1.5 px-2.5 sm:px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                      >
                        Email Address
                      </SortableTableHead>
                      <SortableTableHead
                        field="activeAssignmentsCount"
                        currentSort={sort}
                        onSort={handleSort}
                        className="py-1.5 px-2.5 sm:px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                      >
                        Active Caseload
                      </SortableTableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedStaff.map((staff) => (
                      <TableRow
                        key={staff.staffId}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <TableCell className="py-1.5 px-2.5 sm:px-3 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                          {staff.staffName}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 sm:px-3 text-slate-600 dark:text-slate-400 text-xs">
                          {staff.departmentName}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 sm:px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {staff.email}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 sm:px-3 text-right">
                          <Badge
                            variant="secondary"
                            className="font-mono font-bold text-slate-800 dark:text-slate-200"
                          >
                            {staff.activeAssignmentsCount} cases
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Standard Pagination Controls Fixed Below the Table */}
          {sortedStaff.length > 0 && (
            <div className="pt-1.5">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={sortedStaff.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[5, 10, 20]}
                itemLabel="staff members"
                compact
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
