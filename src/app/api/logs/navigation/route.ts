import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getClientRequestMeta, logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { ip, userAgent } = await getClientRequestMeta();
    const body = await request.json();
    const { fromPath, toPath } = body;

    if (!toPath) {
      return NextResponse.json(
        { success: false, message: "toPath is required" },
        { status: 400 },
      );
    }

    // Record navigation event in background
    await logger.logNavigation({
      fromPath,
      toPath,
      user,
      ip,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch {
    // Silently fail navigation ping to never block user interface
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
