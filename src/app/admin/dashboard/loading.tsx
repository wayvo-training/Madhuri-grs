import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="flex-1 h-full min-h-0 flex flex-col gap-2.5 sm:gap-3 overflow-hidden">
      {/* 1. OVERVIEW ANALYTICS CARDS SKELETONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-3 items-stretch">
        {/* Card 1: Grievance Status Breakdown (Donut + Legend) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden shadow-2xs p-3 sm:p-3.5">
          <div>
            <Skeleton className="h-4 w-44 mb-1" />
            <Skeleton className="h-3 w-36" />
          </div>

          <div className="flex items-center justify-between gap-3 sm:gap-4 flex-1 px-1 pt-1 pb-1">
            <div className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 relative flex items-center justify-center">
              <Skeleton className="w-full h-full rounded-full" />
            </div>
            <div className="flex flex-col justify-center gap-1.5 flex-1 max-w-[180px] min-w-0">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 py-1"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3.5 w-5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Priority Distribution (Horizontal Progress Bars) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden shadow-2xs p-3 sm:p-3.5">
          <div>
            <Skeleton className="h-4 w-36 mb-1" />
            <Skeleton className="h-3 w-40" />
          </div>

          <div className="flex flex-col justify-between flex-1 pt-2 pb-0.5 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1 py-0.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: SLA Performance (Compliance Box + Segmented Bar + 3 Stat Tiles) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden shadow-2xs p-3 sm:p-3.5">
          <div className="flex items-start justify-between">
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
          </div>

          <div className="flex flex-col justify-between flex-1 pt-2 pb-0.5 gap-1.5">
            {/* Compliance Box */}
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-2 flex justify-between items-center">
              <div>
                <Skeleton className="h-2.5 w-24 mb-1" />
                <Skeleton className="h-4 w-14" />
              </div>
              <div className="text-right">
                <Skeleton className="h-3.5 w-14 mb-0.5 ml-auto" />
                <Skeleton className="h-2.5 w-20 ml-auto" />
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between pt-0.5">
                <Skeleton className="h-2.5 w-8" />
                <Skeleton className="h-2.5 w-8" />
              </div>
            </div>

            {/* 3 Status Tiles */}
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-100 dark:border-slate-800 p-1 sm:p-1.5 flex flex-col justify-between min-h-9"
                >
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-1.5 w-1.5 rounded-full" />
                    <Skeleton className="h-2.5 w-10" />
                  </div>
                  <Skeleton className="h-3.5 w-6 my-0.5" />
                  <Skeleton className="h-2 w-14" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ROUTING EXCEPTIONS BANNER SKELETON */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 px-3.5 py-2">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-64 sm:w-80" />
        </div>
        <Skeleton className="h-3 w-20 rounded" />
      </div>

      {/* 3. RECENT ACTIVITY & WORKLOAD SKELETONS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2.5 sm:gap-3 items-stretch flex-1 min-h-0">
        {/* Recent Grievances Table Skeleton */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-3.5 shadow-xs flex flex-col h-full">
          {/* Table Card Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <Skeleton className="h-4 w-36 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-3.5 w-24 rounded" />
          </div>

          {/* Table Content */}
          <div className="mt-2 flex-1 min-h-0 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 bg-slate-50/80 dark:bg-slate-800/50 py-2 px-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <Skeleton className="col-span-4 h-3.5 w-20" />
              <Skeleton className="col-span-4 h-3.5 w-20" />
              <Skeleton className="col-span-2 h-3.5 w-12" />
              <Skeleton className="col-span-2 h-3.5 w-12" />
            </div>
            {/* Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 min-h-0 overflow-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 py-2 px-3 items-center"
                >
                  <Skeleton className="col-span-4 h-3.5 w-24" />
                  <Skeleton className="col-span-4 h-3.5 w-28" />
                  <Skeleton className="col-span-2 h-5 w-14 rounded-full" />
                  <Skeleton className="col-span-2 h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="shrink-0 flex justify-between items-center py-2 px-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Skeleton className="h-3 w-28" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-12 rounded" />
                <Skeleton className="h-5 w-12 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Department Workload Card Skeleton */}
        <div className="xl:col-span-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden shadow-2xs">
          {/* Card Header */}
          <div className="p-3 sm:p-3.5 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-lg shrink-0" />
              <div>
                <Skeleton className="h-3.5 w-32 mb-1" />
                <Skeleton className="h-2.5 w-40" />
              </div>
            </div>
            <Skeleton className="h-3 w-14" />
          </div>

          {/* Department Rows */}
          <div className="p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col gap-2.5 sm:gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5 rounded shrink-0" />
                    <Skeleton className="h-3.5 w-28" />
                  </div>
                  <Skeleton className="w-12 h-3.5" />
                </div>
                <Skeleton className="w-full h-1.5 rounded-full" />
              </div>
            ))}
          </div>

          {/* Solid Summary Footer Skeleton matching loaded card */}
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-3.5 py-2 flex items-center justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
