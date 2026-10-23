export const PRIORITY_LEVELS = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export const ALLOWED_PRIORITY_LEVELS = [
  PRIORITY_LEVELS.CRITICAL,
  PRIORITY_LEVELS.HIGH,
  PRIORITY_LEVELS.MEDIUM,
  PRIORITY_LEVELS.LOW,
] as const;

export type PriorityLevel = (typeof ALLOWED_PRIORITY_LEVELS)[number];
export type SeverityLevel = (typeof ALLOWED_PRIORITY_LEVELS)[number];

export const IMPACT_ESCALATION: Record<SeverityLevel, SeverityLevel> = {
  LOW: "MEDIUM",
  MEDIUM: "HIGH",
  HIGH: "CRITICAL",
  CRITICAL: "CRITICAL",
};

/**
 * Standard ITIL Impact x Urgency Priority Matrix.
 * Fully deterministic 16-combination mapping.
 */
export const PRIORITY_MATRIX: Record<
  SeverityLevel,
  Record<SeverityLevel, PriorityLevel>
> = {
  CRITICAL: {
    CRITICAL: "CRITICAL",
    HIGH: "CRITICAL",
    MEDIUM: "HIGH",
    LOW: "MEDIUM",
  },
  HIGH: {
    CRITICAL: "HIGH",
    HIGH: "HIGH",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  },
  MEDIUM: {
    CRITICAL: "HIGH",
    HIGH: "MEDIUM",
    MEDIUM: "MEDIUM",
    LOW: "LOW",
  },
  LOW: {
    CRITICAL: "MEDIUM",
    HIGH: "LOW",
    MEDIUM: "LOW",
    LOW: "LOW",
  },
};

export const PRIORITY_PATTERNS = {
  // Inherent taxonomy domain patterns
  INHERENT_CRITICAL_PATTERNS: [
    "safety",
    "harassment",
    "posh",
    "confidentiality",
    "emergency leave",
    "misconduct",
    "ethics",
  ],
  INHERENT_HIGH_PATTERNS: [
    "salary",
    "pay",
    "deduction",
    "bonus",
    "reimbursement",
    "insurance",
    "maternity",
    "leave approval",
    "attendance",
    "compensation",
    "leave",
  ],
  INHERENT_LOW_PATTERNS: [
    "id card",
    "stationery",
    "general inquiry",
    "policy clarification",
    "dress code",
  ],

  // Critical hazard keywords requiring exact word-boundary detection to prevent false positives
  CRITICAL_HAZARD_KEYWORDS: [
    "hospitalized",
    "icu",
    "unconscious",
    "fire",
    "electric shock",
    "short circuit",
    "bleeding",
    "poisoning",
    "police",
  ],

  // Wide scope / blast-radius phrases that elevate impact by +1 tier
  WIDE_SCOPE_PHRASES: [
    "entire department",
    "entire team",
    "all employees",
    "all staff",
    "campus wide",
    "entire floor",
    "company wide",
    "all passengers",
  ],

  // Urgency detection phrases
  CRITICAL_URGENCY_PHRASES: [
    "right now",
    "immediately",
    "active leak",
    "trapped",
    "ongoing harassment",
    "ambulance",
    "threatened",
  ],
  HIGH_URGENCY_PHRASES: [
    "deadline today",
    "stranded",
    "cannot work",
    "work completely stopped",
    "payroll cutoff",
    "exam today",
    "today deadline",
    "blocked completely",
  ],
  LOW_URGENCY_PHRASES: [
    "suggestion",
    "when convenient",
    "minor clarification",
    "feedback only",
  ],
} as const;

export const DEFAULT_PRIORITY_CONFIG = {
  SYSTEM_FALLBACK_PRIORITY: PRIORITY_LEVELS.MEDIUM,
  DEFAULT_BASELINE_IMPACT: PRIORITY_LEVELS.MEDIUM,
  DEFAULT_BASELINE_URGENCY: PRIORITY_LEVELS.MEDIUM,

  // Taxonomy ceiling fallback when low impact grievances match critical rules without critical hazards
  TAXONOMY_CEILING_PRIORITY: PRIORITY_LEVELS.MEDIUM,

  ...PRIORITY_PATTERNS,
};

export const DEFAULT_PRIORITY_LEVEL: PriorityLevel =
  DEFAULT_PRIORITY_CONFIG.SYSTEM_FALLBACK_PRIORITY;

/**
 * Validates whether a value is a recognized PriorityLevel.
 */
export function isValidPriorityLevel(val: unknown): val is PriorityLevel {
  if (typeof val !== "string") return false;
  return ALLOWED_PRIORITY_LEVELS.includes(
    val.trim().toUpperCase() as PriorityLevel,
  );
}

/**
 * Validates whether a value is a recognized SeverityLevel.
 */
export function isValidSeverityLevel(val: unknown): val is SeverityLevel {
  return isValidPriorityLevel(val);
}

/**
 * Safely parses and normalizes a string into a valid PriorityLevel or returns null.
 */
export function normalizePriorityLevel(val: unknown): PriorityLevel | null {
  if (typeof val !== "string") return null;
  const upper = val.trim().toUpperCase();
  if (ALLOWED_PRIORITY_LEVELS.includes(upper as PriorityLevel)) {
    return upper as PriorityLevel;
  }
  return null;
}
