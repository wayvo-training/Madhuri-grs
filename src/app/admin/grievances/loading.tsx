import { Skeleton } from "@/components/ui/skeleton";

export default function AdminGrievancesLoading() {
  return (
    <div className="relative flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      {/* Table Toolbar / Header with Live Queue Title and AdvancedTableSearch */}
      <div className="shrink-0 border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="shrink-0">
          <Skeleton className="h-6 w-64" />
        </div>

        <div className="flex-1 w-full xl:max-w-3xl">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>

      {/* Table Structure Skeleton (13 Columns matching GrievanceTableList) */}
      <div className="flex-1 min-h-0 overflow-x-auto custom-scrollbar flex flex-col">
        <div className="min-w-[2080px] flex-1 min-h-0 flex flex-col">
          {/* Header Skeleton */}
          <div className="h-11 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-12" />
          </div>

          {/* Body Rows Skeleton */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                key={i}
                className="h-12 px-4 flex items-center justify-between animate-pulse"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-7 w-7 rounded-lg ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="sticky bottom-0 z-10 shrink-0 mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 flex items-center justify-between">
        <Skeleton className="h-4 w-44" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
