import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await request.json();
    const { user_id, new_password } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 },
      );
    }

    if (
      !new_password ||
      typeof new_password !== "string" ||
      new_password.length < 6
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be at least 6 characters long.",
        },
        { status: 400 },
      );
    }

    const targetUserId = BigInt(user_id);
    const targetUser = await prisma.users.findUnique({
      where: { user_id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { user_id: targetUserId },
        data: { password_hash: passwordHash },
      });

      // Clear any active sessions for the targeted user so they must log in again
      await tx.sessions.deleteMany({
        where: { user_id: targetUserId },
      });

      // Audit log
      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "ADMIN_RESET_PASSWORD",
          entity_type: "USER",
          entity_id: targetUserId,
          new_value: {
            employee_code: targetUser.employee_code,
            email: targetUser.email,
            reset_by: user.email,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Password for '${targetUser.first_name} ${targetUser.last_name || ""}' (${targetUser.employee_code}) has been reset successfully.`,
    });
  } catch (error) {
    console.error("Failed to reset user password:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error resetting password." },
      { status: 500 },
    );
  }
}
