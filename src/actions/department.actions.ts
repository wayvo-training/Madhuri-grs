export interface CreateDepartmentPayload {
  department_name: string;
  department_code: string;
  head_user_id?: string;
  description?: string;
  contact_email?: string;
  status?: "ACTIVE" | "INACTIVE";
}

export interface UpdateDepartmentPayload {
  department_id: string;
  department_name: string;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface DepartmentActionResult {
  success: boolean;
  message?: string;
  department?: {
    department_id: string;
    department_name: string;
    description: string | null;
    status: string;
  };
}

/**
 * Create a new Department (Admin)
 */
export async function createDepartmentAction(
  payload: CreateDepartmentPayload,
): Promise<DepartmentActionResult> {
  const res = await fetch("/api/admin/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as DepartmentActionResult;
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to create department");
  }
  return data;
}

/**
 * Update an existing Department (Admin)
 */
export async function updateDepartmentAction(
  payload: UpdateDepartmentPayload,
): Promise<DepartmentActionResult> {
  const res = await fetch("/api/admin/departments", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as DepartmentActionResult;
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update department");
  }
  return data;
}
