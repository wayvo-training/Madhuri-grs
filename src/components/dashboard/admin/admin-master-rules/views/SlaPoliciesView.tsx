import { AlertTriangle, FileText } from "lucide-react";
import { useState } from "react";
import { ActionMenu } from "@/components/ui/action-menu";
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
import { TruncatedText } from "@/components/ui/truncated-text";
import { useTableSort } from "@/hooks/useTableSort";

import type { SerializedSlaPolicy } from "@/types/admin/master-rules";

interface SlaPoliciesViewProps {
  policies: SerializedSlaPolicy[];
  searchQuery: string;
  statusFilter: string[];
  onEdit: (policy: SerializedSlaPolicy) => void;
  onToggleStatus: (policy: SerializedSlaPolicy) => void;
  onDelete: (policy: SerializedSlaPolicy) => void;
}

export function SlaPoliciesView({
  policies,
  searchQuery,
  statusFilter,
  onEdit,
  onToggleStatus,
  onDelete,
}: SlaPoliciesViewProps) {
  const filtered = policies.filter((p) => {
    if (statusFilter.length > 0 && !statusFilter.includes(p.status))
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.policy_name.toLowerCase().includes(q);
      if (!matchName) return false;
    }
    return true;
  });

  const formatDuration = (minutes: number) => {
    if (minutes >= 1440 && minutes % 1440 === 0)
      return `${minutes / 1440} Days`;
    if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} Hours`;
    return `${minutes} Mins`;
  };

  const { sortState, handleSort, sortedItems } = useTableSort(filtered, {
    field: "policy_name",
    direction: "asc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalCount = sortedItems.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginated = sortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex flex-col overflow-hidden">
        {/* Static Header Table: no scrollbar next to header */}
        <table className="w-full text-left text-sm table-fixed border-collapse shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[11%]" />
            <col className="w-[13%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
          </colgroup>
          <TableHeader className="bg-transparent">
            <TableRow className="hover:bg-transparent whitespace-nowrap">
              <SortableTableHead
                field="policy_name"
                currentSort={sortState}
                onSort={handleSort}
                className="py-2.5 pl-4 pr-2 font-semibold uppercase tracking-wider text-slate-500"
              >
                Policy Name
              </SortableTableHead>
              <SortableTableHead
                field="priority_level"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Priority Scope
              </SortableTableHead>
              <SortableTableHead
                field="target_duration_minutes"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap"
              >
                Target
              </SortableTableHead>
              <SortableTableHead
                field="warning_threshold_percent"
                currentSort={sortState}
                onSort={handleSort}
                className="px-1 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-center whitespace-nowrap"
              >
                Warning (50%)
              </SortableTableHead>
              <SortableTableHead
                field="at_risk_threshold_percent"
                currentSort={sortState}
                onSort={handleSort}
                className="px-1 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-center whitespace-nowrap"
              >
                At Risk (75%)
              </SortableTableHead>
              <SortableTableHead
                field="critical_threshold_percent"
                currentSort={sortState}
                onSort={handleSort}
                className="px-1 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-center whitespace-nowrap"
              >
                Critical (90%)
              </SortableTableHead>
              <SortableTableHead
                field="escalation_threshold_percent"
                currentSort={sortState}
                onSort={handleSort}
                className="px-1 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-center whitespace-nowrap"
              >
                Breach (100%)
              </SortableTableHead>
              <SortableTableHead
                field="status"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Status
              </SortableTableHead>
              <TableHead className="py-2.5 pl-2 pr-4 text-right font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
        </table>

        {/* Scrollable Rows Container (Vertical scroll within rows only) */}
        <div className="max-h-[calc(100vh-340px)] overflow-y-auto overflow-x-hidden custom-scrollbar">
          <table className="w-full text-left text-sm table-fixed border-collapse">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
            </colgroup>
            <TableBody className="font-medium text-slate-700">
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-12 text-center text-slate-400 font-normal"
                  >
                    <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No SLA Policies found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((p) => {
                  return (
                    <TableRow
                      key={p.sla_policy_id}
                      className="transition-colors hover:bg-slate-50/80 whitespace-nowrap"
                    >
                      <TableCell className="py-2.5 pl-4 pr-2 overflow-hidden max-w-full">
                        <TruncatedText
                          text={p.policy_name}
                          maxChars={24}
                          className="font-semibold text-slate-900 dark:text-slate-100 max-w-full truncate block"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-2.5">
                        {p.priority_level ? (
                          p.priority_level
                        ) : (
                          <span className="text-slate-500">All Priorities</span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-2.5 text-slate-600">
                        {formatDuration(p.target_duration_minutes)}
                      </TableCell>
                      <TableCell className="px-1 py-2.5 text-center">
                        <span className="text-amber-600 font-semibold">
                          {p.warning_threshold_percent}%
                        </span>
                      </TableCell>
                      <TableCell className="px-1 py-2.5 text-center">
                        <span className="text-orange-600 font-semibold">
                          {p.at_risk_threshold_percent || "75"}%
                        </span>
                      </TableCell>
                      <TableCell className="px-1 py-2.5 text-center">
                        <span className="text-red-500 font-semibold">
                          {p.critical_threshold_percent || "90"}%
                        </span>
                      </TableCell>
                      <TableCell className="px-1 py-2.5 text-center">
                        <span className="text-rose-700 font-semibold">
                          {p.escalation_threshold_percent}%
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-2.5 whitespace-nowrap">
                        <span
                          className={`font-medium ${p.status === "ACTIVE" ? "text-emerald-700" : "text-slate-500"}`}
                        >
                          {p.status === "ACTIVE" ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 pl-2 pr-4 text-right">
                        <ActionMenu
                          widthClass="w-36"
                          items={[
                            {
                              label: "Delete Policy",
                              variant: "danger" as const,
                              icon: <AlertTriangle className="h-3.5 w-3.5" />,
                              onClick: () => onDelete(p),
                            },
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
        {policies.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              itemLabel="SLA Policies"
            />
          </div>
        )}
      </div>
    </div>
  );
}
