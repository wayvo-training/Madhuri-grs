"use client";

import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  FileCheck,
  History,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SlaResolutionComplianceSummary } from "@/types/reports";

export interface SlaResolutionComplianceCardProps {
  slaCompliance: SlaResolutionComplianceSummary;
}

export function SlaResolutionComplianceCard({
  slaCompliance,
}: SlaResolutionComplianceCardProps) {
  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <CardHeader className="pb-1.5 pt-2 px-3 sm:px-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              SLA Compliance &amp; Breach Analysis
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Authoritative SLA attainment metrics derived from verified SLA
              tracking records
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-3.5 pb-2 pt-0 space-y-2">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {/* Metric 1: Overall Compliance Rate */}
          <div className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-1.5 sm:p-2 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Overall Compliance Rate
              </span>
              <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="my-1">
              <div className="text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
                {slaCompliance.compliancePercentage}%
              </div>
              <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                {slaCompliance.compliantCount} of {slaCompliance.totalEvaluated}{" "}
                closed cases compliant
              </p>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden dark:bg-slate-700">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, slaCompliance.compliancePercentage))}%`,
                }}
              />
            </div>
          </div>

          {/* Metric 2: Compliant Closures */}
          <div className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-1.5 sm:p-2 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                On-Time Closures
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="my-1">
              <div className="text-lg font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                {slaCompliance.compliantCount.toLocaleString()}
              </div>
              <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                Final resolution delivered on or before authoritative due date
              </p>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden dark:bg-slate-700">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{
                  width: `${slaCompliance.totalEvaluated > 0 ? (slaCompliance.compliantCount / slaCompliance.totalEvaluated) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Metric 3: SLA Breaches */}
          <div className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-1.5 sm:p-2 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                SLA Breaches
              </span>
              <AlertOctagon className="h-3.5 w-3.5 text-rose-600" />
            </div>
            <div className="my-1">
              <div className="text-lg font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400">
                {slaCompliance.breachedCount.toLocaleString()}
              </div>
              <p className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                {slaCompliance.breachPercentage}% of evaluated closed cases
                breached SLA
              </p>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden dark:bg-slate-700">
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
          <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-blue-600" />
              SLA Cycle Breakdown (Initial vs Rework vs Reopened Cycles)
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
              <div className="overflow-y-auto min-h-[140px] max-h-[175px] custom-scrollbar">
                <Table className="relative">
                  <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800/95 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-700">
                    <TableRow>
                      <TableHead className="py-1.5 px-2.5 sm:px-3 font-semibold text-xs text-slate-600 dark:text-slate-300">
                        SLA Cycle Stage
                      </TableHead>
                      <TableHead className="py-1.5 px-2.5 sm:px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300">
                        Completed Cycles
                      </TableHead>
                      <TableHead className="py-1.5 px-2.5 sm:px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300">
                        Compliant
                      </TableHead>
                      <TableHead className="py-1.5 px-2.5 sm:px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300">
                        Breached
                      </TableHead>
                      <TableHead className="py-1.5 px-2.5 sm:px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300">
                        Avg Paused Time
                      </TableHead>
                      <TableHead className="py-1.5 px-2.5 sm:px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300">
                        Compliance Rate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slaCompliance.byCycleType.map((cycle) => (
                      <TableRow
                        key={cycle.cycleType}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <TableCell className="py-1.5 px-2.5 sm:px-3 font-medium text-slate-900 dark:text-slate-100 text-xs">
                          {cycle.label}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 sm:px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300 text-xs">
                          {cycle.totalCompletedCycles.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 sm:px-3 text-right font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                          {cycle.compliantCycles.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 sm:px-3 text-right font-mono tabular-nums font-medium text-rose-600 dark:text-rose-400 text-xs">
                          {cycle.breachedCycles.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 sm:px-3 text-right text-slate-600 dark:text-slate-300 font-mono tabular-nums text-xs">
                          {cycle.avgPausedMinutes > 0 ? (
                            <span className="flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              {Math.round(cycle.avgPausedMinutes)} mins
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              0 mins
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 sm:px-3 text-right font-mono tabular-nums text-xs">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
