"use client";

import { Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DuplicateClusterItem } from "@/types/reports";

export interface DuplicateClustersCardProps {
  duplicateClusters: DuplicateClusterItem[];
  dataLimitationNotice?: string;
}

export function DuplicateClustersCard({
  duplicateClusters,
  dataLimitationNotice: _dataLimitationNotice,
}: DuplicateClustersCardProps) {
  return (
    <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
              <Copy className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Duplicate Grievance Clusters
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Active grievances identified as potential duplicates of the same
                root issue (&gt;= 2 cases)
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 text-xs"
          >
            {duplicateClusters.length} Active Cluster
            {duplicateClusters.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-5 pt-0">
        {duplicateClusters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="pb-2.5 font-medium">Root Issue Summary</th>
                  <th className="pb-2.5 font-medium">Department</th>
                  <th className="pb-2.5 font-medium">Active Duplicate Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {duplicateClusters.map((cluster) => (
                  <tr key={cluster.clusterId}>
                    <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {cluster.rootIssueSummary}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">
                      {cluster.departmentName}
                    </td>
                    <td className="py-2.5 font-semibold text-sky-600 dark:text-sky-400">
                      {cluster.activeCount} active cases
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Copy className="h-5 w-5" />
            </div>
            <h3 className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              No Duplicate Grievance Clusters Detected
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No active grievances identified as duplicate submissions in the
              current analysis window.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
