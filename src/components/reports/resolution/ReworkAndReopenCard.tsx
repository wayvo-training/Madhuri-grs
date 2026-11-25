"use client";

import { AlertCircle, History, RotateCcw, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReworkAndReopenSummary } from "@/types/reports";

export interface ReworkAndReopenCardProps {
  reworkAndReopen: ReworkAndReopenSummary;
}

export function ReworkAndReopenCard({
  reworkAndReopen,
}: ReworkAndReopenCardProps) {
  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <CardHeader className="pb-1.5 pt-2 px-3 sm:px-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Reopening &amp; Resolution Rework Analysis
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Grievances with repeated resolution cycles, supervisor rejections,
              and post-closure reopenings
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-3.5 pb-2.5 pt-0 space-y-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Reopened Unique Grievances */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-1.5 sm:p-2 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-semibold">Reopened Cases</span>
              <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {reworkAndReopen.reopenedGrievancesCount.toLocaleString()}
            </div>
            <p className="mt-0.5 text-[9.5px] text-slate-500 dark:text-slate-400">
              {reworkAndReopen.reopenedRate}% of volume reopened at least once
            </p>
          </div>

          {/* Total Reopen Cycles */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-1.5 sm:p-2 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-semibold">
                Total Reopen Cycles
              </span>
              <History className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {reworkAndReopen.totalReopenAttempts.toLocaleString()}
            </div>
            <p className="mt-0.5 text-[9.5px] text-slate-500 dark:text-slate-400">
              Aggregate reopening attempts across all cases
            </p>
          </div>

          {/* Supervisor Rework Rejections */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-1.5 sm:p-2 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-semibold">
                Review Rejections
              </span>
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
            </div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {reworkAndReopen.reworkReviewRejectionsCount.toLocaleString()}
            </div>
            <p className="mt-0.5 text-[9.5px] text-slate-500 dark:text-slate-400">
              Resolutions returned to staff for revision
            </p>
          </div>

          {/* Multi-Resolution Submissions */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-1.5 sm:p-2 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-semibold">Multiple Drafts</span>
              <AlertCircle className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="mt-1 text-lg font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {reworkAndReopen.multiResolutionGrievancesCount.toLocaleString()}
            </div>
            <p className="mt-0.5 text-[9.5px] text-slate-500 dark:text-slate-400">
              Cases with &gt;1 resolution draft submitted
            </p>
          </div>
        </div>

        {/* Distribution Breakdown */}
        {reworkAndReopen.reopenDistribution.length > 0 && (
          <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reopening Frequency Distribution
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {reworkAndReopen.reopenDistribution.map((dist) => (
                <div
                  key={dist.reopenCount}
                  className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-800"
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
      </CardContent>
    </Card>
  );
}
