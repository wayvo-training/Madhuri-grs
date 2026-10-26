import { KnowledgeView } from "@/components/dashboard/department-head/views";
import { requirePageRole } from "@/lib/permissions";

export default async function DepartmentHeadKnowledgePage() {
  await requirePageRole(["DEPARTMENT_HEAD", "ADMIN"]);

  return <KnowledgeView />;
}
