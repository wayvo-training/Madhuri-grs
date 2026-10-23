import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { fetchDepartmentHeadStaff } from "@/lib/department-head/loaders";

export async function GET(request: Request) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { departmentId } = auth;

  try {
    const { staff } = await fetchDepartmentHeadStaff(departmentId);

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error("Error in /api/department-head/staff:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch department staff",
      },
      { status: 500 },
    );
  }
}
