import { prisma } from "@/lib/prisma";

export interface SlaEvaluationResult {
  grievanceId: string;
  grievanceNumber: string;
  consumptionPercent: number;
  threshold: "BELOW_50" | "AT_50" | "AT_75" | "AT_100_BREACH";
  slaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED";
  status: string;
  notificationsSent: string[];
  escalated: boolean;
  message: string;
}

/**
 * Standard resolution SLA durations in minutes if policy not linked directly.
 */
const DEFAULT_SLA_DURATION_MINUTES: Record<string, number> = {
  CRITICAL: 24 * 60, // 24 hours
  HIGH: 48 * 60, // 48 hours
  MEDIUM: 72 * 60, // 72 hours
  LOW: 120 * 60, // 120 hours
};

/**
 * Calculates the exact SLA consumption percentage for a grievance.
 */
export function calculateSlaConsumption(
  createdAt: Date,
  dueAt: Date | null,
  priority: string = "MEDIUM",
  now: Date = new Date(),
): {
  totalDurationMinutes: number;
  elapsedMinutes: number;
  consumptionPercent: number;
} {
  let effectiveDue = dueAt;
  if (!effectiveDue) {
    const mins =
      DEFAULT_SLA_DURATION_MINUTES[priority.toUpperCase()] || 72 * 60;
    effectiveDue = new Date(createdAt.getTime() + mins * 60 * 1000);
  }

  const totalMs = effectiveDue.getTime() - createdAt.getTime();
  if (totalMs <= 0) {
    return {
      totalDurationMinutes: 0,
      elapsedMinutes: 0,
      consumptionPercent: 100,
    };
  }

  const elapsedMs = Math.max(0, now.getTime() - createdAt.getTime());
  const totalDurationMinutes = Math.round(totalMs / (60 * 1000));
  const elapsedMinutes = Math.round(elapsedMs / (60 * 1000));
  const rawPercent = (elapsedMs / totalMs) * 100;
  const consumptionPercent = Math.min(Math.round(rawPercent * 10) / 10, 999);

  return { totalDurationMinutes, elapsedMinutes, consumptionPercent };
}

/**
 * Evaluates SLA rules for a single grievance and idempotently triggers threshold notifications
 * and escalation if breached.
 */
