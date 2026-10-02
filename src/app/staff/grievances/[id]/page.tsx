import { DashboardShell } from "@/components/dashboard/shell";
import { StaffSingleGrievanceView } from "@/components/staff/staff-single-grievance-view";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffGrievanceDetailPage({ params }: PageProps) {
  const user = await requirePageRole(["STAFF", "ADMIN", "DEPARTMENT_HEAD"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const isAdmin =
    user.roles.role_name === "ADMIN" ||
    user.roles.role_name === "DEPARTMENT_HEAD";
  const deptName = user.departments?.department_name || "Operations";

  const { id } = await params;

  // Fetch HOD info
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
    : undefined;

  return (
    <DashboardShell
      userRole={isAdmin ? "STAFF" : (user.roles.role_name as "STAFF")}
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Grievance Examination"
      subtitle={`Case file review & investigation workspace • ${deptName}`}
    >
      <StaffSingleGrievanceView
        grievanceId={id}
        staffName={fullName}
        staffEmail={user.email}
        hodEmail={hodUser?.email}
        hodName={hodFullName}
      />
    </DashboardShell>
  );
}
