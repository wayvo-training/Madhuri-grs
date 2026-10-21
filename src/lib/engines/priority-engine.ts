import { prisma } from "@/lib/prisma";

export const ALLOWED_PRIORITY_LEVELS = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
] as const;
export type PriorityLevel = (typeof ALLOWED_PRIORITY_LEVELS)[number];
export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/**
 * Standard ITIL Impact x Urgency Priority Matrix.
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

export interface PriorityCalculationInput {
  categoryId?: bigint | number | string | null;
  categoryName?: string | null;
  subcategoryId?: bigint | number | string | null;
  subcategoryName?: string | null;
  title?: string | null;
  description?: string | null;
  impact?: string | null;
  urgency?: string | null;
  scope?: string | null;
  risk?: string | null;
}

export interface PriorityCalculationResult {
  priority: string;
  priorityRuleId: bigint | null;
  matchedRuleName: string;
  isDefault: boolean;
  impact?: SeverityLevel;
  urgency?: SeverityLevel;
}

/**
 * Helper to match a word or phrase with word boundaries to prevent false positives
 * (e.g., 'icu' matching 'particular', or 'trapped' matching 'strapped').
 */
export function matchesWordOrPhrase(text: string, term: string): boolean {
  if (!text || !term) return false;
  const trimmed = term.trim();
  if (!trimmed) return false;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");
  return regex.test(text);
}

/**
 * Determines baseline Impact based on Category, Subcategory, and Blast-Radius / Scope keywords.
 */
export function determineBaselineImpact(
  categoryName?: string | null,
  subcategoryName?: string | null,
  fullText?: string,
): SeverityLevel {
  const cat = (categoryName || "").toLowerCase();
  const subcat = (subcategoryName || "").toLowerCase();
  const text = (fullText || "").toLowerCase();

  let impact: SeverityLevel = "MEDIUM";

  // 1. Inherent taxonomy impact
  if (
    subcat.includes("safety") ||
    subcat.includes("harassment") ||
    subcat.includes("posh") ||
    subcat.includes("confidentiality") ||
    subcat.includes("emergency leave") ||
    subcat.includes("misconduct") ||
    cat.includes("ethics")
  ) {
    impact = "CRITICAL";
  } else if (
    subcat.includes("salary") ||
    subcat.includes("pay") ||
    subcat.includes("deduction") ||
    subcat.includes("bonus") ||
    subcat.includes("reimbursement") ||
    subcat.includes("insurance") ||
    subcat.includes("maternity") ||
    subcat.includes("leave approval") ||
    subcat.includes("attendance") ||
    cat.includes("compensation") ||
    cat.includes("leave")
  ) {
    impact = "HIGH";
  } else if (
    subcat.includes("id card") ||
    subcat.includes("stationery") ||
    subcat.includes("general inquiry") ||
    subcat.includes("policy clarification") ||
    subcat.includes("dress code")
  ) {
    impact = "LOW";
  }

  // 2. Severe real-world hazard overrides (enforcing word boundaries)
  const criticalHazards = [
    "hospitalized",
    "icu",
    "unconscious",
    "fire",
    "electric shock",
    "short circuit",
    "bleeding",
    "poisoning",
    "police",
  ];
  if (criticalHazards.some((h) => matchesWordOrPhrase(text, h))) {
    return "CRITICAL";
  }

  // 3. Scope / Blast-Radius bump (+1 level)
  const wideScopePhrases = [
    "entire department",
    "entire team",
    "all employees",
    "all staff",
    "campus wide",
    "entire floor",
    "company wide",
    "all passengers",
  ];
  if (wideScopePhrases.some((p) => matchesWordOrPhrase(text, p))) {
    if (impact === "LOW") impact = "MEDIUM";
    else if (impact === "MEDIUM") impact = "HIGH";
    else if (impact === "HIGH") impact = "CRITICAL";
  }

  return impact;
}

/**
 * Determines Urgency based on timing, deadlines, and operational disruption.
 */
