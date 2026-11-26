"use client";

import { Activity } from "lucide-react";
import type { StaffGrievanceItem } from "@/types/staff";

interface ActivityTabProps {
  grievance: StaffGrievanceItem;
}

export function ActivityTab({ grievance }: ActivityTabProps) {
  // Sort by newest date first (descending)
  const sortedActivities = [...(grievance.auditTrail || [])].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs min-h-[360px] flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Activity Log
        </h4>
        <span className="text-[11px] text-slate-400 font-medium">
          {sortedActivities.length} event
          {sortedActivities.length === 1 ? "" : "s"}
        </span>
      </div>

      {sortedActivities.length > 0 ? (
        <div className="relative pl-6 space-y-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {sortedActivities.map((ev, idx) => (
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
                  {ev.action}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                  {ev.relativeTime || ev.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {ev.details}
              </p>
              {ev.actor && (
                <span className="inline-block mt-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  By: {ev.actor}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-2.5">
          <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400">
            <Activity className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-700">
              No Activity Logged Yet
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              Investigation steps, internal notes, and status updates will
              appear here chronologically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
