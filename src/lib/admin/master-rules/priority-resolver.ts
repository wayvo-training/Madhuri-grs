import type { SerializedPriorityRule } from "@/types/admin/master-rules";

export interface ResolvedPriority {
  priority: string;
  matchedRule: SerializedPriorityRule | null;
}

/**
 * Resolves the effective priority for a grievance type using first-match-wins logic.
 * 1. Checks specific active priority rules against subcategory and category.
 * 2. Skips default fallback rules during specific matching.
 * 3. Falls back to active default rule if no specific rule matches.
 * 4. Ultimately falls back to "MEDIUM" if nothing matches.
 */
export function resolveEffectivePriority(
  subcatName: string,
  catName: string,
  activePriorityRules: SerializedPriorityRule[],
  defaultPriorityRule: SerializedPriorityRule | null,
): ResolvedPriority {
  const sName = subcatName.toLowerCase().trim();
  const cName = catName.toLowerCase().trim();

  for (const rule of activePriorityRules) {
    if (rule.is_default) continue;
    const cond =
      rule.conditions && typeof rule.conditions === "object"
        ? (rule.conditions as Record<string, unknown>)
        : null;
    if (!cond) continue;

    const rSubcat = (
      (cond.subcategory || cond.subcategory_name || "") as string
    )
      .toLowerCase()
      .trim();
    const rCat = ((cond.category || cond.category_name || "") as string)
      .toLowerCase()
      .trim();

    if (rSubcat && rCat) {
      if (rSubcat === sName && rCat === cName) {
        return { priority: rule.priority_level, matchedRule: rule };
      }
    } else if (rSubcat) {
      if (rSubcat === sName) {
        return { priority: rule.priority_level, matchedRule: rule };
      }
    } else if (rCat) {
      if (rCat === cName) {
        return { priority: rule.priority_level, matchedRule: rule };
      }
    }
  }

  if (defaultPriorityRule) {
    return {
      priority: defaultPriorityRule.priority_level,
      matchedRule: defaultPriorityRule,
    };
  }

  return { priority: "MEDIUM", matchedRule: null };
}
