import { DashboardShell } from "@/components/dashboard/shell";
import { StaffGrievanceDetailSkeleton } from "@/components/staff/skeletons";

export default function StaffGrievanceDetailLoading() {
  return (
    <DashboardShell
      userRole="STAFF"
      userName="Loading..."
      designation="Grievance Staff"
      departmentName="Operations"
      title="Staff Workspace"
      subtitle="Investigation & Resolution Desk • Operations"
    >
      <StaffGrievanceDetailSkeleton />
    </DashboardShell>
  );
}
