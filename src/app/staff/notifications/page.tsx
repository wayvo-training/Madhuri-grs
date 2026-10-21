import { NotificationsPageView } from "@/components/notifications/NotificationsPageView";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffNotificationPage() {
  const user = await requirePageRole(["STAFF", "ADMIN", "DEPARTMENT_HEAD"]);

  return (
    <NotificationsPageView
      userRole="STAFF"
      currentUserId={user.user_id.toString()}
    />
  );
}
