/**
 * Centralized Role Display Helper
 * Enforces strictly 4 approved role names across all user-facing interfaces:
 * - Grievance Admin
 * - Grievance Staff
 * - Employee
 * - Department Head
 */

export type StandardRoleDisplay =
  | "Grievance Admin"
  | "Grievance Staff"
  | "Employee"
  | "Department Head"
  | (string & {});

export const STANDARD_ROLES: readonly string[] = [
  "Grievance Admin",
  "Grievance Staff",
  "Employee",
  "Department Head",
] as const;

/**
 * Normalizes any internal role string or legacy designation to the approved standard UI role name.
 * For custom roles created by administrators, preserves the custom role name.
 */
export function getStandardRoleDisplayName(role?: string | null): string {
  if (!role) return "Employee";
  const normalized = role.trim().toUpperCase();

  switch (normalized) {
    case "ADMIN":
    case "SYSTEM ADMINISTRATOR":
    case "SYSTEM ADMIN":
    case "GRIEVANCE ADMIN":
    case "SUPER_ADMIN":
      return "Grievance Admin";

    case "STAFF":
    case "STAFF MEMBER":
    case "OFFICER":
    case "GRIEVANCE OFFICER":
    case "GRIEVANCE STAFF":
    case "GRIEVANCE STAFF OFFICER":
    case "HANDLING OFFICER":
    case "INVESTIGATION STAFF":
    case "RESOLUTION OFFICER":
    case "ASSIGNED STAFF":
      return "Grievance Staff";

    case "DEPARTMENT_HEAD":
    case "DEPT_HEAD":
    case "HOD":
    case "DEPARTMENT HEAD":
      return "Department Head";

    case "END_USER":
    case "CITIZEN":
    case "EMPLOYEE":
    case "USER":
      return "Employee";

    default:
      return role;
  }
}
