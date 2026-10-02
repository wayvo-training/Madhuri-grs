"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
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
    <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Recent Grievances
          </h3>
          <p className="mt-0.5 text-xs font-normal text-slate-500">
            Latest filings across the organization
          </p>
        </div>
        <Link
          href="/admin/grievances"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
        >
          <span>View Full Table</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                field="grievance_number"
                currentSort={sortState}
                onSort={handleSort}
                className="py-2.5 pl-3 pr-2"
              >
                Ticket ID
              </SortableTableHead>
              <SortableTableHead
                field="category_name"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2.5 py-2.5"
              >
                Category
              </SortableTableHead>
              <SortableTableHead
                field="priority"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2.5 py-2.5"
              >
                Priority
              </SortableTableHead>
              <SortableTableHead
                field="status"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2.5 py-2.5"
              >
                Status
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentGrievances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-slate-400"
                >
                  No grievances registered yet.
                </TableCell>
              </TableRow>
            ) : (
              paginatedGrievances.map((g) => (
                <TableRow key={g.grievance_id}>
                  <TableCell className="pl-3 pr-2 font-mono font-medium text-slate-900">
                    {g.grievance_number}
                  </TableCell>
                  <TableCell className="px-2.5 text-slate-700">
                    {g.category_name || "General"}
                  </TableCell>
                  <TableCell className="px-2.5">
                    <PriorityBadge priority={g.priority} />
                  </TableCell>
                  <TableCell className="px-2.5">
                    <StatusBadge status={g.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(recentGrievances.length / pageSize) || 1}
          totalCount={recentGrievances.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20]}
          itemLabel="grievances"
        />
      </div>
    </div>
  );
}
