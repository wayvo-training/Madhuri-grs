import { NextResponse } from "next/server";
import { evaluateGrievanceSla } from "@/lib/engines/sla-engine";
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
      at_risk_threshold_percent,
      target_role,
    } = body;

    const trimmedName = policy_name?.trim();
    if (!trimmedName || !target_duration_minutes) {
      return NextResponse.json(
        {
          success: false,
          message: "Policy name and target duration are required.",
        },
        { status: 400 },
      );
    }

    if (!/[a-zA-Z]/.test(trimmedName)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Policy name cannot consist of only numbers. It must include letters or an alphanumeric combination.",
        },
        { status: 400 },
      );
    }

    const durationNum = Number(target_duration_minutes);
    if (
      Number.isNaN(durationNum) ||
      durationNum < 60 ||
      durationNum > 720 * 60
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Target duration must be between 1 hour and 720 hours (30 days).",
        },
        { status: 400 },
      );
    }

    const requestedStatus = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    const slaTypeVal = sla_type || "RESOLUTION";

    // 1. Check duplicate policy name (case-insensitive)
    const nameConflict = await prisma.sla_policies.findFirst({
      where: {
        policy_name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (nameConflict) {
      return NextResponse.json(
        {
          success: false,
          message: `An SLA policy named "${trimmedName}" already exists. Please choose a unique policy name.`,
        },
        { status: 409 },
      );
    }

    // 2. Check active priority scope conflict
    if (requestedStatus === "ACTIVE" && priority_level) {
      const scopeConflict = await prisma.sla_policies.findFirst({
        where: {
          status: "ACTIVE",
          priority_level: priority_level,
          sla_type: slaTypeVal,
        },
      });

      if (scopeConflict) {
        return NextResponse.json(
          {
            success: false,
            message: `An active SLA policy for "${priority_level}" priority already exists ("${scopeConflict.policy_name}"). Please update or deactivate the existing policy instead of creating a conflicting duplicate.`,
          },
          { status: 409 },
        );
      }
    }

    const warnPercent = Number(warning_threshold_percent) || 50;
    const atRiskPercent = Number(at_risk_threshold_percent) || 75;

    if (warnPercent < 10 || warnPercent > 90) {
      return NextResponse.json(
        {
          success: false,
          message: "Warning threshold must be between 10% and 90%.",
        },
        { status: 400 },
      );
    }

    if (atRiskPercent <= warnPercent || atRiskPercent > 99) {
      return NextResponse.json(
        {
          success: false,
          message: `At-risk threshold must be between ${warnPercent + 1}% and 99% (greater than warning).`,
        },
        { status: 400 },
      );
    }

    const tgtRole = target_role || "DEPARTMENT_HEAD";

    // 3. Check duplicate configuration across all functional fields
    const configConflict = await prisma.sla_policies.findFirst({
      where: {
        priority_level: priority_level || null,
        sla_type: slaTypeVal,
        target_duration_minutes: durationNum,
        warning_threshold_percent: warnPercent,
        escalation_threshold_percent: atRiskPercent,
      },
    });

    if (configConflict) {
      const priorityDesc = priority_level
        ? `"${priority_level}" priority`
        : "all priorities";
      const durationHours = (durationNum / 60).toFixed(1).replace(".0", "");

      return NextResponse.json(
        {
          success: false,
          message: `An SLA policy with identical configuration already exists ("${configConflict.policy_name}": ${durationHours}h target duration, ${warnPercent}% warning, and ${atRiskPercent}% escalation threshold for ${priorityDesc}). Please modify the parameters or use the existing policy.`,
        },
        { status: 409 },
      );
    }

    const notificationRecipients =
      body.notification_recipients ||
      body.trigger_condition?.notification_recipients;

    const policy = await prisma.$transaction(async (tx) => {
      const created = await tx.sla_policies.create({
        data: {
          policy_name: trimmedName,
          priority_level: priority_level || null,
          sla_type: slaTypeVal,
          target_duration_minutes: durationNum,
          warning_threshold_percent: warnPercent,
          escalation_threshold_percent: atRiskPercent,
          trigger_condition: {
            warning_threshold_percent: warnPercent,
            at_risk_threshold_percent: atRiskPercent,
            escalation_threshold_percent: atRiskPercent,
            breach_threshold_percent: 100,
            ...(notificationRecipients
              ? { notification_recipients: notificationRecipients }
              : {}),
            departmental_allocation_mode:
              body.trigger_condition?.departmental_allocation_mode ||
              body.departmental_allocation_mode ||
              "FULL",
          },
          target_role: tgtRole,
          status: requestedStatus,
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

      // Sync active/recent open grievances with the newly configured SLA policy
      if (priority_level && durationNum && requestedStatus === "ACTIVE") {
        try {
          const openGrievances = await tx.grievances.findMany({
            where: {
              priority: priority_level,
              status: { notIn: ["RESOLVED", "CLOSED", "REJECTED"] },
            },
            include: {
              sla_tracking: {
                where: {
                  sla_extensions: {
                    none: { status: "APPROVED" },
                  },
                },
                orderBy: { sla_tracking_id: "desc" },
                take: 1,
              },
            },
          });

          for (const g of openGrievances) {
            const tracking = g.sla_tracking[0];
            const rawStart = tracking?.started_at || g.created_at;
            const startDate =
              rawStart instanceof Date
                ? rawStart
                : rawStart
                  ? new Date(rawStart)
                  : new Date();
            const newDue = new Date(
              startDate.getTime() + durationNum * 60 * 1000,
            );
            await tx.grievances.update({
              where: { grievance_id: g.grievance_id },
              data: { due_at: newDue },
            });
            if (tracking) {
              await tx.sla_tracking.update({
                where: { sla_tracking_id: tracking.sla_tracking_id },
                data: {
                  due_at: newDue,
                  sla_policy_id: created.sla_policy_id,
                },
              });
            }

            // Update each involved active department's allocated duration and due date
            const deptRecords = await tx.grievance_departments.findMany({
              where: {
                grievance_id: g.grievance_id,
                status: { notIn: ["COMPLETED", "RESOLVED", "REMOVED"] },
              },
            });

            for (const d of deptRecords) {
              const percentAlloc = d.sla_percent_allocation
                ? Number(d.sla_percent_allocation)
                : 100;
              const newDeptMinutes = Math.max(
                1,
                Math.round((durationNum * percentAlloc) / 100),
              );
              const rawAct = d.activated_at || d.assigned_at || startDate;
              const actDate =
                rawAct instanceof Date
                  ? rawAct
                  : rawAct
                    ? new Date(rawAct)
                    : startDate;
              const newDeptDue = new Date(
                actDate.getTime() + newDeptMinutes * 60 * 1000,
              );
              await tx.grievance_departments.update({
                where: { grievance_department_id: d.grievance_department_id },
                data: {
                  allocated_duration_minutes: newDeptMinutes,
                  ...(d.status !== "BLOCKED" ? { due_at: newDeptDue } : {}),
                },
              });
            }
          }
        } catch (syncErr) {
          console.error(
            "Failed to sync open grievances with new SLA policy:",
            syncErr,
          );
        }
      }

      return created;
    });

    // Trigger SLA evaluation on all active grievances with this priority to apply new thresholds & send notifications
    if (priority_level && requestedStatus === "ACTIVE") {
      const activeGrievanceIds = await prisma.grievances.findMany({
        where: {
          priority: priority_level,
          status: { notIn: ["RESOLVED", "CLOSED", "REJECTED"] },
        },
        select: { grievance_id: true },
      });

      for (const g of activeGrievanceIds) {
        try {
          await evaluateGrievanceSla(g.grievance_id);
        } catch (evalErr) {
          console.error(
            `Failed to evaluate SLA for grievance ${g.grievance_id}:`,
            evalErr,
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "SLA policy created successfully.",
      policy: {
        sla_policy_id: policy.sla_policy_id.toString(),
        policy_name: policy.policy_name,
        priority_level: policy.priority_level,
        sla_type: policy.sla_type,
        target_duration_minutes: policy.target_duration_minutes,
        warning_threshold_percent: warnPercent.toString(),
        at_risk_threshold_percent: atRiskPercent.toString(),
        escalation_threshold_percent: atRiskPercent.toString(),
        trigger_condition: policy.trigger_condition,
        target_role: policy.target_role,
        status: policy.status,
      },
    });
  } catch (error) {
    console.error("Failed to create SLA policy:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error creating SLA policy.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await request.json();
    const { sla_policy_id, status } = body;

    if (!sla_policy_id) {
      return NextResponse.json(
        { success: false, message: "Policy ID is required." },
        { status: 400 },
      );
    }

    let policyId: bigint;
    try {
      policyId = BigInt(sla_policy_id);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid Policy ID format." },
        { status: 400 },
      );
    }

    // If this is a full policy update (policy_name is provided)
    if (body.policy_name) {
      const {
        policy_name,
        priority_level,
        sla_type,
        target_duration_minutes,
        warning_threshold_percent,
        at_risk_threshold_percent,
        target_role,
      } = body;

      const trimmedName = policy_name?.trim();
      if (!trimmedName || !target_duration_minutes) {
        return NextResponse.json(
          {
            success: false,
            message: "Policy name and target duration are required.",
          },
          { status: 400 },
        );
      }

      if (!/[a-zA-Z]/.test(trimmedName)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Policy name cannot consist of only numbers. It must include letters or an alphanumeric combination.",
          },
          { status: 400 },
        );
      }

      const requestedStatus =
        status === "INACTIVE"
          ? "INACTIVE"
          : status === "ACTIVE"
            ? "ACTIVE"
            : undefined;
      const slaTypeVal = sla_type || "RESOLUTION";

      // 1. Check duplicate policy name (excluding current policy)
      const nameConflict = await prisma.sla_policies.findFirst({
        where: {
          sla_policy_id: { not: policyId },
          policy_name: { equals: trimmedName, mode: "insensitive" },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          {
            success: false,
            message: `An SLA policy named "${trimmedName}" already exists. Please choose a unique policy name.`,
          },
          { status: 409 },
        );
      }

      // 2. Check active priority scope conflict (excluding current policy)
      const effectiveStatus =
        requestedStatus ||
        (
          await prisma.sla_policies.findUnique({
            where: { sla_policy_id: policyId },
          })
        )?.status;

      if (effectiveStatus === "ACTIVE" && priority_level) {
        const scopeConflict = await prisma.sla_policies.findFirst({
          where: {
            sla_policy_id: { not: policyId },
            status: "ACTIVE",
            priority_level: priority_level,
            sla_type: slaTypeVal,
          },
        });

        if (scopeConflict) {
          return NextResponse.json(
            {
              success: false,
              message: `An active SLA policy for "${priority_level}" priority already exists ("${scopeConflict.policy_name}"). Please update or deactivate the existing policy instead of creating a conflicting duplicate.`,
            },
            { status: 409 },
          );
        }
      }

      const durationNum = Number(target_duration_minutes);
      if (
        Number.isNaN(durationNum) ||
        durationNum < 60 ||
        durationNum > 720 * 60
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Target duration must be between 1 hour and 720 hours (30 days).",
          },
          { status: 400 },
        );
      }
      const warnPercent = Number(warning_threshold_percent) || 50;
      const atRiskPercent = Number(at_risk_threshold_percent) || 75;

      if (warnPercent < 10 || warnPercent > 90) {
        return NextResponse.json(
          {
            success: false,
            message: "Warning threshold must be between 10% and 90%.",
          },
          { status: 400 },
        );
      }

      if (atRiskPercent <= warnPercent || atRiskPercent > 99) {
        return NextResponse.json(
          {
            success: false,
            message: `At-risk threshold must be between ${warnPercent + 1}% and 99% (greater than warning).`,
          },
          { status: 400 },
        );
      }

      const tgtRole = target_role || "DEPARTMENT_HEAD";
      const notificationRecipients =
        body.notification_recipients ||
        body.trigger_condition?.notification_recipients;

      const updated = await prisma.$transaction(async (tx) => {
        const policy = await tx.sla_policies.update({
          where: { sla_policy_id: policyId },
          data: {
            policy_name: trimmedName,
            priority_level: priority_level || null,
            sla_type: slaTypeVal,
            target_duration_minutes: durationNum,
            warning_threshold_percent: warnPercent,
            escalation_threshold_percent: atRiskPercent,
            trigger_condition: {
              warning_threshold_percent: warnPercent,
              at_risk_threshold_percent: atRiskPercent,
              escalation_threshold_percent: atRiskPercent,
              breach_threshold_percent: 100,
              ...(notificationRecipients
                ? { notification_recipients: notificationRecipients }
                : {}),
              departmental_allocation_mode:
                body.trigger_condition?.departmental_allocation_mode ||
                body.departmental_allocation_mode ||
                "FULL",
            },
            target_role: tgtRole,
            ...(requestedStatus ? { status: requestedStatus } : {}),
          },
        });

        await tx.audit_logs.create({
          data: {
            user_id: user.user_id,
            action: "UPDATE_SLA_POLICY",
            entity_type: "SLA_POLICY",
            entity_id: policy.sla_policy_id,
            new_value: {
              policy_name: policy.policy_name,
              target_duration_minutes: policy.target_duration_minutes,
              priority_level: policy.priority_level,
            },
          },
        });

        // Sync active/recent open grievances with the updated SLA policy duration
        if (priority_level && durationNum && requestedStatus !== "INACTIVE") {
          try {
            const openGrievances = await tx.grievances.findMany({
              where: {
                priority: priority_level,
                status: { notIn: ["RESOLVED", "CLOSED", "REJECTED"] },
              },
              include: {
                sla_tracking: {
                  where: {
                    sla_extensions: {
                      none: { status: "APPROVED" },
                    },
                  },
                  orderBy: { sla_tracking_id: "desc" },
                  take: 1,
                },
              },
            });

            for (const g of openGrievances) {
              const tracking = g.sla_tracking[0];
              const rawStart = tracking?.started_at || g.created_at;
              const startDate =
                rawStart instanceof Date
                  ? rawStart
                  : rawStart
                    ? new Date(rawStart)
                    : new Date();
              const newDue = new Date(
                startDate.getTime() + durationNum * 60 * 1000,
              );
              await tx.grievances.update({
                where: { grievance_id: g.grievance_id },
                data: { due_at: newDue },
              });
              if (tracking) {
                await tx.sla_tracking.update({
                  where: { sla_tracking_id: tracking.sla_tracking_id },
                  data: {
                    due_at: newDue,
                    sla_policy_id: policy.sla_policy_id,
                  },
                });
              }

              // Update each involved active department's allocated duration and due date
              const deptRecords = await tx.grievance_departments.findMany({
                where: {
                  grievance_id: g.grievance_id,
                  status: { notIn: ["COMPLETED", "RESOLVED", "REMOVED"] },
                },
              });

              for (const d of deptRecords) {
                const percentAlloc = d.sla_percent_allocation
                  ? Number(d.sla_percent_allocation)
                  : 100;
                const newDeptMinutes = Math.max(
                  1,
                  Math.round((durationNum * percentAlloc) / 100),
                );
                const rawAct = d.activated_at || d.assigned_at || startDate;
                const actDate =
                  rawAct instanceof Date
                    ? rawAct
                    : rawAct
                      ? new Date(rawAct)
                      : startDate;
                const newDeptDue = new Date(
                  actDate.getTime() + newDeptMinutes * 60 * 1000,
                );
                await tx.grievance_departments.update({
                  where: { grievance_department_id: d.grievance_department_id },
                  data: {
                    allocated_duration_minutes: newDeptMinutes,
                    ...(d.status !== "BLOCKED" ? { due_at: newDeptDue } : {}),
                  },
                });
              }
            }
          } catch (syncErr) {
            console.error(
              "Failed to sync open grievances with updated SLA policy:",
              syncErr,
            );
          }
        }

        return policy;
      });

      // Trigger SLA evaluation on all active grievances with this priority to apply updated thresholds & send notifications
      if (
        priority_level &&
        (body.status === "ACTIVE" || updated.status === "ACTIVE")
      ) {
        const activeGrievanceIds = await prisma.grievances.findMany({
          where: {
            priority: priority_level,
            status: { notIn: ["RESOLVED", "CLOSED", "REJECTED"] },
          },
          select: { grievance_id: true },
        });

        for (const g of activeGrievanceIds) {
          try {
            await evaluateGrievanceSla(g.grievance_id);
          } catch (evalErr) {
            console.error(
              `Failed to evaluate SLA for grievance ${g.grievance_id}:`,
              evalErr,
            );
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "SLA policy updated successfully.",
        policy: {
          sla_policy_id: updated.sla_policy_id.toString(),
          policy_name: updated.policy_name,
          priority_level: updated.priority_level,
          sla_type: updated.sla_type,
          target_duration_minutes: updated.target_duration_minutes,
          warning_threshold_percent: warnPercent.toString(),
          at_risk_threshold_percent: atRiskPercent.toString(),
          escalation_threshold_percent: atRiskPercent.toString(),
          trigger_condition: updated.trigger_condition,
          target_role: updated.target_role,
          status: updated.status,
        },
      });
    }

    // Status-only toggle
    if (!status) {
      return NextResponse.json(
        { success: false, message: "Policy status is required." },
        { status: 400 },
      );
    }

    if (status === "ACTIVE") {
      const policyToActivate = await prisma.sla_policies.findUnique({
        where: { sla_policy_id: policyId },
      });

      if (policyToActivate?.priority_level) {
        const scopeConflict = await prisma.sla_policies.findFirst({
          where: {
            status: "ACTIVE",
            priority_level: policyToActivate.priority_level,
            sla_type: policyToActivate.sla_type,
            sla_policy_id: { not: policyId },
          },
        });

        if (scopeConflict) {
          return NextResponse.json(
            {
              success: false,
              message: `Cannot activate this policy because "${scopeConflict.policy_name}" is already active for "${policyToActivate.priority_level}" priority. Please deactivate the existing active policy first.`,
            },
            { status: 409 },
          );
        }
      }
    }

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
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error updating SLA policy.";
    return NextResponse.json({ success: false, message }, { status: 500 });
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

      const [trackingCount, escalationCount] = await Promise.all([
        tx.sla_tracking.count({ where: { sla_policy_id: policyId } }),
        tx.escalations.count({ where: { sla_policy_id: policyId } }),
      ]);

      const isLinkedToHistory = trackingCount > 0 || escalationCount > 0;

      if (isLinkedToHistory) {
        // Soft-deactivate to preserve historical grievance audit trail & FK integrity
        await tx.sla_policies.update({
          where: { sla_policy_id: policyId },
          data: { status: "INACTIVE" },
        });
      } else {
        await tx.sla_policies.delete({
          where: { sla_policy_id: policyId },
        });
      }

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: isLinkedToHistory
            ? "DEACTIVATE_SLA_POLICY"
            : "DELETE_SLA_POLICY",
          entity_type: "SLA_POLICY",
          entity_id: policyId,
          old_value: {
            policy_name: existing.policy_name,
            status: existing.status,
          },
          new_value: isLinkedToHistory
            ? { status: "INACTIVE" }
            : { status: "DELETED" },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "SLA policy removed successfully.",
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
