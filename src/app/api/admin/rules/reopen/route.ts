import { Prisma } from "@prisma/client";
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
      policy_name,
      reopen_window_hours,
      max_reopen_count,
      max_manual_review_count,
    } = body;

    if (!policy_name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Policy name is required." },
        { status: 400 },
      );
    }

    const trimmedName = policy_name.trim();
    const requestedStatus = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

    // 1. Check duplicate policy name (case-insensitive)
    const nameConflict = await prisma.reopen_policies.findFirst({
      where: {
        policy_name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (nameConflict) {
      return NextResponse.json(
        {
          success: false,
          message: `A reopen policy named "${trimmedName}" already exists. Please choose a unique policy name.`,
        },
        { status: 409 },
      );
    }

    const windowHours = reopen_window_hours
      ? Number(reopen_window_hours)
      : null;
    const maxReopen = Number(max_reopen_count) || 2;
    const maxReviews = Number(max_manual_review_count) || 1;

    // Optional: resolve custom categories if provided
    const finalCondition = body.applicable_condition || null;
    if (finalCondition) {
      if (body.new_category_name && finalCondition.category_id === "CUSTOM") {
        let cat = await prisma.categories.findFirst({
          where: {
            category_name: {
              equals: body.new_category_name,
              mode: "insensitive",
            },
          },
        });
        if (!cat) {
          cat = await prisma.categories.create({
            data: { category_name: body.new_category_name },
          });
        }
        finalCondition.category_id = cat.category_id.toString();
        finalCondition.category = cat.category_name;
      }
      if (
        body.new_subcategory_name &&
        finalCondition.subcategory_id === "CUSTOM" &&
        finalCondition.category_id
      ) {
        let subcat = await prisma.subcategories.findFirst({
          where: {
            subcategory_name: {
              equals: body.new_subcategory_name,
              mode: "insensitive",
            },
            category_id: BigInt(finalCondition.category_id),
          },
        });
        if (!subcat) {
          subcat = await prisma.subcategories.create({
            data: {
              subcategory_name: body.new_subcategory_name,
              category_id: BigInt(finalCondition.category_id),
            },
          });
        }
        finalCondition.subcategory_id = subcat.subcategory_id.toString();
        finalCondition.subcategory = subcat.subcategory_name;
      }
    }

    const policy = await prisma.$transaction(async (tx) => {
      const created = await tx.reopen_policies.create({
        data: {
          policy_name: trimmedName,
          reopen_window_hours: windowHours,
          max_reopen_count: maxReopen,
          max_manual_review_count: maxReviews,
          applicable_condition: finalCondition
            ? (finalCondition as any)
            : Prisma.JsonNull,
          status: requestedStatus,
          created_by: user.user_id,
        },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "CREATE_REOPEN_POLICY",
          entity_type: "REOPEN_POLICY",
          entity_id: created.reopen_policy_id,
          new_value: {
            policy_name: created.policy_name,
            reopen_window_hours: created.reopen_window_hours,
            max_reopen_count: created.max_reopen_count,
          },
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      message: "Reopen policy created successfully.",
      policy: {
        reopen_policy_id: policy.reopen_policy_id.toString(),
        policy_name: policy.policy_name,
        reopen_window_hours: policy.reopen_window_hours,
        max_reopen_count: policy.max_reopen_count,
        max_manual_review_count: policy.max_manual_review_count,
        applicable_condition: policy.applicable_condition,
        status: policy.status,
      },
    });
  } catch (error) {
    console.error("Failed to create reopen policy:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error creating reopen policy.",
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
    const { reopen_policy_id, status } = body;

    if (!reopen_policy_id || !status) {
      return NextResponse.json(
        { success: false, message: "Policy ID and status are required." },
        { status: 400 },
      );
    }

    const policyId = BigInt(reopen_policy_id);

    if (status === "ACTIVE") {
      // Allow multiple active policies now since they can apply to specific categories.
    }

    const updated = await prisma.$transaction(async (tx) => {
      const policy = await tx.reopen_policies.update({
        where: { reopen_policy_id: policyId },
        data: { status },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "UPDATE_REOPEN_POLICY_STATUS",
          entity_type: "REOPEN_POLICY",
          entity_id: policy.reopen_policy_id,
          new_value: { status: policy.status },
        },
      });

      return policy;
    });

    return NextResponse.json({
      success: true,
      message: `Reopen policy is now ${updated.status}.`,
      policy: {
        reopen_policy_id: updated.reopen_policy_id.toString(),
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Failed to update reopen policy:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error updating reopen policy.",
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
        { success: false, message: "Policy ID is required." },
        { status: 400 },
      );
    }

    const policyId = BigInt(id);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.reopen_policies.findUnique({
        where: { reopen_policy_id: policyId },
      });

      if (!existing) {
        throw new Error("Reopen policy not found");
      }

      await tx.reopen_policies.delete({
        where: { reopen_policy_id: policyId },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "DELETE_REOPEN_POLICY",
          entity_type: "REOPEN_POLICY",
          entity_id: policyId,
          old_value: { policy_name: existing.policy_name },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Reopen policy deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete reopen policy:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error deleting reopen policy.";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}
