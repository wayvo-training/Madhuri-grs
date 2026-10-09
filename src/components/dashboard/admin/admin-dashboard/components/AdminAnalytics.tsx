"use client";

import {
  ArrowRight,
  Building2,
  ClipboardList,
  Landmark,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ChartConfig } from "@/components/ui/chart";
import { DashboardPieChartCard } from "@/components/ui/dashboard-pie-chart";
import {
  PRIORITY_COLORS,
  SLA_COLORS,
  STATUS_COLORS,
} from "@/lib/constants/chart-colors";
import type { DashboardDepartmentSummary } from "@/types/admin/dashboard";

export function DepartmentWorkloadCard({
  departments,
}: {
  departments: DashboardDepartmentSummary[];
}) {
  const sortedDepts = [...departments]
    .sort((a, b) => b.grievance_count - a.grievance_count)
    .slice(0, 5);
  const totalGrievances = departments.reduce(
    (acc, d) => acc + d.grievance_count,
    0,
  );

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-orange-500",
    "bg-slate-300",
  ];
  const textColors = [
    "text-blue-500",
    "text-purple-500",
    "text-emerald-500",
    "text-orange-500",
    "text-slate-500",
  ];
  const icons = [Users, Landmark, Building2, ClipboardList, ShieldCheck];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white flex flex-col h-full overflow-hidden shadow-2xs">
      <div className="p-5 sm:p-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">
              Department Workload
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Active grievances by department
            </p>
          </div>
        </div>
        <Link
          href="/admin/departments"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="px-5 sm:px-6 py-6 flex flex-col gap-5 flex-1 justify-start">
        {sortedDepts.map((dept, index) => {
          const percentage =
            totalGrievances > 0
              ? Math.round((dept.grievance_count / totalGrievances) * 100)
              : 0;
          const Icon = icons[index % icons.length];
          const colorClass = colors[index % colors.length];
          const textClass = textColors[index % textColors.length];

          return (
            <div
              key={dept.department_id}
              className="flex items-center gap-4 text-sm font-semibold"
            >
              <div className="flex items-center gap-3 w-40 shrink-0">
                <Icon className={`h-4.5 w-4.5 ${textClass}`} />
                <span className="text-slate-700 truncate">
                  {dept.department_name}
                </span>
              </div>

              <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden flex">
                {percentage > 0 && (
                  <div
                    className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                )}
              </div>

              <div className="flex items-center gap-1.5 w-16 justify-end tabular-nums shrink-0">
                <span className="text-slate-800">{dept.grievance_count}</span>
                <span className="text-slate-400 text-xs">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminAnalyticsGrid({
  pieCharts,
}: {
  pieCharts: {
    statusData: {
      name: string;
      value: number;
      fill: string;
      description: string;
    }[];
    priorityData: {
      name: string;
      value: number;
      fill: string;
      description: string;
    }[];
    slaData: {
      name: string;
      value: number;
      fill: string;
      description: string;
    }[];
    totalActive: number;
    totalPriority: number;
    totalSla: number;
  };
}) {
  const statusConfig = {
    inProgress: { label: "In Progress", color: STATUS_COLORS.IN_PROGRESS },
    assigned: { label: "Assigned", color: STATUS_COLORS.ASSIGNED },
    unassigned: { label: "Unassigned", color: STATUS_COLORS.UNASSIGNED },
    reopened: { label: "Reopened", color: STATUS_COLORS.REOPENED },
  } satisfies ChartConfig;

  const priorityConfig = {
    critical: { label: "Critical", color: PRIORITY_COLORS.CRITICAL },
    high: { label: "High", color: PRIORITY_COLORS.HIGH },
    medium: { label: "Medium", color: PRIORITY_COLORS.MEDIUM },
    low: { label: "Low", color: PRIORITY_COLORS.LOW },
  } satisfies ChartConfig;

  const slaConfig = {
    onTrack: { label: "On Track", color: SLA_COLORS.ON_TRACK },
    atRisk: { label: "At Risk", color: SLA_COLORS.AT_RISK },
    breached: { label: "Breached", color: SLA_COLORS.BREACHED },
  } satisfies ChartConfig;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <DashboardPieChartCard
        title="Grievance Status Breakdown"
        description="Active grievances by current status"
        data={pieCharts.statusData}
        config={statusConfig}
        centerValue={pieCharts.totalActive}
      />
      <DashboardPieChartCard
        title="Priority Distribution"
        description="Active grievances by priority level"
        data={pieCharts.priorityData}
        config={priorityConfig}
        centerValue={pieCharts.totalPriority}
      />
      <DashboardPieChartCard
        title="SLA Status"
        description="Active grievances by SLA compliance"
        data={pieCharts.slaData}
        config={slaConfig}
        centerValue={pieCharts.totalSla}
      />
    </div>
  );
}
