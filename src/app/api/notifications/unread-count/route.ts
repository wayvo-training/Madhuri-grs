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

    // Prohibited internal notification types for END_USER
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

    const count = await prisma.notifications.count({
      where: {
        user_id: userId,
        status: { not: "READ" },
        read_at: null,
        ...(userRole === "END_USER"
          ? {
              notification_type: { notIn: prohibitedForEndUser },
              OR: [
                { grievance_id: null },
                { grievances: { submitted_by: userId } },
              ],
            }
          : {}),
      },
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Failed to fetch unread notifications count:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
