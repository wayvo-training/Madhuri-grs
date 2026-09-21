"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileCode2,
  Globe,
  LogIn,
  Search,
  Server,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface SerializedAuditLog {
  audit_log_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_name: string;
  user_email: string;
  employee_code?: string | null;
  role_name?: string | null;
  ip_address: string;
  user_agent?: string | null;
  created_at: string;
  new_value: unknown;
  old_value?: unknown;
}

interface AdminAuditTrailProps {
  initialLogs: SerializedAuditLog[];
}

type TabCategory =
  | "ALL"
  | "SESSION"
  | "API"
  | "NAVIGATION"
  | "ERROR"
  | "CONFIG";

const categoryTabs: {
  id: TabCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "ALL", label: "All Activity", icon: Activity },
  { id: "SESSION", label: "Sessions", icon: LogIn },
  { id: "API", label: "API Calls & Requests", icon: Server },
  { id: "NAVIGATION", label: "Navigation", icon: Compass },
  { id: "ERROR", label: "Errors & Failures", icon: AlertCircle },
  { id: "CONFIG", label: "Governance & Config", icon: ShieldCheck },
];

const roleBadgeStyles: Record<string, string> = {
  ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  DEPARTMENT_HEAD: "bg-blue-50 text-blue-700 border-blue-200",
  STAFF: "bg-amber-50 text-amber-700 border-amber-200",
  END_USER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SYSTEM: "bg-slate-100 text-slate-700 border-slate-200",
};

export function AdminAuditTrail({ initialLogs }: AdminAuditTrailProps) {
  const [logs] = useState<SerializedAuditLog[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<TabCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Filter logs by Tab and Search
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Tab matching
      if (activeTab === "SESSION") {
        if (
          log.entity_type !== "SESSION" &&
          !log.action.includes("LOGIN") &&
          !log.action.includes("LOGOUT")
        ) {
          return false;
        }
      } else if (activeTab === "API") {
        if (
          log.entity_type !== "API_CALL" &&
          !log.action.includes("API_REQUEST")
        ) {
          return false;
        }
      } else if (activeTab === "NAVIGATION") {
        if (
          log.entity_type !== "NAVIGATION" &&
          !log.action.includes("NAVIGATION")
        ) {
          return false;
        }
      } else if (activeTab === "ERROR") {
        if (
          log.entity_type !== "ERROR" &&
          !log.action.includes("ERROR") &&
          !log.action.includes("FAILED")
        ) {
          return false;
        }
      } else if (activeTab === "CONFIG") {
        if (["SESSION", "API_CALL", "NAVIGATION"].includes(log.entity_type)) {
          return false;
        }
      }

      // Search matching (Actor name, email, employee code, IP, action, entity)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = log.user_name.toLowerCase().includes(query);
        const matchesEmail = log.user_email.toLowerCase().includes(query);
        const matchesCode = (log.employee_code || "")
          .toLowerCase()
          .includes(query);
        const matchesIp = log.ip_address.toLowerCase().includes(query);
        const matchesAction = log.action.toLowerCase().includes(query);
        const matchesEntity = log.entity_type.toLowerCase().includes(query);
        return (
          matchesName ||
          matchesEmail ||
          matchesCode ||
          matchesIp ||
          matchesAction ||
          matchesEntity
        );
      }

      return true;
    });
  }, [logs, activeTab, searchQuery]);

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

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
                Observability & Audit Trail
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Complete record of sessions, API requests, route navigation,
              errors, and administrative governance.
            </p>
          </div>

          {/* Search */}
          <div className="relative min-w-[240px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search actor, email, IP, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Tab Selector */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-4">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
            {filteredLogs.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-slate-400 font-normal"
                >
                  No logs match the selected filter.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const isError =
                  log.action.includes("ERROR") ||
                  log.action.includes("FAILED") ||
                  log.entity_type === "ERROR";
                const isExpanded = expandedLogId === log.audit_log_id;
                const rolePill =
                  roleBadgeStyles[log.role_name || ""] ||
                  "bg-slate-100 text-slate-600 border-slate-200";

                return (
                  <tr
                    key={log.audit_log_id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    {/* Timestamp */}
                    <td className="whitespace-nowrap py-3.5 pl-6 pr-3">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        {isError ? (
                          <XCircle className="h-3.5 w-3.5 text-rose-500" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        <span className="font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Who Column */}
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[11px] font-bold text-blue-700">
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
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
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

                    {/* Action */}
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                          isError
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-800 border-slate-200"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Category & Entity */}
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {log.entity_type}
                      </span>
                      {log.entity_id && (
                        <span className="ml-1 font-mono text-[10px] text-slate-400">
                          #{log.entity_id}
                        </span>
                      )}
                    </td>

                    {/* Source IP / Device */}
                    <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-slate-400" />
                        <span>{log.ip_address}</span>
                      </div>
                    </td>

                    {/* Payload / Details */}
                    <td className="whitespace-nowrap py-3.5 pl-3 pr-6 text-right">
                      {log.new_value ? (
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedLogId(
                                isExpanded ? null : log.audit_log_id,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <FileCode2 className="h-3 w-3 text-blue-600" />
                            <span>{isExpanded ? "Hide Data" : "Inspect"}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
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

      {/* Expanded Payload Inspector Drawer */}
      {expandedLogId && (
        <div className="border-t border-slate-200/80 bg-slate-900 p-5 font-mono text-xs text-emerald-400">
          <div className="flex items-center justify-between pb-3 text-slate-400 border-b border-slate-800">
            <span className="font-semibold text-slate-200">
              Audit Event Payload (ID: #{expandedLogId})
            </span>
            <button
              type="button"
              onClick={() => setExpandedLogId(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>
          <pre className="mt-3 max-h-60 overflow-y-auto rounded bg-slate-950 p-3 text-[11px]">
            {JSON.stringify(
              logs.find((l) => l.audit_log_id === expandedLogId)?.new_value,
              null,
              2,
            )}
          </pre>
        </div>
      )}

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
