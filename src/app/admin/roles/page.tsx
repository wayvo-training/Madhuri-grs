import {
  AdminRolesManager,
  type SerializedPermission,
  type SerializedRole,
} from "@/components/dashboard/admin/admin-role-manager";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function AdminRolesPage() {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const [rawRoles, rawPermissions] = await Promise.all([
    prisma.roles.findMany({
      where: {
        role_name: {
          not: "ADMIN",
        },
      },
      orderBy: { role_id: "asc" },
      include: {
        _count: { select: { users: true } },
        role_permissions: {
          include: { permissions: true },
        },
      },
    }),
    prisma.permissions.findMany({
      orderBy: { permission_id: "asc" },
    }),
  ]);

  const serializedRoles: SerializedRole[] = rawRoles.map((r) => ({
    role_id: r.role_id.toString(),
    role_name: r.role_name,
    description: r.description,
    status: (r.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    user_count: r._count.users,
    permissions: r.role_permissions.map((rp) => ({
      permission_id: rp.permissions.permission_id.toString(),
      permission_code: rp.permissions.permission_code,
      permission_name: rp.permissions.permission_name,
    })),
  }));

  const serializedPermissions: SerializedPermission[] = rawPermissions.map(
    (p) => ({
      permission_id: p.permission_id.toString(),
      permission_code: p.permission_code,
      permission_name: p.permission_name,
      description: p.description,
      status: (p.status as "ACTIVE" | "INACTIVE") || "ACTIVE",
    }),
  );

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Roles & Security Permissions"
      subtitle="Role-based access matrix, security authorization levels & custom roles"
    >
      <AdminRolesManager
        initialRoles={serializedRoles}
        availablePermissions={serializedPermissions}
      />
    </DashboardShell>
  );
}
