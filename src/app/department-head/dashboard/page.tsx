import { DepartmentHeadOverview } from "@/components/dashboard/department-head/department-head-overview";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";

export default async function DepartmentHeadDashboardPage() {
  // Allow both DEPARTMENT_HEAD and ADMIN (for development & preview convenience)
  const user = await requirePageRole(["DEPARTMENT_HEAD", "ADMIN"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const isAdmin = user.roles.role_name === "ADMIN";
  const deptName =
    user.departments?.department_name ||
    (isAdmin ? "Finance & Accounts Department" : "Department Operations");

  return (
    <DashboardShell
      userRole={
        isAdmin
          ? "DEPARTMENT_HEAD"
          : (user.roles.role_name as "DEPARTMENT_HEAD")
      }
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Department Head Portal"
      subtitle={`Operational queue, staff assignment & SLA oversight for ${deptName}`}
    >
      <DepartmentHeadOverview
        departmentName={deptName}
        hodName={fullName}
        hodEmail={user.email}
        employeeCode={user.employee_code || "HOD-DEPT-01"}
        isAdminPreview={isAdmin}
      />
    </DashboardShell>
  );
}
