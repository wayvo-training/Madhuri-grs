/**
 * Shared SLA Duration Constants (in minutes).
 * Synchronized with database/seed.sql and Admin SLA policy defaults.
 */
export const DEFAULT_SLA_DURATIONS_MINUTES: Record<string, number> = {
  CRITICAL: 12 * 60, // 720 mins (12 hours)
  HIGH: 24 * 60, // 1440 mins (24 hours)
  MEDIUM: 48 * 60, // 2880 mins (48 hours)
  LOW: 72 * 60, // 4320 mins (72 hours)
};

export const DEFAULT_SLA_THRESHOLDS = {
  STAFF_NUDGE_PERCENT: 50,
  WARNING_PERCENT: 75,
  URGENT_PERCENT: 90,
  ESCALATION_BREACH_PERCENT: 100,
};
