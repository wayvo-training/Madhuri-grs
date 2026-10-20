import { Skeleton } from "@/components/ui/skeleton";

export function DepartmentHeadDashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2.5 sm:gap-3">
      {/* 1. View Switcher Bar Skeleton */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-44 rounded-xl" />
      </div>

      {/* 2. Stat / Metrics Cards (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
        {[1, 2, 3, 4].map((statId) => (
          <div
            key={`dept-stat-${statId}`}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 sm:py-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-6 rounded-lg" />
            </div>
            <Skeleton className="mt-2 h-7 w-14" />
          </div>
        ))}
      </div>

      {/* 3. Middle Section: Attention Required & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-3 flex-1 min-h-0">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
            {[1, 2, 3, 4].map((attnId) => (
              <div
                key={`dept-attn-${attnId}`}
                className="py-3 flex items-center justify-between"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-24 font-mono" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-64 max-w-full" />
                </div>
                <Skeleton className="h-7 w-20 rounded-lg ml-auto" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map((barId) => (
              <div key={`dept-bar-${barId}`} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
