import type { NextResponse } from "next/server";
import type { AuthUser } from "@/lib/auth";
import { authorizeApi } from "@/lib/permissions";

export interface StaffAuthSuccess {
  user: AuthUser;
  staffId: bigint;
  departmentId: bigint | null;
  isAdmin: boolean;
}

export type StaffAuthResult = StaffAuthSuccess | { error: NextResponse };

/**
 * Validates that the request is made by an authenticated STAFF member (or ADMIN preview).
 * Returns the resolved staff information or an unauthorized/forbidden response.
 */
export async function resolveStaffAuth(
  _request?: Request,
): Promise<StaffAuthResult> {
  const auth = await authorizeApi({
    role: ["STAFF", "ADMIN", "DEPARTMENT_HEAD"],
  });
  if ("error" in auth) {
    return { error: auth.error };
  }

  const { user } = auth;
  const isAdmin = user.roles.role_name === "ADMIN";
  const staffId = BigInt(user.user_id);
  const departmentId = user.department_id ? BigInt(user.department_id) : null;

  return {
    user,
    staffId,
    departmentId,
    isAdmin,
  };
}
