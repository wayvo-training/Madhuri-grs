import { EndUserDashboardSkeleton } from "@/components/common/skeletons";
import { DashboardShell } from "@/components/dashboard/shell";

export default function EndUserDashboardLoading() {
  return (
    <DashboardShell
      userRole="END_USER"
      userName="Loading..."
      designation="Employee"
      departmentName="General Public"
      title="Employee Portal"
      subtitle="Submit, track, and manage all your corporate grievances in one central hub."
    >
      <EndUserDashboardSkeleton />
    </DashboardShell>
  );
}
