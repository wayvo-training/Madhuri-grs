import {
  AdminRolesManager,
  type SerializedPermission,
  type SerializedRole,
} from "@/components/dashboard/admin/admin-role-manager";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function AdminRolesPage() {
  await requirePageRole("ADMIN");

  const [rawRoles, rawPermissions] = await Promise.all([
    prisma.roles.findMany({
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
    <AdminRolesManager
      initialRoles={serializedRoles}
      availablePermissions={serializedPermissions}
    />
  );
}
