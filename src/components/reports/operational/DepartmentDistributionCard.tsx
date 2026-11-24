"use client";

import { Building2, Info } from "lucide-react";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DepartmentDistributionItem } from "@/types/reports";
import { ReportChartTooltip } from "./ChartTooltip";

export interface DepartmentDistributionCardProps {
  departmentDistribution: DepartmentDistributionItem[];
  totalUniqueGrievances: number;
}

function getShortDeptName(name: string): string {
  if (name.length <= 18) return name;
  const parts = name.split(" ");
  if (parts.length > 1) {
    return parts.map((p) => p[0]).join("") + " - " + parts[0];
  }
  return name.slice(0, 17) + "…";
}

export function DepartmentDistributionCard({
  departmentDistribution,
  totalUniqueGrievances,
}: DepartmentDistributionCardProps) {
  const totalInvolvements = departmentDistribution.reduce(
    (sum, d) => sum + d.totalInvolvement,
    0,
  );

  const chartData = departmentDistribution.map((item) => ({
    name: item.departmentName,
    shortName: getShortDeptName(item.departmentName),
    primaryCount: item.primaryCount,
    supportingCount: item.supportingCount,
    totalInvolvement: item.totalInvolvement,
    percentage: item.percentageOfTotal,
  }));

  return (
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col h-full min-h-0 justify-between overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-3.5 sm:px-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Department Workload Distribution
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Grievance routing by Primary and Supporting departmental roles
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
            <Info className="h-3 w-3 text-blue-500" />
            <span>
              Unique Cases:{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {totalUniqueGrievances}
              </strong>{" "}
              | Involvements:{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {totalInvolvements}
              </strong>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3.5 sm:px-4 pb-3 sm:pb-3.5 pt-0 flex-1 min-h-0 flex flex-col justify-between">
        {departmentDistribution.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No departmental assignments found for this selection.
          </div>
        ) : (
          <div className="flex flex-col justify-between h-full flex-1 min-h-0">
            {/* Workload Bar Chart */}
            <div className="flex-1 min-h-[220px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: -16, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fontSize: 11, fill: "#475569" }}
                    axisLine={{ stroke: "#CBD5E1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<ReportChartTooltip valueSuffix=" cases" />}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    iconType="square"
                    iconSize={9}
                  />
                  <Bar
                    dataKey="primaryCount"
                    name="Primary Department (Ownership)"
                    fill="#2563EB"
                    barSize={24}
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="supportingCount"
                    name="Supporting Involvement"
                    fill="#6366F1"
                    barSize={24}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
