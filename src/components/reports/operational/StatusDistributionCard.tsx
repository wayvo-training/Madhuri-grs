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
  SUBMITTED: "#2563EB", // Blue
  ROUTED: "#0EA5E9", // Cyan
  AWAITING_ROUTING: "#0284C7", // Sky
  IN_PROGRESS: "#38BDF8", // Light Sky
  INVESTIGATION: "#38BDF8", // Light Sky
  PENDING_INFO: "#F59E0B", // Amber
  AWAITING_INFORMATION: "#F59E0B", // Amber
  RESOLUTION_PENDING_APPROVAL: "#6366F1", // Indigo
  REWORK: "#D97706", // Amber
  RESOLVED: "#0D9488", // Teal
  CLOSED: "#475569", // Slate
  REOPEN_REVIEW: "#EC4899", // Pink / Rose
  REOPEN_REQUESTED: "#EC4899", // Pink / Rose
  REOPENED: "#DC2626", // Red
  ESCALATED: "#7C3AED", // Purple
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
      <CardHeader className="pb-1.5 pt-3.5 px-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Grievance Status Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Operational lifecycle stages for{" "}
              {totalUniqueGrievances.toLocaleString()} unique cases
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 flex-1 flex flex-col justify-center">
        {statusDistribution.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No grievance records matching the selected period and filters.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full py-1">
            {/* Donut Chart with Center Total */}
            <div className="w-38 h-38 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={58}
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
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Total
                </span>
              </div>
            </div>

            {/* Status Breakdown Legend & Counts */}
            <div className="w-full flex-1 max-w-xs space-y-0.5 divide-y divide-slate-100 dark:divide-slate-800">
              {chartData.map((row) => (
                <div
                  key={row.rawStatus}
                  className="pt-1 pb-0.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-1 rounded transition-colors"
                >
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: row.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium">{row.status}</span>
                  </span>
                  <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100 font-semibold whitespace-nowrap">
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
