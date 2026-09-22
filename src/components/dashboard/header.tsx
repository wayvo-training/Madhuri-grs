"use client";

import { Bell, Menu, Search } from "lucide-react";
import type { UserRole } from "@/components/dashboard/navigation";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  userRole?: UserRole;
  userName?: string;
  onOpenMobileMenu?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export function DashboardHeader({
  title,
  subtitle,
  onOpenMobileMenu,
  isCollapsed = false,
  onToggleCollapse,
  searchValue = "",
  onSearchChange,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-18 shrink-0 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle & Page Title */}
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

        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden text-sm font-normal text-slate-500 sm:block">
              {subtitle}
            </p>
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
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20"
          />
        </div>
      </div>

      {/* Right: Notifications Action */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          title="Notifications"
          className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-600" />
        </button>
      </div>
    </header>
  );
}
