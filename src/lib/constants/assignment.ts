export const DEFAULT_ASSIGNMENT_CONFIG = {
  MAX_STAFF_CAPACITY: 10,
  WEIGHTS: {
    SKILL: 35,
    EXPERIENCE: 25,
    WORKLOAD: 20,
    AVAILABILITY: 10,
    SLA: 10,
  },
  PROFICIENCY_MULTIPLIERS: {
    EXPERT: 1.0,
    ADVANCED: 0.85,
    INTERMEDIATE: 0.7,
    BEGINNER: 0.5,
  } as Record<string, number>,
  // Grievance statuses where staff active investigation workload is completed
  INACTIVE_WORKLOAD_STATUSES: ["CLOSED", "RESOLVED", "UNDER_REVIEW"] as const,
  // Normalized category affinities
  CATEGORY_SKILL_AFFINITY: {
    "compensation & benefits": [
      "payroll management",
      "policy interpretation",
      "employee relations",
    ],
    "leave & attendance": [
      "policy interpretation",
      "employee relations",
      "compliance management",
    ],
    "workplace conduct": [
      "conflict resolution",
      "employee relations",
      "compliance management",
    ],
    "hr & employment": [
      "performance management",
      "employee relations",
      "policy interpretation",
    ],
    "management & leadership": [
      "conflict resolution",
      "policy interpretation",
      "employee relations",
    ],
    "policy & process": [
      "policy interpretation",
      "compliance management",
      "employee relations",
    ],
    "work environment": [
      "workplace safety",
      "facilities management",
      "compliance management",
    ],
    "ethics & compliance": [
      "compliance management",
      "policy interpretation",
      "conflict resolution",
    ],
    "career & development": [
      "performance management",
      "employee relations",
      "policy interpretation",
    ],
    "workplace services": [
      "facilities management",
      "workplace safety",
      "employee relations",
    ],
  } as Record<string, string[]>,
};

/**
 * Normalizes category names to maximize matching against affinity keywords.
 * Converts "and" to "&", collapses whitespace, and lowercases.
 */
export function normalizeCategoryName(name?: string | null): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\band\b/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
