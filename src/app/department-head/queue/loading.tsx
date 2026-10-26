import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentHeadQueueLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
      {/* 1. Queue Filter Controls Bar */}
      <div className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="shrink-0 flex items-center gap-2">
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="flex-1 w-full md:max-w-xl">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* 2. Grievance Queue Table Skeleton (11 Columns matching QueueView) */}
      <div className="flex-1 min-h-0 overflow-x-auto custom-scrollbar flex flex-col">
        <div className="min-w-[1950px] flex-1 min-h-0 flex flex-col">
          <div className="h-11 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-14" />
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                key={i}
                className="h-14 px-4 flex items-center justify-between animate-pulse"
              >
                {/* ID */}
                <Skeleton className="h-4 w-16 rounded" />

                {/* Title / Description */}
                <div className="space-y-1 w-56 shrink-0">
                  <Skeleton className="h-3.5 w-44 rounded" />
                  <Skeleton className="h-2.5 w-28 rounded" />
                </div>

                {/* Category */}
                <Skeleton className="h-3.5 w-24 rounded" />

                {/* Subcategory */}
                <Skeleton className="h-3.5 w-20 rounded" />

                {/* Priority */}
                <Skeleton className="h-5 w-16 rounded-full" />

                {/* Status */}
                <Skeleton className="h-5 w-20 rounded-full" />

                {/* SLA Status */}
                <Skeleton className="h-5 w-24 rounded-full" />

                {/* Assigned Staff */}
                <Skeleton className="h-3.5 w-28 rounded" />

                {/* Submitter */}
                <Skeleton className="h-3.5 w-24 rounded" />

                {/* Submitted Date */}
                <Skeleton className="h-3.5 w-20 rounded" />

                {/* Actions */}
                <Skeleton className="h-7 w-8 rounded-md ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Pagination Footer */}
      <div className="h-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between shrink-0">
        <Skeleton className="h-4 w-36" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
