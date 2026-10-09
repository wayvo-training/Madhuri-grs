"use client";

import {
  Activity,
  CheckCircle2,
  FileCode2,
  Globe,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { useTableSort } from "@/hooks/useTableSort";
import { ROLE_BADGE_STYLES } from "@/lib/admin/audit/audit-constants";
import type { SerializedAuditLog } from "@/types/admin/audit";

interface AuditLogTableProps {
  logs: SerializedAuditLog[];
  isLoading: boolean;
  searchQuery: string;
  activeTab: string;
  expandedLogId: string | null;
  onResetFilters: () => void;
  onToggleExpand: (id: string) => void;
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
  expandedLogId,
  onResetFilters,
  onToggleExpand,
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

  return (
    <div className="overflow-x-auto relative bg-transparent">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
              className="px-3 py-3.5"
            >
              Category & Entity
            </SortableTh>
            <SortableTh
              field="ip_address"
              currentSort={sortState}
              onSort={handleSort}
              className="px-3 py-3.5"
            >
              Source IP / Device
            </SortableTh>
            <th className="py-3.5 pl-3 pr-6 text-right">Payload</th>
          </tr>
        </thead>
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
                <td className="px-3 py-3.5">
                  <div className="h-5 w-20 rounded-md bg-slate-100" />
                </td>
                <td className="px-3 py-3.5">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                </td>
                <td className="py-3.5 pl-3 pr-6 text-right">
                  <div className="h-5 w-12 ml-auto rounded bg-slate-100" />
                </td>
              </tr>
            ))
          ) : logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-14 text-center">
                <div className="mx-auto flex max-w-sm flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0FDFA] text-[#0F766E] ring-8 ring-teal-50/50">
                    <Activity className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-900">
                    No matching audit logs
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    No event records match your active category filter or search
                    query.
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
              const isExpanded = expandedLogId === log.audit_log_id;
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

                  <td className="whitespace-nowrap px-3 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F0FDFA] text-xs font-bold text-[#0F766E]">
                        {log.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {log.user_name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase">
                            {log.role_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          {log.employee_code && (
                            <span className="font-mono text-slate-500">
                              {log.employee_code} •{" "}
                            </span>
                          )}
                          <span>{log.user_email}</span>
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

                  <td className="whitespace-nowrap px-3 py-3.5">
                    <span className="text-xs font-semibold text-slate-600">
                      {log.entity_type}
                    </span>
                    {log.entity_id && (
                      <span className="ml-1 font-mono text-xs text-slate-400">
                        #{log.entity_id}
                      </span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-3 py-3.5 font-mono text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-slate-400" />
                      <span>{log.ip_address}</span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap py-3.5 pl-3 pr-6 text-right">
                    {log.new_value ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => onToggleExpand(log.audit_log_id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                          <FileCode2 className="h-3 w-3 text-emerald-700" />
                          <span>{isExpanded ? "Hide Data" : "Inspect"}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        None
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <div className="border-t border-slate-100 dark:border-slate-800">
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
