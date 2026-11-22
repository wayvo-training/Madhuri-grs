"use client";

import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EscalationsReport } from "@/types/reports";

export interface EscalationReportCardProps {
  escalations: EscalationsReport;
}

export function EscalationReportCard({
  escalations,
}: EscalationReportCardProps) {
  const { totalEscalationsInPeriod, byLevel, events } = escalations;

  return (
    <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Recorded Escalation Events
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Governance escalation history recorded during this reporting
                period ({totalEscalationsInPeriod} total events)
              </CardDescription>
            </div>
          </div>

          {/* Level Distribution Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {byLevel.map((lvl) => (
              <Badge
                key={lvl.level}
                variant="outline"
                className="text-xs border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 font-medium"
              >
                Level {lvl.level}: {lvl.count}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-5 pt-0">
        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No escalation events recorded within the selected reporting period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  <th className="pb-2 font-medium">Grievance #</th>
                  <th className="pb-2 font-medium">Grievance Title</th>
                  <th className="pb-2 font-medium text-center">Level</th>
                  <th className="pb-2 font-medium">Escalated To</th>
                  <th className="pb-2 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">
                    Escalated Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {events.map((esc) => {
                  const dateFormatted = new Date(esc.createdAt).toLocaleString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );

                  return (
                    <tr
                      key={esc.escalationId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="py-2.5 pr-2 font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-100">
                        {esc.grievanceNumber}
                      </td>
                      <td className="py-2.5 px-2 max-w-xs truncate text-slate-800 dark:text-slate-200">
                        {esc.grievanceTitle}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <Badge
                          variant="secondary"
                          className="font-semibold text-purple-700 bg-purple-50 dark:bg-purple-900/40 dark:text-purple-300"
                        >
                          L{esc.escalationLevel}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2 text-slate-700 dark:text-slate-300 font-medium">
                        {esc.escalatedToName}
                      </td>
                      <td
                        className="py-2.5 px-2 max-w-sm truncate text-slate-600 dark:text-slate-400"
                        title={esc.reason}
                      >
                        {esc.reason}
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge
                          variant="outline"
                          className="text-[11px] border-slate-200 font-normal"
                        >
                          {esc.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 pl-2 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {dateFormatted}
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
