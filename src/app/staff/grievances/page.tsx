import { DashboardShell } from "@/components/dashboard/shell";
import { StaffDashboard } from "@/components/staff/staff-dashboard";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffGrievancesPage() {
  // Allow STAFF, ADMIN, and DEPARTMENT_HEAD
  const user = await requirePageRole(["STAFF", "ADMIN", "DEPARTMENT_HEAD"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const deptName = user.departments?.department_name || "Operations";
  const employeeCode = user.employee_code || "STF-01";

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
      title="My Grievances"
      subtitle={`Assigned Investigation & Inquiry Queue • ${deptName}`}
      mainClassName="flex-1 min-h-0 flex flex-col overflow-hidden pb-1"
    >
      <StaffDashboard
        staffName={fullName}
        staffEmail={user.email}
        departmentName={deptName}
        employeeCode={employeeCode}
        defaultView="queue"
      />
    </DashboardShell>
  );
}
