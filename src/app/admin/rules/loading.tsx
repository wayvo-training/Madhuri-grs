import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRulesLoading() {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="pt-5 sm:pt-6 px-5 sm:px-6 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-9 w-44 rounded-lg shrink-0" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 px-5 sm:px-6 mt-2 overflow-x-auto no-scrollbar shrink-0">
        {[
          { label: "Routing Rules", active: true },
          { label: "Priority Rules", active: false },
          { label: "SLA Policies", active: false },
          { label: "Reopen Policy", active: false },
        ].map((tab) => (
          <div
            key={tab.label}
            className={`flex items-center gap-2 px-2 py-3 border-b-2 ${
              tab.active ? "border-[#0F766E]" : "border-transparent"
            }`}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
        ))}
      </div>

      {/* Filter Toolbar with AdvancedTableSearch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 px-5 py-3 sm:px-6 shrink-0">
        <div className="flex-1 w-full lg:w-3/5">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* Rules Table Skeleton (Columns matching RoutingRulesView) */}
      <div className="flex-1 min-h-0 overflow-x-auto custom-scrollbar flex flex-col">
        <div className="min-w-[1550px] flex-1 flex flex-col">
          <div className="h-11 bg-slate-50/60 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-14" />
          </div>
          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                key={i}
                className="h-12 px-4 flex items-center justify-between animate-pulse"
              >
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
