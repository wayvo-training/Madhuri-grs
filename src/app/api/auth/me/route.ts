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

  const roleName = user.roles?.role_name || "USER";

  let designation = user.roles?.description || "Employee";
  if (roleName === "ADMIN") {
    designation = "System Administrator";
  } else if (roleName === "DEPARTMENT_HEAD") {
    designation = "Department Head";
  } else if (roleName === "STAFF") {
    designation = "Grievance Staff";
  } else if (roleName === "END_USER") {
    designation = "Employee";
  }

  let departmentName = user.departments?.department_name || null;
  if (!departmentName) {
    if (roleName === "ADMIN") {
      departmentName = "Central Administration";
    } else if (roleName === "END_USER") {
      departmentName = "Employee";
    } else if (roleName === "DEPARTMENT_HEAD") {
      departmentName = "Department Queue";
    } else if (roleName === "STAFF") {
      departmentName = "Operations";
    } else {
      departmentName = "General";
    }
  }

  return NextResponse.json({
    success: true,
    user: {
      user_id: user.user_id.toString(),
      employee_code: user.employee_code,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: roleName,
      designation,
      departmentName,
      department_name: departmentName,
      department_id: user.department_id ? user.department_id.toString() : null,
      permissions: user.permissions,
    },
  });
}
