"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  LayoutDashboard,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import type { DepartmentHeadView } from "@/types/department-head";

export interface DepartmentHeadViewSwitcherProps {
  activeView: DepartmentHeadView;
  switchView: (view: DepartmentHeadView) => void;
  unassignedCount: number;
  staffCount: number;
  atRiskCount: number;
  escalatedCount: number;
  availableDepartments: { id: string; name: string }[];
  selectedDeptId: string;
  currentDepartmentName: string;
  isRefreshing: boolean;
  onDepartmentChange: (deptId: string) => void;
  onRefresh: () => void;
  actionSuccessMessage: string | null;
  onClearSuccessMessage: () => void;
}

export function DepartmentHeadViewSwitcher({
  activeView,
  switchView,
  unassignedCount,
  staffCount,
  atRiskCount,
  escalatedCount,
  availableDepartments: _availableDepartments,
  selectedDeptId: _selectedDeptId,
  currentDepartmentName: _currentDepartmentName,
  isRefreshing,
  onDepartmentChange: _onDepartmentChange,
  onRefresh,
  actionSuccessMessage,
  onClearSuccessMessage,
}: DepartmentHeadViewSwitcherProps) {
  return (
    <div className="space-y-3">
      {/* Top View Switcher Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => switchView("overview")}
            className={`group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 ${
              activeView === "overview"
                ? "bg-[#0F766E] text-white shadow-sm ring-1 ring-[#0F766E]"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-2xs"
            }`}
          >
            <LayoutDashboard
              className={`h-4 w-4 transition-colors ${
                activeView === "overview" ? "text-white" : "text-slate-400 group-hover:text-teal-600"
              }`}
            />
            <span>Department Overview</span>
          </button>

          <button
            type="button"
            onClick={() => switchView("queue")}
            className={`group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 ${
              activeView === "queue"
                ? "bg-[#0F766E] text-white shadow-sm ring-1 ring-[#0F766E]"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-2xs"
            }`}
          >
            <Inbox
              className={`h-4 w-4 transition-colors ${
                activeView === "queue" ? "text-white" : "text-slate-400 group-hover:text-teal-600"
              }`}
            />
            <span>Grievance Queue</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeView === "queue"
                  ? "bg-white/20 text-white"
                  : unassignedCount > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {unassignedCount} New
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchView("staff")}
            className={`group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 ${
              activeView === "staff"
                ? "bg-[#0F766E] text-white shadow-sm ring-1 ring-[#0F766E]"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-2xs"
            }`}
          >
            <Users
              className={`h-4 w-4 transition-colors ${
                activeView === "staff" ? "text-white" : "text-slate-400 group-hover:text-teal-600"
              }`}
            />
            <span>Staff Workload</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeView === "staff"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {staffCount} Staff
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchView("sla")}
            className={`group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 ${
              activeView === "sla"
                ? "bg-[#0F766E] text-white shadow-sm ring-1 ring-[#0F766E]"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-2xs"
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 transition-colors ${
                activeView === "sla" ? "text-white" : "text-slate-400 group-hover:text-teal-600"
              }`}
            />
            <span>SLA & Escalations</span>
            {(atRiskCount > 0 || escalatedCount > 0) && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeView === "sla"
                    ? "bg-white/20 text-white"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {atRiskCount + escalatedCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${
                isRefreshing ? "animate-spin text-emerald-700" : ""
              }`}
            />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-900 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={onClearSuccessMessage}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
