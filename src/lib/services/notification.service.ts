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
  | "GRIEVANCE_REOPENED"
  | "RESOLUTION_SUBMITTED"
  | "RESOLUTION_ACCEPTED"
  | "REWORK_REQUIRED"
  // Legacy support
  | "SLA_WARNING"
  | "SLA_BREACH"
  | "SLA_75_HOD_WARNING"
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
    // Basic deduplication check
    if (params.grievanceId) {
      const existing = await prisma.notifications.findFirst({
        where: {
          user_id: params.userId,
          grievance_id: params.grievanceId,
          notification_type: params.type,
          status: "PENDING",
        },
      });
      if (existing) return existing; // Skip duplicate
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
  ) {
    if (slaPercentage >= 50 && slaPercentage < 75) {
      await NotificationService.send({
        userId: staffId,
        grievanceId,
        type: "SLA_HALF_TIME",
        title: "SLA Reminder: 50%",
        message: `Grievance #${grievanceId} has reached 50% of its target resolution time.`,
      });
    } else if (slaPercentage >= 75 && slaPercentage < 90) {
      await NotificationService.send({
        userId: departmentHeadId,
        grievanceId,
        type: "SLA_AT_RISK",
        title: "SLA At Risk: 75%",
        message: `Grievance #${grievanceId} has reached 75% of its SLA.`,
      });
    } else if (slaPercentage >= 90 && slaPercentage < 100) {
      await NotificationService.send({
        userId: departmentHeadId,
        grievanceId,
        type: "SLA_URGENT",
        title: "SLA Urgent: 90%",
        message: `Grievance #${grievanceId} has reached 90% of its SLA and requires immediate attention.`,
      });
    } else if (slaPercentage >= 100) {
      await NotificationService.send({
        userId: departmentHeadId,
        grievanceId,
        type: "SLA_BREACHED",
        title: "SLA Breached",
        message: `Grievance #${grievanceId} has breached its SLA.`,
      });
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
