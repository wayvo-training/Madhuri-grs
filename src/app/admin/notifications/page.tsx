import { NotificationsPageView } from "@/components/notifications/NotificationsPageView";
import { requirePageRole } from "@/lib/permissions";

export default async function AdminNotificationPage() {
  const user = await requirePageRole("ADMIN");

  return (
    <NotificationsPageView
      userRole="ADMIN"
      currentUserId={user.user_id.toString()}
    />
  );
}
