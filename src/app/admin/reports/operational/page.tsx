import type { Metadata } from "next";
import { OperationalReportView } from "@/components/reports/operational/OperationalReportView";
import { requirePagePermission, requirePageRole } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Operational Reports | GRS Admin",
  description:
    "System-wide operational reporting on grievance volumes, workflow status, departmental workloads, staff assignments, SLA compliance, and escalations.",
};

export default async function AdminOperationalReportPage() {
  await requirePageRole("ADMIN");
  await requirePagePermission("VIEW_REPORTS");

  return <OperationalReportView userRole="ADMIN" />;
}
