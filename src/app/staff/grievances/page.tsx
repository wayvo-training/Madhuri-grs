import { StaffDashboard } from "@/components/staff/staff-dashboard";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffGrievancesPage() {
  // Allow STAFF, ADMIN, and DEPARTMENT_HEAD
  const user = await requirePageRole(["STAFF", "ADMIN", "DEPARTMENT_HEAD"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const deptName = user.departments?.department_name || "Operations";
  const employeeCode = user.employee_code || "STF-01";

  return (
    <StaffDashboard
      staffName={fullName}
      staffEmail={user.email}
      departmentName={deptName}
      employeeCode={employeeCode}
      defaultView="queue"
    />
  );
}
