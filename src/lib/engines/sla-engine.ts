import type { Prisma } from "@prisma/client";
import type { PoolClient } from "pg";
import { pool, prisma } from "@/lib/prisma";
import type { NotificationType } from "@/lib/services/notification.service";

export interface SlaEvaluationResult {
  grievanceId: string;
  grievanceNumber: string;
  consumptionPercent: number;
  threshold:
    | "BELOW_WARNING"
    | "AT_WARNING"
    | "AT_RISK"
    | "AT_CRITICAL"
    | "AT_BREACH";
  slaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED";
  status: string;
  notificationsSent: string[];
  escalated: boolean;
  message: string;
}

import {
  calculateReopenedSlaMinutes,
  calculateReworkSlaMinutes,
  DEFAULT_REOPENED_SLA_PERCENT,
  DEFAULT_REWORK_SLA_PERCENT,
  DEFAULT_SLA_DURATIONS_MINUTES,
  DEFAULT_SLA_THRESHOLDS,
  MAX_APPROVED_EXTENSIONS_LIFECYCLE,
} from "@/lib/constants/sla";

/**
 * Calculates the exact SLA consumption percentage for a grievance.
 * Accounts for accumulated paused minutes and freezes elapsed time when currently paused.
 */
export function calculateSlaConsumption(
  createdAt: Date | string,
  dueAt: Date | string | null,
  priority: string = "MEDIUM",
  now: Date = new Date(),
  accumulatedPausedMinutes: number = 0,
  pausedAt?: Date | string | null,
): {
  totalDurationMinutes: number;
  elapsedMinutes: number;
  consumptionPercent: number;
} {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const nowTime = now instanceof Date ? now : new Date(now);
  const effectiveNow = pausedAt
    ? pausedAt instanceof Date
      ? pausedAt
      : new Date(pausedAt)
    : nowTime;

  let effectiveDue = dueAt
    ? dueAt instanceof Date
      ? dueAt
      : new Date(dueAt)
    : null;

  if (!effectiveDue || Number.isNaN(effectiveDue.getTime())) {
    const mins =
      DEFAULT_SLA_DURATIONS_MINUTES[priority.toUpperCase()] ||
      DEFAULT_SLA_DURATIONS_MINUTES.MEDIUM;
    effectiveDue = new Date(created.getTime() + mins * 60 * 1000);
  }

  const rawTotalMs = effectiveDue.getTime() - created.getTime();
  const pausedMs = Math.max(0, (accumulatedPausedMinutes || 0) * 60 * 1000);
  const totalMs = Math.max(1, rawTotalMs - pausedMs);
  if (totalMs <= 0) {
    return {
      totalDurationMinutes: 0,
      elapsedMinutes: 0,
      consumptionPercent: 100,
    };
  }

  const rawElapsedMs = Math.max(0, effectiveNow.getTime() - created.getTime());
  const activeElapsedMs = Math.max(0, rawElapsedMs - pausedMs);

  const totalDurationMinutes = Math.round(totalMs / (60 * 1000));
  const elapsedMinutes = Math.round(activeElapsedMs / (60 * 1000));
  const rawPercent = (activeElapsedMs / totalMs) * 100;
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
  if (!isSchemaEnsured) {
    await ensureRequiredDatabaseSchema();
  }
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
          created_at: true,
        },
      },
      sla_tracking: {
        include: {
          sla_policies: true,
          sla_pause_logs: true,
          sla_extensions: {
            where: { status: "APPROVED" },
          },
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
      threshold: "BELOW_WARNING",
      slaStatus:
        (grievance.sla_status as "ON_TRACK" | "AT_RISK" | "BREACHED") ||
        "ON_TRACK",
      status: grievance.status,
      notificationsSent: [],
      escalated: false,
      message: "Grievance is in terminal state; SLA monitoring skipped.",
    };
  }

  // Skip milestone evaluations and notifications while SLA clock is paused or awaiting approval
  const pausedStatuses = [
    "AWAITING_INFORMATION",
    "WAITING_ON_USER",
    "WAITING_ON_EMPLOYEE",
    "RESOLUTION_PENDING_APPROVAL",
    "UNDER_REVIEW",
  ];
  const activeTrackingEarly = grievance.sla_tracking?.[0];
  if (
    pausedStatuses.includes(grievance.status) ||
    activeTrackingEarly?.paused_at
  ) {
    return {
      grievanceId: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      consumptionPercent: 0,
      threshold: "BELOW_WARNING",
      slaStatus:
        (grievance.sla_status as "ON_TRACK" | "AT_RISK" | "BREACHED") ||
        "ON_TRACK",
      status: grievance.status,
      notificationsSent: [],
      escalated: false,
      message: "Grievance is paused; SLA monitoring skipped.",
    };
  }

  const activeTracking = grievance.sla_tracking?.[0];
  const accPaused = activeTracking?.accumulated_paused_minutes || 0;
  const isPaused =
    activeTracking?.paused_at ||
    (grievance.status === "WAITING_ON_USER" ||
    grievance.status === "WAITING_ON_EMPLOYEE"
      ? evaluationDate
      : null);

  // Resolve dynamic active policy from priority level
  const activeSlaPolicy =
    (await prisma.sla_policies.findFirst({
      where: {
        priority_level: grievance.priority,
        status: "ACTIVE",
        sla_type: "RESOLUTION",
      },
      orderBy: { updated_at: "desc" },
    })) ||
    (await prisma.sla_policies.findFirst({
      where: {
        priority_level: grievance.priority,
        status: "ACTIVE",
      },
      orderBy: { updated_at: "desc" },
    })) ||
    grievance.sla_tracking?.[0]?.sla_policies ||
    null;

  const rawStart = activeTracking?.started_at || grievance.created_at;
  const effectiveStart =
    rawStart instanceof Date
      ? rawStart
      : rawStart
        ? new Date(rawStart)
        : new Date();
  let effectiveDue = activeTracking?.due_at || grievance.due_at;

  const isReworkCycle =
    activeTracking?.cycle_type === "REWORK" || grievance.status === "REWORK";

  const approvedExtensions = (activeTracking?.sla_extensions || []).filter(
    (e) => e.status === "APPROVED",
  );
  const latestApprovedExt = approvedExtensions.sort(
    (a, b) =>
      new Date(b.reviewed_at || 0).getTime() -
      new Date(a.reviewed_at || 0).getTime(),
  )[0];
  const extensionApprovedAt = latestApprovedExt?.reviewed_at
    ? new Date(latestApprovedExt.reviewed_at)
    : null;

  // If dynamic active policy exists and no manual extensions were applied, dynamically compute due based on configured duration
  if (
    activeSlaPolicy?.target_duration_minutes &&
    approvedExtensions.length === 0
  ) {
    const effectivePolicyMinutes = isReworkCycle
      ? Math.max(1, Math.round(activeSlaPolicy.target_duration_minutes * 0.5))
      : activeSlaPolicy.target_duration_minutes;

    const policyDue = new Date(
      effectiveStart.getTime() + effectivePolicyMinutes * 60 * 1000,
    );
    effectiveDue = policyDue;
  }

  const slaConsumption = calculateSlaConsumption(
    effectiveStart,
    effectiveDue,
    grievance.priority,
    evaluationDate,
    accPaused,
    isPaused,
  );
  const { consumptionPercent } = slaConsumption;

  const grievanceNotifBaseTime =
    extensionApprovedAt && extensionApprovedAt > effectiveStart
      ? extensionApprovedAt
      : effectiveStart;

  const cycleNotifications = (grievance.notifications || []).filter(
    (n) => !n.created_at || new Date(n.created_at) >= effectiveStart,
  );
  const existingNotifications: Array<{
    user_id: bigint;
    notification_type: string;
    created_at?: Date | null;
  }> = [...cycleNotifications];
  const _existingNotificationTypes = new Set(
    existingNotifications.map((n) => n.notification_type),
  );

  const hasSentToUser = (userId: bigint, type: string) =>
    existingNotifications.some(
      (n) =>
        n.user_id === userId &&
        n.notification_type === type &&
        (!n.created_at || new Date(n.created_at) >= grievanceNotifBaseTime),
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

  const primaryDeptName =
    primaryRecord?.departments?.department_name || "Department";

  const notificationsSent: string[] = [];
  let updatedSlaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED" = "ON_TRACK";
  let updatedStatus = grievance.status;
  let didEscalate = false;

  const tc =
    (activeSlaPolicy?.trigger_condition as Record<string, unknown>) || {};

  const warningThreshold = Number(
    tc.warning_threshold_percent ||
      activeSlaPolicy?.warning_threshold_percent ||
      DEFAULT_SLA_THRESHOLDS.WARNING_PERCENT,
  );

  const atRiskThreshold = Number(
    tc.at_risk_threshold_percent ||
      activeSlaPolicy?.escalation_threshold_percent ||
      DEFAULT_SLA_THRESHOLDS.AT_RISK_PERCENT,
  );

  const breachThreshold = Number(
    tc.breach_threshold_percent ||
      tc.breach_at_percent ||
      DEFAULT_SLA_THRESHOLDS.BREACH_PERCENT,
  );

  const recipientsConfig =
    (tc.notification_recipients as {
      warning?: string[];
      at_risk?: string[];
      escalation?: string[];
    }) || {};

  const warningDesignations = recipientsConfig.warning || ["ASSIGNED_STAFF"];
  const atRiskDesignations = recipientsConfig.at_risk || [
    "ASSIGNED_STAFF",
    "PRIMARY_DEPT_HEAD",
  ];
  const defaultBreachDesignations = [
    "ASSIGNED_STAFF",
    "RESPONSIBLE_DEPT_HEAD",
    "PRIMARY_DEPT_HEAD",
    "ADMIN",
  ];
  const rawEscalationDesignations =
    recipientsConfig.escalation || defaultBreachDesignations;
  // By default, after breach System Admin, Department Head and Assigned Staff are notified
  const escalationDesignations = Array.from(
    new Set([
      ...rawEscalationDesignations,
      "ADMIN",
      "PRIMARY_DEPT_HEAD",
      "RESPONSIBLE_DEPT_HEAD",
      "ASSIGNED_STAFF",
    ]),
  );

  type RecipientUser = {
    user_id: bigint;
    first_name: string;
    last_name: string | null;
    email: string;
  };

  const resolveDesignatedUsers = async (
    designations: string[],
    deptContext?: {
      deptRec: (typeof involvedDeptRecords)[number];
      deptAssignedStaff?: RecipientUser | null;
      deptHeads: RecipientUser[];
    },
  ): Promise<RecipientUser[]> => {
    const userMap = new Map<string, RecipientUser>();
    for (const d of designations) {
      if (d === "ASSIGNED_STAFF") {
        if (deptContext) {
          if (deptContext.deptAssignedStaff) {
            userMap.set(
              deptContext.deptAssignedStaff.user_id.toString(),
              deptContext.deptAssignedStaff,
            );
          } else {
            // Department has no assigned staff yet (unassigned):
            // Fallback to Department Head so critical SLA alerts are not dropped
            for (const h of deptContext.deptHeads) {
              userMap.set(h.user_id.toString(), h);
            }
          }
        } else {
          if (assignedStaffList.length > 0) {
            for (const s of assignedStaffList) {
              userMap.set(s.user_id.toString(), s);
            }
          } else if (primaryDeptHead) {
            // Overall unassigned fallback to primary department head
            userMap.set(primaryDeptHead.user_id.toString(), primaryDeptHead);
          }
        }
      } else if (
        d === "PRIMARY_DEPT_HEAD" ||
        d === "DEPT_HEAD" ||
        d === "RESPONSIBLE_DEPT_HEAD"
      ) {
        if (deptContext?.deptHeads && deptContext.deptHeads.length > 0) {
          for (const h of deptContext.deptHeads) {
            userMap.set(h.user_id.toString(), h);
          }
        }
        if (primaryDeptHead) {
          userMap.set(primaryDeptHead.user_id.toString(), primaryDeptHead);
        }
      } else if (d === "SUPPORTING_DEPT_HEAD") {
        if (deptContext && deptContext.deptRec.involvement_type !== "PRIMARY") {
          for (const h of deptContext.deptHeads) {
            userMap.set(h.user_id.toString(), h);
          }
        }
        for (const s of supportingDeptHeads) {
          userMap.set(s.user_id.toString(), s);
        }
      } else if (d === "ALL_DEPT_HEADS") {
        for (const h of unblockedAllDeptHeads) {
          userMap.set(h.user_id.toString(), h);
        }
      } else if (d === "ADMIN" || d === "GRIEVANCE_ADMIN") {
        const admins = await prisma.users.findMany({
          where: {
            roles: {
              role_name: { in: ["ADMIN", "GRIEVANCE_ADMIN", "SUPER_ADMIN"] },
            },
            status: { in: ["ACTIVE", "Active"] },
          },
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
      deptRec.completed_at != null ||
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
        effectiveStart,
        effectiveDue,
        grievance.priority || "MEDIUM",
        evaluationDate,
        accPaused,
        isPaused,
      ).totalDurationMinutes || 1440;

    const deptAllocatedMinutes =
      deptRec.allocated_duration_minutes &&
      (!isReworkCycle ||
        deptRec.allocated_duration_minutes <= totalGrievanceMinutes)
        ? deptRec.allocated_duration_minutes
        : Math.max(1, Math.round((totalGrievanceMinutes * percentAlloc) / 100));

    const isSequentialDept =
      deptRec.dependency_type === "SEQUENTIAL" ||
      (typeof deptRec.execution_order === "number" &&
        deptRec.execution_order > 1);

    // If sequential department has not been activated yet, do not evaluate or trigger notifications
    if (isSequentialDept && !deptRec.activated_at) {
      continue;
    }

    const rawActivated =
      deptRec.activated_at || deptRec.assigned_at || effectiveStart;
    const activatedAt =
      rawActivated instanceof Date
        ? rawActivated
        : rawActivated
          ? new Date(rawActivated)
          : effectiveStart;

    const deptDueAt =
      deptRec.due_at && (!isSequentialDept || deptRec.due_at > activatedAt)
        ? deptRec.due_at
        : new Date(activatedAt.getTime() + deptAllocatedMinutes * 60 * 1000);

    let deptPauseMinutes = 0;
    if (
      activeTracking?.sla_pause_logs &&
      activeTracking.sla_pause_logs.length > 0
    ) {
      deptPauseMinutes = activeTracking.sla_pause_logs
        .filter(
          (l) =>
            (l.paused_at && new Date(l.paused_at) >= activatedAt) ||
            (l.resumed_at && new Date(l.resumed_at) > activatedAt),
        )
        .reduce((sum, l) => sum + (l.duration_minutes || 0) * 60 * 1000, 0);
    } else if (
      involvedDeptRecords.length <= 1 ||
      deptRec.involvement_type === "PRIMARY"
    ) {
      deptPauseMinutes = accPaused;
    }

    const deptSlaResult = calculateDepartmentSlaConsumption(
      activatedAt,
      deptDueAt,
      deptAllocatedMinutes,
      deptRec.completed_at,
      evaluationDate,
      deptPauseMinutes,
      isPaused,
      warningThreshold,
      atRiskThreshold,
      breachThreshold,
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

    const deptContext = {
      deptRec,
      deptAssignedStaff,
      deptHeads,
    };

    const deptWarnMinutes = Math.round(
      (deptAllocatedMinutes * warningThreshold) / 100,
    );
    const deptRiskMinutes = Math.round(
      (deptAllocatedMinutes * atRiskThreshold) / 100,
    );
    const deptBreachMinutes = deptAllocatedMinutes;

    const notifBaseTime =
      extensionApprovedAt && extensionApprovedAt > activatedAt
        ? extensionApprovedAt
        : activatedAt;

    const hasDeptSentToUser = (userId: bigint, type: string) =>
      existingNotifications.some(
        (n) =>
          n.user_id === userId &&
          n.notification_type === type &&
          (!n.created_at || new Date(n.created_at) >= notifBaseTime),
      );

    // 1. Department Warning Threshold (uses dynamic warningThreshold & designated recipients)
    if (
      deptConsumptionPercent >= warningThreshold &&
      deptConsumptionPercent < atRiskThreshold
    ) {
      const targetUsers = await resolveDesignatedUsers(
        warningDesignations,
        deptContext,
      );
      const notifType = `DEPT_SLA_${warningThreshold}_${deptRec.department_id}`;
      const unnotifiedUsers = targetUsers.filter(
        (u) =>
          !hasDeptSentToUser(u.user_id, notifType) &&
          !hasDeptSentToUser(u.user_id, `DEPT_SLA_50_${deptRec.department_id}`),
      );

      if (unnotifiedUsers.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const u of unnotifiedUsers) {
            await tx.notifications.create({
              data: {
                user_id: u.user_id,
                grievance_id: grievanceId,
                notification_type: notifType,
                channel: "IN_APP",
                title: `SLA Warning: ${warningThreshold}% Department SLA Consumed (${deptName})`,
                message: `Grievance ${grievance.grievance_number} has consumed ${warningThreshold}% of its allocated SLA in ${deptName} (${deptWarnMinutes} minutes consumed out of ${deptAllocatedMinutes} minutes allocated).\n\nPlease review the grievance progress and ensure timely completion within the remaining SLA duration.`,
                status: "PENDING",
                created_at: evaluationDate,
              },
            });
          }
          await tx.audit_logs.create({
            data: {
              grievance_id: grievanceId,
              user_id: null,
              action: "DEPARTMENT_SLA_WARNING",
              entity_type: "GRIEVANCE_DEPARTMENT",
              entity_id: deptRec.grievance_department_id,
              new_value: {
                department: deptName,
                consumptionPercent: deptConsumptionPercent,
                allocatedPercent: percentAlloc,
                threshold: `${warningThreshold}%`,
                notifiedRecipients: unnotifiedUsers
                  .map((u) => `${u.first_name} ${u.last_name || ""}`.trim())
                  .join(", "),
              },
            },
          });
        });
        for (const u of unnotifiedUsers) {
          existingNotifications.push({
            user_id: u.user_id,
            notification_type: notifType,
            created_at: evaluationDate,
          });
        }
        notificationsSent.push(notifType);
      }
    }

    // 2. Department Escalation / At Risk Threshold (uses dynamic atRiskThreshold & designated recipients)
    if (
      deptConsumptionPercent >= atRiskThreshold &&
      deptConsumptionPercent < breachThreshold
    ) {
      if (deptRec.sla_status !== "AT_RISK") {
        await prisma.grievance_departments.update({
          where: { grievance_department_id: deptRec.grievance_department_id },
          data: { sla_status: "AT_RISK" },
        });
      }

      const notifType = `DEPT_SLA_${atRiskThreshold}_${deptRec.department_id}`;
      const targetUsers = await resolveDesignatedUsers(
        atRiskDesignations,
        deptContext,
      );
      const recipientsToNotify = targetUsers.filter(
        (u) =>
          !hasDeptSentToUser(u.user_id, notifType) &&
          !hasDeptSentToUser(u.user_id, `DEPT_SLA_75_${deptRec.department_id}`),
      );

      if (recipientsToNotify.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const u of recipientsToNotify) {
            await tx.notifications.create({
              data: {
                user_id: u.user_id,
                grievance_id: grievanceId,
                notification_type: notifType,
                channel: "IN_APP",
                title: `SLA Escalated: ${atRiskThreshold}% Department SLA Consumed (${deptName})`,
                message: `Grievance ${grievance.grievance_number} has reached ${atRiskThreshold}% of its allocated SLA in ${deptName} (${deptRiskMinutes} minutes consumed out of ${deptAllocatedMinutes} minutes allocated).\n\nThe grievance requires immediate attention. Please review the current progress and take necessary action to prevent an SLA breach.`,
                status: "PENDING",
                created_at: evaluationDate,
              },
            });
          }

          // Record approved escalation event for responsible Department Head
          const existingLevel1 = await tx.escalations.findFirst({
            where: { grievance_id: grievanceId, escalation_level: 1 },
          });
          const targetDeptHead = deptContext.deptHeads[0] || primaryDeptHead;
          let escalationTarget: { user_id: bigint } | null = targetDeptHead;
          if (!escalationTarget) {
            const fallbackAdmin = await tx.users.findFirst({
              where: {
                roles: { role_name: "ADMIN" },
                status: "ACTIVE",
              },
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            });
            if (fallbackAdmin) {
              escalationTarget = fallbackAdmin;
            }
          }
          if (!existingLevel1 && escalationTarget) {
            await tx.escalations.create({
              data: {
                grievance_id: grievanceId,
                escalated_to: escalationTarget.user_id,
                escalation_level: 1,
                reason: `SLA Escalation Threshold Reached: ${deptConsumptionPercent}% of allocated SLA consumed in ${deptName} (${deptAllocatedMinutes} mins allotted). Auto-escalated to Department Head.`,
                status: "OPEN",
                sla_policy_id: activeSlaPolicy?.sla_policy_id || null,
                created_at: evaluationDate,
              },
            });
            didEscalate = true;
          }

          await tx.audit_logs.create({
            data: {
              grievance_id: grievanceId,
              user_id: null,
              action: "DEPARTMENT_SLA_ESCALATION_WARNING",
              entity_type: "GRIEVANCE_DEPARTMENT",
              entity_id: deptRec.grievance_department_id,
              new_value: {
                department: deptName,
                consumptionPercent: deptConsumptionPercent,
                allocatedPercent: percentAlloc,
                threshold: `${atRiskThreshold}%`,
                slaStatus: "AT_RISK",
                notifiedRecipients: recipientsToNotify
                  .map((u) => `${u.first_name} ${u.last_name || ""}`.trim())
                  .join(", "),
              },
            },
          });
        });
        for (const u of recipientsToNotify) {
          existingNotifications.push({
            user_id: u.user_id,
            notification_type: notifType,
            created_at: evaluationDate,
          });
        }
        notificationsSent.push(notifType);
      }
    }

    // 3. Department Breach Threshold (uses dynamic breachThreshold or past due & designated recipients)
    if (
      deptConsumptionPercent >= breachThreshold ||
      (deptRec.due_at && evaluationDate > deptRec.due_at)
    ) {
      if (deptRec.sla_status !== "BREACHED") {
        await prisma.grievance_departments.update({
          where: { grievance_department_id: deptRec.grievance_department_id },
          data: { sla_status: "BREACHED" },
        });
      }
      if (activeTracking && activeTracking.status !== "BREACHED") {
        await prisma.sla_tracking.update({
          where: { sla_tracking_id: activeTracking.sla_tracking_id },
          data: { status: "BREACHED" },
        });
      }
      if (grievance.sla_status !== "BREACHED") {
        await prisma.grievances.update({
          where: { grievance_id: grievanceId },
          data: { sla_status: "BREACHED" },
        });
      }

      const notifType = `DEPT_SLA_BREACH_${deptRec.department_id}`;
      const targetUsers = await resolveDesignatedUsers(
        escalationDesignations,
        deptContext,
      );
      const recipientsToNotify = targetUsers.filter(
        (u) => !hasDeptSentToUser(u.user_id, notifType),
      );

      if (recipientsToNotify.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const u of recipientsToNotify) {
            await tx.notifications.create({
              data: {
                user_id: u.user_id,
                grievance_id: grievanceId,
                notification_type: notifType,
                channel: "IN_APP",
                title: `SLA Breached: 100% Department SLA Consumed (${deptName})`,
                message: `Grievance ${grievance.grievance_number} has reached 100% of its allocated SLA limit in ${deptName} (${deptBreachMinutes} minutes consumed out of ${deptAllocatedMinutes} minutes allocated).\n\nThe department SLA has been breached. Immediate intervention is required to address the delay and expedite grievance resolution.`,
                status: "PENDING",
                created_at: evaluationDate,
              },
            });
          }
          // Record Level 2 escalation for department breach
          const existingLevel2 = await tx.escalations.findFirst({
            where: { grievance_id: grievanceId, escalation_level: 2 },
          });
          let escalationTarget: { user_id: bigint } | null =
            deptContext.deptHeads[0] || primaryDeptHead;
          if (!escalationTarget) {
            const fallbackAdmin = await tx.users.findFirst({
              where: { roles: { role_name: "ADMIN" }, status: "ACTIVE" },
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            });
            if (fallbackAdmin) {
              escalationTarget = fallbackAdmin;
            }
          }
          if (!existingLevel2 && escalationTarget) {
            await tx.escalations.create({
              data: {
                grievance_id: grievanceId,
                escalated_to: escalationTarget.user_id,
                escalation_level: 2,
                reason: `Department SLA Breach: 100% of allocated SLA limit consumed in ${deptName} (${deptAllocatedMinutes} mins allotted). Auto-escalated to Level 2 (Department Head).`,
                status: "OPEN",
                sla_policy_id: activeSlaPolicy?.sla_policy_id || null,
                created_at: evaluationDate,
              },
            });
            didEscalate = true;
          }

          await tx.audit_logs.create({
            data: {
              grievance_id: grievanceId,
              user_id: null,
              action: "DEPARTMENT_SLA_BREACHED",
              entity_type: "GRIEVANCE_DEPARTMENT",
              entity_id: deptRec.grievance_department_id,
              new_value: {
                department: deptName,
                consumptionPercent: deptConsumptionPercent,
                allocatedPercent: percentAlloc,
                threshold: `${breachThreshold}%`,
                slaStatus: "BREACHED",
                notifiedRecipients: recipientsToNotify
                  .map((u) => `${u.first_name} ${u.last_name || ""}`.trim())
                  .join(", "),
              },
            },
          });
        });
        for (const u of recipientsToNotify) {
          existingNotifications.push({
            user_id: u.user_id,
            notification_type: notifType,
            created_at: evaluationDate,
          });
        }
        notificationsSent.push(notifType);
      }
    }
  }

  // =========================================================================
  // MULTI-DEPARTMENT & BREACHED SHORT-CIRCUITING
  // For multi-department cases, milestones are evaluated strictly per department above.
  // If any department is breached, the grievance SLA is marked BREACHED and
  // must not be overwritten by grievance-level percentage warnings.
  // =========================================================================
  const anyDeptBreached = involvedDeptRecords.some(
    (d) =>
      d.status !== "COMPLETED" &&
      d.status !== "RESOLVED" &&
      !d.completed_at &&
      (d.sla_status === "BREACHED" || (d.due_at && evaluationDate > d.due_at)),
  );

  if (anyDeptBreached) {
    if (grievance.sla_status !== "BREACHED") {
      await prisma.grievances.update({
        where: { grievance_id: grievanceId },
        data: { sla_status: "BREACHED" },
      });
    }
    if (activeTracking && activeTracking.status !== "BREACHED") {
      await prisma.sla_tracking.update({
        where: { sla_tracking_id: activeTracking.sla_tracking_id },
        data: { status: "BREACHED" },
      });
    }

    // Ensure formal Level 2 escalation record exists even when early-returning from department breach
    const existingLevel2 = await prisma.escalations.findFirst({
      where: { grievance_id: grievanceId, escalation_level: 2 },
    });

    if (!existingLevel2) {
      let escalationTargetUser: { user_id: bigint } | null = primaryDeptHead;
      if (!escalationTargetUser) {
        const fallbackAdmin = await prisma.users.findFirst({
          where: {
            roles: { role_name: "ADMIN" },
            status: "ACTIVE",
          },
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        });
        if (fallbackAdmin) {
          escalationTargetUser = fallbackAdmin;
        }
      }

      if (escalationTargetUser) {
        await prisma.escalations.create({
          data: {
            grievance_id: grievanceId,
            escalated_to: escalationTargetUser.user_id,
            escalation_level: 2,
            reason:
              "Department SLA Breach: 100% of allocated SLA limit consumed without resolution. Auto-escalated to Level 2 (Department Head).",
            status: "OPEN",
            sla_policy_id: activeSlaPolicy?.sla_policy_id || null,
            created_at: evaluationDate,
          },
        });
        didEscalate = true;
      }
    }

    return {
      grievanceId: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      consumptionPercent,
      threshold: "AT_BREACH",
      slaStatus: "BREACHED",
      status: grievance.status,
      notificationsSent,
      escalated: true,
      message: "Department SLA limit breached. Grievance marked BREACHED.",
    };
  }

  const isMultiDept = involvedDeptRecords.length > 1;
  if (isMultiDept) {
    const activeDept = involvedDeptRecords.find(
      (d) => d.status === "IN_PROGRESS" || d.status === "ASSIGNED",
    );
    const activeStatus = activeDept?.sla_status || "ON_TRACK";
    const mappedSlaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED" =
      activeStatus === "BREACHED"
        ? "BREACHED"
        : activeStatus === "AT_RISK"
          ? "AT_RISK"
          : "ON_TRACK";
    const mappedThreshold:
      | "BELOW_WARNING"
      | "AT_WARNING"
      | "AT_RISK"
      | "AT_CRITICAL"
      | "AT_BREACH" =
      mappedSlaStatus === "BREACHED"
        ? "AT_BREACH"
        : mappedSlaStatus === "AT_RISK"
          ? "AT_RISK"
          : "BELOW_WARNING";

    if (grievance.sla_status !== mappedSlaStatus) {
      await prisma.grievances.update({
        where: { grievance_id: grievanceId },
        data: { sla_status: mappedSlaStatus },
      });
    }

    return {
      grievanceId: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      consumptionPercent,
      threshold: mappedThreshold,
      slaStatus: mappedSlaStatus,
      status: grievance.status,
      notificationsSent,
      escalated: mappedSlaStatus === "AT_RISK",
      message: `Multi-department SLA evaluated per-department. Current active department: ${activeDept?.departments?.department_name || "Department"} (${mappedSlaStatus}).`,
    };
  }

  // =========================================================================
  // RULE 1: Below Warning threshold → Normal processing
  // =========================================================================
  if (consumptionPercent < warningThreshold) {
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
      threshold: "BELOW_WARNING",
      slaStatus: "ON_TRACK",
      status: grievance.status,
      notificationsSent: [],
      escalated: false,
      message: `SLA consumption is below ${warningThreshold}%. Normal operational processing.`,
    };
  }

  // =========================================================================
  // RULE 2: At Warning threshold (>= warningThreshold and < atRiskThreshold)
  // Automatically notify designated staff / recipients that time is running low.
  // =========================================================================
  if (
    consumptionPercent >= warningThreshold &&
    consumptionPercent < atRiskThreshold
  ) {
    updatedSlaStatus = "ON_TRACK";

    const targetUsers = await resolveDesignatedUsers(warningDesignations);
    const unnotifiedUsers = targetUsers.filter(
      (u) =>
        !hasSentToUser(u.user_id, `SLA_WARN_${warningThreshold}`) &&
        !hasSentToUser(u.user_id, "SLA_HALF_TIME") &&
        !hasSentToUser(u.user_id, "SLA_50_STAFF_WARNING"),
    );

    if (unnotifiedUsers.length > 0) {
      const singleWarnMinutes = Math.round(
        (slaConsumption.totalDurationMinutes * warningThreshold) / 100,
      );
      await prisma.$transaction(async (tx) => {
        for (const u of unnotifiedUsers) {
          await tx.notifications.create({
            data: {
              user_id: u.user_id,
              grievance_id: grievanceId,
              notification_type: `SLA_WARN_${warningThreshold}`,
              channel: "IN_APP",
              title: `SLA Warning: ${warningThreshold}% Department SLA Consumed (${primaryDeptName})`,
              message: `Grievance ${grievance.grievance_number} has consumed ${warningThreshold}% of its allocated SLA in ${primaryDeptName} (${singleWarnMinutes} minutes consumed out of ${slaConsumption.totalDurationMinutes} minutes allocated).\n\nPlease review the grievance progress and ensure timely completion within the remaining SLA duration.`,
              status: "PENDING",
              created_at: evaluationDate,
            },
          });
        }

        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: null,
            action: `SLA_${warningThreshold}_PERCENT_WARNING`,
            entity_type: "GRIEVANCE",
            entity_id: grievanceId,
            new_value: {
              consumptionPercent,
              threshold: `${warningThreshold}%`,
              notifiedRecipients: unnotifiedUsers
                .map((s) => `${s.first_name} ${s.last_name || ""}`.trim())
                .join(", "),
              actionRequired: "Prioritize grievance investigation",
            },
          },
        });
      });

      for (const u of unnotifiedUsers) {
        existingNotifications.push({
          user_id: u.user_id,
          notification_type: `SLA_WARN_${warningThreshold}`,
        });
      }
      notificationsSent.push(`SLA_${warningThreshold}_WARNING`);
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
      threshold: "AT_WARNING",
      slaStatus: "ON_TRACK",
      status: grievance.status,
      notificationsSent,
      escalated: false,
      message: `${warningThreshold}% SLA threshold reached (${consumptionPercent}%). Designated recipients notified.`,
    };
  }

  // =========================================================================
  // RULE 3: At Risk threshold (>= atRiskThreshold and < breachThreshold)
  // Automatically notify designated recipients that the grievance is at SLA risk.
  // =========================================================================
  if (
    consumptionPercent >= atRiskThreshold &&
    consumptionPercent < breachThreshold
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
          !hasSentToUser(u.user_id, `SLA_RISK_${atRiskThreshold}`) &&
          !hasSentToUser(u.user_id, "SLA_75_HOD_WARNING") &&
          !hasSentToUser(u.user_id, "SLA_AT_RISK"),
      );

      const singleRiskMinutes = Math.round(
        (slaConsumption.totalDurationMinutes * atRiskThreshold) / 100,
      );
      for (const u of unnotifiedUsers) {
        await tx.notifications.create({
          data: {
            user_id: u.user_id,
            grievance_id: grievanceId,
            notification_type: `SLA_RISK_${atRiskThreshold}`,
            channel: "IN_APP",
            title: `SLA Escalated: ${atRiskThreshold}% Department SLA Consumed (${primaryDeptName})`,
            message: `Grievance ${grievance.grievance_number} has reached ${atRiskThreshold}% of its allocated SLA in ${primaryDeptName} (${singleRiskMinutes} minutes consumed out of ${slaConsumption.totalDurationMinutes} minutes allocated).\n\nThe grievance requires immediate attention. Please review the current progress and take necessary action to prevent an SLA breach.`,
            status: "PENDING",
            created_at: evaluationDate,
          },
        });
      }

      // Record approved Level 1 escalation event for responsible Department Head
      const existingLevel1 = await tx.escalations.findFirst({
        where: { grievance_id: grievanceId, escalation_level: 1 },
      });
      let escalationTargetUser: { user_id: bigint } | null = primaryDeptHead;
      if (!escalationTargetUser) {
        const fallbackAdmin = await tx.users.findFirst({
          where: { roles: { role_name: "ADMIN" }, status: "ACTIVE" },
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        });
        if (fallbackAdmin) {
          escalationTargetUser = fallbackAdmin;
        }
      }
      if (!existingLevel1 && escalationTargetUser) {
        await tx.escalations.create({
          data: {
            grievance_id: grievanceId,
            escalated_to: escalationTargetUser.user_id,
            escalation_level: 1,
            reason: `SLA Escalation Threshold Reached: ${consumptionPercent}% of resolution SLA consumed. Auto-escalated to Department Head.`,
            status: "OPEN",
            sla_policy_id: activeSlaPolicy?.sla_policy_id || null,
            created_at: evaluationDate,
          },
        });
        didEscalate = true;
      }

      if (unnotifiedUsers.length > 0) {
        for (const u of unnotifiedUsers) {
          existingNotifications.push({
            user_id: u.user_id,
            notification_type: `SLA_RISK_${atRiskThreshold}`,
          });
        }
        notificationsSent.push("SLA_AT_RISK");
      }

      if (unnotifiedUsers.length > 0) {
        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: null,
            action: `SLA_${atRiskThreshold}_PERCENT_ALERT`,
            entity_type: "GRIEVANCE",
            entity_id: grievanceId,
            new_value: {
              consumptionPercent,
              threshold: `${atRiskThreshold}%`,
              slaStatus: "AT_RISK",
              notifiedRecipients: unnotifiedUsers
                .map((h) => `${h.first_name} ${h.last_name || ""}`.trim())
                .join(", "),
              reassignedAutomatically: false,
              note: `${atRiskThreshold}% SLA warning: Marked AT_RISK. Designated recipients alerted.`,
            },
          },
        });
      }
    });

    return {
      grievanceId: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      consumptionPercent,
      threshold: "AT_RISK",
      slaStatus: "AT_RISK",
      status: grievance.status,
      notificationsSent,
      escalated: didEscalate,
      message: `${atRiskThreshold}% SLA threshold reached (${consumptionPercent}%). Marked AT_RISK. Designated recipients alerted.`,
    };
  }

  // =========================================================================
  // RULE 4: At Breach threshold (>= breachThreshold or past due)
  // Mark the grievance as SLA BREACHED and move it to Escalated status.
  // Triggered ONCE per grievance.
  // =========================================================================
  if (
    consumptionPercent >= breachThreshold ||
    (grievance.due_at && evaluationDate > grievance.due_at)
  ) {
    updatedSlaStatus = "BREACHED";
    updatedStatus = grievance.status;

    await prisma.$transaction(async (tx) => {
      // 1. Update sla_status to BREACHED on grievance and sla_tracking
      if (grievance.sla_status !== "BREACHED") {
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            sla_status: "BREACHED",
            updated_at: evaluationDate,
          },
        });
      }

      if (activeTracking && activeTracking.status !== "BREACHED") {
        await tx.sla_tracking.update({
          where: { sla_tracking_id: activeTracking.sla_tracking_id },
          data: { status: "BREACHED" },
        });
      }

      // 2. Create Level 2 escalation record if not exists
      const existingLevel2 = await tx.escalations.findFirst({
        where: { grievance_id: grievanceId, escalation_level: 2 },
      });

      let escalationTargetUser: { user_id: bigint } | null = primaryDeptHead;
      if (!escalationTargetUser) {
        // Fallback to active Admin if primary department has no active Department Head
        const fallbackAdmin = await tx.users.findFirst({
          where: {
            roles: { role_name: "ADMIN" },
            status: "ACTIVE",
          },
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        });
        if (fallbackAdmin) {
          escalationTargetUser = fallbackAdmin;
        }
      }

      if (!existingLevel2 && escalationTargetUser) {
        await tx.escalations.create({
          data: {
            grievance_id: grievanceId,
            escalated_to: escalationTargetUser.user_id,
            escalation_level: 2,
            reason: `Automated SLA Breach: ${consumptionPercent}% of SLA time consumed without resolution. Auto-escalated to Level 2 (Department Head).`,
            status: "OPEN",
            sla_policy_id: activeSlaPolicy?.sla_policy_id || null,
            created_at: evaluationDate,
          },
        });
        didEscalate = true;
      }

      // 4. Send Breach Notification to designated escalation recipients
      const targetUsers = await resolveDesignatedUsers(escalationDesignations);
      const unnotifiedUsers = targetUsers.filter(
        (u) =>
          !hasSentToUser(u.user_id, "SLA_100_BREACH_ESCALATED") &&
          !hasSentToUser(u.user_id, "SLA_BREACHED") &&
          !hasSentToUser(u.user_id, "SLA_100_BREACH_STAFF") &&
          !hasSentToUser(u.user_id, `SLA_${breachThreshold}_BREACH`),
      );

      const singleBreachMinutes = slaConsumption.totalDurationMinutes;
      for (const u of unnotifiedUsers) {
        await tx.notifications.create({
          data: {
            user_id: u.user_id,
            grievance_id: grievanceId,
            notification_type: "SLA_BREACHED",
            channel: "IN_APP",
            title: `SLA Breached: 100% Department SLA Consumed (${primaryDeptName})`,
            message: `Grievance ${grievance.grievance_number} has reached 100% of its allocated SLA limit in ${primaryDeptName} (${singleBreachMinutes} minutes consumed out of ${slaConsumption.totalDurationMinutes} minutes allocated).\n\nThe department SLA has been breached. Immediate intervention is required to address the delay and expedite grievance resolution.`,
            status: "PENDING",
            created_at: evaluationDate,
          },
        });
      }

      if (unnotifiedUsers.length > 0) {
        for (const u of unnotifiedUsers) {
          existingNotifications.push({
            user_id: u.user_id,
            notification_type: "SLA_BREACHED",
          });
        }
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
            entity_type: "GRIEVANCE",
            entity_id: grievanceId,
            new_value: {
              consumptionPercent,
              threshold: `${breachThreshold}%`,
              slaStatus: "BREACHED",
              status: grievance.status,
              escalationStatus: "OPEN",
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
      threshold: "AT_BREACH",
      slaStatus: "BREACHED",
      status: grievance.status,
      notificationsSent,
      escalated: didEscalate,
      message: `${breachThreshold}% SLA threshold breached (${consumptionPercent}%). Marked BREACHED for HOD intervention.`,
    };
  }

  return {
    grievanceId: grievance.grievance_id.toString(),
    grievanceNumber: grievance.grievance_number,
    consumptionPercent,
    threshold: "BELOW_WARNING",
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
 * PostgreSQL 64-bit advisory lock key dedicated to the GRS SLA evaluation scheduler.
 * Prevents concurrent scheduler sweeps across clustered or multi-instance deployments.
 */
export const SLA_SCHEDULER_LOCK_ID = 882026101;

export type AdvisoryLockResult<T> =
  | { acquired: true; result: T }
  | { acquired: false; inProgress: true };

export interface SlaEvaluationFailure {
  grievanceId: string;
  error: string;
}

export interface BatchSlaEvaluationSummary {
  totalEvaluated: number;
  successfulCount: number;
  failedCount: number;
  results: SlaEvaluationResult[];
  failures: SlaEvaluationFailure[];
}

let isSchemaEnsured = false;

/**
 * Self-healing schema migration:
 * Guarantees required columns (closure_reason, sla_extensions, sla_pause_logs)
 * exist in the production PostgreSQL database.
 */
export async function ensureRequiredDatabaseSchema(
  customClient?: PoolClient,
): Promise<void> {
  if (isSchemaEnsured) {
    return;
  }

  const runner = async (c: PoolClient) => {
    await c.query(`
      ALTER TABLE "grievances" ADD COLUMN IF NOT EXISTS "closure_reason" VARCHAR(100);
      ALTER TABLE "sla_tracking" ADD COLUMN IF NOT EXISTS "accumulated_paused_minutes" INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE "sla_tracking" ADD COLUMN IF NOT EXISTS "cycle_type" VARCHAR(20) NOT NULL DEFAULT 'INITIAL';
    `);

    await c.query(`
      CREATE TABLE IF NOT EXISTS "sla_pause_logs" (
        "id" BIGSERIAL NOT NULL,
        "sla_tracking_id" BIGINT NOT NULL,
        "pause_reason" VARCHAR(100) NOT NULL,
        "paused_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "resumed_at" TIMESTAMPTZ(6),
        "duration_minutes" INTEGER NOT NULL DEFAULT 0,
        "paused_by" BIGINT NOT NULL,
        "resumed_by" BIGINT,
        CONSTRAINT "sla_pause_logs_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "idx_sla_pause_logs_tracking_id" ON "sla_pause_logs"("sla_tracking_id");
    `);

    await c.query(`
      CREATE TABLE IF NOT EXISTS "sla_extensions" (
        "extension_id" BIGSERIAL NOT NULL,
        "grievance_id" BIGINT NOT NULL,
        "sla_tracking_id" BIGINT NOT NULL,
        "requested_by" BIGINT NOT NULL,
        "reason" TEXT NOT NULL,
        "requested_duration_minutes" INTEGER NOT NULL,
        "granted_duration_minutes" INTEGER,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "reviewed_by" BIGINT,
        "reviewed_at" TIMESTAMPTZ(6),
        "rejection_reason" TEXT,
        "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "sla_extensions_pkey" PRIMARY KEY ("extension_id")
      );
      CREATE INDEX IF NOT EXISTS "idx_sla_extensions_grievance_id" ON "sla_extensions"("grievance_id");
      CREATE INDEX IF NOT EXISTS "idx_sla_extensions_tracking_id" ON "sla_extensions"("sla_tracking_id");
      CREATE INDEX IF NOT EXISTS "idx_sla_extensions_status" ON "sla_extensions"("status");
    `);

    await c.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'sla_extensions_grievance_id_fkey'
        ) THEN
          ALTER TABLE "sla_extensions" ADD CONSTRAINT "sla_extensions_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "grievances"("grievance_id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'sla_extensions_sla_tracking_id_fkey'
        ) THEN
          ALTER TABLE "sla_extensions" ADD CONSTRAINT "sla_extensions_sla_tracking_id_fkey" FOREIGN KEY ("sla_tracking_id") REFERENCES "sla_tracking"("sla_tracking_id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'sla_extensions_requested_by_fkey'
        ) THEN
          ALTER TABLE "sla_extensions" ADD CONSTRAINT "sla_extensions_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'sla_extensions_reviewed_by_fkey'
        ) THEN
          ALTER TABLE "sla_extensions" ADD CONSTRAINT "sla_extensions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'sla_pause_logs_sla_tracking_id_fkey'
        ) THEN
          ALTER TABLE "sla_pause_logs" ADD CONSTRAINT "sla_pause_logs_sla_tracking_id_fkey" FOREIGN KEY ("sla_tracking_id") REFERENCES "sla_tracking"("sla_tracking_id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'sla_pause_logs_paused_by_fkey'
        ) THEN
          ALTER TABLE "sla_pause_logs" ADD CONSTRAINT "sla_pause_logs_paused_by_fkey" FOREIGN KEY ("paused_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'sla_pause_logs_resumed_by_fkey'
        ) THEN
          ALTER TABLE "sla_pause_logs" ADD CONSTRAINT "sla_pause_logs_resumed_by_fkey" FOREIGN KEY ("resumed_by") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await c.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_prisma_migrations') THEN
          IF NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20261119_add_closure_reason') THEN
            INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
            VALUES (gen_random_uuid()::text, 'self-healed', CURRENT_TIMESTAMP, '20261119_add_closure_reason', NULL, NULL, CURRENT_TIMESTAMP, 1);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20261119_add_sla_extensions') THEN
            INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
            VALUES (gen_random_uuid()::text, 'self-healed', CURRENT_TIMESTAMP, '20261119_add_sla_extensions', NULL, NULL, CURRENT_TIMESTAMP, 1);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20261118_sla_pause_logs') THEN
            INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
            VALUES (gen_random_uuid()::text, 'self-healed', CURRENT_TIMESTAMP, '20261118_sla_pause_logs', NULL, NULL, CURRENT_TIMESTAMP, 1);
          END IF;
        END IF;
      END $$;
    `);
  };

  try {
    if (customClient) {
      await runner(customClient);
    } else if (pool) {
      const conn = await pool.connect();
      try {
        await runner(conn);
      } finally {
        conn.release();
      }
    }
    isSchemaEnsured = true;
    console.log(
      "[SLA Engine] Production database schema verified and self-healed.",
    );
  } catch (err) {
    console.warn(
      "[SLA Engine] Schema verification warning (queries will proceed):",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Executes a callback within a dedicated PostgreSQL session-level advisory lock.
 * Uses a single dedicated client checked out from the connection pool so that
 * lock acquisition and release occur on the exact same database connection.
 * If the lock cannot be acquired (another sweep is in progress), returns
 * { acquired: false, inProgress: true } without blocking or queuing.
 */
export async function withSlaAdvisoryLock<T>(
  callback: () => Promise<T>,
  lockId: number = SLA_SCHEDULER_LOCK_ID,
): Promise<AdvisoryLockResult<T>> {
  if (!pool) {
    throw new Error("PostgreSQL connection pool is not available.");
  }

  const client = await pool.connect();
  let hasLock = false;

  try {
    const res = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS locked",
      [lockId],
    );
    hasLock = Boolean(res.rows[0]?.locked);

    if (!hasLock) {
      return { acquired: false, inProgress: true };
    }

    await ensureRequiredDatabaseSchema(client);

    const result = await callback();
    return { acquired: true, result };
  } finally {
    if (client) {
      try {
        if (hasLock) {
          await client.query("SELECT pg_advisory_unlock($1)", [lockId]);
        }
      } catch (unlockErr) {
        console.error(
          "[SLA Scheduler] Failed to release PostgreSQL advisory lock:",
          unlockErr,
        );
      } finally {
        client.release();
      }
    }
  }
}

/**
 * Batch evaluates all active, non-terminal grievances across the system.
 * Isolates individual grievance failures so one corrupted case does not abort
 * the sweep for remaining grievances.
 */
export async function evaluateAllActiveGrievancesSla(
  departmentId?: bigint,
  force: boolean = false,
): Promise<BatchSlaEvaluationSummary> {
  const deptKey = departmentId ? departmentId.toString() : "ALL";
  const now = Date.now();
  const lastEval = lastEvaluationByDept.get(deptKey) || 0;

  if (!force && now - lastEval < SLA_EVAL_COOLDOWN_MS) {
    return {
      totalEvaluated: 0,
      successfulCount: 0,
      failedCount: 0,
      results: [],
      failures: [],
    };
  }

  lastEvaluationByDept.set(deptKey, now);

  const activeGrievances = await prisma.grievances.findMany({
    where: {
      status: {
        notIn: ["CLOSED", "RESOLVED", "REJECTED", "UNDER_REVIEW"],
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
  const failures: SlaEvaluationFailure[] = [];

  for (const g of activeGrievances) {
    try {
      const res = await evaluateGrievanceSla(g.grievance_id);
      if (res) results.push(res);
    } catch (err: unknown) {
      const safeErrorMessage =
        err instanceof Error ? err.message : "Internal SLA evaluation failure";
      console.error(
        `[SLA Evaluator] Failed to evaluate grievance #${g.grievance_id}:`,
        err,
      );
      failures.push({
        grievanceId: g.grievance_id.toString(),
        error: safeErrorMessage,
      });
    }
  }

  return {
    totalEvaluated: activeGrievances.length,
    successfulCount: results.length,
    failedCount: failures.length,
    results,
    failures,
  };
}

