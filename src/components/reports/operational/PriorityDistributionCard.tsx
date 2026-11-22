"use client";

import { Flame } from "lucide-react";
import { PriorityBadge } from "@/components/dashboard/badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PriorityDistributionItem } from "@/types/reports";

export interface PriorityDistributionCardProps {
  priorityDistribution: PriorityDistributionItem[];
  totalUniqueGrievances: number;
}

export function PriorityDistributionCard({
  priorityDistribution,
  totalUniqueGrievances,
}: PriorityDistributionCardProps) {
  const getBarColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "CRITICAL":
        return "bg-amber-600 dark:bg-amber-500";
      case "HIGH":
        return "bg-slate-800 dark:bg-slate-300";
      case "MEDIUM":
        return "bg-slate-600 dark:bg-slate-400";
      default:
        return "bg-slate-400 dark:bg-slate-500";
    }
  };

  return (
    <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Grievance Priority Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Severity breakdown for {totalUniqueGrievances.toLocaleString()}{" "}
              unique grievances
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-5 pt-0">
        {priorityDistribution.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No priority data available for this selection.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 font-medium">Priority Level</th>
                    <th className="pb-2 font-medium text-right">Volume</th>
                    <th className="pb-2 font-medium text-right w-20">Share</th>
                    <th className="pb-2 font-medium pl-3 w-28 sm:w-40">Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {priorityDistribution.map((item) => (
                    <tr
                      key={item.priority}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-2.5 pr-2">
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td className="py-2.5 px-2 text-right font-medium text-slate-900 dark:text-slate-100">
                        {item.count.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-500 dark:text-slate-400">
                        {item.percentage}%
                      </td>
                      <td className="py-2.5 pl-3">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`${getBarColor(item.priority)} h-2 rounded-full transition-all duration-300`}
                            style={{
                              width: `${Math.min(100, Math.max(2, item.percentage))}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
