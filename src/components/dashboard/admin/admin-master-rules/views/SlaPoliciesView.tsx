import { FileText, Pencil, Power } from "lucide-react";
import { useState } from "react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useTableSort } from "@/hooks/useTableSort";

import type { SerializedSlaPolicy } from "@/types/admin/master-rules";

interface SlaPoliciesViewProps {
  policies: SerializedSlaPolicy[];
  searchQuery: string;
  statusFilter: string[];
  onEdit: (policy: SerializedSlaPolicy) => void;
  onToggleStatus: (policy: SerializedSlaPolicy) => void;
  onDelete?: (policy: SerializedSlaPolicy) => void;
}

export function SlaPoliciesView({
  policies,
  searchQuery,
  statusFilter,
  onEdit,
  onToggleStatus,
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
    <TooltipProvider delay={150}>
      <div className="flex flex-col gap-4">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex flex-col overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[1160px]">
              {(() => {
                const colGroup = (
                  <colgroup>
                    <col className="w-[240px]" />
                    <col className="w-[130px]" />
                    <col className="w-[110px]" />
                    <col className="w-[120px]" />
                    <col className="w-[120px]" />
                    <col className="w-[120px]" />
                    <col className="w-[120px]" />
                    <col className="w-[110px]" />
                    <col className="w-[90px]" />
                  </colgroup>
                );

                return (
                  <>
                    {/* Static Header Table: no scrollbar next to header */}
                    <table className="w-full text-left text-[12px] table-fixed border-collapse shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                      {colGroup}
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent whitespace-nowrap">
                          <SortableTableHead
                            field="policy_name"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[240px] py-3 pl-4 pr-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Policy Name
                          </SortableTableHead>
                          <SortableTableHead
                            field="priority_level"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[130px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Priority
                          </SortableTableHead>
                          <SortableTableHead
                            field="target_duration_minutes"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[110px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Target
                          </SortableTableHead>
                          <SortableTableHead
                            field="warning_threshold_percent"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[120px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Warning
                          </SortableTableHead>
                          <SortableTableHead
                            field="at_risk_threshold_percent"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[120px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            At Risk
                          </SortableTableHead>
                          <SortableTableHead
                            field="critical_threshold_percent"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[120px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Critical
                          </SortableTableHead>
                          <SortableTableHead
                            field="escalation_threshold_percent"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[120px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Breach
                          </SortableTableHead>
                          <SortableTableHead
                            field="status"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[110px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Status
                          </SortableTableHead>
                          <TableHead className="w-[90px] py-3 pl-2 pr-4 text-right text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden align-middle">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                    </table>

                    {/* Scrollable Rows Container (Vertical scroll within rows only) */}
                    <div className="max-h-[calc(100vh-340px)] overflow-y-auto overflow-x-hidden custom-scrollbar">
                      <table className="w-full text-left text-[13px] table-fixed border-collapse">
                        {colGroup}
                        <TableBody className="font-normal text-slate-700">
                          {filtered.length === 0 ? (
                            <TableRow className="h-[52px]">
                              <TableCell
                                colSpan={9}
                                className="py-12 text-center text-slate-400 font-normal text-[13px]"
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
                                  className="h-[52px] transition-colors hover:bg-slate-50/80 whitespace-nowrap border-b border-slate-100 dark:border-slate-800/60"
                                >
                                  <TableCell className="w-[240px] py-3 pl-4 pr-3 overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                                    <TruncatedText
                                      text={p.policy_name}
                                      maxChars={28}
                                      className="font-semibold text-slate-900 dark:text-slate-100 max-w-full truncate block text-[13px]"
                                    />
                                  </TableCell>
                                  <TableCell className="w-[130px] px-3 py-3 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    {p.priority_level ? (
                                      p.priority_level
                                    ) : (
                                      <span className="text-slate-500">
                                        All Priorities
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="w-[110px] px-3 py-3 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-slate-600 align-middle">
                                    {formatDuration(p.target_duration_minutes)}
                                  </TableCell>
                                  <TableCell className="w-[120px] px-3 py-3 whitespace-nowrap text-[13px] align-middle">
                                    <span className="text-amber-600 font-semibold">
                                      {p.warning_threshold_percent}%
                                    </span>
                                  </TableCell>
                                  <TableCell className="w-[120px] px-3 py-3 whitespace-nowrap text-[13px] align-middle">
                                    <span className="text-orange-600 font-semibold">
                                      {p.at_risk_threshold_percent || "75"}%
                                    </span>
                                  </TableCell>
                                  <TableCell className="w-[120px] px-3 py-3 whitespace-nowrap text-[13px] align-middle">
                                    <span className="text-red-500 font-semibold">
                                      {p.critical_threshold_percent || "90"}%
                                    </span>
                                  </TableCell>
                                  <TableCell className="w-[120px] px-3 py-3 whitespace-nowrap text-[13px] align-middle">
                                    <span className="text-rose-700 font-semibold">
                                      {(() => {
                                        try {
                                          if (
                                            p.trigger_condition &&
                                            typeof p.trigger_condition ===
                                              "object"
                                          ) {
                                            const tc = p.trigger_condition as {
                                              breach_at_percent?:
                                                | number
                                                | string;
                                            };
                                            if (tc.breach_at_percent)
                                              return `${tc.breach_at_percent}%`;
                                          }
                                        } catch (_e) {}
                                        return "100%";
                                      })()}
                                    </span>
                                  </TableCell>
                                  <TableCell className="w-[110px] px-3 py-3 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    <button
                                      type="button"
                                      onClick={() => onToggleStatus(p)}
                                      title={
                                        p.status === "ACTIVE"
                                          ? "Click to deactivate"
                                          : "Click to activate"
                                      }
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                                        p.status === "ACTIVE"
                                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                      }`}
                                    >
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${
                                          p.status === "ACTIVE"
                                            ? "bg-emerald-600 dark:bg-emerald-400"
                                            : "bg-slate-400"
                                        }`}
                                      />
                                      {p.status === "ACTIVE"
                                        ? "Active"
                                        : "Inactive"}
                                    </button>
                                  </TableCell>
                                  <TableCell className="w-[90px] py-3 pl-2 pr-4 text-right whitespace-nowrap overflow-hidden align-middle">
                                    <ActionMenu
                                      widthClass="w-40"
                                      items={[
                                        {
                                          label: "Edit Policy",
                                          icon: (
                                            <Pencil className="h-3.5 w-3.5" />
                                          ),
                                          onClick: () => onEdit(p),
                                        },
                                        {
                                          label:
                                            p.status === "ACTIVE"
                                              ? "Deactivate Policy"
                                              : "Activate Policy",
                                          icon: (
                                            <Power className="h-3.5 w-3.5" />
                                          ),
                                          onClick: () => onToggleStatus(p),
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
                  </>
                );
              })()}
            </div>
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
    </TooltipProvider>
  );
}