/**
 * Calculates SLA consumption for an individual grievance department.
 * Blocked departments return 0% consumption and ON_TRACK.
 * Elapsed time is measured strictly from activated_at (or frozen at completedAt / pausedAt).
 * Deducts accumulatedPausedMinutes to ensure paused periods do not penalize the department.
 */
export function calculateDepartmentSlaConsumption(
  activatedAt: Date | null,
  dueAt: Date | null,
  allocatedDurationMinutes: number,
  completedAt?: Date | null,
  now: Date = new Date(),
  accumulatedPausedMinutes: number = 0,
  pausedAt?: Date | null,
  _warningThresholdPercent: number = DEFAULT_SLA_THRESHOLDS.WARNING_PERCENT,
  atRiskThresholdPercent: number = DEFAULT_SLA_THRESHOLDS.AT_RISK_PERCENT,
  breachThresholdPercent: number = DEFAULT_SLA_THRESHOLDS.BREACH_PERCENT,
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

  const effectiveEnd = completedAt || (pausedAt ?? now);
  const pausedMs = Math.max(0, (accumulatedPausedMinutes || 0) * 60 * 1000);
  const rawElapsedMs = Math.max(
    0,
    effectiveEnd.getTime() - activatedAt.getTime(),
  );
  const activeElapsedMs = Math.max(0, rawElapsedMs - pausedMs);
  const elapsedMinutes = Math.round(activeElapsedMs / (60 * 1000));

  let totalDuration = allocatedDurationMinutes;
  if (dueAt) {
    const rawDiff = Math.round(
      (dueAt.getTime() - activatedAt.getTime()) / (60 * 1000),
    );
    const netDiff = Math.max(1, rawDiff - (accumulatedPausedMinutes || 0));
    if (netDiff > 0) totalDuration = netDiff;
  }

  if (totalDuration <= 0) {
    return {
      totalDurationMinutes: 0,
      elapsedMinutes,
      consumptionPercent: 100,
      slaStatus: "BREACHED",
    };
  }

  const rawPercent = (activeElapsedMs / (totalDuration * 60 * 1000)) * 100;
  const consumptionPercent = Math.min(Math.round(rawPercent * 10) / 10, 999);

  let slaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED" = "ON_TRACK";
  if (
    consumptionPercent >= breachThresholdPercent ||
    (dueAt && effectiveEnd > dueAt && !pausedAt)
  ) {
    slaStatus = "BREACHED";
  } else if (consumptionPercent >= atRiskThresholdPercent) {
    slaStatus = "AT_RISK";
  }

  return {
    totalDurationMinutes: totalDuration,
    elapsedMinutes,
    consumptionPercent,
    slaStatus,
  };
}

