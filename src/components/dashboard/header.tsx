"use client";

import type { UserRole } from "@/components/dashboard/navigation";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  userRole?: UserRole;
  userName?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
}

export function DashboardHeader({ title, subtitle, userRole }: DashboardHeaderProps) {
  const getParentLabel = () => {
    switch (userRole) {
      case "END_USER": return "End User";
      case "STAFF": return "Staff";
      case "DEPARTMENT_HEAD": return "Department Head";
      case "ADMIN": return "Admin";
      default: return "Dashboard";
    }
  };

  const getParentHref = () => {
    switch (userRole) {
      case "END_USER": return "/end-user/dashboard";
      case "STAFF": return "/staff/dashboard";
      case "DEPARTMENT_HEAD": return "/department-head/dashboard";
      case "ADMIN": return "/admin/dashboard";
      default: return "/";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-15 shrink-0 w-full items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger Menu via Shadcn SidebarTrigger */}
        <SidebarTrigger className="-ml-1" />

        <div className="flex items-center text-sm font-medium text-muted-foreground">
          <Link href={getParentHref()} className="hover:text-foreground transition-colors hidden sm:block">
            {getParentLabel()}
          </Link>
          <ChevronRight className="h-4 w-4 mx-1 hidden sm:block" />
          <span className="text-foreground font-semibold tracking-tight">{title}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationDrawer userRole={userRole} />
      </div>
    </header>
  );
}
