import { Skeleton } from "@/components/ui/skeleton";

export function StaffMessagesSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
      {/* Conversations Sidebar Skeleton */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 bg-slate-50/50 dark:bg-slate-900">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
        <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              key={i}
              className="p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24 font-mono" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2.5 w-52" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Pane Skeleton */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950">
        {/* Chat Header */}
        <div className="h-14 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Message Bubbles Skeleton */}
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          <div className="flex items-start gap-2.5 max-w-md">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <Skeleton className="h-16 w-64 rounded-2xl" />
          </div>
          <div className="flex items-start justify-end gap-2.5 ml-auto max-w-md">
            <Skeleton className="h-12 w-56 rounded-2xl" />
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
          </div>
          <div className="flex items-start gap-2.5 max-w-md">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <Skeleton className="h-20 w-72 rounded-2xl" />
          </div>
        </div>

        {/* Message Input Skeleton */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
