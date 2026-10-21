import { Skeleton } from "@/components/ui/skeleton";

export default function AdminGrievancesLoading() {
  return (
    <div className="relative flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      {/* Table Toolbar / Filters Skeleton */}
      <div className="shrink-0 border-b border-slate-100 px-5 py-3.5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-60" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Table Structure Skeleton */}
      <div className="flex-1 min-h-0 overflow-x-auto custom-scrollbar flex flex-col">
        <div className="min-w-[2080px] flex-1 min-h-0 flex flex-col">
          {/* Header Skeleton */}
          <div className="h-10 bg-slate-50/80 border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-16" />
          </div>

          {/* Body Rows Skeleton */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                key={i}
                className="h-13 px-4 flex items-center justify-between animate-pulse"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-7 w-7 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="sticky bottom-0 z-10 shrink-0 mt-auto border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
