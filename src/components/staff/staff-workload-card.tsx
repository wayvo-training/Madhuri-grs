"use client";

import { RefreshCw, User, Users } from "lucide-react";
import type { StaffMemberProfile } from "@/types/staff";

interface StaffWorkloadCardProps {
  profile: StaffMemberProfile;
  onRefresh?: () => void;
  variant?: "banner" | "compact" | "default";
}

export function StaffWorkloadCard({
  profile,
  onRefresh,
  variant = "default",
}: StaffWorkloadCardProps) {
  const maxCapacity = 10;
  const availableCapacity = Math.max(0, maxCapacity - profile.activeWorkload);
  const loadPercent = Math.min(
    Math.round((profile.activeWorkload / maxCapacity) * 100),
    100,
  );

  const isCompact = variant === "compact";

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          MY WORKLOAD
        </p>
      </div>

      <div
        className={
          isCompact
            ? "flex flex-col gap-3"
            : "flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        }
      >
        {/* Left: Profile Badge */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {profile.name}
              </h3>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {profile.departmentName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Code:{" "}
              <span className="font-mono font-medium">
                {profile.employeeCode}
              </span>{" "}
              &bull; {profile.email}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        {onRefresh && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              title="Refresh workload metrics"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Refresh Metrics</span>
            </button>
          </div>
        )}
      </div>

      {/* Capacity & Workload Bar */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-slate-600">
          <Users className="h-4 w-4 text-slate-400" />
          <span>Active Workload:</span>
          <strong className="font-bold text-slate-900">
            {profile.activeWorkload} / {maxCapacity}
          </strong>
          <span className="text-slate-300">•</span>
          <span>Available Capacity:</span>
          <strong
            className={`font-bold ${
              availableCapacity === 0 ? "text-rose-600" : "text-emerald-700"
            }`}
          >
            {availableCapacity}
          </strong>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-60">
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                loadPercent >= 90
                  ? "bg-rose-500"
                  : loadPercent >= 75
                    ? "bg-amber-500"
                    : "bg-emerald-600"
              }`}
              style={{ width: `${loadPercent}%` }}
            />
          </div>
          <span className="font-semibold text-slate-700 text-right shrink-0">
            {loadPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
