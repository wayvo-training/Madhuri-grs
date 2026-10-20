import { DashboardShell } from "@/components/dashboard/shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function EndUserSubmitLoading() {
  return (
    <DashboardShell
      userRole="END_USER"
      userName="Loading..."
      designation="Employee"
      departmentName="General Public"
      title="File a New Grievance"
      subtitle="Submit a workplace grievance for review and resolution."
    >
      <div className="w-full max-w-5xl lg:max-w-6xl mx-auto flex-1 min-h-0 h-full flex flex-col py-2 sm:py-3">
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-80" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
