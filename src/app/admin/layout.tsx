import type React from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation="Grievance Admin"
      departmentName={
        user.departments?.department_name || "Central Administration"
      }
      mainClassName="pb-3 sm:pb-3.5 h-full flex flex-col"
    >
      {children}
    </DashboardShell>
  );
}
