"use client";

import { LogOut, PanelLeftClose, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  DEPARTMENT_HEAD: "bg-sky-50 text-sky-700 border-sky-200",
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
  const [currentHash, setCurrentHash] = useState<string>("");

  useEffect(() => {
    const updateHash = () => {
      if (typeof window !== "undefined") {
        setCurrentHash(window.location.hash.toLowerCase());
      }
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, []);

  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    itemHref: string,
  ) => {
    if (onClose) onClose();

    if (itemHref.includes("#")) {
      const [itemPath, itemHash] = itemHref.split("#");
      if (pathname === itemPath) {
        e.preventDefault();
        const cleanHash = itemHash.toLowerCase();
        setCurrentHash(`#${cleanHash}`);
        window.location.hash = itemHash;
        window.dispatchEvent(new Event("hashchange"));
      }
    } else if (itemHref === pathname) {
      if (currentHash) {
        e.preventDefault();
        setCurrentHash("");
        if (window.location.hash) {
          history.replaceState(null, "", itemHref);
        }
        window.dispatchEvent(new Event("hashchange"));
      }
    }
  };

  const isItemActive = (itemHref: string) => {
    if (itemHref.includes("#")) {
      const [itemPath, itemHash] = itemHref.split("#");
      return (
        pathname === itemPath && currentHash === `#${itemHash.toLowerCase()}`
      );
    }

    if (pathname === itemHref) {
      return (
        !currentHash ||
        currentHash === "" ||
        currentHash === "#" ||
        currentHash === "#overview"
      );
    }

    return (
      itemHref !== "/admin/dashboard" &&
      itemHref !== "/dashboard" &&
      pathname.startsWith(itemHref)
    );
  };

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

      {/* Sidebar Container: Fixed Full Height with Internal Scroll & Pinned Bottom Profile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-72 lg:w-20" : "w-72"}`}
      >
        {/* Brand Header (Fixed at top - ChatGPT style) */}
        <div
          className={`flex h-18 shrink-0 items-center border-b border-slate-100 ${
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          }`}
        >
          {isCollapsed ? (
            <div className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#064E3B] text-lg font-bold text-white shadow-md shadow-emerald-950/25 hover:scale-105 hover:bg-[#043d2e] transition-all cursor-pointer"
                title="Open sidebar"
                aria-label="Open sidebar"
              >
                G
              </button>
              {/* ChatGPT-style floating dark pill tooltip */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap z-50 animate-in fade-in duration-150">
                Open sidebar
              </div>
            </div>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#064E3B] text-lg font-bold text-white shadow-md shadow-emerald-950/25">
                  G
                </div>
                <div>
                  <p className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                    GRS
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-[-0.01em] text-slate-500">
                    Resolution Portal
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                {/* Desktop Collapse Toggle (ChatGPT style) */}
                {onToggleCollapse && (
                  <div className="relative group hidden lg:flex items-center">
                    <button
                      type="button"
                      onClick={onToggleCollapse}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                      aria-label="Close sidebar"
                    >
                      <PanelLeftClose className="h-5 w-5" />
                    </button>
                    {/* ChatGPT-style dark pill tooltip */}
                    <div className="pointer-events-none absolute right-0 top-full mt-2 hidden group-hover:flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-xl whitespace-nowrap z-50 animate-in fade-in duration-150">
                      Close sidebar
                    </div>
                  </div>
                )}

                {/* Mobile close button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation Items (Internal Scrolling) */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain py-5 space-y-6 custom-scrollbar ${
            isCollapsed ? "px-2" : "px-4"
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
                  <div className="my-2 mx-2 h-px bg-slate-100" />
                ) : (
                  <p className="px-3.5 text-xs font-medium uppercase tracking-[-0.01em] text-slate-400">
                    {group.label}
                  </p>
                )}
                <div
                  className={`mt-2.5 ${
                    isCollapsed
                      ? "space-y-2 flex flex-col items-center"
                      : "space-y-1.5"
                  }`}
                >
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item.href);

                    if (isCollapsed) {
                      return (
                        <div
                          key={item.title}
                          className="relative group w-full flex justify-center"
                        >
                          <Link
                            href={item.href}
                            onClick={(e) => handleItemClick(e, item.href)}
                            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 ${
                              isActive
                                ? "bg-[#064E3B] text-white shadow-sm shadow-emerald-950/20"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                            aria-label={item.title}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                          </Link>

                          {/* Floating Tooltip for Collapsed Sidebar */}
                          <div className="pointer-events-none absolute left-full ml-3.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl z-50 whitespace-nowrap">
                            <span className="tracking-[-0.01em]">
                              {item.title}
                            </span>
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
                        onClick={(e) => handleItemClick(e, item.href)}
                        className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[15px] font-medium tracking-[-0.01em] transition-all duration-150 ${
                          isActive
                            ? "bg-[#064E3B] text-white shadow-sm shadow-emerald-950/20"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                              isActive
                                ? "text-white"
                                : "text-slate-400 group-hover:text-slate-700"
                            }`}
                          />
                          <span className="tracking-[-0.01em]">
                            {item.title}
                          </span>
                        </div>

                        {item.badge && (
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
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

        {/* User Footer Profile & Logout (Permanently Fixed at Bottom) */}
        <div className="shrink-0 border-t border-slate-100 bg-white p-3.5 mt-auto">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-3 py-1">
              {/* User Avatar with Hover Tooltip */}
              <div className="relative group">
                <div
                  title={`${userName} (${roleDisplayLabels[userRole]})`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 text-base font-bold text-[#064E3B] cursor-pointer shadow-2xs hover:ring-2 hover:ring-emerald-600/30 transition"
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="pointer-events-none absolute left-full ml-3.5 bottom-0 hidden group-hover:flex flex-col gap-0.5 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white shadow-xl z-50 whitespace-nowrap">
                  <p className="font-bold">{userName}</p>
                  {userEmail && (
                    <p className="text-[11px] text-slate-300">{userEmail}</p>
                  )}
                  <p className="text-[10px] text-emerald-300 uppercase tracking-wider mt-0.5 font-semibold">
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
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-base font-bold text-[#064E3B]">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-medium tracking-[-0.01em] text-slate-900">
                    {userName}
                  </p>
                  {userEmail && (
                    <p className="truncate text-xs font-normal tracking-[-0.01em] text-slate-500">
                      {userEmail}
                    </p>
                  )}
                  <span
                    className={`inline-block mt-0.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
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
