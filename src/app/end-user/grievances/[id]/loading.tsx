import { GrievanceDetails4TabSkeleton } from "@/components/common/skeletons";
import { DashboardShell } from "@/components/dashboard/shell";

export default function EndUserGrievanceDetailsLoading() {
  return (
    <DashboardShell
      userRole="END_USER"
      userName="Loading..."
      designation="Employee"
      departmentName="General Public"
      title="Grievance Details"
      subtitle="View full details, resolution, tracking, and documents."
      mainClassName="flex-1 min-h-0 flex flex-col overflow-hidden pb-1"
    >
      <GrievanceDetails4TabSkeleton />
    </DashboardShell>
  );
}
