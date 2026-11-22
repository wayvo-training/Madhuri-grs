import { type NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import {
  generatePatternDetectionReport,
  getPatternFilterOptions,
} from "@/lib/reports/pattern-detection";
import type { PatternFilters } from "@/types/reports";

export async function GET(request: NextRequest) {
  try {
    // 1. Authorize API with VIEW_REPORTS permission and required roles
    const auth = await authorizeApi({
      permission: "VIEW_REPORTS",
      role: ["ADMIN", "DEPARTMENT_HEAD"],
    });

    if ("error" in auth) {
      return auth.error;
    }

    const { user } = auth;

    // 2. Parse Query Parameters
    const searchParams = request.nextUrl.searchParams;

    const filters: PatternFilters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      priority: searchParams.get("priority") || undefined,
    };

    // 3. Generate Report Data and Filter Options in Parallel
    const [reportData, filterOptions] = await Promise.all([
      generatePatternDetectionReport(filters, user),
      getPatternFilterOptions(user),
    ]);

    return NextResponse.json({
      success: true,
      data: reportData,
      filterOptions,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to generate pattern detection report";

    const isClientError =
      errorMessage.includes("Forbidden") ||
      errorMessage.includes("not authorized") ||
      errorMessage.includes("no assigned department");

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: isClientError ? 403 : 500 },
    );
  }
}
