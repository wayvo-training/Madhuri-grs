import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationId = BigInt(id);

    // Verify ownership
    const notification = await prisma.notifications.findUnique({
      where: { notification_id: notificationId },
    });

    if (!notification || notification.user_id !== user.user_id) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const updated = await prisma.notifications.update({
      where: { notification_id: notificationId },
      data: {
        status: "READ",
        read_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      id: updated.notification_id.toString(),
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
