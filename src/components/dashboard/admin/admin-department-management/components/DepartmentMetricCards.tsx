import { Activity, Building2, CheckCircle2, Power } from "lucide-react";
import { AdminMetricCard } from "@/components/dashboard/admin/admin-shared";
import type {
  DepartmentStats,
  SerializedDepartment,
} from "@/types/admin/departments";

interface DepartmentMetricCardsProps {
  departments: SerializedDepartment[];
  totalGrievances: number;
  stats?: DepartmentStats;
}

export function DepartmentMetricCards({
  departments,
  totalGrievances,
  stats,
}: DepartmentMetricCardsProps) {
  const total = stats?.total ?? departments.length;
  const active =
    stats?.active ??
    departments.filter((d) => (d.status || "ACTIVE") === "ACTIVE").length;
  const inactive =
    stats?.inactive ??
    departments.filter((d) => d.status === "INACTIVE").length;
  const cases = stats?.totalGrievances ?? totalGrievances;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminMetricCard
        title="Total Departments"
        value={total}
        helper="Divisions"
        icon={Building2}
        accent="emerald"
      />
      <AdminMetricCard
        title="Active Departments"
        value={active}
        helper="Routing enabled"
        icon={CheckCircle2}
        accent="emerald"
      />
      <AdminMetricCard
        title="Deactivated / Inactive"
        value={inactive}
        helper="Suspended"
        icon={Power}
        accent="amber"
      />
      <AdminMetricCard
        title="Assigned Grievances"
        value={cases}
        helper="In lifecycle"
        icon={Activity}
        accent="slate"
      />
    </div>
  );
}
