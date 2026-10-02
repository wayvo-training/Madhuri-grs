import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";

export default async function EndUserProfilePage() {
  const user = await requirePageRole("END_USER");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  return (
    <DashboardShell
      userRole="END_USER"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Employee Profile"
      subtitle="Manage your employee details and preferences."
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 shadow-sm text-center">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Profile Details</h2>
        <p className="mt-2 text-slate-500">Profile management coming soon.</p>
      </div>
    </DashboardShell>
  );
}
