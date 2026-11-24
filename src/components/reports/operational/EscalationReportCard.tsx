"use client";

import { ShieldAlert } from "lucide-react";
import React, { useMemo, useState } from "react";
import { StatusBadge } from "@/components/dashboard/badges";
import {
  AdvancedTableSearch,
  type FilterMode,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
import type { EscalationsReport } from "@/types/reports";

export interface EscalationReportCardProps {
  escalations: EscalationsReport;
}

const searchFields: SearchFieldDef[] = [
  { id: "ticketCode", label: "Grievance #", type: "text" },
  { id: "title", label: "Grievance Title", type: "text" },
  { id: "name", label: "Escalated To", type: "text" },
  { id: "reason", label: "Reason", type: "text" },
  { id: "status", label: "Status", type: "text" },
];

export function EscalationReportCard({
  escalations,
}: EscalationReportCardProps) {
  const [conditions, setConditions] = useState<SearchCondition[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("AND");
  const { totalEscalationsInPeriod, byLevel, events } = escalations;

  const filteredEvents = useMemo(() => {
    if (!conditions || conditions.length === 0) return events;
    return events.filter((e) =>
      evaluateSearchConditions(
        {
          ...e,
          ticketCode: e.grievanceNumber,
          title: e.grievanceTitle,
          name: e.escalatedToName,
          reason: e.reason,
          status: e.status,
        },
        conditions,
        filterMode,
      ),
    );
  }, [events, conditions, filterMode]);

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Recorded Governance Escalations
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Escalation events recorded during this reporting period (
                {totalEscalationsInPeriod} total)
              </CardDescription>
            </div>
          </div>

          {/* Level Distribution Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {byLevel.map((lvl) => (
              <Badge
                key={lvl.level}
                variant="outline"
                className="text-xs border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 font-semibold"
              >
                Level {lvl.level}: {lvl.count}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-0 space-y-3">
        {/* Standard Search Bar */}
        {events.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800">
            <div className="w-full sm:w-80">
              <AdvancedTableSearch
                fields={searchFields}
                onSearch={(conds, mode) => {
                  setConditions(conds);
                  setFilterMode(mode);
                }}
                className="w-full"
              />
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Showing {filteredEvents.length} of {events.length} events
            </span>
          </div>
        )}

        {events.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            No escalation events recorded within the selected reporting period.
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            No escalation events matching search criteria.
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700">
                  <TableHead className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300">
                    Grievance #
                  </TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300">
                    Grievance Title
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-center font-semibold text-xs text-slate-600 dark:text-slate-300">
                    Level
                  </TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300">
                    Escalated To
                  </TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300">
                    Reason
                  </TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300">
                    Status
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300">
                    Escalation Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEvents.map((esc) => {
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
                    <TableRow
                      key={esc.escalationId}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <TableCell className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                        {esc.grievanceNumber}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                        {esc.grievanceTitle}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-center">
                        <Badge
                          variant="secondary"
                          className="font-bold text-purple-700 bg-purple-50 dark:bg-purple-900/40 dark:text-purple-300 font-mono"
                        >
                          L{esc.escalationLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {esc.escalatedToName}
                      </TableCell>
                      <TableCell
                        className="py-2.5 px-3 max-w-sm truncate text-slate-600 dark:text-slate-400"
                        title={esc.reason}
                      >
                        {esc.reason}
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <StatusBadge status={esc.status} />
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px] tabular-nums">
                        {dateFormatted}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
