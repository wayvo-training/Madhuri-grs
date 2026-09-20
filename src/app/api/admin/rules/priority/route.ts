import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await request.json();
    const { rule_name, conditions, priority_level, rule_order, is_default } =
      body;

    if (!rule_name || !priority_level) {
      return NextResponse.json(
        {
          success: false,
          message: "Rule name and priority level are required.",
        },
        { status: 400 },
      );
    }

    const validLevels = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    if (!validLevels.includes(priority_level)) {
      return NextResponse.json(
        { success: false, message: "Invalid priority level." },
        { status: 400 },
      );
    }

    const orderNum = Number(rule_order) || 10;
    const isDef = Boolean(is_default);

    const created = await prisma.$transaction(async (tx) => {
      // If setting default, unset existing active default
      if (isDef) {
        await tx.priority_rules.updateMany({
          where: { is_default: true, status: "ACTIVE" },
          data: { is_default: false },
        });
      }

      const statusVal = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

      const rule = await tx.priority_rules.create({
        data: {
          rule_name: rule_name.trim(),
          conditions: conditions || {},
          priority_level,
          rule_order: orderNum,
          is_default: isDef,
          status: statusVal,
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
            rule_name: rule.rule_name,
            priority_level: rule.priority_level,
            rule_order: rule.rule_order,
            is_default: rule.is_default,
          },
        },
      });

      return rule;
    });

    return NextResponse.json({
      success: true,
      message: "Priority rule created successfully.",
      rule: {
        priority_rule_id: created.priority_rule_id.toString(),
        rule_name: created.rule_name,
        priority_level: created.priority_level,
        rule_order: created.rule_order,
        is_default: created.is_default,
        status: created.status,
      },
    });
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
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await request.json();
    const { priority_rule_id, status } = body;

    if (!priority_rule_id || !status) {
      return NextResponse.json(
        { success: false, message: "Rule ID and new status are required." },
        { status: 400 },
      );
    }

    const ruleId = BigInt(priority_rule_id);
    const updated = await prisma.$transaction(async (tx) => {
      const rule = await tx.priority_rules.update({
        where: { priority_rule_id: ruleId },
        data: { status },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "UPDATE_PRIORITY_RULE_STATUS",
          entity_type: "PRIORITY_RULE",
          entity_id: rule.priority_rule_id,
          new_value: { status: rule.status },
        },
      });

      return rule;
    });

    return NextResponse.json({
      success: true,
      message: `Priority rule is now ${updated.status}.`,
      rule: {
        priority_rule_id: updated.priority_rule_id.toString(),
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Failed to update priority rule:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error updating rule." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Rule ID is required." },
        { status: 400 },
      );
    }

    const ruleId = BigInt(id);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.priority_rules.findUnique({
        where: { priority_rule_id: ruleId },
      });

      if (!existing) {
        throw new Error("Rule not found");
      }

      await tx.priority_rules.delete({
        where: { priority_rule_id: ruleId },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "DELETE_PRIORITY_RULE",
          entity_type: "PRIORITY_RULE",
          entity_id: ruleId,
          old_value: { rule_name: existing.rule_name },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Priority rule deleted successfully.",
    });
  } catch (error: any) {
    console.error("Failed to delete priority rule:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error deleting rule.",
      },
      { status: 500 },
    );
  }
}
