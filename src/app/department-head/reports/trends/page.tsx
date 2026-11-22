import type { Metadata } from "next";
import { PatternAnalysisView } from "@/components/reports/patterns/PatternAnalysisView";
import { requirePagePermission, requirePageRole } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Department Trend & Pattern Analysis | GRS",
  description:
    "Departmental recurring pattern detection and category clustering across sliding 30-day analysis windows.",
};

export default async function DepartmentHeadPatternReportsPage() {
  const user = await requirePageRole("DEPARTMENT_HEAD");
  await requirePagePermission("VIEW_REPORTS");

  return (
    <PatternAnalysisView
      userRole="DEPARTMENT_HEAD"
      departmentName={user.departments?.department_name}
    />
  );
}
