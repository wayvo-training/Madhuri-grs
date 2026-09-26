"use client";

import { Menu } from "lucide-react";
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
  onOpenMobileMenu,
}: DashboardHeaderProps) {
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

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationDrawer />
      </div>
    </header>
  );
}
