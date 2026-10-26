import type React from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("STAFF");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const deptName = user.departments?.department_name || "Operations";

  return (
    <DashboardShell
      userRole="STAFF"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation="Grievance Staff"
      departmentName={deptName}
    >
      {children}
    </DashboardShell>
  );
}
