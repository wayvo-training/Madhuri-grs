"use client";

import type * as React from "react";
import { Cell, Label, Pie, PieChart } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function formatStatusLabel(status: string) {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress";
    case "ASSIGNED":
      return "Assigned";
    case "UNDER_REVIEW":
      return "Under Review";
    case "REOPENED":
      return "Reopened";
    case "UNASSIGNED":
      return "Unassigned";
    case "CLOSED":
      return "Closed";
    default:
      return status;
  }
}

export function formatPriorityLabel(priority: string) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export function formatSLALabel(sla: string) {
  switch (sla) {
    case "ON_TRACK":
      return "On Track";
    case "AT_RISK":
      return "At Risk";
    case "BREACHED":
      return "Breached";
    default:
      return sla;
  }
}

interface DashboardPieChartCardProps {
  title: string;
  description: string;
  // data contains the actual count for each category.
  data: { name: string; value: number; fill: string; description?: string }[];
  // fullLegendData is optional: use this if you want the legend to show 0-count items that don't appear in the pie
  fullLegendData?: {
    name: string;
    value: number;
    fill: string;
    description?: string;
  }[];
  config: ChartConfig;
  centerValue: number;
  centerLabelTop?: string;
  centerLabelBottom?: string;
  isLoading?: boolean;
  extraHeaderElement?: React.ReactNode;
}

export function DashboardPieChartCard({
  title,
  description,
  data,
  fullLegendData,
  config,
  centerValue,
  centerLabelTop = "ACTIVE",
  centerLabelBottom = "GRIEVANCES",
  isLoading = false,
  extraHeaderElement,
}: DashboardPieChartCardProps) {
  // Only render non-zero slices in the donut
  const pieData = data.filter((d) => d.value > 0);
  // Render legend from fullLegendData if provided, otherwise from all data
  const legendData = fullLegendData || data;
  const hasData = pieData.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden shadow-2xs h-auto sm:h-[270px]">
      <div className="p-4 sm:p-5 pb-1 flex justify-between items-center gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        {extraHeaderElement}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4 py-2 flex-1">
        {isLoading ? (
          <div className="shrink-0 w-36 h-36 sm:w-42 sm:h-42 relative mx-auto flex items-center justify-center">
            {/* Donut chart loading skeleton */}
            <div className="absolute inset-0 rounded-full border-[18px] border-slate-100 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-[18px] border-t-slate-200 border-r-slate-200 border-b-transparent border-l-transparent animate-spin opacity-50"></div>
          </div>
        ) : hasData ? (
          <div className="shrink-0 w-36 h-36 sm:w-42 sm:h-42 relative mx-auto">
            <ChartContainer
              config={config}
              className="w-full h-full pb-0 [&_.recharts-pie-label-text]:fill-slate-700"
            >
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={70}
                  strokeWidth={0}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy - 8}
                              className="fill-slate-900 dark:fill-white text-2xl font-bold"
                            >
                              {centerValue}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy + 10}
                              className="fill-slate-500 dark:fill-slate-400 text-[9px] font-semibold tracking-wider uppercase"
                            >
                              {centerLabelTop}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy + 21}
                              className="fill-slate-500 dark:fill-slate-400 text-[9px] font-semibold tracking-wider uppercase"
                            >
                              {centerLabelBottom}
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                  {pieData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="shrink-0 w-36 h-36 sm:w-42 sm:h-42 relative mx-auto flex items-center justify-center rounded-full border-[18px] border-slate-50">
            <span className="text-xs font-medium text-slate-400">No data</span>
          </div>
        )}

        <div className="flex flex-col gap-2.5 w-full sm:w-auto sm:flex-1 justify-center max-w-[210px]">
          {legendData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-slate-800 text-xs leading-none">
                    {item.name}
                  </span>
                  {item.description && (
                    <span className="text-[11px] font-normal text-slate-500 mt-0.5 leading-snug">
                      {item.description}
                    </span>
                  )}
                </div>
              </div>
              <span className="font-bold text-slate-800 text-xs leading-none tabular-nums shrink-0">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
