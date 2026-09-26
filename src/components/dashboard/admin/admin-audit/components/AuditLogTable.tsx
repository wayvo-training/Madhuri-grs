"use client";

import {
  Activity,
  CheckCircle2,
  FileCode2,
  Globe,
  RotateCcw,
  XCircle,
} from "lucide-react";
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
}

export function AuditLogTable({
  logs,
  isLoading,
  searchQuery,
  activeTab,
  expandedLogId,
  onResetFilters,
  onToggleExpand,
}: AuditLogTableProps) {
  return (
    <div className="overflow-x-auto relative">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="py-3.5 pl-6 pr-3">Timestamp</th>
            <th className="px-3 py-3.5">Who (Actor & Identity)</th>
            <th className="px-3 py-3.5">Action / Event</th>
            <th className="px-3 py-3.5">Category & Entity</th>
            <th className="px-3 py-3.5">Source IP / Device</th>
            <th className="py-3.5 pl-3 pr-6 text-right">Payload</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#064E3B] ring-8 ring-emerald-50/50">
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
            logs.map((log) => {
              const isError =
                log.action.includes("ERROR") ||
                log.action.includes("FAILED") ||
                log.entity_type === "ERROR";
              const isExpanded = expandedLogId === log.audit_log_id;
              const rolePill =
                ROLE_BADGE_STYLES[log.role_name || ""] ||
                "bg-slate-100 text-slate-600 border-slate-200";

              return (
                <tr
                  key={log.audit_log_id}
                  className="transition-colors hover:bg-slate-50/80"
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
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-[#064E3B]">
                        {log.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">
                            {log.user_name}
                          </span>
                          {log.role_name && (
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${rolePill}`}
                            >
                              {log.role_name}
                            </span>
                          )}
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
                      className={`inline-block rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${
                        isError
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-slate-100 text-slate-800 border-slate-200"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-3.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
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
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
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
    </div>
  );
}
