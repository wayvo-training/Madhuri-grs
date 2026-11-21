/**
 * Enterprise Password Complexity Policy Validator
 * Enforces strong security requirements across reset, change, and admin user creation.
 */

export interface PasswordRuleCheck {
  id: string;
  label: string;
  passed: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  rules: PasswordRuleCheck[];
}

export function validatePasswordPolicy(
  password: string,
): PasswordValidationResult {
  const pwd = password || "";

  const minLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pwd);

  const rules: PasswordRuleCheck[] = [
    { id: "length", label: "At least 8 characters", passed: minLength },
    {
      id: "uppercase",
      label: "At least one uppercase letter (A-Z)",
      passed: hasUppercase,
    },
    {
      id: "lowercase",
      label: "At least one lowercase letter (a-z)",
      passed: hasLowercase,
    },
    { id: "number", label: "At least one number (0-9)", passed: hasNumber },
    {
      id: "special",
      label: "At least one special character (!@#$%^&* etc.)",
      passed: hasSpecial,
    },
  ];

  const errors: string[] = [];
  if (!minLength) errors.push("Password must be at least 8 characters long.");
  if (!hasUppercase)
    errors.push("Password must contain at least one uppercase letter.");
  if (!hasLowercase)
    errors.push("Password must contain at least one lowercase letter.");
  if (!hasNumber) errors.push("Password must contain at least one number.");
  if (!hasSpecial)
    errors.push("Password must contain at least one special character.");

  return {
    valid: minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial,
    errors,
    rules,
  };
}
