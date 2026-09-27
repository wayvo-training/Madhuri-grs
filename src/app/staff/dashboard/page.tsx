import { CheckSquare, ShieldCheck, User } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import {
  type AssignedCaseEmailItem,
  StaffEmailHub,
} from "@/components/dashboard/staff/StaffEmailHub";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function StaffDashboardPage() {
  const user = await requirePageRole("STAFF");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const deptName = user.departments?.department_name || "Assigned Department";

  // 1. Fetch Department Head details for this staff member's department
  let hodUser: {
    first_name: string;
    last_name: string | null;
    email: string;
  } | null = null;

  if (user.department_id) {
    hodUser = await prisma.users.findFirst({
      where: {
        department_id: user.department_id,
        roles: { role_name: "DEPARTMENT_HEAD" },
        status: "ACTIVE",
      },
      select: {
        first_name: true,
        last_name: true,
        email: true,
      },
    });
  }

  const hodFullName = hodUser
    ? `${hodUser.first_name} ${hodUser.last_name || ""}`.trim()
    : null;

  // 2. Fetch assigned cases for this staff member
  const rawAssignments = await prisma.assignments.findMany({
    where: {
      staff_id: user.user_id,
      assignment_status: "ASSIGNED",
    },
    include: {
      grievances: {
        include: {
          users: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          categories: {
            select: {
              category_name: true,
            },
          },
        },
      },
    },
    take: 15,
    orderBy: {
      assigned_at: "desc",
    },
  });

  const assignedCases: AssignedCaseEmailItem[] = rawAssignments.map((a) => {
    const g = a.grievances;
    const submitter = g.users;
    const submitterFullName = submitter
      ? `${submitter.first_name} ${submitter.last_name || ""}`.trim()
      : "Complainant";

    return {
      id: String(g.grievance_id),
      ticketCode: g.grievance_number,
      title: g.title,
      category: g.categories?.category_name || "General",
      priority: g.priority,
      submitterName: submitterFullName,
      submitterEmail: submitter?.email || "",
    };
  });

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

        {/* Staff Email & Direct Complainant Communications Hub */}
        <StaffEmailHub
          staffName={fullName}
          staffEmail={user.email}
          departmentName={deptName}
          hodName={hodFullName}
          hodEmail={hodUser?.email || null}
          assignedCases={assignedCases}
        />

        {/* Phase Info Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs text-center py-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3">
            <CheckSquare className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Staff Investigation Queue Module
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            Dedicated workspace for assigned officers. Use the communications
            hub above to reach citizens and your department supervisor directly.
            Full investigation forms and evidence uploads will unlock with each
            active case.
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
