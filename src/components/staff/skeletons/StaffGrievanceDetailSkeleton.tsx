import { Skeleton } from "@/components/ui/skeleton";

export function StaffGrievanceDetailSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-4">
      {/* Back button */}
      <div className="shrink-0">
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Main Grievance Details Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-6 py-4 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-28 font-mono" />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3 pt-0.5">
            <div className="space-y-2 flex-1 max-w-2xl">
              <Skeleton className="h-7 w-96 max-w-full" />
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <Skeleton className="h-4 w-24" />
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 gap-6 shrink-0 h-12 overflow-x-auto">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>

        {/* Body Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Employee Profile Box */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>

          {/* Departments Involved Box */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-36" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>

          {/* Statement Box */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-6 py-3 shrink-0 flex items-center justify-between">
          <Skeleton className="h-4 w-44" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
