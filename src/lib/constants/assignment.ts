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
};
