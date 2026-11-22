"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  RotateCcw,
  Timer,
} from "lucide-react";
import type { ResolutionOverviewSummary } from "@/types/reports";

export interface ResolutionOverviewCardsProps {
  overview: ResolutionOverviewSummary;
}

export function ResolutionOverviewCards({
  overview,
}: ResolutionOverviewCardsProps) {
  return (
    <div className="space-y-3">
      {overview.dataQualityExceptionsCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/80 px-3.5 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>Data Quality Notice:</strong> Identified{" "}
              <strong>{overview.dataQualityExceptionsCount}</strong> record(s)
              with missing closure or activation timestamps. These records were
              excluded from TAT duration calculations to prevent fabricating
              unverified durations.
            </span>
          </div>
          <span className="font-semibold text-amber-700 dark:text-amber-400 shrink-0">
            {overview.closedWithValidTat} of {overview.totalClosed} Closures
            Evaluated
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Total Resolution Submissions */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Submissions</span>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {overview.totalSubmissions.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Formal resolutions submitted
          </p>
        </div>

        {/* 2. Total Grievances Closed */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Grievances Closed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {overview.totalClosed.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {overview.closedWithValidTat} with valid closed_at
          </p>
        </div>

        {/* 3. Average Resolution Time (TAT) */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Average TAT</span>
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {overview.avgResolutionTimeDays > 0
              ? `${overview.avgResolutionTimeDays}d`
              : `${overview.avgResolutionTimeHours}h`}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {overview.avgResolutionTimeHours} hrs end-to-end
          </p>
        </div>

        {/* 4. Median Resolution Time (TAT) */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Median TAT</span>
            <Timer className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {overview.medianResolutionTimeDays > 0
              ? `${overview.medianResolutionTimeDays}d`
              : `${overview.medianResolutionTimeHours}h`}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {overview.medianResolutionTimeHours} hrs 50th percentile
          </p>
        </div>

        {/* 5. SLA Compliance Rate */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">SLA Compliance</span>
            <FileCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {overview.slaComplianceRate}%
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {overview.totalSlaBreaches} breach
            {overview.totalSlaBreaches === 1 ? "" : "es"} in evaluated
          </p>
        </div>

        {/* 6. Reopened & Rework Cases */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Reopen & Rework</span>
            <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {overview.reopenedGrievancesCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {overview.reworkCount} rework cycle
            {overview.reworkCount === 1 ? "" : "s"} ({overview.reopenedRate}%)
          </p>
        </div>
      </div>
    </div>
  );
}
