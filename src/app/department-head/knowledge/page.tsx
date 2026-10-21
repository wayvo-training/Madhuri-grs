import { DepartmentHeadOverview } from "@/components/dashboard/department-head";
import { getDepartmentHeadPageData } from "@/lib/department-head/get-head-page-data";

export default async function DepartmentHeadKnowledgePage() {
  const { finalDeptName, hodName, hodEmail, employeeCode, isAdmin } =
    await getDepartmentHeadPageData();

  return (
    <DepartmentHeadOverview
      departmentName={finalDeptName}
      hodName={hodName}
      hodEmail={hodEmail}
      employeeCode={employeeCode}
      isAdminPreview={isAdmin}
      initialView="knowledge"
    />
  );
}
