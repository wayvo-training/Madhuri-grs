export function getRoleDashboardPath(role?: string | null): string {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "/admin/dashboard";
    case "DEPARTMENT_HEAD":
      return "/department-head/dashboard";
    case "STAFF":
      return "/staff/dashboard";
    default:
      return "/dashboard";
  }
}
