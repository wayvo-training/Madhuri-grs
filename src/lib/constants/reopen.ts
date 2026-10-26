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

export const MIN_REOPEN_REASON_LENGTH = 15;

/**
 * Validates the citizen's reason for reopening a grievance:
 * - Must meet minimum character length (at least 15 characters).
 * - Cannot consist of numerical digits or symbols alone.
 * - Must contain descriptive text with sufficient letters.
 */
export function validateReopenReason(
  reason: string,
  minLength = MIN_REOPEN_REASON_LENGTH,
): { valid: boolean; error?: string } {
  const trimmed = (reason || "").trim();
  if (!trimmed) {
    return {
      valid: false,
      error: "Please provide a reason for reopening.",
    };
  }

  if (trimmed.length < minLength) {
    return {
      valid: false,
      error: `Reopen reason must be at least ${minLength} characters (currently ${trimmed.length}).`,
    };
  }

  // Reject if purely numeric or contains no letters (e.g., "123456789012345", "123 456 789!")
  if (!/[a-zA-Z]/.test(trimmed)) {
    return {
      valid: false,
      error:
        "Reopen reason cannot consist of numbers or symbols alone. Please provide a clear written explanation.",
    };
  }

  // Ensure there are enough alphabetic characters to form real descriptive words (minimum 4 letters)
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 4) {
    return {
      valid: false,
      error:
        "Please explain in words why you are not satisfied with the resolution.",
    };
  }

  return { valid: true };
}
