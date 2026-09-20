import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.users.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    /*
     * Don't reveal whether the email exists.
     */
    if (!user) {
      console.log(
        `\n⚠️  [Forgot Password] No account found with email: "${normalizedEmail}"\n`,
      );
      return NextResponse.json({
        success: true,
        message:
          "If an account exists for this email, a password reset link has been sent.",
      });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the hash of the token
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token valid for 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Remove previous unused tokens for this user
    await prisma.password_reset_tokens.deleteMany({
      where: {
        user_id: user.user_id,
        used_at: null,
      },
    });

    // Store the new token
    await prisma.password_reset_tokens.create({
      data: {
        user_id: user.user_id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    console.log("\n==========================================");
    console.log("🔑 PASSWORD RESET LINK GENERATED:");
    console.log(resetUrl);
    console.log("Token:", resetToken);
    console.log("==========================================\n");

    return NextResponse.json({
      success: true,
      message:
        "If an account exists for this email, a password reset link has been sent.",

      // DEVELOPMENT ONLY
      resetUrl,
      resetToken,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process password reset request",
      },
      { status: 500 },
    );
  }
}
