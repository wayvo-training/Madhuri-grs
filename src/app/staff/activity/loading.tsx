import { DashboardShell } from "@/components/dashboard/shell";
import { StaffActivitySkeleton } from "@/components/staff/skeletons";

export default function StaffActivityLoading() {
  return (
    <DashboardShell
      userRole="STAFF"
      userName="Loading..."
      designation="Grievance Staff"
      departmentName="Operations"
      title="Activity"
      subtitle="Activity Logs & Timeline • Operations"
    >
      <StaffActivitySkeleton />
    </DashboardShell>
  );
}
