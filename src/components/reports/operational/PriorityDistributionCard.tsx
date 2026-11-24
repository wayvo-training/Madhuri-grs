"use client";

import { Flame } from "lucide-react";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import type { PriorityDistributionItem } from "@/types/reports";
import { ReportChartTooltip } from "./ChartTooltip";

export interface PriorityDistributionCardProps {
  priorityDistribution: PriorityDistributionItem[];
  totalUniqueGrievances: number;
}

const PRIORITY_COLOR_MAP: Record<string, string> = {
  CRITICAL: "#E11D48", // Rose
  HIGH: "#D97706", // Amber
  MEDIUM: "#2563EB", // Blue
  NORMAL: "#2563EB", // Blue
  LOW: "#059669", // Emerald
};

function getPriorityColor(priority: string): string {
  const upper = priority.toUpperCase();
  return PRIORITY_COLOR_MAP[upper] || "#64748B";
}

function formatPriorityLabel(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
}

export function PriorityDistributionCard({
  priorityDistribution,
  totalUniqueGrievances,
}: PriorityDistributionCardProps) {
  const chartData = priorityDistribution.map((item) => ({
    priority: formatPriorityLabel(item.priority),
    rawPriority: item.priority,
    count: item.count,
    percentage: item.percentage,
    color: getPriorityColor(item.priority),
  }));

  return (
    <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col h-full min-h-0 justify-between overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-3.5 sm:px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Grievance Priority Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Severity volume across {totalUniqueGrievances.toLocaleString()}{" "}
              unique cases
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3.5 sm:px-4 pb-3 sm:pb-3.5 pt-0 flex-1 min-h-0 flex flex-col justify-between">
        {priorityDistribution.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No priority data available for this selection.
          </div>
        ) : (
          <div className="flex flex-col justify-between h-full flex-1 min-h-0 space-y-2">
            {/* Bar Chart Container */}
            <div className="flex-1 min-h-[140px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E2E8F0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="priority"
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
                  <Bar
                    dataKey="count"
                    name="Cases"
                    barSize={28}
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.rawPriority} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Priority Metrics Breakdown Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
              {chartData.map((row) => (
                <div
                  key={row.rawPriority}
                  className="p-1.5 sm:p-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col gap-0.5"
                >
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: row.color }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold truncate text-xs">
                      {row.priority}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {row.count.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-mono">
                      {row.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
