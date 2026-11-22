"use client";

import { Copy, Database, ShieldCheck } from "lucide-react";
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
  dataLimitationNotice: string;
}

export function DuplicateClustersCard({
  duplicateClusters,
  dataLimitationNotice,
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
                Duplicate Grievance Clusters (LLD §3.10.5)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Rule-based clustering of active grievances confirmed as
                duplicates of the same root issue (&gt;= 2 cases)
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs"
          >
            Schema Limitation Documented
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-5 pt-0">
        {/* Authoritative Audit Limitation Notice */}
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
          <Database className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Database Schema Limitation Notice
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {dataLimitationNotice}
            </p>
          </div>
        </div>

        {duplicateClusters.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
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
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>
              No unverified heuristic duplicate clusters are fabricated without
              authoritative database foreign keys.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
