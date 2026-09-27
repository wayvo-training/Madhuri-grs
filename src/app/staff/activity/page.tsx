import { DashboardShell } from "@/components/dashboard/shell";
import { StaffActivityView } from "@/components/staff/staff-activity-view";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffActivityPage() {
  const user = await requirePageRole(["STAFF", "ADMIN", "DEPARTMENT_HEAD"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const deptName = user.departments?.department_name || "Operations";

  return (
    <DashboardShell
      userRole="STAFF"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Staff Workspace"
      subtitle={`Investigation & Resolution Desk • ${deptName}`}
    >
      <StaffActivityView staffName={fullName} />
    </DashboardShell>
  );
}
