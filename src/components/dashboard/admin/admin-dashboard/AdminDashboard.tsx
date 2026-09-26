import type { AdminDashboardProps } from "@/types/admin/dashboard";
import { DepartmentDirectorySummary } from "./components/DepartmentDirectorySummary";
import { ExecutiveMetricCards } from "./components/ExecutiveMetricCards";
import { RecentGrievancesTable } from "./components/RecentGrievancesTable";
import { RoutingExceptionsBanner } from "./components/RoutingExceptionsBanner";

export function AdminDashboard({
  totalGrievances,
  activeGrievances,
  atRiskSlaCount,
  escalatedCount,
  closedCount,
  resolutionRate,
  routingExceptionsCount,
  departments,
  recentGrievances,
}: AdminDashboardProps) {
  return (
    <div className="space-y-7">
      {/* 1. TOP METRIC CARDS ROW */}
      <ExecutiveMetricCards
        totalGrievances={totalGrievances}
        activeGrievances={activeGrievances}
        atRiskSlaCount={atRiskSlaCount}
        escalatedCount={escalatedCount}
        closedCount={closedCount}
        resolutionRate={resolutionRate}
      />

      {/* 2. ACTION REQUIRED / OPERATIONAL HEALTH BANNER */}
      <RoutingExceptionsBanner
        routingExceptionsCount={routingExceptionsCount}
      />

      {/* 3. EXECUTIVE WORKSPACE: Workload Breakdown & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <DepartmentDirectorySummary departments={departments} />
        <RecentGrievancesTable recentGrievances={recentGrievances} />
      </div>
    </div>
  );
}
