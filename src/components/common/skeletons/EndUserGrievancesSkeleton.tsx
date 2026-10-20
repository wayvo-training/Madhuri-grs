import { Skeleton } from "@/components/ui/skeleton";

export function EndUserGrievancesSkeleton() {
  return (
    <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden flex flex-col">
      {/* 1. Top Bar: Search Bar on Left + "+ File New Grievance" Button on Right */}
      <div className="p-3.5 sm:p-4 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0 w-full lg:w-1/2">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <Skeleton className="h-10 w-44 rounded-xl shrink-0" />
        </div>
      </div>

      {/* 2. Table Container */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Table Header Row matching GrievanceList column widths: 14%, 28%, 18%, 11%, 11%, 11%, 7% */}
        <div className="bg-slate-50/95 dark:bg-slate-800/95 border-b border-slate-200 dark:border-slate-700 py-3 px-5 flex items-center shrink-0">
          <div className="w-[14%]">
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="w-[28%] px-2">
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="w-[18%] px-2">
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="w-[11%] px-2">
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="w-[11%] px-2">
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="w-[11%] px-2">
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="w-[7%] text-right flex justify-end">
            <Skeleton className="h-3.5 w-12" />
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
            <div
              key={row}
              className="py-3 px-5 flex items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
            >
              <div className="w-[14%]">
                <Skeleton className="h-3.5 w-24 font-mono" />
              </div>
              <div className="w-[28%] px-2">
                <Skeleton className="h-4 w-52 max-w-full" />
              </div>
              <div className="w-[18%] px-2">
                <Skeleton className="h-3.5 w-28" />
              </div>
              <div className="w-[11%] px-2">
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="w-[11%] px-2">
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="w-[11%] px-2">
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="w-[7%] flex justify-end">
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* 3. Bottom Pagination Bar */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 flex items-center justify-between">
          <Skeleton className="h-3.5 w-36" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
