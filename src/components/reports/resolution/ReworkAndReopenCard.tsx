"use client";

import { AlertCircle, History, RotateCcw, XCircle } from "lucide-react";
import type { ReworkAndReopenSummary } from "@/types/reports";

export interface ReworkAndReopenCardProps {
  reworkAndReopen: ReworkAndReopenSummary;
}

export function ReworkAndReopenCard({
  reworkAndReopen,
}: ReworkAndReopenCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <RotateCcw className="h-4 w-4 text-amber-600" />
            Reopening & Resolution Rework Analysis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Grievances with repeated resolution cycles, supervisor rejections,
            and post-closure reopenings
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Reopened Unique Grievances */}
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Reopened Cases</span>
            <RotateCcw className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {reworkAndReopen.reopenedGrievancesCount.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {reworkAndReopen.reopenedRate}% of volume reopened at least once
          </p>
        </div>

        {/* Total Reopen Cycles */}
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Total Reopen Cycles</span>
            <History className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {reworkAndReopen.totalReopenAttempts.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Aggregate reopening attempts across all cases
          </p>
        </div>

        {/* Supervisor Rework Rejections */}
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Review Rejections</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {reworkAndReopen.reworkReviewRejectionsCount.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Resolutions returned to staff for revision
          </p>
        </div>

        {/* Multi-Resolution Submissions */}
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Multiple Drafts</span>
            <AlertCircle className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {reworkAndReopen.multiResolutionGrievancesCount.toLocaleString()}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Cases with &gt;1 resolution draft submitted
          </p>
        </div>
      </div>

      {/* Distribution Breakdown */}
      {reworkAndReopen.reopenDistribution.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Reopening Frequency Distribution
          </h3>
          <div className="flex flex-wrap gap-2">
            {reworkAndReopen.reopenDistribution.map((dist) => (
              <div
                key={dist.reopenCount}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {dist.reopenCount}x Reopened:
                </span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  {dist.grievanceCount} case
                  {dist.grievanceCount === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
