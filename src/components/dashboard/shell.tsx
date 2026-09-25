"use client";

import { type ReactNode, useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import type { UserRole } from "@/components/dashboard/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

interface DashboardShellProps {
  userRole: UserRole;
  userName: string;
  userEmail?: string;
  permissions?: string[];
  title: string;
  subtitle?: string;
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
}

export function DashboardShell({
  userRole,
  userName,
  userEmail,
  permissions = [],
  title,
  subtitle,
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("grs_sidebar_collapsed");
      if (saved === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("grs_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans antialiased">
      {/* Role-Adaptive Sidebar with Fixed Logo, Fixed Bottom Profile, and Internal Scroll */}
      <DashboardSidebar
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        permissions={permissions}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area: Exactly 100vh height with internal scrolling strictly below the header */}
      <div className="flex flex-1 flex-col h-screen min-w-0 overflow-hidden transition-all duration-300">
        <DashboardHeader
          title={title}
          subtitle={subtitle}
          userRole={userRole}
          userName={userName}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
        />

        {/* Content scrollbar starts strictly below the header */}
        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 max-w-[1600px] w-full mx-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
