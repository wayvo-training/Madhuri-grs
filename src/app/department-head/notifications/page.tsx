import { NotificationsPageView } from "@/components/notifications/NotificationsPageView";
import { requirePageRole } from "@/lib/permissions";

export default async function DepartmentHeadNotificationPage() {
  const user = await requirePageRole(["DEPARTMENT_HEAD", "ADMIN"]);

  return (
    <NotificationsPageView
      userRole="DEPARTMENT_HEAD"
      currentUserId={user.user_id.toString()}
    />
  );
}
