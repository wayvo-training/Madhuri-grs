import { Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";
import type { StaffAuditItem, StaffDashboardData } from "@/types/staff";

interface StaffActivityViewProps {
  data: StaffDashboardData | null;
}

export function StaffActivityView({ data }: StaffActivityViewProps) {
  return (
    <div className="lg:col-span-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          Activity Stream
        </h3>
        <span className="text-[13px] font-medium text-slate-400">
          Latest Activity
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
        {!data?.recentActivity || data.recentActivity.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            No recent activity recorded for your assigned cases.
          </p>
        ) : (
          <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
            {data.recentActivity.slice(0, 3).map((log: StaffAuditItem) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-sm"
              >
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-slate-800">
                    {log.action}
                  </span>
                  <span className="text-slate-400 text-[13px]">
                    {log.relativeTime || log.timestamp}
                  </span>
                </div>
                <p className="text-[13px] text-slate-600 line-clamp-2">
                  {log.details}
                </p>
                <div className="flex items-center justify-between text-[13px] text-slate-400">
                  {log.actor ? <span>By {log.actor}</span> : <span />}
                  {log.grievanceNumber && (
                    <span className="font-mono font-medium text-slate-500">
                      {log.grievanceNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="pt-2 border-t border-slate-100 text-right">
          <Link
            href="/staff/activity"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:text-[#115E59] transition cursor-pointer"
          >
            <span>View All Activity</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
