import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRolesLoading() {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col">
      {/* Header with Title and Create Action */}
      <div className="pt-5 sm:pt-6 px-5 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-3 w-80 mt-1" />
          </div>
          <Skeleton className="h-9 w-36 rounded-xl shrink-0" />
        </div>

        {/* Top-Level Tabs (Roles Matrix / Security Permissions) */}
        <div className="flex items-center gap-6 mt-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 py-3 border-b-2 border-teal-600">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
          <div className="flex items-center gap-2 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar Skeleton */}
      <div className="p-5 sm:p-6 pb-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Skeleton className="h-9 w-72 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Roles Table Skeleton */}
      <div className="px-5 sm:px-6 pb-6 flex-1 min-h-0 flex flex-col">
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="h-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-14" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                key={i}
                className="h-13 px-4 flex items-center justify-between animate-pulse"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-10" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-14 rounded" />
                  <Skeleton className="h-5 w-12 rounded" />
                </div>
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
