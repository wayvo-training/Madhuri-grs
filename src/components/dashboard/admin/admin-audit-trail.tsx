"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileCode2,
  Globe,
  LogIn,
  RotateCcw,
  Server,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPanelHeader, AdminSearchInput } from "./admin-shared";

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
  initialTotalCount?: number;
  stats?: {
    total: number;
    sessions: number;
    apis: number;
    errors: number;
  };
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
  ADMIN: "bg-slate-100 text-slate-900 border-slate-300 font-semibold",
  DEPARTMENT_HEAD: "bg-slate-100 text-slate-800 border-slate-200 font-medium",
  STAFF: "bg-slate-50 text-slate-700 border-slate-200",
  END_USER: "bg-slate-50 text-slate-600 border-slate-200",
  SYSTEM: "bg-slate-100 text-slate-700 border-slate-200",
};

function AuditMetricCard({
  title,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number | string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "emerald" | "amber" | "slate" | "rose";
}) {
  const styles = {
    emerald: {
      chip: "bg-emerald-50 text-[#064E3B]",
      value: "text-slate-900",
      accent: "text-[#064E3B]",
      dot: "bg-emerald-600",
    },
    amber: {
      chip: "bg-amber-50 text-amber-800 border border-amber-200",
      value: "text-amber-900",
      accent: "text-amber-800",
      dot: "bg-amber-600",
    },
    slate: {
      chip: "bg-slate-100 text-slate-700",
      value: "text-slate-900",
      accent: "text-slate-600",
      dot: "bg-slate-400",
    },
    rose: {
      chip: "bg-rose-50 text-rose-600",
      value: "text-rose-700",
      accent: "text-rose-600",
      dot: "bg-rose-500",
    },
  } as const;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`rounded-xl p-2 ${styles[accent].chip}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`text-2xl font-bold tracking-tight ${styles[accent].value}`}
        >
          {value}
        </span>
        <span className="text-xs font-medium text-slate-400">{helper}</span>
      </div>
      <div
        className={`mt-3 flex items-center gap-1.5 text-xs font-normal ${styles[accent].accent}`}
      >
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${styles[accent].dot}`}
        />
        {title === "Errors & Exceptions"
          ? "Security & runtime alerts"
          : title === "API Requests & Route Calls"
            ? "Automated API telemetry"
            : title === "User Sessions & Logins"
              ? "Sign-ins & session tokens"
              : "Immutable system ledger"}
      </div>
    </div>
  );
}

function AuditTabButton({
  tab,
  active,
  onClick,
}: {
  tab: {
    id: TabCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-[#064E3B] text-white shadow-xs"
          : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{tab.label}</span>
    </button>
  );
}

export function AdminAuditTrail({
  initialLogs,
  initialTotalCount,
  stats,
}: AdminAuditTrailProps) {
  const PAGE_SIZE = 10;
  const [logs, setLogs] = useState<SerializedAuditLog[]>(initialLogs);
  const [totalCount, setTotalCount] = useState<number>(
    initialTotalCount ?? initialLogs.length,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const isFirstMount = useRef(true);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Fetch paginated logs from server
  const fetchLogs = useCallback(
    async (page: number, category: TabCategory, search: string) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
        });
        if (category !== "ALL") params.set("category", category);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setLogs(data.logs || []);
          if (data.pagination) {
            setTotalCount(data.pagination.total);
          }
        }
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Debounced server query on search or tab filter change
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchLogs(currentPage, activeTab, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPage, activeTab, searchQuery, fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AuditMetricCard
          title="Total Audited Events"
          value={stats?.total ?? totalCount}
          helper="Recorded"
          icon={Activity}
          accent="emerald"
        />
        <AuditMetricCard
          title="User Sessions & Logins"
          value={stats?.sessions ?? "-"}
          helper="Auth events"
          icon={LogIn}
          accent="emerald"
        />
        <AuditMetricCard
          title="API Requests & Route Calls"
          value={stats?.apis ?? "-"}
          helper="Transactions"
          icon={Server}
          accent="slate"
        />
        <AuditMetricCard
          title="Errors & Exceptions"
          value={stats?.errors ?? "-"}
          helper="Logged"
          icon={AlertTriangle}
          accent="amber"
        />
      </div>

      <div
        id="audit-logs"
        className="rounded-2xl border border-slate-200/80 bg-white shadow-xs"
      >
        {/* Header */}
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <AdminPanelHeader
            title="Observability & Audit Trail"
            description="Complete record of sessions, API requests, route navigation, errors, and administrative governance."
            action={
              <AdminSearchInput
                value={searchQuery}
                onChange={(value) => {
                  setSearchQuery(value);
                  setCurrentPage(1);
                }}
                placeholder="Search actor, email, IP, action..."
              />
            }
          />

          <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-4">
            {categoryTabs.map((tab) => (
              <AuditTabButton
                key={tab.id}
                tab={tab}
                active={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
              />
            ))}
          </div>
        </div>

        {/* Logs Table */}
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
                        No event records match your active category filter or
                        search query.
                      </p>
                      {(searchQuery || activeTab !== "ALL") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setActiveTab("ALL");
                            setCurrentPage(1);
                          }}
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
                    roleBadgeStyles[log.role_name || ""] ||
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
                          {new Date(log.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
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
                                  className={`rounded px-1.5 py-0.2 text-2.25 font-bold border ${rolePill}`}
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
                              onClick={() =>
                                setExpandedLogId(
                                  isExpanded ? null : log.audit_log_id,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              <FileCode2 className="h-3 w-3 text-emerald-700" />
                              <span>
                                {isExpanded ? "Hide Data" : "Inspect"}
                              </span>
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
            <pre className="mt-3 max-h-60 overflow-y-auto rounded bg-slate-950 p-3 text-xs">
              {JSON.stringify(
                logs.find((l) => l.audit_log_id === expandedLogId)?.new_value,
                null,
                2,
              )}
            </pre>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-6 py-3.5 text-xs text-slate-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * PAGE_SIZE, totalCount)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">{totalCount}</span>{" "}
            events
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
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
              disabled={currentPage >= totalPages || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
