"use client";

import { Activity, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useTableSort } from "@/hooks/useTableSort";
import { ROLE_BADGE_STYLES } from "@/lib/admin/audit/audit-constants";
import { getStandardRoleDisplayName } from "@/lib/role-display";
import type { SerializedAuditLog } from "@/types/admin/audit";

interface AuditLogTableProps {
  logs: SerializedAuditLog[];
  isLoading: boolean;
  searchQuery: string;
  activeTab: string;
  onResetFilters: () => void;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function AuditLogTable({
  logs,
  isLoading,
  searchQuery,
  activeTab,
  onResetFilters,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: AuditLogTableProps) {
  const { sortState, handleSort, sortedItems } = useTableSort(logs, {
    field: "created_at",
    direction: "desc",
  });

  const colGroup = (
    <colgroup>
      <col className="w-[20%]" />
      <col className="w-[32%]" />
      <col className="w-[26%]" />
      <col className="w-[22%]" />
    </colgroup>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
      {/* Static Header Table: no scrollbar next to header */}
      <table className="w-full text-left text-xs table-fixed border-collapse shrink-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
        {colGroup}
        <thead className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <tr>
            <SortableTh
              field="created_at"
              currentSort={sortState}
              onSort={handleSort}
              className="py-3.5 pl-6 pr-3"
            >
              Timestamp
            </SortableTh>
            <SortableTh
              field="user_name"
              currentSort={sortState}
              onSort={handleSort}
              className="px-3 py-3.5"
            >
              Who (Actor & Identity)
            </SortableTh>
            <SortableTh
              field="action"
              currentSort={sortState}
              onSort={handleSort}
              className="px-3 py-3.5"
            >
              Action / Event
            </SortableTh>
            <SortableTh
              field="entity_type"
              currentSort={sortState}
              onSort={handleSort}
              className="py-3.5 pl-3 pr-6"
            >
              Category & Entity
            </SortableTh>
          </tr>
        </thead>
      </table>

      {/* Scrollable Rows Container (Vertical scroll within rows only) */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <table className="w-full text-left text-xs table-fixed border-collapse">
          {colGroup}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr
                  key={`log-skeleton-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                    i
                  }`}
                  className="animate-pulse"
                >
                  <td className="py-3.5 pl-6 pr-3">
                    <div className="space-y-1">
                      <div className="h-3 w-16 rounded bg-slate-200" />
                      <div className="h-2 w-10 rounded bg-slate-100" />
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-slate-200" />
                      <div className="space-y-1">
                        <div className="h-3 w-24 rounded bg-slate-200" />
                        <div className="h-2 w-32 rounded bg-slate-100" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="h-3 w-32 rounded bg-slate-200" />
                  </td>
                  <td className="py-3.5 pl-3 pr-6">
                    <div className="h-5 w-20 rounded-md bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-14 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0FDFA] text-[#0F766E] ring-8 ring-teal-50/50">
                      <Activity className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-slate-900">
                      No matching audit logs
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      No event records match your active category filter or
                      search query.
                    </p>
                    {(searchQuery || activeTab !== "ALL") && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              sortedItems.map((log) => {
                const isError =
                  log.action.includes("ERROR") ||
                  log.action.includes("FAILED") ||
                  log.entity_type === "ERROR";
                const _rolePill =
                  ROLE_BADGE_STYLES[log.role_name || ""] ||
                  "bg-slate-100 text-slate-600 border-slate-200";

                return (
                  <tr
                    key={log.audit_log_id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="whitespace-nowrap py-3.5 pl-6 pr-3">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        {isError ? (
                          <XCircle className="h-3.5 w-3.5 text-rose-500" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        <span
                          suppressHydrationWarning
                          className="font-mono text-xs"
                        >
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <span
                        suppressHydrationWarning
                        className="font-mono text-xs text-slate-400"
                      >
                        {new Date(log.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>

                    <td className="px-3 py-3.5 overflow-hidden max-w-full">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F0FDFA] text-xs font-bold text-[#0F766E]">
                          {log.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <TruncatedText
                              text={log.user_name}
                              maxChars={18}
                              className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs block"
                            />
                            <span className="text-[10px] font-semibold text-slate-500 uppercase shrink-0">
                              {getStandardRoleDisplayName(log.role_name)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 min-w-0">
                            {log.employee_code && (
                              <span className="font-mono text-slate-500 shrink-0">
                                {log.employee_code} •{" "}
                              </span>
                            )}
                            <TruncatedText
                              text={log.user_email}
                              maxChars={24}
                              showCopy={true}
                              className="text-slate-400 dark:text-slate-500 truncate text-xs font-mono block"
                            />
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3.5">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isError
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="whitespace-nowrap py-3.5 pl-3 pr-6">
                      <span className="text-xs font-semibold text-slate-600">
                        {log.entity_type}
                      </span>
                      {log.entity_id && (
                        <span className="ml-1 font-mono text-xs text-slate-400">
                          #{log.entity_id}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Solid Non-Sticky Pagination Footer (Outside rows scroll container) */}
      <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel="logs"
        />
      </div>
    </div>
  );
}
