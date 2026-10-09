import { prisma } from "@/lib/prisma";

export interface ReopenCondition {
  category_id?: string;
  subcategory_id?: string;
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

  let matchedPolicy: (typeof activePolicies)[number] | null = null;

  for (const policy of activePolicies) {
    if (
      policy.applicable_condition &&
      typeof policy.applicable_condition === "object"
    ) {
      const cond = policy.applicable_condition as ReopenCondition;
      const matchesCategory = !cond.category_id || cond.category_id === catStr;
      const matchesSubcategory =
        !cond.subcategory_id || cond.subcategory_id === subcatStr;
      const matchesPriority =
        !cond.applicable_priorities ||
        (priorityStr &&
          Array.isArray(cond.applicable_priorities) &&
          cond.applicable_priorities
            .map((p) => p.toUpperCase())
            .includes(priorityStr));

      if (matchesCategory && matchesSubcategory && matchesPriority) {
        matchedPolicy = policy;
        break;
      }
    } else if (!matchedPolicy) {
      matchedPolicy = policy;
    }
  }

  return {
    policyId: matchedPolicy ? matchedPolicy.reopen_policy_id : null,
    policyName: matchedPolicy?.policy_name || "Default Reopen Policy",
    maxReopenCount: matchedPolicy?.max_reopen_count ?? 2,
    maxManualReviewCount: matchedPolicy?.max_manual_review_count ?? 2,
    reopenWindowHours: matchedPolicy?.reopen_window_hours ?? 72,
    isCustom: Boolean(matchedPolicy),
  };
}

/**
 * Checks whether a given reopen count requires Department Head manual review or escalation.
 */
export function requiresHeadManualReview(
  reopenCount: number,
  policy: ReopenPolicyMatchResult,
): boolean {
  return (
    reopenCount >= policy.maxManualReviewCount ||
    reopenCount >= policy.maxReopenCount
  );
}
