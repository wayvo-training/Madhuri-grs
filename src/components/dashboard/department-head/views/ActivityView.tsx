"use client";

import { ArrowLeft } from "lucide-react";
import { formatAuditFeedDetails } from "@/lib/department-head/utils";
import type { EscalationAuditRecord } from "@/types/department-head";

export interface ActivityViewProps {
  governanceAuditFeed: EscalationAuditRecord[];
  onBackToOverview: () => void;
}

export function ActivityView({
  governanceAuditFeed,
  onBackToOverview,
}: ActivityViewProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Department Head Activity / Audit
            </h3>
            <p className="text-xs font-normal text-slate-500">
              Historical governance events, staff actions, interventions, and
              SLA-related changes across this department.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToOverview}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Overview</span>
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="py-3 pl-4 pr-3 whitespace-nowrap">Grievance</th>
                <th className="py-3 px-3 whitespace-nowrap">Activity</th>
                <th className="py-3 px-3 whitespace-nowrap">Performed By</th>
                <th className="py-3 px-3 whitespace-nowrap">Role</th>
                <th className="py-3 px-3 whitespace-nowrap">When</th>
              </tr>
            </thead>
            <tbody>
              {governanceAuditFeed.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-xs text-slate-400"
                  >
                    No activity records are available for this department yet.
                  </td>
                </tr>
              ) : (
                governanceAuditFeed.map((feed) => {
                  const feedGrievanceRef = feed.action.includes(":")
                    ? feed.action.split(":")[0].trim()
                    : "N/A";

                  return (
                    <tr
                      key={feed.id}
                      className="border-b border-slate-100 last:border-0 align-top"
                    >
                      <td className="py-3 pl-4 pr-3 whitespace-nowrap">
                        <span className="inline-block rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-950">
                          {feedGrievanceRef}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800 text-[11px]">
                            {feed.action}
                          </div>
                          <div className="text-[10px] leading-relaxed text-slate-500">
                            {formatAuditFeedDetails(feed.details)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[11px] font-medium text-slate-700">
                        {feed.actor}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-500">
                        {feed.actor.includes("DEPARTMENT_HEAD")
                          ? "Department Head"
                          : feed.actor.includes("SLA")
                            ? "System"
                            : "Staff"}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-500">
                        {feed.timestamp}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
