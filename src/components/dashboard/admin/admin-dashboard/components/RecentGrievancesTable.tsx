"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useTableSort } from "@/hooks/useTableSort";
import type { DashboardRecentGrievance } from "@/types/admin/dashboard";

export interface RecentGrievancesTableProps {
  recentGrievances: DashboardRecentGrievance[];
}

export function RecentGrievancesTable({
  recentGrievances,
}: RecentGrievancesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { sortState, handleSort, sortedItems } = useTableSort(
    recentGrievances,
    { field: "grievance_number", direction: "desc" },
  );

  const paginatedGrievances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  return (
    <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-3.5 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Recent Grievances
          </h3>
          <p className="mt-0.5 text-xs font-normal text-slate-500 dark:text-slate-400">
            Latest filings across the organization
          </p>
        </div>
        <Link
          href="/admin/grievances"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition"
        >
          <span>View Full Table</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-2 flex-1 min-h-0 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs flex flex-col">
        {/* Header Table */}
        <table className="w-full text-left text-sm table-fixed border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[36%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
          </colgroup>
          <TableHeader className="bg-transparent shadow-none">
            <TableRow className="border-none hover:bg-transparent">
              <SortableTableHead
                field="grievance_number"
                currentSort={sortState}
                onSort={handleSort}
                className="py-2 pl-3 pr-2 font-semibold text-slate-700 dark:text-slate-200 text-xs sm:text-sm"
              >
                Grievance ID
              </SortableTableHead>
              <SortableTableHead
                field="category_name"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2.5 py-2 font-semibold text-slate-700 dark:text-slate-200 text-xs sm:text-sm"
              >
                Category
              </SortableTableHead>
              <SortableTableHead
                field="priority"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2.5 py-2 font-semibold text-slate-700 dark:text-slate-200 text-xs sm:text-sm"
              >
                Priority
              </SortableTableHead>
              <SortableTableHead
                field="status"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2.5 py-2 font-semibold text-slate-700 dark:text-slate-200 text-xs sm:text-sm"
              >
                Status
              </SortableTableHead>
            </TableRow>
          </TableHeader>
        </table>

        {/* Dynamic Rows Container filling natural height */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <table className="w-full text-left text-sm table-fixed">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[36%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
            </colgroup>
            <TableBody>
              {recentGrievances.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-slate-400"
                  >
                    No grievances registered yet.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGrievances.map((g) => (
                  <TableRow
                    key={g.grievance_id}
                    className="hover:bg-slate-50/70 transition border-b border-slate-100 dark:border-slate-800/60"
                  >
                    <TableCell className="py-2 pl-3 pr-2 font-mono font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                      {g.grievance_number}
                    </TableCell>
                    <TableCell className="py-2 px-2.5 text-slate-700 dark:text-slate-300 text-sm truncate">
                      {g.category_name || "General"}
                    </TableCell>
                    <TableCell className="py-2 px-2.5">
                      <PriorityBadge priority={g.priority} />
                    </TableCell>
                    <TableCell className="py-2 px-2.5">
                      <StatusBadge status={g.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </table>
        </div>

        {/* Solid Pagination Footer directly beneath rows */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(recentGrievances.length / pageSize) || 1}
            totalCount={recentGrievances.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
            itemLabel="grievances"
            className="py-1.5 px-3 sm:px-3"
          />
        </div>
      </div>
    </div>
  );
}
