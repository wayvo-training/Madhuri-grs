import { prisma } from "@/lib/prisma";

export interface PriorityCalculationInput {
  categoryId?: bigint | number | string | null;
  categoryName?: string | null;
  subcategoryId?: bigint | number | string | null;
  subcategoryName?: string | null;
  title?: string | null;
  description?: string | null;
}

export interface PriorityCalculationResult {
  priority: string;
  priorityRuleId: bigint | null;
  matchedRuleName: string;
  isDefault: boolean;
}

/**
 * Evaluates active priority rules ordered by rule_order ascending (top-to-bottom, first match wins).
 * Matches by Category + Subcategory, then falls back to the configured System Default (MEDIUM).
 */
export async function determinePriority(
  input: PriorityCalculationInput,
): Promise<PriorityCalculationResult> {
  const catIdStr = input.categoryId?.toString() || null;
  const subcatIdStr = input.subcategoryId?.toString() || null;
  const catName = input.categoryName?.trim().toLowerCase() || null;
  const subcatName = input.subcategoryName?.trim().toLowerCase() || null;

  // 1. Fetch active priority rules ordered by priority rule_order
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

    const cond = rule.conditions as Record<string, unknown> | null;
    if (!cond) continue;

    // Check Subcategory match (by ID or name)
    const ruleSubcatId = cond.subcategory_id?.toString();
    const ruleSubcatName = (
      (cond.subcategory as string) ||
      (cond.subcategory_name as string) ||
      ""
    )
      .trim()
      .toLowerCase();

    // Check Category match (by ID or name)
    const ruleCatId = cond.category_id?.toString();
    const ruleCatName = (
      (cond.category as string) ||
      (cond.category_name as string) ||
      ""
    )
      .trim()
      .toLowerCase();

    const matchesSubcategory =
      (subcatIdStr && ruleSubcatId === subcatIdStr) ||
      (subcatName && ruleSubcatName && ruleSubcatName === subcatName);

    const matchesCategory =
      (catIdStr && ruleCatId === catIdStr) ||
      (catName && ruleCatName && ruleCatName === catName);

    // Rule specifies both Category and Subcategory
    if ((ruleSubcatId || ruleSubcatName) && (ruleCatId || ruleCatName)) {
      if (matchesCategory && matchesSubcategory) {
        return {
          priority: rule.priority_level,
          priorityRuleId: rule.priority_rule_id,
          matchedRuleName: rule.rule_name,
          isDefault: false,
        };
      }
    }
    // Rule specifies only Subcategory
    else if (ruleSubcatId || ruleSubcatName) {
      if (matchesSubcategory) {
        return {
          priority: rule.priority_level,
          priorityRuleId: rule.priority_rule_id,
          matchedRuleName: rule.rule_name,
          isDefault: false,
        };
      }
    }
    // Rule specifies only Category
    else if (ruleCatId || ruleCatName) {
      if (matchesCategory) {
        return {
          priority: rule.priority_level,
          priorityRuleId: rule.priority_rule_id,
          matchedRuleName: rule.rule_name,
          isDefault: false,
        };
      }
    }

    // Keyword matching check
    const keywords = (cond.contains || cond.keywords) as string[] | undefined;
    if (Array.isArray(keywords) && keywords.length > 0) {
      const fullText =
        `${input.title || ""} ${input.description || ""}`.toLowerCase();
      const hasKeyword = keywords.some((kw) =>
        fullText.includes(kw.toLowerCase().trim()),
      );
      if (hasKeyword) {
        return {
          priority: rule.priority_level,
          priorityRuleId: rule.priority_rule_id,
          matchedRuleName: rule.rule_name,
          isDefault: false,
        };
      }
    }
  }

  // Fallback to configured default priority rule
  if (defaultRule) {
    return {
      priority: defaultRule.priority_level,
      priorityRuleId: defaultRule.priority_rule_id,
      matchedRuleName: defaultRule.rule_name,
      isDefault: true,
    };
  }

  // Absolute fallback if no default rule was marked in database
  return {
    priority: "MEDIUM",
    priorityRuleId: null,
    matchedRuleName: "System Fallback Default",
    isDefault: true,
  };
}
