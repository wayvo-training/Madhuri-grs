import { DashboardShell } from "@/components/dashboard/shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <DashboardShell
      userRole="ADMIN"
      userName="Loading..."
      title="Admin Control Center"
      subtitle="Executive system oversight, operational health & enterprise governance"
    >
      <div className="space-y-7">
        {/* Banner Skeleton */}
        <Skeleton className="h-[76px] w-full rounded-xl" />

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white flex flex-col justify-between overflow-hidden shadow-2xs h-[290px] xl:h-[260px]">
              <div className="p-5 sm:p-6 pb-2">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex flex-col xl:flex-row items-center justify-between gap-6 px-5 sm:px-6 py-4 flex-1">
                <Skeleton className="w-32 h-32 rounded-full shrink-0 mx-auto xl:mx-0" />
                <div className="flex flex-col gap-3 flex-1 w-full xl:pl-2 justify-center">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
              <div className="mt-2 px-5 py-4 sm:px-6">
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
          <div className="xl:col-span-1 h-full">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
