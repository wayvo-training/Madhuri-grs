import { DashboardShell } from "@/components/dashboard/shell";
import { NotificationsPageView } from "@/components/notifications/NotificationsPageView";
import { requirePageRole } from "@/lib/permissions";

export default async function AdminNotificationPage() {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation="System Administrator"
      departmentName="Central Administration"
      title="Notifications"
      subtitle="Stay informed about grievance activity, SLA events, and actions that require your attention."
    >
      <NotificationsPageView
        userRole="ADMIN"
        currentUserId={user.user_id.toString()}
      />
    </DashboardShell>
  );
}
