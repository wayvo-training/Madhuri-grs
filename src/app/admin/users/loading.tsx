import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Top Metrics Cards Skeleton (4 compact cards matching UserMetricCards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-2xs"
          >
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <Skeleton className="h-2.5 w-16" />
              <div className="flex items-baseline gap-1.5">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Users Directory Container Skeleton */}
      <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-xs">
        {/* Header & AdvancedTableSearch Toolbar */}
        <div className="shrink-0 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-3.5 w-80 mt-1" />
            </div>
            <Skeleton className="h-9 w-32 rounded-xl shrink-0" />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-0.5">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <Skeleton className="h-4 w-32 shrink-0 ml-0 sm:ml-3" />
          </div>
        </div>

        {/* Users Table Skeleton (7 Columns matching UserTable) */}
        <div className="flex-1 min-h-0 mt-2.5 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
          <div className="h-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                key={i}
                className="h-[52px] px-4 flex items-center justify-between animate-pulse"
              >
                {/* User avatar + name/email */}
                <div className="flex items-center gap-2.5 w-48 shrink-0">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <div className="space-y-1 min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-32" />
                  </div>
                </div>

                {/* Employee code */}
                <Skeleton className="h-5 w-20 rounded-md" />

                {/* Role badge */}
                <Skeleton className="h-5 w-24 rounded-full" />

                {/* Department */}
                <Skeleton className="h-4 w-28" />

                {/* Status */}
                <Skeleton className="h-5 w-16 rounded-md" />

                {/* Grievances */}
                <Skeleton className="h-3.5 w-28" />

                {/* Actions */}
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="shrink-0 pt-2.5 flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
