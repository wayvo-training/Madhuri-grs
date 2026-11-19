/**
 * Shared Reopen Policy Constants.
 * Used as fallback defaults when no active policy matches in the database.
 */
export const DEFAULT_REOPEN_POLICY = {
  POLICY_NAME: "Default System Reopen Policy",
  MAX_REOPEN_COUNT: 3,
  MAX_MANUAL_REVIEW_COUNT: 0,
  MAX_COMBINED_ATTEMPTS: 3,
  REOPEN_WINDOW_HOURS: 14 * 24, // 336 hours (14 days)
} as const;

export const MIN_REOPEN_REASON_LENGTH = 15;
export const MAX_REOPEN_REASON_LENGTH = 500;

/**
 * Validates the employee's reason for reopening or requesting rework on a grievance:
 * - Must meet minimum character length (at least 15 characters).
 * - Must not exceed maximum character length (at most 500 characters).
 * - Cannot consist of numerical digits or symbols alone. Must be combinations containing words/letters.
 * - Must contain descriptive text with sufficient letters (at least 4 alphabetic characters).
 */
export function validateReopenReason(
  reason: string,
  minLength = MIN_REOPEN_REASON_LENGTH,
  maxLength = MAX_REOPEN_REASON_LENGTH,
): { valid: boolean; error?: string } {
  const trimmed = (reason || "").trim();
  if (!trimmed) {
    return {
      valid: false,
      error: "Please provide a reason.",
    };
  }

  if (trimmed.length < minLength) {
    return {
      valid: false,
      error: `Reason must be at least ${minLength} characters (currently ${trimmed.length}).`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `Reason cannot exceed ${maxLength} characters (currently ${trimmed.length}).`,
    };
  }

  // Reject if purely numeric or symbols alone (ignoring punctuation and spaces)
  const strippedNonLetters = trimmed.replace(
    /[\s\-_.,/#!$%^&*;:{}=`~()?[\]]/g,
    "",
  );
  const isPurelyNumeric = /^\d+$/.test(strippedNonLetters);
  if (isPurelyNumeric || !/[a-zA-Z]/.test(trimmed)) {
    return {
      valid: false,
      error:
        "Reason cannot consist of numbers alone. Please enter a descriptive combination of words and text.",
    };
  }

  // Ensure there are enough alphabetic characters to form real descriptive words (minimum 4 letters)
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 4) {
    return {
      valid: false,
      error:
        "Reason must contain descriptive words (at least 4 letters). Numbers alone or with random characters are not accepted.",
    };
  }

  // Check for repeated single characters (e.g. "aaaaaaaaaaaaaaa")
  const uniqueChars = new Set(trimmed.toLowerCase().replace(/\s/g, "")).size;
  if (uniqueChars < 3) {
    return {
      valid: false,
      error:
        "Please provide a meaningful explanation using combinations of words.",
    };
  }

  return { valid: true };
}
