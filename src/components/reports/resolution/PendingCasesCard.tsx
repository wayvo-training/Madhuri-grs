"use client";

import { Hourglass } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import type { PendingCasesSummary } from "@/types/reports";

export interface PendingCasesCardProps {
  pendingCases: PendingCasesSummary;
}

export function PendingCasesCard({ pendingCases }: PendingCasesCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Hourglass className="h-4 w-4 text-amber-600" />
            Unresolved Grievances (Pending Cases)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Excluded from completed-resolution time calculations and tracked
            separately by active age
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Average Days Open:{" "}
          </span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {pendingCases.avgDaysOpen} days
          </span>
        </div>
      </div>

      {/* Age Distribution Buckets */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {pendingCases.ageBuckets.map((bucket) => (
          <div
            key={bucket.range}
            className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
          >
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {bucket.range}
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {bucket.count.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400">
                ({bucket.percentage}%)
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden dark:bg-slate-700">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, bucket.percentage))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Longest Standing Pending Cases Table */}
      {pendingCases.recentPendingCases.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-3.5 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
            Oldest Open Grievances Awaiting Completion
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-medium text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="py-2 px-3">Grievance #</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Age (Days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingCases.recentPendingCases.map((item) => (
                  <tr
                    key={item.grievanceId}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-2 px-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                      {item.grievanceNumber}
                    </td>
                    <td className="py-2 px-3 max-w-[200px] truncate font-medium text-slate-800 dark:text-slate-200">
                      {item.title}
                    </td>
                    <td className="py-2 px-3">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                      {item.departmentName}
                    </td>
                    <td className="py-2 px-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                      {item.daysOpen}d{" "}
                      <span className="text-[10px] font-normal text-slate-400">
                        ({item.hoursOpen}h)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
