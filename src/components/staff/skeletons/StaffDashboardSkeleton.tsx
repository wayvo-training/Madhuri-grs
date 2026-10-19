import { Skeleton } from "@/components/ui/skeleton";

export function StaffDashboardSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      {/* 1. Welcome & Role Strip Skeleton */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <span className="text-xs text-slate-300 dark:text-slate-700">
              •
            </span>
            <Skeleton className="h-3.5 w-56" />
          </div>
          <Skeleton className="h-3 w-72 mt-1.5" />
        </div>
      </div>

      {/* 2. Staff Pie Charts Skeleton (Horizontal 2-Card Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 shrink-0">
        {/* Card 1: My Grievance Status */}
        <div className="rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden shadow-2xs h-auto sm:h-[235px]">
          <div className="px-5 pt-3.5 pb-0 shrink-0">
            <Skeleton className="h-4 w-40 mb-1" />
            <Skeleton className="h-3 w-56" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7 px-5 pt-1.5 pb-3 flex-1 min-h-0">
            {/* Donut Chart Skeleton */}
            <div className="shrink-0 w-36 h-36 sm:w-40 sm:h-40 relative flex items-center justify-center">
              <Skeleton className="w-full h-full rounded-full" />
              <div className="absolute inset-7 sm:inset-8 rounded-full bg-white flex flex-col items-center justify-center gap-1">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-2 w-14" />
              </div>
            </div>

            {/* Legend Skeleton */}
            <div className="flex flex-col justify-center gap-2 flex-1 max-w-[200px] min-w-0">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 py-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: My SLA Overview */}
        <div className="rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden shadow-2xs h-auto sm:h-[235px]">
          <div className="px-5 pt-3.5 pb-0 shrink-0">
            <Skeleton className="h-4 w-36 mb-1" />
            <Skeleton className="h-3 w-52" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7 px-5 pt-1.5 pb-3 flex-1 min-h-0">
            {/* Donut Chart Skeleton */}
            <div className="shrink-0 w-36 h-36 sm:w-40 sm:h-40 relative flex items-center justify-center">
              <Skeleton className="w-full h-full rounded-full" />
              <div className="absolute inset-7 sm:inset-8 rounded-full bg-white flex flex-col items-center justify-center gap-1">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-2 w-14" />
              </div>
            </div>

            {/* Legend Skeleton */}
            <div className="flex flex-col justify-center gap-2 flex-1 max-w-[200px] min-w-0">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 py-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Grievances Requiring Immediate Attention Table Skeleton */}
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-3.5 space-y-2 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3.5 w-60" />
          </div>
          <Skeleton className="h-3.5 w-28" />
        </div>

        {/* Table Frame Skeleton */}
        <div className="flex-1 min-h-0 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="h-10 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>

          {/* Table Rows Skeleton */}
          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                key={i}
                className="h-12 px-4 flex items-center justify-between"
              >
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-6 rounded-md ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
