import { Skeleton } from "@/components/ui/skeleton";

export function GrievanceTableSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-3">
      {/* 1. Header Strip Skeleton */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* 2. Table Frame Skeleton */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
        {/* Search & Filter Bar */}
        <div className="shrink-0 p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Table Header */}
        <div className="h-11 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3.5 w-12 ml-auto" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7].map((rowId) => (
            <div
              key={`table-row-${rowId}`}
              className="h-13 px-4 flex items-center justify-between"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-24 font-mono" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-60 max-w-full" />
              </div>
              <Skeleton className="h-7 w-20 rounded-lg ml-auto" />
            </div>
          ))}
        </div>

        {/* Table Pagination Footer Skeleton */}
        <div className="h-12 border-t border-slate-200 dark:border-slate-800 px-4 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <Skeleton className="h-3.5 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
