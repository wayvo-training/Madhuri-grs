import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  evaluateAllActiveGrievancesSla,
  evaluateGrievanceSla,
} from "@/lib/engines/sla-engine";

export async function POST(request: Request) {
  try {
    const _user = await getCurrentUser();
    let body: { grievanceId?: string; departmentId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is acceptable
    }

    if (body.grievanceId) {
      const result = await evaluateGrievanceSla(BigInt(body.grievanceId));
      return NextResponse.json({
        success: true,
        type: "single",
        result,
      });
    }

    const deptId = body.departmentId ? BigInt(body.departmentId) : undefined;
    const batchResult = await evaluateAllActiveGrievancesSla(deptId);

    return NextResponse.json({
      success: true,
      type: "batch",
      totalEvaluated: batchResult.totalEvaluated,
      results: batchResult.results,
    });
  } catch (error) {
    console.error("Failed to evaluate SLA thresholds:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to evaluate SLA",
      },
      { status: 500 },
    );
  }
}
