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

    if (!policy_name) {
      return NextResponse.json(
        { success: false, message: "Policy name is required." },
        { status: 400 },
      );
    }

    const windowHours = reopen_window_hours
      ? Number(reopen_window_hours)
      : null;
    const maxReopen = Number(max_reopen_count) || 2;
    const maxReviews = Number(max_manual_review_count) || 1;

    const policy = await prisma.$transaction(async (tx) => {
      const created = await tx.reopen_policies.create({
        data: {
          policy_name: policy_name.trim(),
          reopen_window_hours: windowHours,
          max_reopen_count: maxReopen,
          max_manual_review_count: maxReviews,
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
        max_reopen_count: policy.max_reopen_count,
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
  } catch (error: any) {
    console.error("Failed to delete reopen policy:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Internal server error deleting reopen policy.",
      },
      { status: 500 },
    );
  }
}
