import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRolesLoading() {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col">
      {/* Header with Title and Create Action */}
      <div className="pt-5 sm:pt-6 px-5 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-3.5 w-80 mt-1" />
          </div>
          <Skeleton className="h-9 w-36 rounded-xl shrink-0" />
        </div>

        {/* Top-Level Tabs (Roles Matrix / Security Permissions) */}
        <div className="flex items-center gap-6 mt-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 px-1 py-3 border-b-2 border-[#0F766E]">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
          <div className="flex items-center gap-2 px-1 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-6 rounded-full" />
          </div>
        </div>
      </div>

      {/* RolesTab Content */}
      <div className="p-5 sm:p-6">
        {/* Full-width AdvancedTableSearch */}
        <div className="mb-5">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>

        {/* Roles Table (5 Columns matching RolesTab) */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
          <div className="h-11 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-4 flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-12" />
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                key={i}
                className="h-12 px-4 flex items-center justify-between animate-pulse"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-52" />
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="h-12 border-t border-slate-100 dark:border-slate-800 px-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <Skeleton className="h-4 w-32" />
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
  );
}
