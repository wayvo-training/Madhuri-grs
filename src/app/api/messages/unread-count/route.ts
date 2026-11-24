import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const userId = BigInt(user.user_id);

    // Count unread incoming message notifications for this user
    const count = await prisma.notifications.count({
      where: {
        user_id: userId,
        status: { not: "READ" },
        read_at: null,
        notification_type: {
          in: [
            "ADDITIONAL_INFO_REQUESTED",
            "ADDITIONAL_INFO_SUBMITTED",
            "COMMUNICATION_MESSAGE",
          ],
        },
        NOT: {
          OR: [
            { message: { startsWith: "Your message" } },
            { message: { startsWith: "You sent" } },
            { title: { startsWith: "Message Sent" } },
            { title: { startsWith: "Communication Sent" } },
          ],
        },
      },
    });

    return NextResponse.json({ success: true, count });
  } catch (err) {
    console.error("Failed to fetch unread message count:", err);
    return NextResponse.json({ success: true, count: 0 });
  }
}
