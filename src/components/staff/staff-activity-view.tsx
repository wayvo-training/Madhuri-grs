"use client";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { usePagination } from "@/hooks/usePagination";
import { useTableSort } from "@/hooks/useTableSort";
import type { StaffAuditItem } from "@/types/staff";

interface StaffActivityViewProps {
  staffName: string;
}

export function StaffActivityView({ staffName }: StaffActivityViewProps) {
  const [activities, setActivities] = useState<StaffAuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("ALL");

  const fetchActivities = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch("/api/staff/activity");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.activities)) {
          setActivities(data.activities);
        }
      }
    } catch (err) {
      console.error("Failed to load staff activities:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const uniqueActions = useMemo(() => {
    const actions = new Set<string>();
    for (const item of activities) {
      if (item.action) actions.add(item.action);
    }
    return Array.from(actions);
  }, [activities]);

  const { sortState, handleSort, sortedItems } = useTableSort(activities, {
    field: "timestamp",
    direction: "desc",
  });

  const filteredActivities = useMemo(() => {
    return sortedItems.filter((item) => {
      if (selectedAction !== "ALL" && item.action !== selectedAction) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchAction = item.action.toLowerCase().includes(query);
        const matchDetails = item.details.toLowerCase().includes(query);
        const matchActor = item.actor.toLowerCase().includes(query);
        const matchGrievance = item.grievanceNumber
          ?.toLowerCase()
          .includes(query);
        return matchAction || matchDetails || matchActor || matchGrievance;
      }
      return true;
    });
  }, [sortedItems, selectedAction, searchQuery]);

  const pagination = usePagination(filteredActivities, {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset to page 1 on query/action filter changes
  useEffect(() => {
    pagination.resetPage();
  }, [searchQuery, selectedAction, sortState, pagination.resetPage]);

  const getActionIcon = (action: string) => {
    const lower = action.toLowerCase();
    if (
      lower.includes("sla") ||
      lower.includes("warning") ||
      lower.includes("breach")
    ) {
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
    if (lower.includes("investigation")) {
      return <Search className="w-4 h-4 text-blue-600" />;
    }
    if (lower.includes("resolution") || lower.includes("approved")) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (lower.includes("reopened")) {
      return <RotateCcw className="w-4 h-4 text-purple-600" />;
    }
    return <FileText className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/staff/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Activity className="w-3.5 h-3.5" />
              <span>Activity History</span>
            </div>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-2">
            Staff Activity &amp; Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete event timeline for grievances assigned to {staffName}.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by grievance number, activity, actor, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-700 font-medium"
            >
              <option value="ALL">All Event Types</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-slate-300 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">
              Loading activity timeline...
            </p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Activity className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">
              No matching activity records
            </h3>
            <p className="text-xs text-slate-500">
              {searchQuery || selectedAction !== "ALL"
                ? "Try adjusting your search query or filter selection."
                : "No recent activities recorded for your assigned cases."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 dark:border-slate-800/60">
                    <SortableTh
                      field="action"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="p-4 text-xs font-semibold text-slate-600 whitespace-nowrap"
                    >
                      Action
                    </SortableTh>
                    <SortableTh
                      field="grievanceNumber"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="p-4 text-xs font-semibold text-slate-600 whitespace-nowrap"
                    >
                      Grievance ID
                    </SortableTh>
                    <SortableTh
                      field="details"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="p-4 text-xs font-semibold text-slate-600"
                    >
                      Details
                    </SortableTh>
                    <SortableTh
                      field="actor"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="p-4 text-xs font-semibold text-slate-600 whitespace-nowrap"
                    >
                      Actor
                    </SortableTh>
                    <SortableTh
                      field="timestamp"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="p-4 text-xs font-semibold text-slate-600 whitespace-nowrap"
                    >
                      Time
                    </SortableTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pagination.paginatedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="p-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 shrink-0">
                            {getActionIcon(item.action)}
                          </div>
                          <span className="text-xs font-bold text-slate-900">
                            {item.action}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-top whitespace-nowrap">
                        {item.grievanceNumber ? (
                          <span className="font-mono text-[13px] font-medium text-slate-900 dark:text-slate-200">
                            {item.grievanceNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <p className="text-xs text-slate-700 leading-relaxed max-w-md">
                          {item.details}
                        </p>
                      </td>
                      <td className="p-4 align-top whitespace-nowrap">
                        <span className="text-xs text-slate-700 font-medium">
                          {item.actor || "-"}
                        </span>
                      </td>
                      <td className="p-4 align-top whitespace-nowrap">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          {item.relativeTime ||
                            new Date(item.timestamp).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              pageSize={pagination.pageSize}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              pageSizeOptions={pagination.pageSizeOptions}
              itemLabel="activity logs"
            />
          </>
        )}
      </div>
    </div>
  );
}
