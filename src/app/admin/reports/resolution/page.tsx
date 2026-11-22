import type { Metadata } from "next";
import { ResolutionReportView } from "@/components/reports/resolution/ResolutionReportView";
import { requirePagePermission, requirePageRole } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Resolution Analytics (TAT) | GRS Admin",
  description:
    "Organization-wide resolution analytics, turnaround times (TAT), departmental processing durations, SLA compliance, and rework activity.",
};

export default async function AdminResolutionReportPage() {
  await requirePageRole("ADMIN");
  await requirePagePermission("VIEW_REPORTS");

  return <ResolutionReportView userRole="ADMIN" />;
}
