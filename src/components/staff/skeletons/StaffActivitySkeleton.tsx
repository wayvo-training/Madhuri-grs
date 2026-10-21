import { Skeleton } from "@/components/ui/skeleton";

export function StaffActivitySkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-3">
      {/* 1. Header Strip Skeleton */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-3 w-64 mt-1.5" />
        </div>
      </div>

      {/* 2. Filter Toolbar Skeleton */}
      <div className="shrink-0 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* 3. Activity Table Skeleton */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="h-11 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              key={i}
              className="h-13 px-4 flex items-center justify-between"
            >
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-28 font-mono" />
              <Skeleton className="h-3.5 w-64" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3.5 w-20" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
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
