import {
  AdminDepartments,
  type SerializedDepartment,
} from "@/components/dashboard/admin/admin-departments";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function AdminDepartmentsPage() {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const [totalGrievances, departments, activeCount, inactiveCount, deptHeads] =
    await Promise.all([
      prisma.grievances.count(),
      prisma.departments.findMany({
        select: {
          department_id: true,
          department_name: true,
          description: true,
          status: true,
          _count: {
            select: { grievance_departments: true, users: true },
          },
        },
        orderBy: { department_name: "asc" },
      }),
      prisma.departments.count({ where: { status: "ACTIVE" } }),
      prisma.departments.count({ where: { status: "INACTIVE" } }),
      prisma.users.findMany({
        where: {
          status: "ACTIVE",
          roles: { role_name: { in: ["DEPARTMENT_HEAD", "ADMIN"] } },
        },
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
        orderBy: { first_name: "asc" },
      }),
    ]);

  const serializedDepartments: SerializedDepartment[] = departments.map(
    (d) => ({
      department_id: d.department_id.toString(),
      department_name: d.department_name,
      description: d.description,
      status: d.status,
      user_count: d._count.users,
      grievance_count: d._count.grievance_departments,
    }),
  );

  const serializedHeads = deptHeads.map((h) => ({
    user_id: h.user_id.toString(),
    first_name: h.first_name,
    last_name: h.last_name || "",
    email: h.email,
  }));

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Department & Organization Management"
      subtitle="Enterprise divisions, workload distribution, and resolution mandates"
    >
      <div className="space-y-6">
        <AdminDepartments
          initialDepartments={serializedDepartments}
          departmentHeads={serializedHeads}
          totalGrievances={totalGrievances}
          stats={{
            total: departments.length,
            active: activeCount,
            inactive: inactiveCount,
            totalGrievances,
          }}
        />
      </div>
    </DashboardShell>
  );
}
