import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      user_id: user.user_id.toString(),
      employee_code: user.employee_code,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.roles.role_name,
      permissions: user.permissions,
    },
  });
}
