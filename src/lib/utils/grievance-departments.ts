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
