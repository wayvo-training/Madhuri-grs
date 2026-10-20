import { NotificationsSkeleton } from "@/components/common/skeletons";
import { DashboardShell } from "@/components/dashboard/shell";

export default function EndUserNotificationsLoading() {
  return (
    <DashboardShell
      userRole="END_USER"
      userName="Loading..."
      designation="Employee"
      departmentName="Employee"
      title="Notifications"
      subtitle="Stay informed about grievance activity, SLA events, and actions that require your attention."
    >
      <NotificationsSkeleton />
    </DashboardShell>
  );
}
