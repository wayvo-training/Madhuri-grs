import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAuditLogsLoading() {
  return (
    <div className="space-y-6 flex flex-col flex-1 min-h-0">
      {/* 4 Metric Cards Skeleton matching AuditMetricCards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between h-[115px] sm:h-[120px] shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="mt-auto pt-1 flex items-center gap-1.5">
              <Skeleton className="h-1.5 w-1.5 rounded-full" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Observability & Audit Trail Container */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col">
        {/* Header & Tabs */}
        <div className="pt-5 sm:pt-6 px-5 sm:px-6">
          <Skeleton className="h-6 w-64" />

          {/* 6 Category Tabs Skeleton */}
          <div className="flex items-center gap-6 mt-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar pb-1">
            {[
              { label: "All Events", active: true },
              { label: "Access & Auth", active: false },
              { label: "Grievance Ops", active: false },
              { label: "System Config", active: false },
              { label: "Admin Actions", active: false },
              { label: "System Errors", active: false },
            ].map((tab) => (
              <div
                key={tab.label}
                className={`flex items-center gap-2 px-1 py-3 border-b-2 whitespace-nowrap ${
                  tab.active ? "border-[#0F766E]" : "border-transparent"
                }`}
              >
                <Skeleton className="h-4 w-4 rounded-sm" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>

          {/* Full-width AdvancedTableSearch Skeleton */}
          <div className="mt-4">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* Audit Log Table (6 Columns matching AuditLogTable) */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="h-11 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-16" />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  key={i}
                  className="h-14 px-6 flex items-center justify-between animate-pulse"
                >
                  {/* Timestamp */}
                  <div className="space-y-1 w-24 shrink-0">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-2 w-10" />
                  </div>

                  {/* Who (Actor & Identity) */}
                  <div className="flex items-center gap-2.5 w-48 shrink-0">
                    <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                    <div className="space-y-1 min-w-0 flex-1">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2 w-36" />
                    </div>
                  </div>

                  {/* Action / Event */}
                  <Skeleton className="h-5 w-28 rounded-md" />

                  {/* Category & Entity */}
                  <Skeleton className="h-3.5 w-24" />

                  {/* Source IP / Device */}
                  <div className="space-y-1 w-28 shrink-0">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-16" />
                  </div>

                  {/* Payload */}
                  <Skeleton className="h-6 w-16 rounded-md ml-auto" />
                </div>
              ))}
            </div>

            {/* Pagination Footer */}
            <div className="h-12 border-t border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
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
    </div>
  );
}
