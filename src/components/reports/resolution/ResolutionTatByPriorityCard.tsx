"use client";

import { Timer } from "lucide-react";
import { PriorityBadge } from "@/components/dashboard/badges";
import type { PriorityTatItem } from "@/types/reports";

export interface ResolutionTatByPriorityCardProps {
  tatByPriority: PriorityTatItem[];
}

export function ResolutionTatByPriorityCard({
  tatByPriority,
}: ResolutionTatByPriorityCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-purple-600" />
            Turnaround Time (TAT) by Priority
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            End-to-end resolution duration and SLA outcomes for completed cases
            across priority tiers
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-medium text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-400">
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3 text-right">Total Cases</th>
              <th className="py-2.5 px-3 text-right">Closed Cases</th>
              <th className="py-2.5 px-3 text-right">Average TAT</th>
              <th className="py-2.5 px-3 text-right">Median TAT</th>
              <th className="py-2.5 px-3 text-right">SLA Compliant</th>
              <th className="py-2.5 px-3 text-right">SLA Breached</th>
              <th className="py-2.5 px-3 text-right">Compliance Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tatByPriority.map((row) => (
              <tr
                key={row.priority}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                  <PriorityBadge priority={row.priority} />
                </td>
                <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                  {row.totalGrievances.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-900 dark:text-slate-100">
                  {row.closedCount.toLocaleString()}
                  {row.missingClosedAtCount > 0 && (
                    <span
                      className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal"
                      title={`${row.missingClosedAtCount} closed record(s) excluded due to missing closure timestamp`}
                    >
                      ({row.closedWithValidTat} eval)
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-200">
                  {row.closedWithValidTat > 0 ? (
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {row.avgResolutionTimeDays}d{" "}
                      <span className="text-[11px] font-normal text-slate-400">
                        ({row.avgResolutionTimeHours}h)
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No closures</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-200">
                  {row.closedWithValidTat > 0 ? (
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {row.medianResolutionTimeDays}d{" "}
                      <span className="text-[11px] font-normal text-slate-400">
                        ({row.medianResolutionTimeHours}h)
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No closures</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                  {row.slaCompliantCount.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-rose-600 dark:text-rose-400">
                  {row.slaBreachedCount.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                      row.slaComplianceRate >= 90
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : row.slaComplianceRate >= 75
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    }`}
                  >
                    {row.slaCompliantCount + row.slaBreachedCount > 0
                      ? `${row.slaComplianceRate}%`
                      : "N/A"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
