/**
 * Shared Routing Engine Constants.
 * Centralizes defaults to avoid hardcoded magic numbers across routing logic.
 */
export const DEFAULT_ROUTING_CONFIG = {
  FALLBACK_DURATION_MINUTES: 2880, // 48 hours
  DEFAULT_SLA_PERCENT: 100.0,
  DEFAULT_EXECUTION_ORDER: 1,
} as const;

export const ROUTING_INVOLVEMENT_TYPES = {
  PRIMARY: "PRIMARY",
  SUPPORTING: "SUPPORTING",
  EQUAL: "EQUAL",
} as const;

export const ROUTING_DEPENDENCY_TYPES = {
  PARALLEL: "PARALLEL",
  SEQUENTIAL: "SEQUENTIAL",
} as const;

export const DEPARTMENT_ROUTING_STATUS = {
  PENDING_ASSIGNMENT: "PENDING_ASSIGNMENT",
  BLOCKED: "BLOCKED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  RESOLVED: "RESOLVED",
  REMOVED: "REMOVED",
} as const;
