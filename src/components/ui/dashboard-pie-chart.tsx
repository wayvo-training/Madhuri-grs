"use client";

import { cn } from "cn";
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

export interface DashboardPieChartItem {
  name: string;
  value: number;
  fill: string;
  description?: string;
  key?: string;
}

interface DashboardPieChartCardProps {
  title: string;
  description: string;
  // data contains the actual count for each category.
  data: DashboardPieChartItem[];
  // fullLegendData is optional: use this if you want the legend to show 0-count items that don't appear in the pie
  fullLegendData?: DashboardPieChartItem[];
  config: ChartConfig;
  centerValue: number;
  centerLabelTop?: string;
  centerLabelBottom?: string;
  isLoading?: boolean;
  extraHeaderElement?: React.ReactNode;
  className?: string;
  onItemClick?: (item: DashboardPieChartItem) => void;
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
  className,
  onItemClick,
}: DashboardPieChartCardProps) {
  // Only render non-zero slices in the donut
  const pieData = data.filter((d) => d.value > 0);
  // Render legend from fullLegendData if provided, otherwise from all data
  const legendData = fullLegendData || data;
  const hasData = pieData.length > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden shadow-2xs",
        className || "h-auto sm:h-[235px]",
      )}
    >
      <div className="px-5 pt-3.5 pb-0 flex justify-between items-center gap-3 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-800 leading-tight">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        </div>
        {extraHeaderElement}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7 px-5 pt-1.5 pb-3 flex-1 min-h-0">
        {isLoading ? (
          <div className="shrink-0 w-36 h-36 sm:w-40 sm:h-40 relative flex items-center justify-center">
            {/* Donut chart loading skeleton */}
            <div className="absolute inset-0 rounded-full border-[18px] border-slate-100 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-[18px] border-t-slate-200 border-r-slate-200 border-b-transparent border-l-transparent animate-spin opacity-50"></div>
          </div>
        ) : hasData ? (
          <div className="shrink-0 w-36 h-36 sm:w-40 sm:h-40 relative flex items-center justify-center">
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
                  innerRadius={55}
                  outerRadius={75}
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
                              y={viewBox.cy + 9}
                              className="fill-slate-500 dark:fill-slate-400 text-[9px] font-semibold tracking-wider uppercase"
                            >
                              {centerLabelTop}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy + 20}
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
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={entry.fill}
                      className={
                        onItemClick
                          ? "cursor-pointer hover:opacity-85 transition-opacity outline-none"
                          : undefined
                      }
                      onClick={() => onItemClick?.(entry)}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="shrink-0 w-36 h-36 sm:w-40 sm:h-40 relative flex items-center justify-center rounded-full border-[18px] border-slate-50">
            <span className="text-xs font-medium text-slate-400">No data</span>
          </div>
        )}

        <div className="flex flex-col gap-1 w-full sm:w-auto sm:flex-1 justify-center max-w-[220px]">
          {legendData.map((item) => {
            const isClickable = Boolean(onItemClick);
            const content = (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full shrink-0 transition-transform",
                      isClickable && "group-hover:scale-110",
                    )}
                    style={{ backgroundColor: item.fill }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span
                      className={cn(
                        "font-semibold text-slate-800 dark:text-slate-200 text-xs leading-none transition-colors",
                        isClickable &&
                          "group-hover:text-teal-700 dark:group-hover:text-teal-300",
                      )}
                    >
                      {item.name}
                    </span>
                    {item.description && (
                      <span className="text-[10.5px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "font-bold text-slate-800 dark:text-slate-200 text-xs leading-none tabular-nums shrink-0 px-1.5 py-0.5 rounded transition-colors",
                    isClickable &&
                      "group-hover:bg-teal-50 group-hover:text-teal-800 dark:group-hover:bg-teal-950/50 dark:group-hover:text-teal-300",
                  )}
                >
                  {item.value}
                </span>
              </>
            );

            if (isClickable) {
              return (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => onItemClick?.(item)}
                  className="flex items-center justify-between gap-2 py-1 px-1.5 -mx-1.5 rounded-md transition-all text-left select-none cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/60 active:scale-[0.98] group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 border-none bg-transparent w-full"
                >
                  {content}
                </button>
              );
            }

            return (
              <div
                key={item.name}
                className="flex items-center justify-between gap-2 py-1 px-1.5 -mx-1.5 rounded-md text-left select-none"
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
