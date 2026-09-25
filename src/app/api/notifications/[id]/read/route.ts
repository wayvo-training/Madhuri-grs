import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = BigInt(params.id);

    const updated = await prisma.notifications.update({
      where: { notification_id: notificationId },
      data: {
        status: "READ",
        read_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: updated.notification_id.toString() });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
