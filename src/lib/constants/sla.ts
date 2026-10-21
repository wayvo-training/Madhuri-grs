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
  WARNING_PERCENT: 50,
  AT_RISK_PERCENT: 75,
  CRITICAL_PERCENT: 90,
  BREACH_PERCENT: 100,
};
