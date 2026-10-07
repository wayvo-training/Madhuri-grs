"use client";

import { AlertTriangle, Building2, FileText, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "@/components/dashboard/badges";
import { ActionMenu } from "@/components/ui/action-menu";
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
  SerializedGrievance,
  SupportingDepartment,
} from "@/types/admin/grievances";

/* ── Supporting Departments Popover ─────────────────────────────────── */
function SupportingDeptsPopover({
  departments,
}: {
  departments: SupportingDepartment[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-300"
      >
        <Building2 className="h-3 w-3" />+{departments.length} supporting
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Supporting Depts
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {/* List */}
          <ul className="py-1">
            {departments.map((d) => (
              <li
                key={d.department_id}
                className="flex items-center gap-2 px-3 py-1.5"
              >
                <Building2 className="h-3 w-3 shrink-0 text-indigo-400" />
                <span className="text-xs text-slate-700">
                  {d.department_name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────────────── */

interface GrievanceTableListProps {
  grievancesList: SerializedGrievance[];
  isLoading: boolean;
  onOpenModal: (g: SerializedGrievance) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function GrievanceTableList({
  grievancesList,
  isLoading,
  onOpenModal,
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}: GrievanceTableListProps) {
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: null,
  });

  const handleSort = (field: string, direction: SortState["direction"]) => {
    setSortState({ field, direction });
  };

  const sortedList = useMemo(() => {
    if (!sortState.field || !sortState.direction) return grievancesList;

    return [...grievancesList].sort((a, b) => {
      let valA =
        (a[sortState.field as keyof SerializedGrievance] as
          | string
          | number
          | undefined) || "";
      let valB =
        (b[sortState.field as keyof SerializedGrievance] as
          | string
          | number
          | undefined) || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortState.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [grievancesList, sortState]);

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-xs">
      <Table className="w-full text-left text-xs">
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent">
            <SortableTableHead
              field="grievance_number"
              currentSort={sortState}
              onSort={handleSort}
              className="py-2.5 pl-4 pr-2 font-semibold uppercase tracking-wider text-slate-500"
            >
              Grievance ID
            </SortableTableHead>
            <SortableTableHead
              field="title"
              currentSort={sortState}
              onSort={handleSort}
              className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
            >
              Subject
            </SortableTableHead>
            <SortableTableHead
              field="category_name"
              currentSort={sortState}
              onSort={handleSort}
              className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
            >
              Category
            </SortableTableHead>
            <SortableTableHead
              field="department_name"
              currentSort={sortState}
              onSort={handleSort}
              className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
            >
              Department
            </SortableTableHead>
            <SortableTableHead
              field="submitted_by_name"
              currentSort={sortState}
              onSort={handleSort}
              className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
            >
              Submitter Name
            </SortableTableHead>
            <SortableTableHead
              field="submitted_by_email"
              currentSort={sortState}
              onSort={handleSort}
              className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
            >
              Submitter Email
            </SortableTableHead>
            <SortableTableHead
              field="priority"
              currentSort={sortState}
              onSort={handleSort}
              className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
            >
              Priority
            </SortableTableHead>
            <SortableTableHead
              field="status"
              currentSort={sortState}
              onSort={handleSort}
              className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
            >
              Status
            </SortableTableHead>
            <SortableTableHead
              field="sla_status"
              currentSort={sortState}
              onSort={handleSort}
              className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
            >
              SLA Health
            </SortableTableHead>
            <TableHead className="py-2.5 pl-2 pr-4 text-right font-semibold uppercase tracking-wider text-slate-500">
              Actions
            </TableHead>
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
            sortedList.map((g) => {
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-800">
                            {g.department_name}
                          </span>
                          {g.involvement_type === "EQUAL" && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              EQUAL
                            </span>
                          )}
                        </div>
                        {g.supporting_departments &&
                          g.supporting_departments.length > 0 && (
                            <SupportingDeptsPopover
                              departments={g.supporting_departments}
                            />
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
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          itemLabel="grievances"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
