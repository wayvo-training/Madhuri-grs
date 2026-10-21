import type { SerializedUser } from "@/types/admin/users";

export interface CreateUserPayload {
  employee_code: string;
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
  role_id?: string;
  department_id?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface UpdateUserPayload {
  user_id: string;
  employee_code?: string;
  first_name?: string;
  last_name?: string | null;
  email?: string;
  role_id?: string;
  department_id?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface ResetUserPasswordPayload {
  user_id: string;
  new_password: string;
}

export interface ToggleUserStatusPayload {
  user_id: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface UserActionResult {
  success: boolean;
  message?: string;
  user?: SerializedUser;
}

/**
 * Create a new user (Admin)
 */
export async function createUserAction(
  payload: CreateUserPayload,
): Promise<UserActionResult> {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as UserActionResult;
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to create user");
  }
  return data;
}

/**
 * Update an existing user (Admin)
 */
export async function updateUserAction(
  payload: UpdateUserPayload,
): Promise<UserActionResult> {
  const res = await fetch("/api/admin/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as UserActionResult;
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update user");
  }
  return data;
}

/**
 * Reset a user's password (Admin)
 */
export async function resetUserPasswordAction(
  payload: ResetUserPasswordPayload,
): Promise<UserActionResult> {
  const res = await fetch("/api/admin/users/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as UserActionResult;
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to reset password");
  }
  return data;
}