export interface PauseSlaOptions {
  grievanceId: bigint | number | string;
  pauseReason: string;
  pausedBy: bigint | number | string;
  tx?: Prisma.TransactionClient;
}

export interface ResumeSlaOptions {
  grievanceId: bigint | number | string;
  resumedBy?: bigint | number | string | null;
  tx?: Prisma.TransactionClient;
}

/**
 * Pauses SLA tracking for an active grievance.
 * Used when waiting on user info, or during supervisor/citizen resolution confirmation.
 */
export async function pauseSlaTracking(
  options: PauseSlaOptions,
): Promise<boolean> {
  const gId = BigInt(options.grievanceId);
  const pBy = BigInt(options.pausedBy);
  const client = options.tx || prisma;
  const now = new Date();

  // Find latest active SLA tracking record for this grievance
  const activeTracking = await client.sla_tracking.findFirst({
    where: {
      grievance_id: gId,
      status: { in: ["ON_TRACK", "AT_RISK", "BREACHED"] },
    },
    orderBy: { cycle_number: "desc" },
  });

  if (!activeTracking) {
    return false;
  }

  // Already paused? Don't overwrite paused_at
  if (activeTracking.paused_at) {
    return true;
  }

  await client.sla_tracking.update({
    where: { sla_tracking_id: activeTracking.sla_tracking_id },
    data: {
      paused_at: now,
    },
  });

  try {
    if (
      "sla_pause_logs" in client &&
      typeof (client as { sla_pause_logs?: { create?: unknown } })
        .sla_pause_logs?.create === "function"
    ) {
      await client.sla_pause_logs.create({
        data: {
          sla_tracking_id: activeTracking.sla_tracking_id,
          pause_reason: options.pauseReason,
          paused_at: now,
          paused_by: pBy,
        },
      });
    }
  } catch (logErr) {
    console.warn("Non-fatal: failed to insert into sla_pause_logs:", logErr);
  }

  return true;
}

