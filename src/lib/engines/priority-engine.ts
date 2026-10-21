import {
  ALLOWED_PRIORITY_LEVELS,
  DEFAULT_PRIORITY_CONFIG,
  DEFAULT_PRIORITY_LEVEL,
  IMPACT_ESCALATION,
  isValidPriorityLevel,
  normalizePriorityLevel,
  PRIORITY_LEVELS,
  PRIORITY_MATRIX,
  type PriorityLevel,
  type SeverityLevel,
} from "@/lib/constants/priority";
import { prisma } from "@/lib/prisma";

export {
  ALLOWED_PRIORITY_LEVELS,
  DEFAULT_PRIORITY_CONFIG,
  DEFAULT_PRIORITY_LEVEL,
  IMPACT_ESCALATION,
  isValidPriorityLevel,
  normalizePriorityLevel,
  PRIORITY_LEVELS,
  PRIORITY_MATRIX,
  type PriorityLevel,
  type SeverityLevel,
};

export interface PriorityRuleLike {
  priority_rule_id: bigint;
  rule_name: string;
  conditions: unknown;
  priority_level: string;
  rule_order: number;
  is_default: boolean;
  status: string;
}

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
  rulesOverride?: Array<PriorityRuleLike> | null;
}

export interface PriorityCalculationResult {
  priority: PriorityLevel;
  priorityRuleId: bigint | null;
  matchedRuleName: string;
  isDefault: boolean;
  impact: SeverityLevel;
  urgency: SeverityLevel;
}

/**
 * Helper to escape regex special characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Checks if a word or phrase appears in the text using word-boundary matching
 * to eliminate false-positive substring matches (e.g. "icu" in "difficult" or "fire" in "firewall").
 */
export function matchWordOrPhrase(text: string, term: string): boolean {
  if (!text || !term) return false;
  const trimmedTerm = term.trim();
  if (trimmedTerm.length === 0) return false;

  // For both single words and multi-word phrases, require non-alphanumeric word boundaries
  const escaped = escapeRegex(trimmedTerm);
  const regex = new RegExp(
    `(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`,
    "i",
  );
  return regex.test(text);
}

/**
 * Determines baseline Impact based on Category, Subcategory, critical hazards, and Blast-Radius / Scope.
 */
