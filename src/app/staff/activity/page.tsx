import { StaffActivityView } from "@/components/staff/staff-activity-view";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffActivityPage() {
  const user = await requirePageRole(["STAFF", "ADMIN", "DEPARTMENT_HEAD"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  return <StaffActivityView staffName={fullName} />;
}
