"use client";

import { Bell, Menu, PanelLeft, PanelLeftClose, Search } from "lucide-react";
import type { UserRole } from "@/components/dashboard/navigation";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  userRole: UserRole;
  userName: string;
  onOpenMobileMenu?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

const roleBadgeStyles: Record<UserRole, string> = {
  ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  DEPARTMENT_HEAD: "bg-blue-50 text-blue-700 border-blue-200",
  STAFF: "bg-amber-50 text-amber-700 border-amber-200",
  END_USER: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "System Admin",
  DEPARTMENT_HEAD: "Department Head",
  STAFF: "Staff Member",
  END_USER: "End User",
};

export function DashboardHeader({
  title,
  subtitle,
  userRole,
  userName,
  onOpenMobileMenu,
  isCollapsed = false,
  onToggleCollapse,
  searchValue = "",
  onSearchChange,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle, Desktop Collapse Toggle & Page Title */}
      <div className="flex items-center gap-3.5">
        {/* Mobile Hamburger Menu */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          title={
            isCollapsed
              ? "Expand sidebar (full view)"
              : "Collapse sidebar (compact view)"
          }
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden text-xs text-slate-500 sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search grievances by ID, subject, or keyword..."
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
      </div>

      {/* Right: Status Pill, Alerts, User Avatar */}
      <div className="flex items-center gap-3">
        {/* System Health / Status Indicator */}
        <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
          System Active
        </div>

        {/* Notifications Icon */}
        <button
          type="button"
          title="Notifications"
          className="relative rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600" />
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Role Pill */}
        <span
          className={`hidden sm:inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            roleBadgeStyles[userRole]
          }`}
        >
          {roleLabels[userRole]}
        </span>

        {/* User Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white text-xs shadow-xs">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
