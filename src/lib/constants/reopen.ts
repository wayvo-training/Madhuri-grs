/**
 * Shared Reopen Policy Constants.
 * Used as fallback defaults when no active policy matches in the database.
 */
export const DEFAULT_REOPEN_POLICY = {
  POLICY_NAME: "Default System Reopen Policy",
  MAX_REOPEN_COUNT: 2,
  MAX_MANUAL_REVIEW_COUNT: 2,
  REOPEN_WINDOW_HOURS: 72,
} as const;
