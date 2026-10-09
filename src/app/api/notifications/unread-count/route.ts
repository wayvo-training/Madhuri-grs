import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await prisma.notifications.count({
      where: {
        user_id: user.user_id,
        status: { not: "READ" },
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
