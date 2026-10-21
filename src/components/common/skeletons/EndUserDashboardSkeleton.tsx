import { Skeleton } from "@/components/ui/skeleton";

export function EndUserDashboardSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 sm:gap-3">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
        {[1, 2, 3, 4].map((statId) => (
          <div
            key={`user-stat-${statId}`}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 sm:py-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-6 rounded-lg" />
            </div>
            <Skeleton className="mt-2 h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Quick Actions (2 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      </div>

      {/* Grievance Table / List Card */}
      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-44 rounded-lg" />
        </div>
        <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
          {[1, 2, 3, 4, 5].map((rowId) => (
            <div
              key={`user-recent-${rowId}`}
              className="p-4 flex items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24 font-mono" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64 max-w-full" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
        <div className="h-12 border-t border-slate-100 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
