import type {
  FilterMode,
  SearchCondition,
} from "@/components/ui/advanced-table-search";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
import type { SerializedDepartment } from "@/types/admin/departments";

export function filterDepartments(
  departments: SerializedDepartment[],
  searchQuery: string,
  statusFilter: string[],
  searchConditions?: SearchCondition[],
  filterMode?: FilterMode,
): SerializedDepartment[] {
  return departments.filter((d) => {
    // 1. Evaluate structured conditions
    if (searchConditions && searchConditions.length > 0) {
      if (!evaluateSearchConditions(d, searchConditions, filterMode || "AND")) {
        return false;
      }
    }

    // 2. Status filter
    const currentStatus = d.status || "ACTIVE";
    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(currentStatus);
    if (!matchesStatus) return false;

    // 3. Fallback text search query
    if (
      (!searchConditions || searchConditions.length === 0) &&
      searchQuery.trim()
    ) {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        d.department_name.toLowerCase().includes(query) ||
        (d.description || "").toLowerCase().includes(query) ||
        (d.user_count?.toString() || "").includes(query) ||
        (d.grievance_count?.toString() || "").includes(query);
      if (!matchesSearch) return false;
    }

    return true;
  });
}
