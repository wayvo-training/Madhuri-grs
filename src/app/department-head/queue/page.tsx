import { DepartmentHeadOverview } from "@/components/dashboard/department-head";
import { getDepartmentHeadPageData } from "@/lib/department-head/get-head-page-data";

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
  const page = resolvedParams.page ? Number(resolvedParams.page) : undefined;
  const limit = resolvedParams.limit ? Number(resolvedParams.limit) : undefined;

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
      initialView="queue"
    />
  );
}
