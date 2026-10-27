import { DEFAULT_REOPEN_POLICY } from "@/lib/constants/reopen";
import { prisma } from "@/lib/prisma";

export interface ReopenCondition {
  category_id?: string | number;
  subcategory_id?: string | number;
  category?: string;
  subcategory?: string;
  applicable_priorities?: string[];
}

export interface ReopenPolicyMatchResult {
  policyId: bigint | null;
  policyName: string;
  maxReopenCount: number;
  maxManualReviewCount: number;
  reopenWindowHours: number | null;
  isCustom: boolean;
}

/**
 * Calculates a specificity score for a policy condition so specific rules
 * (e.g. Category + Subcategory + Priority) are prioritized over generic catch-alls.
 */
function getPolicySpecificityScore(cond?: ReopenCondition | null): number {
  if (!cond || typeof cond !== "object") return 0;
  let score = 0;
  if (cond.subcategory_id) score += 4;
  if (cond.category_id) score += 2;
  if (
    Array.isArray(cond.applicable_priorities) &&
    cond.applicable_priorities.length > 0
  ) {
    score += 1;
  }
  return score;
}

/**
 * Evaluates active reopen policies against a grievance's category, subcategory, and priority.
 * Strictly typed with zero `any` usage.
 */
export async function evaluateReopenPolicy(input: {
  categoryId?: bigint | number | string | null;
  subcategoryId?: bigint | number | string | null;
  priority?: string | null;
}): Promise<ReopenPolicyMatchResult> {
  const activePolicies = await prisma.reopen_policies.findMany({
    where: { status: "ACTIVE" },
    orderBy: { created_at: "desc" },
  });

  const catStr = input.categoryId?.toString();
  const subcatStr = input.subcategoryId?.toString();
  const priorityStr = input.priority?.toUpperCase();

  // Sort policies by specificity descending, then by created_at descending
  const sortedPolicies = [...activePolicies].sort((a, b) => {
    const scoreA = getPolicySpecificityScore(
      a.applicable_condition as ReopenCondition | null,
    );
    const scoreB = getPolicySpecificityScore(
      b.applicable_condition as ReopenCondition | null,
    );
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  let matchedPolicy: (typeof activePolicies)[number] | null = null;

  for (const policy of sortedPolicies) {
    if (
      policy.applicable_condition &&
      typeof policy.applicable_condition === "object"
    ) {
      const cond = policy.applicable_condition as ReopenCondition;

      const condCatId =
        cond.category_id !== undefined && cond.category_id !== null
          ? String(cond.category_id)
          : undefined;
      const condSubcatId =
        cond.subcategory_id !== undefined && cond.subcategory_id !== null
          ? String(cond.subcategory_id)
          : undefined;

      const matchesCategory = !condCatId || condCatId === catStr;
      const matchesSubcategory = !condSubcatId || condSubcatId === subcatStr;

      const configuredPriorities = Array.isArray(cond.applicable_priorities)
        ? cond.applicable_priorities
        : [];
      const hasPriorityRestriction = configuredPriorities.length > 0;

      const matchesPriority =
        !hasPriorityRestriction ||
        (priorityStr !== undefined &&
          configuredPriorities
            .map((p) => p.toUpperCase())
            .includes(priorityStr));

      if (matchesCategory && matchesSubcategory && matchesPriority) {
        matchedPolicy = policy;
        break;
      }
    } else if (!matchedPolicy) {
      matchedPolicy = policy;
      break;
    }
  }

  return {
    policyId: matchedPolicy ? matchedPolicy.reopen_policy_id : null,
    policyName: matchedPolicy?.policy_name || DEFAULT_REOPEN_POLICY.POLICY_NAME,
    maxReopenCount:
      matchedPolicy?.max_reopen_count ?? DEFAULT_REOPEN_POLICY.MAX_REOPEN_COUNT,
    maxManualReviewCount:
      matchedPolicy?.max_manual_review_count ??
      DEFAULT_REOPEN_POLICY.MAX_MANUAL_REVIEW_COUNT,
    reopenWindowHours:
      matchedPolicy?.reopen_window_hours ??
      DEFAULT_REOPEN_POLICY.REOPEN_WINDOW_HOURS,
    isCustom: Boolean(matchedPolicy),
  };
}

/**
 * Calculates total reopens allowed dynamically (Normal Staff Reopens + Head Manual Reviews).
 */
export function getTotalAllowedReopens(
  policy: ReopenPolicyMatchResult,
): number {
  return policy.maxReopenCount + policy.maxManualReviewCount;
}

/**
 * Checks whether a given reopen count requires Department Head manual review or escalation.
 * A reopen triggers Head manual review when normal staff reopens have been exhausted
 * (i.e. reopenCount > policy.maxReopenCount).
 */
export function requiresHeadManualReview(
  reopenCount: number,
  policy: ReopenPolicyMatchResult,
): boolean {
  return reopenCount > policy.maxReopenCount && policy.maxManualReviewCount > 0;
}
