import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  evaluateAllActiveGrievancesSla,
  evaluateGrievanceSla,
} from "@/lib/engines/sla-engine";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const cronHeader = request.headers.get("x-cron-secret");

    const isAuthorizedCron =
      Boolean(cronSecret) &&
      (cronHeader === cronSecret || authHeader === `Bearer ${cronSecret}`);

    const roleName = user?.roles?.role_name?.toUpperCase();
    const isAuthorizedUser =
      roleName === "ADMIN" || roleName === "DEPARTMENT_HEAD";

    if (!isAuthorizedCron && !isAuthorizedUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to evaluate SLA" },
        { status: 401 },
      );
    }

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

    let deptId = body.departmentId ? BigInt(body.departmentId) : undefined;
    if (
      !isAuthorizedCron &&
      roleName === "DEPARTMENT_HEAD" &&
      user?.department_id
    ) {
      deptId = BigInt(user.department_id);
    }
    const batchResult = await evaluateAllActiveGrievancesSla(deptId, true);

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
