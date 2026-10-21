import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentHeadKnowledgeLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* 1. Top Header Banner with Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-3.5 w-96" />
          </div>
          <div className="w-full lg:w-80">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* 2. Review Status Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* 3. Knowledge Cards Grid (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between h-[200px] shadow-2xs space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
