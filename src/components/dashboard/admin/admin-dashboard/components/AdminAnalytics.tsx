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
import type { DashboardDepartmentSummary } from "@/types/admin/dashboard";
import { GrievanceStatusCard } from "./GrievanceStatusCard";
import { PriorityDistributionCard } from "./PriorityDistributionCard";
import { SlaPerformanceCard } from "./SlaPerformanceCard";

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
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden shadow-2xs">
      <div className="p-3 sm:p-3.5 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <ClipboardList className="h-3 w-3" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Department Workload
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Active grievances by department
            </p>
          </div>
        </div>
        <Link
          href="/admin/departments"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition"
        >
          <span>View All</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col gap-2.5 sm:gap-3 overflow-y-auto custom-scrollbar">
        {sortedDepts.map((dept, index) => {
          const percentage =
            totalGrievances > 0
              ? Math.round((dept.grievance_count / totalGrievances) * 100)
              : 0;
          const Icon = icons[index % icons.length];
          const colorClass = colors[index % colors.length];
          const textClass = textColors[index % textColors.length];

          return (
            <div key={dept.department_id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`h-3.5 w-3.5 ${textClass} shrink-0`} />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-xs">
                    {dept.department_name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 tabular-nums text-slate-800 dark:text-slate-100 shrink-0">
                  <span className="font-bold text-xs">
                    {dept.grievance_count}
                  </span>
                  <span className="text-slate-400 dark:text-slate-400 text-[11px] font-medium">
                    ({percentage}%)
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                {percentage > 0 && (
                  <div
                    className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Solid Summary Footer matching table pagination height */}
      <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-3.5 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-medium text-[11px] sm:text-xs">
            {departments.length}{" "}
            {departments.length === 1 ? "Department" : "Departments"} Monitored
          </span>
        </div>
        <div className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300">
          Total:{" "}
          <span className="font-bold text-slate-900 dark:text-white tabular-nums">
            {totalGrievances}
          </span>{" "}
          active
        </div>
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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-2.5 items-stretch">
      <GrievanceStatusCard
        data={pieCharts.statusData}
        totalActive={pieCharts.totalActive}
      />
      <PriorityDistributionCard
        data={pieCharts.priorityData}
        totalPriority={pieCharts.totalPriority}
      />
      <SlaPerformanceCard
        data={pieCharts.slaData}
        totalSla={pieCharts.totalSla}
      />
    </div>
  );
}
