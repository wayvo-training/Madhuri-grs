/**
 * Helper to safely extract the primary department record from a grievance's
 * grievance_departments relation.
 *
 * It defaults to PRIMARY, falls back to EQUAL, and finally takes the first
 * record available if no involvement_type matches. It gracefully handles
 * undefined/null arrays or legacy single-object shapes, and accepts either the
 * grievance object or the grievance_departments array directly.
 */
export function getPrimaryDepartment<T extends Record<string, unknown>>(
  input:
    | { grievance_departments?: T[] | T | null }
    | T[]
    | T
    | null
    | undefined,
): T | undefined {
  if (!input) {
    return undefined;
  }

  let rawList: unknown;
  if (Array.isArray(input)) {
    rawList = input;
  } else if (
    typeof input === "object" &&
    input !== null &&
    "grievance_departments" in input
  ) {
    rawList = (input as { grievance_departments?: unknown })
      .grievance_departments;
  } else {
    rawList = input;
  }

  if (!rawList) {
    return undefined;
  }

  const depts: T[] = Array.isArray(rawList) ? (rawList as T[]) : [rawList as T];

  if (depts.length === 0) {
    return undefined;
  }

  const primary = depts.find(
    (d) =>
      (d as { involvement_type?: unknown })?.involvement_type === "PRIMARY",
  );
  if (primary) return primary;

  const equal = depts.find(
    (d) => (d as { involvement_type?: unknown })?.involvement_type === "EQUAL",
  );
  if (equal) return equal;

  return depts[0];
}

/**
 * Helper to safely extract the currently active department in a multi-department
 * sequential or parallel workflow.
 *
 * Checks for IN_PROGRESS, ASSIGNED, or PENDING_ASSIGNMENT (prioritizing lowest execution_order).
 * Falls back to getPrimaryDepartment if none are currently active or if all completed.
 */
export function getActiveDepartment<T extends Record<string, unknown>>(
  input:
    | { grievance_departments?: T[] | T | null }
    | T[]
    | T
    | null
    | undefined,
): T | undefined {
  if (!input) {
    return undefined;
  }

  let rawList: unknown;
  if (Array.isArray(input)) {
    rawList = input;
  } else if (
    typeof input === "object" &&
    input !== null &&
    "grievance_departments" in input
  ) {
    rawList = (input as { grievance_departments?: unknown })
      .grievance_departments;
  } else {
    rawList = input;
  }

  if (!rawList) {
    return undefined;
  }

  const depts: T[] = Array.isArray(rawList) ? (rawList as T[]) : [rawList as T];

  if (depts.length === 0) {
    return undefined;
  }

  // Find active departments (not COMPLETED, not BLOCKED, not REMOVED)
  const activeList = depts.filter((d) => {
    const status = (d as { status?: unknown })?.status;
    return (
      status === "IN_PROGRESS" ||
      status === "ASSIGNED" ||
      status === "PENDING_ASSIGNMENT"
    );
  });

  if (activeList.length > 0) {
    // Sort by execution_order if present
    activeList.sort((a, b) => {
      const orderA = Number(
        (a as { execution_order?: unknown })?.execution_order ?? 999,
      );
      const orderB = Number(
        (b as { execution_order?: unknown })?.execution_order ?? 999,
      );
      return orderA - orderB;
    });
    return activeList[0];
  }

  return getPrimaryDepartment(input);
}
