import { Skeleton } from "@/components/ui/skeleton";

export function StaffProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Profile Card Skeleton */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-64" />
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>

        {/* Workload Capacity Section Skeleton */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-80 max-w-full" />
            </div>

            <div className="space-y-1 sm:text-right">
              <Skeleton className="h-3.5 w-32 sm:ml-auto" />
              <Skeleton className="h-3.5 w-36 sm:ml-auto" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
          </div>

          {/* Policy Callout Skeleton */}
          <div className="p-3.5 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60">
            <Skeleton className="h-3.5 w-full mb-1" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
        </div>
      </div>

      {/* Supervisor & Performance Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Supervisor Card Skeleton */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
          <Skeleton className="h-4 w-44" />
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        {/* Operational Statistics Skeleton */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2"
              >
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
