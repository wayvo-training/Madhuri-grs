"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import {
  PriorityBadge,
  SlaBadge,
  StatusBadge,
} from "@/components/dashboard/badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SlaMonitoringReport } from "@/types/reports";

export interface SlaMonitoringCardProps {
  slaMonitoring: SlaMonitoringReport;
  totalUniqueGrievances: number;
}

export function SlaMonitoringCard({
  slaMonitoring,
  totalUniqueGrievances,
}: SlaMonitoringCardProps) {
  const [activeTab, setActiveTab] = useState<"approaching" | "breached">(
    "approaching",
  );

  const {
    onTrackCount,
    approachingDeadlineCount,
    breachedDeadlineCount,
    approachingGrievances,
    breachedGrievances,
  } = slaMonitoring;

  const currentList =
    activeTab === "approaching" ? approachingGrievances : breachedGrievances;

  return (
    <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Active SLA Health & Deadline Tracking
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Current authoritative SLA status for open grievances received
                during this reporting period (
                {totalUniqueGrievances.toLocaleString()} unique cases)
              </CardDescription>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
              <CheckCircle2 className="h-3 w-3" />
              On Track: {onTrackCount}
            </span>
            <span className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/40">
              <AlertTriangle className="h-3 w-3" />
              At Risk: {approachingDeadlineCount}
            </span>
            <span className="flex items-center gap-1 text-xs text-rose-700 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-800/40">
              <AlertCircle className="h-3 w-3" />
              Breached: {breachedDeadlineCount}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-5 pt-0">
        <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 mb-3 flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
          <span>
            <strong>Active Status Tracking:</strong> This section displays the
            current operational SLA health of active grievances based on
            authoritative database records (<code>sla_status</code> and{" "}
            <code>due_at</code>). Completed and closed cases are excluded from
            active deadline alerts.
          </span>
        </div>

        {/* Sub-tab selection */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
          <Button
            type="button"
            variant={activeTab === "approaching" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("approaching")}
            className="h-7 text-xs px-2.5 font-medium rounded-md gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Active Approaching Deadlines ({approachingGrievances.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === "breached" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("breached")}
            className="h-7 text-xs px-2.5 font-medium rounded-md gap-1.5"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Active Exceeding Deadlines ({breachedGrievances.length})
          </Button>
        </div>

        {currentList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            {activeTab === "approaching"
              ? "No grievances currently approaching their SLA deadline in this selection."
              : "No grievances exceeding SLA deadlines in this selection."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  <th className="pb-2 font-medium">Grievance #</th>
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Priority</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">SLA State</th>
                  <th className="pb-2 font-medium text-right">Target Due At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {currentList.map((g) => {
                  const dueFormatted = g.dueAt
                    ? new Date(g.dueAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not Set";

                  return (
                    <tr
                      key={g.grievanceId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-2.5 pr-2 font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-100">
                        {g.grievanceNumber}
                      </td>
                      <td
                        className="py-2.5 px-2 max-w-xs truncate text-slate-800 dark:text-slate-200"
                        title={g.title}
                      >
                        {g.title}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                        {g.primaryDepartmentName}
                      </td>
                      <td className="py-2.5 px-2">
                        <PriorityBadge priority={g.priority} />
                      </td>
                      <td className="py-2.5 px-2">
                        <StatusBadge status={g.status} />
                      </td>
                      <td className="py-2.5 px-2">
                        <SlaBadge status={g.slaStatus} />
                      </td>
                      <td className="py-2.5 pl-2 text-right text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {dueFormatted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
