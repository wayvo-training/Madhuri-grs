import { StaffDashboard } from "@/components/staff/staff-dashboard";
import { requirePageRole } from "@/lib/permissions";
import type { StaffQueueTab } from "@/types/staff";

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StaffGrievancesPage({ searchParams }: PageProps) {
  // Allow STAFF, ADMIN, and DEPARTMENT_HEAD
  const user = await requirePageRole(["STAFF", "ADMIN", "DEPARTMENT_HEAD"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const deptName = user.departments?.department_name || "Operations";
  const employeeCode = user.employee_code || "STF-01";

  const resolvedParams = searchParams ? await searchParams : {};
  const tabParam =
    typeof resolvedParams.tab === "string"
      ? (resolvedParams.tab as StaffQueueTab)
      : undefined;

  return (
    <StaffDashboard
      staffName={fullName}
      staffEmail={user.email}
      departmentName={deptName}
      employeeCode={employeeCode}
      defaultView="queue"
      initialTab={tabParam}
    />
  );
}
