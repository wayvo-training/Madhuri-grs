import { Skeleton } from "@/components/ui/skeleton";

export function KnowledgeArticleCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 shadow-2xs space-y-3">
      {/* Top Header: Title, Badges & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4.5 w-64 sm:w-80 rounded" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-72 sm:w-96 rounded" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
          <Skeleton className="h-7 w-18 rounded-xl" />
          <Skeleton className="h-7 w-16 rounded-xl" />
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
      </div>

      {/* Problem Pattern Box */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-28 rounded" />
        <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-4/5 rounded" />
        </div>
      </div>

      {/* Footer Tags & Timestamp */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </div>
  );
}

export function KnowledgeBaseSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4 shrink-0">
        <div className="space-y-1">
          <Skeleton className="h-5 w-64 rounded" />
          <Skeleton className="h-3.5 w-96 max-w-full rounded" />
        </div>

        {/* Status Tabs and Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-24 rounded-lg" />
          </div>

          <div className="flex-1 sm:max-w-xs">
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* 2. Articles Container with Internal Scrolling */}
      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden flex flex-col">
        {/* Container Header */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-xs shrink-0">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-56 rounded hidden sm:block" />
        </div>

        {/* Articles List Skeleton */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <KnowledgeArticleCardSkeleton key={`kb-skel-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
