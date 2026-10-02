import type { Prisma } from "@prisma/client";
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
  supportingDepartmentIds: bigint[];
  routingRuleId: bigint;
  matchedRuleName: string;
  matchType: "EXACT_SUBCATEGORY" | "CATEGORY_FALLBACK";
}

/**
 * Resolves supporting department names and IDs from rule JSON metadata against active departments,
 * ensuring the primary department is excluded and duplicates are stripped.
 */
function resolveSupportingDepartments(
  rawSupporting: unknown,
  primaryDeptId: bigint,
  activeDepartments: { department_id: bigint; department_name: string }[],
): { names: string[]; ids: bigint[] } {
  if (!Array.isArray(rawSupporting)) {
    return { names: [], ids: [] };
  }

  const names: string[] = [];
  const ids: bigint[] = [];

  for (const item of rawSupporting) {
    if (!item) continue;
    const str = String(item).trim();
    const matched = activeDepartments.find(
      (d) =>
        d.department_name.toLowerCase() === str.toLowerCase() ||
        d.department_id.toString() === str,
    );

    if (
      matched &&
      matched.department_id !== primaryDeptId &&
      !ids.includes(matched.department_id)
    ) {
      ids.push(matched.department_id);
      names.push(matched.department_name);
    }
  }

  return { names, ids };
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

  // Fetch active departments to resolve supporting department IDs
  const activeDepartments = await prisma.departments.findMany({
    where: { status: "ACTIVE" },
    select: { department_id: true, department_name: true },
  });

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
    const { names: suppNames, ids: suppIds } = resolveSupportingDepartments(
      exactMatch.supporting_departments,
      exactMatch.department_id,
      activeDepartments,
    );

    return {
      departmentId: exactMatch.department_id,
      departmentName: exactMatch.departments.department_name,
      involvementType: exactMatch.involvement_type as "PRIMARY" | "SUPPORTING",
      supportingDepartments: suppNames,
      supportingDepartmentIds: suppIds,
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
    const { names: suppNames, ids: suppIds } = resolveSupportingDepartments(
      categoryMatch.supporting_departments,
      categoryMatch.department_id,
      activeDepartments,
    );

    return {
      departmentId: categoryMatch.department_id,
      departmentName: categoryMatch.departments.department_name,
      involvementType: categoryMatch.involvement_type as
        | "PRIMARY"
        | "SUPPORTING",
      supportingDepartments: suppNames,
      supportingDepartmentIds: suppIds,
      routingRuleId: categoryMatch.routing_rule_id,
      matchedRuleName: categoryMatch.rule_name,
      matchType: "CATEGORY_FALLBACK",
    };
  }

  // Step 3: No active routing rule matched -> Returns null for Manual Routing Queue
  return null;
}

/**
 * Automatically populates grievance_departments in PostgreSQL with 1 PRIMARY
 * entry and multiple SUPPORTING entries based on taxonomy rules.
 */
export async function populateGrievanceDepartments(
  grievanceId: bigint | number | string,
  routing: RoutingCalculationResult,
  tx?: Prisma.TransactionClient,
): Promise<{ primaryDeptId: bigint; supportingDeptIds: bigint[] }> {
  const gId = BigInt(grievanceId);
  const primaryDeptId = routing.departmentId;
  const supportingDeptIds = routing.supportingDepartmentIds || [];

  const executeInTx = async (client: Prisma.TransactionClient) => {
    // 1. Primary department: upsert in grievance_departments
    const existingPrimary = await client.grievance_departments.findFirst({
      where: {
        grievance_id: gId,
        involvement_type: "PRIMARY",
      },
    });

    if (existingPrimary) {
      await client.grievance_departments.update({
        where: {
          grievance_department_id: existingPrimary.grievance_department_id,
        },
        data: {
          department_id: primaryDeptId,
          status: "PENDING_ASSIGNMENT",
          assigned_at: new Date(),
        },
      });
    } else {
      await client.grievance_departments.create({
        data: {
          grievance_id: gId,
          department_id: primaryDeptId,
          involvement_type: "PRIMARY",
          status: "PENDING_ASSIGNMENT",
          assigned_at: new Date(),
        },
      });
    }

    // 2. Clear old SUPPORTING entries for this ticket
    await client.grievance_departments.deleteMany({
      where: {
        grievance_id: gId,
        involvement_type: "SUPPORTING",
      },
    });

    // 3. Insert fresh SUPPORTING entries
    for (const suppId of supportingDeptIds) {
      if (suppId !== primaryDeptId) {
        await client.grievance_departments.create({
          data: {
            grievance_id: gId,
            department_id: suppId,
            involvement_type: "SUPPORTING",
            status: "PENDING_ASSIGNMENT",
            assigned_at: new Date(),
          },
        });
      }
    }

    return {
      primaryDeptId,
      supportingDeptIds: supportingDeptIds.filter((id) => id !== primaryDeptId),
    };
  };

  if (tx) {
    return executeInTx(tx);
  }
  return prisma.$transaction(executeInTx);
}

/**
 * End-to-end automated routing helper: evaluates taxonomy rules and populates
 * PRIMARY and SUPPORTING grievance_departments records.
 */
export async function autoRouteGrievance(
  grievanceId: bigint | number | string,
  input: RoutingCalculationInput,
  tx?: Prisma.TransactionClient,
): Promise<RoutingCalculationResult | null> {
  const routing = await determineDepartmentRouting(input);
  if (!routing) return null;

  await populateGrievanceDepartments(grievanceId, routing, tx);
  return routing;
}
