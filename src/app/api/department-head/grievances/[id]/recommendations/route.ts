import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { calculateStaffRecommendations } from "@/lib/engines/staff-recommendation-engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { departmentId } = auth;
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);
    const result = await calculateStaffRecommendations(
      grievanceId,
      departmentId,
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in grievance recommendations route:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate staff recommendations",
      },
      { status: 500 },
    );
  }
}
