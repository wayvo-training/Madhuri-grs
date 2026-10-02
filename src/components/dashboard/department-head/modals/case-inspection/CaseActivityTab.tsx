"use client";

import { ArrowDownUp } from "lucide-react";
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
  const [timelineSort] = useState<"desc" | "asc">("desc");

  const timelineEvents = [
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

  if (timelineSort === "desc") {
    timelineEvents.reverse();
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-3 space-y-2 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Activity Timeline
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline-block">
            Chronological Governance Trail
          </span>
        </div>
      </div>

      {timelineEvents.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">
          No activity records logged for this case.
        </p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
