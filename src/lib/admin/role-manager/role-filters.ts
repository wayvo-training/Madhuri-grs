import type {
  FilterMode,
  SearchCondition,
} from "@/components/ui/advanced-table-search";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
import type {
  SerializedPermission,
  SerializedRole,
} from "@/types/admin/role-manager";

export function filterRoles(
  roles: SerializedRole[],
  search: string,
  statusFilter: string[],
  searchConditions?: SearchCondition[],
  filterMode?: FilterMode,
): SerializedRole[] {
  return roles.filter((role) => {
    if (searchConditions && searchConditions.length > 0) {
      if (
        !evaluateSearchConditions(role, searchConditions, filterMode || "AND")
      ) {
        return false;
      }
    }

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(role.status);
    if (!matchesStatus) return false;

    if ((!searchConditions || searchConditions.length === 0) && search.trim()) {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        role.role_name.toLowerCase().includes(query) ||
        Boolean(role.description?.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    return true;
  });
}

export function filterPermissions(
  permissions: SerializedPermission[],
  search: string,
  statusFilter: string[],
  searchConditions?: SearchCondition[],
  filterMode?: FilterMode,
): SerializedPermission[] {
  return permissions.filter((perm) => {
    if (searchConditions && searchConditions.length > 0) {
      if (
        !evaluateSearchConditions(perm, searchConditions, filterMode || "AND")
      ) {
        return false;
      }
    }

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(perm.status);
    if (!matchesStatus) return false;

    if ((!searchConditions || searchConditions.length === 0) && search.trim()) {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        perm.permission_code.toLowerCase().includes(query) ||
        perm.permission_name.toLowerCase().includes(query) ||
        Boolean(perm.description?.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    return true;
  });
}
