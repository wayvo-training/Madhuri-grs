import { Skeleton } from "@/components/ui/skeleton";

/**
 * 1. Case Header Skeleton
 * Shared header across End-User, Staff, and Department Head case views.
 */
export function CaseHeaderSkeleton({
  showBack = true,
  showActions = true,
}: {
  showBack?: boolean;
  showActions?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          {showBack && (
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          )}

          {/* Grievance Ticket Code & Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Skeleton className="h-7 w-48 sm:w-60 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          {/* Category / Subcategory / Department breadcrumbs */}
          <div className="flex items-center gap-2 pt-0.5">
            <Skeleton className="h-3.5 w-24" />
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Skeleton className="h-3.5 w-28" />
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Skeleton className="h-3.5 w-36" />
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 2. Case Overview / Statement Skeleton
 * Submitter card, statement/description paragraph lines, and metadata cards.
 */
export function CaseOverviewSkeleton() {
  const metaKeys = ["meta-card-dept", "meta-card-sla", "meta-card-submitted"];
  const lineKeys = ["stmt-line-1", "stmt-line-2", "stmt-line-3", "stmt-line-4"];

  return (
    <div className="space-y-4">
      {/* Submitter & Metadata grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {metaKeys.map((key) => (
          <div
            key={key}
            className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Grievance Statement / Description block */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3.5 w-20" />
        </div>
        <div className="space-y-2 pt-1">
          {lineKeys.map((key, idx) => (
            <Skeleton
              key={key}
              className={`h-3.5 ${
                idx === 0
                  ? "w-full"
                  : idx === 1
                    ? "w-11/12"
                    : idx === 2
                      ? "w-4/5"
                      : "w-2/3"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Case Progress & SLA Tab Skeleton
 * Mirrors the actual Progress & SLA layout:
 * - Horizontal 5-stage progress stepper
 * - SLA consumption progress card
 * - Assigned officer profile card
 */
export function CaseProgressSlaSkeleton() {
  const steps = [
    { key: "sla-step-1", label: "Submitted" },
    { key: "sla-step-2", label: "Assigned" },
    { key: "sla-step-3", label: "Investigation" },
    { key: "sla-step-4", label: "Resolution" },
    { key: "sla-step-5", label: "Closed" },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Horizontal Stage Stepper Card */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Horizontal Track & Steps */}
        <div className="relative flex items-center justify-between px-4 sm:px-8 pt-2 pb-6">
          {/* Horizontal Track line */}
          <div className="absolute left-8 right-8 top-5 h-0.5 bg-slate-200 dark:bg-slate-800" />
          {steps.map((st) => (
            <div
              key={st.key}
              className="relative z-10 flex flex-col items-center"
            >
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="absolute top-8 w-20 flex justify-center">
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Grid: SLA Metric Card & Assigned Officer Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SLA Consumption Card */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-12" />
            </div>
            {/* Progress bar */}
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between text-xs pt-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>

        {/* Assigned Officer Card */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Progress Event Notes */}
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
        <Skeleton className="h-3.5 w-36" />
        <div className="space-y-2 pt-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Case Timeline / Activity Tracking Skeleton
 * Step-by-step vertical progress nodes with status circles, timestamps, and detail lines.
 */
export function CaseTimelineSkeleton({
  stepsCount = 4,
}: {
  stepsCount?: number;
}) {
  const stepIds = Array.from(
    { length: stepsCount },
    (_, idx) => `timeline-step-${idx + 1}`,
  );

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {stepIds.map((id, index) => (
          <div key={id} className="relative flex items-start gap-4">
            {/* Step dot */}
            <div className="absolute -left-6 top-1">
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>

            {/* Step content */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-36 sm:w-48" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3.5 w-4/5" />
              {index === 0 && (
                <div className="pt-1">
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 4. Case Documents / Proofs Skeleton
 * Responsive grid of document attachments with file icon, title, size, and download button.
 */
export function CaseDocumentsSkeleton({ count = 3 }: { count?: number }) {
  const docIds = Array.from(
    { length: count },
    (_, idx) => `doc-item-${idx + 1}`,
  );

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {docIds.map((id) => (
          <div
            key={id}
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 gap-3"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="space-y-1 min-w-0 flex-1">
                <Skeleton className="h-3.5 w-28 truncate" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-7 w-7 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 5. Case Notes / Discussion Skeleton
 * Internal discussion or notes bubbles with author avatars and timestamp.
 */
export function CaseNotesSkeleton({ count = 3 }: { count?: number }) {
  const noteIds = Array.from(
    { length: count },
    (_, idx) => `note-bubble-${idx + 1}`,
  );

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>

      <div className="space-y-4">
        {noteIds.map((id, index) => (
          <div
            key={id}
            className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton
              className={`h-3.5 ${index % 2 === 0 ? "w-11/12" : "w-4/5"}`}
            />
            {index === 0 && <Skeleton className="h-3.5 w-2/3" />}
          </div>
        ))}
      </div>

      {/* Note composer input skeleton */}
      <div className="pt-2">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="flex justify-end mt-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
