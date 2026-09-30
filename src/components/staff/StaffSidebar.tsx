import React from "react";
import { Activity, CheckCircle2, FileText, LayoutDashboard, Search, User } from "lucide-react";
import type { StaffView } from "@/types/staff";

interface StaffSidebarProps {
  activeView: StaffView;
  switchView: (view: StaffView) => void;
}

export function StaffSidebar({ activeView, switchView }: StaffSidebarProps) {
  const views = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "queue", label: "Active", icon: FileText },
    { id: "profile", label: "Capacity", icon: User },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  return (
    <nav className="w-48 flex-shrink-0 border-r border-slate-200 bg-white p-4 space-y-2">
      {views.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchView(tab.id as StaffView)}
            className={`group flex w-full items-center gap-2 rounded px-2 py-1 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 ${
              isActive ? "bg-[#0F766E] text-white" : "bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700"
            }`}
          >
            <Icon className={isActive ? "h-4 w-4 text-white" : "h-4 w-4 text-slate-400"} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
