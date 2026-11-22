"use client";

import { Building2, Info } from "lucide-react";
import type { DepartmentProcessingTimeItem } from "@/types/reports";

export interface DepartmentProcessingTimeCardProps {
  departments: DepartmentProcessingTimeItem[];
}

export function DepartmentProcessingTimeCard({
  departments,
}: DepartmentProcessingTimeCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-blue-600" />
            Departmental Processing Time & Workload
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Department-level processing durations, distinguishing Primary lead
            processing from Supporting contributor processing
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-medium text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-400">
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3 text-right">Involved Cases</th>
              <th className="py-2.5 px-3 text-right">Completed Stages</th>
              <th className="py-2.5 px-3 text-right">Blocked (Waiting)</th>
              <th className="py-2.5 px-3 text-right">Pending</th>
              <th className="py-2.5 px-3 text-right">Avg Duration</th>
              <th className="py-2.5 px-3 text-right">Median Duration</th>
              <th className="py-2.5 px-3 text-right">Primary Avg</th>
              <th className="py-2.5 px-3 text-right">Supporting Avg</th>
              <th className="py-2.5 px-3 text-right">SLA Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {departments.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="py-6 text-center text-slate-400 italic"
                >
                  No departmental records found for selected period and filters
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr
                  key={dept.departmentId}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                    {dept.departmentName}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                    {dept.totalInvolved.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {dept.completedWithValidDurationCount.toLocaleString()}
                    {dept.missingActivationCount > 0 && (
                      <span
                        className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal"
                        title={`${dept.missingActivationCount} completed stages excluded due to missing activation timestamp`}
                      >
                        (+{dept.missingActivationCount} excl)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-purple-600 dark:text-purple-400">
                    {dept.blockedStagesCount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-amber-600 dark:text-amber-400">
                    {dept.pendingStagesCount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-200">
                    {dept.completedWithValidDurationCount > 0 ? (
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {dept.avgProcessingTimeDays}d{" "}
                        <span className="text-[11px] font-normal text-slate-400">
                          ({dept.avgProcessingTimeHours}h)
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-200">
                    {dept.completedWithValidDurationCount > 0 ? (
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {dept.medianProcessingTimeDays}d{" "}
                        <span className="text-[11px] font-normal text-slate-400">
                          ({dept.medianProcessingTimeHours}h)
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                    {dept.primaryCount > 0 &&
                    dept.avgPrimaryProcessingHours > 0 ? (
                      `${(dept.avgPrimaryProcessingHours / 24).toFixed(1)}d (${dept.avgPrimaryProcessingHours}h)`
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                    {dept.supportingCount > 0 &&
                    dept.avgSupportingProcessingHours > 0 ? (
                      `${(dept.avgSupportingProcessingHours / 24).toFixed(1)}d (${dept.avgSupportingProcessingHours}h)`
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        dept.slaComplianceRate >= 90
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : dept.slaComplianceRate >= 75
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                      }`}
                    >
                      {dept.completedStagesCount > 0
                        ? `${dept.slaComplianceRate}%`
                        : "N/A"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3.5 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-1.5">
          <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
          <span>
            <strong>Sequential Processing Rule:</strong> For sequential
            workflows, duration is calculated from the department&apos;s actual{" "}
            <code>activated_at</code> timestamp. Time spent waiting while{" "}
            <strong>Blocked</strong> for prerequisite departments is strictly
            excluded from processing time.
          </span>
        </div>
        <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 pl-5.5">
          <span>
            <strong>Data Quality Guard:</strong> Completed records with missing
            activation timestamps are excluded from duration metrics rather than
            fabricating a duration using grievance creation time.
          </span>
        </div>
      </div>
    </div>
  );
}
