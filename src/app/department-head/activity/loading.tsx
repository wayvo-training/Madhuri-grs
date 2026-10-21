import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentHeadActivityLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-xs overflow-hidden">
      {/* 1. Header with Title and Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <Skeleton className="h-5 w-60" />
          <Skeleton className="h-3.5 w-80" />
        </div>
        <div className="flex-1 w-full lg:max-w-md">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* 2. Activity Feed Table Skeleton (6 Columns matching ActivityView) */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-3">
        <div className="h-11 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-48" />
        </div>

        <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              key={i}
              className="h-14 px-4 flex items-center justify-between animate-pulse"
            >
              {/* Timestamp */}
              <div className="space-y-1 w-28 shrink-0">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>

              {/* Grievance */}
              <Skeleton className="h-4 w-20 rounded" />

              {/* Actor */}
              <Skeleton className="h-3.5 w-24" />

              {/* Role */}
              <Skeleton className="h-5 w-20 rounded-full" />

              {/* Stage */}
              <Skeleton className="h-5 w-16 rounded-md" />

              {/* Details */}
              <Skeleton className="h-3.5 w-56 ml-auto" />
            </div>
          ))}
        </div>

        {/* 3. Pagination Footer */}
        <div className="h-12 border-t border-slate-100 dark:border-slate-800 px-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <Skeleton className="h-4 w-36" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