export function determineBaselineUrgency(
  fullText?: string,
  subcategoryName?: string | null,
): SeverityLevel {
  const text = (fullText || "").toLowerCase();
  const subcat = (subcategoryName || "").toLowerCase();

  const criticalUrgencyWords = [
    "right now",
    "immediately",
    "active leak",
    "trapped",
    "ongoing harassment",
    "ambulance",
    "threatened",
  ];
  if (criticalUrgencyWords.some((w) => matchesWordOrPhrase(text, w))) {
    return "CRITICAL";
  }

  const highUrgencyWords = [
    "deadline today",
    "stranded",
    "cannot work",
    "work completely stopped",
    "payroll cutoff",
    "exam today",
    "today deadline",
    "blocked completely",
  ];
  if (highUrgencyWords.some((w) => matchesWordOrPhrase(text, w))) {
    return "HIGH";
  }

  if (subcat.includes("emergency") || subcat.includes("safety")) {
    return "HIGH";
  }

  const lowUrgencyWords = [
    "suggestion",
    "when convenient",
    "minor clarification",
    "feedback only",
  ];
  if (lowUrgencyWords.some((w) => matchesWordOrPhrase(text, w))) {
    return "LOW";
  }

  return "MEDIUM";
}

/**
 * Calculates priority from the ITIL Impact x Urgency Matrix.
 */
export function calculateMatrixPriority(
  impact: SeverityLevel,
  urgency: SeverityLevel,
): PriorityLevel {
  return PRIORITY_MATRIX[impact]?.[urgency] || "MEDIUM";
}

/**
 * Pure rule matching helper that evaluates a single rule's conditions against grievance inputs.
 */
export function evaluateRuleMatch(
  conditions: unknown,
  input: {
    categoryId?: string | null;
    categoryName?: string | null;
    subcategoryId?: string | null;
    subcategoryName?: string | null;
    title?: string | null;
    description?: string | null;
  },
): boolean {
  if (
    !conditions ||
    typeof conditions !== "object" ||
    Array.isArray(conditions)
  ) {
    return false;
  }

  const cond = conditions as Record<string, unknown>;

  const catIdStr = input.categoryId?.trim() || null;
  const subcatIdStr = input.subcategoryId?.trim() || null;
  const catName = input.categoryName?.trim().toLowerCase() || null;
  const subcatName = input.subcategoryName?.trim().toLowerCase() || null;

  // Check Subcategory scope (by ID or name)
  const ruleSubcatId =
    cond.subcategory_id != null ? String(cond.subcategory_id).trim() : null;
  const ruleSubcatName = (
    (cond.subcategory as string) ||
    (cond.subcategory_name as string) ||
    ""
  )
    .trim()
    .toLowerCase();

  // Check Category scope (by ID or name)
  const ruleCatId =
    cond.category_id != null ? String(cond.category_id).trim() : null;
  const ruleCatName = (
    (cond.category as string) ||
    (cond.category_name as string) ||
    ""
  )
    .trim()
    .toLowerCase();

  const hasSubcatScope = Boolean(ruleSubcatId || ruleSubcatName);
  const hasCatScope = Boolean(ruleCatId || ruleCatName);

  // Subcategory matching: ID takes precedence if both rule and input provide IDs
  let matchesSubcategory = false;
  if (hasSubcatScope) {
    if (ruleSubcatId && subcatIdStr) {
      matchesSubcategory = ruleSubcatId === subcatIdStr;
    } else if (ruleSubcatName && subcatName) {
      matchesSubcategory = ruleSubcatName === subcatName;
    }
  }

  // Category matching: ID takes precedence if both rule and input provide IDs
  let matchesCategory = false;
  if (hasCatScope) {
    if (ruleCatId && catIdStr) {
      matchesCategory = ruleCatId === catIdStr;
    } else if (ruleCatName && catName) {
      matchesCategory = ruleCatName === catName;
    }
  }

  // 1. Category Scope: Category-specific rules must strictly match their configured category
  if (hasCatScope && !matchesCategory) {
    return false;
  }

  // 2. Subcategory Scope: Subcategory-specific rules must strictly match their configured subcategory
  if (hasSubcatScope && !matchesSubcategory) {
    return false;
  }

  // 3. Keyword matching against Title and Description (case-insensitively with word boundaries)
  const rawKeywords = cond.contains || cond.keywords;
  let normalizedKeywords: string[] = [];
  if (Array.isArray(rawKeywords)) {
    normalizedKeywords = rawKeywords.filter(
      (k): k is string => typeof k === "string" && k.trim().length > 0,
    );
  } else if (typeof rawKeywords === "string" && rawKeywords.trim()) {
    normalizedKeywords = rawKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }

  if (normalizedKeywords.length > 0) {
    const fullText =
      `${input.title || ""} ${input.description || ""}`.toLowerCase();
    const hasKeyword = normalizedKeywords.some((kw) =>
      matchesWordOrPhrase(fullText, kw.toLowerCase()),
    );
    if (!hasKeyword) {
      return false;
    }
  } else if (!hasCatScope && !hasSubcatScope) {
    return false;
  }

  return true;
}

