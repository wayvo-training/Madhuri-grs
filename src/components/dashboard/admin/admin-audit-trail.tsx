"use client";

import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface SerializedAuditLog {
  audit_log_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_name: string;
  user_email: string;
  created_at: string;
  new_value: unknown;
}

interface AdminAuditTrailProps {
  initialLogs: SerializedAuditLog[];
}

const actionStyles: Record<string, string> = {
  MANUAL_ROUTING_EXCEPTION: "bg-amber-50 text-amber-800 border-amber-200",
  CREATE_PRIORITY_RULE: "bg-blue-50 text-blue-700 border-blue-200",
  CREATE_ROUTING_RULE: "bg-sky-50 text-sky-700 border-sky-200",
  CREATE_SLA_POLICY: "bg-purple-50 text-purple-700 border-purple-200",
  CREATE_REOPEN_POLICY: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CREATE_ROLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  STATUS_CHANGE: "bg-slate-100 text-slate-800 border-slate-200",
};

export function AdminAuditTrail({ initialLogs }: AdminAuditTrailProps) {
  const [logs] = useState<SerializedAuditLog[]>(initialLogs);
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    if (selectedAction === "ALL") return logs;
    return logs.filter((l) => l.action === selectedAction);
  }, [logs, selectedAction]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action)));
  }, [logs]);

  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAction]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  return (
    <div
      id="audit-logs"
      className="rounded-2xl border border-slate-200/80 bg-white shadow-xs"
    >
      {/* Header */}
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Enterprise Audit Trail & Governance Log
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Immutable record of administrative decisions, rule creation, and
              manual routing overrides.
            </p>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Actions ({logs.length})</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 pl-6 pr-3">Timestamp</th>
              <th className="px-3 py-3.5">Actor</th>
              <th className="px-3 py-3.5">Action</th>
              <th className="px-3 py-3.5">Entity</th>
              <th className="py-3.5 pl-3 pr-6 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-slate-400 font-normal"
                >
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const actionBadge =
                  actionStyles[log.action] ||
                  "bg-slate-100 text-slate-700 border-slate-200";
                const isExpanded = expandedLogId === log.audit_log_id;

                return (
                  <tr
                    key={log.audit_log_id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    {/* Timestamp */}
                    <td className="whitespace-nowrap py-3.5 pl-6 pr-3 font-mono text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>
                          {new Date(log.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <p className="font-semibold text-slate-900">
                        {log.user_name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {log.user_email}
                      </p>
                    </td>

                    {/* Action */}
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${actionBadge}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[11px] text-slate-600">
                      <span>{log.entity_type}</span>
                      {log.entity_id && (
                        <span className="ml-1 text-slate-400 font-sans text-[10px]">
                          #{log.entity_id}
                        </span>
                      )}
                    </td>

                    {/* Details Toggle */}
                    <td className="whitespace-nowrap py-3.5 pl-3 pr-6 text-right">
                      {log.new_value ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedLogId(
                              isExpanded ? null : log.audit_log_id,
                            )
                          }
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline"
                        >
                          {isExpanded ? "Hide" : "Inspect Payload"}
                        </button>
                      ) : (
                        <span className="text-slate-400">&mdash;</span>
                      )}

                      {isExpanded && Boolean(log.new_value) && (
                        <div className="mt-2 text-left rounded-lg bg-slate-900 p-2.5 font-mono text-[10px] text-slate-200 max-w-sm ml-auto overflow-x-auto shadow-inner">
                          <pre>{JSON.stringify(log.new_value, null, 2)}</pre>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredLogs.length > PAGE_SIZE && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-6 py-3.5 text-xs text-slate-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {(currentPage - 1) * PAGE_SIZE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * PAGE_SIZE, filteredLogs.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {filteredLogs.length}
            </span>{" "}
            events
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>
            <span className="px-2 font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
