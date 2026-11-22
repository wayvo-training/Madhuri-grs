import type { Metadata } from "next";
import { PatternAnalysisView } from "@/components/reports/patterns/PatternAnalysisView";
import { requirePagePermission, requirePageRole } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Trend & Pattern Analysis | GRS Admin",
  description:
    "System-wide recurring pattern detection and category clustering across sliding 30-day analysis windows.",
};

export default async function AdminPatternReportsPage() {
  await requirePageRole("ADMIN");
  await requirePagePermission("VIEW_REPORTS");

  return <PatternAnalysisView userRole="ADMIN" />;
}
