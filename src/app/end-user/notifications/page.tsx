import { DashboardShell } from "@/components/dashboard/shell";
import { NotificationsPageView } from "@/components/notifications/NotificationsPageView";
import { requirePageRole } from "@/lib/permissions";

export default async function EndUserNotificationPage() {
  const user = await requirePageRole("END_USER");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  return (
    <DashboardShell
      userRole="END_USER"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation="Employee"
      departmentName={user.departments?.department_name || "Employee"}
      title="Notifications"
      subtitle="Stay informed about grievance activity, SLA events, and actions that require your attention."
    >
      <NotificationsPageView
        userRole="END_USER"
        currentUserId={user.user_id.toString()}
      />
    </DashboardShell>
  );
}
