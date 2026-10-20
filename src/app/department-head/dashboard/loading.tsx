import { DepartmentHeadDashboardSkeleton } from "@/components/common/skeletons";
import { DashboardShell } from "@/components/dashboard/shell";

export default function DepartmentHeadDashboardLoading() {
  return (
    <DashboardShell
      userRole="DEPARTMENT_HEAD"
      userName="Department Head"
      userEmail="department.head@grs.gov.in"
      designation="Department Head"
      departmentName="Department Operations"
      title="Department Head Portal"
      subtitle="Operational queue, staff assignment & SLA oversight"
    >
      <DepartmentHeadDashboardSkeleton />
    </DashboardShell>
  );
}
