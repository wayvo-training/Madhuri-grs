import { EndUserGrievancesSkeleton } from "@/components/common/skeletons";
import { DashboardShell } from "@/components/dashboard/shell";

export default function EndUserGrievancesLoading() {
  return (
    <DashboardShell
      userRole="END_USER"
      userName="Loading..."
      designation="Employee"
      departmentName="General Public"
      title="My Grievances"
      subtitle="Track all grievances you have submitted"
      mainClassName="flex-1 min-h-0 flex flex-col overflow-hidden pb-1"
    >
      <EndUserGrievancesSkeleton />
    </DashboardShell>
  );
}
