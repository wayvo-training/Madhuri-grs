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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncatedText } from "@/components/ui/truncated-text";
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
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
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
  onPageSizeChange,
  pageSizeOptions,
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

  const colGroup = (
    <colgroup>
      <col className="w-[140px]" />
      <col className="w-[260px]" />
      <col className="w-[170px]" />
      <col className="w-[170px]" />
      <col className="w-[170px]" />
      <col className="w-[150px]" />
      <col className="w-[160px]" />
      <col className="w-[200px]" />
      <col className="w-[100px]" />
      <col className="w-[160px]" />
      <col className="w-[140px]" />
      <col className="w-[90px]" />
    </colgroup>
  );

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="overflow-x-auto w-full custom-scrollbar">
        <div className="min-w-[1920px]">
          {/* Static Header Table: no scrollbar next to header */}
          <table className="w-full text-left text-xs table-fixed border-b border-slate-200 bg-slate-50/80 dark:bg-slate-800/50">
            {colGroup}
            <TableHeader className="bg-transparent shadow-none">
              <TableRow className="hover:bg-transparent border-none">
                <SortableTableHead
                  field="grievance_number"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 pl-4 pr-3 font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  Grievance ID
                </SortableTableHead>
                <SortableTableHead
                  field="title"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-3 font-semibold uppercase tracking-wider text-slate-500"
                >
                  Subject
                </SortableTableHead>
                <SortableTableHead
                  field="category_name"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-3 font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  Category
                </SortableTableHead>
                <SortableTableHead
                  field="subcategory_name"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-3 font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  Sub Category
                </SortableTableHead>
                <SortableTableHead
                  field="department_name"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-3 font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  Department
                </SortableTableHead>
                <TableHead className="px-3 py-3 font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Supporting Depts
                </TableHead>
                <SortableTableHead
                  field="submitted_by_name"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-3 font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  Submitter Name
                </SortableTableHead>
                <SortableTableHead
                  field="submitted_by_email"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-3 font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  Submitter Email
                </SortableTableHead>
                <SortableTableHead
                  field="priority"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-3 font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  Priority
                </SortableTableHead>
                <SortableTableHead
                  field="status"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-3 font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  Status
                </SortableTableHead>
                <SortableTableHead
                  field="sla_status"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-3 font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  SLA Health
                </SortableTableHead>
                <TableHead className="py-3 pl-2 pr-4 text-right font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
          </table>

          {/* Scrollable Table Body: vertical scrollbar starts directly below header at marked line */}
          <div className="max-h-[calc(100vh-370px)] overflow-y-auto overflow-x-hidden custom-scrollbar">
            <table className="w-full text-left text-xs table-fixed">
              {colGroup}
              <TableBody
                className={`font-medium text-slate-700 transition-opacity duration-150 ${
                  isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
                }`}
              >
                {grievancesList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
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
                        className="transition-colors hover:bg-slate-50/80 border-b border-slate-100"
                      >
                        {/* ID */}
                        <TableCell className="whitespace-nowrap py-3 pl-4 pr-3 font-mono font-bold text-slate-900">
                          {g.grievance_number}
                        </TableCell>

                        {/* Subject */}
                        <TableCell className="px-3 py-3">
                          <TruncatedText
                            text={g.title}
                            maxChars={32}
                            className="font-semibold text-slate-900 border-none block truncate max-w-full"
                          />
                        </TableCell>

                        {/* Category */}
                        <TableCell className="px-3 py-3">
                          <TruncatedText
                            text={g.category_name}
                            maxChars={20}
                            className="text-xs font-semibold text-slate-800 border-none block truncate max-w-full"
                          />
                        </TableCell>

                        {/* Sub Category */}
                        <TableCell className="px-3 py-3">
                          <TruncatedText
                            text={g.subcategory_name}
                            maxChars={20}
                            className="text-xs font-medium text-slate-600 border-none block truncate max-w-full"
                          />
                        </TableCell>

                        {/* Department */}
                        <TableCell className="px-3 py-3">
                          {g.department_name ? (
                            <div className="flex items-center gap-1.5 max-w-full">
                              <TruncatedText
                                text={g.department_name}
                                maxChars={18}
                                className="text-xs font-medium text-slate-800 border-none truncate max-w-full"
                              />
                              {g.involvement_type === "EQUAL" && (
                                <span className="inline-flex shrink-0 items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                  EQUAL
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-amber-800 whitespace-nowrap">
                              Unrouted Exception
                            </span>
                          )}
                        </TableCell>

                        {/* Supporting Depts */}
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          {g.supporting_departments &&
                          g.supporting_departments.length > 0 ? (
                            <SupportingDeptsPopover
                              departments={g.supporting_departments}
                            />
                          ) : (
                            <span className="text-xs text-slate-400 font-normal">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Submitter Name */}
                        <TableCell className="px-3 py-3 text-slate-600 overflow-hidden max-w-full">
                          <TruncatedText
                            text={g.submitted_by_name}
                            maxChars={18}
                            className="font-medium text-slate-900 dark:text-slate-100 truncate block text-xs"
                          />
                        </TableCell>

                        {/* Submitter Email */}
                        <TableCell className="px-3 py-3 text-slate-600 overflow-hidden max-w-full">
                          <TruncatedText
                            text={g.submitted_by_email}
                            maxChars={20}
                            showCopy={true}
                            className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate block"
                          />
                        </TableCell>

                        {/* Priority */}
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          {g.priority}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="whitespace-nowrap px-3 py-3">
                          <StatusBadge status={g.status} />
                        </TableCell>

                        {/* SLA Health */}
                        <TableCell className="whitespace-nowrap px-3 py-3 text-xs font-medium text-slate-800 dark:text-slate-200">
                          {g.sla_status === "BREACHED"
                            ? "Breached"
                            : g.sla_status === "AT_RISK"
                              ? "At Risk"
                              : g.sla_status === "ON_TRACK"
                                ? "On Track"
                                : g.sla_status || "—"}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="whitespace-nowrap py-3 pl-2 pr-4 text-right">
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
                                      icon: (
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                      ),
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
            </table>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white dark:bg-slate-900">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
          itemLabel="grievances"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
