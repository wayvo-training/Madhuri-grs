import { CheckSquare, ShieldCheck, User } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffDashboardPage() {
  const user = await requirePageRole("STAFF");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const deptName = user.departments?.department_name || "Assigned Department";

  return (
    <DashboardShell
      userRole="STAFF"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Staff Workspace"
      subtitle={`Investigation & resolution desk &bull; ${deptName}`}
    >
      <div className="space-y-6">
        {/* Role Confirmation Banner */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Role: Staff Member
                </h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {deptName}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Logged in as <span className="font-semibold">{fullName}</span> (
                {user.email}) &bull; Employee Code:{" "}
                <span className="font-mono">{user.employee_code}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Phase Info Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs text-center py-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
            <CheckSquare className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Staff Operations Module
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            This dashboard is dedicated to the Staff role. Grievance
            investigation workflows, evidence attachments, and resolution
            submission forms will be implemented in the staff phase.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Role-Based Route Guard Active &bull; STAFF Access Only</span>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
