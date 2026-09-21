import { prisma } from "@/lib/prisma";

export interface RoutingCalculationInput {
  categoryId?: bigint | number | string | null;
  subcategoryId?: bigint | number | string | null;
}

export interface RoutingCalculationResult {
  departmentId: bigint;
  departmentName?: string;
  involvementType: "PRIMARY" | "SUPPORTING";
  supportingDepartments: string[];
  routingRuleId: bigint;
  matchedRuleName: string;
  matchType: "EXACT_SUBCATEGORY" | "CATEGORY_FALLBACK";
}

/**
 * Evaluates routing rules against a Category + Subcategory combination.
 *
 * Rules:
 * 1. Every grievance must have a Category and Subcategory selected.
 * 2. Subcategory must strictly belong to the selected Category.
 * 3. Exact match on (Category + Subcategory) takes precedence (ordered by rule_order ASC).
 * 4. Fallback match on Category (subcategory_id is null) is evaluated next.
 * 5. If no active rule matches -> Returns null (Grievance enters Manual Routing Queue).
 */
export async function determineDepartmentRouting(
  input: RoutingCalculationInput,
): Promise<RoutingCalculationResult | null> {
  if (!input.categoryId || !input.subcategoryId) {
    // Missing category or subcategory -> Cannot auto-route, enters Manual Routing Queue
    return null;
  }

  const catId = BigInt(input.categoryId);
  const subcatId = BigInt(input.subcategoryId);

  // Validate that subcategory strictly belongs to the specified category
  const subcategory = await prisma.subcategories.findUnique({
    where: { subcategory_id: subcatId },
    select: { category_id: true, status: true },
  });

  if (subcategory?.status !== "ACTIVE" || subcategory?.category_id !== catId) {
    // Subcategory mismatch or inactive -> Route to Manual Routing Queue
    return null;
  }

  // Fetch active routing rules ordered by rule_order ASC with department details
  const activeRules = await prisma.routing_rules.findMany({
    where: { status: "ACTIVE" },
    include: {
      departments: {
        select: { department_name: true },
      },
    },
    orderBy: { rule_order: "asc" },
  });

  // Step 1: Exact match on Category + Subcategory
  const exactMatch = activeRules.find(
    (r) => r.category_id === catId && r.subcategory_id === subcatId,
  );

  if (exactMatch) {
    const supporting = Array.isArray(exactMatch.supporting_departments)
      ? (exactMatch.supporting_departments as string[])
      : [];

    return {
      departmentId: exactMatch.department_id,
      departmentName: exactMatch.departments.department_name,
      involvementType: exactMatch.involvement_type as "PRIMARY" | "SUPPORTING",
      supportingDepartments: supporting,
      routingRuleId: exactMatch.routing_rule_id,
      matchedRuleName: exactMatch.rule_name,
      matchType: "EXACT_SUBCATEGORY",
    };
  }

  // Step 2: Fallback to Category only (rule has category_id matched and subcategory_id is null)
  const categoryMatch = activeRules.find(
    (r) => r.category_id === catId && r.subcategory_id === null,
  );

  if (categoryMatch) {
    const supporting = Array.isArray(categoryMatch.supporting_departments)
      ? (categoryMatch.supporting_departments as string[])
      : [];

    return {
      departmentId: categoryMatch.department_id,
      departmentName: categoryMatch.departments.department_name,
      involvementType: categoryMatch.involvement_type as
        | "PRIMARY"
        | "SUPPORTING",
      supportingDepartments: supporting,
      routingRuleId: categoryMatch.routing_rule_id,
      matchedRuleName: categoryMatch.rule_name,
      matchType: "CATEGORY_FALLBACK",
    };
  }

  // Step 3: No active routing rule matched -> Returns null for Manual Routing Queue
  return null;
}
