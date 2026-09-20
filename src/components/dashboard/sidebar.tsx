"use client";

import { LogOut, PanelLeftClose, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ROLE_NAVIGATION,
  type UserRole,
} from "@/components/dashboard/navigation";

interface DashboardSidebarProps {
  userRole: UserRole;
  userName: string;
  userEmail?: string;
  permissions?: string[];
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const roleBadgeStyles: Record<UserRole, string> = {
  ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  DEPARTMENT_HEAD: "bg-blue-50 text-blue-700 border-blue-200",
  STAFF: "bg-amber-50 text-amber-700 border-amber-200",
  END_USER: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const roleDisplayLabels: Record<UserRole, string> = {
  ADMIN: "System Admin",
  DEPARTMENT_HEAD: "Department Head",
  STAFF: "Staff Member",
  END_USER: "End User",
};

export function DashboardSidebar({
  userRole,
  userName,
  userEmail,
  permissions = [],
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  }

  const navGroups = ROLE_NAVIGATION[userRole] || [];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-72 lg:w-20" : "w-72"}`}
      >
        {/* Brand Header */}
        <div
          className={`flex h-18 items-center border-b border-slate-100 px-4 ${
            isCollapsed ? "justify-center lg:px-2" : "justify-between px-6"
          }`}
        >
          {isCollapsed ? (
            <div className="hidden lg:flex flex-col items-center gap-1.5">
              <Link
                href="/"
                title="GRS Portal"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-md shadow-blue-600/20 hover:scale-105 transition-transform"
              >
                G
              </Link>
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-md shadow-blue-600/20">
                G
              </div>
              <div>
                <p className="text-base font-bold tracking-tight text-slate-900">
                  GRS
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Resolution Portal
                </p>
              </div>
            </Link>
          )}

          {/* Desktop Toggle Button inside Sidebar (expanded view) */}
          {!isCollapsed && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div
          className={`flex-1 overflow-y-auto py-5 space-y-6 ${
            isCollapsed ? "px-2 lg:space-y-4" : "px-4"
          }`}
        >
          {navGroups.map((group) => {
            // Filter items based on required permissions
            const visibleItems = group.items.filter((item) => {
              if (!item.requiredPermission) return true;
              return permissions.includes(item.requiredPermission);
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                {isCollapsed ? (
                  <div className="hidden lg:block my-2 mx-2 h-px bg-slate-100" />
                ) : (
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {group.label}
                  </p>
                )}
                <div
                  className={`mt-2 ${
                    isCollapsed
                      ? "space-y-2 lg:flex lg:flex-col lg:items-center"
                      : "space-y-1"
                  }`}
                >
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin/dashboard" &&
                        item.href !== "/dashboard" &&
                        pathname.startsWith(item.href));

                    if (isCollapsed) {
                      return (
                        <div
                          key={item.title}
                          className="relative group w-full flex justify-center"
                        >
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 ${
                              isActive
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                            aria-label={item.title}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                          </Link>

                          {/* Floating Tooltip for Collapsed Sidebar */}
                          <div className="pointer-events-none absolute left-full ml-3.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl z-50 whitespace-nowrap">
                            <span>{item.title}</span>
                            {item.badge && (
                              <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={onClose}
                        className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-white"
                                : "text-slate-400 group-hover:text-slate-700"
                            }`}
                          />
                          <span>{item.title}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Footer Profile & Logout */}
        <div className="border-t border-slate-100 p-3">
          {isCollapsed ? (
            <div className="hidden lg:flex flex-col items-center gap-3 py-1">
              {/* User Avatar with Hover Tooltip */}
              <div className="relative group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 cursor-pointer shadow-2xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="pointer-events-none absolute left-full ml-3.5 bottom-0 hidden group-hover:flex flex-col gap-0.5 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-xl z-50 whitespace-nowrap">
                  <p className="font-bold">{userName}</p>
                  {userEmail && (
                    <p className="text-[11px] text-slate-300">{userEmail}</p>
                  )}
                  <p className="text-[10px] text-blue-300 uppercase tracking-wider mt-0.5 font-semibold">
                    {roleDisplayLabels[userRole]}
                  </p>
                </div>
              </div>

              {/* Logout Button in Collapsed Mode */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign out"
                aria-label="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {userName}
                  </p>
                  {userEmail && (
                    <p className="truncate text-[10px] text-slate-400">
                      {userEmail}
                    </p>
                  )}
                  <span
                    className={`inline-block mt-0.5 rounded-full border px-2 py-0.2 text-[10px] font-semibold ${
                      roleBadgeStyles[userRole]
                    }`}
                  >
                    {roleDisplayLabels[userRole]}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Sign out"
                aria-label="Sign out"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-rose-600 hover:shadow-xs disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
