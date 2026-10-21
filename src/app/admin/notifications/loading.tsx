import { NotificationsSkeleton } from "@/components/common/skeletons";
import { DashboardShell } from "@/components/dashboard/shell";

export default function AdminNotificationsLoading() {
  return (
    <DashboardShell
      userRole="ADMIN"
      userName="Loading..."
      designation="System Administrator"
      departmentName="Central Administration"
      title="Notifications"
      subtitle="Stay informed about grievance activity, SLA events, and actions that require your attention."
    >
      <NotificationsSkeleton />
    </DashboardShell>
  );
}
