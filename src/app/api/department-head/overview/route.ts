import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { fetchDepartmentHeadOverview } from "@/lib/department-head/loaders";

export async function GET(request: Request) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { departmentId } = auth;

  try {
    const data = await fetchDepartmentHeadOverview(departmentId);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Error in /api/department-head/overview:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch department overview",
      },
      { status: 500 },
    );
  }
}