/**
 * Evaluates priority using the ITIL Impact x Urgency Matrix and active priority rules.
 *
 * Matching precedence:
 * 1. Active non-default rule matching Category and/or Subcategory, or verified domain keywords.
 * 2. ITIL Impact x Urgency Matrix calculation when severe/elevated conditions exist.
 * 3. Active configured default fallback priority rule (is_default = true).
 * 4. Safe system fallback priority ("MEDIUM").
 */
export async function determinePriority(
  input: PriorityCalculationInput,
): Promise<PriorityCalculationResult> {
  const catIdStr =
    input.categoryId != null ? String(input.categoryId).trim() : null;
  const subcatIdStr =
    input.subcategoryId != null ? String(input.subcategoryId).trim() : null;
  const catName = input.categoryName?.trim().toLowerCase() || null;
  const subcatName = input.subcategoryName?.trim().toLowerCase() || null;
  const fullText = `${input.title || ""} ${input.description || ""}`;

  // 1. Calculate ITIL Impact and Urgency
  const derivedImpact =
    (input.impact?.toUpperCase() as SeverityLevel) ||
    determineBaselineImpact(catName, subcatName, fullText);
  const derivedUrgency =
    (input.urgency?.toUpperCase() as SeverityLevel) ||
    determineBaselineUrgency(fullText, subcatName);

  const matrixPriority = calculateMatrixPriority(derivedImpact, derivedUrgency);

  // 2. Fetch active priority rules ordered by rule_order ascending
  const rules = await prisma.priority_rules.findMany({
    where: { status: "ACTIVE" },
    orderBy: { rule_order: "asc" },
  });

  let defaultRule: (typeof rules)[0] | null = null;

  for (const rule of rules) {
    if (rule.is_default) {
      if (!defaultRule) defaultRule = rule;
      continue;
    }

    try {
      const isMatch = evaluateRuleMatch(rule.conditions, {
        categoryId: catIdStr,
        categoryName: catName,
        subcategoryId: subcatIdStr,
        subcategoryName: subcatName,
        title: input.title,
        description: input.description,
      });

      if (isMatch) {
        // Enforce taxonomy ceiling: if the matrix calculated LOW impact (e.g. ID card),
        // a keyword rule cannot artificially force it directly to CRITICAL
        const ruleLevel = (
          rule.priority_level || "MEDIUM"
        ).toUpperCase() as PriorityLevel;
        const finalPriority =
          derivedImpact === "LOW" && ruleLevel === "CRITICAL"
            ? "MEDIUM"
            : ruleLevel;

        return {
          priority: finalPriority,
          priorityRuleId: rule.priority_rule_id,
          matchedRuleName: rule.rule_name,
          isDefault: false,
          impact: derivedImpact,
          urgency: derivedUrgency,
        };
      }
    } catch (err) {
      console.error(
        `[PriorityEngine] Error evaluating rule ${rule.priority_rule_id}:`,
        err,
      );
    }
  }

  // 3. Dynamic ITIL Matrix Priority (takes precedence if matrix determined elevated priority)
  if (matrixPriority && (!defaultRule || matrixPriority !== "MEDIUM")) {
    const isRuleMatch = Boolean(
      defaultRule && matrixPriority === defaultRule.priority_level,
    );
    return {
      priority: matrixPriority,
      priorityRuleId:
        isRuleMatch && defaultRule ? defaultRule.priority_rule_id : null,
      matchedRuleName: `ITIL Matrix (${derivedImpact} x ${derivedUrgency})`,
      isDefault: false,
      impact: derivedImpact,
      urgency: derivedUrgency,
    };
  }

  // 4. Configured active default fallback rule
  if (defaultRule) {
    return {
      priority: defaultRule.priority_level || matrixPriority || "MEDIUM",
      priorityRuleId: defaultRule.priority_rule_id,
      matchedRuleName: defaultRule.rule_name,
      isDefault: true,
      impact: derivedImpact,
      urgency: derivedUrgency,
    };
  }

  // 5. Absolute system fallback
  return {
    priority: matrixPriority || "MEDIUM",
    priorityRuleId: null,
    matchedRuleName: "System Fallback Default",
    isDefault: true,
    impact: derivedImpact,
    urgency: derivedUrgency,
  };
}
