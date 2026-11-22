import type { Metadata } from "next";
import { ResolutionReportView } from "@/components/reports/resolution/ResolutionReportView";
import { requirePagePermission, requirePageRole } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Department Resolution Analytics (TAT) | GRS",
  description:
    "Departmental turnaround time (TAT), resolution workflow milestones, departmental processing durations, SLA compliance, and rework activity.",
};

export default async function DepartmentHeadResolutionReportPage() {
  const user = await requirePageRole("DEPARTMENT_HEAD");
  await requirePagePermission("VIEW_REPORTS");

  return (
    <ResolutionReportView
      userRole="DEPARTMENT_HEAD"
      departmentName={user.departments?.department_name}
    />
  );
}
