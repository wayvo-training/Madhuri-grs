import { DashboardShell } from "@/components/dashboard/shell";
import { StaffDashboardSkeleton } from "@/components/staff/skeletons";

export default function StaffDashboardLoading() {
  return (
    <DashboardShell
      userRole="STAFF"
      userName="Loading..."
      designation="Grievance Staff"
      departmentName="Operations"
      title="Staff Workspace"
      subtitle="Investigation & Resolution Desk • Operations"
      mainClassName="flex-1 min-h-0 flex flex-col overflow-hidden pb-1"
    >
      <StaffDashboardSkeleton />
    </DashboardShell>
  );
}
