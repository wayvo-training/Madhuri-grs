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
      priority_level,
      sla_type,
      target_duration_minutes,
      warning_threshold_percent,
      escalation_threshold_percent,
      target_role,
    } = body;

    if (!policy_name || !target_duration_minutes) {
      return NextResponse.json(
        {
          success: false,
          message: "Policy name and target duration are required.",
        },
        { status: 400 },
      );
    }

    const durationNum = Number(target_duration_minutes);
    const warnPercent = Number(warning_threshold_percent) || 75;
    const escPercent = Number(escalation_threshold_percent) || 100;
    const tgtRole = target_role || "DEPARTMENT_HEAD";
    const slaTypeVal = sla_type || "RESOLUTION";

    const policy = await prisma.$transaction(async (tx) => {
      const created = await tx.sla_policies.create({
        data: {
          policy_name: policy_name.trim(),
          priority_level: priority_level || null,
          sla_type: slaTypeVal,
          target_duration_minutes: durationNum,
          warning_threshold_percent: warnPercent,
          escalation_threshold_percent: escPercent,
          target_role: tgtRole,
          created_by: user.user_id,
        },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "CREATE_SLA_POLICY",
          entity_type: "SLA_POLICY",
          entity_id: created.sla_policy_id,
          new_value: {
            policy_name: created.policy_name,
            target_duration_minutes: created.target_duration_minutes,
            priority_level: created.priority_level,
          },
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      message: "SLA policy created successfully.",
      policy: {
        sla_policy_id: policy.sla_policy_id.toString(),
        policy_name: policy.policy_name,
        target_duration_minutes: policy.target_duration_minutes,
        status: policy.status,
      },
    });
  } catch (error) {
    console.error("Failed to create SLA policy:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error creating SLA policy." },
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
    const { sla_policy_id, status } = body;

    if (!sla_policy_id || !status) {
      return NextResponse.json(
        { success: false, message: "Policy ID and status are required." },
        { status: 400 },
      );
    }

    const policyId = BigInt(sla_policy_id);
    const updated = await prisma.$transaction(async (tx) => {
      const policy = await tx.sla_policies.update({
        where: { sla_policy_id: policyId },
        data: { status },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "UPDATE_SLA_POLICY_STATUS",
          entity_type: "SLA_POLICY",
          entity_id: policy.sla_policy_id,
          new_value: { status: policy.status },
        },
      });

      return policy;
    });

    return NextResponse.json({
      success: true,
      message: `SLA policy is now ${updated.status}.`,
      policy: {
        sla_policy_id: updated.sla_policy_id.toString(),
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Failed to update SLA policy:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error updating SLA policy." },
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
      const existing = await tx.sla_policies.findUnique({
        where: { sla_policy_id: policyId },
      });

      if (!existing) {
        throw new Error("SLA policy not found");
      }

      await tx.sla_policies.delete({
        where: { sla_policy_id: policyId },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "DELETE_SLA_POLICY",
          entity_type: "SLA_POLICY",
          entity_id: policyId,
          old_value: { policy_name: existing.policy_name },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "SLA policy deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete SLA policy:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error deleting SLA policy.";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}
