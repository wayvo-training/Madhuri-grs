import { DEFAULT_SLA_THRESHOLDS } from "@/lib/constants/sla";
import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "ASSIGNMENT"
  | "REASSIGNMENT"
  | "HEAD_INTERNAL_NOTE"
  | "SUPPORTING_STAFF_ADDED"
  | "SLA_HALF_TIME"
  | "SLA_AT_RISK"
  | "SLA_URGENT"
  | "SLA_BREACHED"
  | "SLA_ESCALATED"
  | "GRIEVANCE_ESCALATED"
  | "GRIEVANCE_SUBMITTED"
  | "NEW_ASSIGNMENT"
  | "ROUTING_EXCEPTION"
  | "GRIEVANCE_REOPENED"
  | "REOPEN_REQUESTED"
  | "REWORK_REQUESTED"
  | "RESOLUTION_SUBMITTED"
  | "RESOLUTION_ACCEPTED"
  | "REWORK_REQUIRED"
  | "ADDITIONAL_INFO_REQUESTED"
  | "ADDITIONAL_INFO_SUBMITTED"
  | "KNOWLEDGE_ARTICLE_SUBMITTED"
  | "KNOWLEDGE_ARTICLE_PUBLISHED"
  | "KNOWLEDGE_ARTICLE_REJECTED"
  | "HOD_DIRECTIVE_REMINDER"
  | "HOD_RESOLUTION_AUTHORITY_ASSUMED"
  | "SLA_EXTENDED"
  // Legacy support
  | "SLA_WARNING"
  | "SLA_BREACH"
  | "SLA_75_HOD_WARNING"
  | "SLA_75_STAFF_WARNING"
  | "SLA_90_STAFF_WARNING"
  | "SLA_100_BREACH_STAFF"
  | "SLA_100_BREACH_ESCALATED"
  | "SLA_ESCALATION"
  | "SLA_REMINDER"
  | "SYSTEM";

interface SendNotificationParams {
  userId: bigint;
  grievanceId?: bigint;
  type: NotificationType;
  channel?: "IN_APP" | "EMAIL" | "SMS";
  title: string;
  message: string;
}

// biome-ignore lint/complexity/noStaticOnlyClass: utility class
export class NotificationService {
  /**
   * Sends a notification to a specific user.
   * Duplicate prevention: if an unread/pending notification of the exact same type and grievance exists, it will not insert a duplicate.
   */
  static async send(params: SendNotificationParams) {
    // Deduplicate repetitive SLA alerts while unread/pending
    const isSlaType =
      params.type.startsWith("SLA_") || params.type.startsWith("DEPT_SLA_");
    if (params.grievanceId && isSlaType) {
      const existing = await prisma.notifications.findFirst({
        where: {
          user_id: params.userId,
          grievance_id: params.grievanceId,
          notification_type: params.type,
          status: "PENDING",
        },
      });
      if (existing) return existing; // Skip duplicate SLA alert
    }

    return prisma.notifications.create({
      data: {
        user_id: params.userId,
        grievance_id: params.grievanceId,
        notification_type: params.type,
        channel: params.channel || "IN_APP",
        title: params.title,
        message: params.message,
        status: "PENDING",
      },
    });
  }

