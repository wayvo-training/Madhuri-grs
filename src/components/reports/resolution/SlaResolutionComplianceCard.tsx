"use client";

import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  FileCheck,
  History,
  Info,
  ShieldCheck,
} from "lucide-react";
import type { SlaResolutionComplianceSummary } from "@/types/reports";

export interface SlaResolutionComplianceCardProps {
  slaCompliance: SlaResolutionComplianceSummary;
}

export function SlaResolutionComplianceCard({
  slaCompliance,
}: SlaResolutionComplianceCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            SLA Compliance & Breach Analysis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Authoritative SLA attainment metrics derived from verified SLA
            tracking records
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Metric 1: Overall Compliance Rate */}
        <div className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Overall Compliance Rate
            </span>
            <FileCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {slaCompliance.compliancePercentage}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {slaCompliance.compliantCount} of {slaCompliance.totalEvaluated}{" "}
              closed cases compliant
            </p>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden dark:bg-slate-700">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, slaCompliance.compliancePercentage))}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: Compliant Closures */}
        <div className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              On-Time Closures
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {slaCompliance.compliantCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Final resolution delivered on or before authoritative due date
            </p>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden dark:bg-slate-700">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{
                width: `${slaCompliance.totalEvaluated > 0 ? (slaCompliance.compliantCount / slaCompliance.totalEvaluated) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 3: SLA Breaches */}
        <div className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              SLA Breaches
            </span>
            <AlertOctagon className="h-4 w-4 text-rose-600" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {slaCompliance.breachedCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {slaCompliance.breachPercentage}% of evaluated closed cases
              breached SLA
            </p>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden dark:bg-slate-700">
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, slaCompliance.breachPercentage))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Cycle-Level SLA Breakdown */}
      {slaCompliance.byCycleType && slaCompliance.byCycleType.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-blue-600" />
            SLA Cycle Breakdown (Initial vs Rework vs Reopened Cycles)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-medium text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="py-2.5 px-3">SLA Cycle Stage</th>
                  <th className="py-2.5 px-3 text-right">Completed Cycles</th>
                  <th className="py-2.5 px-3 text-right">Compliant</th>
                  <th className="py-2.5 px-3 text-right">Breached</th>
                  <th className="py-2.5 px-3 text-right">Avg Paused Time</th>
                  <th className="py-2.5 px-3 text-right">Compliance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {slaCompliance.byCycleType.map((cycle) => (
                  <tr
                    key={cycle.cycleType}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                      {cycle.label}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                      {cycle.totalCompletedCycles.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {cycle.compliantCycles.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-rose-600 dark:text-rose-400">
                      {cycle.breachedCycles.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                      {cycle.avgPausedMinutes > 0 ? (
                        <span className="flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {Math.round(cycle.avgPausedMinutes)} mins
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">0 mins</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          cycle.complianceRate >= 90
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : cycle.complianceRate >= 75
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                        }`}
                      >
                        {cycle.totalCompletedCycles > 0
                          ? `${cycle.complianceRate}%`
                          : "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
        <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
        <span>
          <strong>SLA Compliance Denominator:</strong> Strictly encompasses
          closed grievances evaluated against an active SLA target deadline.
          Incomplete/unresolved cycles are excluded from completed compliance
          calculations. Pause durations (e.g. during customer clarification or
          supervisor approval) extend the effective deadline in accordance with
          the SLA engine pause logs.
        </span>
      </div>
    </div>
  );
}
