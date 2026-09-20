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
}: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize from localStorage after mounting
  useEffect(() => {
    try {
      const saved = localStorage.getItem("grs_sidebar_collapsed");
      if (saved === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // Ignore localStorage access issues
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
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased">
      {/* Role-Adaptive Sidebar with Collapsible Desktop State */}
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

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300">
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
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