  /**
   * Automatically triggers SLA notifications based on elapsed percentage.
   */
  static async handleSlaThreshold(
    grievanceId: bigint,
    slaPercentage: number,
    staffId: bigint,
    departmentHeadId: bigint,
    thresholds: {
      warning?: number;
      atRisk?: number;
      breach?: number;
    } = {},
  ) {
    const warning =
      thresholds.warning ?? DEFAULT_SLA_THRESHOLDS.WARNING_PERCENT;
    const atRisk = thresholds.atRisk ?? DEFAULT_SLA_THRESHOLDS.AT_RISK_PERCENT;
    const breach = thresholds.breach ?? DEFAULT_SLA_THRESHOLDS.BREACH_PERCENT;

    if (slaPercentage >= warning && slaPercentage < atRisk) {
      await NotificationService.send({
        userId: staffId,
        grievanceId,
        type: "SLA_HALF_TIME",
        title: `SLA Warning: ${warning}% Department SLA Consumed`,
        message: `Grievance #${grievanceId} has consumed ${warning}% of its allocated SLA. Please review the grievance progress and ensure timely completion within the remaining SLA duration.`,
      });
    } else if (slaPercentage >= atRisk && slaPercentage < breach) {
      // 75% Escalation: Notify Assigned Staff and Responsible Department Head
      await NotificationService.send({
        userId: staffId,
        grievanceId,
        type: "SLA_AT_RISK",
        title: `SLA Escalated: ${atRisk}% Department SLA Consumed`,
        message: `Grievance #${grievanceId} has reached ${atRisk}% of its allocated SLA. The grievance requires immediate attention. Please review the current progress and take necessary action to prevent an SLA breach.`,
      });
      if (departmentHeadId !== staffId) {
        await NotificationService.send({
          userId: departmentHeadId,
          grievanceId,
          type: "SLA_AT_RISK",
          title: `SLA Escalated: ${atRisk}% Department SLA Consumed`,
          message: `Grievance #${grievanceId} has reached ${atRisk}% of its allocated SLA. The grievance requires immediate attention. Please review the current progress and take necessary action to prevent an SLA breach.`,
        });
      }
    } else if (slaPercentage >= breach) {
      // 100% Breach: Notify Admin, Responsible Department Head, and Assigned Staff
      await NotificationService.send({
        userId: departmentHeadId,
        grievanceId,
        type: "SLA_BREACHED",
        title: "SLA Breached: 100% Department SLA Consumed",
        message: `Grievance #${grievanceId} has reached 100% or more of its allocated SLA limit. The department SLA has been breached. Immediate intervention is required to address the delay and expedite grievance resolution.`,
      });

      if (staffId && staffId !== departmentHeadId) {
        await NotificationService.send({
          userId: staffId,
          grievanceId,
          type: "SLA_BREACHED",
          title: "SLA Breached: 100% Department SLA Consumed",
          message: `Grievance #${grievanceId} has reached 100% or more of its allocated SLA limit. The department SLA has been breached. Immediate intervention is required to address the delay and expedite grievance resolution.`,
        });
      }

      // Default breach governance: notify all active system administrators
      const admins = await prisma.users.findMany({
        where: { roles: { role_name: "ADMIN" }, status: "ACTIVE" },
        select: { user_id: true },
      });
      for (const a of admins) {
        if (a.user_id !== departmentHeadId && a.user_id !== staffId) {
          await NotificationService.send({
            userId: a.user_id,
            grievanceId,
            type: "SLA_BREACHED",
            title: "SLA Breached: 100% Department SLA Consumed",
            message: `Grievance #${grievanceId} has reached 100% or more of its allocated SLA limit. The department SLA has been breached. Immediate intervention is required to address the delay and expedite grievance resolution.`,
          });
        }
      }
    }
  }

  /**
   * Helper for internal note notification
   */
  static async notifyInternalNote(grievanceId: bigint, staffId: bigint) {
    await NotificationService.send({
      userId: staffId,
      grievanceId,
      type: "HEAD_INTERNAL_NOTE",
      title: "New Internal Note",
      message: `Your Department Head added an internal note to grievance #${grievanceId}.`,
    });
  }

  /**
   * Helper for reassignment
   */
  static async notifyReassignment(grievanceId: bigint, newStaffId: bigint) {
    await NotificationService.send({
      userId: newStaffId,
      grievanceId,
      type: "REASSIGNMENT",
      title: "Case Reassigned",
      message: `You have been newly assigned to Grievance #${grievanceId}.`,
    });
  }
}
