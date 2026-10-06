import { DashboardShell } from "@/components/dashboard/shell";
import { NotificationsPageView } from "@/components/notifications/NotificationsPageView";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffNotificationPage() {
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
      title="Notifications"
      subtitle="Stay informed about grievance activity, SLA events, and actions that require your attention."
    >
      <NotificationsPageView
        userRole="STAFF"
        currentUserId={user.user_id.toString()}
      />
    </DashboardShell>
  );
}
