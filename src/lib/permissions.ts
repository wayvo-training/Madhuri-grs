import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { type AuthUser, getCurrentUser } from "@/lib/auth";
import { getRoleDashboardPath } from "@/lib/role-redirect";

/**
 * Canonical permissions defined in the GRS database schema.
 */
export type PermissionCode =
  | "CREATE_GRIEVANCE"
  | "VIEW_OWN_GRIEVANCES"
  | "PROCESS_GRIEVANCE"
  | "ASSIGN_STAFF"
  | "MANAGE_RULES"
  | "MANAGE_USERS"
  | "VIEW_REPORTS"
  | "REVIEW_RESOLUTION";

/**
 * Check if a user has a specific permission.
 */
export function hasPermission(
  user: { permissions?: string[] } | null | undefined,
  permission: PermissionCode,
): boolean {
  const userPermissions = user?.permissions;
  if (!userPermissions) return false;
  return userPermissions.includes(permission);
}

/**
 * Check if a user has at least one of the specified permissions.
 */
export function hasAnyPermission(
  user: { permissions?: string[] } | null | undefined,
  permissions: PermissionCode[],
): boolean {
  const userPermissions = user?.permissions;
  if (!userPermissions) return false;
  return permissions.some((p) => userPermissions.includes(p));
}

/**
 * Check if a user has all of the specified permissions.
 */
export function hasAllPermissions(
  user: { permissions?: string[] } | null | undefined,
  permissions: PermissionCode[],
): boolean {
  const userPermissions = user?.permissions;
  if (!userPermissions) return false;
  return permissions.every((p) => userPermissions.includes(p));
}

/**
 * Server Component Guard: Requires a logged-in user.
 * Redirects unauthenticated requests to /login.
 */
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Server Component Guard: Requires a specific permission to view the page.
 * If unauthorized, redirects to the user's appropriate role dashboard.
 */
export async function requirePagePermission(
  permission: PermissionCode,
): Promise<AuthUser> {
  const user = await requireAuthUser();

  if (!hasPermission(user, permission)) {
    redirect(getRoleDashboardPath(user.roles.role_name));
  }

  return user;
}

/**
 * Server Component Guard: Requires one of the allowed roles to view the page.
 */
export async function requirePageRole(
  allowedRoles: string | string[],
): Promise<AuthUser> {
  const user = await requireAuthUser();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.roles.role_name)) {
    redirect(getRoleDashboardPath(user.roles.role_name));
  }

  return user;
}

/**
 * API Route Handler Guard: Enforces authentication and permission checks on API routes.
 *
 * Usage in API route:
 * ```ts
 * const auth = await authorizeApi({ permission: "MANAGE_RULES" });
 * if ("error" in auth) return auth.error;
 * const { user } = auth;
 * ```
 */
export async function authorizeApi(options?: {
  permission?: PermissionCode | PermissionCode[];
  role?: string | string[];
}): Promise<{ user: AuthUser } | { error: NextResponse }> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Authentication required",
        },
        { status: 401 },
      ),
    };
  }

  // Check role if specified
  if (options?.role) {
    const roles = Array.isArray(options.role) ? options.role : [options.role];
    if (!roles.includes(user.roles.role_name)) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Forbidden: Access denied for this role",
          },
          { status: 403 },
        ),
      };
    }
  }

  // Check permission(s) if specified
  if (options?.permission) {
    const permissions = Array.isArray(options.permission)
      ? options.permission
      : [options.permission];

    const isAuthorized = permissions.some((p) => hasPermission(user, p));

    if (!isAuthorized) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Forbidden: Required permission missing",
            requiredPermissions: permissions,
          },
          { status: 403 },
        ),
      };
    }
  }

  return { user };
}
