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

    // 2. Check active reopen policy conflict (system-wide single active policy rule)
    if (requestedStatus === "ACTIVE") {
      const activePolicy = await prisma.reopen_policies.findFirst({
        where: { status: "ACTIVE" },
      });

      if (activePolicy) {
        return NextResponse.json(
          {
            success: false,
            message: `An active reopen policy already exists ("${activePolicy.policy_name}"). Only one reopen policy can be active at a time. Please update the existing policy or deactivate it first.`,
          },
          { status: 409 },
        );
      }
    }

    const windowHours = reopen_window_hours
      ? Number(reopen_window_hours)
      : null;
    const maxReopen = Number(max_reopen_count) || 2;
    const maxReviews = Number(max_manual_review_count) || 1;

    // 3. Check duplicate configuration across all functional fields
    const configConflict = await prisma.reopen_policies.findFirst({
      where: {
        reopen_window_hours: windowHours,
        max_reopen_count: maxReopen,
        max_manual_review_count: maxReviews,
      },
    });

    if (configConflict) {
      const windowText = windowHours
        ? `${windowHours}h window`
        : "unlimited window";
      return NextResponse.json(
        {
          success: false,
          message: `A reopen policy with identical configuration already exists ("${configConflict.policy_name}" has ${windowText}, ${maxReopen} max reopens, and ${maxReviews} max reviews). Please modify the parameters or use the existing policy.`,
        },
        { status: 409 },
      );
    }

    const policy = await prisma.$transaction(async (tx) => {
      const created = await tx.reopen_policies.create({
        data: {
          policy_name: trimmedName,
          reopen_window_hours: windowHours,
          max_reopen_count: maxReopen,
          max_manual_review_count: maxReviews,
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

    if (status === "ACTIVE") {
      const existingActive = await prisma.reopen_policies.findFirst({
        where: {
          status: "ACTIVE",
          reopen_policy_id: { not: policyId },
        },
      });

      if (existingActive) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot activate this policy because "${existingActive.policy_name}" is already active. Only one reopen policy can be active at a time. Please deactivate it first.`,
          },
          { status: 409 },
        );
      }
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
