import type {
  PermStatusFilter,
  RoleStatusFilter,
  SerializedPermission,
  SerializedRole,
} from "@/types/admin/role-manager";

export function filterRoles(
  roles: SerializedRole[],
  search: string,
  statusFilter: RoleStatusFilter,
): SerializedRole[] {
  const query = search.trim().toLowerCase();

  return roles.filter((role) => {
    const matchesSearch =
      !query ||
      role.role_name.toLowerCase().includes(query) ||
      Boolean(role.description?.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === "ALL" || role.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}

export function filterPermissions(
  permissions: SerializedPermission[],
  search: string,
  statusFilter: PermStatusFilter,
): SerializedPermission[] {
  const query = search.trim().toLowerCase();

  return permissions.filter((perm) => {
    const matchesSearch =
      !query ||
      perm.permission_code.toLowerCase().includes(query) ||
      perm.permission_name.toLowerCase().includes(query) ||
      Boolean(perm.description?.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter === "ALL" || perm.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
}
