import { DashboardShell } from "@/components/dashboard/shell";
import { NotificationsPageView } from "@/components/notifications/NotificationsPageView";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function DepartmentHeadNotificationPage() {
  const user = await requirePageRole(["DEPARTMENT_HEAD", "ADMIN"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const isAdmin = user.roles.role_name === "ADMIN";

  let deptName = user.departments?.department_name;
  if (!deptName && isAdmin) {
    const firstDept = await prisma.departments.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { department_id: "asc" },
    });
    deptName = firstDept?.department_name || "Department Operations";
  }

  return (
    <DashboardShell
      userRole="DEPARTMENT_HEAD"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation="Department Head"
      departmentName={deptName || "Department Operations"}
      title="Notifications"
      subtitle="Stay informed about grievance activity, SLA events, and actions that require your attention."
    >
      <NotificationsPageView
        userRole="DEPARTMENT_HEAD"
        currentUserId={user.user_id.toString()}
      />
    </DashboardShell>
  );
}