/**
 * Resumes SLA tracking for a paused grievance.
 * Calculates paused duration, increments accumulated_paused_minutes,
 * and extends due_at dates on grievance, sla_tracking, and active grievance_departments.
 */
export async function resumeSlaTracking(options: ResumeSlaOptions): Promise<{
  resumed: boolean;
  pausedDurationMinutes: number;
  newDueAt: Date | null;
}> {
  const gId = BigInt(options.grievanceId);
  const rBy = options.resumedBy ? BigInt(options.resumedBy) : null;
  const client = options.tx || prisma;
  const now = new Date();

  const activeTracking = await client.sla_tracking.findFirst({
    where: {
      grievance_id: gId,
      status: { in: ["ON_TRACK", "AT_RISK", "BREACHED"] },
    },
    orderBy: { cycle_number: "desc" },
  });

  if (!activeTracking?.paused_at) {
    return { resumed: false, pausedDurationMinutes: 0, newDueAt: null };
  }

  const pausedAt = activeTracking.paused_at;
  const diffMs = Math.max(0, now.getTime() - pausedAt.getTime());
  const pausedMinutes = Math.max(1, Math.round(diffMs / (60 * 1000)));

  // 1. Close open sla_pause_logs record (safely)
  try {
    if (
      "sla_pause_logs" in client &&
      typeof (client as { sla_pause_logs?: { findFirst?: unknown } })
        .sla_pause_logs?.findFirst === "function"
    ) {
      const openLog = await client.sla_pause_logs.findFirst({
        where: {
          sla_tracking_id: activeTracking.sla_tracking_id,
          resumed_at: null,
        },
        orderBy: { paused_at: "desc" },
      });

      if (openLog) {
        await client.sla_pause_logs.update({
          where: { id: openLog.id },
          data: {
            resumed_at: now,
            duration_minutes: pausedMinutes,
            resumed_by: rBy,
          },
        });
      }
    }
  } catch (logErr) {
    console.warn(
      "Non-fatal: failed to update sla_pause_logs on resume:",
      logErr,
    );
  }

  // 2. Extend sla_tracking due_at and update accumulated_paused_minutes
  const newSlaDueAt = new Date(
    activeTracking.due_at.getTime() + pausedMinutes * 60 * 1000,
  );
  await client.sla_tracking.update({
    where: { sla_tracking_id: activeTracking.sla_tracking_id },
    data: {
      paused_at: null,
      resumed_at: now,
      accumulated_paused_minutes:
        (activeTracking.accumulated_paused_minutes || 0) + pausedMinutes,
      due_at: newSlaDueAt,
      status: "ON_TRACK",
    },
  });

  // 3. Extend grievances master due_at
  const grievance = await client.grievances.findUnique({
    where: { grievance_id: gId },
    select: { due_at: true },
  });

  let newGrievanceDueAt: Date | null = null;
  if (grievance?.due_at) {
    newGrievanceDueAt = new Date(
      grievance.due_at.getTime() + pausedMinutes * 60 * 1000,
    );
    await client.grievances.update({
      where: { grievance_id: gId },
      data: {
        due_at: newGrievanceDueAt,
        sla_status: "ON_TRACK",
      },
    });
  }

  // 4. Extend active grievance_departments due_at
  const activeDepts = await client.grievance_departments.findMany({
    where: {
      grievance_id: gId,
      status: { notIn: ["COMPLETED", "RESOLVED", "REMOVED", "BLOCKED"] },
      due_at: { not: null },
    },
  });

  for (const dept of activeDepts) {
    if (dept.due_at) {
      const newDeptDueAt = new Date(
        dept.due_at.getTime() + pausedMinutes * 60 * 1000,
      );
      await client.grievance_departments.update({
        where: { grievance_department_id: dept.grievance_department_id },
        data: {
          due_at: newDeptDueAt,
          sla_status: "ON_TRACK",
        },
      });
    }
  }

  return {
    resumed: true,
    pausedDurationMinutes: pausedMinutes,
    newDueAt: newGrievanceDueAt || newSlaDueAt,
  };
}

/**
 * Completes SLA tracking for a finalized/closed grievance.
 * Preserves the valid tracking status ('ON_TRACK' | 'AT_RISK' | 'BREACHED').
 * Does NOT set invalid status ('COMPLETED', 'STOPPED', or 'PAUSED').
 * Sets completed_at, and retains paused_at so the SLA clock remains permanently paused.
 */
export async function completeSlaTracking(
  grievanceId: bigint | number | string,
  tx?: Prisma.TransactionClient,
): Promise<boolean> {
  const gId = BigInt(grievanceId);
  const client = tx || prisma;
  const now = new Date();

  const activeTracking = await client.sla_tracking.findFirst({
    where: {
      grievance_id: gId,
      status: { in: ["ON_TRACK", "AT_RISK", "BREACHED"] },
    },
    orderBy: { cycle_number: "desc" },
  });

  if (!activeTracking) return false;

  const pausedAt = activeTracking.paused_at ?? now;

  await client.sla_tracking.update({
    where: { sla_tracking_id: activeTracking.sla_tracking_id },
    data: {
      completed_at: now,
      paused_at: pausedAt,
    },
  });

  try {
    if (
      "sla_pause_logs" in client &&
      typeof (client as { sla_pause_logs?: { findFirst?: unknown } })
        .sla_pause_logs?.findFirst === "function"
    ) {
      const openLog = await client.sla_pause_logs.findFirst({
        where: {
          sla_tracking_id: activeTracking.sla_tracking_id,
          resumed_at: null,
        },
        orderBy: { paused_at: "desc" },
      });

      if (openLog) {
        const pausedMinutes = Math.max(
          1,
          Math.round(
            (now.getTime() - openLog.paused_at.getTime()) / (60 * 1000),
          ),
        );
        await client.sla_pause_logs.update({
          where: { id: openLog.id },
          data: {
            resumed_at: now,
            duration_minutes: pausedMinutes,
          },
        });
      }
    }
  } catch (logErr) {
    console.warn("Non-fatal: failed to close open sla_pause_logs:", logErr);
  }

  return true;
}

/**
 * Resolves the reopened SLA duration (in minutes) for a given priority.
 * Evaluates configured policies in sla_policies where sla_type = 'REOPENED_RESOLUTION'.
 * Defaults to the proposed 50% baseline duration:
 * - Critical: 12 hours (720 min)
 * - High: 24 hours (1440 min)
 * - Medium: 36 hours (2160 min)
 * - Low: 60 hours (3600 min)
 */
