import { NotificationsSkeleton } from "@/components/common/skeletons";
import { DashboardShell } from "@/components/dashboard/shell";

export default function DepartmentHeadNotificationsLoading() {
  return (
    <DashboardShell
      userRole="DEPARTMENT_HEAD"
      userName="Loading..."
      designation="Department Head"
      departmentName="Department Operations"
      title="Notifications"
      subtitle="Stay informed about grievance activity, SLA events, and actions that require your attention."
    >
      <NotificationsSkeleton />
    </DashboardShell>
  );
}
