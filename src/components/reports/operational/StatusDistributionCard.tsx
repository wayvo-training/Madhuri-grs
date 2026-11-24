"use client";

import { Activity } from "lucide-react";
import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StatusDistributionItem } from "@/types/reports";
import { ReportChartTooltip } from "./ChartTooltip";

export interface StatusDistributionCardProps {
  statusDistribution: StatusDistributionItem[];
  totalUniqueGrievances: number;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  SUBMITTED: "#0284C7", // Sky
  ROUTED: "#9333EA", // Purple
  AWAITING_ROUTING: "#D97706", // Amber
  AWAITING_ASSIGNMENT: "#9333EA", // Purple
  PENDING_ASSIGNMENT: "#9333EA", // Purple
  ASSIGNED: "#0D9488", // Teal
  IN_PROGRESS: "#2563EB", // Blue
  INVESTIGATION: "#2563EB", // Blue
  PENDING_INFO: "#D97706", // Amber
  AWAITING_INFORMATION: "#D97706", // Amber
  WAITING_ON_USER: "#D97706", // Amber
  UNDER_REVIEW: "#7C3AED", // Violet
  RESOLUTION_PENDING_APPROVAL: "#7C3AED", // Violet
  REWORK: "#EA580C", // Orange
  RESOLVED: "#059669", // Emerald
  COMPLETED: "#059669", // Emerald
  CLOSED: "#64748B", // Slate
  REOPEN_REVIEW: "#E11D48", // Rose
  REOPEN_REQUESTED: "#E11D48", // Rose
  REOPENED: "#E11D48", // Rose
  ESCALATED: "#B45309", // Amber-Red
};

function getStatusColor(status: string): string {
  const upper = status.toUpperCase();
  return STATUS_COLOR_MAP[upper] || "#64748B";
}

function formatStatusLabel(status: string): string {
  const upper = status.toUpperCase();
  if (upper === "REOPEN_REVIEW" || upper === "REOPEN_REQUESTED") {
    return "Reopen Pending";
  }
  if (upper === "RESOLUTION_PENDING_APPROVAL") {
    return "Resolution Pending Approval";
  }
  if (upper === "AWAITING_INFORMATION" || upper === "PENDING_INFO") {
    return "Awaiting Information";
  }
  if (upper === "IN_PROGRESS" || upper === "INVESTIGATION") {
    return "In Progress";
  }
  if (upper === "REWORK") {
    return "Rework Requested";
  }

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function StatusDistributionCard({
  statusDistribution,
  totalUniqueGrievances,
}: StatusDistributionCardProps) {
  const chartData = statusDistribution.map((item) => ({
    status: formatStatusLabel(item.status),
    rawStatus: item.status,
    count: item.count,
    percentage: item.percentage,
    color: getStatusColor(item.status),
  }));

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col">
      <CardHeader className="pb-1 pt-2.5 px-3 sm:px-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div>
            <CardTitle className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
              Grievance Status Distribution
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 dark:text-slate-400">
              Operational lifecycle stages for{" "}
              {totalUniqueGrievances.toLocaleString()} unique cases
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-3.5 pb-2.5 pt-0 flex-1 flex flex-col justify-center">
        {statusDistribution.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No grievance records matching the selected period and filters.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 w-full py-0.5">
            {/* Donut Chart with Center Total */}
            <div className="w-28 h-28 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={46}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.rawStatus} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<ReportChartTooltip valueSuffix=" cases" />}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {totalUniqueGrievances.toLocaleString()}
                </span>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400">
                  Total
                </span>
              </div>
            </div>

            {/* Status Breakdown Legend & Counts */}
            <div className="w-full flex-1 max-w-xs space-y-0.5 divide-y divide-slate-100 dark:divide-slate-800">
              {chartData.map((row) => (
                <div
                  key={row.rawStatus}
                  className="pt-0.5 pb-0.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-1 rounded transition-colors"
                >
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 min-w-0">
                    <span
                      className="w-2 h-2 rounded-xs shrink-0"
                      style={{ backgroundColor: row.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium">{row.status}</span>
                  </span>
                  <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap text-xs">
                    {row.count.toLocaleString()}{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-normal text-[10.5px]">
                      ({row.percentage.toFixed(1)}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
