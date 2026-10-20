import { DashboardShell } from "@/components/dashboard/shell";
import { StaffProfileClient } from "@/components/staff/StaffProfileClient";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffProfilePage() {
  const user = await requirePageRole(["STAFF", "ADMIN", "DEPARTMENT_HEAD"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const deptName = user.departments?.department_name || "Operations";

  const designation =
    user.roles.role_name === "ADMIN"
      ? "System Administrator"
      : user.roles.role_name === "DEPARTMENT_HEAD"
        ? "Department Head"
        : "Grievance Staff";

  return (
    <DashboardShell
      userRole="STAFF"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation={designation}
      departmentName={deptName}
      title="Staff Profile"
      subtitle={`Operational workload & capacity profile • ${deptName}`}
    >
      <StaffProfileClient />
    </DashboardShell>
  );
}
