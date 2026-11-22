"use client";

import { Building2, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DepartmentDistributionItem } from "@/types/reports";

export interface DepartmentDistributionCardProps {
  departmentDistribution: DepartmentDistributionItem[];
  totalUniqueGrievances: number;
}

export function DepartmentDistributionCard({
  departmentDistribution,
  totalUniqueGrievances,
}: DepartmentDistributionCardProps) {
  const totalInvolvements = departmentDistribution.reduce(
    (sum, d) => sum + d.totalInvolvement,
    0,
  );

  return (
    <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Department Workload Distribution
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Grievance routing by Primary and Supporting departmental roles
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700">
            <Info className="h-3 w-3 text-blue-500" />
            <span>
              Unique:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {totalUniqueGrievances}
              </strong>{" "}
              | Involvements:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {totalInvolvements}
              </strong>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-5 pt-0">
        {departmentDistribution.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No departmental assignments found for this selection.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 font-medium">Department Name</th>
                    <th className="pb-2 font-medium text-right">Primary</th>
                    <th className="pb-2 font-medium text-right">Supporting</th>
                    <th className="pb-2 font-medium text-right">Total Cases</th>
                    <th className="pb-2 font-medium text-right w-20">
                      Volume %
                    </th>
                    <th className="pb-2 font-medium pl-3 w-28 sm:w-36">
                      Involvement
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {departmentDistribution.map((item) => (
                    <tr
                      key={item.departmentId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-2.5 pr-2 font-medium text-slate-900 dark:text-slate-100">
                        {item.departmentName}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-300">
                        <span className="inline-block px-1.5 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                          {item.primaryCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-600 dark:text-slate-400">
                        {item.supportingCount > 0 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.supportingCount}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">
                            0
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {item.totalInvolvement}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-500 dark:text-slate-400">
                        {item.percentageOfTotal}%
                      </td>
                      <td className="py-2.5 pl-3">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-teal-600 dark:bg-teal-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.max(2, item.percentageOfTotal))}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50/60 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Deduplication Notice:</strong> Organization-wide volume
                reflects unique grievance IDs ({totalUniqueGrievances}).
                Multi-department grievances are routed to one Primary and
                optional Supporting departments, creating multiple departmental
                workload records without inflating unique organization totals.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
