import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const grievanceId = Number.parseInt(id, 10);
    if (Number.isNaN(grievanceId)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 },
      );
    }

    const userId = BigInt(user.user_id);

    // Mark incoming message notifications for this grievance as READ
    await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        grievance_id: BigInt(grievanceId),
        status: { not: "READ" },
        read_at: null,
        notification_type: {
          in: [
            "ADDITIONAL_INFO_REQUESTED",
            "ADDITIONAL_INFO_SUBMITTED",
            "COMMUNICATION_MESSAGE",
          ],
        },
      },
      data: {
        status: "READ",
        read_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("Failed to mark messages as read:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 },
    );
  }
}
