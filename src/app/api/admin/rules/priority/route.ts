import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { CACHE_TAGS, serverCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const ALLOWED_PRIORITY_LEVELS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE"] as const;

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
      conditions,
      priority_level,
      rule_order,
      is_default,
      status,
    } = body;

    // 1. Validate rule_name
    if (!rule_name || typeof rule_name !== "string" || !rule_name.trim()) {
      return NextResponse.json(
        { success: false, message: "Rule name is required." },
        { status: 400 },
      );
    }

    // 2. Validate priority_level
    const prioLevel = (priority_level || "").toString().toUpperCase().trim();
    if (
      !ALLOWED_PRIORITY_LEVELS.includes(
        prioLevel as (typeof ALLOWED_PRIORITY_LEVELS)[number],
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid priority level "${priority_level}". Allowed levels are: ${ALLOWED_PRIORITY_LEVELS.join(", ")}.`,
        },
        { status: 400 },
      );
    }

    // 3. Validate status
    const ruleStatus = (status || "ACTIVE").toString().toUpperCase().trim();
    if (
      !ALLOWED_STATUSES.includes(
        ruleStatus as (typeof ALLOWED_STATUSES)[number],
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

    // 4. Validate rule_order
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

    // 5. Validate conditions
    const conditionsValidation = validateConditions(conditions);
    if (conditionsValidation.error) {
      return NextResponse.json(
        { success: false, message: conditionsValidation.error },
        { status: 400 },
      );
    }
    const sanitizedConditions = conditionsValidation.conditions || {};
    const isDef = Boolean(is_default);

    // 6. Taxonomy Validation
    let categoryRecord: { category_id: bigint; category_name: string } | null =
      null;
    let subcategoryRecord: {
      subcategory_id: bigint;
      subcategory_name: string;
      category_id: bigint;
    } | null = null;

    const rawCatId = body.category_id || sanitizedConditions.category_id;
    const rawSubcatId =
      body.subcategory_id || sanitizedConditions.subcategory_id;

    if (isDef) {
      sanitizedConditions.default = true;
    } else {
      // Non-default priority rules must define a Category scope or trigger keywords
      if (
        !rawCatId &&
        !sanitizedConditions.category &&
        !sanitizedConditions.contains &&
        !sanitizedConditions.keywords
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Category is required. Every priority rule must be scoped to a Category (or set as Default Fallback).",
          },
          { status: 400 },
        );
      }

      if (rawCatId) {
        let parsedCatId: bigint;
        try {
          parsedCatId = BigInt(rawCatId);
        } catch {
          return NextResponse.json(
            {
              success: false,
              message: "category_id must be a valid integer identifier.",
            },
            { status: 400 },
          );
        }

        const foundCategory = await prisma.categories.findUnique({
          where: { category_id: parsedCatId },
        });

        if (foundCategory?.status !== "ACTIVE") {
          return NextResponse.json(
            {
              success: false,
              message: "Selected category was not found or is inactive.",
            },
            { status: 400 },
          );
        }
        categoryRecord = foundCategory;
        sanitizedConditions.category_id = foundCategory.category_id.toString();
        sanitizedConditions.category = foundCategory.category_name;
      }

      if (rawSubcatId) {
        let parsedSubcatId: bigint;
        try {
          parsedSubcatId = BigInt(rawSubcatId);
        } catch {
          return NextResponse.json(
            {
              success: false,
              message: "subcategory_id must be a valid integer identifier.",
            },
            { status: 400 },
          );
        }

        const foundSubcat = await prisma.subcategories.findUnique({
          where: { subcategory_id: parsedSubcatId },
        });

        if (foundSubcat?.status !== "ACTIVE") {
          return NextResponse.json(
            {
              success: false,
              message: "Selected subcategory was not found or is inactive.",
            },
            { status: 400 },
          );
        }

        if (
          categoryRecord &&
          foundSubcat.category_id !== categoryRecord.category_id
        ) {
          return NextResponse.json(
            {
              success: false,
              message: `The selected subcategory ("${foundSubcat.subcategory_name}") does not belong to category "${categoryRecord.category_name}".`,
            },
            { status: 400 },
          );
        }
        subcategoryRecord = foundSubcat;
        sanitizedConditions.subcategory_id =
          foundSubcat.subcategory_id.toString();
        sanitizedConditions.subcategory = foundSubcat.subcategory_name;
      }
    }

    // 7. Duplicate / Conflict Prevention
    if (ruleStatus === "ACTIVE") {
      const activeRules = await prisma.priority_rules.findMany({
        where: { status: "ACTIVE" },
      });

      // A. Check duplicate rule name
      const nameConflict = activeRules.find(
        (r) =>
          r.rule_name.trim().toLowerCase() === rule_name.trim().toLowerCase(),
      );
      if (nameConflict) {
        return NextResponse.json(
          {
            success: false,
            message: `A priority rule named "${rule_name.trim()}" already exists. Please choose a unique rule name.`,
          },
          { status: 409 },
        );
      }

      // B. Check duplicate default rule
      if (isDef) {
        const defaultConflict = activeRules.find((r) => r.is_default);
        if (defaultConflict) {
          return NextResponse.json(
            {
              success: false,
              message: `A default fallback priority rule already exists ("${defaultConflict.rule_name}"). Please update or deactivate the existing default rule instead of creating a duplicate.`,
            },
            { status: 409 },
          );
        }
      } else {
        // C. Check duplicate taxonomy scope (Category + Subcategory, or Category-wide)
        const targetCatId = categoryRecord
          ? categoryRecord.category_id.toString()
          : sanitizedConditions.category_id?.toString() || null;
        const targetCatName = categoryRecord
          ? categoryRecord.category_name.toLowerCase().trim()
          : (sanitizedConditions.category as string)?.toLowerCase().trim() ||
            null;
        const targetSubcatId = subcategoryRecord
          ? subcategoryRecord.subcategory_id.toString()
          : sanitizedConditions.subcategory_id?.toString() || null;
        const targetSubcatName = subcategoryRecord
          ? subcategoryRecord.subcategory_name.toLowerCase().trim()
          : (
              (sanitizedConditions.subcategory as string) ||
              (sanitizedConditions.subcategory_name as string)
            )
              ?.toLowerCase()
              .trim() || null;

        if (
          targetCatId ||
          targetCatName ||
          targetSubcatId ||
          targetSubcatName
        ) {
          const taxonomyConflict = activeRules.find((r) => {
            if (r.is_default) return false;
            const cond = r.conditions as Record<string, unknown> | null;
            if (!cond) return false;

            const rCatId = cond.category_id?.toString() || null;
            const rCatName =
              (cond.category as string)?.trim().toLowerCase() || null;
            const rSubcatId = cond.subcategory_id?.toString() || null;
            const rSubcatName =
              (
                (cond.subcategory as string) ||
                (cond.subcategory_name as string)
              )
                ?.trim()
                .toLowerCase() || null;

            // 1. Both target a specific subcategory
            if (
              (targetSubcatId || targetSubcatName) &&
              (rSubcatId || rSubcatName)
            ) {
              const subMatch =
                (targetSubcatId && rSubcatId && targetSubcatId === rSubcatId) ||
                (targetSubcatName &&
                  rSubcatName &&
                  targetSubcatName === rSubcatName);
              if (subMatch) return true;
            }

            // 2. Both target Category-wide (all subcategories in that category)
            if (
              (targetCatId || targetCatName) &&
              (rCatId || rCatName) &&
              !targetSubcatId &&
              !targetSubcatName &&
              !rSubcatId &&
              !rSubcatName
            ) {
              const catMatch =
                (targetCatId && rCatId && targetCatId === rCatId) ||
                (targetCatName && rCatName && targetCatName === rCatName);
              if (catMatch) return true;
            }

            return false;
          });

          if (taxonomyConflict) {
            const displayCat =
              categoryRecord?.category_name ||
              (sanitizedConditions.category as string) ||
              "Category";
            const displaySubcat =
              subcategoryRecord?.subcategory_name ||
              (sanitizedConditions.subcategory as string) ||
              (sanitizedConditions.subcategory_name as string) ||
              null;

            const scopeDesc = displaySubcat
              ? `"${displayCat} → ${displaySubcat}"`
              : `"${displayCat} (All Subcategories)"`;

            return NextResponse.json(
              {
                success: false,
                message: `A priority rule already exists for ${scopeDesc}. Existing rule "${taxonomyConflict.rule_name}" assigns priority level ${taxonomyConflict.priority_level}. Please update or deactivate the existing rule instead of creating a duplicate.`,
              },
              { status: 409 },
            );
          }
        }
      }
    }

    // 7. Transaction: Create rule and store complete audit snapshot
    const created = await prisma.$transaction(async (tx) => {
      const rule = await tx.priority_rules.create({
        data: {
          rule_name: rule_name.trim(),
          conditions: sanitizedConditions as unknown as Prisma.InputJsonValue,
          priority_level: prioLevel,
          rule_order: orderNum,
          is_default: isDef,
          status: ruleStatus,
          created_by: user.user_id,
        },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "CREATE_PRIORITY_RULE",
          entity_type: "PRIORITY_RULE",
          entity_id: rule.priority_rule_id,
          new_value: {
            priority_rule_id: rule.priority_rule_id.toString(),
            rule_name: rule.rule_name,
            priority_level: rule.priority_level,
            rule_order: rule.rule_order,
            is_default: rule.is_default,
            status: rule.status,
            conditions: sanitizedConditions,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return rule;
    });

    // Invalidate priority rules cache
    serverCache.invalidateTags([CACHE_TAGS.RULES_PRIORITY]);

    await logger.logApiCall({
      method: "POST",
      path: "/api/admin/rules/priority",
      statusCode: 201,
      durationMs: Date.now() - startTime,
      user,
      details: {
        priority_rule_id: created.priority_rule_id.toString(),
        rule_name: created.rule_name,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Priority rule created successfully.",
        rule: {
          priority_rule_id: created.priority_rule_id.toString(),
          rule_name: created.rule_name,
          priority_level: created.priority_level,
          rule_order: created.rule_order,
          is_default: created.is_default,
          status: created.status,
          conditions: created.conditions,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create priority rule:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error creating priority rule.",
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
    const { priority_rule_id, status, rule_name, rule_order, priority_level } =
      body;

    // 1. Validate priority_rule_id
    if (!priority_rule_id) {
      return NextResponse.json(
        { success: false, message: "priority_rule_id is required." },
        { status: 400 },
      );
    }

    let ruleId: bigint;
    try {
      ruleId = BigInt(priority_rule_id);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "priority_rule_id must be a valid integer identifier.",
        },
        { status: 400 },
      );
    }

    // 2. Return 404 for nonexistent rule
    const existingRule = await prisma.priority_rules.findUnique({
      where: { priority_rule_id: ruleId },
    });

    if (!existingRule) {
      return NextResponse.json(
        {
          success: false,
          message: `Priority rule with ID "${priority_rule_id}" was not found.`,
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

    // 5. Validate priority_level if provided
    let newPrioLevel = existingRule.priority_level;
    if (priority_level !== undefined) {
      const parsedPrio = priority_level.toString().toUpperCase().trim();
      if (
        !ALLOWED_PRIORITY_LEVELS.includes(
          parsedPrio as (typeof ALLOWED_PRIORITY_LEVELS)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid priority level "${priority_level}".`,
          },
          { status: 400 },
        );
      }
      newPrioLevel = parsedPrio;
    }

    const newName =
      rule_name !== undefined &&
      typeof rule_name === "string" &&
      rule_name.trim()
        ? rule_name.trim()
        : existingRule.rule_name;

    // 6. Conflict check when activating an inactive rule or changing rule name
    if (
      (newStatus === "ACTIVE" && existingRule.status !== "ACTIVE") ||
      (newStatus === "ACTIVE" && newName !== existingRule.rule_name)
    ) {
      const activeRules = await prisma.priority_rules.findMany({
        where: { status: "ACTIVE", priority_rule_id: { not: ruleId } },
      });

      // Name conflict check
      const nameConflict = activeRules.find(
        (r) => r.rule_name.trim().toLowerCase() === newName.toLowerCase(),
      );
      if (nameConflict) {
        return NextResponse.json(
          {
            success: false,
            message: `A priority rule named "${nameConflict.rule_name}" already exists. Please choose a unique rule name.`,
          },
          { status: 409 },
        );
      }

      if (newStatus === "ACTIVE" && existingRule.status !== "ACTIVE") {
        if (existingRule.is_default) {
          const defaultConflict = activeRules.find((r) => r.is_default);
          if (defaultConflict) {
            return NextResponse.json(
              {
                success: false,
                message: `Cannot activate rule: an active default fallback priority rule ("${defaultConflict.rule_name}") already exists. Deactivate the competing rule first.`,
              },
              { status: 409 },
            );
          }
        } else {
          const cond = existingRule.conditions as Record<
            string,
            unknown
          > | null;
          if (cond) {
            const targetCatId = cond.category_id?.toString() || null;
            const targetCatName =
              (cond.category as string)?.trim().toLowerCase() || null;
            const targetSubcatId = cond.subcategory_id?.toString() || null;
            const targetSubcatName =
              (
                (cond.subcategory as string) ||
                (cond.subcategory_name as string)
              )
                ?.trim()
                .toLowerCase() || null;

            if (
              targetCatId ||
              targetCatName ||
              targetSubcatId ||
              targetSubcatName
            ) {
              const conflict = activeRules.find((r) => {
                if (r.is_default) return false;
                const rCond = r.conditions as Record<string, unknown> | null;
                if (!rCond) return false;
                const rCatId = rCond.category_id?.toString() || null;
                const rCatName =
                  (rCond.category as string)?.trim().toLowerCase() || null;
                const rSubcatId = rCond.subcategory_id?.toString() || null;
                const rSubcatName =
                  (
                    (rCond.subcategory as string) ||
                    (rCond.subcategory_name as string)
                  )
                    ?.trim()
                    .toLowerCase() || null;

                // 1. Both target a specific subcategory
                if (
                  (targetSubcatId || targetSubcatName) &&
                  (rSubcatId || rSubcatName)
                ) {
                  return (
                    (targetSubcatId &&
                      rSubcatId &&
                      targetSubcatId === rSubcatId) ||
                    (targetSubcatName &&
                      rSubcatName &&
                      targetSubcatName === rSubcatName)
                  );
                }

                // 2. Both target Category-wide
                if (
                  (targetCatId || targetCatName) &&
                  (rCatId || rCatName) &&
                  !targetSubcatId &&
                  !targetSubcatName &&
                  !rSubcatId &&
                  !rSubcatName
                ) {
                  return (
                    (targetCatId && rCatId && targetCatId === rCatId) ||
                    (targetCatName && rCatName && targetCatName === rCatName)
                  );
                }

                return false;
              });

              if (conflict) {
                const displayCat = (cond.category as string) || "Category";
                const displaySubcat =
                  (cond.subcategory as string) ||
                  (cond.subcategory_name as string) ||
                  null;
                const scopeDesc = displaySubcat
                  ? `"${displayCat} → ${displaySubcat}"`
                  : `"${displayCat} (All Subcategories)"`;

                return NextResponse.json(
                  {
                    success: false,
                    message: `Cannot activate rule: an active rule ("${conflict.rule_name}") already exists for ${scopeDesc}. Deactivate the competing rule first.`,
                  },
                  { status: 409 },
                );
              }
            }
          }
        }
      }
    }

    // 7. Update rule with complete audit snapshot
    const updated = await prisma.$transaction(async (tx) => {
      const rule = await tx.priority_rules.update({
        where: { priority_rule_id: ruleId },
        data: {
          status: newStatus,
          rule_name: newName,
          rule_order: newOrder,
          priority_level: newPrioLevel,
          updated_at: new Date(),
        },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "UPDATE_PRIORITY_RULE",
          entity_type: "PRIORITY_RULE",
          entity_id: rule.priority_rule_id,
          old_value: {
            priority_rule_id: existingRule.priority_rule_id.toString(),
            rule_name: existingRule.rule_name,
            priority_level: existingRule.priority_level,
            rule_order: existingRule.rule_order,
            is_default: existingRule.is_default,
            status: existingRule.status,
            conditions: existingRule.conditions,
          } as unknown as Prisma.InputJsonValue,
          new_value: {
            priority_rule_id: rule.priority_rule_id.toString(),
            rule_name: rule.rule_name,
            priority_level: rule.priority_level,
            rule_order: rule.rule_order,
            is_default: rule.is_default,
            status: rule.status,
            conditions: rule.conditions,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return rule;
    });

    // Invalidate cache
    serverCache.invalidateTags([CACHE_TAGS.RULES_PRIORITY]);

    await logger.logApiCall({
      method: "PATCH",
      path: "/api/admin/rules/priority",
      statusCode: 200,
      durationMs: Date.now() - startTime,
      user,
      details: {
        priority_rule_id: updated.priority_rule_id.toString(),
        old_status: existingRule.status,
        new_status: updated.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Priority rule status updated to ${updated.status}.`,
      rule: {
        priority_rule_id: updated.priority_rule_id.toString(),
        rule_name: updated.rule_name,
        status: updated.status,
        rule_order: updated.rule_order,
        priority_level: updated.priority_level,
      },
    });
  } catch (error) {
    console.error("Failed to update priority rule:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error updating priority rule.",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE: Deactivates priority rule (Soft deletion).
 * Preserves historical priority audit logs and grievance associations.
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
    const existing = await prisma.priority_rules.findUnique({
      where: { priority_rule_id: ruleId },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Priority rule with ID "${id}" was not found.`,
        },
        { status: 404 },
      );
    }

    // Soft deactivation to preserve historical audit records
    await prisma.$transaction(async (tx) => {
      await tx.priority_rules.update({
        where: { priority_rule_id: ruleId },
        data: {
          status: "INACTIVE",
          updated_at: new Date(),
        },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "DEACTIVATE_PRIORITY_RULE",
          entity_type: "PRIORITY_RULE",
          entity_id: ruleId,
          old_value: {
            priority_rule_id: existing.priority_rule_id.toString(),
            rule_name: existing.rule_name,
            priority_level: existing.priority_level,
            rule_order: existing.rule_order,
            is_default: existing.is_default,
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

    // Invalidate priority cache
    serverCache.invalidateTags([CACHE_TAGS.RULES_PRIORITY]);

    await logger.logApiCall({
      method: "DELETE",
      path: `/api/admin/rules/priority?id=${id}`,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      user,
      details: {
        priority_rule_id: id,
        rule_name: existing.rule_name,
        action: "DEACTIVATED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Priority rule "${existing.rule_name}" deactivated successfully.`,
    });
  } catch (error) {
    console.error("Failed to deactivate priority rule:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error deactivating priority rule.",
      },
      { status: 500 },
    );
  }
}
