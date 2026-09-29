import { DashboardShell } from "@/components/dashboard/shell";
import { StaffDashboard } from "@/components/staff/staff-dashboard";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffDashboardPage() {
  // Allow STAFF, ADMIN, and DEPARTMENT_HEAD
  const user = await requirePageRole(["STAFF", "ADMIN", "DEPARTMENT_HEAD"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const _isAdmin =
    user.roles.role_name === "ADMIN" ||
    user.roles.role_name === "DEPARTMENT_HEAD";
  const deptName = user.departments?.department_name || "Operations";
  const employeeCode = user.employee_code || "STF-01";

  return (
    <DashboardShell
      userRole="STAFF"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Staff Workspace"
      subtitle={`Investigation & Resolution Desk • ${deptName}`}
    >
      <StaffDashboard
        staffName={fullName}
        staffEmail={user.email}
        departmentName={deptName}
        employeeCode={employeeCode}
      />
    </DashboardShell>
  );
}
