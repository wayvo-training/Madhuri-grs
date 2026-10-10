import { prisma } from "@/lib/prisma";

export const ALLOWED_PRIORITY_LEVELS = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
] as const;
export type PriorityLevel = (typeof ALLOWED_PRIORITY_LEVELS)[number];

export interface PriorityCalculationInput {
  categoryId?: bigint | number | string | null;
  categoryName?: string | null;
  subcategoryId?: bigint | number | string | null;
  subcategoryName?: string | null;
  title?: string | null;
  description?: string | null;
  // Retained as optional properties for caller compatibility; ignored in calculation flow
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
}

/**
 * Pure rule matching helper that evaluates a single rule's conditions against grievance inputs.
 * Exported for deterministic unit testing without database dependency.
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

  const matchesSubcategory = Boolean(
    (subcatIdStr && ruleSubcatId && ruleSubcatId === subcatIdStr) ||
      (subcatName && ruleSubcatName && ruleSubcatName === subcatName),
  );

  const matchesCategory = Boolean(
    (catIdStr && ruleCatId && ruleCatId === catIdStr) ||
      (catName && ruleCatName && ruleCatName === catName),
  );

  const hasSubcatScope = Boolean(ruleSubcatId || ruleSubcatName);
  const hasCatScope = Boolean(ruleCatId || ruleCatName);

  // 1. Both Category and Subcategory specified
  if (hasCatScope && hasSubcatScope) {
    if (matchesCategory && matchesSubcategory) {
      return true;
    }
  }
  // 2. Only Subcategory specified
  else if (hasSubcatScope) {
    if (matchesSubcategory) {
      return true;
    }
  }
  // 3. Only Category specified
  else if (hasCatScope) {
    if (matchesCategory) {
      return true;
    }
  }

  // 4. Keyword matching against Title and Description
  const rawKeywords = cond.contains || cond.keywords;
  if (Array.isArray(rawKeywords) && rawKeywords.length > 0) {
    const fullText =
      `${input.title || ""} ${input.description || ""}`.toLowerCase();
    const hasKeyword = rawKeywords.some((kw) => {
      if (typeof kw !== "string") return false;
      const trimmed = kw.trim().toLowerCase();
      return trimmed.length > 0 && fullText.includes(trimmed);
    });
    if (hasKeyword) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates active priority rules ordered by rule_order ascending (top-to-bottom, first match wins).
 *
 * Matching precedence:
 * 1. Active non-default rule matching Category and/or Subcategory, or Title/Description keywords.
 * 2. Active configured default fallback priority rule (is_default = true).
 * 3. Safe system fallback priority ("MEDIUM").
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

  // 1. Fetch active priority rules ordered by rule_order ascending
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
        return {
          priority: rule.priority_level || "MEDIUM",
          priorityRuleId: rule.priority_rule_id,
          matchedRuleName: rule.rule_name,
          isDefault: false,
        };
      }
    } catch (err) {
      // Malformed condition in individual rule must not crash priority calculation
      console.error(
        `[PriorityEngine] Error evaluating rule ${rule.priority_rule_id}:`,
        err,
      );
    }
  }

  // 2. Fallback to active configured default priority rule
  if (defaultRule) {
    return {
      priority: defaultRule.priority_level || "MEDIUM",
      priorityRuleId: defaultRule.priority_rule_id,
      matchedRuleName: defaultRule.rule_name,
      isDefault: true,
    };
  }

  // 3. Absolute fallback if no matching rule or default rule exists
  return {
    priority: "MEDIUM",
    priorityRuleId: null,
    matchedRuleName: "System Fallback Default",
    isDefault: true,
  };
}
