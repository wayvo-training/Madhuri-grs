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

    if (user.status === "LOCKED") {
      const lockoutWindowMs = 15 * 60 * 1000; // 15 minutes lockout window
      const lockLog = await prisma.audit_logs.findFirst({
        where: {
          user_id: user.user_id,
          action: "ACCOUNT_LOCKED",
        },
        orderBy: { created_at: "desc" },
      });

      const lockTime = lockLog?.created_at
        ? new Date(lockLog.created_at).getTime()
        : new Date(user.updated_at).getTime();
      const elapsed = Date.now() - lockTime;

      if (elapsed < lockoutWindowMs) {
        const remainingMinutes = Math.max(
          1,
          Math.ceil((lockoutWindowMs - elapsed) / 60000),
        );
        return NextResponse.json(
          {
            success: false,
            message: `Account is temporarily locked due to consecutive failed login attempts. Please try again in ${remainingMinutes} minute(s) or reset your password.`,
          },
          { status: 423 },
        );
      }

      // Auto-unlock account after 15 minutes
      await prisma.users.update({
        where: { user_id: user.user_id },
        data: { status: "ACTIVE" },
      });
      user.status = "ACTIVE";

      await prisma.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "ACCOUNT_UNLOCKED",
          entity_type: "USER",
          entity_id: user.user_id,
          ip_address: ip,
          new_value: {
            reason: "15-minute temporary lockout window elapsed",
            timestamp: new Date().toISOString(),
          },
        },
      });
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

      // Track consecutive failed attempts within 15-minute window
      const windowStart = new Date(Date.now() - 15 * 60 * 1000);
      const lastSuccess = await prisma.audit_logs.findFirst({
        where: {
          user_id: user.user_id,
          action: "LOGIN_SUCCESS",
          created_at: { gte: windowStart },
        },
        orderBy: { created_at: "desc" },
      });

      const failedCount = await prisma.audit_logs.count({
        where: {
          user_id: user.user_id,
          action: "LOGIN_FAILED",
          created_at: {
            gte: lastSuccess ? lastSuccess.created_at : windowStart,
          },
        },
      });

      const MAX_FAILED_ATTEMPTS = 5;
      if (failedCount >= MAX_FAILED_ATTEMPTS) {
        await prisma.users.update({
          where: { user_id: user.user_id },
          data: { status: "LOCKED" },
        });

        await prisma.audit_logs.create({
          data: {
            user_id: user.user_id,
            action: "ACCOUNT_LOCKED",
            entity_type: "USER",
            entity_id: user.user_id,
            ip_address: ip,
            new_value: {
              reason: `${failedCount} consecutive failed login attempts`,
              lockoutDurationMinutes: 15,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "Account has been temporarily locked due to 5 consecutive failed login attempts. Please try again in 15 minutes or reset your password.",
          },
          { status: 423 },
        );
      }

      const remainingAttempts = MAX_FAILED_ATTEMPTS - failedCount;
      return NextResponse.json(
        {
          success: false,
          message: `Invalid email or password. You have ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining before account lockout.`,
        },
        { status: 401 },
      );
    }

    await logger.logSession({
      action: "LOGIN_SUCCESS",
      user,
      emailAttempted: email,
      ip,
      userAgent,
    });

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

    response.cookies.set("user_role", user.roles.role_name, {
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
