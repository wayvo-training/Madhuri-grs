"use client";

import {
  CheckCircle2,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import type { StaffKpiStats, StaffView } from "@/types/staff";

interface StaffViewSwitcherProps {
  activeView: StaffView;
  switchView: (view: StaffView) => void;
  stats?: StaffKpiStats;
  activeWorkload?: number;
  maxCapacity?: number;
  investigationCount?: number;
  resolutionCount?: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function StaffViewSwitcher({
  activeView,
  switchView,
  stats,
  activeWorkload = 0,
  maxCapacity = 10,
  investigationCount,
  resolutionCount,
  isRefreshing = false,
  onRefresh,
}: StaffViewSwitcherProps) {
  const activeCount = stats?.activeGrievances ?? activeWorkload;
  const invCount =
    investigationCount !== undefined
      ? investigationCount
      : (stats?.activeGrievances ?? 0);
  const resCount =
    resolutionCount !== undefined
      ? resolutionCount
      : (stats?.completedCount ?? 0);

  const views: {
    id: StaffView;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number | string;
    badgeVariant?: "default" | "warning" | "danger" | "purple" | "neutral";
  }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "queue",
      label: "Active",
      icon: FileText,
      badge: activeCount,
      badgeVariant: activeCount >= maxCapacity ? "danger" : "default",
    },
    {
      id: "investigation",
      label: "Investigation",
      icon: Search,
      badge: invCount,
      badgeVariant:
        stats && stats.slaBreached > 0
          ? "danger"
          : stats && stats.slaAtRisk > 0
            ? "warning"
            : "default",
    },
    {
      id: "resolutions",
      label: "Resolution",
      icon: CheckCircle2,
      badge: resCount,
      badgeVariant: "default",
    },
    {
      id: "profile",
      label: "Capacity",
      icon: User,
      badge: `${activeWorkload}/${maxCapacity}`,
      badgeVariant: activeWorkload >= maxCapacity ? "danger" : "neutral",
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      {/* View Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {views.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchView(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? "bg-[#0F766E] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${
                  isActive ? "text-white" : "text-slate-500"
                }`}
              />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : tab.badgeVariant === "danger"
                        ? "bg-rose-100 text-rose-700"
                        : tab.badgeVariant === "warning"
                          ? "bg-amber-100 text-amber-800"
                          : tab.badgeVariant === "purple"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Sync button */}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-slate-500 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
          <span>{isRefreshing ? "Syncing..." : "Refresh Queue"}</span>
        </button>
      )}
    </div>
  );
}
