import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getClientRequestMeta, logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { ip, userAgent } = await getClientRequestMeta();

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      );
    }

    const user = await prisma.users.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
      include: {
        roles: true,
      },
    });

    if (!user) {
      await logger.logSession({
        action: "LOGIN_FAILED",
        emailAttempted: email,
        reason: "User email not found",
        ip,
        userAgent,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      );
    }

    if (user.status !== "ACTIVE") {
      await logger.logSession({
        action: "LOGIN_FAILED",
        user,
        emailAttempted: email,
        reason: "Account is inactive",
        ip,
        userAgent,
      });

      return NextResponse.json(
        {
          success: false,
          message: "User account is inactive",
        },
        { status: 403 },
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      await logger.logSession({
        action: "LOGIN_FAILED",
        user,
        emailAttempted: email,
        reason: "Invalid password",
        ip,
        userAgent,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      );
    }

    // Create a new session
    const sessionToken = randomUUID();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.sessions.create({
      data: {
        session_id: randomUUID(),
        user_id: user.user_id,
        session_token: sessionToken,
        expires_at: expiresAt,
      },
    });

    // Log successful session
    await logger.logSession({
      action: "LOGIN_SUCCESS",
      user,
      ip,
      userAgent,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        user_id: user.user_id.toString(),
        employee_code: user.employee_code,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.roles.role_name,
      },
    });

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
