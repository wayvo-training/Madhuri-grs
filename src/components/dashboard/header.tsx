"use client";

import { Menu, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { UserRole } from "@/components/dashboard/navigation";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { ThemeToggle } from "@/components/theme-toggle";

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
  searchPlaceholder?: string;
}

export function DashboardHeader({
  title,
  subtitle,
  userRole,
  onOpenMobileMenu,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [internalQuery, setInternalQuery] = useState(searchValue || "");

  // Sync when controlled searchValue prop changes
  useEffect(() => {
    if (searchValue !== undefined) {
      setInternalQuery(searchValue);
    }
  }, [searchValue]);

  // Read initial query from URL search params on mount if not controlled
  useEffect(() => {
    if (typeof window !== "undefined" && searchValue === undefined) {
      const urlQuery = new URLSearchParams(window.location.search).get(
        "search",
      );
      if (urlQuery) {
        setInternalQuery(urlQuery);
      }
    }
  }, [searchValue]);

  // Sync with child component search events (e.g. Master Rules or Grievance Table)
  useEffect(() => {
    const handleComponentSearchSync = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (typeof customEvent.detail === "string") {
        setInternalQuery(customEvent.detail);
      }
    };
    window.addEventListener("grs:component-search", handleComponentSearchSync);
    return () => {
      window.removeEventListener(
        "grs:component-search",
        handleComponentSearchSync,
      );
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalQuery(val);
    onSearchChange?.(val);

    // If on /admin/rules, broadcast search so AdminMasterRules updates immediately in real-time
    if (pathname === "/admin/rules") {
      window.dispatchEvent(
        new CustomEvent("grs:header-search", { detail: val }),
      );
    }
  };

  const handleClear = () => {
    setInternalQuery("");
    onSearchChange?.("");
    if (pathname === "/admin/rules") {
      window.dispatchEvent(
        new CustomEvent("grs:header-search", { detail: "" }),
      );
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = internalQuery.trim();

    // If on /admin/rules, it already filters rules in real-time.
    // If the admin enters a specific Grievance ID like "GRS-...", navigate to grievances
    if (pathname === "/admin/rules") {
      window.dispatchEvent(
        new CustomEvent("grs:header-search", { detail: trimmed }),
      );
      if (/^grs-/i.test(trimmed)) {
        router.push(`/admin/grievances?search=${encodeURIComponent(trimmed)}`);
      }
      return;
    }

    // Determine target grievance queue based on userRole
    let targetPath = "/admin/grievances";
    if (userRole === "DEPARTMENT_HEAD") {
      targetPath = "/department-head/dashboard";
    } else if (userRole === "STAFF") {
      targetPath = "/staff/dashboard";
    } else if (userRole === "END_USER") {
      targetPath = "/dashboard";
    }

    const searchUrl = trimmed
      ? `${targetPath}?search=${encodeURIComponent(trimmed)}`
      : targetPath;

    router.push(searchUrl);
  };

  // Adaptive placeholder
  const placeholderText =
    searchPlaceholder ||
    (pathname === "/admin/rules"
      ? "Search governance rules, policies, or grievances..."
      : "Search grievances by ID, subject, or keyword...");

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-15 shrink-0 w-full items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden text-xs font-normal text-muted-foreground sm:block leading-tight mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center: Search Bar */}
      {userRole !== "ADMIN" && (
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleFormSubmit} className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              id="global-header-search-input"
              aria-label={placeholderText}
              type="text"
              placeholder={placeholderText}
              value={internalQuery}
              onChange={handleInputChange}
              className="h-8.5 w-full rounded-lg border border-border bg-muted/30 pl-8.5 pr-8 text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-emerald-600 focus:bg-background focus:ring-2 focus:ring-emerald-600/20"
            />
            {internalQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationDrawer />
      </div>
    </header>
  );
}