export function determineBaselineImpact(
  categoryName?: string | null,
  subcategoryName?: string | null,
  fullText?: string,
): SeverityLevel {
  const cat = (categoryName || "").toLowerCase();
  const subcat = (subcategoryName || "").toLowerCase();
  const text = fullText || "";

  // 1. Critical real-world hazard overrides take immediate precedence
  // Uses word-boundary matching so words like "difficult" or "firewall" do not trigger false alerts
  if (
    DEFAULT_PRIORITY_CONFIG.CRITICAL_HAZARD_KEYWORDS.some((hazard) =>
      matchWordOrPhrase(text, hazard),
    )
  ) {
    return PRIORITY_LEVELS.CRITICAL;
  }

  let impact: SeverityLevel = DEFAULT_PRIORITY_CONFIG.DEFAULT_BASELINE_IMPACT;

  // 2. Inherent taxonomy impact
  if (
    DEFAULT_PRIORITY_CONFIG.INHERENT_CRITICAL_PATTERNS.some(
      (pat) => subcat.includes(pat) || cat.includes(pat),
    )
  ) {
    impact = PRIORITY_LEVELS.CRITICAL;
  } else if (
    DEFAULT_PRIORITY_CONFIG.INHERENT_HIGH_PATTERNS.some(
      (pat) => subcat.includes(pat) || cat.includes(pat),
    )
  ) {
    impact = PRIORITY_LEVELS.HIGH;
  } else if (
    DEFAULT_PRIORITY_CONFIG.INHERENT_LOW_PATTERNS.some(
      (pat) => subcat.includes(pat) || cat.includes(pat),
    )
  ) {
    impact = PRIORITY_LEVELS.LOW;
  }

  // 3. Scope / Blast-Radius bump (+1 level)
  if (
    DEFAULT_PRIORITY_CONFIG.WIDE_SCOPE_PHRASES.some((phrase) =>
      matchWordOrPhrase(text, phrase),
    )
  ) {
    impact = IMPACT_ESCALATION[impact];
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
  const text = fullText || "";
  const subcat = (subcategoryName || "").toLowerCase();

  if (
    DEFAULT_PRIORITY_CONFIG.CRITICAL_URGENCY_PHRASES.some((phrase) =>
      matchWordOrPhrase(text, phrase),
    )
  ) {
    return PRIORITY_LEVELS.CRITICAL;
  }

  if (
    DEFAULT_PRIORITY_CONFIG.HIGH_URGENCY_PHRASES.some((phrase) =>
      matchWordOrPhrase(text, phrase),
    )
  ) {
    return PRIORITY_LEVELS.HIGH;
  }

  if (subcat.includes("emergency") || subcat.includes("safety")) {
    return PRIORITY_LEVELS.HIGH;
  }

  if (
    DEFAULT_PRIORITY_CONFIG.LOW_URGENCY_PHRASES.some((phrase) =>
      matchWordOrPhrase(text, phrase),
    )
  ) {
    return PRIORITY_LEVELS.LOW;
  }

  return DEFAULT_PRIORITY_CONFIG.DEFAULT_BASELINE_URGENCY;
}

/**
 * Calculates priority from the ITIL Impact x Urgency Matrix with input normalization.
 */
export function calculateMatrixPriority(
  impact: unknown,
  urgency: unknown,
): PriorityLevel {
  const normImpact =
    normalizePriorityLevel(impact) ||
    DEFAULT_PRIORITY_CONFIG.DEFAULT_BASELINE_IMPACT;
  const normUrgency =
    normalizePriorityLevel(urgency) ||
    DEFAULT_PRIORITY_CONFIG.DEFAULT_BASELINE_URGENCY;

  return PRIORITY_MATRIX[normImpact][normUrgency];
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

  const matchesSubcategory = Boolean(
    (subcatIdStr && ruleSubcatId && ruleSubcatId === subcatIdStr) ||
      (subcatName && ruleSubcatName && ruleSubcatName === subcatName),
  );

  const matchesCategory = Boolean(
    (catIdStr && ruleCatId && ruleCatId === catIdStr) ||
      (catName && ruleCatName && ruleCatName === catName),
  );

  // 1. Category Scope: Category-specific rules must strictly match their configured category
  if (hasCatScope && !matchesCategory) {
    return false;
  }

  // 2. Subcategory Scope: Subcategory-specific rules must strictly match their configured subcategory
  if (hasSubcatScope && !matchesSubcategory) {
    return false;
  }

  // 3. Keyword matching against Title and Description using word-boundary logic
  const rawKeywords = cond.contains || cond.keywords;
  const hasKeywords = Array.isArray(rawKeywords) && rawKeywords.length > 0;

  if (hasKeywords) {
    const fullText = `${input.title || ""} ${input.description || ""}`;
    const hasKeyword = rawKeywords.some((kw) => {
      if (typeof kw !== "string") return false;
      return matchWordOrPhrase(fullText, kw);
    });
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
 * Deterministic Precedence Policy:
 * 1. Active non-default rules ordered by { rule_order: "asc", priority_rule_id: "asc" }.
 * 2. ITIL Impact x Urgency Matrix evaluation when specific signals are present.
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

  // 1. Calculate ITIL Impact and Urgency with safe runtime input validation
  const providedImpact = normalizePriorityLevel(input.impact);
  const providedUrgency = normalizePriorityLevel(input.urgency);

  const derivedImpact: SeverityLevel =
    providedImpact || determineBaselineImpact(catName, subcatName, fullText);
  const derivedUrgency: SeverityLevel =
    providedUrgency || determineBaselineUrgency(fullText, subcatName);

  const matrixPriority = calculateMatrixPriority(derivedImpact, derivedUrgency);

  // 2. Fetch active priority rules with deterministic ordering
  const rules: PriorityRuleLike[] =
    input.rulesOverride !== undefined && input.rulesOverride !== null
      ? [...input.rulesOverride]
          .filter((r) => r.status === "ACTIVE")
          .sort((a, b) => {
            if (a.rule_order !== b.rule_order) {
              return a.rule_order - b.rule_order;
            }
            if (a.priority_rule_id < b.priority_rule_id) return -1;
            if (a.priority_rule_id > b.priority_rule_id) return 1;
            return 0;
          })
      : await prisma.priority_rules.findMany({
          where: { status: "ACTIVE" },
          orderBy: [{ rule_order: "asc" }, { priority_rule_id: "asc" }],
        });

  let defaultRule: PriorityRuleLike | null = null;

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
        // Validate configured rule priority level
        const validatedRuleLevel = normalizePriorityLevel(rule.priority_level);
        if (!validatedRuleLevel) {
          console.warn(
            `[PriorityEngine] Rule ${rule.priority_rule_id} has invalid priority_level "${rule.priority_level}". Skipping.`,
          );
          continue;
        }

        // Enforce taxonomy ceiling: if the matrix calculated LOW impact (e.g. ID card),
        // and no critical hazard exists, a keyword rule cannot artificially force it directly to CRITICAL
        const finalPriority: PriorityLevel =
          derivedImpact === PRIORITY_LEVELS.LOW &&
          validatedRuleLevel === PRIORITY_LEVELS.CRITICAL
            ? DEFAULT_PRIORITY_CONFIG.TAXONOMY_CEILING_PRIORITY
            : validatedRuleLevel;

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

  // 3. Dynamic ITIL Matrix priority when specific signals differ from baseline
  const isNonBaseline =
    derivedImpact !== DEFAULT_PRIORITY_CONFIG.DEFAULT_BASELINE_IMPACT ||
    derivedUrgency !== DEFAULT_PRIORITY_CONFIG.DEFAULT_BASELINE_URGENCY ||
    Boolean(providedImpact || providedUrgency);

  if (isNonBaseline) {
    return {
      priority: matrixPriority,
      priorityRuleId: null,
      matchedRuleName: `ITIL Impact × Urgency Matrix (${derivedImpact} × ${derivedUrgency})`,
      isDefault: false,
      impact: derivedImpact,
      urgency: derivedUrgency,
    };
  }

  // 4. Configured Default Rule fallback when no specific rule matched and inputs are baseline
  if (defaultRule) {
    const validatedDefaultLevel =
      normalizePriorityLevel(defaultRule.priority_level) ||
      DEFAULT_PRIORITY_CONFIG.SYSTEM_FALLBACK_PRIORITY;

    return {
      priority: validatedDefaultLevel,
      priorityRuleId: defaultRule.priority_rule_id,
      matchedRuleName: defaultRule.rule_name,
      isDefault: true,
      impact: derivedImpact,
      urgency: derivedUrgency,
    };
  }

  // 5. System fallback when no default rule exists in database
  return {
    priority: DEFAULT_PRIORITY_CONFIG.SYSTEM_FALLBACK_PRIORITY,
    priorityRuleId: null,
    matchedRuleName: "System Fallback Default",
    isDefault: true,
    impact: derivedImpact,
    urgency: derivedUrgency,
  };
}
