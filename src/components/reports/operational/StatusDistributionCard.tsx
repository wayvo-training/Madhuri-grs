"use client";

import { Activity } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StatusDistributionItem } from "@/types/reports";

export interface StatusDistributionCardProps {
  statusDistribution: StatusDistributionItem[];
  totalUniqueGrievances: number;
}

export function StatusDistributionCard({
  statusDistribution,
  totalUniqueGrievances,
}: StatusDistributionCardProps) {
  return (
    <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Grievance Distribution by Status
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Workflow stage distribution for{" "}
                {totalUniqueGrievances.toLocaleString()} unique grievances
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-5 pt-0">
        {statusDistribution.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No grievance records matching the selected period and filters.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Volume</th>
                    <th className="pb-2 font-medium text-right w-24">Share</th>
                    <th className="pb-2 font-medium pl-3 w-32 sm:w-48">
                      Distribution
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {statusDistribution.map((item) => (
                    <tr
                      key={item.status}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-2.5 pr-2">
                        <StatusBadge status={item.status} />
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
                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
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
