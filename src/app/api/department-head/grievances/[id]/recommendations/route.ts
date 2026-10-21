import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { calculateStaffRecommendations } from "@/lib/engines/staff-recommendation-engine";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { departmentId, isAdmin } = auth;
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);
    let targetDeptId = departmentId;

    if (isAdmin) {
      const { searchParams } = new URL(request.url);
      const queryDept = searchParams.get("deptId");

      if (queryDept) {
        try {
          targetDeptId = BigInt(queryDept);
        } catch {
          // ignore invalid query param
        }
      } else {
        // Resolve primary or first active department for this grievance
        const grievanceDept = await prisma.grievance_departments.findFirst({
          where: {
            grievance_id: grievanceId,
            status: { not: "REMOVED" },
          },
          orderBy: [
            { involvement_type: "asc" }, // PRIMARY sorts before SUPPORTING
            { execution_order: "asc" },
          ],
          select: { department_id: true },
        });

        if (grievanceDept) {
          targetDeptId = grievanceDept.department_id;
        }
      }
    }

    const result = await calculateStaffRecommendations(
      grievanceId,
      targetDeptId,
    );

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      },
    );
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
