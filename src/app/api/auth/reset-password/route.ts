import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Token and password are required",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters",
        },
        { status: 400 },
      );
    }

    // Hash the token received from the reset URL
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the reset token
    const resetToken = await prisma.password_reset_tokens.findUnique({
      where: {
        token_hash: tokenHash,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired reset link",
        },
        { status: 400 },
      );
    }

    // Check if token was already used
    if (resetToken.used_at) {
      return NextResponse.json(
        {
          success: false,
          message: "This reset link has already been used",
        },
        { status: 400 },
      );
    }

    // Check if token has expired
    if (resetToken.expires_at < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "This reset link has expired",
        },
        { status: 400 },
      );
    }

    // Create bcrypt hash for the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.users.update({
        where: {
          user_id: resetToken.user_id,
        },
        data: {
          password_hash: passwordHash,
        },
      }),

      prisma.password_reset_tokens.update({
        where: {
          password_reset_token_id: resetToken.password_reset_token_id,
        },
        data: {
          used_at: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to reset password",
      },
      { status: 500 },
    );
  }
}