export async function evaluateGrievanceSla(
  grievanceId: bigint,
  evaluationDate: Date = new Date(),
): Promise<SlaEvaluationResult | null> {
  const grievance = await prisma.grievances.findUnique({
    where: { grievance_id: grievanceId },
    include: {
      grievance_departments: {
        where: { involvement_type: "PRIMARY" },
        include: {
          departments: {
            include: {
              users: {
                where: {
                  roles: { role_name: "DEPARTMENT_HEAD" },
                  status: "ACTIVE",
                },
                take: 1,
              },
            },
          },
        },
      },
      assignments: {
        where: { assignment_status: "ASSIGNED" },
        include: {
          users_assignments_staff_idTousers: true,
        },
        take: 1,
      },
      notifications: {
        select: {
          notification_type: true,
        },
      },
    },
  });

  if (!grievance) return null;

  // Ignore terminal closed or resolved grievances
  const terminalStatuses = ["CLOSED", "RESOLVED", "REJECTED"];
  if (terminalStatuses.includes(grievance.status)) {
    return {
      grievanceId: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      consumptionPercent: 0,
      threshold: "BELOW_50",
      slaStatus:
        (grievance.sla_status as "ON_TRACK" | "AT_RISK" | "BREACHED") ||
        "ON_TRACK",
      status: grievance.status,
      notificationsSent: [],
      escalated: false,
      message: "Grievance is in terminal state; SLA monitoring skipped.",
    };
  }

  const { consumptionPercent } = calculateSlaConsumption(
    grievance.created_at,
    grievance.due_at,
    grievance.priority,
    evaluationDate,
  );

  const existingNotificationTypes = new Set(
    grievance.notifications.map((n) => n.notification_type),
  );

  const primaryDept = grievance.grievance_departments?.departments;
  const deptHead = primaryDept?.users?.[0];
  const activeAssignment = grievance.assignments?.[0];
  const assignedStaff = activeAssignment?.users_assignments_staff_idTousers;

  const notificationsSent: string[] = [];
  let updatedSlaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED" = "ON_TRACK";
  let updatedStatus = grievance.status;
  let didEscalate = false;

  // =========================================================================
  // RULE 1: Below 50% → Normal processing
  // =========================================================================
  if (consumptionPercent < 50) {
    updatedSlaStatus = "ON_TRACK";
    if (grievance.sla_status !== "ON_TRACK") {
      await prisma.grievances.update({
        where: { grievance_id: grievanceId },
        data: { sla_status: "ON_TRACK" },
      });
    }

    return {
      grievanceId: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      consumptionPercent,
      threshold: "BELOW_50",
      slaStatus: "ON_TRACK",
      status: grievance.status,
      notificationsSent: [],
      escalated: false,
      message: "SLA consumption is below 50%. Normal operational processing.",
    };
  }

  // =========================================================================
  // RULE 2: At 50% SLA consumption (>= 50% and < 75%)
  // Automatically notify the assigned staff member to prioritize the grievance.
  // Triggered ONCE per grievance.
  // =========================================================================
  if (consumptionPercent >= 50 && consumptionPercent < 75) {
    updatedSlaStatus = "ON_TRACK";

    if (
      !existingNotificationTypes.has("SLA_50_STAFF_WARNING") &&
      assignedStaff
    ) {
      await prisma.$transaction(async (tx) => {
        await tx.notifications.create({
          data: {
            user_id: assignedStaff.user_id,
            grievance_id: grievanceId,
            notification_type: "SLA_50_STAFF_WARNING",
            channel: "IN_APP",
            title: `Priority Nudge: 50% SLA Consumed (${grievance.grievance_number})`,
            message: `Grievance ${grievance.grievance_number} has reached 50% of its resolution SLA (${consumptionPercent}% consumed). Please prioritize investigation and resolution.`,
            status: "PENDING",
            created_at: evaluationDate,
          },
        });

        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: null,
            action: "SLA_50_PERCENT_WARNING",
            entity_type: "grievance",
            entity_id: grievanceId,
            new_value: {
              consumptionPercent,
              threshold: "50%",
              notifiedStaff:
                `${assignedStaff.first_name} ${assignedStaff.last_name || ""}`.trim(),
              staffEmail: assignedStaff.email,
              actionRequired: "Prioritize grievance investigation",
            },
          },
        });
      });

      notificationsSent.push("SLA_50_STAFF_WARNING");
    }

    if (grievance.sla_status !== "ON_TRACK") {
      await prisma.grievances.update({
        where: { grievance_id: grievanceId },
        data: { sla_status: "ON_TRACK" },
      });
    }

    return {
      grievanceId: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      consumptionPercent,
      threshold: "AT_50",
      slaStatus: "ON_TRACK",
      status: grievance.status,
      notificationsSent,
      escalated: false,
      message: `50% SLA threshold reached (${consumptionPercent}%). Assigned officer notified.`,
    };
  }

  // =========================================================================
  // RULE 3: At 75% SLA consumption (>= 75% and < 100%)
  // Automatically notify Department Head that the grievance is at SLA risk.
  // DO NOT automatically reassign the grievance at 75%.
  // Triggered ONCE per grievance.
  // =========================================================================
  if (consumptionPercent >= 75 && consumptionPercent < 100) {
    updatedSlaStatus = "AT_RISK";

    await prisma.$transaction(async (tx) => {
      // 1. Update sla_status to AT_RISK
      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: { sla_status: "AT_RISK" },
      });

      // 2. Dispatch HOD Notification if not already sent
      if (!existingNotificationTypes.has("SLA_75_HOD_WARNING") && deptHead) {
        await tx.notifications.create({
          data: {
            user_id: deptHead.user_id,
            grievance_id: grievanceId,
            notification_type: "SLA_75_HOD_WARNING",
            channel: "IN_APP",
            title: `SLA At Risk: 75% Consumed (${grievance.grievance_number})`,
            message: `Grievance ${grievance.grievance_number} has reached 75% of its resolution SLA (${consumptionPercent}% consumed). Review required: decide whether to continue monitoring, notify staff, add supporting staff, or reassign.`,
            status: "PENDING",
            created_at: evaluationDate,
          },
        });

        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: null,
            action: "SLA_75_PERCENT_HOD_ALERT",
            entity_type: "grievance",
            entity_id: grievanceId,
            new_value: {
              consumptionPercent,
              threshold: "75%",
              slaStatus: "AT_RISK",
              departmentHead:
                `${deptHead.first_name} ${deptHead.last_name || ""}`.trim(),
              reassignedAutomatically: false,
              note: "75% SLA warning: No automated reassignment performed. Department Head manual review required.",
            },
          },
        });

        notificationsSent.push("SLA_75_HOD_WARNING");
      }
    });

    return {
      grievanceId: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      consumptionPercent,
      threshold: "AT_75",
      slaStatus: "AT_RISK",
      status: grievance.status,
      notificationsSent,
      escalated: false,
      message: `75% SLA threshold reached (${consumptionPercent}%). Marked AT_RISK. Department Head notified for review without auto-reassignment.`,
    };
  }

  // =========================================================================
  // RULE 4: At 100% SLA consumption (>= 100%)
  // Mark the grievance as SLA BREACHED and move it to Escalated status.
  // Triggered ONCE per grievance.
  // =========================================================================
  if (consumptionPercent >= 100) {
    updatedSlaStatus = "BREACHED";
    updatedStatus = grievance.status;

    const alreadyBreached =
      existingNotificationTypes.has("SLA_100_BREACH_ESCALATED") ||
      (grievance.status === "ESCALATED" && grievance.sla_status === "BREACHED");

    if (!alreadyBreached) {
      await prisma.$transaction(async (tx) => {
        // 1. Update grievance status to ESCALATED and sla_status to BREACHED
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            sla_status: "BREACHED",
            status: "ESCALATED",
            updated_at: evaluationDate,
          },
        });

        // 2. Create escalation record if not exists
        const existingEscalation = await tx.escalations.findFirst({
          where: { grievance_id: grievanceId },
        });

        if (!existingEscalation && deptHead) {
          await tx.escalations.create({
            data: {
              grievance_id: grievanceId,
              escalated_to: deptHead.user_id,
              escalation_level: 1,
              reason: `Automated SLA Breach: ${consumptionPercent}% of SLA time consumed without resolution.`,
              status: "OPEN",
              created_at: evaluationDate,
            },
          });
          didEscalate = true;
        }

        // 3. Status history update
        if (grievance.status !== "ESCALATED") {
          await tx.grievance_status_history.create({
            data: {
              grievance_id: grievanceId,
              old_status: grievance.status,
              new_status: "ESCALATED",
              changed_by: deptHead?.user_id || grievance.submitted_by,
              remarks: `Automated SLA Breach (100% consumed). Moved to ESCALATED status for HOD intervention.`,
              changed_at: evaluationDate,
            },
          });
        }

        // 4. Send Breach Notification to Department Head (Once)
        if (
          !existingNotificationTypes.has("SLA_100_BREACH_ESCALATED") &&
          deptHead
        ) {
          await tx.notifications.create({
            data: {
              user_id: deptHead.user_id,
              grievance_id: grievanceId,
              notification_type: "SLA_100_BREACH_ESCALATED",
              channel: "IN_APP",
              title: `CRITICAL: SLA Breached & Escalated (${grievance.grievance_number})`,
              message: `Grievance ${grievance.grievance_number} has consumed 100% of its SLA deadline without resolution. Marked SLA BREACHED and moved to ESCALATED. Executive intervention required.`,
              status: "PENDING",
              created_at: evaluationDate,
            },
          });

          notificationsSent.push("SLA_100_BREACH_ESCALATED");
        }

        // 5. Send Notification to Assigned Staff Member (Once)
        if (
          !existingNotificationTypes.has("SLA_100_BREACH_STAFF") &&
          assignedStaff
        ) {
          await tx.notifications.create({
            data: {
              user_id: assignedStaff.user_id,
              grievance_id: grievanceId,
              notification_type: "SLA_100_BREACH_STAFF",
              channel: "IN_APP",
              title: `SLA Breached: Grievance Escalated (${grievance.grievance_number})`,
              message: `Grievance ${grievance.grievance_number} has breached its resolution SLA deadline and has been escalated to your Department Head.`,
              status: "PENDING",
              created_at: evaluationDate,
            },
          });

          notificationsSent.push("SLA_100_BREACH_STAFF");
        }

        // 6. Log in Audit Trail (Automated system event, triggered once on breach)
        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: null,
            action: "SLA_100_BREACH_ESCALATED",
            entity_type: "grievance",
            entity_id: grievanceId,
            new_value: {
              consumptionPercent,
              threshold: "100%",
              oldStatus: grievance.status,
              newStatus: "ESCALATED",
              slaStatus: "BREACHED",
              escalatedTo: deptHead
                ? `${deptHead.first_name} ${deptHead.last_name || ""}`.trim()
                : "Department Head",
            },
          },
        });
      });
    } else {
      if (grievance.sla_status !== "BREACHED") {
        await prisma.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            sla_status: "BREACHED",
          },
        });
      }
    }

    return {
      grievanceId: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      consumptionPercent,
      threshold: "AT_100_BREACH",
      slaStatus: updatedSlaStatus,
      status: updatedStatus,
      notificationsSent,
      escalated: didEscalate,
      message: `100% SLA threshold breached (${consumptionPercent}%). Marked BREACHED and moved to ESCALATED status.`,
    };
  }

  return {
    grievanceId: grievance.grievance_id.toString(),
    grievanceNumber: grievance.grievance_number,
    consumptionPercent,
    threshold: "BELOW_50",
    slaStatus: updatedSlaStatus,
    status: updatedStatus,
    notificationsSent,
    escalated: didEscalate,
    message: "SLA evaluation completed.",
  };
}

/**
 * Batch evaluates all active, non-terminal grievances across the system.
 */
export async function evaluateAllActiveGrievancesSla(
  departmentId?: bigint,
): Promise<{ totalEvaluated: number; results: SlaEvaluationResult[] }> {
  const activeGrievances = await prisma.grievances.findMany({
    where: {
      status: {
        notIn: ["CLOSED", "RESOLVED", "REJECTED"],
      },
      ...(departmentId
        ? {
            grievance_departments: {
              department_id: departmentId,
            },
          }
        : {}),
    },
    select: {
      grievance_id: true,
    },
  });

  const results: SlaEvaluationResult[] = [];
  for (const g of activeGrievances) {
    const res = await evaluateGrievanceSla(g.grievance_id);
    if (res) results.push(res);
  }

  return {
    totalEvaluated: activeGrievances.length,
    results,
  };
}
