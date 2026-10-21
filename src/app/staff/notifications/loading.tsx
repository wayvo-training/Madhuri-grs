import { DashboardShell } from "@/components/dashboard/shell";
import { StaffNotificationsSkeleton } from "@/components/staff/skeletons";

export default function StaffNotificationsLoading() {
  return (
    <DashboardShell
      userRole="STAFF"
      userName="Loading..."
      designation="Grievance Staff"
      departmentName="Operations"
      title="Notifications"
      subtitle="Stay informed about grievance activity, SLA events, and actions that require your attention."
    >
      <StaffNotificationsSkeleton />
    </DashboardShell>
  );
}
