"use client";

import {
  Activity,
  CheckCircle2,
  FileText,
  LayoutDashboard,
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
      id: "profile",
      label: "Capacity",
      icon: User,
      badge: `${activeWorkload}/${maxCapacity}`,
      badgeVariant: activeWorkload >= maxCapacity ? "danger" : "neutral",
    },
    {
      id: "activity",
      label: "Activity",
      icon: Activity,
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
              className={`group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 ${
                isActive
                  ? "bg-[#0F766E] text-white shadow-sm ring-1 ring-[#0F766E]"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-2xs"
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-teal-600"
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
    </div>
  );
}
