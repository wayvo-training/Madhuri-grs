import type {
  SerializedPermission,
  SerializedRole,
} from "@/types/admin/role-manager";

export function filterRoles(
  roles: SerializedRole[],
  search: string,
  statusFilter: string[],
): SerializedRole[] {
  const query = search.trim().toLowerCase();

  return roles.filter((role) => {
    const matchesSearch =
      !query ||
      role.role_name.toLowerCase().includes(query) ||
      Boolean(role.description?.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(role.status);

    return matchesSearch && matchesStatus;
  });
}

export function filterPermissions(
  permissions: SerializedPermission[],
  search: string,
  statusFilter: string[],
): SerializedPermission[] {
  const query = search.trim().toLowerCase();

  return permissions.filter((perm) => {
    const matchesSearch =
      !query ||
      perm.permission_code.toLowerCase().includes(query) ||
      perm.permission_name.toLowerCase().includes(query) ||
      Boolean(perm.description?.toLowerCase().includes(query));

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(perm.status);

    return matchesSearch && matchesStatus;
  });
}
