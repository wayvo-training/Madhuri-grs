"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/components/dashboard/navigation";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

const ROUTE_TITLES: Record<string, string> = {
  // Admin
  "/admin/dashboard": "Admin Control Center",
  "/admin/users": "User Directory & Access Control",
  "/admin/roles": "Roles & Security Permissions",
  "/admin/departments": "Department & Organization Management",
  "/admin/rules": "Master Governance & Rules Engine",
  "/admin/grievances": "Grievance Central & Routing Exceptions",
  "/admin/audit-logs": "Enterprise Audit Trail & Observability Logs",
  "/admin/messages": "Grievance Communication",
  "/admin/notifications": "Notifications",

  // Department Head
  "/department-head/dashboard": "Department Overview",
  "/department-head/queue": "Department Grievance Queue",
  "/department-head/workload": "Staff Workload & Capacity",
  "/department-head/activity": "Department Governance Activity",
  "/department-head/knowledge": "Department Knowledge Base",
  "/department-head/messages": "Grievance Communication",
  "/department-head/notifications": "Notifications",

  // Staff
  "/staff/dashboard": "Staff Dashboard",
  "/staff/grievances": "My Grievances",
  "/staff/activity": "Activity Log",
  "/staff/profile": "Staff Profile",
  "/staff/messages": "Grievance Communication",
  "/staff/notifications": "Notifications",

  // End User
  "/end-user/dashboard": "Grievance Portal Overview",
  "/end-user/grievances": "My Grievances",
  "/end-user/submit": "Submit Grievance",
  "/end-user/track": "Track Grievance",
  "/end-user/profile": "My Profile",
  "/end-user/messages": "Grievance Communication",
  "/end-user/notifications": "Notifications",
};

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  userRole?: UserRole;
  userName?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
}

export function DashboardHeader({
  title: propTitle,
  subtitle: _subtitle,
  userRole,
}: DashboardHeaderProps) {
  const pathname = usePathname();

  const getAutoTitle = () => {
    if (propTitle) return propTitle;
    for (const [route, t] of Object.entries(ROUTE_TITLES)) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        return t;
      }
    }
    return "Dashboard";
  };

  const title = getAutoTitle();
  const getParentLabel = () => {
    switch (userRole) {
      case "END_USER":
        return "End User";
      case "STAFF":
        return "Staff";
      case "DEPARTMENT_HEAD":
        return "Department Head";
      case "ADMIN":
        return "Admin";
      default:
        return "Dashboard";
    }
  };

  const getParentHref = () => {
    switch (userRole) {
      case "END_USER":
        return "/end-user/dashboard";
      case "STAFF":
        return "/staff/dashboard";
      case "DEPARTMENT_HEAD":
        return "/department-head/dashboard";
      case "ADMIN":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-15 shrink-0 w-full items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger Menu via Shadcn SidebarTrigger */}
        <SidebarTrigger className="-ml-1" />

        <div className="flex items-center text-sm font-medium text-muted-foreground">
          <Link
            href={getParentHref()}
            className="hover:text-foreground transition-colors hidden sm:block"
          >
            {getParentLabel()}
          </Link>
          <ChevronRight className="h-4 w-4 mx-1 hidden sm:block" />
          <span className="text-foreground font-semibold tracking-tight">
            {title}
          </span>
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
