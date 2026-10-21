import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-3">
      {/* 1. Summary Metrics Cards (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {[1, 2, 3, 4].map((metricId) => (
          <div
            key={`notif-card-${metricId}`}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-2xs flex items-center justify-between"
          >
            <div className="space-y-1.5 min-w-0">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-2 w-20" />
            </div>
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        ))}
      </div>

      {/* 2. Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 shrink-0">
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* 3. Search Bar */}
      <div className="shrink-0">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* 4. Notifications List Skeleton */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
        <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((itemId) => (
            <div
              key={`notif-item-${itemId}`}
              className="p-4 flex items-start gap-3.5"
            >
              <Skeleton className="h-9 w-9 rounded-full shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3.5 w-full max-w-xl" />
                <div className="flex items-center gap-3 pt-0.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="h-12 border-t border-slate-200 dark:border-slate-800 px-4 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <Skeleton className="h-3.5 w-36" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
