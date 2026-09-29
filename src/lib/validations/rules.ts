export const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type RuleStatus = (typeof ALLOWED_STATUSES)[number];

export function validateRuleName(ruleName: unknown): string | null {
  if (typeof ruleName !== "string" || !ruleName.trim()) {
    return null;
  }
  return ruleName.trim();
}

export function validateStatus(status: unknown): RuleStatus | null {
  const s = (status || "ACTIVE").toString().toUpperCase().trim();
  if (ALLOWED_STATUSES.includes(s as RuleStatus)) {
    return s as RuleStatus;
  }
  return null;
}

export function validateRuleOrder(
  order: unknown,
  defaultOrder = 10,
): number | null {
  const orderNum = Number(order ?? defaultOrder);
  if (!Number.isInteger(orderNum) || orderNum < 1 || orderNum > 100000) {
    return null;
  }
  return orderNum;
}

export function validateBigIntId(id: unknown): bigint | null {
  if (!id) return null;
  try {
    return BigInt(id as string | number);
  } catch {
    return null;
  }
}

/**
 * Validates and sanitizes rule conditions object.
 */
export function validateConditions(rawConditions: unknown): {
  error?: string;
  conditions?: Record<string, unknown>;
} {
  if (
    rawConditions === undefined ||
    rawConditions === null ||
    rawConditions === ""
  ) {
    return { conditions: {} };
  }

  if (typeof rawConditions !== "object" || Array.isArray(rawConditions)) {
    return { error: "conditions must be a valid JSON object." };
  }

  const serialized = JSON.stringify(rawConditions);
  if (serialized.length > 5000) {
    return { error: "conditions payload exceeds maximum allowed size (5KB)." };
  }

  const obj = rawConditions as Record<string, unknown>;
  const forbidden = ["__proto__", "constructor", "prototype"];
  for (const key of Object.keys(obj)) {
    if (forbidden.includes(key)) {
      return {
        error: `Invalid property key "${key}" detected in conditions object.`,
      };
    }
  }

  return { conditions: obj };
}
