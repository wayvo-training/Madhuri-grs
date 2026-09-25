import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await prisma.notifications.updateMany({
      where: {
        user_id: user.user_id,
        status: { not: "READ" },
      },
      data: {
        status: "READ",
        read_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, updatedCount: updated.count });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
