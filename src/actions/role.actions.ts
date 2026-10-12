export interface CreateRolePayload {
  role_name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  permission_ids: string[];
}

export interface UpdateRolePayload {
  role_id: string;
  role_name?: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  permission_ids: string[];
}

export interface RoleActionResult {
  success: boolean;
  message?: string;
  role?: {
    role_id: string;
    role_name: string;
    description: string;
    status: string;
  };
}

/**
 * Create a new Role (Admin)
 */
export async function createRoleAction(
  payload: CreateRolePayload,
): Promise<RoleActionResult> {
  const res = await fetch("/api/admin/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as RoleActionResult;
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to create role");
  }
  return data;
}

/**
 * Update an existing Role (Admin)
 */
export async function updateRoleAction(
  payload: UpdateRolePayload,
): Promise<RoleActionResult> {
  const res = await fetch("/api/admin/roles", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as RoleActionResult;
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update role");
  }
  return data;
}
