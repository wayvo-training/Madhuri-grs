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

    const notifications = await prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    const serializedNotifications = notifications.map((n) => ({
      id: n.notification_id.toString(),
      userId: n.user_id.toString(),
      grievanceId: n.grievance_id?.toString() || null,
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
