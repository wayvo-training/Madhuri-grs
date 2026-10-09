import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.user_id;
    const userRole = user.roles?.role_name || "END_USER";

    // Internal notification types prohibited for END_USER
    const prohibitedForEndUser = [
      "HEAD_INTERNAL_NOTE",
      "ROUTING_EXCEPTION",
      "KNOWLEDGE_ARTICLE_SUBMITTED",
      "SLA_75_HOD_WARNING",
      "SLA_100_BREACH_ESCALATED",
      "SLA_50_STAFF_WARNING",
      "SLA_75_STAFF_WARNING",
      "SLA_90_STAFF_WARNING",
      "SLA_100_BREACH_STAFF",
    ];

    const whereClause: {
      user_id: bigint;
      notification_type?: { notIn: string[] };
    } = {
      user_id: userId,
    };

    if (userRole === "END_USER") {
      whereClause.notification_type = { notIn: prohibitedForEndUser };
    }

    const notifications = await prisma.notifications.findMany({
      where: whereClause,
      include: {
        grievances: {
          select: {
            grievance_id: true,
            grievance_number: true,
            title: true,
            status: true,
            priority: true,
            sla_status: true,
            submitted_by: true,
            created_at: true,
            due_at: true,
            categories: {
              select: {
                category_name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    const serializedNotifications = notifications
      .filter((n) => {
        // Double security check: END_USER can only see their own grievances
        if (userRole === "END_USER" && n.grievances) {
          return n.grievances.submitted_by === userId;
        }
        return true;
      })
      .map((n) => {
        let title = n.title;
        let message = n.message;

        // Sanitize terminology from "citizen" to "employee"
        title = title
          .replace(/\bcitizen\b/gi, "employee")
          .replace(/\bCitizen\b/g, "Employee");
        message = message
          .replace(/\bcitizen\b/gi, "employee")
          .replace(/\bCitizen\b/g, "Employee")
          .replace(/\bticket\b/gi, "grievance")
          .replace(/\bTicket\b/g, "Grievance");

        // Role-aware SLA message adjustment for END_USER (no internal percentages)
        if (
          userRole === "END_USER" &&
          n.notification_type?.startsWith("SLA_")
        ) {
          if (
            n.notification_type === "SLA_BREACHED" ||
            n.notification_type === "SLA_ESCALATED" ||
            message.includes("breached")
          ) {
            message =
              "Your grievance has been escalated for department-level review and intervention directives.";
          } else if (
            message.includes("50%") ||
            message.includes("75%") ||
            message.includes("90%")
          ) {
            message =
              "Your grievance is progressing and has been prioritized for department investigation.";
          }
        }

        // Determine Action Label & Action URL based on role and grievance
        let actionLabel: string | null = null;
        let actionUrl: string | null = null;

        if (n.grievance_id) {
          actionLabel = "View Grievance →";
          const gId = n.grievance_id.toString();
          switch (userRole) {
            case "ADMIN":
              actionUrl =
                n.notification_type === "ROUTING_EXCEPTION"
                  ? `/admin/grievances?tab=EXCEPTIONS&id=${gId}`
                  : `/admin/grievances?id=${gId}`;
              break;
            case "DEPARTMENT_HEAD":
              actionUrl = `/department-head/dashboard?grievance=${gId}`;
              break;
            case "STAFF":
              actionUrl = `/staff/dashboard?grievance=${gId}`;
              break;
            case "END_USER":
            default:
              actionUrl = `/end-user/grievances/${gId}`;
              break;
          }
        } else if (n.notification_type.startsWith("KNOWLEDGE_ARTICLE")) {
          actionLabel = "Review Article →";
          actionUrl =
            userRole === "DEPARTMENT_HEAD" || userRole === "ADMIN"
              ? "/department-head/dashboard#knowledge"
              : null;
        } else if (n.notification_type === "ROUTING_EXCEPTION") {
          actionLabel = "Review Routing →";
          actionUrl = "/admin/grievances?tab=EXCEPTIONS";
        }

        // Determine semantic category
        const isActionRequired =
          !n.read_at &&
          (n.notification_type.includes("INFO_REQUESTED") ||
            n.notification_type.includes("ACTION_REQUIRED") ||
            n.notification_type === "REWORK_REQUIRED" ||
            n.notification_type === "REOPENED" ||
            n.notification_type === "GRIEVANCE_REOPENED" ||
            n.notification_type === "ROUTING_EXCEPTION" ||
            n.notification_type === "KNOWLEDGE_ARTICLE_SUBMITTED" ||
            (userRole === "STAFF" &&
              (n.notification_type === "ASSIGNMENT" ||
                n.notification_type === "NEW_ASSIGNMENT")) ||
            (userRole === "END_USER" &&
              n.notification_type === "RESOLUTION_SUBMITTED") ||
            (userRole === "DEPARTMENT_HEAD" &&
              (n.notification_type === "SLA_BREACHED" ||
                n.notification_type === "SLA_AT_RISK" ||
                n.notification_type === "RESOLUTION_SUBMITTED")) ||
            title.toLowerCase().includes("action required") ||
            title.toLowerCase().includes("review required") ||
            title.toLowerCase().includes("priority nudge"));

        const isSla =
          n.notification_type.startsWith("SLA_") ||
          n.notification_type === "GRIEVANCE_ESCALATED" ||
          title.toLowerCase().includes("sla") ||
          title.toLowerCase().includes("breach") ||
          title.toLowerCase().includes("escalat");

        const isUpdate = !isActionRequired && !isSla;

        return {
          id: n.notification_id.toString(),
          userId: n.user_id.toString(),
          grievanceId: n.grievance_id?.toString() || null,
          grievanceNumber: n.grievances?.grievance_number || null,
          type: n.notification_type,
          channel: n.channel,
          title,
          message,
          status: n.status,
          createdAt: n.created_at.toISOString(),
          sentAt: n.sent_at?.toISOString() || null,
          readAt: n.read_at?.toISOString() || null,
          isRead: n.status === "READ" || n.read_at !== null,
          actionLabel,
          actionUrl,
          category: isActionRequired
            ? "ACTION_REQUIRED"
            : isSla
              ? "SLA_ESCALATION"
              : "UPDATE",
          grievance: n.grievances
            ? {
                id: n.grievances.grievance_id.toString(),
                number: n.grievances.grievance_number,
                title: n.grievances.title,
                status: n.grievances.status,
                priority: n.grievances.priority,
                slaStatus: n.grievances.sla_status,
                categoryName: n.grievances.categories?.category_name || null,
                createdAt: n.grievances.created_at.toISOString(),
                dueAt: n.grievances.due_at?.toISOString() || null,
              }
            : null,
        };
      });

    return NextResponse.json({
      success: true,
      notifications: serializedNotifications,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
