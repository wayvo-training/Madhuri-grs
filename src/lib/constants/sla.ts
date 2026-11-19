/**
 * Shared SLA Duration Constants (in minutes).
 * Baseline priority resolution SLA durations
 * - Critical: 24 hours (1440 mins)
 * - High: 48 hours (2880 mins)
 * - Medium: 72 hours (4320 mins)
 * - Low: 120 hours (7200 mins)
 */
export const DEFAULT_SLA_DURATIONS_MINUTES: Record<string, number> = {
  CRITICAL: 24 * 60, // 1440 mins (24 hours)
  HIGH: 48 * 60, // 2880 mins (48 hours)
  MEDIUM: 72 * 60, // 4320 mins (72 hours)
  LOW: 120 * 60, // 7200 mins (120 hours)
};

export const DEFAULT_SLA_THRESHOLDS = {
  WARNING_PERCENT: 50,
  AT_RISK_PERCENT: 75,
  CRITICAL_PERCENT: 90,
  BREACH_PERCENT: 100,
};

/**
 * Proposed Default Reopened SLA percentage (50%).
 * Evaluated through calculation: baseline duration * (50 / 100).
 * NOTE: Marked as Pending Krishna's Approval.
 */
export const DEFAULT_REOPENED_SLA_PERCENT = 50;

/**
 * Calculates the reopened SLA duration (in minutes) by taking the configured percentage (default 50%)
 * of the original priority baseline duration through dynamic calculation.
 */
export function calculateReopenedSlaMinutes(
  baselineMinutes: number,
  percentage: number = DEFAULT_REOPENED_SLA_PERCENT,
): number {
  return Math.max(1, Math.round((baselineMinutes * percentage) / 100));
}

/**
 * Proposed Default Reopened SLA Durations (in minutes) evaluated dynamically through 50% calculation:
 * - Critical: 24h * 50% = 12 hours (720 mins)
 * - High: 48h * 50% = 24 hours (1440 mins)
 * - Medium: 72h * 50% = 36 hours (2160 mins)
 * - Low: 120h * 50% = 60 hours (3600 mins)
 * NOTE: Marked as Pending Krishna's Approval.
 */
export const DEFAULT_REOPENED_SLA_DURATIONS_MINUTES: Record<string, number> = {
  CRITICAL: calculateReopenedSlaMinutes(
    DEFAULT_SLA_DURATIONS_MINUTES.CRITICAL,
    DEFAULT_REOPENED_SLA_PERCENT,
  ),
  HIGH: calculateReopenedSlaMinutes(
    DEFAULT_SLA_DURATIONS_MINUTES.HIGH,
    DEFAULT_REOPENED_SLA_PERCENT,
  ),
  MEDIUM: calculateReopenedSlaMinutes(
    DEFAULT_SLA_DURATIONS_MINUTES.MEDIUM,
    DEFAULT_REOPENED_SLA_PERCENT,
  ),
  LOW: calculateReopenedSlaMinutes(
    DEFAULT_SLA_DURATIONS_MINUTES.LOW,
    DEFAULT_REOPENED_SLA_PERCENT,
  ),
};

/**
 * Proposed Default Rework SLA percentage (50%).
 * Evaluated through calculation: baseline duration * (50 / 100).
 * NOTE: Marked as Pending Krishna's Approval.
 */
export const DEFAULT_REWORK_SLA_PERCENT = 50;

/**
 * Calculates the rework SLA duration (in minutes) dynamically from baseline priority duration.
 * NOTE: Marked as Pending Krishna's Approval.
 */
export function calculateReworkSlaMinutes(
  baselineMinutes: number,
  percentage: number = DEFAULT_REWORK_SLA_PERCENT,
): number {
  return Math.max(1, Math.round((baselineMinutes * percentage) / 100));
}

/**
 * Proposed Default Rework SLA Durations (in minutes) evaluated dynamically:
 * - Critical: 12 hours (720 mins)
 * - High: 24 hours (1440 mins)
 * - Medium: 36 hours (2160 mins)
 * - Low: 60 hours (3600 mins)
 * NOTE: Marked as Pending Krishna's Approval.
 */
export const DEFAULT_REWORK_SLA_DURATIONS_MINUTES: Record<string, number> = {
  CRITICAL: calculateReworkSlaMinutes(
    DEFAULT_SLA_DURATIONS_MINUTES.CRITICAL,
    DEFAULT_REWORK_SLA_PERCENT,
  ),
  HIGH: calculateReworkSlaMinutes(
    DEFAULT_SLA_DURATIONS_MINUTES.HIGH,
    DEFAULT_REWORK_SLA_PERCENT,
  ),
  MEDIUM: calculateReworkSlaMinutes(
    DEFAULT_SLA_DURATIONS_MINUTES.MEDIUM,
    DEFAULT_REWORK_SLA_PERCENT,
  ),
  LOW: calculateReworkSlaMinutes(
    DEFAULT_SLA_DURATIONS_MINUTES.LOW,
    DEFAULT_REWORK_SLA_PERCENT,
  ),
};

/**
 * Grace Period (SLA Extensions) Invariants per LLD §2.2.26:
 * - Can only be requested after at least 50% of SLA time has elapsed (prior to 75% auto-escalation).
 * - Maximum 1 extension request per active SLA cycle (including rejected requests).
 * - Maximum 2 approved extensions across the entire grievance lifecycle.
 * - Single extension capped at the stricter of 24 hours (1440 mins) or 25% of baseline SLA.
 * - Cumulative approved extensions capped at 25% of baseline SLA.
 */
export const MIN_SLA_CONSUMED_PERCENT_FOR_EXTENSION = 50;
export const MAX_EXTENSIONS_PER_CYCLE = 1;
export const MAX_APPROVED_EXTENSIONS_LIFECYCLE = 2;
export const MAX_SINGLE_EXTENSION_HOURS = 24;
export const MAX_EXTENSION_PERCENT_OF_BASELINE = 25;

export function calculateMaxSingleExtensionMinutes(
  baselineMinutes: number,
): number {
  const twentyFivePercent = Math.round(
    (baselineMinutes * MAX_EXTENSION_PERCENT_OF_BASELINE) / 100,
  );
  return Math.min(
    MAX_SINGLE_EXTENSION_HOURS * 60,
    Math.max(1, twentyFivePercent),
  );
}

export function calculateMaxCumulativeExtensionMinutes(
  baselineMinutes: number,
): number {
  return Math.max(
    1,
    Math.round((baselineMinutes * MAX_EXTENSION_PERCENT_OF_BASELINE) / 100),
  );
}

export const DEFAULT_INFO_RESPONSE_DAYS = 7;
export const DEFAULT_RESOLUTION_RESPONSE_DAYS = 7;
export const DEFAULT_REOPEN_WINDOW_DAYS = 14; // 14 days (336 hours)
export const DEFAULT_REOPEN_EXPIRY_DAYS = 14;
export const MAX_COMBINED_REWORK_REOPEN_ATTEMPTS = 3;
