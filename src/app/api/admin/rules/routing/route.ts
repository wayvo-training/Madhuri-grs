import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
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
      rule_order,
      conditions,
    } = body;

    if (!rule_name || !department_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Rule name and target department are required.",
        },
        { status: 400 },
      );
    }

    const orderNum = Number(rule_order) || 10;
    const deptId = BigInt(department_id);
    const catId = category_id ? BigInt(category_id) : null;
    const subcatId = subcategory_id ? BigInt(subcategory_id) : null;
    const invType = involvement_type || "PRIMARY";

    const statusVal = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

    const rule = await prisma.$transaction(async (tx) => {
      const created = await tx.routing_rules.create({
        data: {
          rule_name: rule_name.trim(),
          category_id: catId,
          subcategory_id: subcatId,
          department_id: deptId,
          involvement_type: invType,
          rule_order: orderNum,
          status: statusVal,
          conditions: conditions || {},
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
            rule_name: created.rule_name,
            department_id: department_id.toString(),
            category_id: category_id ? category_id.toString() : null,
            rule_order: created.rule_order,
          },
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      message: "Routing rule created successfully.",
      rule: {
        routing_rule_id: rule.routing_rule_id.toString(),
        rule_name: rule.rule_name,
        department_id: rule.department_id.toString(),
        rule_order: rule.rule_order,
        status: rule.status,
      },
    });
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
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await request.json();
    const { routing_rule_id, status } = body;

    if (!routing_rule_id || !status) {
      return NextResponse.json(
        { success: false, message: "Rule ID and status are required." },
        { status: 400 },
      );
    }

    const ruleId = BigInt(routing_rule_id);
    const updated = await prisma.$transaction(async (tx) => {
      const rule = await tx.routing_rules.update({
        where: { routing_rule_id: ruleId },
        data: { status },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "UPDATE_ROUTING_RULE_STATUS",
          entity_type: "ROUTING_RULE",
          entity_id: rule.routing_rule_id,
          new_value: { status: rule.status },
        },
      });

      return rule;
    });

    return NextResponse.json({
      success: true,
      message: `Routing rule status updated to ${updated.status}.`,
      rule: {
        routing_rule_id: updated.routing_rule_id.toString(),
        status: updated.status,
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
      const existing = await tx.routing_rules.findUnique({
        where: { routing_rule_id: ruleId },
      });

      if (!existing) {
        throw new Error("Routing rule not found");
      }

      await tx.routing_rules.delete({
        where: { routing_rule_id: ruleId },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "DELETE_ROUTING_RULE",
          entity_type: "ROUTING_RULE",
          entity_id: ruleId,
          old_value: { rule_name: existing.rule_name },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Routing rule deleted successfully.",
    });
  } catch (error: any) {
    console.error("Failed to delete routing rule:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Internal server error deleting routing rule.",
      },
      { status: 500 },
    );
  }
}
