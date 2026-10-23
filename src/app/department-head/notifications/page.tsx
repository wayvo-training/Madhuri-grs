import { NotificationsPageView } from "@/components/notifications/NotificationsPageView";
import { requirePageRole } from "@/lib/permissions";

export default async function DepartmentHeadNotificationPage() {
  const user = await requirePageRole("DEPARTMENT_HEAD");

  return (
    <NotificationsPageView
      userRole="DEPARTMENT_HEAD"
      currentUserId={user.user_id.toString()}
    />
  );
}
