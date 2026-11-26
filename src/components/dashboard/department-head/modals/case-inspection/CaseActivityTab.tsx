"use client";

import { Activity, ArrowDownUp } from "lucide-react";
import { useState } from "react";
import {
  formatAuditActionTitle,
  formatAuditLogContent,
} from "@/lib/department-head/utils";
import type { CaseProgressData, GrievanceItem } from "@/types/department-head";

interface CaseActivityTabProps {
  currentGrievance: GrievanceItem;
  caseProgressData: CaseProgressData | null;
}

export function CaseActivityTab({
  currentGrievance,
  caseProgressData,
}: CaseActivityTabProps) {
  const [timelineSort, setTimelineSort] = useState<"desc" | "asc">("desc");

  const baseEvents = [
    ...(caseProgressData?.timeline && caseProgressData.timeline.length > 0
      ? caseProgressData.timeline
      : (currentGrievance.auditTrail || []).map((log, idx) => ({
          id: log.id || String(idx),
          timestamp: log.timestamp,
          relativeTime: log.timestamp,
          title: formatAuditActionTitle(log.action),
          description: formatAuditLogContent(log.action, log.details),
          actor: log.actor,
        }))),
  ];

  // baseEvents from API are sorted descending (newest first). If user selects "asc", reverse them.
  const timelineEvents =
    timelineSort === "asc" ? [...baseEvents].reverse() : baseEvents;

  const toggleSort = () => {
    setTimelineSort((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs min-h-[360px] flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Activity Timeline
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline-block">
            {timelineSort === "desc" ? "Newest First" : "Oldest First"}
          </span>
          <button
            type="button"
            onClick={toggleSort}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 cursor-pointer"
            title="Toggle sort order"
          >
            <ArrowDownUp className="h-3 w-3" />
            <span>{timelineSort === "desc" ? "Newest" : "Oldest"}</span>
          </button>
        </div>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-2.5">
          <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400">
            <Activity className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-700">
              No Activity Logged Yet
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              Investigation steps, status updates, and milestone events will
              appear here chronologically.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timelineEvents.map((ev, idx) => (
            <div key={ev.id || idx} className="relative group">
              <div
                className={`absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white shadow-2xs ${
                  idx === 0
                    ? "bg-emerald-600 ring-2 ring-emerald-100"
                    : "bg-slate-400"
                }`}
              />
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {ev.title}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                  {ev.relativeTime || ev.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {ev.description}
              </p>
              {ev.actor && (
                <span className="inline-block mt-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  By: {ev.actor}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
