/**
 * Common User Validation Rules for GRS User Management
 * Enforces consistent input rules across all client forms and server API routes.
 */

export interface ValidationFieldResult {
  isValid: boolean;
  error?: string;
}

export interface UserFormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * First Name validation:
 * - Required, min 2 characters, max 100 characters.
 * - Cannot be all digits/numbers.
 * - Allows letters only, or combination of letters with numbers, spaces, hyphens, and apostrophes.
 * - Must contain at least one letter.
 */
export function validateFirstName(firstName: string): ValidationFieldResult {
  const trimmed = (firstName || "").trim();
  if (!trimmed) {
    return { isValid: false, error: "First name is required." };
  }
  if (trimmed.length < 4) {
    return {
      isValid: false,
      error: "First name must be at least 4 characters.",
    };
  }
  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: "First name must not exceed 100 characters.",
    };
  }
  // Disallow pure digits
  if (/^\d+$/.test(trimmed)) {
    return {
      isValid: false,
      error:
        "First name cannot contain only numbers. Use letters or a combination.",
    };
  }
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    return {
      isValid: false,
      error: "First name must contain at least one letter.",
    };
  }
  // Allowed characters: letters, numbers, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z0-9\s'-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "First name contains invalid special characters.",
    };
  }
  return { isValid: true };
}

/**
 * Last Name validation:
 * - Optional.
 * - If provided, cannot be all digits/numbers.
 * - Must contain at least one letter if entered.
 * - Allows letters only, or combination of letters with numbers, spaces, hyphens, and apostrophes.
 */
export function validateLastName(
  lastName?: string | null,
): ValidationFieldResult {
  if (!lastName?.trim()) {
    return { isValid: true };
  }
  const trimmed = lastName.trim();
  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: "Last name must be at least 2 characters.",
    };
  }
  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: "Last name must not exceed 100 characters.",
    };
  }
  // Disallow pure digits
  if (/^\d+$/.test(trimmed)) {
    return {
      isValid: false,
      error:
        "Last name cannot contain only numbers. Use letters or a combination.",
    };
  }
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    return {
      isValid: false,
      error: "Last name must contain at least one letter.",
    };
  }
  // Allowed characters: letters, numbers, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z0-9\s'-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "Last name contains invalid special characters.",
    };
  }
  return { isValid: true };
}

/**
 * Employee Code validation:
 * - Required, min 6 characters, max 50 characters.
 * - Must be a combination of letters AND numbers (e.g., EMP001, EMP102).
 * - Pure letters (e.g., "EMP") or pure numbers (e.g., "123456") are NOT allowed.
 * - Allows letters, numbers, hyphens, and underscores.
 */
export function validateEmployeeCode(code: string): ValidationFieldResult {
  const trimmed = (code || "").trim();
  if (!trimmed) {
    return { isValid: false, error: "Employee code is required." };
  }
  if (trimmed.length < 6) {
    return {
      isValid: false,
      error: "Employee code must be at least 6 characters (e.g. EMP001).",
    };
  }
  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: "Employee code must not exceed 50 characters.",
    };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error:
        "Employee code can only contain letters, numbers, hyphens, and underscores.",
    };
  }
  const hasLetter = /[a-zA-Z]/.test(trimmed);
  const hasNumber = /[0-9]/.test(trimmed);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      error:
        "Employee code must be a combination of letters and numbers (e.g. EMP001).",
    };
  }
  return { isValid: true };
}

/**
 * Email Address validation:
 * - Required, valid format with proper username, '@', domain, and TLD.
 * - Max 255 characters.
 */
export function validateEmail(email: string): ValidationFieldResult {
  const trimmed = (email || "").trim();
  if (!trimmed) {
    return { isValid: false, error: "Email address is required." };
  }
  if (trimmed.length > 255) {
    return {
      isValid: false,
      error: "Email address must not exceed 255 characters.",
    };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Please enter a valid email address (e.g. user@company.com).",
    };
  }
  return { isValid: true };
}

/**
 * Password validation:
 * - Required for creation, min 6 characters.
 */
export function validatePassword(password: string): ValidationFieldResult {
  if (!password) {
    return { isValid: false, error: "Password is required." };
  }
  if (password.length < 6) {
    return {
      isValid: false,
      error: "Password must be at least 6 characters long.",
    };
  }
  if (password.length > 128) {
    return {
      isValid: false,
      error: "Password must not exceed 128 characters.",
    };
  }
  return { isValid: true };
}

/**
 * Validate all fields for User Creation
 */
export function validateCreateUserFields(data: {
  employee_code: string;
  first_name: string;
  last_name?: string | null;
  email: string;
  password?: string;
}): UserFormValidationResult {
  const errors: Record<string, string> = {};

  const empRes = validateEmployeeCode(data.employee_code);
  if (!empRes.isValid && empRes.error) {
    errors.employee_code = empRes.error;
  }

  const fnRes = validateFirstName(data.first_name);
  if (!fnRes.isValid && fnRes.error) {
    errors.first_name = fnRes.error;
  }

  const lnRes = validateLastName(data.last_name);
  if (!lnRes.isValid && lnRes.error) {
    errors.last_name = lnRes.error;
  }

  const emailRes = validateEmail(data.email);
  if (!emailRes.isValid && emailRes.error) {
    errors.email = emailRes.error;
  }

  if (data.password !== undefined) {
    const pwRes = validatePassword(data.password);
    if (!pwRes.isValid && pwRes.error) {
      errors.password = pwRes.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate fields for User Update
 */
export function validateEditUserFields(data: {
  employee_code?: string;
  first_name?: string;
  last_name?: string | null;
  email?: string;
}): UserFormValidationResult {
  const errors: Record<string, string> = {};

  if (data.employee_code !== undefined) {
    const empRes = validateEmployeeCode(data.employee_code);
    if (!empRes.isValid && empRes.error) {
      errors.employee_code = empRes.error;
    }
  }

  if (data.first_name !== undefined) {
    const fnRes = validateFirstName(data.first_name);
    if (!fnRes.isValid && fnRes.error) {
      errors.first_name = fnRes.error;
    }
  }

  if (data.last_name !== undefined && data.last_name !== null) {
    const lnRes = validateLastName(data.last_name);
    if (!lnRes.isValid && lnRes.error) {
      errors.last_name = lnRes.error;
    }
  }

  if (data.email !== undefined) {
    const emailRes = validateEmail(data.email);
    if (!emailRes.isValid && emailRes.error) {
      errors.email = emailRes.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
