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

import {
  DEFAULT_SLA_DURATIONS_MINUTES,
  DEFAULT_SLA_THRESHOLDS,
} from "@/lib/constants/sla";

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
      DEFAULT_SLA_DURATIONS_MINUTES[priority.toUpperCase()] ||
      DEFAULT_SLA_DURATIONS_MINUTES.MEDIUM;
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
          grievance_departments: true,
        },
      },
      notifications: {
        select: {
          user_id: true,
          notification_type: true,
        },
      },
      sla_tracking: {
        include: {
          sla_policies: true,
        },
        orderBy: { sla_tracking_id: "desc" },
        take: 1,
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
      assignments: {
        include: {
          users_assignments_staff_idTousers: true,
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
    (r) => r.involvement_type === "PRIMARY",
  );
  const primaryDeptHead =
    primaryRecord?.departments?.users?.[0] || allDeptHeads[0];

  // Ignore terminal closed, resolved, or under-review grievances
  const terminalStatuses = ["CLOSED", "RESOLVED", "REJECTED", "UNDER_REVIEW"];
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
  const _existingNotificationTypes = new Set(
    existingNotifications.map((n) => n.notification_type),
  );

  const hasSentToUser = (userId: bigint, type: string) =>
    existingNotifications.some(
      (n) => n.user_id === userId && n.notification_type === type,
    );

  // Staff assigned to departments that are NOT blocked
  const assignedStaffList = (grievance.assignments || [])
    .filter((a) => a.grievance_departments?.status !== "BLOCKED")
    .map((a) => a.users_assignments_staff_idTousers)
    .filter((s): s is NonNullable<typeof s> => s !== null);
  const _assignedStaff = assignedStaffList[0];

  // Unblocked department records & heads
  const unblockedDeptRecords = involvedDeptRecords.filter(
    (r) => r.status !== "BLOCKED",
  );
  const supportingDeptHeads = unblockedDeptRecords
    .filter((r) => r.involvement_type !== "PRIMARY")
    .flatMap((r) => r.departments?.users || []);
  const unblockedAllDeptHeads = unblockedDeptRecords.flatMap(
    (r) => r.departments?.users || [],
  );

  const notificationsSent: string[] = [];
  let updatedSlaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED" = "ON_TRACK";
  let updatedStatus = grievance.status;
  let didEscalate = false;

  // Resolve dynamic thresholds from policy or system defaults
  const activeSlaPolicy =
    grievance.sla_tracking?.[0]?.sla_policies ||
    (await prisma.sla_policies.findFirst({
      where: {
        priority_level: grievance.priority,
        status: "ACTIVE",
      },
    }));

  const tc =
    (activeSlaPolicy?.trigger_condition as Record<string, unknown>) || {};

  const staffNudgeThreshold = tc.warning_threshold_percent
    ? Number(tc.warning_threshold_percent)
    : DEFAULT_SLA_THRESHOLDS.STAFF_NUDGE_PERCENT;

  const warningThreshold = tc.at_risk_threshold_percent
    ? Number(tc.at_risk_threshold_percent)
    : activeSlaPolicy
      ? Number(activeSlaPolicy.warning_threshold_percent)
      : DEFAULT_SLA_THRESHOLDS.WARNING_PERCENT;

  const urgentThreshold = tc.critical_threshold_percent
    ? Number(tc.critical_threshold_percent)
    : DEFAULT_SLA_THRESHOLDS.URGENT_PERCENT;

  const escalationThreshold = tc.escalation_threshold_percent
    ? Number(tc.escalation_threshold_percent)
    : activeSlaPolicy
      ? Number(activeSlaPolicy.escalation_threshold_percent)
      : DEFAULT_SLA_THRESHOLDS.ESCALATION_BREACH_PERCENT;

  const recipientsConfig =
    (tc.notification_recipients as {
      warning?: string[];
      at_risk?: string[];
      critical?: string[];
      escalation?: string[];
    }) || {};

  const warningDesignations = recipientsConfig.warning || ["ASSIGNED_STAFF"];
  const atRiskDesignations = recipientsConfig.at_risk || [
    "ASSIGNED_STAFF",
    "ALL_DEPT_HEADS",
  ];
  const urgentDesignations = recipientsConfig.critical || [
    "ASSIGNED_STAFF",
    "ALL_DEPT_HEADS",
  ];
  const escalationDesignations = recipientsConfig.escalation || [
    "PRIMARY_DEPT_HEAD",
    "ALL_DEPT_HEADS",
  ];

  type RecipientUser = {
    user_id: bigint;
    first_name: string;
    last_name: string | null;
    email: string;
  };

  const resolveDesignatedUsers = async (
    designations: string[],
  ): Promise<RecipientUser[]> => {
    const userMap = new Map<string, RecipientUser>();
    for (const d of designations) {
      if (d === "ASSIGNED_STAFF") {
        for (const s of assignedStaffList) {
          userMap.set(s.user_id.toString(), s);
        }
      } else if (d === "PRIMARY_DEPT_HEAD") {
        if (primaryDeptHead) {
          userMap.set(primaryDeptHead.user_id.toString(), primaryDeptHead);
        }
      } else if (d === "SUPPORTING_DEPT_HEAD") {
        for (const s of supportingDeptHeads) {
          userMap.set(s.user_id.toString(), s);
        }
      } else if (d === "ALL_DEPT_HEADS") {
        for (const h of unblockedAllDeptHeads) {
          userMap.set(h.user_id.toString(), h);
        }
      } else if (d === "ADMIN") {
        const admins = await prisma.users.findMany({
          where: { roles: { role_name: "ADMIN" }, status: "ACTIVE" },
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        });
        for (const a of admins) {
          userMap.set(a.user_id.toString(), a);
        }
      }
    }
    return Array.from(userMap.values());
  };

  // =========================================================================
  // DEPARTMENT-LEVEL SLA EVALUATION & NOTIFICATIONS
  // Evaluates each active department against its allocated SLA percentage
  // (e.g. 30% allocated to HR -> when 15% of total time has elapsed, HR is at 50% consumed)
  // =========================================================================
  for (const deptRec of involvedDeptRecords) {
    if (
      deptRec.status === "BLOCKED" ||
      deptRec.status === "COMPLETED" ||
      deptRec.status === "RESOLVED" ||
      deptRec.status === "REMOVED"
    ) {
      continue;
    }

    const deptName = deptRec.departments?.department_name || "Department";
    const percentAlloc = deptRec.sla_percent_allocation
      ? Number(deptRec.sla_percent_allocation)
      : 100;

    const totalGrievanceMinutes =
      calculateSlaConsumption(
        grievance.created_at,
        grievance.due_at,
        grievance.priority || "MEDIUM",
        evaluationDate,
      ).totalDurationMinutes || 1440;

    const deptAllocatedMinutes =
      deptRec.allocated_duration_minutes &&
      deptRec.allocated_duration_minutes > 0
        ? deptRec.allocated_duration_minutes
        : Math.max(1, Math.round((totalGrievanceMinutes * percentAlloc) / 100));

    const activatedAt =
      deptRec.activated_at || deptRec.assigned_at || grievance.created_at;

    const deptDueAt =
      deptRec.due_at ||
      new Date(activatedAt.getTime() + deptAllocatedMinutes * 60 * 1000);

    const deptSlaResult = calculateDepartmentSlaConsumption(
      activatedAt,
      deptDueAt,
      deptAllocatedMinutes,
      deptRec.completed_at,
      evaluationDate,
    );

    const deptConsumptionPercent = deptSlaResult.consumptionPercent;
    const deptAssignedStaff =
      deptRec.assignments?.users_assignments_staff_idTousers ||
      grievance.assignments?.find(
        (a) =>
          a.grievance_department_id === deptRec.grievance_department_id ||
          a.grievance_departments?.department_id === deptRec.department_id,
      )?.users_assignments_staff_idTousers;
    const deptHeads = deptRec.departments?.users || [];

    // 1. Department 50% Threshold (Nudge assigned staff)
    if (deptConsumptionPercent >= 50 && deptConsumptionPercent < 75) {
      if (deptAssignedStaff) {
        const notifType = `DEPT_SLA_50_${deptRec.department_id}`;
        if (!hasSentToUser(deptAssignedStaff.user_id, notifType)) {
          await prisma.$transaction(async (tx) => {
            await tx.notifications.create({
              data: {
                user_id: deptAssignedStaff.user_id,
                grievance_id: grievanceId,
                notification_type: notifType,
                channel: "IN_APP",
                title: `Priority Nudge: 50% Department SLA Consumed (${deptName})`,
                message: `Grievance ${grievance.grievance_number} has reached 50% of its allocated SLA time in ${deptName} (${deptConsumptionPercent}% consumed of ${percentAlloc}% allocated budget). Please prioritize investigation and findings.`,
                status: "PENDING",
                created_at: evaluationDate,
              },
            });
            await tx.audit_logs.create({
              data: {
                grievance_id: grievanceId,
                user_id: null,
                action: "DEPARTMENT_SLA_50_PERCENT_WARNING",
                entity_type: "grievance_department",
                entity_id: deptRec.grievance_department_id,
                new_value: {
                  department: deptName,
                  consumptionPercent: deptConsumptionPercent,
                  allocatedPercent: percentAlloc,
                  threshold: "50%",
                  notifiedStaff:
                    `${deptAssignedStaff.first_name} ${deptAssignedStaff.last_name || ""}`.trim(),
                },
              },
            });
          });
          existingNotifications.push({
            user_id: deptAssignedStaff.user_id,
            notification_type: notifType,
          });
          notificationsSent.push(notifType);
        }
      }
    }

    // 2. Department 75% Threshold (Alert staff + Department Head, mark department AT_RISK)
    if (deptConsumptionPercent >= 75 && deptConsumptionPercent < 100) {
      if (deptRec.sla_status !== "AT_RISK") {
        await prisma.grievance_departments.update({
          where: { grievance_department_id: deptRec.grievance_department_id },
          data: { sla_status: "AT_RISK" },
        });
      }

      const notifType = `DEPT_SLA_75_${deptRec.department_id}`;
      const recipientsToNotify = [
        ...(deptAssignedStaff ? [deptAssignedStaff] : []),
        ...deptHeads,
      ].filter((u) => !hasSentToUser(u.user_id, notifType));

      if (recipientsToNotify.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const u of recipientsToNotify) {
            await tx.notifications.create({
              data: {
                user_id: u.user_id,
                grievance_id: grievanceId,
                notification_type: notifType,
                channel: "IN_APP",
                title: `SLA At Risk: 75% Department SLA Consumed (${deptName})`,
                message: `Grievance ${grievance.grievance_number} has reached 75% of its allocated SLA in ${deptName} (${deptConsumptionPercent}% consumed of ${percentAlloc}% allocated budget). Expedite inquiry to avoid department SLA breach.`,
                status: "PENDING",
                created_at: evaluationDate,
              },
            });
          }
          await tx.audit_logs.create({
            data: {
              grievance_id: grievanceId,
              user_id: null,
              action: "DEPARTMENT_SLA_75_PERCENT_WARNING",
              entity_type: "grievance_department",
              entity_id: deptRec.grievance_department_id,
              new_value: {
                department: deptName,
                consumptionPercent: deptConsumptionPercent,
                allocatedPercent: percentAlloc,
                threshold: "75%",
                slaStatus: "AT_RISK",
              },
            },
          });
        });
        for (const u of recipientsToNotify) {
          existingNotifications.push({
            user_id: u.user_id,
            notification_type: notifType,
          });
        }
        notificationsSent.push(notifType);
      }
    }

    // 3. Department 100% Threshold (Mark department BREACHED, alert staff & HOD)
    if (deptConsumptionPercent >= 100) {
      if (deptRec.sla_status !== "BREACHED") {
        await prisma.grievance_departments.update({
          where: { grievance_department_id: deptRec.grievance_department_id },
          data: { sla_status: "BREACHED" },
        });
      }

      const notifType = `DEPT_SLA_BREACH_${deptRec.department_id}`;
      const recipientsToNotify = [
        ...(deptAssignedStaff ? [deptAssignedStaff] : []),
        ...deptHeads,
      ].filter((u) => !hasSentToUser(u.user_id, notifType));

      if (recipientsToNotify.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const u of recipientsToNotify) {
            await tx.notifications.create({
              data: {
                user_id: u.user_id,
                grievance_id: grievanceId,
                notification_type: notifType,
                channel: "IN_APP",
                title: `CRITICAL: Department SLA Breached (${deptName})`,
                message: `Grievance ${grievance.grievance_number} has consumed 100% of its allocated SLA in ${deptName} (${deptConsumptionPercent}% consumed of ${percentAlloc}% allocated budget). Immediate intervention required.`,
                status: "PENDING",
                created_at: evaluationDate,
              },
            });
          }
        });
        for (const u of recipientsToNotify) {
          existingNotifications.push({
            user_id: u.user_id,
            notification_type: notifType,
          });
        }
        notificationsSent.push(notifType);
      }
    }
  }

  // =========================================================================
  // RULE 1: Below Staff Nudge threshold → Normal processing
  // =========================================================================
  if (consumptionPercent < staffNudgeThreshold) {
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
      message: `SLA consumption is below ${staffNudgeThreshold}%. Normal operational processing.`,
    };
  }

  // =========================================================================
  // RULE 2: At Staff Nudge threshold (>= staffNudgeThreshold and < warningThreshold)
  // Automatically notify the assigned staff members to prioritize the grievance.
  // =========================================================================
  if (
    consumptionPercent >= staffNudgeThreshold &&
    consumptionPercent < warningThreshold
  ) {
    updatedSlaStatus = "ON_TRACK";

    const targetUsers = await resolveDesignatedUsers(warningDesignations);
    const unnotifiedUsers = targetUsers.filter(
      (u) =>
        !hasSentToUser(u.user_id, "SLA_HALF_TIME") &&
        !hasSentToUser(u.user_id, "SLA_50_STAFF_WARNING"),
    );

    if (unnotifiedUsers.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const u of unnotifiedUsers) {
          await tx.notifications.create({
            data: {
              user_id: u.user_id,
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
              notifiedRecipients: unnotifiedUsers
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
      message: `50% SLA threshold reached (${consumptionPercent}%). Designated recipients notified.`,
    };
  }

  // =========================================================================
  // RULE 3: At Warning threshold (>= warningThreshold and < urgentThreshold)
  // Automatically notify Department Heads and Staff that the grievance is at SLA risk.
  // =========================================================================
  if (
    consumptionPercent >= warningThreshold &&
    consumptionPercent < urgentThreshold
  ) {
    updatedSlaStatus = "AT_RISK";

    await prisma.$transaction(async (tx) => {
      // 1. Update sla_status to AT_RISK
      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: { sla_status: "AT_RISK" },
      });

      // 2. Dispatch notifications to configured designations
      const targetUsers = await resolveDesignatedUsers(atRiskDesignations);
      const unnotifiedUsers = targetUsers.filter(
        (u) =>
          !hasSentToUser(u.user_id, "SLA_75_HOD_WARNING") &&
          !hasSentToUser(u.user_id, "SLA_75_STAFF_WARNING") &&
          !hasSentToUser(u.user_id, "SLA_AT_RISK") &&
          !hasSentToUser(u.user_id, "SLA_WARNING"),
      );

      for (const u of unnotifiedUsers) {
        await tx.notifications.create({
          data: {
            user_id: u.user_id,
            grievance_id: grievanceId,
            notification_type: "SLA_AT_RISK",
            channel: "IN_APP",
            title: `SLA At Risk: 75% Consumed (${grievance.grievance_number})`,
            message: `Grievance ${grievance.grievance_number} has reached 75% of its resolution SLA (${consumptionPercent}% consumed). Review required: expedite investigation and resolution.`,
            status: "PENDING",
            created_at: evaluationDate,
          },
        });
      }

      if (unnotifiedUsers.length > 0) {
        notificationsSent.push("SLA_AT_RISK");
      }

      if (unnotifiedUsers.length > 0) {
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
              notifiedRecipients: unnotifiedUsers
                .map((h) => `${h.first_name} ${h.last_name || ""}`.trim())
                .join(", "),
              reassignedAutomatically: false,
              note: "75% SLA warning: Marked AT_RISK. Designated recipients alerted.",
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
      message: `75% SLA threshold reached (${consumptionPercent}%). Marked AT_RISK. Designated recipients alerted.`,
    };
  }

  // =========================================================================
  // RULE 3.5: At Urgent threshold (>= urgentThreshold and < escalationThreshold)
  // Automatically notify Department Heads and Assigned Staff that the grievance is Urgent.
  // =========================================================================
  if (
    consumptionPercent >= urgentThreshold &&
    consumptionPercent < escalationThreshold
  ) {
    updatedSlaStatus = "AT_RISK";

    const targetUsers = await resolveDesignatedUsers(urgentDesignations);
    const unnotifiedUsers = targetUsers.filter(
      (u) =>
        !hasSentToUser(u.user_id, "SLA_URGENT") &&
        !hasSentToUser(u.user_id, "SLA_90_STAFF_WARNING"),
    );

    if (unnotifiedUsers.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const u of unnotifiedUsers) {
          await tx.notifications.create({
            data: {
              user_id: u.user_id,
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
              notifiedRecipients: unnotifiedUsers
                .map((h) => `${h.first_name} ${h.last_name || ""}`.trim())
                .join(", "),
              note: "90% SLA urgent warning: Designated recipients alerted with URGENT priority.",
            },
          },
        });
      });

      notificationsSent.push("SLA_URGENT");
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
      message: `90% SLA threshold reached (${consumptionPercent}%). Marked AT_RISK. Designated recipients alerted with URGENT priority.`,
    };
  }

  // =========================================================================
  // RULE 4: At Escalation threshold (>= escalationThreshold)
  // Mark the grievance as SLA BREACHED and move it to Escalated status.
  // Triggered ONCE per grievance.
  // =========================================================================
  if (consumptionPercent >= escalationThreshold) {
    updatedSlaStatus = "BREACHED";
    updatedStatus = grievance.status;

    await prisma.$transaction(async (tx) => {
      // 1. Update grievance status to ESCALATED and sla_status to BREACHED
      const isEligibleForEscalation =
        grievance.status !== "ESCALATED" &&
        grievance.status !== "CLOSED" &&
        grievance.status !== "RESOLVED" &&
        grievance.status !== "UNDER_REVIEW";

      if (isEligibleForEscalation || grievance.sla_status !== "BREACHED") {
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            sla_status: "BREACHED",
            ...(isEligibleForEscalation ? { status: "ESCALATED" } : {}),
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

      // 4. Send Breach Notification to designated escalation recipients
      const targetUsers = await resolveDesignatedUsers(escalationDesignations);
      const unnotifiedUsers = targetUsers.filter(
        (u) =>
          !hasSentToUser(u.user_id, "SLA_100_BREACH_ESCALATED") &&
          !hasSentToUser(u.user_id, "SLA_BREACHED") &&
          !hasSentToUser(u.user_id, "SLA_100_BREACH_STAFF"),
      );

      for (const u of unnotifiedUsers) {
        await tx.notifications.create({
          data: {
            user_id: u.user_id,
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

      if (unnotifiedUsers.length > 0) {
        notificationsSent.push("SLA_BREACHED");
      }

      // 5. Log in Audit Trail if not already logged
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
              notifiedRecipients: unnotifiedUsers
                .map((h) => `${h.first_name} ${h.last_name || ""}`.trim())
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

const lastEvaluationByDept = new Map<string, number>();
const SLA_EVAL_COOLDOWN_MS = 60 * 1000; // 60 seconds debounce

/**
 * Batch evaluates all active, non-terminal grievances across the system.
 */
export async function evaluateAllActiveGrievancesSla(
  departmentId?: bigint,
  force: boolean = false,
): Promise<{ totalEvaluated: number; results: SlaEvaluationResult[] }> {
  const deptKey = departmentId ? departmentId.toString() : "ALL";
  const now = Date.now();
  const lastEval = lastEvaluationByDept.get(deptKey) || 0;

  if (!force && now - lastEval < SLA_EVAL_COOLDOWN_MS) {
    return { totalEvaluated: 0, results: [] };
  }

  lastEvaluationByDept.set(deptKey, now);

  const activeGrievances = await prisma.grievances.findMany({
    where: {
      status: {
        notIn: ["CLOSED", "RESOLVED", "REJECTED"],
      },
      ...(departmentId
        ? {
            grievance_departments: {
              some: {
                department_id: departmentId,
              },
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

/**
 * Calculates SLA consumption for an individual grievance department.
 * Blocked departments return 0% consumption and ON_TRACK.
 * Elapsed time is measured strictly from activated_at (or frozen at completedAt).
 */
export function calculateDepartmentSlaConsumption(
  activatedAt: Date | null,
  dueAt: Date | null,
  allocatedDurationMinutes: number,
  completedAt?: Date | null,
  now: Date = new Date(),
): {
  totalDurationMinutes: number;
  elapsedMinutes: number;
  consumptionPercent: number;
  slaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED";
} {
  if (!activatedAt) {
    return {
      totalDurationMinutes: allocatedDurationMinutes,
      elapsedMinutes: 0,
      consumptionPercent: 0,
      slaStatus: "ON_TRACK",
    };
  }

  const effectiveEnd = completedAt || now;
  const elapsedMs = Math.max(0, effectiveEnd.getTime() - activatedAt.getTime());
  const elapsedMinutes = Math.round(elapsedMs / (60 * 1000));

  let totalDuration = allocatedDurationMinutes;
  if (dueAt) {
    const diff = Math.round(
      (dueAt.getTime() - activatedAt.getTime()) / (60 * 1000),
    );
    if (diff > 0) totalDuration = diff;
  }

  if (totalDuration <= 0) {
    return {
      totalDurationMinutes: 0,
      elapsedMinutes,
      consumptionPercent: 100,
      slaStatus: "BREACHED",
    };
  }

  const rawPercent = (elapsedMinutes / totalDuration) * 100;
  const consumptionPercent = Math.min(Math.round(rawPercent * 10) / 10, 999);

  let slaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED" = "ON_TRACK";
  if (consumptionPercent >= 100) {
    slaStatus = "BREACHED";
  } else if (consumptionPercent >= 75) {
    slaStatus = "AT_RISK";
  }

  return {
    totalDurationMinutes: totalDuration,
    elapsedMinutes,
    consumptionPercent,
    slaStatus,
  };
}
