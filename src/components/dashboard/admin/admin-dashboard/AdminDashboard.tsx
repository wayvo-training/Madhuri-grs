import type { AdminDashboardProps } from "@/types/admin/dashboard";

import { RecentGrievancesTable } from "./components/RecentGrievancesTable";
import { RoutingExceptionsBanner } from "./components/RoutingExceptionsBanner";
import { AdminAnalyticsGrid, DepartmentWorkloadCard } from "./components/AdminAnalytics";

export function AdminDashboard({
  routingExceptionsCount,
  departments,
  recentGrievances,
  pieCharts,
}: AdminDashboardProps) {
  return (
    <div className="space-y-7">
      {/* 2. ACTION REQUIRED / OPERATIONAL HEALTH BANNER */}
      <RoutingExceptionsBanner
        routingExceptionsCount={routingExceptionsCount}
      />

      {/* 3. EXECUTIVE WORKSPACE: Pie Charts */}
      <AdminAnalyticsGrid pieCharts={pieCharts} />

      {/* 4. RECENT ACTIVITY & WORKLOAD */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2">
          <RecentGrievancesTable recentGrievances={recentGrievances} />
        </div>
        <div className="xl:col-span-1 h-full">
          <DepartmentWorkloadCard departments={departments} />
        </div>
      </div>
    </div>
  );
}
