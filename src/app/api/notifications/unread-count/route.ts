import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const count = await prisma.notifications.count({
      where: {
        user_id: user.user_id,
        status: { not: "READ" },
        read_at: null,
      },
    });

    return NextResponse.json({ success: true, count });
  } catch (err) {
    console.error("Failed to fetch unread notification count:", err);
    return NextResponse.json({ success: true, count: 0 });
  }
}
