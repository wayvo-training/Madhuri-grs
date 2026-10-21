import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentHeadWorkloadLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3">
      {/* 1. Team Capacity Metrics Banner Skeleton (4 Cards matching AdminMetricCard) */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between h-[115px] sm:h-[120px] shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="mt-auto pt-1 flex items-center gap-1.5">
              <Skeleton className="h-1.5 w-1.5 rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* 2. Staff Roster Table Container */}
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-xs overflow-hidden">
        {/* Header with Title and Search Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 shrink-0 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="shrink-0 space-y-1">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3.5 w-80" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col items-end gap-3 w-full">
            <Skeleton className="h-4 w-48" />
            <div className="w-full">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Staff Table (6 Columns matching StaffView) */}
        <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-2.5">
          <div className="h-11 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-16" />
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                key={i}
                className="h-14 px-4 flex items-center justify-between animate-pulse"
              >
                {/* Staff Member Avatar + Name */}
                <div className="flex items-center gap-3 w-56 shrink-0">
                  <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>

                {/* Status */}
                <Skeleton className="h-5 w-16 rounded-full" />

                {/* Staff ID */}
                <Skeleton className="h-4 w-16 rounded" />

                {/* Active Workload progress */}
                <div className="w-48 space-y-1.5 shrink-0">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>

                {/* Assigned Cases */}
                <Skeleton className="h-4 w-8" />

                {/* Actions */}
                <Skeleton className="h-7 w-16 rounded-lg ml-auto" />
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
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
    </div>
  );
}
