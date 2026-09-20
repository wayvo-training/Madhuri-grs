import {
  AdminUserDirectory,
  type SerializedUser,
} from "@/components/dashboard/admin/admin-user-directory";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const [rawUsers, departments, rawRoles] = await Promise.all([
    prisma.users.findMany({
      orderBy: { created_at: "desc" },
      include: {
        roles: true,
        departments: true,
      },
    }),
    prisma.departments.findMany({
      where: { status: "ACTIVE" },
      select: {
        department_id: true,
        department_name: true,
      },
      orderBy: { department_name: "asc" },
    }),
    prisma.roles.findMany({
      orderBy: { role_id: "asc" },
      select: {
        role_id: true,
        role_name: true,
      },
    }),
  ]);

  const serializedUsers: SerializedUser[] = rawUsers.map((u) => ({
    user_id: u.user_id.toString(),
    employee_code: u.employee_code,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    role_name: u.roles.role_name,
    department_name: u.departments?.department_name || null,
    status: u.status,
    created_at: u.created_at.toISOString(),
  }));

  const serializedDepartments = departments.map((d) => ({
    department_id: d.department_id.toString(),
    department_name: d.department_name,
  }));

  const serializedRoles = rawRoles.map((r) => ({
    role_id: r.role_id.toString(),
    role_name: r.role_name,
  }));

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="System User Directory & Onboarding"
      subtitle="Corporate employee registry, department placement & role credentials"
    >
      <AdminUserDirectory
        initialUsers={serializedUsers}
        departments={serializedDepartments}
        roles={serializedRoles}
      />
    </DashboardShell>
  );
}
