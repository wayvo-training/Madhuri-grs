import { AdminUsers } from "@/components/dashboard/admin/admin-users";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type {
  SerializedUser,
  UserDepartmentOption,
  UserRoleOption,
  UserStats,
} from "@/types/admin/users";

export default async function AdminUsersPage() {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const [rawUsers, rawRoles, rawDepartments] = await Promise.all([
    prisma.users.findMany({
      orderBy: { user_id: "desc" },
      include: {
        roles: true,
        departments: true,
        _count: {
          select: {
            assignments_assignments_staff_idTousers: true,
            grievances: true,
          },
        },
      },
    }),
    prisma.roles.findMany({
      where: { status: "ACTIVE" },
      orderBy: { role_id: "asc" },
    }),
    prisma.departments.findMany({
      where: { status: "ACTIVE" },
      orderBy: { department_name: "asc" },
    }),
  ]);

  const serializedUsers: SerializedUser[] = rawUsers.map((u) => ({
    user_id: u.user_id.toString(),
    employee_code: u.employee_code,
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    role_id: u.role_id.toString(),
    role_name: u.roles.role_name,
    department_id: u.department_id ? u.department_id.toString() : null,
    department_name: u.departments ? u.departments.department_name : null,
    status: (u.status as "ACTIVE" | "INACTIVE" | "SUSPENDED") || "ACTIVE",
    created_at: u.created_at.toISOString(),
    assigned_grievances_count: u._count.assignments_assignments_staff_idTousers,
    filed_grievances_count: u._count.grievances,
  }));

  const availableRoles: UserRoleOption[] = rawRoles.map((r) => ({
    role_id: r.role_id.toString(),
    role_name: r.role_name,
    description: r.description,
    status: r.status,
  }));

  const availableDepartments: UserDepartmentOption[] = rawDepartments.map(
    (d) => ({
      department_id: d.department_id.toString(),
      department_name: d.department_name,
      status: d.status,
    }),
  );

  const stats: UserStats = {
    total: serializedUsers.length,
    active: serializedUsers.filter((u) => u.status === "ACTIVE").length,
    inactive: serializedUsers.filter((u) => u.status === "INACTIVE").length,
    suspended: serializedUsers.filter((u) => u.status === "SUSPENDED").length,
    admins: serializedUsers.filter((u) => u.role_name === "ADMIN").length,
    departmentHeads: serializedUsers.filter(
      (u) => u.role_name === "DEPARTMENT_HEAD",
    ).length,
    staff: serializedUsers.filter((u) => u.role_name === "STAFF").length,
    endUsers: serializedUsers.filter((u) => u.role_name === "END_USER").length,
  };

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation="System Administrator"
      departmentName={
        user.departments?.department_name || "Central Administration"
      }
      title="User Directory & Access Control"
      subtitle="Manage administrative accounts, grievance officers, department staff, and platform members"
      mainClassName="overflow-y-auto lg:overflow-hidden flex flex-col"
    >
      <AdminUsers
        initialUsers={serializedUsers}
        availableRoles={availableRoles}
        availableDepartments={availableDepartments}
        stats={stats}
      />
    </DashboardShell>
  );
}
