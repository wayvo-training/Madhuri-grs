import { NotificationsPageView } from "@/components/notifications/NotificationsPageView";
import { requirePageRole } from "@/lib/permissions";

export default async function EndUserNotificationPage() {
  const user = await requirePageRole("END_USER");

  return (
    <NotificationsPageView
      userRole="END_USER"
      currentUserId={user.user_id.toString()}
    />
  );
}
