/**
 * Helper to safely extract the primary department record from a grievance's
 * grievance_departments array. 
 *
 * It defaults to PRIMARY, falls back to EQUAL, and finally takes the first
 * record available if no involvement_type matches. It gracefully handles
 * undefined/null arrays or legacy single-object shapes.
 */
export function getPrimaryDepartment<T>(
  grievance: { grievance_departments?: T[] | T | null } | null | undefined
): T | undefined {
  if (!grievance || !grievance.grievance_departments) {
    return undefined;
  }

  const depts = Array.isArray(grievance.grievance_departments)
    ? grievance.grievance_departments
    : [grievance.grievance_departments];

  if (depts.length === 0) {
    return undefined;
  }

  const primary = depts.find((d: any) => d.involvement_type === "PRIMARY");
  if (primary) return primary;

  const equal = depts.find((d: any) => d.involvement_type === "EQUAL");
  if (equal) return equal;

  return depts[0];
}
