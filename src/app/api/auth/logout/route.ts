import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getClientRequestMeta, logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { ip, userAgent } = await getClientRequestMeta();

  try {
    const user = await getCurrentUser();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (sessionToken) {
      await prisma.sessions
        .deleteMany({
          where: { session_token: sessionToken },
        })
        .catch(() => {});
    }

    if (user) {
      await logger.logSession({
        action: "LOGOUT",
        user,
        ip,
        userAgent,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
