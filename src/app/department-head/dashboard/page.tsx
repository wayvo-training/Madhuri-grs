import { DepartmentHeadOverview } from "@/components/dashboard/department-head";
import { getDepartmentHeadPageData } from "@/lib/department-head/get-head-page-data";

import type { DepartmentHeadView } from "@/types/department-head";

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DepartmentHeadDashboardPage({
  searchParams,
}: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const deptId =
    typeof resolvedParams.deptId === "string"
      ? resolvedParams.deptId
      : undefined;
  const page = resolvedParams.page ? Number(resolvedParams.page) : undefined;
  const limit = resolvedParams.limit ? Number(resolvedParams.limit) : undefined;

  const rawTab =
    typeof resolvedParams.tab === "string"
      ? resolvedParams.tab.toLowerCase()
      : typeof resolvedParams.view === "string"
        ? resolvedParams.view.toLowerCase()
        : undefined;

  const validViews: DepartmentHeadView[] = [
    "overview",
    "queue",
    "staff",
    "activity",
    "knowledge",
    "notifications",
  ];

  const queueTabs = [
    "all",
    "closed",
    "resolved",
    "escalated",
    "unassigned",
    "in_progress",
    "exceptions",
    "sla_risk",
    "sla_critical",
    "reopened",
    "high_critical",
    "at_risk",
    "cross_dept",
    "resolution_review",
  ];

  const initialView: DepartmentHeadView =
    rawTab && validViews.includes(rawTab as DepartmentHeadView)
      ? (rawTab as DepartmentHeadView)
      : rawTab && queueTabs.includes(rawTab)
        ? "queue"
        : resolvedParams.status ||
            resolvedParams.priority ||
            resolvedParams.staff
          ? "queue"
          : "overview";

  const rawStatus =
    typeof resolvedParams.status === "string"
      ? resolvedParams.status.toUpperCase()
      : undefined;

  const rawPriority =
    typeof resolvedParams.priority === "string"
      ? resolvedParams.priority.toUpperCase()
      : undefined;

  const rawStaff =
    typeof resolvedParams.staff === "string" ? resolvedParams.staff : undefined;

  const initialQueueTab =
    rawTab && queueTabs.includes(rawTab)
      ? (rawTab.toUpperCase() as import("@/types/department-head").DepartmentHeadTab)
      : rawStatus === "CLOSED"
        ? "CLOSED"
        : undefined;

  const {
    finalDeptName,
    hodName,
    hodEmail,
    employeeCode,
    isAdmin,
    initialData,
  } = await getDepartmentHeadPageData({ deptId, page, limit });

  return (
    <DepartmentHeadOverview
      initialData={initialData}
      departmentName={finalDeptName}
      hodName={hodName}
      hodEmail={hodEmail}
      employeeCode={employeeCode}
      isAdminPreview={isAdmin}
      initialView={initialView}
      initialStatusFilter={rawStatus}
      initialPriorityFilter={rawPriority}
      initialStaffFilter={rawStaff}
      initialTab={initialQueueTab}
    />
  );
}