export async function getReopenedSlaDurationMinutes(
  priority: string = "MEDIUM",
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<{ durationMinutes: number; policyId: bigint }> {
  const normPriority = priority.toUpperCase();

  // 1. Check for an active policy with sla_type = 'REOPENED_RESOLUTION'
  const reopenedPolicy = await client.sla_policies.findFirst({
    where: {
      priority_level: normPriority,
      sla_type: "REOPENED_RESOLUTION",
      status: "ACTIVE",
    },
  });

  if (reopenedPolicy?.target_duration_minutes) {
    return {
      durationMinutes: reopenedPolicy.target_duration_minutes,
      policyId: reopenedPolicy.sla_policy_id,
    };
  }

  // 2. Fetch the active baseline resolution policy and calculate 50% through dynamic formula
  const initialPolicy = await client.sla_policies.findFirst({
    where: {
      priority_level: normPriority,
      sla_type: "RESOLUTION",
      status: "ACTIVE",
    },
  });

  // Calculate 50% dynamically from the configured priority baseline duration
  const baselineMinutes =
    initialPolicy?.target_duration_minutes ||
    DEFAULT_SLA_DURATIONS_MINUTES[normPriority] ||
    DEFAULT_SLA_DURATIONS_MINUTES.MEDIUM;

  const durationMinutes = calculateReopenedSlaMinutes(
    baselineMinutes,
    DEFAULT_REOPENED_SLA_PERCENT,
  );

  const fallbackPolicyId = initialPolicy
    ? initialPolicy.sla_policy_id
    : BigInt(1);

  return {
    durationMinutes,
    policyId: fallbackPolicyId,
  };
}

/**
 * Initiates a new SLA monitoring cycle for a reopened grievance.
 * Preserves all previous SLA cycles and their pause/resume history.
 * Resets accumulated_paused_minutes to 0, computes fresh due_at from baseline priority duration.
 * Sets status ON_TRACK and synchronizes grievance master record.
 */
export async function initiateReopenedSlaCycle(
  grievanceId: bigint | number | string,
  priority: string = "MEDIUM",
  tx?: Prisma.TransactionClient,
): Promise<{
  newCycleId: bigint;
  cycleNumber: number;
  durationMinutes: number;
  newDueAt: Date;
}> {
  const gId = BigInt(grievanceId);
  const client = tx || prisma;
  const now = new Date();

  // 1. Find latest tracking cycle to determine new cycle_number
  const lastTracking = await client.sla_tracking.findFirst({
    where: { grievance_id: gId },
    orderBy: { cycle_number: "desc" },
  });

  const nextCycleNumber = (lastTracking?.cycle_number || 0) + 1;

  // 2. Complete previous cycle if not yet marked completed
  if (lastTracking && !lastTracking.completed_at) {
    await client.sla_tracking.update({
      where: { sla_tracking_id: lastTracking.sla_tracking_id },
      data: {
        completed_at: now,
        paused_at: lastTracking.paused_at ?? now,
      },
    });
  }

  // 3. Resolve reopened duration & policy
  const { durationMinutes, policyId } = await getReopenedSlaDurationMinutes(
    priority,
    client,
  );

  const newDueAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  // 4. Create new SLA tracking cycle
  const newCycle = await client.sla_tracking.create({
    data: {
      grievance_id: gId,
      sla_policy_id: policyId,
      cycle_number: nextCycleNumber,
      cycle_type: "REOPENED",
      started_at: now,
      due_at: newDueAt,
      status: "ON_TRACK",
      paused_at: null,
      resumed_at: null,
      completed_at: null,
      accumulated_paused_minutes: 0,
    },
  });

  // 5. Update grievance master record
  await client.grievances.update({
    where: { grievance_id: gId },
    data: {
      due_at: newDueAt,
      sla_status: "ON_TRACK",
      closed_at: null,
      closure_reason: null,
    },
  });

  // Resolve any open escalations
  await client.escalations.updateMany({
    where: { grievance_id: gId, status: "OPEN" },
    data: { status: "RESOLVED", resolved_at: now },
  });

  // 6. Update all active grievance_departments with proportional allocated duration and new due date
  const activeDepts = await client.grievance_departments.findMany({
    where: {
      grievance_id: gId,
      status: { notIn: ["REMOVED"] },
    },
  });

  for (const dept of activeDepts) {
    const percentAlloc = dept.sla_percent_allocation
      ? Number(dept.sla_percent_allocation)
      : 100;
    const deptDuration = Math.max(
      1,
      Math.round((durationMinutes * percentAlloc) / 100),
    );

    await client.grievance_departments.update({
      where: { grievance_department_id: dept.grievance_department_id },
      data: {
        due_at: newDueAt,
        sla_status: "ON_TRACK",
        activated_at: now,
        completed_at: null,
        allocated_duration_minutes: deptDuration,
      },
    });
  }

  // 7. Retain in audit logs
  await client.audit_logs.create({
    data: {
      grievance_id: gId,
      user_id: null,
      action: "SLA_CYCLE_CREATED",
      entity_type: "sla_tracking",
      entity_id: newCycle.sla_tracking_id,
      new_value: {
        cycleNumber: nextCycleNumber,
        cycleType: "REOPENED",
        durationMinutes,
        dueAt: newDueAt.toISOString(),
        policyType: "REOPENED_RESOLUTION",
        baselinePolicy: "Proposed 50% priority duration",
      },
    },
  });

  return {
    newCycleId: newCycle.sla_tracking_id,
    cycleNumber: nextCycleNumber,
    durationMinutes,
    newDueAt,
  };
}

/**
 * Resolves the rework SLA duration (in minutes) for a given priority.
 * Evaluates configured policies in sla_policies where sla_type = 'REWORK_RESOLUTION'.
 * Defaults to the proposed 50% baseline duration (Pending Krishna's Approval).
 */
export async function getReworkSlaDurationMinutes(
  priority: string = "MEDIUM",
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<{ durationMinutes: number; policyId: bigint }> {
  const normPriority = priority.toUpperCase();

  // 1. Check for an active policy with sla_type = 'REWORK_RESOLUTION'
  const reworkPolicy = await client.sla_policies.findFirst({
    where: {
      priority_level: normPriority,
      sla_type: "REWORK_RESOLUTION",
      status: "ACTIVE",
    },
  });

  if (reworkPolicy?.target_duration_minutes) {
    return {
      durationMinutes: reworkPolicy.target_duration_minutes,
      policyId: reworkPolicy.sla_policy_id,
    };
  }

  // 2. Fetch baseline resolution policy and calculate 50% dynamically
  const initialPolicy = await client.sla_policies.findFirst({
    where: {
      priority_level: normPriority,
      sla_type: "RESOLUTION",
      status: "ACTIVE",
    },
  });

  const baselineMinutes =
    initialPolicy?.target_duration_minutes ||
    DEFAULT_SLA_DURATIONS_MINUTES[normPriority] ||
    DEFAULT_SLA_DURATIONS_MINUTES.MEDIUM;

  const durationMinutes = calculateReworkSlaMinutes(
    baselineMinutes,
    DEFAULT_REWORK_SLA_PERCENT,
  );

  const fallbackPolicyId = initialPolicy
    ? initialPolicy.sla_policy_id
    : BigInt(1);

  return {
    durationMinutes,
    policyId: fallbackPolicyId,
  };
}

/**
 * Initiates a separate SLA monitoring cycle for a grievance placed in Rework.
 * Starts only after Department Head review and assignment/action.
 * Duration: Proposed 50% of original priority baseline (Pending Krishna's Approval).
 */
export async function initiateReworkSlaCycle(
  grievanceId: bigint | number | string,
  priority: string = "MEDIUM",
  tx?: Prisma.TransactionClient,
): Promise<{
  newCycleId: bigint;
  cycleNumber: number;
  durationMinutes: number;
  newDueAt: Date;
}> {
  const gId = BigInt(grievanceId);
  const client = tx || prisma;
  const now = new Date();

  // Idempotency check: if an active rework tracking cycle already exists, return it
  const existingActiveRework = await client.sla_tracking.findFirst({
    where: {
      grievance_id: gId,
      cycle_type: "REWORK",
      completed_at: null,
    },
  });

  if (existingActiveRework) {
    return {
      newCycleId: existingActiveRework.sla_tracking_id,
      cycleNumber: existingActiveRework.cycle_number,
      durationMinutes: Math.max(
        1,
        Math.round(
          (existingActiveRework.due_at.getTime() -
            existingActiveRework.started_at.getTime()) /
            60000,
        ),
      ),
      newDueAt: existingActiveRework.due_at,
    };
  }

  // 1. Find cycle 1 tracking to accurately resolve the original baseline duration
  const firstTracking = await client.sla_tracking.findFirst({
    where: { grievance_id: gId, cycle_number: 1 },
    include: { sla_policies: true },
  });

  let originalBaselineMinutes =
    firstTracking?.sla_policies?.target_duration_minutes;
  if (
    !originalBaselineMinutes &&
    firstTracking?.due_at &&
    firstTracking?.started_at
  ) {
    originalBaselineMinutes = Math.round(
      (firstTracking.due_at.getTime() - firstTracking.started_at.getTime()) /
        60000,
    );
  }

  // Find latest tracking cycle to determine new cycle_number
  const lastTracking = await client.sla_tracking.findFirst({
    where: { grievance_id: gId },
    orderBy: { cycle_number: "desc" },
  });

  const nextCycleNumber = (lastTracking?.cycle_number || 0) + 1;

  // 2. Complete previous cycle if open
  if (lastTracking && !lastTracking.completed_at) {
    await client.sla_tracking.update({
      where: { sla_tracking_id: lastTracking.sla_tracking_id },
      data: {
        completed_at: now,
        paused_at: lastTracking.paused_at ?? now,
      },
    });
  }

  // 3. Resolve rework duration & policy (Proposed 50% of original baseline duration)
  const { durationMinutes: fallbackDuration, policyId } =
    await getReworkSlaDurationMinutes(priority, client);

  const durationMinutes = originalBaselineMinutes
    ? calculateReworkSlaMinutes(
        originalBaselineMinutes,
        DEFAULT_REWORK_SLA_PERCENT,
      )
    : fallbackDuration;

  const newDueAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  // 4. Create new SLA tracking cycle
  const newCycle = await client.sla_tracking.create({
    data: {
      grievance_id: gId,
      sla_policy_id: policyId,
      cycle_number: nextCycleNumber,
      cycle_type: "REWORK",
      started_at: now,
      due_at: newDueAt,
      status: "ON_TRACK",
      paused_at: null,
      resumed_at: null,
      completed_at: null,
      accumulated_paused_minutes: 0,
    },
  });

  // 5. Update grievance master record
  await client.grievances.update({
    where: { grievance_id: gId },
    data: {
      due_at: newDueAt,
      sla_status: "ON_TRACK",
      closed_at: null,
      closure_reason: null,
    },
  });

  // Resolve open escalations
  await client.escalations.updateMany({
    where: { grievance_id: gId, status: "OPEN" },
    data: { status: "RESOLVED", resolved_at: now },
  });

  // 6. Update all active grievance_departments with proportional allocated duration and new due date
  const activeDepts = await client.grievance_departments.findMany({
    where: {
      grievance_id: gId,
      status: { notIn: ["REMOVED"] },
    },
  });

  for (const dept of activeDepts) {
    const percentAlloc = dept.sla_percent_allocation
      ? Number(dept.sla_percent_allocation)
      : 100;
    const deptDuration = Math.max(
      1,
      Math.round((durationMinutes * percentAlloc) / 100),
    );

    await client.grievance_departments.update({
      where: { grievance_department_id: dept.grievance_department_id },
      data: {
        due_at: newDueAt,
        sla_status: "ON_TRACK",
        activated_at: now,
        completed_at: null,
        allocated_duration_minutes: deptDuration,
      },
    });
  }

  // 7. Retain in audit logs
  await client.audit_logs.create({
    data: {
      grievance_id: gId,
      user_id: null,
      action: "SLA_CYCLE_CREATED",
      entity_type: "sla_tracking",
      entity_id: newCycle.sla_tracking_id,
      new_value: {
        cycleNumber: nextCycleNumber,
        cycleType: "REWORK",
        durationMinutes,
        dueAt: newDueAt.toISOString(),
        policyType: "REWORK_RESOLUTION",
        baselinePolicy:
          "Proposed 50% priority duration (Pending Krishna's Approval)",
      },
    },
  });

  try {
    await evaluateGrievanceSla(gId);
  } catch (evalErr) {
    console.warn(
      "Non-fatal: failed to evaluate SLA after rework cycle creation:",
      evalErr,
    );
  }

  return {
    newCycleId: newCycle.sla_tracking_id,
    cycleNumber: nextCycleNumber,
    durationMinutes,
    newDueAt,
  };
}

export interface RequestSlaExtensionOptions {
  grievanceId: bigint | number | string;
  staffId: bigint | number | string;
  reason: string;
  requestedDurationMinutes: number;
  tx?: Prisma.TransactionClient;
}

export interface RequestSlaExtensionResult {
  success: boolean;
  message: string;
  extensionId?: bigint;
  grantedMinutes?: number;
}

/**
 * Requests an SLA Extension (Grace Period) per LLD §2.2.26:
 * - 1 request per active SLA cycle (including rejected requests).
 * - Max 2 approved extensions across the grievance lifecycle.
 * - Single extension capped at stricter of 24h or 25% of baseline SLA.
 * - Cumulative approved extensions capped at 25% of baseline SLA.
 * - SLA clock continues to run while pending (does not pause or defer breach).
 */
export async function requestSlaExtension(
  options: RequestSlaExtensionOptions,
): Promise<RequestSlaExtensionResult> {
  const gId = BigInt(options.grievanceId);
  const sId = BigInt(options.staffId);
  const client = options.tx || prisma;

  // 1. Fetch grievance and active SLA tracking cycle with configured policy and departments
  const grievance = await client.grievances.findUnique({
    where: { grievance_id: gId },
    include: {
      sla_tracking: {
        where: {
          completed_at: null,
          status: { in: ["ON_TRACK", "AT_RISK", "BREACHED"] },
        },
        include: {
          sla_policies: true,
        },
        orderBy: { cycle_number: "desc" },
        take: 1,
      },
      grievance_departments: {
        include: {
          assignments: true,
          departments: true,
        },
      },
      assignments: {
        where: {
          staff_id: sId,
          assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
        },
      },
    },
  });

  if (!grievance) {
    return { success: false, message: "Grievance not found" };
  }

  const activeTracking = grievance.sla_tracking[0];
  if (!activeTracking) {
    return {
      success: false,
      message: "No active SLA tracking cycle found for this grievance",
    };
  }

  // Find the staff member's department
  const myAssignment = grievance.assignments?.[0];
  const rawDepts = grievance.grievance_departments || [];
  const myDept =
    rawDepts.find(
      (gd) =>
        (myAssignment?.grievance_department_id &&
          gd.grievance_department_id ===
            myAssignment.grievance_department_id) ||
        gd.assignments?.staff_id === sId,
    ) ||
    rawDepts.find((gd) => gd.involvement_type === "PRIMARY") ||
    rawDepts[0];

  let configuredPolicy: typeof activeTracking.sla_policies | null =
    activeTracking.sla_policies;
  if (!configuredPolicy) {
    configuredPolicy = await client.sla_policies.findFirst({
      where: {
        priority_level: grievance.priority,
        status: "ACTIVE",
      },
    });
  }

  const tc =
    (configuredPolicy?.trigger_condition as Record<string, unknown>) || {};
  const warningThreshold = Number(
    tc.warning_threshold_percent ||
      configuredPolicy?.warning_threshold_percent ||
      DEFAULT_SLA_THRESHOLDS.WARNING_PERCENT,
  );
  const escalationThreshold = Number(
    tc.at_risk_threshold_percent ||
      tc.escalation_threshold_percent ||
      configuredPolicy?.escalation_threshold_percent ||
      DEFAULT_SLA_THRESHOLDS.AT_RISK_PERCENT,
  );

  // Resolve total grievance baseline from configured policy, due date, or priority fallback
  const totalGrievanceMinutes =
    configuredPolicy?.target_duration_minutes ||
    (grievance.due_at && grievance.created_at
      ? Math.max(
          1,
          Math.round(
            (grievance.due_at.getTime() - grievance.created_at.getTime()) /
              60000,
          ),
        )
      : DEFAULT_SLA_DURATIONS_MINUTES[grievance.priority.toUpperCase()] ||
        1440);

  // User requirement: For grace period base value use department's total allocated time, not total time
  let deptBaselineMinutes = myDept?.allocated_duration_minutes;
  if (!deptBaselineMinutes) {
    const allocationPercent = Number(myDept?.sla_percent_allocation || 100);
    deptBaselineMinutes = Math.max(
      1,
      Math.round((totalGrievanceMinutes * allocationPercent) / 100),
    );
  }

  // Department SLA start & due dates
  const deptStart =
    myDept?.activated_at ||
    myDept?.assigned_at ||
    activeTracking.started_at ||
    grievance.created_at;
  const deptDue =
    myDept?.due_at ||
    new Date(deptStart.getTime() + deptBaselineMinutes * 60 * 1000);
  const consumption = calculateSlaConsumption(
    deptStart,
    deptDue,
    grievance.priority,
    new Date(),
    activeTracking.accumulated_paused_minutes || 0,
    activeTracking.paused_at,
  );

  if (consumption.consumptionPercent < warningThreshold) {
    return {
      success: false,
      message: `Grace period can only be requested after at least ${warningThreshold}% of department SLA budget is consumed (currently ${consumption.consumptionPercent}%).`,
    };
  }

  // Grace period must be requested before escalation threshold and cannot be requested if SLA is breached
  if (
    consumption.consumptionPercent >= escalationThreshold ||
    grievance.sla_status === "BREACHED" ||
    activeTracking.status === "BREACHED" ||
    myDept?.sla_status === "BREACHED"
  ) {
    return {
      success: false,
      message: `Grace period cannot be requested once department SLA reaches ${escalationThreshold}% escalation or is breached. Investigation is under Department Head escalation supervision.`,
    };
  }

  // 3. Invariant: One request per active SLA cycle (including rejected requests)
  const existingCycleExtension = await client.sla_extensions.findFirst({
    where: {
      OR: [
        { sla_tracking_id: activeTracking.sla_tracking_id },
        { grievance_id: gId, status: "PENDING" },
      ],
    },
    orderBy: { created_at: "desc" },
  });

  if (existingCycleExtension) {
    return {
      success: false,
      message:
        existingCycleExtension.status === "PENDING"
          ? "You have already submitted a grace period request."
          : "You have already submitted a grace period request for this grievance.",
    };
  }

  // 3. Invariant: Maximum 2 approved extensions across the grievance lifecycle
  const approvedCount = await client.sla_extensions.count({
    where: {
      grievance_id: gId,
      status: "APPROVED",
    },
  });

  if (approvedCount >= MAX_APPROVED_EXTENSIONS_LIFECYCLE) {
    return {
      success: false,
      message: `Maximum limit of ${MAX_APPROVED_EXTENSIONS_LIFECYCLE} approved extensions has been reached for this grievance lifecycle.`,
    };
  }

  // 4. Invariant: Duration limits based on department baseline allocated SLA (25% cap)
  const maxSingleMinutes = Math.max(
    1,
    Math.round((deptBaselineMinutes * 25) / 100),
  );
  const maxCumulativeMinutes = maxSingleMinutes;

  // Check cumulative approved duration
  const approvedExtensions = await client.sla_extensions.findMany({
    where: {
      grievance_id: gId,
      status: "APPROVED",
    },
    select: { granted_duration_minutes: true },
  });

  const cumulativeApprovedMinutes = approvedExtensions.reduce(
    (sum, ext) => sum + (ext.granted_duration_minutes || 0),
    0,
  );

  const remainingCumulativeAllowed = Math.max(
    0,
    maxCumulativeMinutes - cumulativeApprovedMinutes,
  );

  if (remainingCumulativeAllowed <= 0) {
    return {
      success: false,
      message: `The cumulative extension limit of 25% (${maxCumulativeMinutes} minutes) has already been reached for this grievance.`,
    };
  }

  // Requested duration cannot exceed single cap or remaining cumulative cap
  const effectiveRequestedMinutes = Math.min(
    options.requestedDurationMinutes,
    maxSingleMinutes,
    remainingCumulativeAllowed,
  );

  if (effectiveRequestedMinutes <= 0) {
    return {
      success: false,
      message: "Requested extension duration exceeds permitted limits.",
    };
  }

  // 5. Create extension record with status PENDING
  const extension = await client.sla_extensions.create({
    data: {
      grievance_id: gId,
      sla_tracking_id: activeTracking.sla_tracking_id,
      requested_by: sId,
      reason: options.reason.trim(),
      requested_duration_minutes: effectiveRequestedMinutes,
      status: "PENDING",
    },
  });

  // Audit log
  await client.audit_logs.create({
    data: {
      grievance_id: gId,
      user_id: sId,
      action: "SLA_EXTENSION_REQUESTED",
      entity_type: "sla_extensions",
      entity_id: extension.extension_id,
      new_value: {
        requestedMinutes: effectiveRequestedMinutes,
        reason: options.reason,
        cycleNumber: activeTracking.cycle_number,
      },
    },
  });

  // Notify active Department Head(s) of the grace period request
  const activeDeptRecord = await client.grievance_departments.findFirst({
    where: {
      grievance_id: gId,
      status: { notIn: ["COMPLETED", "RESOLVED", "REMOVED", "BLOCKED"] },
    },
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

  const staffUser = await client.users.findUnique({
    where: { user_id: sId },
    select: { first_name: true, last_name: true },
  });
  const staffName = staffUser
    ? `${staffUser.first_name} ${staffUser.last_name || ""}`.trim()
    : "Staff Member";

  const requestedHours = Math.round(effectiveRequestedMinutes / 60);
  const deptHeads = activeDeptRecord?.departments?.users || [];
  for (const head of deptHeads) {
    await client.notifications.create({
      data: {
        user_id: head.user_id,
        grievance_id: gId,
        notification_type: "SLA_EXTENSION_REQUESTED",
        channel: "IN_APP",
        title: `Grace Period Requested: ${grievance.grievance_number}`,
        message: `Staff member ${staffName} has requested a grace period extension of +${requestedHours}h for grievance ${grievance.grievance_number}. Reason: "${options.reason.trim()}".`,
        status: "PENDING",
      },
    });
  }

  return {
    success: true,
    message: `SLA extension request for ${effectiveRequestedMinutes} minutes submitted to Department Head.`,
    extensionId: extension.extension_id,
    grantedMinutes: effectiveRequestedMinutes,
  };
}

export interface ReviewSlaExtensionOptions {
  extensionId: bigint | number | string;
  reviewedBy: bigint | number | string;
  decision: "APPROVE" | "REJECT";
  grantedDurationMinutes?: number;
  rejectionReason?: string;
  tx?: Prisma.TransactionClient;
}

/**
 * Department Head reviews (Approve/Reject) an SLA Extension request.
 * If approved, extends due_at on sla_tracking, grievances, and active grievance_departments.
 */
export async function reviewSlaExtension(
  options: ReviewSlaExtensionOptions,
): Promise<{ success: boolean; message: string; newDueAt?: Date }> {
  const extId = BigInt(options.extensionId);
  const rBy = BigInt(options.reviewedBy);
  const client = options.tx || prisma;
  const now = new Date();

  const extension = await client.sla_extensions.findUnique({
    where: { extension_id: extId },
    include: {
      grievances: true,
      sla_tracking: true,
    },
  });

  if (!extension) {
    return { success: false, message: "SLA extension request not found" };
  }

  if (extension.status !== "PENDING") {
    return {
      success: false,
      message: `Extension request has already been ${extension.status.toLowerCase()}`,
    };
  }

  if (options.decision === "REJECT") {
    await client.sla_extensions.update({
      where: { extension_id: extId },
      data: {
        status: "REJECTED",
        reviewed_by: rBy,
        reviewed_at: now,
        rejection_reason:
          options.rejectionReason || "Extension rejected by Department Head",
      },
    });

    await client.audit_logs.create({
      data: {
        grievance_id: extension.grievance_id,
        user_id: rBy,
        action: "SLA_EXTENSION_REJECTED",
        entity_type: "sla_extensions",
        entity_id: extId,
        new_value: {
          rejectionReason: options.rejectionReason,
        },
      },
    });

    // Notify requesting staff member of rejection
    await client.notifications.create({
      data: {
        user_id: extension.requested_by,
        grievance_id: extension.grievance_id,
        notification_type: "SLA_EXTENSION_REJECTED",
        channel: "IN_APP",
        title: `Grace Period Declined: ${extension.grievances.grievance_number}`,
        message: `Your grace period request for grievance ${extension.grievances.grievance_number} was declined by Department Head. Reason: "${options.rejectionReason || "Declined by Department Head"}".`,
        status: "PENDING",
      },
    });

    return { success: true, message: "SLA extension rejected successfully" };
  }

  // APPROVE
  const grantedMinutes =
    options.grantedDurationMinutes ?? extension.requested_duration_minutes;

  await client.sla_extensions.update({
    where: { extension_id: extId },
    data: {
      status: "APPROVED",
      granted_duration_minutes: grantedMinutes,
      reviewed_by: rBy,
      reviewed_at: now,
    },
  });

  // Extend due_at on active SLA tracking cycle
  const currentSlaDue = extension.sla_tracking.due_at;
  const newSlaDueAt = new Date(
    currentSlaDue.getTime() + grantedMinutes * 60 * 1000,
  );

  await client.sla_tracking.update({
    where: { sla_tracking_id: extension.sla_tracking_id },
    data: {
      due_at: newSlaDueAt,
      status: "ON_TRACK",
    },
  });

  // Extend due_at on grievance master record
  let newGrievanceDueAt: Date | undefined;
  if (extension.grievances.due_at) {
    newGrievanceDueAt = new Date(
      extension.grievances.due_at.getTime() + grantedMinutes * 60 * 1000,
    );
    await client.grievances.update({
      where: { grievance_id: extension.grievance_id },
      data: {
        due_at: newGrievanceDueAt,
        sla_status: "ON_TRACK",
      },
    });
  }

  // Extend due_at and allocated_duration_minutes on active grievance_departments
  const activeDepts = await client.grievance_departments.findMany({
    where: {
      grievance_id: extension.grievance_id,
      status: { notIn: ["COMPLETED", "RESOLVED", "REMOVED", "BLOCKED"] },
      due_at: { not: null },
    },
  });

  for (const dept of activeDepts) {
    if (dept.due_at) {
      const newDeptDueAt = new Date(
        dept.due_at.getTime() + grantedMinutes * 60 * 1000,
      );
      const currentAlloc =
        dept.allocated_duration_minutes && dept.allocated_duration_minutes > 0
          ? dept.allocated_duration_minutes
          : Math.max(
              1,
              Math.round(
                (dept.due_at.getTime() -
                  (
                    dept.activated_at ||
                    dept.assigned_at ||
                    extension.sla_tracking.started_at
                  ).getTime()) /
                  60000,
              ),
            );
      const newAlloc = currentAlloc + grantedMinutes;

      await client.grievance_departments.update({
        where: { grievance_department_id: dept.grievance_department_id },
        data: {
          due_at: newDeptDueAt,
          allocated_duration_minutes: newAlloc,
          sla_status: "ON_TRACK",
        },
      });
    }
  }

  // Resolve any open escalations since grace period was approved and SLA is reset to ON_TRACK
  await client.escalations.updateMany({
    where: { grievance_id: extension.grievance_id, status: "OPEN" },
    data: { status: "RESOLVED", resolved_at: now },
  });

  await client.audit_logs.create({
    data: {
      grievance_id: extension.grievance_id,
      user_id: rBy,
      action: "SLA_EXTENSION_APPROVED",
      entity_type: "sla_extensions",
      entity_id: extId,
      new_value: {
        grantedMinutes,
        newDueAt: (newGrievanceDueAt || newSlaDueAt).toISOString(),
      },
    },
  });

  const finalNewDue = newGrievanceDueAt || newSlaDueAt;
  const formattedNewDeadline = finalNewDue.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Notify requesting staff member of approval
  await client.notifications.create({
    data: {
      user_id: extension.requested_by,
      grievance_id: extension.grievance_id,
      notification_type: "SLA_EXTENSION_APPROVED",
      channel: "IN_APP",
      title: `Grace Period Approved: ${extension.grievances.grievance_number}`,
      message: `Your request for a +${Math.round(grantedMinutes / 60)}h grace period extension for grievance ${extension.grievances.grievance_number} was approved by Department Head. Updated target resolution deadline: ${formattedNewDeadline}.`,
      status: "PENDING",
    },
  });

  // Notify the employee / citizen who submitted the grievance of the updated resolution target
  if (extension.grievances?.submitted_by) {
    await client.notifications.create({
      data: {
        user_id: extension.grievances.submitted_by,
        grievance_id: extension.grievance_id,
        notification_type: "RESOLUTION_TIMELINE_UPDATED",
        channel: "IN_APP",
        title: `Resolution Timeline Updated: ${extension.grievances.grievance_number}`,
        message: `The resolution deadline for your grievance ${extension.grievances.grievance_number} has been extended by ${Math.round(grantedMinutes / 60)}h. New target resolution deadline: ${formattedNewDeadline}.`,
        status: "PENDING",
      },
    });
  }

  // Proactively re-evaluate SLA to immediately recalculate consumption percentages and trigger notifications under the extended window
  try {
    await evaluateGrievanceSla(extension.grievance_id);
  } catch (evalErr) {
    console.warn(
      "Non-fatal: failed to evaluate SLA after extension review:",
      evalErr,
    );
  }

  return {
    success: true,
    message: `SLA extension approved. Extended by ${grantedMinutes} minutes.`,
    newDueAt: newGrievanceDueAt || newSlaDueAt,
  };
}

export interface AutoClosureSummary {
  totalProcessed: number;
  resolvedInactivityCount: number;
  infoNonResponseCount: number;
  closedGrievanceIds: string[];
  errors?: Array<{ grievanceId: string; error: string }>;
}

export interface ReminderSummary {
  totalEvaluated: number;
  totalRemindersSent: number;
  resolutionReminders: number;
  infoRequestReminders: number;
  supportingDeptReminders: number;
  investigationReminders: number;
  remindedGrievanceIds: string[];
  errors?: Array<{ grievanceId: string; error: string }>;
}

interface GrievanceForClosure {
  grievance_id: bigint;
  grievance_number: string;
  status: string;
  submitted_by: bigint;
  priority: string;
  created_at: Date;
  due_at: Date | null;
  updated_at: Date;
  sla_tracking?: Array<{
    started_at: Date;
    due_at: Date;
    accumulated_paused_minutes: number;
    paused_at: Date | null;
    cycle_number: number;
    cycle_type: string;
  }>;
}

/**
 * Atomically executes all database mutations for a single auto-closed grievance:
 * 1. Updates grievance status to 'CLOSED' and records the specific closure reason.
 * 2. Marks active assignments as 'COMPLETED'.
 * 3. Marks grievance departments as 'COMPLETED'.
 * 4. Permanently completes SLA tracking (retaining paused_at).
 * 5. Appends transition to grievance_status_history.
 * 6. Logs structured audit_logs event retaining SLA metrics.
 * 7. Generates non-response closure notifications to submitter, assigned staff, and department heads with idempotency protection.
 */
async function executeSingleAutoClosure(
  tx: Prisma.TransactionClient,
  g: GrievanceForClosure,
  reason: "RESOLVED_INACTIVITY" | "INFO_REQUEST_NON_RESPONSE",
  inactivityDays: number,
  now: Date,
): Promise<void> {
  const activeTracking = g.sla_tracking?.[0];
  const { totalDurationMinutes, elapsedMinutes } = calculateSlaConsumption(
    activeTracking?.started_at || g.created_at,
    activeTracking?.due_at || g.due_at,
    g.priority,
    now,
    activeTracking?.accumulated_paused_minutes || 0,
    activeTracking?.paused_at,
  );
  const remainingMinutes = Math.max(0, totalDurationMinutes - elapsedMinutes);

  // 1. Update grievance status and closure metadata
  await tx.grievances.update({
    where: { grievance_id: g.grievance_id },
    data: {
      status: "CLOSED",
      closed_at: now,
      closure_reason: reason,
    },
  });

  // 2. Mark active assignments as COMPLETED
  await tx.assignments.updateMany({
    where: {
      grievance_id: g.grievance_id,
      assignment_status: "ASSIGNED",
    },
    data: {
      assignment_status: "COMPLETED",
      completed_at: now,
    },
  });

  // 3. Mark involved departments as COMPLETED
  await tx.grievance_departments.updateMany({
    where: {
      grievance_id: g.grievance_id,
      status: { notIn: ["REMOVED"] },
    },
    data: {
      status: "COMPLETED",
      completed_at: now,
    },
  });

  // 4. Permanently complete SLA tracking
  await completeSlaTracking(g.grievance_id, tx);

  // 5. Record status history
  const historyRemarks =
    reason === "RESOLVED_INACTIVITY"
      ? `Auto-closed after ${inactivityDays} days without employee response to proposed resolution.`
      : `Auto-closed after ${inactivityDays} days without response to additional information/document request.`;

  await tx.grievance_status_history.create({
    data: {
      grievance_id: g.grievance_id,
      old_status: g.status,
      new_status: "CLOSED",
      changed_by: g.submitted_by,
      remarks: historyRemarks,
    },
  });

  // 6. Record audit log
  const auditNote =
    reason === "RESOLVED_INACTIVITY"
      ? `Automatically closed after ${inactivityDays} days of employee inactivity following resolution. SLA remains permanently paused.`
      : `Automatically closed after ${inactivityDays} days without submission of requested information/documents. Existing SLA cycle permanently stopped.`;

  await tx.audit_logs.create({
    data: {
      grievance_id: g.grievance_id,
      user_id: null,
      action: "AUTO_CLOSED",
      entity_type: "GRIEVANCE",
      entity_id: g.grievance_id,
      new_value: {
        closureReason: reason,
        elapsedDurationMinutes: elapsedMinutes,
        remainingDurationMinutes: remainingMinutes,
        totalDurationMinutes,
        accumulatedPausedMinutes:
          activeTracking?.accumulated_paused_minutes || 0,
        pausedAt: activeTracking?.paused_at,
        cycleNumber: activeTracking?.cycle_number || 1,
        cycleType: activeTracking?.cycle_type || "INITIAL",
        note: auditNote,
      },
    },
  });

  // 7. Generate non-response notifications
  const notifType: NotificationType =
    reason === "RESOLVED_INACTIVITY"
      ? "RESOLUTION_AUTO_CLOSED"
      : "INFO_REQUEST_AUTO_CLOSED";

  const cycleStartTime = activeTracking?.started_at || g.created_at;
  const notifiedUserIds = new Set<string>();

  // A. Submitting employee notification
  if (g.submitted_by) {
    const employeeTitle =
      reason === "RESOLVED_INACTIVITY"
        ? `Grievance Automatically Closed: ${g.grievance_number}`
        : `Grievance Closed - Information Request Expired: ${g.grievance_number}`;
    const employeeMessage =
      reason === "RESOLVED_INACTIVITY"
        ? `Your grievance ${g.grievance_number} has been automatically closed after ${inactivityDays} days without response to the proposed resolution.`
        : `Your grievance ${g.grievance_number} has been automatically closed because the requested additional information was not provided within ${inactivityDays} days.`;

    const existingEmpNotif = await tx.notifications.findFirst({
      where: {
        user_id: g.submitted_by,
        grievance_id: g.grievance_id,
        notification_type: notifType,
        created_at: { gte: cycleStartTime },
      },
    });

    if (!existingEmpNotif) {
      await tx.notifications.create({
        data: {
          user_id: g.submitted_by,
          grievance_id: g.grievance_id,
          notification_type: notifType,
          channel: "IN_APP",
          title: employeeTitle,
          message: employeeMessage,
          status: "PENDING",
        },
      });
    }
    notifiedUserIds.add(g.submitted_by.toString());
  }

  // B. Assigned Investigation Staff notification
  const assignments = await tx.assignments.findMany({
    where: { grievance_id: g.grievance_id },
    select: { staff_id: true },
  });

  const staffTitle =
    reason === "RESOLVED_INACTIVITY"
      ? `Grievance Auto-Closed (Resolution Non-Response): ${g.grievance_number}`
      : `Grievance Auto-Closed (Information Request Expired): ${g.grievance_number}`;
  const staffMessage =
    reason === "RESOLVED_INACTIVITY"
      ? `Grievance ${g.grievance_number} has been automatically closed after ${inactivityDays} days of employee inactivity following resolution.`
      : `Grievance ${g.grievance_number} has been automatically closed because the employee did not provide requested information within ${inactivityDays} days.`;

  for (const asgn of assignments) {
    if (!asgn.staff_id) continue;
    const staffIdStr = asgn.staff_id.toString();
    if (notifiedUserIds.has(staffIdStr)) continue;
    notifiedUserIds.add(staffIdStr);

    const existingStaffNotif = await tx.notifications.findFirst({
      where: {
        user_id: asgn.staff_id,
        grievance_id: g.grievance_id,
        notification_type: notifType,
        created_at: { gte: cycleStartTime },
      },
    });

    if (!existingStaffNotif) {
      await tx.notifications.create({
        data: {
          user_id: asgn.staff_id,
          grievance_id: g.grievance_id,
          notification_type: notifType,
          channel: "IN_APP",
          title: staffTitle,
          message: staffMessage,
          status: "PENDING",
        },
      });
    }
  }

  // C. Primary & involved Department Heads notification
  const depts = await tx.grievance_departments.findMany({
    where: {
      grievance_id: g.grievance_id,
      status: { notIn: ["REMOVED"] },
    },
    select: { department_id: true },
  });

  const deptIds = depts.map((d) => d.department_id);
  if (deptIds.length > 0) {
    const deptHeads = await tx.users.findMany({
      where: {
        department_id: { in: deptIds },
        roles: { role_name: { in: ["DEPARTMENT_HEAD", "ADMIN"] } },
        status: "ACTIVE",
      },
      select: { user_id: true },
    });

    for (const head of deptHeads) {
      const headIdStr = head.user_id.toString();
      if (notifiedUserIds.has(headIdStr)) continue;
      notifiedUserIds.add(headIdStr);

      const existingHeadNotif = await tx.notifications.findFirst({
        where: {
          user_id: head.user_id,
          grievance_id: g.grievance_id,
          notification_type: notifType,
          created_at: { gte: cycleStartTime },
        },
      });

      if (!existingHeadNotif) {
        await tx.notifications.create({
          data: {
            user_id: head.user_id,
            grievance_id: g.grievance_id,
            notification_type: notifType,
            channel: "IN_APP",
            title: staffTitle,
            message: staffMessage,
            status: "PENDING",
          },
        });
      }
    }
  }
}

/**
 * Resolves the applicable response inactivity days for a grievance based on active reopen/lifecycle policies.
 * Evaluates category and subcategory specificity, falling back to defaultDays (default 7 days).
 */
function getPolicyInactivityDays(
  g: { category_id: bigint; subcategory_id: bigint | null },
  activePolicies: Array<{
    applicable_condition: unknown;
    created_at: Date;
  }>,
  field: "resolution_inactivity_days" | "additional_info_days",
  defaultDays: number,
): number {
  const catStr = g.category_id.toString();
  const subcatStr = g.subcategory_id ? g.subcategory_id.toString() : null;

  // Filter policies matching this grievance
  const matching = activePolicies.filter((p) => {
    if (!p.applicable_condition || typeof p.applicable_condition !== "object") {
      return true; // global policy applies
    }
    const cond = p.applicable_condition as Record<string, unknown>;
    const cCat = cond.category_id ? String(cond.category_id) : undefined;
    const cSubcat = cond.subcategory_id
      ? String(cond.subcategory_id)
      : undefined;

    if (cCat && cCat !== catStr) return false;
    if (cSubcat && cSubcat !== subcatStr) return false;
    return true;
  });

  // Sort matching policies by specificity descending, then newest created_at
  matching.sort((a, b) => {
    const condA = (a.applicable_condition as Record<string, unknown>) || {};
    const condB = (b.applicable_condition as Record<string, unknown>) || {};
    const scoreA = (condA.category_id ? 1 : 0) + (condA.subcategory_id ? 1 : 0);
    const scoreB = (condB.category_id ? 1 : 0) + (condB.subcategory_id ? 1 : 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  for (const p of matching) {
    const cond = (p.applicable_condition as Record<string, unknown>) || {};
    if (cond[field] !== undefined && cond[field] !== null) {
      const val = Number(cond[field]);
      if (!Number.isNaN(val) && val > 0) {
        return val;
      }
    }
  }

  return defaultDays;
}

/**
 * Resolves the applicable reminder interval hours for a grievance based on active reopen/lifecycle policies.
 * Evaluates category and subcategory specificity, falling back to defaultHours (default 24 hours).
 */
function getPolicyReminderHours(
  g: { category_id: bigint; subcategory_id: bigint | null },
  activePolicies: Array<{
    applicable_condition: unknown;
    created_at: Date;
  }>,
  defaultHours: number,
): number {
  const catStr = g.category_id.toString();
  const subcatStr = g.subcategory_id ? g.subcategory_id.toString() : null;

  const matching = activePolicies.filter((p) => {
    if (!p.applicable_condition || typeof p.applicable_condition !== "object") {
      return true;
    }
    const cond = p.applicable_condition as Record<string, unknown>;
    const cCat = cond.category_id ? String(cond.category_id) : undefined;
    const cSubcat = cond.subcategory_id
      ? String(cond.subcategory_id)
      : undefined;

    if (cCat && cCat !== catStr) return false;
    if (cSubcat && cSubcat !== subcatStr) return false;
    return true;
  });

  matching.sort((a, b) => {
    const condA = (a.applicable_condition as Record<string, unknown>) || {};
    const condB = (b.applicable_condition as Record<string, unknown>) || {};
    const scoreA = (condA.category_id ? 1 : 0) + (condA.subcategory_id ? 1 : 0);
    const scoreB = (condB.category_id ? 1 : 0) + (condB.subcategory_id ? 1 : 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  for (const p of matching) {
    const cond = (p.applicable_condition as Record<string, unknown>) || {};
    if (
      cond.reminder_interval_hours !== undefined &&
      cond.reminder_interval_hours !== null
    ) {
      const val = Number(cond.reminder_interval_hours);
      if (!Number.isNaN(val) && val > 0) {
        return val;
      }
    }
  }

  return defaultHours;
}

/**
 * Sweeps and automatically closes:
 * 1. RESOLVED grievances where the employee has not responded within responsePeriodDays (default 7 days).
 *    Sets closure_reason = 'RESOLVED_INACTIVITY' and keeps SLA permanently paused.
 * 2. AWAITING_INFORMATION grievances where the employee has not provided requested info within responsePeriodDays (default 7 days).
 *    Sets closure_reason = 'INFO_REQUEST_NON_RESPONSE' and permanently stops the existing SLA cycle.
 *
 * Each grievance auto-closure executes atomically in its own database transaction.
 * A failure on one grievance rolls back all its mutations and isolates the error without terminating the sweep.
 */
export async function processAutoClosures(
  responsePeriodDays?: number,
  tx?: Prisma.TransactionClient,
): Promise<AutoClosureSummary> {
  const client = tx || prisma;
  const now = new Date();

  // Retrieve active lifecycle & closure policies for category-specific or global inactivity timers
  const activePolicies = await client.reopen_policies.findMany({
    where: { status: "ACTIVE" },
    orderBy: { created_at: "desc" },
  });

  const defaultDays = responsePeriodDays || 7;
  // A grievance candidate must be at least 1 day old (minimum possible configured inactivity days)
  const minCutoffDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  const summary: AutoClosureSummary = {
    totalProcessed: 0,
    resolvedInactivityCount: 0,
    infoNonResponseCount: 0,
    closedGrievanceIds: [],
    errors: [],
  };

  // 1. Auto-close RESOLVED grievances
  const resolvedCandidates = await client.grievances.findMany({
    where: {
      status: "RESOLVED",
      closed_at: null,
      updated_at: { lte: minCutoffDate },
    },
    include: {
      sla_tracking: {
        orderBy: { cycle_number: "desc" },
        take: 1,
      },
    },
  });

  for (const g of resolvedCandidates) {
    const resInactivityDays = getPolicyInactivityDays(
      g,
      activePolicies,
      "resolution_inactivity_days",
      defaultDays,
    );
    const grievanceCutoffDate = new Date(
      now.getTime() - resInactivityDays * 24 * 60 * 60 * 1000,
    );
    // If the grievance has not yet exceeded its specific response period, skip
    if (g.updated_at > grievanceCutoffDate) {
      continue;
    }

    try {
      if (tx) {
        await executeSingleAutoClosure(
          tx,
          g,
          "RESOLVED_INACTIVITY",
          resInactivityDays,
          now,
        );
      } else {
        await prisma.$transaction(async (innerTx) => {
          await executeSingleAutoClosure(
            innerTx,
            g,
            "RESOLVED_INACTIVITY",
            resInactivityDays,
            now,
          );
        });
      }

      summary.totalProcessed++;
      summary.resolvedInactivityCount++;
      summary.closedGrievanceIds.push(g.grievance_id.toString());
    } catch (err) {
      console.error(
        `Failed to auto-close resolved grievance ${g.grievance_id}:`,
        err,
      );
      if (!summary.errors) summary.errors = [];
      summary.errors.push({
        grievanceId: g.grievance_id.toString(),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 2. Auto-close AWAITING_INFORMATION / WAITING_ON_USER grievances
  const infoCandidates = await client.grievances.findMany({
    where: {
      status: {
        in: ["AWAITING_INFORMATION", "WAITING_ON_USER", "WAITING_ON_EMPLOYEE"],
      },
      closed_at: null,
      updated_at: { lte: minCutoffDate },
    },
    include: {
      sla_tracking: {
        orderBy: { cycle_number: "desc" },
        take: 1,
      },
    },
  });

  for (const g of infoCandidates) {
    const infoInactivityDays = getPolicyInactivityDays(
      g,
      activePolicies,
      "additional_info_days",
      defaultDays,
    );
    const grievanceCutoffDate = new Date(
      now.getTime() - infoInactivityDays * 24 * 60 * 60 * 1000,
    );
    // If the grievance has not yet exceeded its specific response period, skip
    if (g.updated_at > grievanceCutoffDate) {
      continue;
    }

    try {
      if (tx) {
        await executeSingleAutoClosure(
          tx,
          g,
          "INFO_REQUEST_NON_RESPONSE",
          infoInactivityDays,
          now,
        );
      } else {
        await prisma.$transaction(async (innerTx) => {
          await executeSingleAutoClosure(
            innerTx,
            g,
            "INFO_REQUEST_NON_RESPONSE",
            infoInactivityDays,
            now,
          );
        });
      }

      summary.totalProcessed++;
      summary.infoNonResponseCount++;
      summary.closedGrievanceIds.push(g.grievance_id.toString());
    } catch (err) {
      console.error(
        `Failed to auto-close awaiting info grievance ${g.grievance_id}:`,
        err,
      );
      if (!summary.errors) summary.errors = [];
      summary.errors.push({
        grievanceId: g.grievance_id.toString(),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return summary;
}

/**
 * Sweeps and evaluates pre-expiry action-based reminders across active grievances (LLD §3.7.4):
 * 1. RESOLUTION_REMINDER: Submitting Employee reminder for pending resolution review.
 * 2. INFO_REQUEST_REMINDER: Submitting Employee reminder for pending additional information submission.
 * 3. SUPPORTING_DEPT_REMINDER: Supporting Department Staff & Head reminder before departmental due date.
 * 4. INVESTIGATION_REMINDER: Primary Investigation Staff reminder before departmental SLA deadline.
 *
 * Reminders trigger strictly within the pre-expiry window (default 24 hours before deadline).
 * Completed, closed, expired, or cancelled actions do not receive reminders.
 * Idempotency is action-specific and cycle-isolated, preventing duplicate notifications.
 */
export async function processPreExpiryReminders(options?: {
  tx?: Prisma.TransactionClient;
  now?: Date;
  defaultReminderHours?: number;
}): Promise<ReminderSummary> {
  const client = options?.tx || prisma;
  const now = options?.now || new Date();
  const defaultHours = options?.defaultReminderHours || 24;

  const activePolicies = await client.reopen_policies.findMany({
    where: { status: "ACTIVE" },
    orderBy: { created_at: "desc" },
  });

  const summary: ReminderSummary = {
    totalEvaluated: 0,
    totalRemindersSent: 0,
    resolutionReminders: 0,
    infoRequestReminders: 0,
    supportingDeptReminders: 0,
    investigationReminders: 0,
    remindedGrievanceIds: [],
    errors: [],
  };

  // ---------------------------------------------------------
  // 1. RESOLUTION_REMINDER (Employee Resolution Review)
  // ---------------------------------------------------------
  try {
    const resolvedCandidates = await client.grievances.findMany({
      where: {
        status: "RESOLVED",
        closed_at: null,
      },
      include: {
        resolutions: {
          orderBy: { submitted_at: "desc" },
          take: 1,
        },
      },
    });

    for (const g of resolvedCandidates) {
      summary.totalEvaluated++;
      try {
        const latestRes = g.resolutions?.[0];
        if (!latestRes?.submitted_at) continue;

        const resDays = getPolicyInactivityDays(
          g,
          activePolicies,
          "resolution_inactivity_days",
          7,
        );
        const reminderHours = getPolicyReminderHours(
          g,
          activePolicies,
          defaultHours,
        );

        const actionStartTime = latestRes.submitted_at;
        const actionDeadline = new Date(
          actionStartTime.getTime() + resDays * 24 * 60 * 60 * 1000,
        );
        const reminderWindowMs = reminderHours * 60 * 60 * 1000;
        const reminderStartTime = new Date(
          actionDeadline.getTime() - reminderWindowMs,
        );

        // Window check: triggers only when reminderStartTime <= now < actionDeadline
        if (now < reminderStartTime || now >= actionDeadline) {
          continue;
        }

        // Action-specific idempotency check
        const existing = await client.notifications.findFirst({
          where: {
            user_id: g.submitted_by,
            grievance_id: g.grievance_id,
            notification_type: "RESOLUTION_REMINDER",
            created_at: { gte: actionStartTime },
          },
        });
        if (existing) continue;

        const hoursRemaining = Math.max(
          0,
          (actionDeadline.getTime() - now.getTime()) / (60 * 60 * 1000),
        );
        const roundedHours = Math.round(hoursRemaining * 10) / 10;

        const sendMutation = async (txClient: Prisma.TransactionClient) => {
          await txClient.notifications.create({
            data: {
              user_id: g.submitted_by,
              grievance_id: g.grievance_id,
              notification_type: "RESOLUTION_REMINDER",
              channel: "IN_APP",
              title: `Action Required: Resolution Review Reminder (${g.grievance_number})`,
              message: `Resolution for grievance ${g.grievance_number} was submitted for your review. Please confirm or request rework within the remaining ${roundedHours} hours before automatic closure.`,
              status: "PENDING",
            },
          });

          await txClient.audit_logs.create({
            data: {
              grievance_id: g.grievance_id,
              user_id: null,
              action: "ACTION_REMINDER_GENERATED",
              entity_type: "GRIEVANCE",
              entity_id: g.grievance_id,
              new_value: {
                reminderType: "RESOLUTION_REMINDER",
                recipientUserId: g.submitted_by.toString(),
                recipientRole: "END_USER",
                grievanceNumber: g.grievance_number,
                actionDeadline: actionDeadline.toISOString(),
                hoursRemaining: roundedHours,
                channel: "IN_APP",
                note: "Pre-expiry reminder generated for resolution confirmation.",
              },
            },
          });
        };

        if (options?.tx) {
          await sendMutation(options.tx);
        } else {
          await prisma.$transaction(sendMutation);
        }

        summary.totalRemindersSent++;
        summary.resolutionReminders++;
        if (!summary.remindedGrievanceIds.includes(g.grievance_id.toString())) {
          summary.remindedGrievanceIds.push(g.grievance_id.toString());
        }
      } catch (candErr) {
        console.error(
          `Failed to process resolution reminder for grievance ${g.grievance_id}:`,
          candErr,
        );
        if (!summary.errors) summary.errors = [];
        summary.errors.push({
          grievanceId: g.grievance_id.toString(),
          error: candErr instanceof Error ? candErr.message : String(candErr),
        });
      }
    }
  } catch (err) {
    console.error("Error querying resolution reminder candidates:", err);
  }

  // ---------------------------------------------------------
  // 2. INFO_REQUEST_REMINDER (Employee Information Request)
  // ---------------------------------------------------------
  try {
    const infoCandidates = await client.grievances.findMany({
      where: {
        status: {
          in: [
            "AWAITING_INFORMATION",
            "WAITING_ON_USER",
            "WAITING_ON_EMPLOYEE",
          ],
        },
        closed_at: null,
      },
      include: {
        grievance_status_history: {
          where: {
            new_status: {
              in: [
                "AWAITING_INFORMATION",
                "WAITING_ON_USER",
                "WAITING_ON_EMPLOYEE",
              ],
            },
          },
          orderBy: { changed_at: "desc" },
          take: 1,
        },
      },
    });

    for (const g of infoCandidates) {
      summary.totalEvaluated++;
      try {
        const latestHistory = g.grievance_status_history?.[0];
        const actionStartTime = latestHistory?.changed_at || g.updated_at;
        const infoDays = getPolicyInactivityDays(
          g,
          activePolicies,
          "additional_info_days",
          7,
        );
        const reminderHours = getPolicyReminderHours(
          g,
          activePolicies,
          defaultHours,
        );

        const actionDeadline = new Date(
          actionStartTime.getTime() + infoDays * 24 * 60 * 60 * 1000,
        );
        const reminderWindowMs = reminderHours * 60 * 60 * 1000;
        const reminderStartTime = new Date(
          actionDeadline.getTime() - reminderWindowMs,
        );

        if (now < reminderStartTime || now >= actionDeadline) {
          continue;
        }

        const existing = await client.notifications.findFirst({
          where: {
            user_id: g.submitted_by,
            grievance_id: g.grievance_id,
            notification_type: "INFO_REQUEST_REMINDER",
            created_at: { gte: actionStartTime },
          },
        });
        if (existing) continue;

        const hoursRemaining = Math.max(
          0,
          (actionDeadline.getTime() - now.getTime()) / (60 * 60 * 1000),
        );
        const roundedHours = Math.round(hoursRemaining * 10) / 10;

        const sendMutation = async (txClient: Prisma.TransactionClient) => {
          await txClient.notifications.create({
            data: {
              user_id: g.submitted_by,
              grievance_id: g.grievance_id,
              notification_type: "INFO_REQUEST_REMINDER",
              channel: "IN_APP",
              title: `Reminder: Additional Information Required (${g.grievance_number})`,
              message: `Requested additional information/documents for grievance ${g.grievance_number} are pending. Please submit within the remaining ${roundedHours} hours to prevent automatic closure.`,
              status: "PENDING",
            },
          });

          await txClient.audit_logs.create({
            data: {
              grievance_id: g.grievance_id,
              user_id: null,
              action: "ACTION_REMINDER_GENERATED",
              entity_type: "GRIEVANCE",
              entity_id: g.grievance_id,
              new_value: {
                reminderType: "INFO_REQUEST_REMINDER",
                recipientUserId: g.submitted_by.toString(),
                recipientRole: "END_USER",
                grievanceNumber: g.grievance_number,
                actionDeadline: actionDeadline.toISOString(),
                hoursRemaining: roundedHours,
                channel: "IN_APP",
                note: "Pre-expiry reminder generated for additional information request.",
              },
            },
          });
        };

        if (options?.tx) {
          await sendMutation(options.tx);
        } else {
          await prisma.$transaction(sendMutation);
        }

        summary.totalRemindersSent++;
        summary.infoRequestReminders++;
        if (!summary.remindedGrievanceIds.includes(g.grievance_id.toString())) {
          summary.remindedGrievanceIds.push(g.grievance_id.toString());
        }
      } catch (candErr) {
        console.error(
          `Failed to process info reminder for grievance ${g.grievance_id}:`,
          candErr,
        );
        if (!summary.errors) summary.errors = [];
        summary.errors.push({
          grievanceId: g.grievance_id.toString(),
          error: candErr instanceof Error ? candErr.message : String(candErr),
        });
      }
    }
  } catch (err) {
    console.error("Error querying info reminder candidates:", err);
  }

  // ---------------------------------------------------------
  // 3. SUPPORTING_DEPT_REMINDER (Department Deadline Response)
  // ---------------------------------------------------------
  try {
    const suppGrievances = await client.grievances.findMany({
      where: {
        closed_at: null,
        status: { notIn: ["CLOSED", "RESOLVED"] },
        grievance_departments: {
          some: {
            involvement_type: { not: "PRIMARY" },
            status: { notIn: ["COMPLETED", "REMOVED"] },
            due_at: { not: null },
          },
        },
      },
      include: {
        grievance_departments: {
          where: {
            involvement_type: { not: "PRIMARY" },
            status: { notIn: ["COMPLETED", "REMOVED"] },
            due_at: { not: null },
          },
          include: {
            departments: true,
            assignments: {
              where: { assignment_status: "ASSIGNED" },
            },
          },
        },
      },
    });

    for (const g of suppGrievances) {
      summary.totalEvaluated++;
      for (const gd of g.grievance_departments) {
        try {
          if (!gd.due_at) continue;

          const actionStartTime =
            gd.activated_at || gd.assigned_at || g.created_at;
          const actionDeadline = gd.due_at;
          const reminderHours = getPolicyReminderHours(
            g,
            activePolicies,
            defaultHours,
          );
          const reminderWindowMs = reminderHours * 60 * 60 * 1000;
          const reminderStartTime = new Date(
            actionDeadline.getTime() - reminderWindowMs,
          );

          if (now < reminderStartTime || now >= actionDeadline) {
            continue;
          }

          const hoursRemaining = Math.max(
            0,
            (actionDeadline.getTime() - now.getTime()) / (60 * 60 * 1000),
          );
          const roundedHours = Math.round(hoursRemaining * 10) / 10;

          // Recipients: Assigned staff + Department Heads
          const recipients: Array<{ userId: bigint; role: string }> = [];

          if (gd.assignments?.staff_id) {
            recipients.push({
              userId: gd.assignments.staff_id,
              role: "SUPPORTING_STAFF",
            });
          }

          const heads = await client.users.findMany({
            where: {
              department_id: gd.department_id,
              roles: { role_name: { in: ["DEPARTMENT_HEAD", "ADMIN"] } },
              status: "ACTIVE",
            },
            select: { user_id: true, roles: { select: { role_name: true } } },
          });

          for (const h of heads) {
            if (!recipients.some((r) => r.userId === h.user_id)) {
              recipients.push({
                userId: h.user_id,
                role: h.roles?.role_name || "DEPARTMENT_HEAD",
              });
            }
          }

          const deptTag = `[Dept #${gd.department_id}]`;

          for (const recipient of recipients) {
            // Department-specific idempotency check:
            // Uses deptTag so that a Department Head managing multiple departments on the same grievance
            // receives independent reminders for each department without cross-department suppression.
            const existing = await client.notifications.findFirst({
              where: {
                user_id: recipient.userId,
                grievance_id: g.grievance_id,
                notification_type: "SUPPORTING_DEPT_REMINDER",
                message: { contains: deptTag },
                created_at: { gte: actionStartTime },
              },
            });
            if (existing) continue;

            const sendMutation = async (txClient: Prisma.TransactionClient) => {
              await txClient.notifications.create({
                data: {
                  user_id: recipient.userId,
                  grievance_id: g.grievance_id,
                  notification_type: "SUPPORTING_DEPT_REMINDER",
                  channel: "IN_APP",
                  title: `Upcoming Deadline: Supporting Department Response (${gd.departments.department_name})`,
                  message: `${deptTag} Supporting departmental findings for Grievance ${g.grievance_number} (${gd.departments.department_name}) are due in ${roundedHours} hours (deadline: ${actionDeadline.toISOString()}).`,
                  status: "PENDING",
                },
              });

              await txClient.audit_logs.create({
                data: {
                  grievance_id: g.grievance_id,
                  user_id: null,
                  action: "ACTION_REMINDER_GENERATED",
                  entity_type: "GRIEVANCE",
                  entity_id: g.grievance_id,
                  new_value: {
                    reminderType: "SUPPORTING_DEPT_REMINDER",
                    departmentId: gd.department_id.toString(),
                    departmentName: gd.departments.department_name,
                    recipientUserId: recipient.userId.toString(),
                    recipientRole: recipient.role,
                    grievanceNumber: g.grievance_number,
                    actionDeadline: actionDeadline.toISOString(),
                    hoursRemaining: roundedHours,
                    channel: "IN_APP",
                    note: `Pre-expiry reminder generated for supporting department ${gd.departments.department_name}.`,
                  },
                },
              });
            };

            if (options?.tx) {
              await sendMutation(options.tx);
            } else {
              await prisma.$transaction(sendMutation);
            }

            summary.totalRemindersSent++;
            summary.supportingDeptReminders++;
            if (
              !summary.remindedGrievanceIds.includes(g.grievance_id.toString())
            ) {
              summary.remindedGrievanceIds.push(g.grievance_id.toString());
            }
          }
        } catch (deptErr) {
          console.error(
            `Failed to process supporting dept reminder for grievance ${g.grievance_id}, dept ${gd.department_id}:`,
            deptErr,
          );
          if (!summary.errors) summary.errors = [];
          summary.errors.push({
            grievanceId: g.grievance_id.toString(),
            error: deptErr instanceof Error ? deptErr.message : String(deptErr),
          });
        }
      }
    }
  } catch (err) {
    console.error("Error querying supporting dept reminder candidates:", err);
  }

  // ---------------------------------------------------------
  // 4. INVESTIGATION_REMINDER (Investigation Activities)
  // ---------------------------------------------------------
  try {
    const invCandidates = await client.grievances.findMany({
      where: {
        status: { in: ["IN_PROGRESS", "ASSIGNED", "UNDER_INVESTIGATION"] },
        closed_at: null,
      },
      include: {
        grievance_departments: {
          where: {
            involvement_type: "PRIMARY",
            status: { notIn: ["COMPLETED", "REMOVED"] },
          },
        },
        assignments: {
          where: { assignment_status: "ASSIGNED" },
        },
      },
    });

    for (const g of invCandidates) {
      summary.totalEvaluated++;
      try {
        const primaryDept = g.grievance_departments?.[0];
        // Mandatory check: primary department's due_at must represent the applicable investigation deadline.
        // If missing or unassigned, skip the reminder without falling back to overall SLA.
        if (!primaryDept?.due_at) {
          continue;
        }

        const activeAssignment = g.assignments?.[0];
        if (!activeAssignment?.staff_id) {
          continue;
        }

        const actionStartTime =
          activeAssignment.assigned_at ||
          primaryDept.activated_at ||
          g.created_at;
        const actionDeadline = primaryDept.due_at;
        const reminderHours = getPolicyReminderHours(
          g,
          activePolicies,
          defaultHours,
        );
        const reminderWindowMs = reminderHours * 60 * 60 * 1000;
        const reminderStartTime = new Date(
          actionDeadline.getTime() - reminderWindowMs,
        );

        if (now < reminderStartTime || now >= actionDeadline) {
          continue;
        }

        // Action-specific idempotency check
        const existing = await client.notifications.findFirst({
          where: {
            user_id: activeAssignment.staff_id,
            grievance_id: g.grievance_id,
            notification_type: "INVESTIGATION_REMINDER",
            created_at: { gte: actionStartTime },
          },
        });
        if (existing) continue;

        const hoursRemaining = Math.max(
          0,
          (actionDeadline.getTime() - now.getTime()) / (60 * 60 * 1000),
        );
        const roundedHours = Math.round(hoursRemaining * 10) / 10;

        const sendMutation = async (txClient: Prisma.TransactionClient) => {
          await txClient.notifications.create({
            data: {
              user_id: activeAssignment.staff_id,
              grievance_id: g.grievance_id,
              notification_type: "INVESTIGATION_REMINDER",
              channel: "IN_APP",
              title: `SLA Reminder: Investigation Due Soon (${g.grievance_number})`,
              message: `Investigation activities for Grievance ${g.grievance_number} are due within ${roundedHours} hours (deadline: ${actionDeadline.toISOString()}). Please finalize findings before the departmental deadline.`,
              status: "PENDING",
            },
          });

          await txClient.audit_logs.create({
            data: {
              grievance_id: g.grievance_id,
              user_id: null,
              action: "ACTION_REMINDER_GENERATED",
              entity_type: "GRIEVANCE",
              entity_id: g.grievance_id,
              new_value: {
                reminderType: "INVESTIGATION_REMINDER",
                recipientUserId: activeAssignment.staff_id.toString(),
                recipientRole: "STAFF",
                grievanceNumber: g.grievance_number,
                actionDeadline: actionDeadline.toISOString(),
                hoursRemaining: roundedHours,
                channel: "IN_APP",
                note: "Pre-expiry reminder generated for pending investigation activities.",
              },
            },
          });
        };

        if (options?.tx) {
          await sendMutation(options.tx);
        } else {
          await prisma.$transaction(sendMutation);
        }

        summary.totalRemindersSent++;
        summary.investigationReminders++;
        if (!summary.remindedGrievanceIds.includes(g.grievance_id.toString())) {
          summary.remindedGrievanceIds.push(g.grievance_id.toString());
        }
      } catch (invErr) {
        console.error(
          `Failed to process investigation reminder for grievance ${g.grievance_id}:`,
          invErr,
        );
        if (!summary.errors) summary.errors = [];
        summary.errors.push({
          grievanceId: g.grievance_id.toString(),
          error: invErr instanceof Error ? invErr.message : String(invErr),
        });
      }
    }
  } catch (err) {
    console.error("Error querying investigation reminder candidates:", err);
  }

  return summary;
}
