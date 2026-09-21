import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { CACHE_TAGS, serverCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const ALLOWED_INVOLVEMENT_TYPES = ["PRIMARY", "SUPPORTING"] as const;
const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE"] as const;

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

/**
 * Validates and sanitizes rule conditions object.
 */
function validateConditions(rawConditions: unknown): {
  error?: string;
  conditions?: Record<string, unknown>;
} {
  if (
    rawConditions === undefined ||
    rawConditions === null ||
    rawConditions === ""
  ) {
    return { conditions: {} };
  }

  if (typeof rawConditions !== "object" || Array.isArray(rawConditions)) {
    return { error: "conditions must be a valid JSON object." };
  }

  const serialized = JSON.stringify(rawConditions);
  if (serialized.length > 5000) {
    return { error: "conditions payload exceeds maximum allowed size (5KB)." };
  }

  const obj = rawConditions as Record<string, unknown>;
  const forbidden = ["__proto__", "constructor", "prototype"];
  for (const key of Object.keys(obj)) {
    if (forbidden.includes(key)) {
      return {
        error: `Invalid property key "${key}" detected in conditions object.`,
      };
    }
  }

  return { conditions: obj };
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
      involvement_type,
      supporting_departments,
      rule_order,
      conditions,
      status,
    } = body;

    // 1. Validate rule_name
    if (!rule_name || typeof rule_name !== "string" || !rule_name.trim()) {
      return NextResponse.json(
        { success: false, message: "Rule name is required." },
        { status: 400 },
      );
    }

    const trimmedName = rule_name.trim();

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

    // 2. Validate category_id (Category cannot be null!)
    if (!category_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "category_id is required. Every routing rule must be scoped to a valid Category.",
        },
        { status: 400 },
      );
    }

    let catId: bigint;
    try {
      catId = BigInt(category_id);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "category_id must be a valid integer identifier.",
        },
        { status: 400 },
      );
    }

    const category = await prisma.categories.findUnique({
      where: { category_id: catId },
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

    // 3. Validate subcategory_id (Mandatory: Every routing rule must be scoped to an exact Subcategory)
    if (!subcategory_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "subcategory_id is required. Every routing rule must be scoped to an exact Category and Subcategory combination.",
        },
        { status: 400 },
      );
    }

    let subcatId: bigint;
    try {
      subcatId = BigInt(subcategory_id);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "subcategory_id must be a valid integer identifier.",
        },
        { status: 400 },
      );
    }

    const subcategory = await prisma.subcategories.findUnique({
      where: { subcategory_id: subcatId },
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

    if (subcategory.category_id !== catId) {
      return NextResponse.json(
        {
          success: false,
          message: `The selected subcategory ("${subcategory.subcategory_name}") does not belong to category "${category.category_name}".`,
        },
        { status: 400 },
      );
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

    let deptId: bigint;
    try {
      deptId = BigInt(department_id);
    } catch {
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

    // 5. Validate involvement_type
    const invType = (involvement_type || "PRIMARY")
      .toString()
      .toUpperCase()
      .trim();
    if (
      !ALLOWED_INVOLVEMENT_TYPES.includes(
        invType as (typeof ALLOWED_INVOLVEMENT_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid involvement_type "${invType}". Allowed values are: ${ALLOWED_INVOLVEMENT_TYPES.join(", ")}.`,
        },
        { status: 400 },
      );
    }

    // 6. Validate status
    const ruleStatus = (status || "ACTIVE").toString().toUpperCase().trim();
    if (
      !ALLOWED_STATUSES.includes(
        ruleStatus as (typeof ALLOWED_STATUSES)[number],
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status "${ruleStatus}". Allowed values are: ${ALLOWED_STATUSES.join(", ")}.`,
        },
        { status: 400 },
      );
    }

    // 7. Validate rule_order
    const orderNum = Number(rule_order ?? 10);
    if (!Number.isInteger(orderNum) || orderNum < 1 || orderNum > 100000) {
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

    // 9. Validate conditions
    const conditionsValidation = validateConditions(conditions);
    if (conditionsValidation.error) {
      return NextResponse.json(
        { success: false, message: conditionsValidation.error },
        { status: 400 },
      );
    }
    const sanitizedConditions = conditionsValidation.conditions || {};

    // 10. Prevent conflicting rules (Check for active duplicate within same taxonomy scope)
    if (ruleStatus === "ACTIVE") {
      const conflictingRule = await prisma.routing_rules.findFirst({
        where: {
          category_id: catId,
          subcategory_id: subcatId,
          status: "ACTIVE",
        },
        include: {
          departments: { select: { department_name: true } },
        },
      });

      if (conflictingRule) {
        const scopeDesc = subcategory
          ? `"${category.category_name} → ${subcategory.subcategory_name}"`
          : `"${category.category_name} (All Subcategories)"`;

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
        category_id: catId,
        subcategory_id: subcatId,
        department_id: deptId,
        involvement_type: invType,
      },
      include: {
        departments: { select: { department_name: true } },
      },
    });

    if (configConflict) {
      const scopeDesc = subcategory
        ? `"${category.category_name} → ${subcategory.subcategory_name}"`
        : `"${category.category_name}"`;

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
          rule_name: rule_name.trim(),
          category_id: catId,
          subcategory_id: subcatId,
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
            category_id: catId.toString(),
            category_name: category.category_name,
            subcategory_id: subcatId ? subcatId.toString() : null,
            subcategory_name: subcategory ? subcategory.subcategory_name : null,
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
          category_id: category.category_id.toString(),
          category_name: category.category_name,
          subcategory_id: subcategory
            ? subcategory.subcategory_id.toString()
            : null,
          subcategory_name: subcategory ? subcategory.subcategory_name : null,
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
    const { routing_rule_id, status, rule_name, rule_order } = body;

    // 1. Validate routing_rule_id
    if (!routing_rule_id) {
      return NextResponse.json(
        { success: false, message: "routing_rule_id is required." },
        { status: 400 },
      );
    }

    let ruleId: bigint;
    try {
      ruleId = BigInt(routing_rule_id);
    } catch {
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
      const validatedStatus = status.toString().toUpperCase().trim();
      if (
        !ALLOWED_STATUSES.includes(
          validatedStatus as (typeof ALLOWED_STATUSES)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid status "${status}". Allowed values are: ${ALLOWED_STATUSES.join(", ")}.`,
          },
          { status: 400 },
        );
      }
      newStatus = validatedStatus;
    }

    // 4. Validate rule_order if provided
    let newOrder = existingRule.rule_order;
    if (rule_order !== undefined) {
      const parsedOrder = Number(rule_order);
      if (
        !Number.isInteger(parsedOrder) ||
        parsedOrder < 1 ||
        parsedOrder > 100000
      ) {
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

    // 5. Conflict prevention when activating a rule
    if (newStatus === "ACTIVE" && existingRule.status !== "ACTIVE") {
      const conflictingRule = await prisma.routing_rules.findFirst({
        where: {
          category_id: existingRule.category_id,
          subcategory_id: existingRule.subcategory_id,
          status: "ACTIVE",
          routing_rule_id: { not: ruleId },
        },
        include: {
          departments: { select: { department_name: true } },
        },
      });

      if (conflictingRule) {
        const catName = existingRule.categories?.category_name || "Unknown";
        const subcatName = existingRule.subcategories?.subcategory_name;
        const scopeDesc = subcatName
          ? `"${catName} → ${subcatName}"`
          : `"${catName} (All Subcategories)"`;

        return NextResponse.json(
          {
            success: false,
            message: `Cannot activate rule: an active rule ("${conflictingRule.rule_name}") already routes ${scopeDesc} to ${conflictingRule.departments.department_name}. Please deactivate the competing rule first.`,
          },
          { status: 409 },
        );
      }
    }

    const newName =
      rule_name !== undefined &&
      typeof rule_name === "string" &&
      rule_name.trim()
        ? rule_name.trim()
        : existingRule.rule_name;

    // 6. Execute update with full audit snapshot
    const updated = await prisma.$transaction(async (tx) => {
      const rule = await tx.routing_rules.update({
        where: { routing_rule_id: ruleId },
        data: {
          status: newStatus,
          rule_name: newName,
          rule_order: newOrder,
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
            category_name: existingRule.categories?.category_name ?? null,
            subcategory_id: rule.subcategory_id?.toString() ?? null,
            subcategory_name:
              existingRule.subcategories?.subcategory_name ?? null,
            department_id: rule.department_id.toString(),
            department_name: existingRule.departments.department_name,
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
      message: `Routing rule status updated to ${updated.status}.`,
      rule: {
        routing_rule_id: updated.routing_rule_id.toString(),
        rule_name: updated.rule_name,
        status: updated.status,
        rule_order: updated.rule_order,
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

    let ruleId: bigint;
    try {
      ruleId = BigInt(id);
    } catch {
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

    // Soft deactivation to preserve historical audit records
    await prisma.$transaction(async (tx) => {
      await tx.routing_rules.update({
        where: { routing_rule_id: ruleId },
        data: {
          status: "INACTIVE",
          updated_at: new Date(),
        },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "DEACTIVATE_ROUTING_RULE",
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
            status: "INACTIVE",
            deactivated_at: new Date().toISOString(),
            deactivated_by: user.email,
          } as unknown as Prisma.InputJsonValue,
        },
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
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error deactivating routing rule.",
      },
      { status: 500 },
    );
  }
}
