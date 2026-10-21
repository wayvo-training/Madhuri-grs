import { DashboardShell } from "@/components/dashboard/shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDepartmentsLoading() {
  return (
    <DashboardShell
      userRole="ADMIN"
      userName="Loading..."
      designation="System Administrator"
      departmentName="Central Administration"
      title="Department & Organization Management"
      subtitle="Enterprise divisions, workload distribution, and resolution mandates"
      mainClassName="overflow-y-auto lg:overflow-hidden flex flex-col"
    >
      <div className="flex flex-col flex-1 min-h-0 gap-2.5 sm:gap-3">
        {/* Compact Metric Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-2xs"
            >
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <Skeleton className="h-2.5 w-20" />
                <div className="flex items-baseline gap-1.5">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Department Table Container Skeleton */}
        <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          {/* Header & Action Button */}
          <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-3 w-72 mt-1" />
            </div>
            <Skeleton className="h-9 w-38 rounded-xl shrink-0" />
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 sm:p-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Skeleton className="h-9 w-72 rounded-xl" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>

          {/* Table Header & Rows Skeleton */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="h-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
              <Skeleton className="h-3.5 w-8" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-12" />
              <Skeleton className="h-3.5 w-12" />
              <Skeleton className="h-3.5 w-14" />
            </div>
            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  key={i}
                  className="h-13 px-4 flex items-center justify-between animate-pulse"
                >
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Footer Skeleton */}
          <div className="h-12 border-t border-slate-100 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <Skeleton className="h-3 w-40" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
