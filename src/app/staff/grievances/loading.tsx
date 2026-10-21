import { DashboardShell } from "@/components/dashboard/shell";
import { StaffQueueSkeleton } from "@/components/staff/skeletons";

export default function StaffGrievancesLoading() {
  return (
    <DashboardShell
      userRole="STAFF"
      userName="Loading..."
      designation="Grievance Staff"
      departmentName="Operations"
      title="My Grievances"
      subtitle="Assigned Investigation & Inquiry Queue • Operations"
      mainClassName="flex-1 min-h-0 flex flex-col overflow-hidden pb-1"
    >
      <StaffQueueSkeleton />
    </DashboardShell>
  );
}
