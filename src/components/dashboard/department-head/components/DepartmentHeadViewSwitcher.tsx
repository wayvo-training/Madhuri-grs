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
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
              activeView === "overview"
                ? "bg-[#064E3B] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Department Overview</span>
          </button>

          <button
            type="button"
            onClick={() => switchView("queue")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
              activeView === "queue"
                ? "bg-[#064E3B] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Grievance Queue</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-2.5 ${
                activeView === "queue"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700 font-medium"
              }`}
            >
              {unassignedCount} New
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchView("staff")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
              activeView === "staff"
                ? "bg-[#064E3B] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Staff Workload</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-2.5 ${
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
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
              activeView === "sla"
                ? "bg-[#064E3B] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <AlertTriangle
              className={`h-3.5 w-3.5 ${
                activeView === "sla" ? "text-white" : "text-slate-500"
              }`}
            />
            <span>SLA & Escalations</span>
            {(atRiskCount > 0 || escalatedCount > 0) && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-2.5 text-white font-bold">
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
