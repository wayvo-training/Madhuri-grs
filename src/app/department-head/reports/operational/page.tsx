import type { Metadata } from "next";
import { OperationalReportView } from "@/components/reports/operational/OperationalReportView";
import { requirePagePermission, requirePageRole } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Department Operational Reports | GRS",
  description:
    "Departmental operational reporting on grievance volumes, workflow distribution, staff assignments, SLA compliance, and escalations.",
};

export default async function DepartmentHeadOperationalReportPage() {
  const user = await requirePageRole("DEPARTMENT_HEAD");
  await requirePagePermission("VIEW_REPORTS");

  return (
    <OperationalReportView
      userRole="DEPARTMENT_HEAD"
      departmentName={user.departments?.department_name}
    />
  );
}
