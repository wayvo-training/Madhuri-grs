import { DashboardShell } from "@/components/dashboard/shell";
import { StaffProfileSkeleton } from "@/components/staff/skeletons";

export default function StaffProfileLoading() {
  return (
    <DashboardShell
      userRole="STAFF"
      userName="Loading..."
      designation="Grievance Staff"
      departmentName="Operations"
      title="Staff Profile"
      subtitle="Operational workload & capacity profile • Operations"
    >
      <StaffProfileSkeleton />
    </DashboardShell>
  );
}
