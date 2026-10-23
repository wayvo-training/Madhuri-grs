import { DepartmentHeadOverview } from "@/components/dashboard/department-head";
import { getDepartmentHeadPageData } from "@/lib/department-head/get-head-page-data";
import type { DepartmentHeadTab } from "@/types/department-head";

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DepartmentHeadQueuePage({
  searchParams,
}: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const deptId =
    typeof resolvedParams.deptId === "string"
      ? resolvedParams.deptId
      : undefined;
  const statusParam =
    typeof resolvedParams.status === "string"
      ? resolvedParams.status
      : undefined;
  const priorityParam =
    typeof resolvedParams.priority === "string"
      ? resolvedParams.priority
      : undefined;
  const staffParam =
    typeof resolvedParams.staff === "string" ? resolvedParams.staff : undefined;
  const tabParam =
    typeof resolvedParams.tab === "string"
      ? (resolvedParams.tab as DepartmentHeadTab)
      : undefined;

  const {
    finalDeptName,
    hodName,
    hodEmail,
    employeeCode,
    isAdmin,
    initialData,
  } = await getDepartmentHeadPageData({ deptId });

  return (
    <DepartmentHeadOverview
      initialData={initialData}
      departmentName={finalDeptName}
      hodName={hodName}
      hodEmail={hodEmail}
      employeeCode={employeeCode}
      isAdminPreview={isAdmin}
      initialView="queue"
      initialStatusFilter={statusParam}
      initialPriorityFilter={priorityParam}
      initialStaffFilter={staffParam}
      initialTab={tabParam}
    />
  );
}
