import { DashboardShell } from "@/components/dashboard/shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAuditLogsLoading() {
  return (
    <DashboardShell
      userRole="ADMIN"
      userName="Loading..."
      designation="System Administrator"
      departmentName="Central Administration"
      title="System Audit Trail & Compliance Log"
      subtitle="Immutable security audit trail, administrative interventions & system activity log"
      mainClassName="overflow-y-auto lg:overflow-hidden flex flex-col"
    >
      <div className="flex flex-col flex-1 min-h-0 space-y-4">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Search & Filter Toolbar Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <Skeleton className="h-9 w-72 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>

        {/* Audit Log Table Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                key={i}
                className="h-[52px] px-4 flex items-center justify-between animate-pulse"
              >
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-52" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
