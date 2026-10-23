import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { CACHE_TAGS, serverCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  type DepartmentDependencyNode,
  validateRoutingPolicy,
} from "@/lib/validations/dependency-graph";
import {
  validateBigIntId,
  validateConditions,
  validateRuleName,
  validateRuleOrder,
  validateStatus,
} from "@/lib/validations/rules";

/**
 * Normalizes and validates supporting departments against existing active departments.
 * Ensures the primary department is NOT included in supporting departments.
 */
async function validateAndNormalizeSupportingDepartments(
  rawSupporting: unknown,
  primaryDepartmentId: bigint,
  primaryDepartmentName: string,
): Promise<{ error?: string; departments?: string[] }> {
  if (rawSupporting === undefined || rawSupporting === null) {
    return { departments: [] };
  }

  if (!Array.isArray(rawSupporting)) {
    return {
      error:
        "supporting_departments must be an array of department names or IDs.",
    };
  }

  if (rawSupporting.length === 0) {
    return { departments: [] };
  }

  // Fetch all active departments for validation
  const allDepts = await prisma.departments.findMany({
    where: { status: "ACTIVE" },
  });

  const normalized: string[] = [];
  const primaryDeptIdStr = primaryDepartmentId.toString();
  const primaryDeptNameLower = primaryDepartmentName.toLowerCase().trim();

  for (const item of rawSupporting) {
    if (
      typeof item !== "string" &&
      typeof item !== "number" &&
      typeof item !== "bigint"
    ) {
      return {
        error:
          "Each supporting department must be a valid department name or ID.",
      };
    }

    const itemStr = item.toString().trim();
    if (!itemStr) continue;

    // Check if matching primary department by ID or name
    if (
      itemStr === primaryDeptIdStr ||
      itemStr.toLowerCase() === primaryDeptNameLower
    ) {
      return {
        error: `The primary target department ("${primaryDepartmentName}") cannot also be listed as a supporting department.`,
      };
    }

    // Match against active departments by name (case-insensitive) or ID
    const matchedDept = allDepts.find(
      (d) =>
        d.department_id.toString() === itemStr ||
        d.department_name.toLowerCase() === itemStr.toLowerCase(),
    );

    if (!matchedDept) {
      return {
        error: `Supporting department "${itemStr}" is not a recognized active department.`,
      };
    }

    if (!normalized.includes(matchedDept.department_name)) {
      normalized.push(matchedDept.department_name);
    }
  }

  return { departments: normalized };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await request.json();
    const {
      rule_name,
      category_id,
      subcategory_id,
      department_id,
      supporting_departments,
      rule_order,
      conditions,
      status,
      new_category_name,
      new_subcategory_name,
    } = body;

    // 1. Validate rule_name
    if (!rule_name || typeof rule_name !== "string" || !rule_name.trim()) {
      return NextResponse.json(
        { success: false, message: "Rule name is required." },
        { status: 400 },
      );
    }
    const validatedRuleName = validateRuleName(rule_name);
    if (!validatedRuleName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Rule name cannot consist of only numbers. It must include letters or an alphanumeric combination.",
        },
        { status: 400 },
      );
    }

    const trimmedName = validatedRuleName;

    // 1b. Check duplicate rule name (case-insensitive)
    const nameConflict = await prisma.routing_rules.findFirst({
      where: {
        rule_name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (nameConflict) {
      return NextResponse.json(
        {
          success: false,
          message: `A routing rule named "${trimmedName}" already exists. Please choose a unique rule name.`,
        },
        { status: 409 },
      );
    }

    // 2. Resolve category_id (Create on fly if CUSTOM)
    let finalCatId: bigint | null = null;
    let finalCatName = "";

    if (category_id === "CUSTOM" && new_category_name) {
      const trimmedCat = new_category_name.trim();
      if (!/[a-zA-Z]/.test(trimmedCat)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Category name cannot consist of only numbers. It must include letters (or letters and numbers).",
          },
          { status: 400 },
        );
      }
      const existingCat = await prisma.categories.findUnique({
        where: { category_name: trimmedCat },
      });
      if (existingCat) {
        finalCatId = existingCat.category_id;
        finalCatName = existingCat.category_name;
      } else {
        const newCat = await prisma.categories.create({
          data: {
            category_name: trimmedCat,
            status: "ACTIVE",
          },
        });
        finalCatId = newCat.category_id;
        finalCatName = newCat.category_name;
      }
    } else if (!category_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "category_id is required. Every routing rule must be scoped to a valid Category.",
        },
        { status: 400 },
      );
    } else {
      finalCatId = validateBigIntId(category_id);
      if (!finalCatId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "category_id must be a valid integer identifier or CUSTOM.",
          },
          { status: 400 },
        );
      }

      const category = await prisma.categories.findUnique({
        where: { category_id: finalCatId },
      });

      if (category?.status !== "ACTIVE") {
        return NextResponse.json(
          {
            success: false,
            message: "Selected category was not found or is inactive.",
          },
          { status: 400 },
        );
      }
      finalCatName = category.category_name;
    }

    // 3. Resolve subcategory_id (Create on fly if CUSTOM)
    let finalSubcatId: bigint | null = null;
    let finalSubcatName = "";

    if (subcategory_id === "CUSTOM" && new_subcategory_name && finalCatId) {
      const trimmedSubcat = new_subcategory_name.trim();
      if (!/[a-zA-Z]/.test(trimmedSubcat)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Subcategory name cannot consist of only numbers. It must include letters (or letters and numbers).",
          },
          { status: 400 },
        );
      }
      const existingSub = await prisma.subcategories.findUnique({
        where: {
          category_id_subcategory_name: {
            category_id: finalCatId,
            subcategory_name: trimmedSubcat,
          },
        },
      });
      if (existingSub) {
        finalSubcatId = existingSub.subcategory_id;
        finalSubcatName = existingSub.subcategory_name;
      } else {
        const newSub = await prisma.subcategories.create({
          data: {
            category_id: finalCatId,
            subcategory_name: trimmedSubcat,
            status: "ACTIVE",
          },
        });
        finalSubcatId = newSub.subcategory_id;
        finalSubcatName = newSub.subcategory_name;
      }
    } else if (!subcategory_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "subcategory_id is required. Every routing rule must be scoped to an exact Category and Subcategory combination.",
        },
        { status: 400 },
      );
    } else {
      finalSubcatId = validateBigIntId(subcategory_id);
      if (!finalSubcatId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "subcategory_id must be a valid integer identifier or CUSTOM.",
          },
          { status: 400 },
        );
      }

      const subcategory = await prisma.subcategories.findUnique({
        where: { subcategory_id: finalSubcatId },
      });

      if (subcategory?.status !== "ACTIVE") {
        return NextResponse.json(
          {
            success: false,
            message: "Selected subcategory was not found or is inactive.",
          },
          { status: 400 },
        );
      }

      if (subcategory.category_id !== finalCatId) {
        return NextResponse.json(
          {
            success: false,
            message: `The selected subcategory ("${subcategory.subcategory_name}") does not belong to category "${finalCatName}".`,
          },
          { status: 400 },
        );
      }
      finalSubcatName = subcategory.subcategory_name;
    }

    // 4. Validate department_id
    if (!department_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Primary target department_id is required.",
        },
        { status: 400 },
      );
    }

    const deptId = validateBigIntId(department_id);
    if (!deptId) {
      return NextResponse.json(
        {
          success: false,
          message: "department_id must be a valid integer identifier.",
        },
        { status: 400 },
      );
    }

    const department = await prisma.departments.findUnique({
      where: { department_id: deptId },
    });

    if (department?.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Selected target department was not found or is inactive.",
        },
        { status: 400 },
      );
    }

    // 5. Ensure involvement_type is PRIMARY (Routing rules define the lead owner)
    const invType = "PRIMARY";

    // 6. Validate status
    const ruleStatus = validateStatus(status);
    if (!ruleStatus) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status "${status}".`,
        },
        { status: 400 },
      );
    }

    // 7. Validate rule_order
    const orderNum = validateRuleOrder(rule_order);
    if (orderNum === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "rule_order must be a positive integer between 1 and 100,000.",
        },
        { status: 400 },
      );
    }

    // 8. Validate and normalize supporting departments explicitly
    const supportingValidation =
      await validateAndNormalizeSupportingDepartments(
        supporting_departments,
        deptId,
        department.department_name,
      );
    if (supportingValidation.error) {
      return NextResponse.json(
        { success: false, message: supportingValidation.error },
        { status: 400 },
      );
    }
    const normalizedSupporting = supportingValidation.departments || [];

    // 9. Validate conditions and multi-department dependency policy
    const conditionsValidation = validateConditions(conditions);
    if (conditionsValidation.error) {
      return NextResponse.json(
        { success: false, message: conditionsValidation.error },
        { status: 400 },
      );
    }
    const sanitizedConditions = conditionsValidation.conditions || {};
    const depType =
      (sanitizedConditions.dependency_type as string) || "PARALLEL";
    const rawDeps = sanitizedConditions.dependencies as
      | DepartmentDependencyNode[]
      | undefined;

    // Comprehensive policy validation: exactly 1 primary, no duplicate supporting, valid prerequisites, no cycles, valid execution order
    const policyValidation = validateRoutingPolicy({
      primary_department_name: department.department_name,
      primary_department_id: deptId,
      supporting_departments: normalizedSupporting,
      dependency_type: depType,
      dependencies: rawDeps,
    });

    if (!policyValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: policyValidation.errors[0],
          errors: policyValidation.errors,
        },
        { status: 400 },
      );
    }

    if (policyValidation.normalizedDependencies) {
      sanitizedConditions.dependencies =
        policyValidation.normalizedDependencies;
      const leadNode = policyValidation.normalizedDependencies.find(
        (d) =>
          d.involvement_type === "PRIMARY" || d.involvement_type === "EQUAL",
      );
      if (leadNode) {
        sanitizedConditions.primary_sla_percent =
          leadNode.sla_percent_allocation ?? null;
        sanitizedConditions.primary_duration_minutes =
          leadNode.allocated_duration_minutes ?? null;
      }
    }

    // 10. Prevent conflicting rules (Check for active duplicate within same taxonomy scope)
    if (ruleStatus === "ACTIVE") {
      const conflictingRule = await prisma.routing_rules.findFirst({
        where: {
          category_id: finalCatId,
          subcategory_id: finalSubcatId,
          status: "ACTIVE",
        },
        include: {
          departments: { select: { department_name: true } },
        },
      });

      if (conflictingRule) {
        const scopeDesc = finalSubcatId
          ? `"${finalCatName} → ${finalSubcatName}"`
          : `"${finalCatName} (All Subcategories)"`;

        return NextResponse.json(
          {
            success: false,
            message: `A routing rule already exists for ${scopeDesc}. Existing rule "${conflictingRule.rule_name}" routes this to the ${conflictingRule.departments.department_name} department. Please update or deactivate the existing rule instead of creating a duplicate.`,
          },
          { status: 409 },
        );
      }
    }

    // 10b. Check duplicate configuration across all fields (even if name is different)
    const configConflict = await prisma.routing_rules.findFirst({
      where: {
        category_id: finalCatId,
        subcategory_id: finalSubcatId,
        department_id: deptId,
        involvement_type: invType,
      },
      include: {
        departments: { select: { department_name: true } },
      },
    });

    if (configConflict) {
      const scopeDesc = finalSubcatId
        ? `"${finalCatName} → ${finalSubcatName}"`
        : `"${finalCatName}"`;

      return NextResponse.json(
        {
          success: false,
          message: `A routing rule with identical configuration already exists ("${configConflict.rule_name}"). It already routes ${scopeDesc} to the ${configConflict.departments.department_name} department. Please update the existing rule instead of creating a duplicate.`,
        },
        { status: 409 },
      );
    }

    // 11. Transaction: Create rule and write comprehensive audit log
    const rule = await prisma.$transaction(async (tx) => {
      const created = await tx.routing_rules.create({
        data: {
          rule_name: trimmedName,
          category_id: finalCatId,
          subcategory_id: finalSubcatId,
          department_id: deptId,
          involvement_type: invType,
          supporting_departments: normalizedSupporting,
          rule_order: orderNum,
          status: ruleStatus,
          conditions: sanitizedConditions as unknown as Prisma.InputJsonValue,
          created_by: user.user_id,
        },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "CREATE_ROUTING_RULE",
          entity_type: "ROUTING_RULE",
          entity_id: created.routing_rule_id,
          new_value: {
            routing_rule_id: created.routing_rule_id.toString(),
            rule_name: created.rule_name,
            category_id: finalCatId.toString(),
            category_name: finalCatName,
            subcategory_id: finalSubcatId ? finalSubcatId.toString() : null,
            subcategory_name: finalSubcatName ? finalSubcatName : null,
            department_id: deptId.toString(),
            department_name: department.department_name,
            involvement_type: created.involvement_type,
            supporting_departments: normalizedSupporting,
            rule_order: created.rule_order,
            status: created.status,
            conditions: sanitizedConditions,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    // Invalidate routing rules cache
    serverCache.invalidateTags([CACHE_TAGS.RULES_ROUTING]);

    // Telemetry log
    await logger.logApiCall({
      method: "POST",
      path: "/api/admin/rules/routing",
      statusCode: 201,
      durationMs: Date.now() - startTime,
      user,
      details: {
        routing_rule_id: rule.routing_rule_id.toString(),
        rule_name: rule.rule_name,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Routing rule created successfully.",
        rule: {
          routing_rule_id: rule.routing_rule_id.toString(),
          rule_name: rule.rule_name,
          category_id: finalCatId.toString(),
          category_name: finalCatName,
          subcategory_id: finalSubcatId ? finalSubcatId.toString() : null,
          subcategory_name: finalSubcatName ? finalSubcatName : null,
          department_id: department.department_id.toString(),
          department_name: department.department_name,
          involvement_type: rule.involvement_type,
          supporting_departments: normalizedSupporting,
          rule_order: rule.rule_order,
          status: rule.status,
          conditions: rule.conditions,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create routing rule:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error creating routing rule.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const startTime = Date.now();
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await request.json();
    const {
      routing_rule_id,
      status,
      rule_name,
      rule_order,
      category_id,
      subcategory_id,
      department_id,
      supporting_departments,
      conditions,
      new_category_name,
      new_subcategory_name,
    } = body;

    // 1. Validate routing_rule_id
    if (!routing_rule_id) {
      return NextResponse.json(
        { success: false, message: "routing_rule_id is required." },
        { status: 400 },
      );
    }

    const ruleId = validateBigIntId(routing_rule_id);
    if (!ruleId) {
      return NextResponse.json(
        {
          success: false,
          message: "routing_rule_id must be a valid integer identifier.",
        },
        { status: 400 },
      );
    }

    // 2. Return 404 for nonexistent rule
    const existingRule = await prisma.routing_rules.findUnique({
      where: { routing_rule_id: ruleId },
      include: {
        categories: { select: { category_name: true } },
        subcategories: { select: { subcategory_name: true } },
        departments: { select: { department_name: true } },
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        {
          success: false,
          message: `Routing rule with ID "${routing_rule_id}" was not found.`,
        },
        { status: 404 },
      );
    }

    // 3. Validate status if provided
    let newStatus = existingRule.status;
    if (status !== undefined) {
      const validatedStatus = validateStatus(status);
      if (!validatedStatus) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid status "${status}".`,
          },
          { status: 400 },
        );
      }
      newStatus = validatedStatus;
    }

    // 4. Validate rule_order if provided
    let newOrder = existingRule.rule_order;
    if (rule_order !== undefined) {
      const parsedOrder = validateRuleOrder(rule_order);
      if (parsedOrder === null) {
        return NextResponse.json(
          {
            success: false,
            message:
              "rule_order must be a positive integer between 1 and 100,000.",
          },
          { status: 400 },
        );
      }
      newOrder = parsedOrder;
    }

    // 5. Validate rule_name if provided
    let newName = existingRule.rule_name;
    if (rule_name !== undefined) {
      const validatedNewName = validateRuleName(rule_name);
      if (!validatedNewName) {
        return NextResponse.json(
          { success: false, message: "Rule name cannot be empty." },
          { status: 400 },
        );
      }
      newName = validatedNewName;

      // Check name uniqueness if changed
      if (newName.toLowerCase() !== existingRule.rule_name.toLowerCase()) {
        const nameConflict = await prisma.routing_rules.findFirst({
          where: {
            rule_name: { equals: newName, mode: "insensitive" },
            routing_rule_id: { not: ruleId },
          },
        });
        if (nameConflict) {
          return NextResponse.json(
            {
              success: false,
              message: `A routing rule named "${newName}" already exists. Please choose a unique rule name.`,
            },
            { status: 409 },
          );
        }
      }
    }

    // 6. Validate primary department_id if provided
    let deptId = existingRule.department_id;
    let deptName = existingRule.departments.department_name;
    if (department_id !== undefined && department_id !== null) {
      const parsedDeptId = validateBigIntId(department_id);
      if (!parsedDeptId) {
        return NextResponse.json(
          {
            success: false,
            message: "department_id must be a valid integer identifier.",
          },
          { status: 400 },
        );
      }
      const department = await prisma.departments.findUnique({
        where: { department_id: parsedDeptId },
      });
      if (department?.status !== "ACTIVE") {
        return NextResponse.json(
          {
            success: false,
            message: "Selected target department was not found or is inactive.",
          },
          { status: 400 },
        );
      }
      deptId = parsedDeptId;
      deptName = department.department_name;
    }

    // 7. Validate category and subcategory if provided
    let finalCatId: bigint | null = existingRule.category_id;
    let finalCatName = existingRule.categories?.category_name || "";
    let finalSubcatId: bigint | null = existingRule.subcategory_id;
    let finalSubcatName = existingRule.subcategories?.subcategory_name || "";

    if (category_id !== undefined && category_id !== null) {
      if (category_id === "CUSTOM" && new_category_name) {
        const trimmedCat = new_category_name.trim();
        if (!/[a-zA-Z]/.test(trimmedCat)) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Category name cannot consist of only numbers. It must include letters (or letters and numbers).",
            },
            { status: 400 },
          );
        }
        const existingCat = await prisma.categories.findUnique({
          where: { category_name: trimmedCat },
        });
        if (existingCat) {
          finalCatId = existingCat.category_id;
          finalCatName = existingCat.category_name;
        } else {
          const newCat = await prisma.categories.create({
            data: {
              category_name: trimmedCat,
              status: "ACTIVE",
            },
          });
          finalCatId = newCat.category_id;
          finalCatName = newCat.category_name;
        }
      } else {
        const parsedCatId = validateBigIntId(category_id);
        if (!parsedCatId) {
          return NextResponse.json(
            {
              success: false,
              message:
                "category_id must be a valid integer identifier or CUSTOM.",
            },
            { status: 400 },
          );
        }
        const category = await prisma.categories.findUnique({
          where: { category_id: parsedCatId },
        });
        if (category?.status !== "ACTIVE") {
          return NextResponse.json(
            {
              success: false,
              message: "Selected category was not found or is inactive.",
            },
            { status: 400 },
          );
        }
        finalCatId = parsedCatId;
        finalCatName = category.category_name;
      }
    }

    if (subcategory_id !== undefined && subcategory_id !== null) {
      if (subcategory_id === "CUSTOM" && new_subcategory_name && finalCatId) {
        const trimmedSubcat = new_subcategory_name.trim();
        if (!/[a-zA-Z]/.test(trimmedSubcat)) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Subcategory name cannot consist of only numbers. It must include letters (or letters and numbers).",
            },
            { status: 400 },
          );
        }
        const existingSub = await prisma.subcategories.findUnique({
          where: {
            category_id_subcategory_name: {
              category_id: finalCatId,
              subcategory_name: trimmedSubcat,
            },
          },
        });
        if (existingSub) {
          finalSubcatId = existingSub.subcategory_id;
          finalSubcatName = existingSub.subcategory_name;
        } else {
          const newSub = await prisma.subcategories.create({
            data: {
              category_id: finalCatId,
              subcategory_name: trimmedSubcat,
              status: "ACTIVE",
            },
          });
          finalSubcatId = newSub.subcategory_id;
          finalSubcatName = newSub.subcategory_name;
        }
      } else {
        const parsedSubcatId = validateBigIntId(subcategory_id);
        if (!parsedSubcatId) {
          return NextResponse.json(
            {
              success: false,
              message:
                "subcategory_id must be a valid integer identifier or CUSTOM.",
            },
            { status: 400 },
          );
        }
        const subcategory = await prisma.subcategories.findUnique({
          where: { subcategory_id: parsedSubcatId },
        });
        if (subcategory?.status !== "ACTIVE") {
          return NextResponse.json(
            {
              success: false,
              message: "Selected subcategory was not found or is inactive.",
            },
            { status: 400 },
          );
        }
        if (subcategory.category_id !== finalCatId) {
          return NextResponse.json(
            {
              success: false,
              message: `The selected subcategory ("${subcategory.subcategory_name}") does not belong to category "${finalCatName}".`,
            },
            { status: 400 },
          );
        }
        finalSubcatId = parsedSubcatId;
        finalSubcatName = subcategory.subcategory_name;
      }
    }

    // 8. Validate supporting departments if provided
    let normalizedSupporting = Array.isArray(
      existingRule.supporting_departments,
    )
      ? (existingRule.supporting_departments as string[])
      : [];
    if (supporting_departments !== undefined) {
      const supportingValidation =
        await validateAndNormalizeSupportingDepartments(
          supporting_departments,
          deptId,
          deptName,
        );
      if (supportingValidation.error) {
        return NextResponse.json(
          { success: false, message: supportingValidation.error },
          { status: 400 },
        );
      }
      normalizedSupporting = supportingValidation.departments || [];
    }

    // 9. Validate conditions and dependency graph if conditions or supporting depts changed
    let sanitizedConditions =
      (existingRule.conditions as Record<string, unknown>) || {};
    if (conditions !== undefined) {
      const conditionsValidation = validateConditions(conditions);
      if (conditionsValidation.error) {
        return NextResponse.json(
          { success: false, message: conditionsValidation.error },
          { status: 400 },
        );
      }
      sanitizedConditions = conditionsValidation.conditions || {};
    }

    const depType =
      (sanitizedConditions.dependency_type as string) || "PARALLEL";
    const rawDeps = sanitizedConditions.dependencies as
      | DepartmentDependencyNode[]
      | undefined;

    const policyValidation = validateRoutingPolicy({
      primary_department_name: deptName,
      primary_department_id: deptId,
      supporting_departments: normalizedSupporting,
      dependency_type: depType,
      dependencies: rawDeps,
      primary_sla_percent: sanitizedConditions.primary_sla_percent as
        | number
        | undefined,
    });

    if (!policyValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: policyValidation.errors[0],
          errors: policyValidation.errors,
        },
        { status: 400 },
      );
    }

    if (policyValidation.normalizedDependencies) {
      sanitizedConditions.dependencies =
        policyValidation.normalizedDependencies;
      const leadNode = policyValidation.normalizedDependencies.find(
        (d) =>
          d.involvement_type === "PRIMARY" || d.involvement_type === "EQUAL",
      );
      if (leadNode) {
        sanitizedConditions.primary_sla_percent =
          leadNode.sla_percent_allocation ?? null;
        sanitizedConditions.primary_duration_minutes =
          leadNode.allocated_duration_minutes ?? null;
      }
    }

    // 10. Conflict check when activating or altering taxonomy scope
    if (newStatus === "ACTIVE") {
      const conflictingRule = await prisma.routing_rules.findFirst({
        where: {
          category_id: finalCatId,
          subcategory_id: finalSubcatId,
          status: "ACTIVE",
          routing_rule_id: { not: ruleId },
        },
        include: {
          departments: { select: { department_name: true } },
        },
      });

      if (conflictingRule) {
        const scopeDesc = finalSubcatId
          ? `"${finalCatName} → ${finalSubcatName}"`
          : `"${finalCatName} (All Subcategories)"`;

        return NextResponse.json(
          {
            success: false,
            message: `Cannot update rule: an active rule ("${conflictingRule.rule_name}") already routes ${scopeDesc} to ${conflictingRule.departments.department_name}. Please deactivate the competing rule first.`,
          },
          { status: 409 },
        );
      }
    }

    // 11. Execute update with full audit snapshot
    const updated = await prisma.$transaction(async (tx) => {
      const rule = await tx.routing_rules.update({
        where: { routing_rule_id: ruleId },
        data: {
          status: newStatus,
          rule_name: newName,
          rule_order: newOrder,
          department_id: deptId,
          category_id: finalCatId,
          subcategory_id: finalSubcatId,
          supporting_departments: normalizedSupporting,
          conditions: sanitizedConditions as unknown as Prisma.InputJsonValue,
          updated_at: new Date(),
        },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "UPDATE_ROUTING_RULE",
          entity_type: "ROUTING_RULE",
          entity_id: rule.routing_rule_id,
          old_value: {
            routing_rule_id: existingRule.routing_rule_id.toString(),
            rule_name: existingRule.rule_name,
            category_id: existingRule.category_id?.toString() ?? null,
            category_name: existingRule.categories?.category_name ?? null,
            subcategory_id: existingRule.subcategory_id?.toString() ?? null,
            subcategory_name:
              existingRule.subcategories?.subcategory_name ?? null,
            department_id: existingRule.department_id.toString(),
            department_name: existingRule.departments.department_name,
            involvement_type: existingRule.involvement_type,
            supporting_departments: existingRule.supporting_departments,
            rule_order: existingRule.rule_order,
            status: existingRule.status,
            conditions: existingRule.conditions,
          } as unknown as Prisma.InputJsonValue,
          new_value: {
            routing_rule_id: rule.routing_rule_id.toString(),
            rule_name: rule.rule_name,
            category_id: rule.category_id?.toString() ?? null,
            category_name: finalCatName || null,
            subcategory_id: rule.subcategory_id?.toString() ?? null,
            subcategory_name: finalSubcatName || null,
            department_id: rule.department_id.toString(),
            department_name: deptName,
            involvement_type: rule.involvement_type,
            supporting_departments: rule.supporting_departments,
            rule_order: rule.rule_order,
            status: rule.status,
            conditions: rule.conditions,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return rule;
    });

    // Invalidate cache
    serverCache.invalidateTags([CACHE_TAGS.RULES_ROUTING]);

    await logger.logApiCall({
      method: "PATCH",
      path: "/api/admin/rules/routing",
      statusCode: 200,
      durationMs: Date.now() - startTime,
      user,
      details: {
        routing_rule_id: updated.routing_rule_id.toString(),
        old_status: existingRule.status,
        new_status: updated.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Routing rule updated successfully.`,
      rule: {
        routing_rule_id: updated.routing_rule_id.toString(),
        rule_name: updated.rule_name,
        category_name: finalCatName || null,
        subcategory_name: finalSubcatName || null,
        department_name: deptName,
        involvement_type: updated.involvement_type,
        supporting_departments: normalizedSupporting,
        rule_order: updated.rule_order,
        status: updated.status,
        conditions: updated.conditions,
      },
    });
  } catch (error) {
    console.error("Failed to update routing rule:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error updating routing rule.",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Deactivates routing rule (Soft deletion).
 * Preserves historical routing records, grievance associations, and audit trail integrity.
 */
export async function DELETE(request: Request) {
  const startTime = Date.now();
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Rule ID is required in query parameter (?id=...).",
        },
        { status: 400 },
      );
    }

    const ruleId = validateBigIntId(id);
    if (!ruleId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid rule ID format. Must be an integer.",
        },
        { status: 400 },
      );
    }

    // Return 404 for nonexistent rule
    const existing = await prisma.routing_rules.findUnique({
      where: { routing_rule_id: ruleId },
      include: {
        categories: { select: { category_name: true } },
        subcategories: { select: { subcategory_name: true } },
        departments: { select: { department_name: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Routing rule with ID "${id}" was not found.`,
        },
        { status: 404 },
      );
    }

    // Hard deletion
    await prisma.$transaction(async (tx) => {
      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "DELETE_ROUTING_RULE",
          entity_type: "ROUTING_RULE",
          entity_id: ruleId,
          old_value: {
            routing_rule_id: existing.routing_rule_id.toString(),
            rule_name: existing.rule_name,
            category_id: existing.category_id?.toString() ?? null,
            category_name: existing.categories?.category_name ?? null,
            subcategory_id: existing.subcategory_id?.toString() ?? null,
            subcategory_name: existing.subcategories?.subcategory_name ?? null,
            department_id: existing.department_id.toString(),
            department_name: existing.departments.department_name,
            involvement_type: existing.involvement_type,
            supporting_departments: existing.supporting_departments,
            rule_order: existing.rule_order,
            status: existing.status,
            conditions: existing.conditions,
          } as unknown as Prisma.InputJsonValue,
          new_value: {
            status: "DELETED",
            deleted_at: new Date().toISOString(),
            deleted_by: user.email,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.routing_rules.delete({
        where: { routing_rule_id: ruleId },
      });
    });

    // Invalidate routing cache
    serverCache.invalidateTags([CACHE_TAGS.RULES_ROUTING]);

    await logger.logApiCall({
      method: "DELETE",
      path: `/api/admin/rules/routing?id=${id}`,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      user,
      details: {
        routing_rule_id: id,
        rule_name: existing.rule_name,
        action: "DEACTIVATED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Routing rule "${existing.rule_name}" deactivated successfully.`,
    });
  } catch (error) {
    console.error("Failed to deactivate routing rule:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error deactivating routing rule.";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}
