import { StaffProfileClient } from "@/components/staff/StaffProfileClient";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffProfilePage() {
  await requirePageRole(["STAFF", "ADMIN", "DEPARTMENT_HEAD"]);

  return <StaffProfileClient />;
}
