import { redirect } from "next/navigation";
import { StaffDashboard } from "@/components/staff/staff-dashboard";
import { requirePageRole } from "@/lib/permissions";
import type { StaffView } from "@/types/staff";

interface StaffDashboardPageProps {
  searchParams?: Promise<{ view?: string; tab?: string }>;
}

export default async function StaffDashboardPage({
  searchParams,
}: StaffDashboardPageProps) {
  const user = await requirePageRole("STAFF");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const deptName = user.departments?.department_name || "Operations";
  const employeeCode = user.employee_code || "STF-01";

  const resolvedParams = searchParams ? await searchParams : {};
  if (resolvedParams?.view === "profile") {
    redirect("/staff/profile");
  }

  const defaultView: StaffView =
    resolvedParams?.view === "queue"
      ? "queue"
      : resolvedParams?.view === "activity"
        ? "activity"
        : "overview";

  const tabParam =
    typeof resolvedParams?.tab === "string"
      ? (resolvedParams.tab as import("@/types/staff").StaffQueueTab)
      : undefined;

  return (
    <StaffDashboard
      staffName={fullName}
      staffEmail={user.email}
      departmentName={deptName}
      employeeCode={employeeCode}
      defaultView={defaultView}
      initialTab={tabParam}
    />
  );
}
