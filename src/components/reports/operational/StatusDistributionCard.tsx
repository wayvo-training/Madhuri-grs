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
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col h-full min-h-0 justify-between overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-3.5 sm:px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Grievance Status Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Operational lifecycle stages for{" "}
              {totalUniqueGrievances.toLocaleString()} unique cases
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3.5 sm:px-4 pb-3 sm:pb-3.5 pt-0 flex-1 min-h-0 flex flex-col justify-around">
        {statusDistribution.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No grievance records matching the selected period and filters.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 w-full flex-1">
            {/* Donut Chart with Center Total - Prominent, balanced size matching admin dashboard */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 relative shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={62}
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
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {totalUniqueGrievances.toLocaleString()}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                  Total
                </span>
              </div>
            </div>

            {/* Status Breakdown Legend & Counts */}
            <div className="w-full flex-1 max-w-xs space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
              {chartData.map((row) => (
                <div
                  key={row.rawStatus}
                  className="pt-1 pb-1 flex items-center justify-between gap-2 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-1.5 rounded transition-colors"
                >
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: row.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium">{row.status}</span>
                  </span>
                  <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap text-xs">
                    {row.count.toLocaleString()}{" "}
                    <span className="text-slate-400 dark:text-slate-500 font-normal text-[11px]">
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
