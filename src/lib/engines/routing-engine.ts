import { prisma } from "@/lib/prisma";

export interface RoutingCalculationInput {
  categoryId?: bigint | number | string | null;
  subcategoryId?: bigint | number | string | null;
}

export interface RoutingCalculationResult {
  departmentId: bigint;
  involvementType: string;
  routingRuleId: bigint;
  matchedRuleName: string;
  matchType: "EXACT_SUBCATEGORY" | "CATEGORY_FALLBACK";
}

/**
 * Routing Engine (Steps 9, 10 & 11 of GRS Specification)
 * Matches grievance category & subcategory against active routing rules ordered by rule_order.
 * 1. Exact match: Category + Subcategory
 * 2. Category Fallback: Category only (subcategory is null)
 * 3. No match: Returns null -> Grievance is routed to Manual Routing Queue (Admin Exception Workflow)
 */
export async function determineDepartmentRouting(
  input: RoutingCalculationInput,
): Promise<RoutingCalculationResult | null> {
  const catId = input.categoryId ? BigInt(input.categoryId) : null;
  const subcatId = input.subcategoryId ? BigInt(input.subcategoryId) : null;

  if (!catId) return null;

  // 1. Fetch active routing rules ordered by priority order
  const activeRules = await prisma.routing_rules.findMany({
    where: { status: "ACTIVE" },
    orderBy: { rule_order: "asc" },
  });

  // Step 1: Exact match on Category + Subcategory
  if (subcatId) {
    const exactMatch = activeRules.find(
      (r) => r.category_id === catId && r.subcategory_id === subcatId,
    );

    if (exactMatch) {
      return {
        departmentId: exactMatch.department_id,
        involvementType: exactMatch.involvement_type,
        routingRuleId: exactMatch.routing_rule_id,
        matchedRuleName: exactMatch.rule_name,
        matchType: "EXACT_SUBCATEGORY",
      };
    }
  }

  // Step 2: Fallback to Category only (rule has category_id matched and subcategory_id is null)
  const categoryMatch = activeRules.find(
    (r) => r.category_id === catId && r.subcategory_id === null,
  );

  if (categoryMatch) {
    return {
      departmentId: categoryMatch.department_id,
      involvementType: categoryMatch.involvement_type,
      routingRuleId: categoryMatch.routing_rule_id,
      matchedRuleName: categoryMatch.rule_name,
      matchType: "CATEGORY_FALLBACK",
    };
  }

  // Step 3: No applicable routing rule found
  // Returns null -> Placed into Manual Routing Queue for Admin Exception Allocation
  return null;
}
