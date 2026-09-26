import type {
  DepartmentStatusFilter,
  SerializedDepartment,
} from "@/types/admin/departments";

export function filterDepartments(
  departments: SerializedDepartment[],
  searchQuery: string,
  statusFilter: DepartmentStatusFilter,
): SerializedDepartment[] {
  const query = searchQuery.trim().toLowerCase();

  return departments.filter((d) => {
    const currentStatus = d.status || "ACTIVE";
    const matchesStatus =
      statusFilter === "ALL" || currentStatus === statusFilter;
    const matchesSearch =
      !query ||
      d.department_name.toLowerCase().includes(query) ||
      (d.description || "").toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });
}
