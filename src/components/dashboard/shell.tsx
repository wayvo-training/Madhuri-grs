"use client";

import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import type { UserRole } from "@/components/dashboard/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background font-sans antialiased">
        <DashboardSidebar
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          permissions={permissions}
        />
        <SidebarInset className="flex flex-1 flex-col min-w-0 overflow-hidden bg-background">
          <DashboardHeader
            title={title}
            subtitle={subtitle}
            userRole={userRole}
            userName={userName}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
          />
          <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 max-w-[1600px] w-full mx-auto custom-scrollbar flex flex-col">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
