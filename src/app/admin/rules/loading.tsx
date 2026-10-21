import { DashboardShell } from "@/components/dashboard/shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRulesLoading() {
  return (
    <DashboardShell
      userRole="ADMIN"
      userName="Loading..."
      designation="System Administrator"
      departmentName="Central Administration"
      title="Master Governance & Rules Engine"
      subtitle="Automated priority calculation, department routing, SLA compliance & simulation"
      mainClassName="overflow-y-auto lg:overflow-hidden flex flex-col"
    >
      <div className="flex flex-col flex-1 min-h-0 space-y-4">
        {/* Tabs Skeleton */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        {/* Toolbar & Add Action Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>

        {/* Rules Table Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                key={i}
                className="h-[52px] px-4 flex items-center justify-between animate-pulse"
              >
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-7 w-14 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
