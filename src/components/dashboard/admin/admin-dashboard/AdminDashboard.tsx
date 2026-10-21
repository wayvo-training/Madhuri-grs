import type { AdminDashboardProps } from "@/types/admin/dashboard";
import {
  AdminAnalyticsGrid,
  DepartmentWorkloadCard,
} from "./components/AdminAnalytics";
import { RecentGrievancesTable } from "./components/RecentGrievancesTable";
import { RoutingExceptionsBanner } from "./components/RoutingExceptionsBanner";

export function AdminDashboard({
  routingExceptionsCount,
  departments,
  recentGrievances,
  pieCharts,
}: AdminDashboardProps) {
  return (
    <div className="flex-1 h-full min-h-0 flex flex-col gap-2.5 sm:gap-3 overflow-hidden">
      {/* 3. EXECUTIVE WORKSPACE: Pie Charts */}
      <AdminAnalyticsGrid pieCharts={pieCharts} />

      {/* 2. ACTION REQUIRED / OPERATIONAL HEALTH BANNER */}
      <RoutingExceptionsBanner
        routingExceptionsCount={routingExceptionsCount}
      />

      {/* 4. RECENT ACTIVITY & WORKLOAD */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2.5 sm:gap-3 items-stretch flex-1 min-h-0">
        <div className="xl:col-span-2 h-full min-h-0">
          <RecentGrievancesTable recentGrievances={recentGrievances} />
        </div>
        <div className="xl:col-span-1 h-full min-h-0">
          <DepartmentWorkloadCard departments={departments} />
        </div>
      </div>
    </div>
  );
}
