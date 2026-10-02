import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStaffAuth } from "@/lib/staff/permissions";

export async function GET() {
  try {
    const authResult = await resolveStaffAuth();
    if ("error" in authResult) return authResult.error;
    const { staffId } = authResult;

    const notifications = await prisma.notifications.findMany({
      where: { user_id: staffId },
      orderBy: { created_at: "desc" },
      take: 40,
    });

    const serialized = notifications.map((n) => ({
      id: String(n.notification_id),
      userId: String(n.user_id),
      grievanceId: n.grievance_id ? String(n.grievance_id) : null,
      type: n.notification_type,
      channel: n.channel,
      title: n.title,
      message: n.message,
      status: n.status,
      createdAt: n.created_at.toISOString(),
      sentAt: n.sent_at?.toISOString() || null,
      readAt: n.read_at?.toISOString() || null,
      isRead: n.status === "READ" || n.read_at !== null,
    }));

    return NextResponse.json({
      success: true,
      notifications: serialized,
    });
  } catch (error) {
    console.error("Staff notifications API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
