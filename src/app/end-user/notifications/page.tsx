import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";

export default async function EndUserNotificationPage() {
  const user = await requirePageRole("END_USER");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  return (
    <DashboardShell
      userRole="END_USER"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Notifications"
      subtitle="View alerts and updates on your grievances."
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 shadow-sm text-center">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Notifications</h2>
        <p className="mt-2 text-slate-500">Notifications list coming soon.</p>
      </div>
    </DashboardShell>
  );
}
