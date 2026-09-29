"use client";

import { AlertTriangle, Building2, FileText } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/badges";
import { ActionMenu } from "@/components/ui/action-menu";
import type { SerializedGrievance } from "@/types/admin/grievances";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead, type SortState } from "@/components/ui/sortable-table-head";
import { useState, useMemo } from "react";

interface GrievanceTableListProps {
  grievancesList: SerializedGrievance[];
  isLoading: boolean;
  onOpenModal: (g: SerializedGrievance) => void;
}

export function GrievanceTableList({
  grievancesList,
  isLoading,
  onOpenModal,
}: GrievanceTableListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortState, setSortState] = useState<SortState>({ field: null, direction: null });

  const handleSort = (field: string, direction: SortState["direction"]) => {
    setSortState({ field, direction });
  };

  const sortedList = useMemo(() => {
    if (!sortState.field || !sortState.direction) return grievancesList;
    
    return [...grievancesList].sort((a, b) => {
      let valA: any = a[sortState.field as keyof SerializedGrievance] || "";
      let valB: any = b[sortState.field as keyof SerializedGrievance] || "";
      
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      
      if (valA < valB) return sortState.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [grievancesList, sortState]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, currentPage, pageSize]);

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-xs">
      <Table className="w-full text-left text-xs">
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent">
            <SortableTableHead field="grievance_number" currentSort={sortState} onSort={handleSort} className="py-2.5 pl-4 pr-2 font-semibold uppercase tracking-wider text-slate-500">Grievance ID</SortableTableHead>
            <SortableTableHead field="title" currentSort={sortState} onSort={handleSort} className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Subject</SortableTableHead>
            <SortableTableHead field="category_name" currentSort={sortState} onSort={handleSort} className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Category</SortableTableHead>
            <SortableTableHead field="department_name" currentSort={sortState} onSort={handleSort} className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Department</SortableTableHead>
            <SortableTableHead field="submitted_by_name" currentSort={sortState} onSort={handleSort} className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Submitter Name</SortableTableHead>
            <SortableTableHead field="submitted_by_email" currentSort={sortState} onSort={handleSort} className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Submitter Email</SortableTableHead>
            <SortableTableHead field="priority" currentSort={sortState} onSort={handleSort} className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Priority</SortableTableHead>
            <SortableTableHead field="status" currentSort={sortState} onSort={handleSort} className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">Status</SortableTableHead>
            <SortableTableHead field="sla_status" currentSort={sortState} onSort={handleSort} className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500">SLA Health</SortableTableHead>
            <TableHead className="py-2.5 pl-2 pr-4 text-right font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody
          className={`font-medium text-slate-700 transition-opacity duration-150 ${
            isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
          }`}
        >
          {grievancesList.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="py-12 text-center text-slate-400 font-normal"
              >
                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                No grievances match the selected filters.
              </TableCell>
            </TableRow>
          ) : (
            paginatedList.map((g) => {
              const isException =
                g.status === "SUBMITTED" || !g.department_name;

              return (
                <TableRow
                  key={g.grievance_id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  {/* ID */}
                  <TableCell className="whitespace-nowrap py-2.5 pl-4 pr-2 font-mono font-bold text-slate-900">
                    {g.grievance_number}
                  </TableCell>

                  {/* Subject */}
                  <TableCell className="max-w-xs px-2 py-2.5">
                    <p className="truncate font-semibold text-slate-900">
                      {g.title}
                    </p>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="max-w-xs px-2 py-2.5">
                    <p className="text-xs font-medium text-slate-700">
                      {g.category_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {g.subcategory_name}
                    </p>
                  </TableCell>

                  {/* Department */}
                  <TableCell className="whitespace-nowrap px-2 py-2.5">
                    {g.department_name ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs text-slate-700">
                          {g.department_name}
                        </span>
                        {g.supporting_departments &&
                          g.supporting_departments.length > 0 && (
                            <span
                              title={`Supporting: ${g.supporting_departments.map((d) => d.department_name).join(", ")}`}
                              className="text-xs font-medium text-slate-500 cursor-help"
                            >
                              +{g.supporting_departments.length} supporting
                            </span>
                          )}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-amber-800">
                        Unrouted Exception
                      </span>
                    )}
                  </TableCell>

                  {/* Submitter Name */}
                  <TableCell className="whitespace-nowrap px-2 py-2.5 text-slate-600">
                    <p className="font-medium text-slate-900">
                      {g.submitted_by_name}
                    </p>
                  </TableCell>

                  {/* Submitter Email */}
                  <TableCell className="whitespace-nowrap px-2 py-2.5 text-slate-600">
                    <p className="text-xs text-slate-500">
                      {g.submitted_by_email}
                    </p>
                  </TableCell>

                  {/* Priority */}
                  <TableCell className="whitespace-nowrap px-2 py-2.5">
                    {g.priority}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="whitespace-nowrap px-2 py-2.5">
                    <StatusBadge status={g.status} />
                  </TableCell>

                  {/* SLA Health */}
                  <TableCell className="whitespace-nowrap px-2 py-2.5">
                    {g.sla_status || "N/A"}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="whitespace-nowrap py-2.5 pl-2 pr-4 text-right">
                    <ActionMenu
                      widthClass="w-24"
                      items={[
                        {
                          label: "View",
                          onClick: () => onOpenModal(g),
                        },
                        ...(isException
                          ? [
                              {
                                label: "Route",
                                icon: <AlertTriangle className="h-3.5 w-3.5" />,
                                variant: "warning" as const,
                                onClick: () => onOpenModal(g),
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
      <div className="border-t border-slate-100">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(grievancesList.length / pageSize) || 1}
          totalCount={grievancesList.length}
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
