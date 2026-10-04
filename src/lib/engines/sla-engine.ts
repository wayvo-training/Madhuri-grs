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
      assignments: {
        where: { assignment_status: { in: ["ASSIGNED", "COMPLETED"] } },
        include: {
          users_assignments_staff_idTousers: true,
        },
      },
      notifications: {
        select: {
          user_id: true,
          notification_type: true,
        },
      },
    },
  });

  if (!grievance) return null;

  // Query all involved departments (Primary and Supporting) and their active Department Heads
  const involvedDeptRecords = await prisma.grievance_departments.findMany({
    where: { grievance_id: grievanceId },
    include: {
      departments: {
        include: {
          users: {
            where: {
              roles: { role_name: "DEPARTMENT_HEAD" },
              status: "ACTIVE",
            },
          },
        },
      },
    },
  });

  const deptHeadMap = new Map<
    string,
    {
      user_id: bigint;
      first_name: string;
      last_name: string | null;
      email: string;
    }
  >();

  for (const rec of involvedDeptRecords) {
    for (const u of rec.departments?.users || []) {
      deptHeadMap.set(u.user_id.toString(), u);
    }
  }

  const allDeptHeads = Array.from(deptHeadMap.values());
  const primaryRecord = involvedDeptRecords.find(
    (r) => r.involvement_type === "PRIMARY"
  );
  const primaryDeptHead =
    primaryRecord?.departments?.users?.[0] || allDeptHeads[0];

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

  const existingNotifications = grievance.notifications;
  const existingNotificationTypes = new Set(
    existingNotifications.map((n) => n.notification_type)
  );

  const hasSentToUser = (userId: bigint, type: string) =>
    existingNotifications.some(
      (n) => n.user_id === userId && n.notification_type === type
    );

  const assignedStaffList = (grievance.assignments || [])
    .map((a) => a.users_assignments_staff_idTousers)
    .filter((s): s is NonNullable<typeof s> => s !== null);
  const assignedStaff = assignedStaffList[0];

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
  // Automatically notify the assigned staff members to prioritize the grievance.
  // =========================================================================
  if (consumptionPercent >= 50 && consumptionPercent < 75) {
    updatedSlaStatus = "ON_TRACK";

    const unnotifiedStaff = assignedStaffList.filter(
      (staff) =>
        !hasSentToUser(staff.user_id, "SLA_HALF_TIME") &&
        !hasSentToUser(staff.user_id, "SLA_50_STAFF_WARNING")
    );

    if (unnotifiedStaff.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const staff of unnotifiedStaff) {
          await tx.notifications.create({
            data: {
              user_id: staff.user_id,
              grievance_id: grievanceId,
              notification_type: "SLA_HALF_TIME",
              channel: "IN_APP",
              title: `Priority Nudge: 50% SLA Consumed (${grievance.grievance_number})`,
              message: `Grievance ${grievance.grievance_number} has reached 50% of its resolution SLA (${consumptionPercent}% consumed). Please prioritize investigation and resolution.`,
              status: "PENDING",
              created_at: evaluationDate,
            },
          });
        }

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
              notifiedStaff: unnotifiedStaff
                .map((s) => `${s.first_name} ${s.last_name || ""}`.trim())
                .join(", "),
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
      message: `50% SLA threshold reached (${consumptionPercent}%). Assigned officers notified.`,
    };
  }

  // =========================================================================
  // RULE 3: At 75% SLA consumption (>= 75% and < 100%)
  // Automatically notify Department Heads that the grievance is at SLA risk.
  // DO NOT automatically reassign the grievance at 75%.
  // =========================================================================
  if (consumptionPercent >= 75 && consumptionPercent < 100) {
    updatedSlaStatus = "AT_RISK";

    await prisma.$transaction(async (tx) => {
      // 1. Update sla_status to AT_RISK
      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: { sla_status: "AT_RISK" },
      });

      // 2. Dispatch HOD Notification to ALL involved Department Heads
      const unnotifiedHeads = allDeptHeads.filter(
        (head) =>
          !hasSentToUser(head.user_id, "SLA_75_HOD_WARNING") &&
          !hasSentToUser(head.user_id, "SLA_AT_RISK")
      );

      for (const head of unnotifiedHeads) {
        await tx.notifications.create({
          data: {
            user_id: head.user_id,
            grievance_id: grievanceId,
            notification_type: "SLA_AT_RISK",
            channel: "IN_APP",
            title: `SLA At Risk: 75% Consumed (${grievance.grievance_number})`,
            message: `Grievance ${grievance.grievance_number} has reached 75% of its resolution SLA (${consumptionPercent}% consumed). Review required: decide whether to continue monitoring, notify staff, add supporting staff, or reassign.`,
            status: "PENDING",
            created_at: evaluationDate,
          },
        });
      }

      if (unnotifiedHeads.length > 0) {
        notificationsSent.push("SLA_75_HOD_WARNING");
      }

      // 3. Dispatch Notification to ALL Assigned Staff Members
      const unnotifiedStaffAtRisk = assignedStaffList.filter(
        (staff) =>
          !hasSentToUser(staff.user_id, "SLA_75_STAFF_WARNING") &&
          !hasSentToUser(staff.user_id, "SLA_AT_RISK") &&
          !hasSentToUser(staff.user_id, "SLA_WARNING")
      );

      for (const staff of unnotifiedStaffAtRisk) {
        await tx.notifications.create({
          data: {
            user_id: staff.user_id,
            grievance_id: grievanceId,
            notification_type: "SLA_AT_RISK",
            channel: "IN_APP",
            title: `SLA Warning: 75% Consumed (${grievance.grievance_number})`,
            message: `Grievance ${grievance.grievance_number} has consumed 75% of its resolution SLA (${consumptionPercent}% consumed) and is now marked AT RISK. Your Department Head has been alerted. Please expedite investigation and resolution.`,
            status: "PENDING",
            created_at: evaluationDate,
          },
        });
      }

      if (unnotifiedStaffAtRisk.length > 0) {
        notificationsSent.push("SLA_75_STAFF_WARNING");
      }

      if (unnotifiedHeads.length > 0 || unnotifiedStaffAtRisk.length > 0) {
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
              departmentHeads: unnotifiedHeads
                .map((h) => `${h.first_name} ${h.last_name || ""}`.trim())
                .join(", "),
              assignedStaff: unnotifiedStaffAtRisk
                .map((s) => `${s.first_name} ${s.last_name || ""}`.trim())
                .join(", "),
              reassignedAutomatically: false,
              note: "75% SLA warning: Marked AT_RISK. Both Department Heads and Assigned Staff alerted.",
            },
          },
        });
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
      message: `75% SLA threshold reached (${consumptionPercent}%). Marked AT_RISK. Both Department Heads and Assigned Staff alerted for review without auto-reassignment.`,
    };
  }

  // =========================================================================
  // RULE 3.5: At 90% SLA consumption (>= 90% and < 100%)
  // Automatically notify Department Heads and Assigned Staff that the grievance is Urgent.
  // =========================================================================
  if (consumptionPercent >= 90 && consumptionPercent < 100) {
    updatedSlaStatus = "AT_RISK";

    const unnotifiedUrgentHeads = allDeptHeads.filter(
      (head) => !hasSentToUser(head.user_id, "SLA_URGENT")
    );

    const unnotifiedUrgentStaff = assignedStaffList.filter(
      (staff) =>
        !hasSentToUser(staff.user_id, "SLA_URGENT") &&
        !hasSentToUser(staff.user_id, "SLA_90_STAFF_WARNING")
    );

    if (unnotifiedUrgentHeads.length > 0 || unnotifiedUrgentStaff.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const head of unnotifiedUrgentHeads) {
          await tx.notifications.create({
            data: {
              user_id: head.user_id,
              grievance_id: grievanceId,
              notification_type: "SLA_URGENT",
              channel: "IN_APP",
              title: `SLA Urgent: 90% Consumed (${grievance.grievance_number})`,
              message: `Grievance ${grievance.grievance_number} has reached 90% of its resolution SLA (${consumptionPercent}% consumed). Immediate action is required before breach.`,
              status: "PENDING",
              created_at: evaluationDate,
            },
          });
        }

        for (const staff of unnotifiedUrgentStaff) {
          await tx.notifications.create({
            data: {
              user_id: staff.user_id,
              grievance_id: grievanceId,
              notification_type: "SLA_URGENT",
              channel: "IN_APP",
              title: `Critical SLA Warning: 90% Consumed (${grievance.grievance_number})`,
              message: `Grievance ${grievance.grievance_number} has consumed 90% of its SLA deadline (${consumptionPercent}% consumed). Only 10% time remains before breach and formal escalation. Please finalize resolution immediately.`,
              status: "PENDING",
              created_at: evaluationDate,
            },
          });
        }

        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: null,
            action: "SLA_90_PERCENT_URGENT_ALERT",
            entity_type: "grievance",
            entity_id: grievanceId,
            new_value: {
              consumptionPercent,
              threshold: "90%",
              slaStatus: "AT_RISK",
              departmentHeads: unnotifiedUrgentHeads
                .map((h) => `${h.first_name} ${h.last_name || ""}`.trim())
                .join(", "),
              assignedStaff: unnotifiedUrgentStaff
                .map((s) => `${s.first_name} ${s.last_name || ""}`.trim())
                .join(", "),
              note: "90% SLA urgent warning: Both Department Heads and Assigned Staff alerted.",
            },
          },
        });
      });

      if (unnotifiedUrgentHeads.length > 0) notificationsSent.push("SLA_URGENT");
      if (unnotifiedUrgentStaff.length > 0) notificationsSent.push("SLA_90_STAFF_WARNING");
    }

    return {
      grievanceId: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      consumptionPercent,
      threshold: "AT_75",
      slaStatus: "AT_RISK",
      status: grievance.status,
      notificationsSent,
      escalated: false,
      message: `90% SLA threshold reached (${consumptionPercent}%). Marked AT_RISK. Both Department Heads and Assigned Staff alerted with URGENT priority.`,
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

    await prisma.$transaction(async (tx) => {
      // 1. Update grievance status to ESCALATED and sla_status to BREACHED
      if (grievance.status !== "ESCALATED" || grievance.sla_status !== "BREACHED") {
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            sla_status: "BREACHED",
            status: "ESCALATED",
            updated_at: evaluationDate,
          },
        });
      }

      // 2. Create escalation record if not exists
      const existingEscalation = await tx.escalations.findFirst({
        where: { grievance_id: grievanceId },
      });

      if (!existingEscalation && primaryDeptHead) {
        await tx.escalations.create({
          data: {
            grievance_id: grievanceId,
            escalated_to: primaryDeptHead.user_id,
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
            changed_by: primaryDeptHead?.user_id || grievance.submitted_by,
            remarks: `Automated SLA Breach (100% consumed). Moved to ESCALATED status for HOD intervention.`,
            changed_at: evaluationDate,
          },
        });
      }

      // 4. Send Breach Notification to ALL Department Heads
      const unnotifiedBreachHeads = allDeptHeads.filter(
        (head) =>
          !hasSentToUser(head.user_id, "SLA_100_BREACH_ESCALATED") &&
          !hasSentToUser(head.user_id, "SLA_BREACHED")
      );

      for (const head of unnotifiedBreachHeads) {
        await tx.notifications.create({
          data: {
            user_id: head.user_id,
            grievance_id: grievanceId,
            notification_type: "SLA_BREACHED",
            channel: "IN_APP",
            title: `CRITICAL: SLA Breached & Escalated (${grievance.grievance_number})`,
            message: `Grievance ${grievance.grievance_number} has consumed 100% of its SLA deadline without resolution. Marked SLA BREACHED and moved to ESCALATED. Executive intervention required.`,
            status: "PENDING",
            created_at: evaluationDate,
          },
        });
      }

      if (unnotifiedBreachHeads.length > 0) {
        notificationsSent.push("SLA_BREACHED");
      }

      // 5. Send Notification to ALL Assigned Staff Members
      const unnotifiedStaffBreach = assignedStaffList.filter(
        (staff) =>
          !hasSentToUser(staff.user_id, "SLA_100_BREACH_STAFF") &&
          !hasSentToUser(staff.user_id, "SLA_BREACHED")
      );

      for (const staff of unnotifiedStaffBreach) {
        await tx.notifications.create({
          data: {
            user_id: staff.user_id,
            grievance_id: grievanceId,
            notification_type: "SLA_100_BREACH_STAFF",
            channel: "IN_APP",
            title: `SLA Breached: Grievance Escalated (${grievance.grievance_number})`,
            message: `Grievance ${grievance.grievance_number} has breached its resolution SLA deadline and has been escalated to your Department Head.`,
            status: "PENDING",
            created_at: evaluationDate,
          },
        });
      }

      if (unnotifiedStaffBreach.length > 0) {
        notificationsSent.push("SLA_100_BREACH_STAFF");
      }

      // 6. Log in Audit Trail if not already logged
      const existingBreachLog = await tx.audit_logs.findFirst({
        where: {
          grievance_id: grievanceId,
          action: "SLA_100_BREACH_ESCALATED",
        },
      });

      if (!existingBreachLog) {
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
              slaStatus: "BREACHED",
              status: "ESCALATED",
              escalatedTo: primaryDeptHead
                ? `${primaryDeptHead.first_name} ${primaryDeptHead.last_name || ""}`.trim()
                : "Department Head",
              notifiedHeads: allDeptHeads
                .map((h) => `${h.first_name} ${h.last_name || ""}`.trim())
                .join(", "),
              notifiedStaff: assignedStaffList
                .map((s) => `${s.first_name} ${s.last_name || ""}`.trim())
                .join(", "),
            },
          },
        });
      }
    });

    return {
      grievanceId: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      consumptionPercent,
      threshold: "AT_100_BREACH",
      slaStatus: "BREACHED",
      status: "ESCALATED",
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
