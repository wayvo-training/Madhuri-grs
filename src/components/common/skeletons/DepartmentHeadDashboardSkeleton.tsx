import { Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function DepartmentHeadDashboardSkeleton() {
  const attnRowKeys = [
    "dept-attn-1",
    "dept-attn-2",
    "dept-attn-3",
    "dept-attn-4",
    "dept-attn-5",
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2.5 sm:gap-3">
      {/* 1. Department Header Banner Skeleton */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 sm:px-5 sm:py-2.5 shadow-xs shrink-0">
        <div className="relative z-10 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 border border-teal-100 text-teal-700">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-40" />
                <span className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-2.5 font-semibold text-teal-800">
                  Primary Queue
                </span>
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Two Donut Pie Charts (Status & Priority Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 shrink-0">
        {/* Chart 1: Grievance Status Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden shadow-2xs h-auto sm:h-[235px]">
          <div className="px-5 pt-3.5 pb-0 shrink-0 space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-36" />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7 px-5 pt-1.5 pb-3 flex-1 min-h-0">
            <div className="shrink-0 w-36 h-36 sm:w-40 sm:h-40 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[18px] border-slate-100 dark:border-slate-800 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-[18px] border-t-teal-300 border-r-teal-200 border-b-transparent border-l-transparent animate-spin opacity-40" />
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-1 justify-center max-w-[220px]">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 2: Priority Distribution */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden shadow-2xs h-auto sm:h-[235px]">
          <div className="px-5 pt-3.5 pb-0 shrink-0 space-y-1">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7 px-5 pt-1.5 pb-3 flex-1 min-h-0">
            <div className="shrink-0 w-36 h-36 sm:w-40 sm:h-40 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[18px] border-slate-100 dark:border-slate-800 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-[18px] border-t-amber-300 border-r-amber-200 border-b-transparent border-l-transparent animate-spin opacity-40" />
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-1 justify-center max-w-[220px]">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Attention Required Panel Table Skeleton */}
      <div className="flex-1 flex flex-col min-h-[200px] rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Attention Required
            </h3>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              5
            </span>
            <span className="text-slate-300 hidden sm:inline">&bull;</span>
            <p className="text-xs text-slate-500 hidden sm:inline">
              Grievances requiring review or intervention
            </p>
          </div>
          <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>

        {/* 8-Column Table Skeleton Header matching AttentionRequiredPanel */}
        <div className="flex-1 min-h-[120px] rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col my-2.5">
          <div className="flex items-center gap-2 sm:gap-3 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
            <div className="w-24 sm:w-28 shrink-0">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Grievance ID
              </span>
            </div>
            <div className="flex-[1.4] min-w-0 pr-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Grievance
              </span>
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category
              </span>
            </div>
            <div className="w-16 sm:w-20 shrink-0">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Priority
              </span>
            </div>
            <div className="w-24 sm:w-28 shrink-0">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status
              </span>
            </div>
            <div className="w-26 sm:w-30 shrink-0 text-center">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                SLA Status
              </span>
            </div>
            <div className="flex-[0.9] min-w-0 hidden sm:block">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assigned To
              </span>
            </div>
            <div className="w-18 sm:w-20 shrink-0 text-center">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Action
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60">
            {attnRowKeys.map((attnId) => (
              <div
                key={attnId}
                className="flex items-center gap-2 sm:gap-3 w-full px-3 py-2.5 animate-pulse"
              >
                <div className="w-24 sm:w-28 shrink-0">
                  <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-700 rounded font-mono" />
                </div>
                <div className="flex-[1.4] min-w-0 pr-2 space-y-1">
                  <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="w-16 sm:w-20 shrink-0">
                  <div className="h-5 w-14 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="w-24 sm:w-28 shrink-0">
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="w-26 sm:w-30 shrink-0 flex justify-center">
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
                <div className="flex-[0.9] min-w-0 hidden sm:block">
                  <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
                <div className="w-18 sm:w-20 shrink-0 flex justify-center">
                  <div className="h-6 w-14 bg-slate-200 dark:bg-slate-700 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
